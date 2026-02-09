import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

/**
 * Basic card component used as a container for various content blocks like episodes or podcast details.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hoverable = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 transition-all overflow-hidden',
                    hoverable && 'hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';
