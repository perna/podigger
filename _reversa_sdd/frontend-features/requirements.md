# frontend-features

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: componentes de feature do frontend Next.js (`frontend/src/components/{home,search,podcasts,episodes,layout,providers,common}/` + `frontend/src/contexts/AuthContext.tsx` + `frontend/src/lib/{api,utils,constants}.ts` + `frontend/src/middleware.ts`)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O módulo `frontend-features` concentra os **componentes de feature, contextos client-side, hooks utilitários e o cliente de API** do podigger. Enquanto `frontend-pages` (módulo irmão) define as rotas e o entry point do App Router, `frontend-features` é onde mora a **lógica de interação**: o orquestrador da home (`HomeClient`), a lista paginada de episódios com infinite scroll (`EpisodeList`), o card de podcast (`PodcastCard`), o card compacto/desktop de episódio (`EpisodeCardCompact`), o card mobile/large de episódio (`EpisodeCard`), a navegação inferior mobile (`BottomNav`), o botão flutuante de adicionar RSS (`FAB`), o estado de tema dark/light (`ThemeProvider`), o estado client de autenticação (`AuthContext`), o cliente HTTP do backend (`lib/api.ts`) e o middleware Edge que protege rotas autenticadas.

É a "alma interativa" do frontend: tudo que responde a cliques, digitações, scroll, mudança de tema ou decisão de role passa por aqui.

## Responsabilidades

- Orquestrar a home com `HomeClient` (compõe `SearchHero` + grid de podcasts + `EpisodeList` + sidebar + `BottomNav` + `FAB`).
- Implementar infinite scroll de episódios com `IntersectionObserver` em `EpisodeList`.
- Buscar podcasts no backend via `fetchPodcasts(search)` quando o usuário pressiona Enter no hero de busca.
- Renderizar cards de podcast (`PodcastCard`) com imagem, contagem de episódios e link.
- Renderizar cards de episódio em duas variantes: desktop-compact (`EpisodeCardCompact`) e mobile-large (`EpisodeCard`).
- Gerenciar o tema light/dark com persistência em `localStorage` e detecção de `prefers-color-scheme` (`ThemeProvider`).
- Manter o estado client-side de autenticação (`AuthContext`): `{email, role}` em memória; o cookie `HttpOnly` é a fonte real.
- Expor o cliente HTTP `lib/api.ts` para `fetchEpisodes`, `fetchPodcasts`, `addPodcast`.
- Proteger rotas `/add-podcast` e `/admin/*` via Edge Middleware que verifica a presença do cookie `access_token`.
- Fornecer utilitários `cn` (twMerge+clsx), `formatDuration` (`H:MM:SS`/`M:SS`), `formatDate` (PT-BR curto).
- Fornecer constantes `APP_VERSION` e `SOCIAL_LINKS`.
- Renderizar `Navbar` global (sticky, blur backdrop, theme toggle, auth state condicional, logout).
- Renderizar `BottomNav` mobile com 4 itens (Home/Search/Library/Settings) — apenas `home`/`search` são implementados.
- Renderizar `EmptyState` para os 3 cenários: `no-results`, `no-episodes`, `error`.
- Renderizar `SearchHeader` mobile com tabs (All/Latest/Popular/Short Clips) — **código morto**, não importado por ninguém em runtime.
- Renderizar `SearchHero` desktop (título, subtítulo, input grande + Button primary).
- Renderizar `FAB` (Floating Action Button) com `aria-label="Add RSS feed"` e sem `onClick` (placeholder).

## Regras de Negócio

