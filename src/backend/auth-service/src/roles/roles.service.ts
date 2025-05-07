import { Injectable } from '@nestjs/common';
import { Role } from '@app/auth/roles/entities/role.entity';
import { Permission } from '@app/auth/permissions/entities/permission.entity';
import { PrismaService } from '@app/shared/database/prisma.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ResourceNotFoundError, BusinessRuleViolationError } from '@app/errors/categories';
import { DatabaseError } from '@app/errors/categories';
import { CreateRoleDto } from '@app/auth/roles/dto/create-role.dto';
import { UpdateRoleDto } from '@app/auth/roles/dto/update-role.dto';
import { IRoleService } from '@app/auth/roles/interfaces/role-service.interface';

/**
 * Service class for managing roles in the authentication system.
 * Provides business logic for role management, including CRUD operations
 * for roles, role assignment/revocation, and role validation.
 */
@Injectable()
export class RolesService implements IRoleService {
  /**
   * Initializes the RolesService.
   * @param prisma Prisma service for database operations
   * @param logger Logger service for logging
   */
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {
    // Sets the logger context to 'RolesService'.
    this.logger.setContext('RolesService');
  }

  /**
   * Creates a new role.
   * @param createRoleDto The role creation data
   * @returns The newly created role.
   * @throws BusinessRuleViolationError if a role with the same name already exists
   * @throws DatabaseError if there's an issue with the database operation
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      // Logs the creation attempt with structured data
      this.logger.log({
        message: `Creating new role`,
        data: { roleName: createRoleDto.name, journey: createRoleDto.journey }
      });
      
      // Creates the role using Prisma.
      const role = await this.prisma.role.create({
        data: createRoleDto,
        include: { permissions: true }
      });
      
      // Logs successful creation
      this.logger.log({
        message: `Successfully created role`,
        data: { roleId: role.id, roleName: role.name }
      });
      
      // Returns the created role.
      return role;
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        this.logger.error({
          message: `Failed to create role: name already exists`,
          data: { roleName: createRoleDto.name },
          error
        });
        throw new BusinessRuleViolationError(
          `Role with name '${createRoleDto.name}' already exists`,
          { roleName: createRoleDto.name }
        );
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to create role due to database error`,
        data: { roleName: createRoleDto.name },
        error
      });
      throw new DatabaseError(
        `Failed to create role: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Retrieves all roles, with optional filtering and pagination.
   * @param paginationDto Pagination parameters
   * @param filterDto Filtering parameters
   * @returns A list of roles.
   * @throws DatabaseError if there's an issue with the database operation
   */
  async findAll(paginationDto?: PaginationDto, filterDto?: FilterDto): Promise<Role[]> {
    try {
      // Logs the attempt to find all roles with structured data
      this.logger.log({
        message: 'Finding all roles',
        data: { pagination: paginationDto, filter: filterDto }
      });
      
      // Retrieves all roles from the database using Prisma, applying pagination and filtering if provided.
      const roles = await this.prisma.role.findMany({
        skip: paginationDto?.skip,
        take: paginationDto?.limit,
        where: filterDto?.where,
        orderBy: filterDto?.orderBy,
        include: filterDto?.include || { permissions: true }
      });
      
      // Logs successful retrieval
      this.logger.log({
        message: `Successfully retrieved ${roles.length} roles`,
        data: { count: roles.length }
      });
      
      // Returns the list of roles.
      return roles;
    } catch (error) {
      // Handle database errors
      this.logger.error({
        message: `Failed to retrieve roles due to database error`,
        data: { pagination: paginationDto, filter: filterDto },
        error
      });
      throw new DatabaseError(
        `Failed to retrieve roles: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Retrieves a role by its ID.
   * @param id The role ID
   * @returns The role if found.
   * @throws ResourceNotFoundError if the role is not found
   * @throws DatabaseError if there's an issue with the database operation
   */
  async findOne(id: string): Promise<Role> {
    try {
      // Logs the attempt to find a role by ID with structured data
      this.logger.log({
        message: `Finding role by ID`,
        data: { roleId: id }
      });
      
      // Retrieves the role from the database using Prisma.
      const role = await this.prisma.role.findUnique({
        where: { id: parseInt(id) },
        include: { permissions: true }
      });
      
      // If the role is not found, throws a ResourceNotFoundError.
      if (!role) {
        this.logger.warn({
          message: `Role not found`,
          data: { roleId: id }
        });
        throw new ResourceNotFoundError(
          `Role with ID ${id} not found`,
          { resourceType: 'Role', resourceId: id }
        );
      }
      
      // Logs successful retrieval
      this.logger.log({
        message: `Successfully retrieved role`,
        data: { roleId: id, roleName: role.name }
      });
      
      // Returns the role.
      return role;
    } catch (error) {
      // If the error is already a ResourceNotFoundError, rethrow it
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to retrieve role due to database error`,
        data: { roleId: id },
        error
      });
      throw new DatabaseError(
        `Failed to retrieve role: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Updates an existing role.
   * @param id The role ID
   * @param updateRoleDto The role update data
   * @returns The updated role.
   * @throws ResourceNotFoundError if the role is not found
   * @throws BusinessRuleViolationError if updating to a name that already exists
   * @throws DatabaseError if there's an issue with the database operation
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      // Logs the attempt to update a role with structured data
      this.logger.log({
        message: `Updating role`,
        data: { roleId: id, updateData: updateRoleDto }
      });
      
      // Check if role exists first
      const existingRole = await this.prisma.role.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingRole) {
        this.logger.warn({
          message: `Role not found for update`,
          data: { roleId: id }
        });
        throw new ResourceNotFoundError(
          `Role with ID ${id} not found`,
          { resourceType: 'Role', resourceId: id }
        );
      }
      
      // Updates the role in the database using Prisma.
      const role = await this.prisma.role.update({
        where: { id: parseInt(id) },
        data: updateRoleDto,
        include: { permissions: true }
      });
      
      // Logs successful update
      this.logger.log({
        message: `Successfully updated role`,
        data: { roleId: id, roleName: role.name }
      });
      
      // Returns the updated role.
      return role;
    } catch (error) {
      // If the error is already a ResourceNotFoundError, rethrow it
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        this.logger.error({
          message: `Failed to update role: name already exists`,
          data: { roleId: id, roleName: updateRoleDto.name },
          error
        });
        throw new BusinessRuleViolationError(
          `Role with name '${updateRoleDto.name}' already exists`,
          { roleName: updateRoleDto.name }
        );
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to update role due to database error`,
        data: { roleId: id },
        error
      });
      throw new DatabaseError(
        `Failed to update role: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Deletes a role by its ID.
   * @param id The role ID
   * @throws ResourceNotFoundError if the role is not found
   * @throws DatabaseError if there's an issue with the database operation
   */
  async remove(id: string): Promise<void> {
    try {
      // Logs the attempt to remove a role with structured data
      this.logger.log({
        message: `Removing role`,
        data: { roleId: id }
      });
      
      // Check if role exists first
      const existingRole = await this.prisma.role.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingRole) {
        this.logger.warn({
          message: `Role not found for deletion`,
          data: { roleId: id }
        });
        throw new ResourceNotFoundError(
          `Role with ID ${id} not found`,
          { resourceType: 'Role', resourceId: id }
        );
      }
      
      // Deletes the role from the database using Prisma.
      await this.prisma.role.delete({
        where: { id: parseInt(id) }
      });
      
      // Logs successful deletion
      this.logger.log({
        message: `Successfully removed role`,
        data: { roleId: id, roleName: existingRole.name }
      });
    } catch (error) {
      // If the error is already a ResourceNotFoundError, rethrow it
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle foreign key constraint violations
      if (error.code === 'P2003') {
        this.logger.error({
          message: `Failed to delete role: role is still in use`,
          data: { roleId: id },
          error
        });
        throw new BusinessRuleViolationError(
          `Cannot delete role with ID ${id} because it is still assigned to users`,
          { roleId: id }
        );
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to delete role due to database error`,
        data: { roleId: id },
        error
      });
      throw new DatabaseError(
        `Failed to delete role: ${error.message}`,
        { cause: error }
      );
    }
  }
  
  /**
   * Assigns permissions to a role.
   * @param roleId The role ID
   * @param permissionIds Array of permission IDs to assign
   * @returns The updated role with assigned permissions
   * @throws ResourceNotFoundError if the role is not found
   * @throws DatabaseError if there's an issue with the database operation
   */
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    try {
      // Logs the attempt to assign permissions with structured data
      this.logger.log({
        message: `Assigning permissions to role`,
        data: { roleId, permissionIds }
      });
      
      // Check if role exists first
      const existingRole = await this.prisma.role.findUnique({
        where: { id: parseInt(roleId) },
        include: { permissions: true }
      });
      
      if (!existingRole) {
        this.logger.warn({
          message: `Role not found for permission assignment`,
          data: { roleId }
        });
        throw new ResourceNotFoundError(
          `Role with ID ${roleId} not found`,
          { resourceType: 'Role', resourceId: roleId }
        );
      }
      
      // Get existing permission IDs to avoid duplicates
      const existingPermissionIds = existingRole.permissions.map(p => p.id);
      
      // Filter out permissions that are already assigned
      const newPermissionIds = permissionIds
        .map(id => parseInt(id))
        .filter(id => !existingPermissionIds.includes(id));
      
      if (newPermissionIds.length === 0) {
        this.logger.log({
          message: `No new permissions to assign`,
          data: { roleId }
        });
        return existingRole;
      }
      
      // Update the role with the new permissions
      const updatedRole = await this.prisma.role.update({
        where: { id: parseInt(roleId) },
        data: {
          permissions: {
            connect: newPermissionIds.map(id => ({ id }))
          }
        },
        include: { permissions: true }
      });
      
      // Logs successful permission assignment
      this.logger.log({
        message: `Successfully assigned permissions to role`,
        data: { roleId, assignedPermissions: newPermissionIds.length }
      });
      
      return updatedRole;
    } catch (error) {
      // If the error is already a ResourceNotFoundError, rethrow it
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to assign permissions due to database error`,
        data: { roleId, permissionIds },
        error
      });
      throw new DatabaseError(
        `Failed to assign permissions: ${error.message}`,
        { cause: error }
      );
    }
  }
  
  /**
   * Revokes permissions from a role.
   * @param roleId The role ID
   * @param permissionIds Array of permission IDs to revoke
   * @returns The updated role with permissions revoked
   * @throws ResourceNotFoundError if the role is not found
   * @throws DatabaseError if there's an issue with the database operation
   */
  async revokePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    try {
      // Logs the attempt to revoke permissions with structured data
      this.logger.log({
        message: `Revoking permissions from role`,
        data: { roleId, permissionIds }
      });
      
      // Check if role exists first
      const existingRole = await this.prisma.role.findUnique({
        where: { id: parseInt(roleId) }
      });
      
      if (!existingRole) {
        this.logger.warn({
          message: `Role not found for permission revocation`,
          data: { roleId }
        });
        throw new ResourceNotFoundError(
          `Role with ID ${roleId} not found`,
          { resourceType: 'Role', resourceId: roleId }
        );
      }
      
      // Update the role by disconnecting the specified permissions
      const updatedRole = await this.prisma.role.update({
        where: { id: parseInt(roleId) },
        data: {
          permissions: {
            disconnect: permissionIds.map(id => ({ id: parseInt(id) }))
          }
        },
        include: { permissions: true }
      });
      
      // Logs successful permission revocation
      this.logger.log({
        message: `Successfully revoked permissions from role`,
        data: { roleId, revokedPermissions: permissionIds.length }
      });
      
      return updatedRole;
    } catch (error) {
      // If the error is already a ResourceNotFoundError, rethrow it
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      // Handle other database errors
      this.logger.error({
        message: `Failed to revoke permissions due to database error`,
        data: { roleId, permissionIds },
        error
      });
      throw new DatabaseError(
        `Failed to revoke permissions: ${error.message}`,
        { cause: error }
      );
    }
  }
}