'use client';

import { useState, useCallback } from 'react';
import { SearchHero } from '@/components/search/SearchHero';
import { EpisodeList } from './EpisodeList';
import { BottomNav } from './BottomNav';
import { fetchPodcasts, type Podcast } from '@/lib/api';
import { PodcastCard } from '@/components/podcasts/PodcastCard';
import { LoadingSpinner } from '@/components/ui/Loading';

export function HomeClient() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isSearchingPodcasts, setIsSearchingPodcasts] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    setSearchTerm(trimmed);

    if (trimmed) {
      setIsSearchingPodcasts(true);
      try {
        const res = await fetchPodcasts(trimmed);
        setPodcasts(res.results);
      } catch (err) {
        console.error('Error searching podcasts:', err);
        setPodcasts([]);
      } finally {
        setIsSearchingPodcasts(false);
      }
    } else {
      setPodcasts([]);
    }
  }, [query]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsSearching(loading);
  }, []);

  return (
    <div className="min-h-dvh">
      {/* Desktop Hero Search */}
      <SearchHero
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching || isSearchingPodcasts}
      />

      {/* Main Content Area — responsive layout */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <main className="flex-1 min-w-0">
            {/* Podcasts Section */}
            {searchTerm && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Podcasts
                  </h2>
                </div>
                {isSearchingPodcasts ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner className="size-8 text-primary" />
                  </div>
                ) : podcasts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {podcasts.map((p) => (
                      <PodcastCard key={p.id} podcast={p} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Nenhum podcast encontrado para &quot;{searchTerm}&quot;.
                  </p>
                )}
              </section>
            )}

            {/* Episodes Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {searchTerm
                  ? `Episódios para "${searchTerm}"`
                  : 'Resultados Recentes'}
              </h2>
            </div>
            <EpisodeList
              searchTerm={searchTerm}
              onLoadingChange={handleLoadingChange}
            />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav activeItem="search" />
      </div>
    </div>
  );
}
