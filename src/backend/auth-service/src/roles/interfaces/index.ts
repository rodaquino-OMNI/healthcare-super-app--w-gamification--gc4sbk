/**
 * @file Barrel export file for role interfaces in the AUSTA SuperApp authentication system
 * @module auth-service/roles/interfaces
 * 
 * This file re-exports all interfaces from the roles/interfaces directory,
 * providing a single import point for consuming code. This simplifies imports
 * throughout the auth service and enhances maintainability by centralizing
 * all role-related interfaces in one location.
 */

/**
 * Core role interfaces
 */
export { IRole, RoleJourney } from './role.interface';
export { IRoleService } from './role-service.interface';
export { IRoleQuery } from './role-query.interface';

/**
 * Role-Permission relationship interfaces
 */
export {
  IRolePermission,
  CreateRolePermissionDto,
  UpdateRolePermissionDto,
  RolePermissionResponseDto,
  BulkRolePermissionAssignmentDto
} from './role-permission.interface';