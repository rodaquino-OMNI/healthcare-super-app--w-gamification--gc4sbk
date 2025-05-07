/**
 * Barrel export file for auth-service interfaces
 * 
 * This file centralizes and exports all shared interfaces from the auth-service's
 * top-level interfaces folder. It provides a single import point for consuming
 * shared interfaces across all auth-service modules.
 * 
 * @module interfaces
 */

// Export all interfaces
export * from './token.interface';
export * from './common.interface';
export * from './config.interface';
export * from './error.interface';
export * from './http-response.interface';
export * from './user-context.interface';
export * from './auth-service.interface';