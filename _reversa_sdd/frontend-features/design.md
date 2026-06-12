# frontend-features, Design Técnico

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: componentes de feature do frontend Next.js (clientes HTTP, contextos, hooks, infinite scroll, theme/auth, middleware Edge)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Interface

### Componentes exportados — `home/`

#### `HomeClient` (Client Component)

```ts
export function HomeClient(): JSX.Element;
```

**Estado interno (5 useState):**

| Nome | Tipo | Inicial | Propósito |
|------|------|---------|-----------|
| `query` | `string` | `''` | Texto atual do input do `SearchHero` (controlled input) |
| `searchTerm` | `string` | `''` | Termo confirmado (Enter/click). Dispara fetch de podcasts e propaga para `EpisodeList` |
| `isSearching` | `boolean` | `false` | Loading do `EpisodeList` (via `onLoadingChange`) |
| `podcasts` | `Podcast[]` | `[]` | Resultado de `fetchPodcasts` |
| `isSearchingPodcasts` | `boolean` | `false` | Loading de `fetchPodcasts` |

**Callbacks:**

```ts
const handleSearch = useCallback(async () => { ... }, [query]);
const handleLoadingChange = useCallback((loading: boolean) => { ... }, []);
```

**Composição JSX (ordem):**

1. `<SearchHero query={query} onQueryChange={setQuery} onSearch={handleSearch} isSearching={...} />`
2. `<div className="max-w-7xl mx-auto px-4 pb-20">`
   - `<div className="flex flex-col lg:flex-row gap-8">`
     - `<main className="flex-1 min-w-0">`
       - Section de Podcasts (condicional `searchTerm`)
       - Section de Episodes (sempre) com `EpisodeList`
     - `<aside className="hidden lg:block">` (sidebar)
3. `<div className="md:hidden"><BottomNav activeItem="search" /></div>` (mobile-only)
4. `<FAB />` (sempre)

---

#### `EpisodeList` (Client Component)

```ts
interface EpisodeListProps {
  searchTerm: string;
  onLoadingChange?: (loading: boolean) => void;
}
export function EpisodeList({ searchTerm, onLoadingChange }: EpisodeListProps): JSX.Element;
```

**Estado interno (5 useState + 1 useRef):**

| Nome | Tipo | Inicial | Propósito |
|------|------|---------|-----------|
| `episodes` | `Episode[]` | `[]` | Lista acumulada de todas as páginas |
| `page` | `number` (setter) | `1` | Página atual (page state via `useState` setter callback) |
| `hasMore` | `boolean` | `true` | `!!res.next` da última response |
| `isLoading` | `boolean` | `true` | Loading inicial ou reset |
| `isLoadingMore` | `boolean` | `false` | Loading de paginação |
| `error` | `Error \| null` | `null` | Erro capturado |
| `loadMoreRef` | `RefObject<HTMLDivElement>` | `null` | Ref para o div sentinela do `IntersectionObserver` |

**Lógica de fetch:**

```ts
const load = useCallback(
  async (q: string, pageNum: number, append: boolean) => {
    const trimmed = q.trim();
    try {
      if (append) setIsLoadingMore(true);
      else { setIsLoading(true); onLoadingChange?.(true); }
      setError(null);
      const res = await fetchEpisodes(trimmed || undefined, pageNum);
      if (append) setEpisodes(prev => [...prev, ...res.results]);
      else setEpisodes(res.results);
      setHasMore(!!res.next);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar'));
      if (!append) setEpisodes([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      onLoadingChange?.(false);
    }
  },
  [onLoadingChange]
);
```

**Effects:**

```ts
// Mount + searchTerm change → reset page + load page 1
useEffect(() => {
  setPage(1);
  load(searchTerm, 1, false);
}, [searchTerm, load]);

// Infinite scroll via IntersectionObserver
useEffect(() => {
  if (!hasMore || isLoading || isLoadingMore) return;
  const el = loadMoreRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        setPage(p => {
          load(searchTerm, p + 1, true);
          return p + 1;
        });
      }
    },
    { rootMargin: '100px', threshold: 0 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, [hasMore, isLoading, isLoadingMore, searchTerm, load]);
```

