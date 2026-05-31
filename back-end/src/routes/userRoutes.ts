import express from 'express';
import { createUser, getMyProfile, getUserById, getUsers, updateMyProfile, updateUser } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
