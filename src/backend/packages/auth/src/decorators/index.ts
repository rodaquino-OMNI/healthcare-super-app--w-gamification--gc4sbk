/**
 * @file Authentication Decorators Barrel File
 * @description Exports all authentication decorators from the package.
 * This barrel file simplifies imports in consuming services by providing
 * a single entry point for all authentication-related decorators.
 */

/**
 * Exports the CurrentUser decorator which extracts the authenticated user from the request.
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

/**
 * Exports the Roles decorator and ROLES_KEY constant for role-based access control.
 * The Roles decorator assigns required roles for accessing a route handler or controller.
 * The ROLES_KEY constant is used by the RolesGuard to retrieve role metadata.
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