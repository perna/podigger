# Bugfix Requirements Document

## Introduction

O pipeline de CI/CD de deploy em produção apresenta dois problemas que impedem ou degradam o processo de entrega:

1. **Health check externo falhando com HTTP 403**: O step "Health check" no workflow `deploy-production.yml` faz requisições HTTPS para `https://api-podigger.perna.app/health/` a partir dos runners do GitHub Actions. Esses runners não são IPs da Cloudflare, portanto a requisição chega diretamente ao Nginx na VPS sem passar pela rede Cloudflare. O Nginx retorna 403 porque a configuração atual não trata esse cenário — o domínio está protegido pela Cloudflare em modo "Full (Strict)", e acessos diretos ao IP/domínio sem o proxy Cloudflare podem ser bloqueados. O workflow de staging já contorna isso com `continue-on-error: true`, mas o de produção falha o deploy inteiro por causa disso.

2. **Warning de deprecação do Node.js 20**: O pipeline exibe um aviso informando que `actions/checkout@v4` e `webfactory/ssh-agent@v0.9.0` estão rodando em Node.js 20, que está sendo descontinuado. Esse warning aparece porque versões antigas dessas actions ainda estão referenciadas em algum workflow ou foram usadas em execuções recentes antes da atualização para `@v5` e `@v0.10.0`.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 QUANDO o step "Health check" do `deploy-production.yml` executa `curl https://api-podigger.perna.app/health/` a partir de um runner do GitHub Actions ENTÃO o sistema retorna HTTP 403 e o deploy falha com `❌ Backend health check failed after 3 attempts (HTTP 403)`

1.2 QUANDO o runner do GitHub Actions tenta verificar a saúde do backend via URL pública ENTÃO o sistema não distingue entre uma falha real do serviço e um bloqueio de acesso externo (Cloudflare/Nginx), causando falso negativo no health check

1.3 QUANDO o pipeline de CI/CD executa com `actions/checkout@v4` ou `webfactory/ssh-agent@v0.9.0` ENTÃO o sistema exibe o warning `Node.js 20 actions are deprecated` indicando que essas versões de actions usam um runtime em processo de descontinuação

### Expected Behavior (Correct)

2.1 QUANDO o step "Health check" do `deploy-production.yml` executa após o deploy ENTÃO o sistema SHALL verificar a saúde do backend de forma que não falhe por bloqueio de acesso externo (Cloudflare/Nginx), seja via verificação interna na VPS via SSH ou tratando o 403 como falso negativo com `continue-on-error: true` e mensagem explicativa

2.2 QUANDO o runner do GitHub Actions não consegue acessar a URL pública do backend (HTTP 403, 000, etc.) ENTÃO o sistema SHALL registrar um aviso informativo sem interromper o deploy, pois a saúde real do serviço já foi verificada internamente durante o step "Deploy to production"

2.3 QUANDO o pipeline de CI/CD executa ENTÃO o sistema SHALL usar `actions/checkout@v5` (ou superior) e `webfactory/ssh-agent@v0.10.0` (ou superior) em todos os workflows, eliminando o warning de Node.js 20

### Unchanged Behavior (Regression Prevention)

3.1 QUANDO o backend está genuinamente indisponível após o deploy (container crashou, porta não responde) ENTÃO o sistema SHALL CONTINUE TO detectar a falha e acionar o rollback automático — a verificação interna via SSH dentro do step "Deploy to production" já cobre esse cenário

3.2 QUANDO o deploy é executado com sucesso e o backend está saudável ENTÃO o sistema SHALL CONTINUE TO registrar o deployment summary com links para frontend e backend e marcar o workflow como bem-sucedido

3.3 QUANDO o pipeline de CI executa testes de backend e frontend ENTÃO o sistema SHALL CONTINUE TO rodar todos os checks (lint, build, testes) sem alterações no comportamento existente

3.4 QUANDO o deploy de staging é executado ENTÃO o sistema SHALL CONTINUE TO funcionar com `continue-on-error: true` no health check externo, comportamento que já está correto e não deve ser alterado

---

## Bug Condition (Pseudocódigo)

### Condição do Bug 1 — Health Check Externo Bloqueado

```pascal
FUNCTION isBugCondition_HealthCheck(request)
  INPUT: request de curl para URL pública do backend
  OUTPUT: boolean

  // Retorna true quando o bug está presente
  RETURN origem(request) NOT IN cloudflare_ip_ranges
         AND workflow = "deploy-production"
         AND step = "Health check"
         AND on_error = "fail"  // sem continue-on-error
END FUNCTION

// Property: Fix Checking
FOR ALL request WHERE isBugCondition_HealthCheck(request) DO
  result ← health_check_step(request)
  ASSERT result.exit_code = 0  // step não falha o deploy
         AND result.log CONTAINS aviso_informativo  // registra o status sem travar
END FOR

// Property: Preservation Checking
FOR ALL request WHERE NOT isBugCondition_HealthCheck(request) DO
  // Verificação interna via SSH ainda detecta falhas reais
  ASSERT internal_health_check(ssh_into_vps) = F'(request)
END FOR
```

### Condição do Bug 2 — Actions com Node.js 20 Deprecated

```pascal
FUNCTION isBugCondition_NodeDeprecation(workflow_file)
  INPUT: arquivo de workflow do GitHub Actions
  OUTPUT: boolean

  // Retorna true quando o bug está presente
  RETURN EXISTS action IN workflow_file WHERE
    (action.name = "actions/checkout" AND action.version < "v5")
    OR (action.name = "webfactory/ssh-agent" AND action.version < "v0.10.0")
END FUNCTION

// Property: Fix Checking
FOR ALL workflow WHERE isBugCondition_NodeDeprecation(workflow) DO
  result ← run_workflow(workflow)
  ASSERT result.warnings NOT CONTAINS "Node.js 20 actions are deprecated"
END FOR

// Property: Preservation Checking
FOR ALL workflow WHERE NOT isBugCondition_NodeDeprecation(workflow) DO
  ASSERT F(workflow).behavior = F'(workflow).behavior
END FOR
```
