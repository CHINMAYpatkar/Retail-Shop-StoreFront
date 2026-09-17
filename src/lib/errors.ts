import { AxiosError } from 'axios';

/**
 * Turns an API failure into something worth showing a customer.
 *
 * The backend sends `{ message }`, sometimes as an array when validation
 * produced several problems. Falls back to a supplied default rather than
 * leaking a stack trace or showing "Request failed with status code 400",
 * which tells a customer nothing they can act on.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

    if (Array.isArray(message) && message.length > 0) return message[0];
    if (typeof message === 'string' && message.trim()) return message;

    // A network failure has no response at all, and is worth saying plainly -
    // "check your connection" is actionable where a generic error is not.
    if (!error.response) return 'Could not reach the shop. Check your connection and try again.';
  }

  return fallback;
}
