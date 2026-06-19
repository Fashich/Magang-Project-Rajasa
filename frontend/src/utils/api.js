/**
 * API Utility Module
 * 
 * Provides centralized API communication layer with automatic
 * authentication header injection and error handling.
 * 
 * @module utils/api
 * @author SMK Rajasa Development Team
 */

import auth from './auth';

// Base API URL - adjust based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * API utility object for making HTTP requests
 */
export const api = {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint (e.g., '/me', '/siswa/presensi')
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    });
  },

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  },

  /**
   * Core request method with authentication and error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authentication token if available
    const token = auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized - auto logout
      if (response.status === 401) {
        auth.clearAuth();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login user
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login response with user data and token
   */
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    
    // Save authentication data
    // Note: Backend may or may not return token field
    if (response.user) {
      // Save token if exists, otherwise save a placeholder
      const token = response.token || `session_${Date.now()}`;
      auth.setToken(token);
      auth.setUser(response.user);
    }
    
    return response;
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear local auth data
      auth.clearAuth();
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    return api.get('/me');
  }
};

/**
 * Siswa (Student) API endpoints
 */
export const siswaApi = {
  /**
   * Get siswa dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    return api.get('/siswa/dashboard');
  },

  /**
   * Get siswa presensi (attendance) data
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Presensi data
   */
  async getPresensi(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/siswa/presensi${params ? '?' + params : ''}`);
  },

  /**
   * Get siswa nilai (grades) data
   * @returns {Promise<Object>} Nilai data
   */
  async getNilai() {
    return api.get('/siswa/nilai');
  },

  /**
   * Get academic calendar
   * @returns {Promise<Object>} Calendar data with PDF URL
   */
  async getKalenderAkademik() {
    return api.get('/siswa/kalender-akademik');
  }
};

export default api;
