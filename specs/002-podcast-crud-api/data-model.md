# Data Model: CRUD de Podcasts

**Date**: 2026-06-13 | **Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Entities

### Podcast (existing — no schema changes)

| Field            | Type              | Constraints          | Notes                                    |
|------------------|-------------------|----------------------|------------------------------------------|
| id               | BigAutoField      | PK                   | Auto-generated                           |
| name             | CharField(128)    | unique, required     | Podcast display name                     |
| feed             | URLField          | unique, required     | RSS/Atom feed URL                        |
| image            | CharField(255)    | nullable, default    | Cover image URL or static fallback       |
| language         | FK → PodcastLanguage | nullable, SET_NULL | Language reference                       |
| total_episodes   | IntegerField      | default=0            | Computed count, updated by async task     |
| created_at       | DateTimeField     | auto                 | From BaseModel                           |
| updated_at       | DateTimeField     | auto                 | From BaseModel                           |

**Relationships**:
- 1:N → Episode (related_name="episodes", on_delete=CASCADE)
- N:1 → PodcastLanguage (on_delete=SET_NULL)

**Validation rules**:
- `name`: required, max 128 chars, unique across all podcasts
- `feed`: required, valid URL format, unique across all podcasts
- `image`: optional, max 255 chars
- `language`: optional FK reference

### PodcastLanguage (existing — no schema changes)

| Field      | Type           | Constraints      | Notes                    |
|------------|----------------|------------------|--------------------------|
| id         | BigAutoField   | PK               | Auto-generated           |
| code       | CharField(10)  | default="pt"     | ISO language code        |
| name       | CharField(60)  | default="português" | Human-readable name   |
| created_at | DateTimeField  | auto             | From BaseModel           |
| updated_at | DateTimeField  | auto             | From BaseModel           |

### Episode (existing — no schema changes)

| Field       | Type              | Constraints         | Notes                              |
|-------------|-------------------|---------------------|------------------------------------|
| id          | BigAutoField      | PK                  | Auto-generated                     |
| title       | CharField(1024)   | required            | Episode title                      |
| link        | URLField          | unique, required    | Episode permalink                  |
| description | TextField         | nullable            | Episode description                |
| published   | DateTimeField     | nullable            | Publication date                   |
| enclosure   | CharField(1024)   | nullable            | Audio file URL                     |
| to_json     | JSONField         | nullable            | Raw feed entry data                |
| podcast     | FK → Podcast      | CASCADE, required   | Parent podcast                     |
| tags        | M2M → Tag         | blank               | Episode tags                       |

### Tag (existing — no schema changes)

| Field      | Type           | Constraints  | Notes          |
|------------|----------------|--------------|----------------|
| id         | BigAutoField   | PK           | Auto-generated |
| name       | CharField(255) | unique       | Tag label      |
| created_at | DateTimeField  | auto         | From BaseModel |
| updated_at | DateTimeField  | auto         | From BaseModel |

## State Transitions

### Podcast Lifecycle

```text
[Created via POST] → [Active with episodes after async import]
       ↓                        ↓
[Feed invalid] → [Active without episodes]
       ↓                        ↓
[Feed updated via PUT/PATCH] → [Episodes deleted] → [Re-import enqueued] → [Active with new episodes]
       ↓
[Deleted via DELETE] → [CASCADE removes all episodes]
```

### Feed Change Flow

```text
1. PUT/PATCH with new feed URL
2. Validate URL format (sync)
3. Validate feed uniqueness (sync)
4. Delete existing episodes (sync)
5. Update podcast.feed (sync)
6. Enqueue reimport_feed task (async)
7. Task imports episodes from new feed
```

## Migrations

No new migrations required. All entities and fields already exist in the current schema.
