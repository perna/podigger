# frontend-pages, Design Técnico

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: rotas Next.js App Router (`frontend/src/app/` + `frontend/src/middleware.ts`)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Interface

### Variáveis de ambiente

| Variável | Default | Origem | Uso |
|----------|---------|--------|-----|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `process.env` | URL base do backend Django para proxies |

### Tipos auxiliares

```ts
type RouteContext = { params: Promise<{ path: string[] }> };
```

### Páginas — Props dos componentes Client

#### `<Home />` (RSC wrapper)
```ts
// app/page.tsx — sem props
export default function Home(): JSX.Element;
```

#### `<LoginForm />` e `<LoginPage>` (Client Components)
```ts
// app/login/page.tsx
// Estado interno: email, password, isLoading, error, pendingMessage
// Não há props externas; lê ?next= via useSearchParams (Suspense boundary obrigatório)
```

#### `<RegisterPage />` (Client Component)
```ts
// app/register/page.tsx
// Estado interno: email, password, passwordConfirm, isLoading, error, successMessage
```

#### `<AddPodcastPage />` (Client Component)
```ts
// app/add-podcast/page.tsx
// Estado interno: name, feed, isLoading, message, messageType
// Hooks: useAuth() para role check
```

#### `<UnauthorizedPage />` (Client)
```ts
// app/auth/unauthorized/page.tsx
// Lê useSearchParams() → ?next= | undefined
```

#### `<ForbiddenPage />` (Client)
```ts
// app/auth/forbidden/page.tsx
// Lê useAuth() → user (para ROLE_LABELS)
```

### Route Handlers

#### `POST /api/auth/login`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/auth/login` |
| Method | `POST` |
| Content-Type request | `application/json` |
| Content-Type response | `application/json` |
| Backend target | `${BACKEND_URL}/api/auth/token/` |
| Status codes response | 200, 400, 401, 403, 503 |

**Request body:**
```ts
{ email: unknown; password: unknown }
```

**Response 200 body:**
```ts
{ role: 'admin' | 'editor' | 'reader'; email: string }
```

**Response 200 headers:** `Set-Cookie: access_token=...; HttpOnly; ...`, `Set-Cookie: refresh_token=...; HttpOnly; ...`

**Response 400 body:** `{ detail: 'Corpo da requisição inválido.' }` (JSON parse error)

**Response 401/403 body:** body do backend forwarded literal

**Response 503 body:** `{ detail: 'Serviço indisponível. Tente novamente.' }` (network error)

#### `POST /api/auth/register`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/auth/register` |
| Backend target | `${BACKEND_URL}/api/auth/register/` |
| Status codes | 201, 400, 503 |

Forward literal do response (body + status). Sem manipulação.

#### `POST /api/auth/refresh`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/auth/refresh` |
| Backend target | `${BACKEND_URL}/api/auth/token/refresh/` |
| Cookies de entrada | `refresh_token` |
| Status codes | 200, 401, 503 |

**Response 200:** body vazio `{}` + `Set-Cookie: access_token=...; HttpOnly; ...`

**Response 401 (cookie ausente):** `{ detail: 'Refresh token ausente.' }`

**Response 401 (cookie inválido):** body do backend forwarded

#### `POST /api/auth/logout`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/auth/logout` |
| Backend target | **NENHUM** (puramente local) |
| Status codes | 200 |

**Response 200 body:** `{ success: true }`

**Response 200 headers:**
- `Set-Cookie: access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
- `Set-Cookie: refresh_token=; Path=/api/auth/token/refresh/; HttpOnly; SameSite=Lax; Max-Age=0`

#### `GET /api/health`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/health` |
| Status codes | 200 |

**Response 200 body:** `{ status: 'ok' }` (estático, não checa backend)

#### `ALL /api/proxy/[...path]`

| Aspecto | Valor |
|---------|-------|
| Path | `/api/proxy/<segmento1>/<segmento2>/...` |
| Methods | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| Backend target | `${BACKEND_URL}/api/<segmentos>/?<queryString>` |
| Cookies de entrada | `access_token` (obrigatório) + opcionalmente `refresh_token` |
| Status codes | 200, 201, 204, 400, 401, 403, 404, 500, 503, 302 (refresh falhou) |

