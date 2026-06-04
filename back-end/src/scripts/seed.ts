import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.js';
import Carer from '../models/Carer.js';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

dotenv.config();

const certificateImageUrls = [
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
];

const identityImageUrls = [
  'https://images.unsplash.com/photo-1568219557405-376e23a7940d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586074299757-dc655f18518c?auto=format&fit=crop&w=1200&q=80',
];

const professionalAvatars = [
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=80',
];

const servicesSeed = [
  {
    title: 'Thông tắc tia sữa',
    description: 'Giải pháp nhanh chóng, an toàn giúp loại bỏ các cục hạch sữa tắc nghẽn, giảm đau nhức tức thì và phòng ngừa viêm tuyến vú cho mẹ sau sinh.',
    icon: 'milk',
    image: 'https://images.unsplash.com/photo-1544126592-807daa215a05?auto=format&fit=crop&w=1200&q=80',
    basePrice: 200000,
    price: 200000,
    category: 'Lactation',
    duration: '60 phút',
    tags: ['Tắc tia sữa', 'Sữa mẹ', 'Sau sinh'],
    steps: [
      { title: 'Thăm khám', text: 'Thăm khám, kiểm tra bầu ngực và xác định vị trí các tia sữa bị tắc.' },
      { title: 'Chườm ấm và massage', text: 'Chườm ấm kết hợp massage nhẹ nhàng bằng tinh dầu tự nhiên để làm mềm bầu ngực.' },
      { title: 'Thông dòng sữa', text: 'Sử dụng kỹ thuật tay để thông dòng chảy của sữa.' },
      { title: 'Vệ sinh và hướng dẫn', text: 'Vắt hoặc hút sạch lượng sữa tồn đọng, vệ sinh lại bầu ngực và hướng dẫn mẹ cách cho bé bú hoặc hút sữa đúng cách để tránh tái phát.' },
    ],
    sessionOptions: [1, 3, 5],
    isActive: true,
  },
  {
    title: 'Kích & gọi sữa về',
    description: 'Phương pháp kích thích tuyến sữa hoạt động tối đa dành cho các mẹ gặp tình trạng ít sữa, mất sữa hoặc sữa chưa về sau khi sinh.',
    icon: 'milk',
    image: 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&w=1200&q=80',
    basePrice: 350000,
    price: 350000,
    category: 'Lactation',
    duration: '75 phút',
    tags: ['Kích sữa', 'Gọi sữa', 'Tư vấn sữa mẹ'],
    steps: [
      { title: 'Kiểm tra và tư vấn', text: 'Kiểm tra nang sữa, tư vấn chế độ dinh dưỡng và sinh hoạt tối ưu cho mẹ.' },
      { title: 'Massage bấm huyệt', text: 'Massage bấm huyệt chuyên sâu vùng lưng, vai gáy và ngực để kích thích hoóc-môn tiết sữa Prolactin và Oxytocin.' },
      { title: 'Liệu pháp nhiệt', text: 'Sử dụng liệu pháp nhiệt và dụng cụ hỗ trợ kích sữa chuẩn y khoa.' },
      { title: 'Kế hoạch tại nhà', text: 'Hướng dẫn mẹ kỹ thuật massage tại nhà và lịch trình hút sữa hoặc bú mẹ khoa học.' },
    ],
    sessionOptions: [1, 3, 5],
    isActive: true,
  },
  {
    title: 'Mẹ phục hồi',
    description: 'Liệu trình chăm sóc toàn diện giúp cơ thể mẹ nhanh chóng phục hồi bản năng, giảm đau mỏi cơ xương khớp và chữa lành các tổn thương sau sinh.',
    icon: 'heart',
    image: 'https://plus.unsplash.com/premium_photo-1661719875143-6d006096570c?auto=format&fit=crop&w=1200&q=80',
    basePrice: 550000,
    price: 550000,
    category: 'Postpartum Care',
    duration: '90 phút',
    tags: ['Phục hồi', 'Mẹ sau sinh', 'Thảo dược'],
    steps: [
      { title: 'Kiểm tra sức khỏe', text: 'Đo huyết áp, kiểm tra vết mổ hoặc vết khâu tầng sinh môn và tình trạng phục hồi của mẹ.' },
      { title: 'Xông thảo dược', text: 'Xông hơi toàn thân bằng thảo dược thiên nhiên để đào thải độc tố và sản dịch.' },
      { title: 'Massage toàn thân', text: 'Massage toàn thân chuyên sâu vùng lưng, hông, tay, chân giúp lưu thông khí huyết, giảm nhức mỏi.' },
      { title: 'Dưỡng da thảo dược', text: 'Thoa thảo dược dưỡng da toàn thân, giúp da sáng hồng và làm ấm cơ thể.' },
    ],
    sessionOptions: [1, 5, 10],
    isActive: true,
  },
  {
    title: 'Mẹ chuyên sâu',
    description: 'Gói chăm sóc cao cấp kết hợp phục hồi sức khỏe, lấy lại vóc dáng, giảm mỡ bụng và chăm sóc làn da trắng sáng rạng rỡ cho mẹ.',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1544161515-4ae6ce6ea858?auto=format&fit=crop&w=1200&q=80',
    basePrice: 750000,
    price: 750000,
    category: 'Postpartum Care',
    duration: '120 phút',
    tags: ['Chuyên sâu', 'Giảm mỡ bụng', 'Dưỡng sinh'],
    steps: [
      { title: 'Đánh giá cơ thể', text: 'Kiểm tra chỉ số cơ thể, mức độ xổ bụng sau sinh và làm sạch vùng da cần chăm sóc.' },
      { title: 'Chăm sóc vùng bụng', text: 'Massage bấm huyệt chuyên sâu vùng bụng bằng tinh dầu giảm béo, kết hợp quấn muối thảo dược hoặc nằm túi muối ấm để săn chắc vòng eo.' },
      { title: 'Phục hồi và chăm da', text: 'Massage phục hồi toàn thân kết hợp liệu trình chăm sóc da mặt, tẩy da chết và đắp mặt nạ thiên nhiên.' },
      { title: 'Dưỡng sinh thư giãn', text: 'Gội đầu dưỡng sinh thảo dược, sấy tóc và thoa serum dưỡng thể phục hồi.' },
    ],
    sessionOptions: [1, 5, 10],
    isActive: true,
  },
  {
    title: 'Bé và Mẹ phục hồi (Combo)',
    description: 'Sự kết hợp hoàn hảo giữa liệu trình phục hồi sức khỏe cho mẹ và dịch vụ tắm, massage, chăm sóc chuẩn y khoa cho bé yêu trong những tháng đầu đời.',
    icon: 'baby',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=80',
    basePrice: 1500000,
    price: 1500000,
    category: 'Combo Care',
    duration: '150 phút',
    tags: ['Combo', 'Mẹ và bé', 'Phục hồi'],
    steps: [
      { title: 'Chăm sóc bé', text: 'Massage thư giãn cho bé, tắm bé trong chậu nước ấm thảo dược, vệ sinh mắt, mũi, rốn và rơ lưỡi chuẩn y khoa.' },
      { title: 'Tương tác giác quan', text: 'Tương tác giác quan bằng đọc sách hoặc cho bé xem tranh kích thích thị giác trắng đen.' },
      { title: 'Chăm sóc mẹ', text: 'Kiểm tra sức khỏe, vết thương sau sinh và tiến hành massage toàn thân giảm đau nhức, giải tỏa căng thẳng.' },
      { title: 'Phục hồi vùng bụng', text: 'Chăm sóc vùng bụng bằng túi chườm thảo dược và hướng dẫn mẹ cách chăm sóc bé tại nhà.' },
    ],
    sessionOptions: [1, 5, 10],
    isActive: true,
  },
  {
    title: 'Bé và Mẹ chuyên sâu (Combo)',
    description: 'Gói dịch vụ cao cấp toàn diện cho cả mẹ và bé: giúp mẹ lấy lại vóc dáng, phục hồi làn da và giúp bé phát triển thể chất lẫn trí não thông qua các bài tập chuyên sâu.',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
    basePrice: 1820000,
    price: 1820000,
    category: 'Combo Care',
    duration: '180 phút',
    tags: ['Combo cao cấp', 'Giáo dục sớm', 'Dưỡng sinh'],
    steps: [
      { title: 'Chăm sóc bé chuyên sâu', text: 'Massage chuyên sâu kích thích hệ tiêu hóa và vận động, tắm bé, vệ sinh các vùng nhạy cảm và tập vận động sớm Tummy time.' },
      { title: 'Giáo dục sớm', text: 'Áp dụng phương pháp giáo dục sớm, kích thích thị giác và thính giác bằng giáo cụ chuyên dụng.' },
      { title: 'Giảm mỡ và trị liệu', text: 'Thực hiện liệu trình giảm mỡ bụng chuyên sâu, quấn định hình form eo kết hợp massage trị liệu toàn thân.' },
      { title: 'Thư giãn toàn diện', text: 'Chăm sóc da mặt chuyên sâu, gội đầu dưỡng sinh giúp mẹ thư giãn tinh thần tuyệt đối.' },
    ],
    sessionOptions: [1, 5, 10],
    isActive: true,
  },
  {
    title: 'Bé và Mẹ y khoa (Combo)',
    description: 'Liệu trình chăm sóc sức khỏe đặc biệt dưới góc độ y khoa, tập trung vào việc kiểm tra, theo dõi và xử lý các vấn đề y tế cơ bản cho cả mẹ và bé sau khi xuất viện.',
    icon: 'shield',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    basePrice: 1820000,
    price: 1820000,
    category: 'Medical',
    duration: '180 phút',
    tags: ['Y khoa', 'Mẹ và bé', 'Điều dưỡng'],
    steps: [
      { title: 'Kiểm tra chỉ số', text: 'Điều dưỡng kiểm tra các chỉ số sinh tồn cho mẹ như huyết áp, vết thương và đánh giá tình trạng sức khỏe tổng quát của bé như vàng da, cân nặng, nhịp thở.' },
      { title: 'Vệ sinh vô trùng', text: 'Tiến hành vệ sinh, sát khuẩn và thay băng vết mổ hoặc vết khâu tầng sinh môn cho mẹ; chăm sóc và sát trùng cuống rốn cho bé bằng kỹ thuật vô trùng.' },
      { title: 'Tắm bé và tuần hoàn', text: 'Massage và tắm bé chuẩn y khoa, kết hợp ngâm chân thảo dược cho mẹ để kích thích tuần hoàn máu, giảm tê phù.' },
      { title: 'Hướng dẫn theo dõi', text: 'Hướng dẫn gia đình kỹ năng theo dõi các dấu hiệu bất thường ở trẻ sơ sinh, cách vệ sinh đúng cách và tư vấn lịch tiêm chủng phòng bệnh.' },
    ],
    sessionOptions: [1, 5, 10],
    isActive: true,
  },
];

