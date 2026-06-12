# config, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Unit: `backend/config/`
> Companions: `config/requirements.md`, `config/design.md`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Dependências de sistema: Python 3.11+, PostgreSQL 15 acessível, Redis 7 acessível
- [ ] Variáveis de ambiente definidas: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DATABASE_*` ou `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- [ ] Apps Django `accounts` e `podcasts` já implementadas (são referenciadas em `INSTALLED_APPS`, `AUTH_USER_MODEL`, `urls.py`, `celery.py` autodiscover)
- [ ] Migrations rodadas (`python manage.py migrate`)
- [ ] Custom user model `accounts.User` criado com campo `email` único e propriedades `role`/`approval_status`

## Tarefas

> Cada tarefa referencia o arquivo do legado de onde o comportamento foi extraído.

- [ ] T-01, Criar `backend/config/__init__.py` vazio
  - Origem no legado: `backend/config/__init__.py`
  - Critério de pronto: `python -c "import config"` resolve sem erro
  - Confiança: 🟢

- [ ] T-02, Criar `backend/config/settings.py` com imports e carregamento de env
  - Origem no legado: `backend/config/settings.py:1-21`
  - Critério de pronto: `from config import settings; settings.SECRET_KEY` retorna o valor de `DJANGO_SECRET_KEY` ou o default `dev-secret-key`
  - Confiança: 🟢

- [ ] T-03, Definir `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `SECURE_PROXY_SSL_HEADER`
  - Origem no legado: `backend/config/settings.py:23-32`
  - Critério de pronto: `settings.DEBUG` é bool, `settings.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")`
  - Confiança: 🟢

- [ ] T-04, Registrar `INSTALLED_APPS` com todas as apps Django, DRF, simplejwt, blacklist, cors, accounts, podcasts
  - Origem no legado: `backend/config/settings.py:34-49`
  - Critério de pronto: `python manage.py check` lista todas as apps sem erro
  - Confiança: 🟢

- [ ] T-05, Configurar `AUTH_USER_MODEL = "accounts.User"`
  - Origem no legado: `backend/config/settings.py:51-52`
  - Critério de pronto: `settings.AUTH_USER_MODEL == "accounts.User"`; rodar `python manage.py shell -c "from django.contrib.auth import get_user_model; print(get_user_model())"` retorna `<class 'accounts.models.User'>`
  - Confiança: 🟢

- [ ] T-06, Configurar `MIDDLEWARE` com `corsheaders` em primeiro lugar
  - Origem no legado: `backend/config/settings.py:54-63`
  - Critério de pronto: Ordem idêntica ao legado; request OPTIONS preflight do frontend retorna `Access-Control-Allow-*` corretos
  - Confiança: 🟢

- [ ] T-07, Configurar `TEMPLATES` (DIRS, APP_DIRS, context_processors) e `ROOT_URLCONF = "config.urls"`
  - Origem no legado: `backend/config/settings.py:65-81`
  - Critério de pronto: `settings.ROOT_URLCONF == "config.urls"`; `TEMPLATES[0].APP_DIRS is True`
  - Confiança: 🟢

- [ ] T-08, Configurar `WSGI_APPLICATION` e `ASGI_APPLICATION`
  - Origem no legado: `backend/config/settings.py:83-84`
  - Critério de pronto: `settings.WSGI_APPLICATION == "config.wsgi.application"`; `settings.ASGI_APPLICATION == "config.asgi.application"`
  - Confiança: 🟢

- [ ] T-09, Implementar `DATABASES` com suporte a `DATABASE_URL` e fallback para vars individuais
  - Origem no legado: `backend/config/settings.py:86-113`
  - Critério de pronto:
    - Com `DATABASE_URL=postgres://u:p@h:5432/d`, `settings.DATABASES['default']` é parseado
    - Sem `DATABASE_URL`, com `DATABASE_HOST=db` etc., `HOST == "db"`
  - Confiança: 🟢

- [ ] T-10, Configurar `AUTH_PASSWORD_VALIDATORS` com `UserAttributeSimilarityValidator`
  - Origem no legado: `backend/config/settings.py:115-121`
  - Critério de pronto: `settings.AUTH_PASSWORD_VALIDATORS` tem 1 entrada; roda `python manage.py check --deploy` sem reclamar de validators
  - Confiança: 🟢
  - Lacuna: considerar adicionar `MinimumLengthValidator` (ver R-CFG-24)

