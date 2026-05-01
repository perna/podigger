# Tasks: staging-502-fix

## Task List

- [x] 1. Verificar .gitignore para garantir que .env não será commitado
  - [x] 1.1 Confirmar que `.env` já está listado no `.gitignore` na raiz do repositório
  - [x] 1.2 Se não estiver coberto, adicionar entrada `.env` na seção "Local environment files"

- [x] 2. Corrigir deploy-staging.yml — criar .env na VPS antes do docker compose
  - [x] 2.1 Adicionar step "Create .env on VPS (staging)" antes do step "Deploy to staging", que conecta via SSH e cria `/opt/podigger-staging/.env` com `printf 'DB_PASSWORD_STAGING=%s\n' '${{ secrets.DB_PASSWORD_STAGING }}'` e aplica `chmod 600`
  - [x] 2.2 Remover `export DB_PASSWORD_STAGING='${{ secrets.DB_PASSWORD_STAGING }}'` do bloco SSH do step "Deploy to staging"
  - [x] 2.3 Adicionar criação do `.env` no step "Rollback on failure" (mesmo `printf` + `chmod 600`) antes de qualquer `docker compose`
  - [x] 2.4 Remover `export DB_PASSWORD_STAGING='${{ secrets.DB_PASSWORD_STAGING }}'` do bloco SSH do step "Rollback on failure"

- [x] 3. Corrigir deploy-production.yml — criar .env na VPS antes do docker compose
  - [x] 3.1 Adicionar step "Create .env on VPS (production)" antes do step "Deploy to production", que conecta via SSH e cria `/opt/podigger-production/.env` com `printf 'DB_PASSWORD_PRODUCTION=%s\n' '${{ secrets.DB_PASSWORD_PRODUCTION }}'` e aplica `chmod 600`
  - [x] 3.2 Remover `export DB_PASSWORD_PRODUCTION='${{ secrets.DB_PASSWORD_PRODUCTION }}'` do bloco SSH do step "Deploy to production"
  - [x] 3.3 Adicionar criação do `.env` no step "Rollback on failure" (mesmo `printf` + `chmod 600`) antes de qualquer `docker compose`
  - [x] 3.4 Remover `export DB_PASSWORD_PRODUCTION='${{ secrets.DB_PASSWORD_PRODUCTION }}'` do bloco SSH do step "Rollback on failure"

- [x] 4. Validar as alterações
  - [x] 4.1 Verificar que os arquivos YAML dos workflows são válidos (sem erros de sintaxe)
  - [x] 4.2 Confirmar que nenhuma variável `DB_PASSWORD_*` foi adicionada ao `backend/.env.staging` ou `backend/.env.production` (o `.env` da raiz da VPS deve conter APENAS a variável de senha do banco usada pelo Docker Compose)
  - [x] 4.3 Confirmar que o `.gitignore` cobre o arquivo `.env` para evitar commit acidental
