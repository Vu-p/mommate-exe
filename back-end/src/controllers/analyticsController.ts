import type { Response } from 'express';
import Booking, { BookingStatus, CarerPayoutStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Incident from '../models/Incident.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const dateFilter = (from?: unknown, to?: unknown) => {
  const createdAt: Record<string, Date> = {};
  if (from) createdAt.$gte = new Date(String(from));
  if (to) createdAt.$lte = new Date(String(to));
  return Object.keys(createdAt).length ? { createdAt } : {};
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const bookingFilter = { isDeleted: false, ...dateFilter(req.query.from, req.query.to) };
    const [bookings, userCount, carerCount, serviceCount, reviewCount, openIncidents] = await Promise.all([
      Booking.find(bookingFilter)
        .select('status totalPrice platformFeeAmount carerPayoutAmount createdAt service carer district')
        .populate('service', 'title category')
        .populate({ path: 'carer', populate: { path: 'user', select: 'firstName lastName' } })
        .lean(),
      User.countDocuments(),
      Carer.countDocuments({ isDeleted: false }),
      Service.countDocuments({ isActive: true }),
      Review.countDocuments({ moderationStatus: { $ne: 'hidden' } }),
      Incident.countDocuments({ status: { $in: ['open', 'investigating'] } }),
    ]);

    const paidStatuses = new Set([BookingStatus.PAID_CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]);
    const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
    for (const booking of bookings) {
      const date = new Date((booking as any).createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const item = monthlyMap.get(key) || { revenue: 0, bookings: 0 };
      item.bookings += 1;
      if (paidStatuses.has(booking.status)) item.revenue += Number(booking.totalPrice || 0);
      monthlyMap.set(key, item);
    }

    const paidBookings = bookings.filter((booking) => paidStatuses.has(booking.status));
    const serviceMap = new Map<string, number>();
    const districtMap = new Map<string, number>();
    const carerMap = new Map<string, { name: string; revenue: number; bookings: number }>();
    for (const booking of paidBookings as any[]) {
      const revenue = Number(booking.totalPrice || 0);
      const serviceLabel = booking.service?.category || booking.service?.title || 'Khác';
      serviceMap.set(serviceLabel, (serviceMap.get(serviceLabel) || 0) + revenue);
      const district = booking.district || 'Chưa xác định';
      districtMap.set(district, (districtMap.get(district) || 0) + revenue);
      const carerId = String(booking.carer?._id || booking.carer || 'unknown');
      const carerName = `${booking.carer?.user?.firstName || ''} ${booking.carer?.user?.lastName || ''}`.trim() || 'Chuyên gia';
      const current = carerMap.get(carerId) || { name: carerName, revenue: 0, bookings: 0 };
      current.revenue += revenue;
      current.bookings += 1;
      carerMap.set(carerId, current);
    }
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
    res.json({
      totals: {
        bookings: bookings.length,
        activeBookings: bookings.filter((booking) =>
          [BookingStatus.PENDING, BookingStatus.PENDING_CARER, BookingStatus.ACCEPTED_PENDING_PAYMENT, BookingStatus.PAID_CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)
        ).length,
        revenue: totalRevenue,
        platformFees: paidBookings.reduce((sum, booking) => sum + Number(booking.platformFeeAmount || 0), 0),
        carerPayouts: paidBookings.reduce((sum, booking) => sum + Number(booking.carerPayoutAmount || 0), 0),
        users: userCount,
        carers: carerCount,
        services: serviceCount,
        reviews: reviewCount,
        openIncidents,
      },
      statusBreakdown: Object.values(BookingStatus).map((status) => ({
        status,
        count: bookings.filter((booking) => booking.status === status).length,
      })),
      monthly: [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, ...value })),
      serviceBreakdown: [...serviceMap.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, revenue]) => ({ label, revenue, percent: totalRevenue ? Math.round(revenue / totalRevenue * 100) : 0 })),
      districtBreakdown: [...districtMap.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, revenue]) => ({ label, revenue })),
      topCarers: [...carerMap.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((item) => ({ ...item, rating: 100 })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Cannot load analytics' });
  }
};

