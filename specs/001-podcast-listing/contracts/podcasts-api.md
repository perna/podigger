# API Contract: Podcast Listing Endpoints

**Feature**: 001-podcast-listing
**Date**: 2026-06-11
**Base URL**: `/api/`

## Endpoints

### 1. List Podcasts

```
GET /api/podcasts/
```

**Description**: Returns a paginated list of podcasts. Supports text search by name and filtering by language.

**Authentication**: Not required (public).

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `page_size` | integer | No | 20 | Number of items per page (max 100) |
| `search` | string | No | - | Full-text search by podcast name (case-insensitive) |
| `language` | integer | No | - | Filter by `PodcastLanguage.id` |

**Response** (200 OK):

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/podcasts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Nerdcast",
      "feed": "https://feeds.simplecast.com/...",
      "image": "https://example.com/cover.jpg",
      "language": {
        "id": 1,
        "code": "pt",
        "name": "Português"
      },
      "total_episodes": 850
    }
  ]
}
```

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Unique identifier |
| `name` | string | No | Podcast name |
| `feed` | string (URL) | No | RSS/Atom feed URL |
| `image` | string (URL) | Yes | Cover image URL; returns `null` if no image |
| `language` | object | Yes | Nested language object, `null` if no language set |
| `language.id` | integer | No | Language record ID |
| `language.code` | string | No | ISO-like language code (e.g., "pt", "en") |
| `language.name` | string | No | Display name (e.g., "Português") |
| `total_episodes` | integer | No | Total number of episodes for this podcast |

**Pagination**:

The top-level response includes standard DRF pagination fields:
- `count`: Total number of podcasts matching the current filters
- `next`: URL for the next page, or `null` if on the last page
- `previous`: URL for the previous page, or `null` if on the first page
- `results`: Array of podcast objects for the current page

**Error Responses**:

| Status | Condition |
|--------|-----------|
| 400 | Invalid query parameter (e.g., non-integer `page`) |
| 404 | No podcasts found (unlikely; returns empty results instead) |

### 2. List Languages

```
GET /api/languages/
```

**Description**: Returns the full list of available podcast languages. Used to populate the language filter dropdown on the frontend. Not paginated (list is small — typically <50 items).

**Authentication**: Not required (public).

**Response** (200 OK):

```json
[
  {
    "id": 1,
    "code": "pt",
    "name": "Português"
  },
  {
    "id": 2,
    "code": "en",
    "name": "Inglês"
  }
]
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Language record ID |
| `code` | string | Language code (e.g., "pt", "en") |
| `name` | string | Display name (e.g., "Português") |

**Pagination**: None (all languages returned in a single response).

## Breaking Changes

> **LANGUAGE FIELD TYPE CHANGE**: The `language` field in `PodcastListSerializer` and `PodcastDetailSerializer` changed from `integer` to `object {id, code, name}`. This is a **breaking change** for any consumer that accesses `podcast.language` as a numeric FK. The frontend `Podcast` TypeScript interface in `api.ts` must be updated accordingly.

## Compatibility Notes

- The `PodcastDetailSerializer` (used by `GET /api/podcasts/{id}/` and write operations) also uses the new language serialization — write operations (`POST`, `PUT`, `PATCH`) continue to accept language as an integer FK ID via DRF's `PrimaryKeyRelatedField` behavior for writes.
- The `PodcastMinimalSerializer` (used inside `EpisodeSerializer`) is **not** changed — it only exposes `id`, `name`, `image` and does not include `language`.
