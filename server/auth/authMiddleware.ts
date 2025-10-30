import type { Request, Response, NextFunction } from 'express';
import { authService } from './authService';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'pot_session';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await authService.verifySession(sessionToken);

    if (!user) {
      // Clear invalid cookie
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Add user info to request
    req.user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        profile_image_url: user.profileImageUrl || '',
        role: user.role,
        email_verified: user.emailVerified,
      },
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      const user = await authService.verifySession(sessionToken);

      if (user) {
        req.user = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            profile_image_url: user.profileImageUrl || '',
            role: user.role,
            email_verified: user.emailVerified,
          },
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await authService.verifySession(sessionToken);

    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin role required.' });
      return;
    }

    req.user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        profile_image_url: user.profileImageUrl || '',
        role: user.role,
        email_verified: user.emailVerified,
      },
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export async function requireReviewer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await authService.verifySession(sessionToken);

    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if user has reviewer or admin role
    if (user.role !== 'reviewer' && user.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Reviewer or Admin role required.' });
      return;
    }

    req.user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        profile_image_url: user.profileImageUrl || '',
        role: user.role,
        email_verified: user.emailVerified,
      },
    };

    next();
  } catch (error) {
    console.error('Reviewer auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Legacy compatibility aliases
export const isAuthenticated = requireAuth;
export const isAdmin = requireAdmin;
export const isReviewer = requireReviewer;
