import { Icon } from '@/components/ui/Icon';
import { SOCIAL_LINKS } from '@/lib/constants';

/**
 * Contact / Get in Touch section.
 * Visible on desktop only (hidden on mobile — the ActionList covers this).
 */
export function ContactSection() {
  return (
    <section className="hidden md:block px-4 mb-12">
      <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
          Get in Touch
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={SOCIAL_LINKS.email}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-3 rounded-full font-bold text-sm text-slate-900 dark:text-white hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="mail" opticalSize={18} />
            Support
          </a>
          <a
            href={SOCIAL_LINKS.discord}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-3 rounded-full font-bold text-sm text-slate-900 dark:text-white hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="forum" opticalSize={18} />
            Discord
          </a>
        </div>
      </div>
    </section>
  );
}
