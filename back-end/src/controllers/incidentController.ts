import type { Response } from 'express';
import Booking from '../models/Booking.js';
import Carer from '../models/Carer.js';
import Incident from '../models/Incident.js';
import type { AuthRequest } from '../middleware/auth.js';
import { escapeRegex, getPagination, paginationPayload } from '../utils/pagination.js';

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
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
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

export const updateIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    const { status, assignedTo, resolution, severity } = req.body;
    incident.status = status ?? incident.status;
    incident.assignedTo = assignedTo ?? incident.assignedTo;
    incident.resolution = resolution ?? incident.resolution;
    incident.severity = severity ?? incident.severity;
    if (['resolved', 'closed'].includes(incident.status)) incident.resolvedAt = incident.resolvedAt || new Date();
    await incident.save();
    res.json(await populateIncident(Incident.findById(incident._id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot update incident' });
  }
};
