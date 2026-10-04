import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    [key: string]: any;
  };
}

export interface Usuario {
  id?: number;
  email: string;
  password?: string;
  rol: string;
  lenguage: string;
}
