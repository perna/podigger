import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PodcastList } from '../PodcastList';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchPodcasts: vi.fn(),
  fetchLanguages: vi.fn(),
}));

const mockPodcasts: api.Podcast[] = [
  {
    id: 1,
    name: 'Nerdcast',
    feed: 'https://feeds.example.com/nerdcast',
    image: 'https://img.example.com/cover.jpg',
    language: { id: 1, code: 'pt', name: 'Português' },
    total_episodes: 850,
  },
  {
    id: 2,
    name: 'DevCast',
    feed: 'https://feeds.example.com/devcast',
    image: null,
    language: { id: 2, code: 'en', name: 'Inglês' },
    total_episodes: 42,
  },
];

const mockPodcastsResponse: api.PodcastsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: mockPodcasts,
};

describe('PodcastList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchLanguages).mockResolvedValue([]);
  });

  it('renders grid of PodcastCards when fetch succeeds', async () => {
    vi.mocked(api.fetchPodcasts).mockResolvedValueOnce(mockPodcastsResponse);
    const { container } = render(<PodcastList />);
    expect(await within(container).findByText('Nerdcast')).toBeInTheDocument();
    expect(within(container).getByText('DevCast')).toBeInTheDocument();
    expect(api.fetchPodcasts).toHaveBeenCalledWith(undefined, 1, null);
  });

  it('shows loading spinner initially', () => {
    vi.mocked(api.fetchPodcasts).mockImplementation(
      () => new Promise(() => {})
    );
    const { container } = render(<PodcastList />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no podcasts', async () => {
    vi.mocked(api.fetchPodcasts).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    const { container } = render(<PodcastList />);
    expect(
      await within(container).findByText(/Nenhum podcast encontrado/)
    ).toBeInTheDocument();
  });

  it('shows error state with retry button on API failure', async () => {
    vi.mocked(api.fetchPodcasts)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockPodcastsResponse);
    const { container } = render(<PodcastList />);
    expect(
      await within(container).findByText(/Something went wrong/)
    ).toBeInTheDocument();
    const retryBtn = within(container).getByRole('button', { name: /Try again/i });
    await userEvent.click(retryBtn);
    expect(await within(container).findByText('Nerdcast')).toBeInTheDocument();
    expect(api.fetchPodcasts).toHaveBeenCalledTimes(2);
  });

  it('renders search input and calls fetchPodcasts with search param after debounce', async () => {
    vi.mocked(api.fetchPodcasts).mockResolvedValue(mockPodcastsResponse);
    const { container } = render(<PodcastList />);
    const input = await within(container).findByRole('searchbox');
    expect(input).toBeInTheDocument();
    await userEvent.type(input, 'nerd');
    await waitFor(() => {
      expect(api.fetchPodcasts).toHaveBeenCalledWith('nerd', 1, null);
    }, { timeout: 500 });
  });

  it('shows empty-results message with query term when search returns nothing', async () => {
    vi.mocked(api.fetchPodcasts)
      .mockResolvedValueOnce(mockPodcastsResponse)
      .mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] });
    const { container } = render(<PodcastList />);
    const input = await within(container).findByRole('searchbox');
    await userEvent.type(input, 'xyz');
    await waitFor(() => {
      expect(
        within(container).getByText(/Nenhum podcast encontrado para "xyz"/)
      ).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('clears search restores full list', async () => {
    vi.mocked(api.fetchPodcasts).mockResolvedValue(mockPodcastsResponse);
    const { container } = render(<PodcastList />);
    const input = await within(container).findByRole('searchbox');
    await userEvent.type(input, 'nerd');
    await waitFor(() => {
      expect(api.fetchPodcasts).toHaveBeenCalledWith('nerd', 1, null);
    }, { timeout: 500 });
    await userEvent.clear(input);
    await waitFor(() => {
      expect(api.fetchPodcasts).toHaveBeenCalledWith(undefined, 1, null);
    }, { timeout: 500 });
  });
});
