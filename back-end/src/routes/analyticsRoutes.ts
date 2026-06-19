import express from 'express';
import { getDashboardAnalytics, getReconciliation } from '../controllers/analyticsController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardAnalytics);
router.get('/reconciliation', getReconciliation);
export default router;
