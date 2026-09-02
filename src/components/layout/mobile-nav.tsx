'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Heart, Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicSettings } from '@/types/api';
import { text } from '@/lib/utils';
import { BrandMark } from './brand-mark';

interface NavItem {
  href: string;
  label: string;
}

/**
 * The mobile navigation drawer.
 *
 * Radix Dialog rather than a hand-rolled panel: it handles the focus trap,
 * restoring focus to the trigger on close, `aria-modal`, scroll locking and
 * Escape. Those are the parts of a drawer that are easy to omit and impossible
 * to use a keyboard or screen reader without.
 *
 * The drawer closes on navigation. Next's client-side routing does not unmount
 * it, so without this the customer taps a link and stares at the same menu over
 * the new page.
 */
export function MobileNav({
  items,
  settings,
}: {
  items: readonly NavItem[];
  settings: PublicSettings;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const phone = text(settings.business_info?.phone);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-paper-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />

        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-paper-100 shadow-lift data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          <div className="flex items-center justify-between border-b border-paper-300 px-5 py-4">
            <BrandMark branding={settings.branding} business={settings.business_info} />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-paper-200"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-3 font-display text-lg text-ink-800 transition-colors hover:bg-paper-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-0.5 border-t border-paper-300 pt-4">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-md px-3 py-3 text-ink-700 transition-colors hover:bg-paper-200"
              >
                <User className="h-4 w-4" /> Account
              </Link>
              <Link
                href="/account/wishlist"
                className="flex items-center gap-3 rounded-md px-3 py-3 text-ink-700 transition-colors hover:bg-paper-200"
              >
                <Heart className="h-4 w-4" /> Wishlist
              </Link>
            </div>
          </nav>

          {phone ? (
            <div className="border-t border-paper-300 px-5 py-4 text-sm text-ink-500">
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-ink-800">
                {phone}
              </a>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
