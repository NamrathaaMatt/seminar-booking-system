const db = require('../config/db');

class Booking {
    // Create a new booking
    static async create(bookingData) {
        const {
            event_name,
            booking_date,
            start_time,
            end_time,
            expected_audience,
            hall_id,
            user_id,
            department,
            faculty_incharge,
            chairs_required,
            needs_projector,
            needs_mic,
            needs_sound_system,
            additional_requirements,
            status = 'approved'
        } = bookingData;

        const [result] = await db.query(
            `INSERT INTO bookings 
            (event_name, booking_date, start_time, end_time, expected_audience, hall_id, user_id, 
             department, faculty_incharge, chairs_required, needs_projector, needs_mic, 
             needs_sound_system, additional_requirements, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                event_name, booking_date, start_time, end_time, expected_audience, hall_id,
                user_id, department, faculty_incharge, chairs_required, needs_projector,
                needs_mic, needs_sound_system, additional_requirements, status
            ]
        );

        return result.insertId;
    }

    // Find booking by ID
    static async findById(id) {
        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name, h.capacity, h.total_chairs,
                    u.name as booked_by, u.email as user_email, u.department as user_department
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ?`,
            [id]
        );
        return bookings[0];
    }

    // Get all bookings
    static async findAll(filters = {}) {
        let query = `
            SELECT b.*, h.hall_name, u.name as booked_by, u.email as user_email, u.department as user_department
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            JOIN users u ON b.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.start_date && filters.end_date) {
            query += ' AND b.booking_date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }

        if (filters.hall_id) {
            query += ' AND b.hall_id = ?';
            params.push(filters.hall_id);
        }

        if (filters.user_id) {
            query += ' AND b.user_id = ?';
            params.push(filters.user_id);
        }

        if (filters.status) {
            query += ' AND b.status = ?';
            params.push(filters.status);
        }

        if (filters.department) {
            query += ' AND b.department = ?';
            params.push(filters.department);
        }

        query += ' ORDER BY b.booking_date DESC, b.start_time DESC';

        const [bookings] = await db.query(query, params);
        return bookings;
    }

    // Get bookings by date
    static async findByDate(date) {
        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by, u.department as user_department
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             WHERE b.booking_date = ?
             ORDER BY b.start_time`,
            [date]
        );
        return bookings;
    }

    // Get bookings by user
    static async findByUser(userId) {
        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC, b.start_time DESC`,
            [userId]
        );
        return bookings;
    }

    // Get bookings by hall
    static async findByHall(hallId, startDate = null, endDate = null) {
        let query = `
            SELECT b.*, u.name as booked_by, u.department as user_department
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.hall_id = ?
        `;
        const params = [hallId];

        if (startDate && endDate) {
            query += ' AND b.booking_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY b.booking_date, b.start_time';

        const [bookings] = await db.query(query, params);
        return bookings;
    }

    // Check for conflicts
    static async checkConflict(hallId, date, startTime, endTime, excludeBookingId = null) {
        let query = `
            SELECT b.*, h.hall_name, u.name as booked_by, u.department
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            JOIN users u ON b.user_id = u.id
            WHERE b.hall_id = ?
            AND b.booking_date = ?
            AND (
                (b.start_time <= ? AND b.end_time > ?) OR
                (b.start_time < ? AND b.end_time >= ?) OR
                (b.start_time >= ? AND b.end_time <= ?)
            )
        `;
        const params = [hallId, date, startTime, startTime, endTime, endTime, startTime, endTime];

        if (excludeBookingId) {
            query += ' AND b.id != ?';
            params.push(excludeBookingId);
        }

        const [conflicts] = await db.query(query, params);
        return conflicts;
    }

    // Update booking
    static async update(id, bookingData) {
        const {
            event_name,
            booking_date,
            start_time,
            end_time,
            expected_audience,
            department,
            faculty_incharge,
            chairs_required,
            needs_projector,
            needs_mic,
            needs_sound_system,
            additional_requirements
        } = bookingData;

        const [result] = await db.query(
            `UPDATE bookings 
             SET event_name = ?, booking_date = ?, start_time = ?, end_time = ?,
                 expected_audience = ?, department = ?, faculty_incharge = ?,
                 chairs_required = ?, needs_projector = ?, needs_mic = ?,
                 needs_sound_system = ?, additional_requirements = ?
             WHERE id = ?`,
            [
                event_name, booking_date, start_time, end_time, expected_audience,
                department, faculty_incharge, chairs_required, needs_projector,
                needs_mic, needs_sound_system, additional_requirements, id
            ]
        );

        return result.affectedRows > 0;
    }

    // Update booking status
    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        return result.affectedRows > 0;
    }

    // Delete booking
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM bookings WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    // Get upcoming bookings
    static async getUpcoming(userId = null, limit = 10) {
        let query = `
            SELECT b.*, h.hall_name, u.name as booked_by
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            JOIN users u ON b.user_id = u.id
            WHERE b.booking_date >= CURDATE()
        `;
        const params = [];

        if (userId) {
            query += ' AND b.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY b.booking_date, b.start_time LIMIT ?';
        params.push(limit);

        const [bookings] = await db.query(query, params);
        return bookings;
    }

    // Get past bookings
    static async getPast(userId = null, limit = 10) {
        let query = `
            SELECT b.*, h.hall_name, u.name as booked_by
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            JOIN users u ON b.user_id = u.id
            WHERE b.booking_date < CURDATE()
        `;
        const params = [];

        if (userId) {
            query += ' AND b.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY b.booking_date DESC, b.start_time DESC LIMIT ?';
        params.push(limit);

        const [bookings] = await db.query(query, params);
        return bookings;
    }

    // Get booking statistics
    static async getStatistics() {
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
             GROUP BY h.id, h.hall_name
             ORDER BY booking_count DESC`
        );

        const [bookingsByDepartment] = await db.query(
            `SELECT department, COUNT(*) as booking_count
             FROM bookings
             GROUP BY department
             ORDER BY booking_count DESC`
        );

        const [bookingsByMonth] = await db.query(
            `SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                COUNT(*) as booking_count
             FROM bookings
             WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month`
        );

        return {
            total_bookings: totalBookings[0].count,
            upcoming_bookings: upcomingBookings[0].count,
            past_bookings: pastBookings[0].count,
            bookings_by_hall: bookingsByHall,
            bookings_by_department: bookingsByDepartment,
            bookings_by_month: bookingsByMonth
        };
    }

    // Get today's bookings
    static async getToday() {
        const [bookings] = await db.query(
            `SELECT b.*, h.hall_name, u.name as booked_by, u.department as user_department
             FROM bookings b
             JOIN halls h ON b.hall_id = h.id
             JOIN users u ON b.user_id = u.id
             WHERE b.booking_date = CURDATE()
             ORDER BY b.start_time`,
            []
        );
        return bookings;
    }
}

module.exports = Booking;