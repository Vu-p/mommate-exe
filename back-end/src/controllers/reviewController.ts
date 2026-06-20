import type { Request, Response } from 'express';
import Review from '../models/Review.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import { writeAudit } from '../utils/audit.js';
import type { AuthRequest } from '../middleware/auth.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';

// @desc    Get latest public reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 6;
    const filter: Record<string, any> = {};
    const pagination = getPagination(req.query, 20);

    if (req.query.carerId) {
      filter.carer = req.query.carerId;
    }
    if (req.query.admin !== 'true') filter.moderationStatus = 'published';
    if (req.query.status) filter.moderationStatus = req.query.status;
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const query = Review.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'parent', select: 'firstName lastName avatar' })
      .populate({
        path: 'carer',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName avatar' },
      })
      .populate('booking', 'scheduledAt status service');

    if (!pagination.enabled) return res.json(await query.limit(limit));
    const [items, total] = await Promise.all([
      query.skip(pagination.skip).limit(pagination.limit),
      Review.countDocuments(filter),
    ]);
    res.json(paginationPayload(items, total, pagination.page, pagination.limit));
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const moderateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { moderationStatus, moderationNote } = req.body;
    if (!['pending', 'published', 'hidden'].includes(moderationStatus)) {
      return res.status(400).json({ message: 'Invalid moderation status' });
    }
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        moderationStatus,
        moderationNote,
        moderatedBy: req.user!._id,
        moderatedAt: new Date(),
      },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await writeAudit(req, 'review.moderate', 'Review', review._id, { after: { moderationStatus: review.moderationStatus }, metadata: { moderationNote: review.moderationNote } });
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot moderate review' });
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
      title: title || 'Đánh giá dịch vụ',
      content: comment || title || 'Khách hàng chưa để lại nội dung đánh giá.',
      tags,
      images,
    });

    const stats = await Review.aggregate([
      { $match: { carer: review.carer, moderationStatus: 'published' } },
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
