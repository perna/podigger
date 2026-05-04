# frontend-features, Contratos

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Contratos externos e internos da unit `frontend-features` (componentes de feature, contextos, hooks, API client, middleware).
> Esta unit **consome** contratos HTTP externos (chamadas para `${API_BASE}/api/...`) e expõe contratos internos (componentes, hooks, contextos) para outros módulos do frontend.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão geral

A unit `frontend-features` é a **camada de interação do frontend**. Ela:

- ✅ **Consome** 3 endpoints HTTP do backend Django (via `lib/api.ts`):
  - `GET /api/episodes/?q=&page=`
  - `GET /api/podcasts/?search=&page=`
  - `POST /api/podcasts/`
- ✅ **Consome** 1 endpoint local Next.js (via `Navbar.handleLogout`):
  - `POST /api/auth/logout` (route handler em `frontend-pages`)
- ✅ **Consome** cookies `HttpOnly` (lidos pelo `middleware.ts`)
- ✅ **Persiste** dados em `localStorage` (chave `podigger-theme`)
- ✅ **Expõe** contratos internos (componentes React, hooks, contextos) consumidos por `frontend-pages` e outros módulos
- ❌ Não publica mensagens em filas
- ❌ Não define RPC/gRPC services
- ❌ Não emite webhooks
- ❌ Não usa WebSockets

Os contratos HTTP consumidos estão documentados no backend (`_reversa_sdd/podcasts/contracts.md`, `_reversa_sdd/accounts/contracts.md`) — esta spec foca nos **aspectos client-side** (props TypeScript, types exportados, contrato de cookies, shape de responses).

---

## Contratos externos consumidos (HTTP)

### Contrato 1: `GET ${API_BASE}/api/episodes/`

**Origem:** `frontend/src/lib/api.ts:44-62` (`fetchEpisodes`)

| Aspecto | Valor |
|---------|-------|
| URL | `${API_BASE}/api/episodes/` |
| Método | GET |
| Query params | `q` (opcional, `string` trimada), `page` (opcional, `number > 1`) |
| Auth | Não enviado pelo cliente (cookie HttpOnly é gerenciado pelo browser) |
| Content-Type | N/A (GET sem body) |
| Status codes esperados | 200, 4xx, 5xx |
| Erro | `throw new Error('API error: {status}')` em !ok |

**Response esperada (200):**

```ts
interface EpisodesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Episode[];
}

interface Episode {
  id: number;
  title: string;
  link: string;
  description: string | null;
  published: string | null;
  enclosure: string | null;
  podcast: {
    id: number;
    name: string;
    image: string | null;
  };
  tags: { id: number; name: string; }[];
}
```

**Exemplo de request:**

```http
GET /api/episodes/?q=python&page=2 HTTP/1.1
Host: localhost:8000
Cookie: access_token=eyJ...; refresh_token=eyJ...
```

**Exemplo de response (200):**

```json
{
  "count": 47,
  "next": "http://localhost:8000/api/episodes/?q=python&page=3",
  "previous": "http://localhost:8000/api/episodes/?q=python&page=1",
  "results": [
    {
      "id": 1,
      "title": "Python in Production",
      "link": "https://example.com/episode/1",
      "description": "Discussion about deploying Python apps...",
      "published": "2025-01-15T10:00:00Z",
      "enclosure": "https://example.com/episode/1.mp3",
      "podcast": { "id": 5, "name": "Dev Talk", "image": "https://..." },
      "tags": [{ "id": 1, "name": "python" }, { "id": 2, "name": "devops" }]
    }
  ]
}
```

**Comportamento do cliente:**

- `query=''` ou `undefined` → omite `q` da URL
- `page=1` (default) → omite `page` da URL
- `page>1` → inclui `page={n}` na URL
- `!response.ok` → `throw new Error(\`API error: ${response.status}\`)`
- Response é parseada com `response.json()` e tipada como `EpisodesResponse`

**CORS / cookies:**

- O frontend roda em `http://localhost:3000` (dev) ou atrás de Nginx (prod).
- O backend Django está em `http://localhost:8000` (dev) ou atrás de Nginx.
- Cookies são **same-origin via proxy Nginx em produção** (frontend em `app.podigger.app`, backend em `api.podigger.app`).
- Em dev, cookies são **cross-origin** e o backend precisa ter `CORS_ALLOW_CREDENTIALS=True` + `CORS_ALLOWED_ORIGINS=['http://localhost:3000']`.

