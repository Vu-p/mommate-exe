import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import BookingChangeRequest from '../models/BookingChangeRequest.js';
import Carer from '../models/Carer.js';
import Refund from '../models/Refund.js';
import { createNotification } from '../services/notificationService.js';
import { writeAudit } from '../utils/audit.js';
import { getPagination, paginationPayload } from '../utils/pagination.js';
import { processRefund } from '../services/refundService.js';

export const verifyCarer = async (req: AuthRequest, res: Response) => {
  const status = String(req.body.status);
  if (!['verified', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: 'Invalid verification status' });
  const carer = await Carer.findOne({ _id: req.params.id, isDeleted: false }).populate('user', 'firstName lastName email');
  if (!carer) return res.status(404).json({ message: 'Carer not found' });
  const before = { verificationStatus: carer.verificationStatus, isVerified: carer.isVerified };
  carer.verificationStatus = status as any;
  carer.isVerified = status === 'verified';
  carer.applicationStatus = status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : carer.applicationStatus;
  carer.verificationRejectionReason = status === 'rejected' ? String(req.body.reason || '').trim() : undefined;
  if (status === 'rejected' && !carer.verificationRejectionReason) return res.status(400).json({ message: 'Rejection reason is required' });
  await carer.save();
  await createNotification({
    userId: (carer.user as any)._id,
    type: 'carer_verification',
    title: status === 'verified' ? 'Hồ sơ chuyên gia đã được xác minh' : 'Cập nhật xét duyệt hồ sơ',
    body: status === 'verified' ? 'Bạn có thể bắt đầu nhận booking sau khi ký hợp đồng.' : carer.verificationRejectionReason || 'Hồ sơ đang được xem xét.',
    data: { carerId: carer._id, status },
  });
  await writeAudit(req, 'carer.verify', 'Carer', carer._id, { before, after: { verificationStatus: status, isVerified: carer.isVerified }, metadata: { reason: carer.verificationRejectionReason } });
  res.json(carer);
};

export const getChangeRequests = async (req: AuthRequest, res: Response) => {
  const pagination = getPagination(req.query, 20);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    BookingChangeRequest.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('requestedBy', 'firstName lastName role').populate('booking'),
    BookingChangeRequest.countDocuments(filter),
  ]);
  res.json(paginationPayload(items, total, pagination.page, pagination.limit));
};

export const reviewChangeRequest = async (req: AuthRequest, res: Response) => {
  const changeRequest = await BookingChangeRequest.findById(req.params.id);
  if (!changeRequest || changeRequest.status !== 'pending') return res.status(404).json({ message: 'Pending change request not found' });
  const booking = await Booking.findById(changeRequest.booking);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!['approved', 'rejected'].includes(String(req.body.status))) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }
  const approve = req.body.status === 'approved';
  if (approve && changeRequest.type === 'reschedule' && changeRequest.requestedScheduledAt) {
    const requestedEnd = new Date(changeRequest.requestedScheduledAt.getTime() + booking.hours * 3_600_000);
    const conflict = await Booking.exists({
      _id: { $ne: booking._id },
      carer: booking.carer,
      status: { $in: [
        BookingStatus.ACCEPTED_PENDING_PAYMENT,
        BookingStatus.PAID_CONFIRMED,
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ] },
      scheduledAt: { $lt: requestedEnd },
      scheduledEndAt: { $gt: changeRequest.requestedScheduledAt },
      isDeleted: false,
    });
    if (conflict) return res.status(409).json({ message: 'Requested schedule conflicts with another booking' });
  }
  changeRequest.status = approve ? 'approved' : 'rejected';
  changeRequest.reviewedBy = req.user!._id;
  changeRequest.reviewedAt = new Date();
  changeRequest.reviewNote = String(req.body.note || '').trim();
  if (approve && changeRequest.type === 'cancel') {
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationStatus = 'approved';
    if (booking.paidAt) {
      booking.refundStatus = 'pending';
      await Refund.create({ booking: booking._id, requestedBy: changeRequest.requestedBy, reviewedBy: req.user!._id, reviewedAt: new Date(), amount: booking.totalPrice, reason: changeRequest.reason });
    }
  } else if (approve && changeRequest.requestedScheduledAt) {
    booking.scheduledAt = changeRequest.requestedScheduledAt;
    booking.scheduledEndAt = new Date(changeRequest.requestedScheduledAt.getTime() + booking.hours * 3_600_000);
  } else if (!approve) {
    booking.cancellationStatus = 'rejected';
  }
  await Promise.all([changeRequest.save(), booking.save()]);
  await createNotification({ userId: changeRequest.requestedBy, type: 'booking_change_review', title: approve ? 'Yêu cầu đã được duyệt' : 'Yêu cầu bị từ chối', body: changeRequest.reviewNote || changeRequest.reason, data: { bookingId: booking._id, changeRequestId: changeRequest._id } });
  await writeAudit(req, 'booking_change.review', 'BookingChangeRequest', changeRequest._id, { after: { status: changeRequest.status }, metadata: { note: changeRequest.reviewNote } });
  res.json(changeRequest);
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  const pagination = getPagination(req.query, 50);
  const filter: Record<string, unknown> = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.entityId) filter.entityId = req.query.entityId;
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('actor', 'firstName lastName email role'),
    AuditLog.countDocuments(filter),
  ]);
  res.json(paginationPayload(items, total, pagination.page, pagination.limit));
};

