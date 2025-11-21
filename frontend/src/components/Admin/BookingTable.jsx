import React, { useState, useEffect } from 'react';
import { adminAPI, hallAPI } from '../../services/api';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Admin.css';

const BookingTable = () => {
    const [bookings, setBookings] = useState([]);
    const [halls, setHalls] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: null,
        hall_id: '',
        status: ''
    });

    useEffect(() => {
        fetchHalls();
        fetchStatistics();
        fetchBookings();
    }, []);

    const fetchHalls = async () => {
        try {
            const response = await hallAPI.getAllHalls();
            setHalls(response.data.halls);
        } catch (error) {
            toast.error('Failed to fetch halls');
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await adminAPI.getStatistics();
            setStatistics(response.data.statistics);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = {};
            
            if (filters.start_date) {
                params.start_date = filters.start_date.toISOString().split('T')[0];
            }
            if (filters.end_date) {
                params.end_date = filters.end_date.toISOString().split('T')[0];
            }
            if (filters.hall_id) {
                params.hall_id = filters.hall_id;
            }
            if (filters.status) {
                params.status = filters.status;
            }

            const response = await adminAPI.getAllBookings(params);
            setBookings(response.data.bookings);
        } catch (error) {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = () => {
        fetchBookings();
    };

    const handleResetFilters = () => {
        setFilters({
            start_date: null,
            end_date: null,
            hall_id: '',
            status: ''
        });
        setTimeout(() => {
            fetchBookings();
        }, 100);
    };

    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) {
            return;
        }

        try {
            await adminAPI.deleteBooking(bookingId);
            toast.success('Booking deleted successfully');
            fetchBookings();
            fetchStatistics();
        } catch (error) {
            toast.error('Failed to delete booking');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatTime = (timeString) => {
        return timeString.substring(0, 5);
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Admin Dashboard - All Bookings</h2>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon total">📊</div>
                        <div className="stat-details">
                            <h3>{statistics.total_bookings}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon upcoming">📅</div>
                        <div className="stat-details">
                            <h3>{statistics.upcoming_bookings}</h3>
                            <p>Upcoming Events</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon past">✓</div>
                        <div className="stat-details">
                            <h3>{statistics.past_bookings}</h3>
                            <p>Past Events</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <h3>Filter Bookings</h3>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Start Date</label>
                        <DatePicker
                            selected={filters.start_date}
                            onChange={(date) => handleFilterChange('start_date', date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Select start date"
                            className="filter-input"
                            isClearable
                        />
                    </div>

                    <div className="filter-group">
                        <label>End Date</label>
                        <DatePicker
                            selected={filters.end_date}
                            onChange={(date) => handleFilterChange('end_date', date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Select end date"
                            className="filter-input"
                            isClearable
                        />
                    </div>

                    <div className="filter-group">
                        <label>Hall</label>
                        <select
                            value={filters.hall_id}
                            onChange={(e) => handleFilterChange('hall_id', e.target.value)}
                            className="filter-input"
                        >
                            <option value="">All Halls</option>
                            {halls.map(hall => (
                                <option key={hall.id} value={hall.id}>
                                    {hall.hall_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="filter-input"
                        >
                            <option value="">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="filter-actions">
                    <button onClick={handleApplyFilters} className="btn-apply">
                        Apply Filters
                    </button>
                    <button onClick={handleResetFilters} className="btn-reset">
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="table-section">
                <h3>All Bookings ({bookings.length})</h3>
                
                {loading ? (
                    <div className="loading">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div className="no-data">No bookings found</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event Name</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Hall</th>
                                    <th>Department</th>
                                    <th>Booked By</th>
                                    <th>Faculty In-charge</th>
                                    <th>Audience</th>
                                    <th>Chairs</th>
                                    <th>Systems Required</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(booking => (
                                    <tr key={booking.id}>
                                        <td>{booking.id}</td>
                                        <td className="event-name">{booking.event_name}</td>
                                        <td>{formatDate(booking.booking_date)}</td>
                                        <td className="time-cell">
                                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                        </td>
                                        <td>{booking.hall_name}</td>
                                        <td>{booking.department}</td>
                                        <td>{booking.booked_by}</td>
                                        <td>{booking.faculty_incharge}</td>
                                        <td>{booking.expected_audience}</td>
                                        <td>{booking.chairs_required}</td>
                                        <td>
                                            <div className="systems-list">
                                                {booking.needs_projector && <span className="system-tag">Projector</span>}
                                                {booking.needs_mic && <span className="system-tag">Mic</span>}
                                                {booking.needs_sound_system && <span className="system-tag">Sound</span>}
                                                {!booking.needs_projector && !booking.needs_mic && !booking.needs_sound_system && (
                                                    <span className="no-systems">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${booking.status}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteBooking(booking.id)}
                                                className="btn-delete"
                                                title="Delete Booking"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Hall Usage Statistics */}
            {statistics && statistics.bookings_by_hall && (
                <div className="hall-stats-section">
                    <h3>Hall Usage Statistics</h3>
                    <div className="hall-stats-grid">
                        {statistics.bookings_by_hall.map(hall => (
                            <div key={hall.hall_name} className="hall-stat-card">
                                <h4>{hall.hall_name}</h4>
                                <div className="hall-stat-count">{hall.booking_count}</div>
                                <p>Total Bookings</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingTable;