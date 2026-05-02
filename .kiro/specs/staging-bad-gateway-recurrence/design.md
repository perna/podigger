# Staging Bad Gateway Recurrence — Bugfix Design

## Overview

O bug causa HTTP 502 Bad Gateway após deploys de staging bem-sucedidos (pipeline verde). A causa raiz está em dois vetores ativos no workflow `.github/workflows/deploy-staging.yml`:

- **Vetor A**: O uso de `--remove-orphans` nos comandos `docker compose down` derruba o container `podigger-nginx-proxy` como "órfão", pois ele está conectado à rede `podigger-proxy` (declarada como externa no `docker-compose.staging.yml`) mas não é gerenciado por esse compose file.
- **Vetor B**: O `nginx-proxy/docker-compose.yml` declara `podigger-production-static` e `podigger-production-media` como volumes externos. Se esses volumes não existem na VPS (ambiente de staging sem deploy de produção), o `docker compose up -d` no diretório do nginx-proxy falha silenciosamente, deixando o nginx-proxy fora do ar.

A correção é cirúrgica: remover `--remove-orphans` de todos os `docker compose down/up` do contexto de staging, criar os volumes de produção antes de subir o nginx-proxy, e substituir o silenciamento de erros do nginx-proxy por uma verificação real de saúde. As mesmas correções se aplicam ao step de rollback.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — deploy de staging com `--remove-orphans` ativo ou volumes de produção ausentes na VPS, quando o nginx-proxy estava rodando antes do deploy
- **Property (P)**: O comportamento correto esperado — após o deploy, o nginx-proxy deve estar rodando, conectado à rede `podigger-proxy`, e roteando tráfego para os containers de staging sem retornar 502
- **Preservation**: O comportamento existente que não deve ser alterado — subida dos containers de staging, health check interno do backend, rollback automático, deploy via `workflow_dispatch`
- **`--remove-orphans`**: Flag do Docker Compose que remove containers conectados à mesma rede mas não declarados no compose file atual — o vetor A do bug
- **`podigger-proxy`**: Rede Docker externa compartilhada entre o nginx-proxy e os containers de staging/produção
- **`podigger-nginx-proxy`**: Container do nginx reverso global que roteia tráfego para staging e produção
- **Volumes externos de produção**: `podigger-production-static` e `podigger-production-media` — declarados como `external: true` no `nginx-proxy/docker-compose.yml`, devem existir antes do `docker compose up -d` do nginx-proxy

## Bug Details

### Bug Condition

O bug se manifesta quando o workflow de deploy de staging executa `docker compose down --remove-orphans` no contexto do `docker-compose.staging.yml`. Como o `podigger-nginx-proxy` está conectado à rede `podigger-proxy` (que é `external: true` no compose de staging), o Docker Compose o identifica como "órfão" e o remove. Adicionalmente, quando o workflow tenta reiniciar o nginx-proxy, o `docker compose up -d` falha se os volumes `podigger-production-static` e `podigger-production-media` não existem na VPS — e esse erro é silenciado por `|| echo "⚠️ ..."`.

**Formal Specification:**

```pascal
FUNCTION isBugCondition(deployState)
  INPUT: deployState com campos:
    - nginxProxyRunningBeforeDeploy: boolean
    - productionVolumesExistOnVPS: boolean
    - removeOrphansUsed: boolean
  OUTPUT: boolean

  RETURN (deployState.nginxProxyRunningBeforeDeploy = true)
     AND (
           (deployState.removeOrphansUsed = true)
        OR (deployState.productionVolumesExistOnVPS = false)
     )
END FUNCTION
```

### Examples

- **Vetor A ativo**: nginx-proxy está rodando → deploy executa `docker compose -f docker-compose.staging.yml down --remove-orphans` → Docker Compose remove `podigger-nginx-proxy` como órfão → nginx-proxy fica fora do ar → 502 em `staging-podigger.perna.app` e `staging-api-podigger.perna.app`
- **Vetor B ativo**: nginx-proxy foi derrubado → workflow tenta `docker compose up -d` em `/opt/podigger-nginx-proxy` → Docker falha com `volume podigger-production-static declared as external, but could not be found` → erro silenciado por `|| echo "⚠️ ..."` → pipeline reporta sucesso → nginx-proxy permanece fora do ar → 502
- **Ambos os vetores**: nginx-proxy derrubado pelo `--remove-orphans` E volumes de produção ausentes → nginx-proxy não consegue reiniciar → 502 persistente mesmo após múltiplos redeploys
- **Caso sem bug (Preservation)**: VPS com volumes de produção existentes e sem `--remove-orphans` → nginx-proxy não é afetado → deploy conclui sem 502

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Todos os containers de staging (`backend-staging`, `frontend-staging`, `db-staging`, `redis-staging`, `celery-staging`, `celery-beat-staging`) devem continuar subindo com sucesso
- O health check interno do backend (`curl http://localhost:8000/health/`) deve continuar sendo aguardado antes de prosseguir
- O rollback automático deve continuar sendo executado em caso de falha
- O deploy via `workflow_dispatch` com parâmetro `branch` deve continuar funcionando
- A criação do `.env` com `DB_PASSWORD_STAGING` antes do `docker compose up` deve ser preservada (correção do spec `staging-502-fix`)
- O nginx-proxy já rodando deve ser preservado durante todo o deploy sem interrupção para outros ambientes (produção)

**Scope:**
Todos os inputs que NÃO envolvem `--remove-orphans` ou volumes de produção ausentes devem ser completamente não afetados por esta correção. Isso inclui:
- Deploys em VPS com volumes de produção já existentes
- Operações de `docker compose up/down` sem a flag `--remove-orphans`
- Qualquer interação com os containers de staging que não afete o nginx-proxy

## Hypothesized Root Cause

Com base na análise do workflow e dos arquivos Docker Compose:

1. **`--remove-orphans` em contexto de rede compartilhada (Vetor A — CONFIRMADO)**:
   - O `docker-compose.staging.yml` declara `podigger-proxy` como rede externa
   - O `podigger-nginx-proxy` está conectado a essa rede mas não é declarado no compose de staging
   - O Docker Compose com `--remove-orphans` remove containers que estão na mesma rede mas não pertencem ao projeto atual
   - O workflow usa `--remove-orphans` em 4 lugares: dois `down`, um `up -d` para db/redis, e o `up -d` final

2. **Volumes externos de produção ausentes (Vetor B — CONFIRMADO)**:
   - O `nginx-proxy/docker-compose.yml` declara `podigger-production-static` e `podigger-production-media` como `external: true`
   - Em ambiente de staging sem deploy de produção, esses volumes não existem
   - O `docker compose up -d` falha com erro de volume não encontrado
   - O erro é silenciado por `|| echo "⚠️ ..."`, deixando o nginx-proxy fora do ar sem interromper o pipeline

3. **Ausência de verificação real do nginx-proxy**:
   - O workflow não verifica se o `podigger-nginx-proxy` está efetivamente rodando após o `docker compose up -d`
   - O silenciamento do erro (`|| echo "⚠️ ..."`) mascara a falha, e o pipeline reporta sucesso mesmo com o nginx-proxy fora do ar

4. **Múltiplas execuções de `--remove-orphans`**:
   - O workflow executa `down --remove-orphans` duas vezes e `up -d --remove-orphans` duas vezes
   - Cada execução é uma oportunidade de remover o nginx-proxy, aumentando a probabilidade do bug

## Correctness Properties

Property 1: Bug Condition — Nginx-proxy permanece ativo após deploy de staging

_For any_ `deployState` where `isBugCondition(deployState)` returns true (nginx-proxy estava rodando, e `--remove-orphans` foi usado OU volumes de produção estão ausentes), the fixed workflow SHALL garantir que o container `podigger-nginx-proxy` esteja rodando e conectado à rede `podigger-proxy` ao final do deploy, de forma que as URLs externas `staging-podigger.perna.app` e `staging-api-podigger.perna.app` não retornem 502.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation — Deploys sem os vetores do bug continuam funcionando

