import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/search/SearchInput';

describe('SearchInput', () => {
  it('renders input and button', () => {
    render(
      <SearchInput query="" onQueryChange={() => {}} onSearch={() => {}} />
    );
    expect(
      screen.getByPlaceholderText('Buscar podcasts ou episódios...')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /buscar/i })
    ).toBeInTheDocument();
  });

  it('disables button when query is less than 2 characters', () => {
    render(
      <SearchInput query="a" onQueryChange={() => {}} onSearch={() => {}} />
    );
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  it('enables button when query has 2 or more characters', () => {
    render(
      <SearchInput query="py" onQueryChange={() => {}} onSearch={() => {}} />
    );
    expect(
      screen.getByRole('button', { name: /buscar/i })
    ).not.toBeDisabled();
  });

  it('enables button when query trims to >= 2 chars', () => {
    render(
      <SearchInput
        query="  py  "
        onQueryChange={() => {}}
        onSearch={() => {}}
      />
    );
    expect(
      screen.getByRole('button', { name: /buscar/i })
    ).not.toBeDisabled();
  });

  it('calls onQueryChange when input changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchInput query="" onQueryChange={handleChange} onSearch={() => {}} />
    );
    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, 'p');
    expect(handleChange).toHaveBeenCalledWith('p');
  });

  it('calls onSearch when Enter is pressed with valid query', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchInput
        query="python"
        onQueryChange={() => {}}
        onSearch={handleSearch}
      />
    );
    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, '{Enter}');
    expect(handleSearch).toHaveBeenCalled();
  });

  it('does not call onSearch when Enter is pressed with query < 2 chars', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchInput query="a" onQueryChange={() => {}} onSearch={handleSearch} />
    );
    const input = screen.getByPlaceholderText(
      'Buscar podcasts ou episódios...'
    );
    await user.type(input, '{Enter}');
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch when button is clicked with valid query', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchInput
        query="python"
        onQueryChange={() => {}}
        onSearch={handleSearch}
      />
    );
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(handleSearch).toHaveBeenCalled();
  });

  it('shows loading state on button when isSearching is true', () => {
    render(
      <SearchInput
        query="python"
        onQueryChange={() => {}}
        onSearch={() => {}}
        isSearching={true}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(within(button).queryByText(/buscar/i)).not.toBeInTheDocument();
  });
});
