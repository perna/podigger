# External Integrations

## RSS/Atom Feed Parsing

**Service:** feedparser 6.0.10+
**Purpose:** Parse podcast RSS/Atom feeds para extrair episódios
**Implementation:** `backend/podcasts/services/feed_parser.py`
**Configuration:** Nenhuma configuração necessária
**Authentication:** Não aplicável (feeds públicos)

**Key functions:**
- `parse_feed(url, default_image)` - Parse completo do feed
- `is_valid_feed(url)` - Validação de feed (verifica bozo errors)

**Data extracted:**
- Feed metadata: title, language, image
- Episode data: title, link, published, description, enclosure (audio), tags

**Error handling:**
- Retorna dict vazio em caso de erro
- Logs exception com `logger.exception()`
- Fallback para default image se feed não tiver imagem

## Database (PostgreSQL)

**Service:** PostgreSQL (containerized)
**Purpose:** Armazenamento principal de dados
**Implementation:** Django ORM via `psycopg2-binary 2.9.11`
**Configuration:** `backend/config/settings.py` (DATABASES)
**Authentication:** Username/password via environment variables

**Environment variables:**
- `DATABASE_URL` (preferred) ou
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`

**PostgreSQL Extensions:**
- `pg_trgm` - Trigram similarity search (migration 0002)
- Full-text search - Portuguese configuration

**Key features used:**
- Full-text search (SearchVector, SearchQuery, SearchRank)
- Trigram similarity (TrigramSimilarity)
- JSON field (to_json in Episode model)

## Cache & Message Broker (Redis)

**Service:** Redis 7.1.0 (containerized)
**Purpose:** Cache de dados + message broker para Celery
**Implementation:** `django-redis 5.4.0` + `redis 7.1.0`
**Configuration:** `backend/config/settings.py` (CACHES, CELERY_BROKER_URL)
**Authentication:** Nenhuma (desenvolvimento local)

**Environment variables:**
- `REDIS_URL` - URL do Redis para cache (default: `redis://localhost:6379/1`)
- `CELERY_BROKER_URL` - URL do Redis para Celery (default: `redis://localhost:6379/0`)
- `CELERY_RESULT_BACKEND` - URL do Redis para resultados Celery

**Usage:**
- Database 0: Celery broker e result backend
- Database 1: Django cache

## Background Jobs (Celery)

**Queue system:** Celery 5.5.3
**Location:** `backend/podcasts/tasks.py`
**Configuration:** `backend/config/celery.py`
**Broker:** Redis
**Result backend:** Redis

**Jobs:**

### `add_episode(feed_url)`
**Purpose:** Importar episódios de um novo podcast
**Trigger:** Chamado após criação de podcast via `PodcastService.create_podcast()`
**Implementation:** `EpisodeUpdater([feed_url]).populate()`
**Execution:** Assíncrono via `.delay(feed_url)`

### `update_base()`
**Purpose:** Atualizar todos os podcasts existentes
**Trigger:** Agendado periodicamente (cron/scheduler externo)
**Implementation:** 
- Busca todos os feeds do banco
- Processa cada feed via `EpisodeUpdater`
- Dispara `update_total_episodes.delay()` ao final
**Execution:** Assíncrono via `.delay()`

### `update_total_episodes()`
**Purpose:** Recalcular contador de episódios de cada podcast
**Trigger:** Chamado após `update_base()`
**Implementation:** Loop sobre todos os podcasts, atualiza `total_episodes`
**Execution:** Assíncrono via `.delay()`

### `remove_podcasts()`
**Purpose:** Remover podcasts sem episódios
**Trigger:** Agendado periodicamente (cron/scheduler externo)
**Implementation:** Bulk delete de podcasts com `num_episodes=0`
**Execution:** Assíncrono via `.delay()`

**Celery configuration:**
```python
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
```

## HTTP Requests