**Renderização condicional (em ordem):**

1. `isLoading` → `<LoadingSpinner size-10 text-primary />` centralizado
2. `error` → `<EmptyState type="error" onRetry={() => load(searchTerm, 1, false)} />`
3. `episodes.length === 0` → `<EmptyState type={searchTerm ? 'no-results' : 'no-episodes'} query={...} />`
4. Default → grid (md+) com `EpisodeCardCompact` + lista (mobile) com `EpisodeCard` + sentinela `<div ref={loadMoreRef}>` se `hasMore`

---

#### `EpisodeCard` (mobile-large)

```ts
interface EpisodeCardProps { episode: Episode; }
export function EpisodeCard({ episode }: EpisodeCardProps): JSX.Element;
```

**Estrutura:**

- `<article>` com hero image 16:9 (SVG placeholder data URI inline se `episode.podcast.image == null`)
- Play button (anchor para `episode.enclosure || episode.link`) com `<Icon name="play_arrow" />`
- View podcast link para `/podcasts/{episode.podcast.id}` (404 hoje)

---

#### `SearchHeader` (mobile, **código morto**)

```ts
export function SearchHeader({ ... }: SearchHeaderProps): JSX.Element;
```

**Status:** código morto. Tem tabs (All/Latest/Popular/Short Clips) e testes passam, mas **não é importado por ninguém em runtime**. Mantido para preservar cobertura de testes até decisão de remoção.

---

#### `BottomNav`

```ts
interface BottomNavProps { activeItem?: 'home' | 'search' | 'library' | 'settings'; }
export function BottomNav({ activeItem = 'search' }: BottomNavProps): JSX.Element;
```

**Items (hardcoded array):**

| Label | href | Icon | activeItem value |
|-------|------|------|------------------|
| `Home` | `/` | `home` | `'home'` |
| `Search` | `/` | `search` | `'search'` |
| `Library` | `#` | `library_music` | `'library'` |
| `Settings` | `#` | `settings` | `'settings'` |

**Render:** fixed bottom em mobile-only (caller aplica `md:hidden`). Item ativo: text-primary. Outros: text-slate-500.

---

#### `EmptyState`

```ts
interface EmptyStateProps {
  type: 'no-results' | 'no-episodes' | 'error';
  query?: string;
  onRetry?: () => void;
}
export function EmptyState({ type, query, onRetry }: EmptyStateProps): JSX.Element;
```

**Switch por type (map em objeto):**

| Type | Icon | Title | Description | Action |
|------|------|-------|-------------|--------|
| `no-results` | `search_off` | `No results found` | `We couldn't find anything for "{query}". Try different keywords.` | none |
| `no-episodes` | `podcasts` | `No episodes yet` | `Episodes will appear here once podcasts are added.` | none |
| `error` | `error_outline` | `Something went wrong` | `We couldn't load the episodes. Please try again.` | `<Button onClick={onRetry}>Retry</Button>` |

---

### Componentes exportados — `search/`

#### `SearchHero`

```ts
interface SearchHeroProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
}
export function SearchHero({ query, onQueryChange, onSearch, isSearching }: SearchHeroProps): JSX.Element;
```

**Estrutura:**

- `<section>` desktop-only
- Título `<h1>`: `Search millions of episodes`
- Subtítulo: `Discover podcasts from around the world. Find episodes by topic, host, or guest.`
- `<Input value={query} onChange={e => onQueryChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()} />`
- `<Button variant="primary" size="md" isLoading={isSearching} onClick={onSearch}>Search</Button>`

**Comportamento:** `onSearch` dispara em (1) Enter no input, (2) click no Button.

---

### Componentes exportados — `podcasts/`

#### `PodcastCard`

```ts
interface PodcastCardProps { podcast: Podcast; }
export function PodcastCard({ podcast }: PodcastCardProps): JSX.Element;
```

**Estrutura:**

- `<Link>` envolvendo o card, vai para `/podcasts/{podcast.id}`
- Imagem `<img>` size 20-24 (placeholder se null)
- `<h3>` com `podcast.name` (line-clamp-1)
- `<p>` com `podcast.total_episodes === 1 ? '1 episode' : '{N} episodes'`
- `<span>` "View details →"

