import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../services/authService.js';
import { PrismaClient } from '@prisma/client';

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

    socket.on('support_message', async (data: { ticketId: string; content: string }) => {
      if (!userId) return;
      const ticket = await prisma.supportTicket.findUnique({ where: { id: data.ticketId } });
      if (!ticket || ticket.userId !== userId && !isAdmin) return;

      const msg = await prisma.supportMessage.create({
        data: {
          ticketId: data.ticketId,
          senderId: userId,
          senderRole: isAdmin ? 'admin' : 'user',
          content: data.content,
        },
      });

      const payload = {
        ticketId: data.ticketId,
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