- 🟢 **R-FF-01** — `HomeClient` é o orquestrador da home. Gerencia 5 estados: `query` (input do `SearchHero`), `searchTerm` (termo confirmado via Enter), `isSearching` (loading do `EpisodeList`), `podcasts` (resultado de `fetchPodcasts`), `isSearchingPodcasts` (loading do `fetchPodcasts`). Re-renderiza quando qualquer um muda.
- 🟢 **R-FF-02** — `handleSearch` faz `trim` da `query`. Se vazia → `setPodcasts([])` early-return (sem chamada de API). Se não vazia → `setIsSearchingPodcasts(true)`, `fetchPodcasts(trimmed)`, e em sucesso `setPodcasts(res.results)`. Erro é logado no console e `setPodcasts([])`.
- 🟢 **R-FF-03** — `HomeClient` renderiza a seção de **Podcasts** apenas quando `searchTerm` está setado. Em loading: `<LoadingSpinner size-8>` centralizado. Em resultados: grid 1-2 colunas (mobile-md) com `<PodcastCard>`. Em zero resultados: `<p>` italic `No podcasts found for "{searchTerm}".`
- 🟢 **R-FF-04** — `HomeClient` renderiza a seção de **Episodes** sempre. O título é `Recent Results` quando `searchTerm` é vazio, e `Episodes for "{searchTerm}"` quando há termo. Botão `Filters` ao lado do título é decorativo (sem onClick).
- 🟢 **R-FF-05** — `HomeClient` propaga `isSearching` para o `<SearchHero>` combinando `isSearching || isSearchingPodcasts` — o input mostra o spinner quando qualquer um dos dois está ativo.
- 🟢 **R-FF-06** — `EpisodeList` faz fetch inicial via `useEffect([searchTerm])`: `setPage(1)` + `load(term, 1, false)`. Substitui (não acumula) a lista.
- 🟢 **R-FF-07** — `EpisodeList` faz paginação via `useEffect([hasMore, isLoading, isLoadingMore, searchTerm])` + `IntersectionObserver` no `loadMoreRef` div. `rootMargin: '100px'` dispara o load antes do usuário atingir o final. `threshold: 0`.
- 🟢 **R-FF-08** — `EpisodeList` na primeira chamada usa `isLoading=true` + `onLoadingChange(true)`. Chamadas subsequentes usam `isLoadingMore=true` + spinner local. Acumula resultados com `setEpisodes((prev) => [...prev, ...res.results])`.
- 🟢 **R-FF-09** — `EpisodeList` decide o `hasMore` por `!!res.next` (presença do cursor DRF). Quando `next=null`, `hasMore=false`, observer não dispara.
- 🟢 **R-FF-10** — `EpisodeList` renderiza variantes por breakpoint: `md+` → grid 1/2 colunas com `EpisodeCardCompact`; `<md` → coluna única com `EpisodeCard` (mobile-large). Ambos renderizam a mesma lista de `episodes`.
- 🟢 **R-FF-11** — `EpisodeList` trata 3 estados de UI: loading inicial → `<LoadingSpinner size-10>` centralizado; erro → `<EmptyState type="error" onRetry>`; vazio → `<EmptyState type="no-results"|"no-episodes">` conforme `searchTerm` esteja ou não setado.
- 🟢 **R-FF-12** — `EpisodeList` no retry chama `load(searchTerm, 1, false)` — reinicia paginação do início.
- 🟢 **R-FF-13** — `ThemeProvider` resolve o tema inicial em `useState` lazy: (1) `localStorage.getItem('podigger-theme')` se for `'light'` ou `'dark'`; (2) senão, `matchMedia('(prefers-color-scheme: light)').matches` → `'light'`, senão `'dark'`. SSR fallback é `'dark'`.
- 🟢 **R-FF-14** — `ThemeProvider` aplica o tema em `useEffect([theme])`: `document.documentElement.classList.remove('light', 'dark')` + `add(theme)` + `localStorage.setItem('podigger-theme', theme)`. Persistência é síncrona.
- 🟢 **R-FF-15** — `useTheme()` retorna `{ theme, toggleTheme }`. `toggleTheme` alterna `'dark' ↔ 'light'` via `setTheme(prev => prev === 'dark' ? 'light' : 'dark')`. Throws se usado fora do `ThemeProvider` (default context nunca é consumido porque o provider está no `RootLayout`).
- 🟢 **R-FF-16** — `AuthContext` é client-side puro. Mantém `{user: {email, role} | null}` em `useState`. `isLoading` é constante `false`. `isAuthenticated = user !== null`.
- 🟢 **R-FF-17** — `AuthContext.login(role, email)` é uma operação **direta de `useState`** — NÃO chama API. É o route handler `/api/auth/login` que faz o POST real e seta os cookies. O `LoginForm` (em `frontend-pages`) chama `login()` após receber sucesso do backend.
- 🟢 **R-FF-18** — `AuthContext.logout()` é uma operação **direta de `useState`** — limpa o user. O route handler `/api/auth/logout` (em `frontend-pages`) faz o `Set-Cookie Max-Age=0` real. O `Navbar` chama `logout()` após o `fetch('/api/auth/logout')` retornar (ou falhar silenciosamente).
- 🟢 **R-FF-19** — `useAuth()` throws `Error('useAuth must be used within an AuthProvider')` se chamado fora do provider. O `RootLayout` (em `frontend-pages`) envolve toda a árvore.
- 🟢 **R-FF-20** — `lib/api.ts` define `API_BASE` com fallback duplo: `process.env.NEXT_PUBLIC_API_URL` ou `'http://localhost:8000'`. A `typeof window !== 'undefined'` guard existe mas é simétrica (mesmo valor em ambos os ramos).
- 🟢 **R-FF-21** — `fetchEpisodes(query?, page=1)` chama `GET ${API_BASE}/api/episodes/?q={trimmed}&page={pageNum>1}`. Retorna `EpisodesResponse = {count, next, previous, results: Episode[]}`. Throws `Error('API error: {status}')` em !ok.
- 🟢 **R-FF-22** — `fetchPodcasts(query?, page=1)` chama `GET ${API_BASE}/api/podcasts/?search={trimmed}&page={pageNum>1}`. **Atenção:** o parâmetro é `search`, não `q` (inconsistência de naming com `fetchEpisodes`). Retorna `PodcastsResponse`. Throws igual.
- 🟢 **R-FF-23** — `addPodcast(name, feed)` chama `POST ${API_BASE}/api/podcasts/` com body `{name, feed}` e `Content-Type: application/json`. Retorna `AddPodcastResponse = {id?, status: 'created'|'existing'|'error', message?}`. Em !ok: tenta `response.json()` e usa `errorData.message` ou fallback `API error: {status}`.
- 🟢 **R-FF-24** — `middleware.ts` é Edge Middleware. Lê o cookie `access_token`. Se ausente em `/add-podcast` ou `/admin/:path*` → 302 redirect para `/auth/unauthorized?next={encodeURIComponent(pathname+search)}`. Se presente → `NextResponse.next()`. Matcher explícito: `['/add-podcast', '/admin/:path*']`.
- 🟢 **R-FF-25** — `middleware.ts` apenas verifica a **presença** do cookie, **NÃO** decodifica o JWT. Validação real é feita no backend Django em cada request.
- 🟢 **R-FF-26** — `Navbar` é sticky (`top-0 z-50`) com `backdrop-blur-md`. Logo `Podigger` + 2 links públicos (`/`, `/about`). Adiciona `+ Add Podcast` (`/add-podcast`) se `isAuthenticated && user.role ∈ {editor, admin}`.
- 🟢 **R-FF-27** — `Navbar.handleLogout` chama `fetch('/api/auth/logout', {POST})` em try/catch (silencia erro), depois `logout()` do `useAuth()` e `router.push('/')`. O fetch é **fire-and-forget** para o backend; o estado real vem do cookie expirado.
- 🟢 **R-FF-28** — `Navbar` exibe `Logout` button (com `<Icon name="logout" />`) se autenticado, ou `Login` link (com `<Icon name="login" />`) caso contrário. Mostra `user.role` em PT-BR (capitalize, mas a label é em inglês: `admin`/`editor`/`reader`).
- 🟢 **R-FF-29** — `Navbar` theme toggle: `<Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />`, `aria-label` dinâmico. Switch de tema é client-side (sem revalidação SSR).
- 🟢 **R-FF-30** — `EmptyState` renderiza 3 tipos via map: `no-results` (com `query` prop), `no-episodes` (sem `query`), `error` (com `onRetry` callback). Cada tipo tem ícone `material-symbols-rounded`, título e descrição próprios.
- 🟢 **R-FF-31** — `BottomNav` é mobile-only (`<div className="md:hidden">` no caller). 4 itens: `Home` (`/`), `Search` (`/`, `activeItem="search"` default), `Library` (`href='#'`), `Settings` (`href='#'`). Apenas `activeItem` é destacado; sem onClick handler.
- 🟢 **R-FF-32** — `FAB` é `fixed bottom-right size-14 shadow-2xl`, com `<Icon name="rss_feed" />` e `aria-label="Add RSS feed"`. **Sem onClick** — placeholder visual para futura ação de adicionar RSS.
- 🟢 **R-FF-33** — `SearchHero` (desktop) tem título `Search millions of episodes`, subtítulo, `<Input>` grande e `<Button variant="primary" size="md">`. Props: `query: string`, `onQueryChange: (q: string) => void`, `onSearch: () => void`, `isSearching?: boolean`. Enter no input ou click no Button dispara `onSearch`.
- 🟢 **R-FF-34** — `PodcastCard` mostra imagem 20-24, `podcast.name` (line-clamp-1), `podcast.total_episodes` (pluralizado: "1 episode" / "N episodes"), link "View details" → `/podcasts/${podcast.id}` (rota **ainda não implementada**, gera 404).
- 🟢 **R-FF-35** — `EpisodeCardCompact` (desktop) tem thumbnail (16-20), `episode.podcast.name` em uppercase, título, descrição `line-clamp-2`, `formatRelativeTime` (helper inline), play button + view podcast link. `formatRelativeTime` é local ao componente (não exportado).
- 🟢 **R-FF-36** — `EpisodeCard` (mobile-large) tem hero image 16:9, play button (link externo via `episode.enclosure` ou `episode.link`), "view podcast" link. Placeholder SVG inline data URI quando `image` é null.
- 🟢 **R-FF-37** — `formatDuration(seconds)` em `lib/utils.ts`: se `seconds >= 3600` → `H:MM:SS`; senão → `M:SS` com `padStart(2, '0')`. Edge cases: `0` → `'0:00'`; `NaN` → `'0:00'` (guard `Number.isFinite`).
- 🟢 **R-FF-38** — `formatDate(date)` em `lib/utils.ts`: usa `Intl.DateTimeFormat('pt-BR', {year: 'numeric', month: 'short', day: 'numeric'})`. Edge cases: `null` ou `''` → retorna `''` (guard `if (!date) return ''`).
- 🟢 **R-FF-39** — `cn(...inputs: ClassValue[])` em `lib/utils.ts` é `twMerge(clsx(inputs))` — combina classes condicionais (`clsx`) com resolução de conflitos Tailwind (`twMerge`).
- 🟢 **R-FF-40** — `SearchHeader` (mobile) é **código morto**: tem tabs (All/Latest/Popular/Short Clips) com `<Icon>` Material Symbols, mas **NÃO é importado por `HomeClient` nem por nenhuma página** (apenas por seus próprios testes, que passam). Candidato a remoção.
- 🟡 **R-FF-41** — `fetchEpisodes` usa parâmetro `q` (DRF `SearchFilter.search_param='q'`); `fetchPodcasts` usa `search` (default do DRF). Inconsistência de naming conhecida.
- 🟡 **R-FF-42** — `lib/api.ts` não tem cache layer. Cada componente faz seus próprios fetches via `useEffect`. Sem SWR/React Query.
- 🟡 **R-FF-43** — `EpisodeList` tem race condition: se `searchTerm` muda durante fetch, requests antigos podem resolver depois dos novos. Sem `AbortController` para cancelamento.
- 🟡 **R-FF-44** — `ThemeProvider` é client-only: `useEffect` aplica classe em `<html>`, então há flash de tema "dark" no SSR antes do effect rodar (FOUC). Possível otimização: inline script no `<head>` que lê localStorage e aplica classe.
- 🟡 **R-FF-45** — `AuthContext` não sincroniza com cookies. Se o cookie HttpOnly já chegou do backend mas o `HomeClient` ou `Navbar` montou antes do login, `useAuth()` retorna `user=null` mesmo com sessão válida.
- 🟡 **R-FF-46** — `SearchHero` chama `onSearch` em duas formas: Enter no input + click no Button. Se o usuário digita e clica, `onSearch` é chamado uma vez (Button click, não Enter). O Enter do input também chama `onSearch` diretamente.
- 🟡 **R-FF-47** — `HomeClient` não tem `key={searchTerm}` no `EpisodeList`, então o estado interno (página atual, `episodes`) é resetado via `useEffect([searchTerm])`, não por remontagem. Mais leve que remontar.
- 🟡 **R-FF-48** — `Navbar` mostra o hamburger (`<Icon name="menu" />`) no mobile, mas o botão não tem `onClick` — o menu mobile não é implementado. Apenas visual.
- 🟡 **R-FF-49** — `PodcastCard` link `/podcasts/${id}` é uma rota futura. Clicar gera 404 hoje. Decisão consciente de manter o link visível.
- 🟡 **R-FF-50** — `EmptyState` `onRetry` em `EpisodeList` chama `load(searchTerm, 1, false)` — reinicia a paginação do começo. Se o usuário tinha 5 páginas carregadas, perde tudo.
- 🔴 **R-FF-51** — `AuthContext` **NÃO decodifica JWT** — apenas armazena `{email, role}` setado pelo caller. Se um caller esquece de chamar `login()` após um login bem-sucedido, o contexto fica `null` mesmo com cookie válido.
- 🔴 **R-FF-52** — `AuthContext.logout()` não chama `POST /api/auth/logout` no backend — depende do `Navbar` fazer isso antes. Se outro caller usar `useAuth().logout()` sem chamar a API, o cookie continua válido.
- 🔴 **R-FF-53** — `EpisodeList` quando o usuário clica retry em erro, a `useEffect([searchTerm])` também é re-disparada, causando 2 fetches paralelos.
- 🔴 **R-FF-54** — `addPodcast` no `lib/api.ts` faz POST direto para o backend, sem passar pelo proxy `/api/proxy/`. Isso significa que o auto-refresh do frontend-pages **não funciona** para essa chamada. Se o access_token expirar entre o mount e o click, o user recebe 401.
- 🔴 **R-FF-55** — `HomeClient` tem mistura de EN/PT-BR: `SearchHero` em inglês, mensagens de EmptyState em inglês, sidebar com "Coming soon..." em inglês. UI geral do projeto é PT-BR (ver `frontend-pages`).
- 🔴 **R-FF-56** — `formatRelativeTime` em `EpisodeCardCompact` é definido inline — não é exportado. Duplicação se outros cards precisarem.

