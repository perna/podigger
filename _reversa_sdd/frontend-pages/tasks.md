# frontend-pages, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: rotas Next.js App Router (`frontend/src/app/` + `frontend/src/middleware.ts`)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Next.js 16+ configurado com App Router
- [ ] React 19 instalado (`useState`, `useEffect`, `useContext`, `Suspense`)
- [ ] `next/font/google` configurado para Plus_Jakarta_Sans
- [ ] Fonte `Material Symbols Rounded` carregada (em `globals.css` ou layout)
- [ ] Variável de ambiente `NEXT_PUBLIC_API_URL` definida (default `http://localhost:8000`)
- [ ] Backend Django rodando e acessível via `NEXT_PUBLIC_API_URL`
- [ ] Dependências locais: `ThemeProvider`, `AuthProvider`, `Navbar` (módulo `frontend-features`)
- [ ] `tsconfig.json` com `paths: { "@/*": ["./src/*"] }`
- [ ] Tailwind v4 configurado com tokens de tema em `globals.css`
- [ ] Vitest + @testing-library/react configurados (para reescrever teste de `add-podcast`)

---

## Tarefas

> Cada tarefa referencia o arquivo do legado de onde o comportamento foi extraído.
> Tarefas estão agrupadas por responsabilidade: Layout → Middleware → Pages → Route Handlers → Tests.

### RootLayout

- [ ] T-01, Criar `frontend/src/app/layout.tsx` (RSC) que importa Plus_Jakarta_Sans via `next/font/google` e define `variable: '--font-jakarta'`
  - Origem no legado: `frontend/src/app/layout.tsx:1-37`
  - Critério de pronto: `const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })` compila; HTML tem `class="__variable_... "` em body
  - Confiança: 🟢

- [ ] T-02, Criar `<html lang='pt-BR'>` e `<body className={jakarta.variable}>` envolvendo `<ThemeProvider>` > `<AuthProvider>` > `<Navbar>` > `{children}`
  - Origem no legado: `frontend/src/app/layout.tsx:26-35`
  - Critério de pronto: Toda página tem `font-family: var(--font-jakarta)` aplicado; lang correto para a11y
  - Confiança: 🟢
  - ⚠️ **Mudança recomendada vs. legado:** alterar `lang='en'` para `lang='pt-BR'` (R-PAGE-20)

- [ ] T-03, Exportar `metadata: Metadata` com `title`, `description`, `viewport` adequados
  - Origem no legado: `frontend/src/app/layout.tsx:5-15`
  - Critério de pronto: `<head>` da página tem `<title>` correto
  - Confiança: 🟢

- [ ] T-04, Criar `frontend/src/app/globals.css` com diretiva `@import 'tailwindcss'` e bloco `@theme` definindo tokens `--color-primary`, `--color-background-dark`, `--color-surface-dark`, etc.
  - Origem no legado: `frontend/src/app/globals.css:1-64`
  - Critério de pronto: CSS compilado inclui tokens; classes Tailwind como `bg-primary` resolvem
  - Confiança: 🟢

- [ ] T-05, Importar fonte `Material Symbols Rounded` em `globals.css` via `@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded')` ou `<link>` no layout
  - Origem no legado: `frontend/src/app/globals.css:1-10` (provável)
  - Critério de pronto: `<Icon name="search" />` renderiza glyph (não ligature literal)
  - Confiança: 🟢

### Middleware

- [ ] T-06, Criar `frontend/src/middleware.ts` exportando `config = { matcher: ['/add-podcast', '/admin/:path*'] }`
  - Origem no legado: `frontend/src/middleware.ts:26-30`
  - Critério de pronto: Middleware só executa para os paths especificados
  - Confiança: 🟢

- [ ] T-07, Implementar `middleware(request: NextRequest)` que lê `request.cookies.get('access_token')`; ausente → `NextResponse.redirect(new URL('/auth/unauthorized?next=<encoded>', request.url), {status: 302})`
  - Origem no legado: `frontend/src/middleware.ts:13-24`
  - Critério de pronto: Request anônimo a `/add-podcast` retorna 302 com `Location: /auth/unauthorized?next=%2Fadd-podcast`; com cookie → passa adiante
  - Confiança: 🟢

### Página `/` (Home wrapper)

