# Contract: Podcast CRUD API

**Date**: 2026-06-13 | **Feature**: [spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)

Base URL: `/api/podcasts/`

Authentication: CookieJWTAuthentication, SessionAuthentication, BasicAuthentication
Permissions: Read (list, retrieve) → AllowAny | Write (create, update, partial_update, destroy) → IsEditorOrAdmin

---

## List Podcasts

**GET** `/api/podcasts/`

**Query Parameters**:

| Parameter  | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| search     | string | No       | Filter podcasts by name (partial match)  |
| language   | int    | No       | Filter podcasts by language ID           |
| page       | int    | No       | Page number (default: 1)                 |

**Response** `200 OK`:

```json
{
  "count": 42,
  "next": "http://host/api/podcasts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Python Bytes",
      "feed": "https://pythonbytes.fm/rss",
      "image": "https://example.com/cover.jpg",
      "language": 1,
      "total_episodes": 150
    }
  ]
}
```

**Serializer**: `PodcastListSerializer`

---

## Retrieve Podcast

**GET** `/api/podcasts/{id}/`

**Path Parameters**:

| Parameter | Type | Required | Description     |
|-----------|------|----------|-----------------|
| id        | int  | Yes      | Podcast ID      |

**Response** `200 OK`:

```json
{
  "id": 1,
  "name": "Python Bytes",
  "feed": "https://pythonbytes.fm/rss",
  "image": "https://example.com/cover.jpg",
  "language": 1,
  "total_episodes": 150,
  "episodes": [
    {
      "id": 10,
      "title": "Episode 300",
      "link": "https://pythonbytes.fm/300",
      "description": "A special episode...",
      "published": "2026-06-01T12:00:00Z",
      "enclosure": "https://audio.example.com/ep300.mp3",
      "podcast": {
        "id": 1,
        "name": "Python Bytes",
        "image": "https://example.com/cover.jpg"
      },
      "tags": [
        { "id": 5, "name": "python" }
      ]
    }
  ]
}
```

**Response** `404 Not Found`:

```json
{
  "detail": "Not found."
}
```

**Serializer**: `PodcastDetailSerializer`

---

## Create Podcast

**POST** `/api/podcasts/`

**Permissions**: IsEditorOrAdmin

**Request Body** `application/json`:

```json
{
  "name": "New Podcast",
  "feed": "https://newpodcast.com/rss"
}
```

| Field | Type   | Required | Constraints                    |
|-------|--------|----------|--------------------------------|
| name  | string | Yes      | Non-empty, max 128, unique     |
| feed  | string | Yes      | Valid URL format, unique       |

**Response** `201 Created` (new podcast):

```json
{
  "id": 43,
  "status": "created"
}
```

**Response** `200 OK` (podcast already exists):

```json
{
  "id": 1,
  "message": "este podcast já foi adicionado",
  "status": "none"
}
```

**Response** `400 Bad Request` (validation error):

```json
{
  "message": "o feed informado é inválido"
}
```

**Response** `401 Unauthorized` / `403 Forbidden`:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Behavior**:
1. Validate URL format synchronously (Django URLValidator)
2. Check for existing podcast by feed URL
3. If exists → return 200 with existing ID
4. If new → create podcast, enqueue `add_episode` Celery task, return 201

---

## Update Podcast (Full)

**PUT** `/api/podcasts/{id}/`

**Permissions**: IsEditorOrAdmin

**Path Parameters**:

| Parameter | Type | Required | Description     |
|-----------|------|----------|-----------------|
| id        | int  | Yes      | Podcast ID      |

**Request Body** `application/json`:

```json
{
  "name": "Updated Name",
  "feed": "https://newfeed.com/rss",
  "image": "https://example.com/new-cover.jpg",
  "language": 2
}
```

| Field    | Type   | Required | Constraints                    |
|----------|--------|----------|--------------------------------|
| name     | string | Yes      | Non-empty, max 128, unique     |
| feed     | string | Yes      | Valid URL format, unique       |
| image    | string | No       | Max 255 chars                  |
| language | int    | No       | Valid PodcastLanguage ID       |

**Response** `200 OK`:

```json
{
  "id": 1,
  "name": "Updated Name",
  "feed": "https://newfeed.com/rss",
  "image": "https://example.com/new-cover.jpg",
  "language": 2,
  "total_episodes": 0
}
```

**Behavior**:
1. Validate all fields via `PodcastUpdateSerializer`
2. If `feed` changed: delete existing episodes, enqueue `reimport_feed` task
3. Save podcast with updated fields
4. Return updated podcast data

**Response** `400 Bad Request` (feed uniqueness conflict):

```json
{
  "feed": ["podcast with this feed already exists."]
}
```

**Response** `404 Not Found` / `401 Unauthorized` / `403 Forbidden`: Same as Retrieve/Create.

**Serializer**: `PodcastUpdateSerializer`

---

## Update Podcast (Partial)

**PATCH** `/api/podcasts/{id}/`

**Permissions**: IsEditorOrAdmin

Same as PUT but all fields are optional. Only provided fields are updated.

If `feed` is provided and differs from current value, the same re-import behavior applies.

**Serializer**: `PodcastUpdateSerializer` (partial=True)

---

## Destroy Podcast

**DELETE** `/api/podcasts/{id}/`

**Permissions**: IsEditorOrAdmin

**Path Parameters**:

| Parameter | Type | Required | Description     |
|-----------|------|----------|-----------------|
| id        | int  | Yes      | Podcast ID      |

**Response** `204 No Content`: Empty response body.

**Behavior**:
1. Delete podcast record
2. CASCADE deletes all associated episodes and tag relationships
3. Return 204

**Response** `404 Not Found` / `401 Unauthorized` / `403 Forbidden`: Same as above.

---

## Error Response Format

All error responses follow DRF standard format:

```json
{
  "detail": "Error message"
}
```

Or for validation errors:

```json
{
  "field_name": ["Error message for field."]
}
```

## Pagination

All list endpoints use `PageNumberPagination` with `PAGE_SIZE=10`:

```json
{
  "count": 42,
  "next": "http://host/api/podcasts/?page=2",
  "previous": null,
  "results": [...]
}
```
