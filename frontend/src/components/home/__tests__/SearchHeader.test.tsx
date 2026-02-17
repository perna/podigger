import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchHeader } from '../SearchHeader';

describe('SearchHeader', () => {
  it('renders Podigger title', () => {
    const { container } = render(
      <SearchHeader query="" onQueryChange={() => {}} onSearch={() => {}} />
    );
    expect(within(container).getByText('Podigger')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    const { container } = render(
      <SearchHeader query="" onQueryChange={() => {}} onSearch={() => {}} />
    );
    const input = container.querySelector('input[placeholder*="Episodes"]');
    expect(input).toBeInTheDocument();
  });

  it('renders search button', () => {
    const { container } = render(
      <SearchHeader query="" onQueryChange={() => {}} onSearch={() => {}} />
    );
    const buttons = within(container).getAllByRole('button');
    const searchBtn = buttons.find((b) => b.textContent?.includes('Buscar'));
    expect(searchBtn).toBeInTheDocument();
  });

  it('calls onQueryChange when input changes', async () => {
    const onQueryChange = vi.fn();
    const { container } = render(
      <SearchHeader query="" onQueryChange={onQueryChange} onSearch={() => {}} />
    );
    const input = within(container).getByRole('searchbox');
    await userEvent.type(input, 'd');
    expect(onQueryChange).toHaveBeenCalledWith('d');
  });

  it('calls onSearch when search button clicked', async () => {
    const onSearch = vi.fn();
    const { container } = render(
      <SearchHeader query="test" onQueryChange={() => {}} onSearch={onSearch} />
    );
    const searchBtn = within(container).getByRole('button', { name: /Buscar/i });
    await userEvent.click(searchBtn);
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('calls onSearch when Enter pressed in input', async () => {
    const onSearch = vi.fn();
    const { container } = render(
      <SearchHeader query="test" onQueryChange={() => {}} onSearch={onSearch} />
    );
    const input = within(container).getByRole('searchbox');
    await userEvent.type(input, '{Enter}');
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('displays query value in input', () => {
    const { container } = render(
      <SearchHeader
        query="my query"
        onQueryChange={() => {}}
        onSearch={() => {}}
      />
    );
    expect(within(container).getByDisplayValue('my query')).toBeInTheDocument();
  });
});
