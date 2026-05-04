# Análise Técnica de Código — podigger

> Gerado pelo Arqueólogo a partir de 2026-06-04
> `doc_level` = `completo` — análise módulo a módulo
> Granularidade: `module` (ver `.reversa/config.toml`)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Índice

1. [Módulo `accounts`](#módulo-accounts)
2. [Módulo `podcasts`](#módulo-podcasts)
3. [Módulo `config`](#módulo-config)
4. [Módulo `frontend-ui`](#módulo-frontend-ui)
5. [Módulo `frontend-pages`](#módulo-frontend-pages)
6. [Módulo `frontend-features`](#módulo-frontend-features)

---

<a id="módulo-accounts"></a>
## 1. Módulo `accounts`

**Path:** `backend/accounts/`
**Propósito:** Autenticação, registro, gestão de usuários, papéis e permissões.
**Framework:** Django + DRF + SimpleJWT (com cookies HttpOnly).

### 1.1 Funções e métodos principais

#### `UserManager.create_user(email, password=None, **extra_fields)` 🟢
- `backend/accounts/models.py:16-30`
- Normaliza o email (`self.normalize_email(email)`).
- Define defaults via `setdefault`: `approval_status = "pending"`, `role = "reader"`.
- Hash da senha com `user.set_password(password)`.
- Persiste com `user.save(using=self._db)`.
- **Regra:** `email` é obrigatório (lança `ValueError` se vazio).
- **Algoritmo de defaults:** `extra_fields.setdefault` apenas preenche chaves ausentes, nunca sobrescreve.

#### `UserManager.create_superuser(email, password=None, **extra_fields)` 🟢
- `backend/accounts/models.py:32-49`
- Defaults: `is_staff=True`, `is_superuser=True`, `approval_status="approved"`, `role="admin"`.
- Validações rígidas: levanta `ValueError` se `is_staff` ou `is_superuser` não forem `True`.
- Reutiliza `create_user`.

#### `TokenObtainCookieView.post(request, *args, **kwargs)` 🟢
- `backend/accounts/views.py:47-96`
- Herda de `TokenObtainPairView` (SimpleJWT). Credenciais validadas pelo `EmailTokenObtainPairSerializer`.
- **Tratamento de erros:**
  - `PermissionDenied` (conta com `approval_status="pending"`) → HTTP 403 com mensagem PT-BR.
  - `AuthenticationFailed` (credenciais inválidas) → HTTP 401 com mensagem PT-BR.
  - Outras exceções → re-raise (delegado ao DRF).
- **Em sucesso:** lê `access`/`refresh`/`role`/`email` do `response.data`, define cookies HttpOnly e retorna apenas `{role, email}` no body.
- **Atributos dos cookies:**
  - `access_token`: HttpOnly, SameSite=Lax, max_age=300 (5min), path="/".
  - `refresh_token`: HttpOnly, SameSite=Lax, max_age=86400 (24h), path="/api/auth/token/refresh/".
  - `secure = not settings.DEBUG` (em produção, requer HTTPS).
- **Throttling:** `AnonRateThrottle` com `throttle_scope = "login"`.

#### `TokenRefreshCookieView.post(request, *args, **kwargs)` 🟢
- `backend/accounts/views.py:118-156`
- Lê `refresh_token` do cookie `request.COOKIES.get("refresh_token")`.
- Se ausente → HTTP 401.
- Injeta `refresh` em `request.data` para o serializer do SimpleJWT validar.
- Captura `(InvalidToken, TokenError)` → HTTP 401 com mensagem PT-BR.
- Em sucesso: define novo cookie `access_token` (mesmos atributos do login) e retorna body vazio.

#### `RegisterView.create(request, *_args, **_kwargs)` 🟢
- `backend/accounts/views.py:182-197`
- Endpoint público (`permission_classes = []`, `authentication_classes = []`).
- Throttling: `AnonRateThrottle` com `throttle_scope = "register"`.
- `serializer.is_valid(raise_exception=True)` → valida formato + senha ≥8 chars.
- `perform_create` é executado dentro de `try/except IntegrityError` (email duplicado) → HTTP 400 com mensagem PT-BR.
- Sucesso → HTTP 201 com `{email}` no body.

#### `UserListView` (generics.ListAPIView) 🟢
- `backend/accounts/views.py:200-209`
- `GET /api/auth/users/` — listagem ordenada por `created_at`.
- `IsAdminRole` como permission class.

#### `UserApproveView.post(_request, pk, *_args, **_kwargs)` 🟢
- `backend/accounts/views.py:223-236`
- `POST /api/auth/users/{pk}/approve/`.
- 404 se usuário não existe, 200 com `UserSerializer` se aprova.
- Define `approval_status = "approved"` e persiste (sem transação explícita — `save()` direto).

#### `UserRoleUpdateView.patch(request, pk, *_args, **_kwargs)` 🟢
- `backend/accounts/views.py:254-275`
- `PATCH /api/auth/users/{pk}/`.
- Valida `role` ∈ `("admin", "editor", "reader")` antes de consultar o usuário.
- 400 se inválido, 404 se não existe, 200 com `UserSerializer` se sucesso.

#### `EmailTokenObtainPairSerializer.get_token(cls, user)` 🟢
- `backend/accounts/serializers.py:19-25`
- Adiciona claims customizadas ao JWT: `role` e `email`.

#### `EmailTokenObtainPairSerializer.validate(self, attrs)` 🟢
- `backend/accounts/serializers.py:27-41`
- Delega ao `super().validate(attrs)` (autenticação por email via `username_field = "email"`).
- **Regra crítica:** se `self.user.approval_status != "approved"` → `raise PermissionDenied`.
- Em sucesso, anexa `role` e `email` ao body de resposta.

#### `RegisterSerializer.validate_password(self, value)` 🟢
- `backend/accounts/serializers.py:53-57`
- Regra: senha deve ter ≥ 8 caracteres.

#### `RegisterSerializer.create(self, validated_data)` 🟢
- `backend/accounts/serializers.py:59-65`
- Cria usuário com `approval_status="pending"` e `role="reader"` (explícito, mesmo que seja o default).

#### `CookieJWTAuthentication.authenticate(self, request)` 🟢
- `backend/accounts/authentication.py:13-17`
- Lê `access_token` do cookie em vez do header `Authorization`.
- Retorna `None` se ausente (permite endpoints públicos sem lançar exceção).
- Valida o token e retorna `(user, validated_token)`.

#### `IsAdminRole.has_permission(self, request, view)` 🟢
- `backend/accounts/permissions.py:7-11`
- `request.user.is_authenticated and request.user.role == "admin"`.

#### `IsEditorOrAdmin.has_permission(self, request, view)` 🟢
- `backend/accounts/permissions.py:17-20`
- `request.user.is_authenticated and request.user.role in ("editor", "admin")`.

### 1.2 Endpoints API (rotas)

| Método | URL | View | Auth | Permissão | Throttle |
|--------|-----|------|------|-----------|----------|
| POST | `/api/auth/token/` | `TokenObtainCookieView` | Pública | N/A | login |
| POST | `/api/auth/token/refresh/` | `TokenRefreshCookieView` | Pública (cookie) | N/A | — |
| POST | `/api/auth/register/` | `RegisterView` | Pública | — | register |
| GET | `/api/auth/users/` | `UserListView` | JWT cookie | IsAdminRole | — |
| POST | `/api/auth/users/<int:pk>/approve/` | `UserApproveView` | JWT cookie | IsAdminRole | — |
| PATCH | `/api/auth/users/<int:pk>/` | `UserRoleUpdateView` | JWT cookie | IsAdminRole | — |

🟢 Fonte: `backend/accounts/urls.py:12-18`

### 1.3 Algoritmos e regras de negócio

1. **Cadastro de usuário** (`create_user`): sempre cria com `approval_status="pending"` e `role="reader"` por padrão. Novos usuários **não podem logar** até serem aprovados. 🟢
2. **Login com aprovação pendente**: após validação de credenciais, o serializer verifica `approval_status`. Se `!= "approved"`, levanta `PermissionDenied`. 🟢
3. **JWT em cookies HttpOnly**: access (5min) e refresh (24h), SameSite=Lax, Secure em produção. 🟢
4. **Aprovação via admin**: `UserApproveView` muta `approval_status` para `"approved"` sem qualquer histórico de quem aprovou ou quando. 🔴 (sem auditoria)
5. **Atualização de papel**: `UserRoleUpdateView` aceita apenas `"admin"`, `"editor"`, `"reader"`. 🟢
6. **Senha mínima de 8 caracteres**: validada no `RegisterSerializer.validate_password`. 🟢
7. **Throttling por escopo**: `login` e `register` têm `AnonRateThrottle` (definido no scope). 🟢
8. **Permissão por papel**: `IsAdminRole` (admin only) e `IsEditorOrAdmin` (editor ou admin). 🟢

### 1.4 Estruturas de dados (modelo)

**`User`** (`backend/accounts/models.py:52-92`):

| Campo | Tipo | Obrigatório | Default | Observação |
|-------|------|-------------|---------|------------|
| `id` | AutoField | sim | auto | PK |
| `email` | EmailField (unique) | sim | — | USERNAME_FIELD |
| `password` | CharField (herdado) | sim | — | armazenado hash |
| `role` | CharField(20, choices) | sim | `"reader"` | choices: admin/editor/reader |
| `approval_status` | CharField(20, choices) | sim | `"pending"` | choices: pending/approved |
| `is_active` | BooleanField | sim | `True` | herdado |
| `is_staff` | BooleanField | sim | `False` | herdado |
| `created_at` | DateTimeField | sim | `auto_now_add` | 🟢 |

🟢 Fonte: `backend/accounts/models.py:55-83`

### 1.5 Constantes e configurações de domínio

- `MIN_PASSWORD_LENGTH = 8` (`backend/accounts/serializers.py:11`)
- `User.VALID_ROLES = ("admin", "editor", "reader")` (apenas na view, `backend/accounts/views.py:250`)
- `ROLE_CHOICES` e `APPROVAL_STATUS_CHOICES` no modelo 🟢
- Configuração `SIMPLE_JWT["TOKEN_OBTAIN_SERIALIZER"]` mencionada em `views.py:25-26` (provavelmente em `settings.py`).

### 1.6 Dependências

- **Internas:** nenhuma (não depende de outros apps Django)
- **Externas:** `django.contrib.auth`, `rest_framework`, `rest_framework_simplejwt`, `django_filters` 🟢

### 1.7 Testes

- `backend/accounts/tests/test_property_13_cookie_auth.py` — teste property-based da autenticação por cookie 🟢
- `backend/accounts/tests/test_property_token_views.py` — teste property-based dos views de token 🟢
- **Padrão:** `hypothesis` (property-based testing), conforme configurado em `requirements.txt`.

### 1.8 Pontos de atenção

- 🔴 **Sem auditoria** nas ações sensíveis (aprovação, mudança de papel).
- 🔴 **Sem histórico de transições de status** (e.g., quando um admin foi promovido).
- 🟡 **Mensagens de erro em português embutidas nas views** — dificultam i18n futura.
- 🟡 **`UserRoleUpdateView` permite promover a si mesmo** (sem proteção explícita contra `pk == request.user.pk`).
- 🟢 **Customização do JWT** com claims `role` e `email` é bem feita.
- 🟢 **Cookie path do refresh** escopo `/api/auth/token/refresh/` é adequado.

---

<a id="módulo-podcasts"></a>
## 2. Módulo `podcasts`

**Path:** `backend/podcasts/`
**Propósito:** Domínio principal: gestão de podcasts, episódios, tags, busca FTS, analytics (popularidade) e sugestões de tópicos.
**Framework:** Django + DRF + Celery + PostgreSQL FTS.

### 2.1 Funções e métodos principais

#### `EpisodeManager.search(self, query: str)` 🟢
- `backend/podcasts/models.py:82-118`
- **Algoritmo de busca em duas etapas:**
  1. Incrementa `PopularTerm` (cria com `times=1` ou soma 1 com `models.F("times") + 1`).
  2. Configura `portuguese` para o parser FTS.
  3. Constrói `SearchVector` com pesos: `title` (A) + `description` (B).
  4. Anota o queryset com `rank` (SearchRank) e `trigram` (TrigramSimilarity).
  5. Filtra por `rank__gt=0` e ordena por `-rank, -published`.
  6. **Fallback:** se FTS não retornar nada, filtra por `trigram__gt=0.1` e ordena por `-trigram, -published`.
- **Regra:** query vazia retorna `self.get_queryset()` sem tracking de term.

#### `PodcastViewSet.create(self, request)` 🟢
- `backend/podcasts/views.py:43-80`
- POST `/api/podcasts/` com `name` e `feed`.
- Delega para `PodcastService.create_podcast(name, feed)`.
- Respostas:
  - 201 `{id, status: "created"}` se novo
  - 200 `{id, message, status: "none"}` (compatibilidade com frontend) se já existe
  - 400 `{message}` se erro
- **Detalhe de design:** usa `status: "none"` no caso de existente (comentário no código: "compatibility with frontend expected status"). 🟡

#### `PodcastViewSet.recent(self, request)` 🟢
- `backend/podcasts/views.py:82-93`
- `@action(detail=False, methods=["get"])` → `GET /api/podcasts/recent/`
- Retorna os 6 podcasts mais recentes (ordenados por `-id`).

#### `EpisodeViewSet.get_queryset(self)` 🟢
- `backend/podcasts/views.py:113-123`
- Lê `q` ou `search` dos query params.
- Se presente, chama `Episode.objects.search(q)` (delega ao manager custom).
- Filtro adicional via `filterset_fields = ["podcast"]` (`?podcast=1`).

#### `TopicSuggestionViewSet` e `PopularTermViewSet` 🟢
- `backend/podcasts/views.py:126-143`
- `TopicSuggestionViewSet`: CRUD completo; leitura pública, escrita requer `IsEditorOrAdmin`.
- `PopularTermViewSet`: somente leitura, ordenado por `-times` (mais buscados primeiro).

#### `PodcastService.create_podcast(name, feed) -> PodcastCreateResult` 🟢
- `backend/podcasts/services/podcast_service.py:25-69`
- **Validações sequenciais:**
  1. `name` e `feed` obrigatórios → erro "o nome e o feed são obrigatórios".
  2. `is_valid_feed(feed)` → erro "o feed informado é inválido".
- **Operação atômica** (`transaction.atomic` + `select_for_create` implícito do `get_or_create`):
  - Tenta `get_or_create(feed=feed, defaults={"name": name})`.
  - Se existir → retorna status "existing" com `message: "este podcast já foi adicionado"`.
  - Se criou → enfileira `add_episode.delay(feed)` (task Celery) e retorna status "created".
- **Garantia de race condition:** a transação atômica + `get_or_create` evita duplicação. 🟢

#### `parse_feed(url, default_image)` 🟢
- `backend/podcasts/services/feed_parser.py:71-114`
- Usa `feedparser.parse(url)`.
- Retorna dict com: `title`, `language` (lowercased), `image` (ou default), `items` (lista de entries normalizados).
- Em exceção → log e retorna `{}` (silencioso, mas logado).

#### `is_valid_feed(url) -> bool` 🟢
- `backend/podcasts/services/feed_parser.py:117-132`
- Verifica `bozo == 0` no resultado do `feedparser.parse(url)`.
- Exceção → False.

#### `_parse_entry(entry) -> dict` 🟢
- `backend/podcasts/services/feed_parser.py:29-68`
- Normaliza um entry do feed para: `title`, `link`, `published`, `description` (HTML stripped), `tags` (opcional), `enclosure` (opcional).
- Suporta `entry.tags[].term` e `entry.enclosures[0].href`.

#### `_strip_html(text) -> str` 🟢
- `backend/podcasts/services/feed_parser.py:14-26`
- Regex `r"(<!--.*?-->|<[^>]*>)"` com `re.DOTALL`.
- Substitui por `""` e trim.
- **Limitação:** não é robusto para HTML malformado (recomendado migrar para BeautifulSoup em comentário do código). 🟡

#### `EpisodeUpdater.__init__(self, feeds)` e `populate(self)` 🟢
- `backend/podcasts/services/updater.py:15-103`
- Itera sobre `feeds`. Para cada `feed_url`:
  1. Transação atômica.
  2. Busca `Podcast` por `feed` (se não achar, log warning e continua).
  3. Chama `parse_feed(feed_url)`.
  4. Atualiza `podcast_obj.image` e `podcast_obj.language` (via `PodcastLanguage.get_or_create`).
  5. Para cada `item` em `items`:
     - Parse de data (formato RSS RFC 2822: `"%a, %d %b %Y %H:%M:%S"` nos primeiros 25 chars). Em falha → log e skip.
     - Skip se `Episode` com mesmo `link` já existe.
     - Cria `Episode` com `to_json=item` (raw do parser).
     - Associa `Tag`s via `get_or_create`.
  6. Atualiza `total_episodes` e salva.
  - Em exceção → log e continua com próximo feed (não aborta tudo).

#### `tasks.add_episode(feed_url)` 🟢
- `backend/podcasts/tasks.py:12-22`
- Celery task (`@shared_task`).
- Cria `EpisodeUpdater([feed_url])` e chama `populate()`.
- **Pipeline:** disparado por `PodcastService.create_podcast` quando novo podcast é criado.

#### `tasks.update_base()` 🟢
- `backend/podcasts/tasks.py:25-40`
- Celery task nomeada `update_base`.
- Pega todos os feeds (`Podcast.objects.values_list("feed", flat=True)`) e roda `EpisodeUpdater.populate()`.
- Encadeia `update_total_episodes.delay()` no fim.

#### `tasks.update_total_episodes()` 🟢
- `backend/podcasts/tasks.py:43-52`
- Itera todos os podcasts e atualiza `total_episodes` (count de `episodes`).
- Salva apenas o campo `total_episodes` (otimização via `update_fields`).

#### `tasks.remove_podcasts()` 🟢
- `backend/podcasts/tasks.py:55-72`
- Celery task nomeada `remove_podcasts`.
- Bulk delete via `annotate(Count("episodes")).filter(num_episodes=0).delete()`.
- Limpa podcasts órfãos (sem episódios).

### 2.2 Endpoints API (rotas)

| Método | URL | View | Auth | Permissão |
|--------|-----|------|------|-----------|
| GET/POST | `/api/podcasts/` | `PodcastViewSet` | GET: pública, POST: editor/admin | `IsEditorOrAdmin` em write |
| GET | `/api/podcasts/{id}/` | `PodcastViewSet` | pública | — |
| GET | `/api/podcasts/recent/` | `PodcastViewSet.recent` | pública | — |
| GET | `/api/podcasts/?search=` | `PodcastViewSet` | pública | SearchFilter por `name` |
| GET/POST | `/api/episodes/` | `EpisodeViewSet` | GET: pública, POST: editor/admin | `IsEditorOrAdmin` em write |
| GET | `/api/episodes/?q=` | `EpisodeViewSet` | pública | FTS via manager |
| GET | `/api/episodes/?podcast=` | `EpisodeViewSet` | pública | DjangoFilterBackend |
| GET/POST | `/api/topic-suggestions/` | `TopicSuggestionViewSet` | GET: pública, POST: editor/admin | `IsEditorOrAdmin` em write |
| GET | `/api/popular-terms/` | `PopularTermViewSet` | pública | — (read-only) |

🟢 Fonte: `backend/podcasts/urls.py:6-14`

### 2.3 Algoritmos e regras de negócio

1. **Busca FTS com fallback Trigram** 🟢 — algoritmo de duas etapas, com thresholds `rank__gt=0` e `trigram__gt=0.1`.
2. **Tracking automático de termos populares** 🟢 — toda query cria ou incrementa `PopularTerm`. Não há rate limiting aqui.
3. **Validação de feed** 🟢 — `bozo == 0` no feedparser. **Limitação:** não valida conteúdo (apenas parsing).
4. **Parse de data RSS** 🟢 — formato RFC 2822 com truncamento nos primeiros 25 chars.
5. **Idempotência de episódio** 🟢 — skip se `link` já existe.
6. **Race condition safe em create_podcast** 🟢 — `transaction.atomic + get_or_create`.
7. **Strip HTML do description** 🟡 — regex simples, não robusto.
8. **Auto-update de total_episodes** 🟢 — disparado por `update_base` Celery task.
9. **Limpeza de podcasts órfãos** 🟢 — `remove_podcasts` Celery task.

### 2.4 Estruturas de dados (modelos)

#### `BaseModel` (abstrato) 🟢
- `created_at: DateTimeField(default=timezone.now)`
- `updated_at: DateTimeField(null=True, auto_now=True)`

#### `PodcastLanguage` 🟢
| Campo | Tipo | Default |
|-------|------|---------|
| `code` | CharField(10, unique?) | `"pt"` |
| `name` | CharField(60) | `"português"` |
| Herda | `created_at`, `updated_at` | |

#### `Podcast` 🟢
| Campo | Tipo | Obrigatório | Default |
|-------|------|-------------|---------|
| `name` | CharField(128, unique) | sim | — |
| `feed` | URLField(unique) | sim | — |
| `image` | CharField(255) | não | `"/static/dist/img/podcast-banner.png"` |
| `language` | FK(PodcastLanguage, on_delete=SET_NULL) | não | None |
| `total_episodes` | IntegerField | sim | 0 |
| Herda | `created_at`, `updated_at` | | |

#### `Tag` 🟢
| Campo | Tipo | Default |
|-------|------|---------|
| `name` | CharField(255, unique) | — |
| Herda | `created_at`, `updated_at` | |

#### `Episode` 🟢
| Campo | Tipo | Obrigatório | Default |
|-------|------|-------------|---------|
| `title` | CharField(1024) | sim | — |
| `link` | URLField(unique) | sim | — |
| `description` | TextField(blank, null) | não | None |
| `published` | DateTimeField(null, blank) | não | None |
| `enclosure` | CharField(1024, blank, null) | não | None |
| `to_json` | JSONField(null, blank) | não | None (raw do parser) |
| `podcast` | FK(Podcast, CASCADE) | sim | — |
| `tags` | M2M(Tag, blank) | não | — |

#### `PopularTerm` 🟢
| Campo | Tipo | Default |
|-------|------|---------|
| `term` | CharField(255, db_index) | — |
| `times` | IntegerField | 1 |
| `date_search` | DateField | `datetime.date.today` |
| Herda | `created_at`, `updated_at` | |

#### `TopicSuggestion` 🟢
| Campo | Tipo | Default |
|-------|------|---------|
| `title` | CharField(255, db_index) | — |
| `description` | TextField(blank, null) | None |
| `is_recorded` | BooleanField | False |
| Herda | `created_at`, `updated_at` | |

### 2.5 Serializers (resumo)

| Serializer | Modelo | Campos |
|------------|--------|--------|
| `TagSerializer` | Tag | `id, name` |
| `PodcastMinimalSerializer` | Podcast | `id, name, image` |
| `EpisodeSerializer` | Episode | `id, title, link, description, published, enclosure, podcast, tags` |
| `PodcastListSerializer` | Podcast | `id, name, feed, image, language, total_episodes` |
| `PodcastDetailSerializer` | Podcast | lista + `episodes` (nested) |
| `TopicSuggestionSerializer` | TopicSuggestion | `id, title, description, is_recorded` |
| `PopularTermSerializer` | PopularTerm | `term, times` |

🟢 Fonte: `backend/podcasts/serializers.py:8-104`

### 2.6 Tarefas Celery

| Task | Nome | Trigger | Função |
|------|------|---------|--------|
| `add_episode(feed_url)` | (default) | Após criar podcast | Popula episódios de um feed |
| `update_base()` | `update_base` | Periódico (Beat) | Atualiza todos os feeds |
| `update_total_episodes()` | `update_total_episodes` | Após `update_base` | Recalcula contadores |
| `remove_podcasts()` | `remove_podcasts` | Periódico (Beat) | Remove podcasts sem episódios |

🟢 Fonte: `backend/podcasts/tasks.py:12-72`

### 2.7 Dependências

- **Internas:** `accounts.permissions.IsEditorOrAdmin`
- **Externas:** `feedparser`, `celery`, `django.contrib.postgres.search` (FTS + Trigram)

### 2.8 Testes

- `backend/podcasts/tests/test_api.py` — testes de API REST 🟢
- `backend/podcasts/tests/test_models.py` — modelos e managers (incl. FTS) 🟢
- `backend/podcasts/tests/test_parser.py` — feed_parser 🟢
- `backend/podcasts/tests/test_updater.py` — EpisodeUpdater 🟢
- `backend/podcasts/tests/test_views_features.py` — features de views 🟢
- `backend/podcasts/tests/test_property_11_12_14_content_permissions.py` — property-based de conteúdo/permissões 🟢

### 2.9 Pontos de atenção

- 🔴 **Falta rate limiting no endpoint de busca** — pode ser abusado para inflar `PopularTerm`.
- 🔴 **No `to_json` armazena o dict completo do feed** — pode crescer indefinidamente; sem limpeza.
- 🟡 **Status "none"** quando podcast já existe (compatibilidade com frontend) é confuso (esperar-se-ia "existing" no response).
- 🟡 **`feed_parser` não trata feeds Atom com namespaces não-padrão** (apenas `d.feed.image.href`).
- 🟡 **Strip HTML por regex** pode deixar texto malformado em descrições com tags inválidas.
- 🟢 **Atomicidade e idempotência** estão bem tratadas (race conditions e duplicação).
- 🟢 **Pipeline de tasks** é bem estruturado: trigger on create, periodic update, cleanup.

---

<a id="módulo-config"></a>
## 3. Módulo `config`

**Path:** `backend/config/`
**Propósito:** Configuração global do projeto Django: settings, URLconf raiz, Celery app, entry points ASGI/WSGI.
**Tamanho:** pequeno (≤ 250 linhas).

### 3.1 Estrutura de arquivos

| Arquivo | Função |
|---------|--------|
| `settings.py` | Configurações Django: apps, middleware, DB, Redis, Celery, DRF, JWT, CORS |
| `urls.py` | URLconf raiz: admin, /api/auth/, /api/, /health/ |
| `celery.py` | Celery app (namespace `podigger`) |
| `asgi.py` | ASGI entry point (uvicorn) |
| `wsgi.py` | WSGI entry point (gunicorn) |
| `__init__.py` | Exporta `__version__` e `celery_app` |
| `__version__.py` | Versão do projeto |

### 3.2 Configurações-chave (settings.py)

#### Apps instaladas 🟢
- Django built-ins: `admin`, `auth`, `contenttypes`, `sessions`, `messages`, `staticfiles`, `postgres`
- DRF: `rest_framework`, `rest_framework_simplejwt`, `rest_framework_simplejwt.token_blacklist`
- Filtros: `django_filters`
- CORS: `corsheaders`
- Custom: `accounts`, `podcasts`
- **Custom user model:** `AUTH_USER_MODEL = "accounts.User"` 🟢

#### Middleware 🟢
`CorsMiddleware` (primeiro), `SecurityMiddleware`, `SessionMiddleware`, `CommonMiddleware`, `CsrfViewMiddleware`, `AuthenticationMiddleware`, `MessageMiddleware`, `XFrameOptionsMiddleware`

#### Database 🟢
- Suporta `DATABASE_URL` (preferencial) ou vars individuais `DATABASE_*`.
- Engine: `django.db.backends.postgresql` 🟢
- Default: host `localhost`, porta `5432`, name `podigger`, user/password `docker` 🟢

#### Cache (Redis) 🟢
- Backend: `django_redis.cache.RedisCache`
- URL: `REDIS_URL` env var (default `redis://localhost:6379/1`) 🟢
- Client class: `DefaultClient`

#### Celery 🟢
- Broker: `CELERY_BROKER_URL` (default `redis://localhost:6379/0`)
- Result backend: `CELERY_RESULT_BACKEND` (default `redis://localhost:6379/0`)
- Content/serializers: `json`
- Timezone: `UTC`
- **Importante:** o broker usa DB 0 e o cache DB 1 (são separados) 🟢

#### DRF (REST_FRAMEWORK) 🟢
- **Authentication:** `CookieJWTAuthentication` (primary), `SessionAuthentication` (Django Admin), `BasicAuthentication` (Django Admin) 🟢
- **Default permission:** `IsAuthenticatedOrReadOnly` (viewsets override em `get_permissions`) 🟢
- **Renderer:** apenas `JSONRenderer` (API pura, sem HTML) 🟢
- **Filter backend default:** `DjangoFilterBackend`
- **Pagination:** `PageNumberPagination`, `PAGE_SIZE=10` 🟢
- **Throttling (rate limit):**
  - `anon`: 100/min
  - `user`: 200/min
  - `login`: 5/min
  - `register`: 3/min 🟢

#### CORS 🟢
- `CORS_ALLOW_CREDENTIALS = True` (necessário para cookies)
- DEBUG=True: `CORS_ALLOW_ALL_ORIGINS = True`
- DEBUG=False: `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` via env var (lista) 🟢

#### JWT (SimpleJWT) 🟢
- Access token: 5 minutos (`JWT_ACCESS_TOKEN_MINUTES` env var) 🟢
- Refresh token: 1 dia (`JWT_REFRESH_TOKEN_DAYS` env var) 🟢
- `ROTATE_REFRESH_TOKENS = True` 🟢
- `BLACKLIST_AFTER_ROTATION = True` 🟢
- Algorithm: `HS256`, signing key = `SECRET_KEY` 🟢
- Auth header types: `("Bearer",)` 🟢
- **Custom serializer:** `accounts.serializers.EmailTokenObtainPairSerializer` 🟢
- **Token blacklist:** habilitado 🟢

### 3.3 URLconf raiz

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("podcasts.urls")),
    path("health/", health_check, name="health_check"),
]
```

🟢 Fonte: `backend/config/urls.py:6-11`

### 3.4 Celery app

- `app = Celery("podigger")` 🟢
- Config: `app.config_from_object("django.conf:settings", namespace="CELERY")` 🟢
- Auto-discovery: `app.autodiscover_tasks()` (encontra tasks em apps instaladas) 🟢
- Exposto em `__init__.py` como `celery_app` 🟢

### 3.5 Entry points

- **WSGI** (`wsgi.py`): `application = get_wsgi_application()` — usado por gunicorn 🟢
- **ASGI** (`asgi.py`): `application = get_asgi_application()` — usado por uvicorn 🟢

### 3.6 Pontos de atenção

- 🟡 **`SECRET_KEY` default** em dev é `"dev-secret-key"` (não usado em produção se env var for setada, mas é um risco se `.env` for esquecido).
- 🟡 **`CORS_ALLOW_ALL_ORIGINS = True` em DEBUG** — é o esperado, mas o risco é esquecer DEBUG=True em produção.
- 🟢 **Separação de Redis DBs** (0=celery, 1=cache) é uma boa prática.
- 🟢 **Custom serializer do SimpleJWT** permite validação de `approval_status`.
- 🟢 **Rate limiting bem configurado** com escopos específicos (login, register).

### 3.7 Sem dependências de domínio

Este módulo é puramente de configuração — não tem regras de negócio, entidades ou serviços. É infraestrutura.

---

<a id="módulo-frontend-ui"></a>
## 4. Módulo `frontend-ui`

**Path:** `frontend/src/components/ui/`
**Propósito:** Design system do frontend — primitivos de UI reaproveitáveis (Button, Card, Input, Badge, Icon, Loading).
**Stack:** React 19 + TypeScript + Tailwind CSS v4 + `clsx` + `tailwind-merge` + `material-symbols-rounded` (fonte).
**Padrão:** estilo shadcn/ui (forwardRef + `cn()` para merge de classes + variantes declarativas).

### 4.1 Inventário de componentes

| Componente | Arquivo | Linhas | Export | Usa `forwardRef`? |
|------------|---------|--------|--------|-------------------|
| `Button` | `Button.tsx` | 43 | `forwardRef<HTMLButtonElement>` | sim |
| `Card` | `Card.tsx` | 27 | `forwardRef<HTMLDivElement>` | sim |
| `Input` | `Input.tsx` | 25 | `forwardRef<HTMLInputElement>` | sim |
| `Badge` | `Badge.tsx` | 27 | `function component` | não |
| `Icon` | `Icon.tsx` | 36 | `function component` | não |
| `LoadingSpinner` | `Loading.tsx` | 47 (compartilhado) | `function component` | não |
| `Skeleton` | `Loading.tsx` | (mesmo) | `function component` | não |
| `FullPageLoading` | `Loading.tsx` | (mesmo) | `function component` | não |

### 4.2 Funções e métodos principais

#### `Button` (componente) 🟢
- `frontend/src/components/ui/Button.tsx:15-41`
- Props: `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>` + `variant`, `size`, `isLoading`.
- **Algoritmo de merge de classes:** `cn(base, variantClasses, sizeClasses, userClassName)` — `twMerge` resolve conflitos Tailwind (ex: caller passa `px-4`, classe base tem `px-8` → prevalece `px-4`).
- **Algoritmo de loading:** `disabled = isLoading || props.disabled` e render condicional (`isLoading ? <LoadingSpinner> : children`).
- **Variantes (declarativas via objeto):**
  - `primary`: `bg-primary text-background-dark hover:brightness-110 shadow-lg shadow-primary/20`
  - `secondary`: `bg-white/10 text-white hover:bg-white/20`
  - `ghost`: `bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5`
  - `outline`: `bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5`
- **Tamanhos:**
  - `sm`: `h-10 px-6 text-sm`
  - `md`: `h-12 px-8 text-base`
  - `lg`: `h-16 px-10 text-lg leading-none`
  - `icon`: `size-10 p-0` (quadrado)
- **Base comum:** `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none`.
- **Ref:** expõe `Ref<HTMLButtonElement>` via `forwardRef`.

#### `Card` (componente) 🟢
- `frontend/src/components/ui/Card.tsx:11-25`
- Props: `CardProps extends HTMLAttributes<HTMLDivElement>` + `hoverable: boolean = false`.
- **Algoritmo:** `cn(base, hoverable && hoverClasses, userClassName)`.
- **Hover effect** (quando `hoverable=true`): `hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`.
- **Base:** `rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 transition-all overflow-hidden`.

#### `Input` (componente) 🟢
- `frontend/src/components/ui/Input.tsx:10-23`
- Props: alias `InputProps = InputHTMLAttributes<HTMLInputElement>` (sem extensões próprias).
- **Base:** `flex h-12 w-full rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-display`.
- **Uso típico:** search bars (`SearchHero`), campos de formulário (login/register).
- **🔴 LACUNA:** Não há componente `Label` ou wrapper `<Form.Field>` — campos acessíveis dependem de markup externa.

#### `Badge` (componente) 🟢
- `frontend/src/components/ui/Badge.tsx:11-26`
- Props: `BadgeProps extends HTMLAttributes<HTMLDivElement>` + `variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary'`.
- **Renderiza como `<div>`** (não `<span>` — semântica neutra).
- **Base:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors`.
- **Variantes:**
  - `primary`: `bg-primary text-background-dark`
  - `secondary`: `bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100`
  - `outline`: `border border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-100`
  - `ghost`: `bg-transparent text-slate-500`

#### `Icon` (componente) 🟢
- `frontend/src/components/ui/Icon.tsx:15-36`
- Props: `IconProps extends HTMLAttributes<HTMLSpanElement>` + `name: string`, `fill: boolean = false`, `weight: number = 400`, `grade: number = 0`, `opticalSize: number = 24`.
- **Algoritmo — `fontVariationSettings`:** template literal que monta a string de variação da fonte:
  ```
  `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`
  ```
  - `FILL` controla se o glyph é preenchido (0 = outline, 1 = filled).
  - `wght` é o peso (100–900, default 400).
  - `GRAD` é a gradação (0–200, default 0).
  - `opsz` é o tamanho óptico (20–48, default 24).
- **Renderiza:** `<span class="material-symbols-rounded select-none" style="..." aria-hidden="true">{name}</span>`.
- **Dependência externa:** fonte `Material Symbols Rounded` (deve ser carregada no layout global — responsabilidade fora deste módulo).
- **🟡 Acessibilidade:** `aria-hidden="true"` é fixo. Caller deve prover label acessível (ex: `<button><Icon name="search" /><span class="sr-only">Buscar</span></button>`).

#### `LoadingSpinner` (componente) 🟢
- `frontend/src/components/ui/Loading.tsx:6-24`
- Props: `React.HTMLAttributes<SVGSVGElement>` (sem extensões próprias).
- **Renderiza:** `<svg viewBox="0 0 24 24" class="animate-spin">` com path circular parcial.
- **Animação:** puramente CSS via Tailwind `animate-spin`.
- **Uso típico:** dentro de `Button` quando `isLoading`, ou standalone.

#### `Skeleton` (componente) 🟢
- `frontend/src/components/ui/Loading.tsx:29-36`
- Props: `React.HTMLAttributes<HTMLDivElement>` (sem extensões próprias).
- **Renderiza:** `<div class="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800">`.
- **🔴 LACUNA:** Caller controla tamanho/forma apenas via `className` (ex: `h-4 w-full`). Sem sistema de variantes.

#### `FullPageLoading` (componente) 🟢
- `frontend/src/components/ui/Loading.tsx:41-46`
- Sem props. Renderiza overlay fixo:
  - Container: `fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm`.
  - Spinner interno: `<LoadingSpinner className="size-12 text-primary" />`.
- **Uso típico:** root loading de páginas autenticadas antes do conteúdo chegar.

#### `cn(...inputs: ClassValue[]): string` (utilitário) 🟢
- `frontend/src/lib/utils.ts:8-10`
- **Algoritmo:** `twMerge(clsx(inputs))`.
  - **clsx** recebe lista de strings, condicionais, arrays, objetos `{ 'classe': boolean }` e produz string única.
  - **twMerge** resolve conflitos Tailwind (última classe vence em conflitos como `px-4` vs `px-8`).
- **Padrão:** importado em todos os componentes UI; é a única forma de mesclar classes Tailwind com override do caller.

#### `formatDuration(seconds: number): string` (utilitário) 🟢
- `frontend/src/lib/utils.ts:15-26`
- **Validação inicial:** `if (!seconds || isNaN(seconds)) return '0:00'`.
- **Algoritmo:**
  1. `hours = floor(seconds / 3600)`
  2. `minutes = floor((seconds % 3600) / 60)`
  3. `secs = floor(seconds % 60)`
  4. Se `hours > 0`: retorna `H:MM:SS` (com `padStart(2, '0')` em minutos e segundos).
  5. Senão: retorna `M:SS` (com `padStart(2, '0')` em segundos).
- **Uso típico:** exibição de duração de episódios.

#### `formatDate(date: string | Date): string` (utilitário) 🟢
- `frontend/src/lib/utils.ts:31-37`
- **Validação:** `if (!date) return ''`.
- **Algoritmo:** `new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))`.
- **Exemplo de saída:** `"5 de mar. de 2026"`.
- **Uso típico:** exibição de data de publicação de episódios.

### 4.3 Algoritmos e lógica não-trivial

- **Merge de classes variantes** (padrão shadcn): objeto passado para `cn` resolve classes condicionais em runtime, e `twMerge` resolve conflitos. É um padrão declarativo que substitui if-else/switch com strings hardcoded. 🟢
- **Renderização de glyph Material Symbols** via `fontVariationSettings` inline: a única forma de controlar peso/grade/size da fonte variável é via essa string. O componente abstrai essa complexidade expondo props tipadas. 🟢
- **Disabled propagado em Button**: `disabled = isLoading || props.disabled` garante que ambos os motivos desabilitam o botão, e o spinner substitui o conteúdo. 🟢

### 4.4 Estruturas de dados (interfaces)

Documentadas em `_reversa_sdd/data-dictionary.md` § 3 (Módulo `frontend-ui`).

### 4.5 Dependências

| Tipo | Origem | Símbolo |
|------|--------|---------|
| Intra-módulo | `./Loading` | `LoadingSpinner` (usado em `Button`) |
| Lib | `@/lib/utils` | `cn` (usado em todos) |
| Lib | `react` | `forwardRef`, `ButtonHTMLAttributes`, `HTMLAttributes`, etc. |
| Lib | `clsx` | `ClassValue` (tipo) |
| Lib | `tailwind-merge` | `twMerge` |
| Fonte | `material-symbols-rounded` (carregada no layout) | Glyphs via ligatures |

### 4.6 Pontos de atenção

- 🟡 **Sem testes unitários** neste módulo — qualidade é garantida indiretamente via testes das features que consomem. Recomenda-se adicionar testes com Vitest + Testing Library para os primitivos.
- 🟡 **Acessibilidade do `Icon`** é responsabilidade do caller (label externa). O componente força `aria-hidden="true"`.
- 🟡 **Falta `Label`/`Field`**: campos de formulário acessíveis precisam de wrapper externo.
- 🟢 **Padrão shadcn/ui** reconhecido — fácil de migrar para `shadcn/ui` se o time decidir adotar a lib.
- 🟢 **`forwardRef` em primitivos** (Button, Card, Input) — boa prática para integração com `react-hook-form`, `framer-motion`, e animações.
- 🟢 **Variantes via objeto `cn`** são idiomáticas e Mantidas em um único bloco por componente.

### 4.7 Mapa para Writer/Designer

Cada componente deste módulo é candidato a uma **unit** na spec SDD (recomenda-se um arquivo por componente em `_reversa_sdd/frontend-ui/Button.md` etc., ou um arquivo agregado `frontend-ui/primitives.md` se o time preferir consolidação). Como são componentes puramente apresentacionais, as specs devem focar em:

- **Contrato de props** (já documentado em `data-dictionary.md`)
- **Variantes visuais** (mapeamento variant → classes)
- **Acessibilidade** (quando o caller precisa de label)
- **Composição** (uso de `LoadingSpinner` dentro de `Button`)

---

<a id="módulo-frontend-pages"></a>
## 5. Módulo `frontend-pages`

**Path:** `frontend/src/app/` + `frontend/src/middleware.ts`
**Propósito:** Roteamento do Next.js App Router — páginas (Server e Client Components), Route Handlers (auth/proxy/health), e middleware de proteção de rotas.
**Stack:** Next.js 16.2.3 (App Router) + React 19 + TypeScript + Tailwind v4.

### 5.1 Inventário de rotas

| Rota | Tipo de componente | Auth | Função |
|------|-------------------|------|--------|
| `/` | Server Component | público | Renderiza `<HomeClient />` (lógica em `frontend-features`) |
| `/login` | Client Component | público | Formulário de login (POST `/api/auth/login`) |
| `/register` | Client Component | público | Formulário de registro (POST `/api/auth/register`) |
| `/add-podcast` | Client Component | middleware + role | Formulário de cadastro de podcast (POST `/api/proxy/podcasts/`) |
| `/about` | Server Component | público | Página estática com 7 sub-componentes |
| `/auth/unauthorized` | Client Component | — | Redireciona para `/login?next=...` |
| `/auth/forbidden` | Client Component | autenticado | Mostra papel atual + link para home |
| `/auth/pending` | Server Component | — | Mensagem estática de "aguarde aprovação" |
| `/api/auth/login` | Route Handler | público | Proxy para Django `/api/auth/token/` |
| `/api/auth/register` | Route Handler | público | Proxy para Django `/api/auth/register/` |
| `/api/auth/refresh` | Route Handler | público | Proxy para Django `/api/auth/token/refresh/` |
| `/api/auth/logout` | Route Handler | público | Limpa cookies localmente |
| `/api/health` | Route Handler | público | Health check do Next.js |
| `/api/proxy/[...path]` | Route Handler | varia | Catch-all proxy com auto-refresh |

### 5.2 Layout root

#### `RootLayout` (RSC) 🟢
- `frontend/src/app/layout.tsx:20-36`
- Define: `<html lang="en" className="dark" suppressHydrationWarning>`.
- Body com classe: `${jakarta.variable} antialiased font-display`.
- **Provedores aninhados** (ordem importa):
  1. `AuthProvider` (mais externo — todas as páginas podem usar `useAuth()`)
  2. `ThemeProvider` (dark mode)
  3. `Navbar` (sempre visível)
  4. `<div className="min-h-screen">{children}</div>` (conteúdo da rota)
- **Font:** `Plus_Jakarta_Sans` via `next/font/google` com subsets `latin`, weights 400/500/600/700/800, variable `--font-jakarta`.
- **Metadata:** `title: "Podigger - Podcast Aggregator"`, `description` em EN.
- 🟡 `lang="en"` apesar de toda a UI ser PT-BR — inconsistência com a i18n.
- 🟡 `className="dark"` forçado no `<html>` — não há toggle real; o `ThemeProvider` ainda existe mas é um wrap de Dark.

### 5.3 Middleware

#### `middleware(request)` (Edge Runtime) 🟢
- `frontend/src/middleware.ts:13-24`
- **Responsabilidade:** bloquear acesso a rotas protegidas se `access_token` cookie ausente.
- **Algoritmo:**
  1. `accessToken = request.cookies.get('access_token')`
  2. Se ausente: constrói URL `/auth/unauthorized?next=encodeURIComponent(pathname + search)` e retorna `NextResponse.redirect()`.
  3. Senão: `NextResponse.next()`.
- **Matcher (`config`):** `['/add-podcast', '/admin/:path*']`.
- 🟡 **Limitação:** não tem acesso a React Context, então não consegue checar `role`. Apenas presença do cookie.
- 🟡 **Defesa em camadas:** a página `/add-podcast` re-checa o role (editor/admin) com `useAuth()`.

### 5.4 Páginas

#### `Home` (RSC) 🟢
- `frontend/src/app/page.tsx:3-5`
- Apenas um wrapper: `<HomeClient />` (componente em `frontend-features`).
- Toda a lógica está fora deste módulo.

#### `LoginPage` (Client Component) 🟢
- `frontend/src/app/login/page.tsx:218-242`
- **Algoritmo do `handleSubmit`:**
  1. `e.preventDefault()`, set loading, limpa error/pending.
  2. `fetch("/api/auth/login", POST, {email, password})`.
  3. **Status 200:** `login(data.role, data.email)` → AuthContext, depois `router.push(searchParams.get("next") || "/")`.
  4. **Status 403:** `setPendingMessage("Sua conta aguarda aprovação de um administrador.")` — sem redirect.
  5. **Status 401:** `setError("Email ou senha inválidos.")` — mensagem genérica (sem hint de qual campo).
  6. **Outros / network error:** `setError("Ocorreu um erro inesperado. Tente novamente.")` ou `"Não foi possível conectar ao servidor. Tente novamente."`.
- **Estado local:** `email`, `password`, `isLoading`, `error`, `pendingMessage`.
- **Acessibilidade:** inputs têm `aria-describedby={error ? "login-error" : undefined}`; mensagens usam `role="alert"` (error) ou `role="status"` (pending).
- **Layout iOS-like:** `max-w-[420px] rounded-[3rem] border-[8px] border-[#2a2a2a] min-h-[800px]` + status bar fake.
- **Suspense:** `<Suspense fallback={<div className="flex-1" />}>` envolve `<LoginForm />` (necessário para `useSearchParams`).

#### `RegisterPage` (Client Component) 🟢
- `frontend/src/app/register/page.tsx:10-268`
- **Algoritmo do `handleSubmit`:**
  1. `e.preventDefault()`, limpa error/success.
  2. **Validação client-side (Requirement 3.6):** se `password !== passwordConfirm` → `setError("As senhas não coincidem.")` e retorna.
  3. `fetch("/api/auth/register", POST, {email, password})`.
  4. **Status 201:** `setSuccessMessage("Conta criada com sucesso! Aguarde a aprovação de um administrador.")` — sem redirect.
  5. **Status 400:** extrai `data.detail || data.email[0] || data.password[0] || "Dados inválidos..."`.
  6. **Outros / network error:** mensagens genéricas.
- **Estado de sucesso:** se `successMessage` está setado, o form é escondido e mostra card verde com ícone `check_circle` + link para `/login`. 🟢
- **Estado local:** `email`, `password`, `passwordConfirm`, `isLoading`, `error`, `successMessage`.

#### `AddPodcastPage` (Client Component, role-gated) 🟢
- `frontend/src/app/add-podcast/page.tsx:11-246`
- **Guard de role (linha 21):** se `!user || (user.role !== "editor" && user.role !== "admin")` → renderiza tela "Acesso Negado" com mensagem específica (`"Você precisa estar autenticado..."` ou `"Apenas editores e administradores..."`) e botão para `/login` ou `/`.
- **Algoritmo do `handleSubmit`:**
  1. `fetch("/api/proxy/podcasts/", POST, {name, feed})` (passa pelo proxy do Next.js, que injeta o cookie).
  2. **Status 401:** `setError("Sua sessão expirou. Por favor, faça login novamente.")`.
  3. **Status 403:** `setError("Você não tem permissão para cadastrar podcasts.")`.
  4. **Status 200:**
     - `data.status === "created"`: success + `setTimeout(2000) → router.push("/")`.
     - `data.status === "existing"`: success ("Este podcast já está na nossa biblioteca.") + mesmo redirect.
     - Outros: `setError(data.message)`.
- **Estado local:** `name`, `feed`, `isLoading`, `error`, `success`.
- **🟡 Inconsistência de idioma:** labels em EN ("Podcast Name", "RSS Feed URL", "Add to Podigger") enquanto o resto do app é PT-BR. Comentários e mensagens de erro em PT-BR.

#### `AboutPage` (RSC, compõe 7 sub-componentes) 🟢
- `frontend/src/app/about/page.tsx:26-37`
- Composição: `<AboutHero /> <MissionCard /> <HowItWorks /> <ActionList /> <ContactSection /> <SocialLinks /> <AboutFooter />` (todos em `frontend/src/app/about/components/`).
- **Metadata:** `title: 'About – Podigger'`, description em EN.
- **Layout:**
  - Mobile: Hero (centralizado) → MissionCard (centralizado) → ActionList (lista) → SocialLinks (ícones circulares) → Footer.
  - Desktop: Hero (card com gradient) → MissionCard (card com shadow) → HowItWorks (lista) → ContactSection (botões) → SocialLinks (ícones inline) → Footer.
- **Sub-componentes chave:**
  - `AboutHero`: `APP_VERSION` (de `@/lib/constants`), responsivo via `md:hidden` / `hidden md:block`.
  - `MissionCard`: responsivo, ícones diferentes (`rocket_launch`).
  - `HowItWorks`: desktop only (`hidden md:block`), lista 3 features.
  - `ActionList` (Client): usa `navigator.share` se disponível, fallback `navigator.clipboard.writeText`.
  - `ContactSection`: usa `SOCIAL_LINKS.email` e `SOCIAL_LINKS.discord` de `@/lib/constants`.
  - `SocialLinks`: renderiza Material Symbols direto em `<span>` (não via `<Icon>`) — duplicação pequena de padrão.
  - `AboutFooter`: copyright 2024 (hardcoded), links legais.

#### `UnauthorizedPage` (Client) 🟢
- `frontend/src/app/auth/unauthorized/page.tsx:30-87`
- Lê `next` de `useSearchParams` (com Suspense).
- Constrói `loginHref = next ? '/login?next=' + encodeURIComponent(next) : '/login'`.
- Renderiza ícone `lock` amarelo + título "Acesso restrito" + botão "Fazer login".

#### `ForbiddenPage` (Client) 🟢
- `frontend/src/app/auth/forbidden/page.tsx:16-79`
- Usa `useAuth()` para obter `user.role`.
- Mapeia role → label PT-BR via `ROLE_LABELS = { admin: "Administrador", editor: "Editor", reader: "Leitor" }`.
- Mostra linha "Seu papel atual: {roleLabel}" (Requirement 13.6: "show current role without exposing internal config details").

#### `PendingPage` (RSC) 🟢
- `frontend/src/app/auth/pending/page.tsx:7-59`
- Estática, sem estado. Ícone `schedule` amarelo + título "Conta aguardando aprovação" + botão "Voltar ao início".

### 5.5 Route Handlers (API)

#### `POST /api/auth/login` (proxy) 🟢
- `frontend/src/app/api/auth/login/route.ts:5-69`
- **Algoritmo:**
  1. Parse body (try/catch → 400 `"Corpo da requisição inválido."`).
  2. `fetch(localhost:8000/api/auth/token/, POST, {email, password})` (try/catch → 503 `"Serviço indisponível..."`).
  3. **Status 401 ou 403:** forward body, status original.
  4. **Status 200:** extrai `setCookieHeaders` via `getSetCookie()` (com fallback para `headers.get('set-cookie')`), cria `NextResponse.json({role, email})` e **forwards todos os Set-Cookie** do Django (importante para os cookies `access_token` e `refresh_token` chegarem ao browser).
  5. **Outros:** forward body e status as-is.
- **Variável de ambiente:** `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
- 🟢 **Padrão getSetCookie:** o método `headers.getSetCookie()` é a forma canônica de ler múltiplos Set-Cookie (um por cookie); fallback para `headers.get('set-cookie')` que retorna concatenado.

#### `POST /api/auth/register` (proxy) 🟢
- `frontend/src/app/api/auth/register/route.ts:5-44`
- Mesma estrutura do login, mas:
  - **Status 201:** forward body.
  - **Status 400:** forward body.
  - Não há Set-Cookie (registro não emite tokens).
- Mais simples que login.

#### `POST /api/auth/refresh` (proxy) 🟢
- `frontend/src/app/api/auth/refresh/route.ts:5-61`
- Lê `refresh_token` cookie da request.
- Se ausente → 401 `"Refresh token ausente."`.
- Faz `fetch(BACKEND/api/auth/token/refresh/, POST, Cookie: refresh_token=...)`.
- **Status 200:** extrai Set-Cookie (contém novo `access_token`) e forwards.
- **Status 401:** forward body.

#### `POST /api/auth/logout` (limpeza local) 🟢
- `frontend/src/app/api/auth/logout/route.ts:3-19`
- Não chama backend.
- Retorna 200 `{success: true}` + 2 Set-Cookie com `Max-Age=0` para limpar `access_token` e `refresh_token`.
- 🟡 **Não invalida tokens no backend:** o JWT continua válido até `exp`. Para revogação real, deveria chamar `/api/auth/token/blacklist/` (já habilitado em settings).

#### `GET /api/health` 🟢
- `frontend/src/app/api/health/route.ts:3-11`
- Retorna `{status: 'healthy', timestamp: ISO, environment: NEXT_PUBLIC_ENVIRONMENT || 'development'}`.
- Não chama backend. Health check do Next.js (vs `/health/` do backend Django que checa DB).

#### `GET/POST/PUT/PATCH/DELETE /api/proxy/[...path]` (catch-all) 🟢
- `frontend/src/app/api/proxy/[...path]/route.ts:208-226` (exports) + `handleProxy` interno.
- **Algoritmo (`handleProxy`):**
  1. `pathSegments = (await context.params).path` (Promise, Next.js 15+).
  2. `backendUrl = buildBackendUrl(pathSegments, searchParams)` → `${BACKEND}/api/${joined}/?${queryString}`.
  3. `accessToken = request.cookies.get('access_token')?.value`.
  4. **Pre-read body** como `ArrayBuffer` (necessário porque streams só podem ser consumidos uma vez; o body precisa ser reutilizado no retry após refresh).
  5. **Tentativa 1:** `forwardToBackend(request, backendUrl, accessToken, requestBody)`.
  6. **Se status ≠ 401:** forward as-is via `buildProxyResponse`.
  7. **Se status = 401:**
     - `attemptRefresh(request)`:
       - Lê `refresh_token` cookie.
       - POST `BACKEND/api/auth/token/refresh/`.
       - Se sucesso: extrai novo `access_token` dos Set-Cookie via regex `^access_token=([^;]+)`.
       - Se falha: retorna `null`.
     - Se refresh falhou: `buildLogoutRedirect(pathSegments)` → redirect 302 para `/auth/unauthorized?next=...` + clear cookies.
     - Se refresh OK: **Tentativa 2** com `refreshResult.newToken` + `requestBody` (replay).
     - Forward resultado + Set-Cookie do refresh.
- **Tratamento de erro:** 503 `"Serviço indisponível..."` se o backend estiver offline.
- 🟢 **Por que ArrayBuffer:** streams HTTP do `fetch` só podem ser lidos uma vez; como o body pode precisar ser reenviado (retry após refresh), pré-ler como buffer é a forma canônica de evitar `TypeError: body stream already read`.
- 🟢 **Por que regex no Set-Cookie:** o backend retorna múltiplos cookies, e queremos apenas o valor de `access_token`. Regex `^access_token=([^;]+)` é simples e robusto o suficiente.

### 5.6 Dependências

| Tipo | Origem | Símbolo |
|------|--------|---------|
| Roteamento | `next` | `NextRequest`, `NextResponse`, Route Handlers, Middleware |
| Estado | `react` | `useState`, `useEffect`, `Suspense` |
| Navegação | `next/navigation` | `useRouter`, `useSearchParams`, `redirect` |
| Tipografia | `next/font/google` | `Plus_Jakarta_Sans` |
| Ícones | `material-symbols-rounded` (fonte) | Glyphs via ligatures |
| UI | `@/components/ui/Icon` | `<Icon>` wrapper canônico |
| Estado de auth | `@/contexts/AuthContext` | `useAuth()` |
| Layout | `@/components/layout/Navbar` | (definido em `frontend-features`) |
| Tema | `@/components/providers/ThemeProvider` | (definido em `frontend-features`) |
| Constantes | `@/lib/constants` | `APP_VERSION`, `SOCIAL_LINKS` |
| API base URL | env | `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) |

### 5.7 Algoritmos e lógica não-trivial

- **Auto-refresh de token no proxy**: ciclo de 2 tentativas com reuso do body via ArrayBuffer é o algoritmo mais complexo do módulo. Garante UX sem interrupção quando o access_token expira durante o uso.
- **Validação client-side de senha em register**: comparação `password !== passwordConfirm` antes de chamar API (evita round-trip). Backend não tem essa validação porque assume que já foi validada no client.
- **Defesa em camadas (middleware + page guard)**: middleware bloqueia acesso se cookie ausente; página re-checa role via `useAuth()`. Se um usuário authenticated com role=reader tentar `/add-podcast`, o middleware deixa passar mas a página renderiza "Acesso Negado".
- **Composição RSC de `/about`**: a página é Server Component; apenas `ActionList` é client (precisa de `navigator.share`/`clipboard`). Resultado: 6 dos 7 sub-componentes de `/about` são renderizados no servidor, com zero JS no cliente (exceto hydration de metadata).

### 5.8 Pontos de atenção

- 🟡 **Inconsistência de idioma em `/add-podcast`**: labels em EN, comentários/status em PT-BR. Recomenda-se unificar (provavelmente PT-BR, alinhado com resto do app).
- 🟡 **Cores hex hardcoded** em pages: `#0db9f2`, `#252525`, `#2a2a2a`, etc. Os tokens semânticos já existem em `globals.css` (`--color-primary: #0db9f2`) mas não são usados nas pages — `text-[#0db9f2]` em vez de `text-primary`.
- 🟡 **`logout` não chama backend**: cookies limpos localmente, mas JWTs ainda válidos até `exp`. Adicionar chamada a `/api/auth/token/blacklist/` se revogação imediata for requisito.
- 🟡 **`/api/health` não compartilha com backend `/health/`**: dois health checks separados (Next.js status vs Django DB). Útil para monitoring diferenciado.
- 🟡 **`<html lang="en">` em layout.tsx**: app é majoritariamente PT-BR mas o atributo `lang` está como EN. Quebra leitores de tela.
- 🟡 **Sem `Suspense` em `RegisterPage`**: `useRouter` é client-side, sem `useSearchParams`, mas a página tem `noValidate` no form. Risco de erro de hydration se o estado inicial diferir entre server e client.
- 🟢 **Testes robustos em `add-podcast/__tests__/`**: 6 cenários cobrindo happy path, edge cases, e network errors. Único módulo frontend com essa cobertura.
- 🟢 **Proxy com auto-refresh**: implementação elegante que isola o backend do cliente. Pattern reutilizável.
- 🟢 **Material Symbols import direto em `globals.css`** via `@import` Tailwind v4: Glyphs disponíveis globalmente.
- 🟢 **`RoleGate` pattern implícito em `/add-podcast`**: render condicional antes do form. Merece virar componente reutilizável.

### 5.9 Mapa para Writer/Designer

Este módulo tem **15+ arquivos de page/route** + middleware, e é candidato natural a ser dividido em **múltiplas units** no SDD:

| Página/rota | Unit SDD sugerida |
|-------------|-------------------|
| `/` (home) | `frontend-pages/home.md` |
| `/login` | `frontend-pages/login.md` |
| `/register` | `frontend-pages/register.md` |
| `/add-podcast` | `frontend-pages/add-podcast.md` |
| `/about` | `frontend-pages/about.md` (compõe 7 sub-componentes) |
| `/auth/unauthorized` | `frontend-pages/auth-unauthorized.md` |
| `/auth/forbidden` | `frontend-pages/auth-forbidden.md` |
| `/auth/pending` | `frontend-pages/auth-pending.md` |
| `/api/auth/login` | `frontend-pages/api-auth-login.md` |
| `/api/auth/register` | `frontend-pages/api-auth-register.md` |
| `/api/auth/refresh` | `frontend-pages/api-auth-refresh.md` |
| `/api/auth/logout` | `frontend-pages/api-auth-logout.md` |
| `/api/proxy/[...path]` | `frontend-pages/api-proxy.md` (com auto-refresh) |
| `/api/health` | `frontend-pages/api-health.md` |
| `middleware.ts` | `frontend-pages/middleware.md` |

O Writer pode consolidar as 4 Route Handlers de `/api/auth/*` em uma única unit `api-auth.md` para reduzir fragmentação.


---

<a id="módulo-frontend-features"></a>
## 6. Módulo `frontend-features`

> **Escopo:** componentes de feature (não-pages, não-ui primitives), contexts, lib utilities, middleware.
> **Path:** `frontend/src/components/{home,search,podcasts,episodes,layout,providers,common}/`, `frontend/src/contexts/`, `frontend/src/lib/`, `frontend/src/middleware.ts`.
> **LOC:** 1.394 source + 508 tests = 1.902 total (24 source files + 6 test files).

### 6.1 Inventário e propósito

#### `components/home/` (orquestração da página inicial)

##### `HomeClient` (Client Component, 157 LOC) 🟢
- `frontend/src/components/home/HomeClient.tsx:12-157`
- **State local (5 hooks `useState` + 2 `useCallback`):** `query`, `searchTerm`, `isSearching`, `podcasts`, `isSearchingPodcasts`.
- **Algoritmo do `handleSearch`:**
  1. `trim` do `query`.
  2. `setSearchTerm(trimmed)`.
  3. Se trimmed vazio → `setPodcasts([])` e retorna.
  4. Se não: `setIsSearchingPodcasts(true)`, `await fetchPodcasts(trimmed)`, `setPodcasts(res.results)` (ou `[]` em catch).
  5. `finally: setIsSearchingPodcasts(false)`.
- **Renderização:** 3 zonas responsivas:
  - `SearchHero` no topo (sempre visível).
  - Coluna central: seção "Podcasts" (condicional a `searchTerm`) + `EpisodeList` (sempre).
  - Sidebar `hidden lg:block` com "Trending Podcasts" placeholder + "Podigger Pro" CTA.
  - Mobile: `BottomNav activeItem="search"` e `FAB`.
- **Tema da sidebar:** gradiente `from-primary to-blue-600` para o card Pro.

##### `EpisodeList` (Client Component, 136 LOC) 🟢
- `frontend/src/components/home/EpisodeList.tsx:15-135`
- **State (6 hooks):** `episodes`, `page` (setter-only), `hasMore`, `isLoading`, `isLoadingMore`, `error`, mais `useRef<HTMLDivElement>` para sentinel.
- **Algoritmo do `load(q, pageNum, append)`** (linha 24):
  1. `trim` do `q`.
  2. Se `append` → `setIsLoadingMore(true)`, senão `setIsLoading(true)` + `onLoadingChange?.(true)`.
  3. `await fetchEpisodes(trimmed || undefined, pageNum)`.
  4. Append ou replace `episodes` baseado em `append`.
  5. `setHasMore(!!res.next)`.
  6. Catch: `setError(err instanceof Error ? err : new Error('Erro ao carregar'))`; se !append → `setEpisodes([])`.
  7. Finally: limpa flags + `onLoadingChange?.(false)`.
- **Dois `useEffect`:**
  - `[searchTerm, load]`: dispara `load(searchTerm, 1, false)` quando searchTerm muda.
  - `[hasMore, isLoading, isLoadingMore, searchTerm, load]`: cria `IntersectionObserver` no sentinel; quando visível, `setPage(p => p+1)` e `load(searchTerm, p+1, true)`. `rootMargin: '100px'` para pre-fetch. Cleanup com `observer.disconnect()`.
- **Renderização responsiva:** `hidden md:grid` → `EpisodeCardCompact` (desktop, 1-2 cols), `md:hidden` → `EpisodeCard` (mobile, single column).
- **Estados de tela (linha 80):** `isLoading` → spinner; `error` → `<EmptyState type="error" onRetry>`; vazio → `<EmptyState type={searchTerm ? "no-results" : "no-episodes"}>`; senão lista.

##### `EpisodeCard` (mobile card, 68 LOC) 🟢
- `frontend/src/components/home/EpisodeCard.tsx:13-68`
- Server Component (sem `'use client'`). Pode ser renderizado em RSC.
- Aspect ratio 16:9 hero image, hover scale 105, play button (link externo) + view podcast link.
- **Placeholder inline:** data URI SVG 400x225 com texto "No image" (cor `#94a3b8` em fundo `#475569`).

##### `EpisodeCardCompact` (desktop card, 97 LOC) 🟢
- `frontend/src/components/episodes/EpisodeCardCompact.tsx:29-97`
- Server Component. Thumbnail 20-28, podcast name (uppercase tracking-widest), title, description line-clamp-2, `formatRelativeTime`, play + view podcast.
- **Helper inline `formatRelativeTime`** (linha 10-27): "X min ago" / "Xh ago" / "Today" / "Yesterday" / "X days ago" / "1 week ago" / "X weeks ago". ⚠️ **Duplicação com `formatDate` em `lib/utils.ts`** (mas com escopo diferente: relative vs absolute).

##### `SearchHeader` (mobile sticky, 93 LOC) ⚠️ **CÓDIGO MORTO**
- `frontend/src/components/home/SearchHeader.tsx:13-93`
- Client Component. Header sticky com ícone RSS_feed + título "Podigger" + account icon + input search + tabs (All Results/Latest/Popular/Short Clips).
- **NÃO importado por ninguém.** Nenhuma referência no código (apenas testes em `__tests__/SearchHeader.test.tsx` que passam mas testam código morto).
- 🟡 **Candidato a remoção.**

##### `BottomNav` (mobile bottom nav, 48 LOC) 🟢
- `frontend/src/components/home/BottomNav.tsx:20-48`
- Client Component. 4 items: Home/Search/Library/Settings.
- **Library e Settings** têm `href='#'` (placeholder, não implementados).
- `activeItem` prop destaca o item atual.
- Fixed bottom, blur backdrop, `pb-8 pt-2` para safe area iOS.

##### `EmptyState` (40 LOC) 🟢
- `frontend/src/components/home/EmptyState.tsx:19-40`
- Server Component. 3 tipos via map de mensagens; `error` type tem botão retry condicional.

#### `components/search/`

##### `SearchHero` (desktop hero, 53 LOC) 🟢
- `frontend/src/components/search/SearchHero.tsx:13-52`
- Client Component. Hero com h1 "Search millions of episodes", subtítulo, input + Button primary.
- Enter no input → `onSearch()`. Usado por `HomeClient`.

#### `components/podcasts/`

##### `PodcastCard` (50 LOC) 🟢
- `frontend/src/components/podcasts/PodcastCard.tsx:12-50`
- Client Component. Card com imagem 20-24 (ou fallback Icon), nome, contagem de episódios, "View details" link.
- Link vai para `/podcasts/${id}` — **rota ainda não implementada** (404 esperado).

#### `components/layout/`

##### `Navbar` (133 LOC) 🟢
- `frontend/src/components/layout/Navbar.tsx:18-133`
- Client Component. Sticky top, blur backdrop, border-b.
- **Lógica de links (linha 25-30):** spread de `publicNavLinks` + `[{label: 'Add Podcast', href: '/add-podcast', icon: 'add_circle'}]` se `isAuthenticated && user && user.role in ['editor', 'admin']`.
- **`handleLogout` (linha 32):** `try { fetch('/api/auth/logout', {method: 'POST'}) } catch {}` + `logout()` do `useAuth()` + `router.push('/')`. 🟡 Comentário: "Proceed with client-side logout even if the request fails" — assume que o backend já limpou os cookies.
- **Theme toggle (linha 80):** `onClick={toggleTheme}`, `aria-label` muda conforme `theme` (Switch to light/dark).
- **Auth UI (linha 93):** Se authenticated mostra `user.role` (capitalize) + Logout button; senão mostra Login link (`/login`).
- **Mobile hamburger (linha 121):** button com aria-label "Open menu", `md:hidden` (sem onClick — placeholder).
- **Feature tag:** `api-authentication-strategy` (Reqs 9.1, 9.2).

#### `components/providers/`

##### `ThemeProvider` (56 LOC) 🟢
- `frontend/src/components/providers/ThemeProvider.tsx:27-55`
- Client Component. Estado `'light' | 'dark'`.
- **Lazy init `useState<Theme>` (linha 28-38):**
  1. Se `typeof window === 'undefined'` → `'dark'` (SSR).
  2. Lê `localStorage.getItem('podigger-theme')` → se `'light'` ou `'dark'`, retorna.
  3. Se `window.matchMedia('(prefers-color-scheme: light)').matches` → `'light'`.
  4. Default → `'dark'`.
- **`useEffect [theme]` (linha 40):** `root.classList.remove('light', 'dark')` + `root.classList.add(theme)` + `localStorage.setItem('podigger-theme', theme)`.
- **`toggleTheme`:** `useCallback` que inverte.
- 🟡 **FOUC potencial:** como o effect só roda no client, há flash de tema dark no SSR até o effect aplicar a classe correta. Otimização: inline script no `<head>` em `layout.tsx` que aplica classe baseado no localStorage antes do React hidratar.

#### `components/common/`

##### `FAB` (13 LOC) 🟡 **INCOMPLETO**
- `frontend/src/components/common/FAB.tsx:3-13`
- Server Component (sem `'use client'`). Botão RSS_feed fixed bottom-right, size-14, shadow-2xl, hover scale 110.
- 🟡 **NÃO tem onClick** — apenas visual. A ação "Add RSS feed" deveria ir para `/add-podcast` mas o link está ausente. O `<a>` ou `<Link>` deveria envolver o botão.

### 6.2 Contexts

#### `AuthContext` (53 LOC) 🟢
- `frontend/src/contexts/AuthContext.tsx`
- **Interface `AuthState` (linha 8-12):** `{user, isAuthenticated, isLoading}` onde `user = {email, role: 'admin'|'editor'|'reader'} | null`.
- **Interface `AuthContextValue` extends `AuthState`:** adiciona `login`, `logout`, `setUser`.
- **`AuthProvider` (linha 22-45):**
  - `useState<AuthState["user"]>(null)` para user.
  - `useState(false)` para isLoading (constante, nunca muda — provavelmente placeholder para futuro).
  - `isAuthenticated = user !== null`.
  - `login(role, email)`: setUserState({email, role}) — **operação 100% client-side, NÃO chama API**. O real login acontece em `/api/auth/login` (route handler), que seta cookies e retorna `{role, email}`. O caller é responsável por chamar `AuthContext.login(role, email)` após o login API.
  - `logout()`: setUserState(null).
  - `setUser(newUser)`: setter exposto.
- **`useAuth` (linha 47-53):** throws `Error("useAuth must be used within an AuthProvider")` se context é null.
- 🟡 **Inconsistência arquitetural:** o sistema real de auth usa cookies HttpOnly + `useState` separado. **Não há sincronização** entre `AuthContext.user` e o cookie `access_token` — se o cookie expirar ou for limpo, o `user` no contexto permanece setado até logout explícito.
- 🟡 **`isLoading` é fixo em `false`** — não há inicialização assíncrona. O componente `AuthProvider` em `layout.tsx` poderia opcionalmente fazer `GET /api/auth/me` para hidratar o user baseado no cookie.
- **Feature tag:** `api-authentication-strategy` (Reqs 7.3, 7.4, 8.2, 8.7).

### 6.3 Lib

#### `api.ts` (109 LOC) 🟢
- `frontend/src/lib/api.ts`
- **`API_BASE` (linha 39-42):** ternário redundante que retorna o mesmo valor em browser e server: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`. Poderia ser simplificado.
- **Interfaces:** `Episode`, `EpisodesResponse`, `Podcast`, `PodcastsResponse`, `AddPodcastResponse` (linhas 1-37, 84-88).
- **`fetchEpisodes(query?, page=1)`:**
  - `URLSearchParams` builder.
  - Se `query?.trim()` truthy → `params.set('q', trimmed)`. **⚠️ Usa `'q'`, não `'search'`** — corresponde ao `search_fields=['title']` do `EpisodeViewSet`.
  - Se `page > 1` → `params.set('page', page)`.
  - `fetch(url)` (GET, sem headers), throws `Error('API error: ${status}')` em !ok.
- **`fetchPodcasts(query?, page=1)`:**
  - Idem, mas usa `params.set('search', trimmed)`. **⚠️ Usa `'search'`** — corresponde ao `search_fields=['name']` do `PodcastViewSet`.
- **`addPodcast(name, feed)`:**
  - POST `/api/podcasts/` com `Content-Type: application/json`, body `{name, feed}`.
  - Em !ok, faz `response.json().catch(() => ({}))` para extrair mensagem de erro, throws `Error(errorData.message || 'API error: ${status}')`.
- 🟡 **Duplicação:** os 3 fetches repetem a lógica de params + try/catch. Poderia ser refatorado para um `apiGet<T>(path, params)` e `apiPost<T>(path, body)`.
- 🟡 **Inconsistência de param name** (`q` vs `search`) — reflete a config DRF backend-side, mas é fonte de confusão para o caller.

#### `utils.ts` (38 LOC) 🟢
- `frontend/src/lib/utils.ts`
- **`cn(...inputs)`:** `twMerge(clsx(inputs))` — padrão Next.js/Tailwind.
- **`formatDuration(seconds)`:**
  - Se `!seconds || isNaN(seconds)` → `'0:00'`.
  - Calcula hours, minutes, secs.
  - Se `hours > 0` → `H:MM:SS`; senão `M:SS`. Ambos com `padStart(2, '0')` em minutos/segundos.
- **`formatDate(date)`:**
  - Se `!date` → `''`.
  - `new Intl.DateTimeFormat('pt-BR', {year, month: 'short', day})`.

#### `constants.ts` (14 LOC) 🟢
- `frontend/src/lib/constants.ts`
- **`APP_VERSION`:** `process.env.NEXT_PUBLIC_APP_VERSION` ?? `'1.2.0'`.
- **`SOCIAL_LINKS`:** `{twitter, github, discord: '#', email}` declarado `as const`.

### 6.4 Middleware

#### `middleware.ts` (31 LOC) 🟢
- `frontend/src/middleware.ts:13-24`
- Edge middleware. **Lê cookie `access_token`** (não decodifica JWT).
- **Algoritmo:**
  1. `accessToken = request.cookies.get('access_token')`.
  2. Se `!accessToken` → `NextResponse.redirect(new URL('/auth/unauthorized?next=${encodeURIComponent(pathname + search)}', request.url))`.
  3. Senão → `NextResponse.next()`.
- **Matcher:** `['/add-podcast', '/admin/:path*']` (linha 27-30).
- 🟡 **Verifica apenas presença, não validade do JWT.** Se o token estiver expirado, o middleware deixa passar e a página renderiza o guard (ou o backend retorna 401 no primeiro request).
- **Feature tag:** `api-authentication-strategy` (Reqs 8.6, 13.5).

### 6.5 Dependências (internas ao módulo)

| Importador | Importa | De |
|------------|---------|-----|
| `HomeClient` | `SearchHero`, `BottomNav`, `FAB`, `fetchPodcasts`, `Podcast`, `PodcastCard`, `LoadingSpinner` | `search/`, `home/`, `common/`, `lib/api`, `podcasts/`, `ui/` |
| `EpisodeList` | `fetchEpisodes`, `Episode`, `EpisodeCard`, `EpisodeCardCompact`, `EmptyState`, `LoadingSpinner` | `lib/api`, `home/`, `episodes/`, `home/`, `ui/` |
| `EpisodeCard` | `Card`, `Icon`, `Episode` | `ui/`, `lib/api` |
| `EpisodeCardCompact` | `Card`, `Icon`, `Episode` | `ui/`, `lib/api` |
| `SearchHero` | `Icon`, `Button` | `ui/` |
| `SearchHeader` | `Button`, `Icon` | `ui/` (código morto) |
| `BottomNav` | `Icon`, `cn` | `ui/`, `lib/utils` |
| `EmptyState` | `Button`, `cn` | `ui/`, `lib/utils` |
| `PodcastCard` | `Card`, `Icon`, `Podcast` | `ui/`, `lib/api` |
| `Navbar` | `Icon`, `useTheme`, `useAuth`, `cn` | `ui/`, `providers/`, `contexts/`, `lib/utils` |
| `FAB` | `Icon` | `ui/` |
| `AuthProvider` | (sem deps) | — |
| `useAuth` | `AuthContext` | local |
| `ThemeProvider` | (sem deps) | — |
| `useTheme` | `ThemeContext` | local |
| `middleware` | `NextRequest`, `NextResponse` | `next/server` |
| `lib/api.ts` | (sem deps internas) | — |
| `lib/utils.ts` | `clsx`, `twMerge` | `clsx`, `tailwind-merge` |
| `lib/constants.ts` | (sem deps) | — |

### 6.6 Dependências externas (npm)

| Pacote | Uso |
|--------|-----|
| `react` | `useState`, `useEffect`, `useCallback`, `useRef`, `useContext`, `createContext`, `Suspense` |
| `next/link` | `<Link>` para navegação client-side |
| `next/navigation` | `usePathname`, `useRouter` (em Navbar) |
| `next/server` | `NextRequest`, `NextResponse` (em middleware) |
| `clsx` | Input para `cn()` |
| `tailwind-merge` | Conflito resolution para `cn()` |

### 6.7 Algoritmos e lógica não-trivial

- **Infinite scroll com IntersectionObserver (linha 65-78 de `EpisodeList.tsx`):** pattern "sentinel + observer" é canônico. `rootMargin: '100px'` permite pre-fetch antes do usuário chegar ao final. **Estado do page é manipulado via `setPage(p => { load(...); return p+1; })`** — o retorno do setter é usado pelo próximo render.
- **Theme lazy init (linha 28-38 de `ThemeProvider.tsx`):** ordem de prioridade é `localStorage` → `prefers-color-scheme` → `dark` default. O `useEffect` aplica o resultado e persiste de volta no localStorage.
- **Dual track loading state em `HomeClient`:** `isSearching` (do EpisodeList via `onLoadingChange`) e `isSearchingPodcasts` (local do HomeClient) são OR'd em `isSearching={isSearching || isSearchingPodcasts}` para o SearchHero. Permite indicador único para ambos os fetches.
- **`AuthContext` state sem sync com cookies:** design decision. Frontend confia que o caller (page, Navbar) chamará `login()` após o login API. Inconsistência potencial se o cookie expirar mid-session.

### 6.8 Pontos de atenção

- 🟡 **`SearchHeader.tsx` é código morto** — não importado em runtime. Tem testes (que passam) mas é candidato a remoção. Possível refactor leftover de quando a home era mobile-first.
- 🟡 **`FAB.tsx` sem `onClick`/`href`** — placeholder visual. Deveria navegar para `/add-podcast` (rota existe, gateado por middleware).
- 🟡 **`AuthContext.user` desincronizado de cookies** — se o cookie `access_token` expirar, o contexto ainda mostra o user como authenticated até logout explícito. Considerar um `useEffect` que faz `GET /api/auth/me` no mount do `AuthProvider` para hidratar baseado no cookie.
- 🟡 **`isLoading` é constante `false`** no `AuthProvider` — flag reservada para futuro, mas atualmente não usada. Pode confundir leitores.
- 🟡 **`API_BASE` ternário redundante** em `lib/api.ts:39-42` — o resultado é o mesmo nos dois branches. Pode ser `const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';`.
- 🟡 **Inconsistência `q` vs `search`** entre `fetchEpisodes` e `fetchPodcasts` — reflete a config DRF backend, mas é fonte de confusão. Considerar normalizar para `search` (mais comum).
- 🟡 **Duplicação de `formatRelativeTime`** em `EpisodeCardCompact.tsx:10-27` e `formatDuration`/`formatDate` em `lib/utils.ts`. Considerar mover para `lib/utils.ts` para reuso.
- 🟡 **FOUC de tema** — `useEffect` em `ThemeProvider` aplica classe no `<html>` após hydration, gerando flash inicial. Solução: inline `<script>` no `<head>` de `layout.tsx`.
- 🟡 **Sem testes para:** `AuthContext`, `ThemeProvider`, `middleware.ts`, `Navbar`, `PodcastCard`, `EpisodeCardCompact`, `SearchHero`, `FAB`. Cobertura concentrada em `home/__tests__/` e `lib/__tests__/`.
- 🟡 **BottomNav `library` e `settings`** têm `href='#'` — placeholder. Devem ser removidos ou ter rotas reais.
- 🟢 **API client minimalista** — fácil de entender, sem abstrações prematuras. Funciona para 3 endpoints atuais.
- 🟢 **`AuthContext` throws se usado fora do Provider** — DX safety. Erro claro em vez de `undefined` silencioso.
- 🟢 **Testes de `EpisodeList`** cobrem infinite scroll (mock de IntersectionObserver).

### 6.9 Mapa para Writer/Designer

Este módulo pode ser dividido em **múltiplas units** no SDD:

| Componente/Hook | Unit SDD sugerida |
|-----------------|-------------------|
| `HomeClient` | `frontend-features/home-client.md` |
| `EpisodeList` | `frontend-features/episode-list.md` (infinite scroll) |
| `EpisodeCard` + `EpisodeCardCompact` | `frontend-features/episode-cards.md` (responsive cards) |
| `SearchHero` + `SearchHeader` | `frontend-features/search-ui.md` (com nota sobre código morto) |
| `BottomNav` | `frontend-features/bottom-nav.md` |
| `EmptyState` | `frontend-features/empty-state.md` |
| `PodcastCard` | `frontend-features/podcast-card.md` |
| `Navbar` | `frontend-features/navbar.md` (auth + theme) |
| `FAB` | `frontend-features/fab.md` (com nota sobre incomplete) |
| `AuthContext` | `frontend-features/auth-context.md` |
| `ThemeProvider` | `frontend-features/theme-provider.md` |
| `api.ts` | `frontend-features/api-client.md` |
| `utils.ts` | `frontend-features/utils.md` |
| `constants.ts` | `frontend-features/constants.md` |
| `middleware.ts` | `frontend-features/middleware.md` (cookie gate) |

O Writer pode consolidar `EpisodeCard` + `EpisodeCardCompact` em uma única unit `episode-cards.md` (responsividade é o tema comum), e `SearchHero` + `SearchHeader` em `search-ui.md` (com TASK de remover SearchHeader como código morto).
