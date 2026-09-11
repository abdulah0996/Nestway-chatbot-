const express = require('express');
const router = express.Router();
const { getCounselors, createCounselor, getCounselorById } = require('../controllers/counselorController');

router.get('/', getCounselors);
router.post('/', createCounselor);
router.get('/:id', getCounselorById);

module.exports = router;
