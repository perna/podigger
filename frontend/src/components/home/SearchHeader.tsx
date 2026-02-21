'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export function SearchHeader({
  query,
  onQueryChange,
  onSearch,
  isSearching = false,
}: SearchHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="text-primary flex size-10 shrink-0 items-center justify-center">
          <Icon name="rss_feed" opticalSize={28} />
        </div>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          Podigger
        </h1>
        <button
          type="button"
          className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
          aria-label="Conta"
        >
          <Icon name="account_circle" opticalSize={24} />
        </button>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-2">
          <label className="flex flex-col flex-1 h-12">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-primary transition-colors">
              <span className="text-slate-400 dark:text-muted-dark flex items-center justify-center pl-4">
                <Icon name="search" opticalSize={20} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Episodes, podcasts, or RSS..."
                className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-0 focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-muted-dark px-3 text-base font-normal leading-normal"
                aria-label="Buscar episódios"
              />
            </div>
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={onSearch}
            isLoading={isSearching}
            className="rounded-xl h-12 px-6"
          >
            Buscar
          </Button>
        </div>
      </div>
      <div className="flex gap-4 px-4 pb-3 overflow-x-auto hide-scrollbar">
        <button
          type="button"
          className="text-sm font-semibold text-primary border-b-2 border-primary pb-1 whitespace-nowrap"
        >
          Todos
        </button>
        <button
          type="button"
          className="text-sm font-medium text-slate-500 dark:text-slate-400 pb-1 whitespace-nowrap"
        >
          Recentes
        </button>
        <button
          type="button"
          className="text-sm font-medium text-slate-500 dark:text-slate-400 pb-1 whitespace-nowrap"
        >
          Populares
        </button>
      </div>
    </header>
  );
}
