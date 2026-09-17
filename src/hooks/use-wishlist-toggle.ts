'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/customer-api';
import { useAuthStore } from '@/store/auth-store';
import { accountKeys, useWishlist } from './use-account';

/**
 * Whether a product is on the wishlist, and how to change that.
 *
 * The wishlist is server-only — unlike the cart there is no guest equivalent,
 * because saving something "for later" is meaningless without an account to
 * come back to. A signed-out visitor is therefore sent to sign in rather than
 * given a local list that would silently vanish.
 */
export function useWishlistToggle(productId: string) {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const wishlist = useWishlist();

  const isSaved = Boolean(
    wishlist.data?.some((item) => item.productId === productId),
  );

  const toggle = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await customerApi.delete(`/customer/wishlist/${productId}`);
        return false;
      }
      await customerApi.post(`/customer/wishlist/${productId}`);
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.wishlist }),
  });

  return {
    isSaved,
    // Only meaningful once signed in; the button uses this to decide whether to
    // act or to send the visitor to sign in first.
    canToggle: status === 'authenticated',
    isLoading: wishlist.isLoading,
    toggle,
  };
}
