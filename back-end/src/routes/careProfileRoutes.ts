import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCareProfile, deleteCareProfile, getCareProfiles, updateCareProfile } from '../controllers/careProfileController.js';

const router = Router();
router.use(protect);
router.get('/', getCareProfiles);
router.post('/', createCareProfile);
router.put('/:id', updateCareProfile);
router.delete('/:id', deleteCareProfile);
export default router;
