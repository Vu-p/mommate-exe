import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Carer from '../models/Carer.js';
import Contract from '../models/Contract.js';
import Review from '../models/Review.js';
import User, { UserRole } from '../models/User.js';
import bcrypt from 'bcryptjs';
import type { AuthRequest } from '../middleware/auth.js';
import { ensureContractForCarer } from '../utils/contracts.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';
import { PUBLISHED_REVIEW_MATCH } from '../utils/reviewStats.js';

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
    { $match: { carer: { $in: carerIds }, ...PUBLISHED_REVIEW_MATCH } },
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

const carerPublicAggregation = () => ([
  { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $lookup: { from: 'services', localField: 'services', foreignField: '_id', as: 'services' } },
  {
    $lookup: {
      from: 'reviews',
      let: { carerId: '$_id' },
      pipeline: [
        { $match: { ...PUBLISHED_REVIEW_MATCH, $expr: { $eq: ['$carer', '$$carerId'] } } },
        { $group: { _id: null, rating: { $avg: '$score' }, reviewCount: { $sum: 1 } } },
      ],
      as: 'reviewStats',
    },
  },
  {
    $lookup: {
      from: 'bookings',
      let: { carerId: '$_id' },
      pipeline: [
        { $match: { status: 'completed', isDeleted: false, $expr: { $eq: ['$carer', '$$carerId'] } } },
        { $count: 'value' },
      ],
      as: 'bookingStats',
    },
  },
  {
    $addFields: {
      rating: {
        $cond: [
          { $gt: [{ $ifNull: [{ $first: '$reviewStats.reviewCount' }, 0] }, 0] },
          { $round: [{ $ifNull: [{ $first: '$reviewStats.rating' }, 0] }, 1] },
          null,
        ],
      },
      reviewCount: { $ifNull: [{ $first: '$reviewStats.reviewCount' }, 0] },
      completedBookingCount: { $ifNull: [{ $first: '$bookingStats.value' }, 0] },
      displayName: { $trim: { input: { $concat: [{ $ifNull: ['$user.firstName', ''] }, ' ', { $ifNull: ['$user.lastName', ''] }] } } },
    },
  },
  { $project: { reviewStats: 0, bookingStats: 0, 'user.password': 0, 'user.refreshTokenVersion': 0 } },
]) as any[];

