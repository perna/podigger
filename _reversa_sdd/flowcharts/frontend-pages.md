# Fluxograma — Módulo `frontend-pages`

> Gerado pelo Arqueólogo em 2026-06-04
> Módulo: `frontend-pages` (rotas Next.js App Router: home, login, register, add-podcast, about, auth/* + API proxy + middleware)

## Inventário de rotas

| Rota | Tipo | Componente | Função |
|------|------|------------|--------|
| `/` | Server Component | `app/page.tsx` | Renderiza `<HomeClient />` |
| `/login` | Client Component | `app/login/page.tsx` | Formulário de login (POST → `/api/auth/login`) |
| `/register` | Client Component | `app/register/page.tsx` | Formulário de registro (POST → `/api/auth/register`) |
| `/add-podcast` | Client Component | `app/add-podcast/page.tsx` | Formulário de cadastro de podcast (protegido por middleware) |
| `/about` | Server Component | `app/about/page.tsx` | Página estática (compõe 7 sub-componentes) |
| `/auth/unauthorized` | Client Component | `app/auth/unauthorized/page.tsx` | Redireciona para `/login?next=...` |
| `/auth/forbidden` | Client Component | `app/auth/forbidden/page.tsx` | Mostra papel atual e link para home |
| `/auth/pending` | Server Component | `app/auth/pending/page.tsx` | Mostra mensagem estática de "aguarde aprovação" |
| `/api/auth/login` | Route Handler | `app/api/auth/login/route.ts` | Proxy de login para Django |
| `/api/auth/register` | Route Handler | `app/api/auth/register/route.ts` | Proxy de registro para Django |
| `/api/auth/refresh` | Route Handler | `app/api/auth/refresh/route.ts` | Proxy de refresh para Django |
| `/api/auth/logout` | Route Handler | `app/api/auth/logout/route.ts` | Limpa cookies localmente |
| `/api/health` | Route Handler | `app/api/health/route.ts` | Health check do Next.js |
| `/api/proxy/[...path]` | Route Handler | `app/api/proxy/[...path]/route.ts` | Proxy genérico com auto-refresh |

## Fluxo: Middleware de proteção de rotas

```mermaid
flowchart TD
    A[Request: /add-podcast ou /admin/*] --> B[middleware.ts]
    B --> C{access_token cookie presente?}
    C -- não --> D[Redirect 302 → /auth/unauthorized?next=encodeURIComponent(pathname+search)]
    C -- sim --> E[NextResponse.next → handler]
```

🟢 Matcher: `'/add-podcast'`, `'/admin/:path*'`.

## Fluxo: Login (`POST /api/auth/login` → Django `/api/auth/token/`)

```mermaid
sequenceDiagram
    participant B as Browser
    participant L as /app/login (Client)
    participant H as /api/auth/login (Route Handler)
    participant D as Django TokenObtainCookieView
    participant DB as PostgreSQL

    B->>L: Preenche email/senha, submit
    L->>H: POST {email, password} (JSON)
    H->>H: parse body (try/catch → 400)
    H->>D: POST /api/auth/token/ {email, password}
    alt backend unreachable
        D--xH: network error
        H-->>L: 503 {detail: "Serviço indisponível..."}
    else 401 ou 403
        D-->>H: 401/403 + body
        H-->>L: 401/403 (forward body)
    else 200
        D->>DB: SELECT user WHERE email
        DB-->>D: user
        D-->>H: 200 {access, refresh, role, email} + Set-Cookie (access_token, refresh_token)
        H->>H: extract setCookieHeaders via getSetCookie() (fallback: raw header)
        H-->>L: 200 {role, email} + Set-Cookie forward
        L->>L: login(role, email) → AuthContext
        L->>B: router.push(next || "/")
    end
```

## Fluxo: Proxy com auto-refresh (`/api/proxy/[...path]`)

```mermaid
flowchart TD
    A[Request: GET/POST/PUT/PATCH/DELETE /api/proxy/X/Y] --> B[handleProxy]
    B --> C[buildBackendUrl: BACKEND/api/X/Y/?queryString]
    B --> D[pre-read body as ArrayBuffer]
    D --> E[forwardToBackend com access_token cookie]
    E --> F{backend.status}
    F -- not 401 --> G[buildProxyResponse → forward as-is]
    F -- 401 --> H[attemptRefresh]
    H --> I{refresh_token cookie?}
    I -- não --> J[buildLogoutRedirect → /auth/unauthorized + clear cookies]
    I -- sim --> K[POST /api/auth/token/refresh/]
    K --> L{200?}
    L -- não --> J
    L -- sim --> M[extract new access_token do Set-Cookie]
    M --> N[forwardToBackend com newToken + ArrayBuffer]
    N --> O[buildProxyResponse + append new Set-Cookie]
```

🟢 **Por que ArrayBuffer**: streams HTTP só podem ser consumidos uma vez; como o body é reenviado no retry, é necessário pré-ler como buffer.

## Fluxo: Refresh de token (`POST /api/auth/refresh`)

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as /api/auth/refresh (Route Handler)
    participant D as Django TokenRefreshCookieView
    participant DB as PostgreSQL

    B->>H: POST (cookie: refresh_token)
    H->>H: read refresh_token from cookies
    alt cookie ausente
        H-->>B: 401 {detail: "Refresh token ausente."}
    else
        H->>D: POST /api/auth/token/refresh/ (Cookie: refresh_token=...)
        alt 401
            D-->>H: 401
            H-->>B: 401 (forward body)
        else 200
            D-->>H: 200 + Set-Cookie (new access_token)
            H->>H: forward Set-Cookie
            H-->>B: 200 {} + new access_token Set-Cookie
        end
    end
```

## Fluxo: Logout (`POST /api/auth/logout`)

```mermaid
flowchart LR
    A[POST /api/auth/logout] --> B[200 {success: true}]
    B --> C[Set-Cookie: access_token=; Max-Age=0]
    B --> D[Set-Cookie: refresh_token=; Max-Age=0; path=/api/auth/token/refresh/]
```

🟢 Logout é puramente client-side: limpa os cookies. **Não chama o backend** (Django não tem endpoint de blacklist no fluxo client-side; o JWT entra em blacklist automaticamente só após expirar o TTL).

## Fluxo: Cadastro de podcast (`/add-podcast`)

```mermaid
sequenceDiagram
    participant B as Browser
    participant M as middleware.ts
    participant P as /add-podcast (Client)
    participant H as /api/proxy/podcasts/
    participant D as Django PodcastViewSet

    B->>M: GET /add-podcast
    alt access_token ausente
        M-->>B: 302 → /auth/unauthorized?next=/add-podcast
    else access_token presente
        M->>P: pass through
        P->>P: useAuth() → user
        alt user null OR role ∉ {editor, admin}
            P-->>B: render Acesso Negado
        else editor/admin
            B->>P: submit {name, feed}
            P->>H: POST /api/proxy/podcasts/
            H->>D: POST /api/podcasts/ (Cookie: access_token=...)
            alt 401
                D-->>H: 401
                H-->>P: 401 (após tentativa de refresh)
            else 403
                D-->>H: 403
                H-->>P: 403
            else 200
                D-->>H: 200 {status: created|existing}
                H-->>P: 200 {status: ...}
                P-->>B: success message + setTimeout(2000) → router.push("/")
            end
        end
    end
```

## Fluxo: Página `/about` (composição server-side)

```mermaid
flowchart TD
    A[GET /about] --> B[AboutPage RSC]
    B --> C[AboutHero mobile OU desktop]
    B --> D[MissionCard mobile OU desktop]
    B --> E[HowItWorks desktop only]
    B --> F[ActionList mobile only client]
    B --> G[ContactSection desktop only]
    B --> H[SocialLinks mobile circular OU desktop icons]
    B --> I[AboutFooter]
```

🟢 **RSC composition**: a página `/about` é Server Component; cada sub-componente é renderizado no servidor, exceto `ActionList` (precisa de `navigator.share`/clipboard, client-only). Isso permite TTFB rápido e zero JS para Hero, MissionCard (mobile), HowItWorks, ContactSection, SocialLinks (no server-render) e AboutFooter.

## Fluxo: `/auth/unauthorized` (redirecionamento de login)

```mermaid
flowchart TD
    A[GET /auth/unauthorized?next=path] --> B[UnauthorizedPage]
    B --> C[useSearchParams → next]
    C --> D{next presente?}
    D -- sim --> E[Link href = /login?next=encodeURIComponent next]
    D -- não --> F[Link href = /login]
    E --> G[Click → router.push → /login]
    F --> G
```

## Fluxo: `/auth/forbidden` (com contexto de papel)

```mermaid
flowchart TD
    A[GET /auth/forbidden] --> B[ForbiddenPage]
    B --> C[useAuth → user]
    C --> D{user.role?}
    D -- admin --> E[roleLabel = Administrador]
    D -- editor --> F[roleLabel = Editor]
    D -- reader --> G[roleLabel = Leitor]
    D -- null/undefined --> H[ocultar linha de papel]
    E --> I[mostra 'Seu papel atual: Administrador']
    F --> J[mostra 'Seu papel atual: Editor']
    G --> K[mostra 'Seu papel atual: Leitor']
    H --> L[mostra só mensagem genérica]
    I --> M[Link → / Voltar ao início]
    J --> M
    K --> M
    L --> M
```

## Estado: ciclo de autenticação

```mermaid
stateDiagram-v2
    [*] --> anonymous
    anonymous --> pending: /register → status 201
    pending --> approved: admin aprova via Django admin
    approved --> authenticated: /login → status 200 + cookies
    authenticated --> anonymous: logout (limpa cookies)
    authenticated --> pending: token inválido (após tentativas de refresh)

    anonymous --> forbidden: tenta /add-podcast sem cookie
    authenticated --> forbidden: /add-podcast com role=reader

    note right of pending
        Usuário recebe "Conta criada
        com sucesso!" mas não pode logar
    end note

    note right of authenticated
        AuthContext guarda {role, email}
        access_token 5min, refresh 24h
    end note
```

## Notas arquiteturais

- 🟢 **Por que o proxy**: o frontend Next.js fica isolado de `localhost:8000` (Django). O proxy centraliza o header `Cookie: access_token=...` e a lógica de auto-refresh, evitando que cada componente cliente precise conhecer o backend.
- 🟢 **Por que middleware em `middleware.ts`**: o middleware roda no Edge Runtime, sem acesso a React Context, então lê o cookie diretamente via `request.cookies.get('access_token')`. A defesa em camadas é: middleware bloqueia o acesso à rota, e dentro de `/add-podcast` o `useAuth()` ainda checa `role ∈ {editor, admin}` para UX (mostra "Acesso Negado" com botão de retorno).
- 🟡 **Dupla proteção de `/add-podcast`**: middleware (presença de cookie) + page (role do usuário). Se um usuário com `access_token` válido mas `role=reader` tentar acessar, ele é barrado na página (render condicional antes do form). O middleware não é suficiente.
- 🟡 **Logout não chama backend**: cookies são limpos localmente, mas o JWT continua válido até `exp` (5min access) ou 24h (refresh). Em produção, recomenda-se adicionar `blacklist` no logout usando o `token_blacklist` do SimpleJWT (já habilitado em settings, conforme Archaeologist § config).
- 🟡 **Inconsistência de idioma**: a maioria das páginas e mensagens é em PT-BR, mas `/add-podcast` mistura EN ("Add to Podigger", "Registration", "Podcast Name", "RSS Feed URL") com PT-BR nos comentários e status. A spec SDD deve documentar isso e propor unificação.
- 🟢 **Testes**: `add-podcast/__tests__/page.test.tsx` (151 linhas) cobre 6 cenários: render, mudança de inputs, criação bem-sucedida, podcast existente, erro de API com mensagem, network fail, botão back. Único módulo com testes robustos além de frontend-ui.
