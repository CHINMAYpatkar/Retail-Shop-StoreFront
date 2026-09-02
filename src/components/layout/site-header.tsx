import Link from 'next/link';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import type { PublicSettings } from '@/types/api';
import { AnnouncementBar } from './announcement-bar';
import { BrandMark } from './brand-mark';
import { MobileNav } from './mobile-nav';

/**
 * Primary navigation.
 *
 * These five destinations are **interface structure, not content** — they are
 * the routes this application implements, so they live in code. That is the
 * line drawn in `SF-32`: the shop's words are admin-managed, the shop's
 * information architecture is not. Making the nav admin-editable would let
 * someone link to a route that does not exist.
 *
 * The words shown here are still the shop's, in the sense that a category name
 * comes from the database — but "there is a shop page" is a fact about this
 * codebase.
 */
const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/ingredients', label: 'Our Spices' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' },
] as const;

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  return (
    <>
      <AnnouncementBar announcement={settings.announcement} />

      <header className="sticky top-0 z-40 border-b border-paper-300/70 bg-paper-100/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper-100/70">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileNav items={NAV} settings={settings} />
            <BrandMark
              branding={settings.branding}
              business={settings.business_info}
              priority
            />
          </div>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group relative text-sm text-ink-600 transition-colors hover:text-ink-900"
                  >
                    {item.label}
                    {/* Underline grows from the left on hover. Transform only,
                        so it composites rather than triggering layout. */}
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold-500 transition-transform duration-300 ease-spice group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <HeaderIcon href="/search" label="Search">
              <Search className="h-[18px] w-[18px]" />
            </HeaderIcon>
            <HeaderIcon href="/account/wishlist" label="Wishlist" className="hidden sm:inline-flex">
              <Heart className="h-[18px] w-[18px]" />
            </HeaderIcon>
            <HeaderIcon href="/account" label="Account" className="hidden sm:inline-flex">
              <User className="h-[18px] w-[18px]" />
            </HeaderIcon>
            <HeaderIcon href="/cart" label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </HeaderIcon>
          </div>
        </div>
      </header>
    </>
  );
}

function HeaderIcon({
  href,
  label,
  children,
  className = '',
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      // 40px hit target: below ~44px, taps get missed on a phone.
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-paper-200 hover:text-ink-900 ${className}`}
    >
      {children}
    </Link>
  );
}
