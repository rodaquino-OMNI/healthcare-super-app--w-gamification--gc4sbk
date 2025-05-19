/**
 * @file useAuth.ts
 * @description Hook for accessing authentication context
 */

import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';

/**
 * Hook to use the authentication context
 * Provides access to authentication data and functionality
 * 
 * @example
 * const { userId, isAuthenticated, login, logout } = useAuth();
 * 
 * // Check if user is authenticated
 * if (isAuthenticated) {
 *   // User is logged in
 * }
 * 
 * // Log in a user
 * const handleLogin = async () => {
 *   await login(email, password);
 * };
 * 
 * // Log out a user
 * const handleLogout = async () => {
 *   await logout();
 * };
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};