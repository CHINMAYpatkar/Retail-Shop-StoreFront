'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Announcement } from '@/types/api';
import { text } from '@/lib/utils';

const DISMISS_KEY = 'rs-announcement-dismissed';

/**
 * The dismissible bar above the header (`SF-31`).
 *
 * Renders nothing at all when the admin has not enabled it or has left the
 * message blank — an empty coloured strip is worse than no strip.
 *
 * The dismissal is keyed on the message text, not a fixed flag, so publishing a
 * NEW announcement shows it again to someone who dismissed the previous one.
 * A permanent "dismissed" flag would mean the second announcement the shop ever
 * writes is invisible to its most engaged customers.
 */
export function AnnouncementBar({ announcement }: { announcement?: Announcement }) {
  const message = text(announcement?.message);
  const enabled = announcement?.enabled !== false && Boolean(message);

  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!message) return;
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === message);
    } catch {
      // Private mode, or site data blocked. Showing the bar is the safe
      // failure: the customer can still close it for this page view.
      setDismissed(false);
    }
  }, [message]);

  if (!enabled || dismissed) return null;

  const label = text(announcement?.linkLabel);
  const href = text(announcement?.linkUrl);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, message as string);
    } catch {
      // Nothing to do: it stays dismissed for this page view only.
    }
  };

  return (
    <div className="relative bg-ink-900 text-paper-100">
      <div className="shell flex items-center justify-center gap-3 py-2 pr-8 text-center text-[13px]">
        <p className="leading-snug">
          {message}
          {href && label ? (
            <a
              href={href}
              className="ml-2 font-medium text-gold-300 underline underline-offset-2 hover:text-gold-200"
            >
              {label}
            </a>
          ) : null}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-paper-300 transition-colors hover:text-paper-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
