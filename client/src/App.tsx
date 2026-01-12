import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import { GuestCartProvider } from "@/hooks/useGuestCart";
import { useCartMerge } from "@/hooks/useCartMerge";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Admin from "@/pages/admin";
import AIPicks from "@/pages/ai-picks";
import Dashboard from "@/pages/dashboard";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// Component to handle cart merge logic (inside QueryClientProvider)
function CartMergeSetup() {
  // Initialize cart merge functionality - this must be inside QueryClientProvider
  const cartMerge = useCartMerge();
  return null; // This component only handles side effects
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/ai-picks" component={AIPicks} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/product/:slug" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={Admin} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GuestCartProvider>
        <AuthProvider>
          <CartMergeSetup />
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </GuestCartProvider>
    </QueryClientProvider>
  );
}

export default App;
