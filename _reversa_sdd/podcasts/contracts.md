# podcasts, Contratos HTTP

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Contratos externos da unit `podcasts` (4 ViewSets via DRF DefaultRouter).
> Base path: `/api/`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão geral

A unit `podcasts` expõe 4 ViewSets via DRF DefaultRouter, totalizando 16 endpoints:

| ViewSet | Path base | Verbos | Permissão |
|---------|-----------|--------|-----------|
| `PodcastViewSet` | `/api/podcasts/` | GET (list, retrieve, recent), POST, PATCH, DELETE | Leitura pública, escrita `IsEditorOrAdmin` |
| `EpisodeViewSet` | `/api/episodes/` | GET (list, retrieve), POST, PATCH, DELETE | Leitura pública, escrita `IsEditorOrAdmin` |
| `TopicSuggestionViewSet` 🔴 Remover | `/api/topic-suggestions/` | GET, POST, PATCH, DELETE | Leitura pública, escrita `IsEditorOrAdmin` |
| `PopularTermViewSet` | `/api/popular-terms/` | GET (list, retrieve) | Pública (read-only) |

> **Cliente:** Frontend Next.js consome via `/api/proxy/[...path]` (proxy genérico com auto-refresh).

---

## 1. PodcastViewSet

Base path: `/api/podcasts/`

### `GET /api/podcasts/`

**Query params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `search` | string | Busca por nome (DRF `SearchFilter` em `name`) |
| `page` | int | Número da página (DRF `PageNumberPagination`) |
| `ordering` | string | Ordenação (ex: `-id`, `name`, `total_episodes`) |

**Response 200 OK:**
```json
{
  "count": 42,
  "next": "http://api.example.com/api/podcasts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Tecnologia Hoje",
      "feed": "https://exemplo.com/rss",
      "image": "/static/dist/img/podcast-banner.png",
      "language": 1,
      "total_episodes": 50,
      "created_at": "2026-05-01T12:00:00Z"
    }
  ]
}
```

### `POST /api/podcasts/`

**Permissão:** `IsEditorOrAdmin` (cookie `access_token` com role=editor ou admin).

**Request body:**
```json
{
  "name": "Tecnologia Hoje",
  "feed": "https://exemplo.com/rss",
  "image": "/static/dist/img/custom.png",  // opcional
  "language": 1                            // opcional, FK
}
```

**Response 201 Created (novo):**
```json
{
  "id": 5,
  "status": "created"
}
```

> 🟡 Resposta 201 inclui `id` e `status: "created"` (não o objeto completo). Cliente faz GET para popular.

**Response 200 OK (duplicado):**
```json
{
  "id": 5,
  "status": "none",
  "message": "Podcast já existe"
}
```

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 400 | `{"detail": "o nome e o feed são obrigatórios"}` | `name` ou `feed` ausentes |
| 400 | `{"detail": "o feed informado é inválido"}` | `is_valid_feed` falha (bozo != 0) |
| 401 | `{"detail": "Authentication credentials were not provided."}` | Sem `access_token` |
| 403 | `{"detail": "You do not have permission to perform this action."}` | `role ∉ {editor, admin}` |

### `GET /api/podcasts/recent/`

> Custom action (`@action(detail=False)`).

**Response 200 OK:**
```json
[
  {"id": 42, "name": "Último podcast", "feed": "...", ...},
  {"id": 41, "name": "Penúltimo", "feed": "...", ...},
  ...  // 6 podcasts (id desc)
]
```

> 🟡 Retorna lista pura (não envelopada em `{count, next, previous, results}`). Sem paginação.

### `GET /api/podcasts/{id}/`

**Path params:** `id: int`

**Response 200 OK:** objeto `Podcast` único (mesmo shape do GET list).
**Response 404 Not Found:** `{"detail": "Not found."}`

### `PATCH /api/podcasts/{id}/`

**Permissão:** `IsEditorOrAdmin`.

**Request body (parcial):**
```json
{
  "image": "/static/dist/img/new.png"
}
```

**Response 200 OK:** objeto `Podcast` atualizado.
**Response 403/404** — sem permissão / não existe.

