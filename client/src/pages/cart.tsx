import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ChatAssistant from "@/components/ai/chat-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, X, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { Link } from "wouter";
import { CartItem, Product as ProductType } from "@shared/schema";

// Define cart item type with product relation
type CartItemWithProduct = CartItem & {
  product: ProductType;
};

export default function Cart() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const guestCart = useGuestCart();
  const [guestCartItems, setGuestCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingGuestProducts, setLoadingGuestProducts] = useState(false);

  // Fetch authenticated cart items
  const { data: authCartItems, isLoading: loadingAuthCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Fetch product details for guest cart items
  useEffect(() => {
    // Clear guest cart items when authenticated or when guest cart is empty
    if (isAuthenticated || guestCart.items.length === 0) {
      setGuestCartItems([]);
      setLoadingGuestProducts(false);
      return;
    }

    // Fetch product details for guest cart items
    const fetchGuestProductDetails = async () => {
      setLoadingGuestProducts(true);
      try {
        const productPromises = guestCart.items.map(async (guestItem) => {
          try {
            const response = await apiRequest("GET", `/api/products/${guestItem.productId}`);
            const product = await response.json() as ProductType;
            return {
              id: guestItem.id,
              userId: guestItem.userId,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
              createdAt: guestItem.createdAt ? new Date(guestItem.createdAt) : null,
              updatedAt: guestItem.updatedAt ? new Date(guestItem.updatedAt) : null,
              product,
            } as CartItemWithProduct;
          } catch (error) {
            console.error(`Failed to fetch product ${guestItem.productId}:`, error);
            return null;
          }
        });
        
        const resolvedProducts = await Promise.all(productPromises);
        const validProducts = resolvedProducts.filter(item => item !== null) as CartItemWithProduct[];
        setGuestCartItems(validProducts);
      } catch (error) {
        console.error('Error fetching guest cart product details:', error);
      } finally {
        setLoadingGuestProducts(false);
      }
    };

    fetchGuestProductDetails();
  }, [isAuthenticated, guestCart.items]);

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Remove cart item
  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
  });

  const handleQuantityChange = async (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, Math.min(10, currentQuantity + delta));
    if (newQuantity !== currentQuantity) {
      if (isAuthenticated) {
        updateQuantityMutation.mutate({ id, quantity: newQuantity });
      } else {
        // For guest cart, update localStorage
        try {
          await guestCart.updateQuantity(id, newQuantity);
          toast({
            title: "Quantity updated",
            description: "Item quantity has been updated.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update quantity. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (isAuthenticated) {
      removeItemMutation.mutate(id);
    } else {
      // For guest cart, remove from localStorage
      try {
        await guestCart.removeItem(id);
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleClearCart = async () => {
    if (isAuthenticated) {
      clearCartMutation.mutate();
    } else {
      // For guest cart, clear localStorage
      try {
        await guestCart.clearCart();
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to clear cart. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Use appropriate cart items and loading state based on authentication status
  const items = isAuthenticated ? (authCartItems || []) : guestCartItems;
  const loadingCart = isAuthenticated ? loadingAuthCart : loadingGuestProducts;

  if (isLoading || loadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  // Safe price calculation with defensive null handling
  const getItemPrice = (item: any): number => {
    if (!item?.product?.price) return 0;
    const price = parseFloat(item.product.price);
    return isNaN(price) ? 0 : price;
  };
  
  const subtotal = items.reduce((total: number, item: any) => {
    const price = getItemPrice(item);
    const quantity = item?.quantity || 0;
    return total + (price * quantity);
  }, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-cart-title">Shopping Cart</h1>
          <p className="text-muted-foreground" data-testid="text-cart-subtitle">
            {items.length === 0 ? "Your cart is empty" : `${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-4" data-testid="text-empty-cart">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-8" data-testid="text-empty-cart-description">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link href="/shop">
              <Button size="lg" data-testid="button-continue-shopping">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Clear Cart Button */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Cart Items</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        disabled={clearCartMutation.isPending}
                        data-testid="button-clear-cart"
                      >
                        Clear Cart
                      </Button>
                    </div>

                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                        <Link href={`/product/${item.product?.slug || item.product?.id || item.productId}`}>
                          <img 
                            src={item.product?.imageUrl || "/placeholder-product.svg"}
                            alt={item.product?.name || "Product"}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                            onError={(e) => { e.currentTarget.src = "/placeholder-product.svg"; }}
                            data-testid={`img-cart-item-${item.id}`}
                          />
                        </Link>
                        
                        <div className="flex-1">
                          <Link href={`/product/${item.product?.slug || item.product?.id || item.productId}`}>
                            <h4 className="font-medium hover:text-primary cursor-pointer" data-testid={`text-cart-item-name-${item.id}`}>
                              {item.product?.name || "Product"}
                            </h4>
                          </Link>
                          
                          {item.product?.aiMatch && (
                            <Badge className="mt-1 bg-accent/10 text-accent">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Match: {item.product.aiMatch}%
                            </Badge>
                          )}
                          
                          <div className="flex items-center space-x-3 mt-3">
                            <div className="flex items-center space-x-2 border rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="px-3 py-1 font-medium" data-testid={`text-quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                disabled={item.quantity >= 10 || updateQuantityMutation.isPending}
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-remove-${item.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-lg" data-testid={`text-item-total-${item.id}`}>
                            ${(getItemPrice(item) * (item.quantity || 0)).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-item-price-${item.id}`}>
                            ${getItemPrice(item).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span data-testid="text-tax">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shipping === 0 ? "text-accent font-medium" : ""} data-testid="text-shipping">
                        {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    {subtotal < 50 && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <Truck className="w-4 h-4" />
                        <span>Add ${(50 - subtotal).toFixed(2)} more for free shipping</span>
                      </div>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span data-testid="text-total">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Link href="/checkout">
                      <Button className="w-full" size="lg" data-testid="button-checkout">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    <Link href="/shop">
                      <Button variant="outline" className="w-full" data-testid="button-continue-shopping-summary">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-1 gap-3 text-center text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Free shipping on orders $50+</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">✓</span>
                        <span className="text-muted-foreground">30-day return policy</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <ChatAssistant />
    </div>
  );
}
