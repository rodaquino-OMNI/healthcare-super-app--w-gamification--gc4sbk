import { PrismaTransaction } from '@austa/database';
import { Repository } from '@austa/interfaces/common/dto/repository.interface';
import { Permission } from '../entities/permission.entity';
import { FilterDto } from '@austa/interfaces/common/dto/filter.dto';

/**
 * Permission Repository Interface
 * 
 * Extends the generic Repository interface with permission-specific operations.
 * This interface ensures that any permission repository implementation provides
 * the required methods for database operations while maintaining the contract
 * set by the base repository pattern.
 */
export interface IPermissionRepository extends Repository<Permission> {
  /**
   * Finds a permission by its name
   * 
   * @param name - The name of the permission to find
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to the found permission or null if not found
   */
  findByName(name: string, tx?: PrismaTransaction): Promise<Permission | null>;
  
  /**
   * Finds permissions by journey context
   * 
   * @param journey - The journey identifier (health, care, plan)
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to an array of permissions for the specified journey
   */
  findByJourney(journey: string, tx?: PrismaTransaction): Promise<Permission[]>;
  
  /**
   * Finds permissions by resource within a journey
   * 
   * @param journey - The journey identifier (health, care, plan)
   * @param resource - The resource name within the journey
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to an array of permissions for the specified resource
   */
  findByResource(journey: string, resource: string, tx?: PrismaTransaction): Promise<Permission[]>;
  
  /**
   * Finds permissions by action across all journeys
   * 
   * @param action - The action name (read, write, delete, etc.)
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to an array of permissions for the specified action
   */
  findByAction(action: string, tx?: PrismaTransaction): Promise<Permission[]>;
  
  /**
   * Finds permissions by multiple criteria with advanced filtering
   * 
   * @param filter - The filter criteria including journey context
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to an array of filtered permissions
   */
  findWithFilter(filter: FilterDto & { 
    journeys?: string[];
    resources?: string[];
    actions?: string[];
  }, tx?: PrismaTransaction): Promise<Permission[]>;
  
  /**
   * Creates a new permission with transaction support
   * 
   * @param permission - The permission to create
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to the created permission
   */
  createWithTransaction(permission: Omit<Permission, 'id'>, tx: PrismaTransaction): Promise<Permission>;
  
  /**
   * Updates an existing permission with transaction support
   * 
   * @param id - The ID of the permission to update
   * @param permission - The partial permission data to update
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to the updated permission
   */
  updateWithTransaction(id: string, permission: Partial<Permission>, tx: PrismaTransaction): Promise<Permission>;
  
  /**
   * Deletes a permission with transaction support
   * 
   * @param id - The ID of the permission to delete
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to a boolean indicating success
   */
  deleteWithTransaction(id: string, tx: PrismaTransaction): Promise<boolean>;
  
  /**
   * Assigns permissions to a role with transaction support
   * 
   * @param roleId - The ID of the role
   * @param permissionIds - Array of permission IDs to assign
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves when the operation completes
   */
  assignToRole(roleId: string, permissionIds: string[], tx?: PrismaTransaction): Promise<void>;
  
  /**
   * Removes permissions from a role with transaction support
   * 
   * @param roleId - The ID of the role
   * @param permissionIds - Array of permission IDs to remove
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves when the operation completes
   */
  removeFromRole(roleId: string, permissionIds: string[], tx?: PrismaTransaction): Promise<void>;
  
  /**
   * Finds all permissions assigned to a specific role
   * 
   * @param roleId - The ID of the role
   * @param tx - Optional transaction for atomic operations
   * @returns A promise that resolves to an array of permissions assigned to the role
   */
  findByRoleId(roleId: string, tx?: PrismaTransaction): Promise<Permission[]>;
}