# Graph Report - .  (2026-06-26)

## Corpus Check
- 173 files · ~53,309 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 917 nodes · 1403 edges · 107 communities (79 shown, 28 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend Pages & Routes|Frontend Pages & Routes]]
- [[_COMMUNITY_Backend Test Suite & Auth|Backend Test Suite & Auth]]
- [[_COMMUNITY_API Integration Tests|API Integration Tests]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Tooling & Conventions|Tooling & Conventions]]
- [[_COMMUNITY_Database Base Models|Database Base Models]]
- [[_COMMUNITY_Feed Parsing & Validation|Feed Parsing & Validation]]
- [[_COMMUNITY_Auth Permissions & Registration|Auth Permissions & Registration]]
- [[_COMMUNITY_Frontend UI Utilities|Frontend UI Utilities]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Django Admin|Django Admin]]
- [[_COMMUNITY_Episode UI Components|Episode UI Components]]
- [[_COMMUNITY_Podcast Refresh Orchestration|Podcast Refresh Orchestration]]
- [[_COMMUNITY_Management Commands|Management Commands]]
- [[_COMMUNITY_Episode Pagination & Serialization|Episode Pagination & Serialization]]
- [[_COMMUNITY_Frontend Home & Navigation|Frontend Home & Navigation]]
- [[_COMMUNITY_Podcasts App Models|Podcasts App Models]]
- [[_COMMUNITY_Refresh Service Helpers|Refresh Service Helpers]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Celery Task Infrastructure|Celery Task Infrastructure]]
- [[_COMMUNITY_Backend Core Dependencies|Backend Core Dependencies]]
- [[_COMMUNITY_Frontend Hooks & Pagination|Frontend Hooks & Pagination]]
- [[_COMMUNITY_Model Unit Tests|Model Unit Tests]]
- [[_COMMUNITY_Frontend Setup Scripts|Frontend Setup Scripts]]
- [[_COMMUNITY_Next.js Proxy Routes|Next.js Proxy Routes]]
- [[_COMMUNITY_Backend ProdDev Dependencies|Backend Prod/Dev Dependencies]]
- [[_COMMUNITY_Production Infrastructure|Production Infrastructure]]
- [[_COMMUNITY_Admin User Management API|Admin User Management API]]
- [[_COMMUNITY_Role-Based Permissions|Role-Based Permissions]]
- [[_COMMUNITY_DB Optimization Spec (003)|DB Optimization Spec (003)]]
- [[_COMMUNITY_Database Seeding Command|Database Seeding Command]]
- [[_COMMUNITY_Podigger Project Identity|Podigger Project Identity]]
- [[_COMMUNITY_Episode & Podcast Data Layer|Episode & Podcast Data Layer]]
- [[_COMMUNITY_Podcast ViewSet Tests|Podcast ViewSet Tests]]
- [[_COMMUNITY_JWT Token Serializer|JWT Token Serializer]]
- [[_COMMUNITY_Serializer Meta Classes|Serializer Meta Classes]]
- [[_COMMUNITY_Pytest Configuration & Fixtures|Pytest Configuration & Fixtures]]
- [[_COMMUNITY_Episode List API|Episode List API]]
- [[_COMMUNITY_Podcast ViewSet|Podcast ViewSet]]
- [[_COMMUNITY_Cookie Auth Property Tests|Cookie Auth Property Tests]]
- [[_COMMUNITY_Search Read-Only Guard Tests|Search Read-Only Guard Tests]]
- [[_COMMUNITY_View Performance Tests|View Performance Tests]]
- [[_COMMUNITY_Django App Configuration|Django App Configuration]]
- [[_COMMUNITY_Custom User Manager|Custom User Manager]]
- [[_COMMUNITY_Podcast Card UI Component|Podcast Card UI Component]]
- [[_COMMUNITY_Architecture History & Migration|Architecture History & Migration]]
- [[_COMMUNITY_Release & Versioning Tooling|Release & Versioning Tooling]]
- [[_COMMUNITY_Health Check Endpoint|Health Check Endpoint]]
- [[_COMMUNITY_Globe & Internationalization|Globe & Internationalization]]
- [[_COMMUNITY_Cookie JWT Authentication|Cookie JWT Authentication]]
- [[_COMMUNITY_Test Factory Classes|Test Factory Classes]]
- [[_COMMUNITY_Backend README & Tooling|Backend README & Tooling]]
- [[_COMMUNITY_Nginx Reverse Proxy|Nginx Reverse Proxy]]
- [[_COMMUNITY_Celery App Init|Celery App Init]]
- [[_COMMUNITY_Search Header Component|Search Header Component]]
- [[_COMMUNITY_Episode Search Manager|Episode Search Manager]]
- [[_COMMUNITY_Popular Term Model|Popular Term Model]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]
- [[_COMMUNITY_Refresh All & Counter Reset|Refresh All & Counter Reset]]
- [[_COMMUNITY_Frontend Bug Condition Test|Frontend Bug Condition Test]]
- [[_COMMUNITY_Frontend Preservation Test|Frontend Preservation Test]]
- [[_COMMUNITY_Optimization Guard Tests|Optimization Guard Tests]]
- [[_COMMUNITY_Episode Updater Tests|Episode Updater Tests]]
- [[_COMMUNITY_Accounts Initial Migration|Accounts Initial Migration]]
- [[_COMMUNITY_Django Management Entry|Django Management Entry]]
- [[_COMMUNITY_Next.js Bundle Config|Next.js Bundle Config]]
- [[_COMMUNITY_Vercel Logo Asset|Vercel Logo Asset]]
- [[_COMMUNITY_Auth Proxy Handler|Auth Proxy Handler]]
- [[_COMMUNITY_Podcasts Initial Migration|Podcasts Initial Migration]]
- [[_COMMUNITY_Podcasts Commands Package|Podcasts Commands Package]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]
- [[_COMMUNITY_Makefile & Local Dev Setup|Makefile & Local Dev Setup]]
- [[_COMMUNITY_Backend Dependency Groups|Backend Dependency Groups]]
- [[_COMMUNITY_Dependabot Labels Script|Dependabot Labels Script]]
- [[_COMMUNITY_UV Setup Script|UV Setup Script]]
- [[_COMMUNITY_Podcasts Management Package|Podcasts Management Package]]
- [[_COMMUNITY_Enable PG Trigram Migration|Enable PG Trigram Migration]]
- [[_COMMUNITY_Add Search Index Migration|Add Search Index Migration]]
- [[_COMMUNITY_PopularTerm Index Migration|PopularTerm Index Migration]]
- [[_COMMUNITY_Composite Indexes Migration|Composite Indexes Migration]]
- [[_COMMUNITY_Backend Django Deps|Backend Django Deps]]
- [[_COMMUNITY_Frontend Dev Deps|Frontend Dev Deps]]
- [[_COMMUNITY_Frontend Prod Deps|Frontend Prod Deps]]
- [[_COMMUNITY_GitHub Actions Deps|GitHub Actions Deps]]
- [[_COMMUNITY_Podigger Backend|Podigger Backend]]
- [[_COMMUNITY_Semantic Versioning Guide|Semantic Versioning Guide]]
- [[_COMMUNITY_Next.js Logo Asset|Next.js Logo Asset]]

