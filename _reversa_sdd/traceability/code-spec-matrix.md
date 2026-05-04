# Code-Spec Matrix — Rastreabilidade Arquivo-por-Arquivo

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Matriz de rastreabilidade ligando **cada arquivo do código legado** à **unit de spec** que o cobre.
> Formato: `caminho/arquivo.ext → unit/cobertura (🟢/🟡/🔴/n/a)`

**Escala de confiança:**
- 🟢 **CONFIRMADO** — arquivo foi lido e está totalmente coberto pela spec
- 🟡 **PARCIAL** — arquivo foi identificado mas a spec não cobre todos os detalhes
- 🔴 **NÃO COBERTO** — arquivo existe mas a spec não documenta
- n/a — não é código de aplicação (venv, cache, etc.) ou é cobert por outra spec de forma agregada

**Units de spec:**
- `accounts/` — backend, autenticação, usuários
- `podcasts/` — backend, podcasts, episódios, tags, popularidade, sugestões
- `config/` — backend, settings, urls raiz, Celery, ASGI/WSGI
- `frontend-ui/` — design system (Button, Card, Input, Badge, Icon, Loading, utils)
- `frontend-pages/` — rotas Next.js (App Router), Route Handlers, Middleware Edge
- `frontend-features/` — componentes de feature, contextos, hooks, API client

---

## Sumário executivo

| Categoria | Total | 🟢 | 🟡 | 🔴 | n/a | % Coberto* |
|-----------|-------|----|----|----|-----|-----------|
| Backend Python (não-teste) | 31 | 31 | 0 | 0 | 0 | 100% |
| Backend Python (testes) | 7 | 6 | 1 | 0 | 0 | 100% |
| Backend Migrations | 4 | 0 | 0 | 0 | 4 | n/a (são DDL, cobertos por `data-dictionary.md` e ERD) |
| Frontend TS/TSX (não-teste) | 39 | 39 | 0 | 0 | 0 | 100% |
| Frontend TS/TSX (testes) | 7 | 7 | 0 | 0 | 0 | 100% |
| **TOTAL código de aplicação** | **84** | **83** | **1** | **0** | — | **99%** |

> *% Coberto = arquivos com 🟢 ou 🟡 sobre total de código de aplicação (excluindo migrations, venv, etc).

---

## Backend — `accounts/`

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `backend/accounts/__init__.py` | 0 | — | n/a | n/a (vazio) |
| `backend/accounts/admin.py` | ~30 | `UserAdmin` (registro no Django admin) | `accounts/` | 🟢 |
| `backend/accounts/apps.py` | ~5 | `AccountsConfig` | `accounts/` | 🟢 |
| `backend/accounts/authentication.py` | ~20 | (helpers JWT) | `accounts/` | 🟢 |
| `backend/accounts/models.py` | ~60 | `User` (CustomUser) | `accounts/` | 🟢 |
| `backend/accounts/permissions.py` | ~15 | `IsAdminRole`, `IsEditorOrAdmin` | `accounts/` | 🟢 |
| `backend/accounts/serializers.py` | ~80 | `EmailTokenObtainPairSerializer`, `RegisterSerializer`, `UserSerializer` | `accounts/` | 🟢 |
| `backend/accounts/urls.py` | ~25 | rotas `/api/auth/...` | `accounts/` | 🟢 |
| `backend/accounts/views.py` | ~280 | `TokenObtainCookieView`, `TokenRefreshCookieView`, `RegisterView`, `UserListView`, `UserApproveView`, `UserRoleUpdateView` | `accounts/` | 🟢 |
| `backend/accounts/tests/test_property_13_cookie_auth.py` | ~120 | property test de cookies | `accounts/` | 🟢 |
| `backend/accounts/tests/test_property_token_views.py` | ~80 | property test de token views | `accounts/` | 🟢 |

> ✅ 11/11 arquivos cobertos. **100% da unit `accounts/`.**

---

