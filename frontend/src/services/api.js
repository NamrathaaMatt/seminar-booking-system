import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    signup: (userData) => api.post('/auth/signup', userData),
    getMe: () => api.get('/auth/me')
};

// Hall APIs
export const hallAPI = {
    getAllHalls: () => api.get('/halls'),
    getHallById: (id) => api.get(`/halls/${id}`)
};

// Booking APIs
export const bookingAPI = {
    createBooking: (bookingData) => api.post('/bookings', bookingData),
    getBookingsByDate: (date) => api.get(`/bookings/date/${date}`),
    getMyBookings: () => api.get('/bookings/my-bookings'),
    checkAvailability: (data) => api.post('/bookings/check-availability', data)
};

// Admin APIs
export const adminAPI = {
    getAllBookings: (params) => api.get('/admin/bookings', { params }),
    getStatistics: () => api.get('/admin/statistics'),
    deleteBooking: (id) => api.delete(`/admin/bookings/${id}`)
};

export default api;