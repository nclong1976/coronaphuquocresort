import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../services/authService.js';
import { PrismaClient } from '@prisma/client';

import crypto from 'crypto';

const prisma = new PrismaClient();

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  });

  const adminSockets = new Map<string, string>();
  const userSockets = new Map<string, string>();

  io.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;
    let userId: string | null = null;
    let isAdmin = false;

    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        isAdmin = user?.role === 'admin' || user?.role === 'assistant' || user?.role === 'super_admin';
      } catch {}
    }

    if (isAdmin) {
      adminSockets.set(socket.id, userId!);
      socket.join('admin');
    } else if (userId) {
      userSockets.set(socket.id, userId);
      socket.join(`user:${userId}`);
      io.to('admin').emit('user_online', { userId });
    }

    const handleSupportMessage = async (data: {
      ticketId: string;
      content: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
      tempId?: string | null;
    }) => {
      if (!userId) return;
      const ticket = await prisma.supportTicket.findUnique({ where: { id: data.ticketId } });
      if (!ticket || (ticket.userId !== userId && !isAdmin)) return;

      const messageId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const contentStr = data.content || (data.attachmentUrl ? '📷 Hình ảnh đính kèm' : '');

      const payload = {
        ticketId: data.ticketId,
        tempId: data.tempId ?? null,
        message: {
          id: messageId,
          content: contentStr,
          senderRole: isAdmin ? 'admin' : 'user',
          createdAt,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentType: data.attachmentType ?? null,
        },
      };

      // 1. Broadcast immediately (Real-time)
      io.to(`user:${ticket.userId}`).emit('support_message', payload);
      io.to('admin').emit('support_message', payload);

      // Also emit receive_message for compatibility
      io.to(`user:${ticket.userId}`).emit('receive_message', payload);
      io.to('admin').emit('receive_message', payload);

      // 2. Insert into PostgreSQL asynchronously (Write-Behind / Async Logging)
      prisma.supportMessage.create({
        data: {
          id: messageId,
          ticketId: data.ticketId,
          senderId: userId,
          senderRole: isAdmin ? 'admin' : 'user',
          content: contentStr,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentType: data.attachmentType ?? null,
          createdAt,
        },
      }).catch((err) => {
        console.error('[Async DB Insert Error - supportMessage.create]:', err);
      });

      // 3. Update support ticket updatedAt
      prisma.supportTicket.update({
        where: { id: data.ticketId },
        data: { updatedAt: new Date(createdAt) },
      }).catch(() => {});
    };

    socket.on('support_message', handleSupportMessage);

    socket.on('send_message', (data: any) => {
      const ticketId = data.ticketId || data.roomId || data.room_id;
      const content = data.content || data.message_text || data.messageText;
      if (ticketId) {
        handleSupportMessage({
          ticketId,
          content: content || '',
          attachmentUrl: data.attachmentUrl,
          attachmentType: data.attachmentType,
          tempId: data.tempId,
        });
      }
    });

    // Chat trực tiếp bàn Sic Bo - join room khi vào game
    socket.on('join_sicbo', () => {
      if (userId) socket.join('sicbo');
    });
    socket.on('leave_sicbo', () => {
      socket.leave('sicbo');
    });

    socket.on('sicbo:chat', (data: { username: string; content: string }) => {
      if (!userId || !data?.content?.trim) return;
      const content = String(data.content).trim().slice(0, 200);
      if (!content) return;
      const username = data.username || 'Player';
      io.to('sicbo').emit('sicbo:chat_message', {
        userId,
        username,
        content,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing', (data: { ticketId: string; userId?: string }) => {
      if (isAdmin && data.userId) {
        io.to(`user:${data.userId}`).emit('admin_typing', { ticketId: data.ticketId });
      } else if (userId) {
        io.to('admin').emit('user_typing', { ticketId: data.ticketId, userId });
      }
    });

    socket.on('disconnect', () => {
      adminSockets.delete(socket.id);
      userSockets.delete(socket.id);
      if (userId && !isAdmin) {
        io.to('admin').emit('user_offline', { userId });
      }
    });
  });

  return { io, emitToAdmin: (event: string, data: any) => io.to('admin').emit(event, data) };
}

export type SocketInstance = ReturnType<typeof initSocket>;
