# Inventário — podigger

> Gerado pelo Scout em 2026-06-04
> Mapeamento de superfície do sistema legado

---

## 1. Visão geral

- **Nome:** podigger
- **Tipo:** Sistema web full-stack (backend API + frontend SPA/SSR)
- **Propósito:** Motor de busca de episódios de podcasts por conteúdo (assunto), com agregação automática via RSS
- **Modelo de deploy:** Containerizado (Docker Compose), com 4 estágios (local / dev / staging / production)
- **Status de maturidade:** Backend funcional e testado; frontend em fase inicial (poucas páginas funcionais, design system pronto)

---

## 2. Estrutura de pastas (raiz)

```
podigger/
├── backend/                         # Django 5.2 REST API + Celery worker
│   ├── config/                      # Settings, URLs, Celery, ASGI/WSGI
│   ├── accounts/                    # App de autenticação e usuários
│   │   ├── migrations/
│   │   ├── tests/
│   │   └── *.py (models, views, serializers, urls, auth, permissions)
│   ├── podcasts/                    # App principal de domínio
│   │   ├── services/                # Service layer (feed_parser, updater, podcast_service)
│   │   ├── management/commands/     # Comandos CLI (seed, clear, remove_fixture)
│   │   ├── fixtures/                # Dados de seed
│   │   ├── migrations/              # 4 migrations incluindo pg_trgm e FTS
│   │   └── tests/                   # 8 arquivos de teste
│   ├── conftest.py
│   ├── manage.py
│   ├── pyproject.toml
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
│   └── Dockerfile.production
├── frontend/                        # Next.js 16 App Router + React 19
│   ├── src/
│   │   ├── app/                     # Rotas (page.tsx, layout.tsx, api/, about, login, register, add-podcast, auth/*)
│   │   ├── components/              # UI design system + features (common, ui, layout, home, search, podcasts, episodes, providers)
│   │   ├── contexts/                # AuthContext
│   │   ├── lib/                     # api.ts, utils, constants
│   │   ├── middleware.ts            # Auth middleware
│   │   └── __tests__/               # Testes property-based
│   ├── tests/                       # 2 testes de preservação (bug-condition, preservation)
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── vitest.config.ts
│   ├── vitest.setup.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── Dockerfile
│   └── Dockerfile.production
├── docs/                            # Documentação humana
│   ├── analysis/                    # Análises técnicas
│   ├── plans/                       # Planos de execução
│   └── postman/                     # Coleção Postman (staging)
├── nginx-proxy/                     # Configuração Nginx
│   └── conf.d/                      # Vhosts
├── scripts/                         # Scripts de setup e automação
│   └── *.sh
├── docker-compose.yml               # Stack completa (backend + db + redis + celery)
├── docker-compose.base.yml          # Definições base compartilhadas
├── docker-compose.local.yml         # Apenas Postgres + Redis locais
├── docker-compose.staging.yml       # Ambiente staging
├── docker-compose.production.yml    # Ambiente produção
├── .github/workflows/               # CI/CD GitHub Actions
│   ├── ci.yml                       # Testes
│   ├── release.yml                  # Release
│   ├── deploy-staging.yml
│   ├── deploy-production.yml
│   ├── cleanup-images.yml
│   ├── README-cleanup.md
│   └── TESTING-cleanup.md
├── Makefile                         # Comandos de dev (target-style)
├── AGENTS.md                        # Instruções para agentes (reversa)
├── .cz.toml                         # Commitizen config
├── CHANGELOG.md                     # Changelog convencional
├── README.md
├── README.dev.md
├── README.versioning.md
├── ruff.toml                        # Lint backend
├── pyproject.toml                   # (raiz - ausente; só em backend/)
├── .python-version
├── test_req.py                      # Teste de requisições (ad-hoc)
└── .editorconfig
```

---

## 3. Tecnologias e frameworks