## Requisitos Funcionais

### Home e Busca

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-01 | `HomeClient` compõe SearchHero (topo) + grid de podcasts (condicional) + EpisodeList (centro) + sidebar `lg+` + BottomNav `md:hidden` + FAB | Must | Renderização condicional por breakpoint funcional |
| RF-FF-02 | `HomeClient.handleSearch` faz `trim` da query, atualiza `searchTerm`, e se não-vazio chama `fetchPodcasts` | Must | Enter no SearchHero dispara fetch |
| RF-FF-03 | Grid de podcasts só aparece se `searchTerm` está setado | Must | Empty `searchTerm` → sem grid |
| RF-FF-04 | Grid de podcasts mostra 1-2 colunas (mobile-md) com `<PodcastCard>` | Must | Layout responsivo funcional |
| RF-FF-05 | Sem resultados de podcasts: mensagem italic `No podcasts found for "{searchTerm}".` | Should | Mensagem clara em PT-BR ou EN (atualmente EN) |
| RF-FF-06 | Título da seção Episodes alterna entre `Recent Results` e `Episodes for "{searchTerm}"` | Should | UX clear de contexto de busca |

### EpisodeList (Infinite Scroll)

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-07 | `EpisodeList` faz fetch inicial via `useEffect([searchTerm])`: `setPage(1)` + `load(term, 1, false)` | Must | Mount e mudança de `searchTerm` disparam fetch |
| RF-FF-08 | `EpisodeList` implementa infinite scroll com `IntersectionObserver` em `loadMoreRef` | Must | Scroll até 100px do fim dispara load de próxima página |
| RF-FF-09 | `EpisodeList` decide `hasMore` por `!!res.next` | Must | `next=null` → sem mais páginas |
| RF-FF-10 | `EpisodeList` renderiza `EpisodeCardCompact` (md+) ou `EpisodeCard` (mobile) | Must | Variantes por breakpoint |
| RF-FF-11 | `EpisodeList` mostra `<EmptyState type="error" onRetry>` em erro | Must | Falha de rede → mensagem + botão retry |
| RF-FF-12 | `EpisodeList` mostra `<EmptyState type="no-results">` ou `no-episodes` conforme `searchTerm` | Must | UX clara de "nada encontrado" vs "nada cadastrado" |
| RF-FF-13 | `EpisodeList` no retry chama `load(searchTerm, 1, false)` | Should | Retry reinicia do começo |

