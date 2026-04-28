# Documento de Requisitos — Otimização de Build

## Introdução

Este documento descreve os requisitos para otimizar o processo de build das duas aplicações do projeto Podigger: o frontend Next.js e o backend Django. O escopo abrange tempo de build local e em CI, tamanho das imagens Docker, cache de dependências, separação de dependências dev/prod e configurações de pipeline.

O projeto atualmente apresenta os seguintes problemas identificados:

- **Frontend**: sem cache do Next.js no CI, sem bundle analyzer, `typescript` instalado globalmente no Dockerfile desnecessariamente, sem configurações explícitas de compressão ou code splitting.
- **Backend**: todas as dependências (dev + prod) em um único `requirements.txt`, sem cache de pip no CI, três builds Docker idênticos do mesmo `Dockerfile.production` (backend, celery, celery-beat), `psycopg2-binary` em produção em vez do `psycopg2` compilado, instalação de dependências via pip em vez de UV (mais lento).
- **Docker/CI**: sem `--cache-from` nos builds de produção, sem registry de imagens, builds acontecem diretamente no VPS a cada deploy.

### Análise de Multi-Stage Build por Dockerfile

| Arquivo | Multi-stage atual | Recomendação |
|---|---|---|
| `backend/Dockerfile.production` | ✅ Sim (builder → runtime) | Substituir pip por UV no estágio builder |
| `frontend/Dockerfile.production` | ✅ Sim (deps → builder → runner) | Remover instruções redundantes, adicionar cache mount npm |
| `backend/Dockerfile` | ❌ Não (single-stage, dev) | Adicionar UV para instalação mais rápida; multi-stage **não se aplica** pois o código é sobrescrito por bind-mount em runtime |

---

## Glossário

- **CI**: Integração Contínua — pipeline automatizado no GitHub Actions.
- **VPS**: Servidor privado virtual onde o deploy de produção é executado.
- **Cache de camadas Docker**: mecanismo que reutiliza camadas de imagem já construídas para evitar reconstrução desnecessária.
- **Build_System**: o conjunto de scripts, Dockerfiles e workflows de CI/CD responsável por compilar, testar e empacotar as aplicações.
- **Frontend_Build**: processo de compilação do Next.js que gera o output standalone para Docker.
- **Backend_Build**: processo de instalação de dependências Python e empacotamento da aplicação Django em imagem Docker.
- **Pipeline_CI**: workflow do GitHub Actions que executa lint, testes e build para cada pull request ou push.
- **Requirements_Prod**: arquivo contendo exclusivamente dependências necessárias para execução em produção.
- **Requirements_Dev**: arquivo contendo dependências adicionais necessárias apenas para desenvolvimento e testes.
- **Bundle_Analyzer**: ferramenta que inspeciona o tamanho e composição dos bundles JavaScript gerados pelo Next.js.
- **Cache_Mount**: instrução `--mount=type=cache` do BuildKit que persiste o cache de pacotes entre builds Docker.
- **Next_Cache**: diretório `.next/cache` que armazena artefatos incrementais de compilação do Next.js.
- **UV**: gerenciador de pacotes Python escrito em Rust, 10-100x mais rápido que pip para instalação de dependências.
- **UV_Installer_Stage**: estágio multi-stage no Dockerfile que copia o binário UV da imagem oficial `ghcr.io/astral-sh/uv:latest`.

---

## Requisitos

### Requisito 1: Separação de Dependências do Backend

**User Story:** Como desenvolvedor, quero separar as dependências de desenvolvimento das de produção no backend, para que a imagem Docker de produção seja menor e mais segura.

#### Critérios de Aceitação

1. THE Build_System SHALL manter um arquivo `requirements.txt` contendo exclusivamente as dependências de produção: Django, DRF, psycopg2, celery, redis, gunicorn, uvicorn, django-environ, django-redis, django-cors-headers, django-filter, feedparser e requests.
2. THE Build_System SHALL manter um arquivo `requirements-dev.txt` que inclui `requirements.txt` e adiciona as dependências de desenvolvimento: pytest, pytest-django, pytest-mock, pytest-cov, Faker, ruff e commitizen.
3. WHEN o `Dockerfile.production` do backend for construído, THE Backend_Build SHALL instalar apenas as dependências listadas em `requirements.txt`.
4. WHEN o job `test-backend` do Pipeline_CI for executado, THE Pipeline_CI SHALL instalar as dependências a partir de `requirements-dev.txt`.
5. THE Build_System SHALL substituir `psycopg2-binary` por `psycopg2` no `requirements.txt` de produção, mantendo `psycopg2-binary` apenas no `requirements-dev.txt`.

---

### Requisito 2: Cache de Dependências Python no CI

**User Story:** Como desenvolvedor, quero que o CI faça cache das dependências Python, para que o tempo de instalação seja reduzido em execuções subsequentes.

#### Critérios de Aceitação

