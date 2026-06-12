'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPodcasts, type Podcast } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import { PodcastCard } from './PodcastCard';
import { Pagination } from './Pagination';
import { LanguageFilter } from './LanguageFilter';
import { Skeleton } from '@/components/ui/Loading';

function PodcastCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 overflow-hidden p-4">
      <div className="flex gap-4">
        <Skeleton className="size-20 md:size-24 rounded-lg shrink-0" />
        <div className="flex flex-col justify-center min-w-0 flex-1 gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
      </div>
    </div>
  );
}

export function PodcastList() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);

  const totalPages = totalCount > 0
    ? Math.ceil(totalCount / 20)
    : undefined;

  const loadPodcasts = useCallback(async (query?: string, page = 1, language?: number | null) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchPodcasts(query, page, language);
      setPodcasts(res.results);
      setHasNext(res.next !== null);
      setHasPrevious(res.previous !== null);
      setTotalCount(res.count);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = debouncedSearch.trim() || undefined;
    setCurrentPage(1);
    loadPodcasts(trimmed, 1, selectedLanguage);
  }, [debouncedSearch, selectedLanguage, loadPodcasts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadPodcasts(debouncedSearch.trim() || undefined, page, selectedLanguage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    loadPodcasts(debouncedSearch.trim() || undefined, currentPage, selectedLanguage);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Podcasts
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore todos os podcasts disponíveis no Podigger
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="search"
              role="searchbox"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar podcasts por nome..."
              className="w-full bg-white dark:bg-surface-dark-hover rounded-full border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              aria-label="Buscar podcasts"
            />
          </div>
          <div className="w-full sm:w-48">
            <LanguageFilter
              selectedLanguageId={selectedLanguage}
              onLanguageChange={(id) => setSelectedLanguage(id)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PodcastCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-rounded text-5xl text-slate-400 mb-4">
            error_outline
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Não foi possível carregar os podcasts. Verifique sua conexão.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      ) : podcasts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-rounded text-5xl text-slate-400 mb-4">
            podcast
          </span>
          <p className="text-base text-slate-500 dark:text-slate-400">
            {debouncedSearch.trim()
              ? `Nenhum podcast encontrado para "${debouncedSearch.trim()}"`
              : 'Nenhum podcast encontrado'}
          </p>
        </div>
      )}
    </div>
  );
}
