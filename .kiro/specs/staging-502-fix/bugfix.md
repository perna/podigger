# Bugfix Requirements Document

## Introduction

Após o pipeline de deploy de staging (`deploy-staging.yml`) terminar com sucesso (verde), os containers de aplicação `podigger-staging-backend` e `podigger-staging-frontend` não existem na VPS — apenas `podigger-staging-redis` e `podigger-staging-db` estão rodando. Isso resulta em HTTP 502 para todas as URLs de staging (`staging-podigger.perna.app` e `staging-api-podigger.perna.app`).

**Causa raiz confirmada:** O `docker-compose.staging.yml` usa `${DB_PASSWORD_STAGING}` diretamente no nível do compose para o serviço `db-staging` (campo `POSTGRES_PASSWORD`). Essa variável é injetada via `export DB_PASSWORD_STAGING='...'` dentro do bloco SSH do pipeline, mas **não está persistida no ambiente da VPS**. Em execuções subsequentes de `docker compose`, a variável não está disponível, o PostgreSQL inicializa com senha em branco, o backend falha na autenticação e não sobe. O pipeline reporta sucesso porque o health check interno (`docker compose exec -T backend-staging curl ...`) falha silenciosamente quando o container não existe — o exit code não-zero é mascarado pela lógica do loop.

O mesmo problema existe em produção com `${DB_PASSWORD_PRODUCTION}` nos arquivos `docker-compose.production.yml` e `deploy-production.yml`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o pipeline executa `docker compose -f docker-compose.staging.yml up -d` na VPS em uma sessão SSH onde `DB_PASSWORD_STAGING` não está no ambiente THEN o sistema sobe `db-staging` e `redis-staging` (que já têm dados persistidos em volumes) mas falha silenciosamente ao subir `backend-staging`, `frontend-staging`, `celery-staging` e `celery-beat-staging`, deixando os containers de aplicação inexistentes

1.2 WHEN o container `backend-staging` não existe e o health check interno executa `docker compose exec -T backend-staging curl ...` THEN o sistema retorna exit code não-zero do `docker compose exec`, mas o loop de 20 tentativas encerra com `exit 1` apenas na última iteração — e em deploys onde o container nunca chegou a existir, o pipeline pode ter passado em execução anterior com a variável presente, mascarando a falha atual

1.3 WHEN o `docker-compose.staging.yml` é lido pelo Docker Compose sem `DB_PASSWORD_STAGING` no ambiente THEN o sistema interpreta `${DB_PASSWORD_STAGING}` como string vazia, fazendo com que o PostgreSQL do container `db-staging` já existente (com dados) rejeite conexões do backend por incompatibilidade de senha

1.4 WHEN o pipeline executa `docker compose -f docker-compose.production.yml up -d` na VPS em uma sessão SSH onde `DB_PASSWORD_PRODUCTION` não está no ambiente THEN o sistema apresenta o mesmo comportamento defectivo em produção: `backend-production`, `frontend-production`, `celery-production` e `celery-beat-production` não sobem, e `db-backup` também falha por usar `${DB_PASSWORD_PRODUCTION}`

1.5 WHEN o rollback é acionado após falha de deploy THEN o sistema executa novamente `docker compose up -d` com `export DB_PASSWORD_STAGING='...'` injetado via `bash -s`, o que funciona apenas nessa sessão SSH específica — o problema persiste na próxima execução de deploy

### Expected Behavior (Correct)

2.1 WHEN o pipeline de staging executa o deploy na VPS THEN o sistema SHALL criar o arquivo `/opt/podigger-staging/.env` contendo `DB_PASSWORD_STAGING=<valor>` via SSH antes de executar qualquer comando `docker compose`, garantindo que a variável esteja disponível em todas as execuções subsequentes de `docker compose` naquele diretório

2.2 WHEN o Docker Compose lê `docker-compose.staging.yml` na VPS THEN o sistema SHALL carregar automaticamente `/opt/podigger-staging/.env` (comportamento nativo do Docker Compose) e resolver `${DB_PASSWORD_STAGING}` com o valor correto, permitindo que todos os containers de aplicação subam com sucesso

