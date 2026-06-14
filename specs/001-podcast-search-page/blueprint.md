# Blueprint: Página de Busca de Podcasts

**Branch**: `001-podcast-search-page` | **Date**: 2026-06-12
**Mode**: doc-only
**Total Tasks**: 29 | **Files**: 10 new, 3 modified, 0 deleted

## Key Decisions

- Route is `/search` in English, not `/busca` → T004, T008
- Traditional page-based pagination (not infinite scroll), page_size=10 → T018, T019
- Dual parallel API calls via `Promise.allSettled` → T008
- AbortController for request cancellation on rapid submissions → T008
- URL state sync via `useSearchParams` + `useRouter` with unified `?q=&tab=&page=` scheme → T008, T015, T019
- Tab switching filters locally (no API recall), page resets to 1 on tab change → T015
- Min 2-character query validation on frontend, button disabled for < 2 chars → T005
- Max 8 popular terms displayed as clickable chips → T022, T023
- Per-section error states (not global) with retry buttons → T008
- No backend changes — all APIs already exist → T002

## Implementation Order

```
Setup (T001, T002)
  └── Foundational (T003 ║ T004)
        └── US1 (T005 ║ T006 ║ T007) → T008 → T009 ║ T010 ║ T011 ║ T012 → T013
              ├── US2 (T014 ║ T016) → T015 → T017
              ├── US3 (T018 ║ T020) → T019 → T021
              └── US4 (T022 ║ T024) → T023 → T025
                    └── Polish (T026, T027, T028, T029)
```

---

## Phase 1: Setup (Shared Infrastructure)

### T001: Create route and component directories

**File**: `frontend/src/app/search/` and `frontend/src/components/search/` (new)

**Dependencies**: None

Create two directories:

```bash
mkdir -p frontend/src/app/search
mkdir -p frontend/src/components/search
```

**Verification**: Directories exist and are empty.

---

### T002: Add fetchPopularTerms() to api.ts

**File**: `frontend/src/lib/api.ts` (modify)

**Requirements**: FR-006

**Dependencies**: None

**Before** (line 117):
```ts
export async function fetchPodcast(id: number): Promise<PodcastDetail> {
  const url = `${API_BASE}/api/podcasts/${id}/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
```

**After**:
```ts
export interface PopularTerm {
  term: string;
  times: number;
}

