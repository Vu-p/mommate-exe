import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';
import { emitToUser } from '../socket.js';

export const createNotification = async ({
  userId,
  type,
  title,
  body,
  data = {},
  email = true,
}: {
  userId: unknown;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: boolean;
}) => {
  const user = await User.findById(userId).select('email notificationPreferences');
  if (!user) return null;
  const shouldEmail = email && user.notificationPreferences?.email !== false;
  const notification = await Notification.create({
    user: user._id,
    type,
    title,
    body,
    data,
    emailStatus: shouldEmail ? 'pending' : 'not_requested',
  });
  emitToUser(String(user._id), 'notification:new', notification);
  if (shouldEmail) {
    sendEmail(user.email, title, body)
      .then(async () => { notification.emailStatus = 'sent'; await notification.save(); })
      .catch(async () => { notification.emailStatus = 'failed'; await notification.save(); });
  }
  return notification;
};
