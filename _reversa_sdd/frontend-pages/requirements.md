# frontend-pages

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: rotas Next.js App Router (`frontend/src/app/` + `frontend/src/middleware.ts`)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O módulo `frontend-pages` define a **superfície HTTP do frontend Next.js** do podigger. Concentra três responsabilidades distintas e interligadas: (1) **páginas** renderizadas via App Router (Server Components por padrão, Client Components apenas onde há interatividade), (2) **Route Handlers** que agem como proxy seguro para o backend Django com auto-refresh de tokens JWT, e (3) **Edge Middleware** que protege rotas autenticadas. É o ponto de entrada de todas as requisições do browser — define UX, navegação, guards de role, e a ponte entre cookies HttpOnly do Django e o estado client-side do `AuthContext`.

## Responsabilidades

- Renderizar 8 páginas de UI: `/`, `/login`, `/register`, `/add-podcast`, `/about`, `/auth/unauthorized`, `/auth/forbidden`, `/auth/pending`.
- Expor 6 Route Handlers: `/api/auth/{login,register,refresh,logout}`, `/api/health`, `/api/proxy/[...path]`.
- Proteger rotas autenticadas via Edge Middleware (`/add-podcast`, `/admin/*`).
- Implementar proxy de auto-refresh: ao receber 401 do backend, tenta refresh do token antes de propagar o erro.
- Fazer forward literal de `Set-Cookie` HttpOnly do Django para o browser (essencial para cookies chegarem).
- Aplicar layout global (font Plus Jakarta Sans, ThemeProvider, AuthProvider, Navbar).
- Compor a página `/about` como RSC agregando 7 sub-componentes (1 client, 6 RSC).
- Fornecer páginas de estado de auth (`unauthorized`, `forbidden`, `pending`) com mensagens em PT-BR.

## Regras de Negócio

- 🟢 **R-PAGE-01** — Middleware protege apenas `/add-podcast` e `/admin/:path*` (matcher explícito em `middleware.ts:26-30`). Ausência de cookie `access_token` → redirect 302 para `/auth/unauthorized?next=<encodeURIComponent(pathname+search)>`.
- 🟢 **R-PAGE-02** — Login (200) → AuthContext.login(role, email) + `router.push(next || '/')`. Cookies `access_token` e `refresh_token` definidos pelo backend via Set-Cookie forward.
- 🟢 **R-PAGE-03** — Login (403) → `setPendingMessage` sem redirect. Usuário permanece na página de login com mensagem "Aguarde aprovação do administrador".
- 🟢 **R-PAGE-04** — Login (401) → `setError` genérico "Email ou senha inválidos" (sem hint de campo, evita enumeração de usuários).
- 🟢 **R-PAGE-05** — Register valida `password === passwordConfirm` **client-side** antes de chamar API. Backend não tem essa validação.
- 🟢 **R-PAGE-06** — Register (201) → `setSuccessMessage` e esconde form; **não redireciona** (fica aguardando aprovação manual do admin).
- 🟢 **R-PAGE-07** — AddPodcast gate em 2 camadas: middleware (cookie presente) + page (`!user OR role ∉ {editor, admin}` → render "Acesso Negado").
- 🟢 **R-PAGE-08** — AddPodcast trata `data.status === 'created'` ou `'existing'` com `setTimeout(2000)` antes de `router.push('/')` (dá tempo do usuário ver a mensagem de sucesso).
- 🟢 **R-PAGE-09** — Proxy `/api/proxy/[...path]` com auto-refresh: ao receber 401 do backend, tenta POST `/api/auth/token/refresh/`; sucesso → reenvia request com novo `access_token`; falha → redirect 302 para `/auth/unauthorized` + clear cookies.
- 🟢 **R-PAGE-10** — Proxy pre-read do body como `ArrayBuffer` (streams HTTP só podem ser consumidos uma vez — necessário para retry no auto-refresh).
- 🟢 **R-PAGE-11** — Login proxy extrai `setCookieHeaders` via `getSetCookie()` (com fallback para raw header parseado por regex) e re-emite no `NextResponse` — essencial para cookies HttpOnly do Django chegarem ao browser.
- 🟢 **R-PAGE-12** — Logout limpa cookies localmente (`Set-Cookie Max-Age=0`) **sem chamar backend**. Tokens JWT ainda são válidos até `exp` (5min access, 24h refresh).
- 🟢 **R-PAGE-13** — Refresh proxy lê `refresh_token` do cookie, POSTa para Django `/api/auth/token/refresh/`, faz forward do novo `Set-Cookie access_token`.
- 🟢 **R-PAGE-14** — Health check `/api/health` retorna 200 estático (sem checar backend).
- 🟢 **R-PAGE-15** — `/about` compõe 7 sub-componentes: 6 são RSC (zero JS no cliente), 1 (`ActionList`) é client-only por usar `navigator.share`/`clipboard`.
- 🟢 **R-PAGE-16** — `/auth/forbidden` mapeia `role` → label PT-BR via `ROLE_LABELS = {admin: 'Administrador', editor: 'Editor', reader: 'Leitor'}`.
- 🟢 **R-PAGE-17** — `/auth/unauthorized` lê `?next=` via `useSearchParams` (Suspense obrigatório) e gera link para `/login?next=<encoded>`.
- 🟡 **R-PAGE-18** — AddPodcast mistura EN ("Add to Podigger", "Registration", "Podcast Name", "RSS Feed URL") com PT-BR (comentários, status messages) — inconsistência de idioma conhecida.
- 🟡 **R-PAGE-19** — Cores hex hardcoded (`#0db9f2`, `#252525`, etc.) espalhadas pelas pages em vez de usar tokens `--color-primary` de `globals.css`. Indica que os tokens foram criados depois das pages.
- 🟡 **R-PAGE-20** — `RootLayout` usa `<html lang='en'>` mesmo com UI majoritariamente PT-BR. Consequência: leitores de tela anunciam em inglês.
- 🔴 **R-PAGE-21** — `AuthContext.login/logout` são **client-side puros** — não chamam API. Se o cookie HttpOnly não chegou (cenário de race), `useAuth()` retorna `user=null` mesmo com sessão válida no backend.
- 🔴 **R-PAGE-22** — Logout não invalida token no backend. JWT continua válido até `exp`. Alguém com o token pode usá-lo até 5min (access) ou 24h (refresh). Mitigação: blacklist do SimpleJWT (já habilitado em `config/settings.py`, mas não integrado no fluxo client).
- 🔴 **R-PAGE-23** — AddPodcast form não tem rate limit client-side. Usuário pode submeter múltiplas vezes se o backend demorar. Falta `disabled` no Button enquanto `isLoading`.
- 🟡 **R-PAGE-24** — Search em `EpisodeList` (chamado por `/`) tem race condition: se query muda durante fetch, requests antigos podem resolver depois dos novos. Sem cancelamento via `AbortController`.

