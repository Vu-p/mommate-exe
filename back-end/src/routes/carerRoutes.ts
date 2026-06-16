import express from 'express';
import {
  getCarers,
  getCarerById,
  createCarer,
  updateCarer,
  deleteCarer,
  getMyCarerProfile,
  updateMyCarerProfile,
} from '../controllers/carerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCarers);
router.get('/me', protect, getMyCarerProfile);
router.put('/me', protect, updateMyCarerProfile);
router.get('/:id', getCarerById);

router.post('/', protect, authorize('admin'), createCarer);
router.put('/:id', protect, authorize('admin'), updateCarer);
router.delete('/:id', protect, authorize('admin'), deleteCarer);

export default router;
