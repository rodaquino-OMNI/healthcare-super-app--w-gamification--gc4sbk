import { Permission } from '../entities/permission.entity';
import { PaginatedResponse, PaginationDto } from '@austa/interfaces/common/dto';
import { Role } from '../../roles/entities/role.entity';

/**
 * Interface defining the contract for the PermissionsService.
 * Provides methods for managing permissions across the AUSTA SuperApp.
 * 
 * Permissions follow a hierarchical format: journey:resource:action
 * Examples:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 */
export interface IPermissionService {
  /**
   * Creates a new permission
   * 
   * @param name - The name of the permission in format journey:resource:action
   * @param description - Optional description of the permission
   * @throws {AppException} If permission creation fails
   * @returns Promise resolving to the created permission
   */
  create(name: string, description?: string): Promise<Permission>;

  /**
   * Retrieves all permissions with optional pagination
   * 
   * @param pagination - Optional pagination parameters
   * @throws {AppException} If retrieving permissions fails
   * @returns Promise resolving to paginated permissions
   */
  findAll(pagination?: PaginationDto): Promise<PaginatedResponse<Permission>>;

  /**
   * Gets a permission by ID
   * 
   * @param id - The ID of the permission to retrieve
   * @throws {AppException} If permission not found or retrieval fails
   * @returns Promise resolving to the permission if found, null otherwise
   */
  findOne(id: string): Promise<Permission | null>;

  /**
   * Gets a permission by name
   * 
   * @param name - The name of the permission to retrieve
   * @throws {AppException} If retrieval fails
   * @returns Promise resolving to the permission if found, null otherwise
   */
  findByName(name: string): Promise<Permission | null>;

  /**
   * Updates a permission
   * 
   * @param id - The ID of the permission to update
   * @param name - The new name for the permission
   * @param description - Optional new description for the permission
   * @throws {AppException} If permission not found or update fails
   * @returns Promise resolving to the updated permission
   */
  update(id: string, name: string, description?: string): Promise<Permission>;

  /**
   * Deletes a permission
   * 
   * @param id - The ID of the permission to delete
   * @throws {AppException} If permission not found or deletion fails
   * @returns Promise resolving to void on successful deletion
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a permission exists by name
   * 
   * @param name - The name of the permission to check
   * @throws {AppException} If check fails
   * @returns Promise resolving to boolean indicating if permission exists
   */
  exists(name: string): Promise<boolean>;

  /**
   * Assigns a permission to a role
   * 
   * @param permissionId - The ID of the permission to assign
   * @param roleId - The ID of the role to assign the permission to
   * @throws {AppException} If permission or role not found, or assignment fails
   * @returns Promise resolving to the updated role with assigned permission
   */
  assignToRole(permissionId: string, roleId: string): Promise<Role>;

  /**
   * Removes a permission from a role
   * 
   * @param permissionId - The ID of the permission to remove
   * @param roleId - The ID of the role to remove the permission from
   * @throws {AppException} If permission or role not found, or removal fails
   * @returns Promise resolving to the updated role without the permission
   */
  removeFromRole(permissionId: string, roleId: string): Promise<Role>;

  /**
   * Gets all permissions assigned to a role
   * 
   * @param roleId - The ID of the role to get permissions for
   * @param pagination - Optional pagination parameters
   * @throws {AppException} If role not found or retrieval fails
   * @returns Promise resolving to paginated permissions assigned to the role
   */
  getPermissionsByRole(roleId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Permission>>;

  /**
   * Validates if a user has a specific permission through their assigned roles
   * 
   * @param userId - The ID of the user to check
   * @param permissionName - The name of the permission to validate
   * @throws {AppException} If validation fails
   * @returns Promise resolving to boolean indicating if user has permission
   */
  validateUserPermission(userId: string, permissionName: string): Promise<boolean>;

  /**
   * Gets all permissions for a specific journey
   * 
   * @param journey - The journey name (health, care, plan)
   * @param pagination - Optional pagination parameters
   * @throws {AppException} If retrieval fails
   * @returns Promise resolving to paginated permissions for the journey
   */
  getPermissionsByJourney(journey: string, pagination?: PaginationDto): Promise<PaginatedResponse<Permission>>;
}