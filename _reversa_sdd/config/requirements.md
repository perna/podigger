# config

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Unit: pacote de configuração Django `backend/config/` (settings, urls raiz, Celery, ASGI/WSGI, version)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O pacote `config` é o **ponto único de configuração** do backend podigger. Concentra settings Django/DRF/JWT, montagem de URLs raiz, bootstrap da app Celery, entry points ASGI/WSGI e o versionamento canônico exposto em `/health/`. Não contém lógica de negócio — apenas cabeamento de infraestrutura. Toda customização da operação (banco, Redis, throttle, CORS, JWT, allowed hosts) mora aqui.

## Responsabilidades

- Carregar variáveis de ambiente com precedência `DATABASE_URL` > `DJANGO_*`/`REDIS_*`/`CELERY_*` > defaults (django-environ).
- Configurar o `REST_FRAMEWORK` (autenticação, permissão default, renderer, filter, paginação, throttle rates por escopo).
- Configurar o `SIMPLE_JWT` (TTL access/refresh, rotação, blacklist, claims customizadas via `accounts.serializers.EmailTokenObtainPairSerializer`).
- Conectar PostgreSQL via `DATABASE_URL` ou variáveis individuais.
- Conectar Redis (cache default em `redis://…:6379/1`, broker Celery em `redis://…:6379/0`).
- Montar o `ROOT_URLCONF` que inclui `admin/`, `api/auth/`, `api/` (podcasts) e `health/`.
- Bootstrapping do app Celery `podigger` com autodiscover nas apps Django registradas.
- Expor a aplicação WSGI (`config.wsgi.application`) e ASGI (`config.asgi.application`) para servidores tradicionais e ASGI.
- Expor a versão canônica do backend via endpoint `health/`.

## Regras de Negócio

