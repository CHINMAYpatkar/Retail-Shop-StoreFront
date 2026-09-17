/**
 * Date formatting for customer-facing screens.
 *
 * An explicit locale and time zone, because leaving them to the runtime renders
 * one string on the server and another in the browser, and React reports that
 * as a hydration mismatch. Asia/Kolkata rather than UTC: an order placed at
 * 11pm should not appear to have been placed the next day.
 */
export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}

export function formatOrderDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}
