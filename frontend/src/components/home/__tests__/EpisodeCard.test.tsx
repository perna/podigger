import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EpisodeCard } from '../EpisodeCard';

const mockEpisode = {
  id: 1,
  title: 'Episode Title',
  link: 'https://episode.example.com',
  description: 'Episode description here.',
  published: '2024-01-15',
  enclosure: null,
  podcast: {
    id: 10,
    name: 'My Podcast',
    image: 'https://img.example.com/cover.jpg',
  },
  tags: [],
};

describe('EpisodeCard', () => {
  it('renders episode title', () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);
    expect(within(container).getByText('Episode Title')).toBeInTheDocument();
  });

  it('renders podcast name', () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);
    expect(within(container).getByText('My Podcast')).toBeInTheDocument();
  });

  it('renders description', () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);
    expect(container.textContent).toContain('Episode description here');
  });

  it('Play link has correct href and opens in new tab', () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);
    const playLinks = within(container).getAllByRole('link');
    const playLink = playLinks.find((l) => l.textContent?.includes('Play'));
    expect(playLink).toHaveAttribute('href', 'https://episode.example.com');
    expect(playLink).toHaveAttribute('target', '_blank');
  });

  it('View podcast link points to podcast page', () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);
    const links = within(container).getAllByRole('link');
    const viewLink = links.find((l) => l.getAttribute('href') === '/podcasts/10');
    expect(viewLink).toBeDefined();
    expect(viewLink?.textContent).toMatch(/Ver podcast/i);
  });

  it('falls back to Podcast when podcast name missing', () => {
    const epNoPodcast = { ...mockEpisode, podcast: undefined as never };
    const { container } = render(<EpisodeCard episode={epNoPodcast} />);
    expect(within(container).getByText('Podcast')).toBeInTheDocument();
  });
});