### Theme Provider

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-14 | `ThemeProvider` resolve tema inicial em ordem: localStorage → prefers-color-scheme → dark | Must | 3 fallbacks funcionais |
| RF-FF-15 | `ThemeProvider` aplica tema em `useEffect`: classe em `<html>` + localStorage | Must | Side-effect de DOM funcional |
| RF-FF-16 | `useTheme()` retorna `{theme, toggleTheme}` | Must | API estável |
| RF-FF-17 | `toggleTheme` alterna `dark ↔ light` | Must | Click no botão Navbar muda tema |
| RF-FF-18 | `useTheme()` fora do `ThemeProvider` funciona (default context tem `theme: 'dark'`, noop `toggleTheme`) | Could | Sem crash em testes isolados |

### Auth Context

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-19 | `AuthProvider` mantém `{user, isAuthenticated, isLoading, login, logout, setUser}` em contexto | Must | `useAuth()` retorna shape completo |
| RF-FF-20 | `isAuthenticated = user !== null` | Must | Derived state |
| RF-FF-21 | `isLoading` é constante `false` | Must | Sem fetch assíncrono de auth no cliente |
| RF-FF-22 | `login(role, email)` seta `user = {role, email}` (client-side puro) | Must | Operador local de useState |
| RF-FF-23 | `logout()` seta `user = null` (client-side puro) | Must | Operador local de useState |
| RF-FF-24 | `useAuth()` lança Error se fora do Provider | Should | Guard de uso incorreto |