## God Nodes (most connected - your core abstractions)
1. `User` - 26 edges
2. `Podcast` - 24 edges
3. `PopularTerm` - 23 edges
4. `Icon()` - 22 edges
5. `PodcastLanguage` - 21 edges
6. `Episode` - 21 edges
7. `TopicSuggestion` - 21 edges
8. `RefreshService` - 21 edges
9. `PodcastViewSet` - 19 edges
10. `UserFactory` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Ruff Configuration (line-length 88, py312, comprehensive rule set)` --implements--> `CI test-backend job (pytest, ruff, migrations)`  [INFERRED]
  GEMINI.md → .github/workflows/ci.yml
- `Pre-commit Ruff Hook (lint + format)` --conceptually_related_to--> `CI test-backend job (pytest, ruff, migrations)`  [INFERRED]
  .pre-commit-config.yaml → .github/workflows/ci.yml
- `Reversa Reverse-Engineering Framework (writes only to .reversa/ and _reversa_sdd/)` --conceptually_related_to--> `Flask → Django Migration Strategy (incremental, compatibility, feature flags)`  [INFERRED]
  AGENTS.md → GEMINI.md
- `Add-Podcast Feature (/add-podcast, addPodcast API, CSRF_TRUSTED_ORIGINS)` --conceptually_related_to--> `Flask → Django Migration Strategy (incremental, compatibility, feature flags)`  [INFERRED]
  CHANGELOG.md → GEMINI.md
- `Base Docker Compose (shared service definitions)` --implements--> `Django 5.2 / 6.0 (web framework)`  [INFERRED]
  docker-compose.base.yml → backend/requirements-base.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Podigger CI/CD Pipeline (CI → build images → deploy to staging/production → release)** — workflows_ci_ci_workflow, workflows_ci_build_and_push_images_job, workflows_deploy_staging_deploy_workflow, workflows_deploy_production_deploy_workflow, workflows_release_release_workflow [INFERRED 0.90]
- **specs/003-db-optimization: composite indexes + RefreshService + DbAwareTask + bulk-seed fixture + optimization-guard test** — agents_speckit_plan, changelog_unreleased_optimization_pass, changelog_refresh_service, changelog_db_aware_task, changelog_composite_indexes, changelog_bulk_seed_mixin, readme_dev_optimization_guard [EXTRACTED 0.95]
- **Flask → Django migration program (incremental strategy + code mapping + completed v2.1.0 migration)** — gemini_flask_to_django_migration, gemini_code_mapping, gemini_architecture_decisions, changelog_v210_flask_to_django [INFERRED 0.85]
- **Podigger Full Stack (Django + Next.js + Postgres + Redis + Celery)** — concept_django, concept_nextjs, concept_postgres, concept_redis, concept_celery [EXTRACTED 1.00]
- **Automated Semantic Versioning Pipeline (Commitizen + Conventional Commits + SemVer + CHANGELOG + GitHub Releases)** — concept_commitizen, concept_conventional_commits, concept_semantic_versioning, concept_changelog, concept_github_releases [EXTRACTED 1.00]
- **Production Deployment Topology (prod compose + base compose + nginx proxy + Cloudflare + Gunicorn)** — podigger_docker_compose_production, podigger_docker_compose_base, nginx_proxy_docker_compose, concept_cloudflare, concept_gunicorn [EXTRACTED 1.00]

## Communities (107 total, 28 thin omitted)

### Community 0 - "Frontend Pages & Routes"
Cohesion: 0.06
Nodes (34): metadata, AddPodcastPage(), jakarta, metadata, RootLayout(), AboutFooter(), AboutHero(), ActionList() (+26 more)

### Community 1 - "Backend Test Suite & Auth"
Cohesion: 0.05
Nodes (44): APIClient, Factory para o modelo accounts.User., UserFactory, Verifica que o CookieJWTAuthentication rejeita tokens enviados via header Author, Property 13: Token sent via Authorization header must be rejected (HTTP 401)., TestCookieJWTAuthentication, Property 11: Autenticação obrigatória para escrita (consolidado)  For any conten, Property 12: Write requests with a reader access_token must return 403.      **V (+36 more)

### Community 2 - "API Integration Tests"
Cohesion: 0.04
Nodes (24): Attach a new APIClient instance to self for use in test methods., Integration tests for episodes pagination and search., Default page size is 10., Page 2 returns remaining items., Empty or whitespace query returns recent episodes (no search filter)., Search with q= returns filtered results (FTS or trigram)., Prepare test state by creating an API client, a Podcast, and two Episodes, Verify that GET /api/episodes/ responds with HTTP 200 and returns two items. (+16 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (37): dependencies, clsx, next, react, react-dom, tailwind-merge, devDependencies, babel-plugin-react-compiler (+29 more)

### Community 4 - "Tooling & Conventions"
Cohesion: 0.10
Nodes (23): Conventional Commits Standard (feat/fix/docs/.../chore/revert), Ruff Configuration (line-length 88, py312, comprehensive rule set), Dependabot Configuration, Pre-commit Ruff Hook (lint + format), Frontend Stack (Next.js 16 App Router, Node 24 LTS, pnpm 9, TypeScript 5, React 19, Tailwind 4), CI build-and-push-images job (GHCR Docker publish), CI changes job (paths-filter for backend/frontend), CI Workflow (+15 more)

### Community 5 - "Database Base Models"
Cohesion: 0.14
Nodes (19): BaseModel, PodcastLanguage, Abstract base model with timestamps., Model for suggested topics., Represent the topic suggestion by its title.          Returns:             str:, Model representing a podcast language., Format the language's display label as "name (code)".          Returns:, Tag for categorizing episodes. (+11 more)

### Community 6 - "Feed Parsing & Validation"
Cohesion: 0.12
Nodes (18): Any, Create a Podcast from JSON request data and enqueue episode import.          Par, is_valid_feed(), _parse_entry(), parse_feed(), Check whether a feed URL parses without feedparser bozo errors.      If parsing, Strip HTML tags/comments and trim whitespace.      Parameters:         text (str, Parse a single feed entry into a normalized item dictionary.      Parameters: (+10 more)

### Community 7 - "Auth Permissions & Registration"
Cohesion: 0.12
Nodes (15): IsAdminRole, Allows access only to users with role == "admin"., Serializer for public user registration., RegisterSerializer, JWT token refresh view that reads the refresh token from an HttpOnly cookie., Public endpoint for user registration.      Accepts POST /api/auth/register/ wit, List all users. Restricted to Admin role.      GET /api/auth/users/     Returns, JWT login view that stores tokens in HttpOnly cookies.      Stores tokens in Htt (+7 more)

### Community 8 - "Frontend UI Utilities"
Cohesion: 0.16
Nodes (11): EmptyState(), EmptyStateProps, messages, cn(), Badge(), BadgeProps, ButtonProps, Input (+3 more)

### Community 9 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Django Admin"
Cohesion: 0.14
Nodes (13): AbstractBaseUser, Admin configuration for the custom User model., UserAdmin, Meta, Custom user model using email as the unique identifier instead of username., Return the user's email as the string representation., User, Meta (+5 more)

### Community 11 - "Episode UI Components"
Cohesion: 0.19
Nodes (12): EpisodeCardCompact(), EpisodeCardCompactProps, formatRelativeTime(), EpisodeCard(), EpisodeCardProps, EpisodeList(), EpisodeListProps, Episode (+4 more)

### Community 12 - "Podcast Refresh Orchestration"
Cohesion: 0.19
Nodes (12): add_episode(), Populate episodes for the podcast feed at the given URL.      Thin wrapper aroun, Refresh all podcasts and reset every per-podcast `total_episodes`.      Delegate, update_base(), Per-feed refresh orchestrator with a bounded SQL statement budget., RefreshService, PodcastFactory, Factory para o modelo podcasts.Podcast. (+4 more)

### Community 13 - "Management Commands"
Cohesion: 0.12
Nodes (9): BaseCommand, Command, Register command-line options for the management command.          Adds:, Remove podcast-related seed data created within the last `minutes` minutes., Command, Register command-line arguments used by this management command.          Adds a, Remove database records listed in a JSON fixture file.          Loads the fixtur, Command (+1 more)

### Community 14 - "Episode Pagination & Serialization"
Cohesion: 0.18
Nodes (16): PageNumberPagination, Episode, Model representing a podcast episode.      A composite index on `(podcast_id, pu, Represent the topic suggestion by its title.          Returns:             str:, EpisodeSerializer, PodcastDetailSerializer, Serializer for TopicSuggestion model., Serializer for Episode model. (+8 more)

### Community 15 - "Frontend Home & Navigation"
Cohesion: 0.17
Nodes (9): FAB(), BottomNav(), BottomNavProps, items, NavItem, HomeClient(), SearchHero(), SearchHeroProps (+1 more)

### Community 16 - "Podcasts App Models"
Cohesion: 0.17
Nodes (10): Meta, Meta options for Episode., Meta options for BaseModel., Celery tasks for the podcasts app.  This module is the single place where the pr, Delete Podcast records that have no associated episodes.      Unchanged from the, Increment the hit counter for a searched term.      Enqueued from the episode se, record_search_term(), remove_podcasts() (+2 more)

### Community 17 - "Refresh Service Helpers"
Cohesion: 0.15
Nodes (12): _ms_since(), _parse_published(), Refresh service for the podcasts app.  Extracted from the original `EpisodeUpdat, Parse a feed-published timestamp into a timezone-aware datetime.      Accepts bo, Typed result of `RefreshService.process_feed`., Return the elapsed wall time in milliseconds since `start`., RefreshResult, EpisodeUpdater (+4 more)

### Community 18 - "Frontend API Client"
Cohesion: 0.20
Nodes (11): addPodcast(), AddPodcastResponse, EpisodesResponse, fetchEpisodes(), fetchLanguages(), fetchPodcasts(), PodcastLanguage, PodcastsResponse (+3 more)

### Community 19 - "Celery Task Infrastructure"
Cohesion: 0.14
Nodes (10): DbAwareTask, Base Celery task that closes stale database connections.      Why: each Celery t, Close stale connections before each task starts., Close stale connections when a task fails so the next task starts clean., Task, Regression guards for connection reuse (US4, FR-006, SC-005).  Web workers must, Under a 100-request burst, a single web worker opens ≤ 1 PG conn., `close_old_connections` MUST be called between Celery tasks. (+2 more)

### Community 20 - "Backend Core Dependencies"
Cohesion: 0.19
Nodes (14): Backend Base Requirements (requirements-base.txt), Django 5.2 / 6.0 (web framework), django-cors-headers (CORS handling), django-environ (env config), django-filter (queryset filtering), Django REST Framework (DRF), feedparser (RSS/Atom feed parser), Gunicorn (WSGI HTTP server) (+6 more)

### Community 21 - "Frontend Hooks & Pagination"
Cohesion: 0.21
Nodes (6): useDebounce(), Pagination(), PaginationProps, PodcastList(), mockPodcasts, mockPodcastsResponse

### Community 22 - "Model Unit Tests"
Cohesion: 0.19
Nodes (7): TestCase, PodcastEpisodeRelationTests, PodcastLanguageModelTests, PopularTermModelTests, Create a PodcastLanguage and a Podcast instance for tests.          Sets `self.l, TagModelTests, TopicSuggestionModelTests

### Community 23 - "Frontend Setup Scripts"
Cohesion: 0.41
Nodes (12): setup-frontend.sh script, check_os(), create_nvmrc(), echo_error(), echo_info(), echo_warn(), install_dependencies(), install_node() (+4 more)

### Community 24 - "Next.js Proxy Routes"
Cohesion: 0.28
Nodes (12): attemptRefresh(), buildBackendUrl(), buildLogoutRedirect(), buildProxyResponse(), DELETE(), forwardToBackend(), GET(), handleProxy() (+4 more)

### Community 25 - "Backend Prod/Dev Dependencies"
Cohesion: 0.21
Nodes (12): Backend Production Requirements (requirements.txt), Backend Development Requirements (requirements-dev.txt), factory-boy (test fixtures factory), Faker 19.9 (test data generation), psycopg2 2.9.12 (compiled Postgres driver, production), psycopg2-binary 2.9.11 (prebuilt Postgres driver, dev), pytest (test runner), pytest-cov (coverage) (+4 more)

### Community 26 - "Production Infrastructure"
Cohesion: 0.21
Nodes (12): Celery 5.6 (async task queue), Daily pg_dump backup cron (production), django-redis (Django cache backend), Backend /health/ endpoint (used by healthcheck probes), PostgreSQL 15 (relational database), Redis 8 (cache + Celery broker), Full Stack Docker Compose, Base Docker Compose (shared service definitions) (+4 more)

### Community 27 - "Admin User Management API"
Cohesion: 0.24
Nodes (7): Read-only serializer for user data., UserSerializer, Approve a user account. Restricted to Admin role.      POST /api/auth/users/{pk}, Update a user's role. Restricted to Admin role.      PATCH /api/auth/users/{pk}/, UserApproveView, UserRoleUpdateView, APIView

### Community 28 - "Role-Based Permissions"
Cohesion: 0.22
Nodes (6): IsEditorOrAdmin, Allows access to users with role == "editor" or role == "admin"., Return AllowAny for read actions; require IsEditorOrAdmin for writes., ViewSet for handling Topic Suggestions., Return AllowAny for read actions; require IsEditorOrAdmin for writes., TopicSuggestionViewSet

### Community 29 - "DB Optimization Spec (003)"
Cohesion: 0.24
Nodes (10): Spec Kit Plan Reference (specs/003-db-optimization/plan.md), BulkSeedMixin and make_large_catalogue (20 000-episode benchmark fixture), Composite Indexes (podcasts_episode_podcast_published_idx, podcasts_popularterm_term_idx), DbAwareTask Celery base class (close stale DB connections between tasks), record_search_term Celery task (eventually consistent popular-terms counter), RefreshService (extracted from EpisodeUpdater, bounded per-feed statement budget), Episode Counter Fix (total_episodes updates outside episode loop, atomic transaction), Unreleased: PostgreSQL Optimization Pass (composite indexes, RefreshService, DbAwareTask) (+2 more)

### Community 30 - "Database Seeding Command"
Cohesion: 0.20
Nodes (6): Command, Add command-line options that control seeding behavior for the management comman, Seed the database with fake podcasts, episodes, tags, and related metadata based, Podcast, Model representing a podcast feed., Provide the model instance's name as its string representation.          Returns

### Community 31 - "Podigger Project Identity"
Cohesion: 0.20
Nodes (10): Geist font (Vercel font family), GitHub Actions CI/CD, Next.js 16 (React framework), Podigger (Search Engine for Podcast Subjects), React 19, Tailwind CSS v4, TypeScript, Vercel Platform (Next.js deployment target) (+2 more)

### Community 32 - "Episode & Podcast Data Layer"
Cohesion: 0.22
Nodes (6): Episode, Podcast, Return the set of existing `Episode.link` for `podcast` in one query., Return `{name: Tag}` for every name in `names`, creating missing ones., Insert the new episodes via `bulk_create` and return the persisted rows., Process a single feed and return a `RefreshResult`.          The whole per-feed

### Community 33 - "Podcast ViewSet Tests"
Cohesion: 0.20
Nodes (3): Set up a Django REST Framework APIClient instance for test methods.          Ass, The search endpoint MUST enqueue `record_search_term` instead of         writing, TestPodcastViewSetFeatures

### Community 34 - "JWT Token Serializer"
Cohesion: 0.22
Nodes (6): EmailTokenObtainPairSerializer, Meta, JWT serializer that authenticates by email and enforces approval_status., Add role and email claims to the JWT payload., Validate credentials and check approval_status before issuing tokens., TokenObtainPairSerializer

### Community 35 - "Serializer Meta Classes"
Cohesion: 0.22
Nodes (9): Meta, Meta options for TopicSuggestionSerializer., Meta options for PopularTermSerializer., Meta options for TagSerializer., Meta options for PodcastMinimalSerializer., Meta options for PodcastLanguageSerializer., Meta options for EpisodeSerializer., Meta options for PodcastListSerializer. (+1 more)

### Community 36 - "Pytest Configuration & Fixtures"
Cohesion: 0.25
Nodes (3): disable_throttling(), Configuração global do pytest para a suite de testes do backend., Suprime SimpleRateThrottle em todos os testes.

### Community 37 - "Episode List API"
Cohesion: 0.29
Nodes (6): PodcastListSerializer, Serializer for listing Podcasts (T008)., EpisodeViewSet, Return the six most recently created podcasts.          Returns:             Res, Episode viewset with PostgreSQL full-text search support.      Use `GET /api/epi, Return the queryset, optionally filtered by search term.          Search path (w

### Community 38 - "Podcast ViewSet"
Cohesion: 0.25
Nodes (5): PodcastViewSet, ViewSet for viewing and creating Podcasts.      Queryset shape (US3, FR-005, FR-, Return the queryset, with eager loading tuned for each action.          - `list`, Return AllowAny for read actions; require IsEditorOrAdmin for writes., Return the serializer class based on the action.

### Community 39 - "Cookie Auth Property Tests"
Cohesion: 0.32
Nodes (7): _cookie_client_for(), _make_user(), Property 12: Write requests with a reader access_token must return 403.      Val, Return an APIClient with the access_token cookie set for the given user., Property 11: Write requests without a valid access_token cookie must return 401., test_reader_write_returns_403(), test_unauthenticated_write_returns_401()

### Community 40 - "Search Read-Only Guard Tests"
Cohesion: 0.25
Nodes (4): Regression guard: the search endpoint MUST NOT perform any write.  The PopularTe, `GET /api/episodes/?q=python` MUST NOT issue INSERT/UPDATE/DELETE., When no `q` is supplied, no PopularTerm write is enqueued., TestSearchIsPureRead

### Community 41 - "View Performance Tests"
Cohesion: 0.25
Nodes (4): US3: GET /api/podcasts/{id}/ MUST issue at most 4 statements (SC-003)., US3: the default ordering of the episode list is `-published`., TestEpisodesListOrdering, TestPodcastDetailStatementBudget

### Community 42 - "Django App Configuration"
Cohesion: 0.29
Nodes (5): AccountsConfig, Configuration for the accounts application., AppConfig, PodcastsConfig, Configuration for the podcasts application.

### Community 43 - "Custom User Manager"
Cohesion: 0.33
Nodes (5): Custom manager for the User model using email as the unique identifier., Create and return a regular user with the given email and password.          Set, Create and return a superuser with the given email and password.          Sets i, UserManager, BaseUserManager

### Community 44 - "Podcast Card UI Component"
Cohesion: 0.43
Nodes (5): Podcast, PodcastCard(), PodcastCardProps, mockPodcast, mockPodcastNoLanguage

### Community 45 - "Architecture History & Migration"
Cohesion: 0.40
Nodes (6): Reversa Reverse-Engineering Framework (writes only to .reversa/ and _reversa_sdd/), Add-Podcast Feature (/add-podcast, addPodcast API, CSRF_TRUSTED_ORIGINS), v2.1.0 Breaking Migration: Flask → Django (and AngularJS → Next.js), Architecture Decisions (Django over SQLAlchemy, Next.js SSR/SSG), Flask→Django Code Mapping (Routes→DRF, SQLAlchemy→ORM, Alembic→Django, Jinja2→React), Flask → Django Migration Strategy (incremental, compatibility, feature flags)

### Community 46 - "Release & Versioning Tooling"
Cohesion: 0.40
Nodes (6): CHANGELOG.md (auto-generated changelog), Commitizen (commit-message-driven versioning tool), Conventional Commits (commit message spec), GitHub Releases, Semantic Versioning (SemVer), WHY Conventional Commits + Commitizen: enables automatic SemVer bumps, auto CHANGELOG, GitHub Releases, and CI commit validation

### Community 47 - "Health Check Endpoint"
Cohesion: 0.33
Nodes (3): health_check(), Health check endpoint for monitoring., Health check endpoint for monitoring.      Returns HTTP 200 if the database is r

### Community 48 - "Globe & Internationalization"
Cohesion: 0.33
Nodes (6): Earth, Globe, Globe Icon, Internationalization, Language, World

### Community 49 - "Cookie JWT Authentication"
Cohesion: 0.40
Nodes (3): CookieJWTAuthentication, JWT authentication that reads the access token from the HttpOnly cookie.      Re, JWTAuthentication

### Community 50 - "Test Factory Classes"
Cohesion: 0.40
Nodes (4): Meta, DjangoModelFactory, EpisodeFactory, Factory para o modelo podcasts.Episode.

### Community 51 - "Backend README & Tooling"
Cohesion: 0.40
Nodes (5): Podigger Backend README, Docker Compose (container orchestration), Legacy Flask app (predecessor being migrated to Django), pip + venv workflow (no Poetry/PDM yet), ruff (linter/formatter)

### Community 52 - "Nginx Reverse Proxy"
Cohesion: 0.60
Nodes (5): Cloudflare Origin Certificates (edge TLS), Nginx 1.25 (reverse proxy / web server), podigger-proxy external Docker network, Nginx Reverse Proxy Docker Compose, Staging Docker Compose

### Community 55 - "Episode Search Manager"
Cohesion: 0.50
Nodes (3): EpisodeManager, Manager for the Episode model with custom search functionality., Search episodes by title and description using Full Text Search.          Return

### Community 56 - "Popular Term Model"
Cohesion: 0.50
Nodes (3): PopularTerm, Model related to search analytics for popular terms., Format the popular term with its occurrence count.          Returns:

### Community 57 - "File Icon Asset"
Cohesion: 0.50
Nodes (4): Document, File Icon, Folded Corner, Text Lines

### Community 58 - "Window Icon Asset"
Cohesion: 0.83
Nodes (4): Window Title Bar, Window Control Buttons (traffic lights), Window Icon, Application Window UI Element

### Community 61 - "Frontend Preservation Test"
Cohesion: 0.50
Nodes (3): __dirname, frontendDir, packageJson

### Community 62 - "Optimization Guard Tests"
Cohesion: 0.50
Nodes (3): Single test that runs every optimization regression guard.  If ANY of the optimi, Run the slow + fast suites for the optimization pass and assert green.      Skip, test_all_optimization_guards_pass()

### Community 63 - "Episode Updater Tests"
Cohesion: 0.50
Nodes (3): Tests for the `EpisodeUpdater` thin orchestrator (US2, Q5).  The per-feed work h, `EpisodeUpdater.populate` MUST delegate to `RefreshService` and stay     within, test_updater_delegates_to_refresh_service()

### Community 67 - "Vercel Logo Asset"
Cohesion: 0.67
Nodes (3): Vercel Brand Identity, Upward Triangle, Vercel Logo

## Knowledge Gaps
- **172 isolated node(s):** `create-dependabot-labels.sh script`, `Meta`, `Migration`, `Migration`, `Migration` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Django Admin` to `Backend Test Suite & Auth`, `JWT Token Serializer`, `Podcast ViewSet Tests`, `Cookie Auth Property Tests`, `Auth Permissions & Registration`, `View Performance Tests`, `Admin User Management API`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `UserFactory` connect `Backend Test Suite & Auth` to `Django Admin`, `Test Factory Classes`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `RefreshService` connect `Podcast Refresh Orchestration` to `Podcasts App Models`, `Refresh Service Helpers`, `Episode & Podcast Data Layer`, `Refresh All & Counter Reset`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `User` (e.g. with `UserAdmin` and `EmailTokenObtainPairSerializer`) actually correct?**
  _`User` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `Podcast` (e.g. with `EpisodeSerializer` and `Meta`) actually correct?**
  _`Podcast` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `PopularTerm` (e.g. with `EpisodeSerializer` and `Meta`) actually correct?**
  _`PopularTerm` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `PodcastLanguage` (e.g. with `EpisodeSerializer` and `Meta`) actually correct?**
  _`PodcastLanguage` has 15 INFERRED edges - model-reasoned connections that need verification._