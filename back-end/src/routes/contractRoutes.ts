import express from 'express';
import { getAdminCarerContract, getMyContract, signMyContract } from '../controllers/contractController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyContract);
router.post('/me/sign', signMyContract);
router.get('/admin/carer/:carerId', authorize('admin'), getAdminCarerContract);

export default router;
