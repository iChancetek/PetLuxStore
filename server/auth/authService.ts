import argon2 from 'argon2';
import crypto from 'crypto';
import { db } from '../db';
import { users, authSessions, verificationTokens, passwordResetTokens, auditLogs } from '@shared/schema';
import { eq, and, gt, lt, isNull } from 'drizzle-orm';
import type { User } from '@shared/schema';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  // SECURITY: Hash tokens before storing in database
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // SECURITY: Constant-time comparison to prevent timing attacks
  private compareTokens(a: string, b: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ user: User; verificationToken: string }> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(data.password);
    const userId = crypto.randomUUID();

    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        emailVerified: false,
        role: 'user',
        isActive: true,
      })
      .returning();

    // Create email verification token
    const verificationToken = this.generateToken();
    const hashedToken = this.hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(verificationTokens).values({
      userId: user.id,
      token: hashedToken, // SECURITY: Store hashed token
      type: 'email_verification',
      expiresAt,
    });

    // Log signup event
    await this.logAuthEvent({
      userId: user.id,
      action: 'signup',
      success: true,
      category: 'auth',
    });

    return { user, verificationToken };
  }

  async signin(data: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: User; sessionToken: string; refreshToken: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (!user) {
      await this.logAuthEvent({
        action: 'signin_failed',
        success: false,
        category: 'auth',
        message: 'User not found',
        metadata: { email: data.email },
        ip: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await this.logAuthEvent({
        userId: user.id,
        action: 'signin_locked',
        success: false,
        category: 'auth',
        message: 'Account locked due to failed login attempts',
        ip: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error(
        `Account is locked. Please try again in ${Math.ceil(
          (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
        )} minutes.`
      );
    }

    // Check if user is active
    if (!user.isActive) {
      await this.logAuthEvent({
        userId: user.id,
        action: 'signin_inactive',
        success: false,
        category: 'auth',
        message: 'Account inactive',
        ip: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Account is inactive. Please contact support.');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error('Password not set. Please use password reset flow.');
    }

    const isPasswordValid = await this.verifyPassword(user.passwordHash, data.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account if max attempts reached
      if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
      }

      await db.update(users).set(updateData).where(eq(users.id, user.id));

      await this.logAuthEvent({
        userId: user.id,
        action: 'signin_failed',
        success: false,
        category: 'auth',
        message: `Failed login attempt ${failedAttempts}`,
        ip: data.ipAddress,
        userAgent: data.userAgent,
      });

      throw new Error('Invalid email or password');
    }

    // Reset failed login attempts on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create session
    const sessionToken = this.generateToken();
    const refreshToken = this.generateToken();
    const hashedSessionToken = this.hashToken(sessionToken);
    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION);

    await db.insert(authSessions).values({
      userId: user.id,
      token: hashedSessionToken, // SECURITY: Store hashed token
      refreshToken: hashedRefreshToken, // SECURITY: Store hashed token
      expiresAt,
      refreshExpiresAt,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });

    await this.logAuthEvent({
      userId: user.id,
      action: 'signin',
      success: true,
      category: 'auth',
      ip: data.ipAddress,
      userAgent: data.userAgent,
    });

    return { user, sessionToken, refreshToken };
  }

  async verifySession(sessionToken: string): Promise<User | null> {
    const hashedToken = this.hashToken(sessionToken); // SECURITY: Hash incoming token

    const [session] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.token, hashedToken),
          gt(authSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return null;
    }

    // Update last active time
    await db
      .update(authSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(authSessions.token, hashedToken));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return user || null;
  }

  async refreshSession(refreshToken: string): Promise<{
    sessionToken: string;
    refreshToken: string;
  }> {
    const hashedToken = this.hashToken(refreshToken); // SECURITY: Hash incoming token

    const [session] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.refreshToken, hashedToken),
          gt(authSessions.refreshExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      // Log failed refresh attempt
      await this.logAuthEvent({
        action: 'refresh_failed',
        success: false,
        category: 'auth',
        message: 'Invalid or expired refresh token',
      });
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens (rotating refresh token)
    const newSessionToken = this.generateToken();
    const newRefreshToken = this.generateToken();
    const hashedSessionToken = this.hashToken(newSessionToken);
    const hashedRefreshToken = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION);

    // SECURITY: Atomic refresh token rotation - delete old and create new in transaction
    await db.transaction(async (tx) => {
      // First, delete the old session to invalidate the old refresh token
      await tx.delete(authSessions).where(eq(authSessions.id, session.id));

      // Then, create new session with new tokens
      await tx.insert(authSessions).values({
        userId: session.userId,
        token: hashedSessionToken, // SECURITY: Store hashed token
        refreshToken: hashedRefreshToken, // SECURITY: Store hashed token (rotated)
        expiresAt,
        refreshExpiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
    });

    // Log successful refresh
    await this.logAuthEvent({
      userId: session.userId,
      action: 'refresh_session',
      success: true,
      category: 'auth',
      message: 'Refresh token rotated successfully',
    });

    return { sessionToken: newSessionToken, refreshToken: newRefreshToken };
  }

  async signout(sessionToken: string): Promise<void> {
    const hashedToken = this.hashToken(sessionToken); // SECURITY: Hash incoming token

    const [session] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.token, hashedToken))
      .limit(1);

    if (session) {
      await this.logAuthEvent({
        userId: session.userId,
        action: 'signout',
        success: true,
        category: 'auth',
      });

      await db.delete(authSessions).where(eq(authSessions.token, hashedToken));
    }
  }

  async verifyEmail(token: string): Promise<User> {
    const hashedToken = this.hashToken(token); // SECURITY: Hash incoming token

    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, hashedToken),
          eq(verificationTokens.type, 'email_verification'),
          gt(verificationTokens.expiresAt, new Date()),
          isNull(verificationTokens.usedAt)
        )
      )
      .limit(1);

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark token as used
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokens.id, verificationToken.id));

    // Update user
    const [user] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
      })
      .where(eq(users.id, verificationToken.userId))
      .returning();

    await this.logAuthEvent({
      userId: user.id,
      action: 'email_verified',
      success: true,
      category: 'auth',
    });

    return user;
  }

  async createPasswordResetToken(email: string, ipAddress?: string): Promise<string> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal that user doesn't exist
      throw new Error('If the email exists, a password reset link will be sent.');
    }

    const resetToken = this.generateToken();
    const hashedToken = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: hashedToken, // SECURITY: Store hashed token
      expiresAt,
      ipAddress: ipAddress || null,
    });

    await this.logAuthEvent({
      userId: user.id,
      action: 'password_reset_requested',
      success: true,
      category: 'auth',
      ip: ipAddress,
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const hashedToken = this.hashToken(token); // SECURITY: Hash incoming token

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (!resetToken) {
      throw new Error('Invalid or expired password reset token');
    }

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    // Update password
    const passwordHash = await this.hashPassword(newPassword);
    const [user] = await db
      .update(users)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, resetToken.userId))
      .returning();

    // Invalidate all existing sessions
    await db.delete(authSessions).where(eq(authSessions.userId, user.id));

    await this.logAuthEvent({
      userId: user.id,
      action: 'password_reset',
      success: true,
      category: 'auth',
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.verifyPassword(user.passwordHash, currentPassword);
    if (!isPasswordValid) {
      await this.logAuthEvent({
        userId: user.id,
        action: 'password_change_failed',
        success: false,
        category: 'auth',
        message: 'Invalid current password',
      });
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    // Invalidate all sessions except current one
    await db.delete(authSessions).where(eq(authSessions.userId, userId));

    await this.logAuthEvent({
      userId: user.id,
      action: 'password_changed',
      success: true,
      category: 'auth',
    });
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

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(authSessions).where(lt(authSessions.expiresAt, now));
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db
      .delete(verificationTokens)
      .where(lt(verificationTokens.expiresAt, now));
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, now));
  }
}

export const authService = new AuthService();
