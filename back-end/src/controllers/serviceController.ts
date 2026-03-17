import type { Request, Response } from 'express';
import Service from '../models/Service.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req: Request, res: Response) => {
  try {
    const isAdmin = req.query.admin === 'true';
    const filter = isAdmin ? {} : { isActive: true };
    const services = await Service.find(filter);
    res.json(services);
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
  const { title, description, basePrice, price, category, duration, image, tags, icon } = req.body;

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
      icon
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
  const { title, description, basePrice, price, category, duration, image, tags, icon } = req.body;

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
