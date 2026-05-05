# Bugfix Requirements Document

## Introduction

Após o deploy para staging usando a nova estratégia de deploy, o sistema está retornando erro 502 Bad Gateway ao tentar acessar tanto o frontend (staging-podigger.perna.app) quanto o backend (staging-api-podigger.perna.app). A investigação revelou que apenas os containers de banco de dados (PostgreSQL) e cache (Redis) estão rodando, enquanto os containers de aplicação (backend Django e frontend Next.js) não foram iniciados. O nginx está configurado corretamente e está na rede `podigger-proxy`, mas não consegue resolver os nomes dos containers de aplicação porque eles não existem.

**Causa Raiz Identificada:**

A execução de comandos Docker Compose na VPS retornou o erro:
```
open /opt/podigger-staging/.env: permission denied
```

Este erro indica que o Docker Compose não consegue ler o arquivo `.env` porque o usuário `ubuntu` não tem permissão para acessá-lo. Isso explica por que apenas os containers de infraestrutura (db e redis) estão rodando - eles não dependem do arquivo `.env` principal para suas variáveis de ambiente. No entanto, os containers de aplicação (backend e frontend) precisam que o Docker Compose leia variáveis de ambiente do arquivo `.env` principal (como `DB_PASSWORD_STAGING`) para substituir nos arquivos `.env.staging` e `.env.frontend.staging`, impedindo que esses containers sejam iniciados corretamente.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o deploy para staging é executado THEN apenas os containers `podigger-staging-db` e `podigger-staging-redis` são iniciados, mas os containers `podigger-staging-backend` e `podigger-staging-frontend` não são iniciados

1.2 WHEN o nginx tenta fazer proxy para `podigger-staging-frontend:3000` ou `podigger-staging-backend:8000` THEN o nginx retorna erro "could not be resolved (2: Server failure)" porque os containers não existem

1.3 WHEN um usuário acessa staging-podigger.perna.app ou staging-api-podigger.perna.app THEN o sistema retorna erro 502 Bad Gateway

### Expected Behavior (Correct)

2.1 WHEN o deploy para staging é executado THEN todos os containers definidos em `docker-compose.staging.yml` SHALL ser iniciados com sucesso (backend, frontend, db, redis, celery, celery-beat)

2.2 WHEN o nginx tenta fazer proxy para `podigger-staging-frontend:3000` ou `podigger-staging-backend:8000` THEN o nginx SHALL resolver os nomes dos containers corretamente e estabelecer conexão com sucesso

2.3 WHEN um usuário acessa staging-podigger.perna.app ou staging-api-podigger.perna.app THEN o sistema SHALL retornar resposta HTTP 200 (ou redirecionamento apropriado) sem erro 502

### Unchanged Behavior (Regression Prevention)

3.1 WHEN os containers de banco de dados e Redis estão rodando THEN eles SHALL CONTINUE TO funcionar corretamente e estar acessíveis na rede `podigger-proxy`

3.2 WHEN o nginx está configurado para fazer proxy reverso THEN ele SHALL CONTINUE TO estar na rede `podigger-proxy` e ter acesso aos containers de aplicação

3.3 WHEN o deploy para produção é executado THEN ele SHALL CONTINUE TO funcionar independentemente das mudanças feitas para corrigir o staging
