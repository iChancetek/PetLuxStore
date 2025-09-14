import { Switch, Route } from "wouter";
import { queryClient, setAuthTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClerkProviderWrapper from "@/providers/clerk-provider";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Admin from "@/pages/admin";
import AIPicks from "@/pages/ai-picks";
import NotFound from "@/pages/not-found";

// Component to setup auth token getter
function AuthSetup({ children }: { children: React.ReactNode }) {
  const { getToken } = useClerkAuth();

  useEffect(() => {
    // Set up the auth token getter for API requests
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.warn("Failed to get Clerk token:", error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/ai-picks" component={AIPicks} />
      <Route path="/product/:slug" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProviderWrapper>
      <AuthSetup>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthSetup>
    </ClerkProviderWrapper>
  );
}

export default App;