export async function fetchPopularTerms(): Promise<PopularTerm[]> {
  const url = `${API_BASE}/api/popular-terms/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data: PopularTerm[] = await response.json();
  return Array.isArray(data) ? data.slice(0, 8) : [];
}

export async function fetchPodcast(id: number): Promise<PodcastDetail> {
  const url = `${API_BASE}/api/podcasts/${id}/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
```

**Verification**: `fetchPopularTerms()` resolves to an array of `{ term, times }` objects, capped at 8.

---

## Phase 2: Foundational (Blocking Prerequisites)

### T003: Define TypeScript types for search state and URL params

**File**: `frontend/src/lib/api.ts` (modify)

**Requirements**: FR-010

**Dependencies**: T002

**Before** (line 122, after T002 additions):
```ts
export async function fetchPodcast(id: number): Promise<PodcastDetail> {
```

**After**:
```ts
export type TabValue = 'todos' | 'podcasts' | 'episodios';

export interface SearchPageState {
  q: string;
  tab: TabValue;
  page: number;
}

export async function fetchPodcast(id: number): Promise<PodcastDetail> {
```

**Verification**: `TabValue` and `SearchPageState` types are exported from api.ts.

---

### T004: Create server component page.tsx (initial placeholder)

**File**: `frontend/src/app/search/page.tsx` (new)

**Requirements**: FR-001

**Dependencies**: T001

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscar – Podigger',
  description: 'Busque podcasts e episódios no Podigger.',
};

export default function SearchPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

**Verification**: Accessing `/search` renders a spinner. Page has correct metadata.

---

## Phase 3: User Story 1 — Buscar podcasts e episódios por termo (P1)

### Pre-completed Tasks

None — all tasks in this phase produce new work.

---

### T005: Create SearchInput component

**File**: `frontend/src/components/search/SearchInput.tsx` (new)

**Requirements**: FR-001, FR-001a, FR-011

**Dependencies**: T001

```tsx
'use client';

import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export function SearchInput({
  query,
  onQueryChange,
  onSearch,
  isSearching = false,
}: SearchInputProps) {
  const isValid = query.trim().length >= 2;

  return (
    <section className="max-w-2xl mx-auto px-4 pt-10 pb-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
        Buscar
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-base md:text-lg">
        Encontre podcasts e episódios por nome, título ou descrição.
      </p>
      <div className="relative group max-w-2xl mx-auto">
        <div className="flex items-center bg-white dark:bg-surface-dark-hover rounded-full shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 ring-primary transition-all p-1">
          <div className="pl-4 text-slate-400 shrink-0">
            <Icon name="search" opticalSize={24} />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValid && onSearch()}
            placeholder="Buscar podcasts ou episódios..."
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white px-4 py-2 md:py-3 text-base md:text-lg placeholder:text-slate-400"
            aria-label="Buscar podcasts ou episódios"
          />
          <Button
            variant="primary"
            onClick={onSearch}
            disabled={!isValid}
            isLoading={isSearching}
            className="rounded-full px-6 md:px-8 py-2 md:py-3 whitespace-nowrap"
          >
            Buscar
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**Verification**: Input field renders. Enter triggers search only when query >= 2 chars. Button disabled for < 2 chars. Button shows loading state via `isSearching`.

---

### T006: Create PodcastResults component

**File**: `frontend/src/components/search/PodcastResults.tsx` (new)

**Requirements**: FR-003

**Dependencies**: T001

```tsx
'use client';

import type { Podcast } from '@/lib/api';
import { PodcastCard } from '@/components/podcasts/PodcastCard';
import { LoadingSpinner } from '@/components/ui/Loading';

interface PodcastResultsProps {
  podcasts: Podcast[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function PodcastResults({
  podcasts,
  isLoading,
  error,
  onRetry,
}: PodcastResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner className="size-8 text-primary" />
        <p className="text-slate-400 text-sm mt-3">Buscando podcasts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">
          Erro ao buscar podcasts.
        </p>
        <button
          onClick={onRetry}
          className="text-primary text-sm font-semibold hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Nenhum podcast encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
}
```

**Verification**: Renders podcast cards from array. Shows loading spinner during load. Shows error + retry button on error. Shows empty message when array is empty.

---

### T007: Create EpisodeResults component

**File**: `frontend/src/components/search/EpisodeResults.tsx` (new)

**Requirements**: FR-003, FR-008

**Dependencies**: T001

```tsx
'use client';

import type { Episode } from '@/lib/api';
import { EpisodeCard } from '@/components/home/EpisodeCard';
import { LoadingSpinner } from '@/components/ui/Loading';

interface EpisodeResultsProps {
  episodes: Episode[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  emptyMessage: string;
}

export function EpisodeResults({
  episodes,
  isLoading,
  error,
  onRetry,
  emptyMessage,
}: EpisodeResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner className="size-8 text-primary" />
        <p className="text-slate-400 text-sm mt-3">Buscando episódios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">
          Erro ao buscar episódios.
        </p>
        <button
          onClick={onRetry}
          className="text-primary text-sm font-semibold hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500 dark:text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {episodes.map((episode) => (
        <EpisodeCard key={episode.id} episode={episode} />
      ))}
    </div>
  );
}
```

**Verification**: Renders episode cards from array. Shows loading spinner. Shows error + retry. Shows configurable empty message.

---

### T008: Create SearchPageClient component (core search)

**File**: `frontend/src/app/search/SearchPageClient.tsx` (new)

**Requirements**: FR-001, FR-002, FR-002a, FR-008, FR-009, FR-010, FR-011, FR-012

**Dependencies**: T005, T006, T007

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  fetchEpisodes,
  fetchPodcasts,
  type Episode,
  type Podcast,
} from '@/lib/api';
import { SearchInput } from '@/components/search/SearchInput';
import { PodcastResults } from '@/components/search/PodcastResults';
import { EpisodeResults } from '@/components/search/EpisodeResults';

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('q') ?? '');
  const [isSearching, setIsSearching] = useState(false);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [podcastError, setPodcastError] = useState<Error | null>(null);
  const [episodeError, setEpisodeError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasSearched = useRef(false);

  const search = useCallback(
    async (term: string) => {
      const trimmed = term.trim();

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setIsSearching(true);
      setPodcastError(null);
      setEpisodeError(null);

      const [podcastResult, episodeResult] = await Promise.allSettled([
        fetchPodcasts(trimmed || undefined, 1),
        fetchEpisodes(trimmed || undefined, 1),
      ]);

      if (signal.aborted) return;

      setIsSearching(false);

      if (podcastResult.status === 'fulfilled') {
        setPodcasts(podcastResult.value.results);
      } else {
        setPodcastError(podcastResult.reason instanceof Error ? podcastResult.reason : new Error('Erro ao buscar podcasts'));
        setPodcasts([]);
      }

      if (episodeResult.status === 'fulfilled') {
        setEpisodes(episodeResult.value.results);
      } else {
        setEpisodeError(episodeResult.reason instanceof Error ? episodeResult.reason : new Error('Erro ao buscar episódios'));
        setEpisodes([]);
      }
    },
    []
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    params.delete('page');
    router.replace(`/search?${params.toString()}`, { scroll: false });

    search(trimmed);
    hasSearched.current = true;
  }, [query, searchParams, router, search]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasSearched.current) {
      setQuery(q);
      setSubmittedQuery(q);
      search(q);
      hasSearched.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const noResults = !isSearching && !podcastError && !episodeError && podcasts.length === 0 && episodes.length === 0 && submittedQuery !== '';

  return (
    <div className="min-h-screen pb-20">
      <SearchInput
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      <div className="max-w-7xl mx-auto px-4">
        {isSearching && podcasts.length === 0 && episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-4">Buscando...</p>
          </div>
        ) : noResults ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Nenhum resultado encontrado para &ldquo;{submittedQuery}&rdquo;.
            </p>
          </div>
        ) : (
          <>
            {podcasts.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Podcasts
                </h2>
                <PodcastResults
                  podcasts={podcasts}
                  isLoading={false}
                  error={podcastError}
                  onRetry={() => search(submittedQuery)}
                />
              </section>
            )}

            {episodes.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Episódios
                </h2>
                <EpisodeResults
                  episodes={episodes}
                  isLoading={false}
                  error={episodeError}
                  onRetry={() => search(submittedQuery)}
                  emptyMessage={
                    episodeError ? '' : 'Nenhum episódio encontrado.'
                  }
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

**Verification**: Access `/search`, type "python", press Enter. Both podcast and episode results render grouped. Loading spinner shows during search. Empty state shows when no results. Error state shows per-section retry. URL updates to `/search?q=python`. Direct URL access auto-searches.

---

### T009: Update page.tsx to render SearchPageClient with Suspense

**File**: `frontend/src/app/search/page.tsx` (modify)

**Requirements**: FR-001

**Dependencies**: T008

**Replace entire file**:

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageClient } from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Buscar – Podigger',
  description: 'Busque podcasts e episódios no Podigger.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
```

**Verification**: SearchPageClient renders inside Suspense boundary. Fallback spinner shows during initial load.

---

### T010: Create unit tests for SearchInput

**File**: `frontend/tests/components/search/SearchInput.test.tsx` (new)

**Requirements**: FR-001a, FR-011

**Dependencies**: T005

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/search/SearchInput';

describe('SearchInput', () => {
  it('renders input and button', () => {
    render(<SearchInput query="" onQueryChange={() => {}} onSearch={() => {}} />);
    expect(screen.getByPlaceholderText('Buscar podcasts ou episódios...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('disables button when query is less than 2 characters', () => {
    render(<SearchInput query="a" onQueryChange={() => {}} onSearch={() => {}} />);
    const button = screen.getByRole('button', { name: /buscar/i });
    expect(button).toBeDisabled();
  });

  it('enables button when query has 2 or more characters', () => {
    render(<SearchInput query="py" onQueryChange={() => {}} onSearch={() => {}} />);
    const button = screen.getByRole('button', { name: /buscar/i });
    expect(button).not.toBeDisabled();
  });

  it('enables button when query has leading/trailing whitespace that trims to >= 2 chars', () => {
    render(<SearchInput query="  py  " onQueryChange={() => {}} onSearch={() => {}} />);
    const button = screen.getByRole('button', { name: /buscar/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onQueryChange when input changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput query="" onQueryChange={handleChange} onSearch={() => {}} />);
    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'p');
    expect(handleChange).toHaveBeenCalledWith('p');
  });

  it('calls onSearch when Enter is pressed with valid query', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput query="python" onQueryChange={() => {}} onSearch={handleSearch} />);
    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, '{Enter}');
    expect(handleSearch).toHaveBeenCalled();
  });

  it('does not call onSearch when Enter is pressed with query < 2 chars', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput query="a" onQueryChange={() => {}} onSearch={handleSearch} />);
    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, '{Enter}');
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch when button is clicked with valid query', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput query="python" onQueryChange={() => {}} onSearch={handleSearch} />);
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(handleSearch).toHaveBeenCalled();
  });

  it('shows loading state on button when isSearching is true', () => {
    render(<SearchInput query="python" onQueryChange={() => {}} onSearch={() => {}} isSearching={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(within(button).queryByText(/buscar/i)).not.toBeInTheDocument();
  });
});
```

**Verification**: All 9 test cases pass with `vitest`.

---

### T011: Create unit tests for PodcastResults

**File**: `frontend/tests/components/search/PodcastResults.test.tsx` (new)

**Requirements**: FR-003

**Dependencies**: T006

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PodcastResults } from '@/components/search/PodcastResults';
import type { Podcast } from '@/lib/api';

const mockPodcasts: Podcast[] = [
  {
    id: 1,
    name: 'Tech Brasil',
    feed: 'https://example.com/feed.xml',
    image: 'https://example.com/img.jpg',
    language: 1,
    total_episodes: 42,
  },
  {
    id: 2,
    name: 'Python Weekly',
    feed: 'https://example.com/feed2.xml',
    image: null,
    language: 1,
    total_episodes: 10,
  },
];

describe('PodcastResults', () => {
  it('renders podcast cards when results exist', () => {
    render(
      <PodcastResults podcasts={mockPodcasts} isLoading={false} error={null} onRetry={() => {}} />
    );
    expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    expect(screen.getByText('Python Weekly')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    render(
      <PodcastResults podcasts={[]} isLoading={true} error={null} onRetry={() => {}} />
    );
    expect(screen.getByText('Buscando podcasts...')).toBeInTheDocument();
  });

  it('shows error message and retry button on error', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <PodcastResults podcasts={[]} isLoading={false} error={new Error('fail')} onRetry={handleRetry} />
    );
    expect(screen.getByText('Erro ao buscar podcasts.')).toBeInTheDocument();
    await user.click(screen.getByText('Tentar novamente'));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('shows empty message when no podcasts', () => {
    render(
      <PodcastResults podcasts={[]} isLoading={false} error={null} onRetry={() => {}} />
    );
    expect(screen.getByText('Nenhum podcast encontrado.')).toBeInTheDocument();
  });
});
```

**Verification**: All 4 test cases pass with `vitest`.

---

### T012: Create unit tests for EpisodeResults

**File**: `frontend/tests/components/search/EpisodeResults.test.tsx` (new)

**Requirements**: FR-003, FR-008

**Dependencies**: T007

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpisodeResults } from '@/components/search/EpisodeResults';
import type { Episode } from '@/lib/api';

const mockEpisodes: Episode[] = [
  {
    id: 1,
    title: 'Episódio Tech',
    link: 'https://example.com/ep1',
    description: 'Discussão sobre tecnologia',
    published: '2026-06-10T14:00:00Z',
    enclosure: null,
    podcast: { id: 5, name: 'Tech Brasil', image: null },
    tags: [],
  },
];

describe('EpisodeResults', () => {
  it('renders episode cards when results exist', () => {
    render(
      <EpisodeResults
        episodes={mockEpisodes}
        isLoading={false}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Episódio Tech')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={true}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Buscando episódios...')).toBeInTheDocument();
  });

  it('shows error and retry button on error', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={false}
        error={new Error('fail')}
        onRetry={handleRetry}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Erro ao buscar episódios.')).toBeInTheDocument();
    await user.click(screen.getByText('Tentar novamente'));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('shows configurable empty message', () => {
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={false}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado para 'xyz'."
      />
    );
    expect(screen.getByText("Nenhum episódio encontrado para 'xyz'.")).toBeInTheDocument();
  });
});
```

**Verification**: All 4 test cases pass with `vitest`.

---

### T013: Create integration test for SearchPageClient (core search)

**File**: `frontend/tests/app/search/SearchPageClient.test.tsx` (new)

**Requirements**: FR-001, FR-002, FR-008, FR-009, FR-010, FR-012

**Dependencies**: T008

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPageClient } from '@/app/search/SearchPageClient';

function mockFetch(responseData: unknown, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(responseData),
  } as Response);
}

const mockPodcastsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      name: 'Tech Brasil',
      feed: 'https://example.com/feed.xml',
      image: 'https://example.com/img.jpg',
      language: 1,
      total_episodes: 42,
    },
  ],
};

const mockEpisodesResponse = {
  count: 15,
  next: 'http://localhost:8000/api/episodes/?q=python&page=2',
  previous: null,
  results: [
    {
      id: 1,
      title: 'Intro to Python',
      link: 'https://example.com/ep1',
      description: 'A great episode',
      published: '2026-06-01T10:00:00Z',
      enclosure: null,
      podcast: { id: 5, name: 'Python Cast', image: null },
      tags: [],
    },
  ],
};

describe('SearchPageClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders search input', () => {
    render(<SearchPageClient />);
    expect(screen.getByPlaceholderText('Buscar podcasts ou episódios...')).toBeInTheDocument();
  });

  it('searches and displays podcast and episode results', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Intro to Python')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch({ count: 0, next: null, previous: null, results: [] });
    mockFetch({ count: 0, next: null, previous: null, results: [] });

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'xyznaoexiste123');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Nenhum resultado encontrado para/)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Tentar novamente').length).toBeGreaterThanOrEqual(2);
    });
  });
});
```

**Verification**: All 4 test scenarios pass. Tests cover basic search, empty results, and error state. Run with `npx vitest run frontend/tests/app/search/SearchPageClient.test.tsx`.

---

## Phase 4: User Story 2 — Filtrar resultados por tipo (P2)

### Pre-completed Tasks

None.

---

### T014: Create FilterTabs component

**File**: `frontend/src/components/search/FilterTabs.tsx` (new)

**Requirements**: FR-004

**Dependencies**: T001

```tsx
'use client';

