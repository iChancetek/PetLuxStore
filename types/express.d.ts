declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
    }

    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export {};
