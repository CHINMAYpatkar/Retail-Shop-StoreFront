'use client';

import { customerApi, refreshAccessToken, setAccessToken, unwrap } from './customer-api';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore, type CartLine } from '@/store/cart-store';
import type { CustomerProfile, VerifyOtpResult } from '@/types/api';

/**
 * Sign-in, sign-out, and the guest-cart merge.
 *
 * Kept out of the components so the sequence is written down once. Each step
 * depends on the last, and getting the order wrong produces bugs that only show
 * up for real customers: merging before the token is set silently drops the
 * basket, and clearing local state before the merge succeeds loses it entirely.
 */

/** Step one: ask for a code. The response is identical whether or not the address is known. */
export async function requestOtp(email: string): Promise<void> {
  await customerApi.post('/auth/customer/otp/request', { email });
}

/**
 * Step two: verify the code, merge the guest cart, and load the profile.
 *
 * Returns what the caller needs to decide where to send the customer.
 */
export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ isNewCustomer: boolean; profileComplete: boolean; customer: CustomerProfile }> {
  const result = unwrap<VerifyOtpResult>(
    await customerApi.post('/auth/customer/otp/verify', { email, code }),
  );

  // Before anything else: the token has to be in place or every call below is
  // an unauthenticated 401.
  setAccessToken(result.accessToken);

  await mergeGuestCart();

  const customer = await loadProfile();

  return {
    isNewCustomer: result.isNewCustomer,
    profileComplete: result.profileComplete,
    customer,
  };
}

/**
 * Replays the guest cart into the server cart (ADR 0009).
 *
 * `cart.addItem` increments an existing line rather than erroring, so replaying
 * is a merge: a customer who had two jars in the browser and one already on
 * their account ends with three, not a conflict.
 *
 * Lines are sent one at a time on purpose. A product that went inactive while
 * the customer was signed out will 404, and one bad line must not take the rest
 * of the basket with it — losing a whole cart at the moment of sign-in is far
 * worse than silently dropping the item that is no longer for sale.
 *
 * Local state is cleared only for lines the server accepted, so a total failure
 * (offline, server down) leaves the basket intact to try again.
 */
export async function mergeGuestCart(): Promise<{ merged: number; skipped: number }> {
  const lines = useCartStore.getState().lines;
  if (lines.length === 0) return { merged: 0, skipped: 0 };

  let merged = 0;
  const failed: CartLine[] = [];

  for (const line of lines) {
    try {
      await customerApi.post('/customer/cart', {
        productId: line.productId,
        ...(line.variantId ? { variantId: line.variantId } : {}),
        quantity: line.quantity,
      });
      merged += 1;
    } catch {
      failed.push(line);
    }
  }

  // Keep only what could not be merged. If everything failed the guest cart is
  // untouched and the customer has lost nothing.
  useCartStore.setState({ lines: failed });

  return { merged, skipped: failed.length };
}

export async function loadProfile(): Promise<CustomerProfile> {
  const customer = unwrap<CustomerProfile>(await customerApi.get('/auth/customer/me'));
  useAuthStore.getState().setCustomer(customer);
  return customer;
}

/**
 * Restores a session on page load.
 *
 * The access token is memory-only, so every load starts signed out and asks the
 * refresh cookie whether that is actually true. Failure is the normal case for
 * a visitor who has never signed in, so it resolves to anonymous rather than
 * surfacing an error.
 */
export async function bootstrapAuth(): Promise<void> {
  const token = await refreshAccessToken();

  if (!token) {
    useAuthStore.getState().setAnonymous();
    return;
  }

  try {
    await loadProfile();
  } catch {
    // A token that refreshes but whose account is gone or deactivated.
    setAccessToken(null);
    useAuthStore.getState().setAnonymous();
  }
}

export async function signOut(): Promise<void> {
  try {
    await customerApi.post('/auth/customer/logout');
  } catch {
    // The customer asked to be signed out. A failed revoke must not leave them
    // looking signed in - clear locally regardless.
  }

  setAccessToken(null);
  useAuthStore.getState().setAnonymous();

  // The basket belonged to the account. Leaving it behind would show the next
  // person at this browser what the previous one was buying.
  useCartStore.getState().clear();
}
