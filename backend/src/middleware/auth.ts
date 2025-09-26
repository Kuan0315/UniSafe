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
export const verifyToken = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) return res.status(401).json({ message: 'Invalid token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token invalid or expired' });
    }
};

export function requireRole(allowedRoles: Array<'student' | 'guardian' | 'security' | 'staff'>) {
  return async function roleGuard(req: Request, res: Response, next: NextFunction) {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET not set');
      const payload = jwt.verify(token, secret) as AuthPayload;
      req.auth = payload;
      // Lazy import to avoid cycle
      const { default: User } = await import('../models/User');
      const user = await User.findById(payload.userId).select('role');
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return next();
    } catch (_err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

