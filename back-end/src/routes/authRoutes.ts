import express from 'express';
import { registerUser, loginUser, forgotPassword, changePasswordFirstLogin, firebaseGoogleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/firebase-google', firebaseGoogleAuth);
router.post('/forgot-password', forgotPassword);
router.patch('/change-password-first-login', protect, changePasswordFirstLogin);

export default router;
