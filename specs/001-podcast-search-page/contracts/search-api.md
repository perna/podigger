# API Contracts: Página de Busca

All endpoints below are existing and require no modification. Documented here for
frontend integration reference.

## 1. Search Episodes

```
GET /api/episodes/?q=<termo>&page=<n>
```

**Auth**: Public (AllowAny)
**Purpose**: Full-text search for episodes by title and description (Portuguese FTS).

### Request

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | No | — | Search term. Empty/absent returns recent episodes. |
| `search` | string | No | — | Alias for `q` (backend accepts both). |
| `page` | integer | No | `1` | Page number for paginated results. |

### Response (200 OK)

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/episodes/?q=tecnologia&page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "O Futuro da Tecnologia no Brasil",
      "link": "https://example.com/ep1",
      "description": "Neste episódio discutimos as tendências...",
      "published": "2026-06-10T14:00:00Z",
      "enclosure": "https://example.com/ep1.mp3",
      "podcast": {
        "id": 5,
        "name": "Tech Brasil",
        "image": "https://example.com/techbrasil.jpg"
      },
      "tags": [
        {"id": 1, "name": "tecnologia"},
        {"id": 3, "name": "inovação"}
      ]
    }
  ]
}
```

### Pagination

| Field | Description |
|-------|-------------|
| `count` | Total number of matching episodes. |
| `next` | URL for next page (null if last page). |
| `previous` | URL for previous page (null if first page). |

**Page size**: 10 items (DRF `PAGE_SIZE = 10` in `config/settings.py`).

### Search Behavior

- Primary: PostgreSQL `SearchQuery` + `SearchRank` on `to_tsvector('portuguese', title || description)`.
- Fallback: `TrigramSimilarity > 0.1` when FTS returns no results.
- Side effect: Increments `PopularTerm.times` for the searched term.

### Error Responses

| Status | Body | When |
|--------|------|------|
| 500 | `{"detail": "..."}` | Database/search error |

---

## 2. Search Podcasts

```
GET /api/podcasts/?search=<termo>&page=<n>
```

**Auth**: Public (AllowAny)
**Purpose**: Simple text search for podcasts by name.

### Request

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `search` | string | No | — | Search term. Empty/absent returns all podcasts ordered by `-id`. |
| `page` | integer | No | `1` | Page number for paginated results. |

### Response (200 OK)

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "name": "Tech Brasil",
      "feed": "https://example.com/techbrasil.xml",
      "image": "https://example.com/techbrasil.jpg",
      "language": 1,
      "total_episodes": 120
    }
  ]
}
```

### Search Behavior

- DRF `SearchFilter` on the `name` field only.
- Case-insensitive, partial match (SQL `ILIKE`-based via `SearchFilter`).

### Error Responses

| Status | Body | When |
|--------|------|------|
| 500 | `{"detail": "..."}` | Database error |

---

## 3. Popular Search Terms

```
GET /api/popular-terms/
```

**Auth**: Public (AllowAny)
**Purpose**: Retrieve most frequently searched terms for suggestion chips.

### Request

No parameters. Returns all terms ordered by descending usage count.

### Response (200 OK)

```json
[
  {"term": "tecnologia", "times": 42},
  {"term": "python", "times": 38},
  {"term": "design", "times": 25}
]
```

### Behavior

- Read-only `PopularTermViewSet` ordered by `-times`.
- Updated automatically when episodes are searched (see contract #1 side effect).
- Frontend should only display top N (recommended: 8) and skip empty response.
