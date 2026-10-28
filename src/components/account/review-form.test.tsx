// @vitest-environment jsdom
/**
 * The review form.
 *
 * The backend gates reviews hard - delivered orders only, one per product, and
 * it holds every review as PENDING. These cover the client half of that
 * contract: send what the API accepts, and never tell the customer their
 * review is live when it is only submitted.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const post = vi.fn();
vi.mock('@/lib/customer-api', () => ({
  customerApi: { post: (...args: unknown[]) => post(...args) },
}));

const success = vi.fn();
const error = vi.fn();
vi.mock('sonner', () => ({ toast: { success: (m: string) => success(m), error: (m: string) => error(m) } }));

import { ReviewForm } from './review-form';

const PRODUCT = '7f1c2a9e-0000-4000-8000-000000000001';

function renderForm(onDone = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ReviewForm productId={PRODUCT} productName="Garam Masala" onDone={onDone} />
    </QueryClientProvider>,
  );
  return onDone;
}

const star = (n: number) => screen.getByRole('button', { name: `${n} ${n === 1 ? 'star' : 'stars'}` });
const submitButton = () => screen.getByRole('button', { name: /submit review/i });

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: { data: {} } });
  success.mockReset();
  error.mockReset();
});

describe('rating', () => {
  it('cannot be submitted without one', async () => {
    // Rating is the only required field on the API, so a 0 submit is a
    // guaranteed 400 - the form refuses rather than round-tripping it.
    renderForm();
    expect(submitButton()).toBeDisabled();

    await userEvent.click(submitButton());
    expect(post).not.toHaveBeenCalled();
  });

  it('explains why the button is disabled', () => {
    renderForm();
    expect(screen.getByText(/choose a rating to continue/i)).toBeInTheDocument();
  });

  it('enables submission once a star is chosen', async () => {
    renderForm();
    await userEvent.click(star(4));
    expect(submitButton()).toBeEnabled();
    expect(screen.queryByText(/choose a rating to continue/i)).not.toBeInTheDocument();
  });

  it('exposes each star as a labelled button', () => {
    // A row of clickable divs would be invisible to a keyboard and a screen
    // reader; the labels are what make the control usable at all.
    renderForm();
    for (const n of [1, 2, 3, 4, 5]) expect(star(n)).toBeInTheDocument();
  });

  it('marks the chosen star as pressed', async () => {
    renderForm();
    await userEvent.click(star(3));
    expect(star(3)).toHaveAttribute('aria-pressed', 'true');
    expect(star(2)).toHaveAttribute('aria-pressed', 'false');
  });

  it('replaces, not accumulates, when a different star is clicked', async () => {
    renderForm();
    await userEvent.click(star(5));
    await userEvent.click(star(2));
    await userEvent.click(submitButton());

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ rating: 2 });
  });
});

describe('payload', () => {
  it('omits optional fields rather than sending empty strings', async () => {
    // `forbidNonWhitelisted` is on, and the DTO bounds the string lengths;
    // sending "" for an untouched field invites a 400 for no reason.
    renderForm();
    await userEvent.click(star(5));
    await userEvent.click(submitButton());

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/customer/reviews');
    expect(post.mock.calls[0][1]).toEqual({ productId: PRODUCT, rating: 5 });
  });

  it('trims the headline and comment', async () => {
    renderForm();
    await userEvent.click(star(4));
    await userEvent.type(screen.getByLabelText(/headline/i), '  Excellent  ');
    await userEvent.type(screen.getByLabelText(/your review/i), '  Smelled wonderful.  ');
    await userEvent.click(submitButton());

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toEqual({
      productId: PRODUCT,
      rating: 4,
      title: 'Excellent',
      comment: 'Smelled wonderful.',
    });
  });

  it('treats whitespace-only text as absent', async () => {
    renderForm();
    await userEvent.click(star(4));
    await userEvent.type(screen.getByLabelText(/headline/i), '   ');
    await userEvent.click(submitButton());

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).not.toHaveProperty('title');
  });

  it('caps the comment at the length the API accepts', () => {
    // The DTO rejects over 2000 characters; stopping at the input is kinder
    // than letting someone write an essay and lose it to a 400.
    renderForm();
    expect(screen.getByLabelText(/your review/i)).toHaveAttribute('maxLength', '2000');
    expect(screen.getByLabelText(/headline/i)).toHaveAttribute('maxLength', '150');
  });
});

describe('outcome', () => {
  it('tells the customer the review awaits approval, not that it is published', async () => {
    // Every review is created PENDING. Saying "your review is live" would be
    // a lie the customer could check in one click.
    renderForm();
    await userEvent.click(star(5));
    await userEvent.click(submitButton());

    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(success.mock.calls[0][0]).toMatch(/approval/i);
  });

  it('closes the form on success', async () => {
    const onDone = renderForm();
    await userEvent.click(star(5));
    await userEvent.click(submitButton());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('keeps the form open and reports the failure when the API refuses', async () => {
    // "You have already reviewed this product" is actionable; swallowing it
    // and closing the form leaves the customer retyping into nothing.
    post.mockRejectedValue(new Error('already reviewed'));
    const onDone = renderForm();
    await userEvent.click(star(5));
    await userEvent.click(submitButton());

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(onDone).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(submitButton()).toBeInTheDocument();
  });

  it('cancels without submitting', async () => {
    const onDone = renderForm();
    await userEvent.click(star(5));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDone).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('says reviews are checked before they appear', () => {
    renderForm();
    expect(screen.getByText(/checked before they appear/i)).toBeInTheDocument();
  });
});
