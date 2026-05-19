import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many login attempts' },
});

export const betLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many bet requests' },
});
