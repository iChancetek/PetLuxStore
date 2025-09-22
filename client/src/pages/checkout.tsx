import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { activityTracker } from "@/lib/activityTracker";
import { CartItem, Product as ProductType } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, CreditCard } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// Determine which Stripe publishable key to use based on environment
const getStripePublishableKey = () => {
  const isProduction = import.meta.env.MODE === 'production';
  
  if (isProduction && import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY) {
    console.log('Using LIVE Stripe publishable key');
    return import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY;
  } else if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.log('Using TEST Stripe publishable key');
    return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  } else {
    throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY or VITE_STRIPE_LIVE_PUBLISHABLE_KEY');
  }
};

const stripePromise = loadStripe(getStripePublishableKey());

// Define cart item type with product relation
type CartItemWithProduct = CartItem & {
  product: ProductType;
};

const CheckoutForm = ({ total, items }: { total: number; items: CartItemWithProduct[] }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/orders",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Track purchase completion
      const orderValue = total;
      const itemCount = items.length;
      
      activityTracker.trackPurchaseCompleted(`order-${Date.now()}`, {
        orderValue,
        itemCount,
        paymentMethod: 'stripe',
        items: items.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.product.price)
        }))
      });

      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Secure payment powered by Stripe</span>
        </div>
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={!stripe || processing}
        data-testid="button-complete-payment"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Complete Payment - ${total.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const guestCart = useGuestCart();
  const [clientSecret, setClientSecret] = useState("");
  const [guestCartItems, setGuestCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingGuestProducts, setLoadingGuestProducts] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  });

  // Fetch authenticated cart items
  const { data: authCartItems, isLoading: loadingAuthCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Fetch product details for guest cart items
  useEffect(() => {
      if (!isAuthenticated && guestCart.items.length > 0) {
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
    } else if (isAuthenticated) {
      setGuestCartItems([]);
    }
  }, [isAuthenticated, guestCart.items]);

  // Use appropriate cart items based on authentication status
  const items = isAuthenticated ? (authCartItems || []) : guestCartItems;
  const loadingCart = isAuthenticated ? loadingAuthCart : loadingGuestProducts;
  const subtotal = items.reduce((total: number, item: any) => total + (parseFloat(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;
  

  // Track checkout started when cart items are loaded  
  useEffect(() => {
    if (items.length > 0 && !loadingCart && subtotal > 0) {
      activityTracker.trackCheckoutStarted({
        cartValue: total,
        itemCount: items.length,
        subtotal,
        tax,
        shipping,
        items: items.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.product.price)
        }))
      });
    }
  }, [items.length, loadingCart, total, subtotal, tax, shipping]);

  useEffect(() => {
    if (items.length > 0 && total > 0) {
      // Create PaymentIntent as soon as the page loads with items
      apiRequest("POST", "/api/create-payment-intent", { amount: total })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [items.length, total, toast]);

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading || loadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-muted-foreground mb-4" data-testid="text-empty-cart">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart before checkout.</p>
          <Button onClick={() => window.location.href = "/shop"} data-testid="button-continue-shopping">
            Continue Shopping
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-serif font-bold mb-8" data-testid="text-checkout-title">Checkout</h1>
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-checkout-title">Checkout</h1>
            <p className="text-muted-foreground" data-testid="text-checkout-subtitle">
              Complete your order securely
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shipping Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={shippingInfo.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={shippingInfo.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleShippingChange('email', e.target.value)}
                    data-testid="input-email"
                  />
                </div>

                <div className="mb-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => handleShippingChange('address', e.target.value)}
                    data-testid="input-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      data-testid="input-state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      data-testid="input-zip"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingInfo.country}
                      onChange={(e) => handleShippingChange('country', e.target.value)}
                      data-testid="input-country"
                    />
                  </div>
                </div>

                {/* Payment Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </h3>
                  
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm total={total} items={items} />
                  </Elements>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="h-fit">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img 
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        data-testid={`img-order-item-${item.id}`}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm" data-testid={`text-order-item-name-${item.id}`}>
                          {item.product.name}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          Qty: {item.quantity} × ${item.product.price}
                        </p>
                      </div>
                      <span className="font-medium text-sm" data-testid={`text-order-item-total-${item.id}`}>
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-checkout-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span data-testid="text-checkout-tax">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? "text-accent font-medium" : ""} data-testid="text-checkout-shipping">
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span data-testid="text-checkout-total">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Secure 256-bit SSL encryption</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    30-day money-back guarantee
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
