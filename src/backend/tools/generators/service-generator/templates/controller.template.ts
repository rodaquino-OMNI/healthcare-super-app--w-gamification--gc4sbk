import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { Role } from '@austa/interfaces/auth/role.enum';
import { CorrelationId } from '@app/shared/decorators/correlation-id.decorator';
import { FilterDto, PaginationDto } from '@austa/interfaces/common/dto';
import { {{ pascalCase name }}Service } from '../services/{{ dashCase name }}.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { {{ pascalCase name }}Dto, Create{{ pascalCase name }}Dto, Update{{ pascalCase name }}Dto } from '../dto/{{ dashCase name }}.dto';
import { User } from '@austa/interfaces/auth/user.interface';

/**
 * Controller for managing {{ pascalCase name }} entities.
 */
@ApiTags('{{ dashCase name }}s')
@Controller('{{ dashCase name }}s')
export class {{ pascalCase name }}Controller {
  /**
   * Injects the {{ pascalCase name }} service and logger service.
   */
  constructor(
    private readonly {{ camelCase name }}Service: {{ pascalCase name }}Service,
    private readonly logger: LoggerService
  ) {
    this.logger.log('Controller initialized', '{{ pascalCase name }}Controller');
  }

  /**
   * Retrieves all {{ pascalCase name }} entities with optional filtering and pagination.
   * 
   * @param correlationId - Unique identifier for tracking the request
   * @param filterDto - Filter criteria for the query
   * @param paginationDto - Pagination parameters
   * @returns A promise that resolves to a paginated array of {{ pascalCase name }} entities.
   */
  @Get()
  @ApiOperation({ summary: 'Get all {{ camelCase name }}s', description: 'Retrieves all {{ camelCase name }} entities with optional filtering and pagination' })
  @ApiQuery({ type: FilterDto, required: false, description: 'Filter criteria' })
  @ApiQuery({ type: PaginationDto, required: false, description: 'Pagination parameters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved {{ camelCase name }}s', type: [{{ pascalCase name }}Dto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findAll(
    @CorrelationId() correlationId: string,
    @Query() filterDto: FilterDto,
    @Query() paginationDto: PaginationDto
  ): Promise<{{ pascalCase name }}Dto[]> {
    this.logger.log(`Finding all {{ camelCase name }}s with filters: ${JSON.stringify(filterDto)}`, '{{ pascalCase name }}Controller', { correlationId });
    return this.{{ camelCase name }}Service.findAll(filterDto, paginationDto);
  }

  /**
   * Retrieves a {{ pascalCase name }} entity by its ID.
   * 
   * @param correlationId - Unique identifier for tracking the request
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns A promise that resolves to a {{ pascalCase name }} entity.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get {{ camelCase name }} by ID', description: 'Retrieves a specific {{ camelCase name }} by its ID' })
  @ApiParam({ name: 'id', description: 'The {{ camelCase name }} ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved {{ camelCase name }}', type: {{ pascalCase name }}Dto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '{{ pascalCase name }} not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findOne(
    @CorrelationId() correlationId: string,
    @Param('id') id: string
  ): Promise<{{ pascalCase name }}Dto> {
    this.logger.log(`Finding {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller', { correlationId });
    return this.{{ camelCase name }}Service.findOne(id);
  }

  /**
   * Creates a new {{ pascalCase name }} entity.
   * 
   * @param correlationId - Unique identifier for tracking the request
   * @param data - The data to create the {{ pascalCase name }} with
   * @param user - The authenticated user creating the entity
   * @returns A promise that resolves to the created {{ pascalCase name }} entity.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create {{ camelCase name }}', description: 'Creates a new {{ camelCase name }} entity' })
  @ApiBody({ type: Create{{ pascalCase name }}Dto, description: 'The {{ camelCase name }} data' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created {{ camelCase name }}', type: {{ pascalCase name }}Dto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async create(
    @CorrelationId() correlationId: string,
    @Body() data: Create{{ pascalCase name }}Dto,
    @CurrentUser() user: User
  ): Promise<{{ pascalCase name }}Dto> {
    this.logger.log(`Creating new {{ camelCase name }} by user: ${user.id}`, '{{ pascalCase name }}Controller', { correlationId });
    return this.{{ camelCase name }}Service.create(data, user.id);
  }

  /**
   * Updates an existing {{ pascalCase name }} entity.
   * 
   * @param correlationId - Unique identifier for tracking the request
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param data - The data to update the {{ pascalCase name }} with
   * @param user - The authenticated user updating the entity
   * @returns A promise that resolves to the updated {{ pascalCase name }} entity.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update {{ camelCase name }}', description: 'Updates an existing {{ camelCase name }} entity' })
  @ApiParam({ name: 'id', description: 'The {{ camelCase name }} ID', type: String })
  @ApiBody({ type: Update{{ pascalCase name }}Dto, description: 'The updated {{ camelCase name }} data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully updated {{ camelCase name }}', type: {{ pascalCase name }}Dto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '{{ pascalCase name }} not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async update(
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
    @Body() data: Update{{ pascalCase name }}Dto,
    @CurrentUser() user: User
  ): Promise<{{ pascalCase name }}Dto> {
    this.logger.log(`Updating {{ camelCase name }} with id: ${id} by user: ${user.id}`, '{{ pascalCase name }}Controller', { correlationId });
    return this.{{ camelCase name }}Service.update(id, data, user.id);
  }

  /**
   * Deletes a {{ pascalCase name }} entity by its ID.
   * 
   * @param correlationId - Unique identifier for tracking the request
   * @param id - The ID of the {{ pascalCase name }} to delete
   * @param user - The authenticated user deleting the entity
   * @returns A promise that resolves when the entity is deleted.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete {{ camelCase name }}', description: 'Deletes a {{ camelCase name }} entity' })
  @ApiParam({ name: 'id', description: 'The {{ camelCase name }} ID', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Successfully deleted {{ camelCase name }}' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '{{ pascalCase name }} not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async delete(
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    this.logger.log(`Removing {{ camelCase name }} with id: ${id} by user: ${user.id}`, '{{ pascalCase name }}Controller', { correlationId });
    return this.{{ camelCase name }}Service.remove(id, user.id);
  }
}