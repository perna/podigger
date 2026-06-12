# Legacy Mapping — Módulo `frontend-pages`

> Mapeamento de arquivos do projeto legado que compõem este módulo.
> Gerado pelo Arqueólogo em 2026-06-04.

## Estrutura de pastas

```
frontend/src/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout (font, providers)
│   ├── page.tsx                        # Home → <HomeClient />
│   ├── globals.css                     # Tailwind v4 + theme tokens + Material Symbols font
│   ├── login/
│   │   └── page.tsx                    # Login (Client Component)
│   ├── register/
│   │   └── page.tsx                    # Register (Client Component)
│   ├── add-podcast/
│   │   ├── page.tsx                    # Add podcast form (Client Component, role-gated)
│   │   └── __tests__/
│   │       └── page.test.tsx           # 6 scenarios via Vitest
│   ├── about/
│   │   ├── page.tsx                    # About (RSC, compõe 7 sub-componentes)
│   │   └── components/                 # Sub-componentes locais de /about
│   │       ├── AboutHero.tsx
│   │       ├── MissionCard.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── ActionList.tsx          # client (usa navigator.share)
│   │       ├── ContactSection.tsx
│   │       ├── SocialLinks.tsx
│   │       └── AboutFooter.tsx
│   ├── auth/                           # Páginas de estado de auth
│   │   ├── unauthorized/page.tsx       # 401 — redireciona para /login?next=
│   │   ├── forbidden/page.tsx          # 403 — mostra papel atual
│   │   └── pending/page.tsx            # 202 — aguardando aprovação
│   └── api/                            # Route Handlers
│       ├── auth/
│       │   ├── login/route.ts          # proxy → Django /api/auth/token/
│       │   ├── register/route.ts       # proxy → Django /api/auth/register/
│       │   ├── refresh/route.ts        # proxy → Django /api/auth/token/refresh/
│       │   └── logout/route.ts         # local: limpa cookies
│       ├── health/route.ts             # health check do Next.js
│       └── proxy/[...path]/route.ts    # catch-all proxy com auto-refresh
└── middleware.ts                       # Edge middleware: protege /add-podcast e /admin/*
```

## Tabela arquivo-por-arquivo

