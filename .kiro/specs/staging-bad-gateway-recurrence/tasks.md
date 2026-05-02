# Staging Bad Gateway Recurrence — Tasks

## Implementation Tasks

- [x] 1. Remover `--remove-orphans` do step "Deploy to staging"
  - [x] 1.1 Substituir `docker compose -f docker-compose.staging.yml down --remove-orphans || true` por `docker compose -f docker-compose.staging.yml down || true` (primeira ocorrência, antes do `up -d db-staging redis-staging`)
  - [x] 1.2 Substituir `docker compose -f docker-compose.staging.yml up -d --remove-orphans db-staging redis-staging` por `docker compose -f docker-compose.staging.yml up -d db-staging redis-staging`
  - [x] 1.3 Substituir `docker compose -f docker-compose.staging.yml down --timeout 30 --remove-orphans` por `docker compose -f docker-compose.staging.yml down --timeout 30`
  - [x] 1.4 Substituir `docker compose -f docker-compose.staging.yml up -d --remove-orphans` por `docker compose -f docker-compose.staging.yml up -d` (comando final de subida de todos os containers)

- [x] 2. Criar volumes de produção antes de subir o nginx-proxy no step "Deploy to staging"
  - [x] 2.1 Adicionar `docker volume create podigger-production-static || true` após a criação dos volumes de staging existentes
  - [x] 2.2 Adicionar `docker volume create podigger-production-media || true` após a criação dos volumes de staging existentes

- [x] 3. Substituir silenciamento de erro do nginx-proxy por verificação real no step "Deploy to staging"
  - [x] 3.1 Remover o `|| echo "⚠️ Nginx proxy could not start. Are the certs placed at /opt/podigger-nginx-proxy/certs?"` do `docker compose up -d`
  - [x] 3.2 Adicionar verificação com `docker ps --filter name=podigger-nginx-proxy --filter status=running` após o `docker compose up -d`
  - [x] 3.3 Fazer o deploy falhar com `exit 1` e mensagem de erro clara se o nginx-proxy não estiver rodando após o `docker compose up -d`

- [x] 4. Aplicar as mesmas correções no step "Rollback on failure"
  - [x] 4.1 Substituir `docker compose -f docker-compose.staging.yml down --remove-orphans` por `docker compose -f docker-compose.staging.yml down` (stop failed containers)
  - [x] 4.2 Substituir `docker compose -f docker-compose.staging.yml up -d --remove-orphans db-staging` por `docker compose -f docker-compose.staging.yml up -d db-staging` (restore database step)
  - [x] 4.3 Adicionar `docker volume create podigger-production-static || true` e `docker volume create podigger-production-media || true` antes do `docker compose up -d` do nginx-proxy no rollback
  - [x] 4.4 Substituir o `|| echo "⚠️ Nginx proxy could not start..."` do rollback por verificação real com `docker ps` e `exit 1` se o nginx-proxy não subir

- [x] 5. Verificar o YAML resultante
  - [x] 5.1 Confirmar ausência de `--remove-orphans` em todo o arquivo `.github/workflows/deploy-staging.yml`
  - [x] 5.2 Confirmar presença de `docker volume create podigger-production-static` e `docker volume create podigger-production-media` nos steps "Deploy to staging" e "Rollback on failure"
  - [x] 5.3 Confirmar ausência de `|| echo "⚠️ Nginx proxy could not start"` e presença da verificação com `docker ps` nos dois steps
  - [x] 5.4 Confirmar que o YAML é válido (indentação e sintaxe corretas)