### API Client (`lib/api.ts`)

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-25 | `API_BASE` resolve para `process.env.NEXT_PUBLIC_API_URL` ou `http://localhost:8000` | Must | Env var com fallback funcional |
| RF-FF-26 | `fetchEpisodes(query?, page=1)` faz `GET /api/episodes/?q={trimmed}&page={page>1}` | Must | Endpoint com paginação e search funcionais |
| RF-FF-27 | `fetchPodcasts(query?, page=1)` faz `GET /api/podcasts/?search={trimmed}&page={page>1}` | Must | Endpoint com paginação e search funcionais |
| RF-FF-28 | `addPodcast(name, feed)` faz `POST /api/podcasts/` com JSON body | Must | POST com payload funcional |
| RF-FF-29 | `fetchEpisodes`/`fetchPodcasts` lançam `Error('API error: {status}')` em !ok | Must | Error handling uniforme |
| RF-FF-30 | `addPodcast` extrai `errorData.message` da response de erro | Should | Mensagem de erro mais útil |

### Middleware

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-31 | `middleware.ts` roda em Edge e intercepta `/add-podcast` e `/admin/:path*` | Must | Matcher config funcional |
| RF-FF-32 | `middleware.ts` redireciona 302 para `/auth/unauthorized?next={encoded}` se cookie ausente | Must | Guard de presença de cookie |
| RF-FF-33 | `middleware.ts` chama `NextResponse.next()` se cookie presente | Must | Pass-through sem decodificar |

### Navbar

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-34 | `Navbar` é sticky top com backdrop-blur e borda inferior | Must | Visual chrome da página |
| RF-FF-35 | `Navbar` mostra links públicos (`/`, `/about`) sempre | Must | Navegação base |
| RF-FF-36 | `Navbar` mostra `+ Add Podcast` se `isAuthenticated && user.role ∈ {editor, admin}` | Must | Conditional link por role |
| RF-FF-37 | `Navbar` mostra `Logout` se autenticado, `Login` link caso contrário | Must | Conditional auth UI |
| RF-FF-38 | `Navbar` exibe `user.role` em texto capitalize | Should | Label inline de role |
| RF-FF-39 | `Navbar.handleLogout` chama `POST /api/auth/logout` + `logout()` + `router.push('/')` | Must | Logout silencioso (try/catch) |
| RF-FF-40 | `Navbar` theme toggle alterna tema com `aria-label` dinâmico | Must | Switch acessível |
| RF-FF-41 | `Navbar` mostra hamburger mobile (sem menu implementado) | Could | Visual apenas |

