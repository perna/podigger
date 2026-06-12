# frontend-pages, Contratos

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Contratos externos da unit `frontend-pages` (Route Handlers, middleware, contratos implícitos entre pages/handlers).
> Base path: `/api/`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão geral

A unit `frontend-pages` expõe **6 Route Handlers HTTP sob `/api/`** e **1 Edge Middleware** que protege rotas autenticadas. Esses são os pontos de contato externos — qualquer cliente (browser, mobile, curl) pode consumi-los.

| # | Tipo | Path | Handler | Auth |
|---|------|------|---------|------|
| 1 | Route Handler | `POST /api/auth/login` | `app/api/auth/login/route.ts` | Anônimo |
| 2 | Route Handler | `POST /api/auth/register` | `app/api/auth/register/route.ts` | Anônimo |
| 3 | Route Handler | `POST /api/auth/refresh` | `app/api/auth/refresh/route.ts` | Cookie `refresh_token` |
| 4 | Route Handler | `POST /api/auth/logout` | `app/api/auth/logout/route.ts` | (idempotente) |
| 5 | Route Handler | `GET /api/health` | `app/api/health/route.ts` | Anônimo |
| 6 | Route Handler | `ALL /api/proxy/[...path]` | `app/api/proxy/[...path]/route.ts` | Cookie `access_token` (auto-refresh) |
| 7 | Edge Middleware | `middleware.ts` (matcher: `/add-podcast`, `/admin/:path*`) | `src/middleware.ts` | Cookie `access_token` |

> **Cliente primário:** o próprio frontend Next.js (pages client-side). **Cliente secundário:** o browser (cookies HttpOnly) e qualquer ferramenta HTTP (curl, Postman).

---

## 1. Login

### `POST /api/auth/login`

**Função:** proxy para Django `POST /api/auth/token/`. Faz forward literal de Set-Cookie.

**Headers de request:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Status codes:**

| Status | Quando | Body |
|--------|--------|------|
| 200 | Credenciais válidas + conta `approved` | `{role, email}` + Set-Cookie (ver abaixo) |
| 400 | JSON inválido no body | `{detail: 'Corpo da requisição inválido.'}` |
| 401 | Credenciais inválidas (email ou senha errados) | body do backend forwarded |
| 403 | Credenciais válidas, mas conta `pending` | body do backend forwarded |
| 503 | Backend Django unreachable (network error) | `{detail: 'Serviço indisponível. Tente novamente.'}` |

**Response 200 — body:**
```json
{
  "role": "admin" | "editor" | "reader",
  "email": "user@example.com"
}
```

**Response 200 — headers:**
```
Set-Cookie: access_token=<jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=300; Secure (em prod)
Set-Cookie: refresh_token=<jwt>; Path=/api/auth/token/refresh/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure (em prod)
```

**Cliente esperado:** `/login` page (formulário). Após 200, AuthContext.login(role, email) + `router.push(next || '/')`.

---

## 2. Register

### `POST /api/auth/register`

**Função:** proxy para Django `POST /api/auth/register/`. Forward literal de status e body.

**Headers de request:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Status codes:**

| Status | Quando | Body |
|--------|--------|------|
| 201 | Registro criado (conta nasce `pending`) | body do backend forwarded |
| 400 | Validação falhou (email inválido, senha < 8 chars) | body do backend forwarded |
| 503 | Backend unreachable | `{detail: 'Serviço indisponível. Tente novamente.'}` |

**Cliente esperado:** `/register` page. Após 201, esconder form + mostrar "Conta criada com sucesso!" (sem redirect).

---

## 3. Refresh

### `POST /api/auth/refresh`

**Função:** lê `refresh_token` cookie, proxy para Django `POST /api/auth/token/refresh/`, forward Set-Cookie com novo `access_token`.

**Cookies de entrada:**
```
Cookie: refresh_token=<jwt>
```

**Status codes:**

| Status | Quando | Body | Set-Cookie |
|--------|--------|------|------------|
| 200 | Refresh válido | `{}` (vazio) | novo `access_token` |
| 401 | Cookie `refresh_token` ausente | `{detail: 'Refresh token ausente.'}` | — |
| 401 | Refresh token inválido/expirado | body do backend forwarded | — |
| 503 | Backend unreachable | `{detail: 'Serviço indisponível. Tente novamente.'}` | — |

**Response 200 — headers:**
```
Set-Cookie: access_token=<novo-jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=300
```

**Cliente esperado:** chamado internamente pelo proxy catch-all durante auto-refresh (não é endpoint público para clientes externos).

---

## 4. Logout

### `POST /api/auth/logout`

**Função:** puramente local. **NÃO chama backend.** Limpa cookies via Set-Cookie Max-Age=0.

**Status codes:**

