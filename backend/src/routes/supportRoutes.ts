import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

function isStaffSupportRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'assistant' || role === 'super_admin';
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_SUPPORT_DIR = path.join(__dirname, '..', '..', 'uploads', 'support');
const DATA_URL_RE = /^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i;

/** Admin: ảnh / video / pdf / zip — data URL base64 */
const MEDIA_DATA_URL_RE =
  /^data:(image\/(?:jpeg|png|gif|webp)|video\/(?:mp4|webm)|application\/(?:pdf|zip|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document));base64,(.+)$/i;

function publicUploadUrl(req: { protocol: string; get: (h: string) => string | undefined }, filename: string): string {
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:4000';
  const proto = (req.get('x-forwarded-proto') as string) || req.protocol || 'http';
  return `${proto}://${host}/uploads/support/${filename}`;
}

router.post('/upload-image', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const raw = req.body?.dataUrl;
    if (typeof raw !== 'string') return res.status(400).json({ error: 'dataUrl required' });
    const m = raw.match(DATA_URL_RE);
    if (!m) return res.status(400).json({ error: 'Invalid image data URL' });
    const extRaw = m[1].toLowerCase();
    const ext = extRaw === 'jpeg' || extRaw === 'jpg' ? 'jpg' : extRaw === 'png' ? 'png' : extRaw === 'gif' ? 'gif' : 'webp';
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length < 32) return res.status(400).json({ error: 'Image too small' });
    if (buf.length > 4_000_000) return res.status(413).json({ error: 'Image too large (max ~4MB)' });
    await mkdir(UPLOAD_SUPPORT_DIR, { recursive: true });
    const name = `${Date.now()}_${randomBytes(6).toString('hex')}.${ext}`;
    await writeFile(path.join(UPLOAD_SUPPORT_DIR, name), buf);
    const url = publicUploadUrl(req, name);
    res.json({ url, attachmentType: 'image' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/upload-media', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const isAdmin = await prisma.user.findUnique({ where: { id: req.userId! } }).then((u) => u?.role === 'admin');
    if (!isAdmin) return res.status(403).json({ error: 'Admin only' });

    const raw = req.body?.dataUrl;
    if (typeof raw !== 'string') return res.status(400).json({ error: 'dataUrl required' });
    const m = raw.match(MEDIA_DATA_URL_RE);
    if (!m) return res.status(400).json({ error: 'Định dạng không hỗ trợ (ảnh, video mp4/webm, pdf, doc, zip)' });
    const mime = m[1].toLowerCase();
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length < 16) return res.status(400).json({ error: 'File quá nhỏ' });
    const max = mime.startsWith('video/') ? 18_000_000 : 8_000_000;
    if (buf.length > max) return res.status(413).json({ error: 'File quá lớn' });

    let ext = 'bin';
    let attachmentType: 'image' | 'video' | 'file' = 'file';
    if (mime.startsWith('image/')) {
      attachmentType = 'image';
      ext = mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : mime.includes('webp') ? 'webp' : 'jpg';
    } else if (mime.startsWith('video/')) {
      attachmentType = 'video';
      ext = mime.includes('webm') ? 'webm' : 'mp4';
    } else if (mime.includes('pdf')) ext = 'pdf';
    else if (mime.includes('zip')) ext = 'zip';
    else if (mime.includes('wordprocessingml')) ext = 'docx';
    else if (mime.includes('msword')) ext = 'doc';

    await mkdir(UPLOAD_SUPPORT_DIR, { recursive: true });
    const name = `${Date.now()}_${randomBytes(6).toString('hex')}.${ext}`;
    await writeFile(path.join(UPLOAD_SUPPORT_DIR, name), buf);
    const url = publicUploadUrl(req, name);
    res.json({ url, attachmentType });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/tickets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = isStaffSupportRole(actor?.role);

    const where = isAdmin ? {} : { userId };
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        userId: t.userId,
        user: t.user,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt,
        messages: t.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt,
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType,
        })),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/tickets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { subject } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: { userId, subject: subject || 'Support' },
    });
    res.json({ ticket: { id: ticket.id, subject: ticket.subject, status: ticket.status } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/message', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { ticketId, content, attachmentUrl, attachmentType } = req.body as {
      ticketId?: string;
      content?: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    };
    const contentStr = typeof content === 'string' ? content.trim().slice(0, 2000) : '';
    const attUrl = typeof attachmentUrl === 'string' && attachmentUrl.length > 0 ? attachmentUrl.slice(0, 2000) : null;
    const attType = typeof attachmentType === 'string' ? attachmentType.slice(0, 32) : null;
    if (!contentStr && !attUrl) return res.status(400).json({ error: 'Message content or attachment required' });

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const actorMsg = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = isStaffSupportRole(actorMsg?.role);
    if (!isAdmin && ticket.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const msg = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderRole: isAdmin ? 'admin' : 'user',
        content: contentStr || (attUrl ? '📷 Hình ảnh đính kèm' : ''),
        attachmentUrl: attUrl,
        attachmentType: attUrl ? attType || 'image' : null,
      },
    });

    await prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });

    const io = (req as any).app?.get?.('io');
    if (io) {
      const payload = {
        ticketId,
        message: {
          id: msg.id,
          content: msg.content,
          senderRole: msg.senderRole,
          createdAt: msg.createdAt,
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
        },
      };
      io.to(`user:${ticket.userId}`).emit('support_message', payload);
      io.to('admin').emit('support_message', payload);
    }

    res.json({
      message: {
        id: msg.id,
        content: msg.content,
        senderRole: msg.senderRole,
        createdAt: msg.createdAt,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
      },
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