_For any_ `deployState` where `isBugCondition(deployState)` returns false (sem `--remove-orphans` e com volumes de produção existentes), the fixed workflow SHALL produzir o mesmo resultado que o workflow original, preservando o comportamento de subida dos containers de staging, health checks, rollback e deploy manual.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**Arquivo**: `.github/workflows/deploy-staging.yml`

#### Step "Deploy to staging"

**Mudança 1 — Remover `--remove-orphans` de todos os comandos**:

```yaml
# ANTES:
docker compose -f docker-compose.staging.yml down --remove-orphans || true
docker compose -f docker-compose.staging.yml up -d --remove-orphans db-staging redis-staging
docker compose -f docker-compose.staging.yml down --timeout 30 --remove-orphans
docker compose -f docker-compose.staging.yml up -d --remove-orphans

# DEPOIS:
docker compose -f docker-compose.staging.yml down || true
docker compose -f docker-compose.staging.yml up -d db-staging redis-staging
docker compose -f docker-compose.staging.yml down --timeout 30
docker compose -f docker-compose.staging.yml up -d
```

**Mudança 2 — Criar volumes de produção antes de subir o nginx-proxy**:

```yaml
# ANTES (apenas volumes de staging):
docker volume create podigger-staging-static || true
docker volume create podigger-staging-media || true
docker compose up -d || echo "⚠️ Nginx proxy could not start..."

# DEPOIS (staging + produção):
docker volume create podigger-staging-static || true
docker volume create podigger-staging-media || true
docker volume create podigger-production-static || true
docker volume create podigger-production-media || true
docker compose up -d
```

**Mudança 3 — Verificar que o nginx-proxy subiu com sucesso**:

```yaml
# ANTES (erro silenciado):
docker compose up -d || echo "⚠️ Nginx proxy could not start. Are the certs placed at /opt/podigger-nginx-proxy/certs?"

# DEPOIS (verificação real):
docker compose up -d
if ! docker ps --filter name=podigger-nginx-proxy --filter status=running --format '{{.Names}}' | grep -q podigger-nginx-proxy; then
  echo "❌ podigger-nginx-proxy is not running after docker compose up -d"
  docker compose logs --tail=30 nginx-proxy || true
  exit 1
fi
echo "✅ podigger-nginx-proxy is running"
```

#### Step "Rollback on failure"

Aplicar as mesmas três mudanças no bloco de rollback:
- Remover `--remove-orphans` do `docker compose down` e dos `docker compose up -d`
- Criar volumes de produção antes de subir o nginx-proxy
- Verificar que o nginx-proxy subiu com sucesso

### Rationale

- **Remover `--remove-orphans`**: O `docker-compose.staging.yml` já usa `container_name` explícito para todos os containers. O `for` loop que faz `docker stop/rm` antes do `down` já garante limpeza de containers conflitantes. O `--remove-orphans` é redundante e perigoso neste contexto de rede compartilhada.
- **Criar volumes de produção**: É uma operação idempotente (`|| true`). Não causa efeitos colaterais se os volumes já existem. Garante que o nginx-proxy sempre consiga subir independentemente do estado da VPS.
- **Verificação real do nginx-proxy**: Substitui o silenciamento de erro por uma falha explícita. Se o nginx-proxy não subir, o deploy falha imediatamente com mensagem clara, em vez de reportar sucesso com 502.

## Testing Strategy

### Validation Approach

A estratégia segue duas fases: primeiro, confirmar os vetores do bug no código não corrigido; depois, verificar que a correção resolve o bug e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Confirmar os vetores A e B no workflow atual antes de aplicar a correção.

**Test Plan**: Inspecionar o workflow atual e verificar a presença dos padrões problemáticos. Executar o deploy em uma VPS de teste sem volumes de produção para observar a falha silenciosa.