### Componentes auxiliares

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-42 | `BottomNav` renderiza 4 itens: Home/Search/Library/Settings com `activeItem` highlight | Must | Mobile bottom nav funcional (parcial) |
| RF-FF-43 | `BottomNav` items `library` e `settings` têm `href='#'` (não implementados) | Should | Honest placeholder |
| RF-FF-44 | `FAB` é fixed bottom-right size-14 com `<Icon name="rss_feed">` e aria-label "Add RSS feed" | Should | Visual placeholder |
| RF-FF-45 | `EmptyState` renderiza 3 tipos: `no-results` (com query), `no-episodes`, `error` (com onRetry) | Must | UX de estado vazio |
| RF-FF-46 | `SearchHeader` (mobile, código morto) tem tabs All/Latest/Popular/Short Clips | Won't | Código morto, candidato a remoção |
| RF-FF-47 | `SearchHero` (desktop) tem título, subtítulo, Input grande + Button primary | Must | Hero de busca funcional |
| RF-FF-48 | `SearchHero.onSearch` dispara em Enter no input OU click no Button | Must | 2 triggers funcionais |
| RF-FF-49 | `PodcastCard` mostra imagem 20-24, nome, contagem de episódios, "View details" link | Must | Card visual completo |
| RF-FF-50 | `EpisodeCardCompact` mostra thumbnail, podcast name (uppercase), título, descrição, play + view link | Must | Card desktop funcional |
| RF-FF-51 | `EpisodeCard` mostra hero image 16:9, play button (link externo), view podcast link | Must | Card mobile funcional |
| RF-FF-52 | `EpisodeCard` usa placeholder SVG inline data URI quando `image` é null | Should | Fallback visual |

### Utilitários

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-FF-53 | `cn(...inputs)` combina classes com `twMerge(clsx(inputs))` | Must | Utility funcional |
| RF-FF-54 | `formatDuration(seconds)` retorna `H:MM:SS` se hours>0, senão `M:SS` com pad | Must | Formato de tempo correto |
| RF-FF-55 | `formatDuration(NaN)` retorna `'0:00'` | Should | Edge case tratado |
| RF-FF-56 | `formatDate(date)` retorna string `Intl.DateTimeFormat('pt-BR', year/month-short/day)` | Must | Locale PT-BR |
| RF-FF-57 | `formatDate(null|'')` retorna `''` | Should | Edge case tratado |
| RF-FF-58 | `APP_VERSION` resolve para `process.env.NEXT_PUBLIC_APP_VERSION` ou `'1.2.0'` | Should | Env var com fallback |
| RF-FF-59 | `SOCIAL_LINKS` exporta `{twitter, github, discord: '#', email: 'mailto:support@podigger.app'}` | Should | Constante de links |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | `EpisodeList` usa `IntersectionObserver` com `rootMargin: '100px'` para prefetch de próxima página antes do usuário atingir o fim | `EpisodeList.tsx:74` | 🟢 |
| Performance | `HomeClient` usa `useCallback` para `handleSearch` e `handleLoadingChange` | `HomeClient.tsx:19,39` | 🟢 |
| Performance | `ThemeProvider` usa lazy `useState` initializer para evitar `window` access no SSR | `ThemeProvider.tsx:28-38` | 🟢 |
| Performance | `lib/api.ts` não tem cache layer — cada componente faz seus próprios fetches via `useEffect` | `lib/api.ts` (sem SWR/React Query) | 🟡 |
| Segurança | `middleware.ts` apenas verifica **presença** do cookie, não decodifica JWT — backend é a fonte real de validação | `middleware.ts:13-24` | 🟢 |
| Segurança | `AuthContext` é client-side puro — o cookie `HttpOnly` é a fonte real de sessão | `AuthContext.tsx:22-45` | 🟢 |
| Segurança | `addPodcast` no `lib/api.ts` faz POST direto ao backend, sem passar pelo proxy `/api/proxy/` (R-FF-54) | `lib/api.ts:90-108` | 🔴 |
| Escalabilidade | `EpisodeList` paginação client-side via DRF `next` cursor; suporta 100s de episódios | `EpisodeList.tsx:65-78` | 🟢 |
| Disponibilidade | `EpisodeList` retry em erro via `EmptyState.onRetry` | `EpisodeList.tsx:89` | 🟢 |
| UX | `SearchHero` mostra `isSearching` no Button (spinner via `<LoadingSpinner>` interno) | `SearchHero.tsx` | 🟢 |
| Acessibilidade | `Navbar` theme toggle tem `aria-label` dinâmico: "Switch to light mode" / "Switch to dark mode" | `Navbar.tsx:84` | 🟢 |
| Acessibilidade | `FAB` tem `aria-label="Add RSS feed"` | `FAB.tsx:9-12` | 🟢 |
| Acessibilidade | `useAuth()` lança Error se fora do Provider (debug-time) | `AuthContext.tsx:49-51` | 🟢 |
| Manutenibilidade | Comentários `// Feature: ...` + `// Requirements: X.Y` em Navbar e AuthContext (Feature tag: `api-authentication-strategy`) | `Navbar.tsx:3-4`, `AuthContext.tsx:5-6` | 🟢 |
| i18n | `formatDate` usa `pt-BR` hardcoded — não configurável | `lib/utils.ts:35` | 🟢 |
| i18n | `lib/utils.ts` é o único util com locale fixo PT-BR | `lib/utils.ts:35-38` | 🟢 |
| i18n | `EmptyState` tem textos em inglês, UI geral é PT-BR | `EmptyState.tsx` | 🔴 |
| Testes | 5 testes em `components/home/__tests__/`: EpisodeList, SearchHeader (morto), EmptyState, BottomNav, EpisodeCard (309 LOC) | `frontend/src/components/home/__tests__/` | 🟢 |
| Testes | 1 teste em `lib/__tests__/`: api (199 LOC, 3 endpoints + error handling) | `frontend/src/lib/__tests__/api.test.ts` | 🟢 |
| Testes | 0 testes em `contexts/`, `middleware.ts`, `components/providers/`, `components/layout/`, `components/podcasts/`, `components/episodes/`, `components/search/`, `components/common/` | (ver `frontend-features/legacy-mapping.md` § Resumo) | 🟢 |
| Bundle | Todos os componentes deste módulo são `'use client'` (zero RSC) | Verificar `'use client'` em todos os arquivos | 🟢 |
| Bundle | `IntersectionObserver` é API nativa do browser, sem polyfill | `EpisodeList.tsx:65` | 🟢 |
| Cache | `ThemeProvider` persiste tema em `localStorage` (chave: `podigger-theme`) | `ThemeProvider.tsx:30, 44` | 🟢 |
| Cache | `AuthContext` NÃO persiste (state in-memory apenas) | `AuthContext.tsx:23` | 🟢 |
| Confiabilidade | `EpisodeList` não cancela fetch anterior em mudança de `searchTerm` — race condition potencial | `EpisodeList.tsx:55-58` | 🟡 |

