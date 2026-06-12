# accounts, Design Técnico

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Foco: COMO a unit é construída, com referência ao código legado.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Interface

### Endpoints HTTP (expostos em `/api/auth/`)

| Método | Caminho | Entrada | Saída | Status codes | Permissão |
|--------|---------|---------|-------|--------------|-----------|
| POST | `/api/auth/token/` | `{email: str, password: str}` | `{role: str, email: str}` + cookies `access_token`, `refresh_token` | 200, 400, 401, 403, 429 | Anônimo + throttle `login` (5/min) |
| POST | `/api/auth/token/refresh/` | (cookie `refresh_token`) | `{}` + cookie `access_token` | 200, 401, 429 | Anônimo (com cookie) |
| POST | `/api/auth/register/` | `{email: str, password: str}` | `{email: str}` | 201, 400, 429 | Anônimo + throttle `register` (3/min) |
| GET | `/api/auth/users/` | — | `User[]` ordenado por `created_at` desc | 200, 401, 403 | `IsAdminRole` |
| POST | `/api/auth/users/{pk}/approve/` | — | `User` (com `approval_status="approved"`) | 200, 401, 403, 404 | `IsAdminRole` |
| PATCH | `/api/auth/users/{pk}/` | `{role: "admin"\|"editor"\|"reader"}` | `User` | 200, 400, 401, 403, 404 | `IsAdminRole` |

### Classes e funções-chave

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `UserManager.create_user` | `(email: str, password: str \| None = None, **extra_fields)` | `User` | Normaliza email; `setdefault("approval_status", "pending")`; `setdefault("role", "reader")`; `set_password(password)`; `save(using=self._db)`. Lança `ValueError` se email vazio. |
| `UserManager.create_superuser` | `(email: str, password: str \| None = None, **extra_fields)` | `User` | Força `is_staff=True`, `is_superuser=True`, `approval_status="approved"`, `role="admin"`. Levanta `ValueError` se `is_staff` ou `is_superuser` não forem `True`. Reutiliza `create_user`. |
| `User` | (Django model) | — | `USERNAME_FIELD = "email"`, `REQUIRED_FIELDS = []`. Herda de `AbstractBaseUser` + `PermissionsMixin`. Sem campo `username`. |
| `CookieJWTAuthentication.authenticate` | `(self, request)` | `(user, validated_token) \| None` | Lê `request.COOKIES.get("access_token")`. Se ausente, retorna `None` (permite endpoints públicos). Se presente, valida o token via `JWTAuthentication.get_validated_token` e retorna `(user, validated_token)`. |
| `EmailTokenObtainPairSerializer.get_token` | `(cls, user)` | `Token` | Adiciona claims customizadas `role` e `email` ao JWT via `token[role] = user.role` / `token[email] = user.email`. |
| `EmailTokenObtainPairSerializer.validate` | `(self, attrs)` | `dict` | Chama `super().validate(attrs)` para autenticar por email (via `username_field = "email"`). Em sucesso, anexa `role` e `email` ao `response_data`. Se `self.user.approval_status != "approved"`, levanta `PermissionDenied("Sua conta aguarda aprovação")` (HTTP 403). |
| `RegisterSerializer.validate_password` | `(self, value)` | `str` | Levanta `ValidationError` se `len(value) < 8`. |
| `RegisterSerializer.create` | `(self, validated_data)` | `User` | Chama `User.objects.create_user` com `email` e `password`. Define explicitamente `approval_status="pending"` e `role="reader"`. |
| `TokenObtainCookieView.post` | `(self, request, *args, **kwargs)` | `Response` | Herda de `TokenObtainPairView`. Trata `PermissionDenied` → 403 PT-BR; `AuthenticationFailed` → 401 PT-BR; outras exceções delegadas. Em sucesso, lê `access`/`refresh`/`role`/`email` de `response.data`, define cookies HttpOnly, retorna apenas `{role, email}`. |
| `TokenRefreshCookieView.post` | `(self, request, *args, **kwargs)` | `Response` | Lê `refresh_token` do cookie. Se ausente, retorna 401 com mensagem PT-BR. Injeta `refresh` em `request.data` para o serializer SimpleJWT validar. Em sucesso, define novo cookie `access_token` e retorna body vazio. |
| `RegisterView.create` | `(self, request, *_args, **_kwargs)` | `Response` | `permission_classes = []`, `authentication_classes = []` (público). Throttling `AnonRateThrottle` com scope `register`. `is_valid(raise_exception=True)` → `perform_create` dentro de `try/except IntegrityError` (email duplicado) → 400 PT-BR. Sucesso → 201 com `{email}`. |
| `UserListView` | `generics.ListAPIView` | `Response` | `GET /api/auth/users/`. `permission_classes = [IsAdminRole]`. `queryset = User.objects.all().order_by("-created_at")`. |
| `UserApproveView.post` | `(self, _request, pk, *_args, **_kwargs)` | `Response` | 404 se não existe; 200 com `UserSerializer` (após setar `approval_status="approved"` e `save()`). |
| `UserRoleUpdateView.patch` | `(self, request, pk, *_args, **_kwargs)` | `Response` | Valida `role ∈ {"admin", "editor", "reader"}` antes de consultar. 400 com `Mensagem("papel inválido")` se inválido. 404 se não existe. 200 com `UserSerializer` em sucesso. |
| `IsAdminRole.has_permission` | `(self, request, view)` | `bool` | `request.user.is_authenticated and request.user.role == "admin"`. |
| `IsEditorOrAdmin.has_permission` | `(self, request, view)` | `bool` | `request.user.is_authenticated and request.user.role in {"editor", "admin"}`. |

