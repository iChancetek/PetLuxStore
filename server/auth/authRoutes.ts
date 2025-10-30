import { Router } from 'express';
import { authService } from './authService';
import { emailService } from './emailService';
import { requireAuth, optionalAuth } from './authMiddleware';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

const SESSION_COOKIE_NAME = 'pot_session';
const REFRESH_COOKIE_NAME = 'pot_refresh';

// Cookie options
const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';

// SECURITY: SameSite=strict for better CSRF protection
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // HTTPS only in production
  sameSite: 'strict' as const, // SECURITY: Strict CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const, // SECURITY: Strict CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/refresh',
};

// Rate limiters
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// POST /api/auth/signup
router.post('/signup', authRateLimiter, async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);

    const { user, verificationToken } = await authService.createUser(data);

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName || undefined
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create account',
    });
  }
});

// POST /api/auth/signin
router.post('/signin', authRateLimiter, async (req, res) => {
  try {
    const data = signinSchema.parse(req.body);

    const { user, sessionToken, refreshToken } = await authService.signin({
      email: data.email,
      password: data.password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set session cookies
    res.cookie(SESSION_COOKIE_NAME, sessionToken, cookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    
    // Provide more helpful message for users without passwords (migrated from Clerk)
    let errorMessage = error.message || 'Invalid email or password';
    if (errorMessage.includes('Password not set')) {
      errorMessage = 'This account needs a password. Please click "Forgot Password" to set one.';
    }
    
    res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
});

// POST /api/auth/signout
router.post('/signout', optionalAuth, async (req, res) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await authService.signout(sessionToken);
    }

    // Clear cookies
    res.clearCookie(SESSION_COOKIE_NAME);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth/refresh' });

    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error: any) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign out',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', generalRateLimiter, async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const { sessionToken, refreshToken: newRefreshToken } =
      await authService.refreshSession(refreshToken);

    // Set new session cookies
    res.cookie(SESSION_COOKIE_NAME, sessionToken, cookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Session refreshed successfully',
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.clearCookie(SESSION_COOKIE_NAME);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth/refresh' });
    res.status(401).json({
      success: false,
      message: error.message || 'Failed to refresh session',
    });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      id: req.user.claims.sub,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      profileImageUrl: req.user.claims.profile_image_url,
      role: req.user.claims.role,
      emailVerified: req.user.claims.email_verified,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', generalRateLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const user = await authService.verifyEmail(token);

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName || undefined);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify email',
    });
  }
});

// POST /api/auth/request-reset
router.post('/request-reset', authRateLimiter, async (req, res) => {
  try {
    const data = requestResetSchema.parse(req.body);

    const resetToken = await authService.createPasswordResetToken(
      data.email,
      req.ip
    );

    // Send password reset email (if user exists)
    await emailService.sendPasswordResetEmail(data.email, resetToken);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent.',
    });
  } catch (error: any) {
    console.error('Request reset error:', error);
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent.',
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const user = await authService.resetPassword(data.token, data.password);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, generalRateLimiter, async (req, res) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await authService.changePassword(
      req.user.claims.sub,
      data.currentPassword,
      data.newPassword
    );

    // Clear current session since all sessions are invalidated
    res.clearCookie(SESSION_COOKIE_NAME);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth/refresh' });

    res.json({
      success: true,
      message: 'Password changed successfully. Please sign in again.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
});

export default router;
