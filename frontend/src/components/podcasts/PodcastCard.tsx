'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import type { Podcast } from '@/lib/api';

interface PodcastCardProps {
    podcast: Podcast;
}

export function PodcastCard({ podcast }: PodcastCardProps) {
    const imageUrl = podcast.image || '/static/dist/img/podcast-banner.png';

    return (
        <Card hoverable className="overflow-hidden p-4">
            <Link href={`/podcasts/${podcast.id}`} className="flex gap-4 group">
                <div className="shrink-0">
                    {podcast.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={imageUrl}
                            alt={podcast.name}
                            className="size-20 md:size-24 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="size-20 md:size-24 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Icon name="podcasts" opticalSize={28} className="text-slate-400" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-bold leading-tight mb-1 truncate text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {podcast.name}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs md:text-sm">
                        <span className="flex items-center gap-1">
                            <Icon name="description" opticalSize={14} />
                            {podcast.total_episodes} episodes
                        </span>
                    </div>
                    <div className="mt-2 text-primary text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View details
                        <Icon name="arrow_forward_ios" opticalSize={12} />
                    </div>
                </div>
            </Link>
        </Card>
    );
}
