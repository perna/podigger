import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BottomNav } from '../BottomNav';

describe('BottomNav', () => {
  it('renders all nav items', () => {
    render(<BottomNav />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Search')).toBeDefined();
    expect(screen.getByText('Library')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('home link points to /', () => {
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    const homeLink = links.find((l) => l.getAttribute('href') === '/');
    expect(homeLink).toBeDefined();
  });

  it('highlights active item when activeItem is home', () => {
    render(<BottomNav activeItem="home" />);
    const links = screen.getAllByRole('link');
    const homeLink = links.find((l) => l.getAttribute('href') === '/' && l.textContent?.includes('Home'));
    expect(homeLink?.querySelector('.text-primary')).toBeDefined();
  });

  it('highlights search when activeItem is search', () => {
    render(<BottomNav activeItem="search" />);
    const links = screen.getAllByRole('link');
    const searchLink = links.find((l) => l.textContent?.includes('Search'));
    expect(searchLink?.querySelector('.text-primary')).toBeDefined();
  });
});
