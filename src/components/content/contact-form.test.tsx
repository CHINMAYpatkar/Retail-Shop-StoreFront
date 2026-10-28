// @vitest-environment jsdom
/**
 * The contact form.
 *
 * `/contact` had been telling customers to "use the support form" since the
 * demo content was written, with no form behind it. These cover the two things
 * that are easy to get wrong now that there is one: posting to the right
 * endpoint for the signed-in state, and not losing the reference number the
 * customer needs to quote back.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const post = vi.fn();
vi.mock('@/lib/customer-api', () => ({
  customerApi: { post: (...args: unknown[]) => post(...args) },
  unwrap: (res: { data: { data: unknown } }) => res.data.data,
}));

const authState = { status: 'anonymous' as string, customer: null as unknown };
vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

import { ContactForm } from './contact-form';

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ContactForm />
    </QueryClientProvider>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/your name/i), 'Chinmay');
  await userEvent.type(screen.getByLabelText(/email/i), 'me@example.test');
  await userEvent.type(screen.getByLabelText(/subject/i), 'Damaged jar');
  await userEvent.type(screen.getByLabelText(/message/i), 'It cracked in transit.');
  await userEvent.click(screen.getByRole('button', { name: /send message/i }));
}

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: { data: { ticketNumber: 'TCK-2610-ABCD' } } });
  authState.status = 'anonymous';
  authState.customer = null;
});

describe('signed out', () => {
  it('posts to the PUBLIC endpoint', async () => {
    // Someone with a delivery problem should not have to make an account
    // first, so the public route is the whole point of this branch.
    renderForm();
    await fillAndSubmit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe('/support/tickets');
  });

  it('sends exactly the four fields the API expects', async () => {
    renderForm();
    await fillAndSubmit();

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toEqual({
      name: 'Chinmay',
      email: 'me@example.test',
      subject: 'Damaged jar',
      message: 'It cracked in transit.',
    });
  });

  it('shows the reference number back to the customer', async () => {
    // Anonymous senders have nothing else to quote, so losing this strands them.
    renderForm();
    await fillAndSubmit();

    expect(await screen.findByText(/TCK-2610-ABCD/)).toBeInTheDocument();
  });

  it('says an account is not required', async () => {
    renderForm();
    expect(screen.getByText(/do not need an account/i)).toBeInTheDocument();
  });
});

describe('signed in', () => {
  beforeEach(() => {
    authState.status = 'authenticated';
    authState.customer = { name: 'Chinmay Patkar', email: 'chinmay@example.test' };
  });

  it('posts to the AUTHENTICATED endpoint so the ticket attaches to the account', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/subject/i), 'Where is my order');
    await userEvent.type(screen.getByLabelText(/message/i), 'Placed last week.');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/customer/support/tickets');
  });

  it('prefills name and email from the account', async () => {
    renderForm();
    expect(screen.getByLabelText(/your name/i)).toHaveValue('Chinmay Patkar');
    expect(screen.getByLabelText(/email/i)).toHaveValue('chinmay@example.test');
  });

  it('points the customer at the thread they can follow', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/subject/i), 's');
    await userEvent.type(screen.getByLabelText(/message/i), 'm');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/Account/)).toBeInTheDocument();
  });
});

describe('failure', () => {
  it('does not show a success panel when the request fails', async () => {
    // The cart bug was a toast that fired unconditionally and promised
    // something untrue; the same mistake here would claim a message was sent.
    post.mockRejectedValue(new Error('network'));
    renderForm();
    await fillAndSubmit();

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(screen.queryByText(/Message sent/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});
