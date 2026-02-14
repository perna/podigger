import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'no-results' | 'no-episodes' | 'error';
  query?: string;
  onRetry?: () => void;
  className?: string;
}

const messages = {
  'no-results': (q?: string) =>
    q ? `Nenhum episódio encontrado para "${q}".` : 'Nenhum episódio encontrado.',
  'no-episodes':
    'Ainda não há episódios. Adicione podcasts para começar.',
  error: 'Algo deu errado. Tente novamente.',
};

export function EmptyState({ type, query, onRetry, className }: EmptyStateProps) {
  const text =
    type === 'no-results' ? messages['no-results'](query) : messages[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <p className="text-slate-600 dark:text-muted-dark text-sm font-normal">
        {text}
      </p>
      {type === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
