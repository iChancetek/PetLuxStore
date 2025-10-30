import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  from: string;
  replyTo?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      from: process.env.EMAIL_FROM || 'noreply@thepotluxe.com',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@thepotluxe.com',
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email credentials are configured
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (emailHost && emailPort && emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort),
        secure: emailPort === '465', // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    } else {
      console.warn(
        'Email service not configured. Email sending will be logged to console instead.'
      );
    }
  }

  async sendVerificationEmail(to: string, token: string, userName?: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const subject = 'Verify your email address';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .code { font-family: monospace; background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 20px 0; font-size: 16px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to PotLuxE!</h1>
            </div>
            <div class="content">
              ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
              <p>Thank you for signing up! Please verify your email address to complete your registration and start shopping for premium pet products.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <div class="code">${verificationUrl}</div>
              <p style="font-size: 14px; color: #666;">This verification link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} PotLuxE. All rights reserved.</p>
              <p style="font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to PotLuxE!

${userName ? `Hi ${userName},` : 'Hi there,'}

Thank you for signing up! Please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} PotLuxE. All rights reserved.
    `;

    await this.sendEmail({ to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, token: string, userName?: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const subject = 'Reset your password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .code { font-family: monospace; background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 20px 0; font-size: 16px; letter-spacing: 2px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Password Reset Request</h1>
            </div>
            <div class="content">
              ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
              <p>We received a request to reset your password for your PotLuxE account. Click the button below to choose a new password.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <div class="code">${resetUrl}</div>
              <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour. For your security, all existing sessions will be invalidated when you reset your password.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} PotLuxE. All rights reserved.</p>
              <p style="font-size: 12px;">If you didn't request a password reset, you can safely ignore this email or contact support if you have concerns.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

${userName ? `Hi ${userName},` : 'Hi there,'}

We received a request to reset your password for your PotLuxE account. Click the link below to choose a new password:

${resetUrl}

This password reset link will expire in 1 hour. For your security, all existing sessions will be invalidated when you reset your password.

If you didn't request a password reset, you can safely ignore this email or contact support if you have concerns.

© ${new Date().getFullYear()} PotLuxE. All rights reserved.
    `;

    await this.sendEmail({ to, subject, html, text });
  }

  async sendWelcomeEmail(to: string, userName?: string): Promise<void> {
    const baseUrl = this.getBaseUrl();

    const subject = 'Welcome to PotLuxE - Your Premium Pet Store';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .features { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .feature-item { margin: 12px 0; padding-left: 24px; position: relative; }
            .feature-item:before { content: '✓'; position: absolute; left: 0; color: #667eea; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Welcome to PotLuxE!</h1>
            </div>
            <div class="content">
              ${userName ? `<h2>Hi ${userName}!</h2>` : '<h2>Hi there!</h2>'}
              <p>We're thrilled to have you join the PotLuxE family! Your account is now verified and ready to use.</p>
              <div class="features">
                <h3 style="margin-top: 0;">What you can do now:</h3>
                <div class="feature-item">Browse our curated collection of premium pet products</div>
                <div class="feature-item">Get personalized recommendations from our AI assistant</div>
                <div class="feature-item">Enjoy secure checkout and fast shipping</div>
                <div class="feature-item">Track your orders in your dashboard</div>
              </div>
              <p style="text-align: center;">
                <a href="${baseUrl}/products" class="button">Start Shopping</a>
              </p>
              <p>If you have any questions, our support team is here to help at <a href="mailto:support@thepotluxe.com">support@thepotluxe.com</a></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} PotLuxE. All rights reserved.</p>
              <p style="font-size: 12px;">Happy shopping! 🐾</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to PotLuxE!

${userName ? `Hi ${userName}!` : 'Hi there!'}

We're thrilled to have you join the PotLuxE family! Your account is now verified and ready to use.

What you can do now:
- Browse our curated collection of premium pet products
- Get personalized recommendations from our AI assistant
- Enjoy secure checkout and fast shipping
- Track your orders in your dashboard

Start shopping: ${baseUrl}/products

If you have any questions, our support team is here to help at support@thepotluxe.com

Happy shopping! 🐾

© ${new Date().getFullYear()} PotLuxE. All rights reserved.
    `;

    await this.sendEmail({ to, subject, html, text });
  }

  private async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.from,
          replyTo: this.config.replyTo,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        console.log(`✉️  Email sent to ${data.to}: ${data.subject}`);
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email. Please try again later.');
      }
    } else {
      // Log email to console in development
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL (Development Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${data.to}`);
      console.log(`Subject: ${data.subject}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(data.text);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }

  private getBaseUrl(): string {
    // In production, use the actual domain
    if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
      return 'https://thepotluxe.com';
    }
    
    // In development, use Replit dev URL
    const replitDev = process.env.REPL_SLUG && process.env.REPL_OWNER;
    if (replitDev) {
      return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    }

    return 'http://localhost:5000';
  }
}

export const emailService = new EmailService();
