import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User, { UserRole } from '../models/User.js';

dotenv.config();

const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => undefined;
  console.error = () => undefined;
  await connectDB();
  console.log = originalLog;
  console.error = originalError;
  const passwordHash = await bcrypt.hash(password, 12);
  const existingAdmin = await User.findOne({ email }).select('+refreshTokenVersion');

  if (existingAdmin) {
    existingAdmin.password = passwordHash;
    existingAdmin.role = UserRole.ADMIN;
    existingAdmin.accountStatus = 'active';
    existingAdmin.emailVerified = true;
    existingAdmin.mustChangePassword = false;
    existingAdmin.authProvider = 'local';
    existingAdmin.refreshTokenVersion = (existingAdmin.refreshTokenVersion || 0) + 1;
    existingAdmin.suspendedAt = undefined;
    existingAdmin.suspendedReason = undefined;
    await existingAdmin.save();
    process.stdout.write('ADMIN_PROVISION=pass\n');
    return;
  }

  await User.create({
    email,
    password: passwordHash,
    firstName: 'System',
    lastName: 'Admin',
    role: UserRole.ADMIN,
    accountStatus: 'active',
    emailVerified: true,
    mustChangePassword: false,
    authProvider: 'local',
    refreshTokenVersion: 0,
  });
  process.stdout.write('ADMIN_PROVISION=pass\n');
};

run()
  .catch(() => {
    process.stdout.write('ADMIN_PROVISION=fail\n');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
