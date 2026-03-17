import type { Response } from 'express';
import Booking from '../models/Booking.js';
import type { AuthRequest } from '../middleware/auth.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: AuthRequest, res: Response) => {
  const { carerId, serviceId, scheduledAt, address, notes, totalPrice, numSessions } = req.body;

  try {
    const booking = await Booking.create({
      parent: req.user!._id,
      carer: carerId,
      service: serviceId,
      scheduledAt,
      address,
      notes,
      totalPrice,
      numSessions: numSessions || 1
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
    const bookings = await Booking.find({ parent: req.user!._id, isDeleted: false })
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
    const booking = await Booking.findById(req.params.id);

    if (booking) {
      booking.status = req.body.status;
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
