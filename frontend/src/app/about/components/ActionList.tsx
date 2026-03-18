'use client';

import { Icon } from '@/components/ui/Icon';

const actions = [
  {
    icon: 'share',
    label: 'Share Podigger',
    onClick: async () => {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Podigger',
          text: 'Discover your next podcast obsession!',
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
      }
    },
  },
  {
    icon: 'help',
    label: 'Help & Support',
    href: 'mailto:support@podigger.app',
  },
] as const;

/**
 * iOS-style action list row.
 * Visible on mobile only (md:hidden).
 */
export function ActionList() {
  return (
    <section className="md:hidden space-y-3 mb-12 px-6">
      {actions.map((action) => {
        const content = (
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Icon name={action.icon} opticalSize={22} />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {action.label}
            </span>
          </div>
        );

        if ('href' in action) {
          return (
            <a
              key={action.label}
              href={action.href}
              className="flex w-full items-center justify-between bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 transition-transform active:scale-[0.98]"
            >
              {content}
              <Icon name="chevron_right" className="text-slate-400" />
            </a>
          );
        }

        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex w-full items-center justify-between bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 transition-transform active:scale-[0.98]"
          >
            {content}
            <Icon name="chevron_right" className="text-slate-400" />
          </button>
        );
      })}
    </section>
  );
}