| Status | Quando | Body | Set-Cookie |
|--------|--------|------|------------|
| 200 | Sempre (idempotente) | `{success: true}` | 2× Set-Cookie Max-Age=0 |

**Response 200 — headers:**
```
Set-Cookie: access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0
Set-Cookie: refresh_token=; Path=/api/auth/token/refresh/; HttpOnly; SameSite=Lax; Max-Age=0
```

**Cliente esperado:** `<Navbar>` (botão "Sair"). Após 200, AuthContext.logout() + `router.push('/')`.

**🔴 R-PAGE-22 — Limitação conhecida:** este endpoint **NÃO invalida o token no backend**. O JWT continua válido até `exp`. Para invalidação real, integrar `POST /api/auth/token/blacklist/` (já habilitado em `config/settings.py:200-216`).

---

## 5. Health Check

### `GET /api/health`

**Função:** health check estático do Next.js. **NÃO checa Django.**

**Status codes:**

| Status | Quando | Body |
|--------|--------|------|
| 200 | Sempre | `{status: 'ok'}` |

**Cliente esperado:** liveness probe do Kubernetes, uptime monitors.

**🟡 R-PAGE-L1 — Limitação conhecida:** se Django estiver down, este endpoint retorna 200 (mentira benigna). Para checagem real, estender para `fetch(${BACKEND_URL}/api/health/)` com timeout 2s.

---

## 6. Proxy Catch-All (auto-refresh)

### `ALL /api/proxy/<path:...>`

**Função:** proxy genérico para o backend Django. Em caso de 401, tenta refresh do token antes de propagar o erro.

**Métodos suportados:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

**Path expansion:**
- `/api/proxy/podcasts/` → `http://localhost:8000/api/podcasts/`
- `/api/proxy/podcasts/42/` → `http://localhost:8000/api/podcasts/42/`
- `/api/proxy/episodes/?q=foo` → `http://localhost:8000/api/episodes/?q=foo`

**Headers de request (passados ao backend):**
```
Content-Type: application/json  (ou preservado se enviado)
Cookie: access_token=<jwt>      (injetado pelo proxy)
Accept: <preservado se enviado>
```

**Body de request:** preservado como ArrayBuffer (necessário para retry no auto-refresh).

**Status codes:**

| Status | Quando | Body |
|--------|--------|------|
| 200, 201, 204 | Sucesso (direto ou após auto-refresh) | body do backend forwarded |
| 400, 403, 404, 500 | Resposta do backend (não-401) | body do backend forwarded |
| 401 → 200 | Backend retornou 401, refresh bem-sucedido, retry retornou 2xx | body do retry forwarded + novo Set-Cookie |
| 302 | Refresh falhou | redirect para `/auth/unauthorized?next=<encoded>` + clear cookies |
| 503 | Backend unreachable (primeira tentativa ou retry) | `{detail: 'Serviço indisponível. Tente novamente.'}` |

**Fluxo de auto-refresh:**
1. Primeira tentativa: `forwardToBackend(backendUrl, accessToken, body)`
2. Se 200/201/204/4xx (≠401) → forward response
3. Se 401 → `attemptRefresh(request)`:
   - Lê `refresh_token` cookie
   - POST para `${BACKEND_URL}/api/auth/token/refresh/`
   - Em sucesso: extrai novo `access_token` do Set-Cookie via regex `/^access_token=([^;]+)/`
   - Em falha (sem cookie, 401 do backend, sem access_token no Set-Cookie): retorna `null`
4. Se refresh OK: `forwardToBackend(backendUrl, newToken, body)` (retry)
5. Se refresh falhou: `buildLogoutRedirect(pathSegments)` → 302 + clear cookies

**Cliente esperado:** qualquer componente client-side que faz fetch autenticado para o backend. O proxy é a **única ponte** — clientes não devem chamar Django diretamente (em produção, o Django está atrás de Nginx e não é acessível externamente).

---

## 7. Middleware (Edge Runtime)

### `middleware(request: NextRequest): NextResponse`

**Matcher:** `['/add-podcast', '/admin/:path*']`

**Lógica:**

| Condição | Ação |
|----------|------|
| Cookie `access_token` ausente | `NextResponse.redirect('/auth/unauthorized?next=<encoded>', {status: 302})` |
| Cookie `access_token` presente | `NextResponse.next()` |

**`next` encoding:** `encodeURIComponent(pathname + search)` da request original.

**Exemplo:**
- Request: `GET /add-podcast`
- Sem cookie → `Location: /auth/unauthorized?next=%2Fadd-podcast` (status 302)

**Edge Runtime:** roda no Vercel Edge ou similar. **Sem acesso a Node.js APIs** (sem `fs`, sem `process.env.*` no momento da request — apenas `NEXT_PUBLIC_*`). Por isso, validação é apenas por presença de cookie, não por decodificação de JWT (que requer `jose` ou lib similar).

