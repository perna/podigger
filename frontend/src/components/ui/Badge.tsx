import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

/**
 * Component for displaying small pieces of information like tags, categories, or status indicators.
 */
export function Badge({ variant = 'primary', className, ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors',
                {
                    'bg-primary text-background-dark': variant === 'primary',
                    'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100': variant === 'secondary',
                    'border border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-100': variant === 'outline',
                    'bg-transparent text-slate-500': variant === 'ghost',
                },
                className
            )}
            {...props}
        />
    );
}