---

### Componentes exportados — `episodes/`

#### `EpisodeCardCompact` (desktop)

```ts
interface EpisodeCardCompactProps { episode: Episode; }
export function EpisodeCardCompact({ episode }: EpisodeCardCompactProps): JSX.Element;
```

**Estrutura:**

- `<article>` em grid 1/2 colunas (xl:)
- Thumbnail size 16-20 (esquerda)
- Body:
  - `<span>` com `episode.podcast.name` (uppercase, text-xs, text-slate-500)
  - `<h3>` com `episode.title` (line-clamp-2)
  - `<p>` com `episode.description` (line-clamp-2)
  - `<span>` com `formatRelativeTime(episode.published)` (helper inline)
- Actions:
  - Play button (anchor para `episode.enclosure`)
  - View podcast link

**Helper inline:**

```ts
function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  // ... Intl.RelativeTimeFormat ou implementação custom
}
```

---

### Componentes exportados — `layout/`

#### `Navbar`

```ts
export function Navbar(): JSX.Element;
```

**Estado:** nenhum próprio. Consome `usePathname`, `useRouter`, `useTheme`, `useAuth`.

**Comportamento:**

- Sticky top, z-50, blur backdrop, border-b
- Logo `Podigger` (link `/`)
- Desktop nav: `Search` (`/`), `About` (`/about`), + `Add Podcast` (`/add-podcast`) se `isAuthenticated && user.role ∈ {editor, admin}`
- Right actions:
  - Theme toggle button (com `aria-label` dinâmico)
  - Se `isAuthenticated && user`: badge de role + Logout button
  - Senão: Login link
  - Hamburger (mobile-only, sem onClick)

**Logout handler:**

```ts
const handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Silencioso
  }
  logout();
  router.push('/');
};
```

---

### Componentes exportados — `providers/`

#### `ThemeProvider` + `useTheme`

```ts
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useTheme(): ThemeContextValue;
```

**Default context (caso usado fora do Provider):**

```ts
{ theme: 'dark', toggleTheme: () => {} }
```

**Inicialização lazy de `useState<Theme>`:**

```ts
useState<Theme>(() => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('podigger-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
});
```

**Effect de aplicação:**

```ts
useEffect(() => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  localStorage.setItem('podigger-theme', theme);
}, [theme]);
```

**Toggle:**

```ts
const toggleTheme = useCallback(() => {
  setTheme(prev => prev === 'dark' ? 'light' : 'dark');
}, []);
```

> **Nota técnica:** O componente usa `<ThemeContext value={...}>` (React 19 syntax) em vez do legacy `<ThemeContext.Provider value={...}>`.

---

### Componentes exportados — `common/`

#### `FAB`

```ts
export function FAB(): JSX.Element;
```

**Estrutura:**

- `<button>` fixed bottom-right
- Classes: `fixed bottom-6 right-6 z-40 bg-primary text-background-dark size-14 rounded-full shadow-2xl ...`
- `<Icon name="rss_feed" opticalSize={24} />`
- `aria-label="Add RSS feed"`
- **Sem `onClick`** — placeholder visual

---

### Contextos — `contexts/`

#### `AuthContext` + `AuthProvider` + `useAuth`

```ts
export interface AuthState {
  user: { email: string; role: 'admin' | 'editor' | 'reader' } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (role: 'admin' | 'editor' | 'reader', email: string) => void;
  logout: () => void;
  setUser: (user: { email: string; role: 'admin' | 'editor' | 'reader' } | null) => void;
}

export const AuthContext: React.Context<AuthContextValue | null>;
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
```

**Estado:**

- `user: AuthState['user']` (useState, inicial `null`)
- `isLoading: false` (constante, sem setter)
- `isAuthenticated = user !== null` (derived)

**Operações (todas client-side, sem chamada de API):**

```ts
const login = (role, email) => setUserState({ email, role });
const logout = () => setUserState(null);
const setUser = (newUser) => setUserState(newUser);
```

**Guard:**