## Fluxo Principal

### Login (RF-01, R-USER-04)

```
1. Cliente: POST /api/auth/token/ com {email, password}
   [frontend/src/app/api/auth/login/route.ts:18-66]
2. Next.js Route Handler: encaminha ao Django com body idêntico
   - Headers preservados; `Content-Type: application/json` garantido
3. Django: TokenObtainCookieView.post(request, *args, **kwargs)
   [backend/accounts/views.py:47-96]
4. Herança de TokenObtainPairView chama EmailTokenObtainPairSerializer
5. EmailTokenObtainPairSerializer.validate(attrs):
   a. super().validate(attrs) — autentica por email (UserManager)
   b. Verifica approval_status:
      - Se "pending": raise PermissionDenied("Sua conta aguarda aprovação")
      - Se "approved": anexa role e email ao response_data
6. DRF formata response: {access, refresh, role, email}
7. TokenObtainCookieView.post trata o response:
   a. Lê access, refresh, role, email
   b. Define response = Response({role, email}) (omite tokens do body)
   c. response.set_cookie("access_token", access, ...)
   d. response.set_cookie("refresh_token", refresh, path="/api/auth/token/refresh/", ...)
8. Cliente recebe:
   - 200 + body {role, email} + Set-Cookie access_token, refresh_token
9. AuthContext.login(role, email) atualiza estado em memória
10. router.push(next || "/")
```

### Registro + Aprovação Pendente (RF-04, R-USER-02)

```
1. Cliente: POST /api/auth/register/ com {email, password}
   [frontend/src/app/api/auth/register/route.ts]
2. Next.js Route Handler: encaminha ao Django
3. Django: RegisterView.create
   [backend/accounts/views.py:182-197]
4. RegisterSerializer.is_valid:
   a. validate_email: EmailField, obrigatório
   b. validate_password: len >= 8
5. perform_create (dentro de try/except IntegrityError):
   a. User.objects.create_user(email, password)
   b. Defaults aplicados: approval_status="pending", role="reader"
6. Sucesso: 201 com {email}
7. Cliente exibe card de sucesso (RegisterPage), orienta ir a /login
8. Usuário tenta login → PermissionDenied (R-USER-04) → 403
9. Admin faz POST /api/auth/users/{id}/approve/ → status muda
10. Usuário consegue logar
```

### Refresh Automático (RF-03)

```
1. Cliente: chamada autenticada via /api/proxy/[...path]
2. Proxy: encaminha com cookie access_token
3. Django: CookieJWTAuthentication.authenticate
   [backend/accounts/authentication.py:13-17]
4. Se access_token válido: request.user = User, view processa
5. Se access_token expirado/ausente: 401
6. Frontend proxy: detecta 401, faz POST /api/auth/token/refresh/
7. Django: TokenRefreshCookieView.post
   [backend/accounts/views.py:118-156]
8. Lê refresh_token do cookie; injeta em request.data
9. SimpleJWT valida o refresh; emite novo access
10. Define novo cookie access_token; retorna body vazio
11. Proxy: re-envia request original com novo access_token
12. Django: processa; response 200 ao cliente
```

## Fluxos Alternativos

- **Conta pending em login:** `PermissionDenied` levantada em `validate` → DRF converte para 403 com mensagem PT-BR. Frontend exibe "Sua conta aguarda aprovação" sem redirect (R-AUTH-03).
- **Email duplicado no registro:** `IntegrityError` capturada em `perform_create` → 400 com mensagem "Email já cadastrado" (PT-BR).
- **Role inválido no PATCH:** `UserRoleUpdateView.patch` valida `role ∈ {"admin", "editor", "reader"}` antes de consultar o usuário. Se inválido, retorna 400 com `Mensagem("papel inválido")`.
- **Rate limit excedido:** `AnonRateThrottle` retorna 429 (Too Many Requests). Frontend exibe feedback genérico.
- **Refresh sem cookie:** `TokenRefreshCookieView` retorna 401 com mensagem "Token de atualização não fornecido" (PT-BR).
- **Refresh com token inválido:** `(InvalidToken, TokenError)` capturadas → 401 com mensagem "Token inválido ou expirado".
- **PATCH em usuário inexistente:** `get_object_or_404` (ou `User.objects.get(pk=pk)`) → 404.

