# Plano de Implementação: Otimização de Build

## Visão Geral

Implementação incremental das otimizações de build do projeto Podigger, cobrindo separação de dependências Python, substituição de pip por UV, cache BuildKit nos Dockerfiles, cache no CI (GitHub Actions), eliminação de builds redundantes no docker-compose, bundle analyzer e otimizações do Next.js.

## Tarefas

- [x] 1. Separar dependências Python em prod e dev
  - Criar `backend/requirements.txt` contendo apenas dependências de produção (Django, DRF, psycopg2 compilado, celery, redis, gunicorn, uvicorn, django-environ, django-redis, django-cors-headers, django-filter, feedparser, requests, urllib3, zipp)
  - Substituir `psycopg2-binary` por `psycopg2==2.9.11` (sem sufixo `-binary`) no arquivo de produção
  - Criar `backend/requirements-dev.txt` com diretiva `-r requirements.txt` seguida das dependências de dev: pytest, pytest-django, pytest-mock, pytest-cov, Faker, ruff, commitizen e `psycopg2-binary`
  - Adicionar comentários de cabeçalho em ambos os arquivos explicando a separação e o comando de instalação recomendado
  - _Requisitos: 1.1, 1.2, 1.5, 10.3_

  - [ ]* 1.1 Escrever teste de propriedade — requirements.txt não contém dependências de desenvolvimento
    - **Propriedade 1: Para qualquer subconjunto de dependências de dev, nenhuma deve aparecer em requirements.txt**
    - Criar `backend/tests/test_build_optimization_properties.py` com `@given` do Hypothesis
    - Usar `st.sampled_from` sobre o conjunto `{pytest, pytest-django, pytest-mock, pytest-cov, faker, ruff, commitizen}`
    - Configurar `@settings(max_examples=100)`
    - **Valida: Requisito 1.1**

  - [ ]* 1.2 Escrever testes de exemplo para separação de dependências
    - Criar `backend/tests/test_requirements_separation.py`
    - Testar que `requirements.txt` não contém nenhuma dep de dev
    - Testar que `requirements-dev.txt` contém a diretiva `-r requirements.txt`
    - Testar que `requirements.txt` usa `psycopg2` e não `psycopg2-binary`
    - _Requisitos: 1.1, 1.2, 1.5_

- [x] 2. Checkpoint — Verificar separação de dependências
  - Garantir que todos os testes do passo 1 passam, tirar dúvidas com o usuário se necessário.

- [x] 3. Atualizar `backend/Dockerfile` de desenvolvimento para usar UV
  - Adicionar instrução `COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/` antes do `WORKDIR`
  - Substituir `RUN pip install --no-cache-dir -r /app/requirements.txt` por `RUN uv pip install --system --no-cache -r /app/requirements.txt`
  - Manter o Dockerfile single-stage (bind-mount em runtime torna multi-stage desnecessário)
  - _Requisitos: 12.1, 12.2, 12.3_

- [x] 4. Atualizar `backend/Dockerfile.production` para usar UV com cache mount
  - Adicionar `COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/` no estágio `builder`
  - Substituir o bloco `RUN --mount=type=cache,target=/root/.cache/pip pip install --user -r requirements.txt` por `RUN --mount=type=cache,target=/root/.cache/uv uv pip install --system --no-cache -r requirements.txt`
  - Atualizar o `COPY --from=builder` do estágio runtime: trocar `/root/.local` → `/usr/local/lib/python3.12/site-packages` e `/usr/local/bin`
  - Remover a variável de ambiente `PATH=/home/app/.local/bin:$PATH` (não mais necessária com `--system`)
  - Garantir que `build-essential`, `libpq-dev` e `gcc` permanecem no estágio builder para compilar `psycopg2`
  - _Requisitos: 1.3, 8.2, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 5. Otimizar `frontend/Dockerfile.production`
  - Remover `RUN npm list next || npm install` do estágio `builder`
  - Remover `RUN npm install -g typescript` do estágio `builder`
  - Adicionar `--mount=type=cache,target=/root/.npm` na instrução `RUN npm ci` do estágio `deps`
  - Adicionar `ENV NEXT_TELEMETRY_DISABLED=1` no estágio `deps`
  - _Requisitos: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Checkpoint — Verificar Dockerfiles
  - Garantir que todos os testes passam e que os Dockerfiles estão sintaticamente corretos, tirar dúvidas com o usuário se necessário.

- [x] 7. Refatorar `docker-compose.production.yml` para build único do backend
  - Adicionar serviço `backend-image` com `build:` apontando para `./backend/Dockerfile.production` e `image: podigger-backend:production`
  - Remover a chave `build:` dos serviços `backend-production`, `celery-production` e `celery-beat-production`
  - Adicionar `image: podigger-backend:production` nesses três serviços
  - Adicionar `depends_on: backend-image: condition: service_completed_successfully` nos três serviços que consomem a imagem
  - _Requisitos: 4.1, 4.2, 4.3_

  - [ ]* 7.1 Escrever teste de propriedade — exatamente um serviço com build do backend
    - **Propriedade 3: Para qualquer leitura do docker-compose.production.yml, exatamente um serviço deve ter `build:` referenciando `Dockerfile.production` do backend**
    - Adicionar em `backend/tests/test_build_optimization_properties.py`
    - Usar `@given(st.just('docker-compose.production.yml'))` com `@settings(max_examples=100)`
    - Parsear o YAML com `yaml.safe_load` e contar serviços com `build.dockerfile == 'Dockerfile.production'`
    - **Valida: Requisito 4.1**

  - [ ]* 7.2 Escrever teste de exemplo para docker-compose
    - Adicionar em `backend/tests/test_requirements_separation.py` (ou arquivo dedicado)
    - Testar que `backend-production`, `celery-production` e `celery-beat-production` não possuem chave `build:`
    - Testar que os três serviços possuem `image: podigger-backend:production`
    - _Requisitos: 4.1, 4.2, 4.3_

