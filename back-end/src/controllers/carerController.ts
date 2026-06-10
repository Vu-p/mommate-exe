import type { Request, Response } from 'express';
import Carer from '../models/Carer.js';
import Review from '../models/Review.js';
import User, { UserRole } from '../models/User.js';
import bcrypt from 'bcryptjs';
import type { AuthRequest } from '../middleware/auth.js';

const calculateAge = (birthDate?: Date | string) => {
  if (!birthDate) return undefined;

  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

const parseScheduleSlots = (value: unknown) => {
  const rawSlots = Array.isArray(value) ? value : String(value || '').split(',');

  return rawSlots
    .map((rawSlot) => String(rawSlot).trim())
    .filter(Boolean)
    .map((rawSlot) => {
      const [day, slot] = rawSlot.split('|');
      return { day, slot };
    })
    .filter((item) => item.day && item.slot);
};

const applyReviewStats = async (carers: any[]) => {
  const carerIds = carers.map((carer) => carer._id);

  if (carerIds.length === 0) {
    return carers;
  }

  const stats = await Review.aggregate([
    { $match: { carer: { $in: carerIds } } },
    { $group: { _id: '$carer', averageRating: { $avg: '$score' }, reviewCount: { $sum: 1 } } },
  ]);

  const statsByCarerId = new Map(
    stats.map((item) => [
      String(item._id),
      {
        rating: Math.round(item.averageRating * 10) / 10,
        reviewCount: item.reviewCount,
      },
    ])
  );

  return carers.map((carer) => {
    const reviewStats = statsByCarerId.get(String(carer._id));

    return {
      ...carer,
      rating: reviewStats?.rating ?? 0,
      reviewCount: reviewStats?.reviewCount ?? 0,
    };
  });
};

// @desc    Get all carers
// @route   GET /api/carers
// @access  Public
export const getCarers = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, any> = { isDeleted: false };

    if (req.query.admin !== 'true') {
      filter.isVerified = true;
    }

    if (req.query.serviceId) {
      filter.services = req.query.serviceId;
    }

    if (req.query.area) {
      filter.location = { $regex: String(req.query.area), $options: 'i' };
    }

    if (req.query.maxPrice) {
      filter.hourlyRate = { $lte: Number(req.query.maxPrice) };
    }

    if (req.query.minRating) {
      filter.rating = { $gte: Number(req.query.minRating) };
    }

    const scheduleSlots = parseScheduleSlots(req.query.scheduleSlots);
    if (scheduleSlots.length > 0) {
      filter.$and = scheduleSlots.map(({ day, slot }) => ({
        availability: {
          $elemMatch: {
            day,
            slots: slot,
          },
        },
      }));
    }

    const carers = await Carer.find(filter)
      .populate('user', 'firstName lastName avatar')
      .populate('services', 'title category')
      .lean();

    res.json(await applyReviewStats(carers));
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
      .populate('services')
      .lean();
    
    if (carer) {
      const [carerWithReviewStats] = await applyReviewStats([carer]);
      res.json(carerWithReviewStats);
    } else {
      res.status(404).json({ message: 'Carer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in caregiver profile draft/submission
// @route   GET /api/carers/me
// @access  Private
export const getMyCarerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false })
      .populate('user', '-password')
      .populate('services');

    if (!carer) {
      const user = await User.findById(req.user!._id).select('-password');
      return res.json({ user, carer: null, currentStep: 'overview' });
    }

    res.json({ user: carer.user, carer, currentStep: carer.applicationStatus === 'draft' ? 'job' : 'submitted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Save caregiver application step 1: overview, identity and avatar
// @route   POST /api/carers/apply/overview
// @access  Private
export const saveCarerOverview = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      location,
      birthDate,
      gender,
      identityNumber,
      identityName,
      identityIssuedAt,
      identityImages,
      avatar,
      phoneNumber,
    } = req.body;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.address = location ?? user.address;
    user.birthDate = birthDate ? new Date(birthDate) : user.birthDate;
    user.gender = gender ?? user.gender;
    user.identityNumber = identityNumber ?? user.identityNumber;
    user.identityName = identityName ?? user.identityName;
    user.identityIssuedAt = identityIssuedAt ? new Date(identityIssuedAt) : user.identityIssuedAt;
    user.identityImages = identityImages ?? user.identityImages;
    user.avatar = avatar ?? user.avatar;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.role = UserRole.CARER;

    await user.save();

    const safeUser = await User.findById(user._id).select('-password');
    res.json({ user: safeUser, nextStep: 'job' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid caregiver overview data' });
  }
};

// @desc    Save caregiver application step 2: job profile, certificates, pricing and availability
// @route   POST /api/carers/apply/job
// @access  Private
export const saveCarerJobProfile = async (req: AuthRequest, res: Response) => {
  try {
    const {
      bio,
      experienceYears,
      certifications,
      certificationDetails,
      services,
      serviceIds,
      pricingType,
      hourlyRate,
      fixedRate,
      platformFeePercent,
      availability,
      submit,
    } = req.body;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resolvedServices = serviceIds || services || [];
    const resolvedCertifications =
      certifications ||
      (Array.isArray(certificationDetails) ? certificationDetails.map((cert) => cert.name).filter(Boolean) : []);
    const age = calculateAge(user.birthDate) || 18;

    const profileData = {
      user: user._id,
      bio,
      experienceYears,
      hourlyRate,
      pricingType: pricingType || 'hourly',
      fixedRate,
      platformFeePercent: platformFeePercent ?? 10,
      location: user.address || req.body.location,
      age,
      certifications: resolvedCertifications,
      certificationDetails,
      services: resolvedServices,
      availability,
      applicationStatus: submit ? 'submitted' : 'draft',
      isVerified: false,
    };

    const carer = await Carer.findOneAndUpdate(
      { user: user._id, isDeleted: false },
      profileData,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate('user', '-password')
      .populate('services');

    res.json({ carer, nextStep: submit ? 'admin_review' : 'job' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid caregiver job profile data' });
  }
};

// @desc    Create a carer
// @route   POST /api/carers
// @access  Private/Admin
export const createCarer = async (req: Request, res: Response) => {
  const { 
    email, password, firstName, lastName, avatar, 
    bio, experienceYears, hourlyRate, pricingType, fixedRate, platformFeePercent, location, age,
    certifications, certificationDetails, services, availability, isVerified, applicationStatus
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
      pricingType,
      fixedRate,
      platformFeePercent,
      location,
      age,
      certifications,
      certificationDetails,
      services,
      availability,
      isVerified: isVerified || false,
      applicationStatus: applicationStatus || (isVerified ? 'verified' : 'submitted')
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
    bio, experienceYears, hourlyRate, pricingType, fixedRate, platformFeePercent, location, age,
    certifications, certificationDetails, services, availability, isVerified, applicationStatus
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
      carer.pricingType = pricingType || carer.pricingType;
      carer.fixedRate = fixedRate !== undefined ? fixedRate : carer.fixedRate;
      carer.platformFeePercent = platformFeePercent !== undefined ? platformFeePercent : carer.platformFeePercent;
      carer.location = location || carer.location;
      carer.age = age !== undefined ? age : carer.age;
      carer.certifications = certifications || carer.certifications;
      carer.certificationDetails = certificationDetails || carer.certificationDetails;
      carer.services = services || carer.services;
      carer.availability = availability || carer.availability;
      carer.isVerified = isVerified !== undefined ? isVerified : carer.isVerified;
      carer.applicationStatus = applicationStatus || (carer.isVerified ? 'verified' : carer.applicationStatus);

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
