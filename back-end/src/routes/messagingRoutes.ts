import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getConversations, getMessages, getOrCreateBookingConversation, markConversationRead, sendMessage } from '../controllers/messagingController.js';

const router = Router();
router.use(protect);
router.get('/conversations', getConversations);
router.post('/bookings/:bookingId/conversation', getOrCreateBookingConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:id/read', markConversationRead);
export default router;