## Requisitos Funcionais

### Páginas

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-PAGE-01 | `/` renderiza `<HomeClient />` (Server Component wrapper) | Must | `app/page.tsx` retorna JSX com `<HomeClient />` |
| RF-PAGE-02 | `/login` exibe formulário email/senha com Suspense para `useSearchParams` | Must | Build-time warning de `useSearchParams` desaparece; form renderiza |
| RF-PAGE-03 | `/login` valida que email e senha não estão vazios antes de submit | Must | Submit com campos vazios é bloqueado client-side |
| RF-PAGE-04 | `/register` valida `password === passwordConfirm` antes de submit | Must | Senhas diferentes → erro client-side, sem chamar API |
| RF-PAGE-05 | `/register` (201) esconde form e mostra "Conta criada com sucesso!" | Must | Após 201, form some, mensagem aparece, sem redirect |
| RF-PAGE-06 | `/add-podcast` renderiza "Acesso Negado" se `!user OR role ∉ {editor, admin}` | Must | Leitor (reader) autenticado vê tela de Acesso Negado |
| RF-PAGE-07 | `/add-podcast` (200 created|existing) mostra mensagem e `setTimeout(2000) → router.push('/')` | Should | Usuário vê feedback positivo por 2s antes de redirecionar |
| RF-PAGE-08 | `/about` é Server Component que compõe 7 sub-componentes | Must | HTML server-rendered com todos os 7 blocos; bundle JS não inclui 6 deles |
| RF-PAGE-09 | `/auth/unauthorized` lê `?next=` e gera link para `/login?next=...` | Must | Acessar `/auth/unauthorized?next=/add-podcast` mostra botão "Fazer login" apontando para `/login?next=%2Fadd-podcast` |
| RF-PAGE-10 | `/auth/forbidden` mapeia `role` do `useAuth()` para label PT-BR e exibe | Must | Admin autenticado vê "Seu papel atual: Administrador" |
| RF-PAGE-11 | `/auth/pending` exibe mensagem estática "Aguarde aprovação" | Should | Página renderiza com texto PT-BR, sem interatividade |

