# Data Model: Listagem de Podcasts

**Feature**: 001-podcast-listing
**Date**: 2026-06-11

## Entities (Existing)

All entities for this feature already exist in the `podcasts` Django app. No new models or migrations are required.

### Podcast

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `id` | `BigAutoField` (PK) | Auto-increment ID | None |
| `name` | `CharField(128, unique=True)` | Podcast name | None |
| `feed` | `URLField(unique=True)` | RSS/Atom feed URL | None |
| `image` | `CharField(255, blank=True, null=True)` | Cover image URL | None |
| `language` | `ForeignKey(PodcastLanguage, on_delete=SET_NULL, null=True)` | Language classification | **Serialization changed** (see below) |
| `total_episodes` | `IntegerField(default=0)` | Episode count | None |
| `created_at` | `DateTimeField` | Creation timestamp (from `BaseModel`) | None |
| `updated_at` | `DateTimeField` | Last update (from `BaseModel`) | None |

**API serialization change**: The `language` FK will be serialized as a nested object `{id, code, name}` instead of a raw integer. This is a **contract change** — the frontend `Podcast` interface in `api.ts` must be updated accordingly.

### PodcastLanguage

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `id` | `BigAutoField` (PK) | Auto-increment ID | None |
| `code` | `CharField(10)` | Language code (e.g., "pt", "en") | None |
| `name` | `CharField(60)` | Display name (e.g., "Português", "Inglês") | None |

**New**: This entity gains a read-only API endpoint (`GET /api/languages/`) to power the language filter dropdown on the frontend.

**New serializer**: `PodcastLanguageSerializer` exposing `id`, `code`, `name`.

## Entity Relationships

```
PodcastLanguage (1) ────< (N) Podcast
```

- A `Podcast` belongs to zero or one `PodcastLanguage` (nullable FK)
- A `PodcastLanguage` can be associated with many `Podcast` records
- Filtering podcasts by language: `GET /api/podcasts/?language=<id>`

## Query Patterns

### List all podcasts (paginated)
```
GET /api/podcasts/?page=1&page_size=20
→ SELECT * FROM podcasts_podcast ORDER BY id DESC LIMIT 20 OFFSET 0
   LEFT JOIN podcasts_podcastlanguage ON podcasts_podcast.language_id = podcasts_podcastlanguage.id
```

### Search podcasts by name
```
GET /api/podcasts/?search=nerd&page=1
→ SELECT * FROM podcasts_podcast WHERE name ILIKE '%nerd%' ORDER BY id DESC
```

### Filter podcasts by language
```
GET /api/podcasts/?language=3&page=1
→ SELECT * FROM podcasts_podcast WHERE language_id = 3 ORDER BY id DESC
```

### List available languages
```
GET /api/languages/
→ SELECT * FROM podcasts_podcastlanguage ORDER BY name ASC
```

## State Transitions

No state transitions apply to this feature. Podcasts are read-only in the listing context.
