import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';

/**
 * Showcase page for Podigger UI Components (Phase 1).
 */
export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
            <Icon name="rss_feed" className="text-background-dark text-3xl" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Podigger UI Kit</h1>
        </div>
        <p className="text-slate-400 text-lg">Foundation and Design System (Phase 1)</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-slate-800 pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button isLoading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Icon name="settings" /></Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-slate-800 pb-2">Inputs & Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Input placeholder="Enter something..." />
            <div className="relative">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input className="pl-12" placeholder="Search episodes..." />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge>New</Badge>
            <Badge variant="secondary">Popular</Badge>
            <Badge variant="outline">Exclusive</Badge>
            <Badge variant="ghost">Draft</Badge>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-slate-800 pb-2">Cards & Loading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6" hoverable>
            <h3 className="text-xl font-bold mb-2">Hoverable Card</h3>
            <p className="text-slate-400">This card reacts to hover and focus states with a subtle scale and shadow effect.</p>
            <Button className="mt-4" size="sm" variant="secondary">Action</Button>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner className="size-10 text-primary" />
              <p className="text-sm font-bold animate-pulse">Loading content...</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}