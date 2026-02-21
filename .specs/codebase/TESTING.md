# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** pytest 7.0.0+ with pytest-django 4.0.0+
**Mocking:** pytest-mock 3.10.0+
**E2E:** Not configured yet
**Coverage:** Not configured yet

## Test Organization

**Location:** `backend/podcasts/tests/`
**Naming:** `test_*.py` prefix
**Structure:** Organized by feature/layer (api, models, parser, updater, views)

```
backend/podcasts/tests/
├── __init__.py
├── test_api.py              # API endpoint tests
├── test_models.py           # Model tests
├── test_parser.py           # Feed parser tests
├── test_updater.py          # Episode updater tests
└── test_views_features.py  # Feature-level view tests
```

## Testing Patterns

### Unit Tests

**Approach:** Pytest with class-based organization and setup methods
**Location:** `backend/podcasts/tests/test_*.py`
**Pattern:**
- Class per feature/endpoint (`TestPodcastAPI`, `TestEpisodeAPI`)
- `setup_method()` for test fixtures
- `@pytest.mark.django_db` decorator for database access
- Descriptive test names (`test_<action>_<expected_result>`)

**Example:**
```python
@pytest.mark.django_db
class TestPodcastAPI:
    def setup_method(self):
        """Attach a new APIClient instance to self for use in test methods."""
        self.client = APIClient()

    def test_list_podcasts(self):
        Podcast.objects.create(name="Pod 1", feed="http://feed1.com")
        response = self.client.get("/api/podcasts/")
        assert response.status_code == 200
        assert len(response.data) == 1
```

### Integration Tests

**Approach:** Full stack tests with database and API client
**Location:** `backend/podcasts/tests/test_api.py`, `test_views_features.py`
**Pattern:**
- Test complete request/response cycle
- Use DRF's APIClient
- Create test data in `setup_method()`
- Verify HTTP status codes and response structure

**Example:**
```python
@pytest.mark.django_db
class TestEpisodeAPI:
    def setup_method(self):
        self.client = APIClient()
        self.podcast = Podcast.objects.create(name="Pod 1", feed="http://feed1.com")
        self.episode1 = Episode.objects.create(
            podcast=self.podcast,
            title="Ep 1",
            link="http://link1.com",
            description="A great episode about python",
        )

    def test_filter_episodes_by_podcast(self):
        other_podcast = Podcast.objects.create(name="Pod 2", feed="http://feed2.com")
        Episode.objects.create(
            podcast=other_podcast, title="Ep 3", link="http://link3.com"
        )

        response = self.client.get(f"/api/episodes/?podcast={self.podcast.id}")
        assert response.status_code == 200
        assert len(response.data) == 2
```

### E2E Tests

**Approach:** Not implemented yet
**Location:** N/A
**Future consideration:** Could use Playwright or Cypress for frontend E2E tests

## Test Execution

### Commands

**Run all tests:**
```bash
pytest
```

**Run specific test file:**
```bash
pytest podcasts/tests/test_api.py
```

**Run specific test class:**
```bash
pytest podcasts/tests/test_api.py::TestPodcastAPI
```

**Run specific test:**
```bash
pytest podcasts/tests/test_api.py::TestPodcastAPI::test_list_podcasts
```

**Run with verbose output:**
```bash
pytest -v
```

**Run with coverage (when configured):**
```bash
pytest --cov=podcasts
```

### Configuration

**File:** `backend/pyproject.toml`
**Key settings:**
```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings"
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short --strict-markers"
testpaths = ["podcasts/tests"]
```

## Test Database

**Approach:** Pytest-django creates a test database automatically
**Database:** PostgreSQL (same as production, but isolated)
**Cleanup:** Automatic rollback after each test
**Fixtures:** Use `@pytest.mark.django_db` decorator

## Mocking Strategy

**Tool:** pytest-mock (included but not heavily used yet)
**Approach:** Mock external dependencies (RSS feeds, HTTP requests)
**Example use cases:**
- Mock `feedparser.parse()` for feed parser tests
- Mock `requests.get()` for external API calls
- Mock Celery tasks for synchronous testing

## Test Data Management

### Fixtures

**Approach:** Create test data in `setup_method()` or pytest fixtures
**Pattern:**
```python
def setup_method(self):
    self.client = APIClient()
    self.podcast = Podcast.objects.create(name="Test Pod", feed="http://test.com")
```

### Fake Data

**Tool:** Faker 19.9.0 (installed)
**Usage:** Management commands for seeding
**Commands:**
- `python manage.py seed_fake_podcasts` - Create fake test data
- `python manage.py clear_fake_seed` - Remove fake data

### Real Data

**Command:** `python manage.py seed_podcasts` - Seed real podcast feeds
**Note:** For development/staging, not for tests

## Coverage Targets

**Current:** Not measured yet
**Goals:** Not defined yet
**Enforcement:** Not automated yet

**Recommendation:** Add coverage reporting with pytest-cov:
```bash
pip install pytest-cov
pytest --cov=podcasts --cov-report=html
```

## Test Isolation

**Database:** Each test runs in a transaction that's rolled back
**Redis:** Not isolated yet (potential issue for Celery tests)
**Celery:** Tasks run synchronously in tests (CELERY_TASK_ALWAYS_EAGER)

## Known Test Limitations

### Full-Text Search Tests

**Issue:** FTS tests may fail on SQLite (requires PostgreSQL)
**Workaround:** Tests check status code primarily, not full FTS behavior
**Example:**
```python
def test_search_episodes(self):
    # Note: Full text search might require specific DB setup
    response = self.client.get("/api/episodes/?q=python")
    assert response.status_code == 200
    # If FTS is working and data is indexed, it should return 1.
    # If not (e.g. sqlite), it might return empty or error.
```

### Async Task Testing

**Issue:** Celery tasks need special handling in tests
**Current approach:** Not extensively tested yet
**Future improvement:** Use `CELERY_TASK_ALWAYS_EAGER = True` in test settings

## Frontend Testing

**Status:** Implemented (Vitest + React Testing Library)
**Framework:** Vitest 4.x, @testing-library/react, jsdom
**Package.json scripts:** `"test": "vitest run"`, `"test:watch": "vitest"`

**Location:** `frontend/src/**/__tests__/*.test.{ts,tsx}`

**Coverage:**
- `lib/__tests__/api.test.ts` — fetchEpisodes (query, page, error handling)
- `components/home/__tests__/EmptyState.test.tsx` — no-results, no-episodes, error, retry
- `components/home/__tests__/EpisodeCard.test.tsx` — title, podcast, links, placeholder
- `components/home/__tests__/EpisodeList.test.tsx` — loading, results, empty, error, pagination
- `components/home/__tests__/SearchHeader.test.tsx` — input, search button, callbacks
- `components/home/__tests__/BottomNav.test.tsx` — nav items, active state

**Run:** `cd frontend && npm run test` or `make frontend-test`

## CI/CD Testing

**Status:** Not configured yet (branch `chore/setup-ci-tests` exists)
**Future implementation:**
- GitHub Actions or similar
- Run tests on every PR
- Coverage reporting
- Linting checks (ruff)
