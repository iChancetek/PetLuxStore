import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

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
  
  console.log('Cleared Clerk session cookies');
}

// Function to check if cookie contains old/stale instance ID
function hasStaleSessionCookie() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '__session' && value) {
      // Check if cookie contains the old instance ID
      if (value.includes('ins_32fRdFIS8HYl1QVoirGOjnwxdZo')) {
        return true;
      }
    }
  }
  return false;
}

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  
  // Determine if we're in production (deployed to thepotluxe.com or www.thepotluxe.com)
  const isProduction = window.location.hostname === 'thepotluxe.com' || 
                       window.location.hostname === 'www.thepotluxe.com' ||
                       window.location.hostname.endsWith('.thepotluxe.com');
  
  // Select the appropriate publishable key based on environment
  const publishableKey = isProduction
    ? (import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  console.log(`Using ${isProduction ? 'LIVE' : 'TEST'} Clerk publishable key for domain: ${window.location.hostname}`);

  // Check for stale cookies on mount and clear them
  useEffect(() => {
    const checkAndClearStaleCookies = () => {
      if (hasStaleSessionCookie()) {
        console.warn('Detected stale Clerk session cookie from old instance. Clearing...');
        clearClerkCookies();
        // Set a flag to prevent infinite loops
        const hasCleared = sessionStorage.getItem('clerk_cookies_cleared');
        if (!hasCleared) {
          sessionStorage.setItem('clerk_cookies_cleared', 'true');
          window.location.reload();
          return;
        }
      }
      setIsReady(true);
    };

    checkAndClearStaleCookies();
  }, []);

  // Don't render until we've checked for stale cookies
  if (!isReady) {
    return null;
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
