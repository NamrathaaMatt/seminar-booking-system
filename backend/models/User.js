const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Create a new user
    static async create(userData) {
        const { name, email, password, role, department, phone } = userData;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, department, phone]
        );

        return result.insertId;
    }

    // Find user by email
    static async findByEmail(email) {
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return users[0];
    }

    // Find user by ID
    static async findById(id) {
        const [users] = await db.query(
            'SELECT id, name, email, role, department, phone, created_at FROM users WHERE id = ?',
            [id]
        );
        return users[0];
    }

    // Get all users
    static async findAll() {
        const [users] = await db.query(
            'SELECT id, name, email, role, department, phone, created_at FROM users ORDER BY created_at DESC'
        );
        return users;
    }

    // Get users by role
    static async findByRole(role) {
        const [users] = await db.query(
            'SELECT id, name, email, role, department, phone, created_at FROM users WHERE role = ? ORDER BY name',
            [role]
        );
        return users;
    }

    // Update user
    static async update(id, userData) {
        const { name, email, department, phone } = userData;
        
        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ?, department = ?, phone = ? WHERE id = ?',
            [name, email, department, phone, id]
        );

        return result.affectedRows > 0;
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );

        return result.affectedRows > 0;
    }

    // Delete user
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    // Check if email exists
    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM users WHERE email = ?';
        let params = [email];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [users] = await db.query(query, params);
        return users.length > 0;
    }

    // Compare password
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Get user statistics
    static async getStatistics() {
        const [totalUsers] = await db.query(
            'SELECT COUNT(*) as count FROM users'
        );

        const [facultyCount] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "faculty"'
        );

        const [adminCount] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
        );

        const [usersByDepartment] = await db.query(
            'SELECT department, COUNT(*) as count FROM users WHERE department IS NOT NULL GROUP BY department'
        );

        return {
            total_users: totalUsers[0].count,
            total_faculty: facultyCount[0].count,
            total_admins: adminCount[0].count,
            users_by_department: usersByDepartment
        };
    }
}

module.exports = User;