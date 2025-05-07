import { SetMetadata } from '@nestjs/common';
import { IPermissionContext } from '@app/auth/permissions/interfaces/permission-context.interface';

/**
 * Metadata key for permissions required by a route handler.
 * Used by the PermissionsGuard to retrieve the permissions metadata.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Type definition for permission strings in the format 'journey:resource:action'.
 * Examples: 'health:metrics:read', 'care:appointment:create', 'plan:claim:submit'
 */
export type PermissionString = string;

/**
 * Decorator that assigns permissions required to access a route handler.
 * Permissions follow the format 'journey:resource:action'.
 * 
 * @param permissions - Array of permission strings required for the route
 * @returns Decorator function that sets metadata on the route handler
 * 
 * @example
 * // Require health metrics read permission
 * @Permissions('health:metrics:read')
 * findAll() {
 *   return this.healthService.findAll();
 * }
 * 
 * @example
 * // Require multiple permissions
 * @Permissions('care:appointment:create', 'care:appointment:read')
 * createAppointment() {
 *   // Implementation
 * }
 */
export const Permissions = (...permissions: PermissionString[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Metadata key for permission context factory function.
 * Used by the PermissionsGuard to retrieve the context factory metadata.
 */
export const PERMISSION_CONTEXT_FACTORY_KEY = 'permission_context_factory';

/**
 * Type definition for a function that creates a permission context.
 * This function receives the request object and should return an IPermissionContext.
 */
export type PermissionContextFactory = (request: any) => IPermissionContext | Promise<IPermissionContext>;

/**
 * Decorator that provides a factory function to create a permission context for attribute-based access control.
 * The factory function receives the request object and should return an IPermissionContext.
 * 
 * @param factory - Function that creates a permission context from the request
 * @returns Decorator function that sets metadata on the route handler
 * 
 * @example
 * // Create a permission context with resource ownership information
 * @PermissionContext((req) => ({
 *   user: req.user,
 *   resource: {
 *     type: 'appointment',
 *     id: req.params.id,
 *     ownerId: req.user.id
 *   },
 *   journey: 'care',
 *   environment: {
 *     timestamp: new Date(),
 *     ip: req.ip
 *   }
 * }))
 * findOne(@Param('id') id: string) {
 *   return this.appointmentsService.findOne(id);
 * }
 */
export const PermissionContext = (factory: PermissionContextFactory) =>
  SetMetadata(PERMISSION_CONTEXT_FACTORY_KEY, factory);

/**
 * Metadata key for requiring all permissions instead of any.
 * When set to true, the user must have all specified permissions.
 * When false (default), the user must have at least one of the specified permissions.
 */
export const REQUIRE_ALL_PERMISSIONS_KEY = 'require_all_permissions';

/**
 * Decorator that specifies whether all permissions are required (AND logic) or any permission is sufficient (OR logic).
 * By default, only one permission is required (OR logic).
 * 
 * @param requireAll - Boolean indicating whether all permissions are required
 * @returns Decorator function that sets metadata on the route handler
 * 
 * @example
 * // Require both permissions (AND logic)
 * @RequireAllPermissions(true)
 * @Permissions('health:metrics:read', 'health:metrics:export')
 * exportMetrics() {
 *   // Implementation
 * }
 * 
 * @example
 * // Require any permission (OR logic - default behavior)
 * @RequireAllPermissions(false)
 * @Permissions('plan:claim:read', 'plan:claim:admin')
 * viewClaim() {
 *   // Implementation
 * }
 */
export const RequireAllPermissions = (requireAll: boolean) =>
  SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll);