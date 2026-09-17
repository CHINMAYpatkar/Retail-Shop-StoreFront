'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, LogOut, MapPin, Package, User } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/account', label: 'Overview', Icon: User },
  { href: '/account/orders', label: 'Orders', Icon: Package },
  { href: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', Icon: Heart },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="space-y-1">
        {LINKS.map(({ href, label, Icon }) => {
          // Exact match for the hub, prefix for the rest - otherwise /account
          // stays highlighted on every sub-page.
          const active = href === '/account' ? pathname === href : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-ink-900 text-paper-50'
                    : 'text-ink-600 hover:bg-paper-200 hover:text-ink-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}

        <li className="pt-2">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-ink-500 transition-colors hover:bg-paper-200 hover:text-chilli-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
