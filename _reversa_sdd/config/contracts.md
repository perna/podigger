# config, Contratos

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Unit: `backend/config/`
> Companions: `requirements.md`, `design.md`, `tasks.md`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral dos Contratos

O pacote `config` expõe **dois tipos de contrato externo**:

1. **HTTP** — apenas o endpoint `/health/` (delegado para `podcasts.health.health_check`).
2. **Variáveis de ambiente** — 16 env vars consumidas, descritas abaixo como contrato 12-factor.

Nenhum endpoint CRUD de domínio vive neste pacote — é puramente cabeamento de infraestrutura.

---

## Contrato HTTP: `GET /health/`

### Request

| Campo | Valor |
|-------|-------|
| Método | `GET` |
| Path | `/health/` |
| Headers | Nenhum obrigatório |
| Body | Nenhum |
| Auth | Não requerida |

### Response — caso saudável (HTTP 200)

```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

### Response — banco OK, cache degradado (HTTP 200)

```json
{
  "status": "degraded",
  "checks": {
    "database": "healthy",
    "cache": "degraded: cache read failed"
  }
}
```

> 🟢 **Por que 200 e não 503:** Redis/cache é soft dependency (ADR-004). Startup probes do k8s precisam passar mesmo enquanto Redis inicializa.

### Response — banco indisponível (HTTP 503)

```json
{
  "status": "unhealthy",
  "checks": {
    "database": "unhealthy: <exception message>",
    "cache": "degraded: <exception message>" // ou "healthy"
  }
}
```

### Status codes

| Status | Quando |
|--------|--------|
| 200 | Banco OK (cache pode estar degradado) |
| 503 | Banco PostgreSQL inacessível |

### Comportamento

```mermaid
flowchart TD
    A[GET /health/] --> B[connection.cursor SELECT 1]
    B --> C{DB OK?}
    C -- não --> D[checks.database = unhealthy status = unhealthy status_code = 503]
    C -- sim --> E[checks.database = healthy]
    E --> F[cache.set health_check, ok, 10]
    F --> G{cache.get == ok?}
    G -- sim --> H[checks.cache = healthy status = healthy 200]
    G -- não --> I[checks.cache = degraded status = degraded 200]
    F -- exception --> J[checks.cache = degraded reason status = degraded 200]
    D --> K[JsonResponse status_code]
    H --> K
    I --> K
    J --> K
```

### Notas de implementação

- 🟢 Função pura Django view, sem DRF, sem autenticação.
- 🟢 Usa `connection.cursor()` diretamente (não ORM) para minimizar overhead.
- 🟢 `cache.set("health_check", "ok", 10)` testa o round-trip de escrita+leitura (não só o `set`).
- 🟡 Versão do backend **não está exposta** no body do health check, apesar de `config/__version__.py` existir. Gap conhecido (ver DT-x em `architecture.md`).
- 🟡 A string `"health_check"` é usada como chave de cache fixa — colisão improvável mas vale documentar.

---

## Contrato de Variáveis de Ambiente (12-factor)

> Tabela canônica para devs, ops e CI. **Toda env var listada aqui é parte do contrato público do `config` package** — mudança de nome, tipo ou default é breaking change.

### Segurança

| Variável | Tipo | Default | Obrigatória em prod? | Notas |
|----------|------|---------|----------------------|-------|
| `DJANGO_SECRET_KEY` | str | `"dev-secret-key"` | **Sim** | Default é placeholder de dev. Produzir valor forte (ex.: `python -c "import secrets; print(secrets.token_urlsafe(50))"`). |
| `DJANGO_DEBUG` | bool | `True` | **Sim** | Em prod, **deve** ser `0` / `False`. |
| `DJANGO_ALLOWED_HOSTS` | list[str] | `["*"]` | **Sim** | Lista separada por vírgula. Ex.: `podigger.com,www.podigger.com`. |
| `CORS_ALLOWED_ORIGINS` | list[str] | `[]` | **Sim** (prod) | Lista separada por vírgula. Ex.: `https://podigger.com`. |
| `CSRF_TRUSTED_ORIGINS` | list[str] | `[]` | **Sim** (prod) | Lista separada por vírgula. Ex.: `https://podigger.com`. |