- [ ] T-08, Criar `frontend/src/app/page.tsx` (RSC) que renderiza `<HomeClient />`
  - Origem no legado: `frontend/src/app/page.tsx:1-5`
  - Critério de pronto: `GET /` retorna HTML server-rendered com conteúdo de HomeClient
  - Confiança: 🟢

### Página `/login` (Client)

- [ ] T-09, Criar `frontend/src/app/login/page.tsx` (Client) com `useState` para `email`, `password`, `isLoading`, `error`, `pendingMessage`
  - Origem no legado: `frontend/src/app/login/page.tsx:1-50`
  - Critério de pronto: Form renderiza; cada input é controlado; submit é bloqueado durante `isLoading`
  - Confiança: 🟢

- [ ] T-10, Implementar `handleSubmit`: valida campos não-vazios, `setIsLoading(true)`, `fetch('/api/auth/login', {method: 'POST', body: JSON.stringify({email, password})})`
  - Origem no legado: `frontend/src/app/login/page.tsx:30-60`
  - Critério de pronto: Submit com campos preenchidos dispara POST; tratamento de erros visíveis
  - Confiança: 🟢

- [ ] T-11, Tratar 200: extrair `{role, email}` do body, chamar `login(role, email)` (AuthContext), `router.push(next || '/')`
  - Origem no legado: `frontend/src/app/login/page.tsx:36-43`
  - Critério de pronto: Login bem-sucedido redireciona para `next` ou `/`
  - Confiança: 🟢

- [ ] T-12, Tratar 403: `setPendingMessage('Aguarde aprovação do administrador')` sem redirect
  - Origem no legado: `frontend/src/app/login/page.tsx:45-49`
  - Critério de pronto: Login com conta pending mostra mensagem e mantém usuário na página
  - Confiança: 🟢

- [ ] T-13, Tratar 401: `setError('Email ou senha inválidos')` (genérico, sem hint de campo)
  - Origem no legado: `frontend/src/app/login/page.tsx:51-55`
  - Critério de pronto: Login com credenciais erradas mostra erro genérico
  - Confiança: 🟢

- [ ] T-14, Tratar 503: `setError('Serviço indisponível. Tente novamente.')`
  - Origem no legado: (implied em qualquer erro de rede)
  - Critério de pronto: Backend down → usuário vê mensagem clara
  - Confiança: 🟢

- [ ] T-15, Ler `?next=` via `useSearchParams()` e passar para `router.push` no sucesso
  - Origem no legado: `frontend/src/app/login/page.tsx:18, 41`
  - Critério de pronto: `/login?next=/add-podcast` redireciona para `/add-podcast` após login
  - Confiança: 🟢

- [ ] T-16, Envolver `<LoginForm>` em `<Suspense fallback={<Loading />}>` para satisfazer build-time warning de `useSearchParams`
  - Origem no legado: `frontend/src/app/login/page.tsx:232-234`
  - Critério de pronto: Build sem warning de `useSearchParams should be wrapped in a Suspense boundary`
  - Confiança: 🟢

- [ ] T-17, Estilizar form com padrão "mobile-first frame" (status bar fake 9:41, container `rounded-[3rem] border-[8px]`, background glows `blur-[120px]`)
  - Origem no legado: `frontend/src/app/login/page.tsx:60-230`
  - Critério de pronto: Visual reproduz aparência iOS-like com frame arredondado
  - Confiança: 🟢

### Página `/register` (Client)

- [ ] T-18, Criar `frontend/src/app/register/page.tsx` (Client) com `useState` para `email`, `password`, `passwordConfirm`, `isLoading`, `error`, `successMessage`
  - Origem no legado: `frontend/src/app/register/page.tsx:1-30`
  - Critério de pronto: Form renderiza; todos os inputs controlados
  - Confiança: 🟢

- [ ] T-19, Implementar `handleSubmit`: valida `password === passwordConfirm` client-side **antes** de chamar API
  - Origem no legado: `frontend/src/app/register/page.tsx:25-29`
  - Critério de pronto: Senhas diferentes → `setError('As senhas não conferem')`; sem fetch
  - Confiança: 🟢

