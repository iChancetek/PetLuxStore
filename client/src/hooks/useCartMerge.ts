import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestCart } from '@/hooks/useGuestCart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface CartMergeResult {
  success: boolean;
  mergedItems: number;
  errors: string[];
}

export function useCartMerge() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const guestCart = useGuestCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Keep track of previous authentication state to detect sign-in
  const prevAuthenticatedRef = useRef<boolean | null>(null);
  const isMergingRef = useRef<boolean>(false);

  // Mutation to merge guest cart items with authenticated cart
  const mergeCartMutation = useMutation({
    mutationFn: async (guestItems: any[]): Promise<CartMergeResult> => {
      const result: CartMergeResult = {
        success: true,
        mergedItems: 0,
        errors: []
      };

      // Process each guest cart item
      for (const guestItem of guestItems) {
        try {
          await apiRequest("POST", "/api/cart", {
            productId: guestItem.productId,
            quantity: guestItem.quantity,
          });
          result.mergedItems++;
        } catch (error) {
          result.success = false;
          result.errors.push(`Failed to merge item ${guestItem.productId}: ${error}`);
          console.error('Failed to merge cart item:', error);
        }
      }

      return result;
    },
    onSuccess: async (result) => {
      if (result.success && result.mergedItems > 0) {
        // Clear guest cart after successful merge
        await guestCart.clearCart();
        
        // Invalidate cart queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        // Show success message
        toast({
          title: "Cart merged successfully",
          description: `${result.mergedItems} item${result.mergedItems > 1 ? 's' : ''} from your guest cart ${result.mergedItems > 1 ? 'have' : 'has'} been added to your cart.`,
        });
      } else if (result.errors.length > 0) {
        // Show partial success or error message
        toast({
          title: result.mergedItems > 0 ? "Cart partially merged" : "Cart merge failed",
          description: result.mergedItems > 0 
            ? `${result.mergedItems} items merged successfully, but ${result.errors.length} item${result.errors.length > 1 ? 's' : ''} failed.`
            : "Failed to merge cart items. Please add items to your cart manually.",
          variant: result.mergedItems > 0 ? "default" : "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Cart merge mutation failed:', error);
      toast({
        title: "Cart merge failed",
        description: "Failed to merge your guest cart. Please add items to your cart manually.",
        variant: "destructive",
      });
    }
  });

  // Manual merge function (can be called explicitly)
  const manualMerge = async (): Promise<CartMergeResult | null> => {
    if (isMergingRef.current || !isAuthenticated || guestCart.items.length === 0) {
      return null;
    }

    isMergingRef.current = true;
    try {
      const guestItems = guestCart.exportCartData();
      return await mergeCartMutation.mutateAsync(guestItems);
    } catch (error) {
      console.error('Manual cart merge failed:', error);
      return {
        success: false,
        mergedItems: 0,
        errors: ['Manual merge failed']
      };
    } finally {
      isMergingRef.current = false;
    }
  };

  // Auto-merge effect: triggers when user signs in
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;

    // Skip if already merging
    if (isMergingRef.current) return;

    // Detect sign-in: previous state was false/null, current is true
    const wasSignedOut = prevAuthenticatedRef.current === false;
    const isNowSignedIn = isAuthenticated === true;
    
    if (wasSignedOut && isNowSignedIn) {
      // User just signed in, check if they have guest cart items to merge
      const guestItems = guestCart.exportCartData();
      
      if (guestItems.length > 0) {
        console.log(`Auto-merging ${guestItems.length} guest cart items...`);
        isMergingRef.current = true;
        
        mergeCartMutation.mutate(guestItems);
        
        // Reset merging flag after mutation completes
        setTimeout(() => {
          isMergingRef.current = false;
        }, 1000);
      }
    }

    // Update previous authentication state
    prevAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, authLoading, guestCart, mergeCartMutation]);

  return {
    manualMerge,
    isMerging: mergeCartMutation.isPending || isMergingRef.current,
    mergeResult: mergeCartMutation.data,
    mergeError: mergeCartMutation.error,
  };
}