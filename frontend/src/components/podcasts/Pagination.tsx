'use client';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  hasNext,
  hasPrevious,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <button
        type="button"
        disabled={!hasPrevious}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Página anterior"
      >
        <span className="material-symbols-rounded text-lg">arrow_back</span>
        Anterior
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        Página {currentPage}
        {totalPages ? ` de ${totalPages}` : ''}
      </span>

      <button
        type="button"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Próxima página"
      >
        Próximo
        <span className="material-symbols-rounded text-lg">arrow_forward</span>
      </button>
    </div>
  );
}
