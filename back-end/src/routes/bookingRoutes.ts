import express from 'express';
import { createBooking, getMyBookings, updateBookingStatus, getAllBookings } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All booking routes are protected

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/', authorize('admin'), getAllBookings);
router.patch('/:id/status', updateBookingStatus); // Both user (for cancel) and admin (for accept/paid) can use this for now

export default router;