### `DELETE /api/podcasts/{id}/`

**Permissão:** `IsEditorOrAdmin`.

**Response 204 No Content:** sucesso (episódios em CASCADE são deletados).
**Response 403/404** — sem permissão / não existe.

**Origem no legado:**
- `backend/podcasts/views.py:PodcastViewSet`
- `backend/podcasts/urls.py:7`

---

## 2. EpisodeViewSet

Base path: `/api/episodes/`

### `GET /api/episodes/`

**Query params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `q` | string | Termo de busca (FTS + trigrama) |
| `podcast` | int | Filtrar por `podcast_id` |
| `page` | int | Paginação |
| `ordering` | string | Ordenação (ex: `-published`, `-created_at`) |

**Response 200 OK:**
```json
{
  "count": 100,
  "next": "http://api.example.com/api/episodes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "title": "Python para iniciantes",
      "link": "https://exemplo.com/ep123",
      "description": "Neste episódio discutimos...",
      "published": "2026-05-20T10:00:00Z",
      "enclosure": "https://exemplo.com/audio123.mp3",
      "podcast": {
        "id": 5,
        "name": "Tecnologia Hoje",
        "image": "/static/dist/img/podcast-banner.png"
      },
      "tags": [
        {"id": 1, "name": "python"},
        {"id": 2, "name": "iniciante"}
      ],
      "created_at": "2026-05-20T10:05:00Z"
    }
  ]
}
```

> 🟡 `to_json` **não** é exposto no serializer (omite o snapshot bruto). Cliente consome `description` (já HTML-stripped) + tags + podcast embedded.

**Comportamento de `q` (busca):**
- Se `q` é vazio ou ausente: queryset padrão, sem criar `PopularTerm`.
- Se `q` é não-vazio: tracking atômico de `PopularTerm` (sempre, mesmo sem resultados). Retorna FTS+trigrama.
- Sem throttle específico (gap AI-4 — não há limite de req/min).

### `GET /api/episodes/{id}/`

**Response 200 OK:** objeto `Episode` único.
**Response 404 Not Found.**

### `POST /api/episodes/`

**Permissão:** `IsEditorOrAdmin`.

**Request body:**
```json
{
  "title": "Novo episódio",
  "link": "https://exemplo.com/ep-novo",
  "description": "Descrição...",
  "published": "2026-05-20T10:00:00Z",
  "enclosure": "https://exemplo.com/audio.mp3",
  "podcast": 5,
  "tags": [1, 2, 3]
}
```

**Response 201 Created:** objeto `Episode` completo.
**Response 400:** validação de campos.
**Response 403:** sem permissão.

> 🟡 Criação manual raramente usada — episódios são normalmente criados via `EpisodeUpdater.populate` em Celery task. Endpoint exposto para correções.

### `PATCH /api/episodes/{id}/` / `DELETE /api/episodes/{id}/`

**Permissão:** `IsEditorOrAdmin`.

**Response 200/204** em sucesso; 403/404 em falha.

**Origem no legado:**
- `backend/podcasts/views.py:EpisodeViewSet`
- `backend/podcasts/models.py:82-118` (`EpisodeManager.search`)
- `backend/podcasts/serializers.py:EpisodeSerializer`

---

## 3. TopicSuggestionViewSet 🔴 **Removendo — Perna 2026-06-06**

> ⚠️ Este endpoint será removido. Mantido apenas para referência do comportamento atual.

Base path: `/api/topic-suggestions/`

### `GET /api/topic-suggestions/`

**Query params:** `page?`, `ordering?` (ex: `-created_at`, `is_recorded`).