| Caminho | Linhas | Tipo | Responsabilidade |
|---------|--------|------|------------------|
| `frontend/src/app/layout.tsx` | 37 | RSC | Root layout: Plus_Jakarta_Sans, ThemeProvider, AuthProvider, Navbar, children |
| `frontend/src/app/page.tsx` | 5 | RSC | Wrapper que renderiza `<HomeClient />` |
| `frontend/src/app/login/page.tsx` | 242 | Client | Formulário login + handleSubmit (POST /api/auth/login) |
| `frontend/src/app/register/page.tsx` | 268 | Client | Formulário registro + confirmação de senha client-side |
| `frontend/src/app/add-podcast/page.tsx` | 246 | Client | Formulário cadastro de podcast + guard de role |
| `frontend/src/app/add-podcast/__tests__/page.test.tsx` | 151 | Test | 6 cenários Vitest + RTL |
| `frontend/src/app/about/page.tsx` | 38 | RSC | Compõe 7 sub-componentes de /about |
| `frontend/src/app/about/components/AboutHero.tsx` | 63 | RSC | Hero responsivo (mobile + desktop) |
| `frontend/src/app/about/components/MissionCard.tsx` | 44 | RSC | Card "Our Mission" responsivo |
| `frontend/src/app/about/components/HowItWorks.tsx` | 60 | RSC | Lista de features (desktop only) |
| `frontend/src/app/about/components/ActionList.tsx` | 74 | Client | Lista de ações (share/help) — usa navigator.share |
| `frontend/src/app/about/components/ContactSection.tsx` | 37 | RSC | Botões Support/Discord (desktop only) |
| `frontend/src/app/about/components/SocialLinks.tsx` | 97 | RSC | Social icons (mobile circular / desktop icons) |
| `frontend/src/app/about/components/AboutFooter.tsx` | 31 | RSC | Copyright + links legais |
| `frontend/src/app/auth/unauthorized/page.tsx` | 87 | Client | Página 401 com Suspense para useSearchParams |
| `frontend/src/app/auth/forbidden/page.tsx` | 79 | Client | Página 403 com ROLE_LABELS |
| `frontend/src/app/auth/pending/page.tsx` | 59 | RSC | Página estática "aguarde aprovação" |
| `frontend/src/app/api/auth/login/route.ts` | 69 | Route Handler | Proxy POST → Django /api/auth/token/ |
| `frontend/src/app/api/auth/register/route.ts` | 44 | Route Handler | Proxy POST → Django /api/auth/register/ |
| `frontend/src/app/api/auth/refresh/route.ts` | 61 | Route Handler | Proxy POST → Django /api/auth/token/refresh/ |
| `frontend/src/app/api/auth/logout/route.ts` | 19 | Route Handler | Local: Set-Cookie Max-Age=0 |
| `frontend/src/app/api/health/route.ts` | 11 | Route Handler | Health check do Next.js |
| `frontend/src/app/api/proxy/[...path]/route.ts` | 226 | Route Handler | Catch-all proxy com auto-refresh e retry |
| `frontend/src/middleware.ts` | 31 | Edge Middleware | Protege /add-podcast e /admin/* |
| `frontend/src/app/globals.css` | 64 | Global CSS | Tailwind v4 + @theme tokens + Material Symbols import |

## Dependências externas

| Lib / Fonte | Versão | Uso |
|-------------|--------|-----|
| `next` | 16.2.3 | App Router, Route Handlers, Middleware, RSC |
| `react` | 19.2.1 | `useState`, `useEffect` (no client), `Suspense` |
| `next/font/google` | — | `Plus_Jakarta_Sans` carregada via next/font |
| `material-symbols-rounded` (fonte) | — | Glyphs via ligatures em `<span class="material-symbols-rounded">` |
| `@/components/ui/Icon` | local | Wrapper canônico de Material Symbols |
| `@/components/ui/Loading` | local | (não usado nestas pages; reservado para uso futuro) |
| `@/components/providers/ThemeProvider` | local | Dark mode toggle (em `frontend-features`) |
| `@/components/layout/Navbar` | local | Barra de navegação global |
| `@/contexts/AuthContext` | local | Hook `useAuth()` para estado de auth |
| `@/lib/api.ts` | local | (provavelmente) wrapper fetch padronizado |
| `@/lib/constants` | local | `APP_VERSION`, `SOCIAL_LINKS` (usado em /about) |

## Convenções observadas

- 🟢 **Mobile-first frame**: todas as páginas de auth (`/login`, `/register`, `/add-podcast`, `/auth/*`) usam o mesmo template "iOS-like" com status bar fake (9:41 + signal/wifi/battery), container `rounded-[3rem] border-[8px] border-[#2a2a2a]`, e background glows `blur-[120px]`. Esse padrão está implícito e deveria virar um `<MobileFrame>` componente.
- 🟢 **`"use client"` somente onde necessário**: páginas de auth são client (precisam de useState/fetch), About é RSC (estática), `ActionList` é client (navigator.share), demais sub-componentes de About são RSC.
- 🟢 **Comentários de rastreabilidade**: cada arquivo tem `// Feature: api-authentication-strategy` + `// Requirements: X.Y` linkando ao `.specs/features/...`.
- 🟡 **Inconsistência de idioma**: `/add-podcast` mistura EN (labels) com PT-BR (comentários, status messages). Recomenda-se unificar.
- 🟡 **Cores hex hardcoded** (`#0db9f2`, `#252525`, etc.) espalhadas pelas pages em vez de usar os tokens `--color-primary` já definidos em `globals.css`. Indica que os tokens foram criados depois das pages.

## Rastreabilidade para Writer/Designer

| Página/rota | Spec SDD sugerida |
|-------------|-------------------|
| `/` (home) | `frontend-pages/home.md` (referência a `frontend-features/home/`) |
| `/login` | `frontend-pages/login.md` (inclui /api/auth/login proxy) |
| `/register` | `frontend-pages/register.md` (inclui /api/auth/register proxy) |
| `/add-podcast` | `frontend-pages/add-podcast.md` (inclui guard de role) |
| `/about` | `frontend-pages/about.md` (compõe 7 sub-componentes) |
| `/auth/unauthorized` | `frontend-pages/auth-unauthorized.md` |
| `/auth/forbidden` | `frontend-pages/auth-forbidden.md` |
| `/auth/pending` | `frontend-pages/auth-pending.md` |
| `/api/proxy/[...path]` | `frontend-pages/api-proxy.md` (com fluxo de auto-refresh) |
| `/api/auth/*` | `frontend-pages/api-auth.md` (4 Route Handlers) |
| `middleware.ts` | `frontend-pages/middleware.md` |

Como o módulo tem **15 arquivos de page/route + middleware**, é candidato natural a ser dividido em **múltiplas units** no SDD (uma por página + um agregado para API/proxy).
