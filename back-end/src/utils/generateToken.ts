import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

const requiredSecret = (name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET') => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const generateAccessToken = (id: string, role?: string) => {
  return jwt.sign({ id, role, type: 'access' }, requiredSecret('JWT_SECRET'), {
    expiresIn: (process.env.JWT_ACCESS_TTL || '15m') as SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (id: string, version: number) =>
  jwt.sign({ id, version, type: 'refresh' }, requiredSecret('JWT_REFRESH_SECRET'), {
    expiresIn: (process.env.JWT_REFRESH_TTL || '30d') as SignOptions['expiresIn'],
  });

export default generateAccessToken;
