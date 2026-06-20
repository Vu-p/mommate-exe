import express from 'express';
import { exportReconciliationCsv, getDashboardAnalytics, getReconciliation } from '../controllers/analyticsController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardAnalytics);
router.get('/reconciliation', getReconciliation);
router.get('/reconciliation/export.csv', exportReconciliationCsv);
export default router;