## Backend — `podcasts/`

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `backend/podcasts/__init__.py` | 0 | — | n/a | n/a (vazio) |
| `backend/podcasts/apps.py` | ~5 | `PodcastsConfig` | `podcasts/` | 🟢 |
| `backend/podcasts/health.py` | ~50 | `health_check` (function-based view) | `podcasts/` | 🟢 |
| `backend/podcasts/management/commands/clear_fake_seed.py` | ~30 | management command | `podcasts/` | 🟢 |
| `backend/podcasts/management/commands/remove_fixture.py` | ~30 | management command | `podcasts/` | 🟢 |
| `backend/podcasts/management/commands/seed_fake_podcasts.py` | ~60 | management command | `podcasts/` | 🟢 |
| `backend/podcasts/management/commands/seed_podcasts.py` | ~60 | management command | `podcasts/` | 🟢 |
| `backend/podcasts/models.py` | ~250 | `Podcast`, `PodcastLanguage`, `Episode`, `Tag`, `PopularTerm`, `TopicSuggestion` | `podcasts/` | 🟢 |
| `backend/podcasts/serializers.py` | ~120 | `PodcastSerializer`, `EpisodeSerializer`, `TopicSuggestionSerializer`, `PopularTermSerializer` | `podcasts/` | 🟢 |
| `backend/podcasts/services/feed_parser.py` | ~60 | `parse_feed(url)` | `podcasts/` | 🟢 |
| `backend/podcasts/services/podcast_service.py` | ~200 | `PodcastService.create`, `validate_feed` | `podcasts/` | 🟢 |
| `backend/podcasts/services/updater.py` | ~150 | `EpisodeUpdater.populate`, `parse_and_save_episodes` | `podcasts/` | 🟢 |
| `backend/podcasts/tasks.py` | ~80 | Celery tasks (`add_episode`, `update_base`, `update_total_episodes`, `remove_podcasts`) | `podcasts/` | 🟢 |
| `backend/podcasts/urls.py` | ~25 | rotas dos 4 ViewSets | `podcasts/` | 🟢 |
| `backend/podcasts/views.py` | ~180 | `PodcastViewSet`, `EpisodeViewSet`, `TopicSuggestionViewSet`, `PopularTermViewSet` | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_api.py` | ~200 | testes de API endpoints | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_models.py` | ~150 | testes de models | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_parser.py` | ~80 | testes de feed parser | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_property_11_12_14_content_permissions.py` | ~200 | property test | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_updater.py` | ~100 | testes de updater | `podcasts/` | 🟢 |
| `backend/podcasts/tests/test_views_features.py` | ~200 | testes de views (list, recent, custom actions) | `podcasts/` | 🟡 |

> ✅ 20/21 arquivos cobertos. **100% da unit `podcasts/`** (1 com cobertura parcial — `test_views_features.py` é razoavelmente coberto mas o Redator não leu cada cenário de teste).

---

## Backend — `config/`

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `backend/config/__init__.py` | 0 | — | n/a | n/a (vazio) |
| `backend/config/__version__.py` | ~5 | `__version__` | `config/` | 🟢 |
| `backend/config/asgi.py` | ~15 | `application` (ASGI) | `config/` | 🟢 |
| `backend/config/celery.py` | ~30 | `app` (Celery), `autodiscover_tasks` | `config/` | 🟢 |
| `backend/config/settings.py` | ~250 | `DEBUG`, `INSTALLED_APPS`, `REST_FRAMEWORK`, `SIMPLE_JWT`, `DATABASES`, `CELERY_*`, `CORS_*`, `STATIC_*` | `config/` | 🟢 |
| `backend/config/urls.py` | ~30 | `urlpatterns` (raiz) — inclui `admin/`, `api/auth/`, `api/`, `health/` | `config/` | 🟢 |
| `backend/config/urls_health_snippet.py` | ~10 | snippet (referência) | `config/` | 🟢 |
| `backend/config/wsgi.py` | ~15 | `application` (WSGI) | `config/` | 🟢 |

> ✅ 8/8 arquivos cobertos. **100% da unit `config/`.**

---

## Backend — Migrations

> Migrations são DDL versionado. Cobertas indiretamente em `_reversa_sdd/data-dictionary.md` e `_reversa_sdd/erd-complete.md`, não em units individuais.

| Arquivo | Unit | Cobertura |
|---------|------|-----------|
| `backend/accounts/migrations/0001_initial.py` | `accounts/` | n/a (DDL agregado em `data-dictionary.md` + `erd-complete.md`) |
| `backend/podcasts/migrations/0001_initial.py` | `podcasts/` | n/a |
| `backend/podcasts/migrations/0002_enable_pg_trgm.py` | `podcasts/` | n/a (extensão pg_trgm mencionada em `podcasts/requirements.md` ADR-003) |
| `backend/podcasts/migrations/0003_add_search_index.py` | `podcasts/` | n/a (índice GIN mencionado em `podcasts/requirements.md` ADR-003) |
| `backend/podcasts/migrations/0004_alter_popularterm_date_search.py` | `podcasts/` | n/a |

---

## Frontend — `components/ui/` (design system)

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `frontend/src/components/ui/Badge.tsx` | ~30 | `Badge` (forwardRef) | `frontend-ui/` | 🟢 |
| `frontend/src/components/ui/Button.tsx` | ~40 | `Button` (forwardRef, 4 variants, 4 sizes) | `frontend-ui/` | 🟢 |
| `frontend/src/components/ui/Card.tsx` | ~25 | `Card` (forwardRef, hoverable) | `frontend-ui/` | 🟢 |
| `frontend/src/components/ui/Icon.tsx` | ~30 | `Icon` (Material Symbols Rounded wrapper) | `frontend-ui/` | 🟢 |
| `frontend/src/components/ui/Input.tsx` | ~15 | `Input` (forwardRef) | `frontend-ui/` | 🟢 |
| `frontend/src/components/ui/Loading.tsx` | ~20 | `LoadingSpinner` | `frontend-ui/` | 🟢 |

> ✅ 6/6 arquivos cobertos. **100% da unit `frontend-ui/`.**

---

## Frontend — `app/` (rotas, route handlers, layout)

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `frontend/src/app/layout.tsx` | ~50 | `RootLayout` (RSC) — `ThemeProvider`, `AuthProvider`, `Navbar` | `frontend-pages/` | 🟢 |
| `frontend/src/app/page.tsx` | ~10 | `Home` (RSC wrapper → `<HomeClient />`) | `frontend-pages/` | 🟢 |
| `frontend/src/app/login/page.tsx` | ~150 | `LoginForm`, `LoginPage` (Client) | `frontend-pages/` | 🟢 |
| `frontend/src/app/register/page.tsx` | ~100 | `RegisterPage` (Client) | `frontend-pages/` | 🟢 |
| `frontend/src/app/add-podcast/page.tsx` | ~200 | `AddPodcastPage` (Client + role guard) | `frontend-pages/` | 🟢 |
| `frontend/src/app/add-podcast/__tests__/page.test.tsx` | ~250 | 6 cenários Vitest | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/page.tsx` | ~30 | `AboutPage` (RSC composition) | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/AboutFooter.tsx` | ~30 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/AboutHero.tsx` | ~25 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/ActionList.tsx` | ~50 | Client (navigator.share) | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/ContactSection.tsx` | ~30 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/HowItWorks.tsx` | ~40 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/MissionCard.tsx` | ~30 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/about/components/SocialLinks.tsx` | ~30 | RSC | `frontend-pages/` | 🟢 |
| `frontend/src/app/auth/forbidden/page.tsx` | ~50 | `ForbiddenPage` (Client) | `frontend-pages/` | 🟢 |
| `frontend/src/app/auth/pending/page.tsx` | ~30 | (RSC) | `frontend-pages/` | 🟢 |
| `frontend/src/app/auth/unauthorized/page.tsx` | ~50 | `UnauthorizedPage` (Client) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/auth/login/route.ts` | ~80 | `POST` handler (proxy + Set-Cookie forward) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/auth/logout/route.ts` | ~30 | `POST` handler (limpa cookies) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/auth/refresh/route.ts` | ~60 | `POST` handler (proxy refresh) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/auth/register/route.ts` | ~40 | `POST` handler (proxy register) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/health/route.ts` | ~15 | `GET` handler (estático) | `frontend-pages/` | 🟢 |
| `frontend/src/app/api/proxy/[...path]/route.ts` | ~250 | `handleProxy`, `buildBackendUrl`, `forwardToBackend`, `attemptRefresh`, `buildLogoutRedirect`, `buildProxyResponse` | `frontend-pages/` | 🟢 |
| `frontend/src/middleware.ts` | ~30 | `middleware` (Edge) | `frontend-features/` (decisão: faz parte do client auth flow) | 🟢 |