1. WHEN o job `test-backend` do Pipeline_CI for executado, THE Pipeline_CI SHALL instalar UV via `pip install uv` e utilizar `uv pip install --system -r backend/requirements-dev.txt` em vez de `pip install -r`.
2. THE Pipeline_CI SHALL utilizar a action `actions/cache` para persistir o cache do UV em `~/.cache/uv`, usando como chave um hash do conteúdo de `requirements-dev.txt`.
3. WHEN o conteúdo de `requirements-dev.txt` não tiver sido alterado desde a última execução, THE Pipeline_CI SHALL restaurar o cache sem executar instalação completa.
4. WHEN o conteúdo de `requirements-dev.txt` for alterado, THE Pipeline_CI SHALL invalidar o cache existente e reinstalar todas as dependências.

---

### Requisito 3: Cache do Next.js no CI

**User Story:** Como desenvolvedor, quero que o CI preserve o cache de build do Next.js entre execuções, para que builds incrementais sejam mais rápidos.

#### Critérios de Aceitação

1. WHEN o job `test-frontend` do Pipeline_CI for executado, THE Pipeline_CI SHALL utilizar a action `actions/cache` para persistir e restaurar o diretório `frontend/.next/cache`.
2. THE Pipeline_CI SHALL usar como chave de cache um hash composto pelo sistema operacional, conteúdo do `package-lock.json` e arquivos de código-fonte do frontend.
3. WHEN o cache do Next.js for restaurado com sucesso, THE Frontend_Build SHALL executar build incremental reutilizando artefatos cacheados.
4. WHEN nenhum cache for encontrado, THE Frontend_Build SHALL executar build completo e salvar o resultado no cache para a próxima execução.

---

### Requisito 4: Eliminação de Redundância nos Builds Docker do Backend

**User Story:** Como operador de infraestrutura, quero que os serviços backend, celery e celery-beat compartilhem a mesma imagem Docker, para que o tempo de deploy no VPS seja reduzido.

#### Critérios de Aceitação

1. THE Build_System SHALL definir um único serviço de build no `docker-compose.production.yml` para a imagem do backend, identificado como `backend-image`.
2. WHEN o deploy for executado, THE Build_System SHALL construir a imagem do backend uma única vez e referenciá-la nos serviços `backend-production`, `celery-production` e `celery-beat-production` via `image:` em vez de `build:`.
3. WHEN os serviços `celery-production` e `celery-beat-production` forem iniciados, THE Build_System SHALL utilizar a imagem já construída sem disparar um novo build.

---

### Requisito 5: Otimização do Dockerfile do Frontend

**User Story:** Como desenvolvedor, quero que o Dockerfile de produção do frontend seja mais eficiente, para que o tempo de build e o tamanho da imagem sejam reduzidos.

#### Critérios de Aceitação

1. THE Frontend_Build SHALL remover a instrução `RUN npm install -g typescript` do estágio `builder`, pois o TypeScript já está disponível como dependência local em `node_modules/.bin`.
2. THE Frontend_Build SHALL remover a instrução `RUN npm list next || npm install` do estágio `builder`, pois as dependências já são copiadas do estágio `deps`.
3. WHEN o estágio `deps` for construído com BuildKit habilitado, THE Frontend_Build SHALL utilizar `--mount=type=cache,target=/root/.npm` para cachear o registry npm entre builds.
4. THE Frontend_Build SHALL definir `ENV NEXT_TELEMETRY_DISABLED=1` no estágio `deps` para evitar chamadas de telemetria durante a instalação.

---

### Requisito 6: Configuração do Bundle Analyzer

**User Story:** Como desenvolvedor, quero poder analisar o tamanho dos bundles do frontend sob demanda, para que eu possa identificar dependências desnecessárias e oportunidades de code splitting.

#### Critérios de Aceitação

1. THE Build_System SHALL adicionar `@next/bundle-analyzer` como dependência de desenvolvimento no `package.json` do frontend.
2. WHEN a variável de ambiente `ANALYZE=true` for definida, THE Frontend_Build SHALL gerar relatórios HTML de análise de bundle para client, server e edge runtimes.
3. WHEN a variável de ambiente `ANALYZE` não for definida ou for diferente de `true`, THE Frontend_Build SHALL executar o build normalmente sem gerar relatórios de análise.
4. THE Build_System SHALL adicionar o script `"build:analyze": "ANALYZE=true next build"` no `package.json` do frontend.

---

### Requisito 7: Configurações de Otimização do Next.js

**User Story:** Como desenvolvedor, quero habilitar otimizações nativas do Next.js no `next.config.ts`, para que o bundle final seja menor e o tempo de carregamento seja reduzido.

#### Critérios de Aceitação

1. THE Frontend_Build SHALL habilitar `compress: true` no `next.config.ts` para ativar compressão gzip das respostas do servidor Next.js standalone.
2. THE Frontend_Build SHALL habilitar `poweredByHeader: false` no `next.config.ts` para remover o header `X-Powered-By` das respostas HTTP.
3. THE Frontend_Build SHALL configurar `images.formats: ['image/avif', 'image/webp']` no `next.config.ts` para otimização automática de imagens.
4. THE Frontend_Build SHALL habilitar `experimental.optimizePackageImports` no `next.config.ts` para os pacotes `clsx` e `tailwind-merge`, reduzindo o tamanho do bundle ao importar apenas os módulos utilizados.

