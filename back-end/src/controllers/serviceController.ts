import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Carer from '../models/Carer.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';
import { PUBLISHED_REVIEW_MATCH } from '../utils/reviewStats.js';

const publicCarerMatch = {
  isDeleted: false,
  isVerified: true,
  acceptingBookings: true,
  $or: [{ verificationStatus: 'verified' }, { verificationStatus: { $exists: false } }],
};

const serviceStatsStages = [
  {
    $lookup: {
      from: 'carers',
      let: { serviceId: '$_id' },
      pipeline: [
        { $match: { ...publicCarerMatch, $expr: { $in: ['$$serviceId', '$services'] } } },
        { $project: { location: 1 } },
      ],
      as: 'activeCarers',
    },
  },
  {
    $lookup: {
      from: 'bookings',
      let: { serviceId: '$_id' },
      pipeline: [
        { $match: { isDeleted: false, $expr: { $eq: ['$service', '$$serviceId'] } } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'booking',
            as: 'reviews',
            pipeline: [{ $match: PUBLISHED_REVIEW_MATCH }, { $project: { score: 1 } }],
          },
        },
        { $unwind: '$reviews' },
        { $replaceWith: '$reviews' },
      ],
      as: 'publishedReviews',
    },
  },
  {
    $addFields: {
      activeCarerCount: { $size: '$activeCarers' },
      reviewCount: { $size: '$publishedReviews' },
      rating: {
        $cond: [
          { $gt: [{ $size: '$publishedReviews' }, 0] },
          { $round: [{ $avg: '$publishedReviews.score' }, 1] },
          null,
        ],
      },
    },
  },
] as any[];

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req: Request, res: Response) => {
  try {
    const isAdmin = req.query.admin === 'true';
    const filter: Record<string, any> = isAdmin ? {} : { isActive: true };
    const { enabled, page, limit, skip } = getPagination(req.query, 12);

    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.carerId && mongoose.isValidObjectId(req.query.carerId)) {
      const carer = await Carer.findOne({
        _id: req.query.carerId,
        ...(isAdmin ? {} : publicCarerMatch),
      }).select('services');
      filter._id = { $in: carer?.services || [] };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'name-asc': { title: 1 },
      'rating-desc': { rating: -1, reviewCount: -1 },
    };
    const sort = sortMap[String(req.query.sort)] || { activeCarerCount: -1, createdAt: -1 };
    const area = String(req.query.area || '').trim();
    const areaMatch = area
      ? { activeCarers: { $elemMatch: { location: { $regex: escapeRegex(area), $options: 'i' } } } }
      : {};
    const pipeline: any[] = [
      { $match: filter },
      ...serviceStatsStages,
      { $match: areaMatch },
      { $sort: sort },
    ];

    if (!enabled) {
      const items = await Service.aggregate([...pipeline, { $project: { activeCarers: 0, publishedReviews: 0 } }]);
      return res.json(items);
    }

    const [result, areaRows] = await Promise.all([
      Service.aggregate([
        ...pipeline,
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limit }, { $project: { activeCarers: 0, publishedReviews: 0 } }],
            total: [{ $count: 'value' }],
          },
        },
      ]),
      Carer.aggregate([
        { $match: publicCarerMatch },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $match: { count: { $gte: Math.max(1, Number(process.env.MIN_AREA_CARERS) || 3) } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);
    const items = result[0]?.items || [];
    const total = result[0]?.total?.[0]?.value || 0;
    res.json({
      ...paginationPayload(items, total, page, limit),
      facets: {
        areas: areaRows.map((row) => ({ value: row._id, label: row._id, count: row.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const [service] = await Service.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(req.params.id)), isActive: true } },
      ...serviceStatsStages,
      { $project: { activeCarers: 0, publishedReviews: 0 } },
    ]);

    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req: Request, res: Response) => {
  const { title, description, basePrice, price, category, duration, image, tags, icon, steps, careItems, faq, sessionOptions } = req.body;

  try {
    const service = await Service.create({
      title,
      description,
      basePrice,
      price,
      category,
      duration,
      image,
      tags,
      icon,
      steps: steps || [],
      careItems: careItems || [],
      faq: faq || [],
      sessionOptions: sessionOptions || [],
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: 'Invalid service data' });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = async (req: Request, res: Response) => {
  const { title, description, basePrice, price, category, duration, image, tags, icon, steps, careItems, faq, sessionOptions } = req.body;

  try {
    const service = await Service.findById(req.params.id);

    if (service) {
      service.title = title || service.title;
      service.description = description || service.description;
      service.basePrice = basePrice !== undefined ? basePrice : service.basePrice;
      service.price = price !== undefined ? price : service.price;
      service.category = category || service.category;
      service.duration = duration || service.duration;
      service.image = image || service.image;
      service.tags = tags || service.tags;
      service.icon = icon || service.icon;
      service.steps = steps !== undefined ? steps : service.steps;
      service.careItems = careItems !== undefined ? careItems : service.careItems;
      service.faq = faq !== undefined ? faq : service.faq;
      service.sessionOptions = sessionOptions !== undefined ? sessionOptions : service.sessionOptions;

      const updatedService = await service.save();
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid service data' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);

    if (service) {
      service.isActive = !service.isActive; // Toggle status instead of hard set
      const updatedService = await service.save();
      res.json({ 
        message: updatedService.isActive ? 'Service activated' : 'Service deactivated',
        service: updatedService
      });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
