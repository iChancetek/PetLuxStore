import { ClerkProvider } from '@clerk/clerk-react';

// Temporarily disabled Clerk to fix startup issue
// TODO: Re-enable once Clerk keys are properly configured
export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // If no Clerk key, just return children without Clerk wrapper
  if (!clerkPubKey) {
    console.warn("Clerk publishable key not found, auth will be disabled");
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {children}
    </ClerkProvider>
  );
}