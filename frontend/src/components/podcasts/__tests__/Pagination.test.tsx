import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders Anterior and Próximo buttons', () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        hasNext={true}
        hasPrevious={true}
        onPageChange={() => {}}
      />
    );
    expect(within(container).getByText('Anterior')).toBeInTheDocument();
    expect(within(container).getByText('Próximo')).toBeInTheDocument();
  });

  it('disables Anterior button on first page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        hasNext={true}
        hasPrevious={false}
        onPageChange={() => {}}
      />
    );
    const anteriorBtn = within(container).getByText('Anterior');
    expect(anteriorBtn).toBeDisabled();
  });

  it('disables Próximo button on last page when next is null', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        hasNext={false}
        hasPrevious={false}
        onPageChange={() => {}}
      />
    );
    const proximoBtn = within(container).getByText('Próximo');
    expect(proximoBtn).toBeDisabled();
  });

  it('calls onPageChange with correct page on click', async () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={1}
        hasNext={true}
        hasPrevious={false}
        onPageChange={onPageChange}
      />
    );
    await userEvent.click(within(container).getByText('Próximo'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with previous page when Anterior clicked', async () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={2}
        hasNext={true}
        hasPrevious={true}
        onPageChange={onPageChange}
      />
    );
    await userEvent.click(within(container).getByText('Anterior'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('shows page indicator', () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        hasNext={true}
        hasPrevious={true}
        totalPages={5}
        onPageChange={() => {}}
      />
    );
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('5');
  });
});
