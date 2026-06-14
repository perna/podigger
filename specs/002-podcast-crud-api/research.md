# Research: CRUD de Podcasts

**Date**: 2026-06-13 | **Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Research Task 1: Existing PodcastViewSet Capabilities

**Question**: What CRUD operations does the existing `PodcastViewSet` already support, and what is missing?

**Findings**:
- `PodcastViewSet` extends `viewsets.ModelViewSet`, which provides all CRUD operations by default: `list`, `retrieve`, `create`, `update`, `partial_update`, `destroy`.
- **List**: Already works with pagination (page_size=10) and search by name (`search_fields = ["name"]`).
- **Retrieve**: Already works, returns `PodcastDetailSerializer` with nested episodes.
- **Create**: Custom implementation via `PodcastService.create_podcast` that validates feed synchronously (fetches RSS), checks for duplicates, and triggers async episode import.
- **Update**: Uses default DRF behavior — no custom logic for feed changes or re-import.
- **Destroy**: Uses default DRF behavior — CASCADE delete works automatically via model FK.
- **Permissions**: Already configured — `AllowAny` for read actions, `IsEditorOrAdmin` for write actions.

**Decision**: Extend the existing viewset with custom `update`/`partial_update` methods to detect feed changes and trigger re-import. Refactor `create` to use async RSS validation.

**Rationale**: Minimizes code duplication and leverages existing DRF infrastructure. The viewset already has the right permission model and pagination.

**Alternatives considered**:
- Creating separate APIViews for each operation → rejected due to code duplication and loss of DRF router benefits.
- Using a custom ViewSet instead of ModelViewSet → rejected because ModelViewSet already provides the needed actions.

---

## Research Task 2: Feed Validation Strategy

**Question**: How should feed URL validation work for create and update operations?

**Findings**:
- Current `is_valid_feed(url)` in `feed_parser.py` fetches and parses the RSS feed synchronously using `feedparser.parse(url)`, checking for bozo errors.
- This blocks the HTTP request until the feed is fetched and parsed, which can take several seconds for slow or large feeds.
- Per spec clarification (Q1), feed validation should be split:
  - **Synchronous**: Validate URL format only (is it a valid URL?).
  - **Asynchronous**: Validate RSS content (is it a valid feed?) via Celery task.

**Decision**: Add a new helper `is_valid_url_format(url)` that uses Django's `URLValidator` for fast synchronous validation. Keep `is_valid_feed(url)` for async use in Celery tasks. Refactor `PodcastService.create_podcast` to use `is_valid_url_format` synchronously and let the existing `add_episode` task handle RSS validation (it already fails gracefully if the feed is invalid).

**Rationale**: Keeps the API responsive (SC-002: create <3s) while still validating feed content asynchronously. The existing `add_episode` task already handles invalid feeds by logging and returning early.

**Alternatives considered**:
- Keeping synchronous RSS validation → rejected because it blocks the API response and violates SC-002.
- Skipping RSS validation entirely → rejected because invalid feeds would accumulate in the database with zero episodes.

---

## Research Task 3: Feed Update and Re-import Strategy

**Question**: How should the system handle feed URL changes during podcast updates?

**Findings**:
- Per spec clarification (Q2), the feed field is mutable and updating it should trigger a full re-import.
- The existing `EpisodeUpdater.populate()` method processes feeds by URL, looking up podcasts via `Podcast.objects.filter(feed=feed_url)`.
- If the feed URL changes, the old episodes (linked to the old feed) need to be removed, and new episodes imported from the new feed.
- The `Episode` model has `on_delete=CASCADE` on the `podcast` FK, but this only applies when the podcast itself is deleted, not when the feed changes.

**Decision**: Add a new service method `PodcastService.update_podcast_feed(podcast, new_feed_url)` that:
1. Deletes all existing episodes for the podcast.
2. Updates the podcast's feed URL.
3. Enqueues a new `reimport_feed` Celery task to import episodes from the new feed.

Add a new Celery task `reimport_feed(podcast_id)` that uses `EpisodeUpdater` to populate episodes from the new feed.

**Rationale**: Ensures data consistency — old episodes from the previous feed are removed, and new episodes are imported asynchronously. The podcast remains accessible during re-import (with zero episodes temporarily).

