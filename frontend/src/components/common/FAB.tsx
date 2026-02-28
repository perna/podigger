import { Icon } from '@/components/ui/Icon';

export function FAB() {
    return (
        <button
            type="button"
            className="fixed bottom-6 right-6 size-14 bg-primary text-background-dark rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
            aria-label="Add RSS feed"
        >
            <Icon name="rss_feed" opticalSize={28} />
        </button>
    );
}