🟢 **Documentação oficial do backend:** `_reversa_sdd/podcasts/contracts.md` (RF-POD-01) e `_reversa_sdd/podcasts/requirements.md`.

---

### Contrato 2: `GET ${API_BASE}/api/podcasts/`

**Origem:** `frontend/src/lib/api.ts:64-82` (`fetchPodcasts`)

| Aspecto | Valor |
|---------|-------|
| URL | `${API_BASE}/api/podcasts/` |
| Método | GET |
| Query params | `search` (opcional, `string` trimada), `page` (opcional, `number > 1`) |
| Auth | Cookie HttpOnly do browser |
| Status codes esperados | 200, 4xx, 5xx |
| Erro | `throw new Error('API error: {status}')` em !ok |

**Response esperada (200):**

```ts
interface PodcastsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Podcast[];
}

interface Podcast {
  id: number;
  name: string;
  feed: string;
  image: string | null;
  language: number | null;
  total_episodes: number;
}
```

**Diferença do Contrato 1:** o param é `search` (não `q`).

**Exemplo de request:**

```http
GET /api/podcasts/?search=python HTTP/1.1
Host: localhost:8000
```

**Exemplo de response (200):**

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "name": "Python in Production",
      "feed": "https://feeds.example.com/python.rss",
      "image": "https://cdn.example.com/python.jpg",
      "language": 1,
      "total_episodes": 47
    }
  ]
}
```

🟢 **Documentação oficial do backend:** `_reversa_sdd/podcasts/contracts.md` (RF-POD-05).

---

### Contrato 3: `POST ${API_BASE}/api/podcasts/`

**Origem:** `frontend/src/lib/api.ts:90-108` (`addPodcast`)

| Aspecto | Valor |
|---------|-------|
| URL | `${API_BASE}/api/podcasts/` |
| Método | POST |
| Headers | `Content-Type: application/json` |
| Body | `{ name: string, feed: string }` |
| Auth | Cookie HttpOnly do browser |
| Status codes esperados | 201, 400, 401, 403, 5xx |
| Erro | `throw new Error(errorData.message \|\| \`API error: ${status}\`)` |

**Response esperada (201):**

```ts
interface AddPodcastResponse {
  id?: number;
  status: 'created' | 'existing' | 'error';
  message?: string;
}
```

**Exemplo de request:**

```http
POST /api/podcasts/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Cookie: access_token=eyJ...

{ "name": "New Show", "feed": "https://feeds.example.com/new.rss" }
```

**Exemplo de response (201):**

```json
{
  "id": 42,
  "status": "created",
  "message": "Podcast cadastrado com sucesso!"
}
```

**Exemplo de response (400 — erro de validação):**

```json
{
  "message": "Feed URL is invalid"
}
```

**Comportamento do cliente em erro:**

```ts
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || `API error: ${response.status}`);
}
```

🟢 **Documentação oficial do backend:** `_reversa_sdd/podcasts/contracts.md` (RF-POD-04).

> 🔴 **Atenção (R-FF-54):** `addPodcast` faz POST **direto** para `${API_BASE}/api/podcasts/`, **sem passar pelo proxy `/api/proxy/`** (definido em `frontend-pages`). O auto-refresh de JWT do proxy **não funciona** para esta chamada. Se o `access_token` expirar entre o mount e o click, o usuário recebe 401 sem retry transparente. **Mitigação:** refatorar para `/api/proxy/podcasts/` (T-48).

---

### Contrato 4: `POST /api/auth/logout` (Next.js Route Handler local)

**Origem:** `frontend/src/components/layout/Navbar.tsx:34` (`handleLogout`)

| Aspecto | Valor |
|---------|-------|
| URL | `/api/auth/logout` (relativo, mesmo host do frontend) |
| Método | POST |
| Body | Nenhum |
| Auth | Cookie HttpOnly (presente automaticamente) |
| Status codes esperados | 200 |
| Comportamento do cliente | try/catch silencioso — sucesso ou falha chama `logout()` + `router.push('/')` |

**Response esperada (200):**

```ts
// Backend limpa cookies:
Set-Cookie: access_token=; Max-Age=0; Path=/; HttpOnly
Set-Cookie: refresh_token=; Max-Age=0; Path=/api/auth/token/refresh/; HttpOnly

// Body:
{ "success": true }
```

**Exemplo de request (do Navbar):**

```ts
await fetch('/api/auth/logout', { method: 'POST' });
```

> 🟢 **Documentação oficial:** `_reversa_sdd/frontend-pages/contracts.md` (RF-RH-06).

---

## Contratos externos consumidos (Cookies)

### Cookie: `access_token` (HttpOnly)

| Aspecto | Valor |
|---------|-------|
| Nome | `access_token` |
| HttpOnly | ✅ (não acessível via `document.cookie`) |
| SameSite | `Lax` (default do backend) |
| Path | `/` (válido para todo o frontend) |
| Lifetime | 5 minutos (configurado em `config/settings.py`) |
| Set por | Backend Django no login/refresh |
| Lido por | `frontend/src/middleware.ts` (Edge, verifica presença) |

**Uso no Edge Middleware:**

```ts
const accessToken = request.cookies.get('access_token');
if (!accessToken) {
  // Redirect para /auth/unauthorized
}
```

> 🔴 **Atenção:** O middleware **NÃO decodifica** o JWT, apenas verifica presença. A validação real do token acontece no backend Django em cada request.

---

### Cookie: `refresh_token` (HttpOnly, path-restricted)

| Aspecto | Valor |
|---------|-------|
| Nome | `refresh_token` |
| HttpOnly | ✅ |
| SameSite | `Lax` |
| Path | `/api/auth/token/refresh/` (enviado apenas para esse endpoint) |
| Lifetime | 24 horas (configurado em `config/settings.py`) |
| Set por | Backend Django no login |
| Lido por | Route Handler `/api/auth/refresh` (em `frontend-pages`) — **NÃO** por `frontend-features` |

> ✅ **Não é responsabilidade desta unit.** O fluxo de refresh é gerenciado por `frontend-pages` (proxy `/api/proxy/...` com auto-refresh).

---

## Contratos internos exportados

> Mudanças incompatíveis aqui são breaking changes para todo o app.

### 1. `useAuth` (hook + types)

```ts
// Import
import { useAuth, AuthProvider, AuthState, AuthContext } from '@/contexts/AuthContext';

// Types exportados
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

// Hook
export function useAuth(): AuthContextValue;
// Throws: Error('useAuth must be used within an AuthProvider') se fora do Provider
```

**Caller contract:**

- O caller **deve** estar dentro de `<AuthProvider>` (registrado em `RootLayout`).
- `login(role, email)` é client-side puro — **NÃO** chama API. O caller real (LoginForm em `frontend-pages`) chama `login()` após o route handler `/api/auth/login` retornar sucesso.
- `logout()` é client-side puro — **NÃO** chama API. O caller real (Navbar) chama `fetch('/api/auth/logout', POST)` antes de `logout()`.
- `useAuth()` em componentes de UI deve ler `user.role` para gates (ex: `<AddPodcast />` em `frontend-pages`).

🟢 **Consumidores conhecidos:**

- `frontend/src/components/layout/Navbar.tsx` (mostra Login/Logout)
- `frontend/src/app/add-podcast/page.tsx` (gate por role)
- `frontend/src/app/auth/forbidden/page.tsx` (mostra role label)

---

### 2. `useTheme` (hook)

```ts
// Import
import { useTheme, ThemeProvider } from '@/components/providers/ThemeProvider';

// Types
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// Hook
export function useTheme(): ThemeContextValue;
```

**Caller contract:**

- O caller **deve** estar dentro de `<ThemeProvider>` (registrado em `RootLayout`).
- Se usado fora do Provider, retorna o default `{theme: 'dark', toggleTheme: () => {}}` (sem throw).
- `toggleTheme` alterna `dark ↔ light`; o `useEffect` interno aplica a classe em `<html>` e persiste em `localStorage['podigger-theme']`.

🟢 **Consumidores conhecidos:**

- `frontend/src/components/layout/Navbar.tsx` (botão theme toggle)

---

### 3. `HomeClient` (componente)

```ts
// Import
import { HomeClient } from '@/components/home/HomeClient';

// Sem props
export function HomeClient(): JSX.Element;
```

**Caller contract:**

- Usado em `frontend/src/app/page.tsx` (RSC wrapper que retorna `<HomeClient />`).
- Cliente puro — depende de `EpisodeList`, `SearchHero`, `PodcastCard`, `FAB`, `BottomNav`, `LoadingSpinner`, `fetchPodcasts` (`lib/api`).
- Renderiza `min-h-dvh` na raiz.

---

### 4. `EpisodeList` (componente)

```ts
// Import
import { EpisodeList } from '@/components/home/EpisodeList';

interface EpisodeListProps {
  searchTerm: string;
  onLoadingChange?: (loading: boolean) => void;
}

export function EpisodeList(props: EpisodeListProps): JSX.Element;
```

**Caller contract:**

- `searchTerm` é **controlado** (não tem default). Caller decide quando muda.
- `onLoadingChange` é opcional — caller recebe `true` quando fetch inicial começa, `false` quando termina.
- `EpisodeList` faz `setPage(1) + load(searchTerm, 1, false)` sempre que `searchTerm` muda. Caller não precisa controlar page state.
- Caller pode passar mesma referência de `onLoadingChange` (com `useCallback`) para evitar re-fires.

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx`

---

### 5. `SearchHero` (componente)

```ts
// Import
import { SearchHero } from '@/components/search/SearchHero';

interface SearchHeroProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export function SearchHero(props: SearchHeroProps): JSX.Element;
```

**Caller contract:**

- `query` é o valor atual do input (controlled).
- `onQueryChange` é chamado a cada keystroke.
- `onSearch` é chamado em (1) Enter no input, (2) click no Button. Caller decide o que fazer (ex: trim, fetch).
- `isSearching` mostra spinner no Button.

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx`

---

### 6. `PodcastCard` (componente)

```ts
// Import
import { PodcastCard } from '@/components/podcasts/PodcastCard';

interface PodcastCardProps { podcast: Podcast; }
export function PodcastCard(props: PodcastCardProps): JSX.Element;
```

**Caller contract:**

- Recebe `Podcast` (de `lib/api.ts`).
- Renderiza link para `/podcasts/{podcast.id}` (rota **não implementada** — gera 404 hoje).
- Caller é responsável por fornecer `Podcast.image` (ou null para placeholder).

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx` (no grid de resultados)

---

### 7. `EpisodeCard` (mobile-large)

```ts
// Import
import { EpisodeCard } from '@/components/home/EpisodeCard';

interface EpisodeCardProps { episode: Episode; }
export function EpisodeCard(props: EpisodeCardProps): JSX.Element;
```

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/EpisodeList.tsx` (variante mobile)

---

### 8. `EpisodeCardCompact` (desktop)

```ts
// Import
import { EpisodeCardCompact } from '@/components/episodes/EpisodeCardCompact';

interface EpisodeCardCompactProps { episode: Episode; }
export function EpisodeCardCompact(props: EpisodeCardCompactProps): JSX.Element;
```

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/EpisodeList.tsx` (variante desktop)

---

### 9. `EmptyState` (componente)

```ts
// Import
import { EmptyState } from '@/components/home/EmptyState';

interface EmptyStateProps {
  type: 'no-results' | 'no-episodes' | 'error';
  query?: string;
  onRetry?: () => void;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
```

**Caller contract:**

- `type='no-results'` → exige `query` (mostra "Nenhum resultado para {query}")
- `type='no-episodes'` → sem `query`
- `type='error'` → exige `onRetry` (mostra botão Retry)

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/EpisodeList.tsx` (3 estados)

---

### 10. `BottomNav` (componente)

```ts
// Import
import { BottomNav } from '@/components/home/BottomNav';

interface BottomNavProps {
  activeItem?: 'home' | 'search' | 'library' | 'settings';
}

export function BottomNav(props: BottomNavProps): JSX.Element;
```

**Caller contract:**

- Caller controla qual item está ativo via `activeItem`.
- Items `library` e `settings` têm `href='#'` — caller precisa implementar se quiser navegação real.
- Caller é responsável pelo wrapper responsive (`<div className="md:hidden">`).

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx` (com `md:hidden`)

---

### 11. `Navbar` (componente)

```ts
// Import
import { Navbar } from '@/components/layout/Navbar';

// Sem props
export function Navbar(): JSX.Element;
```

**Caller contract:**

- Usado em `RootLayout` (em `frontend-pages`) — aparece em todas as páginas.
- Consome `useTheme` e `useAuth` — caller **deve** estar dentro de `ThemeProvider` + `AuthProvider`.
- Sticky top com `z-50` — caller não precisa wrappear.

🟢 **Consumidores conhecidos:**

- `frontend/src/app/layout.tsx`

---

### 12. `FAB` (componente)

```ts
// Import
import { FAB } from '@/components/common/FAB';

// Sem props
export function FAB(): JSX.Element;
```

**Caller contract:**

- Placeholder — sem props, sem onClick.
- Caller pode wrappear para adicionar onClick (`<button onClick={...}><FAB/></button>`) se quiser ação custom.

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx`

---

### 13. `SearchHeader` (mobile, **código morto**)

```ts
// Import (NÃO FUNCIONA — não é importado em runtime)
import { SearchHeader } from '@/components/home/SearchHeader';
```

**Caller contract:**

- ⚠️ **Não importar.** Este componente é código morto. Tem testes (que passam) mas não é usado em nenhuma página.

🔴 **Status:** candidato a remoção (T-51).

---

### 14. `fetchEpisodes`, `fetchPodcasts`, `addPodcast` (API client)

```ts
// Import
import {
  fetchEpisodes,
  fetchPodcasts,
  addPodcast,
  type Episode,
  type EpisodesResponse,
  type Podcast,
  type PodcastsResponse,
  type AddPodcastResponse,
} from '@/lib/api';

export async function fetchEpisodes(
  query?: string,
  page?: number,  // default 1
): Promise<EpisodesResponse>;

export async function fetchPodcasts(
  query?: string,
  page?: number,  // default 1
): Promise<PodcastsResponse>;

export async function addPodcast(
  name: string,
  feed: string,
): Promise<AddPodcastResponse>;
```

**Caller contract:**

- Caller **NÃO** precisa passar `access_token` — o cookie HttpOnly é gerenciado pelo browser.
- Caller deve estar preparado para `throw new Error('API error: ...')` em qualquer falha HTTP.
- `addPodcast` **NÃO** passa pelo proxy `/api/proxy/` — auto-refresh não funciona (R-FF-54).
- `fetchEpisodes` usa param `q`; `fetchPodcasts` usa param `search` (inconsistência conhecida).

🟢 **Consumidores conhecidos:**

- `frontend/src/components/home/HomeClient.tsx` (`fetchPodcasts`)
- `frontend/src/components/home/EpisodeList.tsx` (`fetchEpisodes`)
- `frontend/src/app/add-podcast/page.tsx` (`addPodcast`)

---

### 15. Utilitários `cn`, `formatDuration`, `formatDate`

```ts
// Import
import { cn, formatDuration, formatDate } from '@/lib/utils';

export function cn(...inputs: ClassValue[]): string;
export function formatDuration(seconds: number): string;
export function formatDate(date: string | Date): string;
```

**Caller contract:**

- `cn` aceita qualquer combinação de `string | false | null | undefined | ClassArray` (do `clsx`).
- `formatDuration(NaN)` retorna `'0:00'` (edge case).
- `formatDate(null | '')` retorna `''` (edge case).
- `formatDate` usa locale `pt-BR` hardcoded.

🟢 **Consumidores conhecidos:**

- `frontend/src/components/episodes/EpisodeCardCompact.tsx` (`formatRelativeTime` inline — **deveria** usar `formatDate`)
- `frontend/src/components/layout/Navbar.tsx` (`cn`)

---

### 16. Constantes `APP_VERSION`, `SOCIAL_LINKS`

```ts
// Import
import { APP_VERSION, SOCIAL_LINKS } from '@/lib/constants';

export const APP_VERSION: string;  // env var ou '1.2.0'
export const SOCIAL_LINKS: {
  readonly twitter: string;
  readonly github: string;
  readonly discord: string;  // '#'
  readonly email: string;    // 'mailto:support@podigger.app'
};
```

🟢 **Consumidores conhecidos:**

- `frontend/src/app/about/components/SocialLinks.tsx` (em `frontend-pages`)

---

### 17. Edge Middleware

```ts
// Não importado — Next.js detecta automaticamente via arquivo em `src/middleware.ts`.
// Exporta:
export function middleware(request: NextRequest): NextResponse;
export const config: { matcher: string[] };  // ['/add-podcast', '/admin/:path*']
```

**Caller contract:**

- Next.js invoca automaticamente em toda request que casa o matcher.
- Caller (Navegador) recebe 302 redirect ou `NextResponse.next()`.

🟢 **Configurado em:** `frontend/src/middleware.ts:1-31`.

---

## Resumo de contratos

| Tipo | Direção | Quantidade | Path/Componente |
|------|---------|-----------|-----------------|
| Endpoints HTTP consumidos | Saída (do cliente) | 3 (Django) + 1 (Next.js) | `/api/episodes/`, `/api/podcasts/` (GET + POST), `/api/auth/logout` |
| Cookies lidos | Entrada | 1 | `access_token` (via middleware) |
| Cookies persistidos | Saída | 1 | `podigger-theme` (localStorage) |
| Componentes exportados | — | 11 (10 ativos + 1 morto) | `HomeClient`, `EpisodeList`, `EpisodeCard`, `SearchHero`, `PodcastCard`, `EpisodeCardCompact`, `EmptyState`, `BottomNav`, `Navbar`, `FAB`, `SearchHeader` (morto) |
| Hooks exportados | — | 2 | `useAuth`, `useTheme` |
| Contextos exportados | — | 1 | `AuthContext` (AuthContext exportado mas tipicamente usado via hook) |
| Providers exportados | — | 2 | `AuthProvider`, `ThemeProvider` |
| Funções de API client | — | 3 | `fetchEpisodes`, `fetchPodcasts`, `addPodcast` |
| Types exportados | — | 7 | `Episode`, `EpisodesResponse`, `Podcast`, `PodcastsResponse`, `AddPodcastResponse`, `AuthState` |
| Utilitários | — | 3 | `cn`, `formatDuration`, `formatDate` |
| Constantes | — | 2 | `APP_VERSION`, `SOCIAL_LINKS` |
| Middleware | — | 1 | `middleware` (Edge, com `config.matcher`) |
| Filas (Celery/RQ/SQS) | — | 0 | — |
| RPC / gRPC | — | 0 | — |
| WebSockets | — | 0 | — |
| Webhooks | — | 0 | — |

---

## Matriz de Rastreabilidade: Tipos Exportados vs Consumidores

| Tipo/Símbolo | Exportado de | Consumido por | Risco de breaking change |
|--------------|--------------|---------------|--------------------------|
| `useAuth` | `contexts/AuthContext.tsx` | Navbar, AddPodcastPage, ForbiddenPage, LoginForm | 🟢 Estável (uso bem-definido) |
| `useTheme` | `providers/ThemeProvider.tsx` | Navbar | 🟢 Estável |
| `HomeClient` | `components/home/HomeClient.tsx` | `app/page.tsx` | 🟢 Estável (sem props) |
| `EpisodeList` | `components/home/EpisodeList.tsx` | HomeClient | 🟢 Estável (props frozen) |
| `SearchHero` | `components/search/SearchHero.tsx` | HomeClient | 🟢 Estável |
| `PodcastCard` | `components/podcasts/PodcastCard.tsx` | HomeClient | 🟢 Estável |
| `EpisodeCard` | `components/home/EpisodeCard.tsx` | EpisodeList | 🟢 Estável |
| `EpisodeCardCompact` | `components/episodes/EpisodeCardCompact.tsx` | EpisodeList | 🟢 Estável |
| `EmptyState` | `components/home/EmptyState.tsx` | EpisodeList | 🟢 Estável |
| `BottomNav` | `components/home/BottomNav.tsx` | HomeClient | 🟢 Estável |
| `Navbar` | `components/layout/Navbar.tsx` | RootLayout | 🟢 Estável (sem props) |
| `FAB` | `components/common/FAB.tsx` | HomeClient | 🟢 Estável (sem props) |
| `fetchEpisodes` | `lib/api.ts` | EpisodeList | 🟢 Estável (assinatura congelada) |
| `fetchPodcasts` | `lib/api.ts` | HomeClient | 🟢 Estável |
| `addPodcast` | `lib/api.ts` | AddPodcastPage | 🔴 Conhecido gap (R-FF-54) |
| `Episode`, `Podcast`, etc. | `lib/api.ts` | Múltiplos | 🟢 Estável (mirror do backend) |
| `cn`, `formatDuration`, `formatDate` | `lib/utils.ts` | Múltiplos | 🟢 Estável |
| `APP_VERSION`, `SOCIAL_LINKS` | `lib/constants.ts` | About page | 🟢 Estável |

---

> Spec `frontend-features/contracts.md` concluída. Unit `frontend-features/` completa.
