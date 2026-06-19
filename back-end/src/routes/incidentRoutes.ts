import express from 'express';
import { createIncident, getIncidents, updateIncident } from '../controllers/incidentController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, createIncident);
router.get('/', protect, authorize('admin'), getIncidents);
router.patch('/:id', protect, authorize('admin'), updateIncident);
export default router;
