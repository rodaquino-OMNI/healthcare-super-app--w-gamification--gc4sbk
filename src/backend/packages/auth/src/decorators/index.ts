/**
 * @file Authentication Decorators Barrel File
 * 
 * This barrel file exports all authentication decorators from the package,
 * simplifying imports in consuming services. It enables clean, organized imports
 * like '@app/auth/decorators' instead of requiring individual decorator file paths,
 * reducing duplication and ensuring consistent decorator usage across the AUSTA SuperApp
 * backend services.
 * 
 * @module auth/decorators
 */

/**
 * Decorator that assigns required roles for accessing a route handler or controller.
 * This decorator is used in conjunction with the RolesGuard to implement
 * role-based access control across the AUSTA SuperApp's journey-specific endpoints.
 * 
 * It supports both core roles (like 'admin', 'user') and journey-specific roles
 * (like 'health:viewer', 'care:provider', 'plan:manager').
 * 
 * @example
 * // Require 'admin' role to access this endpoint
 * @Roles('admin')
 * @Get('users')
 * getUsers() { ... }
 * 
 * @example
 * // Require 'admin' OR 'health:manager' roles to access this endpoint
 * @Roles('admin', 'health:manager')
 * @Get('health-metrics')
 * getHealthMetrics() { ... }
 */
export { Roles, ROLES_KEY } from './roles.decorator';

/**
 * Custom decorator to extract the current authenticated user from the request object.
 * This decorator simplifies access to user data in controller methods.
 * 
 * The user object must be attached to the request by an authentication middleware
 * or guard (typically JwtAuthGuard) before this decorator can access it.
 *
 * @example
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * // Get a specific property from the user object
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 */
export { CurrentUser } from './current-user.decorator';