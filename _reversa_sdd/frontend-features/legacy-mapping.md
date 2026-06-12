# Mapeamento Legado — frontend-features

> Módulo analisado pelo Arqueólogo em 2026-06-05.
> Mapeamento arquivo-por-arquivo do código legado que compõe este módulo.
> Granularidade: module.

## Localização
- `frontend/src/components/` (feature-grouped subdirectories)
- `frontend/src/contexts/`
- `frontend/src/lib/`
- `frontend/src/middleware.ts` (raiz de `src/`)

## Componentes — `components/home/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/home/HomeClient.tsx` | 157 | `HomeClient` | Orquestrador client da home. Gerencia `query`, `searchTerm`, `isSearching`, `podcasts`, `isSearchingPodcasts`. Faz `fetchPodcasts` quando há termo de busca. Renderiza `SearchHero` (topo), seção de podcasts (condicional), `EpisodeList` (centro), sidebar `lg+`, `BottomNav` (mobile) e `FAB`. |
| `frontend/src/components/home/EpisodeList.tsx` | 136 | `EpisodeList` | Lista paginada com infinite scroll via `IntersectionObserver`. Estados: `episodes`, `page`, `hasMore`, `isLoading`, `isLoadingMore`, `error`. Chama `fetchEpisodes` (lib/api). Alterna entre `EpisodeCardCompact` (desktop) e `EpisodeCard` (mobile) via `hidden md:grid` / `md:hidden`. |
| `frontend/src/components/home/EpisodeCard.tsx` | 68 | `EpisodeCard` | Card mobile-large com hero image 16:9, play button (link externo), view podcast link. Placeholder SVG inline data URI. |
| `frontend/src/components/home/EpisodeCardCompact.tsx` | *(removido, ver `episodes/`)* | | |
| `frontend/src/components/home/SearchHeader.tsx` | 93 | `SearchHeader` | ⚠️ **Código morto**. Header mobile sticky com tabs (All/Latest/Popular/Short Clips). NÃO importado por `HomeClient` (que usa `SearchHero` em vez). Possível refactor leftover. |
| `frontend/src/components/home/BottomNav.tsx` | 48 | `BottomNav` | Bottom nav mobile com 4 items: Home/Search/Library/Settings. Props: `activeItem`. `library` e `settings` têm `href='#'` (não implementados). |
| `frontend/src/components/home/EmptyState.tsx` | 40 | `EmptyState` | 3 tipos: `no-results` (com query), `no-episodes`, `error` (com botão retry). Render condicional via map. |
| `frontend/src/components/home/__tests__/EpisodeList.test.tsx` | 107 | (test) | Testes de `EpisodeList` |
| `frontend/src/components/home/__tests__/SearchHeader.test.tsx` | 71 | (test) | Testes de `SearchHeader` (mesmo sendo código morto, ainda tem cobertura) |
| `frontend/src/components/home/__tests__/EmptyState.test.tsx` | 40 | (test) | Testes de `EmptyState` |
| `frontend/src/components/home/__tests__/BottomNav.test.tsx` | 34 | (test) | Testes de `BottomNav` |
| `frontend/src/components/home/__tests__/EpisodeCard.test.tsx` | 57 | (test) | Testes de `EpisodeCard` |

## Componentes — `components/search/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/search/SearchHero.tsx` | 53 | `SearchHero` | Hero desktop com título "Search millions of episodes", subtítulo, input grande + Button primary. Enter no input dispara `onSearch`. Usado por `HomeClient`. |

## Componentes — `components/podcasts/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/podcasts/PodcastCard.tsx` | 50 | `PodcastCard` | Card compacto de podcast: imagem 20-24, nome, contagem de episódios, "View details" link. Link vai para `/podcasts/${id}` (rota ainda não implementada). |

## Componentes — `components/episodes/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/episodes/EpisodeCardCompact.tsx` | 97 | `EpisodeCardCompact` | Card desktop-compact com thumbnail, podcast name (uppercase), título, descrição (line-clamp-2), `formatRelativeTime` (helper inline), play button + view podcast link. |

## Componentes — `components/layout/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/layout/Navbar.tsx` | 133 | `Navbar` | Top nav global. Sticky, blur backdrop. Links: Search (/), About (/about), + Add Podcast (apenas se `editor`/`admin`). Theme toggle (light/dark) com `useTheme()`. Auth: mostra "role + Logout" se authenticated, "Login" link caso contrário. Logout chama `/api/auth/logout` (POST) + `logout()` do `useAuth()` + `router.push('/')`. |
| Feature tag: `api-authentication-strategy` (Requirements: 9.1, 9.2) | | | |

## Componentes — `components/ui/`

> Design-system primitives, analisados no módulo `frontend-ui` (NÃO reanalisar aqui).

## Componentes — `components/providers/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/providers/ThemeProvider.tsx` | 56 | `ThemeProvider`, `useTheme`, `ThemeContext` (interno) | Light/dark theme. Estado inicial: localStorage `podigger-theme` → `prefers-color-scheme` → `dark`. Side-effect: aplica classe `light`/`dark` em `<html>` e persiste no localStorage. `toggleTheme` alterna. |

## Componentes — `components/common/`

| Arquivo | LOC | Função/Componente | Propósito |
|---------|-----|-------------------|-----------|
| `frontend/src/components/common/FAB.tsx` | 13 | `FAB` | Floating Action Button RSS_feed, fixed bottom-right, size-14, shadow-2xl. Aria-label "Add RSS feed". Não tem onClick (placeholder, navegação real é TBD). |

