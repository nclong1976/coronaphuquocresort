import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
