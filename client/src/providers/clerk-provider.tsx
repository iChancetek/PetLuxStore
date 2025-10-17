import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const getClerkPublishableKey = () => {
    // In production (NODE_ENV=production), use LIVE keys
    // In development, use TEST keys to match backend configuration
    if (import.meta.env.PROD && import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY) {
      console.log('Using LIVE Clerk publishable key for production');
      return import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY;
    } else {
      // Development: use CLERK_PUBLISHABLE_KEY which matches CLERK_SECRET_KEY on backend
      console.log('Using TEST Clerk publishable key for development');
      return import.meta.env.CLERK_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
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