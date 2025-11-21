const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getStatistics,
    deleteBooking
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/bookings', protect, authorize('admin'), getAllBookings);
router.get('/statistics', protect, authorize('admin'), getStatistics);
router.delete('/bookings/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;