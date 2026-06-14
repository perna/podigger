import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPagination } from '@/components/search/SearchPagination';

describe('SearchPagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <SearchPagination page={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons when totalPages > 1', () => {
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <SearchPagination page={2} totalPages={3} onPageChange={() => {}} />
    );
    const page2 = screen.getByText('2');
    expect(page2.className).toContain('bg-primary');
  });

  it('disables Previous button on first page', () => {
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('Anterior')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <SearchPagination page={3} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('Próxima')).toBeDisabled();
  });

  it('calls onPageChange when page button clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={handleChange} />
    );
    await user.click(screen.getByText('3'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when Next clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchPagination page={1} totalPages={3} onPageChange={handleChange} />
    );
    await user.click(screen.getByText('Próxima'));
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