> Inferido a partir do código. Validar com equipe de frontend.

## Critérios de Aceitação

```gherkin
Dado que o usuário acessa a home pela primeira vez
Quando HomeClient monta com searchTerm=""
Então fetchPodcasts NÃO é chamado
  e EpisodeList faz fetchEpisodes("", 1)
  e grid de podcasts NÃO aparece
  e título da seção é "Recent Results"

Dado que o usuário digita "python" no SearchHero e pressiona Enter
Quando handleSearch é chamado
Então setSearchTerm("python")
  e fetchPodcasts("python") é chamado
  e grid de podcasts aparece com PodcastCards
  e EpisodeList refaz fetch com searchTerm="python"
  e título da seção é "Episodes for "python""

Dado que o usuário rola até o final da EpisodeList
Quando IntersectionObserver detecta loadMoreRef visível
Então fetchEpisodes(searchTerm, page+1) é chamado
  e novos episódios são concatenados à lista
  e spinner local aparece em isLoadingMore

Dado que a API retorna 500 em fetchEpisodes
Quando EpisodeList captura o throw
Então setError é chamado
  e <EmptyState type="error" onRetry> é renderizado

Dado que o usuário clica "Retry" no EmptyState
Quando onRetry é chamado
Então load(searchTerm, 1, false) é invocado
  e lista é reiniciada da página 1

Dado que o usuário clica o theme toggle no Navbar
Quando toggleTheme é chamado
Então classe "light"/"dark" em <html> alterna
  e localStorage["podigger-theme"] é atualizado
  e useTheme() retorna o novo theme

Dado que o usuário NÃO tem tema salvo e tem SO dark
Quando ThemeProvider monta
Então useState lazy detecta prefers-color-scheme: dark
  e theme inicial é "dark"

Dado que o usuário faz login com sucesso (via LoginForm em frontend-pages)
Quando LoginForm chama AuthContext.login("editor", "user@example.com")
Então useAuth() retorna user={email, role}, isAuthenticated=true

Dado que o usuário clica "Logout" no Navbar
Quando handleLogout é chamado
Então fetch('/api/auth/logout', POST) é chamado (silenciado em erro)
  e AuthContext.logout() zera user
  e router.push('/') navega para home

Dado que o usuário anônimo acessa /add-podcast
Quando middleware.ts intercepta
Então cookie access_token ausente → 302 para /auth/unauthorized?next=%2Fadd-podcast

Dado que o usuário autenticado acessa /add-podcast com role=editor
Quando middleware.ts passa adiante
Então NextResponse.next() é chamado
  e AddPodcastPage (em frontend-pages) renderiza o form

Dado que o usuário chama fetchEpisodes("python", 2)
Quando a função constrói a URL
Então URL é "${API_BASE}/api/episodes/?q=python&page=2"
  e a request é GET

Dado que o usuário chama fetchPodcasts("python", 1)
Quando a função constrói a URL
Então URL é "${API_BASE}/api/podcasts/?search=python"
  (page=1 não é incluído)

Dado que o usuário chama addPodcast("My Show", "https://feed.com/rss")
Quando a função faz POST
Então URL é "${API_BASE}/api/podcasts/"
  e body é JSON {"name": "My Show", "feed": "https://feed.com/rss"}
  e Content-Type é application/json

Dado que a API retorna 400 em addPodcast
Quando addPodcast captura o erro
Então tenta response.json() e usa errorData.message
  ou fallback "API error: 400"
  e throw new Error(...)

Dado que EpisodeList está com 5 episódios e isLoadingMore=true
Quando o usuário rola rapidamente
Então IntersectionObserver re-dispara mas useEffect guard (isLoading) bloqueia
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| HomeClient orquestração (RF-FF-01) | Must | Entry point da home |
| EpisodeList infinite scroll (RF-FF-07..13) | Must | Core feature de discovery |
| ThemeProvider (RF-FF-14..17) | Must | Cross-cutting concern |
| AuthContext (RF-FF-19..24) | Must | Cross-cutting concern de auth |
| API client 3 endpoints (RF-FF-25..30) | Must | Bridge com backend |
| Middleware Edge (RF-FF-31..33) | Must | Segurança de rotas |
| Navbar auth state (RF-FF-34..41) | Must | UI global de auth |
| EmptyState 3 tipos (RF-FF-45) | Must | UX de estados vazios |
| PodcastCard/EpisodeCard render (RF-FF-49..52) | Must | Cards visuais |
| Format duration/date (RF-FF-53..57) | Must | Utilitários de UI |
| SearchHero desktop (RF-FF-47, 48) | Must | Busca desktop |
| BottomNav mobile (RF-FF-42, 43) | Should | Mobile nav básica |
| FAB (RF-FF-44) | Could | Visual placeholder |
| Navbar hamburger mobile (RF-FF-41) | Could | Visual sem menu |
| SearchHeader mobile (RF-FF-46) | Won't (gap conhecido) | Código morto, candidato a remoção |
| Error message extraction em addPodcast (RF-FF-30) | Should | UX melhor |
| Default context para useTheme (RF-FF-18) | Could | Edge case de teste |
| useAuth() throw em dev (RF-FF-24) | Should | Guard de uso incorreto |
| Retry reset da paginação (RF-FF-13) | Should | UX de retry |
| `addPodcast` sem proxy (R-FF-54) | Won't (gap conhecido) | Conhecido, fora de escopo |
| Race condition no EpisodeList (R-FF-43) | Could | Edge case raro |
| Theme FOUC (R-FF-44) | Could | Edge case de SSR |
| `formatRelativeTime` inline (R-FF-56) | Could | DRY violation menor |
| Cache layer em `lib/api.ts` (R-FF-42) | Won't (gap conhecido) | Decisão consciente |
| Inconsistência EN/PT-BR (R-FF-55) | Should | Cosmético/UX |

> Prioridade inferida por frequência de chamada, posição na cadeia de dependências e presença de testes.

## Rastreabilidade de Código

| Arquivo | Função / Componente | Cobertura |
|---------|---------------------|-----------|
| `frontend/src/components/home/HomeClient.tsx` | `HomeClient` (orquestrador) | 🟢 |
| `frontend/src/components/home/EpisodeList.tsx` | `EpisodeList` (infinite scroll) | 🟢 |
| `frontend/src/components/home/EpisodeCard.tsx` | `EpisodeCard` (mobile-large) | 🟢 |
| `frontend/src/components/home/SearchHeader.tsx` | `SearchHeader` (mobile, **morto**) | 🟢 |
| `frontend/src/components/home/BottomNav.tsx` | `BottomNav` (4 itens) | 🟢 |
| `frontend/src/components/home/EmptyState.tsx` | `EmptyState` (3 tipos) | 🟢 |
| `frontend/src/components/home/__tests__/EpisodeList.test.tsx` | 107 LOC, testes de EpisodeList | 🟢 |
| `frontend/src/components/home/__tests__/SearchHeader.test.tsx` | 71 LOC, testes de SearchHeader morto | 🟢 |
| `frontend/src/components/home/__tests__/EmptyState.test.tsx` | 40 LOC, testes de EmptyState | 🟢 |
| `frontend/src/components/home/__tests__/BottomNav.test.tsx` | 34 LOC, testes de BottomNav | 🟢 |
| `frontend/src/components/home/__tests__/EpisodeCard.test.tsx` | 57 LOC, testes de EpisodeCard | 🟢 |
| `frontend/src/components/search/SearchHero.tsx` | `SearchHero` (desktop) | 🟢 |
| `frontend/src/components/podcasts/PodcastCard.tsx` | `PodcastCard` | 🟢 |
| `frontend/src/components/episodes/EpisodeCardCompact.tsx` | `EpisodeCardCompact` (desktop) | 🟢 |
| `frontend/src/components/layout/Navbar.tsx` | `Navbar` (sticky, auth, theme) | 🟢 |
| `frontend/src/components/providers/ThemeProvider.tsx` | `ThemeProvider`, `useTheme` | 🟢 |
| `frontend/src/components/common/FAB.tsx` | `FAB` (placeholder) | 🟢 |
| `frontend/src/contexts/AuthContext.tsx` | `AuthContext`, `AuthProvider`, `useAuth` | 🟢 |
| `frontend/src/lib/api.ts` | `fetchEpisodes`, `fetchPodcasts`, `addPodcast`, types | 🟢 |
| `frontend/src/lib/utils.ts` | `cn`, `formatDuration`, `formatDate` | 🟢 |
| `frontend/src/lib/constants.ts` | `APP_VERSION`, `SOCIAL_LINKS` | 🟢 |
| `frontend/src/lib/__tests__/api.test.ts` | 199 LOC, 3 endpoints + error | 🟢 |
| `frontend/src/middleware.ts` | `middleware` (Edge) | 🟢 |

> 23 arquivos do legado cobertos. 6 arquivos de teste (309 LOC no home + 199 LOC no lib). Contextos, providers, layout, podcasts, episodes, search e common **sem testes**.

---

> Spec `frontend-features/requirements.md` concluída. Próximo arquivo da unit: `design.md`.