**Comportamento especial:**
- Body de requests com método ≠ GET/HEAD é pré-lido como `ArrayBuffer` (permite retry no auto-refresh)
- Recebe 401 do backend → tenta `POST /api/auth/token/refresh/`
  - Sucesso → reenvia request com novo `access_token` + `Set-Cookie` do refresh anexado
  - Falha → 302 redirect para `/auth/unauthorized?next=<encoded>` + clear cookies

### Middleware

#### `middleware(request: NextRequest): NextResponse`

| Aspecto | Valor |
|---------|-------|
| Matcher | `['/add-podcast', '/admin/:path*']` |
| Edge runtime | Sim (sem Node.js APIs) |

**Lógica:**
- Lê `request.cookies.get('access_token')`
- Se ausente: `NextResponse.redirect('/auth/unauthorized?next=<encoded>')` (status 302)
- Se presente: `NextResponse.next()`

**Tipo:**
```ts
import { NextRequest, NextResponse } from 'next/server';
export const config = {
  matcher: ['/add-podcast', '/admin/:path*'],
};
export default function middleware(request: NextRequest): NextResponse;
```

### `RootLayout`

```ts
// app/layout.tsx — RSC
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = { ... };
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element;
```

**Wrapping tree:**
```tsx
<html lang="en">
  <body className={jakarta.variable}>
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

---

## Fluxo Principal

### Login bem-sucedido

1. Browser submete form `/login` com `{email, password}`
2. `<LoginForm>` (Client) → `setIsLoading(true)` e `fetch('/api/auth/login', {method: 'POST', body: JSON.stringify({email, password})})`
3. Route Handler `/api/auth/login/route.ts:5` (`POST`)
4. `body = await request.json()` (try/catch → 400 se inválido)
5. `backendResponse = await fetch(${BACKEND_URL}/api/auth/token/, ...)` (try/catch → 503 se network error)
6. Backend valida credenciais, verifica `approval_status='approved'`, emite JWT tokens
7. Backend retorna 200 `{access, refresh, role, email}` + `Set-Cookie: access_token=...; HttpOnly; ...` + `Set-Cookie: refresh_token=...; HttpOnly; ...`
8. Proxy lê `backendResponse.headers.getSetCookie()` (fallback: raw `set-cookie` header)
9. Proxy constrói `NextResponse.json({role, email}, {status: 200})` + append de cada Set-Cookie
10. Browser recebe 200 + cookies HttpOnly
11. `<LoginForm>` faz `login(role, email)` → AuthContext
12. `router.push(next || '/')` redireciona

### Auto-refresh no proxy

1. Client (autenticado) chama `fetch('/api/proxy/podcasts/', ...)`
2. Middleware permite (cookie presente)
3. `handleProxy(request, context)` em `app/api/proxy/[...path]/route.ts:157`
4. `pathSegments = await context.params` (Next.js 15+ async params)
5. `backendUrl = buildBackendUrl(pathSegments, searchParams)` (constrói `${BACKEND}/api/podcasts/?...`)
6. `accessToken = request.cookies.get('access_token')?.value`
7. `requestBody = await request.arrayBuffer()` (pre-read para retry)
8. `backendResponse = await forwardToBackend(request, backendUrl, accessToken, requestBody)` (envia com `Cookie: access_token=...`)
9. **Backend retorna 401** (token expirou)
10. `attemptRefresh(request)`:
    - `refreshToken = request.cookies.get('refresh_token')`
    - Se ausente → retorna `null`
    - `refreshResponse = await fetch(${BACKEND}/api/auth/token/refresh/, {Cookie: refresh_token=...})`
    - Se `!refreshResponse.ok` → retorna `null`
    - Extrai `setCookieHeaders` via `getSetCookie()` (fallback: raw header)
    - Regex match `/^access_token=([^;]+)/` → extrai novo token
    - Retorna `{newToken, setCookieHeaders}` ou `null`
11. **Se `attemptRefresh` retornou `null`:**
    - `buildLogoutRedirect(pathSegments)`:
      - `nextPath = '/api/<segmentos>/'`
      - `redirectUrl = '/auth/unauthorized?next=<encodeURIComponent(nextPath)>'`
      - `response = NextResponse.redirect(new URL(redirectUrl, 'http://localhost'), {status: 302})`
      - Append 2× `Set-Cookie` com `Max-Age=0` para `access_token` e `refresh_token`
      - Retorna 302
12. **Se `attemptRefresh` retornou `{newToken, setCookieHeaders}`:**
    - `retryResponse = await forwardToBackend(request, backendUrl, newToken, requestBody)` (reenvia com `Cookie: access_token=<newToken>`)
    - `buildProxyResponse(retryResponse, setCookieHeaders)`:
      - Lê `responseBody = await backendResponse.arrayBuffer()`
      - `nextResponse = new NextResponse(responseBody, {status: retryResponse.status, headers: {Content-Type}})`
      - Append cada `setCookieHeader` (do refresh) ao `nextResponse.headers`
    - Retorna response final com novo cookie

### Logout

1. Usuário clica "Sair" no `<Navbar>` (Client)
2. `handleLogout` chama `fetch('/api/auth/logout', {method: 'POST'})`
3. `POST /api/auth/logout` (`app/api/auth/logout/route.ts:3`):
   - **NÃO chama backend**
   - `response = NextResponse.json({success: true}, {status: 200})`
   - `response.cookies.set('access_token', '', {maxAge: 0, ...})`
   - `response.cookies.set('refresh_token', '', {maxAge: 0, path: '/api/auth/token/refresh/', ...})`
   - Retorna 200
4. Browser recebe 200 + Set-Cookie Max-Age=0 (cookies apagados)
5. `<Navbar>` chama `logout()` → AuthContext limpa `user`
6. `router.push('/')` redireciona

### Cadastro de podcast (happy path)

1. Editor/admin autenticado acessa `GET /add-podcast`
2. Middleware: cookie presente → passa adiante
3. `<AddPodcastPage>` (Client) renderiza
4. `useAuth()` retorna `{user: {email, role: 'editor'}, ...}`
5. `role ∈ {editor, admin}` → renderiza form
6. Usuário preenche `name` e `feed`, submete
7. `handleSubmit`:
   - `setIsLoading(true)`
   - `fetch('/api/proxy/podcasts/', {method: 'POST', body: JSON.stringify({name, feed})})`
8. Proxy → Backend → 201 `{status: 'created', ...}` (ou 200 `existing`)
9. `setMessage('Podcast cadastrado com sucesso!')` + `setMessageType('success')`
10. `setTimeout(() => router.push('/'), 2000)` — redireciona após 2s

### Cadastro de podcast (acesso negado)

1. Usuário `role=reader` autenticado acessa `GET /add-podcast`
2. Middleware: cookie presente → passa (defesa em camadas falha aqui, é papel do gate da página)
3. `<AddPodcastPage>` renderiza
4. `useAuth()` → `{user: {role: 'reader'}, ...}`
5. `!user OR role ∉ {editor, admin}` → render condicional `<AcessoNegado />` (sem form)

### Middleware bloqueando

1. Usuário anônimo (sem cookie) acessa `GET /add-podcast`
2. `middleware(request)` em `src/middleware.ts`
3. `accessToken = request.cookies.get('access_token')`
4. `!accessToken` → `NextResponse.redirect(new URL('/auth/unauthorized?next=<encoded>', request.url), {status: 302})`
5. Browser segue 302 para `/auth/unauthorized?next=%2Fadd-podcast`
6. `<UnauthorizedPage>` lê `useSearchParams().get('next')` = `/add-podcast`
7. Renderiza botão "Fazer login" apontando para `/login?next=%2Fadd-podcast`

### RSC composition em `/about`

1. Browser acessa `GET /about`
2. Next.js renderiza `<AboutPage />` (RSC) no servidor
3. `<AboutPage>` retorna JSX com 7 sub-componentes
4. **No servidor:** renderiza HTML de todos os 7 (incluindo `ActionList` que é client, mas o **wrapper** é RSC)
5. Para `ActionList` (Client Component), Next.js envia o HTML estático + bundle JS mínimo (`navigator.share`, `clipboard`)
6. Outros 6 sub-componentes são RSC puros: **zero JS** enviado para o browser
7. Browser recebe HTML completo + bundle mínimo; hidratação apenas dos interativos

---

## Fluxos Alternativos

### Login com backend indisponível
- `fetch()` lança (network error, DNS, timeout) → try/catch → 503 `{detail: 'Serviço indisponível. Tente novamente.'}`
- `<LoginForm>` mostra mensagem genérica de erro

### Login com conta pending
- Backend valida credenciais OK, mas `approval_status='pending'` → 403 (R-USER-04 em accounts)
- Proxy forwards 403 + body
- `<LoginForm>` detecta 403 → `setPendingMessage('Aguarde aprovação do administrador')`, sem redirect

### Login com credenciais inválidas
- Backend retorna 401 (email ou senha errados)
- Proxy forwards 401 + body
- `<LoginForm>` mostra "Email ou senha inválidos" (sem hint de campo — evita enumeração)

### Register com senhas diferentes
- `<RegisterPage>` valida `password === passwordConfirm` **antes** de chamar API
- Se diferentes → `setError('As senhas não conferem')`, sem fetch
- Backend não tem essa validação — confia no client

### Register sucesso
- Backend cria user com `approval_status='pending'`
- Retorna 201
- `<RegisterPage>` esconde form e mostra "Conta criada com sucesso! Aguarde aprovação do administrador"
- **Não redireciona** — usuário fica aguardando

### Auto-refresh: refresh token também expirou
- `attemptRefresh` chama refresh → backend 401
- Retorna `null` → `buildLogoutRedirect` → 302 + clear cookies
- Browser vai para `/auth/unauthorized?next=<encoded>`
- Próximo login será necessário

### Auto-refresh: backend unreachable durante retry
- `forwardToBackend` no retry lança → try/catch → 503
- **Não tenta novo refresh** — apenas retorna 503

### Auto-refresh: Set-Cookie header não tem access_token
- `getSetCookie()` retorna array, mas nenhum match `/^access_token=/` → `attemptRefresh` retorna `null`
- Cai em `buildLogoutRedirect`

### Health check
- `/api/health` é puramente estático; **não checa Django**
- Se Django estiver down, health check retorna 200 (mentira benigna)
- Liveness probe (Next.js up): OK
- Readiness probe (full stack up): mentirá

### Logout: cookie access_token não existia
- `/api/auth/logout` é idempotente — sempre retorna 200 + Set-Cookie Max-Age=0
- Se cookie não existia, Set-Cookie Max-Age=0 apenas "confirma" a ausência

### AddPodcast: erro de validação no backend
- `data.status === 'invalid' || response.status === 400`
- `<AddPodcastPage>` mostra mensagem de erro do backend

### AddPodcast: podcast já existe
- Backend retorna 200 `{status: 'existing', message: '...'}`
- `<AddPodcastPage>` mostra "Este podcast já está cadastrado" + setTimeout 2s → `/`

### AddPodcast: race condition em clique duplo
- Sem `disabled` no Button enquanto `isLoading`
- Usuário pode submeter 2x se demorar
- Backend tem `transaction.atomic + get_or_create` (R-CAST-03 em podcasts), então o 2º request recebe `existing`

---

## Dependências

### Internas (intra-app)

| Componente / handler | Depende de | Razão |
|----------------------|------------|-------|
| `RootLayout` | `ThemeProvider` | Dark mode |
| `RootLayout` | `AuthProvider` | Estado de autenticação global |
| `RootLayout` | `Navbar` | Barra de navegação sempre visível |
| `LoginForm` | `useAuth` (AuthContext) | `login(role, email)` |
| `LoginForm` | `useRouter`, `useSearchParams` | Redirect pós-login + leitura de `?next=` |
| `RegisterPage` | `useRouter` | (não usa para redirect, mas lê estado) |
| `AddPodcastPage` | `useAuth` (AuthContext) | Gate de role |
| `AddPodcastPage` | `useRouter` | `router.push('/')` após sucesso |
| `ForbiddenPage` | `useAuth` | `user.role` para `ROLE_LABELS` |
| `UnauthorizedPage` | `useSearchParams` | `?next=` |
| `Navbar` | `useAuth` | `user`, `logout()` |
| `proxy/[...path]/route.ts` | (Django backend) | Fetch para `${BACKEND_URL}/api/...` |
| `auth/login/route.ts` | (Django `/api/auth/token/`) | Token obtain |
| `auth/refresh/route.ts` | (Django `/api/auth/token/refresh/`) | Token refresh |
| `auth/register/route.ts` | (Django `/api/auth/register/`) | User registration |
| `auth/logout/route.ts` | (nenhum backend) | Limpa cookies localmente |
| `middleware.ts` | (nenhum) | Lê cookie via `request.cookies.get` |

### Externas

| Lib | Versão | Uso |
|-----|--------|-----|
| `next` | 16.2.3 | App Router, Route Handlers, Middleware, RSC, `next/font/google` |
| `react` | 19.2.1 | `useState`, `useEffect`, `useContext`, `Suspense` (Client Components) |
| `next/font/google` | — | Carrega `Plus_Jakarta_Sans` |

### Backend (via HTTP)

| Endpoint | Usado por |
|----------|-----------|
| `POST /api/auth/token/` | `/api/auth/login` proxy |
| `POST /api/auth/register/` | `/api/auth/register` proxy |
| `POST /api/auth/token/refresh/` | `/api/auth/refresh` proxy + `attemptRefresh` no catch-all |
| `GET\|POST\|PUT\|PATCH\|DELETE /api/<path>/` | `/api/proxy/[...path]` catch-all |

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| **Proxy pattern** entre Next.js e Django (frontend em :3000, backend em :8000) | `app/api/proxy/[...path]/route.ts:3` (`BACKEND_URL`) | 🟢 |
| **Auto-refresh transparente** no proxy (ciclo de 2 tentativas: forward → 401 → refresh → retry) | `app/api/proxy/[...path]/route.ts:185-205` | 🟢 |
| **Body pre-read em ArrayBuffer** para permitir retry sem consumir stream 2x | `app/api/proxy/[...path]/route.ts:165-167` | 🟢 |
| **Forward literal de Set-Cookie** via `getSetCookie()` com fallback para raw header | `app/api/auth/login/route.ts:46-61` | 🟢 |
| **Logout puramente client-side** (sem chamada ao backend) | `app/api/auth/logout/route.ts:3-18` | 🟢 |
| **Defesa em camadas** para `/add-podcast`: middleware (cookie) + page (role) | `middleware.ts:13-24` + `add-podcast/page.tsx:21-47` | 🟢 |
| **Middleware no Edge Runtime** (sem Node.js APIs, sem React Context) | `middleware.ts:1-31` | 🟢 |
| **RSC composition** em `/about` (6 de 7 sub-componentes RSC) | `app/about/page.tsx:1-38` | 🟢 |
| **`'use client'` somente onde há interatividade** (form, navigator.share, useAuth) | `app/about/components/ActionList.tsx:1`, demais RSC | 🟢 |
| **Suspense em volta de `useSearchParams`** (obrigatório em Next.js 15+) | `app/login/page.tsx:232-234` | 🟢 |
| **Mensagens de erro genéricas** em login (sem hint de campo) — evita enumeração | `app/login/page.tsx:51-55` | 🟢 |
| **Validação de senha client-side** em register (UX, sem double roundtrip) | `app/register/page.tsx:25-29` | 🟢 |
| **Set-Cookie Max-Age=0** para logout (idempotente, funciona sem cookie existente) | `app/api/auth/logout/route.ts:14-17` | 🟢 |
| **Health check estático** (não checa backend) — simplifica liveness probe | `app/api/health/route.ts:11` | 🟢 |
| **ROLE_LABELS** em PT-BR para `/auth/forbidden` | `app/auth/forbidden/page.tsx:10-14` | 🟢 |
| **Comentários de rastreabilidade** `// Feature: ...` + `// Requirements: X.Y` em cada arquivo | Inspecionar qualquer page ou handler | 🟢 |
| **Mobile-first frame** com status bar fake (9:41) — design "iOS-like" compartilhado entre auth pages | Inspecionar login/register/add-podcast | 🟡 |
| **Inconsistência EN/PT-BR** em `/add-podcast` (labels EN, mensagens PT-BR) | `app/add-podcast/page.tsx` | 🟡 |
| **Cores hex hardcoded** em pages em vez de tokens | Inspecionar auth pages | 🟡 |
| **`<html lang='en'>`** mesmo com UI PT-BR | `app/layout.tsx:26` | 🟡 |
| **AuthContext.login/logout client-side puros** (sem validação de cookie) | `contexts/AuthContext.tsx` | 🔴 |
| **Logout sem blacklist JWT** (cookie limpo, token continua válido até `exp`) | `app/api/auth/logout/route.ts` | 🔴 |
| **Race condition em search** (sem AbortController) | `frontend-features/EpisodeList` (referência) | 🟡 |
| **Health check estático** mente sobre backend down | `app/api/health/route.ts:11` | 🟡 |
| **`/add-podcast` sem `disabled` no Button** durante loading (clique duplo) | `app/add-podcast/page.tsx` | 🔴 |

