import { ClerkProvider } from '@clerk/clerk-react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Determine if we're in production (deployed to thepotluxe.com)
  const isProduction = window.location.hostname === 'thepotluxe.com';
  
  // Select the appropriate publishable key based on environment
  const publishableKey = isProduction
    ? (import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  console.log(`Using ${isProduction ? 'LIVE' : 'TEST'} Clerk publishable key for domain: ${window.location.hostname}`);

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
