const express = require('express');
const router = express.Router();
const { getAllHalls, getHallById } = require('../controllers/hallController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllHalls);
router.get('/:id', protect, getHallById);

module.exports = router;