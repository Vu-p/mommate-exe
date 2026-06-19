import type { Response } from 'express';
import { PayOS } from '@payos/node';
import Booking, { BookingStatus, CarerPayoutStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Service from '../models/Service.js';
import type { AuthRequest } from '../middleware/auth.js';
import { hasSignedContractForCarer } from '../utils/contracts.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';

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
  Carer.findOne({ user: userId, isDeleted: false }).select('_id platformFeePercent');

const calculatePayoutAmounts = (booking: any, carer: any) => {
  const totalPrice = Number(booking.totalPrice || 0);
  const platformFeePercent = Number(carer?.platformFeePercent ?? 10);
  const platformFeeAmount = Math.round((totalPrice * platformFeePercent) / 100);
  const carerPayoutAmount = Math.max(0, totalPrice - platformFeeAmount);

  booking.platformFeeAmount = platformFeeAmount;
  booking.carerPayoutAmount = carerPayoutAmount;
};

const ensureBookingOwner = (booking: any, userId: any) => String(booking.parent) === String(userId);

const ensureCarerOwner = (booking: any, carerId: any) => String(booking.carer) === String(carerId);

const ensureCarerCanOperateBookings = async (carerId: any, res: Response) => {
  const hasSignedContract = await hasSignedContractForCarer(carerId);

  if (!hasSignedContract) {
    res.status(403).json({ message: 'Carer must sign the MomMate contract before receiving or performing bookings' });
    return false;
  }

  return true;
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
    totalPrice,
    numSessions,
    hours,
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
      Carer.findById(carerId).select('platformFeePercent isVerified verificationStatus isDeleted services'),
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

    const safeSessions = Math.max(1, Number(numSessions) || 1);
    const safeHours = Math.max(1, Number(hours) || 1);
    const submittedTotal = Number(totalPrice);
    const fallbackTotal = Number(service.price || service.basePrice || 0) * safeHours * safeSessions;

    const booking = await Booking.create({
      parent: req.user!._id,
      carer: carerId,
      service: serviceId,
      status: BookingStatus.PENDING_CARER,
      scheduledAt: scheduledDate,
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
      totalPrice: Number.isFinite(submittedTotal) && submittedTotal > 0 ? submittedTotal : fallbackTotal,
      numSessions: safeSessions,
      hours: safeHours,
    });

    calculatePayoutAmounts(booking, carer);
    await booking.save();

    res.status(201).json(booking);
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

    const bookings = await populateBooking(Booking.find(filter).sort({ createdAt: -1 }));
    res.json(bookings);
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

    if (booking.status !== BookingStatus.PENDING_CARER && booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ message: 'Only pending bookings can be accepted' });
    }

    booking.status = BookingStatus.ACCEPTED_PENDING_PAYMENT;
    booking.acceptedAt = new Date();
    calculatePayoutAmounts(booking, carer);

    const updatedBooking = await booking.save();
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
    booking.rejectionReason = req.body.rejectionReason || req.body.reason || '';

    const updatedBooking = await booking.save();
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

    if (booking.payosCheckoutUrl && booking.payosStatus === 'PENDING') {
      return res.json({
        booking,
        checkoutUrl: booking.payosCheckoutUrl,
        qrCode: booking.payosQrCode,
      });
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
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      paymentLinkId: paymentLink.paymentLinkId,
      orderCode: paymentLink.orderCode,
    });
  } catch (error: any) {
    console.error('payOS payment link error:', error);
    res.status(500).json({ message: error.message || 'Cannot create payOS payment link' });
  }
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

    booking.payosStatus = webhookData.code === '00' ? 'PAID' : webhookData.code;
    booking.payosPaymentLinkId = webhookData.paymentLinkId || booking.payosPaymentLinkId;

    if (PAYOS_PAID_STATUSES.has(webhookData.code) || req.body.success === true) {
      booking.status = BookingStatus.PAID_CONFIRMED;
      booking.paidAt = new Date();
      booking.paymentConfirmedAt = new Date();
      booking.carerPayoutStatus = CarerPayoutStatus.UNPAID;
    }

    await booking.save();
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
    const { status } = req.body;

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

    booking.status = status;
    if (status === BookingStatus.PAID_CONFIRMED || status === BookingStatus.CONFIRMED) {
      booking.paymentConfirmedAt = booking.paymentConfirmedAt || new Date();
      booking.paidAt = booking.paidAt || new Date();
      booking.payosStatus = booking.payosStatus || 'PAID';
    }
    if (status === BookingStatus.COMPLETED) {
      booking.carerPayoutStatus = CarerPayoutStatus.READY;
    }
    const updatedBooking = await booking.save();
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

    booking.status = BookingStatus.IN_PROGRESS;
    booking.checkInAt = new Date();
    const updatedBooking = await booking.save();
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

    booking.status = BookingStatus.COMPLETED;
    booking.checkOutAt = new Date();
    booking.carerPayoutStatus = CarerPayoutStatus.READY;
    const updatedBooking = await booking.save();
    res.json(await populateBooking(Booking.findById(updatedBooking._id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
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
    booking.carerPayoutStatus = CarerPayoutStatus.PAID;
    booking.payoutPaidAt = new Date();
    booking.payoutReference = String(req.body.reference || '').trim();
    booking.payoutNote = String(req.body.note || '').trim();
    await booking.save();
    res.json(await populateBooking(Booking.findById(booking._id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot update payout' });
  }
};