const vietnameseNames = [
  ['Lê', 'Thị Hà'],
  ['Nguyễn', 'Thị Lan'],
  ['Phạm', 'Thị Hương'],
  ['Trần', 'Thị Trang'],
  ['Vũ', 'Thị Hạnh'],
  ['Đỗ', 'Thị Dung'],
  ['Bùi', 'Thị Phương'],
  ['Hoàng', 'Thị Ngọc'],
  ['Mai', 'Thị Mai'],
  ['Ngô', 'Thị Thảo'],
  ['Đặng', 'Thị Vy'],
  ['Phan', 'Thị An'],
  ['Tạ', 'Minh Châu'],
  ['Cao', 'Thị Kim'],
  ['Lý', 'Thanh Trúc'],
  ['Hồ', 'Thị Diễm'],
  ['Dương', 'Thị Thu'],
  ['Trịnh', 'Bảo Ngân'],
  ['Huỳnh', 'Thị Như'],
  ['Võ', 'Thị Yến'],
  ['Đinh', 'Thị Hồng'],
];

const locations = [
  { city: 'Hồ Chí Minh', address: '18 Nguyễn Thị Minh Khai, Quận 1, Hồ Chí Minh', prefix: '079' },
  { city: 'Hà Nội', address: '42 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', prefix: '001' },
  { city: 'Đà Nẵng', address: '96 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', prefix: '048' },
];

