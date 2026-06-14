import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PodcastResults } from '@/components/search/PodcastResults';
import type { Podcast } from '@/lib/api';

const mockPodcasts: Podcast[] = [
  {
    id: 1,
    name: 'Tech Brasil',
    feed: 'https://example.com/feed.xml',
    image: 'https://example.com/img.jpg',
    language: 1,
    total_episodes: 42,
  },
  {
    id: 2,
    name: 'Python Weekly',
    feed: 'https://example.com/feed2.xml',
    image: null,
    language: 1,
    total_episodes: 10,
  },
];

describe('PodcastResults', () => {
  it('renders podcast cards when results exist', () => {
    render(
      <PodcastResults
        podcasts={mockPodcasts}
        isLoading={false}
        error={null}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    expect(screen.getByText('Python Weekly')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    render(
      <PodcastResults
        podcasts={[]}
        isLoading={true}
        error={null}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText('Buscando podcasts...')).toBeInTheDocument();
  });

  it('shows error message and retry button on error', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <PodcastResults
        podcasts={[]}
        isLoading={false}
        error={new Error('fail')}
        onRetry={handleRetry}
      />
    );
    expect(screen.getByText('Erro ao buscar podcasts.')).toBeInTheDocument();
    await user.click(screen.getByText('Tentar novamente'));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('shows empty message when no podcasts', () => {
    render(
      <PodcastResults
        podcasts={[]}
        isLoading={false}
        error={null}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText('Nenhum podcast encontrado.')).toBeInTheDocument();
  });
});