---

### Requisito 8: Cache de Camadas Docker com BuildKit

**User Story:** Como operador de infraestrutura, quero que os builds Docker utilizem cache de camadas de forma eficiente, para que rebuilds parciais sejam mais rápidos tanto localmente quanto no VPS.

#### Critérios de Aceitação

1. THE Build_System SHALL garantir que a variável de ambiente `DOCKER_BUILDKIT=1` esteja habilitada em todos os contextos de build (local e CI).
2. WHEN o `Dockerfile.production` do backend for construído, THE Backend_Build SHALL utilizar `--mount=type=cache,target=/root/.cache/uv` na instrução `RUN uv pip install` do estágio builder.
3. WHEN o `Dockerfile.production` do frontend for construído, THE Frontend_Build SHALL utilizar `--mount=type=cache,target=/root/.npm` na instrução `RUN npm ci` do estágio `deps`.
4. THE Build_System SHALL documentar no `Makefile` um target `build-production` que execute o build com BuildKit habilitado explicitamente.

---

### Requisito 11: UV como Instalador de Dependências no Backend de Produção

**User Story:** Como operador de infraestrutura, quero que o `Dockerfile.production` do backend utilize UV para instalar dependências Python, para que o tempo de build no VPS seja reduzido.

#### Critérios de Aceitação

1. THE `Dockerfile.production` do backend SHALL adicionar um estágio `uv-installer` que copia o binário UV da imagem oficial `ghcr.io/astral-sh/uv:latest` via `COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/`.
2. WHEN o estágio `builder` do `Dockerfile.production` for executado, THE Backend_Build SHALL utilizar `uv pip install --system --no-cache -r requirements.txt` em vez de `pip install --user -r requirements.txt`.
3. THE `Dockerfile.production` do backend SHALL remover a dependência de `pip` para instalação de pacotes no estágio builder, mantendo pip apenas se necessário para o runtime.
4. WHEN o binário UV for copiado via multi-stage, THE Backend_Build SHALL não instalar UV via `curl` ou `pip install uv`, evitando dependência de rede adicional durante o build.
5. THE Backend_Build SHALL manter a estrutura multi-stage existente (builder → runtime), apenas substituindo o mecanismo de instalação de pip para UV no estágio builder.

---

### Requisito 12: UV no Dockerfile de Desenvolvimento do Backend

**User Story:** Como desenvolvedor, quero que o `Dockerfile` de desenvolvimento do backend utilize UV para instalar dependências, para que o tempo de build do container de dev seja reduzido.

#### Critérios de Aceitação

1. THE `Dockerfile` de desenvolvimento do backend SHALL copiar o binário UV da imagem `ghcr.io/astral-sh/uv:latest` via instrução `COPY --from`.
2. WHEN o `Dockerfile` de desenvolvimento for construído, THE Backend_Build SHALL utilizar `uv pip install --system --no-cache -r requirements.txt` em vez de `pip install --no-cache-dir -r requirements.txt`.
3. THE `Dockerfile` de desenvolvimento SHALL permanecer single-stage, pois o código-fonte é sobrescrito por bind-mount em runtime e multi-stage não traz benefício nesse contexto.
4. THE Build_System SHALL atualizar o `Makefile` target `install` para continuar utilizando `uv pip install` localmente (comportamento já existente, deve ser mantido consistente com o Dockerfile).

---

### Requisito 9: Variável de Ambiente `NEXT_TELEMETRY_DISABLED` no CI

**User Story:** Como desenvolvedor, quero que a telemetria do Next.js seja desabilitada no CI, para que o build não faça chamadas de rede desnecessárias e o tempo de execução seja previsível.

#### Critérios de Aceitação

1. WHEN o job `test-frontend` do Pipeline_CI executar o step `Run build`, THE Pipeline_CI SHALL definir a variável de ambiente `NEXT_TELEMETRY_DISABLED=1`.
2. THE Pipeline_CI SHALL definir `NEXT_TELEMETRY_DISABLED=1` como variável de ambiente no nível do job `test-frontend`, aplicando-a a todos os steps do job.

---

### Requisito 10: Documentação das Otimizações

**User Story:** Como desenvolvedor, quero que as otimizações de build sejam documentadas, para que a equipe entenda as decisões tomadas e saiba como utilizar as ferramentas disponíveis.

#### Critérios de Aceitação

1. THE Build_System SHALL atualizar o `Makefile` com um target `build-analyze` que execute `ANALYZE=true npm run build` no diretório `frontend`.
2. THE Build_System SHALL atualizar o `Makefile` com um target `deps-check` que liste as dependências desatualizadas do backend (`pip list --outdated`) e do frontend (`npm outdated`).
3. THE Build_System SHALL incluir comentários nos arquivos `requirements.txt` e `requirements-dev.txt` explicando a separação e como instalar cada conjunto de dependências.
