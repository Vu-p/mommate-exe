import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { getAuditLogs, getChangeRequests, getRefunds, markPayoutBatchPaid, reviewChangeRequest, reviewRefund, verifyCarer } from '../controllers/adminController.js';

const router = Router();
router.use(protect, authorize('admin'));
router.patch('/carers/:id/verification', verifyCarer);
router.get('/booking-change-requests', getChangeRequests);
router.patch('/booking-change-requests/:id', reviewChangeRequest);
router.get('/audit-logs', getAuditLogs);
router.get('/refunds', getRefunds);
router.patch('/refunds/:id', reviewRefund);
router.post('/payout-batches', markPayoutBatchPaid);
export default router;
