import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageFilter } from '../LanguageFilter';

vi.mock('@/lib/api', () => ({
  fetchLanguages: vi.fn(),
}));

import * as api from '@/lib/api';

const mockLanguages: api.PodcastLanguage[] = [
  { id: 1, code: 'pt', name: 'Português' },
  { id: 2, code: 'en', name: 'Inglês' },
];

describe('LanguageFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and renders language options', async () => {
    vi.mocked(api.fetchLanguages).mockResolvedValueOnce(mockLanguages);
    const { container } = render(
      <LanguageFilter selectedLanguageId={null} onLanguageChange={() => {}} />
    );
    expect(await within(container).findByText('Português')).toBeInTheDocument();
    expect(within(container).getByText('Inglês')).toBeInTheDocument();
    expect(within(container).getByText('Todos os idiomas')).toBeInTheDocument();
  });

  it('calls onLanguageChange when selecting a language', async () => {
    vi.mocked(api.fetchLanguages).mockResolvedValueOnce(mockLanguages);
    const onLanguageChange = vi.fn();
    const { container } = render(
      <LanguageFilter selectedLanguageId={null} onLanguageChange={onLanguageChange} />
    );
    const select = await within(container).findByRole('combobox');
    await userEvent.selectOptions(select, '2');
    expect(onLanguageChange).toHaveBeenCalledWith(2);
  });

  it('calls onLanguageChange with null when selecting "Todos os idiomas"', async () => {
    vi.mocked(api.fetchLanguages).mockResolvedValueOnce(mockLanguages);
    const onLanguageChange = vi.fn();
    const { container } = render(
      <LanguageFilter selectedLanguageId={1} onLanguageChange={onLanguageChange} />
    );
    const select = await within(container).findByRole('combobox');
    await userEvent.selectOptions(select, '');
    expect(onLanguageChange).toHaveBeenCalledWith(null);
  });
});
