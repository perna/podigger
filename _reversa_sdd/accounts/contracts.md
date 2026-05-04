# accounts, Contratos HTTP

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Contratos externos da unit `accounts` (autenticação, gestão de usuários).
> Base path: `/api/auth/`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão geral

A unit `accounts` expõe 6 endpoints REST sob `/api/auth/`:

| # | Método | Path | Nome interno | Auth | Throttle |
|---|--------|------|--------------|------|----------|
| 1 | POST | `/api/auth/token/` | Login | Anônimo | `login` (5/min) |
| 2 | POST | `/api/auth/token/refresh/` | Refresh | Anônimo (com cookie) | — |
| 3 | POST | `/api/auth/register/` | Register | Anônimo | `register` (3/min) |
| 4 | GET | `/api/auth/users/` | List users | Admin | — |
| 5 | POST | `/api/auth/users/{pk}/approve/` | Approve user | Admin | — |
| 6 | PATCH | `/api/auth/users/{pk}/` | Update role | Admin | — |

> **Cliente:** Frontend Next.js usa Route Handlers em `src/app/api/auth/{login,logout}/route.ts` como ponte. Chamadas genéricas autenticadas vão via `/api/proxy/[...path]`.

---

## 1. Login

### `POST /api/auth/token/`

**Headers:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "p@exemplo.com",
  "password": "senha123"
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `email` | string | sim | Email válido; login identifier |
| `password` | string | sim | Sem validação no serializer (validação é via `authenticate`) |

**Response 200 OK:**
```json
{
  "role": "reader",
  "email": "p@exemplo.com"
}
```

**Headers de response (200):**
```
Set-Cookie: access_token=<jwt>; Path=/; Max-Age=300; HttpOnly; SameSite=Lax; Secure
Set-Cookie: refresh_token=<jwt>; Path=/api/auth/token/refresh/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure
```

| Atributo de cookie | access_token | refresh_token |
|--------------------|--------------|----------------|
| Path | `/` | `/api/auth/token/refresh/` |
| Max-Age | 300 (5 min) | 86400 (24 h) |
| HttpOnly | ✓ | ✓ |
| SameSite | Lax | Lax |
| Secure (prod) | ✓ | ✓ |

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 400 | `{"detail": "JSON parse error - ..."}` | Body inválido |
| 401 | `{"detail": "Email ou senha inválidos"}` | Credenciais inválidas |
| 403 | `{"detail": "Sua conta aguarda aprovação"}` | `approval_status="pending"` |
| 429 | `{"detail": "Request was throttled. Expected available in N seconds."}` | 5 req/min excedido |

**Origem no legado:**
- `backend/accounts/views.py:47-96` (TokenObtainCookieView)
- `backend/accounts/serializers.py:19-41` (EmailTokenObtainPairSerializer)
- `frontend/src/app/api/auth/login/route.ts:46-61` (forward Set-Cookie)

---

## 2. Refresh access token

### `POST /api/auth/token/refresh/`

**Headers:**
```
Cookie: refresh_token=<jwt>
```

**Request body:** (vazio, cookie obrigatório)

**Response 200 OK:**
```json
{}
```

**Headers de response (200):**
```
Set-Cookie: access_token=<new_jwt>; Path=/; Max-Age=300; HttpOnly; SameSite=Lax; Secure
```

> 🟡 **Observação:** response body é vazio. Cliente deve confiar no Set-Cookie para obter o novo access_token.

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 401 | `{"detail": "Token de atualização não fornecido"}` | Sem cookie `refresh_token` |
| 401 | `{"detail": "Token inválido ou expirado"}` | Token adulterado, expirado ou revogado |

**Origem no legado:**
- `backend/accounts/views.py:118-156` (TokenRefreshCookieView)

---

## 3. Registro

### `POST /api/auth/register/`

**Headers:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "novo@exemplo.com",
  "password": "senha123"
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `email` | string | sim | Email válido; UNIQUE no banco |
| `password` | string | sim | `len(password) >= 8` |

**Response 201 Created:**
```json
{
  "email": "novo@exemplo.com"
}
```

**Comportamento implícito:**
- `approval_status = "pending"` (default)
- `role = "reader"` (default)
- Conta **não pode** logar até ser aprovada por admin (R-USER-04)

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 400 | `{"email": ["Enter a valid email address."]}` ou `{"password": ["Ensure this field has at least 8 characters."]}` | Validação de campo |
| 400 | `{"detail": "Email já cadastrado"}` | Email duplicado (IntegrityError → 400) |
| 429 | `{"detail": "Request was throttled..."}` | 3 req/min excedido |

**Origem no legado:**
- `backend/accounts/views.py:182-197` (RegisterView)
- `backend/accounts/serializers.py:53-65` (RegisterSerializer)

---

## 4. Listar usuários (admin)

### `GET /api/auth/users/`

**Headers:**
```
Cookie: access_token=<jwt>  (admin)
```

**Request body:** (nenhum)

**Query params:** (nenhum)

**Response 200 OK:**
```json
[
  {
    "id": 1,
    "email": "admin@podigger.app",
    "role": "admin",
    "approval_status": "approved",
    "is_active": true,
    "is_staff": true,
    "created_at": "2026-05-01T12:00:00Z"
  },
  {
    "id": 2,
    "email": "editor@podigger.app",
    "role": "editor",
    "approval_status": "approved",
    "is_active": true,
    "is_staff": false,
    "created_at": "2026-05-15T09:30:00Z"
  }
]
```

> 🟡 A resposta é uma lista pura (sem paginação DRF padrão), ordenada por `created_at` desc.

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 401 | `{"detail": "Authentication credentials were not provided."}` | Sem `access_token` |
| 403 | `{"detail": "You do not have permission to perform this action."}` | `role != "admin"` |

**Origem no legado:**
- `backend/accounts/views.py:200-209` (UserListView)
- `backend/accounts/permissions.py:7-11` (IsAdminRole)

---

## 5. Aprovar usuário (admin)

### `POST /api/auth/users/{pk}/approve/`

**Path params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `pk` | int | ID do usuário a aprovar |

**Headers:**
```
Cookie: access_token=<jwt>  (admin)
```

**Request body:** (nenhum)

**Response 200 OK:**
```json
{
  "id": 42,
  "email": "novo@exemplo.com",
  "role": "reader",
  "approval_status": "approved",
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-05-20T14:00:00Z"
}
```

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 401 | `{"detail": "Authentication credentials were not provided."}` | Sem `access_token` |
| 403 | `{"detail": "You do not have permission to perform this action."}` | `role != "admin"` |
| 404 | `{"detail": "Not found."}` | Usuário com `pk` não existe |

**Comportamento implícito:**
- `approval_status` do usuário é alterado para `"approved"`.
- 🔴 **NÃO** registra quem aprovou ou quando (R-USER-08, gap conhecido).

**Origem no legado:**
- `backend/accounts/views.py:223-236` (UserApproveView)

---

## 6. Atualizar role (admin)

### `PATCH /api/auth/users/{pk}/`

**Path params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `pk` | int | ID do usuário |

**Headers:**
```
Cookie: access_token=<jwt>  (admin)
Content-Type: application/json
```

**Request body:**
```json
{
  "role": "editor"
}
```

| Campo | Tipo | Obrigatório | Valores aceitos |
|-------|------|-------------|-----------------|
| `role` | string | sim | `"admin"` \| `"editor"` \| `"reader"` |

**Response 200 OK:**
```json
{
  "id": 5,
  "email": "user@exemplo.com",
  "role": "editor",
  "approval_status": "approved",
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-05-10T10:00:00Z"
}
```

**Erros:**

| Status | Body | Quando |
|--------|------|--------|
| 400 | `{"detail": "papel inválido"}` | `role` ∉ {admin, editor, reader} |
| 401 | `{"detail": "Authentication credentials were not provided."}` | Sem `access_token` |
| 403 | `{"detail": "You do not have permission to perform this action."}` | `role != "admin"` |
| 404 | `{"detail": "Not found."}` | Usuário com `pk` não existe |

**Comportamento implícito:**
- 🟡 Admin pode alterar o próprio `role` (sem proteção `pk != request.user.pk`). Decisão consciente (Q&A 2026-06-05, AI-6).
- 🔴 **NÃO** registra quem/quando alterou (gap conhecido).

**Origem no legado:**
- `backend/accounts/views.py:254-275` (UserRoleUpdateView)

---

## Tipos compartilhados

### `User`

```typescript
type User = {
  id: number;
  email: string;
  role: "admin" | "editor" | "reader";
  approval_status: "pending" | "approved";
  is_active: boolean;
  is_staff: boolean;
  created_at: string;  // ISO 8601
};
```

### `UserSummary` (no AuthContext, frontend)

```typescript
type UserSummary = {
  email: string;
  role: "admin" | "editor" | "reader";
};
```

