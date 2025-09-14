import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();

  return {
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded,
    user: user ? {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImageUrl: user.imageUrl || '',
    } : null,
  };
}