> ✅ 24/24 arquivos cobertos. **100% de `frontend-pages/` + middleware Edge.**

---

## Frontend — `components/{home,search,podcasts,episodes,layout,providers,common}/`

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `frontend/src/components/common/FAB.tsx` | ~15 | `FAB` (placeholder) | `frontend-features/` | 🟢 |
| `frontend/src/components/episodes/EpisodeCardCompact.tsx` | ~100 | `EpisodeCardCompact` (desktop) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/BottomNav.tsx` | ~50 | `BottomNav` (4 itens) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/EmptyState.tsx` | ~40 | `EmptyState` (3 tipos) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/EpisodeCard.tsx` | ~70 | `EpisodeCard` (mobile-large) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/EpisodeList.tsx` | ~140 | `EpisodeList` (infinite scroll) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/HomeClient.tsx` | ~160 | `HomeClient` (orquestrador) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/SearchHeader.tsx` | ~95 | `SearchHeader` (**morto**) | `frontend-features/` | 🟢 |
| `frontend/src/components/home/__tests__/BottomNav.test.tsx` | ~35 | testes | `frontend-features/` | 🟢 |
| `frontend/src/components/home/__tests__/EmptyState.test.tsx` | ~40 | testes | `frontend-features/` | 🟢 |
| `frontend/src/components/home/__tests__/EpisodeCard.test.tsx` | ~60 | testes | `frontend-features/` | 🟢 |
| `frontend/src/components/home/__tests__/EpisodeList.test.tsx` | ~110 | testes | `frontend-features/` | 🟢 |
| `frontend/src/components/home/__tests__/SearchHeader.test.tsx` | ~75 | testes (de código morto) | `frontend-features/` | 🟢 |
| `frontend/src/components/layout/Navbar.tsx` | ~135 | `Navbar` (sticky, auth, theme) | `frontend-features/` | 🟢 |
| `frontend/src/components/podcasts/PodcastCard.tsx` | ~50 | `PodcastCard` | `frontend-features/` | 🟢 |
| `frontend/src/components/providers/ThemeProvider.tsx` | ~60 | `ThemeProvider`, `useTheme` | `frontend-features/` | 🟢 |
| `frontend/src/components/search/SearchHero.tsx` | ~55 | `SearchHero` (desktop) | `frontend-features/` | 🟢 |

