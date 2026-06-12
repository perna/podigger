# frontend-features, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: componentes de feature do frontend Next.js (home, search, podcasts, episodes, layout, providers, common, contexts, lib, middleware)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Tailwind CSS v4 configurado no projeto (variantes `dark:`, `md:`, `lg:`, `xl:`, `hover:`, `focus-visible:`)
- [ ] Fonte `Material Symbols Rounded` carregada no `RootLayout` (escopo do módulo `frontend-pages`)
- [ ] Dependências npm instaladas: `react@^19`, `next@^16.2.3`, `clsx`, `tailwind-merge`, `material-symbols-rounded`
- [ ] `tsconfig.json` com `paths: { "@/*": ["./src/*"] }` para suportar imports `@/components/...`, `@/lib/...`, `@/contexts/...`
- [ ] Variável de ambiente `NEXT_PUBLIC_API_URL` configurada (default: `http://localhost:8000`)
- [ ] Variável de ambiente `NEXT_PUBLIC_APP_VERSION` configurada (default: `1.2.0`)
- [ ] Componentes de `frontend-ui` (Button, Card, Input, Badge, Icon, Loading, utils) já implementados
- [ ] Route handlers de auth em `frontend-pages` (`/api/auth/login`, `/api/auth/logout`, etc.) já implementados
- [ ] `AuthProvider` e `ThemeProvider` registrados no `RootLayout` de `frontend-pages`

---

## Tarefas

> Cada tarefa referencia o arquivo do legado de onde o comportamento foi extraído.

### Utilitários (`lib/`)

- [ ] T-01, Criar `frontend/src/lib/utils.ts` com `cn`, `formatDuration`, `formatDate` (já existe; ver `frontend-ui/lib/utils.ts`; reusar se já exportado)
  - Origem no legado: `frontend/src/lib/utils.ts:1-38`
  - Critério de pronto: `cn('px-4', false && 'hidden', 'px-8') === 'px-8'`; `formatDuration(3725) === '1:02:05'`; `formatDate('2025-03-15')` contém `'15'`, `'mar'`, `'2025'`
  - Confiança: 🟢

- [ ] T-02, Criar `frontend/src/lib/constants.ts` com `APP_VERSION` e `SOCIAL_LINKS`
  - Origem no legado: `frontend/src/lib/constants.ts:1-14`
  - Critério de pronto: `APP_VERSION === process.env.NEXT_PUBLIC_APP_VERSION || '1.2.0'`; `SOCIAL_LINKS` tem `twitter`, `github`, `discord: '#'`, `email: 'mailto:support@podigger.app'`
  - Confiança: 🟢

- [ ] T-03, Criar `frontend/src/lib/api.ts` com `API_BASE`, `fetchEpisodes`, `fetchPodcasts`, `addPodcast` e types
  - Origem no legado: `frontend/src/lib/api.ts:1-109`
  - Critério de pronto: 3 funções compilam com tipos corretos; testes em `lib/__tests__/api.test.ts` passam
  - Confiança: 🟢

- [ ] T-04, Implementar `API_BASE` com fallback para `'http://localhost:8000'`
  - Origem no legado: `frontend/src/lib/api.ts:39-42`
  - Critério de pronto: `process.env.NEXT_PUBLIC_API_URL` é usado quando setado, senão fallback
  - Confiança: 🟢

- [ ] T-05, Implementar `fetchEpisodes(query?, page=1)` com param `q` (não `search`)
  - Origem no legado: `frontend/src/lib/api.ts:44-62`
  - Critério de pronto: `fetchEpisodes('python', 2)` chama `GET ${API_BASE}/api/episodes/?q=python&page=2`; `fetchEpisodes('python', 1)` omite `page`; `fetchEpisodes()` sem args omite ambos
  - Confiança: 🟢

- [ ] T-06, Implementar `fetchPodcasts(query?, page=1)` com param `search`
  - Origem no legado: `frontend/src/lib/api.ts:64-82`
  - Critério de pronto: `fetchPodcasts('python', 1)` chama `GET ${API_BASE}/api/podcasts/?search=python`
  - Confiança: 🟢

