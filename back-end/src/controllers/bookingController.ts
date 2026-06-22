import type { Response } from 'express';
import { PayOS } from '@payos/node';
import Booking, { BookingStatus, CarerPayoutStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Service from '../models/Service.js';
import type { AuthRequest } from '../middleware/auth.js';
import { hasSignedContractForCarer } from '../utils/contracts.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';
import CareJournal from '../models/CareJournal.js';
import { createNotification } from '../services/notificationService.js';
import { writeAudit } from '../utils/audit.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import BookingChangeRequest from '../models/BookingChangeRequest.js';
import Refund from '../models/Refund.js';
import mongoose from 'mongoose';
import { calculateBookingPrice, distanceMeters, isOutsideFreeCancellationWindow, isWithinCheckInWindow, isWithinAvailability } from '../utils/bookingRules.js';

const PAYOS_PAID_STATUSES = new Set(['PAID', '00']);

const getPayOSClient = () => {
  const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env;

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    return null;
  }

  return new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });
};

const populateBooking = (query: any) =>
  query
    .populate('parent', 'firstName lastName email phoneNumber')
    .populate({
      path: 'carer',
      populate: { path: 'user', select: 'firstName lastName email phoneNumber avatar' },
    })
    .populate('service', 'title category duration price image');

const getCarerForUser = async (userId: any) =>
  Carer.findOne({ user: userId, isDeleted: false }).select('_id user platformFeePercent isVerified verificationStatus acceptingBookings');

