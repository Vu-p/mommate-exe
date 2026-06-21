import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Booking, { BookingStatus, CareFor, CarerPayoutStatus } from '../models/Booking.js';
import CareProfile from '../models/CareProfile.js';
import Carer from '../models/Carer.js';
import Contract, { ContractStatus } from '../models/Contract.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User, { UserRole } from '../models/User.js';

dotenv.config();

const demoPassword = process.env.DEMO_SEED_PASSWORD || 'Demo@123456';

const upsertUser = async (email: string, values: Record<string, unknown>) => {
  const password = await bcrypt.hash(demoPassword, 10);
  return User.findOneAndUpdate(
    { email },
    {
      $set: { ...values, accountStatus: 'active', emailVerified: true },
      $setOnInsert: { email, password, refreshTokenVersion: 0 },
    },
    { upsert: true, new: true, runValidators: true },
  );
};

const upsertService = (title: string, price: number, category: string, duration: string) =>
  Service.findOneAndUpdate(
    { title },
    {
      $set: {
        description: `${title} bởi chuyên gia MomMate đã xác minh.`,
        icon: category,
        image: '',
        basePrice: price,
        price,
        category,
        duration,
        tags: ['MomMate', category],
        careItems: [
          'Đánh giá nhu cầu chăm sóc trước khi bắt đầu',
          'Thực hiện quy trình phù hợp với hồ sơ mẹ và bé',
          'Hướng dẫn gia đình theo dõi sau buổi chăm sóc',
        ],
        faq: [
          {
            question: 'Khi nào gia đình nên sử dụng dịch vụ?',
            answer: 'Gia đình có thể đặt lịch khi mẹ và bé đã ổn định và không có chỉ định cấp cứu.',
          },
        ],
        sessionOptions: [1, 2, 4],
        isActive: true,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  await connectDB();
  await Booking.collection.updateMany(
    { notes: { $in: ['[seed:completed-booking]', '[seed:pending-booking]'] }, 'location.coordinates': { $size: 0 } },
    { $unset: { location: '' } },
  );

  const services = await Promise.all([
    upsertService('Chăm sóc mẹ và bé sau sinh', 250000, 'postpartum', 'Theo giờ'),
    upsertService('Tư vấn nuôi con bằng sữa mẹ', 180000, 'consultation', '90 phút'),
  ]);

  const [parent, carerUser, admin] = await Promise.all([
    upsertUser('parent.demo@mommate.local', { role: UserRole.PARENT, firstName: 'Minh', lastName: 'Anh', phoneNumber: '0900000001', address: 'Hải Châu, Đà Nẵng' }),
    upsertUser('carer.demo@mommate.local', { role: UserRole.CARER, firstName: 'Thu', lastName: 'Lan', phoneNumber: '0900000002', address: 'Thanh Khê, Đà Nẵng' }),
    upsertUser('admin.demo@mommate.local', { role: UserRole.ADMIN, firstName: 'Admin', lastName: 'MomMate', phoneNumber: '0900000003' }),
  ]);

  const carer = await Carer.findOneAndUpdate(
    { user: carerUser._id, isDeleted: false },
    {
      $set: {
        bio: 'Điều dưỡng nhi khoa có kinh nghiệm chăm sóc mẹ và trẻ sơ sinh.',
        experienceYears: 8,
        hourlyRate: 250000,
        pricingType: 'hourly',
        platformFeePercent: 10,
        rating: 5,
        reviewCount: 1,
        location: 'Đà Nẵng',
        age: 34,
        certifications: ['Chứng chỉ điều dưỡng'],
        certificationDetails: [{ name: 'Điều dưỡng nhi khoa', issuer: 'Sở Y tế Đà Nẵng' }],
        workplaceName: 'Bệnh viện Phụ sản - Nhi Đà Nẵng',
        workplaceType: 'hospital',
        department: 'Nhi sơ sinh',
        position: 'Điều dưỡng',
        verificationStatus: 'verified',
        applicationStatus: 'verified',
        isVerified: true,
        acceptingBookings: true,
        services: services.map((service) => service._id),
        availability: [
          { day: 'monday', slots: ['08:00-12:00', '13:00-17:00'] },
          { day: 'wednesday', slots: ['08:00-12:00', '13:00-17:00'] },
          { day: 'saturday', slots: ['08:00-12:00'] },
        ],
        timezone: 'Asia/Ho_Chi_Minh',
        serviceRadiusKm: 15,
        coordinates: { type: 'Point', coordinates: [108.2022, 16.0544] },
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  await Contract.findOneAndUpdate(
    { carer: carer._id, templateVersion: '2026.1' },
    {
      $set: {
        user: carerUser._id,
        status: ContractStatus.SIGNED,
        templateTitle: 'Hợp đồng cộng tác chuyên gia MomMate',
        contractText: 'Chuyên gia cam kết cung cấp dịch vụ đúng quy trình an toàn và bảo mật.',
        signedAt: new Date(),
        signedIp: '127.0.0.1',
        signedUserAgent: 'MomMate demo seed',
        createdByAdmin: admin._id,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  await CareProfile.findOneAndUpdate(
    { owner: parent._id, displayName: 'Bé Demo', isDeleted: false },
    { $set: { type: 'baby', birthDate: new Date('2026-01-15'), allergies: ['Không có'], notes: 'Hồ sơ mẫu phục vụ kiểm thử.', isPrimary: true } },
    { upsert: true, new: true, runValidators: true },
  );

  const pastStart = new Date();
  pastStart.setDate(pastStart.getDate() - 7);
  pastStart.setHours(9, 0, 0, 0);
  const completedBooking = await Booking.findOneAndUpdate(
    { parent: parent._id, carer: carer._id, notes: '[seed:completed-booking]' },
    {
      $set: {
        service: services[0]._id,
        status: BookingStatus.COMPLETED,
        scheduledAt: pastStart,
        scheduledEndAt: new Date(pastStart.getTime() + 7_200_000),
        serviceMode: 'at_home',
        address: '123 Bạch Đằng',
        fullAddress: '123 Bạch Đằng, Hải Châu, Đà Nẵng',
        contactName: `${parent.firstName} ${parent.lastName}`,
        contactPhone: parent.phoneNumber,
        careFor: CareFor.MOM_AND_BABY,
        totalPrice: 500000,
        platformFeeAmount: 50000,
        carerPayoutAmount: 450000,
        carerPayoutStatus: CarerPayoutStatus.READY,
        hours: 2,
        numSessions: 1,
        priceSnapshot: { unitPrice: 250000, hours: 2, sessions: 1, platformFeePercent: 10 },
        paidAt: pastStart,
        checkInAt: pastStart,
        checkOutAt: new Date(pastStart.getTime() + 7_200_000),
        notes: '[seed:completed-booking]',
        isDeleted: false,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 4);
  futureStart.setHours(14, 0, 0, 0);
  await Booking.findOneAndUpdate(
    { parent: parent._id, carer: carer._id, notes: '[seed:pending-booking]' },
    {
      $set: {
        service: services[1]._id,
        status: BookingStatus.PENDING_CARER,
        scheduledAt: futureStart,
        scheduledEndAt: new Date(futureStart.getTime() + 7_200_000),
        serviceMode: 'online',
        address: 'Online',
        contactName: `${parent.firstName} ${parent.lastName}`,
        contactPhone: parent.phoneNumber,
        careFor: CareFor.POSTPARTUM_MOM,
        totalPrice: 360000,
        platformFeeAmount: 36000,
        carerPayoutAmount: 324000,
        carerPayoutStatus: CarerPayoutStatus.UNPAID,
        hours: 2,
        numSessions: 1,
        priceSnapshot: { unitPrice: 180000, hours: 2, sessions: 1, platformFeePercent: 10 },
        notes: '[seed:pending-booking]',
        isDeleted: false,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  await Review.findOneAndUpdate(
    { booking: completedBooking._id },
    {
      $set: {
        parent: parent._id,
        carer: carer._id,
        score: 5,
        title: 'Chăm sóc tận tâm',
        content: 'Chuyên gia đúng giờ, hướng dẫn rõ ràng và chăm bé rất cẩn thận.',
        tags: ['Đúng giờ', 'Tận tâm'],
        moderationStatus: 'published',
        moderatedBy: admin._id,
        moderatedAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  console.log('Dynamic demo seed completed.');
  console.log('Accounts: parent.demo@mommate.local, carer.demo@mommate.local, admin.demo@mommate.local');
  console.log('Password: DEMO_SEED_PASSWORD from .env');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Dynamic demo seed failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
