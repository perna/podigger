import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addPodcast, fetchEpisodes, fetchPodcasts } from '../api';

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
      expect.stringMatching(/^https?:\/\/.+\/api\/episodes\/?$/),
      expect.anything()
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
      expect.stringContaining('q=design'),
      expect.anything()
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
      expect.stringContaining('q=design'),
      expect.anything()
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
      expect.stringContaining('page=2'),
      expect.anything()
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

describe('fetchPodcasts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetches podcasts without query', async () => {
    const mockData = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchPodcasts();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https?:\/\/.+\/api\/podcasts\/?$/),
      expect.anything()
    );
  });

  it('adds search param when query is provided', async () => {
    const mockData = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await fetchPodcasts('design');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=design'),
      expect.anything()
    );
  });
});

describe('addPodcast', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('successfully creates a podcast', async () => {
    const mockResponse = { id: 1, status: 'created' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await addPodcast('Test Podcast', 'https://test.com/feed');

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/podcasts/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Podcast', feed: 'https://test.com/feed' }),
      })
    );
  });

  it('handles existing podcast response', async () => {
    const mockResponse = { status: 'existing', message: 'Already exists' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await addPodcast('Existing Podcast', 'https://test.com/existing');

    expect(result).toEqual(mockResponse);
  });

  it('throws error with message from server', async () => {
    const errorMsg = 'Invalid RSS feed';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: errorMsg }),
    } as Response);

    await expect(addPodcast('Bad Podcast', 'https://bad.url')).rejects.toThrow(errorMsg);
  });

  it('throws generic error when response not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(addPodcast('Error Podcast', 'https://error.url')).rejects.toThrow('API error: 500');
  });
});
