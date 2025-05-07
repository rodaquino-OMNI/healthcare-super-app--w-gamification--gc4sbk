/**
 * Authentication Guards Barrel Export
 * 
 * This file centralizes all authentication guard exports to provide a clean public API
 * for the guards module. It allows other modules to import guards with consistent syntax
 * and improves code organization by following NestJS best practices for module structure.
 */

// Export all guards with standardized naming
export { RolesGuard } from './roles.guard';
export { JwtAuthGuard } from './jwt-auth.guard';
export { LocalAuthGuard } from './local-auth.guard';