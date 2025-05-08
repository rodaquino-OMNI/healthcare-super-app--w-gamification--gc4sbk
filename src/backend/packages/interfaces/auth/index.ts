/**
 * @file Authentication Interfaces Barrel Export
 * @description Central export file for all authentication-related interfaces used across the AUSTA SuperApp backend.
 * This file provides a single import point for all auth-related interfaces, enabling clean and organized imports
 * in consuming services without requiring knowledge of the internal file structure.
 */

// ===================================================
// Core Authentication Interfaces
// ===================================================

/**
 * Core authentication interfaces for sessions, tokens, and auth state management
 */
export * from './auth.interface';

/**
 * Authentication request payload interfaces for operations like login, registration, and token refresh
 */
export * from './request.interface';

/**
 * Authentication response payload interfaces for standardized API responses
 */
export * from './response.interface';

// ===================================================
// User-Related Interfaces
// ===================================================

/**
 * User entity and DTO interfaces for consistent user representation across services
 */
export * from './user.interface';

// ===================================================
// Role-Based Access Control Interfaces
// ===================================================

/**
 * Role entity and DTO interfaces for role-based access control
 */
export * from './role.interface';

/**
 * Permission entity and DTO interfaces for fine-grained permission system
 */
export * from './permission.interface';