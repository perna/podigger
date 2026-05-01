# staging-502-fix Bugfix Design

## Overview

Após o pipeline de deploy de staging terminar com sucesso (verde), os containers de aplicação `backend-staging` e `frontend-staging` não existem na VPS, resultando em HTTP 502. A causa raiz é que `docker-compose.staging.yml` usa `${DB_PASSWORD_STAGING}` para o campo `POSTGRES_PASSWORD` do serviço `db-staging`. Essa variável é injetada via `export` dentro do bloco SSH do pipeline, mas não persiste na VPS entre sessões. Em execuções subsequentes de `docker compose`, a variável não está disponível, o PostgreSQL rejeita conexões do backend e os containers de aplicação não sobem.

O mesmo problema existe em produção com `${DB_PASSWORD_PRODUCTION}` em `docker-compose.production.yml` (usado em `db-production` e `db-backup`).

A solução é criar um arquivo `.env` na raiz do diretório de deploy na VPS (`/opt/podigger-staging/.env` e `/opt/podigger-production/.env`) durante o pipeline, antes de qualquer comando `docker compose`. O Docker Compose carrega automaticamente o `.env` do diretório de trabalho, tornando a variável disponível em todas as execuções subsequentes — incluindo rollbacks.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — quando o arquivo `.env` com a senha do banco não existe na VPS no momento em que `docker compose` é executado
- **Property (P)**: O comportamento correto esperado — todos os containers de aplicação sobem com sucesso quando o `.env` está presente com o valor correto
- **Preservation**: O comportamento existente que não deve ser alterado pela correção — deploys com `.env` correto, health checks, rollbacks, workflow_dispatch e carregamento de variáveis Django via `env_file`
- **isBugCondition**: Função que identifica se o contexto de deploy está no estado bugado (sem `.env` na VPS)
- **DB_PASSWORD_STAGING**: Variável de ambiente usada pelo Docker Compose para definir `POSTGRES_PASSWORD` no serviço `db-staging`
- **DB_PASSWORD_PRODUCTION**: Variável de ambiente usada pelo Docker Compose para definir `POSTGRES_PASSWORD` nos serviços `db-production` e `db-backup`
- **deploy directory**: Diretório raiz do projeto na VPS (`/opt/podigger-staging/` ou `/opt/podigger-production/`) onde o Docker Compose é executado e onde o `.env` deve residir

## Bug Details

### Bug Condition

O bug se manifesta quando o pipeline executa `docker compose` na VPS em uma sessão SSH onde `DB_PASSWORD_STAGING` (ou `DB_PASSWORD_PRODUCTION`) não está no ambiente. O Docker Compose interpreta `${DB_PASSWORD_STAGING}` como string vazia, o PostgreSQL do container já existente (com dados em volume) rejeita conexões do backend por incompatibilidade de senha, e os containers de aplicação não sobem.

**Formal Specification:**
```
FUNCTION isBugCondition(deployContext)
  INPUT: deployContext com campos:
    - envFileExistsOnVPS: boolean   // /opt/podigger-{env}/.env existe na VPS
    - dbPasswordVarInEnvFile: boolean  // DB_PASSWORD_{ENV} está no .env da VPS
    - environment: string           // "staging" ou "production"
  OUTPUT: boolean

  RETURN (deployContext.envFileExistsOnVPS = false)
      OR (deployContext.dbPasswordVarInEnvFile = false)
END FUNCTION
```

### Examples

