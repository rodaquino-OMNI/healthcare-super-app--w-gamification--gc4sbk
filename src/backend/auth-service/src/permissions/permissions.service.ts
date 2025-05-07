import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@app/shared/logging';
import { Permission } from '@austa/interfaces/auth';
import { Role } from '@austa/interfaces/auth';
import {
  DatabaseError,
  ResourceNotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  retryWithBackoff
} from '@austa/errors';

// Validation schemas
const permissionNameSchema = z.string().min(3).max(100);
const permissionIdSchema = z.string().refine(
  (val) => !isNaN(Number(val)),
  { message: 'Permission ID must be a valid number' }
);

/**
 * Service for managing permissions in the authentication system
 * Provides methods for creating, retrieving, updating, and deleting permissions
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new LoggerService(PermissionsService.name);
  
  /**
   * Constructor
   * @param prisma The Prisma database service for data access
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new permission
   * 
   * @param name The name of the permission to create
   * @returns The created permission
   * @throws {ValidationError} If the permission name is invalid
   * @throws {BusinessRuleViolationError} If a permission with the same name already exists
   * @throws {DatabaseError} If there's an error during database operation
   */
  async create(name: string): Promise<Permission> {
    this.logger.log(`Creating permission: ${name}`);
    
    try {
      // Validate the permission name
      const validatedName = permissionNameSchema.parse(name);
      
      // Check if permission already exists
      const existingPermission = await this.prisma.permission.findFirst({
        where: { name: validatedName }
      });
      
      if (existingPermission) {
        throw new BusinessRuleViolationError(
          `Permission with name '${validatedName}' already exists`,
          'PERM_DUPLICATE',
          { name: validatedName }
        );
      }
      
      // Create a new permission in the database using a transaction
      return await this.prisma.$transaction(async (tx) => {
        const permission = await tx.permission.create({
          data: {
            name: validatedName,
            description: `Permission for ${validatedName}`
          }
        });
        
        return permission;
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid permission name',
          'PERM_INVALID_NAME',
          { issues: error.issues }
        );
      }
      
      // Re-throw business rule errors
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to create permission: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to create permission',
        'PERM_CREATE_FAILED',
        { name },
        error
      );
    }
  }

  /**
   * Retrieves all permissions
   * 
   * @returns All permissions
   * @throws {DatabaseError} If there's an error during database operation
   */
  async findAll(): Promise<Permission[]> {
    this.logger.log('Retrieving all permissions');
    
    try {
      // Use retry mechanism for database operation
      return await retryWithBackoff(
        () => this.prisma.permission.findMany({
          orderBy: { name: 'asc' }
        }),
        {
          maxRetries: 3,
          initialDelay: 100,
          maxDelay: 1000,
          retryCondition: (error) => {
            // Only retry on connection or timeout errors
            return error.code === 'P1001' || error.code === 'P1008';
          }
        }
      );
    } catch (error) {
      this.logger.error(`Failed to retrieve permissions: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to retrieve permissions',
        'PERM_FIND_ALL_FAILED',
        {},
        error
      );
    }
  }

  /**
   * Gets a permission by ID
   * 
   * @param id The ID of the permission to retrieve
   * @returns The permission, if found
   * @throws {ValidationError} If the permission ID is invalid
   * @throws {ResourceNotFoundError} If the permission is not found
   * @throws {DatabaseError} If there's an error during database operation
   */
  async findOne(id: string): Promise<Permission> {
    this.logger.log(`Retrieving permission with ID: ${id}`);
    
    try {
      // Validate the permission ID
      const validatedId = permissionIdSchema.parse(id);
      const numericId = Number(validatedId);
      
      // Get the permission from the database
      const permission = await this.prisma.permission.findUnique({
        where: { id: numericId }
      });
      
      if (!permission) {
        throw new ResourceNotFoundError(
          `Permission with ID ${id} not found`,
          'PERM_NOT_FOUND',
          { id }
        );
      }
      
      return permission;
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid permission ID',
          'PERM_INVALID_ID',
          { issues: error.issues, id }
        );
      }
      
      // Re-throw resource not found errors
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to retrieve permission: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to retrieve permission',
        'PERM_FIND_ONE_FAILED',
        { id },
        error
      );
    }
  }

  /**
   * Updates a permission
   * 
   * @param id The ID of the permission to update
   * @param name The new name for the permission
   * @returns The updated permission
   * @throws {ValidationError} If the permission ID or name is invalid
   * @throws {ResourceNotFoundError} If the permission is not found
   * @throws {BusinessRuleViolationError} If a permission with the same name already exists
   * @throws {DatabaseError} If there's an error during database operation
   */
  async update(id: string, name: string): Promise<Permission> {
    this.logger.log(`Updating permission with ID: ${id}`);
    
    try {
      // Validate inputs
      const validatedId = permissionIdSchema.parse(id);
      const validatedName = permissionNameSchema.parse(name);
      const numericId = Number(validatedId);
      
      // Check if permission exists
      const existingPermission = await this.prisma.permission.findUnique({
        where: { id: numericId }
      });
      
      if (!existingPermission) {
        throw new ResourceNotFoundError(
          `Permission with ID ${id} not found`,
          'PERM_NOT_FOUND',
          { id }
        );
      }
      
      // Check if another permission with the same name exists
      const duplicatePermission = await this.prisma.permission.findFirst({
        where: {
          name: validatedName,
          id: { not: numericId }
        }
      });
      
      if (duplicatePermission) {
        throw new BusinessRuleViolationError(
          `Permission with name '${validatedName}' already exists`,
          'PERM_DUPLICATE',
          { name: validatedName }
        );
      }
      
      // Update the permission in the database using a transaction
      return await this.prisma.$transaction(async (tx) => {
        const updatedPermission = await tx.permission.update({
          where: { id: numericId },
          data: {
            name: validatedName,
            description: `Permission for ${validatedName}`
          }
        });
        
        return updatedPermission;
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid permission data',
          'PERM_INVALID_DATA',
          { issues: error.issues, id, name }
        );
      }
      
      // Re-throw resource not found and business rule errors
      if (error instanceof ResourceNotFoundError || 
          error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to update permission: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to update permission',
        'PERM_UPDATE_FAILED',
        { id, name },
        error
      );
    }
  }

  /**
   * Deletes a permission
   * 
   * @param id The ID of the permission to delete
   * @throws {ValidationError} If the permission ID is invalid
   * @throws {ResourceNotFoundError} If the permission is not found
   * @throws {DatabaseError} If there's an error during database operation
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting permission with ID: ${id}`);
    
    try {
      // Validate the permission ID
      const validatedId = permissionIdSchema.parse(id);
      const numericId = Number(validatedId);
      
      // Check if permission exists
      const existingPermission = await this.prisma.permission.findUnique({
        where: { id: numericId }
      });
      
      if (!existingPermission) {
        throw new ResourceNotFoundError(
          `Permission with ID ${id} not found`,
          'PERM_NOT_FOUND',
          { id }
        );
      }
      
      // Delete the permission from the database using a transaction
      await this.prisma.$transaction(async (tx) => {
        // First check if this permission is assigned to any roles
        const rolePermissions = await tx.rolePermission.findMany({
          where: { permissionId: numericId }
        });
        
        if (rolePermissions.length > 0) {
          throw new BusinessRuleViolationError(
            `Cannot delete permission as it is assigned to ${rolePermissions.length} role(s)`,
            'PERM_IN_USE',
            { id, roleCount: rolePermissions.length }
          );
        }
        
        // Delete the permission
        await tx.permission.delete({
          where: { id: numericId }
        });
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid permission ID',
          'PERM_INVALID_ID',
          { issues: error.issues, id }
        );
      }
      
      // Re-throw resource not found and business rule errors
      if (error instanceof ResourceNotFoundError || 
          error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to delete permission: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to delete permission',
        'PERM_DELETE_FAILED',
        { id },
        error
      );
    }
  }
  
  /**
   * Assigns a permission to a role
   * 
   * @param permissionId The ID of the permission to assign
   * @param roleId The ID of the role to assign the permission to
   * @throws {ValidationError} If any ID is invalid
   * @throws {ResourceNotFoundError} If the permission or role is not found
   * @throws {BusinessRuleViolationError} If the permission is already assigned to the role
   * @throws {DatabaseError} If there's an error during database operation
   */
  async assignToRole(permissionId: string, roleId: string): Promise<void> {
    this.logger.log(`Assigning permission ${permissionId} to role ${roleId}`);
    
    try {
      // Validate inputs
      const validatedPermissionId = permissionIdSchema.parse(permissionId);
      const validatedRoleId = permissionIdSchema.parse(roleId); // Using same schema as both are numeric IDs
      const numericPermissionId = Number(validatedPermissionId);
      const numericRoleId = Number(validatedRoleId);
      
      await this.prisma.$transaction(async (tx) => {
        // Check if permission exists
        const permission = await tx.permission.findUnique({
          where: { id: numericPermissionId }
        });
        
        if (!permission) {
          throw new ResourceNotFoundError(
            `Permission with ID ${permissionId} not found`,
            'PERM_NOT_FOUND',
            { permissionId }
          );
        }
        
        // Check if role exists
        const role = await tx.role.findUnique({
          where: { id: numericRoleId }
        });
        
        if (!role) {
          throw new ResourceNotFoundError(
            `Role with ID ${roleId} not found`,
            'ROLE_NOT_FOUND',
            { roleId }
          );
        }
        
        // Check if permission is already assigned to role
        const existingAssignment = await tx.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: numericRoleId,
              permissionId: numericPermissionId
            }
          }
        });
        
        if (existingAssignment) {
          throw new BusinessRuleViolationError(
            `Permission ${permissionId} is already assigned to role ${roleId}`,
            'PERM_ALREADY_ASSIGNED',
            { permissionId, roleId }
          );
        }
        
        // Create the assignment
        await tx.rolePermission.create({
          data: {
            roleId: numericRoleId,
            permissionId: numericPermissionId
          }
        });
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid ID format',
          'PERM_INVALID_ID_FORMAT',
          { issues: error.issues, permissionId, roleId }
        );
      }
      
      // Re-throw resource not found and business rule errors
      if (error instanceof ResourceNotFoundError || 
          error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to assign permission to role: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to assign permission to role',
        'PERM_ASSIGN_FAILED',
        { permissionId, roleId },
        error
      );
    }
  }
  
  /**
   * Removes a permission from a role
   * 
   * @param permissionId The ID of the permission to remove
   * @param roleId The ID of the role to remove the permission from
   * @throws {ValidationError} If any ID is invalid
   * @throws {ResourceNotFoundError} If the permission assignment is not found
   * @throws {DatabaseError} If there's an error during database operation
   */
  async removeFromRole(permissionId: string, roleId: string): Promise<void> {
    this.logger.log(`Removing permission ${permissionId} from role ${roleId}`);
    
    try {
      // Validate inputs
      const validatedPermissionId = permissionIdSchema.parse(permissionId);
      const validatedRoleId = permissionIdSchema.parse(roleId);
      const numericPermissionId = Number(validatedPermissionId);
      const numericRoleId = Number(validatedRoleId);
      
      await this.prisma.$transaction(async (tx) => {
        // Check if the assignment exists
        const existingAssignment = await tx.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: numericRoleId,
              permissionId: numericPermissionId
            }
          }
        });
        
        if (!existingAssignment) {
          throw new ResourceNotFoundError(
            `Permission ${permissionId} is not assigned to role ${roleId}`,
            'PERM_ASSIGNMENT_NOT_FOUND',
            { permissionId, roleId }
          );
        }
        
        // Delete the assignment
        await tx.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId: numericRoleId,
              permissionId: numericPermissionId
            }
          }
        });
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid ID format',
          'PERM_INVALID_ID_FORMAT',
          { issues: error.issues, permissionId, roleId }
        );
      }
      
      // Re-throw resource not found errors
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle database errors
      this.logger.error(`Failed to remove permission from role: ${error.message}`, error.stack);
      throw new DatabaseError(
        'Failed to remove permission from role',
        'PERM_REMOVE_FAILED',
        { permissionId, roleId },
        error
      );
    }
  }
}