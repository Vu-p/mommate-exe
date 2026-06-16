import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getFirebaseAuth } from '../config/firebaseAdmin.js';

const authResponse = (user: any) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  token: generateToken(String(user._id)),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'parent',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        token: generateToken(String(user._id)),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check for hardcoded Admin login
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mommate.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPassword) {
      return res.json({
        _id: 'admin-id',
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        role: 'admin',
        mustChangePassword: false,
        token: generateToken('admin-id'),
      });
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        token: generateToken(String(user._id)),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login or register with Firebase Google OAuth idToken
// @route   POST /api/auth/firebase-google
// @access  Public
export const firebaseGoogleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    if (!idToken) {
      return res.status(400).json({ message: 'Firebase idToken is required' });
    }

    const firebaseAuth = getFirebaseAuth();
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email || !decodedToken.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts must use the admin login page' });
      }

      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      if (!user.avatar && decodedToken.picture) {
        user.avatar = decodedToken.picture;
      }
      await user.save();

      return res.json(authResponse(user));
    }

    const displayName = decodedToken.name || email.split('@')[0] || 'MomMate User';
    const [firstNameCandidate, ...lastNameParts] = displayName.trim().split(/\s+/);
    const firstName = firstNameCandidate || 'MomMate';
    const lastName = lastNameParts.join(' ') || 'User';
    const randomPassword = await bcrypt.hash(`${decodedToken.uid}:${Date.now()}`, 10);

    user = await User.create({
      firstName,
      lastName,
      email,
      password: randomPassword,
      firebaseUid: decodedToken.uid,
      authProvider: 'google',
      avatar: decodedToken.picture,
      role: 'parent',
      mustChangePassword: false,
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// @desc    Change password required on first login
// @route   PATCH /api/auth/change-password-first-login
// @access  Private
export const changePasswordFirstLogin = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' });
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      token: generateToken(String(user._id)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start password reset flow
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    if (email) {
      await User.findOne({ email });
    }

    res.json({
      message: 'If the email exists, MomMate support will send password reset instructions.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