**Response 200 OK:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 7,
      "title": "Serverless em produção",
      "description": "Como fazer deploy de funções Lambda em escala",
      "is_recorded": false,
      "created_at": "2026-05-25T14:00:00Z"
    }
  ]
}
```

### `POST /api/topic-suggestions/`

**Permissão:** `IsEditorOrAdmin`.

**Request body:**
```json
{
  "title": "Rust para sistemas embarcados",
  "description": "O que aprendemos..."
}
```

**Response 201 Created:** objeto `TopicSuggestion` completo. `is_recorded=false` por default.

### `PATCH /api/topic-suggestions/{id}/`

**Permissão:** `IsEditorOrAdmin`.

**Request body (parcial):**
```json
{
  "is_recorded": true
}
```

**Response 200 OK:** objeto atualizado.

> 🟡 `is_recorded` é flag manual. Cliente (admin) chama PATCH quando vira episódio. Sem trigger automático.

### `DELETE /api/topic-suggestions/{id}/`

**Permissão:** `IsEditorOrAdmin`. **Response 204 No Content.**

**Origem no legado:**
- `backend/podcasts/views.py:TopicSuggestionViewSet:126-137`

---

## 4. PopularTermViewSet

Base path: `/api/popular-terms/`

### `GET /api/popular-terms/`

**Read-only** (sem POST/PATCH/DELETE).

**Response 200 OK:**
```json
[
  {"id": 1, "term": "python", "times": 42, "date_search": "2026-05-25"},
  {"id": 2, "term": "rust", "times": 18, "date_search": "2026-05-25"},
  {"id": 3, "term": "javascript", "times": 12, "date_search": "2026-05-25"}
]
```

> 🟡 Lista **sem paginação** (não é envolto em `{count, next, previous, results}`); ordenado por `-times` (mais buscados primeiro). `date_search` permite agregação por dia.

### `GET /api/popular-terms/{id}/`

**Response 200 OK:** objeto único.
**Response 404.**

> 🟡 Não há filtro por `?date_search=` documentado. Cliente recebe todos os termos mais uma vez (pode ser muitos). Vale considerar paginação se volume crescer.

**Origem no legado:**
- `backend/podcasts/views.py:PopularTermViewSet:139-143`

---

## 5. Health Check

### `GET /health/`

**Permissão:** Pública (sem autenticação).

**Response 200 OK (DB up, Redis up):**
```json
{
  "status": "healthy",
  "db": true,
  "redis": true,
  "timestamp": "2026-05-25T14:30:00Z",
  "environment": "production"
}
```

**Response 200 OK (DB up, Redis down — soft dependency):**
```json
{
  "status": "healthy",
  "db": true,
  "redis": false,
  "timestamp": "...",
  "environment": "production"
}
```

**Response 503 Service Unavailable (DB down):**
```json
{
  "status": "unhealthy",
  "db": false,
  "redis": false,
  "timestamp": "...",
  "environment": "production"
}
```

> 🟡 Redis exception é engolida (ADR-004, soft dependency) — sistema reporta `db:true, redis:false` em vez de 503. Aceitável para disponibilidade.

**Origem no legado:**
- `backend/podcasts/health.py`
- `backend/config/urls.py:10`

---

## Tipos compartilhados (TypeScript)

```typescript
// frontend/src/lib/api.ts (parcial)
type Podcast = {
  id: number;
  name: string;
  feed: string;
  image: string | null;
  language: number | null;
  total_episodes: number;
};

type Episode = {
  id: number;
  title: string;
  link: string;
  description: string | null;
  published: string | null;       // ISO 8601
  enclosure: string | null;
  podcast: {
    id: number;
    name: string;
    image: string | null;
  };
  tags: Array<{ id: number; name: string }>;
};

type TopicSuggestion = {
  id: number;
  title: string;
  description: string | null;
  is_recorded: boolean;
};

type PopularTerm = {
  id: number;
  term: string;
  times: number;
  date_search: string;            // YYYY-MM-DD
};

