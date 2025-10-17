import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

export function setupClerkAuth(app: Express) {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('Missing CLERK_SECRET_KEY environment variable');
  }
  
  // Add Clerk middleware
  app.use(clerkMiddleware());
}

// Middleware to require authentication
export const requireAuth: RequestHandler = async (req: any, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user info from Clerk
    const user = await clerkClient.users.getUser(auth.userId);
    
    if (user) {
      // Upsert user in our database
      await storage.upsertUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.imageUrl || '',
      });

      // Add user info to request
      req.user = {
        claims: {
          sub: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          profile_image_url: user.imageUrl || '',
        }
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to get user info if authenticated (optional auth)
export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (auth?.userId) {
      const user = await clerkClient.users.getUser(auth.userId);
      
      if (user) {
        // Upsert user in our database
        await storage.upsertUser({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          profileImageUrl: user.imageUrl || '',
        });

        // Add user info to request
        req.user = {
          claims: {
            sub: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            profile_image_url: user.imageUrl || '',
          }
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails for optional auth
  }
};

// Middleware to require admin role
export const requireAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user info from Clerk
    const user = await clerkClient.users.getUser(auth.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Upsert user in our database
    await storage.upsertUser({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImageUrl: user.imageUrl || '',
    });

    // Check if user has admin role in our database
    const dbUser = await storage.getUser(user.id);
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Add user info to request
    req.user = {
      claims: {
        sub: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        profile_image_url: user.imageUrl || '',
      }
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to require reviewer or admin role
export const requireReviewer: RequestHandler = async (req: any, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user info from Clerk
    const user = await clerkClient.users.getUser(auth.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Upsert user in our database
    await storage.upsertUser({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImageUrl: user.imageUrl || '',
    });

    // Check if user has reviewer or admin role in our database
    const dbUser = await storage.getUser(user.id);
    if (!dbUser || (dbUser.role !== 'reviewer' && dbUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Reviewer or Admin role required.' });
    }

    // Add user info to request
    req.user = {
      claims: {
        sub: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        profile_image_url: user.imageUrl || '',
      }
    };

    next();
  } catch (error) {
    console.error('Reviewer auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Legacy compatibility aliases
export const isAuthenticated = requireAuth;
export const isAdmin = requireAdmin;
export const isReviewer = requireReviewer;
