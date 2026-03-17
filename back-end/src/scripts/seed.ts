import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.js';
import Carer from '../models/Carer.js';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL || 'admin@mommate.com' } });
    await Carer.deleteMany({});
    await Service.deleteMany({});

    console.log('Seeding Services...');
    const services = await Service.insertMany([
      {
        title: 'Newborn Care',
        description: 'Specialized care for your newborn baby, including feeding, bathing, and sleep support.',
        icon: 'baby',
        image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        basePrice: 500000,
        price: 500000,
        category: 'Medical',
        duration: '4 hours',
        tags: ['Newborn', 'Hourly'],
        steps: [
          { title: 'Initial Assessment', text: 'Evaluation of baby health and needs.' },
          { title: 'Daily Routine', text: 'Implementing a healthy schedule.' }
        ],
        isActive: true
      },
      {
        title: 'Postpartum Recovery',
        description: 'Physical and emotional support for mothers after childbirth.',
        icon: 'heart',
        image: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        basePrice: 600000,
        price: 600000,
        category: 'Medical',
        duration: 'Day Shift',
        tags: ['Mother Care', 'Recovery'],
        steps: [
          { title: 'Wellness Check', text: 'Monitoring physical recovery.' }
        ],
        isActive: true
      },
      {
        title: 'Mother Recovery',
        description: 'Right after hospital discharge is the most sensitive period for both postpartum women and newborns, as it carries many potential risks such as postpartum infections, postpartum hemorrhage, blocked milk ducts, umbilical infections, and neonatal diseases. Therefore, both mother and baby need continued care from a home healthcare team.\n\nMommate, with its team of skilled and knowledgeable nurses, combines medical treatment protocols with strict professional supervision from obstetricians, pediatricians, postpartum care specialists, and breastfeeding experts. This ensures that mother and baby can safely and effectively overcome the postpartum stage.',
        icon: 'sparkles',
        image: 'https://plus.unsplash.com/premium_photo-1661719875143-6d006096570c?q=80&w=2670&auto=format&fit=crop',
        basePrice: 650000,
        price: 650000,
        category: 'Postpartum Care',
        duration: '70 minutes',
        tags: ['Recovery', 'Specialized', 'Mother Care'],
        steps: [
          {
            title: 'Full-body Herbal Steam Therapy',
            text: 'Specialized herbal steam helps detoxify, improve blood circulation, reduce swelling, relax the mind, and support postpartum body recovery.',
            image: 'https://images.unsplash.com/photo-1544161515-4ae6ce6ea858?q=80&w=2670&auto=format&fit=crop'
          },
          {
            title: 'Dark Spot Treatment for Neck – Armpits – Groin',
            text: 'Natural ingredients brighten and smoothen skin, even out tone, and reduce darkening and wrinkles in these areas.',
            image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=2670&auto=format&fit=crop'
          },
          {
            title: 'Shoulder – Neck – Hand Massage',
            text: 'Relieves stress, improves blood circulation, reduces headaches, promotes deeper sleep, and eases numbness or pain in the hands',
            image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2574&auto=format&fit=crop'
          },
          {
            title: 'Natural Essence Facial Mask',
            text: 'Nourishes the skin, making it smooth, radiant, and even-toned while reducing dark spots.',
            image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=2670&auto=format&fit=crop'
          },
          {
            title: 'Herbal & Mineral Salt Foot Soak',
            text: 'Detoxifies, improves circulation, relieves postpartum fatigue, reduces stress, prevents skin issues, and boosts immunity.',
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2670&auto=format&fit=crop'
          }
        ],
        sessionOptions: [10, 15, 20, 30],
        isActive: true
      },
      {
        title: 'Breastfeeding Support',
        description: 'Certified consultants to help you with nursing techniques and challenges.',
        icon: 'milk',
        image: 'https://images.unsplash.com/photo-1544126592-807daa215a05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        basePrice: 400000,
        price: 400000,
        category: 'Consultation',
        duration: '2 hours',
        tags: ['Feeding', 'Education'],
        steps: [
          { title: 'Latching Technique', text: 'Ensuring comfortable and effective feeding.' }
        ],
        isActive: true
      }
    ]);

    console.log('Seeding Users (Carers and Parent)...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        firstName: 'Nguyen',
        lastName: 'Thi A',
        email: 'carerA@example.com',
        password: hashedPassword,
        role: UserRole.CARER,
        phoneNumber: '0901234567',
        avatar: 'https://i.pravatar.cc/150?u=carerA',
        address: 'Hồ Chí Minh'
      },
      {
        firstName: 'Tran',
        lastName: 'Thi B',
        email: 'carerB@example.com',
        password: hashedPassword,
        role: UserRole.CARER,
        phoneNumber: '0907654321',
        avatar: 'https://i.pravatar.cc/150?u=carerB',
        address: 'Hà Nội'
      },
      {
        firstName: 'Test',
        lastName: 'Parent',
        email: 'parent@example.com',
        password: hashedPassword,
        role: UserRole.PARENT,
        phoneNumber: '0988888888',
        avatar: 'https://i.pravatar.cc/150?u=parent',
        address: 'Đà Nẵng'
      }
    ]);

    console.log('Seeding Carers...');
    await Carer.insertMany([
      {
        user: users[0]!._id,
        bio: 'Bác sĩ sản khoa với 10 năm kinh nghiệm trong ngành.',
        experienceYears: 10,
        hourlyRate: 150000,
        rating: 4.8,
        reviewCount: 25,
        location: 'Hồ Chí Minh',
        age: 35,
        certifications: ['Certified Nurse', 'Pediatric Specialist'],
        services: [services[0]!._id, services[1]!._id, services[3]!._id],
        availability: [
          { day: 'Monday', slots: ['09:00', '14:00'] },
          { day: 'Wednesday', slots: ['09:00', '14:00'] }
        ],
        isVerified: true
      },
      {
        user: users[1]!._id,
        bio: 'Chuyên gia tư vấn sữa mẹ với kiến thức chuyên sâu.',
        experienceYears: 5,
        hourlyRate: 120000,
        rating: 4.9,
        reviewCount: 18,
        location: 'Hà Nội',
        age: 28,
        certifications: ['IBCLC Consultant'],
        services: [services[2]!._id],
        availability: [
          { day: 'Tuesday', slots: ['10:00', '15:00'] },
          { day: 'Thursday', slots: ['10:00', '15:00'] }
        ],
        isVerified: true
      }
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