### Backend
- **Linguagem:** Python 3.12 (`requires-python = ">=3.12,<3.13"`)
- **Framework web:** Django 5.2.13
- **API:** Django REST Framework ≥3.16.1,<4.0
- **Autenticação:** djangorestframework-simplejwt 5.5.1 (com cookies) + django.contrib.auth
- **Banco de dados:** PostgreSQL 15 (driver psycopg2-binary==2.9.11 em dev, psycopg2==2.9.11 compilado em prod)
- **ORM:** Django ORM nativo
- **Fila assíncrona:** Celery 5.5.3 + Redis 7.1.0 (broker e result backend)
- **Cache:** django-redis ≥5.4.0
- **Filtros:** django-filter ≥23.2
- **CORS:** django-cors-headers==4.0.0
- **Parser RSS:** feedparser ≥6.0.10
- **HTTP client:** requests ≥2.31.0
- **Config:** django-environ ≥0.10.0
- **Servidor:** gunicorn (prod) + uvicorn==0.38.0 (ASGI)
- **Linting:** ruff ≥0.8.0,<0.9.0 (config estendida em pyproject.toml)

### Frontend
- **Linguagem:** TypeScript 5
- **Framework:** Next.js 16.2.3 (App Router)
- **UI:** React 19.2.1
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/postcss`, sem `tailwind.config.js` explícito)
- **Gerenciamento de classes:** clsx + tailwind-merge
- **Ícones:** Material Icons (integrados)
- **Testes:** Vitest 4.0.18 + @testing-library/react 16.3.2 + fast-check 3.23.2 (property-based) + jsdom
- **Linting:** ESLint 9 + eslint-config-next
- **Otimização:** @next/bundle-analyzer, babel-plugin-react-compiler

### Ferramentas de dev
- **Gerenciador Python:** uv (com uv.lock)
- **Gerenciador Node:** npm (package-lock.json)
- **Versionamento:** Commitizen (conventional commits), cz_conventional_commits
- **Containerização:** Docker Compose multi-arquivo
- **CI/CD:** GitHub Actions (5 workflows)
- **Cobertura:** pytest-cov (backend, fail-under 70%)

---

## 4. Linguagens por contagem de arquivos

| Linguagem | Extensão | Arquivos |
|-----------|----------|----------|
| Python | .py | 61 |
| TypeScript | .tsx | 41 |
| YAML | .yml/.yaml | 26 |
| TypeScript | .ts | 17 |
| Shell | .sh | 16 |
| JSON | .json | 30 |
| Markdown | .md | 411 (inclui node_modules — desconsiderando, ~80 docs) |

**Linguagem primária:** Python (backend) e TypeScript (frontend) — projeto full-stack dual.

---

## 5. Pontos de entrada

### Backend
- `backend/manage.py` — CLI Django
- `backend/config/asgi.py` — Entry point ASGI (uvicorn)
- `backend/config/wsgi.py` — Entry point WSGI (gunicorn)
- `backend/config/celery.py` — Entry point Celery worker
- `backend/config/urls.py` — URLconf raiz

### Frontend
- `frontend/src/app/layout.tsx` — Root layout Next.js
- `frontend/src/app/page.tsx` — Página inicial
- `frontend/src/middleware.ts` — Middleware de auth
- `frontend/src/lib/api.ts` — Cliente HTTP para backend

### Configuração
- `backend/.env`, `backend/.env.example`, `backend/.env.staging`, `backend/.env.staging.example`, `backend/.env.production.example`
- `frontend/.env.staging.example`, `frontend/.env.production.example`
- `ruff.toml` (raiz)

### CI/CD
- `.github/workflows/ci.yml` — Testes automatizados
- `.github/workflows/release.yml` — Release/tag
- `.github/workflows/deploy-staging.yml` — Deploy staging
- `.github/workflows/deploy-production.yml` — Deploy produção
- `.github/workflows/cleanup-images.yml` — Limpeza de imagens Docker

### Docker
- `Dockerfile` + `Dockerfile.production` (backend)
- `Dockerfile` + `Dockerfile.production` (frontend)
- `docker-compose.yml` (stack completa)
- `docker-compose.base.yml` (serviços base compartilhados)
- `docker-compose.local.yml` (Postgres + Redis apenas)
- `docker-compose.staging.yml`, `docker-compose.production.yml`

---

## 6. Schema de banco de dados (superficial)

**Banco:** PostgreSQL 15 (com extensões `pg_trgm` e FTS)

**App `accounts` (Django):** 1 migration (`0001_initial.py`) — modelo `User` customizado (email como identificador único)

**App `podcasts` (Django):** 4 migrations
- `0001_initial.py` — Modelos principais
- `0002_enable_pg_trgm.py` — Habilita extensão `pg_trgm` (Trigram Similarity)
- `0003_add_search_index.py` — Adiciona índice de busca
- `0004_alter_popularterm_date_search.py` — Altera campo date_search

**Modelos identificados (de `models.py`):**
- `BaseModel` (abstrato: created_at, updated_at)
- `PodcastLanguage` (code, name)
- `Podcast` (name, feed, image, language FK, total_episodes)
- `Tag` (name)
- `Episode` + `EpisodeManager` (com search via FTS + Trigram)
- `PopularTerm` (termos de busca populares)
- `TopicSuggestion` (sugestões de tópicos da comunidade)

**Fixtures:** `backend/podcasts/fixtures/initial_fake_seed.json`

> Análise detalhada do banco: tarefa do `reversa-data-master`.

---

## 7. Cobertura de testes

### Backend
- **Framework:** pytest + pytest-django + pytest-mock + pytest-cov
- **Property-based:** hypothesis 6.135.0 (visível em nomes `test_property_*.py`)
- **Gate de cobertura:** `--cov-fail-under=70`
- **Arquivos de teste:** 8 arquivos em `backend/podcasts/tests/` + 2 arquivos em `backend/accounts/tests/` = **10 arquivos**
- **Nomenclatura:** `test_*.py` (configurado em `pyproject.toml`)
- **Cobertura medida:** sim, via `coverage` configurado em `pyproject.toml`, omitindo migrations e management

### Frontend
- **Framework:** Vitest 4.0.18 + @testing-library + fast-check (property-based)
- **Setup:** `vitest.config.ts` + `vitest.setup.ts`
- **Arquivos de teste:** 6 em `frontend/src/**/__tests__/` + 2 em `frontend/tests/` (preservação) + 1 em `frontend/src/lib/__tests__/` = **10 arquivos**

**Total estimado:** ~20 arquivos de teste (backend + frontend).

---

## 8. Integrações externas detectadas

- **PostgreSQL** (banco de dados relacional, com FTS)
- **Redis** (broker Celery + cache)
- **Celery** (fila assíncrona, periodic tasks)
- **feedparser** (parse de RSS/Atom feeds externos)
- **JWT (SimpleJWT)** (autenticação stateless, mas com cookies httpOnly)
- **Nginx** (reverse proxy em produção, config em `nginx-proxy/conf.d/`)
- **Docker** (containerização)

> Análise detalhada de integrações: tarefa do `reversa-detective` (ADRs) + `reversa-architect` (mapa de integrações).

---

## 9. Documentação pré-existente

- `.specs/project/PROJECT.md` — Visão, goals, stack
- `.specs/project/ROADMAP.md` — Roadmap em 4 milestones
- `.specs/project/STATE.md` — Decisões, blockers, lessons
- `.specs/codebase/` — STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS
- `.specs/features/home-search/` — Feature com spec.md, design.md, tasks.md
- `.kiro/specs/` — 3 specs históricos: backend-test-refactoring, dependabot-package-updates, icon-font-not-loading
- `docs/analysis/`, `docs/plans/`, `docs/postman/` — Documentação humana
- `README.md`, `README.dev.md`, `README.versioning.md`, `CHANGELOG.md`
- `AGENTS.md` — Instruções para agentes (reversa)

---

## 10. Resumo executivo

| Aspecto | Valor |
|---------|-------|
| **Total de arquivos (não-build)** | ~661 |
| **Linguagens principais** | Python 3.12 + TypeScript 5 |
| **Framework backend** | Django 5.2 + DRF |
| **Framework frontend** | Next.js 16.2 + React 19 |
| **Banco de dados** | PostgreSQL 15 (FTS + Trigram) |
| **Fila assíncrona** | Celery 5.5 + Redis 7 |
| **Módulos backend** | 2 apps Django (`accounts`, `podcasts`) + 1 config |
| **Endpoints API** | 4 routers DRF (`podcasts`, `episodes`, `topic-suggestions`, `popular-terms`) + 6 endpoints de auth |
| **Testes** | ~20 arquivos, cobertura backend ≥70% |
| **CI/CD** | GitHub Actions (5 workflows) |
| **Maturidade** | Backend ✅ / Frontend 🚧 (design system + algumas páginas) |
