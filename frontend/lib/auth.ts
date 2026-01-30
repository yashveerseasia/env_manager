import Cookies from 'js-cookie';
import { authApi } from './api';

export const setAuthToken = (token: string) => {
  Cookies.set('access_token', token, { expires: 7 }); // 7 days
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get('access_token');
};

export const removeAuthToken = () => {
  Cookies.remove('access_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const login = async (email: string, password: string) => {
  try {
    const response = await authApi.login(email, password);
    const { access_token } = response.data;
    setAuthToken(access_token);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Login failed',
    };
  }
};

export const register = async (email: string, password: string) => {
  try {
    const response = await authApi.register(email, password);
    const { access_token } = response.data;
    setAuthToken(access_token);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Registration failed',
    };
  }
};

export const logout = () => {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