## Contextos — `contexts/`

| Arquivo | LOC | Exporta | Propósito |
|---------|-----|---------|-----------|
| `frontend/src/contexts/AuthContext.tsx` | 53 | `AuthContext`, `AuthProvider`, `useAuth`, `AuthState` (interface) | Estado de auth em memória (`useState`). **Não decodifica JWT** — apenas armazena `{email, role}`. `login(role, email)` é uma operação client-side direta (NÃO chama API — o real login é via `/api/auth/login` route handler que seta cookies). `logout()` limpa user. `isLoading` é sempre `false` (constante). Throws se `useAuth` usado fora do `AuthProvider`. |
| Feature tag: `api-authentication-strategy` (Requirements: 7.3, 7.4, 8.2, 8.7) | | | |

## Lib — `lib/`

| Arquivo | LOC | Exporta | Propósito |
|---------|-----|---------|-----------|
| `frontend/src/lib/api.ts` | 109 | `Episode`, `EpisodesResponse`, `Podcast`, `PodcastsResponse`, `AddPodcastResponse`, `fetchEpisodes`, `fetchPodcasts`, `addPodcast` | API client. `API_BASE` = `process.env.NEXT_PUBLIC_API_URL` \|\| `'http://localhost:8000'`. **3 endpoints:** `GET /api/episodes/` (com `q` e `page`), `GET /api/podcasts/` (com `search` e `page`), `POST /api/podcasts/` (com `name` e `feed`). `fetchEpisodes` param é `q` (DRF `SearchFilter` em `search_fields=['title']`); `fetchPodcasts` param é `search` (DRF `SearchFilter` em `search_fields=['name']`). Throws `Error('API error: <status>')` em !ok. |
| `frontend/src/lib/utils.ts` | 38 | `cn`, `formatDuration`, `formatDate` | `cn()` = `twMerge(clsx(inputs))`. `formatDuration(seconds)` → `H:MM:SS` se hours>0, senão `M:SS` (com `padStart(2,'0')`). `formatDate(date)` → `Intl.DateTimeFormat('pt-BR', {year, month: 'short', day})`. |
| `frontend/src/lib/constants.ts` | 14 | `APP_VERSION`, `SOCIAL_LINKS` | `APP_VERSION` = `process.env.NEXT_PUBLIC_APP_VERSION` ?? `'1.2.0'`. `SOCIAL_LINKS` = `{twitter, github, discord: '#', email: 'mailto:support@podigger.app'}` (as const). |
| `frontend/src/lib/__tests__/api.test.ts` | 199 | (test) | Testes do API client (cobre 3 endpoints + error handling). |

## Middleware — `src/middleware.ts`

| Arquivo | LOC | Exporta | Propósito |
|---------|-----|---------|-----------|
| `frontend/src/middleware.ts` | 31 | `middleware`, `config` | Edge middleware. Lê `access_token` cookie. Se ausente → `NextResponse.redirect('/auth/unauthorized?next=<encoded-url>')`. Matcher: `['/add-podcast', '/admin/:path*']`. Comentário: "Note: This middleware cannot access React context — it reads the cookie directly." |
| Feature tag: `api-authentication-strategy` (Requirements: 8.6, 13.5) | | | |

## Resumo de cobertura de testes

| Diretório | LOC testes | Status |
|-----------|-----------|--------|
| `components/home/__tests__/` | 309 (5 arquivos) | Coberto |
| `lib/__tests__/` | 199 (1 arquivo) | Coberto |
| `contexts/` | 0 | **Sem testes** |
| `middleware.ts` | 0 | **Sem testes** |
| `components/providers/` | 0 | **Sem testes** |
| `components/layout/` | 0 | **Sem testes** |
| `components/podcasts/` | 0 | **Sem testes** |
| `components/episodes/` | 0 | **Sem testes** |
| `components/search/` | 0 | **Sem testes** |
| `components/common/` | 0 | **Sem testes** |

## Observações estruturais

1. **Não existe `features/` nem `hooks/`** — organização é por subdir de `components/`, com hooks vivendo junto de seus providers/contexts.
2. **`SearchHeader.tsx` é código morto** — não importado por ninguém em runtime. Tem testes (que passam) mas é candidato a remoção.
3. **Dois EpisodeCards diferentes** — `EpisodeCard` (home, mobile, hero-image) e `EpisodeCardCompact` (episodes/, desktop, thumbnail). Mantidos em diretórios separados apesar de duplicação conceitual.
4. **Dois Search headers** — `SearchHero` (desktop, usado) e `SearchHeader` (mobile, morto).
5. **Auth state = `useState` simples** — não usa cookies/decoded JWT. Frontend confia nos cookies HttpOnly do backend; o contexto só mantém o "display name" e role para UI condicional.
6. **FAB sem onClick** — placeholder visual; rota real (`/add-podcast`) já existe mas o FAB não está conectado.
7. **API client sem cache layer** — sem SWR, React Query, ou similar. Cada componente faz seus próprios fetches.
8. **Theme é client-only** — `useEffect` aplica classe em `<html>`, então há flash de tema "dark" no SSR antes do effect rodar. Possível otimização: inline script no `<head>` que lê localStorage e aplica classe.
