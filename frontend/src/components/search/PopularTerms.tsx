'use client';

import { useEffect, useState } from 'react';
import { fetchPopularTerms, type PopularTerm } from '@/lib/api';

interface PopularTermsProps {
  onTermClick: (term: string) => void;
  visible: boolean;
}

export function PopularTerms({ onTermClick, visible }: PopularTermsProps) {
  const [terms, setTerms] = useState<PopularTerm[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    fetchPopularTerms()
      .then((data) => {
        if (!cancelled) {
          setTerms(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Erro ao carregar termos')
          );
          setTerms([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible || (terms.length === 0 && !error)) return null;

  return (
    <div className="mb-8">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
        Termos populares
      </p>
      {terms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <button
              key={t.term}
              onClick={() => onTermClick(t.term)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors"
            >
              {t.term}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="text-xs text-slate-400 mt-2">
          Não foi possível carregar os termos populares.
        </p>
      )}
    </div>
  );
}