---

## Estado Interno

### Onde estado vive

| Local | Tipo | Persiste após reload? |
|-------|------|----------------------|
| **Cookies** (`access_token`, `refresh_token`) | HttpOnly, SameSite=Lax, Secure em prod | ✅ até `exp` ou logout |
| **`AuthContext`** (em memória) | `useState<User \| null>` + `useState<isLoading: false>` | ❌ perdido no reload (mas cookies mantêm sessão) |
| **`ThemeProvider`** (em memória) | `useState<'light' \| 'dark'>` | ✅ persistido em `localStorage('podigger-theme')` |
| **Forms de auth** (login, register, add-podcast) | `useState` local | ❌ perdido no unload |

### Inconsistência potencial

- **Cookies** (HttpOnly) — **fonte da verdade** no backend
- **`AuthContext.user`** — derivado **client-side**; pode estar desatualizado se o cookie expirou mas o estado ainda diz `authenticated`
- **Cenário:** usuário tem `user={role: 'editor'}` em `AuthContext`, mas cookie `access_token` expirou. Próximo fetch via proxy recebe 401 → refresh → se refresh falhar → logout forçado. **Mas o `AuthContext` ainda tem `user`** até o momento em que o React re-renderiza após o redirect.

🔴 **R-PAGE-21** — Race condition entre estado client (`AuthContext`) e estado real (cookies). Mitigação recomendada: ao detectar 401 sem sucesso de refresh, dispatchar evento global que `AuthContext` escuta e limpa `user`.

