# Bugfix Requirements Document

## Introduction

Após o pipeline `deploy-staging.yml` terminar com sucesso (verde), os serviços de staging (`staging-podigger.perna.app` e `staging-api-podigger.perna.app`) retornam HTTP 502 Bad Gateway via Cloudflare. Esta é uma nova ocorrência distinta das causas já corrigidas:

- **`staging-502-fix`** (concluído): corrigiu a ausência do arquivo `.env` na VPS com `DB_PASSWORD_STAGING` — o arquivo agora é criado antes do `docker compose up`.
- **`ci-cd-deploy-fix`** (concluído): corrigiu o health check externo com `continue-on-error: true` — o pipeline não falha mais por bloqueio do Cloudflare.

A causa raiz desta nova ocorrência está na **instabilidade do container `podigger-nginx-proxy`** durante o deploy de staging. O workflow executa `docker compose down --remove-orphans` no contexto do `docker-compose.staging.yml`, que compartilha a rede externa `podigger-proxy` com o nginx-proxy. Isso pode derrubar o nginx-proxy como "órfão" ou desconectá-lo da rede. Adicionalmente, o nginx-proxy depende de volumes externos de produção (`podigger-production-static`, `podigger-production-media`) que podem não existir na VPS, impedindo sua reinicialização. O resultado é que o nginx-proxy fica fora do ar ou desconectado dos containers de staging, e todas as requisições externas retornam 502.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o step "Deploy to staging" executa `docker compose -f docker-compose.staging.yml down --remove-orphans` na VPS THEN o sistema pode remover o container `podigger-nginx-proxy` como "órfão", pois ele está conectado à rede `podigger-proxy` que é declarada como externa no `docker-compose.staging.yml`, e o Docker Compose pode interpretá-lo como container não gerenciado por esse compose file

1.2 WHEN o step "Deploy to staging" tenta reiniciar o nginx-proxy com `docker compose up -d` no diretório `/opt/podigger-nginx-proxy` THEN o sistema falha silenciosamente (o comando usa `|| echo "⚠️ ..."`) se os volumes externos `podigger-production-static` ou `podigger-production-media` não existirem na VPS, deixando o nginx-proxy fora do ar sem interromper o pipeline

1.3 WHEN o nginx-proxy está fora do ar ou não está conectado à rede `podigger-proxy` THEN o sistema retorna HTTP 502 Bad Gateway para todas as requisições externas a `staging-podigger.perna.app` e `staging-api-podigger.perna.app`, mesmo que os containers `podigger-staging-backend` e `podigger-staging-frontend` estejam saudáveis internamente

1.4 WHEN o health check interno do pipeline verifica `curl http://localhost:8000/health/` dentro do container `backend-staging` THEN o sistema reporta sucesso (HTTP 200 ou 503), pois o backend está rodando — mas esse check não valida a conectividade do nginx-proxy com os containers de staging, mascarando a falha de roteamento externo

1.5 WHEN o workflow executa múltiplos `docker compose down --remove-orphans` em sequência (primeiro para parar containers antigos, depois novamente antes de subir tudo) THEN o sistema aumenta a janela de tempo em que o nginx-proxy pode ser afetado, pois cada execução de `down --remove-orphans` no contexto da rede `podigger-proxy` é uma oportunidade de remover o nginx-proxy

> **Nota**: O item sobre certificados SSL ausentes foi descartado como causa raiz ativa nesta ocorrência. Os certificados `cloudflare.crt` e `cloudflare.key` **existem** em `/opt/podigger-nginx-proxy/certs/` na VPS. O requisito 2.5 foi mantido como salvaguarda defensiva, mas não é um vetor ativo do bug.

### Expected Behavior (Correct)

2.1 WHEN o step "Deploy to staging" executa operações de `docker compose down` THEN o sistema SHALL garantir que o container `podigger-nginx-proxy` não seja removido como órfão, seja evitando o uso de `--remove-orphans` em contextos que compartilham a rede `podigger-proxy`, ou verificando e restaurando o nginx-proxy após qualquer operação de `down`

2.2 WHEN o step "Deploy to staging" tenta subir o nginx-proxy THEN o sistema SHALL criar previamente todos os volumes externos necessários (`podigger-production-static`, `podigger-production-media`, `podigger-staging-static`, `podigger-staging-media`) antes de executar `docker compose up -d` no diretório do nginx-proxy, garantindo que o container suba com sucesso

