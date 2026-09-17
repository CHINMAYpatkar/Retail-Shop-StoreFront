// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { cartCount, cartSubtotal, useCartStore, type CartLine } from './cart-store';

/**
 * The guest cart.
 *
 * Everything here is client-controlled, which is the property the tests are
 * really about: the stored price is display-only, quantities are clamped before
 * they can reach the server, and the shape of the basket must not change when
 * it is merged into the server cart on sign-in.
 */
const GARAM: Omit<CartLine, 'quantity'> = {
  productId: 'p-garam',
  variantId: null,
  slug: 'garam-masala',
  name: 'Everyday Garam Masala',
  price: '320.00',
  imageUrl: null,
};

const CHAI: Omit<CartLine, 'quantity'> = {
  productId: 'p-chai',
  variantId: null,
  slug: 'chai-masala',
  name: 'Chai Masala',
  price: '260.00',
  imageUrl: null,
};

beforeEach(() => {
  useCartStore.setState({ lines: [] });
  try {
    localStorage.clear();
  } catch {
    // Private mode. The store still works in memory.
  }
});

const lines = () => useCartStore.getState().lines;

describe('add', () => {
  it('adds a line', () => {
    useCartStore.getState().add(GARAM);
    expect(lines()).toHaveLength(1);
    expect(lines()[0].quantity).toBe(1);
  });

  it('increments rather than creating a second line for the same product', () => {
    // Matches what the server does on merge, so the basket does not change
    // shape when the customer signs in.
    useCartStore.getState().add(GARAM);
    useCartStore.getState().add(GARAM, 2);

    expect(lines()).toHaveLength(1);
    expect(lines()[0].quantity).toBe(3);
  });

  it('keeps different products as separate lines', () => {
    useCartStore.getState().add(GARAM);
    useCartStore.getState().add(CHAI);
    expect(lines()).toHaveLength(2);
  });

  it('treats the same product in different variants as different lines', () => {
    useCartStore.getState().add({ ...GARAM, variantId: 'v-100g' });
    useCartStore.getState().add({ ...GARAM, variantId: 'v-250g' });
    expect(lines()).toHaveLength(2);
  });

  it('normalises an undefined variant to null so matching is consistent', () => {
    // Otherwise `undefined` and `null` would be different keys and the same
    // product could end up on two lines.
    useCartStore.getState().add({ ...GARAM, variantId: undefined as unknown as null });
    useCartStore.getState().add(GARAM);
    expect(lines()).toHaveLength(1);
    expect(lines()[0].variantId).toBeNull();
  });

  it('refreshes the display snapshot when re-adding', () => {
    useCartStore.getState().add(GARAM);
    useCartStore.getState().add({ ...GARAM, price: '340.00', name: 'Garam Masala (new batch)' });

    expect(lines()[0].price).toBe('340.00');
    expect(lines()[0].quantity).toBe(2);
  });
});

describe('quantity is clamped before it can reach the server', () => {
  it('caps at 99', () => {
    useCartStore.getState().add(GARAM, 500);
    expect(lines()[0].quantity).toBe(99);
  });

  it('floors at 1 for a positive request', () => {
    useCartStore.getState().add(GARAM, 0.4);
    expect(lines()[0].quantity).toBe(1);
  });

  it('survives a corrupted quantity without producing NaN', () => {
    // localStorage is hand-editable, so this is a real input.
    useCartStore.getState().add(GARAM, Number.NaN);
    expect(lines()[0].quantity).toBe(1);
  });

  it('truncates a fractional quantity rather than storing 2.7 of a jar', () => {
    useCartStore.getState().setQuantity('p-garam', null, 2.7);
    useCartStore.getState().add(GARAM);
    expect(Number.isInteger(lines()[0].quantity)).toBe(true);
  });
});

describe('setQuantity and remove', () => {
  it('changes a quantity', () => {
    useCartStore.getState().add(GARAM);
    useCartStore.getState().setQuantity('p-garam', null, 4);
    expect(lines()[0].quantity).toBe(4);
  });

  it('removes the line when set to zero', () => {
    // A stepper that bottoms out at 1 and needs a separate remove button is a
    // worse control than one that just keeps going down.
    useCartStore.getState().add(GARAM);
    useCartStore.getState().setQuantity('p-garam', null, 0);
    expect(lines()).toHaveLength(0);
  });

  it('removes a line explicitly', () => {
    useCartStore.getState().add(GARAM);
    useCartStore.getState().add(CHAI);
    useCartStore.getState().remove('p-garam', null);

    expect(lines()).toHaveLength(1);
    expect(lines()[0].productId).toBe('p-chai');
  });

  it('leaves other lines alone', () => {
    useCartStore.getState().add({ ...GARAM, variantId: 'v-100g' });
    useCartStore.getState().add({ ...GARAM, variantId: 'v-250g' });
    useCartStore.getState().remove('p-garam', 'v-100g');

    expect(lines()).toHaveLength(1);
    expect(lines()[0].variantId).toBe('v-250g');
  });

  it('clears everything', () => {
    useCartStore.getState().add(GARAM);
    useCartStore.getState().add(CHAI);
    useCartStore.getState().clear();
    expect(lines()).toHaveLength(0);
  });
});

describe('cartCount', () => {
  it('counts items, not lines', () => {
    useCartStore.getState().add(GARAM, 3);
    useCartStore.getState().add(CHAI, 2);
    expect(cartCount(lines())).toBe(5);
  });

  it('is zero for an empty cart', () => {
    expect(cartCount([])).toBe(0);
  });
});

describe('cartSubtotal', () => {
  it('multiplies and sums without float drift', () => {
    // 320 * 3 + 260 * 2 = 1480. Done in paise so 0.1 + 0.2 never appears.
    useCartStore.getState().add(GARAM, 3);
    useCartStore.getState().add(CHAI, 2);
    expect(cartSubtotal(lines())).toBe('1480.00');
  });

  it('handles prices with paise exactly', () => {
    useCartStore.getState().add({ ...GARAM, price: '0.10' }, 3);
    expect(cartSubtotal(lines())).toBe('0.30');
  });

  it('is 0.00 for an empty cart', () => {
    expect(cartSubtotal([])).toBe('0.00');
  });

  it('ignores a corrupted price rather than producing NaN', () => {
    // Display-only and hand-editable. A NaN here would render as "₹NaN".
    useCartStore.getState().add({ ...GARAM, price: 'free' }, 2);
    expect(cartSubtotal(lines())).toBe('0.00');
  });
});