### Banco de Dados

| Variável | Tipo | Default | Obrigatória em prod? | Notas |
|----------|------|---------|----------------------|-------|
| `DATABASE_URL` | str (Postgres DSN) | `None` | Sim (alternativa) | Formato: `postgres://user:password@host:port/dbname`. Se presente, **sobrescreve** as `DATABASE_*` individuais. |
| `DATABASE_NAME` | str | `"podigger"` | Sim (se `DATABASE_URL` ausente) | |
| `DATABASE_USER` | str | `"docker"` | Sim (se `DATABASE_URL` ausente) | |
| `DATABASE_PASSWORD` | str | `"docker"` | Sim (se `DATABASE_URL` ausente) | |
| `DATABASE_HOST` | str | `"localhost"` | Sim (se `DATABASE_URL` ausente) | `db` no docker-compose, IP/hostname em prod. |
| `DATABASE_PORT` | str | `"5432"` | Não | |

### Cache & Broker

| Variável | Tipo | Default | Obrigatória em prod? | Notas |
|----------|------|---------|----------------------|-------|
| `REDIS_URL` | str (Redis DSN) | `"redis://localhost:6379/1"` | **Sim** | Database 1 (cache). |
| `CELERY_BROKER_URL` | str (Redis DSN) | `"redis://localhost:6379/0"` | **Sim** | Database 0 (broker). |
| `CELERY_RESULT_BACKEND` | str (Redis DSN) | `"redis://localhost:6379/0"` | **Sim** | Pode ser o mesmo broker. |

### JWT

| Variável | Tipo | Default | Obrigatória em prod? | Notas |
|----------|------|---------|----------------------|-------|
| `JWT_ACCESS_TOKEN_MINUTES` | int | `5` | Não | Trade-off segurança × UX. Reduzir aumenta segurança, aumenta refreshes. |
| `JWT_REFRESH_TOKEN_DAYS` | int | `1` | Não | |

### Versão

| Variável | Tipo | Default | Obrigatória? | Notas |
|----------|------|---------|--------------|-------|
| `CONFIG_VERSION` | str | (não consumida) | — | Lacuna: versão é interna em `config/__version__.py`. Se quiser injetar via env, criar T-22b. |

### Exemplo de `.env` (dev)

```bash
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_ALLOWED_HOSTS=*

DATABASE_NAME=podigger
DATABASE_USER=docker
DATABASE_PASSWORD=docker
DATABASE_HOST=localhost
DATABASE_PORT=5432

REDIS_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

JWT_ACCESS_TOKEN_MINUTES=5
JWT_REFRESH_TOKEN_DAYS=1
```

### Exemplo de `.env.production`

```bash
DJANGO_DEBUG=0
DJANGO_SECRET_KEY=<gerar-com-secrets.token_urlsafe>
DJANGO_ALLOWED_HOSTS=podigger.com,www.podigger.com

DATABASE_URL=postgres://podigger_user:<password>@db.internal:5432/podigger_prod

REDIS_URL=redis://redis-cache.internal:6379/1
CELERY_BROKER_URL=redis://redis-broker.internal:6379/0
CELERY_RESULT_BACKEND=redis://redis-broker.internal:6379/0

CORS_ALLOWED_ORIGINS=https://podigger.com,https://www.podigger.com
CSRF_TRUSTED_ORIGINS=https://podigger.com,https://www.podigger.com
```

---

## Contrato de URLs Raiz