- 🟢 **R-CFG-01** — `SECRET_KEY` é lido de `DJANGO_SECRET_KEY` ou `os.environ`, com default `dev-secret-key` (apenas para dev; produção deve injetar valor real).
- 🟢 **R-CFG-02** — `DEBUG` é lido de `DJANGO_DEBUG` (bool); em produção, espera-se `DJANGO_DEBUG=0`/`False`.
- 🟢 **R-CFG-03** — `ALLOWED_HOSTS` vem de `DJANGO_ALLOWED_HOSTS` (lista, default `["*"]` para dev).
- 🟢 **R-CFG-04** — `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` faz o Django confiar no header do Nginx (ADR-007) e gerar URLs `https://` em produção.
- 🟢 **R-CFG-05** — `AUTH_USER_MODEL = "accounts.User"` registra o custom user baseado em email.
- 🟢 **R-CFG-06** — `CACHES.default` usa `django_redis.cache.RedisCache` apontando para `REDIS_URL` (default `redis://localhost:6379/1`).
- 🟢 **R-CFG-07** — `CELERY_BROKER_URL` e `CELERY_RESULT_BACKEND` ambos default `redis://localhost:6379/0`; produção deve injetar URLs externas.
- 🟢 **R-CFG-08** — Celery usa serialização JSON (`CELERY_ACCEPT_CONTENT`, `CELERY_TASK_SERIALIZER`, `CELERY_RESULT_SERIALIZER`).
- 🟢 **R-CFG-09** — `CELERY_TIMEZONE = "UTC"` — todas as tarefas e `expires` operam em UTC.
- 🟢 **R-CFG-10** — `LANGUAGE_CODE = "en-us"` (Django) — mas mensagens de erro da app estão em PT-BR (ver accounts). Aceitável.
- 🟢 **R-CFG-11** — Throttle rates default: `anon: 100/min`, `user: 200/min`, `login: 5/min`, `register: 3/min`.
- 🟢 **R-CFG-12** — `PAGE_SIZE = 10` para `PageNumberPagination`.
- 🟢 **R-CFG-13** — CORS permissivo em DEBUG (`CORS_ALLOW_ALL_ORIGINS = True`); em produção exige `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`.
- 🟢 **R-CFG-14** — JWT access TTL configurável via `JWT_ACCESS_TOKEN_MINUTES` (default 15, Perna 2026-06-06), refresh via `JWT_REFRESH_TOKEN_DAYS` (default 1).
- 🟢 **R-CFG-15** — `ROTATE_REFRESH_TOKENS = True` (rotation ativa, emite novo refresh token a cada refresh), `BLACKLIST_AFTER_ROTATION = False` (blacklist desabilitada — decisão Perna 2026-06-06).
- 🟢 **R-CFG-16** — `TOKEN_BLACKLIST_ENABLED = False` — sem blacklist de JWT. App `rest_framework_simplejwt.token_blacklist` pode ser removida de `INSTALLED_APPS`.
- 🟢 **R-CFG-17** — `DEFAULT_AUTHENTICATION_CLASSES` lista Cookie-JWT como primária; Session e Basic ficam apenas para o Django Admin.
- 🟢 **R-CFG-18** — `DEFAULT_PERMISSION_CLASSES` é `IsAuthenticatedOrReadOnly` — endpoints GET são públicos (read-only), demais exigem autenticação.
- 🟢 **R-CFG-19** — `DEFAULT_RENDERER_CLASSES` é apenas `JSONRenderer` (DRF nunca renderiza HTML browseable API).
- 🟢 **R-CFG-20** — `DEFAULT_FILTER_BACKENDS` é `DjangoFilterBackend` — habilita `?field=value` em ViewSets.
- 🟢 **R-CFG-21** — URLs raiz: `admin/`, `api/auth/` (accounts), `api/` (podcasts), `health/`.
- 🟢 **R-CFG-22** — `config.celery.app` é a instância `Celery("podigger")` carregada com `namespace="CELERY"`; tarefas autodiscover nas apps registradas.
- 🟢 **R-CFG-23** — `config.asgi.application` e `config.wsgi.application` são expostos para Gunicorn (WSGI) e Daphne/Uvicorn (ASGI).
- 🟡 **R-CFG-24** — Senha mínima de 8 caracteres é validada apenas no `RegisterSerializer` da app `accounts`; `AUTH_PASSWORD_VALIDATORS` usa apenas `UserAttributeSimilarityValidator` (padrão Django, sem `MinimumLengthValidator` explícito).
- 🟡 **R-CFG-25** — Defaults de `SECRET_KEY` e `ALLOWED_HOSTS=["*"]` facilitam dev local, mas são inseguros em produção se não sobrescritos.
- 🔴 **R-CFG-26** — Não há validação fail-fast em produção que rejeite defaults inseguros (lacuna de hardening, sugerida em `domain.md`).

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Carregar settings do Django a partir de `backend/.env` (se existir) + env vars do processo, com precedência para env vars | Must | `import config.settings` em qualquer entry point resolve todas as variáveis; sem `.env` ainda funciona (fallback para defaults). |
| RF-02 | Suportar `DATABASE_URL` (formato `postgres://user:pass@host:port/db`) OU variáveis `DATABASE_*` individuais | Must | Subir com `DATABASE_URL=postgres://…` popula `DATABASES.default` via `env.db()`. Sem `DATABASE_URL`, usa individuais. |
| RF-03 | Conectar Redis como cache default e como broker Celery | Must | `CACHES.default` aponta para `REDIS_URL`; `CELERY_BROKER_URL` e `CELERY_RESULT_BACKEND` apontam para a Redis instance. |
| RF-04 | Aplicar throttling nos escopos `anon`, `user`, `login`, `register` | Must | `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES` contém as 4 chaves com rates documentados. |
| RF-05 | Configurar JWT HS256 com rotação (sem blacklist) | Must | `SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True`, `BLACKLIST_AFTER_ROTATION=False`, `TOKEN_BLACKLIST_ENABLED=False`, `ALGORITHM="HS256"`, `ACCESS_TOKEN_LIFETIME=15min`. |
| RF-06 | Registrar custom user model | Must | `AUTH_USER_MODEL = "accounts.User"` presente em settings. |
| RF-07 | Carregar URLs raiz com `admin`, `api/auth`, `api`, `health` | Must | `GET /admin/`, `GET /api/auth/users/`, `GET /api/podcasts/`, `GET /health/` retornam 200/302 conforme auth. |
| RF-08 | Expor entry point WSGI | Must | `config.wsgi.application` é uma aplicação WSGI chamável (testável com `wsgiref.simple_server`). |
| RF-09 | Expor entry point ASGI | Must | `config.asgi.application` é uma aplicação ASGI chamável. |
| RF-10 | Bootstrapping do Celery com autodiscover | Must | `from config.celery import app` é importável; `app.autodiscover_tasks()` carrega `tasks.py` das apps registradas. |
| RF-11 | Confiar no proxy para HTTPS (Nginx) | Must | `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` faz `request.is_secure()` retornar `True` quando atrás do proxy. |
| RF-12 | Permitir CORS com credenciais | Must | `CORS_ALLOW_CREDENTIALS = True`; modo permissivo em DEBUG, restrito em produção via `CORS_ALLOWED_ORIGINS`. |
| RF-13 | Forçar JSON renderer (sem HTML browseable) | Must | `DEFAULT_RENDERER_CLASSES` contém apenas `JSONRenderer`. |
| RF-14 | Paginação padrão de 10 itens por página | Should | `PageNumberPagination.page_size = 10`; `?page=2` retorna próxima página. |
| RF-15 | Endpoint de health check expõe versão | Should | `GET /health/` retorna JSON com `status: "ok"` e `version` (de `config.__version__`). |
| RF-16 | Suportar `corsheaders` antes do `SecurityMiddleware` | Must | Ordem do `MIDDLEWARE`: `corsheaders.middleware.CorsMiddleware` é o primeiro (requisito do pacote). |
| RF-16 | Suportar `corsheaders` antes do `SecurityMiddleware` | Must | Ordem do `MIDDLEWARE`: `corsheaders.middleware.CorsMiddleware` é o primeiro (requisito do pacote). |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | HTTPS forçado em produção via header do proxy | `SECURE_PROXY_SSL_HEADER` em `settings.py:31` | 🟢 |
| Segurança | Cookies `secure` quando `DEBUG=False` | `accounts/views.py` consulta `settings.DEBUG` (herdado); cross-ref `accounts/contracts.md` | 🟢 |
| Segurança | Custom User com email (sem username) | `AUTH_USER_MODEL = "accounts.User"` em `settings.py:52` | 🟢 |
| Segurança | JWT HS256 com chave do `SECRET_KEY` | `SIMPLE_JWT.SIGNING_KEY = SECRET_KEY`, `ALGORITHM = "HS256"` em `settings.py:209-210` | 🟢 |
| Segurança | Token rotation habilitada (sem blacklist) | `settings.py:207` (`ROTATE_REFRESH_TOKENS=True`); `BLACKLIST_AFTER_ROTATION=False`, `TOKEN_BLACKLIST_ENABLED=False` (Perna 2026-06-06) | 🟢 |
| Segurança | Throttle por escopo protege brute force | `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES` em `settings.py:178-183` | 🟢 |
| Segurança | CORS permissivo apenas em DEBUG; produção exige allowlist | `settings.py:189-194` | 🟢 |
| Segurança | `ALLOWED_HOSTS=["*"]` por default — risco em prod se não configurado | `settings.py:28` | 🟡 / 🔴 |
| Segurança | `SECRET_KEY` tem default `dev-secret-key` — risco em prod se não configurado | `settings.py:24-25` | 🟡 / 🔴 |
| Performance | Redis como cache (django-redis) reduz latência em queries repetidas | `CACHES.default.BACKEND = "django_redis.cache.RedisCache"` em `settings.py:127` | 🟢 |
| Performance | Paginação de 10 itens por página (não carregar tabelas inteiras) | `PAGE_SIZE = 10` em `settings.py:176` | 🟢 |
| Escalabilidade | Celery worker + beat desacopla trabalho pesado (parse de feeds) | `config/celery.py` + `podcasts/tasks.py` | 🟢 |
| Escalabilidade | Celery broker em Redis (compartilhado com cache, db 0) — limite de throughput | `CELERY_BROKER_URL` default `redis://localhost:6379/0` | 🟡 |
| Disponibilidade | Configuração suporta `DATABASE_URL` (12-factor) | `settings.py:89-91` | 🟢 |
| Disponibilidade | Fuso horário UTC para evitar inconsistência entre web/worker | `CELERY_TIMEZONE = "UTC"`, `TIME_ZONE = "UTC"` | 🟢 |
| Manutenibilidade | Configuração 12-factor: todas as configs críticas vêm de env vars | `django-environ` + 12 envs de exemplo (dev/staging/prod) | 🟢 |
| Manutenibilidade | Versionamento canônico em `config.__version__` | `_config/manifest.yaml` referencia `config/__version__.py` | 🟡 |
| Auditoria | **Sem** fail-fast na importação de settings em produção | `settings.py` não tem `assert DEBUG is False or "dev" not in SECRET_KEY` | 🔴 |
| Internacionalização | `LANGUAGE_CODE = "en-us"` (Django interno) — mensagens de app são PT-BR | `settings.py:151` | 🟢 / 🟡 |

