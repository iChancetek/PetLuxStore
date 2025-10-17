import { ClerkProvider } from '@clerk/clerk-react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
