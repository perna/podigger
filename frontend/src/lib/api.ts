export interface Episode {
  id: number;
  title: string;
  link: string;
  description: string | null;
  published: string | null;
  enclosure: string | null;
  podcast: {
    id: number;
    name: string;
    image: string | null;
  };
  tags: { id: number; name: string }[];
}

export interface EpisodesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Episode[];
}

export interface Podcast {
  id: number;
  name: string;
  feed: string;
  image: string | null;
  language: { id: number; code: string; name: string } | null;
  total_episodes: number;
}

export interface PodcastLanguage {
  id: number;
  code: string;
  name: string;
}

export interface PodcastsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Podcast[];
}

export interface PodcastDetail extends Podcast {
  episodes: Episode[];
}

export type TabValue = 'todos' | 'podcasts' | 'episodios';

export interface SearchPageState {
  q: string;
  tab: TabValue;
  page: number;
}

export interface PopularTerm {
  term: string;
  times: number;
}

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchEpisodes(
  query?: string,
  page = 1,
  signal?: AbortSignal
): Promise<EpisodesResponse> {
  const params = new URLSearchParams();
  const trimmed = query?.trim();
  if (trimmed) {
    params.set('q', trimmed);
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const url = `${API_BASE}/api/episodes/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchPodcasts(
  query?: string,
  page = 1,
  language?: number | null,
  signal?: AbortSignal
): Promise<PodcastsResponse> {
  const params = new URLSearchParams();
  const trimmed = query?.trim();
  if (trimmed) {
    params.set('search', trimmed);
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  if (language != null) {
    params.set('language', String(language));
  }
  const url = `${API_BASE}/api/podcasts/${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchPopularTerms(signal?: AbortSignal): Promise<PopularTerm[]> {
  const url = `${API_BASE}/api/popular-terms/`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data: PopularTerm[] = await response.json();
  return Array.isArray(data) ? data.slice(0, 8) : [];
}

export interface AddPodcastResponse {
  id?: number;
  status: 'created' | 'existing' | 'error';
  message?: string;
}

export async function addPodcast(
  name: string,
  feed: string
): Promise<AddPodcastResponse> {
  const url = `${API_BASE}/api/podcasts/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, feed }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchPodcast(id: number): Promise<PodcastDetail> {
  const url = `${API_BASE}/api/podcasts/${id}/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchLanguages(): Promise<PodcastLanguage[]> {
  const url = `${API_BASE}/api/languages/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