- [ ] T-11, Configurar `CACHES.default` com `django_redis.cache.RedisCache` lendo `REDIS_URL`
  - Origem no legado: `backend/config/settings.py:123-135`
  - Critério de pronto: `python manage.py shell -c "from django.core.cache import cache; cache.set('k','v',10); print(cache.get('k'))"` retorna `v`
  - Confiança: 🟢

- [ ] T-12, Configurar Celery (`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, JSON serializer, UTC timezone)
  - Origem no legado: `backend/config/settings.py:137-149`
  - Critério de pronto: `settings.CELERY_BROKER_URL` aponta para Redis; `CELERY_TIMEZONE == "UTC"`
  - Confiança: 🟢

- [ ] T-13, Configurar i18n, timezone e staticfiles (`LANGUAGE_CODE=en-us`, `TIME_ZONE=UTC`, `USE_TZ=True`, `STATIC_URL=/static/`)
  - Origem no legado: `backend/config/settings.py:151-157`
  - Critério de pronto: `settings.USE_TZ is True`; `STATIC_URL == "/static/"`
  - Confiança: 🟢

- [ ] T-14, Configurar `REST_FRAMEWORK` com `CookieJWTAuthentication`, `IsAuthenticatedOrReadOnly`, JSONRenderer, DjangoFilterBackend, PageNumberPagination(10), throttle rates
  - Origem no legado: `backend/config/settings.py:159-184`
  - Critério de pronto:
    - 6ª tentativa de login em 1 min retorna 429
    - `GET /api/podcasts/?page=2` retorna segunda página
    - `Accept: text/html` retorna JSON, não HTML
  - Confiança: 🟢

- [ ] T-15, Configurar CORS condicional (permissivo em DEBUG, restrito em produção)
  - Origem no legado: `backend/config/settings.py:186-194`
  - Critério de pronto: Com `DEBUG=True`, request cross-origin retorna `Access-Control-Allow-Origin: *`. Com `DEBUG=False` e `CORS_ALLOWED_ORIGINS=["https://podigger.com"]`, request de `https://outro.com` não recebe o header
  - Confiança: 🟢

- [ ] T-16, Definir `DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"`
  - Origem no legado: `backend/config/settings.py:197`
  - Critério de pronto: `python manage.py makemigrations --dry-run` não sugere mudanças de tipo de PK
  - Confiança: 🟢

- [ ] T-17, Configurar `SIMPLE_JWT` com TTLs customizáveis, rotação (sem blacklist), HS256, claims custom
  - Origem no legado: `backend/config/settings.py:199-216`
  - Critério de pronto:
    - `settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] == timedelta(minutes=15)` (Perna 2026-06-06)
    - `settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] == timedelta(days=1)`
    - `ROTATE_REFRESH_TOKENS is True`, `BLACKLIST_AFTER_ROTATION is False`, `ALGORITHM == "HS256"`
    - `TOKEN_BLACKLIST_ENABLED is False`
  - Confiança: 🟢

- [ ] T-18, Criar `backend/config/urls.py` montando `urlpatterns` (admin, api/auth, api, health)
  - Origem no legado: `backend/config/urls.py:1-11`
  - Critério de pronto: `python manage.py show_urls` (ou `urls.resolve`) lista os 4 patterns
  - Confiança: 🟢

- [ ] T-19, Criar `backend/config/celery.py` com `app = Celery("podigger")`, `config_from_object`, `autodiscover_tasks`
  - Origem no legado: `backend/config/celery.py:1-17`
  - Critério de pronto: `celery -A config inspect registered` lista tasks de `accounts.tasks` e `podcasts.tasks`
  - Confiança: 🟢

- [ ] T-20, Criar `backend/config/asgi.py` com `get_asgi_application()`
  - Origem no legado: `backend/config/asgi.py:1-7`
  - Critério de pronto: `python -c "from config.asgi import application; print(type(application).__name__)"` retorna `ASGIApplication` (ou similar)
  - Confiança: 🟢

- [ ] T-21, Criar `backend/config/wsgi.py` com `get_wsgi_application()`
  - Origem no legado: `backend/config/wsgi.py:1-7`
  - Critério de pronto: `gunicorn config.wsgi:application` sobe o servidor na porta 8000 sem erro
  - Confiança: 🟢

- [ ] T-22, Criar `backend/config/__version__.py` com a versão canônica (string)
  - Origem no legado: `backend/config/__version__.py` (inferido, referenciado por `podcasts.health`)
  - Critério de pronto: `python -c "from config import __version__; print(__version__)"` retorna `0.1.0` (ou valor atual)
  - Confiança: 🟡

- [ ] T-23, Criar `.env.example`, `.env.staging.example`, `.env.production.example` com placeholders
  - Origem no legado: `.env.example` (3 variantes no projeto)
  - Critério de pronto: Cada arquivo lista todas as env vars consumidas em T-09/T-11/T-12/T-14/T-15/T-17, com comentários explicativos
  - Confiança: 🟢

- [ ] T-24, Validar que `manage.py` continua funcionando
  - Origem no legado: `backend/manage.py`
  - Critério de pronto: `python manage.py check`, `python manage.py migrate`, `python manage.py runserver` rodam sem erro
  - Confiança: 🟢

- [ ] T-25, Adicionar fail-fast em produção para defaults inseguros (gap R-CFG-26)
  - Origem no legado: lacuna conhecida (ver `architecture.md` tech debt)
  - Critério de pronto: Com `DEBUG=False`, app **não sobe** se `SECRET_KEY == "dev-secret-key"` ou `ALLOWED_HOSTS == ["*"]`. Mensagem clara de erro
  - Confiança: 🟡
  - Sugestão de implementação: bloco `if not DEBUG: assert "dev" not in SECRET_KEY, "Refusing to start with dev SECRET_KEY in production"; assert ALLOWED_HOSTS != ["*"], "Refusing to start with ALLOWED_HOSTS=['*'] in production"`

- [ ] T-26, Adicionar `MinimumLengthValidator` em `AUTH_PASSWORD_VALIDATORS` (gap R-CFG-24)
  - Origem no legado: lacuna conhecida
  - Critério de pronto: `AUTH_PASSWORD_VALIDATORS` inclui `{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}}`. Senha de 7 chars em qualquer caminho (admin, management command) é rejeitada
  - Confiança: 🟡

- [ ] T-27, Adicionar `CELERY_TASK_TIME_LIMIT` e `CELERY_TASK_SOFT_TIME_LIMIT` em settings
  - Origem no legado: gap operacional (ver R-CFG-related no design)
  - Critério de pronto: `CELERY_TASK_TIME_LIMIT = 600` (10min), `CELERY_TASK_SOFT_TIME_LIMIT = 540` (9min). Tasks que excedem são mortas
  - Confiança: 🟡

- [ ] T-28, Configurar `LOGGING` para stdout JSON em produção
  - Origem no legado: lacuna (sem `LOGGING` customizado)
  - Critério de pronto: `LOGGING` configurado com handler `console` que emite JSON estruturado (formato `{"time": ..., "level": ..., "logger": ..., "message": ...}`). Em dev, formato legível.
  - Confiança: 🟡

- [ ] T-29, Adicionar `SECURE_HSTS_SECONDS` e `SECURE_HSTS_INCLUDE_SUBDOMAINS` quando `DEBUG=False`
  - Origem no legado: gap (apenas `SECURE_PROXY_SSL_HEADER` está configurado)
  - Critério de pronto: Com `DEBUG=False`, response inclui `Strict-Transport-Security: max-age=...`
  - Confiança: 🟡

- [ ] T-30, Verificar que `urls_health_snippet.py` (helper presente na pasta) é integração legada, decidir destino
  - Origem no legado: `backend/config/urls_health_snippet.py`
  - Critério de pronto: Decidir se importa, descarta ou converte em teste. Documentar decisão
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Teste: settings carrega `.env` quando presente
  - Origem: `backend/config/settings.py:19-21`
  - Setup: criar `.env` temporário com `DJANGO_DEBUG=0`; importar settings
  - Esperado: `settings.DEBUG is False`

- [ ] TT-02, Teste: settings prefere env vars reais sobre `.env`
  - Setup: `.env` com `DJANGO_DEBUG=0`; env real `DJANGO_DEBUG=1`
  - Esperado: `settings.DEBUG is True`

- [ ] TT-03, Teste: `DATABASE_URL` parseado corretamente
  - Setup: `DATABASE_URL=postgres://u:p@h:5432/d`
  - Esperado: `settings.DATABASES['default']['NAME'] == 'd'`, `HOST == 'h'`, `USER == 'u'`, `PASSWORD == 'p'`, `PORT == '5432'`

- [ ] TT-04, Teste: `urls.urlpatterns` resolve `/admin/`, `/api/auth/`, `/api/`, `/health/`
  - Setup: Django test client
  - Esperado: `reverse('admin:index')`, `reverse(...)` para os 4 prefixes retornam URLs

- [ ] TT-05, Teste: `celery.app` está registrado e descobre tasks
  - Setup: `from config.celery import app`
  - Esperado: `app.main == "podigger"`; `app.tasks` inclui tasks de `accounts` e `podcasts`

- [ ] TT-06, Teste: throttling de login retorna 429 após 5 tentativas
  - Setup: 5 POSTs com credenciais inválidas
  - Esperado: 6ª tentativa retorna 429

- [ ] TT-07, Teste: CORS permite em DEBUG, nega em produção
  - Setup A: `DEBUG=True`, request de `http://localhost:3000`
  - Setup B: `DEBUG=False`, `CORS_ALLOWED_ORIGINS=["https://podigger.com"]`, request de `https://outro.com`
  - Esperado A: `Access-Control-Allow-Origin` presente
  - Esperado B: `Access-Control-Allow-Origin` ausente

- [ ] TT-08, Teste: `SECURE_PROXY_SSL_HEADER` reconhece HTTPS via header
  - Setup: request com `HTTP_X_FORWARDED_PROTO=https`
  - Esperado: `request.is_secure() is True`

- [ ] TT-09, Teste: fail-fast em produção (após T-25)
  - Setup: `DEBUG=False`, `SECRET_KEY="dev-secret-key"`, `ALLOWED_HOSTS=["*"]`
  - Esperado: `ImproperlyConfigured` ou `AssertionError` na importação

## Tarefas de Migração de Dados (se aplicável)

> Não há migrations no pacote `config` (não é uma app Django). Migrations relevantes são de `accounts` e `podcasts` (já cobertas nas unidades respectivas).

- [ ] (n/a)

## Ordem Sugerida

1. **T-01 a T-08** (esqueleto de settings): make `python manage.py check` passar com settings mínimo (sem CACHES, sem CELERY, sem REST_FRAMEWORK).
2. **T-09 a T-13** (banco, cache, Celery, i18n): habilita persistência e filas.
3. **T-14 a T-17** (REST_FRAMEWORK, CORS, JWT): habilita API. Após T-14, `python manage.py runserver` + curl em `/api/podcasts/` deve funcionar (com app `podcasts` populada).
4. **T-18 a T-22** (urls, celery, asgi, wsgi, version): cabeamento final.
5. **T-23** (`.env.example`): docs para devs/ops.
6. **T-24** (validate manage.py): smoke test.
7. **T-25 a T-29** (gaps conhecidos): hardening — fazer após green-path estar 100% funcional.
8. **T-30** (decisão sobre `urls_health_snippet.py`): housekeeping.

**Bloqueios:**
- T-14 depende de T-04 (apps em INSTALLED_APPS) e de `accounts.authentication.CookieJWTAuthentication` existir.
- T-18 depende de `podcasts.health.health_check` existir.
- T-19 depende de `accounts.tasks` e `podcasts.tasks` existirem (mesmo que vazios).
- T-25 (fail-fast) deve ser a última a ser implementada — durante dev, todos queremos defaults permissivos.

## Lacunas Pendentes (🔴)

- **R-CFG-24** — `AUTH_PASSWORD_VALIDATORS` sem `MinimumLengthValidator`. T-26 cobre.
- **R-CFG-25/26** — Defaults inseguros sem fail-fast. T-25 cobre.
- **Celery task time limits** — risco de tasks travadas consumindo workers. T-27 cobre.
- **LOGGING estruturado** — observabilidade limitada em produção. T-28 cobre.
- **HSTS** — habilitado por padrão em produção para endurecer HTTPS. T-29 cobre.
- **CORS_ALLOWED_ORIGINS default `[]` em produção** — sem aviso explícito ao subir; ops pode não perceber config faltando. Não há T- específica; sugestão: log de warning na importação se `DEBUG=False and not CORS_ALLOWED_ORIGINS`.
- **urls_health_snippet.py** — arquivo órfão; precisa decisão (T-30).
