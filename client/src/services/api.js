import axios from 'axios';

// Create axios instance with base URL pointing to the API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Request interceptor — attach JWT from cookie or localStorage if present
api.interceptors.request.use((config) => {
  // Try cookie first, fall back to localStorage
  const cookieMatch = document.cookie
    .split('; ')
    .find((row) => row.startsWith('tracksy_token='));
  const token = cookieMatch
    ? decodeURIComponent(cookieMatch.split('=')[1])
    : localStorage.getItem('tracksy_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 by clearing storage and redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const signup = (email, password) =>
  api.post('/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// Habits endpoints
export const getHabits = (month) =>
  api.get(`/habits?month=${month}`);

export const carryOverHabits = (fromMonth, toMonth) =>
  api.post('/habits/carry-over', { fromMonth, toMonth });

export const createHabit = (name, type, month) =>
  api.post('/habits', { name, type, month });

export const updateCell = (id, day, value) =>
  api.patch(`/habits/${id}`, { day, value });

export const renameHabit = (id, name) =>
  api.put(`/habits/${id}/rename`, { name });

export const deleteHabit = (id) =>
  api.delete(`/habits/${id}`);

export const sendChat = (messages) =>
  api.post('/chat', { messages });

// Profile endpoints
export const getProfile = () =>
  api.get('/profile');

export const updateProfileData = (profileData) =>
  api.put('/profile', profileData);

export default api;
