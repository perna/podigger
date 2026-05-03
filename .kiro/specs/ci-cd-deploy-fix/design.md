# CI/CD Deploy Fix — Bugfix Design

## Overview

Dois bugs afetam o pipeline de CI/CD de deploy em produção:

1. **Health check externo com HTTP 403**: O step "Health check" do `deploy-production.yml` executa `curl` para a URL pública do backend a partir dos runners do GitHub Actions. Esses runners não são IPs da Cloudflare, então a requisição chega diretamente ao Nginx da VPS sem passar pelo proxy Cloudflare, resultando em HTTP 403. O deploy falha inteiramente por causa desse falso negativo — a saúde real do serviço já foi verificada internamente via SSH no step "Deploy to production". A correção é adicionar `continue-on-error: true` no step "Health check" do `deploy-production.yml`, alinhando-o com o comportamento já correto do `deploy-staging.yml`.

2. **Warning de deprecação do Node.js 20**: O pipeline exibia avisos de que `actions/checkout@v4` e `webfactory/ssh-agent@v0.9.0` estavam rodando em Node.js 20 (em processo de descontinuação). Após análise dos 4 workflows (`ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `release.yml`), **todos já estão atualizados** para as versões corretas (`actions/checkout@v5`, `webfactory/ssh-agent@v0.10.0`, `actions/setup-python@v6`, `actions/setup-node@v6`). O warning foi gerado por execuções anteriores antes da atualização — não há nenhuma alteração necessária nos arquivos de workflow para este bug.

---

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — quando o step "Health check" externo falha com HTTP 403 por bloqueio Cloudflare/Nginx e não tem `continue-on-error: true`, derrubando o deploy inteiro
- **Property (P)**: O comportamento desejado — o step "Health check" externo não deve interromper o deploy quando retorna 403, pois a verificação real já ocorreu internamente via SSH
- **Preservation**: O comportamento de detecção de falhas reais do serviço (via verificação interna SSH no step "Deploy to production") que deve permanecer inalterado
- **`deploy-production.yml`**: Workflow em `.github/workflows/deploy-production.yml` que orquestra o deploy em produção, incluindo backup, cópia de arquivos, deploy via SSH e health check externo
- **`deploy-staging.yml`**: Workflow em `.github/workflows/deploy-staging.yml` que já possui `continue-on-error: true` no step "Health check" — serve como referência para a correção
- **Step "Deploy to production"**: Step que executa via SSH na VPS e inclui verificação interna de saúde do backend (`curl http://localhost:8000/health/` dentro do container), que é a verificação autoritativa
- **Step "Health check"**: Step externo que executa `curl` para a URL pública a partir do runner do GitHub Actions — sujeito a bloqueio Cloudflare/Nginx
- **Cloudflare Full (Strict)**: Modo de proxy Cloudflare onde acessos diretos ao IP/domínio sem passar pela rede Cloudflare podem ser bloqueados pelo Nginx

---

## Bug Details

### Bug Condition

O bug manifesta quando o step "Health check" do `deploy-production.yml` executa `curl` para `https://api-podigger.perna.app/health/` a partir de um runner do GitHub Actions. O runner não é um IP da Cloudflare, então a requisição chega diretamente ao Nginx da VPS. O Nginx retorna HTTP 403 porque o domínio está configurado para operar sob o proxy Cloudflare (modo Full Strict). O step não tem `continue-on-error: true`, então o exit code não-zero do `curl` (ou o `exit 1` explícito no script) falha o job inteiro, acionando o rollback desnecessariamente.

**Formal Specification:**

```
FUNCTION isBugCondition_HealthCheck(step_config)
  INPUT: step_config do step "Health check" no deploy-production.yml
  OUTPUT: boolean

  RETURN step_config.workflow = "deploy-production.yml"
         AND step_config.continue_on_error = false  // ausente ou false
         AND runner_ip NOT IN cloudflare_ip_ranges
         AND nginx_returns_403_for_direct_access = true
END FUNCTION
```

### Examples

- **Exemplo 1 (bug ativo)**: Runner do GitHub Actions executa `curl https://api-podigger.perna.app/health/`. Nginx retorna 403. O script executa `exit 1`. O step falha. O job falha. O rollback é acionado. O deploy é marcado como falho — mesmo com o backend rodando perfeitamente na VPS.

- **Exemplo 2 (falso negativo)**: Backend está saudável (verificado internamente no step anterior via `curl http://localhost:8000/health/` dentro do container). O health check externo retorna 403 por bloqueio Cloudflare. O deploy é revertido sem necessidade.

- **Exemplo 3 (staging — comportamento correto)**: O mesmo cenário no `deploy-staging.yml` não falha o deploy porque o step tem `continue-on-error: true` e registra apenas um aviso informativo.

- **Caso de borda**: Backend genuinamente crashado após o deploy. Neste caso, o step "Deploy to production" já detecta a falha internamente (loop de 12 tentativas com `curl http://localhost:8000/health/`) e falha o job antes de chegar ao step "Health check" externo. A correção não afeta este cenário.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- O step "Deploy to production" SHALL CONTINUE TO verificar a saúde do backend internamente via SSH (loop de 12 tentativas com `curl http://localhost:8000/health/` dentro do container) e falhar o deploy se o backend não subir
- O rollback automático SHALL CONTINUE TO ser acionado quando o step "Deploy to production" falha (backend genuinamente indisponível)
- O deployment summary SHALL CONTINUE TO ser gerado com links para frontend e backend quando o deploy é bem-sucedido
- O `deploy-staging.yml` SHALL CONTINUE TO funcionar com `continue-on-error: true` no health check externo, sem alterações
- O `ci.yml` e `release.yml` SHALL CONTINUE TO executar sem alterações

**Scope:**
Todos os inputs que NÃO envolvem o step "Health check" externo do `deploy-production.yml` devem ser completamente inalterados por esta correção. Isso inclui:
- Verificação interna de saúde via SSH (step "Deploy to production")
- Lógica de rollback
- Backup de banco de dados
- Cópia de arquivos para a VPS
- Execução de migrations e collectstatic

**Nota:** O comportamento esperado correto (Property 1) está definido na seção Correctness Properties abaixo.

---

## Hypothesized Root Cause

### Bug 1 — Health Check HTTP 403

1. **Ausência de `continue-on-error: true`**: O step "Health check" do `deploy-production.yml` não tem `continue-on-error: true`, ao contrário do `deploy-staging.yml`. Quando o `curl` retorna HTTP 403 e o script executa `exit 1`, o step falha o job inteiro. Esta é a causa direta e confirmada.

2. **Bloqueio Cloudflare/Nginx para IPs não-Cloudflare**: O domínio `api-podigger.perna.app` está configurado com Cloudflare em modo Full (Strict). Requisições que chegam diretamente ao Nginx da VPS sem passar pelo proxy Cloudflare (como as dos runners do GitHub Actions) são bloqueadas com HTTP 403. Esta é a causa raiz do 403.

3. **Verificação redundante**: O step "Deploy to production" já realiza uma verificação interna robusta (12 tentativas, `curl http://localhost:8000/health/` dentro do container via SSH). O health check externo é redundante e sujeito a falsos negativos por fatores externos (Cloudflare, DNS, rede).

### Bug 2 — Node.js 20 Deprecation Warning

4. **Warning de execuções anteriores**: Os 4 workflows (`ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `release.yml`) já foram atualizados para versões que usam Node.js 20+ (`@v5`, `@v0.10.0`, `@v6`). O warning foi gerado por execuções anteriores com versões antigas. **Não há alteração necessária nos arquivos atuais.**

---

## Correctness Properties

Property 1: Bug Condition — Health Check Externo Não Interrompe Deploy

_For any_ execução do step "Health check" do `deploy-production.yml` onde o runner do GitHub Actions não é um IP da Cloudflare e o Nginx retorna HTTP 403, o step corrigido SHALL registrar um aviso informativo e continuar o deploy sem falhar o job, pois a verificação real de saúde já foi realizada internamente no step "Deploy to production".

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Detecção de Falhas Reais Permanece Inalterada

_For any_ cenário onde o backend está genuinamente indisponível após o deploy (container crashou, porta não responde), o step "Deploy to production" SHALL CONTINUE TO detectar a falha internamente via SSH e acionar o rollback automático, independentemente da presença de `continue-on-error: true` no step "Health check" externo.

**Validates: Requirements 3.1, 3.2**

---

## Fix Implementation

### Bug 1 — Health Check HTTP 403

**File**: `.github/workflows/deploy-production.yml`

**Step**: `Health check`

**Specific Changes**:

1. **Adicionar `continue-on-error: true`**: Inserir a propriedade `continue-on-error: true` no step "Health check", alinhando-o com o comportamento do `deploy-staging.yml`.

2. **Atualizar mensagens de log**: Substituir o `exit 1` por mensagens informativas que expliquem o motivo do 403 (bloqueio Cloudflare/Nginx para IPs externos), sem interromper o deploy.

3. **Manter a lógica de retry**: Preservar as 3 tentativas de retry para backend e frontend, mas sem falhar o job ao final.

**Diff conceitual:**

```yaml
# ANTES
- name: Health check
  run: |
    sleep 20
    for i in 1 2 3; do
      BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api-podigger.perna.app/health/ || echo "000")
      if [ "$BACKEND_STATUS" = "200" ]; then
        echo "✅ Backend is healthy"
        break
      fi
      if [ $i -eq 3 ]; then
        echo "❌ Backend health check failed after 3 attempts (HTTP $BACKEND_STATUS)"
        exit 1  # ← CAUSA DO BUG
      fi
      sleep 10
    done
    # ... (frontend check similar)

# DEPOIS
- name: Health check
  continue-on-error: true  # ← CORREÇÃO PRINCIPAL
  run: |
    echo "Waiting for services to settle..."
    sleep 20

    echo "🔍 Checking backend health..."
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api-podigger.perna.app/health/ || echo "000")
    BACKEND_STATUS=${BACKEND_STATUS:0:3}

    if [ "$BACKEND_STATUS" != "200" ]; then
      echo "⚠️ Backend public health check returned HTTP $BACKEND_STATUS"
      echo "This is often a false positive due to Cloudflare blocking direct access from GitHub Actions runners."
      echo "Internal health check (via SSH) already confirmed the backend is healthy."
    else
      echo "✅ Backend is publicly healthy (HTTP 200)"
    fi

    echo "🔍 Checking frontend health..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://podigger.perna.app/ || echo "000")
    FRONTEND_STATUS=${FRONTEND_STATUS:0:3}

    if [ "$FRONTEND_STATUS" != "200" ]; then
      echo "⚠️ Frontend public health check returned HTTP $FRONTEND_STATUS"
      echo "This is often a false positive due to Cloudflare blocking direct access from GitHub Actions runners."
    else
      echo "✅ Frontend is publicly healthy (HTTP 200)"
    fi
