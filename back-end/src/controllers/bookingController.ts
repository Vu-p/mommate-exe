import type { Response } from 'express';
import Booking, { BookingStatus } from '../models/Booking.js';
import Carer from '../models/Carer.js';
import type { AuthRequest } from '../middleware/auth.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: AuthRequest, res: Response) => {
  const { carerId, serviceId, scheduledAt, address, notes, totalPrice, numSessions, hours } = req.body;

  try {
    const booking = await Booking.create({
      parent: req.user!._id,
      carer: carerId,
      service: serviceId,
      scheduledAt,
      address,
      notes,
      totalPrice,
      numSessions: numSessions || 1,
      hours: hours || 1
    });

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    let filter: Record<string, any> = { parent: req.user!._id, isDeleted: false };

    if (req.user!.role === 'carer') {
      const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false }).select('_id');

      if (!carer) {
        return res.json([]);
      }

      filter = { carer: carer._id, isDeleted: false };
    }

    const bookings = await Booking.find(filter)
      .populate('carer', 'user')
      .populate('service');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

    if (booking) {
      booking.status = status;
      if (status === BookingStatus.CONFIRMED && req.body.paymentConfirmed) {
        booking.paymentConfirmedAt = new Date();
      }
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
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
      const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false }).select('_id');

      if (!carer) {
        return res.json([]);
      }

      filter.carer = carer._id;
    }

    const bookings = await Booking.find(filter)
      .sort({ scheduledAt: 1 })
      .populate('parent', 'firstName lastName email phoneNumber')
      .populate({
        path: 'carer',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber avatar' },
      })
      .populate('service', 'title category duration price');

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Submit manual bank transfer proof
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

    if (!booking.paymentProofUrl) {
      return res.status(400).json({ message: 'Payment proof is required before confirmation' });
    }

    booking.paymentConfirmedAt = new Date();
    booking.status = BookingStatus.CONFIRMED;

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ isDeleted: false })
      .populate('parent', 'firstName lastName email')
      .populate('carer', 'user')
      .populate('service');
    
    // Deeper populate for carer user info
    const populatedBookings = await Booking.populate(bookings, {
      path: 'carer.user',
      select: 'firstName lastName email avatar'
    });

    res.json(populatedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
