import { auth as firebaseAuth } from '../firebase-admin';
import { db } from '../db';
import { users, auditLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { User, UpsertUser } from '@shared/schema';

export class AuthService {
  /**
   * Verified a Firebase ID token and returns the corresponding database user.
   * If the user doesn't exist in the DB yet (e.g. first Google Sign-in), it creates them.
   */
  async verifyFirebaseToken(idToken: string): Promise<User | null> {
    if (!firebaseAuth) {
      console.error("Firebase Auth not initialized");
      return null;
    }

    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      const { uid, email, email_verified, name: firebaseName, picture } = decodedToken;

      if (!email) {
        throw new Error("Email is required from Firebase token");
      }

      const adminEmails = ['chancellor@ichancetek.com', 'd.parks@me.com'];
      const isAdmin = adminEmails.includes(email.toLowerCase());
      const role = isAdmin ? 'admin' : 'user';

      // 1. Check if user exists in our DB by Firebase UID (stored in id field)
      let [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);

      // 2. If not found by UID, try by email (for migration/linking)
      if (!user) {
        [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
        
        if (user) {
          // Link existing user to this Firebase UID
          [user] = await db.update(users)
            .set({ 
              id: uid, 
              emailVerified: email_verified || user.emailVerified,
              role: isAdmin ? 'admin' : user.role, // Upgrade to admin if authorized
              displayName: firebaseName || user.displayName
            })
            .where(eq(users.email, email.toLowerCase()))
            .returning();
        } else {
          // 3. Create new user
          [user] = await db.insert(users).values({
            id: uid,
            email: email.toLowerCase(),
            displayName: firebaseName || null,
            profileImageUrl: picture || null,
            emailVerified: email_verified || false,
            role,
            isActive: true,
          }).returning();

          await this.logAuthEvent({
            userId: user.id,
            action: 'signup_firebase',
            success: true,
            category: 'auth',
            message: `User created via Firebase Auth (Role: ${role})`
          });
        }
      } else {
        // Update role if user email was added to admin list after creation
        if (user.role !== 'admin' && isAdmin) {
          [user] = await db.update(users)
            .set({ role: 'admin' })
            .where(eq(users.id, uid))
            .returning();
        }
      }

      return user;
    } catch (error: any) {
      console.error("Error verifying Firebase token:", error);
      if (error.code === 'auth/id-token-expired') {
        console.error("Firebase ID token expired");
      } else if (error.message && error.message.includes('connect')) {
        console.error("Database connection error during token verification:", error.message);
      }
      return null;
    }
  }

  /**
   * Creates a session cookie for the verified ID token.
   */
  async createSessionCookie(idToken: string, expiresIn: number): Promise<string> {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    return await firebaseAuth.createSessionCookie(idToken, { expiresIn });
  }

  /**
   * Verifies a session cookie and returns the decoded claims.
   */
  async verifySessionCookie(cookie: string): Promise<any> {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    return await firebaseAuth.verifySessionCookie(cookie, true);
  }

  /**
   * Admin-only: Resets a user's password via Firebase Admin SDK.
   * Firebase UID is stored as the user's DB id.
   */
  async adminResetUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
    await firebaseAuth.updateUser(userId, { password: newPassword });
  }

  async signout(uid: string): Promise<void> {
    if (!firebaseAuth) return;
    try {
      await firebaseAuth.revokeRefreshTokens(uid);
      await this.logAuthEvent({
        userId: uid,
        action: 'signout',
        success: true,
        category: 'auth',
      });
    } catch (error) {
      console.error("Error revoking tokens:", error);
    }
  }

  async logAuthEvent(data: {
    userId?: string;
    action: string;
    success: boolean;
    category: string;
    message?: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        actorId: data.userId || null,
        action: data.action,
        resourceType: 'auth',
        success: data.success,
        category: data.category,
        message: data.message || null,
        metadata: data.metadata || null,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }
}

export const authService = new AuthService();
