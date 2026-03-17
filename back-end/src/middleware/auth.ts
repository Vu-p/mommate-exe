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
      const secret: string = process.env.JWT_SECRET || 'secret';
      const decoded = jwt.verify(token, secret) as any;

      if (decoded.id === 'admin-id') {
        req.user = {
          _id: 'admin-id',
          firstName: 'System',
          lastName: 'Admin',
          email: process.env.ADMIN_EMAIL || 'admin@mommate.com',
          role: 'admin',
        } as any;
      } else {
        req.user = await User.findById(decoded.id).select('-password') as IUser;
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, please login again' });
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
