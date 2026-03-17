import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (req.file) {
      res.json({
        url: req.file.path,
        public_id: (req.file as any).filename
      });
    } else {
      res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;
