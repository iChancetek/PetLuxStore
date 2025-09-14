import { useUser } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();

  // Transform Clerk user data to match our expected format
  const transformedUser = user ? {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    profileImageUrl: user.imageUrl || '',
  } : null;

  return {
    user: transformedUser,
    isLoading: !isLoaded,
    isAuthenticated: isLoaded && isSignedIn,
  };
}
