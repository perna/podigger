'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEpisodes, type Episode } from '@/lib/api';
import { EpisodeCard } from './EpisodeCard';
import { EpisodeCardCompact } from '@/components/episodes/EpisodeCardCompact';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';

interface EpisodeListProps {
  searchTerm: string;
  onLoadingChange?: (loading: boolean) => void;
}

export function EpisodeList({ searchTerm, onLoadingChange }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [, setPage] = useState(1);
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
          onLoadingChange?.(true);
        }
        setError(null);
        const res = await fetchEpisodes(trimmed || undefined, pageNum);
        if (append) {
          setEpisodes((prev) => [...prev, ...res.results]);
        } else {
          setEpisodes(res.results);
        }
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

  // Fetch when searchTerm changes
  useEffect(() => {
    setPage(1);
    load(searchTerm, 1, false);
  }, [searchTerm, load]);

  // Load more when reaching bottom
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner className="size-10 text-primary" />
      </div>
    );
  }

  if (error) {
    return <EmptyState type="error" onRetry={() => load(searchTerm, 1, false)} />;
  }

  if (episodes.length === 0) {
    const emptyType = searchTerm ? 'no-results' : 'no-episodes';
    return (
      <EmptyState
        type={emptyType}
        query={searchTerm || undefined}
      />
    );
  }

  return (
    <>
      {/* Desktop: responsive grid with compact cards */}
      <div className="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-6">
        {episodes.map((ep) => (
          <EpisodeCardCompact key={ep.id} episode={ep} />
        ))}
      </div>

      {/* Mobile: single column with large cards */}
      <div className="md:hidden space-y-6">
        {episodes.map((ep) => (
          <EpisodeCard key={ep.id} episode={ep} />
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
                Loading more episodes...
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}