---

## Observabilidade

### Logs explícitos

- ❌ **Nenhum** `console.log/error/warn` no módulo de pages/handlers.
- Erros de `fetch()` são silenciados via try/catch → 503 com mensagem genérica.

### Telemetria

- ❌ Sem integração com Sentry, OpenTelemetry, Datadog, etc.
- O `ThemeProvider` (em `frontend-features`) pode ter `console.debug` em dev mode (não verificado aqui).

### Sinais externos observáveis

- **Status HTTP** das responses (200, 401, 403, 503) — visíveis em DevTools Network.
- **Cookies** no Application tab — permitem inspecionar expiração.
- **HTML server-rendered** das pages RSC — visível em View Source.
- **Bundle JS** por rota — analisável com `next build` output.

🟡 **Lacuna:** Não há Sentry/error tracking. Erros 503 (backend down) são invisíveis para o time sem que alguém reclame.

---

## Riscos e Lacunas

- 🔴 **R-PAGE-22** — Logout não invalida token no backend. JWT continua válido até `exp` (5min access, 24h refresh). Quem capturar o cookie antes do logout pode usá-lo.
  - **Mitigação:** integrar chamada `POST /api/auth/token/blacklist/` (já habilitado em `config/settings.py:200-216`).
- 🔴 **R-PAGE-21** — `AuthContext.login/logout` client-side sem validação. Race entre cookies e estado React.
  - **Mitigação:** escutar evento de 401 sem refresh bem-sucedido e limpar `user`.