- **Staging — primeiro deploy após criação da VPS**: `.env` não existe → `${DB_PASSWORD_STAGING}` resolve para string vazia → `db-staging` inicializa com senha em branco → `backend-staging` falha na autenticação → HTTP 502
- **Staging — segundo deploy após reboot da VPS**: `export DB_PASSWORD_STAGING` do deploy anterior não persiste → mesmo comportamento acima
- **Produção — deploy após manutenção da VPS**: `DB_PASSWORD_PRODUCTION` não está no ambiente → `db-production` e `db-backup` afetados → `backend-production` não sobe
- **Rollback**: O step de rollback também usa `export DB_PASSWORD_STAGING='...'` via `bash -s`, que funciona apenas naquela sessão SSH — o problema persiste no próximo deploy

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Todos os containers (`backend`, `frontend`, `db`, `redis`, `celery`, `celery-beat`) devem continuar subindo com sucesso quando o `.env` está correto
- O health check interno (`docker compose exec -T backend-staging curl http://localhost:8000/health/`) deve continuar aguardando confirmação do backend antes de prosseguir
- O rollback automático deve continuar sendo acionado em caso de falha, e também deve criar o `.env` antes de subir os containers
- O `workflow_dispatch` deve continuar aceitando o parâmetro `branch` e fazendo deploy da branch especificada
- As variáveis Django (ex: `DATABASE_PASSWORD`, `DJANGO_SECRET_KEY`) em `backend/.env.staging` e `backend/.env.production` devem continuar sendo carregadas via `env_file` nos containers de aplicação — o `.env` na raiz da VPS deve conter APENAS `DB_PASSWORD_STAGING` / `DB_PASSWORD_PRODUCTION`
- Os dados persistidos em volumes (`pgdata_staging`, `pgdata_production`) devem continuar sendo preservados entre deploys

**Scope:**
Todos os inputs que NÃO envolvem a ausência do arquivo `.env` na VPS devem ser completamente não afetados por esta correção. Isso inclui:
- Lógica de build das imagens Docker
- Configuração do Nginx proxy
- Steps de backup do banco de dados
- Configuração de redes Docker

## Hypothesized Root Cause

A causa raiz foi confirmada. Os detalhes são:

1. **Variável de ambiente não persistida entre sessões SSH**: O `export DB_PASSWORD_STAGING='...'` dentro do bloco `bash -s << ENDSSH` existe apenas na sessão SSH daquele step específico. Quando o próximo deploy ocorre (nova sessão SSH), a variável não está disponível no ambiente da VPS.

2. **Docker Compose resolve variáveis não definidas como string vazia**: Sem a variável no ambiente e sem um arquivo `.env` no diretório de trabalho, o Docker Compose substitui `${DB_PASSWORD_STAGING}` por string vazia. Isso não causa erro imediato — o container `db-staging` sobe, mas com senha em branco.

3. **Incompatibilidade de senha com dados existentes em volume**: O container `db-staging` já possui dados persistidos em `pgdata_staging` com a senha correta. Ao tentar inicializar com senha em branco, o PostgreSQL mantém a senha anterior (dados já existem), mas o backend tenta conectar com a senha do `backend/.env.staging` — que é a senha correta — e o PostgreSQL rejeita porque o container foi iniciado sem a variável (comportamento varia por versão do PostgreSQL).

4. **Health check mascarando a falha**: O loop de health check executa `docker compose exec -T backend-staging curl ...`. Se o container `backend-staging` não existe, o `docker compose exec` retorna exit code não-zero, mas o loop continua até a 20ª tentativa e então faz `exit 1`. Em alguns cenários de deploy anterior bem-sucedido, o pipeline pode ter passado com a variável presente, mascarando a falha atual.

5. **Mesmo padrão em produção**: `deploy-production.yml` usa `export DB_PASSWORD_PRODUCTION='...'` com o mesmo problema. Adicionalmente, `db-backup` em `docker-compose.production.yml` também usa `${DB_PASSWORD_PRODUCTION}`.

## Correctness Properties

Property 1: Bug Condition - Arquivo .env Criado na VPS Antes do Docker Compose

