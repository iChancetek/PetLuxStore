import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signin, signup } = useAuth();
  const { toast } = useToast();

  // Sync mode with defaultMode prop when it changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signin(email, password);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
        // Reset form and close modal
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        onClose();
      } else if (mode === 'signup') {
        await signup(email, password, firstName || undefined, lastName || undefined);
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
        // Reset form and close modal
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        onClose();
      } else if (mode === 'forgot-password') {
        // Send password reset request
        const response = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send reset email');
        }

        toast({
          title: 'Reset email sent!',
          description: 'Check your email for a password reset link.',
        });
        
        // Switch back to sign in mode
        setMode('signin');
        setEmail('');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: mode === 'forgot-password' ? 'Reset failed' : mode === 'signin' ? 'Sign in failed' : 'Sign up failed',
        description: error.message || 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle data-testid="text-auth-title">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription data-testid="text-auth-description">
            {mode === 'signin'
              ? 'Sign in to your account to continue'
              : mode === 'signup'
              ? 'Create a new account to get started'
              : 'Enter your email to receive a password reset link'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  data-testid="input-last-name"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="input-email"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                data-testid="input-password"
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters
                </p>
              )}
              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-primary hover:underline"
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid={mode === 'signin' ? 'button-sign-in' : mode === 'signup' ? 'button-sign-up' : 'button-reset-password'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>

          <div className="text-center text-sm">
            {mode === 'forgot-password' ? (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-primary hover:underline"
                data-testid="button-back-to-signin"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:underline"
                data-testid="button-toggle-mode"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
