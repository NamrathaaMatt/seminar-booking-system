const db = require('../config/db');
const { sendBookingConfirmation, notifySystemHandlers } = require('../utils/emailService');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Faculty)
exports.createBooking = async (req, res) => {
    try {
        const {
            event_name,
            booking_date,
            start_time,
            end_time,
            expected_audience,
            hall_id,
            department,
            faculty_incharge,
            chairs_required,
            needs_projector,
            needs_mic,
            needs_sound_system,
            additional_requirements
        } = req.body;

        // Validation
        if (!event_name || !booking_date || !start_time || !end_time || !hall_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check for conflicts
        const [conflicts] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by 
             FROM bookings b 
             JOIN halls h ON b.hall_id = h.id 
             JOIN users u ON b.user_id = u.id
             WHERE b.hall_id = ? 
             AND b.booking_date = ? 
             AND (
                 (b.start_time <= ? AND b.end_time > ?) OR
                 (b.start_time < ? AND b.end_time >= ?) OR
                 (b.start_time >= ? AND b.end_time <= ?)
             )`,
            [hall_id, booking_date, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Time slot conflict detected',
                conflicts: conflicts
            });
        }

        // Check hall capacity
        const [halls] = await db.query('SELECT * FROM halls WHERE id = ?', [hall_id]);
        
        if (halls.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hall not found'
            });
        }

        const hall = halls[0];

        if (chairs_required > hall.total_chairs) {
            return res.status(400).json({
                success: false,
                message: `Requested chairs (${chairs_required}) exceed hall capacity (${hall.total_chairs})`
            });
        }

        // Create booking
        const [result] = await db.query(
            `INSERT INTO bookings 
            (event_name, booking_date, start_time, end_time, expected_audience, hall_id, user_id, 
             department, faculty_incharge, chairs_required, needs_projector, needs_mic, 
             needs_sound_system, additional_requirements) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                event_name, booking_date, start_time, end_time, expected_audience, hall_id,
                req.user.id, department, faculty_incharge, chairs_required, needs_projector,
                needs_mic, needs_sound_system, additional_requirements
            ]
        );

        // Get booking details for email
        const [bookingDetails] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by, u.email as user_email 
             FROM bookings b 
             JOIN halls h ON b.hall_id = h.id 
             JOIN users u ON b.user_id = u.id 
             WHERE b.id = ?`,
            [result.insertId]
        );

        // Send confirmation email to faculty
        await sendBookingConfirmation(bookingDetails[0]);

        // Notify system handlers
        await notifySystemHandlers(bookingDetails[0]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking_id: result.insertId,
            booking: bookingDetails[0]
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during booking creation'
        });
    }
};

// @desc    Get all bookings for a specific date
// @route   GET /api/bookings/date/:date
// @access  Private
exports.getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.params;

        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by, u.department as user_department 
             FROM bookings b 
             JOIN halls h ON b.hall_id = h.id 
             JOIN users u ON b.user_id = u.id 
             WHERE b.booking_date = ? 
             ORDER BY b.start_time`,
            [date]
        );

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get bookings by date error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name 
             FROM bookings b 
             JOIN halls h ON b.hall_id = h.id 
             WHERE b.user_id = ? 
             ORDER BY b.booking_date DESC, b.start_time DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Check availability
// @route   POST /api/bookings/check-availability
// @access  Private
exports.checkAvailability = async (req, res) => {
    try {
        const { hall_id, booking_date, start_time, end_time } = req.body;

        const [conflicts] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by, u.department 
             FROM bookings b 
             JOIN halls h ON b.hall_id = h.id 
             JOIN users u ON b.user_id = u.id
             WHERE b.hall_id = ? 
             AND b.booking_date = ? 
             AND (
                 (b.start_time <= ? AND b.end_time > ?) OR
                 (b.start_time < ? AND b.end_time >= ?) OR
                 (b.start_time >= ? AND b.end_time <= ?)
             )`,
            [hall_id, booking_date, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        res.status(200).json({
            success: true,
            available: conflicts.length === 0,
            conflicts: conflicts
        });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};