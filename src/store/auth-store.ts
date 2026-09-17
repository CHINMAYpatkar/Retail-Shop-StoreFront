'use client';

import { create } from 'zustand';
import type { CustomerProfile } from '@/types/api';

/**
 * Who is signed in.
 *
 * **Deliberately not persisted.** The access token lives in memory inside
 * `customer-api.ts`, and the profile is derived from it, so writing either to
 * `localStorage` would defeat the point (ADR 0015) and would also let the UI
 * claim someone is signed in when their session has actually expired.
 *
 * `status` rather than a boolean, because "we have not checked yet" and "not
 * signed in" must render differently. Treating unknown as signed-out makes the
 * header flash "Sign in" on every page load for a customer who is signed in.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  customer: CustomerProfile | null;

  setCustomer: (customer: CustomerProfile) => void;
  setAnonymous: () => void;
  patchCustomer: (patch: Partial<CustomerProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  customer: null,

  setCustomer: (customer) => set({ customer, status: 'authenticated' }),
  setAnonymous: () => set({ customer: null, status: 'anonymous' }),
  patchCustomer: (patch) =>
    set((state) => ({
      customer: state.customer ? { ...state.customer, ...patch } : state.customer,
    })),
}));

/** True once we know the answer either way. */
export function useAuthResolved(): boolean {
  return useAuthStore((state) => state.status !== 'unknown');
}
