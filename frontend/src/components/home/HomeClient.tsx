'use client';

import { useState, useCallback } from 'react';
import { SearchHero } from '@/components/search/SearchHero';
import { EpisodeList } from './EpisodeList';
import { BottomNav } from './BottomNav';
import { FAB } from '@/components/common/FAB';
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
                    No podcasts found for "{searchTerm}".
                  </p>
                )}
              </section>
            )}

            {/* Episodes Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {searchTerm
                  ? `Episodes for "${searchTerm}"`
                  : 'Recent Results'}
              </h2>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-primary transition-colors"
              >
                <span className="material-symbols-rounded text-lg">tune</span>
                <span>Filters</span>
              </button>
            </div>
            <EpisodeList
              searchTerm={searchTerm}
              onLoadingChange={handleLoadingChange}
            />
          </main>

          {/* Sidebar — visible only on lg+ */}
          <aside className="w-full lg:w-80 shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Trending Podcasts placeholder */}
              <div className="bg-white dark:bg-surface-dark-hover rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Trending Podcasts
                  </h2>
                  <span className="text-primary material-symbols-rounded text-xl">
                    trending_up
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Coming soon...
                  </p>
                </div>
              </div>

              {/* Podigger Pro CTA */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-background-dark shadow-lg shadow-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded font-bold">
                    verified
                  </span>
                  <h3 className="font-extrabold">Podigger Pro</h3>
                </div>
                <p className="text-xs font-medium opacity-90 mb-4 leading-relaxed">
                  Unlimited RSS imports and ad-free offline listening.
                </p>
                <button
                  type="button"
                  className="w-full py-2.5 bg-background-dark text-primary text-xs font-black rounded-full hover:scale-105 transition-transform"
                >
                  Get Started
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav activeItem="search" />
      </div>

      {/* Floating Add RSS Button */}
      <FAB />
    </div>
  );
}
