'use client';

import { cn } from '@/lib/utils';
import type { TabValue } from '@/lib/api';

interface FilterTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const TABS: { value: TabValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'episodios', label: 'Episódios' },
];

export function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px',
            activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
