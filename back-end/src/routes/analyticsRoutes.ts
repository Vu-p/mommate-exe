import express from 'express';
import { exportReconciliationCsv, exportReconciliationPdf, getDashboardAnalytics, getReconciliation } from '../controllers/analyticsController.js';
import { authorize, protect } from '../middleware/auth.js';
import { ga4Metadata, ga4Overview, ga4Realtime, ga4Report } from '../controllers/ga4Controller.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardAnalytics);
router.get('/ga4/overview', ga4Overview);
router.get('/ga4/realtime', ga4Realtime);
router.get('/ga4/metadata', ga4Metadata);
router.post('/ga4/report', ga4Report);
router.get('/reconciliation', getReconciliation);
router.get('/reconciliation/export.csv', exportReconciliationCsv);
router.get('/reconciliation/export.pdf', exportReconciliationPdf);
export default router;
