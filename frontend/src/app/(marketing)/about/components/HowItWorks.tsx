import { Icon } from '@/components/ui/Icon';

const features = [
  {
    icon: 'rss_feed',
    title: 'RSS-First Engine',
    description:
      'Directly parse any valid RSS feed with lightning speed. No proprietary middlemen between you and the content.',
  },
  {
    icon: 'auto_awesome_motion',
    title: 'Infinite Discovery',
    description:
      'Our discovery engine surfaces trending and niche shows based on real-time global feed updates.',
  },
  {
    icon: 'devices',
    title: 'Native Experience',
    description:
      'Built with performance in mind. Low latency, high-fidelity streaming, and keyboard-first navigation.',
  },
] as const;

/**
 * "How it Works" feature list.
 *
 * - Mobile: hidden (content is part of MissionCard + ActionList flow).
 * - Desktop: vertical list of feature items with icon + title + description.
 *   Dark mode: each item is a bordered card.
 *   Light mode: items with subtle separator only.
 */
export function HowItWorks() {
  return (
    <section className="hidden md:block px-4 mb-8">
      <h3 className="text-xl font-extrabold mb-6 px-2 text-slate-900 dark:text-white">
        How it Works
      </h3>
      <div className="space-y-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-4 items-start p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="size-12 shrink-0 bg-primary/10 dark:bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
              <Icon name={feature.icon} opticalSize={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                {feature.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