- [ ] T-20, Em sucesso (201): `setSuccessMessage('Conta criada com sucesso! Aguarde aprovação do administrador.')` e esconder form; **não redirecionar**
  - Origem no legado: `frontend/src/app/register/page.tsx:40-46, 113-129`
  - Critério de pronto: Após 201, form desaparece, mensagem aparece, URL permanece em `/register`
  - Confiança: 🟢

- [ ] T-21, Tratar 400: `setError` com mensagem retornada pelo backend (validação de email/senha)
  - Origem no legado: `frontend/src/app/register/page.tsx:32-38`
  - Critério de pronto: Senha < 8 chars → erro de validação
  - Confiança: 🟢

### Página `/add-podcast` (Client + role guard)

- [ ] T-22, Criar `frontend/src/app/add-podcast/page.tsx` (Client) com `useState` para `name`, `feed`, `isLoading`, `message`, `messageType`
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:1-80`
  - Critério de pronto: Form renderiza (se role passar no gate)
  - Confiança: 🟢

- [ ] T-23, Implementar gate de role: render condicional `<AcessoNegado />` se `!user OR role ∉ {editor, admin}`
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:21-47`
  - Critério de pronto: Reader autenticado vê tela de Acesso Negado; editor/admin vê form
  - Confiança: 🟢

- [ ] T-24, Implementar `handleSubmit`: `fetch('/api/proxy/podcasts/', {method: 'POST', body: JSON.stringify({name, feed})})` com `setIsLoading(true)`
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:50-95`
  - Critério de pronto: Submit dispara POST autenticado (auto-refresh transparente via proxy)
  - Confiança: 🟢

- [ ] T-25, Tratar `data.status === 'created'`: `setMessage('Podcast cadastrado com sucesso!')` + `setTimeout(2000, () => router.push('/'))`
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:81-86`
  - Critério de pronto: Após sucesso, mensagem visível por 2s, depois redirect
  - Confiança: 🟢

- [ ] T-26, Tratar `data.status === 'existing'`: `setMessage('Este podcast já está cadastrado.')` + mesmo setTimeout
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:87-91`
  - Critério de pronto: Podcast duplicado mostra mensagem apropriada
  - Confiança: 🟢

- [ ] T-27, Adicionar `disabled={isLoading}` no Button para evitar clique duplo (mitigação R-PAGE-23)
  - Origem no legado: (gap; melhoria)
  - Critério de pronto: Durante loading, Button está disabled e não dispara novo submit
  - Confiança: 🟢

- [ ] T-28, Adicionar botão "Voltar" que faz `router.back()` (linkado em AcessoNegado e form)
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx:60-78`
  - Critério de pronto: Botão presente em ambas as telas (Acesso Negado e form)
  - Confiança: 🟢

### Página `/about` (RSC + 7 sub-componentes)

- [ ] T-29, Criar `frontend/src/app/about/page.tsx` (RSC) compondo 7 sub-componentes em ordem: `AboutHero`, `MissionCard`, `HowItWorks`, `ActionList`, `ContactSection`, `SocialLinks`, `AboutFooter`
  - Origem no legado: `frontend/src/app/about/page.tsx:1-38`
  - Critério de pronto: HTML server-rendered inclui todos os 7 blocos; bundle JS não inclui 6 deles (apenas ActionList)
  - Confiança: 🟢

- [ ] T-30, Criar `frontend/src/app/about/components/AboutHero.tsx` (RSC) com hero responsivo (variantes mobile + desktop via classes `md:`)
  - Origem no legado: `frontend/src/app/about/components/AboutHero.tsx:1-63`
  - Critério de pronto: Renderiza hero com título PT-BR; responsivo
  - Confiança: 🟢

- [ ] T-31, Criar `frontend/src/app/about/components/MissionCard.tsx` (RSC) com card "Our Mission" responsivo
  - Origem no legado: `frontend/src/app/about/components/MissionCard.tsx:1-44`
  - Critério de pronto: Card renderiza com texto PT-BR
  - Confiança: 🟢

- [ ] T-32, Criar `frontend/src/app/about/components/HowItWorks.tsx` (RSC) com lista de features (visível apenas em `lg:`)
  - Origem no legado: `frontend/src/app/about/components/HowItWorks.tsx:1-60`
  - Critério de pronto: Lista renderiza em desktop, oculta em mobile
  - Confiança: 🟢

