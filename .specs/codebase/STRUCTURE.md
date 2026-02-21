# Project Structure

**Root:** `/home/perna/workspace/projects/podigger`

## Directory Tree

```
podigger/
├── backend/                    # Django REST API
│   ├── config/                 # Configuração global Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── podcasts/               # App principal
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── tasks.py
│   │   ├── services/
│   │   ├── tests/
│   │   ├── migrations/
│   │   └── management/
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── manage.py
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── next.config.ts
├── .specs/                     # Documentação TLC
│   ├── codebase/
│   ├── project/
│   └── features/
├── docker-compose*.yml         # Configurações Docker
└── README.md
```

## Module Organization

### Backend Core (`backend/config/`)

**Purpose:** Configuração global do projeto Django
**Location:** `backend/config/`
**Key files:**
- `settings.py` - Settings centralizadas (DB, Redis, Celery, DRF, CORS)
- `urls.py` - Roteamento raiz (admin + API)
- `celery.py` - Configuração do Celery
- `wsgi.py` / `asgi.py` - Entry points para servidores

### Podcasts App (`backend/podcasts/`)

**Purpose:** Funcionalidade principal - gerenciamento de podcasts e episódios
**Location:** `backend/podcasts/`
**Key files:**
- `models.py` - Modelos de dados (Podcast, Episode, Tag, PopularTerm, TopicSuggestion)
- `views.py` - ViewSets DRF (API endpoints)
- `serializers.py` - Serialização DRF
- `urls.py` - Roteamento da app
- `tasks.py` - Celery tasks (add_episode, update_base, remove_podcasts)

### Services Layer (`backend/podcasts/services/`)

**Purpose:** Lógica de negócio isolada das views
**Location:** `backend/podcasts/services/`
**Key files:**
- `podcast_service.py` - Criação e validação de podcasts
- `feed_parser.py` - Parse de RSS/Atom feeds
- `updater.py` - Sincronização de episódios

### Tests (`backend/podcasts/tests/`)

**Purpose:** Testes automatizados
**Location:** `backend/podcasts/tests/`
**Key files:**
- `test_api.py` - Testes de API endpoints
- `test_models.py` - Testes de modelos
- `test_parser.py` - Testes do feed parser
- `test_updater.py` - Testes do updater
- `test_views_features.py` - Testes de features

### Management Commands (`backend/podcasts/management/commands/`)

**Purpose:** Django custom commands
**Location:** `backend/podcasts/management/commands/`
**Key files:**
- `seed_podcasts.py` - Seed de podcasts reais
- `seed_fake_podcasts.py` - Seed de dados fake
- `clear_fake_seed.py` - Limpar dados fake
- `remove_fixture.py` - Remover fixtures

### Frontend App Router (`frontend/src/app/`)

**Purpose:** Next.js App Router - páginas e layouts
**Location:** `frontend/src/app/`
**Key files:**
- `page.tsx` - Página principal (showcase UI)
- `layout.tsx` - Layout global (fonts, metadata)
- `globals.css` - Estilos globais
- `api/health/route.ts` - Health check endpoint

### UI Components (`frontend/src/components/ui/`)

**Purpose:** Design system - componentes reutilizáveis
**Location:** `frontend/src/components/ui/`
**Key files:**
- `Button.tsx` - Componente de botão com variantes
- `Card.tsx` - Componente de card
- `Input.tsx` - Componente de input
- `Badge.tsx` - Componente de badge
- `Icon.tsx` - Wrapper para Material Icons
- `Loading.tsx` - Spinner de loading

### Utilities (`frontend/src/lib/`)

**Purpose:** Funções utilitárias
**Location:** `frontend/src/lib/`
**Key files:**
- `utils.ts` - Utilitários gerais (cn para className merge)

## Where Things Live

### Podcast Management

- **API Endpoints:** `backend/podcasts/views.py` (PodcastViewSet)
- **Business Logic:** `backend/podcasts/services/podcast_service.py`
- **Data Model:** `backend/podcasts/models.py` (Podcast, PodcastLanguage)
- **Serialization:** `backend/podcasts/serializers.py` (PodcastListSerializer, PodcastDetailSerializer)
- **Async Tasks:** `backend/podcasts/tasks.py` (add_episode)

### Episode Management

- **API Endpoints:** `backend/podcasts/views.py` (EpisodeViewSet)
- **Business Logic:** `backend/podcasts/services/updater.py` (EpisodeUpdater)
- **Data Model:** `backend/podcasts/models.py` (Episode, EpisodeManager)
- **Serialization:** `backend/podcasts/serializers.py` (EpisodeSerializer)
- **Search Logic:** `backend/podcasts/models.py` (EpisodeManager.search)

### Feed Processing

- **Feed Parser:** `backend/podcasts/services/feed_parser.py`
- **Feed Updater:** `backend/podcasts/services/updater.py`
- **Validation:** `backend/podcasts/services/feed_parser.py` (is_valid_feed)
- **Async Tasks:** `backend/podcasts/tasks.py` (add_episode, update_base)

### Search & Analytics

- **Search Logic:** `backend/podcasts/models.py` (EpisodeManager.search)
- **Popular Terms:** `backend/podcasts/models.py` (PopularTerm)
- **API Endpoints:** `backend/podcasts/views.py` (PopularTermViewSet)

### UI Components

- **Design System:** `frontend/src/components/ui/`
- **Showcase Page:** `frontend/src/app/page.tsx`
- **Global Layout:** `frontend/src/app/layout.tsx`
- **Styling:** Tailwind CSS v4 + `frontend/src/lib/utils.ts`

## Special Directories

### `backend/podcasts/migrations/`

**Purpose:** Django database migrations
**Examples:**
- `0001_initial.py` - Criação inicial dos modelos
- `0002_enable_pg_trgm.py` - Habilita extensão pg_trgm
- `0003_add_search_index.py` - Adiciona índices de busca

### `backend/staticfiles/`

**Purpose:** Arquivos estáticos coletados (Django collectstatic)
**Note:** Gerado automaticamente, não versionado

### `frontend/node_modules/`

**Purpose:** Dependências npm
**Note:** Gerado automaticamente, não versionado

### `.specs/`

**Purpose:** Documentação do processo TLC Spec-Driven
**Structure:**
- `codebase/` - Mapeamento do código existente (brownfield)
- `project/` - Visão e roadmap do projeto
- `features/` - Especificações de features

### Docker Compose Files (Root)

**Purpose:** Configurações de ambiente
**Files:**
- `docker-compose.yml` - Desenvolvimento completo
- `docker-compose.base.yml` - Configurações base compartilhadas
- `docker-compose.local.yml` - Desenvolvimento local com UV
- `docker-compose.staging.yml` - Ambiente de staging
- `docker-compose.production.yml` - Ambiente de produção

## Configuration Files

### Backend

- `backend/requirements.txt` - Dependências Python (pip)
- `backend/pyproject.toml` - Configuração do projeto (pytest, ruff, commitizen)
- `backend/.env` - Variáveis de ambiente (não versionado)

### Frontend

- `frontend/package.json` - Dependências npm e scripts
- `frontend/next.config.ts` - Configuração Next.js
- `frontend/tailwind.config.ts` - Configuração Tailwind (implícita v4)
- `frontend/tsconfig.json` - Configuração TypeScript

### Root

- `.gitignore` - Arquivos ignorados pelo git
- `README.md` - Documentação principal
- `README.dev.md` - Guia de desenvolvimento
- `README.versioning.md` - Guia de versionamento
- `CHANGELOG.md` - Histórico de mudanças