export const getReconciliation = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { isDeleted: false, status: BookingStatus.COMPLETED };
    if (req.query.status) filter.carerPayoutStatus = req.query.status;
    Object.assign(filter, dateFilter(req.query.from, req.query.to));

    const bookings = await Booking.find(filter)
      .sort({ checkOutAt: -1 })
      .populate('parent', 'firstName lastName email')
      .populate({ path: 'carer', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('service', 'title')
      .lean();

    res.json({
      items: bookings,
      summary: {
        total: bookings.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
        platformFees: bookings.reduce((sum, item) => sum + Number(item.platformFeeAmount || 0), 0),
        payable: bookings.reduce((sum, item) => sum + Number(item.carerPayoutAmount || 0), 0),
        paid: bookings.filter((item) => item.carerPayoutStatus === CarerPayoutStatus.PAID)
          .reduce((sum, item) => sum + Number(item.carerPayoutAmount || 0), 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Cannot load reconciliation' });
  }
};

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const exportReconciliationCsv = async (req: AuthRequest, res: Response) => {
  const filter: Record<string, any> = { isDeleted: false, status: BookingStatus.COMPLETED };
  if (req.query.status) filter.carerPayoutStatus = req.query.status;
  Object.assign(filter, dateFilter(req.query.from, req.query.to));
  const bookings = await Booking.find(filter)
    .sort({ checkOutAt: -1 })
    .populate({ path: 'carer', populate: { path: 'user', select: 'firstName lastName email' } })
    .populate('service', 'title')
    .lean();
  const header = ['Booking', 'Chuyên gia', 'Email', 'Dịch vụ', 'Tổng giá trị', 'Phí nền tảng', 'Phải trả', 'Trạng thái', 'Mã đối soát'];
  const rows = bookings.map((item: any) => [
    item._id,
    `${item.carer?.user?.firstName || ''} ${item.carer?.user?.lastName || ''}`.trim(),
    item.carer?.user?.email,
    item.service?.title,
    item.totalPrice,
    item.platformFeeAmount,
    item.carerPayoutAmount,
    item.carerPayoutStatus,
    item.payoutReference,
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mommate-reconciliation-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
};

const pdfFont = () => [
  'C:\\Windows\\Fonts\\arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
].find((path) => fs.existsSync(path));

export const exportReconciliationPdf = async (req: AuthRequest, res: Response) => {
  const filter: Record<string, any> = { isDeleted: false, status: BookingStatus.COMPLETED };
  if (req.query.status) filter.carerPayoutStatus = req.query.status;
  Object.assign(filter, dateFilter(req.query.from, req.query.to));
  const bookings = await Booking.find(filter)
    .sort({ checkOutAt: -1 })
    .populate({ path: 'carer', populate: { path: 'user', select: 'firstName lastName email' } })
    .populate('service', 'title')
    .lean();
  const totals = {
    gross: bookings.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    fees: bookings.reduce((sum, item) => sum + Number(item.platformFeeAmount || 0), 0),
    payout: bookings.reduce((sum, item) => sum + Number(item.carerPayoutAmount || 0), 0),
  };
  const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: 'MomMate reconciliation report' } });
  const font = pdfFont();
  if (font) doc.font(font);
  const text = (value: string) => font ? value : value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('đ', 'd').replaceAll('Đ', 'D');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="mommate-reconciliation-${new Date().toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);
  doc.fontSize(20).fillColor('#16724f').text('MomMate');
  doc.fontSize(14).fillColor('#18332b').text(text('Báo cáo đối soát và thanh toán'));
  doc.moveDown().fontSize(10).text(text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`));
  doc.moveDown().fontSize(11)
    .text(text(`Tổng giá trị: ${totals.gross.toLocaleString('vi-VN')} VNĐ`))
    .text(text(`Phí nền tảng: ${totals.fees.toLocaleString('vi-VN')} VNĐ`))
    .text(text(`Phải trả chuyên gia: ${totals.payout.toLocaleString('vi-VN')} VNĐ`));
  doc.moveDown();
  bookings.forEach((item: any, index) => {
    if (doc.y > 730) doc.addPage();
    const carerName = `${item.carer?.user?.firstName || ''} ${item.carer?.user?.lastName || ''}`.trim();
    doc.fontSize(10).fillColor('#18332b').text(text(`${index + 1}. #${String(item._id).slice(-8).toUpperCase()} — ${carerName}`));
    doc.fontSize(9).fillColor('#596963')
      .text(text(`${item.service?.title || ''} | ${Number(item.carerPayoutAmount || 0).toLocaleString('vi-VN')} VNĐ | ${item.carerPayoutStatus}`));
    doc.moveDown(0.5);
  });
  doc.end();
};
