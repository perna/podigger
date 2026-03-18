import type { Metadata } from 'next';
import { AboutHero } from './components/AboutHero';
import { MissionCard } from './components/MissionCard';
import { HowItWorks } from './components/HowItWorks';
import { ActionList } from './components/ActionList';
import { ContactSection } from './components/ContactSection';
import { SocialLinks } from './components/SocialLinks';
import { AboutFooter } from './components/AboutFooter';

export const metadata: Metadata = {
  title: 'About – Podigger',
  description:
    'Learn about Podigger, the open podcast aggregator built on RSS. Our mission, how it works, and how to get in touch.',
};

/**
 * About page — /about
 *
 * Server Component. All interactive sub-components are individually
 * marked as 'use client' where necessary.
 *
 * Layout:
 * - Mobile: Hero → MissionCard → ActionList → SocialLinks → Footer
 * - Desktop: Hero → MissionCard → HowItWorks → ContactSection → SocialLinks → Footer
 */
export default function AboutPage() {
  return (
    <div className="max-w-lg mx-auto pb-20">
      <AboutHero />
      <MissionCard />
      <HowItWorks />
      <ActionList />
      <ContactSection />
      <SocialLinks />
      <AboutFooter />
    </div>
  );
}