- [ ] T-07, Implementar `addPodcast(name, feed)` com POST + JSON body
  - Origem no legado: `frontend/src/lib/api.ts:90-108`
  - Critério de pronto: POST com `Content-Type: application/json` e body `{name, feed}`; em !ok, tenta `response.json().catch(() => ({}))` e usa `errorData.message || \`API error: ${status}\``
  - Confiança: 🟢

### Theme Provider

- [ ] T-08, Criar `frontend/src/components/providers/ThemeProvider.tsx` com `ThemeContext`, `ThemeProvider`, `useTheme`
  - Origem no legado: `frontend/src/components/providers/ThemeProvider.tsx:1-56`
  - Critério de pronto: Provider aceita `children`, `useTheme()` retorna `{theme, toggleTheme}`
  - Confiança: 🟢

- [ ] T-09, Implementar `useState<Theme>` lazy initializer com 3 fallbacks
  - Origem no legado: `frontend/src/components/providers/ThemeProvider.tsx:28-38`
  - Critério de pronto: SSR retorna `'dark'`; localStorage `'light'` ou `'dark'` é respeitado; senão `matchMedia('(prefers-color-scheme: light)').matches` decide; default final é `'dark'`
  - Confiança: 🟢

- [ ] T-10, Implementar `useEffect([theme])` que aplica classe em `<html>` e persiste no localStorage
  - Origem no legado: `frontend/src/components/providers/ThemeProvider.tsx:40-45`
  - Critério de pronto: classe `light`/`dark` alterna em `<html>`; `localStorage['podigger-theme']` é setado
  - Confiança: 🟢

- [ ] T-11, Implementar `toggleTheme` que alterna `dark ↔ light`
  - Origem no legado: `frontend/src/components/providers/ThemeProvider.tsx:47-49`
  - Critério de pronto: `toggleTheme()` em dark → light; em light → dark
  - Confiança: 🟢

- [ ] T-12, Definir default `ThemeContext` com `theme: 'dark'` e `toggleTheme: () => {}`
  - Origem no legado: `frontend/src/components/providers/ThemeProvider.tsx:18-21`
  - Critério de pronto: `useTheme()` fora do Provider retorna default (sem throw); throw só em `useAuth`, não em `useTheme`
  - Confiança: 🟢

### Auth Context

- [ ] T-13, Criar `frontend/src/contexts/AuthContext.tsx` com `AuthContext`, `AuthProvider`, `useAuth`
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx:1-53`
  - Critério de pronto: `AuthProvider` aceita `children`; `useAuth()` retorna `{user, isAuthenticated, isLoading, login, logout, setUser}`
  - Confiança: 🟢

- [ ] T-14, Implementar `useState<AuthState['user']>(null)` e `useState<false>(isLoading)`
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx:23-24`
  - Critério de pronto: `user` inicial é `null`; `isLoading` é constante `false` (sem setter)
  - Confiança: 🟢

- [ ] T-15, Implementar `isAuthenticated = user !== null` como derived value
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx:26`
  - Critério de pronto: `isAuthenticated` é `true` quando `user` não-null
  - Confiança: 🟢

- [ ] T-16, Implementar `login(role, email)`, `logout()`, `setUser()` como operações client-side puras
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx:28-38`
  - Critério de pronto: `login` chama `setUserState({email, role})`; `logout` chama `setUserState(null)`; `setUser` chama `setUserState(newUser)`. Nenhuma chama API.
  - Confiança: 🟢

- [ ] T-17, Implementar `useAuth()` que throws se fora do Provider
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx:47-52`
  - Critério de pronto: `useAuth()` em componente sem `AuthProvider` ancestor throws `Error('useAuth must be used within an AuthProvider')`
  - Confiança: 🟢

### Home Components

- [ ] T-18, Criar `frontend/src/components/home/HomeClient.tsx` com orquestração completa
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:1-157`
  - Critério de pronto: Compõe `SearchHero`, `EpisodeList`, `BottomNav`, `FAB`, `PodcastCard`; gerencia 5 estados; renderiza grid de podcasts condicional
  - Confiança: 🟢

