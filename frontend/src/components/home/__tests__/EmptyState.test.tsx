import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders no-results message without query', () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText('Nenhum episódio encontrado.')).toBeDefined();
  });

  it('renders no-results message with query', () => {
    render(<EmptyState type="no-results" query="design" />);
    expect(screen.getByText(/Nenhum episódio encontrado para "design"./)).toBeDefined();
  });

  it('renders no-episodes message', () => {
    render(<EmptyState type="no-episodes" />);
    expect(screen.getByText(/Ainda não há episódios/)).toBeDefined();
  });

  it('renders error message', () => {
    render(<EmptyState type="error" />);
    expect(screen.getByText(/Algo deu errado/)).toBeDefined();
  });

  it('shows retry button when type is error and onRetry provided', async () => {
    const onRetry = vi.fn();
    render(<EmptyState type="error" onRetry={onRetry} />);
    const btn = screen.getByRole('button', { name: /Tentar novamente/i });
    expect(btn).toBeDefined();
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not show retry button when onRetry is not provided', () => {
    const { container } = render(<EmptyState type="error" />);
    expect(within(container).queryByRole('button', { name: /Tentar novamente/i })).toBeNull();
  });
});