- [x] 8. Adicionar `@next/bundle-analyzer` e atualizar `next.config.ts`
  - Instalar `@next/bundle-analyzer` como devDependency no `frontend/package.json`
  - Adicionar script `"build:analyze": "ANALYZE=true next build"` no `package.json`
  - Reescrever `frontend/next.config.ts` com:
    - Import de `bundleAnalyzer` de `@next/bundle-analyzer`
    - `withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })`
    - `compress: true`
    - `poweredByHeader: false`
    - `images.formats: ['image/avif', 'image/webp']`
    - `experimental.optimizePackageImports: ['clsx', 'tailwind-merge']`
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 8.1 Escrever teste de propriedade — bundle analyzer ativado se e somente se ANALYZE=true
    - **Propriedade 2: Para qualquer valor de `ANALYZE`, o analyzer deve estar ativo se e somente se `ANALYZE === 'true'`**
    - Criar `frontend/src/__tests__/build-optimization.property.test.ts`
    - Usar `fc.assert(fc.property(fc.oneof(...), ...))` do `@fast-check/vitest` com `numRuns: 100`
    - Testar com `'true'`, `'false'`, `''`, `undefined` e strings arbitrárias
    - **Valida: Requisitos 6.2, 6.3**

  - [ ]* 8.2 Escrever testes de exemplo para `next.config.ts`
    - Criar `frontend/src/__tests__/next-config.test.ts`
    - Testar `compress === true`, `poweredByHeader === false`
    - Testar `images.formats` contém `'image/avif'` e `'image/webp'`
    - Testar `experimental.optimizePackageImports` contém `'clsx'` e `'tailwind-merge'`
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Checkpoint — Verificar frontend
  - Garantir que todos os testes do frontend passam (`npm test`), tirar dúvidas com o usuário se necessário.

- [x] 10. Otimizar CI — job `test-backend`
  - Adicionar step de cache UV antes da instalação de dependências:
    ```yaml
    - name: Cache UV
      uses: actions/cache@v4
      with:
        path: ~/.cache/uv
        key: ${{ runner.os }}-uv-${{ hashFiles('backend/requirements-dev.txt') }}
        restore-keys: |
          ${{ runner.os }}-uv-
    ```
  - Substituir o step `Install dependencies` para usar UV:
    ```yaml
    - name: Install UV and dependencies
      run: |
        pip install uv
        uv pip install --system -r backend/requirements-dev.txt
    ```
  - Atualizar o step `Validate commit messages` para não reinstalar commitizen separadamente (já está em `requirements-dev.txt`)
  - Atualizar o step `Run ruff (lint)` para usar `uv run ruff check .` (consistente com o Makefile)
  - _Requisitos: 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 11. Otimizar CI — job `test-frontend`
  - Adicionar variável de ambiente `NEXT_TELEMETRY_DISABLED: 1` no nível do job
  - Adicionar step de cache do Next.js após o setup do Node.js:
    ```yaml
    - name: Cache Next.js build
      uses: actions/cache@v4
      with:
        path: frontend/.next/cache
        key: ${{ runner.os }}-nextjs-${{ hashFiles('frontend/package-lock.json') }}-${{ hashFiles('frontend/src/**') }}
        restore-keys: |
          ${{ runner.os }}-nextjs-${{ hashFiles('frontend/package-lock.json') }}-
          ${{ runner.os }}-nextjs-
    ```
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 9.1, 9.2_

- [x] 12. Atualizar `Makefile` com novos targets
  - Adicionar target `build-analyze` que executa `ANALYZE=true npm run build` no diretório `frontend`
  - Adicionar target `deps-check` que lista dependências desatualizadas do backend (`uv pip list --outdated`) e do frontend (`npm outdated`)
  - Adicionar target `build-production` que executa `DOCKER_BUILDKIT=1 docker compose -f docker-compose.production.yml build`
  - Atualizar o target `install` para usar `requirements-dev.txt` em vez de `requirements.txt` (ambiente de desenvolvimento)
  - Adicionar os novos targets ao bloco `.PHONY` e à seção de ajuda do `help` target
  - _Requisitos: 8.1, 8.4, 10.1, 10.2, 12.4_

- [x] 13. Checkpoint final — Garantir que todos os testes passam
  - Executar `make test` (backend) e verificar que todos os testes passam incluindo os de propriedade
  - Executar `npm test` no frontend e verificar que todos os testes passam incluindo os de propriedade
  - Tirar dúvidas com o usuário se necessário.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Os testes de propriedade usam **Hypothesis** (Python) e **fast-check** (TypeScript) com mínimo de 100 iterações cada
- Os testes de exemplo cobrem verificações de configuração concretas; os testes de propriedade garantem invariantes universais
- O serviço `backend-image` no docker-compose deve ser construído com `make build-production` antes do primeiro `docker compose up`
- A variável `DOCKER_BUILDKIT=1` é necessária para os `--mount=type=cache` funcionarem corretamente
