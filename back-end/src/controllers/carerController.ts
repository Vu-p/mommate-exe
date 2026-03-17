import type { Request, Response } from 'express';
import Carer from '../models/Carer.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get all carers
// @route   GET /api/carers
// @access  Public
export const getCarers = async (req: Request, res: Response) => {
  try {
    const carers = await Carer.find({ isDeleted: false }).populate('user', 'firstName lastName avatar');
    res.json(carers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single carer by ID
// @route   GET /api/carers/:id
// @access  Public
export const getCarerById = async (req: Request, res: Response) => {
  try {
    const carer = await Carer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('user', 'firstName lastName avatar')
      .populate('services');
    
    if (carer) {
      res.json(carer);
    } else {
      res.status(404).json({ message: 'Carer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a carer
// @route   POST /api/carers
// @access  Private/Admin
export const createCarer = async (req: Request, res: Response) => {
  const { 
    email, password, firstName, lastName, avatar, 
    bio, experienceYears, hourlyRate, location, age, certifications, services, availability, isVerified 
  } = req.body;

  try {
    // 1. Create or Find User
    let userId = req.body.user;

    if (!userId && email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        userId = userExists._id;
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'Mommate123!', salt);

        const newUser = await User.create({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          avatar,
          role: 'carer'
        });
        userId = newUser._id;
      }
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID or email is required' });
    }

    // 2. Create Carer
    const carer = await Carer.create({
      user: userId,
      bio,
      experienceYears,
      hourlyRate,
      location,
      age,
      certifications,
      services,
      availability,
      isVerified: isVerified || false
    });

    const populatedCarer = await Carer.findById(carer._id).populate('user', 'firstName lastName avatar email');
    res.status(201).json(populatedCarer);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid carer data' });
  }
};

// @desc    Update a carer
// @route   PUT /api/carers/:id
// @access  Private/Admin
export const updateCarer = async (req: Request, res: Response) => {
  const { 
    firstName, lastName, avatar,
    bio, experienceYears, hourlyRate, location, age, certifications, services, availability, isVerified 
  } = req.body;

  try {
    const carer = await Carer.findById(req.params.id).populate('user');

    if (carer) {
      // Update User if needed
      const user = await User.findById(carer.user);
      if (user) {
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.avatar = avatar || user.avatar;
        await user.save();
      }

      carer.bio = bio || carer.bio;
      carer.experienceYears = experienceYears !== undefined ? experienceYears : carer.experienceYears;
      carer.hourlyRate = hourlyRate !== undefined ? hourlyRate : carer.hourlyRate;
      carer.location = location || carer.location;
      carer.age = age !== undefined ? age : carer.age;
      carer.certifications = certifications || carer.certifications;
      carer.services = services || carer.services;
      carer.availability = availability || carer.availability;
      carer.isVerified = isVerified !== undefined ? isVerified : carer.isVerified;

      const updatedCarer = await carer.save();
      const populatedCarer = await Carer.findById(updatedCarer._id).populate('user', 'firstName lastName avatar email');
      res.json(populatedCarer);
    } else {
      res.status(404).json({ message: 'Carer not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid carer data' });
  }
};

// @desc    Delete a carer
// @route   DELETE /api/carers/:id
// @access  Private/Admin
export const deleteCarer = async (req: Request, res: Response) => {
  try {
    const carer = await Carer.findById(req.params.id);

    if (carer) {
      carer.isDeleted = true;
      await carer.save();
      res.json({ message: 'Carer removed (soft delete)' });
    } else {
      res.status(404).json({ message: 'Carer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
