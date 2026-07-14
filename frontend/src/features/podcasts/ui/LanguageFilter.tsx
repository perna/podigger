'use client';

import { useState, useEffect } from 'react';
import { fetchLanguages, type PodcastLanguage } from '@/lib/api';

interface LanguageFilterProps {
  selectedLanguageId: number | null;
  onLanguageChange: (languageId: number | null) => void;
}

export function LanguageFilter({ selectedLanguageId, onLanguageChange }: LanguageFilterProps) {
  const [languages, setLanguages] = useState<PodcastLanguage[]>([]);

  useEffect(() => {
    fetchLanguages()
      .then(setLanguages)
      .catch(() => setLanguages([]));
  }, []);

  return (
    <div className="relative">
      <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
        language
      </span>
      <select
        value={selectedLanguageId ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onLanguageChange(val ? Number(val) : null);
        }}
        className="w-full appearance-none bg-white dark:bg-surface-dark-hover rounded-full border border-slate-200 dark:border-slate-700 pl-10 pr-10 py-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        aria-label="Filtrar por idioma"
      >
        <option value="">Todos os idiomas</option>
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
      <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
        expand_more
      </span>
    </div>
  );
}
