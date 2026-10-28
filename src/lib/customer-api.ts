'use client';

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import type { ApiEnvelope } from '@/types/api';

/**
 * The browser-side API client for everything behind customer authentication.
 *
 * Separate from the server-side `fetch` layer in `server-api.ts`, which is for
 * cached public content and must never carry credentials.
 *
 * ## Why the access token lives in a module variable
 *
 * It is held **in memory only** — never in `localStorage`, never in a cookie
 * this script can read. ADR 0015: a token on disk is a token an XSS can read
 * and exfiltrate. Keeping it in a closure means the worst an injected script
 * can do is ride the current page, not walk away with the session.
 *
 * The cost is that a reload loses it, which is exactly why `bootstrapAuth`
 * exists: on load the app calls `refresh`, and the httpOnly cookie the browser
 * sends — which script cannot read — mints a new access token.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const customerApi = axios.create({
  baseURL: API_URL,
  // Required for the refresh cookie to travel. Without it the browser silently
  // drops the cookie on a cross-origin call and every refresh returns 401 with
  // nothing in the request to explain why.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

customerApi.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // FormData must not carry the instance's default JSON content type: a
  // multipart body is only parseable with a boundary, and the browser only
  // generates one when the header is left unset. This bit the admin app hard
  // enough to be worth carrying over.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

/**
 * The actual network call. Private - every caller must go through
 * `refreshAccessToken`, which coalesces.
 */
async function performRefresh(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${API_URL}/auth/customer/refresh`,
      {},
      { withCredentials: true },
    );
    const token = data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Refreshes the access token from the httpOnly cookie, coalescing concurrent
 * callers onto one request.
 *
 * **The coalescing is required for correctness, not performance.** Refresh
 * tokens ROTATE: using one invalidates it and issues a replacement. So two
 * refreshes racing means the first succeeds and the second replays a token that
 * no longer exists, gets a 401, and signs the customer out.
 *
 * That is not hypothetical. React StrictMode runs effects twice in development,
 * so the session bootstrap fired two refreshes on every page load and the
 * customer was signed straight back out - intermittently, depending on which
 * won. In production the same race appears whenever two things need a token at
 * once.
 *
 * Which is why this, rather than the raw call, is what is exported: a caller
 * cannot opt out of the coalescing by accident. The bootstrap originally called
 * the raw version directly, which is how the bug got in.
 *
 * Returns null rather than throwing when there is no usable session - "not
 * signed in" is a normal state for a storefront, not an error.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Called when a refresh fails and the session is genuinely over. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

customerApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // Never try to refresh a failed refresh, or a failed sign-in. Both would
    // recurse, and a 401 from `otp/verify` means "wrong code", not "stale
    // token" — retrying it would swallow the real error.
    const isAuthCall = original?.url?.includes('/auth/customer/');

    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    original._retried = true;
    const token = await refreshAccessToken();

    if (!token) {
      setAccessToken(null);
      onSessionExpired?.();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return customerApi(original);
  },
);

/** Unwraps the `{ success, data }` envelope the API returns. */
export function unwrap<T>(response: { data: ApiEnvelope<T> | T }): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}
