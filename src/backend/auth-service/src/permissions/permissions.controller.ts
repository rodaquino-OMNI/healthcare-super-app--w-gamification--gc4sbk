import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, ValidationPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from '@app/auth/permissions/permissions.service';
import { JwtAuthGuard } from '@app/auth/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/roles/guards/roles.guard';
import { Roles } from '@app/auth/roles/decorators/roles.decorator';
import { Permission } from '@austa/interfaces/auth';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { RevokePermissionDto } from './dto/revoke-permission.dto';
import { FilterPermissionsDto } from './dto/filter-permissions.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

/**
 * Controller for managing permissions in the authentication system
 * Provides endpoints for creating, retrieving, updating, and deleting permissions
 * Also handles assigning permissions to roles and checking permission status
 */
@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  /**
   * Constructor
   * @param permissionsService The service for managing permissions
   */
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Creates a new permission
   * 
   * @param createPermissionDto The data for creating a new permission
   * @returns The created permission
   */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The permission has been successfully created.',
    type: PermissionResponseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createPermissionDto: CreatePermissionDto
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.create(createPermissionDto.name);
    return new PermissionResponseDto(permission);
  }

  /**
   * Retrieves all permissions with optional filtering
   * 
   * @param filterDto Optional filtering criteria
   * @returns Array of permissions
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all permissions.',
    type: [PermissionResponseDto]
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    filterDto: FilterPermissionsDto
  ): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionsService.findAll();
    // In a real implementation, we would use the filterDto to filter the results
    // For now, we'll just return all permissions
    return permissions.map(permission => new PermissionResponseDto(permission));
  }

  /**
   * Retrieves a permission by ID
   * 
   * @param id The ID of the permission to retrieve
   * @returns The permission with the specified ID
   */
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the permission to retrieve' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the permission with the specified ID.',
    type: PermissionResponseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.findOne(id);
    return new PermissionResponseDto(permission);
  }

  /**
   * Updates a permission
   * 
   * @param id The ID of the permission to update
   * @param updatePermissionDto The data for updating the permission
   * @returns The updated permission
   */
  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'The ID of the permission to update' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The permission has been successfully updated.',
    type: PermissionResponseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or ID format.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updatePermissionDto: UpdatePermissionDto
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.update(id, updatePermissionDto.name);
    return new PermissionResponseDto(permission);
  }

  /**
   * Deletes a permission
   * 
   * @param id The ID of the permission to delete
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'The ID of the permission to delete' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The permission has been successfully deleted.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete permission as it is assigned to roles.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.permissionsService.delete(id);
  }

  /**
   * Assigns a permission to a role
   * 
   * @param assignPermissionDto The data for assigning a permission to a role
   */
  @Post('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The permission has been successfully assigned to the role.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission or role not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permission is already assigned to the role.' })
  async assignToRole(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    assignPermissionDto: AssignPermissionDto
  ): Promise<void> {
    await this.permissionsService.assignToRole(
      assignPermissionDto.permissionId,
      assignPermissionDto.roleId
    );
  }

  /**
   * Removes a permission from a role
   * 
   * @param revokePermissionDto The data for removing a permission from a role
   */
  @Post('revoke')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The permission has been successfully removed from the role.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Permission assignment not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async removeFromRole(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    revokePermissionDto: RevokePermissionDto
  ): Promise<void> {
    await this.permissionsService.removeFromRole(
      revokePermissionDto.permissionId,
      revokePermissionDto.roleId
    );
  }

  /**
   * Checks if a permission exists
   * 
   * @param name The name of the permission to check
   * @returns True if the permission exists, false otherwise
   */
  @Get('check/:name')
  @Roles('admin')
  @ApiOperation({ summary: 'Check if a permission exists' })
  @ApiParam({ name: 'name', description: 'The name of the permission to check' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns whether the permission exists.',
    schema: {
      type: 'object',
      properties: {
        exists: {
          type: 'boolean',
          description: 'Whether the permission exists'
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden resource.' })
  async checkPermission(@Param('name') name: string): Promise<{ exists: boolean }> {
    try {
      const permissions = await this.permissionsService.findAll();
      const exists = permissions.some(permission => permission.name === name);
      return { exists };
    } catch (error) {
      return { exists: false };
    }
  }
}