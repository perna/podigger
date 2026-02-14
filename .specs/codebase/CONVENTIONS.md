# Code Conventions

## Naming Conventions

### Files (Backend - Python)

**Pattern:** snake_case para arquivos Python
**Examples:**
- `podcast_service.py`
- `feed_parser.py`
- `test_api.py`
- `0001_initial.py` (migrations)

### Files (Frontend - TypeScript)

**Pattern:** PascalCase para componentes, camelCase para utilitários
**Examples:**
- `Button.tsx`
- `Card.tsx`
- `page.tsx` (Next.js convention)
- `utils.ts`

### Functions/Methods (Python)

**Pattern:** snake_case
**Examples:**
```python
def create_podcast(name: str, feed: str) -> PodcastCreateResult:
def parse_feed(url: str, default_image: str = "...") -> dict[str, Any]:
def is_valid_feed(url: str) -> bool:
```

### Functions/Methods (TypeScript)

**Pattern:** camelCase
**Examples:**
```typescript
export default function Home() { }
function handleClick() { }
```

### Variables

**Pattern:** snake_case (Python), camelCase (TypeScript)
**Python examples:**
```python
feed_url = "..."
podcast_obj = Podcast.objects.filter(...)
published_dt = timezone.datetime.fromtimestamp(...)
```

**TypeScript examples:**
```typescript
const jakarta = Plus_Jakarta_Sans({ ... })
```

### Constants

**Pattern:** UPPER_SNAKE_CASE (Python), UPPER_SNAKE_CASE ou const (TypeScript)
**Python examples:**
```python
_TAG_RE = re.compile(r"(<!--.*?-->|<[^>]*>)", re.DOTALL)
```

### Classes

**Pattern:** PascalCase
**Examples:**
```python
class PodcastService:
class EpisodeUpdater:
class PodcastViewSet(viewsets.ModelViewSet):
```

### Django Models

**Pattern:** PascalCase singular
**Examples:**
- `Podcast`
- `Episode`
- `Tag`
- `PopularTerm`
- `TopicSuggestion`

## Code Organization

### Import/Dependency Declaration (Python)

**Pattern:** Agrupado por tipo (stdlib, third-party, local) com linha em branco entre grupos
**Example:**
```python
import logging
import re
from typing import Any

import feedparser

from podcasts.models import Episode, Podcast
```

### Import/Dependency Declaration (TypeScript)

**Pattern:** Agrupado por tipo (React, third-party, local)
**Example:**
```typescript
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
```

### File Structure (Python)

**Pattern:**
1. Imports
2. Constants/Module-level variables
3. Helper functions (private com `_` prefix)
4. Classes
5. Public functions

**Example:**
```python
# Imports
import logging
from typing import Any

# Constants
logger = logging.getLogger(__name__)
_TAG_RE = re.compile(...)

# Helper functions
def _strip_html(text: str | None) -> str:
    ...

# Public functions
def parse_feed(url: str) -> dict[str, Any]:
    ...
```

### File Structure (React Components)

**Pattern:**
1. Imports
2. Types/Interfaces (if needed)
3. Component definition
4. Export

**Example:**
```typescript
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div>...</div>
  );
}
```

## Type Safety/Documentation

### Python Type Hints

**Approach:** Type hints obrigatórios em funções públicas, TypedDict para retornos estruturados
**Examples:**
```python
def create_podcast(name: str, feed: str) -> PodcastCreateResult:
def parse_feed(url: str, default_image: str = "...") -> dict[str, Any]:
def is_valid_feed(url: str) -> bool:

class PodcastCreateResult(TypedDict):
    id: int | None
    status: str
    message: str | None
```

### TypeScript Types

**Approach:** TypeScript strict mode, tipos explícitos quando necessário
**Examples:**
```typescript
export const metadata: Metadata = { ... }
children: React.ReactNode
```

### Docstrings (Python)

