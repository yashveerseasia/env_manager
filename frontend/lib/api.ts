import axios from 'axios';
import Cookies from 'js-cookie';
import type {
  EnvShareCreatePayload,
  EnvShareResponse,
  EnvShareRecord,
  EnvShareViewResponse,
} from '@/types/share';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('access_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Projects endpoints
export const projectsApi = {
  getAll: () => api.get('/projects'),
  create: (name: string) => api.post('/projects', { name }),
};

// Environments endpoints
export const environmentsApi = {
  getByProject: (projectId: number) => api.get(`/environments/${projectId}`),
  create: (name: string, projectId: number) =>
    api.post('/environments', { name, project_id: projectId }),
};

// Env variables endpoints
export const envVarsApi = {
  getByEnvironment: (environmentId: number, revealSecrets: boolean = false) =>
    api.get(`/env/${environmentId}`, { params: { reveal_secrets: revealSecrets } }),
  getById: (id: number, revealSecret: boolean = false) =>
    api.get(`/env/item/${id}`, { params: { reveal_secret: revealSecret } }),
  create: (key: string, value: string, isSecret: boolean, environmentId: number) =>
    api.post('/env', { key, value, is_secret: isSecret, environment_id: environmentId }),
  update: (id: number, data: { key?: string; value?: string; is_secret?: boolean }) =>
    api.put(`/env/${id}`, data),
  delete: (id: number) => api.delete(`/env/${id}`),
  download: (environmentId: number) =>
    api.get(`/env/download/${environmentId}`, { responseType: 'blob' }),
};

// Share / Env share endpoints
export const envShareApi = {
  create: (environmentId: number, payload: EnvShareCreatePayload) =>
    api.post<EnvShareResponse>(`/env/${environmentId}/share`, payload),
  list: (environmentId: number) =>
    api.get<EnvShareRecord[]>(`/env/${environmentId}/shares`),
  revoke: (shareId: number) => api.delete(`/share/${shareId}`),
  view: (token: string, password: string) =>
    api.post<EnvShareViewResponse>(`/share/${token}/view`, { password }),
  download: (token: string, password: string) =>
    api.post(`/share/${token}/download`, { password }, { responseType: 'blob' }),
};

export default api;