| Path | Módulo | View / Include | Auth | Notas |
|------|--------|----------------|------|-------|
| `/admin/` | `django.contrib.admin` | `admin.site.urls` | Django admin session | Apenas para staff/superuser. |
| `/api/auth/` | `accounts.urls` | include de accounts | Mista (cookie JWT) | Ver `accounts/contracts.md`. |
| `/api/` | `podcasts.urls` | include de podcasts | Mista (cookie JWT) | Ver `podcasts/contracts.md`. |
| `/health/` | `podcasts.health` | `health_check` | Não requerida | Ver acima. |

---

## Contrato de Tasks Celery (autodiscover)

> Tasks expostas vêm de `accounts.tasks` e `podcasts.tasks`. O `config.celery.app` apenas descobre.

| Task | Módulo | Queue | Schedule | Notas |
|------|--------|-------|----------|-------|
| (ver `accounts/tasks.py`) | accounts | default | — | Cross-ref `accounts/contracts.md`. |
| (ver `podcasts/tasks.py`) | podcasts | default | — | Cross-ref `podcasts/contracts.md`. |

🟡 **Lacuna:** nenhuma `CELERY_BEAT_SCHEDULE` está configurada em `config/settings.py` — periodicidade é responsabilidade de `podcasts/tasks.py` (cross-ref). Se houver periodicidade, deve ser adicionada aqui em T-12b.

---

## Contrato de Web Server

### WSGI