- [ ] T-33, Criar `frontend/src/app/about/components/ActionList.tsx` (Client) com botões "Share" e "Help" usando `navigator.share` e `clipboard.writeText` com feature detection
  - Origem no legado: `frontend/src/app/about/components/ActionList.tsx:1-74`
  - Critério de pronto: Botões Share/Help funcionam em browsers modernos; fallback para `mailto:` se indisponível
  - Confiança: 🟢

- [ ] T-34, Criar `frontend/src/app/about/components/ContactSection.tsx` (RSC) com botões Support/Discord (desktop only)
  - Origem no legado: `frontend/src/app/about/components/ContactSection.tsx:1-37`
  - Critério de pronto: Botões visíveis em desktop, ocultos em mobile
  - Confiança: 🟢

- [ ] T-35, Criar `frontend/src/app/about/components/SocialLinks.tsx` (RSC) com ícones sociais (mobile circular / desktop icons)
  - Origem no legado: `frontend/src/app/about/components/SocialLinks.tsx:1-97`
  - Critério de pronto: Ícones sociais renderizam com layout apropriado por breakpoint
  - Confiança: 🟢

- [ ] T-36, Criar `frontend/src/app/about/components/AboutFooter.tsx` (RSC) com copyright + links legais
  - Origem no legado: `frontend/src/app/about/components/AboutFooter.tsx:1-31`
  - Critério de pronto: Footer com ano corrente e links
  - Confiança: 🟢

### Páginas de estado de auth

- [ ] T-37, Criar `frontend/src/app/auth/unauthorized/page.tsx` (Client) que lê `useSearchParams().get('next')` e renderiza link para `/login?next=<encoded>` (ou `/login` se `next` ausente)
  - Origem no legado: `frontend/src/app/auth/unauthorized/page.tsx:1-87`
  - Critério de pronto: Acessar `/auth/unauthorized?next=/add-podcast` mostra botão "Fazer login" apontando para `/login?next=%2Fadd-podcast`
  - Confiança: 🟢

- [ ] T-38, Criar `frontend/src/app/auth/forbidden/page.tsx` (Client) que lê `useAuth()` e mapeia `role` → `ROLE_LABELS[role]` (PT-BR)
  - Origem no legado: `frontend/src/app/auth/forbidden/page.tsx:1-79`
  - Critério de pronto: Admin autenticado vê "Seu papel atual: Administrador"; sem user, vê só mensagem genérica
  - Confiança: 🟢

- [ ] T-39, Criar `frontend/src/app/auth/pending/page.tsx` (RSC) com mensagem estática "Aguarde aprovação do administrador"
  - Origem no legado: `frontend/src/app/auth/pending/page.tsx:1-59`
  - Critério de pronto: Página renderiza texto PT-BR sem interatividade
  - Confiança: 🟢

### Route Handlers — Auth

- [ ] T-40, Criar `frontend/src/app/api/auth/login/route.ts` exportando `POST` que faz parse JSON (try/catch → 400), fetch para `${BACKEND_URL}/api/auth/token/`, e em 200 forward body + Set-Cookie
  - Origem no legado: `frontend/src/app/api/auth/login/route.ts:5-69`
  - Critério de pronto: Login 200 retorna `{role, email}` + cookies HttpOnly no browser; 503 em network error
  - Confiança: 🟢

- [ ] T-41, Em T-40: extrair Set-Cookie via `backendResponse.headers.getSetCookie()` (fallback para raw `set-cookie` parseado por regex `\r?\n` para múltiplos cookies)
  - Origem no legado: `frontend/src/app/api/auth/login/route.ts:46-61`
  - Critério de pronto: Múltiplos cookies no Set-Cookie são preservados (R-PAGE-L2)
  - Confiança: 🟢

- [ ] T-42, Em T-40: tratar 401/403 com `NextResponse.json(errorBody, {status: backendResponse.status})` (forward literal)
  - Origem no legado: `frontend/src/app/api/auth/login/route.ts:32-35`
  - Critério de pronto: Erros do backend são propagados sem mascarar
  - Confiança: 🟢

