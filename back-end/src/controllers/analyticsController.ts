import type { Response } from 'express';
import Booking, { BookingStatus, CarerPayoutStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Incident from '../models/Incident.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';

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
      Booking.find(bookingFilter).select('status totalPrice platformFeeAmount carerPayoutAmount createdAt').lean(),
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
    res.json({
      totals: {
        bookings: bookings.length,
        activeBookings: bookings.filter((booking) =>
          [BookingStatus.PENDING, BookingStatus.PENDING_CARER, BookingStatus.ACCEPTED_PENDING_PAYMENT, BookingStatus.PAID_CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)
        ).length,
        revenue: paidBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
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
