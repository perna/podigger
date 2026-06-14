'use client';

import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export function SearchInput({
  query,
  onQueryChange,
  onSearch,
  isSearching = false,
}: SearchInputProps) {
  const isValid = query.trim().length >= 2;

  return (
    <section className="max-w-2xl mx-auto px-4 pt-10 pb-6 text-center">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
        Buscar
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-base md:text-lg">
        Encontre podcasts e episódios por nome, título ou descrição.
      </p>
      <div className="relative group max-w-2xl mx-auto">
        <div className="flex items-center bg-white dark:bg-surface-dark-hover rounded-full shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 ring-primary transition-all p-1">
          <div className="pl-4 text-slate-400 shrink-0">
            <Icon name="search" opticalSize={24} />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValid && onSearch()}
            placeholder="Buscar podcasts ou episódios..."
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white px-4 py-2 md:py-3 text-base md:text-lg placeholder:text-slate-400"
            aria-label="Buscar podcasts ou episódios"
          />
          <Button
            variant="primary"
            onClick={onSearch}
            disabled={!isValid || isSearching}
            isLoading={isSearching}
            className="rounded-full px-6 md:px-8 py-2 md:py-3 whitespace-nowrap"
          >
            Buscar
          </Button>
        </div>
      </div>
    </section>
  );
}
