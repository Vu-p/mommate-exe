import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Conversation from './models/Conversation.js';

let io: Server | null = null;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token || !process.env.JWT_SECRET) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; type?: string };
      if (decoded.type && decoded.type !== 'access') return next(new Error('Unauthorized'));
      const user = await User.findById(decoded.id).select('_id role accountStatus');
      if (!user || user.accountStatus === 'suspended') return next(new Error('Unauthorized'));
      socket.data.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });
  io.on('connection', (socket) => {
    socket.on('conversation:join', async (conversationId: string, acknowledge?: (value: unknown) => void) => {
      const user = socket.data.user;
      const conversation = await Conversation.findById(conversationId).select('participants');
      const allowed = user?.role === 'admin' || conversation?.participants.some((id) => String(id) === String(user?._id));
      if (!allowed) return acknowledge?.({ ok: false, error: 'Forbidden' });
      socket.join(`conversation:${conversationId}`);
      acknowledge?.({ ok: true });
    });
  });
  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) =>
  io?.to(`user:${userId}`).emit(event, payload);

export const emitToConversation = (conversationId: string, event: string, payload: unknown) =>
  io?.to(`conversation:${conversationId}`).emit(event, payload);
