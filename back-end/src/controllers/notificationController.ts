import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { getPagination, paginationPayload } from '../utils/pagination.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const pagination = getPagination(req.query, 20);
  const filter = { user: req.user!._id };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: { $exists: false } }),
  ]);
  res.json({ ...paginationPayload(items, total, pagination.page, pagination.limit), unread });
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!._id, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
  res.status(204).send();
};
