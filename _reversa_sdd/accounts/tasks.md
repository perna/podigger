# accounts, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Tarefas para reimplementar a unit `accounts` a partir do código legado, com rastreabilidade.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Django 5.2+ configurado com `AUTH_USER_MODEL = "accounts.User"` em `config/settings.py`
- [ ] `djangorestframework` 3.16+ instalado e configurado em `REST_FRAMEWORK`
- [ ] `djangorestframework-simplejwt` 5.5+ instalado; `INSTALLED_APPS += ["rest_framework_simplejwt", "rest_framework_simplejwt.token_blacklist"]`
- [ ] Throttle scopes `login`, `register`, `anon`, `user` configurados em `REST_FRAMEWORK.DEFAULT_THROTTLE_CLASSES` e `DEFAULT_THROTTLE_RATES`
- [ ] `django-environ` configurado para ler `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- [ ] Frontend Next.js com Route Handlers em `src/app/api/auth/{login,logout,register}/route.ts`
- [ ] `AuthContext` em `src/contexts/AuthContext.tsx` (já existente no legado)
- [ ] Edge Middleware em `src/middleware.ts` (já existente)
- [ ] Schema/migrations compatíveis (1 migration inicial em `accounts/migrations/0001_initial.py`)

## Tarefas

> Cada tarefa referencia o arquivo do legado de onde o comportamento foi extraído.

### Model e Manager

- [ ] **T-01**, Definir `User` custom com email como identificador
  - Origem no legado: `backend/accounts/models.py:User`
  - Critério de pronto: `USERNAME_FIELD = "email"`, `REQUIRED_FIELDS = []`; herda de `AbstractBaseUser` + `PermissionsMixin`; sem campo `username`; campos `email` (unique), `password`, `role` (choices), `approval_status` (choices), `is_active`, `is_staff`, `is_superuser`, `last_login`, `date_joined`, `created_at`.
  - Confiança: 🟢

- [ ] **T-02**, Implementar `UserManager` com `create_user` e `create_superuser`
  - Origem no legado: `backend/accounts/models.py:16-49`
  - Critério de pronto: `create_user(email, password=None, **extra_fields)` normaliza email, define defaults `approval_status="pending"` e `role="reader"` via `setdefault`, chama `set_password`, faz `save(using=self._db)`. Levanta `ValueError` se email vazio. `create_superuser` força `is_staff=True`, `is_superuser=True`, `approval_status="approved"`, `role="admin"`, e valida que essas flags permaneçam `True` após `setdefault`.
  - Confiança: 🟢

- [ ] **T-03**, Criar migration inicial
  - Origem no legado: `backend/accounts/migrations/0001_initial.py`
  - Critério de pronto: `python manage.py makemigrations accounts` gera o schema; `migrate` aplica sem erro; tabela `accounts_user` existe com UNIQUE em `email`.
  - Confiança: 🟢

### Autenticação custom

- [ ] **T-04**, Implementar `CookieJWTAuthentication`
  - Origem no legado: `backend/accounts/authentication.py:13-17`
  - Critério de pronto: classe herda de `JWTAuthentication`; sobrescreve `authenticate(self, request)` para ler `request.COOKIES.get("access_token")` em vez do header `Authorization`; retorna `None` se ausente (permite endpoints públicos sem levantar exceção); valida token e retorna `(user, validated_token)`.
  - Confiança: 🟢

### Permissões

- [ ] **T-05**, Implementar `IsAdminRole`
  - Origem no legado: `backend/accounts/permissions.py:7-11`
  - Critério de pronto: `has_permission(self, request, view)` retorna `True` se `request.user.is_authenticated and request.user.role == "admin"`. Caso contrário, `False` (DRF retorna 403).
  - Confiança: 🟢

- [ ] **T-06**, Implementar `IsEditorOrAdmin`
  - Origem no legado: `backend/accounts/permissions.py:17-20`
  - Critério de pronto: `has_permission(self, request, view)` retorna `True` se `request.user.is_authenticated and request.user.role in {"editor", "admin"}`.
  - Confiança: 🟢

### Serializers

- [ ] **T-07**, Implementar `EmailTokenObtainPairSerializer` com gate de aprovação
  - Origem no legado: `backend/accounts/serializers.py:19-41`
  - Critério de pronto: herda de `TokenObtainPairSerializer`; `username_field = "email"`; `get_token(cls, user)` adiciona claims `role` e `email` ao JWT; `validate(self, attrs)` chama `super().validate(attrs)` (autentica por email) e, se `self.user.approval_status != "approved"`, levanta `PermissionDenied("Sua conta aguarda aprovação")`. Em sucesso, anexa `role` e `email` ao `response_data`.
  - Confiança: 🟢

- [ ] **T-08**, Implementar `RegisterSerializer`
  - Origem no legado: `backend/accounts/serializers.py:53-65`
  - Critério de pronto: herda de `serializers.ModelSerializer`; campos `email`, `password` (write_only), `passwordConfirm` (write_only, opcional); `validate_password(self, value)` levanta `ValidationError` se `len(value) < 8`; `validate(self, attrs)` opcionalmente checa `password == passwordConfirm`; `create(self, validated_data)` chama `User.objects.create_user` com `email` e `password`, força `approval_status="pending"` e `role="reader"`.
  - Confiança: 🟢

- [ ] **T-09**, Implementar `UserSerializer` (leitura)
  - Origem no legado: `backend/accounts/serializers.py` (classe existente, inferida pelo uso em views)
  - Critério de pronto: herda de `serializers.ModelSerializer`; expõe `id`, `email`, `role`, `approval_status`, `created_at`; `password` é write_only (não exposto em GET).
  - Confiança: 🟡

### Views (Controllers)

- [ ] **T-10**, Implementar `TokenObtainCookieView`
  - Origem no legado: `backend/accounts/views.py:47-96`
  - Critério de pronto: herda de `TokenObtainPairView`; `permission_classes = []` (público); `throttle_scope = "login"`; `post(request, *args, **kwargs)` envolve `super().post()` em try/except tratando `PermissionDenied` (403 PT-BR) e `AuthenticationFailed` (401 PT-BR); em sucesso, lê `access`, `refresh`, `role`, `email` de `response.data`, define cookies HttpOnly (ver T-15), e retorna `Response({role, email})` (omite tokens do body).
  - Confiança: 🟢

- [ ] **T-11**, Implementar `TokenRefreshCookieView`
  - Origem no legado: `backend/accounts/views.py:118-156`
  - Critério de pronto: herda de `TokenRefreshView`; `permission_classes = []`; `post(request, *args, **kwargs)` lê `refresh_token` do cookie; se ausente, retorna 401 PT-BR; injeta `refresh` em `request.data`; captura `(InvalidToken, TokenError)` → 401 PT-BR; em sucesso, define novo cookie `access_token` (mesmos atributos) e retorna `Response({})`.
  - Confiança: 🟢

- [ ] **T-12**, Implementar `RegisterView`
  - Origem no legado: `backend/accounts/views.py:182-197`
  - Critério de pronto: herda de `CreateAPIView`; `permission_classes = []`, `authentication_classes = []`; `throttle_scope = "register"`; `serializer_class = RegisterSerializer`; `create(self, request, *_args, **_kwargs)` chama `serializer.is_valid(raise_exception=True)`, depois `perform_create` dentro de `try/except IntegrityError` → 400 PT-BR para email duplicado; sucesso → 201 com `{email}`.
  - Confiança: 🟢

- [ ] **T-13**, Implementar `UserListView`
  - Origem no legado: `backend/accounts/views.py:200-209`
  - Critério de pronto: herda de `generics.ListAPIView`; `permission_classes = [IsAdminRole]`; `queryset = User.objects.all().order_by("-created_at")`; `serializer_class = UserSerializer`.
  - Confiança: 🟢

- [ ] **T-14**, Implementar `UserApproveView`
  - Origem no legado: `backend/accounts/views.py:223-236`
  - Critério de pronto: herda de `generics.GenericAPIView`; `permission_classes = [IsAdminRole]`; `post(self, _request, pk, *_args, **_kwargs)` busca usuário com `get_object_or_404`, define `user.approval_status = "approved"`, `user.save()`, retorna `Response(UserSerializer(user).data)` com status 200.
  - Confiança: 🟢

- [ ] **T-15**, Implementar `UserRoleUpdateView`
  - Origem no legado: `backend/accounts/views.py:254-275`
  - Critério de pronto: herda de `generics.GenericAPIView`; `permission_classes = [IsAdminRole]`; `patch(self, request, pk, *_args, **_kwargs)` valida `request.data.get("role") in {"admin", "editor", "reader"}` antes de qualquer consulta; se inválido, retorna 400 com `Mensagem("papel inválido")`; busca usuário com `get_object_or_404`; se sucesso, `user.role = role`, `user.save()`, retorna 200 com `UserSerializer`.
  - Confiança: 🟢

### Cookies (helpers)

- [ ] **T-16**, Helper `set_auth_cookies(response, access, refresh)`
  - Origem no legado: `backend/accounts/views.py:75-90`
  - Critério de pronto: função utilitária que define `response.set_cookie("access_token", access, max_age=900, httponly=True, samesite="Lax", secure=not settings.DEBUG, path="/")` e `response.set_cookie("refresh_token", refresh, max_age=86400, httponly=True, samesite="Lax", secure=not settings.DEBUG, path="/api/auth/token/refresh/")`.
  - Confiança: 🟢

### Roteamento

- [ ] **T-17**, Configurar `accounts/urls.py`
  - Origem no legado: `backend/accounts/urls.py`
  - Critério de pronto: 6 rotas:
    - `path("token/", TokenObtainCookieView.as_view(), name="token_obtain")`
    - `path("token/refresh/", TokenRefreshCookieView.as_view(), name="token_refresh")`
    - `path("register/", RegisterView.as_view(), name="register")`
    - `path("users/", UserListView.as_view(), name="user_list")`
    - `path("users/<int:pk>/approve/", UserApproveView.as_view(), name="user_approve")`
    - `path("users/<int:pk>/", UserRoleUpdateView.as_view(), name="user_update")`
  - Incluído em `config/urls.py` via `path("api/auth/", include("accounts.urls"))`.
  - Confiança: 🟢

### Settings (config)

- [ ] **T-18**, Configurar `REST_FRAMEWORK` em `config/settings.py`
  - Origem no legado: `config/settings.py:REST_FRAMEWORK`
  - Critério de pronto: `DEFAULT_AUTHENTICATION_CLASSES = ["accounts.authentication.CookieJWTAuthentication"]`; `DEFAULT_PERMISSION_CLASSES` definido (pode ser vazio ou `IsAuthenticated`); `DEFAULT_THROTTLE_CLASSES` com `AnonRateThrottle`, `UserRateThrottle`; `DEFAULT_THROTTLE_RATES` com `"anon": "<n>/min"`, `"user": "<n>/min"`, `"login": "5/min"`, `"register": "3/min"`; `DEFAULT_FILTER_BACKENDS` com `SearchFilter`, `OrderingFilter`; `DEFAULT_PAGINATION_CLASS` com `PageNumberPagination`.
  - Confiança: 🟢

- [ ] **T-19**, Configurar SimpleJWT em `config/settings.py`
  - Origem no legado: `config/settings.py:SIMPLE_JWT`
  - Critério de pronto: `ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)` (conf. Perna 2026-06-06); `REFRESH_TOKEN_LIFETIME = timedelta(days=1)`; `ROTATE_REFRESH_TOKENS = True`; `BLACKLIST_AFTER_ROTATION = False` (Perna: não precisa de blacklist); `TOKEN_BLACKLIST_ENABLED = False`; `ALGORITHM = "HS256"`; `SIGNING_KEY = SECRET_KEY`; `USER_ID_FIELD = "id"`; `USER_ID_CLAIM = "user_id"`.
  - Confiança: 🟢

- [ ] **T-20**, Configurar middleware de segurança
  - Origem no legado: `config/settings.py:MIDDLEWARE` + commit `5d4efa1`
  - Critério de pronto: `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`; `CSRF_TRUSTED_ORIGINS` lê de env var com default sensato; `CORS_ALLOWED_ORIGINS` lê de env; `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` condicionados a `not DEBUG`.
  - Confiança: 🟢

## Tarefas de Teste

- [ ] **TT-01**, Teste de login feliz
  - Origem: `accounts/tests/test_login.py` (presumido, ver `backend/accounts/tests/`)
  - Cenário: usuário `approved` faz login com credenciais válidas → 200 + Set-Cookie.
  - Confiança: 🟢

- [ ] **TT-02**, Teste de login com conta pending
  - Cenário: usuário `pending` faz login → 403 com mensagem PT-BR.
  - Confiança: 🟢

- [ ] **TT-03**, Teste de login com credenciais inválidas
  - Cenário: email inexistente ou senha errada → 401 com mensagem PT-BR.
  - Confiança: 🟢

- [ ] **TT-04**, Teste de throttling de login
  - Cenário: 6 tentativas em 1 minuto → 6ª retorna 429.
  - Confiança: 🟢

- [ ] **TT-05**, Teste de registro feliz
  - Cenário: POST com email+senha válidos → 201; usuário criado com `approval_status="pending"` e `role="reader"`.
  - Confiança: 🟢

- [ ] **TT-06**, Teste de registro com email duplicado
  - Cenário: POST com email já existente → 400.
  - Confiança: 🟢

- [ ] **TT-07**, Teste de registro com senha curta
  - Cenário: POST com senha de 7 chars → 400 com erro de validação.
  - Confiança: 🟢

- [ ] **TT-08**, Teste de throttling de registro
  - Cenário: 4 registros em 1 minuto → 4º retorna 429.
  - Confiança: 🟢

- [ ] **TT-09**, Teste de refresh válido
  - Cenário: POST com `refresh_token` válido → 200 + novo `access_token`.
  - Confiança: 🟢

- [ ] **TT-10**, Teste de refresh sem cookie
  - Cenário: POST sem `refresh_token` → 401.
  - Confiança: 🟢

- [ ] **TT-11**, Teste de listagem de usuários como admin
  - Cenário: admin faz GET → 200 com lista ordenada.
  - Confiança: 🟢

- [ ] **TT-12**, Teste de listagem de usuários como reader/editor
  - Cenário: não-admin faz GET → 403.
  - Confiança: 🟢

- [ ] **TT-13**, Teste de aprovação de usuário
  - Cenário: admin aprova usuário pendente → 200; status muda para `approved`.
  - Confiança: 🟢

- [ ] **TT-14**, Teste de aprovação de usuário inexistente
  - Cenário: admin tenta aprovar id=9999 → 404.
  - Confiança: 🟢

- [ ] **TT-15**, Teste de mudança de role válida
  - Cenário: admin muda role para "editor" → 200.
  - Confiança: 🟢

- [ ] **TT-16**, Teste de mudança de role inválida
  - Cenário: admin tenta `role: "superuser"` → 400 com mensagem "papel inválido".
  - Confiança: 🟢

- [ ] **TT-17**, Teste property-based: combinações de role/approval_status
  - Origem: `accounts/tests/test_property_*.py` (presumido, ver `hypothesis` em requirements)
  - Cenário: gerar combinações aleatórias de role × approval_status, verificar que login falha para todas as combinações com `approval_status="pending"`, mesmo se role="admin" (ortogonalidade).
  - Confiança: 🟡

- [ ] **TT-18**, Teste de cookie attrs
  - Cenário: inspecionar `Set-Cookie` no login → `access_token` com `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=300`; `refresh_token` com `Path=/api/auth/token/refresh/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=86400`.
  - Confiança: 🟢

- [ ] **TT-19**, Teste de CookieJWTAuthentication com cookie ausente
  - Cenário: endpoint protegido chamado sem cookie → `request.user` é `AnonymousUser`.
  - Confiança: 🟢

- [ ] **TT-20**, Teste de CookieJWTAuthentication com token inválido
  - Cenário: cookie presente mas token adulterado → 401.
  - Confiança: 🟢

## Tarefas de Migração de Dados (se aplicável)

- [ ] **TM-01**, Migration inicial
  - Origem: `backend/accounts/migrations/0001_initial.py`
  - Conteúdo: criar tabela `accounts_user` com todas as colunas do modelo `User` (sem FKs para outros apps); UNIQUE em `email`; index padrão em PK.
  - Confiança: 🟢

- [ ] **TM-02**, (Opcional) Seed de superuser para primeiro acesso
  - Origem: prático, não observado no legado
  - Conteúdo: comando de management `createsuperuser` ou script de seed que cria `admin@podigger.app` com `role="admin"` e `approval_status="approved"`. Senha gerada e exibida uma vez.
  - Confiança: 🟡

## Ordem Sugerida

1. **T-01, T-02, T-03** (Model + Manager + migration) — base de tudo.
2. **T-04** (CookieJWTAuthentication) — habilita autenticação por cookie.
3. **T-05, T-06** (Permissões) — habilitam RBAC.
4. **T-07, T-08, T-09** (Serializers) — dependem de T-01, T-02.
5. **T-10, T-11, T-12** (Login/Refresh/Register views) — dependem de T-04, T-05..T-08.
6. **T-16** (Cookie helper) — usado por T-10, T-11.
7. **T-13, T-14, T-15** (User management views) — dependem de T-05, T-06, T-09.
8. **T-17** (URLs) — dependem de T-10..T-15.
9. **T-18, T-19, T-20** (Settings) — paralelas, podem ser feitas cedo.
10. **TM-01** (Migration) — depende de T-01, T-02, T-03.
11. **TM-02** (Seed) — após migration aplicada.
12. Testes TT-01..TT-20 — escritos em paralelo ou após cada view (TDD opcional).

**Bloqueios críticos:**
- Sem T-01, T-02, T-03 → nenhum outro teste pode rodar.
- Sem T-04 → views protegidas não conseguem autenticar.
- Sem T-05, T-06 → permissions quebram em todas as views de domínio.

## Lacunas Pendentes (🔴)

- **R-USER-08 (auditoria):** gap aceitável por enquanto (Perna 2026-06-06). Não implementar agora. Caso seja decidido implementar no futuro, tarefas sugeridas:
  - **T-AUDIT-01**, Criar `UserApprovalLog` model (approver FK→User, approved_user FK→User, timestamp)
  - **T-AUDIT-02**, Adicionar signal ou override em `UserApproveView.post` para criar log
  - **T-AUDIT-03**, Adicionar log similar em `UserRoleUpdateView.patch` (admin X changed user Y to role Z)
  - **T-AUDIT-04**, Endpoint admin para listar logs

- **AI-5 (invalidação JWT no logout):** decisão Perna 2026-06-06: **não implementar**. Mantém apenas limpeza de cookies. Tokens permanecem válidos até `exp`. Se um dia for implementado, tarefas sugeridas:
  - **T-BLACKLIST-01**, Garantir `INSTALLED_APPS += ["rest_framework_simplejwt.token_blacklist"]`
  - **T-BLACKLIST-02**, Adicionar `path("token/blacklist/", TokenBlacklistView.as_view())` em `accounts/urls.py`
  - **T-BLACKLIST-03**, Modificar `frontend/src/app/api/auth/logout/route.ts` para fazer POST a `/api/auth/token/blacklist/` antes de clear cookies
  - **T-BLACKLIST-04**, Teste: token após logout não pode ser usado para refresh

- **I-7, I-8 (CheckConstraints):** se for decidido implementar:
  - **T-CONSTRAINT-01**, Adicionar migration com `CheckConstraint(check=Q(role__in=["admin", "editor", "reader"]), name="user_role_valid")`
  - **T-CONSTRAINT-02**, Idem para `approval_status`
  - **T-CONSTRAINT-03**, Atualizar testes para verificar rejeição de valores inválidos no DB

- **AuthContext.isLoading sempre `false`:** se for decidido implementar:
  - **T-AUTH-LOADING-01**, Adicionar endpoint `GET /api/auth/me/` que retorna user atual
  - **T-AUTH-LOADING-02**, AuthProvider.fetchUser on mount; isLoading=true enquanto fetch não retorna
  - **T-AUTH-LOADING-03**, Hidratar user em memória após page reload

- **AI-4 (rate limit em busca):** ver `podcasts/tasks.md` (escopo de podcasts, não accounts).