> 🟡 O frontend mantém apenas `{email, role}` em memória (AuthContext). Outros campos precisam ser buscados via `GET /api/auth/users/{id}/` (não existe) ou via Django admin.

---

## Comportamento de cookies cross-cutting

### Fluxo de emissão (login)

```
Set-Cookie: access_token=<jwt>; Path=/; Max-Age=300; HttpOnly; SameSite=Lax; Secure
Set-Cookie: refresh_token=<jwt>; Path=/api/auth/token/refresh/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure
```

### Forward Set-Cookie (frontend → backend)

`frontend/src/app/api/auth/login/route.ts:46-61`:
```typescript
const setCookie = response.headers.getSetCookie?.() ?? response.headers.get('set-cookie');
// repassa literal para o cliente
```

### Limpeza (logout)

`frontend/src/app/api/auth/logout/route.ts:3-18`:
```
Set-Cookie: access_token=; Path=/; Max-Age=0
Set-Cookie: refresh_token=; Path=/api/auth/token/refresh/; Max-Age=0
```

> 🟡 O logout **não** chama o backend (apenas clear cookies). Tokens permanecem válidos até `exp`. Gap conhecido (AI-5).

### Auto-refresh (proxy catch-all)

`frontend/src/app/api/proxy/[...path]/route.ts:185-206`:
1. Forward 1 com `access_token` cookie.
2. Se response = 401:
   a. POST `/api/auth/token/refresh/` com `refresh_token` cookie.
   b. Se sucesso: extrai novo `access_token` via regex `^access_token=([^;]+)`.
   c. Re-envia request original (body pré-lido em ArrayBuffer) com novo token.
3. Se refresh falhar: 302 → `/auth/unauthorized?next=...` + clear cookies.

---

## Throttling

| Scope | Endpoint | Limite | Config em |
|-------|----------|--------|-----------|
| `anon` | todos (default) | não configurado | `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES` |
| `login` | `POST /api/auth/token/` | 5/min | `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES["login"]` |
| `register` | `POST /api/auth/register/` | 3/min | `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES["register"]` |

🟡 Scopes `anon` e `user` (defaults) não foram configurados explicitamente no legado — usar defaults DRF.

---

## Contrato de erro padrão DRF

```json
{
  "detail": "Mensagem de erro em PT-BR (ou inglês, conforme o caso)"
}
```

> 🟡 Mensagens de erro de accounts são em PT-BR (consistente com UI). Mensagens DRF default (ex: "Authentication credentials were not provided.") permanecem em inglês.

---

## Rastreabilidade

| Endpoint | View | Serializer | Permission | URL |
|----------|------|------------|------------|-----|
| `POST /api/auth/token/` | `TokenObtainCookieView` | `EmailTokenObtainPairSerializer` | `[]` | `accounts/urls.py:13` |
| `POST /api/auth/token/refresh/` | `TokenRefreshCookieView` | `TokenRefreshSerializer` (SimpleJWT) | `[]` | `accounts/urls.py:14` |
| `POST /api/auth/register/` | `RegisterView` | `RegisterSerializer` | `[]` | `accounts/urls.py:15` |
| `GET /api/auth/users/` | `UserListView` | `UserSerializer` | `IsAdminRole` | `accounts/urls.py:16` |
| `POST /api/auth/users/{pk}/approve/` | `UserApproveView` | `UserSerializer` | `IsAdminRole` | `accounts/urls.py:17` |
| `PATCH /api/auth/users/{pk}/` | `UserRoleUpdateView` | `UserSerializer` | `IsAdminRole` | `accounts/urls.py:18` |

---

## Lacunas contratuais (🔴)

- **Sem endpoint `GET /api/auth/users/{id}/`** — não é possível buscar um único usuário pelo id. Para verificação individual, Django admin (`/admin/accounts/user/{id}/`) é o caminho.
- **Sem endpoint `GET /api/auth/me/`** — frontend mantém `user` em memória e perde após reload. Recomendado: adicionar endpoint que retorna o user atual a partir do cookie `access_token`.
- **Sem endpoint de invalidação/blacklist explícito** — `POST /api/auth/token/blacklist/` (fornecido por SimpleJWT) **não** está exposto em `accounts/urls.py`. Para implementar AI-5, expor este endpoint.
- **Resposta do login não inclui `approval_status`** — frontend infere pela presença de role; após login, role está sempre associado a um user approved, então não há ambiguidade prática.
