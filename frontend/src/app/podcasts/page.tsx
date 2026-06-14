'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPodcasts, type Podcast } from '@/lib/api';
import { PodcastCard } from '@/components/podcasts/PodcastCard';
import { EmptyState } from '@/components/home/EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (q: string, pageNum: number, append: boolean) => {
      const trimmed = q.trim();
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        const res = await fetchPodcasts(trimmed || undefined, pageNum);
        if (append) {
          setPodcasts((prev) => [...prev, ...res.results]);
        } else {
          setPodcasts(res.results);
        }
        setHasMore(!!res.next);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar podcasts'));
        if (!append) setPodcasts([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    load(searchTerm, 1, false);
  }, [searchTerm, load]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => {
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

  const handleSearch = () => {
    setSearchTerm(query);
  };

  return (
    <div className="min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
          Podcasts
        </h1>

        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-2 max-w-xl">
            <label className="flex flex-1 h-12">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-primary transition-colors">
                <span className="text-slate-400 dark:text-muted-dark flex items-center justify-center pl-4">
                  <Icon name="search" opticalSize={20} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar podcasts..."
                  className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-muted-dark px-3 text-base font-normal leading-normal"
                  aria-label="Buscar podcasts"
                />
              </div>
            </label>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              isLoading={isLoading && !isLoadingMore}
              className="rounded-xl h-12 px-6"
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner className="size-10 text-primary" />
          </div>
        ) : error ? (
          <EmptyState
            type="error"
            onRetry={() => load(searchTerm, 1, false)}
          />
        ) : podcasts.length === 0 ? (
          <EmptyState
            type="no-results"
            query={searchTerm || undefined}
          />
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {podcasts.length} podcast{podcasts.length !== 1 ? 's' : ''} encontrado{podcasts.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {podcasts.map((p) => (
                <PodcastCard key={p.id} podcast={p} />
              ))}
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                {isLoadingMore && (
                  <>
                    <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">
                      Carregando mais podcasts...
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
