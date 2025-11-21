const db = require('../config/db');

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
    try {
        const { start_date, end_date, hall_id, status } = req.query;

        let query = `
            SELECT b.*, h.hall_name, u.name as booked_by, u.email as user_email, u.department as user_department 
            FROM bookings b 
            JOIN halls h ON b.hall_id = h.id 
            JOIN users u ON b.user_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        if (start_date && end_date) {
            query += ' AND b.booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        if (hall_id) {
            query += ' AND b.hall_id = ?';
            params.push(hall_id);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.booking_date DESC, b.start_time DESC';

        const [bookings] = await db.query(query, params);

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get booking statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
exports.getStatistics = async (req, res) => {
    try {
        const [totalBookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings'
        );

        const [upcomingBookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE booking_date >= CURDATE()'
        );

        const [pastBookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE booking_date < CURDATE()'
        );

        const [bookingsByHall] = await db.query(
            `SELECT h.hall_name, COUNT(b.id) as booking_count 
             FROM halls h 
             LEFT JOIN bookings b ON h.id = b.hall_id 
             GROUP BY h.id, h.hall_name`
        );

        res.status(200).json({
            success: true,
            statistics: {
                total_bookings: totalBookings[0].count,
                upcoming_bookings: upcomingBookings[0].count,
                past_bookings: pastBookings[0].count,
                bookings_by_hall: bookingsByHall
            }
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private (Admin)
exports.deleteBooking = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM bookings WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};