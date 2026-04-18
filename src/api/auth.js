import apiClient from './client';

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Register a new admin and their organization (creates a Tenant on the backend).
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @param {string} orgName - Becomes the Tenant name
 */
export const register = async (email, password, fullName, orgName) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    fullName,
    orgName,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await apiClient.post('/auth/reset-password', { token, password });
  return response.data;
};
