import { SetMetadata } from '@nestjs/common'; // v10.3.0 compatible

/**
 * Metadata key used to store roles information for route handlers.
 * This is used by the RolesGuard to determine if a user has permission to access a route.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that assigns required roles for accessing a route handler or controller.
 * This decorator is used in conjunction with the RolesGuard to implement
 * role-based access control across the AUSTA SuperApp's journey-specific endpoints.
 * 
 * It supports both core roles (like 'admin', 'user') and journey-specific roles
 * (like 'health:viewer', 'care:provider', 'plan:manager').
 * 
 * @param roles - Array of role names required for access (if user has ANY of these roles, access is granted)
 * @returns A method or class decorator that attaches role metadata
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
 * 
 * @example
 * // Apply to all routes in a controller
 * @Roles('admin')
 * @Controller('admin')
 * export class AdminController { ... }
 * 
 * @example
 * // Health Journey: Require health journey manager role
 * @Roles('health:manager')
 * @Get('health/metrics/admin')
 * getHealthMetricsAdmin() { ... }
 * 
 * @example
 * // Care Journey: Require care journey provider role
 * @Roles('care:provider')
 * @Get('care/appointments')
 * getProviderAppointments() { ... }
 * 
 * @example
 * // Plan Journey: Require plan journey admin role
 * @Roles('plan:admin')
 * @Post('plan/benefits')
 * createBenefit() { ... }
 * 
 * @example
 * // Multiple journey roles: Require either health viewer OR care viewer role
 * @Roles('health:viewer', 'care:viewer')
 * @Get('patient/summary')
 * getPatientSummary() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);