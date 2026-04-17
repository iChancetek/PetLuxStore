import { Router } from 'express';
import { authService } from './authService';
import { requireAuth, optionalAuth } from './authMiddleware';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

const SESSION_COOKIE_NAME = 'pot_session';

// Rate limiters
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/firebase-login
// This replaces signup/signin by verifying the Firebase ID token
router.post('/firebase-login', authRateLimiter, async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID Token is required' });
    }

    // 1. Verify token and get/create user in DB
    const user = await authService.verifyFirebaseToken(idToken);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Failed to verify Firebase authentication' });
    }

    // 2. Create Firebase Session Cookie (valid for 5 days)
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await authService.createSessionCookie(idToken, expiresIn);

    // 3. Set cookie
    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({
      success: true,
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
    console.error('Firebase login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed',
    });
  }
});

// POST /api/auth/signout
router.post('/signout', optionalAuth, async (req, res) => {
  try {
    if (req.user?.uid) {
      await authService.signout(req.user.uid);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sign out' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.json(req.user.claims);
});

export default router;
