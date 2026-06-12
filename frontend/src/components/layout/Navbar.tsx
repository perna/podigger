'use client';

// Feature: api-authentication-strategy
// Requirements: 9.1, 9.2

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const publicNavLinks = [
    { label: 'Search', href: '/', icon: 'search' },
    { label: 'Podcasts', href: '/podcasts', icon: 'podcasts' },
    { label: 'About', href: '/about', icon: 'info' },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();

    // Show "Add Podcast" link only for editor and admin roles
    const navLinks = [
        ...publicNavLinks,
        ...(isAuthenticated && user && (user.role === 'editor' || user.role === 'admin')
            ? [{ label: 'Add Podcast', href: '/add-podcast', icon: 'add_circle' }]
            : []),
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // Proceed with client-side logout even if the request fails
        }
        logout();
        router.push('/');
    };

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

                        {/* Auth Actions (desktop only) */}
                        {isAuthenticated && user ? (
                            <div className="hidden md:flex items-center gap-3">
                                {/* User info badge */}
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                                    {user.role}
                                </span>
                                {/* Logout button */}
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                    aria-label="Logout"
                                >
                                    <Icon name="logout" opticalSize={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <Icon name="login" opticalSize={18} />
                                <span>Login</span>
                            </Link>
                        )}

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
