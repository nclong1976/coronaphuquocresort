import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.js';

const prisma = new PrismaClient();

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isBanned) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  if (user.role !== 'admin' && user.role !== 'assistant' && user.role !== 'super_admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export async function superAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isBanned: true } });
  if (!user || user.isBanned || user.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin required' });
    return;
  }
  next();
}
