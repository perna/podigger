# C4 — Nível 2: Containers

> Gerado pelo Arquiteto em 2026-06-05
> Decomposição do sistema em aplicações executáveis, serviços de dados e middleware.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. Diagrama

```mermaid
C4Container
    title Diagrama C4 — Containers (Nível 2) — podigger

    Person(visitor, "Visitante", "Navega e busca sem autenticação")
    Person(editor, "Editor/Admin", "Adiciona podcasts, gerencia usuários")

    System_Boundary(podigger_sys, "podigger") {
        Container(nginx, "Nginx", "nginx:alpine", "Reverse proxy + TLS termination")
        Container(frontend, "Frontend Next.js", "Node.js 24, Next.js 16, React 19, Tailwind v4", "Renderiza páginas, executa middleware, Route Handlers e proxy catch-all")
        Container(backend, "Backend Django", "Python 3.12, Django 5.2, DRF, gunicorn/uvicorn", "API REST sob /api/ e /api/auth/. Gerencia usuários, podcasts, episódios.")
        Container(celery_worker, "Celery Worker", "Python 3.12, Celery 5.5", "Processa tasks assíncronas: add_episode, update_base, remove_podcasts")
        Container(celery_beat, "Celery Beat", "Python 3.12, Celery Beat", "Agendador de tasks periódicas")
        ContainerDb(postgres, "PostgreSQL 15", "PostgreSQL 15-alpine + pg_trgm + FTS", "Persistência: 7 modelos de domínio, contadores denormalizados, PopularTerm")
        ContainerDb(redis, "Redis 7", "redis:7-alpine", "Broker Celery + cache django-redis")
    }

    System_Ext(rss, "Feeds RSS/Atom", "Hosts externos de podcasts")

    Rel(visitor, nginx, "HTTPS", "443/TCP")
    Rel(editor, nginx, "HTTPS (autenticado)", "443/TCP + cookies HttpOnly")
    Rel(nginx, frontend, "Proxy /, /login, /register, /about, /add-podcast, /api/proxy/*, /api/auth/* (route handlers), /api/health", "HTTP/3000")
    Rel(nginx, backend, "Proxy /api/, /api/auth/, /admin/, /health/ (apenas alguns subdomínios)", "HTTP/8000")

    Rel(frontend, backend, "Chamadas autenticadas via /api/proxy/* e /api/auth/*", "HTTPS interno + cookie access_token")

    Rel(backend, postgres, "SQL via psycopg2", "TCP 5432")
    Rel(backend, redis, "Cache django-redis + enqueue de tasks", "TCP 6379")

    Rel(celery_worker, postgres, "Lê e escreve (update_total_episodes, remove_podcasts)", "TCP 5432")
    Rel(celery_worker, redis, "Consome tasks", "TCP 6379")
    Rel(celery_worker, rss, "GET RSS/Atom feeds", "HTTP/HTTPS")

    Rel(celery_beat, redis, "Agenda tasks periódicas", "TCP 6379")
```

---

## 2. Tabela de containers

| Container | Tecnologia | Build | Porta | Responsabilidade | Escala | Confiança |
|-----------|-----------|-------|-------|------------------|--------|-----------|
| **Nginx** | `nginx:alpine` | `nginx-proxy/` (config em `conf.d/`) | 80, 443 | TLS termination, reverse proxy, subdomínios dash-separated | 1+ instâncias | 🟢 |
| **Frontend Next.js** | Node.js 24 + Next.js 16.2 | `frontend/Dockerfile(.production)` | 3000 | Render RSC, Route Handlers (auth/proxy/health), Edge Middleware, Design System | 1+ instâncias | 🟢 |
| **Backend Django** | Python 3.12 + Django 5.2.13 + DRF | `backend/Dockerfile(.production)` (gunicorn prod / uvicorn dev) | 8000 | API REST, modelos ORM, serialização, RBAC, throttling, health check | 1+ instâncias | 🟢 |
| **Celery Worker** | Python 3.12 + Celery 5.5.3 | mesmo image do backend | — | Tasks assíncronas (add_episode, update_base, update_total_episodes, remove_podcasts) | 1+ instâncias | 🟢 |
| **Celery Beat** | Python 3.12 + Celery Beat | mesmo image do backend | — | Agendador de tasks periódicas | **1 instância** (singleton) | 🟡 |
| **PostgreSQL 15** | `postgres:15-alpine` + `pg_trgm` | volume persistente | 5432 | Persistência, FTS (config `portuguese`), similaridade trigrama | 1 (sem replica) | 🟢 |
| **Redis 7** | `redis:7-alpine` | volume persistente | 6379 | Broker Celery + cache django-redis | 1 | 🟢 |

