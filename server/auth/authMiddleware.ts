import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authService } from './authService';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'pot_session';
const CSRF_COOKIE_NAME = 'pot_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function verifyCsrf(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!csrfCookie || !csrfHeader) {
    res.status(403).json({ message: 'CSRF token missing' });
    return;
  }

  if (csrfCookie !== csrfHeader) {
    res.status(403).json({ message: 'CSRF token invalid' });
    return;
  }

  next();
}

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
