import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageClient } from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Buscar – Podigger',
  description: 'Busque podcasts e episódios no Podigger.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
