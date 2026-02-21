import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Standard input component for forms and searches.
 * Styled to match the Podigger design system.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'flex h-12 w-full rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-display',
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
