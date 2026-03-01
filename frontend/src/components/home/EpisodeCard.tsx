import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import type { Episode } from '@/lib/api';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"%3E%3Crect fill="%23475569" width="400" height="225"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14"%3ENo image%3C/text%3E%3C/svg%3E';

interface EpisodeCardProps {
  episode: Episode;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const podcastName = episode.podcast?.name ?? 'Podcast';
  const podcastImage = episode.podcast?.image ?? null;
  const imageUrl = podcastImage || PLACEHOLDER_IMAGE;
  const podcastId = episode.podcast?.id;

  return (
    <Card hoverable className="overflow-hidden">
      <div className="group relative flex flex-col">
        <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-700 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex flex-col p-5 gap-3">
          <div className="space-y-1">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-snug line-clamp-2">
              {episode.title}
            </h3>
            <p className="text-primary text-sm font-semibold tracking-wide uppercase truncate">
              {podcastName}
            </p>
          </div>
          {episode.description && (
            <p className="text-slate-600 dark:text-muted-dark text-sm font-normal leading-relaxed line-clamp-2">
              {episode.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-2">
            <a
              href={episode.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-primary text-background-dark font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
            >
              <Icon name="play_arrow" opticalSize={20} />
              <span>Play</span>
            </a>
            {podcastId && (
              <Link
                href={`/podcasts/${podcastId}`}
                className="text-slate-500 dark:text-slate-400 text-sm font-semibold flex items-center gap-1 hover:text-primary transition-colors"
              >
                View Podcast
                <Icon name="arrow_forward_ios" opticalSize={12} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
