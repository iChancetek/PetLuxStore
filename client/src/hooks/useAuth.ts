import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Temporarily using the old auth system until Clerk is properly configured
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
