# Quickstart: Listagem de Podcasts

**Feature**: 001-podcast-listing
**Date**: 2026-06-11

## Prerequisites

- Docker Compose services running: `docker compose up -d`
- Backend migrations applied: `docker compose exec backend uv run python manage.py migrate`
- Frontend dev server: `npm run dev` (from `frontend/`)
- Seed data with at least 25 podcasts across multiple languages (use `docker compose exec backend uv run python manage.py shell` or the Django admin)

## Validation Scenarios

### 1. API: List podcasts with default pagination

```bash
# Should return first 20 podcasts (page_size=20)
curl -s http://localhost:8000/api/podcasts/ | python3 -m json.tool
```

**Expected**: Response contains `count`, `next`, `previous`, `results`. `results` is an array of max 20 items. Each item has `id`, `name`, `feed`, `image`, `language` (as object `{id, code, name}`), `total_episodes`.

### 2. API: Search podcasts by name

```bash
curl -s "http://localhost:8000/api/podcasts/?search=nerd" | python3 -m json.tool
```

**Expected**: Only podcasts whose name contains "nerd" (case-insensitive) appear in `results`.

### 3. API: Filter podcasts by language

```bash
# First, get a valid language ID
curl -s http://localhost:8000/api/languages/ | python3 -m json.tool

# Then filter by that language ID
curl -s "http://localhost:8000/api/podcasts/?language=1" | python3 -m json.tool
```

**Expected**: Only podcasts with `language.id` matching the filter value appear in results.

### 4. API: List all languages

```bash
curl -s http://localhost:8000/api/languages/ | python3 -m json.tool
```

**Expected**: Array of language objects with `id`, `code`, `name`. Not paginated (no `count`/`next`/`previous` wrapper).

### 5. API: Pagination - page 2

```bash
curl -s "http://localhost:8000/api/podcasts/?page=2" | python3 -m json.tool
```

**Expected**: `previous` is not null, `results` contain items 21-40, `next` may be null or point to page 3.

### 6. API: Combined search + language filter

```bash
curl -s "http://localhost:8000/api/podcasts/?search=dev&language=2" | python3 -m json.tool
```

**Expected**: Results are filtered by both criteria — only podcasts matching both the search term and language ID.

### 7. Frontend: Podcast listing page loads

```bash
# Open in browser: http://localhost:3000/podcasts
```

**Expected**: Page renders with:
- A search input field at the top
- A language filter dropdown/chips
- A grid of podcast cards (name, cover image, language name, episode count)
- Pagination controls (Anterior/Próximo) at the bottom when >20 podcasts

### 8. Frontend: Search filters results

**Expected**: Typing in the search field filters podcast cards after 300ms debounce. Clearing the field restores full list.

### 9. Frontend: Language filter works

**Expected**: Selecting a language from the dropdown filters results to that language. Selecting "All" or clearing the filter restores full list.

### 10. Frontend: Pagination navigation

**Expected**: Clicking "Próximo" loads the next page. "Anterior" returns to the previous page. Buttons are disabled at first/last page boundaries.

### 11. Frontend: Empty state

```bash
# Search for a non-existent podcast name
```

**Expected**: "Nenhum podcast encontrado para [termo]" message is shown. The UI does not break.

### 12. Frontend: Error state

```bash
# Stop the backend: docker compose stop backend
# Reload /podcasts page
```

**Expected**: An error message is shown with a "Tentar novamente" (retry) button. Clicking retry after restarting the backend restores the listing.

## Run Automated Tests

### Backend
```bash
docker compose exec backend uv run pytest backend/podcasts/tests/ -v
```

### Frontend
```bash
cd frontend && npm test -- --run
```

**Expected**: All existing tests pass. New tests for language filtering, language endpoint, and frontend podcast components pass.
