import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Force test key for Replit development environment to avoid domain issues
  const getClerkPublishableKey = () => {
    // Check if we're on the production domain
    const isProductionDomain = window.location.hostname === 'thepotluxe.com' || window.location.hostname.endsWith('.thepotluxe.com');
    
    if (isProductionDomain && import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY) {
      console.log('Using LIVE Clerk publishable key for production domain');
      return import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY;
    } else {
      // Force test key for development to avoid domain issues with live keys
      console.log('Using hardcoded TEST Clerk publishable key for development');
      return "pk_test_cmlnaHQtb3dsLTQ0LmNsZXJrLmFjY291bnRzLmRldiQ";
    }
  };
  
  const clerkPubKey = getClerkPublishableKey();
  
  useEffect(() => {
    // Clear any cached Clerk session data
    localStorage.removeItem('__clerk_session');
    sessionStorage.clear();
    console.log("Cleared Clerk session cache, using key:", clerkPubKey);
  }, [clerkPubKey]);

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