- [ ] T-43, Criar `frontend/src/app/api/auth/register/route.ts` exportando `POST` que faz forward literal para `${BACKEND_URL}/api/auth/register/`
  - Origem no legado: `frontend/src/app/api/auth/register/route.ts:1-44`
  - Critério de pronto: Register 201 retorna body do backend; 400 com erros de validação
  - Confiança: 🟢

- [ ] T-44, Criar `frontend/src/app/api/auth/refresh/route.ts` exportando `POST` que lê `refresh_token` cookie (ausente → 401 `{detail: 'Refresh token ausente.'}`), proxy para `${BACKEND_URL}/api/auth/token/refresh/`, forward Set-Cookie
  - Origem no legado: `frontend/src/app/api/auth/refresh/route.ts:1-61`
  - Critério de pronto: Refresh 200 emite novo `access_token`; cookie ausente retorna 401 com mensagem PT-BR
  - Confiança: 🟢

- [ ] T-45, Criar `frontend/src/app/api/auth/logout/route.ts` exportando `POST` que **NÃO chama backend** — apenas `response.cookies.set('access_token', '', {maxAge: 0})` e `response.cookies.set('refresh_token', '', {maxAge: 0, path: '/api/auth/token/refresh/'})`, retorna 200 `{success: true}`
  - Origem no legado: `frontend/src/app/api/auth/logout/route.ts:1-19`
  - Critério de pronto: Logout 200 + Set-Cookie Max-Age=0 apaga cookies no browser
  - Confiança: 🟢

### Route Handlers — Health + Proxy

- [ ] T-46, Criar `frontend/src/app/api/health/route.ts` exportando `GET` que retorna `NextResponse.json({status: 'ok'}, {status: 200})` (estático, sem checar backend)
  - Origem no legado: `frontend/src/app/api/health/route.ts:1-11`
  - Critério de pronto: `GET /api/health` retorna 200 rápido
  - Confiança: 🟢
  - ⚠️ **Recomendação:** estender para checar backend (R-PAGE-L1) — adicionar `fetch(${BACKEND_URL}/api/health/)` com timeout 2s; 503 se falhar

- [ ] T-47, Criar `frontend/src/app/api/proxy/[...path]/route.ts` com tipo `RouteContext = { params: Promise<{ path: string[] }> }` (Next.js 15+)
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:5`
  - Critério de pronto: Tipagem correta para Next.js 16+
  - Confiança: 🟢

- [ ] T-48, Implementar `buildBackendUrl(pathSegments: string[], searchParams: URLSearchParams): string` que monta `${BACKEND_URL}/api/${pathSegments.join('/')}/?<queryString>`
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:12-17`
  - Critério de pronto: `["podcasts", "42"]` com `?page=1` → `http://localhost:8000/api/podcasts/42/?page=1`
  - Confiança: 🟢

- [ ] T-49, Implementar `forwardToBackend(request, backendUrl, accessToken, preReadBody): Promise<Response>` que constrói headers (`Content-Type`, `Cookie: access_token=...`, `Accept` opcional) e faz `fetch(backendUrl, {method, headers, body: preReadBody if hasBody})`
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:23-51`
  - Critério de pronto: Request chega ao Django com Cookie correto; body é reenviável
  - Confiança: 🟢

- [ ] T-50, Implementar `attemptRefresh(request): Promise<{newToken, setCookieHeaders} | null>` que lê `refresh_token` cookie, POSTa para `${BACKEND_URL}/api/auth/token/refresh/`, extrai novo token via regex `/^access_token=([^;]+)/`
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:58-102`
  - Critério de pronto: Refresh bem-sucedido retorna `{newToken, setCookieHeaders}`; falha (cookie ausente, 401 do backend, sem access_token no Set-Cookie) retorna `null`
  - Confiança: 🟢

- [ ] T-51, Implementar `buildLogoutRedirect(pathSegments: string[]): NextResponse` que cria `NextResponse.redirect('/auth/unauthorized?next=<encoded>', {status: 302})` + 2× `Set-Cookie` com `Max-Age=0` para `access_token` e `refresh_token`
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:108-127`
  - Critério de pronto: Refresh falhou → browser recebe 302 para `/auth/unauthorized?next=...` + cookies apagados
  - Confiança: 🟢

- [ ] T-52, Implementar `buildProxyResponse(backendResponse, extraSetCookieHeaders): Promise<NextResponse>` que lê body como ArrayBuffer, cria NextResponse com status/Content-Type, append cada extraSetCookieHeader
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:133-152`
  - Critério de pronto: Response do backend é forwarded com novo cookie do refresh anexado
  - Confiança: 🟢

