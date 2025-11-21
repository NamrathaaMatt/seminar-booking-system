import React, { useEffect, useState } from 'react';
import Navbar from '../Common/Navbar';
import BookingTable from './BookingTable';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const bookingsRes = await adminAPI.getAllBookings();
            const statsRes = await adminAPI.getStatistics();

            setBookings(bookingsRes.data.bookings || []);
            setStatistics(statsRes.data || {});
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="admin-container">
                <h2>Admin Dashboard</h2>

                {/* Booking Table */}
                <BookingTable 
                    bookings={bookings}
                    statistics={statistics}
                    refresh={fetchData}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