import { cn } from '@/lib/utils';
import type { TabValue } from '@/lib/api';

interface FilterTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const TABS: { value: TabValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'episodios', label: 'Episódios' },
];

export function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px',
            activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Verification**: Renders three tabs. Active tab is highlighted. Clicking tabs fires `onTabChange` with correct value.

---

### T015: Integrate FilterTabs into SearchPageClient

**File**: `frontend/src/app/search/SearchPageClient.tsx` (modify)

**Requirements**: FR-004, FR-010

**Dependencies**: T014, T008

**Before** (line 6, imports):
```tsx
import { SearchInput } from '@/components/search/SearchInput';
import { PodcastResults } from '@/components/search/PodcastResults';
import { EpisodeResults } from '@/components/search/EpisodeResults';
```

**After**:
```tsx
import { SearchInput } from '@/components/search/SearchInput';
import { FilterTabs } from '@/components/search/FilterTabs';
import { PodcastResults } from '@/components/search/PodcastResults';
import { EpisodeResults } from '@/components/search/EpisodeResults';
import type { TabValue } from '@/lib/api';
```

**Before** (line 19, after searchParams/router declarations):
```tsx
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
```

**After**:
```tsx
  const tabParam = searchParams.get('tab') as TabValue | null;
  const initialTab: TabValue = tabParam === 'todos' || tabParam === 'podcasts' || tabParam === 'episodios' ? tabParam : 'todos';

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
```

**Before** (line 54, inside handleSearch, before `search(trimmed)`):
```tsx
    params.delete('page');
```

**After**:
```tsx
    params.delete('page');
    setActiveTab('todos');
    params.delete('tab');
```

**Before** (line 90, the `{podcasts.length > 0 && (` section):
```tsx
          <>
            {podcasts.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Podcasts
                </h2>
                <PodcastResults
                  podcasts={podcasts}
                  isLoading={false}
                  error={podcastError}
                  onRetry={() => search(submittedQuery)}
                />
              </section>
            )}

            {episodes.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Episódios
                </h2>
                <EpisodeResults
                  episodes={episodes}
                  isLoading={false}
                  error={episodeError}
                  onRetry={() => search(submittedQuery)}
                  emptyMessage={
                    episodeError ? '' : 'Nenhum episódio encontrado.'
                  }
                />
              </section>
            )}
          </>
```

**After**:
```tsx
          <>
            {(submittedQuery || hasSearched.current) && (
              <FilterTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', tab);
                  params.delete('page');
                  router.replace(`/search?${params.toString()}`, { scroll: false });
                }}
              />
            )}

            {(activeTab === 'todos' || activeTab === 'podcasts') && (
              <section className="mb-10">
                {activeTab === 'todos' && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Podcasts
                  </h2>
                )}
                <PodcastResults
                  podcasts={podcasts}
                  isLoading={false}
                  error={podcastError}
                  onRetry={() => search(submittedQuery)}
                />
              </section>
            )}

            {(activeTab === 'todos' || activeTab === 'episodios') && (
              <section className="mb-10">
                {activeTab === 'todos' && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Episódios
                  </h2>
                )}
                <EpisodeResults
                  episodes={episodes}
                  isLoading={false}
                  error={episodeError}
                  onRetry={() => search(submittedQuery)}
                  emptyMessage={
                    episodeError
                      ? ''
                      : activeTab === 'episodios'
                        ? `Nenhum episódio encontrado para '${submittedQuery}'.`
                        : 'Nenhum episódio encontrado.'
                  }
                />
              </section>
            )}
          </>
```

**Verification**: Tabs appear after first search. Switching tabs filters results locally. Tab change updates `?tab=` in URL and resets `?page=`. Tab-specific empty messages render.

---

### T016: Create unit tests for FilterTabs

**File**: `frontend/tests/components/search/FilterTabs.test.tsx` (new)

**Requirements**: FR-004

**Dependencies**: T014

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterTabs } from '@/components/search/FilterTabs';

describe('FilterTabs', () => {
  it('renders three tabs', () => {
    render(<FilterTabs activeTab="todos" onTabChange={() => {}} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Episódios')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<FilterTabs activeTab="podcasts" onTabChange={() => {}} />);
    const podcastTab = screen.getByText('Podcasts');
    expect(podcastTab.className).toContain('border-primary');
  });

  it('calls onTabChange with correct value when tab is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterTabs activeTab="todos" onTabChange={handleChange} />);
    await user.click(screen.getByText('Episódios'));
    expect(handleChange).toHaveBeenCalledWith('episodios');
  });

  it('does not highlight inactive tabs', () => {
    render(<FilterTabs activeTab="todos" onTabChange={() => {}} />);
    const podcastTab = screen.getByText('Podcasts');
    expect(podcastTab.className).not.toContain('border-primary');
  });
});
```

**Verification**: All 4 test cases pass with `vitest`.

---

### T017: Add tab filtering scenarios to integration test

**File**: `frontend/tests/app/search/SearchPageClient.test.tsx` (modify)

**Requirements**: FR-004

**Dependencies**: T015

**Before** (end of file):
```tsx
});
```

**After**:
```tsx
  it('tabs appear after search and filter results', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Episódios'));

    await waitFor(() => {
      expect(screen.queryByText('Tech Brasil')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
  });

  it('shows tab-specific empty message', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch({ count: 0, next: null, previous: null, results: [] });

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Episódios'));

    await waitFor(() => {
      expect(screen.getByText(/Nenhum episódio encontrado para/)).toBeInTheDocument();
    });
  });
});
```

**Verification**: Tab filtering and tab-specific empty message tests pass.

---

## Phase 5: User Story 3 — Navegar por páginas de resultados (P3)

### Pre-completed Tasks

None.

---

### T018: Create SearchPagination component

**File**: `frontend/src/components/search/SearchPagination.tsx` (new)

**Requirements**: FR-005

**Dependencies**: T001

```tsx
'use client';

