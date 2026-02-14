# Architecture

**Pattern:** Monolith modular (Django backend + Next.js frontend separado)

## High-Level Structure

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js       │  HTTP   │   Django API     │
│   Frontend      │────────▶│   (REST)         │
│   (Port 3000)   │         │   (Port 8000)    │
└─────────────────┘         └──────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │PostgreSQL│    │  Redis   │    │  Celery  │
              │          │    │ (Cache + │    │  Worker  │
              │          │    │  Broker) │    │          │
              └──────────┘    └──────────┘    └──────────┘
                    ▲
                    │
              ┌─────┴──────┐
              │ RSS Feeds  │
              │ (External) │
              └────────────┘
```

## Identified Patterns

### Service Layer Pattern

**Location:** `backend/podcasts/services/`
**Purpose:** Encapsular lógica de negócio complexa fora das views
**Implementation:** Classes de serviço com métodos estáticos
**Example:** 
- `PodcastService.create_podcast()` - validação, criação e enfileiramento
- `EpisodeUpdater.populate()` - sincronização de feeds RSS

### Repository/Manager Pattern

**Location:** `backend/podcasts/models.py`
**Purpose:** Encapsular queries complexas do banco de dados
**Implementation:** Custom Django Managers
**Example:**
- `EpisodeManager.search()` - busca full-text com fallback para trigram

### Task Queue Pattern

**Location:** `backend/podcasts/tasks.py`
**Purpose:** Processar operações assíncronas e demoradas
**Implementation:** Celery shared tasks
**Example:**
- `add_episode.delay(feed_url)` - importação assíncrona de episódios
- `update_base()` - atualização periódica de todos os feeds

### ViewSet Pattern (DRF)

**Location:** `backend/podcasts/views.py`
**Purpose:** CRUD completo via REST API
**Implementation:** Django REST Framework ViewSets
**Example:**
- `PodcastViewSet` - CRUD + custom action `recent()`
- `EpisodeViewSet` - CRUD + busca integrada

### Component-Based UI

**Location:** `frontend/src/components/ui/`
**Purpose:** Componentes reutilizáveis com variantes
**Implementation:** React components com TypeScript + Tailwind
**Example:**
- `Button.tsx` - variantes (primary, secondary, outline, ghost)
- `Card.tsx` - com suporte a hover states

## Data Flow

### Adição de Podcast

1. Frontend → POST `/api/podcasts/` com `{name, feed}`
2. `PodcastViewSet.create()` → `PodcastService.create_podcast()`
3. Validação do feed via `is_valid_feed()`
4. Criação atômica do Podcast (get_or_create)
5. Enfileiramento: `add_episode.delay(feed)`
6. Celery Worker processa task assíncrona
7. `EpisodeUpdater.populate()` faz parse do feed
8. Criação de Episodes, Tags, PodcastLanguage
9. Atualização do contador `total_episodes`

### Busca de Episódios

1. Frontend → GET `/api/episodes/?q=termo`
2. `EpisodeViewSet.get_queryset()` detecta parâmetro `q`
3. `Episode.objects.search(termo)` via custom manager
4. Tenta Full-Text Search (PostgreSQL) com ranking
5. Fallback para Trigram Similarity se FTS não retornar resultados
6. Registra termo em `PopularTerm` (incrementa contador)
7. Retorna resultados ordenados

### Atualização Periódica

1. Scheduler/Cron dispara `update_base.delay()`
2. Celery Worker busca todos os feeds do banco
3. `EpisodeUpdater.populate()` processa cada feed
4. Parse RSS → criação de novos episódios
5. Dispara `update_total_episodes.delay()`
6. Atualiza contador de episódios de cada podcast

## Code Organization

**Approach:** Feature-based (Django app) + Layer-based (services, models, views)

**Structure:**
```
backend/
├── config/           # Configuração global do Django
│   ├── settings.py   # Settings centralizadas
│   ├── urls.py       # Roteamento raiz
│   ├── celery.py     # Configuração Celery
│   └── wsgi.py/asgi.py
└── podcasts/         # App principal (feature-based)
    ├── models.py     # Modelos de dados
    ├── views.py      # ViewSets (API endpoints)
    ├── serializers.py # Serialização DRF
    ├── urls.py       # Roteamento da app
    ├── tasks.py      # Celery tasks
    ├── services/     # Lógica de negócio
    │   ├── podcast_service.py
    │   ├── feed_parser.py
    │   └── updater.py
    ├── tests/        # Testes organizados por tipo
    └── management/   # Django commands

frontend/
├── src/
│   ├── app/          # Next.js App Router
│   │   ├── page.tsx  # Página principal
│   │   ├── layout.tsx # Layout global
│   │   └── api/      # API routes
│   ├── components/   # Componentes React
│   │   └── ui/       # Design system components
│   └── lib/          # Utilitários
```

**Module boundaries:**
- Backend: Separação clara entre models, views, services, tasks
- Frontend: Componentes UI isolados, pages no App Router
- Comunicação: REST API como contrato entre frontend e backend
