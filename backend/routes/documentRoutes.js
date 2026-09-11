const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, updateVerificationStatus } = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'COUNSELOR'), updateVerificationStatus);

module.exports = router;
