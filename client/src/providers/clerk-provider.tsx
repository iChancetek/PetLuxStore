import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Determine which Clerk publishable key to use based on environment
  const getClerkPublishableKey = () => {
    const isProduction = import.meta.env.MODE === 'production';
    
    if (isProduction && import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY) {
      console.log('Using LIVE Clerk publishable key');
      return import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY;
    } else if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
      console.log('Using TEST Clerk publishable key');
      return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    } else {
      // Fallback to development key if environment variables are not available
      console.log('Using fallback TEST Clerk publishable key');
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