- [ ] T-19, Implementar 5 `useState` em `HomeClient`: `query`, `searchTerm`, `isSearching`, `podcasts`, `isSearchingPodcasts`
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:13-17`
  - Critério de pronto: Inicializa `query=''`, `searchTerm=''`, `isSearching=false`, `podcasts=[]`, `isSearchingPodcasts=false`
  - Confiança: 🟢

- [ ] T-20, Implementar `handleSearch` async com `trim` + `fetchPodcasts` + try/catch
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:19-37`
  - Critério de pronto: query vazia → `setPodcasts([])` early-return; senão `fetchPodcasts(trimmed)`, `setPodcasts(res.results)`; erro → `console.error` + `setPodcasts([])`
  - Confiança: 🟢

- [ ] T-21, Implementar `handleLoadingChange` callback para propagar loading do `EpisodeList`
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:39-41`
  - Critério de pronto: `handleLoadingChange(loading)` chama `setIsSearching(loading)`
  - Confiança: 🟢

- [ ] T-22, Renderizar `SearchHero` no topo com `isSearching || isSearchingPodcasts`
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:46-51`
  - Critério de pronto: `isSearching` é a OR dos dois loading states
  - Confiança: 🟢

- [ ] T-23, Renderizar seção de **Podcasts** condicional a `searchTerm`
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:59-82`
  - Critério de pronto: 3 ramos: loading (`<LoadingSpinner size-8>`), results (grid 1-2 col com `PodcastCard`), vazio (mensagem italic)
  - Confiança: 🟢

- [ ] T-24, Renderizar seção de **Episodes** sempre com `EpisodeList` e título dinâmico
  - Origem no legado: `frontend/src/components/home/HomeClient.tsx:84-103`
  - Critério de pronto: Título é `Recent Results` se `searchTerm=''`, senão `Episodes for "{searchTerm}"`; botão `Filters` decorativo
  - Confiança: 🟢

- [ ] T-25, Criar `frontend/src/components/home/EpisodeList.tsx` com infinite scroll
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:1-136`
  - Critério de pronto: Props `{searchTerm, onLoadingChange?}`; 5 useState + 1 useRef; 2 useEffect; 4 estados de UI
  - Confiança: 🟢

- [ ] T-26, Implementar `load(q, pageNum, append)` async com `setIsLoadingMore` ou `setIsLoading`
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:24-52`
  - Critério de pronto: `append=true` → `setIsLoadingMore(true)`; senão `setIsLoading(true) + onLoadingChange(true)`; acumula ou substitui `episodes`; seta `hasMore = !!res.next`
  - Confiança: 🟢

- [ ] T-27, Implementar `useEffect([searchTerm, load])` que reseta e faz fetch inicial
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:55-58`
  - Critério de pronto: Mudança de `searchTerm` chama `setPage(1)` + `load(searchTerm, 1, false)`
  - Confiança: 🟢

- [ ] T-28, Implementar `useEffect([hasMore, isLoading, isLoadingMore, searchTerm, load])` com `IntersectionObserver`
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:60-78`
  - Critério de pronto: `rootMargin: '100px'`, `threshold: 0`; observer.disconnect() no cleanup; bloqueia durante loading
  - Confiança: 🟢

- [ ] T-29, Renderizar 4 estados de UI: loading / error / empty / default
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:80-134`
  - Critério de pronto: `isLoading` → spinner; `error` → `<EmptyState error onRetry>`; `episodes.length===0` → `<EmptyState no-results|no-episodes>`; default → grid (md+) + lista (mobile) + sentinela
  - Confiança: 🟢

- [ ] T-30, Criar `frontend/src/components/home/EpisodeCard.tsx` (mobile-large)
  - Origem no legado: `frontend/src/components/home/EpisodeCard.tsx:1-68`
  - Critério de pronto: Hero image 16:9 (SVG placeholder se null), play button (anchor), view podcast link
  - Confiança: 🟢

