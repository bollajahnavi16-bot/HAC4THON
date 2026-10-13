import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor attaches Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('agentops_token');
        localStorage.removeItem('agentops_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  triggerWorkflow: (id) => api.post(`/incidents/${id}/trigger`),
  scanAnomalies: () => api.post('/incidents/scan'),
};

export const workflowAPI = {
  getAll: () => api.get('/workflows'),
  getById: (id) => api.get(`/workflows/${id}`),
  stop: (id, reason) => api.post(`/workflows/${id}/stop`, { reason }),
  retry: (id) => api.post(`/workflows/${id}/retry`),
};

export const approvalAPI = {
  getAll: (params) => api.get('/approvals', { params }),
  decide: (id, data) => api.post(`/approvals/${id}/decide`, data),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
};

export const metricsAPI = {
  getDashboard: () => api.get('/metrics/dashboard'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  resetSeed: () => api.post('/settings/seed-reset'),
};

export default api;
