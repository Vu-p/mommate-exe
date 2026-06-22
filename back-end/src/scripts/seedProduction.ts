import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Booking from '../models/Booking.js';
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
  await connectDB();

  // Wipe the collections
  await Booking.deleteMany({});
  await CareProfile.deleteMany({});
  await Review.deleteMany({});
  
  await Carer.deleteMany({});
  await Contract.deleteMany({});
  await User.deleteMany({ role: { $ne: UserRole.ADMIN } });

  const services = await Service.find({});

  const admin = await upsertUser('admin.demo@mommate.local', { 
    role: UserRole.ADMIN, 
    firstName: 'Admin', 
    lastName: 'MomMate', 
    phoneNumber: '0900000003' 
  });

  const carersData = [
    {
      email: 'my.nguyen@mommate.local',
      firstName: 'Nguyễn Thị',
      lastName: 'Trà My',
      phone: '0901000001',
      avatar: '/carers/carer1.png',
      district: 'Hải Châu',
      bio: 'Điều dưỡng nhi khoa với 8 năm kinh nghiệm. Chuyên hỗ trợ các mẹ bỉm sữa phục hồi sau sinh và chăm sóc trẻ sơ sinh.',
      age: 32,
      exp: 8,
      rate: 250000,
    },
    {
      email: 'lan.le@mommate.local',
      firstName: 'Lê Hoàng',
      lastName: 'Lan',
      phone: '0901000002',
      avatar: '/carers/carer2.png',
      district: 'Thanh Khê',
      bio: 'Chuyên viên tư vấn sữa mẹ, có chứng chỉ quốc tế IBCLC. Kinh nghiệm làm việc tại khoa Phụ Sản.',
      age: 29,
      exp: 5,
      rate: 220000,
    },
    {
      email: 'huong.tran@mommate.local',
      firstName: 'Trần Thanh',
      lastName: 'Hương',
      phone: '0901000003',
      avatar: '/carers/carer3.png',
      district: 'Liên Chiểu',
      bio: 'Nữ hộ sinh giàu tình cảm, chu đáo. Luôn đặt sức khỏe của mẹ và sự phát triển của bé lên hàng đầu.',
      age: 35,
      exp: 10,
      rate: 300000,
    },
    {
      email: 'tam.vo@mommate.local',
      firstName: 'Võ Minh',
      lastName: 'Tâm',
      phone: '0901000004',
      avatar: '/carers/carer4.png',
      district: 'Sơn Trà',
      bio: 'Tốt nghiệp chuyên ngành Điều dưỡng đa khoa. Đặc biệt có kinh nghiệm xử lý các tình huống vàng da ở trẻ sơ sinh.',
      age: 26,
      exp: 4,
      rate: 200000,
    },
    {
      email: 'hoa.pham@mommate.local',
      firstName: 'Phạm Thị',
      lastName: 'Hoa',
      phone: '0901000005',
      avatar: '/carers/carer5.png',
      district: 'Ngũ Hành Sơn',
      bio: 'Cô bảo mẫu hiền lành, yêu trẻ. Kinh nghiệm đồng hành cùng hơn 100 gia đình nhỏ tại khu vực Đà Nẵng.',
      age: 40,
      exp: 12,
      rate: 280000,
    }
  ];

  for (const cData of carersData) {
    const carerUser = await upsertUser(cData.email, { 
      role: UserRole.CARER, 
      firstName: cData.firstName, 
      lastName: cData.lastName, 
      phoneNumber: cData.phone,
      address: `${cData.district}, Đà Nẵng`,
      avatar: cData.avatar
    });

    const carer = await Carer.create({
      user: carerUser._id,
      bio: cData.bio,
      experienceYears: cData.exp,
      hourlyRate: cData.rate,
      pricingType: 'hourly',
      platformFeePercent: 10,
      rating: 5,
      reviewCount: Math.floor(Math.random() * 20) + 5,
      location: `${cData.district}, Đà Nẵng`,
      age: cData.age,
      certifications: ['Chứng chỉ hành nghề khám bệnh, chữa bệnh'],
      certificationDetails: [{ name: 'Cử nhân Điều dưỡng', issuer: 'Đại học Y Dược' }],
      workplaceName: 'Bệnh viện Phụ Sản Nhi Đà Nẵng',
      workplaceType: 'hospital',
      department: 'Khoa Nhi',
      position: 'Điều dưỡng viên',
      verificationStatus: 'verified',
      applicationStatus: 'verified',
      isVerified: true,
      acceptingBookings: true,
      services: services.map((service) => service._id),
      availability: [
        { day: 'monday', slots: ['08:00-12:00', '13:00-17:00'] },
        { day: 'wednesday', slots: ['08:00-12:00', '13:00-17:00'] },
        { day: 'saturday', slots: ['08:00-12:00'] },
        { day: 'sunday', slots: ['08:00-12:00', '13:00-17:00'] },
      ],
      timezone: 'Asia/Ho_Chi_Minh',
      serviceRadiusKm: 15,
      coordinates: { type: 'Point', coordinates: [108.2022, 16.0544] },
    });

    await Contract.create({
      carer: carer._id,
      user: carerUser._id,
      templateVersion: '2026.1',
      status: ContractStatus.SIGNED,
      templateTitle: 'Hợp đồng cộng tác chuyên gia MomMate',
      contractText: 'Chuyên gia cam kết cung cấp dịch vụ đúng quy trình an toàn và bảo mật.',
      signedAt: new Date(),
      signedIp: '127.0.0.1',
      signedUserAgent: 'MomMate production seed',
      createdByAdmin: admin._id,
      signatureImage: 'https://res.cloudinary.com/dbmqfmvyh/image/upload/v1720000000/mommate-signatures/sample_sig.png'
    });
  }

  console.log('Production database seeded successfully with Da Nang carers!');
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed production database:', error);
  process.exit(1);
});
