const db = require('../config/db');

// @desc    Get all halls
// @route   GET /api/halls
// @access  Private
exports.getAllHalls = async (req, res) => {
    try {
        const [halls] = await db.query('SELECT * FROM halls ORDER BY hall_name');

        res.status(200).json({
            success: true,
            count: halls.length,
            halls
        });
    } catch (error) {
        console.error('Get halls error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get hall by ID
// @route   GET /api/halls/:id
// @access  Private
exports.getHallById = async (req, res) => {
    try {
        const [halls] = await db.query(
            'SELECT * FROM halls WHERE id = ?',
            [req.params.id]
        );

        if (halls.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hall not found'
            });
        }

        res.status(200).json({
            success: true,
            hall: halls[0]
        });
    } catch (error) {
        console.error('Get hall error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};