type AddPodcastResponse = {
  id?: number;
  status: "created" | "none" | "error";
  message?: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

---

## Rastreabilidade

| Endpoint | ViewSet | Serializer | Permission | Origem |
|----------|---------|------------|------------|--------|
| `GET /api/podcasts/` | `PodcastViewSet.list` | `PodcastSerializer` | `[]` (AllowAny) | `podcasts/views.py:31-35` |
| `POST /api/podcasts/` | `PodcastViewSet.create` | `PodcastSerializer` | `IsEditorOrAdmin` | `podcasts/services/podcast_service.py` |
| `GET /api/podcasts/recent/` | `PodcastViewSet.recent` (custom) | `PodcastSerializer` | `[]` | `podcasts/views.py:82-93` |
| `GET /api/podcasts/{id}/` | `PodcastViewSet.retrieve` | `PodcastSerializer` | `[]` | DRF default |
| `PATCH /api/podcasts/{id}/` | `PodcastViewSet.partial_update` | `PodcastSerializer` | `IsEditorOrAdmin` | DRF default |
| `DELETE /api/podcasts/{id}/` | `PodcastViewSet.destroy` | — | `IsEditorOrAdmin` | DRF default (CASCADE) |
| `GET /api/episodes/` | `EpisodeViewSet.list` | `EpisodeSerializer` | `[]` | `podcasts/views.py:107-123` |
| `GET /api/episodes/{id}/` | `EpisodeViewSet.retrieve` | `EpisodeSerializer` | `[]` | DRF default |
| `POST /api/episodes/` | `EpisodeViewSet.create` | `EpisodeSerializer` | `IsEditorOrAdmin` | DRF default |
| `PATCH /api/episodes/{id}/` | `EpisodeViewSet.partial_update` | `EpisodeSerializer` | `IsEditorOrAdmin` | DRF default |
| `DELETE /api/episodes/{id}/` | `EpisodeViewSet.destroy` | — | `IsEditorOrAdmin` | DRF default |
| `GET /api/topic-suggestions/` 🔴 | `TopicSuggestionViewSet.list` | `TopicSuggestionSerializer` | `[]` | `podcasts/views.py:126-137` |
| `POST /api/topic-suggestions/` 🔴 | `TopicSuggestionViewSet.create` | `TopicSuggestionSerializer` | `IsEditorOrAdmin` | DRF default |
| `PATCH /api/topic-suggestions/{id}/` 🔴 | `TopicSuggestionViewSet.partial_update` | `TopicSuggestionSerializer` | `IsEditorOrAdmin` | DRF default |
| `DELETE /api/topic-suggestions/{id}/` 🔴 | `TopicSuggestionViewSet.destroy` | — | `IsEditorOrAdmin` | DRF default |
| `GET /api/popular-terms/` | `PopularTermViewSet.list` | `PopularTermSerializer` | `[]` | `podcasts/views.py:139-143` |
| `GET /api/popular-terms/{id}/` | `PopularTermViewSet.retrieve` | `PopularTermSerializer` | `[]` | DRF default |
| `GET /health/` | (function-based) | — | `[]` | `podcasts/health.py` |

---

## Lacunas contratuais (🔴)

- **Sem throttle em `EpisodeViewSet`** (AI-4) — busca não tem rate limit. Invasor pode inflar `PopularTerm` ou DoS. Ver `podcasts/tasks.md` T-EXT-01..04.
- **Resposta do `POST /api/podcasts/` é parcial** — retorna `{id, status}` em vez do objeto completo. Cliente precisa fazer GET para popular.
- **Sem endpoint `GET /api/podcasts/?language=pt`** para filtrar por idioma (apesar do FK existir). Vale adicionar se houver demanda.
- **Sem endpoint `GET /api/podcasts/?tag=X`** para filtrar por tag (relacionamento é episode→tag, não podcast→tag). Vale considerar.
- **Sem endpoint `GET /api/episodes/?tag=X`** — cliente pode filtrar por tag indiretamente via `?q=tagname` (FTS), mas não é a forma natural.
- **Sem endpoint `GET /api/popular-terms/?date_search=YYYY-MM-DD`** — para filtrar por dia. Cliente recebe termos de todos os dias.
- **`POST /api/episodes/` raramente usado** — UX de adição manual é inexistente. UI de admin não está pronta.
- **`TopicSuggestion` removido** — Perna 2026-06-06 decidiu remover a funcionalidade por completo.
- **Sem paginação em `recent` e `popular-terms`** — ambas retornam lista crua.
- **`/api/podcasts/recent/` é hard-coded em 6** — sem configuração.