2.3 WHEN o pipeline de produção executa o deploy na VPS THEN o sistema SHALL criar o arquivo `/opt/podigger-production/.env` contendo `DB_PASSWORD_PRODUCTION=<valor>` via SSH antes de executar qualquer comando `docker compose`, corrigindo a mesma vulnerabilidade em produção

2.4 WHEN o Docker Compose lê `docker-compose.production.yml` na VPS THEN o sistema SHALL carregar automaticamente `/opt/podigger-production/.env` e resolver `${DB_PASSWORD_PRODUCTION}` com o valor correto, permitindo que `backend-production`, `frontend-production`, `celery-production`, `celery-beat-production` e `db-backup` subam com sucesso

2.5 WHEN o arquivo `.env` é criado na VPS durante o deploy THEN o sistema SHALL garantir que esse arquivo não seja commitado no repositório (deve estar no `.gitignore`) e que seja criado com permissões restritas (`chmod 600`)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o deploy é executado e o arquivo `.env` está presente na VPS com o valor correto THEN o sistema SHALL CONTINUE TO subir todos os containers (`backend`, `frontend`, `db`, `redis`, `celery`, `celery-beat`) com sucesso e as URLs de staging responderem HTTP 200

3.2 WHEN o backend Django sobe e passa no health check interno (`curl http://localhost:8000/health/`) THEN o sistema SHALL CONTINUE TO aguardar a confirmação de saúde do backend antes de prosseguir para os próximos steps do pipeline

3.3 WHEN o deploy falha em qualquer step crítico THEN o sistema SHALL CONTINUE TO executar o rollback automático, que também deve criar o arquivo `.env` antes de tentar subir os containers

3.4 WHEN o pipeline de deploy é disparado manualmente via `workflow_dispatch` THEN o sistema SHALL CONTINUE TO aceitar o parâmetro `branch` e fazer o deploy da branch especificada

3.5 WHEN as variáveis de ambiente do Django (ex: `DATABASE_PASSWORD`, `DJANGO_SECRET_KEY`) já estão em `backend/.env.staging` e `backend/.env.production` THEN o sistema SHALL CONTINUE TO carregar essas variáveis via `env_file` nos containers de aplicação — o arquivo `.env` na raiz da VPS deve conter APENAS as variáveis usadas no nível do compose (`DB_PASSWORD_STAGING` / `DB_PASSWORD_PRODUCTION`)

3.6 WHEN o banco de dados já possui dados persistidos em volume (`pgdata_staging`, `pgdata_production`) THEN o sistema SHALL CONTINUE TO preservar esses dados entre deploys, sem recriar os volumes

---

## Bug Condition (Pseudocode)

### Bug Condition Function

```pascal
FUNCTION isBugCondition(deployContext)
  INPUT: deployContext com campos:
    - envFileExistsOnVPS: boolean  // /opt/podigger-staging/.env existe na VPS
    - dbPasswordVarInEnvFile: boolean  // DB_PASSWORD_STAGING está no .env da VPS
    - environment: string  // "staging" ou "production"
  OUTPUT: boolean

  // O bug ocorre quando a variável de senha do banco não está persistida na VPS
  IF deployContext.environment = "staging" THEN
    RETURN (deployContext.envFileExistsOnVPS = false)
        OR (deployContext.dbPasswordVarInEnvFile = false)
  END IF

  IF deployContext.environment = "production" THEN
    RETURN (deployContext.envFileExistsOnVPS = false)
        OR (deployContext.dbPasswordVarInEnvFile = false)
  END IF

  RETURN false
END FUNCTION
```

### Property: Fix Checking

```pascal
// Property: Fix Checking — Containers de aplicação sobem quando .env está presente na VPS
FOR ALL deployContext WHERE isBugCondition(deployContext) DO
  result ← runDeploy'(deployContext)
  ASSERT (result.backendContainerExists = true)
      AND (result.frontendContainerExists = true)
      AND (result.backendHealthy = true)
      AND (result.pipelineReportsSuccess = true IMPLIES result.containersActuallyRunning = true)
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking — Deploys com .env correto continuam funcionando
FOR ALL deployContext WHERE NOT isBugCondition(deployContext) DO
  ASSERT runDeploy(deployContext) = runDeploy'(deployContext)
END FOR
```
