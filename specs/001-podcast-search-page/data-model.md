# Data Model: Página de Busca de Podcasts

This feature does not introduce new database entities. All data structures exist in the
backend and are consumed by the frontend via REST APIs.

## Existing Entities (Read-Only from Frontend Perspective)

### Podcast (backend: `podcasts.Podcast`)

Represents a podcast feed source. Displayed in search results when the podcast name
matches the search term.

| Field | Type | Description | Search Relevance |
|-------|------|-------------|------------------|
| `id` | integer | Primary key | — |
| `name` | string (128) | Podcast name | Searched via DRF `SearchFilter` (`?search=`) |
| `feed` | URL | RSS/Atom feed URL | Not displayed in search results |
| `image` | string (255) | Cover image URL | Displayed in PodcastCard |
| `language` | FK → PodcastLanguage | Language code | Not displayed in search results |
| `total_episodes` | integer | Episode count | Displayed in PodcastCard |

**Search endpoint**: `GET /api/podcasts/?search=<term>&page=<n>`
**Pagination**: DRF `PageNumberPagination`, page_size=10

### Episode (backend: `podcasts.Episode`)

Represents a single podcast episode. Displayed in search results when the title or
description matches the search term via PostgreSQL full-text search.

| Field | Type | Description | Search Relevance |
|-------|------|-------------|------------------|
| `id` | integer | Primary key | — |
| `title` | string (1024) | Episode title | FTS weight A (highest) |
| `description` | text | Episode description | FTS weight B |
| `link` | URL | External episode link | Not displayed in search results |
| `published` | datetime | Publication date | Displayed; secondary sort after rank |
| `enclosure` | string (1024) | Media file URL | Not displayed in search results |
| `podcast` | nested {id, name, image} | Parent podcast (minimal) | Displayed for context |
| `tags` | [{id, name}] | Associated tags | Displayed as badges |

**Search endpoint**: `GET /api/episodes/?q=<term>&page=<n>`
**Search method**: PostgreSQL `SearchVector(title, weight=A; description, weight=B)` +
trigram similarity fallback (`pg_trgm > 0.1`), Portuguese language config.
**Pagination**: DRF `PageNumberPagination`, page_size=10

### PopularTerm (backend: `podcasts.PopularTerm`)

Tracks frequently searched terms for analytics and suggestion display.

| Field | Type | Description |
|-------|------|-------------|
| `term` | string (255) | The search term text |
| `times` | integer | How many times this term was searched |

**Endpoint**: `GET /api/popular-terms/` (read-only, ordered by `-times`)
**Update mechanism**: Automatic — each call to `Episode.objects.search()` increments
`PopularTerm.times` via `get_or_create` + atomic update.

## Frontend State Model

The search page manages the following state, synchronized with URL query parameters:

| State | Type | URL Param | Default | Description |
|-------|------|-----------|---------|-------------|
| `query` | string | `?q=` | `""` | Current search input text |
| `activeTab` | `"todos" \| "podcasts" \| "episodios"` | `?tab=` | `"todos"` | Active filter tab |
| `page` | number | `?page=` | `1` | Current results page; resets to 1 on tab change |
| `podcastResults` | `PodcastsResponse \| null` | — | `null` | Last podcast API response |
| `episodeResults` | `EpisodesResponse \| null` | — | `null` | Last episode API response |
| `popularTerms` | `PopularTerm[] \| null` | — | `null` | Fetched on mount, displayed when query is empty |
| `isSearching` | boolean | — | `false` | True while any search request is in-flight |
| `errors` | `{podcasts?: Error, episodes?: Error}` | — | `{}` | Per-section error state |

**State transitions**:
- `query` change → URL updated via `router.replace` → on submission → API calls fired → results rendered
- Tab change → no API recall (results are cached in state) → display filter changes, `page` resets to 1
- Page change → URL updated → API call for that specific page → results replaced (not accumulated)
- Direct URL access (`/search?q=python`) → initial state derived from URL params → auto-search on mount
