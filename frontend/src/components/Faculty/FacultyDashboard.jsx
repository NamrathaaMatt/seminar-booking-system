import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import BookingCalendar from './BookingCalendar';
import './Faculty.css';

const FacultyDashboard = () => {
    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-content">
                <Routes>
                    <Route path="/" element={<BookingCalendar />} />
                </Routes>
            </div>
        </div>
    );
};

export default FacultyDashboard;