const scheduleSets = [
  [
    { day: 'Monday', slots: ['06:00-09:00', '15:00-18:00'] },
    { day: 'Thursday', slots: ['09:00-12:00', '18:00-21:00'] },
  ],
  [
    { day: 'Tuesday', slots: ['06:00-09:00', '12:00-15:00'] },
    { day: 'Friday', slots: ['09:00-12:00', '15:00-18:00'] },
  ],
  [
    { day: 'Wednesday', slots: ['09:00-12:00', '12:00-15:00'] },
    { day: 'Saturday', slots: ['15:00-18:00', '18:00-21:00'] },
  ],
];

const slugifyEmailPart = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');

const getCertifications = (serviceTitle: string, tier: number) => {
  const title = serviceTitle.toLowerCase();
  const senior = tier === 2;

  if (title.includes('sữa')) {
    return senior
      ? ['IBCLC Consultant', 'Thông tắc tia sữa nâng cao', 'Tư vấn dinh dưỡng sơ sinh']
      : ['Chứng chỉ tư vấn sữa mẹ', 'Sơ cấp cứu nhi khoa'];
  }

  if (title.includes('y khoa')) {
    return senior
      ? ['Điều dưỡng trưởng khoa hậu sản', 'Hồi sức sơ sinh nâng cao', 'Kiểm soát nhiễm khuẩn tại nhà']
      : ['Điều dưỡng mẹ và bé', 'Chăm sóc vết mổ sau sinh'];
  }

  if (title.includes('bé')) {
    return senior
      ? ['Điều dưỡng trưởng khoa sơ sinh', 'Giáo dục sớm cho trẻ sơ sinh', 'Massage vận động sơ sinh']
      : ['Chăm sóc trẻ sơ sinh', 'Tắm bé chuẩn y khoa'];
  }

  return senior
    ? ['Phục hồi hậu sản chuyên sâu', 'Liệu pháp thảo dược hậu sản', 'Chăm sóc vóc dáng sau sinh']
    : ['Chăm sóc mẹ sau sinh', 'Massage phục hồi cơ bản'];
};