- [ ] T-31, Criar `frontend/src/components/home/EmptyState.tsx` com 3 tipos
  - Origem no legado: `frontend/src/components/home/EmptyState.tsx:1-40`
  - Critério de pronto: Type `no-results` (com `query`), `no-episodes`, `error` (com `onRetry`); cada tipo tem ícone + título + descrição
  - Confiança: 🟢

- [ ] T-32, Criar `frontend/src/components/home/BottomNav.tsx` com 4 itens
  - Origem no legado: `frontend/src/components/home/BottomNav.tsx:1-48`
  - Critério de pronto: `activeItem` prop com default `'search'`; items hardcoded com href `/#`/`/`; item ativo destacado
  - Confiança: 🟢

- [ ] T-33, **Deletar** `frontend/src/components/home/SearchHeader.tsx` (decisão Perna 2026-06-06 — opção A)
  - Origem no legado: `frontend/src/components/home/SearchHeader.tsx:1-93`
  - Critério de pronto: Arquivo removido da árvore. `SearchHeader` não é importado por nenhum outro componente.
  - Confiança: 🟢

### Search Components

- [ ] T-34, Criar `frontend/src/components/search/SearchHero.tsx` (desktop)
  - Origem no legado: `frontend/src/components/search/SearchHero.tsx:1-53`
  - Critério de pronto: Título, subtítulo, `<Input>` controlado, `<Button primary>` com `isLoading`; `onSearch` em Enter ou click
  - Confiança: 🟢

### Podcasts Components

- [ ] T-35, Criar `frontend/src/components/podcasts/PodcastCard.tsx`
  - Origem no legado: `frontend/src/components/podcasts/PodcastCard.tsx:1-50`
  - Critério de pronto: Imagem 20-24, `podcast.name` (line-clamp-1), pluralização correta de `total_episodes`, "View details" link
  - Confiança: 🟢

### Episodes Components

- [ ] T-36, Criar `frontend/src/components/episodes/EpisodeCardCompact.tsx` (desktop)
  - Origem no legado: `frontend/src/components/episodes/EpisodeCardCompact.tsx:1-97`
  - Critério de pronto: Thumbnail 16-20, `episode.podcast.name` (uppercase, text-xs), título (line-clamp-2), descrição (line-clamp-2), `formatRelativeTime` inline, play + view podcast link
  - Confiança: 🟢

- [ ] T-37, Extrair `formatRelativeTime` para `frontend/src/lib/utils.ts` (resolver R-FF-56)
  - Origem no legado: `frontend/src/components/episodes/EpisodeCardCompact.tsx` (helper inline)
  - Critério de pronto: `formatRelativeTime(iso: string | null): string` exportado de `lib/utils.ts`; `EpisodeCardCompact` importa em vez de definir inline
  - Confiança: 🟢

### Layout Components

- [ ] T-38, Criar `frontend/src/components/layout/Navbar.tsx` com sticky + auth + theme
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:1-133`
  - Critério de pronto: Sticky top, blur backdrop, logo + 2 links públicos + link `Add Podcast` condicional, theme toggle, Login/Logout condicional, hamburger mobile
  - Confiança: 🟢

- [ ] T-39, Implementar `navLinks` array dinâmico baseado em `useAuth()`
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:25-30`
  - Critério de pronto: `publicNavLinks` + `Add Podcast` se `isAuthenticated && user.role ∈ {editor, admin}`
  - Confiança: 🟢

- [ ] T-40, Implementar `handleLogout` async com try/catch + `logout()` + `router.push('/')`
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:32-40`
  - Critério de pronto: `fetch('/api/auth/logout', POST)` silenciado em erro; `logout()` + `router.push('/')` sempre
  - Confiança: 🟢

- [ ] T-41, Renderizar theme toggle com `aria-label` dinâmico
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:80-90`
  - Critério de pronto: `aria-label` é `'Switch to light mode'` se `theme === 'dark'`, senão `'Switch to dark mode'`; ícone `light_mode`/`dark_mode`
  - Confiança: 🟢