### Route Handlers

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-RH-01 | `POST /api/auth/login` proxy para Django `/api/auth/token/` e forward de Set-Cookie | Must | Login 200 retorna body `{role, email}` + cookies HttpOnly |
| RF-RH-02 | `POST /api/auth/login` retorna 503 se backend unreachable | Must | Network error ou timeout → 503 `{detail: 'Serviço indisponível...'}` |
| RF-RH-03 | `POST /api/auth/register` proxy para Django `/api/auth/register/` | Must | Register 201 retorna body com sucesso |
| RF-RH-04 | `POST /api/auth/refresh` lê `refresh_token` cookie, proxy para Django, forward Set-Cookie | Must | Refresh 200 emite novo `access_token` cookie |
| RF-RH-05 | `POST /api/auth/refresh` retorna 401 `{detail: 'Refresh token ausente.'}` se cookie missing | Must | Request sem cookie → 401 com mensagem PT-BR |
| RF-RH-06 | `POST /api/auth/logout` limpa cookies localmente (Max-Age=0), **não chama backend** | Must | Logout 200 emite Set-Cookie Max-Age=0 para `access_token` e `refresh_token` |
| RF-RH-07 | `GET /api/health` retorna 200 estático | Must | Health check responde rápido sem dependência de backend |
| RF-RH-08 | `ALL /api/proxy/[...path]` faz forward para `BACKEND/api/<path>/` com `access_token` cookie | Must | Request autenticada chega ao Django com `Cookie: access_token=...` |
| RF-RH-09 | `ALL /api/proxy/[...path]` ao receber 401 do backend: tenta refresh; sucesso → retry; falha → 302 `/auth/unauthorized` + clear cookies | Must | Auto-refresh transparente; usuário não vê 401 se token é renovável |
| RF-RH-10 | `ALL /api/proxy/[...path]` constrói URL backend como `${BACKEND}/api/${pathSegments.join('/')}/?${searchParams}` | Must | Query string do client é preservada no backend |
| RF-RH-11 | `ALL /api/proxy/[...path]` pre-read do body como ArrayBuffer (para retry) | Must | POST com body é repetível após refresh |

### Middleware

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-MW-01 | Middleware intercepta requests para `/add-podcast` e `/admin/:path*` | Must | Matcher config em `middleware.ts:26-30` |
| RF-MW-02 | Middleware redireciona 302 para `/auth/unauthorized?next=<encoded>` se cookie `access_token` ausente | Must | Request sem cookie → redirect 302 |
| RF-MW-03 | Middleware passa adiante (`NextResponse.next()`) se cookie presente | Must | Request com cookie → handler recebe a request |

### Layout

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-LAY-01 | `RootLayout` carrega fonte `Plus_Jakarta_Sans` via `next/font/google` | Must | `font-family: var(--font-plus-jakarta-sans)` aplicada em `<body>` |
| RF-LAY-02 | `RootLayout` envolve children com `<ThemeProvider>`, `<AuthProvider>`, `<Navbar>` | Must | Toda página herda tema dark/light, contexto de auth, e navbar |
| RF-LAY-03 | `RootLayout` usa `<html lang='en'>` (bug conhecido — deveria ser `pt-BR`) | Should | HTML lang reflete idioma do conteúdo |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | RSC composition em `/about` envia 6 sub-componentes como HTML puro (zero JS) | `app/about/page.tsx` sem `'use client'` | 🟢 |
| Performance | `/api/proxy/[...path]` body pre-read em ArrayBuffer adiciona latência marginal mas é necessária para retry | `app/api/proxy/[...path]/route.ts:165-167` | 🟢 |
| Segurança | Middleware verifica presença de cookie, **não** decodifica JWT | `middleware.ts:13-24` | 🟢 |
| Segurança | Login proxy faz forward literal de Set-Cookie — depende de `getSetCookie()` para múltiplos cookies | `app/api/auth/login/route.ts:46-61` | 🟢 |
| Segurança | Throttling aplicado via DRF no backend (5/min login, 3/min register) — frontend não tem rate limit próprio | Roteamento reverso; configuração em `config/settings.py:178-183` | 🟢 |
| Segurança | Logout não chama backend — cookie limpo client-side; token continua válido até `exp` | `app/api/auth/logout/route.ts:3-18` | 🔴 |
| Manutenibilidade | Comentários de rastreabilidade `// Feature: ...` + `// Requirements: X.Y` em cada arquivo | Inspecionar `app/login/page.tsx`, `app/api/proxy/...` | 🟢 |
| Acessibilidade | `<html lang='en'>` mas UI em PT-BR — leitores de tela anunciam em inglês | `app/layout.tsx:26` | 🔴 |
| Acessibilidade | `Icon` (quando usado) força `aria-hidden='true'` — caller precisa de label externa | (ver `frontend-ui/Icon`) | 🟢 |
| i18n | Idioma fixo em PT-BR nas mensagens (`Serviço indisponível`, `Aguarde aprovação`, `Seu papel atual: ...`) | `api/auth/login/route.ts`, `auth/pending/page.tsx`, `auth/forbidden/page.tsx` | 🟢 |
| Confiabilidade | Health check `/api/health` é estático — não detecta se backend Django está down | `app/api/health/route.ts:11` | 🟡 |
| Bundle | Páginas de auth (login, register, add-podcast) são client components — JS maior que RSC | `'use client'` em 3 pages | 🟢 |
| Testes | Único módulo de pages com testes: `add-podcast/__tests__/page.test.tsx` (6 cenários) | `frontend/src/app/add-podcast/__tests__/page.test.tsx` | 🟢 |

