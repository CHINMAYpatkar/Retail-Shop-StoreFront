'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

/**
 * The search box.
 *
 * Submits as a navigation to `/search?q=…` rather than fetching inline, so a
 * search result is a real URL: shareable, bookmarkable, and served from the
 * same cached catalogue query the shop page uses.
 */
export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
      }}
      className="relative"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
      />
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search blends and spices"
        aria-label="Search products"
        className="w-full rounded-md border border-ink-200 bg-paper-50 py-3.5 pl-11 pr-4 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
      />
    </form>
  );
}
