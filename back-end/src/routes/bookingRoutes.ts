import express from 'express';
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getAllBookings,
  submitPaymentProof,
  getSchedule,
  confirmPayment,
  getBookingById,
  acceptBooking,
  rejectBooking,
  createPaymentLink,
  handlePayOSWebhook,
  checkInBooking,
  checkOutBooking,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/payos/webhook', handlePayOSWebhook);

router.use(protect); // Booking management routes are protected

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/schedule', getSchedule);
router.get('/', authorize('admin'), getAllBookings);
router.get('/:id', getBookingById);
router.patch('/:id/accept', acceptBooking);
router.patch('/:id/reject', rejectBooking);
router.post('/:id/payment-link', createPaymentLink);
router.patch('/:id/check-in', checkInBooking);
router.patch('/:id/check-out', checkOutBooking);
router.patch('/:id/payment-proof', submitPaymentProof);
router.patch('/:id/payment-confirm', authorize('admin'), confirmPayment);
router.patch('/:id/status', updateBookingStatus);

export default router;