- [ ] T-42, Renderizar Login ou Logout condicional com `useAuth()`
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:92-118`
  - Critério de pronto: `isAuthenticated && user` → `<Icon logout>` + "Logout" + role badge; senão `<Icon login>` + "Login" link
  - Confiança: 🟢

- [ ] T-43, Renderizar hamburger mobile sem onClick
  - Origem no legado: `frontend/src/components/layout/Navbar.tsx:120-127`
  - Critério de pronto: `<button aria-label="Open menu" className="md:hidden">` com `<Icon name="menu">`
  - Confiança: 🟢

### Common Components

- [ ] T-44, Criar `frontend/src/components/common/FAB.tsx` (placeholder)
  - Origem no legado: `frontend/src/components/common/FAB.tsx:1-13`
  - Critério de pronto: Fixed bottom-right, size-14, shadow-2xl, `<Icon rss_feed>`, `aria-label="Add RSS feed"`. **Sem onClick.**
  - Confiança: 🟢

### Middleware

- [ ] T-45, Criar `frontend/src/middleware.ts` com Edge Middleware
  - Origem no legado: `frontend/src/middleware.ts:1-31`
  - Critério de pronto: Matcher `['/add-podcast', '/admin/:path*']`; lê `access_token` cookie; ausente → 302 `/auth/unauthorized?next=...`; presente → `NextResponse.next()`
  - Confiança: 🟢

- [ ] T-46, Implementar redirect com `next` query param encoded
  - Origem no legado: `frontend/src/middleware.ts:13-24`
  - Critério de pronto: `url.pathname = '/auth/unauthorized'`; `url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)`; `NextResponse.redirect(url)`
  - Confiança: 🟢

### Tarefas de Melhoria (R-FF-44, R-FF-54, R-FF-53, R-FF-43, R-FF-55, R-FF-51, R-FF-52)

- [ ] T-47, Adicionar inline script anti-FOUC no `<head>` do `RootLayout` (resolver R-FF-44)
  - Origem no legado: `frontend/src/app/layout.tsx` (em `frontend-pages`)
  - Critério de pronto: Script lê `localStorage['podigger-theme']` antes do React hidratar; aplica classe em `<html>`; evita flash de dark
  - Confiança: 🟡

- [ ] T-48, **Cancelado — Perna 2026-06-06:** manter POST direto em `addPodcast` (sem proxy). R-FF-54 resolvido como `Won't do`.
  - Origem no legado: `frontend/src/lib/api.ts:90-108`
  - Decisão: `addPodcast` continua chamando `${API_BASE}/api/podcasts/` diretamente. Sem proxy.
  - Confiança: 🟢

- [ ] T-49, Adicionar `AbortController` em `EpisodeList.load` para cancelar fetch anterior (resolver R-FF-43)
  - Origem no legado: `frontend/src/components/home/EpisodeList.tsx:24-52`
  - Critério de pronto: `load` recebe `signal: AbortSignal`; cancela no cleanup do `useEffect([searchTerm])`; ignora response se signal aborted
  - Confiança: 🟡

- [ ] T-50, PT-BR total: `html lang="pt-BR"` + textos PT-BR (resolver R-FF-55 — Perna 2026-06-06)
  - Origem no legado: `frontend/src/components/home/EmptyState.tsx`
  - Critério de pronto: `<html lang="pt-BR">` em layout raiz; `Nenhum resultado encontrado` / `Nenhum episódio ainda` / `Algo deu errado` em `EmptyState`; todas as strings de UI em português
  - Confiança: 🟢

- [ ] T-51, **Deletar** `SearchHeader` (decisão Perna 2026-06-06 — opção A)
  - Origem no legado: `frontend/src/components/home/SearchHeader.tsx`
  - Critério de pronto: Arquivo removido; `SearchHeader` não é importado por ninguém
  - Confiança: 🟢

- [ ] T-52, Conectar `FAB` à rota `/add-podcast` (resolver placeholder)
  - Origem no legado: `frontend/src/components/common/FAB.tsx`
  - Critério de pronto: `onClick` faz `router.push('/add-podcast')` (e gate por role via `useAuth()`)
  - Confiança: 🟡

