import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const [users, carers, services, bookings] = await Promise.all([
    User.find().select('_id').lean(),
    Carer.find({ isDeleted: false }).select('_id user').lean(),
    Service.find().select('_id').lean(),
    Booking.find({ isDeleted: false }).select('parent carer service scheduledAt scheduledEndAt status totalPrice priceSnapshot').lean(),
  ]);
  const ids = (items: any[]) => new Set(items.map((item) => String(item._id)));
  const userIds = ids(users);
  const carerIds = ids(carers);
  const serviceIds = ids(services);
  const errors: string[] = [];

  carers.forEach((carer) => {
    if (!userIds.has(String(carer.user))) errors.push(`Carer ${carer._id} references missing user ${carer.user}`);
  });
  bookings.forEach((booking) => {
    if (!userIds.has(String(booking.parent))) errors.push(`Booking ${booking._id} references missing parent`);
    if (!carerIds.has(String(booking.carer))) errors.push(`Booking ${booking._id} references missing carer`);
    if (!serviceIds.has(String(booking.service))) errors.push(`Booking ${booking._id} references missing service`);
    const expected = Number(booking.priceSnapshot?.unitPrice || 0)
      * Number(booking.priceSnapshot?.hours || 1)
      * Number(booking.priceSnapshot?.sessions || 1);
    if (expected && expected !== Number(booking.totalPrice)) errors.push(`Booking ${booking._id} has inconsistent total price`);
  });

  const active = bookings.filter((booking) => [
    BookingStatus.ACCEPTED_PENDING_PAYMENT,
    BookingStatus.PAID_CONFIRMED,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
  ].includes(booking.status));
  for (let index = 0; index < active.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < active.length; otherIndex += 1) {
      const first = active[index];
      const second = active[otherIndex];
      if (!first || !second) continue;
      if (String(first.carer) !== String(second.carer)) continue;
      if (first.scheduledAt < second.scheduledEndAt! && first.scheduledEndAt! > second.scheduledAt) {
        errors.push(`Bookings ${first._id} and ${second._id} overlap for the same carer`);
      }
    }
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Data integrity OK: ${users.length} users, ${carers.length} carers, ${services.length} services, ${bookings.length} bookings.`);
  }
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
