'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

const navLinks = [
    { label: 'Search', href: '/', icon: 'search' },
    { label: 'Add Podcast', href: '/add-podcast', icon: 'add_circle' },
    { label: 'About', href: '/about', icon: 'info' },
];

export function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-primary">
                            <Icon name="podcasts" opticalSize={28} />
                        </span>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Podigger
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map(({ label, href }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        'font-semibold transition-colors',
                                        isActive
                                            ? 'text-primary'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <Icon
                                name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                                opticalSize={20}
                            />
                        </button>

                        {/* User Avatar (desktop only) */}
                        <button
                            type="button"
                            className="hidden md:flex items-center justify-center size-10 rounded-full bg-slate-200 dark:bg-slate-800"
                            aria-label="User profile"
                        >
                            <Icon name="person" opticalSize={20} />
                        </button>

                        {/* Mobile Hamburger */}
                        <button
                            type="button"
                            className="p-2 text-slate-600 dark:text-slate-400 md:hidden"
                            aria-label="Open menu"
                        >
                            <Icon name="menu" opticalSize={24} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