- [ ] T-53, **Solução A:** Criar `GET /api/auth/me/` para fetch de user on mount (resolver R-FF-45 — Perna 2026-06-06)
  - Origem no legado: `frontend/src/contexts/AuthContext.tsx`
  - Critério de pronto: `AuthProvider` faz fetch de `GET /api/auth/me/` no mount; implementar endpoint no backend (`accounts/views.py`); fallback silencioso se 401 (user null)
  - Confiança: 🟢

- [ ] T-54, Adicionar `disabled` no `AddPodcastForm` enquanto `isLoading` (resolver R-PAGE-23)
  - Origem no legado: `frontend/src/app/add-podcast/page.tsx` (em `frontend-pages`)
  - Critério de pronto: `<Button isLoading>` desabilita novo submit; evita múltiplas chamadas
  - Confiança: 🟡

---

## Tarefas de Teste

- [ ] TT-01, Testar `EpisodeList` com mock de `fetchEpisodes`
  - Origem no legado: `frontend/src/components/home/__tests__/EpisodeList.test.tsx` (107 LOC)
  - Critério de pronto: Cobre happy path (load + render), empty (no-results/no-episodes), error (EmptyState + retry)
  - Confiança: 🟢

- [ ] TT-02, Testar `EmptyState` para os 3 tipos
  - Origem no legado: `frontend/src/components/home/__tests__/EmptyState.test.tsx` (40 LOC)
  - Critério de pronto: Render correto de ícone + título + descrição; `onRetry` é chamado no tipo `error`
  - Confiança: 🟢

- [ ] TT-03, Testar `BottomNav` com diferentes `activeItem`
  - Origem no legado: `frontend/src/components/home/__tests__/BottomNav.test.tsx` (34 LOC)
  - Critério de pronto: Item ativo recebe classe de destaque; hrefs corretos
  - Confiança: 🟢

- [ ] TT-04, Testar `EpisodeCard` com mock episode + sem image
  - Origem no legado: `frontend/src/components/home/__tests__/EpisodeCard.test.tsx` (57 LOC)
  - Critério de pronto: Render de hero, play button, view podcast link; fallback SVG quando image null
  - Confiança: 🟢

- [ ] TT-05, Testar `SearchHeader` **removido** (T-51 deletado — Perna 2026-06-06)
  - Origem no legado: `frontend/src/components/home/__tests__/SearchHeader.test.tsx` (71 LOC)
  - Critério de pronto: Teste excluído junto com o componente; TT-05 eliminado do plano
  - Confiança: 🟢

- [ ] TT-06, Testar `lib/api.ts` com mock de `fetch`
  - Origem no legado: `frontend/src/lib/__tests__/api.test.ts` (199 LOC)
  - Critério de pronto: 3 endpoints com query + paginação; error handling com `API error: {status}`; `addPodcast` com `errorData.message` extraction
  - Confiança: 🟢

- [ ] TT-07, Testar `ThemeProvider` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: `useState` lazy resolve localStorage > matchMedia > dark; `useEffect` aplica classe; `toggleTheme` alterna
  - Confiança: 🟢

- [ ] TT-08, Testar `AuthContext` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: `login(role, email)` seta user; `logout()` zera; `useAuth()` throws fora do Provider
  - Confiança: 🟢

- [ ] TT-09, Testar `middleware.ts` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Sem cookie → 302; com cookie → next; matcher correto
  - Confiança: 🟢

- [ ] TT-10, Testar `Navbar` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Render com/sem auth; theme toggle funciona; logout chama API + limpa estado
  - Confiança: 🟢

- [ ] TT-11, Testar `SearchHero` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Enter dispara `onSearch`; click no Button dispara `onSearch`; `isSearching` mostra spinner
  - Confiança: 🟢

- [ ] TT-12, Testar `PodcastCard` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Render de imagem, nome, contagem (1 vs N), link correto
  - Confiança: 🟢

- [ ] TT-13, Testar `EpisodeCardCompact` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Render de thumbnail, podcast name (uppercase), título, descrição (line-clamp-2), play + view link
  - Confiança: 🟢