> Inferido a partir do código. Validar com equipe de frontend.

## Critérios de Aceitação

```gherkin
Dado que um usuário anônimo acessa GET /add-podcast
Quando o middleware avalia o cookie access_token
Então retorna 302 Location: /auth/unauthorized?next=%2Fadd-podcast

Dado que um usuário autenticado (role=reader) acessa GET /add-podcast
Quando a página executa useAuth() e identifica role=reader
Então renderiza "Acesso Negado" sem mostrar o formulário

Dado que um editor preenche o form de AddPodcast e submete
Quando POST /api/proxy/podcasts/ retorna 200 {status: 'created'}
Então a página exibe "Podcast cadastrado com sucesso!" por 2 segundos e redireciona para /

Dado que um usuário tenta login com credenciais válidas (approved user)
Quando POST /api/auth/login → Django /api/auth/token/ → 200 + Set-Cookie
Então o browser recebe cookies access_token e refresh_token
  e AuthContext.login(role, email) é chamado
  e router.push('/') é executado

Dado que um usuário tenta login com credenciais inválidas
Quando POST /api/auth/login → Django → 401
Então a página exibe erro "Email ou senha inválidos" sem hint de campo

Dado que um usuário tenta login com conta pending
Quando POST /api/auth/login → Django → 403
Então a página exibe "Aguarde aprovação do administrador" sem redirect

Dado que usuário autenticado chama /api/proxy/podcasts/ e access_token expirou
Quando o proxy recebe 401 do backend
Então tenta POST /api/auth/token/refresh/ (cookie válido)
  em sucesso: reenvia request com novo token, retorna 200 do backend
  em falha: redirect 302 para /auth/unauthorized + Set-Cookie Max-Age=0

Dado que o proxy recebe body em POST /api/proxy/endpoint
Quando precisa fazer retry após refresh
Então o body (ArrayBuffer pré-lido) é reenviado corretamente

Dado que um usuário clica "Sair" no Navbar
Quando POST /api/auth/logout é chamado
Então 200 {success: true} + Set-Cookie access_token=; Max-Age=0
  e Set-Cookie refresh_token=; Max-Age=0; path=/api/auth/token/refresh/
  e AuthContext.logout() limpa o estado
  e router.push('/') é executado

Dado que servidor Django está fora do ar
Quando POST /api/auth/login é chamado
Então retorna 503 {detail: 'Serviço indisponível, tente novamente em alguns instantes.'}
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Login (RF-PAGE-02..04, RF-RH-01) | Must | Caminho crítico de autenticação |
| Auto-refresh no proxy (RF-RH-09) | Must | Transparência de sessão; sem isso, usuário é deslogado a cada 5min |
| Middleware de proteção (RF-MW-01..03) | Must | Segurança de rotas autenticadas |
| Logout local (RF-RH-06) | Must | Encerrar sessão do browser |
| AddPodcast com role gate (RF-PAGE-06, 07) | Must | Funcionalidade central de admins/editores |
| Register com confirmação de senha (RF-PAGE-04) | Must | UX esperada |
| Páginas de auth state (RF-PAGE-09..11) | Must | Feedback de erros de auth |
| Forward literal de Set-Cookie (RF-RH-01) | Must | Sem isso, cookies HttpOnly não chegam |
| Body pre-read em ArrayBuffer (RF-RH-11) | Must | Necessário para retry no auto-refresh |
| Health check estático (RF-RH-07) | Should | Útil para liveness probe, não detecta backend down |
| `/about` RSC composition (RF-PAGE-08) | Should | Performance/SEO; pode ser client sem bloquear funcionalidade |
| Plus_Jakarta_Sans font (RF-LAY-01) | Should | Cosmético, fallback funciona |
| Inconsistência EN/PT-BR em /add-podcast (R-PAGE-18) | Should | Cosmético/UX |
| Cores hex hardcoded (R-PAGE-19) | Should | Manutenibilidade, não bloqueia funcionalidade |
| `<html lang='en'>` (RF-LAY-03) | Could | Acessibilidade, fix trivial |
| `AuthContext.login` sem validação de cookie (R-PAGE-21) | Could | Race condition rara |
| Logout sem blacklist (R-PAGE-22) | Won't (gap conhecido) | Mitigação via TTL curto do access token |
| Rate limit client-side em AddPodcast (R-PAGE-23) | Could | UX, não bloqueia |

> Prioridade inferida por frequência de chamada, posição na cadeia de dependências e presença de testes.

## Rastreabilidade de Código

| Arquivo | Função / Componente | Cobertura |
|---------|---------------------|-----------|
| `frontend/src/app/layout.tsx` | `RootLayout` | 🟢 |
| `frontend/src/app/page.tsx` | `Home` (RSC wrapper) | 🟢 |
| `frontend/src/app/login/page.tsx` | `LoginForm`, `LoginPage` (Client) | 🟢 |
| `frontend/src/app/register/page.tsx` | `RegisterPage` (Client) | 🟢 |
| `frontend/src/app/add-podcast/page.tsx` | `AddPodcastPage` (Client + role guard) | 🟢 |
| `frontend/src/app/add-podcast/__tests__/page.test.tsx` | 6 cenários Vitest | 🟢 |
| `frontend/src/app/about/page.tsx` | `AboutPage` (RSC) | 🟢 |
| `frontend/src/app/about/components/AboutHero.tsx` | RSC | 🟢 |
| `frontend/src/app/about/components/MissionCard.tsx` | RSC | 🟢 |
| `frontend/src/app/about/components/HowItWorks.tsx` | RSC | 🟢 |
| `frontend/src/app/about/components/ActionList.tsx` | Client (navigator.share) | 🟢 |
| `frontend/src/app/about/components/ContactSection.tsx` | RSC | 🟢 |
| `frontend/src/app/about/components/SocialLinks.tsx` | RSC | 🟢 |
| `frontend/src/app/about/components/AboutFooter.tsx` | RSC | 🟢 |
| `frontend/src/app/auth/unauthorized/page.tsx` | `UnauthorizedPage` (Client) | 🟢 |
| `frontend/src/app/auth/forbidden/page.tsx` | `ForbiddenPage` (Client) | 🟢 |
| `frontend/src/app/auth/pending/page.tsx` | (RSC) | 🟢 |
| `frontend/src/app/api/auth/login/route.ts` | `POST` handler | 🟢 |
| `frontend/src/app/api/auth/register/route.ts` | `POST` handler | 🟢 |
| `frontend/src/app/api/auth/refresh/route.ts` | `POST` handler | 🟢 |
| `frontend/src/app/api/auth/logout/route.ts` | `POST` handler | 🟢 |
| `frontend/src/app/api/health/route.ts` | `GET` handler | 🟢 |
| `frontend/src/app/api/proxy/[...path]/route.ts` | `handleProxy`, `buildBackendUrl`, `forwardToBackend`, `attemptRefresh`, `buildLogoutRedirect`, `buildProxyResponse` | 🟢 |
| `frontend/src/middleware.ts` | `middleware` (Edge) | 🟢 |
| `frontend/src/app/globals.css` | Tailwind v4 + tokens | 🟢 |

> 25 arquivos do legado cobertos. Único módulo de pages com testes: `add-podcast` (6 cenários).