**Library:** requests 2.31.0+
**Purpose:** HTTP requests genéricos (se necessário)
**Implementation:** Não usado diretamente no código atual
**Note:** feedparser usa internamente para fetch de feeds

## CORS (Cross-Origin Resource Sharing)

**Library:** django-cors-headers 4.0.0
**Purpose:** Permitir requisições do frontend Next.js
**Configuration:** `backend/config/settings.py`

**Settings:**
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
```

**Environment variable:**
- `CORS_ALLOWED_ORIGINS` - Lista de origens permitidas (ex: `http://localhost:3000`)

## Google Fonts

**Service:** Google Fonts API
**Purpose:** Carregar fonte Plus Jakarta Sans
**Implementation:** `frontend/src/app/layout.tsx`
**Configuration:** Next.js font optimization

**Font loaded:**
```typescript
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
```

## Material Symbols (Icons)

**Service:** Google Fonts Material Symbols
**Purpose:** Ícones para UI
**Implementation:** `frontend/src/app/layout.tsx` (link tag) + `frontend/src/components/ui/Icon.tsx`
**Configuration:** CDN link no head

**Icons used:**
- `rss_feed`, `search`, `settings`, `home`, `library_music`, `play_arrow`, `sync`, etc.

## API Integrations

### Django REST Framework

**Purpose:** Expor API REST para frontend
**Location:** `backend/podcasts/views.py`, `backend/podcasts/urls.py`
**Authentication:** IsAuthenticatedOrReadOnly (permite leitura sem auth)
**Pagination:** PageNumberPagination (10 items por página)

**Key endpoints:**
- `GET /api/podcasts/` - Listar podcasts
- `POST /api/podcasts/` - Criar podcast
- `GET /api/podcasts/{id}/` - Detalhe do podcast
- `GET /api/podcasts/recent/` - 6 podcasts mais recentes
- `GET /api/episodes/` - Listar episódios
- `GET /api/episodes/?q=termo` - Buscar episódios
- `GET /api/episodes/?podcast={id}` - Filtrar por podcast
- `GET /api/popular-terms/` - Termos populares
- `GET /api/topic-suggestions/` - Sugestões de tópicos

## Webhooks

**Status:** Não implementado

## Scheduled Tasks

**Status:** Tasks definidos, mas scheduler não configurado
**Recommendation:** Usar Celery Beat ou cron externo para agendar:
- `update_base()` - Diariamente ou a cada X horas
- `remove_podcasts()` - Semanalmente

## Environment Configuration

**Library:** django-environ 0.10.0+
**Purpose:** Gerenciar variáveis de ambiente e arquivo .env
**Implementation:** `backend/config/settings.py`
**Configuration file:** `backend/.env` (não versionado)

**Key environment variables:**
- `DJANGO_SECRET_KEY` - Secret key do Django
- `DJANGO_DEBUG` - Debug mode (True/False)
- `DJANGO_ALLOWED_HOSTS` - Hosts permitidos (lista)
- `DATABASE_URL` ou `DATABASE_*` - Configuração do banco
- `REDIS_URL` - URL do Redis
- `CELERY_BROKER_URL` - Broker do Celery
- `CORS_ALLOWED_ORIGINS` - Origens CORS permitidas

## Containerization (Docker)

**Service:** Docker + Docker Compose
**Purpose:** Ambiente de desenvolvimento e produção
**Configuration:** Multiple docker-compose files
**Services:**
- `backend` - Django app
- `frontend` - Next.js app (comentado no compose principal)
- `db` - PostgreSQL
- `redis` - Redis
- `celery` - Celery worker

**Volumes:**
- `pgdata` - Persistência do PostgreSQL
- Source code mounted para desenvolvimento

## Production Server

**WSGI:** Gunicorn 20.1.0+
**ASGI:** Uvicorn 0.38.0
**Purpose:** Servir Django em produção
**Configuration:** Não configurado explicitamente ainda
**Note:** Dev server usa `python manage.py runserver`
