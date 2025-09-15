import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Temporarily use development key directly to work around environment variable sync issue
  const clerkPubKey = "pk_test_cmlnaHQtb3dsLTQ0LmNsZXJrLmFjY291bnRzLmRldiQ";
  
  useEffect(() => {
    // Clear any cached Clerk session data
    localStorage.removeItem('__clerk_session');
    sessionStorage.clear();
    console.log("Cleared Clerk session cache, using development key:", clerkPubKey);
  }, []);

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}