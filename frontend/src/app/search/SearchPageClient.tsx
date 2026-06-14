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

const TAB_VALUES: TabValue[] = ['todos', 'podcasts', 'episodios'];

function parseTab(value: string | null): TabValue {
  return value && TAB_VALUES.includes(value as TabValue)
    ? (value as TabValue)
    : 'todos';
}

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') ?? '';
  const initialTab = parseTab(searchParams.get('tab'));
  const initialPageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const initialPage =
    isNaN(initialPageParam) || initialPageParam < 1 ? 1 : initialPageParam;

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [page, setPage] = useState(initialPage);
  const [isSearching, setIsSearching] = useState(false);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [podcastTotal, setPodcastTotal] = useState(0);
  const [episodeTotal, setEpisodeTotal] = useState(0);
  const [podcastError, setPodcastError] = useState<Error | null>(null);
  const [episodeError, setEpisodeError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const initialSearchDone = useRef(false);

  const search = useCallback(
    async (term: string, currentPage = 1) => {
      const trimmed = term.trim();

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      setPodcastError(null);
      setEpisodeError(null);

      try {
        const [podcastResult, episodeResult] = await Promise.allSettled([
          fetchPodcasts(trimmed || undefined, currentPage, controller.signal),
          fetchEpisodes(trimmed || undefined, currentPage, controller.signal),
        ]);

        if (controller.signal.aborted) return;

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
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      const queryString = params.toString();
      router.replace(
        queryString ? `/search?${queryString}` : '/search',
        { scroll: false }
      );
    },
    [router]
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setActiveTab('todos');
    setPage(1);

    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    updateUrl(params);

    search(trimmed, 1);
  }, [query, search, updateUrl]);

  const handleTabChange = useCallback(
    (tab: TabValue) => {
      setActiveTab(tab);
      setPage(1);

      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      params.delete('page');
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      updateUrl(params);
      search(submittedQuery, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, submittedQuery, search, updateUrl]
  );

  useEffect(() => {
    if (initialSearchDone.current) return;
    initialSearchDone.current = true;

    if (initialQuery) {
      search(initialQuery, initialPage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSearched =
    submittedQuery !== '' || podcasts.length > 0 || episodes.length > 0;

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
          visible={!hasSearched && !isSearching}
          onTermClick={(term) => {
            setQuery(term);
            setSubmittedQuery(term);
            setActiveTab('todos');
            setPage(1);
            const params = new URLSearchParams();
            params.set('q', term);
            updateUrl(params);
            search(term, 1);
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
        ) : hasSearched ? (
          <>
            <FilterTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

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
                  onRetry={() => search(submittedQuery, page)}
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
                  onRetry={() => search(submittedQuery, page)}
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
        ) : null}
      </div>
    </div>
  );
}
