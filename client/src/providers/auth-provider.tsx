import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail as firebaseSendResetEmail,
  User as FirebaseUser
} from 'firebase/auth';

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
  signInWithGoogle: () => Promise<void>;
  signout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Sync Firebase Auth state with our backend session
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Exchange ID token for session cookie
        const idToken = await user.getIdToken();
        await apiRequest('POST', '/api/auth/firebase-login', { idToken });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else {
        queryClient.setQueryData(['/api/auth/me'], null);
      }
      setIsAuthReady(true);
    });
  }, [queryClient]);

  // Fetch current user session from our DB
  const { data: user = null, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    enabled: isAuthReady,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const signin = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signout = async () => {
    await firebaseSignOut(auth);
    await apiRequest('POST', '/api/auth/signout');
    queryClient.clear();
  };

  const sendPasswordResetEmail = async (email: string) => {
    await firebaseSendResetEmail(auth, email);
  };

  const value: AuthContextType = {
    user,
    isLoading: !isAuthReady || isUserLoading,
    isAuthenticated: !!user,
    signin,
    signup,
    signInWithGoogle,
    signout,
    sendPasswordResetEmail,
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
