import { CustomDecorator, SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store roles information in route handlers.
 * This constant is used internally by the RolesGuard to extract role requirements.
 */
export declare const ROLES_KEY = "roles";

/**
 * Decorator that assigns roles to a class or method for authorization purposes.
 * 
 * @param roles - One or more role identifiers that are required to access the decorated resource
 * @returns A NestJS custom decorator that sets metadata for role-based authorization
 * 
 * @example
 * // Apply to a controller (all routes)
 * @Roles('admin')
 * export class AdminController {}
 * 
 * @example
 * // Apply to a specific route handler
 * @Roles('admin', 'supervisor')
 * @Get('protected-resource')
 * getProtectedResource() {}
 */
export declare const Roles: (...roles: string[]) => CustomDecorator<typeof ROLES_KEY>;