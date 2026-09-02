import 'server-only';
import { API_URL, REVALIDATE } from './config';
import type { ApiEnvelope } from '@/types/api';

/**
 * Server-side data access for the storefront.
 *
 * Uses `fetch` rather than axios deliberately: only `fetch` participates in
 * Next's caching and revalidation, which is the whole mechanism ADR 0010 chose
 * for the catalogue. An axios call from a server component would be
 * uncacheable and would run on every request.
 *
 * `server-only` at the top makes importing this from a client component a build
 * error rather than a subtle bundling problem.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface GetOptions {
  /** Seconds. Omit for the content default. */
  revalidate?: number;
  /** Cache tags, so a future admin webhook can invalidate precisely. */
  tags?: string[];
}

/**
 * Fetches and unwraps the `{ success, data }` envelope the API returns.
 *
 * Throws on a non-2xx other than 404. Callers that can reasonably render
 * without the data should use `getOptional` instead - the storefront is fully
 * dynamic, so "this content does not exist yet" is a normal state during
 * launch, not an error.
 */
export async function get<T>(path: string, options: GetOptions = {}): Promise<T> {
  const url = `${API_URL}/${path.replace(/^\/+/, '')}`;

  const res = await fetch(url, {
    next: {
      revalidate: options.revalidate ?? REVALIDATE.content,
      ...(options.tags ? { tags: options.tags } : {}),
    },
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new ApiError(res.status, path, `GET ${path} failed with ${res.status}`);
  }

  const body = (await res.json()) as ApiEnvelope<T> | T;
  return unwrap<T>(body);
}

/**
 * Like `get`, but returns `null` instead of throwing.
 *
 * Used for every piece of admin-managed content. A shop that has not yet
 * written its About page should render without it, not return a 500 - the
 * no-static-content rule means half the site is empty on day one by design.
 */
export async function getOptional<T>(path: string, options: GetOptions = {}): Promise<T | null> {
  try {
    return await get<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    // A genuine failure (API down, 500) is worth knowing about in the server
    // log, but must not take the whole page down with it.
    console.error(`[storefront] optional fetch failed: ${path}`, error);
    return null;
  }
}

function unwrap<T>(body: ApiEnvelope<T> | T): T {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}
