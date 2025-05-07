/**
 * @file Role service interface for the AUSTA SuperApp authentication system
 * @module auth-service/roles/interfaces
 */

import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { PaginationDto, PaginatedResponse } from '@app/shared/dto/pagination.dto';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { IRole } from './role.interface';
import { IRoleQuery } from './role-query.interface';

/**
 * Interface defining the contract for the RolesService implementation
 * Provides methods for managing roles and their permissions in the auth service
 */
export interface IRoleService {
  /**
   * Creates a new role
   * 
   * @param createRoleDto - Data for creating a new role
   * @returns Promise resolving to the created role
   * @throws AppException if role creation fails
   */
  create(createRoleDto: CreateRoleDto): Promise<Role>;

  /**
   * Retrieves all roles with optional filtering and pagination
   * 
   * @param paginationDto - Pagination parameters
   * @param filterDto - Filtering parameters
   * @returns Promise resolving to an array of roles
   * @throws AppException if retrieval fails
   */
  findAll(paginationDto: PaginationDto, filterDto: FilterDto): Promise<Role[]>;

  /**
   * Retrieves all roles with pagination metadata
   * 
   * @param paginationDto - Pagination parameters
   * @param filterDto - Filtering parameters
   * @returns Promise resolving to paginated response containing roles
   * @throws AppException if retrieval fails
   */
  findAllPaginated(paginationDto: PaginationDto, filterDto: FilterDto): Promise<PaginatedResponse<Role>>;

  /**
   * Retrieves a role by its ID
   * 
   * @param id - The role ID
   * @returns Promise resolving to the found role
   * @throws NotFoundException if role is not found
   * @throws AppException if retrieval fails
   */
  findOne(id: string): Promise<Role>;

  /**
   * Retrieves a role by its name
   * 
   * @param name - The role name
   * @returns Promise resolving to the found role
   * @throws NotFoundException if role is not found
   * @throws AppException if retrieval fails
   */
  findByName(name: string): Promise<Role>;

  /**
   * Retrieves roles by journey
   * 
   * @param journey - The journey name (health, care, plan)
   * @param paginationDto - Optional pagination parameters
   * @returns Promise resolving to an array of roles for the specified journey
   * @throws AppException if retrieval fails
   */
  findByJourney(journey: string, paginationDto?: PaginationDto): Promise<Role[]>;

  /**
   * Retrieves default roles
   * 
   * @param journey - Optional journey to filter default roles by
   * @returns Promise resolving to an array of default roles
   * @throws AppException if retrieval fails
   */
  findDefaultRoles(journey?: string): Promise<Role[]>;

  /**
   * Updates an existing role
   * 
   * @param id - The role ID
   * @param updateRoleDto - Data for updating the role
   * @returns Promise resolving to the updated role
   * @throws NotFoundException if role is not found
   * @throws AppException if update fails
   */
  update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;

  /**
   * Deletes a role by its ID
   * 
   * @param id - The role ID
   * @returns Promise resolving when the role is deleted
   * @throws NotFoundException if role is not found
   * @throws AppException if deletion fails
   */
  remove(id: string): Promise<void>;

  /**
   * Assigns permissions to a role
   * 
   * @param roleId - The role ID
   * @param assignPermissionsDto - Data containing permission IDs to assign
   * @returns Promise resolving to the updated role with assigned permissions
   * @throws NotFoundException if role or permissions are not found
   * @throws AppException if assignment fails
   */
  assignPermissions(roleId: string, assignPermissionsDto: AssignPermissionsDto): Promise<Role>;

  /**
   * Revokes permissions from a role
   * 
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs to revoke
   * @returns Promise resolving to the updated role with permissions revoked
   * @throws NotFoundException if role or permissions are not found
   * @throws AppException if revocation fails
   */
  revokePermissions(roleId: string, permissionIds: string[]): Promise<Role>;

  /**
   * Checks if a role has a specific permission
   * 
   * @param roleId - The role ID
   * @param permissionId - The permission ID
   * @returns Promise resolving to boolean indicating if role has the permission
   * @throws NotFoundException if role or permission is not found
   * @throws AppException if check fails
   */
  hasPermission(roleId: string, permissionId: string): Promise<boolean>;

  /**
   * Retrieves all permissions assigned to a role
   * 
   * @param roleId - The role ID
   * @returns Promise resolving to an array of permissions
   * @throws NotFoundException if role is not found
   * @throws AppException if retrieval fails
   */
  getRolePermissions(roleId: string): Promise<Permission[]>;

  /**
   * Searches for roles based on query parameters
   * 
   * @param query - Query parameters for searching roles
   * @param paginationDto - Optional pagination parameters
   * @returns Promise resolving to an array of roles matching the query
   * @throws AppException if search fails
   */
  searchRoles(query: IRoleQuery, paginationDto?: PaginationDto): Promise<Role[]>;

  /**
   * Validates if a role exists
   * 
   * @param roleId - The role ID to validate
   * @returns Promise resolving to boolean indicating if role exists
   * @throws AppException if validation fails
   */
  validateRoleExists(roleId: string): Promise<boolean>;

  /**
   * Counts roles based on filter criteria
   * 
   * @param filterDto - Filtering parameters
   * @returns Promise resolving to the count of roles matching the filter
   * @throws AppException if counting fails
   */
  countRoles(filterDto?: FilterDto): Promise<number>;

  /**
   * Creates multiple roles in a single transaction
   * 
   * @param createRoleDtos - Array of role creation data
   * @returns Promise resolving to an array of created roles
   * @throws AppException if bulk creation fails
   */
  createBulk(createRoleDtos: CreateRoleDto[]): Promise<Role[]>;

  /**
   * Synchronizes permissions for a role based on journey context
   * 
   * @param roleId - The role ID
   * @param journey - The journey context
   * @returns Promise resolving to the role with synchronized permissions
   * @throws NotFoundException if role is not found
   * @throws AppException if synchronization fails
   */
  syncJourneyPermissions(roleId: string, journey: string): Promise<Role>;
}