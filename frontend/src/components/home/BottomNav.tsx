'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

type NavItem = 'home' | 'search' | 'library' | 'settings';

const items: { id: NavItem; label: string; icon: string; href: string }[] = [
  { id: 'home', label: 'Home', icon: 'home', href: '/' },
  { id: 'search', label: 'Search', icon: 'search', href: '/' },
  { id: 'library', label: 'Library', icon: 'library_music', href: '#' },
  { id: 'settings', label: 'Settings', icon: 'settings', href: '#' },
];

interface BottomNavProps {
  activeItem?: NavItem;
}

export function BottomNav({ activeItem = 'home' }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 pb-8 pt-2 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {items.map(({ id, label, icon, href }) => {
          const isActive = activeItem === id;
          const content = (
            <span
              className={cn(
                'flex flex-col items-center gap-1',
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <Icon name={icon} opticalSize={24} />
              <span className="text-[10px] font-bold">{label}</span>
            </span>
          );
          return (
            <Link key={id} href={href} className="transition-colors">
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
