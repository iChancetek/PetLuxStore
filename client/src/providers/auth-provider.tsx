import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'user' | 'reviewer' | 'admin';
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Fetch current user session
  const { data: user = null, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    enabled: isAuthReady,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if auth is ready on mount
  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  // Sign in mutation
  const signinMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/signin', { email, password });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Sign up mutation
  const signupMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const response = await apiRequest('POST', '/api/auth/signup', { email, password, firstName, lastName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Sign out mutation
  const signoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/signout');
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Password reset email mutation
  const sendResetEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest('POST', '/api/auth/request-password-reset', { email });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      await apiRequest('POST', '/api/auth/reset-password', { token, newPassword });
    },
  });

  const signin = async (email: string, password: string) => {
    await signinMutation.mutateAsync({ email, password });
  };

  const signup = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    await signupMutation.mutateAsync({ email, password, firstName, lastName });
  };

  const signout = async () => {
    await signoutMutation.mutateAsync();
  };

  const sendPasswordResetEmail = async (email: string) => {
    await sendResetEmailMutation.mutateAsync(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await resetPasswordMutation.mutateAsync({ token, newPassword });
  };

  const value: AuthContextType = {
    user,
    isLoading: !isAuthReady || isUserLoading,
    isAuthenticated: !!user,
    signin,
    signup,
    signout,
    sendPasswordResetEmail,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
