import { Icon } from '@/components/ui/Icon';

/**
 * "Our Mission" card.
 *
 * - Mobile: bordered card with primary accent, label uppercase, centered text.
 * - Desktop: white/dark card with shadow, left-aligned text and link.
 */
export function MissionCard() {
  return (
    <section className="px-4 mb-8 md:mb-10">
      {/* Mobile */}
      <div className="md:hidden bg-primary/10 dark:bg-primary/5 border border-primary/20 p-6 rounded-xl text-center">
        <h3 className="text-primary font-bold uppercase tracking-wider text-xs mb-3">
          Our Mission
        </h3>
        <p className="text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-200">
          Podigger is your gateway to the world&apos;s most compelling stories.
          We simplify podcast discovery through advanced RSS integration and a
          seamless search experience designed for the modern listener.
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white dark:bg-surface-dark p-8 rounded-xl shadow-soft border border-slate-100 dark:border-slate-800">
        <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
          <Icon name="rocket_launch" opticalSize={24} />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
          Our Mission
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          We believe podcasting should remain open and accessible. Podigger was
          built to help listeners break out of algorithmic bubbles and explore
          the vast world of independent RSS feeds.
        </p>
        <div className="flex items-center gap-2 text-primary font-bold">
          <span>Read our manifesto</span>
          <Icon name="arrow_forward" opticalSize={20} />
        </div>
      </div>
    </section>
  );
}
