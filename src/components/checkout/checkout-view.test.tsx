// @vitest-environment jsdom
/**
 * Checkout.
 *
 * The last screen before a real order exists, and the one place where a wrong
 * disabled-state either loses a sale or lets through an order the warehouse
 * cannot fill. There is no payment step - cash on delivery - so "Place order"
 * is the point of no return and nothing may make it reachable early.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const post = vi.fn();
vi.mock('@/lib/customer-api', () => ({
  customerApi: { post: (...args: unknown[]) => post(...args) },
  unwrap: (res: { data: { data: unknown } }) => res.data.data,
}));

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const success = vi.fn();
const error = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (m: string) => success(m), error: (m: string) => error(m) },
}));

const cartState = { data: undefined as unknown, isLoading: false };
const addressState = { data: [] as unknown[], isLoading: false };
vi.mock('@/hooks/use-account', () => ({
  accountKeys: { cart: ['cart'], orders: ['orders'], addresses: ['addresses'] },
  useServerCart: () => cartState,
  useAddresses: () => addressState,
}));

import { CheckoutView } from './checkout-view';

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    quantity: 2,
    unitPrice: '120.00',
    lineTotal: '240.00',
    product: { id: 'p1', name: 'Garam Masala', stockQuantity: 10, images: [] },
    ...overrides,
  };
}

function cart(items = [item()], overrides: Record<string, unknown> = {}) {
  return { items, itemCount: items.length, subtotal: '240.00', ...overrides };
}

const ADDRESS = {
  id: 'addr-1',
  label: 'Home',
  isDefault: false,
  line1: '12 Market Road',
  city: 'Pune',
  state: 'MH',
  postalCode: '411001',
  country: 'India',
  contactName: 'Chinmay',
  contactPhone: '9999999999',
};

function renderCheckout() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CheckoutView />
    </QueryClientProvider>,
  );
}

const placeButton = () => screen.getByRole('button', { name: /place order|placing/i });

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: { data: { id: 'order-9' } } });
  replace.mockReset();
  success.mockReset();
  error.mockReset();
  cartState.data = cart();
  cartState.isLoading = false;
  addressState.data = [ADDRESS];
  addressState.isLoading = false;
});

describe('an empty bag', () => {
  it('offers the shop instead of a checkout with nothing in it', () => {
    cartState.data = cart([], { itemCount: 0, subtotal: '0.00' });
    renderCheckout();

    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /place order/i })).not.toBeInTheDocument();
  });

  it('does the same when the cart has not loaded at all', () => {
    cartState.data = undefined;
    renderCheckout();
    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });
});

describe('the delivery address', () => {
  it('blocks the order until one is chosen', async () => {
    // An order with no address is one the shop cannot deliver, and the server
    // rejects it - better to stop here and say why.
    addressState.data = [];
    renderCheckout();

    expect(placeButton()).toBeDisabled();
    expect(screen.getByText(/choose a delivery address/i)).toBeInTheDocument();
    await userEvent.click(placeButton());
    expect(post).not.toHaveBeenCalled();
  });

  it('preselects the only address rather than asking for a choice of one', async () => {
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    expect(screen.queryByText(/choose a delivery address/i)).not.toBeInTheDocument();
  });

  it('prefers the default when there are several', async () => {
    addressState.data = [
      { ...ADDRESS, id: 'addr-1', label: 'Office' },
      { ...ADDRESS, id: 'addr-2', label: 'Home', isDefault: true },
    ];
    renderCheckout();

    await waitFor(() => expect(placeButton()).toBeEnabled());
    await userEvent.click(placeButton());
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ addressId: 'addr-2' });
  });
});

describe('stock', () => {
  it('refuses to place an order the warehouse cannot fill', async () => {
    // The server re-checks inside the transaction, so this is the kind
    // explanation rather than the enforcement.
    cartState.data = cart([
      item({
        quantity: 5,
        product: { id: 'p1', name: 'Garam Masala', stockQuantity: 2, images: [] },
      }),
    ]);
    renderCheckout();

    await waitFor(() => expect(placeButton()).toBeDisabled());
    expect(screen.getByText(/exceed what is in stock/i)).toBeInTheDocument();
    expect(screen.getByText(/only 2 left/i)).toBeInTheDocument();
  });

  it('allows exactly the stock on hand', async () => {
    cartState.data = cart([
      item({
        quantity: 2,
        product: { id: 'p1', name: 'Garam Masala', stockQuantity: 2, images: [] },
      }),
    ]);
    renderCheckout();

    await waitFor(() => expect(placeButton()).toBeEnabled());
  });
});

describe('placing the order', () => {
  it('sends cash on delivery and the chosen address', async () => {
    // COD is the only method the shop takes; sending anything else is a 400.
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    await userEvent.click(placeButton());

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/customer/orders');
    expect(post.mock.calls[0][1]).toEqual({ addressId: 'addr-1', paymentMethod: 'COD' });
  });

  it('lands the customer on the order it just created', async () => {
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    await userEvent.click(placeButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/account/orders/order-9?placed=1'));
  });

  it('does not navigate or claim success when the server refuses', async () => {
    // Showing "Order placed" for an order that does not exist is the worst
    // failure this page has; the customer would wait for a parcel forever.
    post.mockRejectedValue(new Error('Not enough stock for Garam Masala'));
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    await userEvent.click(placeButton());

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(success).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the message the server sent, which names the problem item', async () => {
    // A plain Error would fall back to the generic copy, so this has to be the
    // real Axios shape - the point of the test is that the server's wording
    // ("Not enough stock for X") survives all the way to the customer.
    const refusal = new AxiosError('Request failed with status code 400');
    refusal.response = {
      data: { message: 'Not enough stock for Garam Masala' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };
    post.mockRejectedValue(refusal);
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    await userEvent.click(placeButton());

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(error.mock.calls[0][0]).toMatch(/Garam Masala/);
  });
});

describe('the summary', () => {
  it('says payment happens on delivery, not now', () => {
    renderCheckout();
    expect(screen.getByText(/nothing is charged now/i)).toBeInTheDocument();
  });

  it('shows delivery as free rather than leaving it blank', () => {
    renderCheckout();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('counts items in the singular when there is one', () => {
    renderCheckout();
    expect(screen.getByText(/^1 item$/)).toBeInTheDocument();
  });
});
