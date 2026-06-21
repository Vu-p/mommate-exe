import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import User, { UserRole } from '../models/User.js';
import bcrypt from 'bcryptjs';
import Service from '../models/Service.js';
import Refund from '../models/Refund.js';
import Incident from '../models/Incident.js';
import Conversation from '../models/Conversation.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const legacyStatusMap: Record<string, BookingStatus> = {
    paid: BookingStatus.PAID_CONFIRMED,
    accepted: BookingStatus.ACCEPTED_PENDING_PAYMENT,
    awaiting_payment: BookingStatus.ACCEPTED_PENDING_PAYMENT,
    active: BookingStatus.IN_PROGRESS,
    done: BookingStatus.COMPLETED,
    canceled: BookingStatus.CANCELLED,
  };
  for (const [legacy, current] of Object.entries(legacyStatusMap)) {
    await Booking.collection.updateMany({ status: legacy }, { $set: { status: current } });
    await Booking.collection.updateMany({ 'statusHistory.status': legacy }, { $set: { 'statusHistory.$[entry].status': current } }, { arrayFilters: [{ 'entry.status': legacy }] });
  }

  await Promise.all([
    User.updateMany({ emailVerified: { $exists: false } }, { $set: { emailVerified: false } }),
    User.updateMany({ refreshTokenVersion: { $exists: false } }, { $set: { refreshTokenVersion: 0 } }),
    User.updateMany({ notificationPreferences: { $exists: false } }, { $set: { notificationPreferences: { inApp: true, email: true } } }),
    Carer.updateMany({ timezone: { $exists: false } }, { $set: { timezone: 'Asia/Ho_Chi_Minh' } }),
    Carer.updateMany({ acceptingBookings: { $exists: false } }, { $set: { acceptingBookings: true } }),
    Carer.updateMany({ serviceRadiusKm: { $exists: false } }, { $set: { serviceRadiusKm: 15 } }),
    Service.updateMany({ careItems: { $exists: false } }, { $set: { careItems: [] } }),
    Service.updateMany({ faq: { $exists: false } }, { $set: { faq: [] } }),
    Service.updateMany({ sessionOptions: { $exists: false } }, { $set: { sessionOptions: [] } }),
    Booking.updateMany({ serviceMode: { $exists: false } }, { $set: { serviceMode: 'at_home' } }),
    Booking.updateMany({ cancellationStatus: { $exists: false } }, { $set: { cancellationStatus: 'none' } }),
    Booking.updateMany({ refundStatus: { $exists: false } }, { $set: { refundStatus: 'none' } }),
    Refund.updateMany({ provider: { $exists: false } }, { $set: { provider: 'manual' } }),
    Refund.collection.updateMany(
      { statusHistory: { $exists: false } },
      [{ $set: { statusHistory: [{ status: '$status', changedAt: { $ifNull: ['$updatedAt', '$createdAt'] } }] } }],
    ),
    Incident.collection.updateMany(
      { timeline: { $exists: false } },
      [{ $set: { timeline: [{ status: '$status', note: 'Migrated incident state', createdAt: { $ifNull: ['$updatedAt', '$createdAt'] } }], internalNotes: [] } }],
    ),
  ]);

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email });
    if (!existingAdmin) {
      await User.create({
        email,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        emailVerified: true,
        mustChangePassword: false,
      });
      console.log(`Created database-backed admin account ${email}.`);
    } else if (existingAdmin.role !== UserRole.ADMIN) {
      existingAdmin.role = UserRole.ADMIN;
      await existingAdmin.save();
      console.log(`Promoted existing account ${email} to admin.`);
    }
  }

  const bookings = await Booking.find({
    $or: [
      { scheduledEndAt: { $exists: false } },
      { priceSnapshot: { $exists: false } },
      { statusHistory: { $size: 0 } },
    ],
  });

  for (const booking of bookings) {
    booking.scheduledEndAt ||= new Date(booking.scheduledAt.getTime() + Math.max(1, booking.hours || 1) * 3_600_000);
    booking.priceSnapshot ||= {
      unitPrice: booking.totalPrice / Math.max(1, booking.hours || 1) / Math.max(1, booking.numSessions || 1),
      hours: Math.max(1, booking.hours || 1),
      sessions: Math.max(1, booking.numSessions || 1),
      platformFeePercent: booking.totalPrice > 0 ? Math.round(booking.platformFeeAmount / booking.totalPrice * 100) : 10,
    };
    if (!booking.statusHistory?.length) {
      booking.statusHistory = [{ status: booking.status || BookingStatus.PENDING_CARER, changedAt: (booking as any).createdAt || new Date() }];
    }
    await booking.save();
  }

  const [userIds, carerIds, serviceIds] = await Promise.all([
    User.distinct('_id'),
    Carer.distinct('_id'),
    Service.distinct('_id'),
  ]);
  const incidents = await Incident.find({ booking: { $exists: true } }).select('_id booking');
  for (const incident of incidents) {
    await Conversation.updateOne(
      { booking: incident.booking, incident: { $exists: false } },
      { $set: { incident: incident._id } },
    );
  }
  const validUsers = new Set(userIds.map(String));
  const validCarers = new Set(carerIds.map(String));
  const validServices = new Set(serviceIds.map(String));
  const activeBookings = await Booking.find({ isDeleted: false }).select('parent carer service');
  let quarantined = 0;
  for (const booking of activeBookings) {
    const missing = [
      !validUsers.has(String(booking.parent)) ? 'parent' : '',
      !validCarers.has(String(booking.carer)) ? 'carer' : '',
      !validServices.has(String(booking.service)) ? 'service' : '',
    ].filter(Boolean);
    if (!missing.length) continue;
    booking.isDeleted = true;
    booking.quarantinedAt = new Date();
    booking.quarantineReason = `Missing references: ${missing.join(', ')}`;
    await booking.save({ validateBeforeSave: false });
    quarantined += 1;
  }

  console.log(`Dynamic app migration completed. Updated ${bookings.length} bookings; quarantined ${quarantined} orphan bookings.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