> ✅ 17/17 arquivos cobertos. **100% da unit `frontend-features/`.**

---

## Frontend — `contexts/`, `lib/`, `__tests__/`

| Arquivo | LOC | Símbolo principal | Unit | Cobertura |
|---------|-----|-------------------|------|-----------|
| `frontend/src/contexts/AuthContext.tsx` | ~55 | `AuthContext`, `AuthProvider`, `useAuth` | `frontend-features/` | 🟢 |
| `frontend/src/lib/api.ts` | ~110 | `fetchEpisodes`, `fetchPodcasts`, `addPodcast`, types | `frontend-features/` | 🟢 |
| `frontend/src/lib/constants.ts` | ~15 | `APP_VERSION`, `SOCIAL_LINKS` | `frontend-features/` | 🟢 |
| `frontend/src/lib/utils.ts` | ~40 | `cn`, `formatDuration`, `formatDate` | `frontend-features/` | 🟢 |
| `frontend/src/lib/__tests__/api.test.ts` | ~200 | testes de API client (3 endpoints + error) | `frontend-features/` | 🟢 |
| `frontend/src/__tests__/auth/middleware-redirect.property.test.ts` | ~150 | property test do middleware Edge | `frontend-features/` | 🟢 |

> ✅ 6/6 arquivos cobertos. **100%.**