- [ ] T-53, Implementar `handleProxy(request, context)` que: extrai `pathSegments`, constrói `backendUrl`, pre-read body como ArrayBuffer (se `method !== 'GET' && method !== 'HEAD'`), faz primeira tentativa, se 401 → `attemptRefresh` → retry (sucesso) ou `buildLogoutRedirect` (falha), network error → 503
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:157-206`
  - Critério de pronto: Auto-refresh transparente; 503 em network error; redirect 302 em refresh falho
  - Confiança: 🟢

- [ ] T-54, Exportar handlers `GET`, `POST`, `PUT`, `PATCH`, `DELETE` que delegam para `handleProxy`
  - Origem no legado: `frontend/src/app/api/proxy/[...path]/route.ts:208-226`
  - Critério de pronto: Todos os 5 métodos HTTP são suportados
  - Confiança: 🟢

---

## Tarefas de Teste

> O único teste existente em pages está em `add-podcast/__tests__/page.test.tsx` (6 cenários). A reimplementação deve **preservar e estender** essa cobertura.

- [ ] TT-01, Reescrever `frontend/src/app/add-podcast/__tests__/page.test.tsx` com 6+ cenários (mínimo: render, mudança de inputs, sucesso, existing, erro API, network fail, botão back)
  - Origem no legado: `frontend/src/app/add-podcast/__tests__/page.test.tsx:1-151`
  - Critério de pronto: Todos os 6 cenários passam em CI
  - Confiança: 🟢

- [ ] TT-02, Adicionar teste para `handleProxy` (proxy route handler): mock fetch, simular 401 do backend → assert que `attemptRefresh` foi chamado, simular 200 do refresh → assert retry
  - Critério de pronto: 4 cenários: 200 direto, 401 → refresh sucesso, 401 → refresh falha, 503 em network error
  - Confiança: 🟡

- [ ] TT-03, Adicionar teste para `buildBackendUrl`: `[]` → `/api//` (edge case), `["a", "b"]` com `?x=1` → `/api/a/b/?x=1`
  - Critério de pronto: 3 casos passam
  - Confiança: 🟢

- [ ] TT-04, Adicionar teste para `attemptRefresh`: sem cookie → null; backend 401 → null; backend 200 com Set-Cookie → retorna newToken
  - Critério de pronto: 3 casos passam
  - Confiança: 🟡

- [ ] TT-05, Adicionar teste para `buildLogoutRedirect`: 302 com Location correto + 2 Set-Cookie com Max-Age=0
  - Critério de pronto: Headers validados via `expect(response.headers.getSetCookie())`
  - Confiança: 🟢

- [ ] TT-06, Adicionar teste para `middleware`: request sem cookie → 302; request com cookie → 200/next
  - Critério de pronto: 2 casos passam
  - Confiança: 🟢

- [ ] TT-07, Adicionar teste para `auth/login/route.ts`: 200 com forward de Set-Cookie; 401 com body forwarded; 503 em network error; 400 em JSON inválido
  - Critério de pronto: 4 casos passam
  - Confiança: 🟡

- [ ] TT-08, Adicionar teste para `auth/logout/route.ts`: 200 + 2 Set-Cookie com Max-Age=0 (não chama backend)
  - Critério de pronto: 1 caso passa + asserção que fetch não foi chamado
  - Confiança: 🟢

- [ ] TT-09, Adicionar teste para `/login` page: render inicial, mudança de inputs, submit com sucesso, submit com 401, submit com 403
  - Critério de pronto: 5 casos passam
  - Confiança: 🟡

- [ ] TT-10, Adicionar teste para `/register` page: validação client-side de senhas diferentes, sucesso, erro de validação
  - Critério de pronto: 3 casos passam
  - Confiança: 🟡

- [ ] TT-11, Adicionar teste para `/auth/forbidden` page: com user admin → "Administrador"; com user reader → "Leitor"; sem user → mensagem genérica
  - Critério de pronto: 3 casos passam (mock useAuth)
  - Confiança: 🟡

