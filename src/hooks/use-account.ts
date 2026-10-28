'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi, unwrap } from '@/lib/customer-api';
import { useAuthStore } from '@/store/auth-store';
import type {
  Address,
  CustomerOrder,
  ServerCart,
  SupportTicket,
  WishlistItem,
} from '@/types/api';

/**
 * Account data.
 *
 * React Query only for the authenticated surface - the public catalogue is
 * server-rendered and cached by Next, and pulling it through here would trade
 * an already-warm cache for a client round trip.
 *
 * Every query is gated on `status === 'authenticated'`. Without that they fire
 * during the brief window when the access token has not been restored yet,
 * 401 immediately, and trigger a refresh storm on every page load.
 */
function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated');
}

export const accountKeys = {
  orders: ['customer', 'orders'] as const,
  order: (id: string) => ['customer', 'orders', id] as const,
  addresses: ['customer', 'addresses'] as const,
  wishlist: ['customer', 'wishlist'] as const,
  cart: ['customer', 'cart'] as const,
  tickets: ['customer', 'tickets'] as const,
  ticket: (id: string) => ['customer', 'tickets', id] as const,
};

export function useOrders() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.orders,
    enabled,
    queryFn: async () => unwrap<CustomerOrder[]>(await customerApi.get('/customer/orders')),
  });
}

export function useOrder(id: string) {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.order(id),
    enabled: enabled && Boolean(id),
    queryFn: async () => unwrap<CustomerOrder>(await customerApi.get(`/customer/orders/${id}`)),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      unwrap<CustomerOrder>(
        await customerApi.post(`/customer/orders/${id}/cancel`, reason ? { reason } : {}),
      ),
    onSuccess: (_data, variables) => {
      // Both the list and the detail show status, so both go stale.
      void queryClient.invalidateQueries({ queryKey: accountKeys.orders });
      void queryClient.invalidateQueries({ queryKey: accountKeys.order(variables.id) });
    },
  });
}

export function useAddresses() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.addresses,
    enabled,
    queryFn: async () => unwrap<Address[]>(await customerApi.get('/customer/addresses')),
  });
}

export function useSaveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Address> & { id?: string }) =>
      unwrap<Address>(
        id
          ? await customerApi.patch(`/customer/addresses/${id}`, body)
          : await customerApi.post('/customer/addresses', body),
      ),
    // Invalidate rather than patch the cache by hand: setting one address as
    // default clears the flag on another, and the server is the only thing that
    // knows which.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => customerApi.delete(`/customer/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useWishlist() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.wishlist,
    enabled,
    queryFn: async () => unwrap<WishlistItem[]>(await customerApi.get('/customer/wishlist')),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      customerApi.delete(`/customer/wishlist/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.wishlist }),
  });
}

export function useSupportTickets() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.tickets,
    enabled,
    queryFn: async () =>
      unwrap<SupportTicket[]>(await customerApi.get('/customer/support/tickets')),
  });
}

export function useSupportTicket(id: string) {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.ticket(id),
    enabled: enabled && Boolean(id),
    queryFn: async () =>
      unwrap<SupportTicket>(await customerApi.get(`/customer/support/tickets/${id}`)),
  });
}

export function useReplyToTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) =>
      customerApi.post(`/customer/support/tickets/${id}/messages`, { message }),
    onSuccess: () => {
      // Both the thread and the list change: the list shows the last-updated
      // time, which a reply moves.
      void queryClient.invalidateQueries({ queryKey: accountKeys.ticket(id) });
      void queryClient.invalidateQueries({ queryKey: accountKeys.tickets });
    },
  });
}

export function useServerCart() {
  const enabled = useIsAuthenticated();
  return useQuery({
    queryKey: accountKeys.cart,
    enabled,
    queryFn: async () => unwrap<ServerCart>(await customerApi.get('/customer/cart')),
  });
}