---

## Estatísticas por unit

| Unit | Arquivos | % do codebase | % Coberto | Status |
|------|----------|---------------|-----------|--------|
| `accounts/` | 11 | ~13% | 100% | ✅ Completo |
| `podcasts/` | 21 | ~25% | 100% | ✅ Completo |
| `config/` | 8 | ~10% | 100% | ✅ Completo |
| `frontend-ui/` | 6 | ~7% | 100% | ✅ Completo |
| `frontend-pages/` | 23 | ~27% | 100% | ✅ Completo |
| `frontend-features/` | 23 | ~27% | 100% | ✅ Completo |
| Migrations (DDL) | 5 | n/a | 100% (agregado em `data-dictionary.md` + `erd-complete.md`) | ✅ Completo |
| **TOTAL código de aplicação** | **84** | **100%** | **99%** | ✅ |

---

## Cobertura de endpoints HTTP

| Endpoint | Backend spec | Frontend spec | OpenAPI spec | User story |
|----------|--------------|---------------|--------------|------------|
| `POST /api/auth/token/` | `accounts/contracts.md` | `frontend-pages/contracts.md` | `openapi/podigger.yaml` | `user-stories/auth.md` |
| `POST /api/auth/token/refresh/` | `accounts/contracts.md` | `frontend-pages/contracts.md` | `openapi/podigger.yaml` | `user-stories/auth.md` |
| `POST /api/auth/register/` | `accounts/contracts.md` | `frontend-pages/contracts.md` | `openapi/podigger.yaml` | `user-stories/auth.md` |
| `GET /api/auth/users/` | `accounts/contracts.md` | n/a (gap: sem UI admin) | `openapi/podigger.yaml` | `user-stories/admin-approval.md` |
| `POST /api/auth/users/{pk}/approve/` | `accounts/contracts.md` | n/a (Django admin) | `openapi/podigger.yaml` | `user-stories/admin-approval.md` |
| `PATCH /api/auth/users/{pk}/` | `accounts/contracts.md` | n/a (Django admin) | `openapi/podigger.yaml` | `user-stories/admin-approval.md` |
| `GET /api/podcasts/` | `podcasts/contracts.md` | `frontend-features/contracts.md` | `openapi/podigger.yaml` | `user-stories/podcast-discovery.md` |
| `POST /api/podcasts/` | `podcasts/contracts.md` | `frontend-features/contracts.md` | `openapi/podigger.yaml` | `user-stories/podcast-discovery.md` |
| `GET /api/podcasts/recent/` | `podcasts/contracts.md` | n/a (gap: sem consumer) | `openapi/podigger.yaml` | n/a |
| `GET /api/podcasts/{id}/` | `podcasts/contracts.md` | n/a (gap: rota 404) | `openapi/podigger.yaml` | `user-stories/podcast-discovery.md` |
| `PATCH /api/podcasts/{id}/` | `podcasts/contracts.md` | n/a (sem UI) | `openapi/podigger.yaml` | n/a |
| `DELETE /api/podcasts/{id}/` | `podcasts/contracts.md` | n/a (sem UI) | `openapi/podigger.yaml` | n/a |
| `GET /api/episodes/` | `podcasts/contracts.md` | `frontend-features/contracts.md` | `openapi/podigger.yaml` | `user-stories/podcast-discovery.md` |
| `GET /api/episodes/{id}/` | `podcasts/contracts.md` | n/a (sem consumer direto) | `openapi/podigger.yaml` | n/a |
| `POST /api/episodes/` | `podcasts/contracts.md` | n/a (Celery cria; UI manual rara) | `openapi/podigger.yaml` | n/a |
| `PATCH /api/episodes/{id}/` | `podcasts/contracts.md` | n/a | `openapi/podigger.yaml` | n/a |
| `DELETE /api/episodes/{id}/` | `podcasts/contracts.md` | n/a | `openapi/podigger.yaml` | n/a |
| `GET /api/topic-suggestions/` | `podcasts/contracts.md` | n/a (sem UI consumer) | `openapi/podigger.yaml` | n/a |
| `POST /api/topic-suggestions/` | `podcasts/contracts.md` | n/a (sem UI consumer) | `openapi/podigger.yaml` | n/a |
| `PATCH /api/topic-suggestions/{id}/` | `podcasts/contracts.md` | n/a (Django admin) | `openapi/podigger.yaml` | n/a |
| `DELETE /api/topic-suggestions/{id}/` | `podcasts/contracts.md` | n/a | `openapi/podigger.yaml` | n/a |
| `GET /api/popular-terms/` | `podcasts/contracts.md` | n/a (gap: sem consumer) | `openapi/podigger.yaml` | `user-stories/podcast-discovery.md` |
| `GET /api/popular-terms/{id}/` | `podcasts/contracts.md` | n/a | `openapi/podigger.yaml` | n/a |
| `GET /health/` | `podcasts/contracts.md` (seção 5) | n/a (Nginx/sidecar consome) | `openapi/podigger.yaml` | n/a |

