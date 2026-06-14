import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopularTerms } from '@/components/search/PopularTerms';

const mockTerms = [
  { term: 'tecnologia', times: 42 },
  { term: 'python', times: 38 },
  { term: 'design', times: 25 },
];

describe('PopularTerms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders term chips when visible and data available', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTerms),
    } as Response);

    render(<PopularTerms onTermClick={() => {}} visible={true} />);

    await waitFor(() => {
      expect(screen.getByText('tecnologia')).toBeInTheDocument();
    });
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    const { container } = render(
      <PopularTerms onTermClick={() => {}} visible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render when terms are empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const { container } = render(
      <PopularTerms onTermClick={() => {}} visible={true} />
    );

    await waitFor(() => {
      expect(container.querySelector('button')).toBeNull();
    });
  });

  it('calls onTermClick when a chip is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTerms),
    } as Response);

    render(<PopularTerms onTermClick={handleClick} visible={true} />);

    await waitFor(() => {
      expect(screen.getByText('python')).toBeInTheDocument();
    });

    await user.click(screen.getByText('python'));
    expect(handleClick).toHaveBeenCalledWith('python');
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<PopularTerms onTermClick={() => {}} visible={true} />);

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível carregar os termos populares.')
      ).toBeInTheDocument();
    });
  });
});
