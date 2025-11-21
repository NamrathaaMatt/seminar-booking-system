import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h2>Seminar Booking System</h2>
                </div>
                <div className="navbar-user">
                    <span className="user-info">
                        <strong>{user?.name}</strong> ({user?.role})
                    </span>
                    <button onClick={logout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;