```ts
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

### Lib — `lib/api.ts`

```ts
export interface Episode {
  id: number;
  title: string;
  link: string;
  description: string | null;
  published: string | null;
  enclosure: string | null;
  podcast: { id: number; name: string; image: string | null; };
  tags: { id: number; name: string; }[];
}

export interface EpisodesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Episode[];
}

export interface Podcast {
  id: number;
  name: string;
  feed: string;
  image: string | null;
  language: number | null;
  total_episodes: number;
}

export interface PodcastsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Podcast[];
}

export interface AddPodcastResponse {
  id?: number;
  status: 'created' | 'existing' | 'error';
  message?: string;
}

export async function fetchEpisodes(query?: string, page?: number): Promise<EpisodesResponse>;
export async function fetchPodcasts(query?: string, page?: number): Promise<PodcastsResponse>;
export async function addPodcast(name: string, feed: string): Promise<AddPodcastResponse>;
```

**`API_BASE` resolução:**

```ts
const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

> **Atenção:** O ternário é simétrico (mesmo valor em ambos os ramos). `typeof window !== 'undefined'` guard existe mas é desnecessário — `process.env.NEXT_PUBLIC_*` é resolvido em build time.

**`fetchEpisodes`:**

```ts
export async function fetchEpisodes(query?: string, page = 1): Promise<EpisodesResponse> {
  const params = new URLSearchParams();
  const trimmed = query?.trim();
  if (trimmed) params.set('q', trimmed);
  if (page > 1) params.set('page', String(page));
  const url = `${API_BASE}/api/episodes/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
