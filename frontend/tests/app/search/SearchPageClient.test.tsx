import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPageClient } from '@/app/search/SearchPageClient';
import { useSearchParams, useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockedUseRouter = vi.mocked(useRouter);

function mockFetch(responseData: unknown, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(responseData),
  } as Response);
}

const mockPodcastsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      name: 'Tech Brasil',
      feed: 'https://example.com/feed.xml',
      image: 'https://example.com/img.jpg',
      language: 1,
      total_episodes: 42,
    },
  ],
};

const mockEpisodesResponse = {
  count: 15,
  next: 'http://localhost:8000/api/episodes/?q=python&page=2',
  previous: null,
  results: [
    {
      id: 1,
      title: 'Intro to Python',
      link: 'https://example.com/ep1',
      description: 'A great episode',
      published: '2026-06-01T10:00:00Z',
      enclosure: null,
      podcast: { id: 5, name: 'Python Cast', image: null },
      tags: [],
    },
  ],
};

describe('SearchPageClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('scrollTo', vi.fn());
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
    mockedUseRouter.mockReturnValue({
      replace: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('renders search input', () => {
    render(<SearchPageClient />);
    expect(
      screen.getByPlaceholderText('Buscar podcasts ou episódios...')
    ).toBeInTheDocument();
  });

  it('searches and displays podcast and episode results', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Intro to Python')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch({ count: 0, next: null, previous: null, results: [] });
    mockFetch({ count: 0, next: null, previous: null, results: [] });

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'xyznaoexiste123');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Nenhum resultado encontrado para/)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText('Tentar novamente').length
      ).toBeGreaterThanOrEqual(2);
    });
  });

  it('tabs appear after search and filter results', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Todos' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Episódios' }));

    await waitFor(() => {
      expect(screen.queryByText('Tech Brasil')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
  });

  it('shows tab-specific empty message', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    mockFetch(mockPodcastsResponse);
    mockFetch({ count: 0, next: null, previous: null, results: [] });

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Todos' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Episódios' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Nenhum episódio encontrado para/)
      ).toBeInTheDocument();
    });
  });

  it('shows pagination when results exceed 10', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const largePodcasts = {
      count: 25,
      next: 'http://localhost:8000/api/podcasts/?search=python&page=2',
      previous: null,
      results: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Podcast ${i + 1}`,
        feed: `https://example.com/feed${i}.xml`,
        image: null,
        language: 1,
        total_episodes: 10,
      })),
    };

    mockFetch(largePodcasts);
    mockFetch(mockEpisodesResponse);

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Todos' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Episódios' }));

    await waitFor(() => {
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });
  });

  it('page resets to 1 on tab switch', async () => {
    const user = userEvent.setup();
    render(<SearchPageClient />);

    const largeEpisodes = {
      count: 25,
      next: 'http://localhost:8000/api/episodes/?q=python&page=2',
      previous: null,
      results: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Episode ${i + 1}`,
        link: `https://example.com/ep${i}`,
        description: 'desc',
        published: '2026-06-01T10:00:00Z',
        enclosure: null,
        podcast: { id: 5, name: 'Pod', image: null },
        tags: [],
      })),
    };

    mockFetch(mockPodcastsResponse);
    mockFetch(largeEpisodes);

    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'python');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Todos' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Episódios' }));

    await waitFor(() => {
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });

    mockFetch(mockPodcastsResponse);
    mockFetch(largeEpisodes);

    await user.click(screen.getByText('Próxima'));

    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Podcasts' }));

    await waitFor(() => {
      expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    });
  });

  it('shows popular terms when no search has been performed', async () => {
    const popularTermsData = [
      { term: 'tecnologia', times: 42 },
      { term: 'python', times: 38 },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(popularTermsData),
    } as Response);

    render(<SearchPageClient />);

    await waitFor(() => {
      expect(screen.getByText('tecnologia')).toBeInTheDocument();
    });
  });

  it('clicking a popular term chip triggers search', async () => {
    const user = userEvent.setup();
    const popularTermsData = [{ term: 'python', times: 38 }];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(popularTermsData),
    } as Response);

    render(<SearchPageClient />);

    await waitFor(() => {
      expect(screen.getByText('python')).toBeInTheDocument();
    });

    mockFetch(mockPodcastsResponse);
    mockFetch(mockEpisodesResponse);

    await user.click(screen.getByText('python'));

    await waitFor(() => {
      expect(screen.getByText('Tech Brasil')).toBeInTheDocument();
    });
  });
});
