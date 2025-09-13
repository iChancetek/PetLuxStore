import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, Plus, Minus, ShoppingBag, Truck, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems, isLoading: loadingCart } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isOpen,
  });

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove cart item
  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, Math.min(10, currentQuantity + delta));
    if (newQuantity !== currentQuantity) {
      updateQuantityMutation.mutate({ id, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const items = cartItems || [];
  const subtotal = items.reduce((total: number, item: any) => total + (parseFloat(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="pb-6">
            <div className="flex items-center justify-between">
              <SheetTitle data-testid="text-cart-drawer-title">
                Shopping Cart ({items.length})
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-cart">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content */}
          {loadingCart ? (
            <div className="flex-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2" data-testid="text-empty-cart">
                  Your cart is empty
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-empty-cart-description">
                  Add some items to get started
                </p>
              </div>
              <Link href="/shop">
                <Button onClick={onClose} data-testid="button-start-shopping">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Link href={`/product/${item.product.slug || item.product.id}`}>
                      <img 
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                        onClick={onClose}
                        data-testid={`img-cart-drawer-item-${item.id}`}
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.slug || item.product.id}`}>
                        <h4 className="font-medium text-sm hover:text-primary cursor-pointer truncate" onClick={onClose}>
                          {item.product.name}
                        </h4>
                      </Link>
                      
                      {item.product.aiMatch && (
                        <Badge className="mt-1 text-xs bg-accent/10 text-accent">
                          <Sparkles className="w-2 h-2 mr-1" />
                          AI: {item.product.aiMatch}%
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                            data-testid={`button-drawer-decrease-${item.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-medium px-2" data-testid={`text-drawer-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            disabled={item.quantity >= 10 || updateQuantityMutation.isPending}
                            data-testid={`button-drawer-increase-${item.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="text-destructive hover:text-destructive h-6 text-xs"
                          data-testid={`button-drawer-remove-${item.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-sm" data-testid={`text-drawer-item-total-${item.id}`}>
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price} each
                      </p>
                    </div>
                  </div>
                ))}

                {/* AI Suggestion */}
                <div className="bg-accent/10 border-2 border-accent/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span className="text-xs font-medium">AI Suggestion</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Customers also added:
                  </p>
                  <div className="flex items-center space-x-2">
                    <img 
                      src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
                      alt="Memory Foam Pet Bed"
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Memory Foam Pet Bed</p>
                      <p className="text-xs text-muted-foreground">$129.99</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-6 px-2" data-testid="button-drawer-add-suggestion">
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 space-y-4">
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-drawer-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span data-testid="text-drawer-tax">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? "text-accent font-medium" : ""} data-testid="text-drawer-shipping">
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {subtotal < 50 && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Truck className="w-3 h-3" />
                      <span>Add ${(50 - subtotal).toFixed(2)} more for free shipping</span>
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span data-testid="text-drawer-total">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link href="/checkout">
                    <Button className="w-full" onClick={onClose} data-testid="button-drawer-checkout">
                      Checkout
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="outline" className="w-full" onClick={onClose} data-testid="button-drawer-view-cart">
                      View Cart
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