## Critérios de Aceitação

```gherkin
# Carregamento de settings
Dado que backend/.env existe com DJANGO_DEBUG=0, DJANGO_SECRET_KEY=abc, DATABASE_URL=postgres://u:p@h:5432/d
Quando importo config.settings
Então DEBUG é False, SECRET_KEY=="abc", DATABASES.default é configurado a partir do DATABASE_URL

# Sem DATABASE_URL
Dado que não há DATABASE_URL definido
E DATABASE_NAME=podigger, DATABASE_USER=docker, DATABASE_HOST=db
Quando importo config.settings
Então DATABASES.default.NAME=="podigger", HOST=="db", ENGINE=="django.db.backends.postgresql"

# Throttling
Dado que anônimo faz 6 POSTs em /api/auth/token/ dentro de 1 minuto
Quando o 6º request chega
Então retorna 429 (escopo login, 5/min)

# JWT rotation
Dado que tenho refresh_token válido
Quando POST /api/auth/token/refresh/ retorna 200
Então o refresh_token antigo é invalidado (blacklist)

# Health check
Quando GET /health/
Então retorna 200 com {"status": "ok", "version": "<de config.__version__>"}

# URLs raiz
Dado que o backend está rodando
Então GET /admin/ → 302 (redirect to login)
E GET /api/auth/users/ → 401 (sem auth)
E GET /api/podcasts/ → 200 (read-only público)
E GET /health/ → 200 JSON

# Celery autodiscover
Dado que o worker Celery inicia com celery -A config worker
Então ele descobre tasks em accounts.tasks e podcasts.tasks automaticamente

# CORS em DEBUG
Dado que DEBUG=True
Quando um request vem de origem http://localhost:3000 com credenciais
Então CORS permite (Access-Control-Allow-Origin: http://localhost:3000)

# CORS em produção
Dado que DEBUG=False e CORS_ALLOWED_ORIGINS=["https://podigger.com"]
Quando um request vem de http://malicioso.com
Então CORS nega (Access-Control-Allow-Origin ausente)
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Carregar env + settings Django | Must | Sem isso, app não sobe |
| Conexão PostgreSQL/Redis | Must | Toda persistência depende |
| JWT HS256 + rotação + blacklist | Must | Identidade do sistema |
| Throttle por escopo | Must | Mitiga brute force em login |
| CORS com credenciais | Must | Frontend Next.js em outro host |
| Custom user model | Must | Toda a app accounts depende |
| URL routing raiz | Must | Único caminho de entrada HTTP |
| Celery autodiscover | Must | Tarefas assíncronas não rodam sem isso |
| ASGI/WSGI entry points | Must | Necessários para Gunicorn/Daphne |
| Health check com versão | Should | Operacional (load balancer, k8s) |
| `PageNumberPagination` 10/pág | Should | UX consistente |
| `UserAttributeSimilarityValidator` | Should | Defesa de password |
| Fail-fast em produção contra defaults inseguros | Won't (gap) | Lacuna R-CFG-26 — melhoria futura |
| HTTPS forçado em produção | Should | `SECURE_PROXY_SSL_HEADER` + Nginx já mitigam |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `backend/config/settings.py:1-21` | `django-environ` import + leitura opcional de `.env` | 🟢 |
| `backend/config/settings.py:23-32` | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `SECURE_PROXY_SSL_HEADER` | 🟢 |
| `backend/config/settings.py:34-49` | `INSTALLED_APPS` (DRF, simplejwt, blacklist, cors, accounts, podcasts) | 🟢 |
| `backend/config/settings.py:51-52` | `AUTH_USER_MODEL = "accounts.User"` | 🟢 |
| `backend/config/settings.py:54-63` | `MIDDLEWARE` (corsheaders primeiro, security, session, csrf, auth) | 🟢 |
| `backend/config/settings.py:65` | `ROOT_URLCONF = "config.urls"` | 🟢 |
| `backend/config/settings.py:83-84` | `WSGI_APPLICATION`, `ASGI_APPLICATION` | 🟢 |
| `backend/config/settings.py:88-113` | `DATABASES` (DATABASE_URL ou vars individuais) | 🟢 |
| `backend/config/settings.py:116-121` | `AUTH_PASSWORD_VALIDATORS` (apenas UserAttributeSimilarity) | 🟢 / 🟡 |
| `backend/config/settings.py:123-135` | `CACHES` (django-redis, db 1) | 🟢 |
| `backend/config/settings.py:137-149` | Celery (broker, backend, JSON, UTC) | 🟢 |
| `backend/config/settings.py:151-154` | `LANGUAGE_CODE = "en-us"`, `TIME_ZONE = "UTC"` | 🟢 |
| `backend/config/settings.py:156-157` | `STATIC_URL`, `STATIC_ROOT` | 🟢 |
| `backend/config/settings.py:160-184` | `REST_FRAMEWORK` (auth, perm, renderer, filter, paginate, throttle) | 🟢 |
| `backend/config/settings.py:186-194` | CORS (permissivo em DEBUG, restrito em prod) | 🟢 |
| `backend/config/settings.py:199-216` | `SIMPLE_JWT` (access 5min, refresh 1d, HS256, rotação, blacklist) | 🟢 |
| `backend/config/urls.py:1-11` | `urlpatterns` (admin, api/auth, api, health) | 🟢 |
| `backend/config/celery.py:1-17` | `app = Celery("podigger")`, autodiscover | 🟢 |
| `backend/config/asgi.py:1-7` | `application = get_asgi_application()` | 🟢 |
| `backend/config/wsgi.py:1-7` | `application = get_wsgi_application()` | 🟢 |
| `backend/config/__version__.py` | Versão canônica (referenciada por `/health/`) | 🟡 |
| `backend/manage.py` | Django CLI entry point | 🟢 |
| `.env.example`, `.env.staging.example`, `.env.production.example` | Templates 12-factor | 🟢 |
| `_reversa_sdd/adrs/002-jwt-httponly-cookies.md` | ADR-002 referencia settings (TTL, rotação) | 🟢 |
| `_reversa_sdd/adrs/004-redis-soft-dependency.md` | Redis como soft dependency | 🟢 |
| `_reversa_sdd/adrs/005-celery-pipeline.md` | Pipeline Celery | 🟢 |
| `_reversa_sdd/adrs/007-proxy-auto-refresh.md` | `SECURE_PROXY_SSL_HEADER` | 🟢 |
