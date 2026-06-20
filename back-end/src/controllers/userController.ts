import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';
import { writeAudit } from '../utils/audit.js';

// @desc    Get users for admin management
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    const { enabled, page, limit, skip } = getPagination(req.query, 20);

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (req.query.accountStatus) filter.accountStatus = req.query.accountStatus;

    const sortMap: Record<string, any> = {
      oldest: { createdAt: 1 },
      'name-asc': { firstName: 1, lastName: 1 },
      newest: { createdAt: -1 },
    };
    const query = User.find(filter).select('-password').sort(sortMap[String(req.query.sort)] || { createdAt: -1 });
    if (!enabled) return res.json(await query);
    const [items, total] = await Promise.all([query.skip(skip).limit(limit), User.countDocuments(filter)]);
    res.json(paginationPayload(items, total, page, limit));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get my profile
// @route   GET /api/users/me
// @access  Private
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user detail
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create user by admin
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber, avatar, address } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'Mommate123!', 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      avatar,
      address,
      mustChangePassword: role === 'carer',
    });

    const safeUser = await User.findById(user._id).select('-password');
    res.status(201).json(safeUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid user data' });
  }
};

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, role, phoneNumber, avatar, address, password, accountStatus, suspendedReason } = req.body;

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.role = role ?? user.role;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.avatar = avatar ?? user.avatar;
    user.address = address ?? user.address;
    user.accountStatus = accountStatus ?? user.accountStatus;
    user.suspendedReason = accountStatus === 'suspended' ? (suspendedReason || user.suspendedReason) : undefined;
    user.suspendedAt = accountStatus === 'suspended' ? new Date() : undefined;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = user.role === 'carer';
    }

    await user.save();
    await writeAudit(req, 'user.update', 'User', user._id, {
      after: { role: user.role, accountStatus: user.accountStatus },
      metadata: { suspendedReason: user.suspendedReason },
    });

    const safeUser = await User.findById(user._id).select('-password');
    res.json(safeUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid user data' });
  }
};

// @desc    Update my profile
// @route   PUT /api/users/me
// @access  Private
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      avatar,
      address,
      birthDate,
      gender,
      identityNumber,
      identityName,
      identityIssuedAt,
      identityImages,
      password,
    } = req.body;

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.avatar = avatar ?? user.avatar;
    user.address = address ?? user.address;
    user.birthDate = birthDate ? new Date(birthDate) : user.birthDate;
    user.gender = gender ?? user.gender;
    user.identityNumber = identityNumber ?? user.identityNumber;
    user.identityName = identityName ?? user.identityName;
    user.identityIssuedAt = identityIssuedAt ? new Date(identityIssuedAt) : user.identityIssuedAt;
    user.identityImages = identityImages ?? user.identityImages;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const safeUser = await User.findById(user._id).select('-password');
    res.json(safeUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid profile data' });
  }
};
