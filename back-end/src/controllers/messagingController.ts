import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { emitToConversation } from '../socket.js';
import { createNotification } from '../services/notificationService.js';
import { getPagination, paginationPayload } from '../utils/pagination.js';

const canAccess = (conversation: any, req: AuthRequest) =>
  req.user!.role === 'admin' || conversation.participants.some((id: any) => String(id) === String(req.user!._id));

export const getOrCreateBookingConversation = async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.bookingId, isDeleted: false });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const carer = await Carer.findById(booking.carer).select('user');
  if (!carer) return res.status(404).json({ message: 'Carer not found' });
  const participants = [booking.parent, carer.user];
  if (req.user!.role !== 'admin' && !participants.some((id) => String(id) === String(req.user!._id))) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const conversation = await Conversation.findOneAndUpdate(
    { booking: booking._id },
    { $setOnInsert: { booking: booking._id, participants } },
    { new: true, upsert: true }
  ).populate('participants', 'firstName lastName avatar role');
  res.json(conversation);
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  const filter = req.user!.role === 'admin' ? {} : { participants: req.user!._id };
  res.json(await Conversation.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate('participants', 'firstName lastName avatar role')
    .populate('booking', 'status scheduledAt'));
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  if (!canAccess(conversation, req)) return res.status(403).json({ message: 'Forbidden' });
  const pagination = getPagination(req.query, 50);
  const [items, total] = await Promise.all([
    Message.find({ conversation: conversation._id }).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('sender', 'firstName lastName avatar role'),
    Message.countDocuments({ conversation: conversation._id }),
  ]);
  res.json(paginationPayload(items.reverse(), total, pagination.page, pagination.limit));
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  if (!canAccess(conversation, req)) return res.status(403).json({ message: 'Forbidden' });
  if (conversation.lockedAt) return res.status(423).json({ message: 'Conversation is locked' });
  const body = String(req.body.body || '').trim();
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
  if (!body && attachments.length === 0) return res.status(400).json({ message: 'Message content is required' });
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user!._id,
    body,
    attachments,
    readBy: [{ user: req.user!._id, readAt: new Date() }],
  });
  conversation.lastMessageAt = new Date();
  await conversation.save();
  const populated = await Message.findById(message._id).populate('sender', 'firstName lastName avatar role');
  emitToConversation(String(conversation._id), 'message:new', populated);
  await Promise.all(conversation.participants
    .filter((id) => String(id) !== String(req.user!._id))
    .map((userId) => createNotification({
      userId,
      type: 'message',
      title: 'Tin nhắn mới',
      body: body || 'Bạn nhận được một tệp đính kèm.',
      data: { conversationId: conversation._id, bookingId: conversation.booking },
      email: false,
    })));
  res.status(201).json(populated);
};

export const markConversationRead = async (req: AuthRequest, res: Response) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || !canAccess(conversation, req)) return res.status(404).json({ message: 'Conversation not found' });
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user!._id }, 'readBy.user': { $ne: req.user!._id } },
    { $push: { readBy: { user: req.user!._id, readAt: new Date() } } }
  );
  emitToConversation(String(conversation._id), 'message:read', { userId: req.user!._id, readAt: new Date() });
  res.status(204).send();
};
