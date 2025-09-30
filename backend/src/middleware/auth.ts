import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}