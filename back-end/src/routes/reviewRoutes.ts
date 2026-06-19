import express from 'express';
import { createReview, getReviews, moderateReview } from '../controllers/reviewController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, createReview);
router.patch('/:id/moderation', protect, authorize('admin'), moderateReview);

export default router;
