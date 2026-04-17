declare global {
  namespace Express {
    interface User {
      id: string;
      claims: {
        sub: string;
        email: string;
        display_name?: string;
        profile_image_url?: string;
        role: 'user' | 'reviewer' | 'admin';
        email_verified: boolean;
      };
    }

    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export {};
