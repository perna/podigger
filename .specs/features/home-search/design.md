# Home Page com Busca — Design

**Spec**: `.specs/features/home-search/spec.md`
**Status**: Draft

---

## Architecture Overview

A home page é uma Server Component que renderiza o layout; a busca e a lista de episódios são Client Components que fazem fetch à API e gerenciam estado local (query, resultados, paginação, loading).

```mermaid
graph TD
    subgraph Page
        A[HomePage] --> B[SearchHeader]
        A --> C[EpisodeList]
        A --> D[BottomNav]
    end
    
    B -->|query + onSearch| C
    C -->|fetch| E[API /api/episodes]
    C --> F[EpisodeCard]
    C --> G[EmptyState]
    C --> H[LoadingMore]
    E -->|episodes[]| C
```

**Fluxo:**
1. Mount: `EpisodeList` chama `GET /api/episodes/` (recentes)
2. Search: usuário digita, clica Search → `EpisodeList` recebe `query`, chama `GET /api/episodes/?q=termo`
3. Paginate: scroll chega ao fim → `GET /api/episodes/?q=...&page=N`, append à lista

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component   | Location                    | How to Use                                                                 |
| ----------- | --------------------------- | -------------------------------------------------------------------------- |
| Button      | `src/components/ui/Button.tsx`  | Search button (variant primary), Play (primary/sm), link ghost              |
| Input       | `src/components/ui/Input.tsx`   | Search input — ajustar estilo para wrapper com ícone (border, focus-within) |
| Card        | `src/components/ui/Card.tsx`    | Base do EpisodeCard — `hoverable` para hover                                |
| Icon        | `src/components/ui/Icon.tsx`    | search, rss_feed, play_arrow, account_circle, arrow_forward_ios             |
| Loading     | `src/components/ui/Loading.tsx` | LoadingSpinner no botão Search; Skeleton ou spinner em "Loading more"       |
| utils (cn)  | `src/lib/utils.ts`              | className merge em todos os componentes                                    |

### Integration Points

| System         | Integration Method                                                                 |
| -------------- | ---------------------------------------------------------------------------------- |
| Django API     | `fetch(process.env.NEXT_PUBLIC_API_URL + '/api/episodes/?q=...&page=...')`          |
| Design tokens  | `globals.css` — primary, background-dark, surface-dark, muted-dark, radius-*        |
| Layout         | `layout.tsx` — font-display, dark mode já aplicado                                 |

---

## Components

### SearchHeader

- **Purpose**: Header sticky com logo, input de busca, botão Search e abas de filtro (P2).
- **Location**: `src/components/home/SearchHeader.tsx`
- **Interfaces**:
  - `query: string` — valor do input (controlled)
  - `onQueryChange: (v: string) => void`
  - `onSearch: () => void`
  - `isSearching?: boolean` — desabilita botão e mostra loading
  - `activeTab?: 'all' | 'latest' | 'popular'` (P2)
  - `onTabChange?: (tab) => void` (P2)
- **Dependencies**: Button, Input, Icon
- **Reuses**: Button (primary, isLoading), Input (placeholder "Episodes, podcasts, or RSS..."), Icon (search, rss_feed, account_circle)
- **Layout**: Baseado em `code.html` — logo + título central + avatar; input com ícone search à esquerda; botão Search; abas horizontais scroll

### EpisodeCard

- **Purpose**: Card de episódio com imagem, título, podcast, descrição, Play e View Podcast.
- **Location**: `src/components/home/EpisodeCard.tsx`
- **Interfaces**:
  - `episode: Episode` — dados do episódio
  - `podcastName: string` — nome do podcast (backdoor para API atual)
  - `podcastImage?: string | null` — imagem do podcast
  - `duration?: string | null` — formato "42:15" (P3)
- **Dependencies**: Card, Button, Icon
- **Reuses**: Card (hoverable), Button (primary para Play, ghost para link)
- **Layout**: Imagem 16/9, badge duração (canto inferior direito), título, podcast name (uppercase, primary), descrição line-clamp-2, ações Play + View Podcast

### EpisodeList

- **Purpose**: Lista paginada de episódios, empty state e loading.
- **Location**: `src/components/home/EpisodeList.tsx`
- **Interfaces**:
  - `initialQuery?: string` — query inicial (URL ou state)
  - `initialEpisodes?: Episode[]` — SSR opcional (P2)
