import React, { useState } from 'react';
import { bookingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './Faculty.css';

const BookingForm = ({ hall, date, existingBookings, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        event_name: '',
        start_time: '',
        end_time: '',
        expected_audience: '',
        department: user?.department || '',
        faculty_incharge: user?.name || '',
        chairs_required: '',
        needs_projector: false,
        needs_mic: false,
        needs_sound_system: false,
        additional_requirements: ''
    });
    const [loading, setLoading] = useState(false);
    const [conflicts, setConflicts] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const checkConflicts = async () => {
        if (!formData.start_time || !formData.end_time) {
            return false;
        }

        try {
            const response = await bookingAPI.checkAvailability({
                hall_id: hall.id,
                booking_date: date.toISOString().split('T')[0],
                start_time: formData.start_time,
                end_time: formData.end_time
            });

            if (!response.data.available) {
                setConflicts(response.data.conflicts);
                return true;
            }
            setConflicts([]);
            return false;
        } catch (error) {
            console.error('Error checking availability:', error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (parseInt(formData.chairs_required) > hall.total_chairs) {
            toast.error(`Chairs required cannot exceed hall capacity (${hall.total_chairs})`);
            return;
        }

        if (formData.start_time >= formData.end_time) {
            toast.error('End time must be after start time');
            return;
        }

        // Check for conflicts
        const hasConflicts = await checkConflicts();
        if (hasConflicts) {
            toast.error('Time slot conflict detected. Please choose another time.');
            return;
        }

        setLoading(true);

        try {
            const bookingData = {
                ...formData,
                hall_id: hall.id,
                booking_date: date.toISOString().split('T')[0]
            };

            await bookingAPI.createBooking(bookingData);
            onSuccess();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create booking';
            toast.error(message);
            
            if (error.response?.data?.conflicts) {
                setConflicts(error.response.data.conflicts);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content booking-form-modal">
                <div className="modal-header">
                    <h2>Book {hall.hall_name}</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="booking-info">
                        <p><strong>Date:</strong> {date.toLocaleDateString()}</p>
                        <p><strong>Hall Capacity:</strong> {hall.capacity} people</p>
                        <p><strong>Available Chairs:</strong> {hall.total_chairs}</p>
                    </div>

                    {existingBookings.length > 0 && (
                        <div className="existing-bookings-alert">
                            <strong>⚠️ Existing bookings for this date:</strong>
                            {existingBookings.map(booking => (
                                <div key={booking.id} className="alert-booking">
                                    {booking.start_time} - {booking.end_time}: {booking.event_name} ({booking.department})
                                </div>
                            ))}
                        </div>
                    )}

                    {conflicts.length > 0 && (
                        <div className="conflict-alert">
                            <strong>❌ Time Conflict Detected:</strong>
                            {conflicts.map(conflict => (
                                <div key={conflict.id}>
                                    {conflict.start_time} - {conflict.end_time}: {conflict.event_name}
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="booking-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Event Name *</label>
                                <input
                                    type="text"
                                    name="event_name"
                                    value={formData.event_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter event name"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    onBlur={checkConflicts}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    onBlur={checkConflicts}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Expected Audience *</label>
                                <input
                                    type="number"
                                    name="expected_audience"
                                    value={formData.expected_audience}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    max={hall.capacity}
                                    placeholder="Number of attendees"
                                />
                            </div>

                            <div className="form-group">
                                <label>Chairs Required *</label>
                                <input
                                    type="number"
                                    name="chairs_required"
                                    value={formData.chairs_required}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    max={hall.total_chairs}
                                    placeholder={`Max: ${hall.total_chairs}`}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Department *</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    placeholder="Department name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Faculty In-charge *</label>
                                <input
                                    type="text"
                                    name="faculty_incharge"
                                    value={formData.faculty_incharge}
                                    onChange={handleChange}
                                    required
                                    placeholder="Faculty name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Required Systems:</label>
                            <div className="checkbox-group">
                                {hall.has_projector && (
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="needs_projector"
                                            checked={formData.needs_projector}
                                            onChange={handleChange}
                                        />
                                        Projector
                                    </label>
                                )}
                                {hall.has_sound_system && (
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="needs_mic"
                                            checked={formData.needs_mic}
                                            onChange={handleChange}
                                        />
                                        Microphone
                                    </label>
                                )}
                                {hall.has_sound_system && (
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="needs_sound_system"
                                            checked={formData.needs_sound_system}
                                            onChange={handleChange}
                                        />
                                        Sound System
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Additional Requirements</label>
                            <textarea
                                name="additional_requirements"
                                value={formData.additional_requirements}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Any special requirements..."
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading || conflicts.length > 0}
                            >
                                {loading ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;