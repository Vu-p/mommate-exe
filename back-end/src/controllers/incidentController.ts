import type { Response } from 'express';
import Booking from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Incident from '../models/Incident.js';
import type { AuthRequest } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';
import { createNotification } from '../services/notificationService.js';

const populateIncident = (query: any) =>
  query
    .populate('reportedBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email')
    .populate({
      path: 'booking',
      populate: [
        { path: 'parent', select: 'firstName lastName email' },
        { path: 'service', select: 'title' },
        { path: 'carer', populate: { path: 'user', select: 'firstName lastName email' } },
      ],
    });

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({ _id: req.body.bookingId, isDeleted: false });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let authorized = req.user!.role === 'admin' || String(booking.parent) === String(req.user!._id);
    if (req.user!.role === 'carer') {
      const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false });
      authorized = Boolean(carer && String(booking.carer) === String(carer._id));
    }
    if (!authorized) return res.status(403).json({ message: 'Not authorized to report this booking' });

    const incident = await Incident.create({
      booking: booking._id,
      reportedBy: req.user!._id,
      category: req.body.category,
      severity: req.body.severity,
      title: req.body.title,
      description: req.body.description,
      evidence: req.body.evidence || [],
      timeline: [{ status: 'open', changedBy: req.user!._id, note: 'Incident reported' }],
    });
    res.status(201).json(await populateIncident(Incident.findById(incident._id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid incident data' });
  }
};

export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    const pagination = getPagination(req.query, 20);

    if (req.user!.role !== 'admin') {
      if (req.user!.role === 'carer') {
        const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false });
        if (!carer) return res.json(paginationPayload([], 0, 1, 20));
        const bookings = await Booking.find({ carer: carer._id }).select('_id');
        filter.booking = { $in: bookings.map(b => b._id) };
      } else {
        const bookings = await Booking.find({ parent: req.user!._id }).select('_id');
        filter.$or = [
          { reportedBy: req.user!._id },
          { booking: { $in: bookings.map(b => b._id) } }
        ];
      }
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] }
        ];
        delete filter.$or;
      } else {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
    }
    const [items, total] = await Promise.all([
      populateIncident(Incident.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit)),
      Incident.countDocuments(filter),
    ]);
    res.json(paginationPayload(items, total, pagination.page, pagination.limit));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getIncidentDetail = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await populateIncident(Incident.findById(req.params.id));
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (req.user!.role !== 'admin') {
      const booking = await Booking.findById(incident.booking);
      if (!booking) return res.status(403).json({ message: 'Forbidden' });
      let authorized = String(booking.parent) === String(req.user!._id) || String(incident.reportedBy) === String(req.user!._id);
      if (req.user!.role === 'carer') {
        const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false });
        authorized = Boolean(carer && String(booking.carer) === String(carer._id));
      }
      if (!authorized) return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const updateIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    const { status, assignedTo, resolution, severity, internalNote } = req.body;
    const previousStatus = incident.status;
    const transitions: Record<string, string[]> = {
      open: ['open', 'investigating', 'closed'],
      investigating: ['investigating', 'resolved', 'closed'],
      resolved: ['resolved', 'investigating', 'closed'],
      closed: ['closed', 'investigating'],
    };
    if (status && !(transitions[incident.status] || []).includes(status)) {
      return res.status(409).json({ message: `Cannot transition incident from ${incident.status} to ${status}` });
    }
    if (['resolved', 'closed'].includes(status) && !String(resolution || incident.resolution || '').trim()) {
      return res.status(400).json({ message: 'Resolution is required before resolving or closing an incident' });
    }
    incident.status = status ?? incident.status;
    incident.assignedTo = assignedTo === 'self' ? req.user!._id : assignedTo ?? incident.assignedTo;
    incident.resolution = resolution ?? incident.resolution;
    incident.severity = severity ?? incident.severity;
    if (String(internalNote || '').trim()) {
      incident.internalNotes.push({ author: req.user!._id, note: String(internalNote).trim(), createdAt: new Date() });
    }
    if (incident.status !== previousStatus) {
      incident.timeline.push({ status: incident.status, changedBy: req.user!._id, note: String(resolution || internalNote || '').trim(), createdAt: new Date() });
    }
    if (['resolved', 'closed'].includes(incident.status)) incident.resolvedAt = incident.resolvedAt || new Date();
    if (incident.status === 'investigating') incident.resolvedAt = undefined;
    await incident.save();
    await createNotification({
      userId: incident.reportedBy,
      type: 'incident_update',
      title: 'Cập nhật báo cáo sự cố',
      body: `Trạng thái mới: ${incident.status}`,
      data: { incidentId: incident._id, bookingId: incident.booking },
    });
    await writeAudit(req, 'incident.update', 'Incident', incident._id, { after: { status: incident.status, severity: incident.severity, assignedTo: incident.assignedTo }, metadata: { resolution: incident.resolution } });
    res.json(await populateIncident(Incident.findById(incident._id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot update incident' });
  }
};
