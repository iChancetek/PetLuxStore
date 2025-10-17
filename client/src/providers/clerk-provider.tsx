import { ClerkProvider } from '@clerk/clerk-react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Use test key for development (works on any domain)
  // Use live key only for production domain
  const isProduction = window.location.hostname === 'thepotluxe.com' || 
                       window.location.hostname.endsWith('.thepotluxe.com');
  
  const publishableKey = isProduction 
    ? import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY
    : 'pk_test_cmlnaHQtb3dsLTQ0LmNsZXJrLmFjY291bnRzLmRldiQ';

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
