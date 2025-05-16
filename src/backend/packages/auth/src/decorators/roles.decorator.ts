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
 * that follow the format 'journey:permission' (e.g., 'health:viewer', 'care:provider').
 * 
 * @param roles - Array of role names required for access (if user has ANY of these roles, access is granted)
 * @returns A method or class decorator that attaches role metadata
 * 
 * @example Core Roles
 * // Require 'admin' role to access this endpoint
 * @Roles('admin')
 * @Get('users')
 * getUsers() { ... }
 * 
 * @example Health Journey Roles
 * // Require 'health:manager' OR 'health:admin' roles to access this endpoint
 * @Roles('health:manager', 'health:admin')
 * @Get('health-metrics')
 * getHealthMetrics() { ... }
 * 
 * // Health journey-specific roles include:
 * // - health:viewer - Can view health data but not modify
 * // - health:editor - Can view and edit health data
 * // - health:manager - Can manage health goals and insights
 * // - health:admin - Full access to health journey features
 * 
 * @example Care Journey Roles
 * // Require 'care:provider' role to access this endpoint
 * @Roles('care:provider')
 * @Get('appointments')
 * getAppointments() { ... }
 * 
 * // Care journey-specific roles include:
 * // - care:viewer - Can view care information but not modify
 * // - care:scheduler - Can schedule and manage appointments
 * // - care:provider - Healthcare provider with access to patient data
 * // - care:admin - Full access to care journey features
 * 
 * @example Plan Journey Roles
 * // Require 'plan:manager' role to access this endpoint
 * @Roles('plan:manager')
 * @Get('claims')
 * getClaims() { ... }
 * 
 * // Plan journey-specific roles include:
 * // - plan:viewer - Can view plan and benefits information
 * // - plan:member - Can submit claims and access member benefits
 * // - plan:manager - Can manage plan configurations and approvals
 * // - plan:admin - Full access to plan journey features
 * 
 * @example Controller-Level Application
 * // Apply to all routes in a controller
 * @Roles('admin')
 * @Controller('admin')
 * export class AdminController { ... }
 * 
 * @example Multiple Role Types
 * // Require 'admin' OR any journey admin role
 * @Roles('admin', 'health:admin', 'care:admin', 'plan:admin')
 * @Get('system-status')
 * getSystemStatus() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Export named constants and functions for better compatibility with barrel imports