## Dependências

- **Django 5.2.13** — `AbstractBaseUser`, `PermissionsMixin`, `BaseUserManager`, `EmailField`, `EmailValidator`.
- **djangorestframework 3.16+** — `APIView`, `generics.ListAPIView`, `viewsets`, `serializers`, `permissions.BasePermission`, `throttling`.
- **djangorestframework-simplejwt 5.5.1** — `TokenObtainPairView`, `TokenRefreshView`, `TokenObtainPairSerializer`, `RefreshToken`, `InvalidToken`, `TokenError`. Configurado em `config/settings.py:REST_FRAMEWORK` (AUTH_CLASSES, throttle scopes) e em `accounts/urls.py`.
- **Frontend Next.js 16.2.3** — Route Handlers em `src/app/api/auth/{login,logout,register}/route.ts` fazem ponte com Django.
- **Frontend `AuthContext`** — armazena `{user: {email, role}}` em memória; consumido por Navbar, AddPodcastPage, ForbiddenPage.
- **Frontend Edge Middleware** (`src/middleware.ts:13-24`) — bloqueia `/add-podcast` e `/admin/*` sem `access_token` cookie.
- **PostgreSQL 15** — persistência de `User` (custom table `accounts_user`).

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Custom User com email (não username) | `accounts/models.py:User` (USERNAME_FIELD = "email") | 🟢 |
| Aprovação gate (pending → approved) | `accounts/serializers.py:32-35` (PermissionDenied) + ADR-001 | 🟢 |
| JWT em cookies HttpOnly com paths distintos | `accounts/views.py:75-90` (set_cookie) | 🟢 |
| Cookie `access_token` em `/`; `refresh_token` em `/api/auth/token/refresh/` | `accounts/views.py:84, 88` (path distintos) | 🟢 |
| Cookie `secure = not settings.DEBUG` | `accounts/views.py:90` | 🟢 |
| `CookieJWTAuthentication` em vez de `JWTAuthentication` padrão | `accounts/authentication.py:13-17` | 🟢 |
| Approval status ortogonal a role (pending editor ≠ approved editor) | `accounts/models.py:User` + ADR-008 | 🟢 |
| Throttling por scope (`login`, `register`) | `config/settings.py:REST_FRAMEWORK.throttle_scope` | 🟢 |
| Mensagens de erro em PT-BR (consistente com UI) | `accounts/views.py:53, 60, 87, 92, 120, 150, 195` | 🟢 |
| Auto-promoção de admin é permitida (decisão consciente) | `accounts/views.py:254-275` (sem `pk != request.user.pk`) | 🟢 (Q&A 2026-06-05) |
| `TopicSuggestion.is_recorded` setado manualmente (sem trigger) | `podcasts/models.py:TopicSuggestion` (default=False) | 🟢 (Q&A 2026-06-05) 🔴 **Removendo** (Perna 2026-06-06) |
| **Sem** auditoria de aprovação/mudança de papel | `accounts/views.py:UserApproveView.post` (223-236) | 🔴 R-USER-08 (gap) |
| **Sem** invalidação JWT no logout (apenas clear cookies) | `frontend/src/app/api/auth/logout/route.ts:3-18` | 🔴 AI-5 (gap) |
| **Sem** rate limit específico em busca de episódios | `podcasts/views.py:EpisodeViewSet` (config DRF) | 🔴 AI-4 (gap) |
| Defaults aplicados via `setdefault` (não `setattr`) | `accounts/models.py:25-26` | 🟢 (preserva valores passados) |

## Estado Interno

| Estado | Onde | Comportamento |
|---------|------|---------------|
| `User.role` | DB (`accounts_user.role`) | Mutado por `UserRoleUpdateView.patch` (admin only) ou `create_superuser`. Persistente. |
| `User.approval_status` | DB | Mutado por `UserApproveView.post` (admin only). Persistente. |
| `User.is_active` | DB | Django built-in. Default `True`. |
| `User.is_staff` | DB | Django built-in. Default `False`. |
| `User.is_superuser` | DB | Django built-in. Default `False`. |
| `User.last_login` | DB | Atualizado por Django em cada login. |
| Cookie `access_token` | Browser (15min) | Definido em login e refresh. |
| Cookie `refresh_token` | Browser (24h, path restrito) | Definido em login. |
| `AuthContext.user` | Memória (React state) | Setado em login; limpo em logout. |
| `isLoading` em `AuthContext` | Memória | Sempre `false` (constante — bug latente, AI implícito). |