- [ ] TT-14, Testar `FAB` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: aria-label correto; sem onClick (placeholder); classes fixed
  - Confiança: 🟢

- [ ] TT-15, Testar `HomeClient` (NOVO — gap conhecido)
  - Origem no legado: — (não existe)
  - Critério de pronto: Integração com `SearchHero` + `EpisodeList`; trim da query; grid de podcasts condicional
  - Confiança: 🟢

---

## Tarefas de Migração de Dados

Nenhuma. `frontend-features` é client-side e não persiste dados próprios (apenas `localStorage` para tema).

---

## Ordem Sugerida

1. **Fase 1 — Fundação (T-01 a T-17):** utilitários, theme provider, auth context. Sem dependência de UI components.
2. **Fase 2 — API client (T-03 a T-07):** pode ser paralelo à Fase 1.
3. **Fase 3 — Componentes primitivos consumidores (T-34 a T-36):** SearchHero, PodcastCard, EpisodeCardCompact. Dependem de `frontend-ui`.
4. **Fase 4 — Home (T-18 a T-32):** HomeClient orquestra os anteriores. EpisodeList é o mais complexo.
5. **Fase 5 — Layout (T-38 a T-43):** Navbar depende de ThemeProvider + AuthContext.
6. **Fase 6 — Common + Middleware (T-44 a T-46):** FAB e middleware são standalone.
7. **Fase 7 — Melhorias (T-47 a T-54):** resolução de gaps conhecidos. Pode ser paralelo a partir da Fase 5.
8. **Fase 8 — Testes (TT-01 a TT-15):** em paralelo com cada fase anterior, com foco em T-07..T-15 (cobertura de gaps).

**Bloqueios críticos:**
- T-18 (HomeClient) bloqueia TT-15.
- T-25 (EpisodeList) bloqueia TT-01.
- T-08..T-12 (ThemeProvider) bloqueiam T-41.
- T-13..T-17 (AuthContext) bloqueiam T-39, T-42.

---

## Lacunas Pendentes (🔴)

- ~~**R-FF-54** (🔴) — addPodcast sem proxy~~ ✅ Resolvido Perna 2026-06-06: manter POST direto (sem proxy).
- ~~**R-FF-51** (🔴) — AuthContext sem decoder JWT~~ ✅ Resolvido Perna 2026-06-06: solução A (criar `GET /api/auth/me/`).
- **R-FF-44** (🔴) — Theme FOUC: requer inline script no `<head>` (envolve `frontend-pages`).
- **R-FF-43** (🔴) — Race condition em `EpisodeList`: requer `AbortController` + refactor de `load` para aceitar `signal`.
- ~~**R-FF-55** (🔴) — Inconsistência EN/PT-BR~~ ✅ Resolvido Perna 2026-06-06: PT-BR total + `<html lang="pt-BR">`.
- **R-FF-53** (🔴) — Retry duplica fetch: requer guard para evitar `useEffect` re-fire durante retry manual.
- ~~**R-FF-56** (🔴) — formatRelativeTime inline~~ ✅ Resolvido Perna 2026-06-06: extrair para `lib/utils.ts` (T-37).
- ~~**T-51** (🟢 decisão) — SearchHeader morto~~ ✅ Resolvido Perna 2026-06-06: deletar (opção A).
- ~~**R-FF-45** (🟡) — AuthContext não persiste~~ ✅ Resolvido Perna 2026-06-06: solução A (`GET /api/auth/me/`).
- **R-FF-42** (🟡) — Sem cache layer em `lib/api.ts`: requer decisão de adotar SWR/React Query ou manter simplicidade.
- **R-FF-50** (🟡) — Retry reseta paginação: requer decisão de UX (perder páginas ou guardar state de erro).
- **R-FF-49** (🟡) — `PodcastCard` link para 404: requer implementação da rota `/podcasts/[id]/` ou remoção do link. (Parte dos gaps de UI — implementar agora, Perna 2026-06-06)

---

> Spec `frontend-features/tasks.md` concluída. Próximo arquivo da unit: `contracts.md`.