```

### Bug 2 — Node.js 20 Deprecation Warning

**Nenhuma alteração necessária.** Todos os workflows já usam as versões corretas:

| Workflow | `actions/checkout` | `webfactory/ssh-agent` | `actions/setup-python` | `actions/setup-node` |
|---|---|---|---|---|
| `ci.yml` | `@v5` ✅ | — | `@v6` ✅ | `@v6` ✅ |
| `deploy-staging.yml` | `@v5` ✅ | `@v0.10.0` ✅ | — | — |
| `deploy-production.yml` | `@v5` ✅ | `@v0.10.0` ✅ | — | — |
| `release.yml` | `@v5` ✅ | — | `@v6` ✅ | — |

O warning foi gerado por execuções anteriores com versões antigas. Novas execuções não exibirão o warning.

---

## Testing Strategy

### Validation Approach

A estratégia de testes segue duas fases: primeiro, confirmar o bug no código não corrigido (exploratory); depois, verificar que a correção funciona e que o comportamento existente foi preservado.

### Exploratory Bug Condition Checking

**Goal**: Confirmar que o step "Health check" do `deploy-production.yml` falha o job quando recebe HTTP 403, e que o `deploy-staging.yml` não falha nas mesmas condições.

**Test Plan**: Inspecionar os arquivos de workflow e comparar a presença/ausência de `continue-on-error: true`. Verificar os logs de execuções anteriores do GitHub Actions que mostram `❌ Backend health check failed after 3 attempts (HTTP 403)`.

**Test Cases**:

1. **Comparação de configuração (deploy-production vs deploy-staging)**: Verificar que `deploy-staging.yml` tem `continue-on-error: true` no step "Health check" e `deploy-production.yml` não tem — confirma a assimetria que causa o bug (confirmado na análise dos arquivos)

2. **Análise do script de health check (production)**: Verificar que o script executa `exit 1` quando `$BACKEND_STATUS != "200"` após 3 tentativas — confirma que HTTP 403 causa falha do step (confirmado na análise do arquivo)

3. **Verificação de workflows para Node.js 20**: Inspecionar todos os 4 workflows para versões de actions — confirma que todos já estão atualizados (confirmado: nenhuma alteração necessária)

**Expected Counterexamples**:
- `deploy-production.yml` step "Health check": ausência de `continue-on-error: true` + `exit 1` no script = job falha com HTTP 403
- `deploy-staging.yml` step "Health check": presença de `continue-on-error: true` = job continua mesmo com HTTP 403

### Fix Checking

**Goal**: Verificar que após a correção, o step "Health check" do `deploy-production.yml` não falha o job quando recebe HTTP 403.

**Pseudocode:**

```
FOR ALL step_config WHERE isBugCondition_HealthCheck(step_config) DO
  result ← execute_health_check_step(step_config_fixed)
  ASSERT result.job_continues = true
         AND result.log CONTAINS "⚠️" OR "✅"
         AND result.exit_code_of_job != 1  // job não falha por causa do health check