import { cn } from '@/lib/utils';

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SearchPagination({
  page,
  totalPages,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
          page <= 1
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        Anterior
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-3 py-2 text-slate-400 text-sm"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
              p === page
                ? 'bg-primary text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
          page >= totalPages
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        Próxima
      </button>
    </div>
  );
}
```

**Verification**: Pagination hidden when totalPages <= 1. Renders page numbers with ellipsis for >7 pages. Previous/Next buttons disabled at boundaries. Current page highlighted. Clicking page/buttons fires `onPageChange`.

---

### T019: Integrate SearchPagination into SearchPageClient

**File**: `frontend/src/app/search/SearchPageClient.tsx` (modify)

**Requirements**: FR-005, FR-010

**Dependencies**: T018, T015

**Before** (line 6, imports):
```tsx
import { EpisodeResults } from '@/components/search/EpisodeResults';
```

**After**:
```tsx
import { EpisodeResults } from '@/components/search/EpisodeResults';
import { SearchPagination } from '@/components/search/SearchPagination';
```

**Before** (line 23, after `hasSearched`):
```tsx
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [podcastError, setPodcastError] = useState<Error | null>(null);
  const [episodeError, setEpisodeError] = useState<Error | null>(null);
```

**After**:
```tsx
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const initialPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [podcastTotal, setPodcastTotal] = useState(0);
  const [episodeTotal, setEpisodeTotal] = useState(0);
  const [podcastError, setPodcastError] = useState<Error | null>(null);
  const [episodeError, setEpisodeError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
```

**Before** (line 35, inside search function, after `const { signal } = controller;`):
```tsx
      setIsSearching(true);
      setPodcastError(null);
      setEpisodeError(null);

      const [podcastResult, episodeResult] = await Promise.allSettled([
        fetchPodcasts(trimmed || undefined, 1),
        fetchEpisodes(trimmed || undefined, 1),
      ]);

      if (signal.aborted) return;

      setIsSearching(false);

      if (podcastResult.status === 'fulfilled') {
        setPodcasts(podcastResult.value.results);
      } else {
        setPodcastError(podcastResult.reason instanceof Error ? podcastResult.reason : new Error('Erro ao buscar podcasts'));
        setPodcasts([]);
      }

      if (episodeResult.status === 'fulfilled') {
        setEpisodes(episodeResult.value.results);
      } else {
        setEpisodeError(episodeResult.reason instanceof Error ? episodeResult.reason : new Error('Erro ao buscar episódios'));
        setEpisodes([]);
      }
```

**After**:
```tsx
      setIsSearching(true);
      setPodcastError(null);
      setEpisodeError(null);

      const pageNum = currentPage !== undefined ? currentPage : 1;

      const [podcastResult, episodeResult] = await Promise.allSettled([
        fetchPodcasts(trimmed || undefined, pageNum),
        fetchEpisodes(trimmed || undefined, pageNum),
      ]);

      if (signal.aborted) return;

      setIsSearching(false);

      if (podcastResult.status === 'fulfilled') {
        setPodcasts(podcastResult.value.results);
        setPodcastTotal(podcastResult.value.count);
      } else {
        setPodcastError(podcastResult.reason instanceof Error ? podcastResult.reason : new Error('Erro ao buscar podcasts'));
        setPodcasts([]);
        setPodcastTotal(0);
      }

      if (episodeResult.status === 'fulfilled') {
        setEpisodes(episodeResult.value.results);
        setEpisodeTotal(episodeResult.value.count);
      } else {
        setEpisodeError(episodeResult.reason instanceof Error ? episodeResult.reason : new Error('Erro ao buscar episódios'));
        setEpisodes([]);
        setEpisodeTotal(0);
      }
```

The `search` callback signature changes to accept an optional `currentPage` parameter:

**Before** (line 33, `search` callback declaration):
```tsx
  const search = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
```

**After**:
```tsx
  const search = useCallback(
    async (term: string, currentPage?: number) => {
      const trimmed = term.trim();
```

Now the pagination handler and page-based total computation. Add after the `handleSearch` callback, before the `useEffect`:

**Before** (line 74, before `useEffect`):
```tsx
  useEffect(() => {
```

**After**:
```tsx
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.replace(`/search?${params.toString()}`, { scroll: false });
      search(submittedQuery, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, router, search, submittedQuery]
  );

  useEffect(() => {
```

Update the `podcastTotal` and `episodeTotal` based on activeTab. Add after page state:

The `SearchPageClient` already computes `podcastTotal` and `episodeTotal` in the search function. Now add pagination components after the results sections. Add before the closing `</div>` of the results container (before `</>`):

**Before** (line ~170, before `</>`):
```tsx
          </>
        )}
      </div>
    </div>
```

**After**:
```tsx
            {(activeTab === 'todos' || activeTab === 'podcasts') &&
              podcastTotal > 10 && (
                <SearchPagination
                  page={page}
                  totalPages={Math.ceil(podcastTotal / 10)}
                  onPageChange={handlePageChange}
                />
              )}

            {(activeTab === 'todos' || activeTab === 'episodios') &&
              episodeTotal > 10 && (
                <SearchPagination
                  page={page}
                  totalPages={Math.ceil(episodeTotal / 10)}
                  onPageChange={handlePageChange}
                />
              )}
          </>
        )}
      </div>
    </div>
```

**Verification**: Pagination appears when count > 10. Page navigation fires API call. `?page=` syncs in URL. Previous/Next disabled at boundary. Page scrolls to top. Tab switching resets page to 1.

---

### T020: Create unit tests for SearchPagination

**File**: `frontend/tests/components/search/SearchPagination.test.tsx` (new)

**Requirements**: FR-005

**Dependencies**: T018

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPagination } from '@/components/search/SearchPagination';

describe('SearchPagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <SearchPagination page={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons when totalPages > 1', () => {
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <SearchPagination page={2} totalPages={3} onPageChange={() => {}} />
    );
    const page2 = screen.getByText('2');
    expect(page2.className).toContain('bg-primary');
  });

  it('disables Previous button on first page', () => {
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('Anterior')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <SearchPagination page={3} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('Próxima')).toBeDisabled();
  });

  it('calls onPageChange when page button clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={handleChange} />
    );
    await user.click(screen.getByText('3'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when Next clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={handleChange} />
    );
    await user.click(screen.getByText('Próxima'));
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
```

**Verification**: All 7 test cases pass with `vitest`.

---

### T021: Add pagination scenarios to integration test

**File**: `frontend/tests/app/search/SearchPageClient.test.tsx` (modify)

**Requirements**: FR-005

**Dependencies**: T019

**Before** (end of file):
```tsx
});
```

**After**:
```tsx
  it('shows pagination when results exceed 10', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const largePodcasts = {
      count: 25,
      next: 'http://localhost:8000/api/podcasts/?search=python&page=2',
      previous: null,
      results: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Podcast ${i + 1}`,
        feed: `https://example.com/feed${i}.xml`,
        image: null,
        language: 1,
        total_episodes: 10,
      })),
    };

    mockFetch(largePodcasts);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });
  });

  it('page resets to 1 on tab switch', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const largeEpisodes = {
      count: 25,
      next: 'http://localhost:8000/api/episodes/?q=python&page=2',
      previous: null,
      results: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Episode ${i + 1}`,
        link: `https://example.com/ep${i}`,
        description: 'desc',
        published: '2026-06-01T10:00:00Z',
        enclosure: null,
        podcast: { id: 5, name: 'Pod', image: null },
        tags: [],
      })),
    };

    mockFetch(mockPodcastsResponse);
    mockFetch(largeEpisodes);

    const input = screen.getByPlaceholderText('Buscar podcasts ou episódios...');
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Próxima'));

    mockFetch(mockPodcastsResponse);
    mockFetch(largeEpisodes);

    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Podcasts'));

    await waitFor(() => {
      expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    });
  });
});
```

**Verification**: Pagination appears with >10 results. Page reset on tab switch verified.

---

## Phase 6: User Story 4 — Ver termos populares como sugestão (P4)

### Pre-completed Tasks

None.

---

### T022: Create PopularTerms component

**File**: `frontend/src/components/search/PopularTerms.tsx` (new)

**Requirements**: FR-006

**Dependencies**: T001, T002

```tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchPopularTerms, type PopularTerm } from '@/lib/api';