- 🔴 **R-PAGE-23** — `/add-podcast` sem `disabled` no Button durante loading. Clique duplo possível.
  - **Mitigação:** adicionar `isLoading={isLoading}` no Button (já é Must no design system).
- 🟡 **R-PAGE-18** — Inconsistência EN/PT-BR em `/add-podcast`.
  - **Mitigação:** unificar para PT-BR (decisão consciente de app brasileiro).
- 🟡 **R-PAGE-19** — Cores hex hardcoded em pages.
  - **Mitigação:** substituir por tokens semânticos (`bg-primary`, `bg-surface-dark`).
- 🟡 **R-PAGE-20** — `<html lang='en'>` mas UI PT-BR.
  - **Mitigação trivial:** mudar para `lang='pt-BR'`.
- 🟡 **R-PAGE-L1** — Health check mente sobre backend down.
  - **Mitigação:** adicionar fetch ao `/api/health/` do backend Django; 503 se falhar.
- 🟡 **R-PAGE-L2** — `getSetCookie()` tem fallback, mas fallback só lê um único header (raw `set-cookie`); múltiplos cookies podem ser perdidos em ambientes sem `getSetCookie`.
  - **Mitigação:** parsear raw header por regex `/\r?\n/` (separa múltiplos Set-Cookie) quando `getSetCookie` ausente.
