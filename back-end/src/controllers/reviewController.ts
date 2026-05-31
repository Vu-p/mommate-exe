import type { Request, Response } from 'express';
import Review from '../models/Review.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
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
    const booking = await Booking.findOne({
      _id: bookingId,
      parent: req.user!._id,
      carer: carerId,
      status: BookingStatus.COMPLETED,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(400).json({ message: 'Only completed bookings can be reviewed' });
    }

    const existingReview = await Review.findOne({ booking: bookingId, parent: req.user!._id });

    if (existingReview) {
      return res.status(400).json({ message: 'This booking has already been reviewed' });
    }
    
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

    const stats = await Review.aggregate([
      { $match: { carer: review.carer } },
      { $group: { _id: '$carer', averageRating: { $avg: '$score' }, reviewCount: { $sum: 1 } } },
    ]);

    if (stats[0]) {
      await Carer.findByIdAndUpdate(review.carer, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      });
    }

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