interface PopularTermsProps {
  onTermClick: (term: string) => void;
  visible: boolean;
}

export function PopularTerms({ onTermClick, visible }: PopularTermsProps) {
  const [terms, setTerms] = useState<PopularTerm[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    fetchPopularTerms()
      .then((data) => {
        if (!cancelled) {
          setTerms(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro ao carregar termos'));
          setTerms([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible || terms.length === 0) return null;

  return (
    <div className="mb-8">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
        Termos populares
      </p>
      <div className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <button
            key={t.term}
            onClick={() => onTermClick(t.term)}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors"
          >
            {t.term}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-slate-400 mt-2">
          Não foi possível carregar os termos populares.
        </p>
      )}
    </div>
  );
}
```

**Verification**: Fetches and renders up to 8 term chips. Hidden when `visible` is false or terms are empty. Clicking a chip fires `onTermClick`. Handles API errors gracefully.

---

### T023: Integrate PopularTerms into SearchPageClient

**File**: `frontend/src/app/search/SearchPageClient.tsx` (modify)

**Requirements**: FR-006, FR-010

**Dependencies**: T022, T008

**Before** (line 6, imports):
```tsx
import { SearchPagination } from '@/components/search/SearchPagination';
```

**After**:
```tsx
import { SearchPagination } from '@/components/search/SearchPagination';
import { PopularTerms } from '@/components/search/PopularTerms';
```

**Before** (line ~90, after `<SearchInput ... />`):
```tsx
      <div className="max-w-7xl mx-auto px-4">
```

**After**:
```tsx
      <div className="max-w-7xl mx-auto px-4">
        <PopularTerms
          visible={!submittedQuery}
          onTermClick={(term) => {
            setQuery(term);
            setSubmittedQuery(term);
            const params = new URLSearchParams();
            params.set('q', term);
            router.replace(`/search?${params.toString()}`, { scroll: false });
            search(term);
            hasSearched.current = true;
          }}
        />
```

**Verification**: Popular terms appear when no query has been submitted. Clicking a chip fills input + executes search. Hidden when query is active. Hidden when API returns no data.

---

### T024: Create unit tests for PopularTerms

**File**: `frontend/tests/components/search/PopularTerms.test.tsx` (new)

**Requirements**: FR-006

**Dependencies**: T022

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopularTerms } from '@/components/search/PopularTerms';

const mockTerms = [
  { term: 'tecnologia', times: 42 },
  { term: 'python', times: 38 },
  { term: 'design', times: 25 },
];

describe('PopularTerms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders term chips when visible and data available', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTerms),
    } as Response);

    render(<PopularTerms onTermClick={() => {}} visible={true} />);

    await waitFor(() => {
      expect(screen.getByText('tecnologia')).toBeInTheDocument();
    });
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    const { container } = render(<PopularTerms onTermClick={() => {}} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when terms are empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const { container } = render(<PopularTerms onTermClick={() => {}} visible={true} />);

    await waitFor(() => {
      expect(container.querySelector('button')).toBeNull();
    });
  });

  it('calls onTermClick when a chip is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTerms),
    } as Response);

    render(<PopularTerms onTermClick={handleClick} visible={true} />);

    await waitFor(() => {
      expect(screen.getByText('python')).toBeInTheDocument();
    });

    await user.click(screen.getByText('python'));
    expect(handleClick).toHaveBeenCalledWith('python');
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<PopularTerms onTermClick={() => {}} visible={true} />);

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível carregar os termos populares.')
      ).toBeInTheDocument();
    });
  });
});
```

**Verification**: All 5 test cases pass with `vitest`.

---

### T025: Add popular terms scenarios to integration test

**File**: `frontend/tests/app/search/SearchPageClient.test.tsx` (modify)

**Requirements**: FR-006

**Dependencies**: T023

**Before** (end of file):
```tsx
});
```

**After**:
```tsx
  it('shows popular terms when no search has been performed', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const popularTermsData = [
      { term: 'tecnologia', times: 42 },
      { term: 'python', times: 38 },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(popularTermsData),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText('tecnologia')).toBeInTheDocument();
    });
  });

  it('clicking a popular term chip triggers search', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const popularTermsData = [
      { term: 'python', times: 38 },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(popularTermsData),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText('python')).toBeInTheDocument();
    });

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    await user.click(screen.getByText('python'));

    await waitFor(() => {
      expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    });
  });
});
```

**Verification**: Popular terms render and chip-click triggers search.

---

## Final Consolidated File: SearchPageClient.tsx

Since `frontend/src/app/search/SearchPageClient.tsx` is modified across T008, T015, T019, and T023, here is the full final version with all integrations:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  fetchEpisodes,
  fetchPodcasts,
  type Episode,
  type Podcast,
  type TabValue,
} from '@/lib/api';
import { SearchInput } from '@/components/search/SearchInput';
import { FilterTabs } from '@/components/search/FilterTabs';
import { PodcastResults } from '@/components/search/PodcastResults';
import { EpisodeResults } from '@/components/search/EpisodeResults';
import { SearchPagination } from '@/components/search/SearchPagination';
import { PopularTerms } from '@/components/search/PopularTerms';

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabValue | null;
  const initialTab: TabValue =
    tabParam === 'todos' || tabParam === 'podcasts' || tabParam === 'episodios'
      ? tabParam
      : 'todos';

  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const initialPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(
    searchParams.get('q') ?? ''
  );
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [isSearching, setIsSearching] = useState(false);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [podcastTotal, setPodcastTotal] = useState(0);
  const [episodeTotal, setEpisodeTotal] = useState(0);
  const [podcastError, setPodcastError] = useState<Error | null>(null);
  const [episodeError, setEpisodeError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);

  const abortRef = useRef<AbortController | null>(null);
  const hasSearched = useRef(false);

  const search = useCallback(
    async (term: string, currentPage?: number) => {
      const trimmed = term.trim();

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setIsSearching(true);
      setPodcastError(null);
      setEpisodeError(null);

      const pageNum = currentPage !== undefined ? currentPage : 1;

      const [podcastResult, episodeResult] = await Promise.allSettled([
        fetchPodcasts(trimmed || undefined, pageNum),
        fetchEpisodes(trimmed || undefined, pageNum),
      ]);

      if (signal.aborted) return;

      setIsSearching(false);

      if (podcastResult.status === 'fulfilled') {
        setPodcasts(podcastResult.value.results);
        setPodcastTotal(podcastResult.value.count);
      } else {
        setPodcastError(
          podcastResult.reason instanceof Error
            ? podcastResult.reason
            : new Error('Erro ao buscar podcasts')
        );
        setPodcasts([]);
        setPodcastTotal(0);
      }

      if (episodeResult.status === 'fulfilled') {
        setEpisodes(episodeResult.value.results);
        setEpisodeTotal(episodeResult.value.count);
      } else {
        setEpisodeError(
          episodeResult.reason instanceof Error
            ? episodeResult.reason
            : new Error('Erro ao buscar episódios')
        );
        setEpisodes([]);
        setEpisodeTotal(0);
      }
    },
    []
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setActiveTab('todos');

    const params = new URLSearchParams();
    if (trimmed) {
      params.set('q', trimmed);
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });

    search(trimmed);
    hasSearched.current = true;
  }, [query, router, search]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.replace(`/search?${params.toString()}`, { scroll: false });
      search(submittedQuery, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, router, search, submittedQuery]
  );

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasSearched.current) {
      setQuery(q);
      setSubmittedQuery(q);
      search(q);
      hasSearched.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const noResults =
    !isSearching &&
    !podcastError &&
    !episodeError &&
    podcasts.length === 0 &&
    episodes.length === 0 &&
    submittedQuery !== '';

  return (
    <div className="min-h-screen pb-20">
      <SearchInput
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      <div className="max-w-7xl mx-auto px-4">
        <PopularTerms
          visible={!submittedQuery}
          onTermClick={(term) => {
            setQuery(term);
            setSubmittedQuery(term);
            const params = new URLSearchParams();
            params.set('q', term);
            router.replace(`/search?${params.toString()}`, { scroll: false });
            search(term);
            hasSearched.current = true;
          }}
        />

        {isSearching && podcasts.length === 0 && episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-4">Buscando...</p>
          </div>
        ) : noResults ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Nenhum resultado encontrado para &ldquo;{submittedQuery}&rdquo;.
            </p>
          </div>
        ) : (
          <>
            {(submittedQuery || hasSearched.current) && (
              <FilterTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', tab);
                  params.delete('page');
                  router.replace(`/search?${params.toString()}`, {
                    scroll: false,
                  });
                }}
              />
            )}

            {(activeTab === 'todos' || activeTab === 'podcasts') && (
              <section className="mb-10">
                {activeTab === 'todos' && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Podcasts
                  </h2>
                )}
                <PodcastResults
                  podcasts={podcasts}
                  isLoading={false}
                  error={podcastError}
                  onRetry={() => search(submittedQuery)}
                />

                {podcastTotal > 10 && (
                  <SearchPagination
                    page={page}
                    totalPages={Math.ceil(podcastTotal / 10)}
                    onPageChange={handlePageChange}
                  />
                )}
              </section>
            )}

            {(activeTab === 'todos' || activeTab === 'episodios') && (
              <section className="mb-10">
                {activeTab === 'todos' && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Episódios
                  </h2>
                )}
                <EpisodeResults
                  episodes={episodes}
                  isLoading={false}
                  error={episodeError}
                  onRetry={() => search(submittedQuery)}
                  emptyMessage={
                    episodeError
                      ? ''
                      : activeTab === 'episodios'
                        ? `Nenhum episódio encontrado para '${submittedQuery}'.`
                        : 'Nenhum episódio encontrado.'
                  }
                />

                {episodeTotal > 10 && (
                  <SearchPagination
                    page={page}
                    totalPages={Math.ceil(episodeTotal / 10)}
                    onPageChange={handlePageChange}
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 7: Polish & Cross-Cutting Concerns

### T026: Run ESLint

**File**: `frontend/` (validation — no file changes)

**Requirements**: Constitution III

**Dependencies**: T025

Run ESLint with zero-warnings policy:

```bash
cd frontend && npm run lint
```

Fix any warnings or errors before proceeding.

**Verification**: `npm run lint` exits with code 0.

---

### T027: Run TypeScript type check

**File**: `frontend/` (validation — no file changes)

**Requirements**: Constitution III

**Dependencies**: T025

Run TypeScript compiler in check mode:

```bash
cd frontend && npx tsc --noEmit
```

Fix any type errors before proceeding. All new components and test files must pass strict TypeScript checking.

**Verification**: `npx tsc --noEmit` exits with code 0.

---

### T028: Run vitest

**File**: `frontend/` (validation — no file changes)

**Requirements**: Constitution II

**Dependencies**: T013, T017, T021, T025

Run the full vitest test suite:

```bash
cd frontend && npm test
```

All new unit and integration tests must pass. Verify:
- SearchInput: 9 tests pass
- PodcastResults: 4 tests pass
- EpisodeResults: 4 tests pass
- FilterTabs: 4 tests pass
- SearchPagination: 7 tests pass
- PopularTerms: 5 tests pass
- SearchPageClient integration: 8 tests pass

**Verification**: `npm test` exits with code 0.

---

### T029: Validate against quickstart.md scenarios

**File**: `specs/001-podcast-search-page/quickstart.md` (manual validation — no file changes)

**Dependencies**: T028

Manually validate each scenario from `quickstart.md`:

| Scenario | What to verify |
|----------|---------------|
| VS-1 | Search "python" → podcast + episode results grouped |
| VS-2 | Search "xyznaoexiste123" → "Nenhum resultado encontrado" message |
| VS-3 | Empty search → recent episodes shown |
| VS-4 | Tab filtering: Episodios/Podcasts/Todos |
| VS-5 | Aba without results → type-specific empty message |
| VS-6 | Pagination appears for >10 results, navigation works |
| VS-7 | Page resets to 1 on tab switch |
| VS-8 | Popular terms chips visible when empty |
| VS-9 | Direct URL `/search?q=python` auto-searches |
| VS-10 | Loading spinner during search |
| VS-11 | Error state when backend down, retry works |

**Verification**: All 11 scenarios pass.

---

## Checklist

- [ ] T001: Create route directory `frontend/src/app/search/` and component directory `frontend/src/components/search/`
- [ ] T002: Add `fetchPopularTerms()` function to `frontend/src/lib/api.ts`
- [ ] T003: Define TypeScript types for search state and URL params in `frontend/src/lib/api.ts`
- [ ] T004: Create server component `frontend/src/app/search/page.tsx`
- [ ] T005: Create SearchInput component in `frontend/src/components/search/SearchInput.tsx`
- [ ] T006: Create PodcastResults component in `frontend/src/components/search/PodcastResults.tsx`
- [ ] T007: Create EpisodeResults component in `frontend/src/components/search/EpisodeResults.tsx`
- [ ] T008: Create SearchPageClient component in `frontend/src/app/search/SearchPageClient.tsx`
- [ ] T009: Update `frontend/src/app/search/page.tsx` to render SearchPageClient with Suspense
- [ ] T010: Create unit tests for SearchInput in `frontend/tests/components/search/SearchInput.test.tsx`
- [ ] T011: Create unit tests for PodcastResults in `frontend/tests/components/search/PodcastResults.test.tsx`
- [ ] T012: Create unit tests for EpisodeResults in `frontend/tests/components/search/EpisodeResults.test.tsx`
- [ ] T013: Create integration test for SearchPageClient in `frontend/tests/app/search/SearchPageClient.test.tsx`
- [ ] T014: Create FilterTabs component in `frontend/src/components/search/FilterTabs.tsx`
- [ ] T015: Integrate FilterTabs into SearchPageClient in `frontend/src/app/search/SearchPageClient.tsx`
- [ ] T016: Create unit tests for FilterTabs in `frontend/tests/components/search/FilterTabs.test.tsx`
- [ ] T017: Add tab filtering scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx`
- [ ] T018: Create SearchPagination component in `frontend/src/components/search/SearchPagination.tsx`
- [ ] T019: Integrate SearchPagination into SearchPageClient in `frontend/src/app/search/SearchPageClient.tsx`
- [ ] T020: Create unit tests for SearchPagination in `frontend/tests/components/search/SearchPagination.test.tsx`
- [ ] T021: Add pagination scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx`
- [ ] T022: Create PopularTerms component in `frontend/src/components/search/PopularTerms.tsx`
- [ ] T023: Integrate PopularTerms into SearchPageClient in `frontend/src/app/search/SearchPageClient.tsx`
- [ ] T024: Create unit tests for PopularTerms in `frontend/tests/components/search/PopularTerms.test.tsx`
- [ ] T025: Add popular terms scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx`
- [ ] T026: Run ESLint (`npm run lint`) on `frontend/` and fix any warnings
- [ ] T027: Run TypeScript type check (`npx tsc --noEmit`) on `frontend/` and fix any errors
- [ ] T028: Run vitest (`npm test`) on `frontend/` — all tests must pass
- [ ] T029: Validate against quickstart.md scenarios VS-1 through VS-11