_For any_ contexto de deploy onde o arquivo `.env` não existe na VPS (isBugCondition retorna true), o pipeline corrigido SHALL criar o arquivo `/opt/podigger-{env}/.env` com a variável `DB_PASSWORD_{ENV}=<valor>` via SSH antes de executar qualquer comando `docker compose`, garantindo que todos os containers de aplicação (`backend`, `frontend`, `celery`, `celery-beat`) subam com sucesso e o backend responda ao health check.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Comportamento de Deploy com .env Correto

_For any_ contexto de deploy onde o arquivo `.env` já existe na VPS com o valor correto (isBugCondition retorna false), o pipeline corrigido SHALL produzir exatamente o mesmo resultado que o pipeline original, preservando o comportamento de subida de containers, health checks, rollback automático, workflow_dispatch e carregamento de variáveis Django via env_file.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assumindo que a análise de causa raiz está correta:

**File 1**: `.github/workflows/deploy-staging.yml`

**Specific Changes**:

1. **Adicionar step "Create .env on VPS (staging)"** antes do step "Deploy to staging":
   - Conectar via SSH à VPS
   - Criar `/opt/podigger-staging/.env` usando `printf` para evitar problemas com caracteres especiais na senha
   - Aplicar `chmod 600 /opt/podigger-staging/.env`
   - Conteúdo: `DB_PASSWORD_STAGING=<valor do secret>`

2. **Remover `export DB_PASSWORD_STAGING='...'`** do bloco SSH do step "Deploy to staging" (a variável agora vem do `.env`)

3. **Adicionar criação do `.env`** no step "Rollback on failure":
   - Mesmo comando `printf` e `chmod 600` antes de qualquer `docker compose`
   - Remover `export DB_PASSWORD_STAGING='...'` do bloco SSH do rollback

---

**File 2**: `.github/workflows/deploy-production.yml`

**Specific Changes**:

1. **Adicionar step "Create .env on VPS (production)"** antes do step "Deploy to production":
   - Conectar via SSH à VPS
   - Criar `/opt/podigger-production/.env` usando `printf`
   - Aplicar `chmod 600 /opt/podigger-production/.env`
   - Conteúdo: `DB_PASSWORD_PRODUCTION=<valor do secret>`

2. **Remover `export DB_PASSWORD_PRODUCTION='...'`** do bloco SSH do step "Deploy to production"

3. **Adicionar criação do `.env`** no step "Rollback on failure":
   - Mesmo padrão do staging
   - Remover `export DB_PASSWORD_PRODUCTION='...'` do bloco SSH do rollback

---

**File 3**: `.gitignore`

**Specific Changes**:

1. **Verificar/confirmar** que `.env` já está listado no `.gitignore` (já está presente como `# Local environment files` → `.env`)
   - Nenhuma alteração necessária se já coberto

### Implementation Notes

- Usar `printf 'DB_PASSWORD_STAGING=%s\n' '${{ secrets.DB_PASSWORD_STAGING }}'` em vez de `echo` para lidar corretamente com caracteres especiais (aspas, cifrões, barras) na senha
- O arquivo `.env` deve ser criado com `mkdir -p /opt/podigger-staging` antes, para garantir que o diretório existe
- O step de criação do `.env` deve ser um step separado (não dentro do bloco SSH do deploy) para melhor visibilidade no log do pipeline
- O `.env` na raiz da VPS deve conter APENAS a variável de senha do banco — não duplicar variáveis já presentes em `backend/.env.staging`

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem em duas fases: primeiro, verificar o comportamento bugado no código não corrigido para confirmar a causa raiz; depois, verificar que a correção funciona e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz.

**Test Plan**: Simular um deploy na VPS sem o arquivo `.env` e sem `export DB_PASSWORD_STAGING` no ambiente, e verificar que os containers de aplicação não sobem.

