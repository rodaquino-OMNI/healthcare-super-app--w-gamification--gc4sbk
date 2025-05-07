import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { RolesService } from '@app/auth/roles/roles.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto, AssignPermissionsDto } from '@app/auth/roles/dto';
import { JwtAuthGuard } from '@app/auth/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/auth/guards/roles.guard';
import { Roles } from '@app/auth/auth/decorators/roles.decorator';
import { AllExceptionsFilter } from '@backend/shared/exceptions/exceptions.filter';
import { PaginationDto } from '@backend/shared/dto/pagination.dto';
import { IRole } from '@app/auth/roles/interfaces/role.interface';

/**
 * Controller for managing roles in the auth service.
 * Provides endpoints for creating, retrieving, updating, and deleting roles,
 * as well as assigning permissions to roles.
 */
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(new AllExceptionsFilter())
export class RolesController {
  /**
   * Initializes the RolesController.
   * @param rolesService Service for role management operations
   */
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Creates a new role.
   * @param createRoleDto Data transfer object containing role information
   * @returns The newly created role
   */
  @Post()
  @Roles('Administrator')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<IRole> {
    return this.rolesService.create(createRoleDto);
  }

  /**
   * Retrieves all roles with optional filtering and pagination.
   * @param queryRoleDto Query parameters for filtering roles
   * @param paginationDto Pagination parameters
   * @returns A list of roles matching the query parameters
   */
  @Get()
  @Roles('Administrator')
  async findAll(
    @Query() queryRoleDto: QueryRoleDto,
    @Query() paginationDto: PaginationDto
  ): Promise<IRole[]> {
    return this.rolesService.findAll(paginationDto, queryRoleDto);
  }

  /**
   * Retrieves a role by its ID.
   * @param id The role ID
   * @returns The role if found
   */
  @Get(':id')
  @Roles('Administrator')
  async findOne(@Param('id') id: string): Promise<IRole> {
    return this.rolesService.findOne(id);
  }

  /**
   * Updates an existing role.
   * @param id The role ID
   * @param updateRoleDto Data transfer object containing updated role information
   * @returns The updated role
   */
  @Put(':id')
  @Roles('Administrator')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<IRole> {
    return this.rolesService.update(id, updateRoleDto);
  }

  /**
   * Deletes a role by its ID.
   * @param id The role ID
   */
  @Delete(':id')
  @Roles('Administrator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  /**
   * Assigns permissions to a role.
   * @param id The role ID
   * @param assignPermissionsDto Data transfer object containing permission IDs to assign
   * @returns The updated role with assigned permissions
   */
  @Post(':id/permissions')
  @Roles('Administrator')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ): Promise<IRole> {
    return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }

  /**
   * Removes permissions from a role.
   * @param id The role ID
   * @param permissionId The permission ID to remove
   */
  @Delete(':id/permissions/:permissionId')
  @Roles('Administrator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string
  ): Promise<void> {
    return this.rolesService.removePermission(id, permissionId);
  }
}