**Limitação conhecida:** usuário com cookie inválido/expirado passa pelo middleware; só é barrado quando o proxy catch-all recebe 401 e tenta refresh. Se refresh falhar, vai para `/auth/unauthorized` via redirect do proxy (não do middleware).

---

## Contratos implícitos entre pages e AuthContext

### AuthContext

```ts
// frontend/src/contexts/AuthContext.tsx
type Role = 'admin' | 'editor' | 'reader';

interface User {
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: Role, email: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// useAuth() throws Error('useAuth must be used within an AuthProvider') se usado fora do Provider
```

**Contrato de uso (consumidores):**
- `<LoginForm>` chama `login(role, email)` após 200 em `/api/auth/login`
- `<Navbar>` chama `logout()` + `fetch('/api/auth/logout')` + `router.push('/')`
- `<AddPodcastPage>` lê `useAuth().user.role` para gate
- `<ForbiddenPage>` lê `useAuth().user.role` para exibir label PT-BR

**🔴 R-PAGE-21 — Limitação conhecida:** `login/logout` são **client-side puros** — não validam que o cookie chegou. Se o cookie HttpOnly não foi recebido (cenário de race), `user` no context fica populado mas o backend rejeita requests subsequentes.

---

### ROLE_LABELS (mapeamento role → label PT-BR)

```ts
// frontend/src/app/auth/forbidden/page.tsx
const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  reader: 'Leitor',
};
```

**Consumidor:** `<ForbiddenPage>` exibe "Seu papel atual: {ROLE_LABELS[user.role]}" quando `user !== null`.

**Adicionar nova role:** alterar `Role` em `AuthContext.tsx` E adicionar entrada em `ROLE_LABELS` (TypeScript força cobertura).

---

### ThemeProvider (referência — escopo de `frontend-features`)

```ts
// frontend/src/components/providers/ThemeProvider.tsx
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}
```

**Contrato de uso:** `<html className={theme}>` é aplicado via `useEffect` em `RootLayout`. Classes Tailwind `dark:*` ficam ativas quando `theme === 'dark'`.

**LocalStorage:** chave `podigger-theme` persiste escolha do usuário.

---

## Versionamento e breaking changes

Como o módulo é parte do monorepo Next.js, versionamento segue `package.json`. Mudanças nos contratos HTTP são breaking changes para qualquer cliente que dependa deles.

| Mudança | Breaking? |
|---------|-----------|
| Adicionar novo Route Handler | ❌ não-breaking |
| Adicionar novo método HTTP em path existente | ❌ não-breaking |
| Renomear path | ❌ breaking |
| Mudar schema de response body | ❌ breaking (TypeScript não pega em runtime) |
| Adicionar campo opcional em response | ❌ não-breaking |
| Mudar status code de sucesso (200 → 201) | ❌ breaking |
| Adicionar header de response | ❌ não-breaking |
| Mudar `Set-Cookie` attributes (ex.: `Path`, `Max-Age`) | ❌ breaking (browser trata diferentemente) |
| Remover endpoint | ❌ breaking |

**Recomendação:** ao introduzir breaking change, documentar em `CHANGELOG.md` ou PR description, e idealmente versionar a API (`/api/v2/...`).

---

## Lacunas e ressalvas

- 🔴 **R-PAGE-21** — `AuthContext.login/logout` sem validação de cookie. Race entre estado client e cookies. Mitigação pendente.
- 🔴 **R-PAGE-22** — Logout não invalida token no backend. Mitigação: integrar `POST /api/auth/token/blacklist/`.
- 🟡 **R-PAGE-L1** — Health check mente sobre backend down. Mitigação: estender para `fetch(${BACKEND_URL}/api/health/)`.
- 🟡 **R-PAGE-L2** — Fallback de `getSetCookie()` pode perder múltiplos cookies em ambientes sem a API. Mitigação: parse raw por `\r?\n`.
- 🟡 **R-PAGE-L5** — Sem timeout em `fetch` para backend. Mitigação: `AbortController` 30s.
- 🟡 **R-PAGE-L8** — Fallback de Suspense em `LoginForm` é genérico (`<div>Loading...</div>`). Mitigação: usar `<Skeleton>` ou `<FullPageLoading>`.
- 🟡 **R-PAGE-L11** — Sem `ErrorBoundary` em volta dos Providers no `RootLayout`. Mitigação: adicionar.

---

> **Princípio de design:** estes contratos são a **única superfície HTTP pública** do frontend Next.js. O proxy catch-all é o ponto único de entrada para chamadas autenticadas ao backend, garantindo que cookies HttpOnly, auto-refresh e forward de Set-Cookie sejam centralizados. Mudanças aqui têm impacto em todo o ecossistema (browser, mobile futuro, integrações).
