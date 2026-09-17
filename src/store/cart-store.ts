'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * The guest cart.
 *
 * Lives entirely in the browser until the customer signs in, at which point
 * every line is replayed through `POST customer/cart` and the server cart
 * becomes the truth (ADR 0009). `cart.addItem` on the backend increments an
 * existing line rather than erroring, which is what makes that replay a merge
 * rather than a conflict.
 *
 * ## The trust boundary
 *
 * Everything in here is client-controlled. A determined visitor can edit
 * `localStorage` and set a price to zero, so **the stored price is for display
 * only and is never sent anywhere.** What gets replayed to the server is
 * `productId`, `variantId` and `quantity`; the server re-reads the real price
 * from the database. The snapshot exists so the cart renders instantly on load
 * without N product fetches, not because it is authoritative.
 *
 * The same reasoning is why there is no `total` in the persisted state - a
 * derived total read from storage is a total someone else can choose.
 */

export interface CartLine {
  productId: string;
  variantId: string | null;
  /** For the product link. */
  slug: string;
  /** Display snapshot. Refreshed opportunistically; never trusted. */
  name: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  /** False until the persisted state has been read - see `useHydratedCart`. */
  hydrated: boolean;

  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  setHydrated: () => void;
}

/** Two lines are the same line when the product AND the variant match. */
function isSameLine(line: CartLine, productId: string, variantId: string | null): boolean {
  return line.productId === productId && (line.variantId ?? null) === (variantId ?? null);
}

/** Guards against a corrupted or hand-edited quantity reaching the server. */
const MAX_QUANTITY = 99;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,

      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) =>
            isSameLine(l, line.productId, line.variantId ?? null),
          );

          if (existing) {
            // Adding the same product twice increases the quantity rather than
            // creating a second line - matching what the server does on merge,
            // so the basket does not change shape when the customer signs in.
            return {
              lines: state.lines.map((l) =>
                isSameLine(l, line.productId, line.variantId ?? null)
                  ? { ...l, ...line, quantity: clampQuantity(l.quantity + quantity) }
                  : l,
              ),
            };
          }

          return {
            lines: [...state.lines, { ...line, variantId: line.variantId ?? null, quantity: clampQuantity(quantity) }],
          };
        }),

      setQuantity: (productId, variantId, quantity) =>
        set((state) => {
          // Setting zero removes the line. A stepper that bottoms out at 1 and
          // needs a separate remove button is a worse control than one that
          // just keeps going down.
          if (quantity <= 0) {
            return { lines: state.lines.filter((l) => !isSameLine(l, productId, variantId)) };
          }

          return {
            lines: state.lines.map((l) =>
              isSameLine(l, productId, variantId) ? { ...l, quantity: clampQuantity(quantity) } : l,
            ),
          };
        }),

      remove: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !isSameLine(l, productId, variantId)),
        })),

      clear: () => set({ lines: [] }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'rs-guest-cart',
      storage: createJSONStorage(() => localStorage),
      // `hydrated` is runtime state, not something to persist and read back.
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      version: 1,
    },
  ),
);

/** Total number of items, for the header badge. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/**
 * Cart subtotal, in paise-safe integer arithmetic.
 *
 * Returned as a string because that is how money moves through this codebase -
 * the API sends Decimal as a string so it never round-trips through a float,
 * and this keeps that property rather than breaking it at the last step.
 *
 * This is a DISPLAY figure computed from display prices. The server recomputes
 * everything at checkout; nothing here is sent.
 */
export function cartSubtotal(lines: CartLine[]): string {
  const paise = lines.reduce((total, line) => {
    const amount = Math.round(Number(line.price) * 100);
    return total + (Number.isFinite(amount) ? amount * line.quantity : 0);
  }, 0);

  return (paise / 100).toFixed(2);
}
