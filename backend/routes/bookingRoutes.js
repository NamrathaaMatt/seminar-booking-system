const express = require('express');
const router = express.Router();
const {
    createBooking,
    getBookingsByDate,
    getMyBookings,
    checkAvailability
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('faculty'), createBooking);
router.get('/date/:date', protect, getBookingsByDate);
router.get('/my-bookings', protect, getMyBookings);
router.post('/check-availability', protect, checkAvailability);

module.exports = router;