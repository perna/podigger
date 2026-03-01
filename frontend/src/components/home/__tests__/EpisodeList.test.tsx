import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeList } from '../EpisodeList';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchEpisodes: vi.fn(),
}));

const mockEpisodes = [
  {
    id: 1,
    title: 'Episode One',
    link: 'https://ep1.com',
    description: 'First episode',
    published: '2024-01-01',
    enclosure: null,
    podcast: { id: 10, name: 'Podcast A', image: null },
    tags: [],
  },
];

describe('EpisodeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchEpisodes).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockEpisodes,
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(api.fetchEpisodes).mockImplementation(
      () => new Promise(() => { })
    );
    const { container } = render(<EpisodeList searchTerm="" />);
    // Loading spinner should be present
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(api.fetchEpisodes).toHaveBeenCalledWith(undefined, 1);
  });

  it('renders episodes when fetch succeeds', async () => {
    const { container } = render(<EpisodeList searchTerm="" />);
    const items = await within(container).findAllByText('Episode One');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(api.fetchEpisodes).toHaveBeenCalledWith(undefined, 1);
  });

  it('passes search term to API', async () => {
    const { container } = render(<EpisodeList searchTerm="design" />);
    const items = await within(container).findAllByText('Episode One');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(api.fetchEpisodes).toHaveBeenCalledWith('design', 1);
  });

  it('shows empty state when no episodes and no search', async () => {
    vi.mocked(api.fetchEpisodes).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    const { container } = render(<EpisodeList searchTerm="" />);
    expect(await within(container).findByText(/No episodes found yet/)).toBeInTheDocument();
  });

  it('shows no-results empty state when search returns empty', async () => {
    vi.mocked(api.fetchEpisodes).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    const { container } = render(<EpisodeList searchTerm="xyz" />);
    expect(await within(container).findByText(/No episodes found for "xyz"/)).toBeInTheDocument();
  });

  it('shows error state and retry on failure', async () => {
    vi.mocked(api.fetchEpisodes)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        count: 1,
        next: null,
        previous: null,
        results: mockEpisodes,
      });
    const { container } = render(<EpisodeList searchTerm="" />);
    expect(await within(container).findByText(/Something went wrong/)).toBeInTheDocument();
    const retryBtn = within(container).getByRole('button', { name: /Try again/i });
    await userEvent.click(retryBtn);
    const items = await within(container).findAllByText('Episode One');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(api.fetchEpisodes).toHaveBeenCalledTimes(2);
  });

  it('calls onLoadingChange when loading state changes', async () => {
    const onLoadingChange = vi.fn();
    const { container } = render(<EpisodeList searchTerm="" onLoadingChange={onLoadingChange} />);
    expect(onLoadingChange).toHaveBeenCalledWith(true);
    const items = await within(container).findAllByText('Episode One');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });
});