- **Dependencies**: EpisodeCard, EmptyState, Loading
- **Reuses**: Loading (LoadingSpinner no "Loading more")
- **State**: `episodes`, `hasMore`, `page`, `isLoading`, `error`, `query`
- **Logic**: fetch em `useEffect` quando `query` ou `page` muda; IntersectionObserver ou botão "Carregar mais" para próxima página

### EmptyState

- **Purpose**: Mensagem quando não há episódios ou erro.
- **Location**: `src/components/home/EmptyState.tsx`
- **Interfaces**:
  - `type: 'no-results' | 'no-episodes' | 'error'`
  - `query?: string` — para "Nenhum episódio encontrado para X"
  - `onRetry?: () => void` — para erro
- **Dependencies**: Icon (opcional)
- **Reuses**: Estilos do design system

### BottomNav

- **Purpose**: Navegação inferior fixa (Home, Search, Library, Settings).
- **Location**: `src/components/home/BottomNav.tsx`
- **Interfaces**:
  - `activeItem?: 'home' | 'search' | 'library' | 'settings'`
- **Dependencies**: Icon, Link (Next.js)
- **Reuses**: Icon (home, search, library_music, settings)
- **Layout**: iOS-style, `fixed bottom-0`, padding para safe area

### HomePage (Page)

- **Purpose**: Compor SearchHeader, EpisodeList e BottomNav; gerenciar query em estado.
- **Location**: `src/app/page.tsx`
- **Interfaces**: Nenhum (page)
- **Dependencies**: SearchHeader, EpisodeList, BottomNav
- **State**: `query` (string), `searchTrigger` (para forçar busca ao clicar Search)

---

## Data Models

### Episode (frontend)

```typescript
interface Episode {
  id: number
  title: string
  link: string
  description: string | null
  published: string | null  // ISO date
  enclosure: string | null
  podcast: number           // ID — backend retorna só isso; precisa de podcastName
  tags: { id: number; name: string }[]
}
```

### API Response (paginated)

```typescript
interface EpisodesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Episode[]
}
```

**Backend adjustment:** O `EpisodeSerializer` retorna `podcast` como ID. Para exibir o nome no card sem N+1, duas opções:

1. **Nested serializer (recomendado):** Incluir `PodcastListSerializer` ou `{ id, name, image }` no EpisodeSerializer quando usado para listagem/busca.
2. **Campo derivado:** Adicionar `podcast_name` via `SerializerMethodField` ou `Prefetch` + annotate.

---

## Error Handling Strategy

| Error Scenario        | Handling                         | User Impact                                  |
| --------------------- | -------------------------------- | -------------------------------------------- |
| Rede / timeout        | try/catch no fetch, set error    | EmptyState type="error" + botão Retry        |
| API 4xx/5xx           | checar response.ok               | EmptyState type="error" + mensagem genérica  |
| Query vazia no Search | tratar como "recentes"           | GET /api/episodes/ sem q                     |
| Sem episódios         | EmptyState type="no-results" ou "no-episodes" | Mensagem contextual                         |

---

## Tech Decisions

| Decision            | Choice                         | Rationale                                          |
| ------------------- | ------------------------------ | -------------------------------------------------- |
| Client vs Server    | Client Components para busca   | Precisa de estado e fetch; page pode ser Server    |
| Paginação           | "Load more" ou IntersectionObserver | Simples; API já retorna `next`                   |
| Podcast name        | Ajuste no backend              | Evita N chamadas extras por episódio               |
| Responsividade      | Mobile-first, max-w-2xl        | Alinhado ao layout de referência                   |
| Abas de filtro      | P2                             | API atual não expõe ordering por popularidade      |

---

## File Structure

```
frontend/src/
├── app/
│   └── page.tsx                 # HomePage
├── components/
│   ├── home/
│   │   ├── SearchHeader.tsx
│   │   ├── EpisodeCard.tsx
│   │   ├── EpisodeList.tsx
│   │   ├── EmptyState.tsx
│   │   └── BottomNav.tsx
│   └── ui/                      # existentes
└── lib/
    └── api.ts                   # fetchEpisodes(q?, page?)
```

---

## Responsive Notes

- **Mobile:** Layout do `code.html` — header compacto, cards em coluna, bottom nav
- **Desktop:** Manter max-w-2xl centralizado; possivelmente header mais largo com search bar maior (ref. `podigger_desktop_search_home_1` — seções Trending/Premium são P2+)
