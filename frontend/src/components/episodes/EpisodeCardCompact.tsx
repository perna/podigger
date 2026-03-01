import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import type { Episode } from '@/lib/api';

interface EpisodeCardCompactProps {
    episode: Episode;
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    const diffW = Math.floor(diffD / 7);

    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD === 0) return 'Today';
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return `${diffD} days ago`;
    if (diffW === 1) return '1 week ago';
    return `${diffW} weeks ago`;
}

export function EpisodeCardCompact({ episode }: EpisodeCardCompactProps) {
    const podcastName = episode.podcast?.name ?? 'Podcast';
    const podcastImage = episode.podcast?.image ?? null;
    const podcastId = episode.podcast?.id;

    return (
        <Card hoverable className="p-5">
            <div className="flex gap-4">
                <div className="shrink-0">
                    {podcastImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={podcastImage}
                            alt=""
                            className="size-20 md:size-28 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="size-20 md:size-28 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Icon
                                name="podcasts"
                                opticalSize={28}
                                className="text-slate-400"
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                        <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">
                            {podcastName}
                        </p>
                        <h3 className="text-base md:text-lg font-bold leading-tight mb-2 truncate text-slate-900 dark:text-white">
                            {episode.title}
                        </h3>
                        {episode.description && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm line-clamp-2 leading-relaxed">
                                {episode.description}
                            </p>
                        )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] md:text-xs text-slate-400">
                            {episode.published && formatRelativeTime(episode.published)}
                        </span>
                        {podcastId && (
                            <Link
                                href={`/podcasts/${podcastId}`}
                                className="text-primary text-xs md:text-sm font-semibold hover:underline"
                            >
                                View Podcast
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                    href={episode.enclosure || episode.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-2 rounded-full hover:bg-primary/90 transition-colors text-sm"
                >
                    <Icon name="play_arrow" opticalSize={20} />
                    Play
                </a>
            </div>
        </Card>
    );
}
