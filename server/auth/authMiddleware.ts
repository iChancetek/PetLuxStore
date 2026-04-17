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
    const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionCookie) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Verify session cookie using Firebase Admin via authService
    const decodedClaims = await authService.verifySessionCookie(sessionCookie);
    
    // Fetch user from DB to get role and metadata
    const [user] = await db.select().from(users).where(eq(users.id, decodedClaims.uid)).limit(1);

    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ message: 'User not found in database' });
      return;
    }

    // Add user info to request
    req.user = {
      uid: decodedClaims.uid,
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
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionCookie) {
      const decodedClaims = await authService.verifySessionCookie(sessionCookie);
      const [user] = await db.select().from(users).where(eq(users.id, decodedClaims.uid)).limit(1);

      if (user) {
        req.user = {
          uid: decodedClaims.uid,
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
  await requireAuth(req, res, () => {
    if (req.user?.claims?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin role required.' });
      return;
    }
    next();
  });
}

export async function requireReviewer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, () => {
    const role = req.user?.claims?.role;
    if (role !== 'reviewer' && role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Reviewer or Admin role required.' });
      return;
    }
    next();
  });
}

// Legacy compatibility aliases
export const isAuthenticated = requireAuth;
export const isAdmin = requireAdmin;
export const isReviewer = requireReviewer;

// These are no longer needed as Firebase handles token security, 
// but we keep them as stubs if needed for other parts of the app.
export function generateCsrfToken() { return ''; }
export function setCsrfCookie(res: any, token: string) {}
export function verifyCsrf(req: any, res: any, next: any) { next(); }
