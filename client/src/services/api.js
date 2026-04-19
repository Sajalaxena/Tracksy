import axios from 'axios';

// Create axios instance with base URL pointing to the API
const api = axios.create({
  baseURL: '/api',
});

// Request interceptor — attach JWT from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ledger_token');
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

export default api;