**Alternatives considered**:
- Keeping old episodes and adding new ones → rejected because episodes from different feeds would be mixed, violating data integrity.
- Synchronous re-import → rejected because it would block the API response for large feeds.

---

## Research Task 4: Language Filtering

**Question**: How should language filtering work on the list endpoint?

**Findings**:
- The `Podcast` model has a FK to `PodcastLanguage` (field name: `language`).
- `PodcastLanguage` has fields `code` (e.g., "pt") and `name` (e.g., "português").
- DRF's `DjangoFilterBackend` is already configured globally in `settings.py`.
- The `PodcastViewSet` currently only has `filter_backends = [filters.SearchFilter]` for name search.

**Decision**: Add `DjangoFilterBackend` to `PodcastViewSet.filter_backends` and set `filterset_fields = ["language"]` to enable filtering by language ID (e.g., `?language=1`). Optionally, add a custom filter to support filtering by language code (e.g., `?language_code=pt`).

**Rationale**: Leverages existing DRF infrastructure with minimal code. Filtering by language ID is the simplest approach and consistent with how episode filtering works (`filterset_fields = ["podcast"]`).

**Alternatives considered**:
- Custom FilterSet class with language code support → rejected for now due to added complexity; can be added later if needed.
- Manual filtering in `get_queryset` → rejected because it duplicates DRF's built-in functionality.

---

## Research Task 5: Serializer Strategy for Updates

**Question**: Should the existing serializers be reused for updates, or should a new serializer be created?

**Findings**:
- `PodcastListSerializer`: Used for list actions, includes `id`, `name`, `feed`, `image`, `language`, `total_episodes`. All fields are read-only by default (ModelSerializer).
- `PodcastDetailSerializer`: Used for retrieve/create/update, includes the same fields plus nested `episodes`. Also read-only by default.
- For updates, we need writable fields for `name`, `feed`, `image`, and `language`. The `total_episodes` field should remain read-only (it's computed).
- The `feed` field needs custom validation to check for uniqueness and trigger re-import if changed.

**Decision**: Create a new `PodcastUpdateSerializer` with writable fields for `name`, `feed`, `image`, and `language`. The `feed` field will have a custom validator to check uniqueness (excluding the current podcast). The viewset's `get_serializer_class` will return this serializer for `update` and `partial_update` actions.

**Rationale**: Separates update logic from list/detail serializers, making it easier to add custom validation and handle feed changes. Keeps the existing serializers unchanged for backward compatibility.

**Alternatives considered**:
- Reusing `PodcastDetailSerializer` with writable fields → rejected because it would require conditional logic and could break existing create behavior.
- Using a generic ModelSerializer → rejected because it doesn't handle the feed change detection and re-import logic.

---

## Research Task 6: Permission Enforcement

**Question**: How are permissions currently enforced, and what tests are needed?

**Findings**:
- `PodcastViewSet.get_permissions()` returns `[AllowAny()]` for `list` and `retrieve` actions, and `[IsEditorOrAdmin()]` for all other actions.
- `IsEditorOrAdmin` checks `request.user.is_authenticated and request.user.role in ("editor", "admin")`.
- The `User` model has roles: `admin`, `editor`, `reader`.
- Existing tests in `test_views_features.py` use `force_authenticate` with an editor user.

**Decision**: No changes to permission logic. Add comprehensive tests covering:
- Anonymous users can list and retrieve (200).
- Anonymous users cannot create, update, or delete (401/403).
- Readers cannot create, update, or delete (403).
- Editors and admins can create, update, and delete (201/200/204).

**Rationale**: The existing permission model is correct and well-tested. The new tests ensure full coverage of the permission matrix for all CRUD operations.

**Alternatives considered**: None — the existing implementation is correct.

---

## Summary of Decisions

| Decision Area          | Choice                                                                 |
|------------------------|------------------------------------------------------------------------|
| Viewset approach       | Extend existing `PodcastViewSet` with custom update logic              |
| Feed validation        | Synchronous URL format check; async RSS content validation via Celery  |
| Feed update behavior   | Delete old episodes, update feed URL, enqueue re-import task           |
| Language filtering     | Add `DjangoFilterBackend` with `filterset_fields = ["language"]`       |
| Update serializer      | New `PodcastUpdateSerializer` with writable fields and feed validation |
| Permission model       | No changes; add comprehensive test coverage                            |
