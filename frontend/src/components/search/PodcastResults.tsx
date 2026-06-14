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
