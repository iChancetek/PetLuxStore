import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect } from 'react';

// Function to clear stale Clerk session cookies
function clearClerkCookies() {
  // Clear the __session cookie by setting it to expire immediately
  document.cookie = '__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
  
  // Also clear from parent domain in case it's set there
  const domainParts = window.location.hostname.split('.');
  if (domainParts.length > 2) {
    const parentDomain = '.' + domainParts.slice(-2).join('.');
    document.cookie = '__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + parentDomain + ';';
  }
}

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

  // Listen for Clerk errors and auto-fix cookie issues
  useEffect(() => {
    const handleClerkError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || '';
      
      // Check if this is a JWT kid mismatch error
      if (errorMessage.includes('jwk-kid-mismatch') || 
          errorMessage.includes('Unable to find a signing key in JWKS') ||
          errorMessage.includes('Handshake token verification failed')) {
        
        console.warn('Detected stale Clerk session cookie. Clearing and reloading...');
        
        // Clear the stale cookies
        clearClerkCookies();
        
        // Reload the page to start fresh
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // Add error listener
    window.addEventListener('error', handleClerkError);
    
    return () => {
      window.removeEventListener('error', handleClerkError);
    };
  }, []);

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
