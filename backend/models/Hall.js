const db = require('../config/db');

class Hall {
    // Create a new hall
    static async create(hallData) {
        const { 
            hall_name, 
            capacity, 
            has_projector, 
            has_sound_system, 
            has_ac, 
            has_stage, 
            total_chairs 
        } = hallData;

        const [result] = await db.query(
            `INSERT INTO halls (hall_name, capacity, has_projector, has_sound_system, has_ac, has_stage, total_chairs) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [hall_name, capacity, has_projector, has_sound_system, has_ac, has_stage, total_chairs]
        );

        return result.insertId;
    }

    // Find hall by ID
    static async findById(id) {
        const [halls] = await db.query(
            'SELECT * FROM halls WHERE id = ?',
            [id]
        );
        return halls[0];
    }

    // Get all halls
    static async findAll() {
        const [halls] = await db.query(
            'SELECT * FROM halls ORDER BY hall_name'
        );
        return halls;
    }

    // Get halls with availability for a specific date and time
    static async findAvailableHalls(date, startTime, endTime) {
        const [halls] = await db.query(
            `SELECT h.* FROM halls h
             WHERE h.id NOT IN (
                 SELECT b.hall_id FROM bookings b
                 WHERE b.booking_date = ?
                 AND (
                     (b.start_time <= ? AND b.end_time > ?) OR
                     (b.start_time < ? AND b.end_time >= ?) OR
                     (b.start_time >= ? AND b.end_time <= ?)
                 )
             )
             ORDER BY h.hall_name`,
            [date, startTime, startTime, endTime, endTime, startTime, endTime]
        );
        return halls;
    }

    // Get halls by capacity
    static async findByCapacity(minCapacity) {
        const [halls] = await db.query(
            'SELECT * FROM halls WHERE capacity >= ? ORDER BY capacity',
            [minCapacity]
        );
        return halls;
    }

    // Get halls with specific facilities
    static async findByFacilities(facilities) {
        let conditions = [];
        
        if (facilities.projector) conditions.push('has_projector = true');
        if (facilities.sound_system) conditions.push('has_sound_system = true');
        if (facilities.ac) conditions.push('has_ac = true');
        if (facilities.stage) conditions.push('has_stage = true');

        if (conditions.length === 0) {
            return await this.findAll();
        }

        const whereClause = conditions.join(' AND ');
        const [halls] = await db.query(
            `SELECT * FROM halls WHERE ${whereClause} ORDER BY hall_name`
        );
        return halls;
    }

    // Update hall
    static async update(id, hallData) {
        const { 
            hall_name, 
            capacity, 
            has_projector, 
            has_sound_system, 
            has_ac, 
            has_stage, 
            total_chairs 
        } = hallData;

        const [result] = await db.query(
            `UPDATE halls 
             SET hall_name = ?, capacity = ?, has_projector = ?, has_sound_system = ?, 
                 has_ac = ?, has_stage = ?, total_chairs = ?
             WHERE id = ?`,
            [hall_name, capacity, has_projector, has_sound_system, has_ac, has_stage, total_chairs, id]
        );

        return result.affectedRows > 0;
    }

    // Delete hall
    static async delete(id) {
        // Check if hall has any bookings
        const [bookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE hall_id = ?',
            [id]
        );

        if (bookings[0].count > 0) {
            throw new Error('Cannot delete hall with existing bookings');
        }

        const [result] = await db.query(
            'DELETE FROM halls WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    // Check if hall name exists
    static async nameExists(hallName, excludeId = null) {
        let query = 'SELECT id FROM halls WHERE hall_name = ?';
        let params = [hallName];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [halls] = await db.query(query, params);
        return halls.length > 0;
    }

    // Get hall utilization statistics
    static async getUtilizationStats(startDate, endDate) {
        const [stats] = await db.query(
            `SELECT 
                h.id,
                h.hall_name,
                COUNT(b.id) as total_bookings,
                SUM(TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time)) as total_minutes_booked
             FROM halls h
             LEFT JOIN bookings b ON h.id = b.hall_id 
                 AND b.booking_date BETWEEN ? AND ?
             GROUP BY h.id, h.hall_name
             ORDER BY total_bookings DESC`,
            [startDate, endDate]
        );

        return stats;
    }

    // Get upcoming bookings for a hall
    static async getUpcomingBookings(hallId, limit = 10) {
        const [bookings] = await db.query(
            `SELECT b.*, u.name as booked_by 
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.hall_id = ? AND b.booking_date >= CURDATE()
             ORDER BY b.booking_date, b.start_time
             LIMIT ?`,
            [hallId, limit]
        );

        return bookings;
    }
}

module.exports = Hall;