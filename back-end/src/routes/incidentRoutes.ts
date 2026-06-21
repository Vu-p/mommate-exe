import express from 'express';
import { createIncident, getIncidents, updateIncident, getIncidentDetail } from '../controllers/incidentController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, createIncident);
router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentDetail);
router.patch('/:id', protect, authorize('admin'), updateIncident);
export default router;