- 🟡 **R-PAGE-L3** — `next.arrayBuffer()` lê o body inteiro em memória; uploads grandes (>10MB) podem estourar limite do Edge/Node.
  - **Mitigação:** streaming via `ReadableStream` (complexidade alta).
- 🟡 **R-PAGE-L4** — `/api/proxy/[...path]` é catch-all: qualquer path é aceito. Sem whitelist de endpoints Django válidos.
  - **Mitigação:** validar `pathSegments` contra lista conhecida de paths.
- 🟡 **R-PAGE-L5** — Sem timeout em `fetch` para backend. Backend lento pode travar worker.
  - **Mitigação:** `AbortController` com timeout de 30s.
- 🟡 **R-PAGE-L6** — Race condition em `useAuth()`: se 2 componentes chamam `login()` simultaneamente, último vence. Sem mutex.
- 🟡 **R-PAGE-L7** — Sem rate limit client-side. Submit massivo possível.
  - **Mitigação:** throttling local no `<Button>` (debounce de 1s).
- 🟡 **R-PAGE-L8** — `Suspense` em `LoginForm` adicionado por causa de warning de build-time, mas não há fallback visual adequado (`<div>Loading...</div>` genérico).
  - **Mitigação:** fallback com `<Skeleton>` ou `<FullPageLoading>`.
- 🟡 **R-PAGE-L9** — `ActionList` (Client Component em `/about`) usa `navigator.share` e `clipboard` sem fallback para browsers antigos.
  - **Mitigação:** feature detect + fallback com `<a href="mailto:...">` para share.
- 🟡 **R-PAGE-L10** — Comentários de rastreabilidade `// Feature: ...` em arquivos — vinculação a `.specs/` é manual, pode quebrar se arquivos forem renomeados.
- 🟡 **R-PAGE-L11** — `RootLayout` envolve com `ThemeProvider > AuthProvider > Navbar`. Se um Provider falhar (exception), toda a app quebra (sem Error Boundary).
  - **Mitigação:** adicionar `ErrorBoundary` em volta dos Providers.

---

> **Princípio arquitetural:** o frontend Next.js é uma camada fina sobre o Django. Toda regra de negócio vive no backend; o frontend apenas renderiza, valida formato (não regra) e gerencia estado de UI. **Auth é a única exceção**, onde o frontend tem papel ativo (proxy, refresh, logout local) por causa dos cookies HttpOnly.