```

**`fetchPodcasts`:** mesmo padrão, mas param `search` em vez de `q`:

```ts
if (trimmed) params.set('search', trimmed);
```

**`addPodcast`:**

```ts
export async function addPodcast(name: string, feed: string): Promise<AddPodcastResponse> {
  const url = `${API_BASE}/api/podcasts/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, feed }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
}
```

> **Atenção (R-FF-54):** `addPodcast` faz POST **direto** para `${API_BASE}/api/podcasts/`, **sem passar pelo proxy `/api/proxy/`** (definido em `frontend-pages`). Consequência: auto-refresh do JWT não funciona para esta chamada. Se o `access_token` expirar entre o mount e o click, o usuário recebe 401 sem retry transparente.

---

### Lib — `lib/utils.ts`

```ts
export function cn(...inputs: ClassValue[]): string;
export function formatDuration(seconds: number): string;
export function formatDate(date: string | Date): string;
```

**`cn`:** `twMerge(clsx(inputs))` — combina classes condicionais com resolução de conflitos Tailwind.

**`formatDuration`:**

```ts
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
```

**`formatDate`:**

```ts
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
```

---

### Lib — `lib/constants.ts`

```ts
export const APP_VERSION: string;  // process.env.NEXT_PUBLIC_APP_VERSION ?? '1.2.0'
export const SOCIAL_LINKS: {
  twitter: string;
  github: string;
  discord: string;  // '#'
  email: string;    // 'mailto:support@podigger.app'
};
```

---

### Middleware — `src/middleware.ts`

```ts
export function middleware(request: NextRequest): NextResponse;
export const config: { matcher: string[] };
```

**Implementação:**

```ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/unauthorized';
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/add-podcast', '/admin/:path*'],
};
```

**Comportamento:**

- Lê `access_token` cookie via `request.cookies.get('access_token')`
- **NÃO decodifica o JWT** — apenas verifica presença
- Ausente → 302 redirect para `/auth/unauthorized?next={encodeURIComponent(pathname+search)}`
- Presente → `NextResponse.next()`

**Matcher explícito:**

- `/add-podcast` (rota exata)
- `/admin/:path*` (qualquer sub-rota de `/admin`)

> **Nota:** O middleware não tem acesso ao React context (`AuthContext`); lê o cookie diretamente porque está no Edge runtime.

---

## Fluxo Principal

### Fluxo 1: Usuário busca "python" na home

1. Usuário digita "python" no `<SearchHero>` → `onQueryChange("python")` → `setQuery("python")` no `HomeClient`.
2. Usuário pressiona Enter no input → `onKeyDown` dispara `onSearch()` → `handleSearch()`.
3. `handleSearch` faz `trim` → `setSearchTerm("python")` → `setIsSearchingPodcasts(true)`.
4. `await fetchPodcasts("python")` → `GET ${API_BASE}/api/podcasts/?search=python` → backend Django retorna `PodcastsResponse`.
5. Em sucesso: `setPodcasts(res.results)`, `setIsSearchingPodcasts(false)`.
6. Renderização:
   - Grid de podcasts aparece (condicional `searchTerm`)
   - `<EpisodeList searchTerm="python" onLoadingChange={...}>` remonta lógica via `useEffect`
   - `EpisodeList.load("python", 1, false)` → `fetchEpisodes("python", 1)` → `GET ${API_BASE}/api/episodes/?q=python` → `setEpisodes(res.results)`
7. Título da seção Episodes: `Episodes for "python"`.

**Origem no legado:** `frontend/src/components/home/HomeClient.tsx:19-37` + `frontend/src/components/home/EpisodeList.tsx:24-58` + `frontend/src/lib/api.ts:64-82`.

---

### Fluxo 2: Infinite scroll no EpisodeList

1. `EpisodeList` montou com `episodes=[ep1..ep10]`, `hasMore=true`, `page=1`.
2. `useEffect([hasMore, isLoading, isLoadingMore, searchTerm])` cria `IntersectionObserver` no `loadMoreRef` div.
3. Usuário rola a página. Quando `loadMoreRef` fica visível (`rootMargin: '100px'`), observer dispara.
4. `setPage(p => { load(searchTerm, p + 1, true); return p + 1; })` → `page=2`, `load("python", 2, true)`.
5. `load` faz `setIsLoadingMore(true)`, `await fetchEpisodes("python", 2)`, `setEpisodes(prev => [...prev, ...res.results])`.
6. Render: novos episódios aparecem, `<LoadingSpinner size-8 />` aparece em `isLoadingMore`.
7. Se `res.next == null`, `setHasMore(false)` → observer não dispara mais. `<div ref={loadMoreRef}>` desaparece.

**Origem no legado:** `frontend/src/components/home/EpisodeList.tsx:60-78`.

---

### Fluxo 3: Theme switching (toggle no Navbar)

1. `Navbar` consome `useTheme()` → `{theme: 'dark', toggleTheme}`.
2. Usuário clica no theme toggle button.
3. `toggleTheme` é chamado → `setTheme(prev => prev === 'dark' ? 'light' : 'dark')`.
4. `useEffect([theme])` em `ThemeProvider` dispara:
   - `document.documentElement.classList.remove('light', 'dark')`
   - `document.documentElement.classList.add(theme)` → classe `light` ou `dark` aplicada
   - `localStorage.setItem('podigger-theme', theme)`
5. Componentes que usam variantes `dark:` do Tailwind re-renderizam com novos estilos.

**Origem no legado:** `frontend/src/components/providers/ThemeProvider.tsx:40-49` + `frontend/src/components/layout/Navbar.tsx:80-90`.

---

### Fluxo 4: Logout (defense in depth)

1. Usuário clica "Logout" no `<Navbar>` (visível apenas se `isAuthenticated && user`).
2. `handleLogout` async é chamado.
3. `await fetch('/api/auth/logout', { method: 'POST' })` — route handler (em `frontend-pages`) limpa cookies localmente com `Set-Cookie Max-Age=0`. Falha é silenciada.
4. `logout()` do `useAuth()` → `setUserState(null)` no `AuthContext`.
5. `router.push('/')` → navega para home.
6. Render:
   - `Navbar` re-renderiza: agora mostra `Login` link (não Logout) e remove `+ Add Podcast`.
   - `useAuth()` em outros componentes retorna `user=null`, `isAuthenticated=false`.

**Origem no legado:** `frontend/src/components/layout/Navbar.tsx:32-40` + `frontend/src/contexts/AuthContext.tsx:32-34`.

---

### Fluxo 5: Middleware bloqueia /add-podcast sem cookie

1. Usuário anônimo acessa `GET /add-podcast`.
2. Edge Middleware (`middleware.ts`) intercepta (matcher `/add-podcast`).
3. `request.cookies.get('access_token')` → `undefined`.
4. Constrói URL de redirect: `pathname='/auth/unauthorized'`, `searchParams.set('next', '/add-podcast')`.
5. `NextResponse.redirect(url)` → 302 para `/auth/unauthorized?next=%2Fadd-podcast`.
6. Browser segue o redirect → renderiza `UnauthorizedPage` (em `frontend-pages`).
7. `UnauthorizedPage` lê `useSearchParams().get('next')` → gera link para `/login?next=%2Fadd-podcast`.

**Origem no legado:** `frontend/src/middleware.ts:13-24`.

---

### Fluxo 6: Theme inicial (decisão lazy)

1. `ThemeProvider` monta. `useState<Theme>` é lazy.
2. SSR (ou test sem window): `typeof window === 'undefined'` → return `'dark'`.
3. Client com `localStorage.podigger-theme = 'light'` → return `'light'`.
4. Client sem localStorage mas `prefers-color-scheme: light` → return `'light'`.
5. Client sem localStorage e `prefers-color-scheme: dark` (default SO) → return `'dark'`.
6. `useEffect([theme])` aplica classe em `<html>`.

**Origem no legado:** `frontend/src/components/providers/ThemeProvider.tsx:28-45`.

---

## Fluxos Alternativos

- **API error em `fetchEpisodes`:** `EpisodeList.load` captura o throw, seta `error`, limpa `episodes` (se não for append), renderiza `<EmptyState type="error" onRetry={...}>`. Retry chama `load(searchTerm, 1, false)` novamente.
- **API error em `fetchPodcasts`:** `HomeClient.handleSearch` captura no try/catch, faz `console.error`, `setPodcasts([])`. **Não mostra EmptyState** — apenas some o grid de podcasts.
- **Trim vazio em busca:** `HomeClient.handleSearch` faz early-return `setPodcasts([])` sem chamar API. `EpisodeList` também lida com `searchTerm=''` (passa `undefined` para `fetchEpisodes`, que omite `q` da URL).
- **Sem resultados em `fetchPodcasts`:** `podcasts.length === 0` → renderiza `<p>No podcasts found for "{searchTerm}".</p>`.
- **Sem resultados em `fetchEpisodes`:** `episodes.length === 0` → `<EmptyState type={searchTerm ? 'no-results' : 'no-episodes'} query={...} />`.
- **Logout falha no fetch:** `Navbar.handleLogout` silencia o erro, ainda chama `logout()` e `router.push('/')`. UX é "logout funcionou localmente, mesmo se o backend não respondeu".
- **`useAuth()` fora do Provider:** throws `Error('useAuth must be used within an AuthProvider')`. Falha em dev/test, não em produção (Provider sempre no RootLayout).
- **Theme FOUC no SSR:** HTML é renderizado com `theme='dark'` (default do SSR), depois o `useEffect` aplica o tema real. Há um flash visível. Mitigação possível: inline script no `<head>`.

---

## Dependências

### Internas (mesmo projeto)

| Dependência | Módulo | Como usa |
|-------------|--------|----------|
| `Button`, `Card`, `Input`, `Badge`, `Icon`, `LoadingSpinner` | `frontend-ui` | Componentes primitivos |
| `cn`, `formatDuration`, `formatDate` | `frontend-ui/lib/utils` | Utility helpers |
| `NextResponse`, `NextRequest` | Next.js (Edge runtime) | Middleware |
| `useRouter`, `usePathname` | next/navigation | Routing client-side |
| `Link` | next/link | Client-side links |
| `IntersectionObserver` | Browser API | Infinite scroll |

### Externas

| Dependência | Versão | Como usa |
|-------------|--------|----------|
| `react` | `^19.2.1` | `useState`, `useEffect`, `useCallback`, `useRef`, `useContext` |
| `next` | `16.2.3` | App Router, Middleware, Navigation, Link |
| `clsx` | (via `lib/utils`) | Conditional class composition |
| `tailwind-merge` | (via `lib/utils`) | Conflict resolution de classes Tailwind |
| `material-symbols-rounded` | font | Iconografia em todo o frontend |
| `process.env.NEXT_PUBLIC_API_URL` | env var | URL do backend Django |

### Backend (HTTP)

| Endpoint | Método | Onde é chamado | Ver |
|----------|--------|----------------|-----|
| `/api/episodes/?q=&page=` | GET | `lib/api.fetchEpisodes` | `lib/api.ts:44-62` |
| `/api/podcasts/?search=&page=` | GET | `lib/api.fetchPodcasts` | `lib/api.ts:64-82` |
| `/api/podcasts/` | POST | `lib/api.addPodcast` (direto, sem proxy) | `lib/api.ts:90-108` |
| `/api/auth/logout` | POST | `Navbar.handleLogout` (route handler local) | `Navbar.tsx:32-40` |

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| **`HomeClient` é o único orquestrador da home** — sem state lifting para RSC | `HomeClient.tsx` é `'use client'`; sem store global (Redux/Zustand) | 🟢 |
| **`AuthContext` é client-side puro** — não sincroniza com cookies, depende do caller setar `login()` após sucesso do backend | `AuthContext.tsx:22-45`; comentário em `middleware.ts` "This middleware cannot access React context" | 🟢 |
| **`middleware.ts` verifica apenas presença do cookie**, sem decodificar JWT | `middleware.ts:13-24` | 🟢 |
| **Infinite scroll via `IntersectionObserver`** com `rootMargin: '100px'` para prefetch | `EpisodeList.tsx:65-78` | 🟢 |
| **`fetchEpisodes` usa param `q`**, `fetchPodcasts` usa `search` — inconsistência de naming | `lib/api.ts:51, 71` | 🟢 |
| **`addPodcast` faz POST direto** ao backend, sem passar pelo proxy `/api/proxy/` | `lib/api.ts:90-108` | 🟢 |
| **Theme é persistido em `localStorage`** com chave `podigger-theme` | `ThemeProvider.tsx:30, 44` | 🟢 |
| **Theme é client-only** — `useEffect` aplica classe em `<html>` (causa FOUC) | `ThemeProvider.tsx:40-45` | 🟢 |
| **`SearchHeader` é código morto** — não importado por ninguém, testes passam | `SearchHeader.tsx` + grep imports | 🟢 |
| **Dois EpisodeCards diferentes** (`EpisodeCard` mobile-large + `EpisodeCardCompact` desktop) | `components/home/EpisodeCard.tsx` + `components/episodes/EpisodeCardCompact.tsx` | 🟢 |
| **API client sem cache layer** — sem SWR/React Query | `lib/api.ts` (sem state caching) | 🟡 |
| **`FAB` é placeholder** sem onClick | `FAB.tsx` (sem prop onClick) | 🟢 |
| **Theme padrão é dark** se nenhuma fonte disponível | `ThemeProvider.tsx:37` | 🟢 |
| **Cookie de auth é a fonte real de sessão**; contexto apenas para display | `AuthContext.tsx` (sem decoder JWT) + cookies HttpOnly no backend | 🟢 |
| **`EpisodeList` decide variantes de card por breakpoint** (`md+` vs `md:hidden`) | `EpisodeList.tsx:104-115` | 🟢 |
| **`formatRelativeTime` em `EpisodeCardCompact` é helper inline** — não exportado | `EpisodeCardCompact.tsx` | 🟢 |
| **Auth state não persiste em `localStorage`** — apenas in-memory (perde no refresh) | `AuthContext.tsx:23` | 🟢 |
| **Retry em `EpisodeList` reseta paginação** — perde dados já carregados | `EpisodeList.tsx:89` | 🟢 |
| **Theme toggle tem `aria-label` dinâmico** para acessibilidade | `Navbar.tsx:84` | 🟢 |
| **`IntersectionObserver` com `threshold: 0`** — qualquer pixel visível dispara | `EpisodeList.tsx:74` | 🟢 |

---

## Estado Interno

| Componente | Estado | Persistência |
|------------|--------|--------------|
| `HomeClient` | `query`, `searchTerm`, `isSearching`, `podcasts`, `isSearchingPodcasts` | in-memory (perde no refresh) |
| `EpisodeList` | `episodes`, `page` (setter), `hasMore`, `isLoading`, `isLoadingMore`, `error` | in-memory (perde no refresh) |
| `ThemeProvider` | `theme: 'light' \| 'dark'` | `localStorage["podigger-theme"]` |
| `AuthProvider` | `user: {email, role} \| null`, `isLoading: false` | in-memory apenas (cookie HttpOnly é a fonte real) |
| `Navbar` | nenhum próprio | consome contextos |

---

## Observabilidade

| Componente | Log | Métrica | Trace |
|------------|-----|---------|-------|
| `HomeClient.handleSearch` | `console.error('Error searching podcasts:', err)` em catch | — | — |
| `EpisodeList.load` | erro capturado em `error` state, renderizado via `<EmptyState>` | — | — |
| `lib/api.ts` | nenhum log próprio (errors são throws) | — | — |
| `ThemeProvider` | nenhum log | — | — |
| `AuthContext` | nenhum log | — | — |
| `middleware.ts` | nenhum log (Edge runtime) | — | — |
| `Navbar.handleLogout` | silencioso (try/catch) | — | — |

> **Gap:** módulo não emite logs estruturados nem métricas. Para troubleshooting de fetch errors, é necessário olhar o DevTools Network tab.

---

## Riscos e Lacunas

- 🔴 **`addPodcast` sem proxy (R-FF-54):** POST direto ao backend ignora `/api/proxy/`, então auto-refresh do JWT (em `frontend-pages`) não funciona. Usuário recebe 401 transparente após 5min de sessão.
- 🔴 **`AuthContext` sem decoder JWT (R-FF-51):** se caller esquece de chamar `login()` após sucesso do backend, contexto fica `null` mesmo com cookie válido.
- 🔴 **Race condition em `EpisodeList` (R-FF-43):** mudança de `searchTerm` durante fetch pode resolver com dados antigos. Sem `AbortController`.
- 🔴 **Theme FOUC (R-FF-44):** flash de tema dark antes do `useEffect` aplicar o real. Mitigação: inline script no `<head>`.
- 🔴 **Inconsistência EN/PT-BR (R-FF-55):** `EmptyState` em inglês, `SearchHero` em inglês, `HomeClient` mistura os dois. UI geral é PT-BR.
- 🔴 **Retry duplica fetch (R-FF-53):** click em `EmptyState.onRetry` chama `load(...)` mas `useEffect([searchTerm])` também re-dispara.
- 🔴 **`formatRelativeTime` inline (R-FF-56):** em `EpisodeCardCompact`. Não exportado, dificulta reuso. DRY violation.
- 🟡 **`lib/api.ts` sem cache layer:** cada componente faz seu próprio fetch. Sem deduplicação.
- 🟡 **`SearchHeader` código morto:** candidato a remoção. Tem testes (que passam) mas não é importado.
- 🟡 **Inconsistência de naming `q` vs `search`:** entre `fetchEpisodes` e `fetchPodcasts`. Vem do DRF backend.
- 🟡 **`EpisodeList` perde dados no retry:** retry chama `load(searchTerm, 1, false)` — reseta paginação.
- 🟡 **`HomeClient` mistura 2 fetch states:** `isSearching` (do `EpisodeList`) e `isSearchingPodcasts` (do `fetchPodcasts`). Sincronização manual no `onLoadingChange`.
- 🟡 **Auth state não persiste:** refresh do browser perde o `user` do contexto. Cookie continua válido, mas UI mostra "Login".
- 🟡 **Navbar hamburger sem menu:** visual placeholder. Sem implementação.
- 🟡 **PodcastCard link para rota 404:** `/podcasts/${id}` não implementada.
- 🟡 **`useState(page)` setter usado apenas para trigger** — valor de `page` nunca é lido diretamente. Anti-pattern menor.
- 🟡 **`ThemeProvider` usa `<ThemeContext value={...}>` (React 19)** — quebra compatibilidade com React 18.

---

> Spec `frontend-features/design.md` concluída. Próximo arquivo da unit: `tasks.md`.
