import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AddPodcastPage from '../page';
import { addPodcast } from '@/lib/api';

// Mock next/navigation
const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    back,
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  addPodcast: vi.fn(),
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
    vi.mocked(addPodcast).mockResolvedValue({ status: 'created' });
    render(<AddPodcastPage />);

    const nameInput = screen.getByPlaceholderText('The Joe Rogan Experience');
    const urlInput = screen.getByPlaceholderText('https://feed.url/rss');
    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');

    fireEvent.change(nameInput, { target: { value: 'New Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://new.com/rss' } });
    
    fireEvent.click(submitBtn);

    await vi.runAllTimersAsync();

    expect(addPodcast).toHaveBeenCalledWith('New Podcast', 'https://new.com/rss');
    expect(screen.getByText(/Podcast added successfully/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/');
    
    vi.useRealTimers();
  });

  it('handles already existing podcast', async () => {
    vi.useFakeTimers();
    vi.mocked(addPodcast).mockResolvedValue({ status: 'existing' });
    render(<AddPodcastPage />);

    const nameInput = screen.getByPlaceholderText('The Joe Rogan Experience');
    const urlInput = screen.getByPlaceholderText('https://feed.url/rss');
    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');

    fireEvent.change(nameInput, { target: { value: 'Old Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://old.com/rss' } });
    
    fireEvent.click(submitBtn);

    await vi.runAllTimersAsync();

    expect(screen.getByText(/already in our library/i)).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/');

    vi.useRealTimers();
  });

  it('handles API error with message', async () => {
    vi.mocked(addPodcast).mockResolvedValue({ status: 'error', message: 'Custom error message' });
    render(<AddPodcastPage />);

    fireEvent.change(screen.getByPlaceholderText('The Joe Rogan Experience'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('https://feed.url/rss'), { target: { value: 'https://test.com' } });

    const submitBtn = screen.getByText('Add to Podigger').closest('button');
    if (!submitBtn) throw new Error('Submit button not found');
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Custom error message/i)).toBeInTheDocument();
  });

  it('handles throw from API', async () => {
    vi.mocked(addPodcast).mockRejectedValue(new Error('Network fail'));
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
