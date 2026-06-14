import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpisodeResults } from '@/components/search/EpisodeResults';
import type { Episode } from '@/lib/api';

const mockEpisodes: Episode[] = [
  {
    id: 1,
    title: 'Episódio Tech',
    link: 'https://example.com/ep1',
    description: 'Discussão sobre tecnologia',
    published: '2026-06-10T14:00:00Z',
    enclosure: null,
    podcast: { id: 5, name: 'Tech Brasil', image: null },
    tags: [],
  },
];

describe('EpisodeResults', () => {
  it('renders episode cards when results exist', () => {
    render(
      <EpisodeResults
        episodes={mockEpisodes}
        isLoading={false}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Episódio Tech')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={true}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Buscando episódios...')).toBeInTheDocument();
  });

  it('shows error and retry button on error', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={false}
        error={new Error('fail')}
        onRetry={handleRetry}
        emptyMessage="Nenhum episódio encontrado."
      />
    );
    expect(screen.getByText('Erro ao buscar episódios.')).toBeInTheDocument();
    await user.click(screen.getByText('Tentar novamente'));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('shows configurable empty message', () => {
    render(
      <EpisodeResults
        episodes={[]}
        isLoading={false}
        error={null}
        onRetry={() => {}}
        emptyMessage="Nenhum episódio encontrado para 'xyz'."
      />
    );
    expect(
      screen.getByText("Nenhum episódio encontrado para 'xyz'.")
    ).toBeInTheDocument();
  });
});