---

## 3. Decisões de comunicação

### 3.1 Frontend ↔ Backend

- **Toda chamada autenticada** passa pelo proxy Next.js (`/api/proxy/[...path]`).
- O proxy injeta o cookie `access_token` automaticamente.
- O Django recebe cookies HttpOnly (não header `Authorization`).
- O Route Handler do login (`/api/auth/login`) e logout (`/api/auth/logout`) são pontes diretas (não passam pelo proxy genérico) para permitir manipular `Set-Cookie` no edge.
- 🟡 **Implicação:** existe um hop extra (Next.js → Django) em toda chamada, mas isola cookies, CSRF e a URL do backend.

### 3.2 Backend ↔ PostgreSQL

- Conexão persistente via `psycopg2` (prod) / `psycopg2-binary` (dev).
- Django ORM faz pool automático.
- 🟡 **Sem pool explícito (PgBouncer).** Em produção atual, escala vertical.

### 3.3 Backend ↔ Redis

- `django-redis` para cache.
- `celery[redis]` para broker.
- **Soft dependency** desde commit `a3827a2` — health check não falha se Redis estiver fora.

### 3.4 Celery Worker ↔ Feeds RSS

- `feedparser` + `requests` para fetch HTTP.
- **Sem retry exponencial explícito** observado — falhas de feed individual são logadas e seguem o batch (R-CEL-05).

---

## 4. Configuração de runtime

### 4.1 Backend

| Variável | Origem | Uso |
|----------|--------|-----|
| `DJANGO_SECRET_KEY` | `django-environ` (`os.environ`) | Assinatura de sessão e JWT |
| `DJANGO_DEBUG` | env | Modo debug |
| `DJANGO_ALLOWED_HOSTS` | env | Hosts permitidos |
| `DATABASE_URL` | env | Conexão PostgreSQL |
| `REDIS_URL` | env | Broker + cache |
| `CORS_ALLOWED_ORIGINS` | env | Origens permitidas |
| `CSRF_TRUSTED_ORIGINS` | env | Origens confiáveis para CSRF |
| `SECURE_PROXY_SSL_HEADER` | setting | Reconhece HTTPS via header do proxy (commit `5d4efa1`) |
| `REST_FRAMEWORK.throttle_scope` | setting | Scopes `anon`, `user`, `login`, `register` |

### 4.2 Frontend

| Variável | Origem | Uso |
|----------|--------|-----|
| `NEXT_PUBLIC_API_URL` | env | URL do backend Django (todos Route Handlers) |
| `NEXT_PUBLIC_ENVIRONMENT` | env | Tag no `/api/health` |
| `NEXT_PUBLIC_APP_VERSION` | env | Versão exibida na About |

### 4.3 Docker Compose (multi-arquivo)

| Arquivo | Stack |
|---------|-------|
| `docker-compose.yml` | Stack completa (backend + db + redis + celery + frontend) |
| `docker-compose.base.yml` | Serviços base compartilhados |
| `docker-compose.local.yml` | Apenas Postgres + Redis (sem app, para dev fora de container) |
| `docker-compose.staging.yml` | Configs de staging |
| `docker-compose.production.yml` | Configs de produção |

---

## 5. Saúde e observabilidade

| Sinal | Onde | Cobertura |
|-------|------|-----------|
| **Health check backend** | `podcasts/health.py` (exposto em `/health/`) | DB + Redis (soft) |
| **Health check frontend** | `src/app/api/health/route.ts` | Apenas `200` (não checa backend) |
| **Logs estruturados** | Não observados | 🟡 Apenas logs padrão Django/Next |
| **Métricas (Prometheus/etc)** | Não observadas | 🔴 Lacuna — sem instrumentação explícita |
| **Tracing distribuído** | Não observado | 🔴 Lacuna — sem OpenTelemetry |

---

## 6. Confiança

| Elemento | Confiança | Origem |
|----------|-----------|--------|
| Containers e tecnologias | 🟢 | `Dockerfile`s, `docker-compose*.yml`, `surface.json` |
| Celery Beat singleton | 🟡 | Inferido (padrão Celery; não documentado explicitamente) |
| Soft dependency Redis | 🟢 | ADR-004 + commit `a3827a2` |
| Sem PgBouncer | 🟢 | Não mencionado em `requirements.txt` nem `docker-compose*.yml` |
| Sem observabilidade centralizada | 🟢 | Não há libs APM/OTel em deps |
