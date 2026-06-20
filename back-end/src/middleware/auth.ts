import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import type { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
      }
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is required');
      const decoded = jwt.verify(token, secret) as any;
      if (decoded.type && decoded.type !== 'access') throw new Error('Invalid token type');
      req.user = await User.findById(decoded.id).select('-password') as IUser;

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, please login again' });
      }

      if ((req.user as any).accountStatus === 'suspended') {
        return res.status(403).json({ message: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ MomMate.' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user?.role} is not authorized to access this route` });
    }
    next();
  };
};