**Style:** Google style docstrings
**Examples:**
```python
def parse_feed(url: str, default_image: str = "...") -> dict[str, Any]:
    """Parse an RSS/Atom feed URL and produce a normalized feed dictionary.

    The returned dictionary contains:
    - title: feed title or empty string
    - language: feed language lowercased or empty string
    - image: feed image href or the provided default image
    - items: list of item dictionaries

    Parameters:
        url (str): The feed URL to parse.
        default_image (str): Fallback image URL used when the feed has no image.

    Returns:
        dict[str, Any]: A normalized feed dictionary. Returns an empty dict on parse errors.
    """
```

## Error Handling

### Python Pattern

**Approach:** Try-except com logging, retorno de valores padrão ou dicts de erro
**Examples:**
```python
try:
    d = feedparser.parse(url)
    return result
except Exception as exc:
    logger.exception("Failed to parse feed %s: %s", url, exc)
    return {}

# Service layer
if not name or not feed:
    return {
        "id": None,
        "status": "error",
        "message": "o nome e o feed são obrigatórios",
    }
```

### Database Transactions

**Pattern:** Atomic transactions para operações críticas
**Example:**
```python
with transaction.atomic():
    podcast, created = Podcast.objects.get_or_create(
        feed=feed, defaults={"name": name}
    )
```

## Comments/Documentation

### When to Comment

**Style:** Comentários explicam "por quê", não "o quê"
**Examples:**
```python
# Rough HTML tag stripper (keeps text content). For more robust needs consider BeautifulSoup.
_TAG_RE = re.compile(r"(<!--.*?-->|<[^>]*>)", re.DOTALL)

# Update popular terms
term, created = PopularTerm.objects.get_or_create(...)

# Config for Portuguese search
config = "portuguese"
```

### Code Comments (TypeScript)

**Style:** JSDoc para componentes públicos, inline comments quando necessário
**Example:**
```typescript
/**
 * Showcase page for Podigger UI Components (Phase 1).
 */
export default function Home() { ... }
```

## Testing Conventions

### Test File Naming

**Pattern:** `test_*.py` prefix
**Examples:**
- `test_api.py`
- `test_models.py`
- `test_parser.py`
- `test_updater.py`

### Test Class Naming

**Pattern:** `Test<Feature>` classes com `setup_method()`
**Example:**
```python
@pytest.mark.django_db
class TestPodcastAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_list_podcasts(self):
        ...
```

### Test Method Naming

**Pattern:** `test_<action>_<expected_result>`
**Examples:**
- `test_list_podcasts`
- `test_filter_episodes_by_podcast`
- `test_search_episodes`

## Django-Specific Conventions

### Model Fields

**Pattern:** Campos com defaults explícitos, blank/null quando apropriado
**Example:**
```python
name = models.CharField(max_length=128, unique=True)
image = models.CharField(max_length=255, blank=True, null=True, default="...")
total_episodes = models.IntegerField(default=0)
```

### ViewSet Actions

**Pattern:** Custom actions com decorator `@action`
**Example:**
```python
@action(detail=False, methods=["get"])
def recent(self, request):
    """Return the six most recently created podcasts."""
    ...
```

### URL Routing

**Pattern:** Router DRF para ViewSets, paths explícitos para custom views
**Example:**
```python
router = routers.DefaultRouter()
router.register(r"podcasts", views.PodcastViewSet)
router.register(r"episodes", views.EpisodeViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
```

## Linting Configuration

**Tool:** Ruff (substitui flake8, black, isort)
**Config:** `pyproject.toml` com regras extensivas
**Key rules:**
- Line length: 88
- Target: Python 3.12
- Docstring style: Google
- Max complexity: 10
- Ignores: D100 (module docstrings), D104 (package docstrings)

## Git / Commits

**Pattern:** [Conventional Commits](https://www.conventionalcommits.org/) com mensagens em **inglês**.

**Format:** `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`

**Examples:**
```
feat(api): add episode search endpoint
fix(parser): handle malformed RSS dates
docs(readme): update setup instructions
chore(deps): bump django to 5.0
ci: add lint job to workflow
```