2.3 WHEN o nginx-proxy é iniciado ou reiniciado durante o deploy THEN o sistema SHALL verificar que o container `podigger-nginx-proxy` está efetivamente rodando e conectado à rede `podigger-proxy` antes de prosseguir, retornando erro se o nginx-proxy não subir

2.4 WHEN o deploy de staging conclui com sucesso (pipeline verde) THEN o sistema SHALL garantir que o nginx-proxy está ativo e roteando tráfego para os containers `podigger-staging-backend:8000` e `podigger-staging-frontend:3000`, de forma que as URLs externas respondam sem 502

2.5 WHEN os certificados SSL (`cloudflare.crt` e `cloudflare.key`) não existem em `/opt/podigger-nginx-proxy/certs/` na VPS THEN o sistema SHALL falhar o deploy com mensagem de erro clara, em vez de silenciar a falha do nginx-proxy com `|| echo "⚠️ ..."`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o deploy de staging é executado e todos os pré-requisitos estão satisfeitos (`.env` presente, certificados presentes, volumes existentes) THEN o sistema SHALL CONTINUE TO subir todos os containers de staging (`backend-staging`, `frontend-staging`, `db-staging`, `redis-staging`, `celery-staging`, `celery-beat-staging`) com sucesso

3.2 WHEN o backend Django passa no health check interno (`curl http://localhost:8000/health/`) THEN o sistema SHALL CONTINUE TO aguardar a confirmação de saúde antes de prosseguir para os próximos steps do pipeline

3.3 WHEN o deploy falha em qualquer step crítico THEN o sistema SHALL CONTINUE TO executar o rollback automático, incluindo a restauração do nginx-proxy

3.4 WHEN o pipeline de deploy é disparado manualmente via `workflow_dispatch` THEN o sistema SHALL CONTINUE TO aceitar o parâmetro `branch` e fazer o deploy da branch especificada

3.5 WHEN o nginx-proxy já está rodando e saudável antes do deploy THEN o sistema SHALL CONTINUE TO preservar o nginx-proxy em execução durante todo o processo de deploy, sem interrupção do serviço para outros ambientes (ex: produção) que também dependem do mesmo nginx-proxy

3.6 WHEN o arquivo `/opt/podigger-staging/.env` com `DB_PASSWORD_STAGING` é criado antes do `docker compose up` THEN o sistema SHALL CONTINUE TO carregar a variável corretamente, preservando a correção do spec `staging-502-fix`

---

## Bug Condition (Pseudocódigo)

### Função de Condição do Bug

```pascal
FUNCTION isBugCondition(deployState)
  INPUT: deployState com campos:
    - nginxProxyRunningBeforeDeploy: boolean
    - productionVolumesExistOnVPS: boolean   // podigger-production-static, podigger-production-media
    - removeOrphansUsed: boolean             // --remove-orphans foi usado no docker compose down
  OUTPUT: boolean

  // Vetores ativos confirmados:
  // Vetor A: --remove-orphans pode derrubar o nginx-proxy como "órfão" da rede podigger-proxy
  // Vetor B: volumes de produção ausentes impedem reinicialização do nginx-proxy
  RETURN (deployState.nginxProxyRunningBeforeDeploy = true)
     AND (
           (deployState.removeOrphansUsed = true)
        OR (deployState.productionVolumesExistOnVPS = false)
     )
END FUNCTION
```

### Property: Fix Checking

```pascal
// Property: Fix Checking — nginx-proxy permanece ativo após o deploy
FOR ALL deployState WHERE isBugCondition(deployState) DO
  result ← runDeploy'(deployState)
  ASSERT (result.nginxProxyRunningAfterDeploy = true)
     AND (result.nginxProxyConnectedToProxyNetwork = true)
     AND (result.externalUrlsReturn502 = false)
     AND (result.pipelineReportsSuccess = true IMPLIES result.nginxProxyActuallyRunning = true)
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking — deploys sem o bug continuam funcionando
FOR ALL deployState WHERE NOT isBugCondition(deployState) DO
  ASSERT runDeploy(deployState).stagingContainersHealthy
       = runDeploy'(deployState).stagingContainersHealthy
END FOR
```
