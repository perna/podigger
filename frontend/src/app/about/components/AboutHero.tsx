import { Icon } from '@/components/ui/Icon';
import { APP_VERSION } from '@/lib/constants';

/**
 * Hero section for the About page.
 *
 * - Mobile: Podigger icon with glow effect, app name and version.
 * - Desktop: hero image card with gradient overlay, version badge and tagline.
 */
export function AboutHero() {
  return (
    <>
      {/* ── Mobile hero ── */}
      <div className="flex flex-col items-center justify-center pt-10 pb-4 px-6 text-center md:hidden">
        <div className="relative mb-6">
          {/* Glow */}
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative h-32 w-32 overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br from-primary to-primary/60 p-6 flex items-center justify-center">
            <Icon name="podcasts" opticalSize={48} className="text-white text-7xl leading-none" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-1 text-slate-900 dark:text-white">
          Podigger
        </h2>
        <p className="text-slate-500 dark:text-muted-dark font-medium">
          Version {APP_VERSION}
        </p>
      </div>

      {/* ── Desktop hero ── */}
      <section className="hidden md:block p-4">
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex flex-col justify-end min-h-[260px] relative bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 60%),
                linear-gradient(135deg, #0d2d3a 0%, #0db9f2 100%)`,
            }}
          >
            <div className="p-6">
              <div className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white w-fit mb-2">
                Version {APP_VERSION}
              </div>
              <h1 className="text-white text-3xl font-extrabold leading-tight">
                Podigger
              </h1>
            </div>
          </div>
        </div>

        <div className="pt-8 pb-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">
            Discover your next obsession.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            The ultimate discovery engine for RSS-powered podcasts. Clean, fast,
            and completely open.
          </p>
        </div>
      </section>
    </>
  );
}
