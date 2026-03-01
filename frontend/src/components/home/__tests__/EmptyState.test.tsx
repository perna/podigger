import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders no-results message without query', () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText('No episodes found.')).toBeDefined();
  });

  it('renders no-results message with query', () => {
    render(<EmptyState type="no-results" query="design" />);
    expect(screen.getByText(/No episodes found for "design"./)).toBeDefined();
  });

  it('renders no-episodes message', () => {
    render(<EmptyState type="no-episodes" />);
    expect(screen.getByText(/No episodes found yet/)).toBeDefined();
  });

  it('renders error message', () => {
    render(<EmptyState type="error" />);
    expect(screen.getByText(/Something went wrong/)).toBeDefined();
  });

  it('shows retry button when type is error and onRetry provided', async () => {
    const onRetry = vi.fn();
    render(<EmptyState type="error" onRetry={onRetry} />);
    const btn = screen.getByRole('button', { name: /Try again/i });
    expect(btn).toBeDefined();
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not show retry button when onRetry is not provided', () => {
    const { container } = render(<EmptyState type="error" />);
    expect(within(container).queryByRole('button', { name: /Try again/i })).toBeNull();
  });
});