// @desc    Get all carers
// @route   GET /api/carers
// @access  Public
export const getCarers = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, any> = { isDeleted: false };
    const pagination = getPagination(req.query, 6);

    if (req.query.admin !== 'true') {
      filter.isVerified = true;
      filter.$or = [{ verificationStatus: 'verified' }, { verificationStatus: { $exists: false } }];
    }

    if (req.query.serviceId && mongoose.isValidObjectId(req.query.serviceId)) {
      filter.services = new mongoose.Types.ObjectId(String(req.query.serviceId));
    }

    if (req.query.area) {
      filter.$and = [
        ...(filter.$and || []),
        { location: { $regex: String(req.query.area), $options: 'i' } }
      ];
    }
    if (req.query.district) {
      filter.$and = [
        ...(filter.$and || []),
        { location: { $regex: String(req.query.district), $options: 'i' } }
      ];
    }
    if (req.query.maxPrice) {
      filter.hourlyRate = { $lte: Number(req.query.maxPrice) };
    }

    const scheduleSlots = parseScheduleSlots(req.query.scheduleSlots);
    if (scheduleSlots.length > 0) {
      filter.$and = [
        ...(filter.$and || []),
        ...scheduleSlots.map(({ day, slot }) => ({
        availability: {
          $elemMatch: {
            day,
            slots: slot,
          },
        },
        })),
      ];
    }
    const afterLookupMatch: Record<string, any> = {};
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      afterLookupMatch.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { workplaceName: { $regex: search, $options: 'i' } },
        { 'services.title': { $regex: search, $options: 'i' } },
        { 'services.category': { $regex: search, $options: 'i' } },
      ];
    }
    if (req.query.minRating) afterLookupMatch.rating = { $gte: Number(req.query.minRating) };
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'rating-desc': { rating: -1, reviewCount: -1 },
      'price-asc': { hourlyRate: 1 },
      'price-desc': { hourlyRate: -1 },
      'experience-desc': { experienceYears: -1 },
      'name-asc': { displayName: 1 },
    };
    const sort = sortMap[String(req.query.sort)] || { rating: -1, reviewCount: -1, completedBookingCount: -1 };
    const basePipeline: any[] = [
      { $match: filter },
      ...carerPublicAggregation(),
      ...(Object.keys(afterLookupMatch).length ? [{ $match: afterLookupMatch }] : []),
      { $sort: sort },
    ];
    const result = await Carer.aggregate([
      ...basePipeline,
      {
        $facet: {
          items: pagination.enabled ? [{ $skip: pagination.skip }, { $limit: pagination.limit }] : [],
          total: [{ $count: 'value' }],
        },
      },
    ]);
    let carersWithReviewStats = result[0]?.items || [];
    const total = result[0]?.total?.[0]?.value || 0;

    if (req.query.admin === 'true') {
      const contracts = await Contract.find({
        carer: { $in: carersWithReviewStats.map((carer: any) => carer._id) },
        status: { $ne: 'voided' },
      })
        .sort({ createdAt: -1 })
        .select('carer status signedAt')
        .lean();

      const contractsByCarerId = new Map(contracts.map((contract) => [String(contract.carer), contract]));
      carersWithReviewStats = carersWithReviewStats.map((carer: any) => ({
          ...carer,
          contractStatus: contractsByCarerId.get(String(carer._id))?.status || 'pending',
          contractSignedAt: contractsByCarerId.get(String(carer._id))?.signedAt,
        }));
    }

    if (!pagination.enabled) {
      carersWithReviewStats = await Carer.aggregate(basePipeline);
      return res.json(carersWithReviewStats);
    }
    const minimumAreaCarers = Math.max(1, Number(process.env.MIN_AREA_CARERS) || 3);
    const areaRows = await Carer.aggregate([
      { $match: { isDeleted: false, isVerified: true, acceptingBookings: true } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $match: { count: { $gte: minimumAreaCarers } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    res.json({
      ...paginationPayload(carersWithReviewStats, total, pagination.page, pagination.limit),
      facets: {
        areas: areaRows.map((row) => ({ value: row._id, label: row._id, count: row.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single carer by ID
// @route   GET /api/carers/:id
// @access  Public
export const getCarerById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Carer not found' });
    }
    const [carer] = await Carer.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(req.params.id)), isDeleted: false } },
      ...carerPublicAggregation(),
    ]);
    
    if (carer) {
      res.json(carer);
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
      workplaceName,
      workplaceType,
      department,
      position,
      employeeIdOrLicenseNote,
      workplaceProofImages,
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
      workplaceName,
      workplaceType,
      department,
      position,
      employeeIdOrLicenseNote,
      workplaceProofImages,
      services: resolvedServices,
      availability,
      applicationStatus: submit ? 'submitted' : 'draft',
      isVerified: false,
      verificationStatus: 'pending',
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

// @desc    Update logged-in carer's operational profile
// @route   PUT /api/carers/me
// @access  Private/Carer
export const updateMyCarerProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== UserRole.CARER) {
      return res.status(403).json({ message: 'Only carers can update carer profile' });
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      avatar,
      location,
      birthDate,
      gender,
      bio,
      experienceYears,
      services,
      serviceIds,
      pricingType,
      hourlyRate,
      fixedRate,
      workplaceName,
      workplaceType,
      department,
      position,
      employeeIdOrLicenseNote,
      certificationDetails,
      certifications,
      availability,
    } = req.body;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.avatar = avatar ?? user.avatar;
    user.address = location ?? user.address;
    user.birthDate = birthDate ? new Date(birthDate) : user.birthDate;
    user.gender = gender ?? user.gender;
    await user.save();

    const resolvedServices = serviceIds || services || [];
    const resolvedCertifications =
      certifications ||
      (Array.isArray(certificationDetails) ? certificationDetails.map((cert) => cert.name).filter(Boolean) : []);
    const age = calculateAge(user.birthDate) || req.body.age || 18;

    const carer = await Carer.findOne({ user: user._id, isDeleted: false });

    if (!carer) {
      return res.status(404).json({ message: 'Carer profile not found. Please contact admin.' });
    }

    carer.bio = bio ?? carer.bio;
    carer.experienceYears = experienceYears !== undefined ? Number(experienceYears) : carer.experienceYears;
    carer.hourlyRate = hourlyRate !== undefined ? Number(hourlyRate) : carer.hourlyRate;
    carer.pricingType = pricingType || carer.pricingType;
    carer.fixedRate = fixedRate !== undefined ? Number(fixedRate) : carer.fixedRate;
    carer.location = location ?? carer.location;
    carer.age = age;
    carer.certifications = resolvedCertifications ?? carer.certifications;
    carer.certificationDetails = certificationDetails ?? carer.certificationDetails;
    carer.workplaceName = workplaceName ?? carer.workplaceName;
    carer.workplaceType = workplaceType ?? carer.workplaceType;
    carer.department = department ?? carer.department;
    carer.position = position ?? carer.position;
    carer.employeeIdOrLicenseNote = employeeIdOrLicenseNote ?? carer.employeeIdOrLicenseNote;
    carer.services = resolvedServices;
    carer.availability = availability ?? carer.availability;

    const updatedCarer = await carer.save();
    const populatedCarer = await Carer.findById(updatedCarer._id)
      .populate('user', '-password')
      .populate('services');

    res.json({ user: await User.findById(user._id).select('-password'), carer: populatedCarer });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid carer profile data' });
  }
};

// @desc    Create a carer
// @route   POST /api/carers
// @access  Private/Admin
export const createCarer = async (req: Request, res: Response) => {
  const { 
    email, password, firstName, lastName, avatar, 
    bio, experienceYears, hourlyRate, pricingType, fixedRate, platformFeePercent, location, age,
    certifications, certificationDetails, workplaceName, workplaceType, department, position,
    employeeIdOrLicenseNote, workplaceProofImages, verificationStatus,
    services, availability, isVerified, applicationStatus
  } = req.body;

  try {
    // 1. Create or Find User
    let userId = req.body.user;

    if (!userId && email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        userExists.role = UserRole.CARER;
        userExists.mustChangePassword = true;
        if (password) {
          const salt = await bcrypt.genSalt(10);
          userExists.password = await bcrypt.hash(password, salt);
        }
        await userExists.save();
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
          role: 'carer',
          mustChangePassword: true
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
      workplaceName,
      workplaceType,
      department,
      position,
      employeeIdOrLicenseNote,
      workplaceProofImages,
      services,
      availability,
      isVerified: isVerified || false,
      verificationStatus: verificationStatus || (isVerified ? 'verified' : 'pending'),
      applicationStatus: applicationStatus || (isVerified ? 'verified' : 'submitted')
    });

    const populatedCarer = await Carer.findById(carer._id).populate('user', 'firstName lastName avatar email');
    await ensureContractForCarer(populatedCarer, (req as AuthRequest).user?._id);
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
    certifications, certificationDetails, workplaceName, workplaceType, department, position,
    employeeIdOrLicenseNote, workplaceProofImages, verificationStatus,
    services, availability, isVerified, applicationStatus
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
      carer.location = location !== undefined ? location : carer.location;
      carer.age = age !== undefined ? age : carer.age;
      carer.certifications = certifications || carer.certifications;
      carer.certificationDetails = certificationDetails || carer.certificationDetails;
      carer.workplaceName = workplaceName !== undefined ? workplaceName : carer.workplaceName;
      carer.workplaceType = workplaceType !== undefined ? workplaceType : carer.workplaceType;
      carer.department = department !== undefined ? department : carer.department;
      carer.position = position !== undefined ? position : carer.position;
      carer.employeeIdOrLicenseNote = employeeIdOrLicenseNote !== undefined ? employeeIdOrLicenseNote : carer.employeeIdOrLicenseNote;
      carer.workplaceProofImages = workplaceProofImages !== undefined ? workplaceProofImages : carer.workplaceProofImages;
      carer.services = services || carer.services;
      carer.availability = availability || carer.availability;
      carer.isVerified = isVerified !== undefined ? isVerified : carer.isVerified;
      carer.verificationStatus = verificationStatus || (carer.isVerified ? 'verified' : carer.verificationStatus);
      carer.isVerified = carer.verificationStatus === 'verified' ? true : carer.isVerified;
      carer.applicationStatus = applicationStatus || (carer.isVerified ? 'verified' : carer.applicationStatus);

      const updatedCarer = await carer.save();
      if (user && location !== undefined) {
        user.address = location;
        await user.save();
      }
      const populatedCarer = await Carer.findById(updatedCarer._id).populate('user', 'firstName lastName avatar email');
      await ensureContractForCarer(populatedCarer, (req as AuthRequest).user?._id);
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