- [ ] TT-12, Adicionar teste para `/auth/unauthorized` page: com `?next=/add-podcast` → link para `/login?next=%2Fadd-podcast`; sem `?next` → link para `/login`
  - Critério de pronto: 2 casos passam
  - Confiança: 🟢

---

## Tarefas de Migração de Dados (se aplicável)

Nenhuma. Este módulo não persiste dados — toda persistência é via cookies (que vivem no browser) ou via proxy para o backend.

---

## Ordem Sugerida

1. **T-01 a T-05** (Layout + globals.css) — **bloqueio**: tudo depende do layout.
2. **T-06, T-07** (Middleware) — paralelo, sem dependência de pages.
3. **T-08** (Home wrapper) — trivial.
4. **T-29 a T-36** (Componentes de `/about`) — paralelos, sem dependência cruzada. 6 RSC + 1 Client.
5. **T-37 a T-39** (Auth state pages) — paralelos, dependem de AuthContext.
6. **T-46** (Health check) — trivial, sem dependência.
7. **T-40 a T-45** (Auth route handlers) — `auth/login` é dependência do fluxo de login.
8. **T-09 a T-17** (Login page) — depende de `auth/login` route handler.
9. **T-18 a T-21** (Register page) — depende de `auth/register` route handler.
10. **T-47 a T-54** (Proxy catch-all) — depende de `auth/refresh` route handler (T-44).
11. **T-22 a T-28** (AddPodcast page) — depende do proxy.
12. **TT-01 a TT-12** (Testes) — após todas as features prontas.

**Bloqueios entre tarefas:**
- T-22 a T-28 (AddPodcast) depende de T-47 a T-54 (proxy).
- T-09 a T-17 (Login) depende de T-40 a T-42 (login handler).
- T-18 a T-21 (Register) depende de T-43 (register handler).
- T-50 (attemptRefresh) depende de T-44 (refresh handler).
- Toda page depende de T-01 a T-05 (layout, ThemeProvider, AuthProvider, Navbar).

**Sugestão de paralelização:**
- Tarefas T-29 a T-39 (páginas estáticas e sub-componentes) podem ser feitas em paralelo por múltiplos agentes.
- T-40 a T-46 (route handlers) podem ser feitos em paralelo, exceto T-50 que depende de T-44.

---

## Lacunas Pendentes (🔴)

- 🔴 **R-PAGE-21** — `AuthContext.login/logout` sem validação de cookie. Race entre estado client e cookies. Mitigação: escutar evento global de "refresh falhou" e limpar `user`.
- 🔴 **R-PAGE-22** — Logout não invalida token no backend. Mitigação: adicionar `POST /api/auth/token/blacklist/` (já habilitado em Django settings).
- 🔴 **R-PAGE-23** — AddPodcast sem `disabled` no Button durante loading. **Resolvido em T-27** (decisão de reimplementação).
- 🟡 **R-PAGE-18** — Inconsistência EN/PT-BR em `/add-podcast`. Recomendação: unificar para PT-BR.
- 🟡 **R-PAGE-19** — Cores hex hardcoded. Recomendação: usar tokens semânticos.
- 🟡 **R-PAGE-20** — `<html lang='en'>` → mudar para `pt-BR` (**resolvido em T-02**).
- 🟡 **R-PAGE-L1** — Health check mente sobre backend. Recomendação em T-46: estender para checar backend.
- 🟡 **R-PAGE-L2** — Fallback de `getSetCookie()` pode perder cookies múltiplos. Recomendação em T-41: parse raw por `\r?\n`.
- 🟡 **R-PAGE-L3** — `arrayBuffer()` lê body inteiro. Sem impacto em requests pequenos; cuidado com uploads.
- 🟡 **R-PAGE-L4** — Proxy catch-all aceita qualquer path. Recomendação: whitelist de paths conhecidos.
- 🟡 **R-PAGE-L5** — Sem timeout em `fetch`. Recomendação: `AbortController` com 30s.

---

> **Tamanho desta unit:** 25 arquivos do legado → 54 tarefas de implementação + 12 suítes de teste. Maior unit do projeto. Recomenda-se dividir entre múltiplos agentes ou sessões, especialmente os sub-componentes de `/about` (T-29 a T-36) que são independentes.
