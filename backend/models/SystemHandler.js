const db = require('../config/db');

class SystemHandler {
    // Create a new system handler
    static async create(handlerData) {
        const { name, email, system_type, phone } = handlerData;

        const [result] = await db.query(
            'INSERT INTO system_handlers (name, email, system_type, phone) VALUES (?, ?, ?, ?)',
            [name, email, system_type, phone]
        );

        return result.insertId;
    }

    // Find handler by ID
    static async findById(id) {
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers WHERE id = ?',
            [id]
        );
        return handlers[0];
    }

    // Get all system handlers
    static async findAll() {
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers ORDER BY system_type, name'
        );
        return handlers;
    }

    // Get handlers by system type
    static async findBySystemType(systemType) {
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers WHERE system_type = ? ORDER BY name',
            [systemType]
        );
        return handlers;
    }

    // Get handlers for multiple system types
    static async findBySystemTypes(systemTypes) {
        if (!Array.isArray(systemTypes) || systemTypes.length === 0) {
            return [];
        }

        const placeholders = systemTypes.map(() => '?').join(',');
        const [handlers] = await db.query(
            `SELECT * FROM system_handlers WHERE system_type IN (${placeholders}) ORDER BY system_type, name`,
            systemTypes
        );
        return handlers;
    }

    // Find handler by email
    static async findByEmail(email) {
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers WHERE email = ?',
            [email]
        );
        return handlers[0];
    }

    // Update handler
    static async update(id, handlerData) {
        const { name, email, system_type, phone } = handlerData;

        const [result] = await db.query(
            'UPDATE system_handlers SET name = ?, email = ?, system_type = ?, phone = ? WHERE id = ?',
            [name, email, system_type, phone, id]
        );

        return result.affectedRows > 0;
    }

    // Delete handler
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM system_handlers WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    // Check if email exists
    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM system_handlers WHERE email = ?';
        let params = [email];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [handlers] = await db.query(query, params);
        return handlers.length > 0;
    }

    // Get handlers grouped by system type
    static async getGroupedByType() {
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers ORDER BY system_type, name'
        );

        const grouped = {};
        handlers.forEach(handler => {
            if (!grouped[handler.system_type]) {
                grouped[handler.system_type] = [];
            }
            grouped[handler.system_type].push(handler);
        });

        return grouped;
    }

    // Get handler statistics
    static async getStatistics() {
        const [totalHandlers] = await db.query(
            'SELECT COUNT(*) as count FROM system_handlers'
        );

        const [byType] = await db.query(
            `SELECT system_type, COUNT(*) as count 
             FROM system_handlers 
             GROUP BY system_type 
             ORDER BY count DESC`
        );

        return {
            total_handlers: totalHandlers[0].count,
            handlers_by_type: byType
        };
    }

    // Get handlers needed for a booking
    static async getHandlersForBooking(bookingId) {
        const [booking] = await db.query(
            'SELECT needs_projector, needs_mic, needs_sound_system FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (booking.length === 0) {
            return [];
        }

        const systemTypes = [];
        if (booking[0].needs_projector) systemTypes.push('projector');
        if (booking[0].needs_mic) systemTypes.push('mic');
        if (booking[0].needs_sound_system) systemTypes.push('sound_system');

        if (systemTypes.length === 0) {
            return [];
        }

        return await this.findBySystemTypes(systemTypes);
    }

    // Validate system type
    static isValidSystemType(systemType) {
        const validTypes = ['projector', 'mic', 'sound_system', 'other'];
        return validTypes.includes(systemType);
    }

    // Get all valid system types
    static getValidSystemTypes() {
        return ['projector', 'mic', 'sound_system', 'other'];
    }
}

module.exports = SystemHandler;