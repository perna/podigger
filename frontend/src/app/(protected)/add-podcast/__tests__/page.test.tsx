import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AddPodcastPage from '../page';

// Mock next/navigation
const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back }),
}));

// Mock the new auth slice — default to an editor user so the form renders.
const useAuthMock = vi.fn();
vi.mock('@/shared/store/slices/auth', () => ({
  useAuth: () => useAuthMock(),
}));

// Mock the API layer so we can drive podcastsService.create.
const createSpy = vi.fn();
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api')>('@/shared/api');
  return {
    ...actual,
    podcastsService: {
      list: vi.fn(),
      create: (...args: unknown[]) => createSpy(...args),
    },
  };
});

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function setAuth(user: { email: string; role: 'admin' | 'editor' | 'reader' } | null) {
  useAuthMock.mockReturnValue({
    user,
    status: user ? 'authenticated' : 'unauthenticated',
    _hasHydrated: true,
    login: vi.fn(),
    logout: vi.fn(),
    setStatus: vi.fn(),
    setHasHydrated: vi.fn(),
  });
}

describe('AddPodcastPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth({ email: 'editor@example.com', role: 'editor' });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with the new labels and placeholders', () => {
    renderWithQuery(<AddPodcastPage />);
    expect(screen.getByLabelText(/podcast name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rss feed url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add podcast/i })).toBeInTheDocument();
  });

  it('updates input values', () => {
    renderWithQuery(<AddPodcastPage />);
    const nameInput = screen.getByLabelText(/podcast name/i) as HTMLInputElement;
    const urlInput = screen.getByLabelText(/rss feed url/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My Podcast' } });
    fireEvent.change(urlInput, { target: { value: 'https://mypod.com/rss' } });
    expect(nameInput.value).toBe('My Podcast');
    expect(urlInput.value).toBe('https://mypod.com/rss');
  });

  it('submits via the mutation and shows the success message', async () => {
    createSpy.mockResolvedValue({ status: 'created', message: 'Podcast added successfully.' });
    renderWithQuery(<AddPodcastPage />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), { target: { value: 'https://new.com/rss' } });
    fireEvent.click(screen.getByRole('button', { name: /add podcast/i }));
    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ name: 'New', feed: 'https://new.com/rss' }),
    );
    expect(await screen.findByText(/podcast added successfully/i)).toBeInTheDocument();
  });

  it('shows the server error message when the mutation rejects with a ServerError carrying an API message', async () => {
    const { ServerError } = await import('@/shared/api');
    createSpy.mockRejectedValue(
      new ServerError('Internal server error', {
        status: 500,
        details: { message: 'Custom API error message' },
      }),
    );
    renderWithQuery(<AddPodcastPage />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), { target: { value: 'https://test.com/rss' } });
    fireEvent.click(screen.getByRole('button', { name: /add podcast/i }));
    expect(await screen.findByText(/custom api error message/i)).toBeInTheDocument();
  });

  it('shows a generic fallback when the mutation rejects with a plain Error', async () => {
    createSpy.mockRejectedValue(new Error('Network fail'));
    renderWithQuery(<AddPodcastPage />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), { target: { value: 'https://test.com/rss' } });
    fireEvent.click(screen.getByRole('button', { name: /add podcast/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not call the mutation when fields are empty', async () => {
    renderWithQuery(<AddPodcastPage />);
    fireEvent.click(screen.getByRole('button', { name: /add podcast/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('shows the Acesso Negado fallback when the user lacks the editor/admin role', () => {
    setAuth({ email: 'reader@example.com', role: 'reader' });
    renderWithQuery(<AddPodcastPage />);
    expect(screen.getByText(/acesso negado/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/podcast name/i)).not.toBeInTheDocument();
  });
});
