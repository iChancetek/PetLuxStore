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
      const { uid, email, email_verified } = decodedToken;

      if (!email) {
        throw new Error("Email is required from Firebase token");
      }

      // 1. Check if user exists in our DB by Firebase UID (stored in id field)
      let [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);

      // 2. If not found by UID, try by email (for migration/linking)
      if (!user) {
        [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
        
        if (user) {
          // Link existing user to this Firebase UID
          [user] = await db.update(users)
            .set({ id: uid, emailVerified: email_verified || user.emailVerified })
            .where(eq(users.email, email.toLowerCase()))
            .returning();
        } else {
          // 3. Create new user
          const names = decodedToken.name?.split(' ') || [];
          const firstName = names[0] || null;
          const lastName = names.slice(1).join(' ') || null;

          [user] = await db.insert(users).values({
            id: uid,
            email: email.toLowerCase(),
            firstName,
            lastName,
            profileImageUrl: decodedToken.picture || null,
            emailVerified: email_verified || false,
            role: 'user',
            isActive: true,
          }).returning();

          await this.logAuthEvent({
            userId: user.id,
            action: 'signup_firebase',
            success: true,
            category: 'auth',
            message: 'User created via Firebase Auth'
          });
        }
      }

      return user;
    } catch (error) {
      console.error("Error verifying Firebase token:", error);
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
