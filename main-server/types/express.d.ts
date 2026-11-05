import { ROLES } from "../config/constants";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
    }
    interface Request {
      user?: {
        id: string;
        role: (typeof ROLES)[keyof typeof ROLES] | string;
      };
      requestId?: string;
    }
  }
}

export {};
