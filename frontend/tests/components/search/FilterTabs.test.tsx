import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterTabs } from '@/components/search/FilterTabs';

describe('FilterTabs', () => {
  it('renders three tabs', () => {
    render(<FilterTabs activeTab="todos" onTabChange={() => {}} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Episódios')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<FilterTabs activeTab="podcasts" onTabChange={() => {}} />);
    const podcastTab = screen.getByText('Podcasts');
    expect(podcastTab.className).toContain('border-primary');
  });

  it('calls onTabChange with correct value when tab is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterTabs activeTab="todos" onTabChange={handleChange} />);
    await user.click(screen.getByText('Episódios'));
    expect(handleChange).toHaveBeenCalledWith('episodios');
  });

  it('does not highlight inactive tabs', () => {
    render(<FilterTabs activeTab="todos" onTabChange={() => {}} />);
    const podcastTab = screen.getByText('Podcasts');
    expect(podcastTab.className).not.toContain('border-primary');
  });
});
