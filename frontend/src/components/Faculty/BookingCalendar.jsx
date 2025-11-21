import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { hallAPI, bookingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import BookingForm from './BookingForm';
import './Faculty.css';

const BookingCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [halls, setHalls] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedHall, setSelectedHall] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHalls();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchBookingsForDate();
        }
    }, [selectedDate]);

    const fetchHalls = async () => {
        try {
            const response = await hallAPI.getAllHalls();
            setHalls(response.data.halls);
        } catch (error) {
            toast.error('Failed to fetch halls');
        }
    };

    const fetchBookingsForDate = async () => {
        try {
            setLoading(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const response = await bookingAPI.getBookingsByDate(dateStr);
            setBookings(response.data.bookings);
        } catch (error) {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = (hall) => {
        setSelectedHall(hall);
        setShowBookingForm(true);
    };

    const handleBookingSuccess = () => {
        setShowBookingForm(false);
        setSelectedHall(null);
        fetchBookingsForDate();
        toast.success('Booking created successfully!');
    };

    const getBookingsForHall = (hallId) => {
        return bookings.filter(b => b.hall_id === hallId);
    };

    const isTimeSlotAvailable = (hallId, startTime, endTime) => {
        const hallBookings = getBookingsForHall(hallId);
        return !hallBookings.some(booking => {
            return (
                (startTime >= booking.start_time && startTime < booking.end_time) ||
                (endTime > booking.start_time && endTime <= booking.end_time) ||
                (startTime <= booking.start_time && endTime >= booking.end_time)
            );
        });
    };

    return (
        <div className="booking-calendar">
            <div className="calendar-header">
                <h2>Book Seminar Hall / Auditorium</h2>
                <div className="date-picker-container">
                    <label>Select Date:</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        className="date-picker-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading bookings...</div>
            ) : (
                <div className="halls-grid">
                    {halls.map(hall => {
                        const hallBookings = getBookingsForHall(hall.id);
                        return (
                            <div key={hall.id} className="hall-card">
                                <div className="hall-header">
                                    <h3>{hall.hall_name}</h3>
                                    <span className="hall-capacity">
                                        Capacity: {hall.capacity}
                                    </span>
                                </div>

                                <div className="hall-facilities">
                                    <strong>Facilities:</strong>
                                    <ul>
                                        {hall.has_projector && <li>✓ Projector</li>}
                                        {hall.has_sound_system && <li>✓ Sound System</li>}
                                        {hall.has_ac && <li>✓ AC</li>}
                                        {hall.has_stage && <li>✓ Stage</li>}
                                        <li>✓ {hall.total_chairs} Chairs</li>
                                    </ul>
                                </div>

                                {hallBookings.length > 0 ? (
                                    <div className="hall-bookings">
                                        <strong>Bookings for {selectedDate.toLocaleDateString()}:</strong>
                                        <div className="booking-list">
                                            {hallBookings.map(booking => (
                                                <div key={booking.id} className="booking-item">
                                                    <div className="booking-time">
                                                        {booking.start_time} - {booking.end_time}
                                                    </div>
                                                    <div className="booking-event">
                                                        {booking.event_name}
                                                    </div>
                                                    <div className="booking-dept">
                                                        {booking.department}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-bookings">
                                        No bookings for this date
                                    </div>
                                )}

                                <button
                                    className="btn-book"
                                    onClick={() => handleBookNow(hall)}
                                >
                                    Book This Hall
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showBookingForm && (
                <BookingForm
                    hall={selectedHall}
                    date={selectedDate}
                    existingBookings={getBookingsForHall(selectedHall.id)}
                    onClose={() => {
                        setShowBookingForm(false);
                        setSelectedHall(null);
                    }}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
};

export default BookingCalendar;