const activeBookingStatuses = [
  BookingStatus.ACCEPTED_PENDING_PAYMENT,
  BookingStatus.PAID_CONFIRMED,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

const hasScheduleConflict = async (carerId: unknown, start: Date, end: Date, excludeId?: unknown) =>
  Boolean(await Booking.findOne({
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    carer: carerId,
    status: { $in: activeBookingStatuses },
    scheduledAt: { $lt: end },
    scheduledEndAt: { $gt: start },
    isDeleted: false,
  } as any).select('_id').lean());

const calculatePayoutAmounts = (booking: any, carer: any) => {
  const totalPrice = Number(booking.totalPrice || 0);
  const platformFeePercent = Number(carer?.platformFeePercent ?? 10);
  const platformFeeAmount = Math.round((totalPrice * platformFeePercent) / 100);
  const carerPayoutAmount = Math.max(0, totalPrice - platformFeeAmount);

  booking.platformFeeAmount = platformFeeAmount;
  booking.carerPayoutAmount = carerPayoutAmount;
};

const referenceId = (value: any) => value?._id || value;
const ensureBookingOwner = (booking: any, userId: any) => String(referenceId(booking.parent)) === String(referenceId(userId));

const ensureCarerOwner = (booking: any, carerId: any) => String(referenceId(booking.carer)) === String(referenceId(carerId));

const canAccessBooking = async (booking: any, req: AuthRequest) => {
  if (req.user!.role === 'admin' || ensureBookingOwner(booking, req.user!._id)) return true;
  if (req.user!.role !== 'carer') return false;
  const carer = await getCarerForUser(req.user!._id);
  return Boolean(carer && ensureCarerOwner(booking, carer._id));
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const ensureCarerCanOperateBookings = async (carerId: any, res: Response) => {
  const hasSignedContract = await hasSignedContractForCarer(carerId);

  if (!hasSignedContract) {
    res.status(403).json({ message: 'Carer must sign the MomMate contract before receiving or performing bookings' });
    return false;
  }

  return true;
};

export const quoteBooking = async (req: AuthRequest, res: Response) => {
  const { carerId, serviceId, scheduledAt, hours, numSessions } = req.body;
  const start = new Date(scheduledAt);
  if (!carerId || !serviceId || Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return res.status(400).json({ message: 'Carer, service and a future scheduled time are required' });
  }
  const [carer, service] = await Promise.all([
    Carer.findOne({ _id: carerId, isDeleted: false, isVerified: true, verificationStatus: 'verified', acceptingBookings: true }).select('_id services platformFeePercent availability timezone'),
    Service.findOne({ _id: serviceId, isActive: true }),
  ]);
  if (!carer || !service) return res.status(404).json({ message: 'Service or available carer not found' });
  if (carer.services.length && !carer.services.some((id) => String(id) === String(service._id))) {
    return res.status(400).json({ message: 'Carer does not provide this service' });
  }
  const safeHours = Math.max(1, Number(hours) || 1);
  const safeSessions = Math.max(1, Number(numSessions) || 1);
  const end = new Date(start.getTime() + safeHours * 3_600_000);
  const available = !(await hasScheduleConflict(carer._id, start, end)) && isWithinAvailability(start, end, carer.availability, carer.timezone);
  const unitPrice = Number(service.price || service.basePrice);
  const platformFeePercent = Number(carer.platformFeePercent || 10);
  const pricing = calculateBookingPrice({ unitPrice, hours: safeHours, sessions: safeSessions, platformFeePercent });
  const totalPrice = pricing.totalPrice;
  res.json({
    available,
    scheduledAt: start,
    scheduledEndAt: end,
    unitPrice,
    hours: safeHours,
    sessions: safeSessions,
    totalPrice,
    platformFeePercent,
    platformFeeAmount: pricing.platformFeeAmount,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: AuthRequest, res: Response) => {
  const {
    carerId,
    serviceId,
    scheduledAt,
    address,
    contactName,
    contactPhone,
    city,
    district,
    fullAddress,
    careFor,
    pregnancyWeek,
    expectedBirthDate,
    babyBirthDate,
    birthMethod,
    motherCondition,
    babyCondition,
    allergies,
    medicalNotes,
    notes,
    numSessions,
    hours,
    serviceMode,
    latitude,
    longitude,
  } = req.body;

  try {
    const resolvedAddress = String(fullAddress || address || '').trim();
    const resolvedPhone = String(contactPhone || '').trim();
    const scheduledDate = new Date(scheduledAt);

    if (!carerId || !serviceId || !scheduledAt || !resolvedPhone || !resolvedAddress) {
      return res.status(400).json({ message: 'Carer, service, scheduled time, contact phone and full address are required' });
    }

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Thời gian đặt lịch phải ở trong tương lai' });
    }

    const [carer, service] = await Promise.all([
      Carer.findById(carerId).select('platformFeePercent isVerified verificationStatus isDeleted services availability timezone'),
      Service.findOne({ _id: serviceId, isActive: true }).select('_id price basePrice'),
    ]);

    if (!carer || carer.isDeleted) {
      return res.status(404).json({ message: 'Carer not found' });
    }

    if (!service) {
      return res.status(404).json({ message: 'Dịch vụ không tồn tại hoặc đã ngừng hoạt động' });
    }

    if (!carer.isVerified || (carer.verificationStatus && carer.verificationStatus !== 'verified')) {
      return res.status(400).json({ message: 'Chuyên gia này chưa được xác minh để nhận lịch' });
    }

    if (carer.services?.length && !carer.services.some((item: any) => String(item) === String(serviceId))) {
      return res.status(400).json({ message: 'Chuyên gia không cung cấp dịch vụ đã chọn' });
    }

    const mode = serviceMode === 'online' ? 'online' : 'at_home';
    if (mode === 'at_home' && (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)))) {
      return res.status(400).json({ message: 'Bắt buộc phải có tọa độ GPS hợp lệ cho dịch vụ tại nhà' });
    }

    const safeSessions = Math.max(1, Number(numSessions) || 1);
    const safeHours = Math.max(1, Number(hours) || 1);
    const unitPrice = Number(service.price || service.basePrice || 0);
    const calculatedTotal = unitPrice * safeHours * safeSessions;
    
    // Generate occurrences
    const occurrences = [];
    let occStart = new Date(scheduledDate);
    
    if (!isWithinAvailability(occStart, new Date(occStart.getTime() + safeHours * 3600000), carer.availability, carer.timezone)) {
       return res.status(400).json({ message: 'Thời gian đặt lịch bắt đầu không nằm trong giờ làm việc của chuyên gia' });
    }

    let safetyCounter = 0;
    while(occurrences.length < safeSessions && safetyCounter < 100) {
      safetyCounter++;
      const occEnd = new Date(occStart.getTime() + safeHours * 3_600_000);
      
      if (isWithinAvailability(occStart, occEnd, carer.availability, carer.timezone)) {
        occurrences.push({ scheduledAt: occStart, scheduledEndAt: occEnd });
      }
      occStart = new Date(occStart);
      occStart.setDate(occStart.getDate() + 1);
    }
    
    if (occurrences.length < safeSessions) {
      return res.status(409).json({ message: 'Chuyên gia không đủ lịch trống (theo tuần) để xếp đủ số buổi' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Re-check conflict inside transaction
      for (const occ of occurrences) {
        if (await hasScheduleConflict(carer._id, occ.scheduledAt, occ.scheduledEndAt)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({ message: `Chuyên gia đã kẹt lịch vào lúc ${occ.scheduledAt.toLocaleString()}` });
        }
      }

      const booking = await Booking.create([{
        parent: req.user!._id,
        carer: carerId,
        service: serviceId,
        status: BookingStatus.PENDING_CARER,
        scheduledAt: scheduledDate,
        scheduledEndAt: occurrences.length > 0 ? occurrences[occurrences.length - 1]!.scheduledEndAt : new Date(scheduledDate.getTime() + safeHours * 3600000),
        occurrences,
        serviceMode: mode,
        location: mode === 'at_home'
          ? { type: 'Point', coordinates: [Number(longitude), Number(latitude)] }
          : undefined,
        address: resolvedAddress,
        contactName,
        contactPhone: resolvedPhone,
        city,
        district,
        fullAddress: resolvedAddress,
        careFor,
        pregnancyWeek,
        expectedBirthDate,
        babyBirthDate,
        birthMethod,
        motherCondition,
        babyCondition,
        allergies,
        medicalNotes,
        notes,
        totalPrice: calculatedTotal,
        numSessions: safeSessions,
        hours: safeHours,
        priceSnapshot: {
          unitPrice,
          hours: safeHours,
          sessions: safeSessions,
          platformFeePercent: Number(carer.platformFeePercent ?? 10),
        },
        statusHistory: [{ status: BookingStatus.PENDING_CARER, changedAt: new Date(), changedBy: req.user!._id }],
      }], { session });

      const newBooking = booking[0];
      if (!newBooking) throw new Error('Booking creation failed');

      calculatePayoutAmounts(newBooking, carer);
      await newBooking.save({ session });
      await session.commitTransaction();
      session.endSession();

      await createNotification({ userId: carer.user, type: 'booking_new', title: 'Yêu cầu chăm sóc mới', body: 'Bạn có một yêu cầu đặt lịch mới cần phản hồi.', data: { bookingId: newBooking._id } });

      return res.status(201).json(newBooking);
    } catch (txError: any) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }


  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(400).json({ message: error.message || 'Dữ liệu đặt lịch không hợp lệ' });
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    let filter: Record<string, any> = { parent: req.user!._id, isDeleted: false };

    if (req.user!.role === 'carer') {
      const carer = await getCarerForUser(req.user!._id);

      if (!carer) {
        return res.json([]);
      }

      filter = { carer: carer._id, isDeleted: false };
    }

    if (req.query.status) filter.status = String(req.query.status).includes(',')
      ? { $in: String(req.query.status).split(',') }
      : req.query.status;
    if (req.query.from || req.query.to) {
      filter.scheduledAt = {};
      if (req.query.from) filter.scheduledAt.$gte = new Date(String(req.query.from));
      if (req.query.to) filter.scheduledAt.$lte = new Date(String(req.query.to));
    }
    const pagination = getPagination(req.query, 20);
    const query = populateBooking(Booking.find(filter).sort({ scheduledAt: -1 }));
    if (!pagination.enabled) return res.json(await query);
    const [items, total] = await Promise.all([
      populateBooking(Booking.find(filter).sort({ scheduledAt: -1 }).skip(pagination.skip).limit(pagination.limit)),
      Booking.countDocuments(filter),
    ]);
    res.json(paginationPayload(items, total, pagination.page, pagination.limit));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get one booking visible to current user
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await populateBooking(Booking.findOne({ _id: req.params.id, isDeleted: false }));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user!.role === 'admin') {
      return res.json(booking);
    }

    if (req.user!.role === 'carer') {
      const carer = await getCarerForUser(req.user!._id);
      if (carer && ensureCarerOwner(booking, carer._id)) {
        return res.json(booking);
      }
    }

    if (ensureBookingOwner(booking, req.user!._id)) {
      return res.json(booking);
    }

    return res.status(403).json({ message: 'Not authorized to view this booking' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Carer accepts booking
// @route   PATCH /api/bookings/:id/accept
// @access  Private/Carer
export const acceptBooking = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await getCarerForUser(req.user!._id);

    if (!carer) {
      return res.status(403).json({ message: 'Only assigned carers can accept bookings' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!ensureCarerOwner(booking, carer._id)) {
      return res.status(403).json({ message: 'Not authorized to accept this booking' });
    }

    if (!(await ensureCarerCanOperateBookings(carer._id, res))) {
      return;
    }
    if (!carer.isVerified || carer.verificationStatus !== 'verified' || !carer.acceptingBookings) {
      return res.status(403).json({ message: 'Carer must be verified and accepting bookings' });
    }

    if (booking.status !== BookingStatus.PENDING_CARER && booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ message: 'Only pending bookings can be accepted' });
    }

    const end = booking.scheduledEndAt || new Date(booking.scheduledAt.getTime() + Math.max(1, booking.hours) * 3_600_000);
    if (await hasScheduleConflict(carer._id, booking.scheduledAt, end, booking._id)) {
      return res.status(409).json({ message: 'Booking conflicts with another accepted appointment' });
    }
    booking.scheduledEndAt = end;
    booking.status = BookingStatus.ACCEPTED_PENDING_PAYMENT;
    booking.acceptedAt = new Date();
    booking.statusHistory.push({ status: booking.status, changedAt: new Date(), changedBy: req.user!._id });
    calculatePayoutAmounts(booking, carer);

    const updatedBooking = await booking.save();
    await createNotification({ userId: booking.parent, type: 'booking_accepted', title: 'Yêu cầu đã được chấp nhận', body: 'Chuyên gia đã chấp nhận lịch chăm sóc của bạn.', data: { bookingId: booking._id } });
    await writeAudit(req, 'booking.accept', 'Booking', booking._id, { after: { status: booking.status } });
    res.json(await populateBooking(Booking.findById(updatedBooking._id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Carer rejects booking
// @route   PATCH /api/bookings/:id/reject
// @access  Private/Carer
export const rejectBooking = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await getCarerForUser(req.user!._id);

    if (!carer) {
      return res.status(403).json({ message: 'Only assigned carers can reject bookings' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!ensureCarerOwner(booking, carer._id)) {
      return res.status(403).json({ message: 'Not authorized to reject this booking' });
    }

    if (booking.status !== BookingStatus.PENDING_CARER && booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });
    }

    booking.status = BookingStatus.REJECTED;
    booking.rejectedAt = new Date();
    booking.rejectionReason = String(req.body.rejectionReason || req.body.reason || '').trim();
    if (!booking.rejectionReason) return res.status(400).json({ message: 'Rejection reason is required' });
    booking.statusHistory.push({ status: booking.status, changedAt: new Date(), changedBy: req.user!._id, reason: booking.rejectionReason });

    const updatedBooking = await booking.save();
    await createNotification({ userId: booking.parent, type: 'booking_rejected', title: 'Yêu cầu chưa được nhận', body: booking.rejectionReason, data: { bookingId: booking._id } });
    await writeAudit(req, 'booking.reject', 'Booking', booking._id, { metadata: { reason: booking.rejectionReason } });
    res.json(await populateBooking(Booking.findById(updatedBooking._id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create payOS checkout link after carer accepted
// @route   POST /api/bookings/:id/payment-link
// @access  Private/Parent
export const createPaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const payos = getPayOSClient();

    if (!payos) {
      return res.status(503).json({ message: 'payOS is not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY and PAYOS_CHECKSUM_KEY.' });
    }

    const booking = await populateBooking(Booking.findOne({ _id: req.params.id, isDeleted: false }));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!ensureBookingOwner(booking, req.user!._id)) {
      return res.status(403).json({ message: 'Not authorized to pay this booking' });
    }

    if (booking.status === BookingStatus.PAID_CONFIRMED || booking.status === BookingStatus.CONFIRMED) {
      return res.json({
        booking,
        checkoutUrl: booking.payosCheckoutUrl,
        qrCode: booking.payosQrCode,
      });
    }

    if (booking.status !== BookingStatus.ACCEPTED_PENDING_PAYMENT) {
      return res.status(400).json({ message: 'Booking must be accepted by the carer before payment' });
    }

    if (booking.payosPaymentLinkId && booking.payosStatus === 'PENDING') {
      try {
        await payos.paymentRequests.cancel(booking.payosOrderCode, 'Tạo lại link thanh toán');
      } catch (err) {
        console.error('Failed to cancel existing payment link', err);
      }
    }

    const appPublicUrl = process.env.APP_PUBLIC_URL || req.get('origin') || 'http://localhost:5173';
    const orderCode = Number(`${Date.now()}${String(booking._id).slice(-4).replace(/\D/g, '').padStart(4, '0')}`.slice(-12));
    const amount = Math.round(Number(booking.totalPrice || 0));
    const serviceTitle = booking.service?.title || 'Dich vu MomMate';
    const description = `MM${orderCode}`;

    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      buyerName: `${booking.parent?.firstName || ''} ${booking.parent?.lastName || ''}`.trim(),
      buyerEmail: booking.parent?.email,
      buyerPhone: booking.parent?.phoneNumber,
      returnUrl: `${appPublicUrl}/payment?bookingId=${booking._id}&payment=success`,
      cancelUrl: `${appPublicUrl}/payment?bookingId=${booking._id}&payment=cancelled`,
      items: [
        {
          name: serviceTitle.slice(0, 80),
          quantity: 1,
          price: amount,
        },
      ],
    });

    booking.payosOrderCode = paymentLink.orderCode;
    booking.payosPaymentLinkId = paymentLink.paymentLinkId;
    booking.payosCheckoutUrl = paymentLink.checkoutUrl;
    booking.payosQrCode = paymentLink.qrCode;
    booking.payosStatus = paymentLink.status;

    const updatedBooking = await booking.save();

    res.json({
      booking: updatedBooking,
      ...paymentLink,
    });
  } catch (error: any) {
    console.error('payOS payment link error:', error);
    res.status(500).json({ message: error.message || 'Cannot create payOS payment link' });
  }
};

export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  const booking = await populateBooking(Booking.findOne({ _id: req.params.id, isDeleted: false }));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!(await canAccessBooking(booking, req))) return res.status(403).json({ message: 'Not authorized to view this payment' });

  const transaction = await PaymentTransaction.findOne({ booking: booking._id })
    .sort({ processedAt: -1 })
    .select('provider orderCode paymentLinkId amount status processedAt createdAt')
    .lean();
  const paid = [BookingStatus.PAID_CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(booking.status);

  res.json({
    bookingId: booking._id,
    bookingStatus: booking.status,
    paymentStatus: booking.payosStatus || (paid ? 'PAID' : 'NOT_CREATED'),
    paid,
    paidAt: booking.paidAt,
    amount: booking.totalPrice,
    transaction,
  });
};

export const downloadInvoice = async (req: AuthRequest, res: Response) => {
  const booking = await populateBooking(Booking.findOne({ _id: req.params.id, isDeleted: false }));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!(await canAccessBooking(booking, req))) return res.status(403).json({ message: 'Not authorized to view this invoice' });
  if (![BookingStatus.PAID_CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(booking.status)) {
    return res.status(409).json({ message: 'Invoice is available after payment is confirmed' });
  }

  const transaction = await PaymentTransaction.findOne({ booking: booking._id }).sort({ processedAt: -1 }).lean();
  const invoiceNumber = `MM-${String(booking._id).slice(-8).toUpperCase()}`;
  const parentName = `${booking.parent?.firstName || ''} ${booking.parent?.lastName || ''}`.trim();
  const carerName = `${booking.carer?.user?.firstName || ''} ${booking.carer?.user?.lastName || ''}`.trim();
  const issuedAt = booking.paidAt || booking.paymentConfirmedAt || new Date();
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${escapeHtml(invoiceNumber)}</title>
<style>body{font:14px Arial,sans-serif;color:#18332b;margin:40px;max-width:780px}header{display:flex;justify-content:space-between;border-bottom:2px solid #20835e;padding-bottom:18px}h1{margin:0;color:#16724f}.meta{text-align:right}.row{display:flex;justify-content:space-between;border-bottom:1px solid #e1e8e5;padding:12px 0}.total{font-size:20px;font-weight:700}.note{margin-top:28px;color:#66756f}</style></head>
<body><header><div><h1>MomMate</h1><p>Hóa đơn dịch vụ chăm sóc</p></div><div class="meta"><strong>${escapeHtml(invoiceNumber)}</strong><br>${escapeHtml(new Date(issuedAt).toLocaleString('vi-VN'))}</div></header>
<h2>Thông tin giao dịch</h2>
<div class="row"><span>Khách hàng</span><strong>${escapeHtml(parentName)}</strong></div>
<div class="row"><span>Dịch vụ</span><strong>${escapeHtml(booking.service?.title)}</strong></div>
<div class="row"><span>Chuyên gia</span><strong>${escapeHtml(carerName)}</strong></div>
<div class="row"><span>Lịch chăm sóc</span><strong>${escapeHtml(new Date(booking.scheduledAt).toLocaleString('vi-VN'))}</strong></div>
<div class="row"><span>Mã giao dịch PayOS</span><strong>${escapeHtml(transaction?.paymentLinkId || booking.payosPaymentLinkId || booking.payosOrderCode)}</strong></div>
<div class="row total"><span>Tổng thanh toán</span><strong>${escapeHtml(Number(booking.totalPrice).toLocaleString('vi-VN'))} VNĐ</strong></div>
<p class="note">Hóa đơn điện tử được tạo từ dữ liệu thanh toán đã xác minh của MomMate.</p></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.html"`);
  res.send(html);
};

export const getRefundStatus = async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!(await canAccessBooking(booking, req))) return res.status(403).json({ message: 'Not authorized to view this refund' });

  const refund = await Refund.findOne({ booking: booking._id })
    .sort({ createdAt: -1 })
    .select('amount reason provider status providerReference failureReason statusHistory reviewedAt createdAt updatedAt')
    .lean();
  res.json({
    bookingId: booking._id,
    cancellationStatus: booking.cancellationStatus,
    refundStatus: booking.refundStatus,
    refund,
  });
};

// @desc    payOS payment webhook
// @route   POST /api/bookings/payos/webhook
// @access  Public
export const handlePayOSWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const payos = getPayOSClient();

    if (!payos) {
      return res.status(503).json({ message: 'payOS is not configured' });
    }

    const webhookData = await payos.webhooks.verify(req.body);
    const booking = await Booking.findOne({
      payosOrderCode: webhookData.orderCode,
      isDeleted: false,
    });

    if (!booking) {
      return res.json({ success: true, message: 'Booking not found, webhook acknowledged' });
    }

    const eventKey = `${webhookData.orderCode}:${webhookData.paymentLinkId || ''}:${webhookData.code}`;
    const existingEvent = await PaymentTransaction.exists({ eventKey });
    if (existingEvent) return res.json({ success: true, duplicate: true });
    booking.payosStatus = webhookData.code === '00' ? 'PAID' : webhookData.code;
    booking.payosPaymentLinkId = webhookData.paymentLinkId || booking.payosPaymentLinkId;

    if (PAYOS_PAID_STATUSES.has(webhookData.code) || req.body.success === true) {
      booking.status = BookingStatus.PAID_CONFIRMED;
      booking.paidAt = new Date();
      booking.paymentConfirmedAt = new Date();
      booking.carerPayoutStatus = CarerPayoutStatus.UNPAID;
    }

    await booking.save();
    await PaymentTransaction.create({
      booking: booking._id,
      orderCode: webhookData.orderCode,
      paymentLinkId: webhookData.paymentLinkId,
      amount: booking.totalPrice,
      status: booking.payosStatus,
      eventKey,
      providerPayload: webhookData,
    });
    if (PAYOS_PAID_STATUSES.has(webhookData.code) || req.body.success === true) {
      const carer = await Carer.findById(booking.carer).select('user');
      if (carer) await createNotification({ userId: carer.user, type: 'booking_paid', title: 'Booking đã thanh toán', body: 'Phụ huynh đã hoàn tất thanh toán. Lịch chăm sóc đã được xác nhận.', data: { bookingId: booking._id } });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('payOS webhook verification failed:', error);
    res.status(400).json({ message: error.message || 'Invalid payOS webhook' });
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, override } = req.body;
    const reason = String(req.body.reason || '').trim();

    if (!Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update status directly' });
    }

    const transitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.PENDING_CARER, BookingStatus.REJECTED, BookingStatus.CANCELLED],
      [BookingStatus.PENDING_CARER]: [BookingStatus.ACCEPTED_PENDING_PAYMENT, BookingStatus.REJECTED, BookingStatus.CANCELLED],
      [BookingStatus.ACCEPTED_PENDING_PAYMENT]: [BookingStatus.PAID_CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.PAID_CONFIRMED]: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.REJECTED]: [],
    };
    const isNormalTransition = transitions[booking.status]?.includes(status);
    if (!isNormalTransition && !override) {
      return res.status(409).json({ message: `Transition from ${booking.status} to ${status} requires an audited override` });
    }
    if (override && !reason) {
      return res.status(400).json({ message: 'Override reason is required' });
    }
    const beforeStatus = booking.status;
    booking.status = status;
    if (status === BookingStatus.PAID_CONFIRMED || status === BookingStatus.CONFIRMED) {
      booking.paymentConfirmedAt = booking.paymentConfirmedAt || new Date();
      booking.paidAt = booking.paidAt || new Date();
      booking.payosStatus = booking.payosStatus || 'PAID';
    }
    if (status === BookingStatus.COMPLETED) {
      booking.carerPayoutStatus = CarerPayoutStatus.READY;
    }
    booking.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user!._id,
      reason: reason || (override ? 'Admin override' : 'Admin state transition'),
    });
    const updatedBooking = await booking.save();
    const carer = await Carer.findById(booking.carer).select('user');
    const recipients = [booking.parent, carer?.user].filter(Boolean);
    await Promise.all(recipients.map((userId) => createNotification({
      userId: userId!,
      type: 'booking_status',
      title: 'Cập nhật trạng thái booking',
      body: `Trạng thái mới: ${status}`,
      data: { bookingId: booking._id, status },
    })));
    await writeAudit(req, override ? 'booking.status_override' : 'booking.status_transition', 'Booking', booking._id, {
      before: { status: beforeStatus },
      after: { status },
      metadata: { reason, override: Boolean(override) },
    });
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get schedule by role/date range
// @route   GET /api/bookings/schedule
// @access  Private
export const getSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { isDeleted: false };
    const { from, to, status } = req.query;

    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(String(from));
      if (to) filter.scheduledAt.$lte = new Date(String(to));
    }

    if (status) {
      filter.status = status;
    }

    if (req.user!.role === 'parent') {
      filter.parent = req.user!._id;
    }

    if (req.user!.role === 'carer') {
      const carer = await getCarerForUser(req.user!._id);

      if (!carer) {
        return res.json([]);
      }

      filter.carer = carer._id;
    }

    const bookings = await populateBooking(Booking.find(filter).sort({ scheduledAt: 1 }));
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Manual payment proof legacy endpoint
// @route   PATCH /api/bookings/:id/payment-proof
// @access  Private
export const submitPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      parent: req.user!._id,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.paymentProofUrl = req.body.paymentProofUrl;
    booking.paymentNote = req.body.paymentNote;
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Confirm manual bank transfer
// @route   PATCH /api/bookings/:id/payment-confirm
// @access  Private/Admin
export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.paymentConfirmedAt = new Date();
    booking.paidAt = booking.paidAt || new Date();
    booking.payosStatus = booking.payosStatus || 'PAID';
    booking.status = BookingStatus.PAID_CONFIRMED;

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Carer check in
// @route   PATCH /api/bookings/:id/check-in
// @access  Private/Carer
export const checkInBooking = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await getCarerForUser(req.user!._id);
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!carer || !booking || !ensureCarerOwner(booking, carer._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!(await ensureCarerCanOperateBookings(carer._id, res))) {
      return;
    }

    if (booking.status !== BookingStatus.PAID_CONFIRMED && booking.status !== BookingStatus.CONFIRMED) {
      return res.status(400).json({ message: 'Only paid bookings can be checked in' });
    }
    if (process.env.ATTENDANCE_ALLOW_ANYTIME !== 'true' && !isWithinCheckInWindow(booking.scheduledAt)) {
      return res.status(400).json({ message: 'Check-in is only available from 15 minutes before to 30 minutes after the scheduled start' });
    }
    if (booking.serviceMode !== 'online') {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ message: 'GPS location is required for at-home check-in' });
      }
      const coordinates = booking.location?.coordinates;
      if (coordinates?.length === 2) {
        const distance = distanceMeters(
          { latitude, longitude },
          { latitude: coordinates[1], longitude: coordinates[0] }
        );
        if (distance > Number(process.env.ATTENDANCE_RADIUS_METERS || 300)) {
          return res.status(403).json({ message: 'You are outside the allowed check-in radius', distanceMeters: Math.round(distance) });
        }
      }
      booking.checkInLocation = { latitude, longitude, accuracy: Number(req.body.accuracy) || undefined };
    }

    booking.status = BookingStatus.IN_PROGRESS;
    booking.checkInAt = new Date();
    booking.statusHistory.push({ status: booking.status, changedAt: new Date(), changedBy: req.user!._id });
    const updatedBooking = await booking.save();
    await createNotification({ userId: booking.parent, type: 'booking_check_in', title: 'Chuyên gia đã check-in', body: 'Ca chăm sóc đã bắt đầu.', data: { bookingId: booking._id }, email: false });
    await writeAudit(req, 'booking.check_in', 'Booking', booking._id, { after: { checkInAt: booking.checkInAt } });
    res.json(await populateBooking(Booking.findById(updatedBooking._id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Carer check out
// @route   PATCH /api/bookings/:id/check-out
// @access  Private/Carer
export const checkOutBooking = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await getCarerForUser(req.user!._id);
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!carer || !booking || !ensureCarerOwner(booking, carer._id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!(await ensureCarerCanOperateBookings(carer._id, res))) {
      return;
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      return res.status(400).json({ message: 'Only in-progress bookings can be checked out' });
    }
    const journal = await CareJournal.findOne({ booking: booking._id, carer: carer._id });
    if (!journal?.checklist?.safetyChecked || !journal.notes.trim()) {
      return res.status(400).json({ message: 'Care journal notes and safety checklist are required before check-out' });
    }

    booking.status = BookingStatus.COMPLETED;
    booking.checkOutAt = new Date();
    if (booking.serviceMode !== 'online' && Number.isFinite(Number(req.body.latitude)) && Number.isFinite(Number(req.body.longitude))) {
      booking.checkOutLocation = { latitude: Number(req.body.latitude), longitude: Number(req.body.longitude), accuracy: Number(req.body.accuracy) || undefined };
    }
    booking.carerPayoutStatus = CarerPayoutStatus.READY;
    booking.statusHistory.push({ status: booking.status, changedAt: new Date(), changedBy: req.user!._id });
    journal.completedAt = new Date();
    await journal.save();
    const updatedBooking = await booking.save();
    await createNotification({ userId: booking.parent, type: 'booking_completed', title: 'Ca chăm sóc đã hoàn thành', body: 'Nhật ký chăm sóc đã sẵn sàng để bạn xem.', data: { bookingId: booking._id } });
    await writeAudit(req, 'booking.check_out', 'Booking', booking._id, { after: { checkOutAt: booking.checkOutAt, payoutStatus: booking.carerPayoutStatus } });
    res.json(await populateBooking(Booking.findById(updatedBooking._id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getCareJournal = async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const carer = req.user!.role === 'carer' ? await getCarerForUser(req.user!._id) : null;
  const authorized = req.user!.role === 'admin'
    || String(booking.parent) === String(req.user!._id)
    || Boolean(carer && String(booking.carer) === String(carer._id));
  if (!authorized) return res.status(403).json({ message: 'Forbidden' });
  const journal = await CareJournal.findOne({ booking: booking._id });
  res.json(journal);
};

export const upsertCareJournal = async (req: AuthRequest, res: Response) => {
  const carer = await getCarerForUser(req.user!._id);
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!carer || !booking || String(booking.carer) !== String(carer._id)) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  if (![BookingStatus.PAID_CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)) {
    return res.status(400).json({ message: 'Care journal is not available for this booking status' });
  }
  const journal = await CareJournal.findOneAndUpdate(
    { booking: booking._id },
    {
      $set: {
        carer: carer._id,
        weightKg: req.body.weightKg,
        notes: String(req.body.notes || '').trim(),
        checklist: {
          medicationChecked: Boolean(req.body.checklist?.medicationChecked),
          safetyChecked: Boolean(req.body.checklist?.safetyChecked),
        },
        images: Array.isArray(req.body.images) ? req.body.images : [],
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(journal);
};

export const requestBookingChange = async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const carer = req.user!.role === 'carer' ? await getCarerForUser(req.user!._id) : null;
  const authorized = String(booking.parent) === String(req.user!._id)
    || Boolean(carer && String(booking.carer) === String(carer._id));
  if (!authorized) return res.status(403).json({ message: 'Forbidden' });

  if (![BookingStatus.PENDING_CARER, BookingStatus.ACCEPTED_PENDING_PAYMENT, BookingStatus.PAID_CONFIRMED, BookingStatus.CONFIRMED].includes(booking.status as any)) {
    return res.status(400).json({ message: 'Cannot modify booking in its current state' });
  }

  const type = req.body.type === 'cancel' ? 'cancel' : 'reschedule';
  const reason = String(req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ message: 'Reason is required' });
  const outside24Hours = isOutsideFreeCancellationWindow(booking.scheduledAt);
  let requestedScheduledAt: Date | undefined;
  if (type === 'reschedule') {
    requestedScheduledAt = new Date(req.body.scheduledAt);
    if (Number.isNaN(requestedScheduledAt.getTime()) || requestedScheduledAt <= new Date()) {
      return res.status(400).json({ message: 'A future scheduled time is required' });
    }
  }
  const changeRequest = await BookingChangeRequest.create({
    booking: booking._id,
    requestedBy: req.user!._id,
    type,
    requestedScheduledAt,
    reason,
    status: outside24Hours ? 'auto_approved' : 'pending',
  });
  if (outside24Hours) {
    if (type === 'reschedule' && requestedScheduledAt) {
      const end = new Date(requestedScheduledAt.getTime() + Math.max(1, booking.hours) * 3_600_000);
      const carerObj = await Carer.findById(booking.carer).select('availability timezone');
      
      if (
        (carerObj && !isWithinAvailability(requestedScheduledAt, end, carerObj.availability, carerObj.timezone)) ||
        await hasScheduleConflict(booking.carer, requestedScheduledAt, end, booking._id)
      ) {
        changeRequest.status = 'pending';
        await changeRequest.save();
      } else {
        booking.scheduledAt = requestedScheduledAt;
        booking.scheduledEndAt = end;
        await booking.save();
      }
    } else if (type === 'cancel') {
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationStatus = 'approved';
      booking.statusHistory.push({ status: booking.status, changedAt: new Date(), changedBy: req.user!._id, reason });
      if (booking.paidAt) {
        booking.refundStatus = 'pending';
        await Refund.create({ booking: booking._id, requestedBy: req.user!._id, amount: booking.totalPrice, reason });
      }
      await booking.save();
    }
  } else {
    booking.cancellationStatus = 'requested';
    await booking.save();
  }
  const otherUser = String(booking.parent) === String(req.user!._id)
    ? (await Carer.findById(booking.carer).select('user'))?.user
    : booking.parent;
  if (otherUser) await createNotification({ userId: otherUser, type: 'booking_change', title: 'Yêu cầu thay đổi lịch', body: reason, data: { bookingId: booking._id, changeRequestId: changeRequest._id } });
  res.status(201).json(changeRequest);
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { isDeleted: false };
    const { status, carerId, from, to, payment } = req.query;
    const pagination = getPagination(req.query, 20);

    if (status) filter.status = status;
    if (carerId) filter.carer = carerId;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(String(from));
      if (to) filter.scheduledAt.$lte = new Date(String(to));
    }
    if (payment === 'paid') filter.paidAt = { $exists: true };
    if (payment === 'unpaid') filter.paidAt = { $exists: false };
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      const [parents, carers, services] = await Promise.all([
        (await import('../models/User.js')).default.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).select('_id'),
        Carer.find({ workplaceName: { $regex: search, $options: 'i' } }).select('_id user'),
        Service.find({ title: { $regex: search, $options: 'i' } }).select('_id'),
      ]);
      filter.$or = [
        { parent: { $in: parents.map((item) => item._id) } },
        { carer: { $in: carers.map((item) => item._id) } },
        { service: { $in: services.map((item) => item._id) } },
        { payosPaymentLinkId: { $regex: search, $options: 'i' } },
      ];
    }

    const query = populateBooking(Booking.find(filter).sort({ createdAt: -1 }));
    if (!pagination.enabled) return res.json(await query);
    const [items, total] = await Promise.all([
      populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit)),
      Booking.countDocuments(filter),
    ]);
    res.json(paginationPayload(items, total, pagination.page, pagination.limit));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const markPayoutPaid = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== BookingStatus.COMPLETED) {
      return res.status(400).json({ message: 'Chỉ ca chăm sóc đã hoàn tất mới được đối soát' });
    }
    const reference = String(req.body.reference || '').trim();
    if (!reference) return res.status(400).json({ message: 'Payout reference is required' });
    booking.carerPayoutStatus = CarerPayoutStatus.PAID;
    booking.payoutPaidAt = new Date();
    booking.payoutReference = reference;
    booking.payoutNote = String(req.body.note || '').trim();
    await booking.save();
    const carer = await Carer.findById(booking.carer).select('user');
    if (carer) await createNotification({ userId: carer.user, type: 'payout_paid', title: 'Khoản đối soát đã được thanh toán', body: `Mã tham chiếu: ${reference}`, data: { bookingId: booking._id } });
    await writeAudit(req, 'payout.mark_paid', 'Booking', booking._id, { after: { payoutStatus: booking.carerPayoutStatus, reference } });
    res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot update payout' });
  }
};
