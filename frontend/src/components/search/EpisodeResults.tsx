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
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {emptyMessage}
        </p>
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
