import { cn } from '@/lib/utils';

/**
 * Simple animated spinner for loading states.
 */
export function LoadingSpinner({ className, ...props }: React.HTMLAttributes<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('animate-spin', className)}
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

/**
 * Skeleton primitive for building complex loading layouts.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)}
            {...props}
        />
    );
}

/**
 * Full page loading overlay.
 */
export function FullPageLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <LoadingSpinner className="size-12 text-primary" />
        </div>
    );
}
