/**
 * Authentication Utility Functions
 * 
 * This module provides utilities for managing user authentication,
 * including token storage, user session management, and role-based access control.
 * 
 * @module utils/auth
 * @author SMK Rajasa Development Team
 */

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

/**
 * Authentication utility object containing all auth-related functions
 */
export const auth = {
  /**
   * Save authentication token to localStorage
   * @param {string} token - JWT or session token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  /**
   * Retrieve authentication token from localStorage
   * @returns {string|null} Token or null if not found
   */
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Remove authentication token from localStorage
   */
  removeToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  /**
   * Save user data to localStorage
   * @param {Object} userData - User information object
   */
  setUser(userData) {
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  },

  /**
   * Retrieve user data from localStorage
   * @returns {Object|null} User data object or null if not found
   */
  getUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Remove user data from localStorage
   */
  removeUser() {
    localStorage.removeItem(USER_DATA_KEY);
  },

  /**
   * Check if user is currently authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  /**
   * Get user's primary role
   * @returns {string|null} Role slug (e.g., 'siswa', 'guru', 'admin', 'operator')
   */
  getUserRole() {
    const user = this.getUser();
    return user?.primary_role_slug || null;
  },

  /**
   * Get dashboard path based on user role
   * @returns {string|null} Dashboard path or null if not authenticated
   */
  getDashboardPath() {
    const user = this.getUser();
    return user?.dashboard_path || null;
  },

  /**
   * Check if user has specific role
   * @param {string} role - Role to check (e.g., 'siswa', 'guru')
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    return this.getUserRole() === role;
  },

  /**
   * Clear all authentication data (logout)
   */
  clearAuth() {
    this.removeToken();
    this.removeUser();
  },

  /**
   * Complete logout process
   * Clears auth data and redirects to login
   */
  logout() {
    this.clearAuth();
    window.location.href = '/';
  }
};

/**
 * Default export for convenience
 */
export default auth;