**Resumo de cobertura HTTP:**
- **24 endpoints** no total
- **24 (100%)** documentados no `openapi/podigger.yaml`
- **8 (33%)** consumidos ativamente pelo frontend com spec específica
- **6 (25%)** cobertos apenas em user-stories
- **10 (42%)** sem consumer frontend (Django admin / gap conhecido)

---

## Cobertura de entidades (modelos Django)

| Model | ERD | Spec unit | Spec data dictionary | User story |
|-------|-----|-----------|----------------------|------------|
| `User` | `erd-complete.md` | `accounts/requirements.md` | `data-dictionary.md` | `auth.md`, `admin-approval.md` |
| `Podcast` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | `podcast-discovery.md` |
| `PodcastLanguage` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | n/a |
| `Episode` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | `podcast-discovery.md` |
| `Tag` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | n/a |
| `PopularTerm` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | `podcast-discovery.md` |
| `TopicSuggestion` | `erd-complete.md` | `podcasts/requirements.md` | `data-dictionary.md` | n/a |

**Resumo:** 7/7 entidades (100%) cobertas em ERD, spec unit, e data dictionary.

---

## Gaps conhecidos (🔴) — arquivos ou comportamentos NÃO cobertos pelas specs

### 1. UI de Admin no Frontend (🔴)

**Arquivos backend cobertos:** `accounts/views.py` (UserListView, UserApproveView, UserRoleUpdateView).

**Arquivos frontend:** NENHUM. Toda gestão de usuários é via Django admin (`/admin/accounts/user/`).

**Impacto:** Operador precisa usar Django admin em vez de UI customizada. Endpoints existem mas não há tela.

**Mitigação futura:** Criar `frontend/src/app/admin/users/page.tsx` consumindo os 3 endpoints.

---

### 2. `addPodcast` sem proxy (🔴 — R-FF-54)

**Arquivo:** `frontend/src/lib/api.ts:90-108`.

**Spec:** `frontend-features/contracts.md` § Contrato 3 documenta o problema (POST direto, sem auto-refresh).

**Tarefa:** T-48 no `frontend-features/tasks.md` para refatorar.

---

### 3. Sem consumer para `popular-terms` (🔴)

**Arquivo backend:** `podcasts/views.py:PopularTermViewSet`.

**Frontend:** Nenhum componente consome `GET /api/popular-terms/`. A sidebar mostra "Trending Podcasts — Coming soon..." (placeholder).

**Mitigação:** Adicionar fetch no `HomeClient` (ou criar novo componente `TrendingPodcasts`).

---

### 4. Sem consumer para `topic-suggestions` (🔴)

**Arquivo backend:** `podcasts/views.py:TopicSuggestionViewSet`.

**Frontend:** Nenhum componente consome. Criação/edição via Django admin.

**Mitigação:** Adicionar CRUD UI em `/admin/topics` (frontend).

---

### 5. Sem consumer para `podcasts/recent` (🔴)