export const getRefunds = async (req: AuthRequest, res: Response) => {
  const pagination = getPagination(req.query, 20);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Refund.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate({
        path: 'booking',
        populate: [
          { path: 'parent', select: 'firstName lastName email' },
          { path: 'service', select: 'title' },
        ],
      })
      .populate('requestedBy reviewedBy', 'firstName lastName email role'),
    Refund.countDocuments(filter),
  ]);
  res.json(paginationPayload(items, total, pagination.page, pagination.limit));
};

export const reviewRefund = async (req: AuthRequest, res: Response) => {
  const refund = await Refund.findById(req.params.id);
  if (!refund) return res.status(404).json({ message: 'Refund not found' });
  const status = String(req.body.status);
  if (!['processing', 'completed', 'failed', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid refund status' });
  if (['completed', 'rejected'].includes(refund.status)) {
    return res.status(409).json({ message: 'Refund is already in a terminal state' });
  }
  let nextStatus = status;
  let providerReference = String(req.body.providerReference || refund.providerReference || '').trim();
  if (status === 'completed') {
    const result = await processRefund({ amount: refund.amount, providerReference, reason: refund.reason });
    nextStatus = result.status;
    providerReference = result.providerReference;
    refund.provider = result.provider;
  }
  refund.status = nextStatus as any;
  refund.providerReference = providerReference;
  refund.failureReason = status === 'failed' ? String(req.body.note || '').trim() : undefined;
  refund.reviewedBy = req.user!._id;
  refund.reviewedAt = new Date();
  refund.statusHistory.push({
    status: nextStatus,
    changedAt: new Date(),
    changedBy: req.user!._id,
    note: String(req.body.note || '').trim(),
  });
  await refund.save();
  const booking = await Booking.findById(refund.booking);
  if (booking) {
    booking.refundStatus = nextStatus === 'completed' ? 'completed' : nextStatus === 'failed' ? 'failed' : nextStatus === 'processing' ? 'processing' : 'none';
    await booking.save();
    await createNotification({ userId: booking.parent, type: 'refund_update', title: 'Cập nhật hoàn tiền', body: `Trạng thái hoàn tiền: ${nextStatus}`, data: { bookingId: booking._id, refundId: refund._id } });
  }
  await writeAudit(req, 'refund.review', 'Refund', refund._id, { after: { status: nextStatus, provider: refund.provider, providerReference: refund.providerReference } });
  res.json(refund);
};

export const markPayoutBatchPaid = async (req: AuthRequest, res: Response) => {
  const bookingIds = Array.isArray(req.body.bookingIds) ? req.body.bookingIds : [];
  const reference = String(req.body.reference || '').trim();
  const note = String(req.body.note || '').trim();
  if (!bookingIds.length) return res.status(400).json({ message: 'At least one booking is required' });
  if (!reference) return res.status(400).json({ message: 'Batch payout reference is required' });

  const bookings = await Booking.find({
    _id: { $in: bookingIds },
    isDeleted: false,
    status: BookingStatus.COMPLETED,
    carerPayoutStatus: 'ready',
  });
  if (bookings.length !== new Set(bookingIds.map(String)).size) {
    return res.status(409).json({ message: 'Every booking must be completed and ready for payout' });
  }

  const paidAt = new Date();
  await Booking.updateMany(
    { _id: { $in: bookings.map((booking) => booking._id) } },
    {
      $set: {
        carerPayoutStatus: 'paid',
        payoutPaidAt: paidAt,
        payoutReference: reference,
        payoutNote: note,
      },
    },
  );

  const carers = await Carer.find({ _id: { $in: bookings.map((booking) => booking.carer) } }).select('user');
  await Promise.all(carers.map((carer) => createNotification({
    userId: carer.user,
    type: 'payout_paid',
    title: 'Khoản đối soát đã được thanh toán',
    body: `Mã lô: ${reference}`,
    data: { reference },
  })));
  await writeAudit(req, 'payout.batch_paid', 'Booking', undefined, {
    after: { bookingIds: bookings.map((booking) => booking._id), paidAt, reference },
    metadata: { count: bookings.length, note },
  });
  res.json({ updated: bookings.length, reference, paidAt });
};