## Observabilidade

| Sinal | Origem | Cobertura |
|-------|--------|-----------|
| `PermissionDenied` no login (pending) | `accounts/serializers.py:32-35` | 🟡 Sem log estruturado; apenas stack trace DRF em DEBUG |
| Sucesso de login | `accounts/views.py:75-90` | 🟡 Sem log de "user X logged in" |
| Sucesso de aprovação | `accounts/views.py:223-236` | 🔴 Sem log de "admin X approved user Y" (R-USER-08) |
| Mudança de role | `accounts/views.py:254-275` | 🔴 Sem log de "admin X changed user Y to role Z" |
| Throttle excedido | DRF `AnonRateThrottle` | 🟡 Sem log explícito; apenas counter DRF |
| Refresh token inválido | `accounts/views.py:148-155` | 🟡 Sem log do motivo específico |
| Requests HTTP gerais | Django middleware | 🟡 Logs padrão Django (request log) |
| Métricas (Prometheus/etc) | — | 🔴 Não observado |
| Tracing distribuído | — | 🔴 Não observado |

## Riscos e Lacunas

- 🔴 **R-USER-08** — Aprovação de usuário não registra auditoria. Recomendação: criar `UserApprovalLog` model com `approver_id`, `approved_user_id`, `timestamp`; ou usar Django signals.
- 🔴 **AI-5** — Logout não chama `/api/auth/token/blacklist/` (já habilitado em `INSTALLED_APPS`). Tokens ainda válidos até `exp`. Recomendação: implementar blacklist no logout.
- 🔴 **AI-4** — `EpisodeViewSet` não tem throttle scope `search`. Invasores podem inflar `PopularTerm`. Recomendação: adicionar `AnonRateThrottle` com scope `search` e `UserRateThrottle` por usuário logado.
- 🟡 **R-USER-09** — `UserRoleUpdateView` permite admin se auto-promover/rebaixar. Decisão consciente (Q&A 2026-06-05), mas vale revisar com `pk != request.user.pk` se a regra mudar.
- 🟡 **I-7, I-8** — Sem `db.CheckConstraint` para `role` e `approval_status`. Garantia depende de validação em runtime. Adicionar CheckConstraint em migration.
- 🟡 **AuthContext.isLoading** sempre `false` — consumers não conseguem detectar "verificando sessão". Adicionar integração com `/api/auth/me` ou similar.
- 🟡 **Sem endpoint `/api/auth/me`** — frontend mantém user em memória, mas não consegue refresh da info após reload. Adicionar endpoint protegido que retorna user atual.
- 🟡 **Sem proteção CSRF explícita em endpoints JSON** — DRF usa `SessionAuthentication` por padrão; aqui usa JWT em cookies. Em produção, garantir que `CSRF_TRUSTED_ORIGINS` esteja correto (commit `5d4efa1`).
- 🟡 **`register` throttle 3/min** — pode ser baixo para campanhas de marketing; revisar.
- 🟢 **Nada de breaking change conhecido** nas decisões atuais — refactors de auditoria/blacklist são aditivos.

## Detalhes de Cookies (RF-15)

```python
# backend/accounts/views.py (simplified)
response.set_cookie(
    "access_token",
    access,
    max_age=900,            # 15 min (Perna 2026-06-06)
    httponly=True,
    samesite="Lax",
    secure=not settings.DEBUG,
    path="/",
)

response.set_cookie(
    "refresh_token",
    refresh,
    max_age=86400,          # 24 h
    httponly=True,
    samesite="Lax",
    secure=not settings.DEBUG,
    path="/api/auth/token/refresh/",
)
```

> **Por que path `/api/auth/token/refresh/` para refresh?** O cookie de refresh tem escopo mais restrito (apenas a rota de refresh). Se o site for comprometido, o refresh cookie vaza menos. É prática recomendada para JWT em cookies (ADR-002).

## Fluxo de Logout (RF-13)

```
1. Cliente: POST /api/auth/logout
2. Next.js Route Handler: não chama Django
   [frontend/src/app/api/auth/logout/route.ts:3-18]
3. Define Set-Cookie: access_token=; Max-Age=0
4. Define Set-Cookie: refresh_token=; Max-Age=0
5. Retorna 200 {success: true}
6. AuthContext.logout() limpa user em memória
7. router.push("/")
```

🟡 **Observação:** logout **não** chama `/api/auth/token/blacklist/` — tokens permanecem válidos até `exp`. Aceitável como MVP; gap conhecido (AI-5).