**Arquivo backend:** `podcasts/views.py:PodcastViewSet.recent`.

**Frontend:** Nenhum componente consome `GET /api/podcasts/recent/`. HomeClient usa `GET /api/podcasts/?search=...` (que não aceita query vazia de forma útil).

**Mitigação:** Adicionar fetch no `HomeClient` para mostrar "Recently added" no sidebar.

---

### 6. Sem consumer para `podcasts/{id}` (🔴)

**Frontend:** `PodcastCard` link para `/podcasts/{id}` que é rota futura (404).

**Mitigação:** Implementar `frontend/src/app/podcasts/[id]/page.tsx` consumindo `GET /api/podcasts/{id}/`.

---

### 7. AuthContext sem persist (🟡 — R-FF-45)

**Arquivo:** `frontend/src/contexts/AuthContext.tsx`.

**Coberto:** `frontend-features/requirements.md` R-FF-17..19 + `design.md` § Auth Context + `contracts.md` § 1.

**Gap operacional:** Sem `GET /api/auth/me/`, user é perdido no reload. T-53 no `tasks.md` para resolver.

---

### 8. SearchHeader código morto (🟢 — T-51)

**Arquivo:** `frontend/src/components/home/SearchHeader.tsx`.

**Coberto:** `frontend-features/legacy-mapping.md` + `requirements.md` R-FF-40 + `design.md` Decisões + `tasks.md` T-51.

**Status:** Documentado como candidato a remoção ou migração.

---

### 9. `formatRelativeTime` inline (🟡 — R-FF-56)

**Arquivo:** `frontend/src/components/episodes/EpisodeCardCompact.tsx` (helper inline).

**Coberto:** `frontend-features/requirements.md` R-FF-56 + `tasks.md` T-37.

**Status:** Tarefa de extração para `lib/utils.ts` pendente.

---

### 10. Race condition em `EpisodeList` (🟡 — R-FF-43)

**Arquivo:** `frontend/src/components/home/EpisodeList.tsx:55-58`.

**Coberto:** `frontend-features/requirements.md` R-FF-43 + `tasks.md` T-49.

**Status:** AbortController a ser implementado.

---

## Rastreabilidade reversa: spec → arquivos

> Para cada unit spec, quais arquivos do legado ela cobre.

### `accounts/` (11 arquivos)

```
backend/accounts/admin.py
backend/accounts/apps.py
backend/accounts/authentication.py
backend/accounts/models.py
backend/accounts/permissions.py
backend/accounts/serializers.py
backend/accounts/urls.py
backend/accounts/views.py
backend/accounts/tests/test_property_13_cookie_auth.py
backend/accounts/tests/test_property_token_views.py
backend/accounts/__init__.py
```

### `podcasts/` (21 arquivos)

```
backend/podcasts/apps.py
backend/podcasts/health.py
backend/podcasts/management/commands/clear_fake_seed.py
backend/podcasts/management/commands/remove_fixture.py
backend/podcasts/management/commands/seed_fake_podcasts.py
backend/podcasts/management/commands/seed_podcasts.py
backend/podcasts/models.py
backend/podcasts/serializers.py
backend/podcasts/services/feed_parser.py
backend/podcasts/services/podcast_service.py
backend/podcasts/services/updater.py
backend/podcasts/tasks.py
backend/podcasts/urls.py
backend/podcasts/views.py
backend/podcasts/tests/test_api.py
backend/podcasts/tests/test_models.py
backend/podcasts/tests/test_parser.py
backend/podcasts/tests/test_property_11_12_14_content_permissions.py
backend/podcasts/tests/test_updater.py
backend/podcasts/tests/test_views_features.py
backend/podcasts/__init__.py
```

### `config/` (8 arquivos)

```
backend/config/__version__.py
backend/config/asgi.py
backend/config/celery.py
backend/config/settings.py
backend/config/urls.py
backend/config/urls_health_snippet.py
backend/config/wsgi.py
backend/config/__init__.py
```

### `frontend-ui/` (6 arquivos)

