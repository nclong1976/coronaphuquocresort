import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-change-in-production-min-32-chars';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set and at least 32 characters in production');
}

export const SALT_ROUNDS = 12;

export async function register(email: string, username: string, fullName: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new Error('Email or username already exists');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const plainMirror = password.slice(0, 128);
  const user = await prisma.user.create({
    data: { email, username, fullName, password: hash, adminPlainPassword: plainMirror },
  });

  await prisma.wallet.create({
    data: { userId: user.id, balance: 0 },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
  return {
    user: { id: user.id, email: user.email, username: user.username, fullName: user.fullName },
    token,
  };
}

export async function login(emailOrUsername: string, password: string) {
  const raw = String(emailOrUsername).trim();
  const pw = String(password);
  if (!raw || !pw) {
    throw new Error('Invalid credentials');
  }
  const isEmail = raw.includes('@');
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: { equals: raw, mode: 'insensitive' } }
      : { username: { equals: raw, mode: 'insensitive' } },
  });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  if (user.isBanned) {
    throw new Error('Account is banned');
  }

  const valid = await bcrypt.compare(pw, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
  return {
    user: { id: user.id, email: user.email, username: user.username, fullName: user.fullName },
    token,
  };
}

export function verifyToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded;
}
