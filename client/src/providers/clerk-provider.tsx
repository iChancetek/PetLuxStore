import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const getClerkPublishableKey = () => {
    // Production uses LIVE keys, Development uses TEST keys
    // LIVE keys are domain-locked to thepotluxe.com
    if (import.meta.env.PROD && import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY) {
      console.log('Using LIVE Clerk publishable key for production');
      return import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY;
    } else if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
      console.log('Using TEST Clerk publishable key for development');
      return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    } else {
      throw new Error('Missing required Clerk publishable key');
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