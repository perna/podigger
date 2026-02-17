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

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchEpisodes(
  query?: string,
  page = 1
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