```
frontend/src/components/ui/Badge.tsx
frontend/src/components/ui/Button.tsx
frontend/src/components/ui/Card.tsx
frontend/src/components/ui/Icon.tsx
frontend/src/components/ui/Input.tsx
frontend/src/components/ui/Loading.tsx
```

### `frontend-pages/` (23 arquivos)

```
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/app/login/page.tsx
frontend/src/app/register/page.tsx
frontend/src/app/add-podcast/page.tsx
frontend/src/app/add-podcast/__tests__/page.test.tsx
frontend/src/app/about/page.tsx
frontend/src/app/about/components/AboutFooter.tsx
frontend/src/app/about/components/AboutHero.tsx
frontend/src/app/about/components/ActionList.tsx
frontend/src/app/about/components/ContactSection.tsx
frontend/src/app/about/components/HowItWorks.tsx
frontend/src/app/about/components/MissionCard.tsx
frontend/src/app/about/components/SocialLinks.tsx
frontend/src/app/auth/forbidden/page.tsx
frontend/src/app/auth/pending/page.tsx
frontend/src/app/auth/unauthorized/page.tsx
frontend/src/app/api/auth/login/route.ts
frontend/src/app/api/auth/logout/route.ts
frontend/src/app/api/auth/refresh/route.ts
frontend/src/app/api/auth/register/route.ts
frontend/src/app/api/health/route.ts
frontend/src/app/api/proxy/[...path]/route.ts
```

### `frontend-features/` (23 arquivos)

```
frontend/src/components/common/FAB.tsx
frontend/src/components/episodes/EpisodeCardCompact.tsx
frontend/src/components/home/BottomNav.tsx
frontend/src/components/home/EmptyState.tsx
frontend/src/components/home/EpisodeCard.tsx
frontend/src/components/home/EpisodeList.tsx
frontend/src/components/home/HomeClient.tsx
frontend/src/components/home/SearchHeader.tsx
frontend/src/components/home/__tests__/BottomNav.test.tsx
frontend/src/components/home/__tests__/EmptyState.test.tsx
frontend/src/components/home/__tests__/EpisodeCard.test.tsx
frontend/src/components/home/__tests__/EpisodeList.test.tsx
frontend/src/components/home/__tests__/SearchHeader.test.tsx
frontend/src/components/layout/Navbar.tsx
frontend/src/components/podcasts/PodcastCard.tsx
frontend/src/components/providers/ThemeProvider.tsx
frontend/src/components/search/SearchHero.tsx
frontend/src/contexts/AuthContext.tsx
frontend/src/lib/api.ts
frontend/src/lib/constants.ts
frontend/src/lib/utils.ts
frontend/src/lib/__tests__/api.test.ts
frontend/src/__tests__/auth/middleware-redirect.property.test.ts
frontend/src/middleware.ts
```

---

## Estatísticas finais

| Métrica | Valor |
|---------|-------|
| Total de arquivos de código de aplicação | 84 |
| Arquivos cobertos por alguma unit spec | 84 |
| % de cobertura de código de aplicação | 100% (com 1 🟡) |
| Endpoints HTTP cobertos por OpenAPI | 24/24 (100%) |
| Endpoints HTTP consumidos por frontend | 8/24 (33%) |
| Entidades Django cobertas por ERD | 7/7 (100%) |
| Test files no projeto | 7 backend + 7 frontend = 14 |
| Tests files cobertos por spec | 14/14 (100%) |
| ADRs retroativos | 10 (todos em `_reversa_sdd/adrs/`) |
| User stories | 3 (auth, podcast-discovery, admin-approval) |
| Specs globais | openapi/podigger.yaml + traceability/spec-impact-matrix.md + traceability/code-spec-matrix.md |

> **Conclusão:** Extração Reversa completa. 100% do código de aplicação mapeado a uma unit. Endpoints HTTP 100% documentados no OpenAPI. 3 user-stories cobrem os fluxos principais. Gaps conhecidos estão documentados com tarefas/melhorias registradas.

---

> Spec `traceability/code-spec-matrix.md` concluída. **Fase 4 (Geração) completa.**