```python
# Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

| Atributo | Valor |
|----------|-------|
| Callable | `config.wsgi.application` |
| Protocolo | WSGI 1.0.1 (PEP 3333) |
| Variável de settings | `WSGI_APPLICATION = "config.wsgi.application"` |

### ASGI

```python
# Uvicorn
uvicorn config.asgi:application --host 0.0.0.0 --port 8000
```

| Atributo | Valor |
|----------|-------|
| Callable | `config.asgi.application` |
| Protocolo | ASGI 3.0 |
| Variável de settings | `ASGI_APPLICATION = "config.asgi.application"` |

> 🟢 ASGI exposto para futura evolução (WebSockets, HTTP/2). Hoje, Gunicorn+WSGI é o caminho padrão.

---

## Contrato de DRF

### Throttle rates

| Escopo | Rate | Aplicado em |
|--------|------|-------------|
| `anon` | 100/min | Anônimos em qualquer endpoint |
| `user` | 200/min | Autenticados em qualquer endpoint |
| `login` | 5/min | `POST /api/auth/token/` |
| `register` | 3/min | `POST /api/auth/register/` |

### Paginação

| Atributo | Valor |
|----------|-------|
| Classe | `rest_framework.pagination.PageNumberPagination` |
| Tamanho de página | 10 |
| Query param | `?page=N` |
| Response envelope | `{"count": N, "next": "...", "previous": "...", "results": [...]}` |

### Filtros

| Atributo | Valor |
|----------|-------|
| Backend | `django_filters.rest_framework.DjangoFilterBackend` |
| Sintaxe | `?field=value` ou `?field__lookup=value` (depends on view) |

### Authenticação (ordem)

| Ordem | Classe | Uso |
|-------|--------|-----|
| 1ª | `accounts.authentication.CookieJWTAuthentication` | API principal |
| 2ª | `rest_framework.authentication.SessionAuthentication` | Django admin |
| 3ª | `rest_framework.authentication.BasicAuthentication` | Django admin |

### Permissão default

| Atributo | Valor |
|----------|-------|
| Classe | `rest_framework.permissions.IsAuthenticatedOrReadOnly` |
| Comportamento | GET/HEAD/OPTIONS públicos; demais exigem auth |

### Renderer

| Atributo | Valor |
|----------|-------|
| Default | `rest_framework.renderers.JSONRenderer` |
| Browsable API | **Desabilitado** (não tem `BrowsableAPIRenderer`) |

---

## Contrato JWT (simplejwt)

| Atributo | Valor | Env var |
|----------|-------|---------|
| Algoritmo | HS256 | — |
| Signing key | `SECRET_KEY` | `DJANGO_SECRET_KEY` |
| Access TTL | 5 minutos | `JWT_ACCESS_TOKEN_MINUTES` |
| Refresh TTL | 1 dia | `JWT_REFRESH_TOKEN_DAYS` |
| Rotação de refresh | Habilitado | — |
| Blacklist após rotação | Habilitado | — |
| Blacklist app instalada | `rest_framework_simplejwt.token_blacklist` | — |
| Token obtain serializer | `accounts.serializers.EmailTokenObtainPairSerializer` | — |
| Auth header types | `(Bearer,)` | — |
| User ID field | `id` | — |
| User ID claim | `user_id` | — |

---

## Contrato de Versionamento

| Atributo | Valor | Onde |
|----------|-------|------|
| Versão canônica | `<de config/__version__.py>` | `config/__version__.py` |
| Exposta no `/health/`? | **Não** (gap) | — |
| Como bumpar | Editar `config/__version__.py` | Manual |
| SemVer? | Presume-se sim (1.0.0 → 1.0.1) | Inferred |
| Compatibilidade com frontend | `<de frontend/src/lib/constants.ts:APP_VERSION>` | Cross-ref |

🟡 **Lacuna R-CFG-version:** `/health/` deveria incluir `version` no body para correlação com releases.

---

## Contrato de Logging (gap)

> `config/settings.py` **não define `LOGGING`** — usa defaults Django (console handler, `INFO` no root, formato `%(levelname)s %(name)s %(message)s`).

| Aspecto | Hoje (gap) | Sugerido (T-28) |
|---------|-----------|-----------------|
| Formato | Legível (human) | JSON estruturado (machine) |
| Destino | stderr | stdout (para k8s/Docker) |
| Nível root | `INFO` | `INFO` (mantém) |
| Loggers de app | Herdam root | `accounts`, `podcasts` com `INFO` |
| Request logging | Nenhum | `django.request` em `WARNING` |
| SQL logging | Nenhum (silencioso) | `django.db.backends` em `DEBUG` apenas |

---

## Resumo de Compatibilidade

| Mudança | Tipo | Breaking? |
|---------|------|-----------|
| Renomear `DJANGO_SECRET_KEY` | Quebra de contrato | **Sim** (12-factor) |
| Mudar default de `DJANGO_DEBUG` | Quebra | Sim (altera comportamento) |
| Adicionar nova env var | Adição | **Não** (backward-compat se default = comportamento atual) |
| Mudar TTL de access token | Mudança de comportamento | Depende — afeta UX |
| Mudar path `/health/` | Quebra | **Sim** (k8s probes podem falhar) |
| Adicionar novo path raiz | Adição | **Não** |
| Mudar `PAGE_SIZE` | Mudança de comportamento | Não quebra API, mas altera payload |
| Mudar `ALGORITHM` JWT | Breaking para tokens existentes | **Sim** |

---

## Riscos e Lacunas dos Contratos

- 🔴 **Versionamento não exposto em `/health/`** — dificulta correlação release ↔ incidente. T-22b.
- 🔴 **LOGGING não customizado** — JSON logging ausente. T-28.
- 🟡 **`config/__version__.py` é a única fonte de verdade** — mas o frontend tem `APP_VERSION` separado em `frontend/src/lib/constants.ts`. Drift possível.
- 🟡 **Sem `CELERY_BEAT_SCHEDULE`** centralizado — periodicidade espalhada por app.
- 🟡 **`SECURE_HSTS_SECONDS` ausente** (cross-ref T-29 em `tasks.md`).
- 🟡 **CORS_ALLOWED_ORIGINS default `[]`** em produção — não-falha, mas pode passar despercebido. Sugestão: warning na importação.
- 🟡 **Sem contrato explícito para o que `polls_url` aceita** — config não tem polls, mas vale documentar para futuras extensões.
