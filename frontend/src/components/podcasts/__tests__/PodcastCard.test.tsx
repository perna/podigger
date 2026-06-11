import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PodcastCard } from '../PodcastCard';
import type { Podcast } from '@/lib/api';

const mockPodcast: Podcast = {
  id: 1,
  name: 'Nerdcast',
  feed: 'https://feeds.example.com/nerdcast',
  image: 'https://img.example.com/cover.jpg',
  language: { id: 1, code: 'pt', name: 'Português' },
  total_episodes: 850,
};

const mockPodcastNoLanguage: Podcast = {
  id: 2,
  name: 'NoLang Podcast',
  feed: 'https://feeds.example.com/nolang',
  image: null,
  language: null,
  total_episodes: 0,
};

describe('PodcastCard', () => {
  it('renders podcast name', () => {
    const { container } = render(<PodcastCard podcast={mockPodcast} />);
    expect(within(container).getByText('Nerdcast')).toBeInTheDocument();
  });

  it('renders episode count', () => {
    const { container } = render(<PodcastCard podcast={mockPodcast} />);
    expect(container.textContent).toContain('850');
  });

  it('renders language name when language is set', () => {
    const { container } = render(<PodcastCard podcast={mockPodcast} />);
    expect(within(container).getByText('Português')).toBeInTheDocument();
  });

  it('handles null language gracefully', () => {
    const { container } = render(<PodcastCard podcast={mockPodcastNoLanguage} />);
    expect(container).toBeInTheDocument();
  });

  it('renders placeholder when no image', () => {
    const { container } = render(<PodcastCard podcast={mockPodcastNoLanguage} />);
    expect(container.querySelector('.material-symbols-rounded')).toBeInTheDocument();
  });

  it('links to podcast detail page', () => {
    const { container } = render(<PodcastCard podcast={mockPodcast} />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/podcasts/1');
  });
});
