// @ts-nocheck
import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/** Public: nội dung trang chủ (merge phía client với mặc định) */
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.siteContent.findMany();
    const content = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json({ content });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.warn('site-content: bảng SiteContent chưa có — chạy: npx prisma migrate deploy');
      return res.json({ content: {} });
    }
    console.error('site-content:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
