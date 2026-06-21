import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import type { AuthRequest } from '../middleware/auth.js';
import { FirebaseConfigurationError, getFirebaseAuth } from '../config/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import { assertSessionConfig, AuthConfigurationError } from '../config/authConfig.js';

const handleAuthFailure = (res: Response, operation: string, error: unknown) => {
  const details = error instanceof Error
    ? { name: error.name, message: error.message, code: (error as any).code }
    : { name: 'UnknownError', message: String(error) };

  console.error(`[auth] ${operation} failed`, details);

  if (error instanceof AuthConfigurationError || error instanceof FirebaseConfigurationError) {
    return res.status(503).json({
      code: (error as any).code,
      message: 'Dịch vụ đăng nhập chưa được cấu hình đầy đủ. Vui lòng thử lại sau.',
    });
  }

  return res.status(500).json({ code: 'AUTH_FAILED', message: 'Không thể đăng nhập. Vui lòng thử lại.' });
};

const authResponse = (user: any) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  token: generateAccessToken(String(user._id), user.role),
});

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

const issueSession = async (res: Response, user: any, status = 200) => {
  assertSessionConfig();
  const fullUser = await User.findById(user._id).select('+refreshTokenVersion');
  if (!fullUser) return res.status(404).json({ message: 'User not found' });
  fullUser.lastLoginAt = new Date();
  await fullUser.save();
  res.cookie('mommate_refresh', generateRefreshToken(String(fullUser._id), fullUser.refreshTokenVersion || 0), refreshCookieOptions);
  return res.status(status).json(authResponse(fullUser));
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

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
      role: 'parent',
    });

    if (user) {
      return issueSession(res, user, 201);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    return handleAuthFailure(res, 'register', error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      if ((user as any).accountStatus === 'suspended') {
        return res.status(403).json({ message: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ MomMate.' });
      }
      return issueSession(res, user);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return handleAuthFailure(res, 'login', error);
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

      return issueSession(res, user);
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

    return issueSession(res, user, 201);
  } catch (error: any) {
    if (error instanceof AuthConfigurationError || error instanceof FirebaseConfigurationError) {
      return handleAuthFailure(res, 'firebase-google', error);
    }

    console.warn('[auth] firebase-google rejected', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return res.status(401).json({ code: 'GOOGLE_AUTH_FAILED', message: 'Google authentication failed' });
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

    return issueSession(res, user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  try {
    const token = (req as any).cookies?.mommate_refresh;
    if (!token || !process.env.JWT_REFRESH_SECRET) return res.status(401).json({ message: 'Refresh token missing' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as { id: string; version: number; type: string };
    if (decoded.type !== 'refresh') return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await User.findById(decoded.id).select('+refreshTokenVersion');
    if (!user || user.accountStatus === 'suspended' || decoded.version !== (user.refreshTokenVersion || 0)) {
      return res.status(401).json({ message: 'Refresh session expired' });
    }
    return issueSession(res, user);
  } catch {
    return res.status(401).json({ message: 'Refresh session expired' });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.mommate_refresh;
  if (token && process.env.JWT_REFRESH_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as { id: string };
      await User.findByIdAndUpdate(decoded.id, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // Clearing an already invalid cookie is still a successful logout.
    }
  }
  res.clearCookie('mommate_refresh', refreshCookieOptions);
  res.status(204).send();
};

export const getSession = async (req: AuthRequest, res: Response) => res.json(authResponse(req.user));

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
