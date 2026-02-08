import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './Loading';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

/**
 * Primary button component for the application.
 * Supports multiple variants and sizes, and an optional loading state.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                    {
                        'bg-primary text-background-dark hover:brightness-110 shadow-lg shadow-primary/20': variant === 'primary',
                        'bg-white/10 text-white hover:bg-white/20': variant === 'secondary',
                        'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5': variant === 'ghost',
                        'bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5': variant === 'outline',
                        'h-10 px-6 text-sm': size === 'sm',
                        'h-12 px-8 text-base': size === 'md',
                        'h-16 px-10 text-lg leading-none': size === 'lg',
                        'size-10 p-0': size === 'icon',
                    },
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? <LoadingSpinner className="size-5" /> : children}
            </button>
        );
    }
);

Button.displayName = 'Button';
