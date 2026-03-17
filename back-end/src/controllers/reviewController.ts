import type { Request, Response } from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import type { AuthRequest } from '../middleware/auth.js';

// @desc    Get latest public reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 6;

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'parent', select: 'firstName lastName avatar' })
      .populate({
        path: 'carer',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName avatar' },
      });

    res.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req: AuthRequest, res: Response) => {
  const { bookingId, carerId, rating, title, comment, tags, images } = req.body;

  try {
    console.log('Creating review with data:', { bookingId, carerId, rating, title, comment });
    
    const review = await Review.create({
      booking: bookingId,
      parent: req.user!._id,
      carer: carerId,
      score: rating,
      title,
      content: comment,
      tags,
      images,
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
