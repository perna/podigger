'use client';

import { useState, useCallback } from 'react';
import { SearchHeader } from './SearchHeader';
import { EpisodeList } from './EpisodeList';
import { BottomNav } from './BottomNav';

export function HomeClient() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    setSearchTerm(trimmed);
  }, [query]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsSearching(loading);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
      />
      <EpisodeList
        searchTerm={searchTerm}
        onLoadingChange={handleLoadingChange}
      />
      <BottomNav activeItem="home" />
    </div>
  );
}