END FOR
```

### Preservation Checking

**Goal**: Verificar que a correção não afeta a detecção de falhas reais do backend.

**Pseudocode:**

```
FOR ALL deploy_scenario WHERE NOT isBugCondition_HealthCheck(deploy_scenario) DO
  // Cenário: backend genuinamente indisponível
  result_original ← execute_deploy_to_production_step(deploy_scenario)
  result_fixed    ← execute_deploy_to_production_step(deploy_scenario)
  ASSERT result_original.rollback_triggered = result_fixed.rollback_triggered
         // O step "Deploy to production" (SSH interno) ainda detecta a falha
END FOR
```

**Testing Approach**: A verificação de preservação é feita por inspeção estática do workflow, pois:
- O step "Deploy to production" (SSH interno) não é alterado pela correção
- O rollback é acionado por `if: failure()` no step "Rollback on failure", que depende do step "Deploy to production" falhar — não do step "Health check" (que agora tem `continue-on-error: true`)
- A lógica de detecção de falhas reais está encapsulada no SSH interno e permanece inalterada

**Test Cases**:

1. **Preservação do rollback**: Verificar que `continue-on-error: true` no step "Health check" não impede o acionamento do rollback quando o step "Deploy to production" falha — o `if: failure()` do step "Rollback on failure" ainda é acionado por falhas nos steps anteriores

2. **Preservação do deployment summary**: Verificar que o step "Deployment summary" (`if: success()`) ainda é executado corretamente após a correção

3. **Preservação do comportamento de staging**: Verificar que `deploy-staging.yml` não é alterado

### Unit Tests

- Inspecionar `deploy-production.yml` após a correção e verificar que o step "Health check" contém `continue-on-error: true`
- Inspecionar `deploy-production.yml` e verificar que o script do step "Health check" não contém `exit 1` (substituído por mensagens informativas)
- Inspecionar todos os 4 workflows e verificar que nenhum usa `actions/checkout` < `@v5` ou `webfactory/ssh-agent` < `@v0.10.0`

### Property-Based Tests

- Para qualquer valor de `BACKEND_STATUS` (200, 403, 000, 500, etc.), o step "Health check" corrigido SHALL registrar uma mensagem e continuar sem falhar o job
- Para qualquer valor de `FRONTEND_STATUS`, o comportamento é análogo ao backend
- Para qualquer workflow no repositório, nenhuma action SHALL usar versão que rode em Node.js 20 depreciado

### Integration Tests

- Executar o workflow `deploy-production.yml` em ambiente de staging/teste e verificar que o step "Health check" registra aviso informativo (não falha) quando a URL pública retorna 403
- Verificar nos logs do GitHub Actions que o warning de Node.js 20 não aparece mais em novas execuções após as atualizações de versão já realizadas
- Verificar que o deployment summary é gerado corretamente após um deploy bem-sucedido com a correção aplicada
