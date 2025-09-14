import { ClerkProvider } from '@clerk/clerk-react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Always provide ClerkProvider context, but log if key is missing
  if (!clerkPubKey) {
    console.error("VITE_CLERK_PUBLISHABLE_KEY not found. Authentication may not work properly.");
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey || ""}>
      {children}
    </ClerkProvider>
  );
}