import type { Request, Response } from 'express';
import Service from '../models/Service.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';

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

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'name-asc': { title: 1 },
    };
    const sort = sortMap[String(req.query.sort)] || { createdAt: -1 };
    const query = Service.find(filter).sort(sort);

    if (!enabled) return res.json(await query);

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);
    res.json(paginationPayload(items, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);

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
  const { title, description, basePrice, price, category, duration, image, tags, icon, steps } = req.body;

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
      steps: steps || []
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
  const { title, description, basePrice, price, category, duration, image, tags, icon, steps } = req.body;

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
