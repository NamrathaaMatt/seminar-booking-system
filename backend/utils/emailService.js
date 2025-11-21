const nodemailer = require('nodemailer');
const db = require('../config/db');

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send booking confirmation to faculty
exports.sendBookingConfirmation = async (booking) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: booking.user_email,
            subject: `Booking Confirmation - ${booking.event_name}`,
            html: `
                <h2>Booking Confirmed</h2>
                <p>Dear ${booking.booked_by},</p>
                <p>Your booking has been confirmed with the following details:</p>
                <ul>
                    <li><strong>Event:</strong> ${booking.event_name}</li>
                    <li><strong>Hall:</strong> ${booking.hall_name}</li>
                    <li><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</li>
                    <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
                    <li><strong>Department:</strong> ${booking.department}</li>
                    <li><strong>Expected Audience:</strong> ${booking.expected_audience}</li>
                    <li><strong>Chairs Required:</strong> ${booking.chairs_required}</li>
                </ul>
                ${booking.needs_projector || booking.needs_mic || booking.needs_sound_system ? `
                <p><strong>Required Systems:</strong></p>
                <ul>
                    ${booking.needs_projector ? '<li>Projector</li>' : ''}
                    ${booking.needs_mic ? '<li>Microphone</li>' : ''}
                    ${booking.needs_sound_system ? '<li>Sound System</li>' : ''}
                </ul>
                ` : ''}
                ${booking.additional_requirements ? `<p><strong>Additional Requirements:</strong> ${booking.additional_requirements}</p>` : ''}
                <p>Thank you!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to faculty');
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

// Notify system handlers
exports.notifySystemHandlers = async (booking) => {
    try {
        const requirements = [];
        
        if (booking.needs_projector) requirements.push('projector');
        if (booking.needs_mic) requirements.push('mic');
        if (booking.needs_sound_system) requirements.push('sound_system');

        if (requirements.length === 0) return;

        // Get relevant system handlers
        const [handlers] = await db.query(
            'SELECT * FROM system_handlers WHERE system_type IN (?)',
            [requirements]
        );

        for (const handler of handlers) {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: handler.email,
                subject: `System Setup Required - ${booking.event_name}`,
                html: `
                    <h2>System Setup Required</h2>
                    <p>Dear ${handler.name},</p>
                    <p>Your assistance is required for the following event:</p>
                    <ul>
                        <li><strong>Event:</strong> ${booking.event_name}</li>
                        <li><strong>Hall:</strong> ${booking.hall_name}</li>
                        <li><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</li>
                        <li><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</li>
                        <li><strong>Department:</strong> ${booking.department}</li>
                        <li><strong>Faculty In-charge:</strong> ${booking.faculty_incharge}</li>
                    </ul>
                    <p><strong>Your System Type:</strong> ${handler.system_type}</p>
                    ${booking.additional_requirements ? `<p><strong>Additional Notes:</strong> ${booking.additional_requirements}</p>` : ''}
                    <p>Please ensure the ${handler.system_type} is ready before the event starts.</p>
                    <p>For any queries, please contact: ${booking.booked_by}</p>
                    <p>Thank you!</p>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Notification sent to ${handler.name} (${handler.system_type})`);
        }
    } catch (error) {
        console.error('Error notifying system handlers:', error);
    }
};