**Test Cases**:
1. **Vetor A — `--remove-orphans` presente**: Verificar que o workflow atual contém `--remove-orphans` nos comandos `docker compose down` e `up -d` (inspeção estática do YAML)
2. **Vetor B — Volumes de produção não criados**: Verificar que o workflow atual não cria `podigger-production-static` e `podigger-production-media` antes do `docker compose up -d` do nginx-proxy (inspeção estática do YAML)
3. **Erro silenciado**: Verificar que o `docker compose up -d` do nginx-proxy usa `|| echo "⚠️ ..."` sem verificação subsequente (inspeção estática do YAML)
4. **Rollback com os mesmos problemas**: Verificar que o step de rollback replica os mesmos padrões problemáticos (inspeção estática do YAML)

**Expected Counterexamples**:
- `grep --remove-orphans .github/workflows/deploy-staging.yml` retorna múltiplas ocorrências
- `grep "podigger-production-static" .github/workflows/deploy-staging.yml` retorna zero ocorrências no bloco de criação de volumes
- `grep '|| echo.*Nginx proxy' .github/workflows/deploy-staging.yml` retorna ocorrências no deploy e no rollback

### Fix Checking

**Goal**: Verificar que para todos os `deployState` onde `isBugCondition` é verdadeiro, o workflow corrigido garante que o nginx-proxy está rodando ao final.

**Pseudocode:**
```pascal
FOR ALL deployState WHERE isBugCondition(deployState) DO
  result := runDeploy_fixed(deployState)
  ASSERT result.nginxProxyRunningAfterDeploy = true
     AND result.nginxProxyConnectedToProxyNetwork = true
     AND result.pipelineFailsIfNginxNotRunning = true
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os `deployState` onde `isBugCondition` é falso, o workflow corrigido produz o mesmo resultado que o original.

**Pseudocode:**
```pascal
FOR ALL deployState WHERE NOT isBugCondition(deployState) DO
  ASSERT runDeploy_original(deployState).stagingContainersHealthy
       = runDeploy_fixed(deployState).stagingContainersHealthy
END FOR
```

**Testing Approach**: Inspeção estática do YAML corrigido para verificar que:
- Os containers de staging ainda são subidos com os mesmos comandos (sem `--remove-orphans`)
- O health check do backend ainda é executado
- O rollback ainda é acionado em caso de falha
- O `workflow_dispatch` ainda aceita o parâmetro `branch`

**Test Cases**:
1. **Containers de staging preservados**: Verificar que `docker compose up -d` sem `--remove-orphans` ainda sobe todos os containers de staging
2. **Health check preservado**: Verificar que o loop de health check do backend permanece inalterado
3. **Rollback preservado**: Verificar que o step `Rollback on failure` ainda executa em caso de falha
4. **`workflow_dispatch` preservado**: Verificar que o trigger manual e o parâmetro `branch` permanecem inalterados

### Unit Tests

- Inspeção estática: verificar ausência de `--remove-orphans` no YAML corrigido
- Inspeção estática: verificar presença de `docker volume create podigger-production-static` e `podigger-production-media` antes do `docker compose up -d` do nginx-proxy
- Inspeção estática: verificar presença de verificação real do nginx-proxy (sem `|| echo "⚠️ ..."`)
- Inspeção estática: verificar que as mesmas correções estão presentes no step de rollback

### Property-Based Tests

- Para qualquer estado da VPS (com ou sem volumes de produção), o workflow corrigido deve sempre criar os volumes antes de subir o nginx-proxy
- Para qualquer sequência de `docker compose down`, o workflow corrigido nunca deve usar `--remove-orphans` no contexto do `docker-compose.staging.yml`
- Para qualquer falha do nginx-proxy, o workflow corrigido deve sempre falhar explicitamente em vez de silenciar o erro

### Integration Tests

- Deploy completo em VPS de staging sem volumes de produção pré-existentes: verificar que o nginx-proxy sobe com sucesso
- Deploy completo em VPS de staging com nginx-proxy já rodando: verificar que o nginx-proxy permanece rodando após o deploy
- Deploy com falha intencional do nginx-proxy: verificar que o pipeline falha com mensagem de erro clara
- Rollback após falha: verificar que o nginx-proxy é restaurado corretamente
