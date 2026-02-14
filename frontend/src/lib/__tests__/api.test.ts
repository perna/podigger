import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEpisodes } from '../api';

describe('fetchEpisodes', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetches recent episodes when no query provided', async () => {
    const mockData = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          title: 'Ep 1',
          link: 'http://ep1.com',
          description: 'Desc 1',
          published: '2024-01-01',
          enclosure: null,
          podcast: { id: 1, name: 'Pod 1', image: null },
          tags: [],
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchEpisodes();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https?:\/\/.+\/api\/episodes\/?$/)
    );
    expect(result).toEqual(mockData);
    expect(result.results).toHaveLength(1);
  });

  it('adds q param when query is provided', async () => {
    const mockData = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchEpisodes('design');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=design')
    );
  });

  it('trims whitespace from query', async () => {
    const mockData = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchEpisodes('  design  ');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=design')
    );
  });

  it('adds page param when page > 1', async () => {
    const mockData = { count: 20, next: null, previous: '...', results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchEpisodes(undefined, 2);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2')
    );
  });

  it('combines query and page params', async () => {
    const mockData = { count: 15, next: null, previous: '...', results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchEpisodes('python', 2);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('q=python');
    expect(url).toContain('page=2');
  });

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchEpisodes()).rejects.toThrow('API error: 500');
  });
});