const getBio = (serviceTitle: string, tier: number, experienceYears: number) => {
  const quality = tier === 2
    ? 'quy trình làm việc bài bản, theo dõi kết quả sau từng buổi và chất lượng chăm sóc cao cấp'
    : tier === 1
      ? 'kỹ năng thực hành vững, giao tiếp nhẹ nhàng và xử lý tình huống tốt'
      : 'nền tảng chuyên môn chắc, phù hợp với các nhu cầu chăm sóc thường ngày';

  return `Chuyên gia ${serviceTitle} với ${experienceYears} năm kinh nghiệm. Hồ sơ đã được verify, có đầy đủ bằng cấp chứng chỉ và ${quality}.`;
};

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing mock carers and reseeding the 7 requested services...');
    const oldMockUsers = await User.find({ email: /@mommate\.test$/ }).select('_id');
    await Carer.deleteMany({ user: { $in: oldMockUsers.map((user) => user._id) } });
    await User.deleteMany({ email: /@mommate\.test$/ });
    await Service.deleteMany({});

    const services = await Service.insertMany(servicesSeed);
    const hashedPassword = await bcrypt.hash('password123', 10);
    let createdCarerCount = 0;

    for (let serviceIndex = 0; serviceIndex < services.length; serviceIndex += 1) {
      const service = services[serviceIndex]!;

      for (let tier = 0; tier < 3; tier += 1) {
        const profileIndex = serviceIndex * 3 + tier;
        const [firstName, lastName] = vietnameseNames[profileIndex % vietnameseNames.length]!;
        const location = locations[profileIndex % locations.length]!;
        const experienceYears = 4 + tier * 4 + (serviceIndex % 3);
        const hourlyRate = 120000 + tier * 70000 + serviceIndex * 15000;
        const rating = Math.min(4.58 + tier * 0.18 + serviceIndex * 0.012, 4.99);
        const reviewCount = 16 + tier * 28 + serviceIndex * 5;
        const identityNumber = `${location.prefix}${1980 + profileIndex}${String(profileIndex + 1).padStart(6, '0')}`;
        const certifications = getCertifications(service.title, tier);
        const emailPrefix = slugifyEmailPart(`${lastName}.${firstName}.${service.title}.${tier + 1}`);

        const user = await User.create({
          firstName,
          lastName,
          email: `${emailPrefix}@mommate.test`,
          password: hashedPassword,
          role: UserRole.CARER,
          phoneNumber: `09${String(10000000 + profileIndex).slice(0, 8)}`,
          avatar: professionalAvatars[profileIndex % professionalAvatars.length],
          address: location.address,
          birthDate: new Date(`${1984 - tier * 3 - (serviceIndex % 4)}-0${(profileIndex % 9) + 1}-15`),
          gender: 'female',
          identityNumber,
          identityName: `${firstName} ${lastName}`,
          identityIssuedAt: new Date('2021-06-15'),
          identityImages: identityImageUrls,
        });

        await Carer.create({
          user: user._id,
          bio: getBio(service.title, tier, experienceYears),
          experienceYears,
          hourlyRate,
          pricingType: 'hourly',
          platformFeePercent: 10,
          rating,
          reviewCount,
          location: location.city,
          age: 2026 - (1984 - tier * 3 - (serviceIndex % 4)),
          certifications,
          certificationDetails: certifications.map((certification, certIndex) => ({
            name: certification,
            issuer: certIndex === 0 ? 'Hội Điều dưỡng Việt Nam' : 'Mommate Academy',
            fileUrl: certificateImageUrls[certIndex % certificateImageUrls.length],
          })),
          services: [service._id],
          availability: scheduleSets[profileIndex % scheduleSets.length],
          applicationStatus: 'verified',
          isVerified: true,
          isDeleted: false,
        });

        createdCarerCount += 1;
      }
    }

    await User.updateOne(
      { email: 'parent@example.com' },
      {
        $setOnInsert: {
          firstName: 'Minh',
          lastName: 'Anh',
          password: hashedPassword,
          role: UserRole.PARENT,
          phoneNumber: '0988888888',
          avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80',
          address: '789 Ông Ích Khiêm, Quận Liên Chiểu, Đà Nẵng',
        },
      },
      { upsert: true }
    );

    console.log('Database seeded successfully!');
    console.log(`Seeded ${services.length} services and ${createdCarerCount} verified carers.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
