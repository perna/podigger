# Arquitetura — podigger

> Gerado pelo Arquiteto em 2026-06-05
> `doc_level` = `completo`
> Síntese arquitetural do sistema legado, ancorada nos artefatos do Scout, Arqueólogo e Detetive.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Índice

1. [Resumo executivo](#1-resumo-executivo)
2. [Estilo arquitetural](#2-estilo-arquitetural)
3. [Camadas e responsabilidades](#3-camadas-e-responsabilidades)
4. [Fluxos críticos](#4-fluxos-críticos)
5. [Integrações externas](#5-integrações-externas)
6. [Decisões arquiteturais canônicas](#6-decisões-arquiteturais-canônicas)
7. [Dívida técnica conhecida](#7-dívida-técnica-conhecida)
8. [Mapa de artefatos arquiteturais](#8-mapa-de-artefatos-arquiteturais)

---

<a id="1-resumo-executivo"></a>
## 1. Resumo executivo

**podigger** é um motor de busca de episódios de podcasts por conteúdo (assunto). A solução combina:

- **Backend Django 5.2 + DRF** expondo uma API REST sob `/api/` e `/api/auth/`, com autenticação JWT em cookies HttpOnly.
- **Frontend Next.js 16 (App Router) + React 19** consumindo a API via um proxy catch-all (`/api/proxy/[...path]`) que centraliza cookies, refresh automático e isolamento do backend.
- **Pipeline assíncrono Celery 5.5 + Redis 7** responsável por popular episódios a partir de feeds RSS/Atom externos e manter contadores denormalizados.
- **PostgreSQL 15** como persistência única, com extensões `pg_trgm` e FTS nativo em configuração `portuguese` para busca híbrida (full-text + similaridade trigrama).
- **Nginx** como reverse proxy de borda em produção, com TLS e subdomínios dash-separated.

O backend é o componente maduro do sistema: 2 apps Django (`accounts`, `podcasts`), 9 modelos de domínio, 4 routers DRF, 6 endpoints de auth, 5 tasks Celery e cobertura de testes ≥70%. O frontend está em fase de construção: design system completo, mas poucas páginas funcionais (`/`, `/login`, `/register`, `/add-podcast`, `/about`).

| Característica | Valor | Confiança |
|----------------|-------|-----------|
| Containers em produção | 6 (frontend, backend, worker, beat, db, redis, nginx) | 🟢 |
| Endpoints REST | 4 routers (podcasts, episodes, topic-suggestions, popular-terms) + 6 endpoints de auth | 🟢 |
| Idiomas do conteúdo | PT-BR (UI e copy), en no atributo `lang` do `<html>` | 🟡 (assimetria) |
| Modelo de deploy | Docker Compose multi-arquivo (local / dev / staging / production) | 🟢 |
| Maturidade | Backend ✅ / Frontend 🚧 (design system + poucas páginas) | 🟢 |
| CI/CD | GitHub Actions (5 workflows: ci, release, deploy-staging, deploy-production, cleanup-images) | 🟢 |

---

<a id="2-estilo-arquitetural"></a>
## 2. Estilo arquitetural

Podigger adota um **estilo monolítico modular** no backend, com **Service Layer** isolando regras de domínio, e um **frontend desacoplado** com proxy reverso interno.

### 2.1 Backend — monólito modular Django

- **Padrão:** Django apps por domínio (`accounts/`, `podcasts/`, `config/`) — não por tipo técnico.
- **Camadas por app:**
  - `models.py` — modelos Django (camada de dados)
  - `serializers.py` — validação e shape de API (camada de transporte)
  - `views.py` — controllers DRF (ViewSets + generics)
  - `services/` — lógica de negócio isolada (`feed_parser.py`, `updater.py`, `podcast_service.py`)
  - `tasks.py` — tarefas assíncronas Celery
  - `permissions.py` / `authentication.py` — RBAC e auth
- **Roteamento:** cada app expõe seu próprio `urls.py` com router DRF; o `config/urls.py` agrega com `include()`.

### 2.2 Frontend — App Router com proxy reverso

- **Framework:** Next.js 16 (App Router) com React 19, Tailwind CSS v4.
- **Padrão de comunicação:** **toda chamada autenticada** ao backend passa pelo proxy `/api/proxy/[...path]` do Next.js, nunca direto. Isso permite:
  - Injetar `access_token` automaticamente a partir do cookie
  - Implementar auto-refresh em caso de 401
  - Encapsular `Set-Cookie` no edge runtime
- **Rotas server vs client:**
  - **Route Handlers** (`src/app/api/*/route.ts`) — server-side, única ponte com o backend.
  - **Pages** (`src/app/<rota>/page.tsx`) — RSC por padrão; client islands marcadas com `"use client"`.
  - **Middleware** (`src/middleware.ts`) — guard de borda, executado no Edge Runtime.
- **State management:**
  - Server state: cache do Next.js + fetch direto
  - Client state local: `useState` / `useReducer`
  - Estado global de auth: `AuthContext` (React Context)

### 2.3 Processamento assíncrono

- **Broker:** Redis 7 (também usado como cache).
- **Tasks periódicas:** `update_base` (revalida feeds), `remove_podcasts` (limpa órfãos), encadeamento de `update_total_episodes`.
- **Tasks ad-hoc:** `add_episode` disparada na criação de podcast.
- **Soft dependency:** Redis é marcado como dependência não-crítica no health check (commit `a3827a2`) — o sistema continua servindo 200 mesmo com Redis degradado.

---

<a id="3-camadas-e-responsabilidades"></a>
## 3. Camadas e responsabilidades

### 3.1 Backend (camadas por app)

```
┌────────────────────────────────────────────────────────────────────┐
│ Camada                │ Arquivo                │ Responsabilidade  │
├────────────────────────────────────────────────────────────────────┤
│ Roteamento            │ config/urls.py         │ Agrega routers   │
│                       │ podcasts/urls.py       │ /api/podcasts/   │
│                       │ accounts/urls.py       │ /api/auth/       │
│ Controllers (DRF)     │ podcasts/views.py      │ ViewSets (CRUD)  │
│                       │ accounts/views.py      │ Generics + auth  │
│ Serializers (DRF)     │ podcasts/serializers.py│ Validação + I/O  │
│                       │ accounts/serializers.py│ Validação + I/O  │
│ Services (domínio)    │ podcasts/services/     │ Lógica de        │
│                       │   - feed_parser.py     │ negócio isolada  │
│                       │   - podcast_service.py │ (idempotência,   │
│                       │   - updater.py         │  validação RSS,  │
│                       │                        │  populate batch) │
│ Models (ORM)          │ podcasts/models.py     │ 6 entidades      │
│                       │ accounts/models.py     │ 1 entidade       │
│ Auth / Permissions    │ accounts/authentication│ CookieJWTAuth    │
│                       │ accounts/permissions.py│ IsAdminRole,     │
│                       │                        │ IsEditorOrAdmin  │
│ Tasks assíncronas     │ podcasts/tasks.py      │ Celery: 4 tasks  │
│ Health check          │ podcasts/health.py     │ DB+Redis (soft)  │
│ Config global         │ config/settings.py     │ DRF, JWT, throttle│
│                       │ config/celery.py       │ App Celery       │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend (camadas)

```
┌────────────────────────────────────────────────────────────────────┐
│ Camada                │ Diretório              │ Função            │
├────────────────────────────────────────────────────────────────────┤
│ Edge Middleware       │ src/middleware.ts      │ Guard de rotas    │
│                       │                        │ sensíveis        │
│ Route Handlers (API)  │ src/app/api/auth/*     │ Bridge p/ Django │
│                       │ src/app/api/proxy/*    │ (cookie + refresh)│
│                       │ src/app/api/health     │ Health check FW  │
│ Pages (RSC)           │ src/app/page.tsx       │ Home              │
│                       │ src/app/login          │ Login             │
│                       │ src/app/register       │ Cadastro          │
│                       │ src/app/add-podcast    │ CRUD (autenticado)│
│                       │ src/app/about          │ About             │
│                       │ src/app/auth/*         │ unauthorized,     │
│                       │                        │ forbidden, pending│
│ Feature components    │ src/components/{home,  │ Lógica de feature │
│                       │   search,podcasts,     │ + composição      │
│                       │   episodes,layout,     │                   │
│                       │   common}              │                   │
│ Design system         │ src/components/ui/     │ Button, Card,     │
│                       │                        │ Input, Badge,     │
│                       │                        │ Icon, Loading     │
│ Providers             │ src/components/        │ ThemeProvider     │
│                       │   providers/           │                   │
│ Context               │ src/contexts/          │ AuthContext       │
│ Lib (cliente)         │ src/lib/               │ api.ts,           │
│                       │                        │ utils.ts,         │
│                       │                        │ constants.ts      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.3 Persistência

- **Banco único:** PostgreSQL 15 com extensões `pg_trgm` (similaridade) e FTS (full-text search).
- **Cache:** `django-redis` (cache framework) + mesmo Redis do broker Celery.
- **Sem read replica, sem sharding.** Volume atual não justifica.

### 3.4 CI/CD

| Workflow | Trigger | Função |
|----------|---------|--------|
| `ci.yml` | PR, push em main | Testes (pytest backend + vitest frontend) |
| `release.yml` | Tag | Release versionado |
| `deploy-staging.yml` | Push em main | Deploy staging |
| `deploy-production.yml` | Tag | Deploy produção |
| `cleanup-images.yml` | Manual/cron | Limpa imagens Docker antigas |

---

<a id="4-fluxos-críticos"></a>
## 4. Fluxos críticos

### 4.1 Login com aprovação gate

```
1. Frontend: POST /api/auth/login (email, password)
2. Next.js Route Handler: encaminha ao Django com body idêntico
3. Django: EmailTokenObtainPairSerializer.validate
   ├─ super().validate() → autentica por email
   └─ if user.approval_status != "approved": raise PermissionDenied (403)
4. Sucesso: response {access, refresh, role, email}
5. Next.js: lê Set-Cookie (headers.getSetCookie), repassa literal
6. Next.js: retorna ao cliente {role, email} (sem expor tokens)
7. AuthContext.login(role, email) → estado em memória
8. Cliente: router.push(next || "/")
```

**Falhas:**
- 403 (pending): exibe "Sua conta aguarda aprovação" sem redirect.
- 401 (credenciais): exibe "Email ou senha inválidos".
- 429 (throttle 5/min): feedback genérico.

### 4.2 Busca com tracking

```
1. Frontend: GET /api/proxy/episodes/?q=<termo>
2. Next.js proxy: injetar access_token do cookie
3. Django: EpisodeViewSet → Episode.objects.search(q)
4. EpisodeManager.search:
   a. Track PopularTerm: update_or_create(q, defaults={times: F+1})
   b. FTS: SearchVector(title:A, description:B) com config='portuguese'
   c. Filtro adicional: language do podcast? (não observado)
   d. Se rank > 0: retorna resultados ranqueados
   e. Senão: fallback trigram__gt=0.1, order_by(-trigram, -published)
5. Response paginado DRF {count, next, previous, results}
6. Frontend: renderiza EpisodeList
```

### 4.3 Adição de podcast (criação + populate assíncrono)

```
1. Frontend: POST /api/proxy/podcasts/ {name, feed}
2. Django: PodcastViewSet.create
   → permission: IsEditorOrAdmin
   → service: PodcastService.create_podcast
3. PodcastService.create_podcast (transaction.atomic):
   a. is_valid_feed(feed) → bozo==0 do feedparser
   b. get_or_create(Podcast, name=name, feed=feed)
   c. Se existing: return {status: "none", message}
   d. Se created: enqueue Celery add_episode.delay(feed)
4. Response: {id, status: "created"} ou {status: "none", message}
5. Celery worker (assíncrono):
   a. add_episode → EpisodeUpdater.populate
   b. Para cada item do feed: criar Episode + Tag get_or_create + M2M
   c. Idempotente via Episode.link (unique)
6. Próximo update_base (periódico) revalida e atualiza total_episodes
```

### 4.4 Auto-refresh no proxy

```
1. Frontend: X HTTP via /api/proxy/[...path]
2. Proxy: body lido em ArrayBuffer (pré-leitura para permitir retry)
3. Proxy: encaminha ao Django com cookie access_token
4. Se response != 401: repassa ao cliente (as-is)
5. Se response == 401:
   a. POST /api/auth/token/refresh/ com cookie refresh_token
   b. Se sucesso: extrai novo access_token do Set-Cookie via regex
   c. Re-envia request original (mesmo body ArrayBuffer) com novo access_token
   d. Repassa Set-Cookie do refresh ao cliente
6. Se refresh falha: 302 → /auth/unauthorized?next=... + clear cookies
```

---

<a id="5-integrações-externas"></a>
## 5. Integrações externas

| Integração | Tipo | Protocolo | Formato | Quem consome | Quem produz |
|------------|------|-----------|---------|--------------|-------------|
| **Feeds RSS/Atom** | Pull | HTTP GET | RSS 2.0 / Atom 1.0 | `services/feed_parser.py` | Servidores de podcasts externos |
| **PostgreSQL 15** | Storage | TCP | SQL (psycopg2) | Django ORM | — |
| **Redis 7** | Broker + cache | TCP | RESP | Celery worker, django-redis | — |
| **Celery Beat** | Scheduler | In-process | — | `tasks.py` | — |
| **JWT (SimpleJWT)** | Auth | Cookie HttpOnly | HS256 | `CookieJWTAuthentication` | `TokenObtainCookieView` |
| **Nginx** | Reverse proxy | HTTP/HTTPS | — | Backend, Frontend | TLS termination |
| **Django Admin** | Painel | HTTP | HTML | Admin role | — |
| **Postman collection** | Documentação | — | JSON | Devs (staging) | `docs/postman/` |

**Sistemas externos consumidos:**
- **Feeds RSS/Atom de podcasts** — universo aberto, sem contrato. O `feedparser` absorve variações. Validação leve: `bozo==0`. Sem retry exponencial; sem rate limiting específico.

**APIs expostas:**
- `/api/auth/*` — registro, login, refresh, logout, gestão de usuários
- `/api/podcasts/`, `/api/episodes/`, `/api/topic-suggestions/`, `/api/popular-terms/` — CRUD de domínio
- `/health/` — health check
- `/admin/` — Django admin (Django built-in)

---

<a id="6-decisões-arquiteturais-canônicas"></a>
## 6. Decisões arquiteturais canônicas

> 10 ADRs retroativos foram extraídos pelo Detetive a partir da história Git. Resumo:

| # | Decisão | Status | ADR |
|---|---------|--------|-----|
| 1 | Aprovação de novos usuários via admin (approval gate) | ✅ Ativa | `001-approval-gate.md` |
| 2 | JWT em cookies HttpOnly com throttling | ✅ Ativa | `002-jwt-httponly-cookies.md` |
| 3 | FTS via PostgreSQL com config `portuguese` | ✅ Original, ativa | `003-postgresql-fts-trigram.md` |
| 4 | Redis como soft dependency (health check tolerante) | ✅ Ativa | `004-redis-soft-dependency.md` |
| 5 | Pipeline assíncrono Celery | ✅ Ativa | `005-celery-pipeline.md` |
| 6 | Material Symbols Rounded como sistema de ícones | ✅ Ativa | `006-material-symbols-rounded.md` |
| 7 | Proxy auto-refresh no Next.js | ✅ Ativa | `007-proxy-auto-refresh.md` |
| 8 | Approval status ortogonal a role | ✅ Ativa | `008-approval-status-orthogonal.md` |
| 9 | TopicSuggestion como model separado | ✅ Ativa | `009-topic-suggestion-separate-model.md` |
| 10 | Custom User com email como identificador | ✅ Ativa | `010-custom-user-email.md` |

Detalhes completos em `_reversa_sdd/adrs/`.

---

<a id="7-dívida-técnica-conhecida"></a>
## 7. Dívida técnica conhecida

### 7.1 Código / modelo

| # | Dívida | Origem | Impacto | Localização | Confiança |
|---|--------|--------|---------|-------------|-----------|
| DT-1 | `Episode.to_json` (JSONField) armazena snapshot bruto do parser, sem limite de tamanho | Herança da migração Flask→Django | Crescimento descontrolado do banco | `models.py:Episode` | 🟡 |
| DT-2 | `_strip_html` usa regex não robusto para limpar descrição | Implementação original | HTML malformado pode vazar | `services/feed_parser.py:14-26` | 🟡 |
| DT-3 | Sem `db.CheckConstraint` para `User.role` e `User.approval_status` | Validação apenas na view | Garantia depende de validação em runtime | `accounts/models.py:User` | 🟡 |
| DT-4 | `UserApproveView` não registra quem/quando aprovou | Falta de auditoria | Sem rastreabilidade (gap conhecido, R-USER-08) | `accounts/views.py:223-236` | 🔴 |
| DT-5 | Logout não invalida JWT (sem blacklist) | Falta de chamada a `/api/auth/token/blacklist/` | Token ainda válido até `exp` (AI-5, gap conhecido) | `api/auth/logout/route.ts` | 🔴 |
| DT-6 | Sem rate limit específico no endpoint de busca | Config de throttle incompleta | `PopularTerm` pode ser inflado (AI-4, gap conhecido) | `EpisodeViewSet` | 🔴 |
| DT-7 | `UserRoleUpdateView` permite admin se auto-promover/rebaixar | Validação ausente | Sem proteção `pk != request.user.pk` (R-USER-09). Decisão consciente (AI-6) | `accounts/views.py:254-275` | 🟢 (intencional) |
| DT-8 | Assimetria de query param: `q` em episodes, `search` em podcasts | Configuração DRF diferente | Inconsistência superficial | `views.py` (DRF `search_fields`) | 🟡 |
| DT-9 | `lang="en"` no `<html>` enquanto UI é PT-BR | Default Next.js não customizado | Acessibilidade i18n inconsistente | `layout.tsx` | 🟡 |
| DT-10 | `ThemeProvider` existe mas toggle não exposto no Navbar | Feature incompleta | Sempre renderiza `dark` | `ThemeProvider.tsx`, `Navbar.tsx` | 🟡 |

### 7.2 Dependências e configuração

| # | Dívida | Origem | Impacto | Confiança |
|---|--------|--------|---------|-----------|
| DT-11 | Drift entre `requirements.txt` e `pyproject.toml`: `djangorestframework-simplejwt` está em requirements mas não em pyproject; `hypothesis` idem; `psycopg2` vs `psycopg2-binary` | Sincronização manual | Possível falha de install ou lock inconsistente | 🟡 |
| DT-12 | `PROJECT.md` cita Django 5.2.11, real é 5.2.13 | Documentação não atualizada | Confusão para onboarding | 🟡 |
| DT-13 | Sem `db.CheckConstraint` para `PopularTerm.times` ≥ 1 | Não implementado | Validação depende de defaults | 🟡 |

### 7.3 Cobertura de testes

| # | Gap | Módulo | Impacto |
|---|-----|--------|---------|
| DT-14 | Cobertura de testes em `accounts` (~2 arquivos) é menor que `podcasts` (~8 arquivos) | `accounts/` | Áreas críticas (auth, aprovação) menos exercitadas |
| DT-15 | Sem testes para o Route Handler do proxy de refresh | `api/proxy/[...path]/route.ts` | Fluxo central sem cobertura automatizada |

---

<a id="8-mapa-de-artefatos-arquiteturais"></a>
## 8. Mapa de artefatos arquiteturais

Esta pasta `_reversa_sdd/` contém a documentação arquitetural completa, organizada em artefatos transversais (na raiz) e por unidade (em subpastas, aplicadas pelo Redator):

| Artefato | Conteúdo |
|----------|----------|
| `architecture.md` | Este documento — visão geral |
| `c4-context.md` | C4 Nível 1 (sistema, personas, sistemas externos) |
| `c4-containers.md` | C4 Nível 2 (apps, serviços, dados) |
| `c4-components.md` | C4 Nível 3 (componentes internos dos containers-chave) |
| `erd-complete.md` | ERD com todas as entidades e relacionamentos |
| `traceability/spec-impact-matrix.md` | Matriz de impacto entre componentes |
| `inventory.md` | Inventário de superfície (Scout) |
| `dependencies.md` | Dependências de produção e dev |
| `code-analysis.md` | Análise técnica de código (Arqueólogo) |
| `data-dictionary.md` | Dicionário de dados (Arqueólogo) |
| `domain.md` | Glossário e regras de negócio (Detetive) |
| `state-machines.md` | Máquinas de estado (Detetive) |
| `permissions.md` | Matriz de permissões RBAC (Detetive) |
| `adrs/` | 10 ADRs retroativos (Detetive) |
| `flowcharts/` | Fluxogramas por módulo (Arqueólogo) |
| `frontend-ui/`, `frontend-pages/`, `frontend-features/` | Mapeamento legacy→moderno (Arqueólogo) |

> Próximas etapas do plano: Redator (specs SDD por componente) → Revisor (revisão cruzada).
