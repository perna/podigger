import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AddPodcastPage from '../page';

// Mock next/navigation
const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    back,
  }),
}));

// Mock AuthContext — default to an editor user so the form renders
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'editor@example.com', role: 'editor' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  })),
}));

// Mock Icon to avoid any complexity
vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

describe('AddPodcastPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(<AddPodcastPage />);
    expect(screen.getByText('Add a New Podcast')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('The Joe Rogan Experience')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://feed.url/rss')).toBeInTheDocument();
  });

  it('updates input values', () => {
    render(<AddPodcastPage />);
    const nameInput = screen.getByPlaceholderText('The Joe Rogan Experience');
    const urlInput = screen.getByPlaceholderText('https://feed.url/rss');

    fireEvent.change(nameInput, { target: { value: 'My Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://mypod.com/rss' } });

    expect(nameInput).toHaveValue('My Podcast');
    expect(urlInput).toHaveValue('https://mypod.com/rss');
  });

  it('handles successful podcast creation', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'created' }), { status: 200 })
    );
    render(<AddPodcastPage />);

    const nameInput = screen.getByPlaceholderText('The Joe Rogan Experience');
    const urlInput = screen.getByPlaceholderText('https://feed.url/rss');
    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');

    fireEvent.change(nameInput, { target: { value: 'New Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://new.com/rss' } });

    fireEvent.click(submitBtn);

    await vi.runAllTimersAsync();

    expect(fetchSpy).toHaveBeenCalledWith('/api/proxy/podcasts/', expect.objectContaining({
      method: 'POST',
    }));
    expect(screen.getByText(/adicionado com sucesso/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/');

    vi.useRealTimers();
  });

  it('handles already existing podcast', async () => {
    vi.useFakeTimers();
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'existing' }), { status: 200 })
    );
    render(<AddPodcastPage />);

    const nameInput = screen.getByPlaceholderText('The Joe Rogan Experience');
    const urlInput = screen.getByPlaceholderText('https://feed.url/rss');
    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');

    fireEvent.change(nameInput, { target: { value: 'Old Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://old.com/rss' } });

    fireEvent.click(submitBtn);

    await vi.runAllTimersAsync();

    expect(screen.getByText(/já está na nossa biblioteca/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/');

    vi.useRealTimers();
  });

  it('handles API error with message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Custom error message' }), { status: 500 })
    );
    render(<AddPodcastPage />);

    fireEvent.change(screen.getByPlaceholderText('The Joe Rogan Experience'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('https://feed.url/rss'), { target: { value: 'https://test.com' } });

    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Custom error message/i)).toBeInTheDocument();
  });

  it('handles throw from API', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network fail'));
    render(<AddPodcastPage />);

    fireEvent.change(screen.getByPlaceholderText('The Joe Rogan Experience'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('https://feed.url/rss'), { target: { value: 'https://test.com' } });

    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Network fail/i)).toBeInTheDocument();
  });

  it('handles back button', () => {
    render(<AddPodcastPage />);
    const backBtn = screen.getByText('arrow_back_ios_new').closest('button');
    if (!backBtn) throw new Error('Back button not found');
    fireEvent.click(backBtn);
    expect(back).toHaveBeenCalledOnce();
  });
});
