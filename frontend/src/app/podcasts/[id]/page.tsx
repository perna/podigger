'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { fetchPodcast, type PodcastDetail } from '@/lib/api';
import { EpisodeCard } from '@/components/home/EpisodeCard';
import { EpisodeCardCompact } from '@/components/episodes/EpisodeCardCompact';
import { EmptyState } from '@/components/home/EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Icon } from '@/components/ui/Icon';

function PodcastLanguageLabel(code: number | null): string {
  switch (code) {
    case 1: return 'Português';
    case 2: return 'Inglês';
    default: return '';
  }
}

function PLACEHOLDER_IMAGE(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%23475569" width="400" height="225"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14"%3ESem imagem%3C/text%3E%3C/svg%3E';
}

export default function PodcastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [podcast, setPodcast] = useState<PodcastDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchPodcast(id);
      setPodcast(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar podcast'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LoadingSpinner className="size-10 text-primary" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error.message.includes('404');
    return (
      <EmptyState
        type="error"
        query={isNotFound ? 'Podcast não encontrado' : 'Erro ao carregar podcast'}
        onRetry={load}
      />
    );
  }

  if (!podcast) {
    return null;
  }

  const imageUrl = podcast.image || PLACEHOLDER_IMAGE();
  const languageLabel = PodcastLanguageLabel(podcast.language);

  return (
    <div className="min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-6"
        >
          <Icon name="arrow_back_ios" opticalSize={14} />
          Voltar
        </button>

        {/* Podcast Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={podcast.name}
              className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              {podcast.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <Icon name="headphones" opticalSize={16} />
                {podcast.total_episodes} episódios
              </span>
              {languageLabel && (
                <span className="flex items-center gap-1">
                  <Icon name="language" opticalSize={16} />
                  {languageLabel}
                </span>
              )}
            </div>
            {podcast.feed && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">
                Feed: {podcast.feed}
              </p>
            )}
          </div>
        </div>

        {/* Episodes */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Episódios
          </h2>

          {podcast.episodes.length === 0 ? (
            <EmptyState type="no-episodes" />
          ) : (
            <>
              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-6">
                {podcast.episodes.map((ep) => (
                  <EpisodeCardCompact key={ep.id} episode={ep} />
                ))}
              </div>
              {/* Mobile list */}
              <div className="md:hidden space-y-6">
                {podcast.episodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