**Test Cases**:
1. **Staging sem .env**: Remover `/opt/podigger-staging/.env` da VPS e executar `docker compose -f docker-compose.staging.yml up -d` sem a variável no ambiente → verificar que `backend-staging` não sobe (will fail on unfixed code)
2. **Produção sem .env**: Remover `/opt/podigger-production/.env` da VPS e executar `docker compose -f docker-compose.production.yml up -d` sem a variável → verificar que `backend-production` não sobe (will fail on unfixed code)
3. **Variável vazia**: Executar `DB_PASSWORD_STAGING='' docker compose config` e verificar que `POSTGRES_PASSWORD` aparece como string vazia (will fail on unfixed code)
4. **Rollback sem .env**: Simular falha de deploy e verificar que o rollback também falha sem o `.env` (will fail on unfixed code)

**Expected Counterexamples**:
- `docker compose up` retorna sucesso mas `backend-staging` não existe (`docker ps` não mostra o container)
- `docker compose exec backend-staging ...` retorna `Error: No such container: podigger-staging-backend`

### Fix Checking

**Goal**: Verificar que para todos os contextos de deploy onde o bug ocorre, o pipeline corrigido produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL deployContext WHERE isBugCondition(deployContext) DO
  result := runDeploy_fixed(deployContext)
  ASSERT result.envFileExistsOnVPS = true
      AND result.envFilePermissions = "600"
      AND result.backendContainerExists = true
      AND result.frontendContainerExists = true
      AND result.backendHealthy = true
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os contextos de deploy onde o bug NÃO ocorre, o pipeline corrigido produz o mesmo resultado que o pipeline original.

**Pseudocode:**
```
FOR ALL deployContext WHERE NOT isBugCondition(deployContext) DO
  ASSERT runDeploy_original(deployContext) = runDeploy_fixed(deployContext)
END FOR
```

**Testing Approach**: Testes de integração são recomendados para preservation checking porque:
- Verificam o fluxo completo do pipeline end-to-end
- Garantem que steps não relacionados (backup, nginx, health check) continuam funcionando
- Confirmam que variáveis Django em `backend/.env.staging` continuam sendo carregadas corretamente

**Test Plan**: Observar o comportamento no código não corrigido primeiro para deploys com `.env` correto, depois verificar que o comportamento é preservado após a correção.

**Test Cases**:
1. **Deploy completo com .env correto**: Verificar que todos os containers sobem, health check passa e pipeline reporta sucesso
2. **Variáveis Django preservadas**: Verificar que `backend/.env.staging` continua sendo carregado via `env_file` (não duplicado no `.env` da raiz)
3. **Volumes preservados**: Verificar que `pgdata_staging` não é recriado entre deploys
4. **Rollback com .env**: Verificar que rollback cria `.env` antes de subir containers e restaura o banco corretamente

### Unit Tests

- Verificar que o step de criação do `.env` usa `printf` (não `echo`) para lidar com caracteres especiais
- Verificar que `chmod 600` é aplicado ao arquivo `.env`
- Verificar que o `.env` contém apenas `DB_PASSWORD_STAGING` (staging) ou `DB_PASSWORD_PRODUCTION` (produção)
- Verificar que `export DB_PASSWORD_*` foi removido dos blocos SSH de deploy e rollback

### Property-Based Tests

- Para qualquer valor de senha (incluindo caracteres especiais: `!@#$%^&*()`, aspas, cifrões), o `printf` deve criar o arquivo `.env` com o valor correto sem truncamento ou escape incorreto
- Para qualquer estado da VPS (`.env` existente ou não), o step de criação deve sobrescrever o arquivo com o valor atual do secret
- Para qualquer sequência de deploys consecutivos, o `.env` deve sempre conter o valor mais recente do secret

### Integration Tests

- Executar o pipeline completo de staging em uma VPS limpa (sem `.env`) e verificar que todos os containers sobem
- Executar dois deploys consecutivos e verificar que o segundo deploy também funciona (`.env` sobrescrito corretamente)
- Simular falha de deploy e verificar que o rollback cria o `.env` e restaura o serviço
- Verificar que o arquivo `.env` não aparece no `git status` após o deploy (está no `.gitignore`)
