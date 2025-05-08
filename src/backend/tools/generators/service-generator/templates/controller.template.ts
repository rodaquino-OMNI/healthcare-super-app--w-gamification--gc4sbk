import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@austa/auth';
import { RolesGuard } from '@austa/auth';
import { Roles } from '@austa/auth';
import { Role } from '@austa/interfaces/auth';
import { TraceContext, Span } from '@austa/tracing';
import { LoggerService } from '@app/shared/logging';
import { ResourceNotFoundError, BusinessRuleViolationError } from '@austa/errors/categories';
import { FilterDto, PaginationDto, SortDto } from '@austa/interfaces/common/dto';
import { {{ pascalCase name }}Service } from '../services/{{ dashCase name }}.service';
import { Create{{ pascalCase name }}Dto, Update{{ pascalCase name }}Dto } from '../dto/{{ dashCase name }}.dto';
import { {{ pascalCase name }}Entity } from '../entities/{{ dashCase name }}.entity';

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
    this.logger.setContext('{{ pascalCase name }}Controller');
  }

  /**
   * Retrieves all {{ pascalCase name }} entities with optional filtering, pagination, and sorting.
   * 
   * @param filter - Optional filtering criteria
   * @param pagination - Optional pagination parameters
   * @param sort - Optional sorting parameters
   * @param traceContext - Trace context for distributed tracing
   * @returns A promise that resolves to an array of {{ pascalCase name }} entities.
   */
  @Get()
  @ApiOperation({ summary: 'Get all {{ camelCase name }}s', description: 'Retrieves all {{ camelCase name }} entities with optional filtering, pagination, and sorting' })
  @ApiQuery({ name: 'filter', type: FilterDto, required: false })
  @ApiQuery({ name: 'pagination', type: PaginationDto, required: false })
  @ApiQuery({ name: 'sort', type: SortDto, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved {{ camelCase name }}s', type: [{{ pascalCase name }}Entity] })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid filter, pagination, or sort parameters' })
  @Span('{{ pascalCase name }}Controller.findAll')
  async findAll(
    @Query('filter') filter?: FilterDto,
    @Query('pagination') pagination?: PaginationDto,
    @Query('sort') sort?: SortDto,
    @TraceContext() traceContext?: Record<string, any>
  ): Promise<{{ pascalCase name }}Entity[]> {
    this.logger.log('Finding all {{ camelCase name }}s', { filter, pagination, sort, traceId: traceContext?.traceId });
    return this.{{ camelCase name }}Service.findAll(filter, pagination, sort, traceContext);
  }

  /**
   * Retrieves a {{ pascalCase name }} entity by its ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @param traceContext - Trace context for distributed tracing
   * @returns A promise that resolves to a {{ pascalCase name }} entity.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get {{ camelCase name }} by ID', description: 'Retrieves a specific {{ camelCase name }} by its unique identifier' })
  @ApiParam({ name: 'id', description: 'The {{ camelCase name }} ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved {{ camelCase name }}', type: {{ pascalCase name }}Entity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '{{ pascalCase name }} not found' })
  @Span('{{ pascalCase name }}Controller.findOne')
  async findOne(
    @Param('id') id: string,
    @TraceContext() traceContext?: Record<string, any>
  ): Promise<{{ pascalCase name }}Entity> {
    this.logger.log(`Finding {{ camelCase name }} with id: ${id}`, { id, traceId: traceContext?.traceId });
    
    const entity = await this.{{ camelCase name }}Service.findOne(id, traceContext);
    
    if (!entity) {
      throw new ResourceNotFoundError('{{ pascalCase name }}', id);
    }
    
    return entity;
  }

  /**
   * Creates a new {{ pascalCase name }} entity.
   * 
   * @param createDto - The data to create the {{ pascalCase name }} with
   * @param traceContext - Trace context for distributed tracing
   * @returns A promise that resolves to the created {{ pascalCase name }} entity.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create {{ camelCase name }}', description: 'Creates a new {{ camelCase name }} entity' })
  @ApiBody({ type: Create{{ pascalCase name }}Dto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created {{ camelCase name }}', type: {{ pascalCase name }}Entity })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  @Span('{{ pascalCase name }}Controller.create')
  async create(
    @Body() createDto: Create{{ pascalCase name }}Dto,
    @TraceContext() traceContext?: Record<string, any>
  ): Promise<{{ pascalCase name }}Entity> {
    this.logger.log('Creating new {{ camelCase name }}', { traceId: traceContext?.traceId });
    return this.{{ camelCase name }}Service.create(createDto, traceContext);
  }

  /**
   * Updates an existing {{ pascalCase name }} entity.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param updateDto - The data to update the {{ pascalCase name }} with
   * @param traceContext - Trace context for distributed tracing
   * @returns A promise that resolves to the updated {{ pascalCase name }} entity.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update {{ camelCase name }}', description: 'Updates an existing {{ camelCase name }} entity' })
  @ApiParam({ name: 'id', description: 'The {{ camelCase name }} ID', type: String })
  @ApiBody({ type: Update{{ pascalCase name }}Dto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully updated {{ camelCase name }}', type: {{ pascalCase name }}Entity })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '{{ pascalCase name }} not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  @Span('{{ pascalCase name }}Controller.update')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Update{{ pascalCase name }}Dto,
    @TraceContext() traceContext?: Record<string, any>
  ): Promise<{{ pascalCase name }}Entity> {
    this.logger.log(`Updating {{ camelCase name }} with id: ${id}`, { id, traceId: traceContext?.traceId });
    
    const entity = await this.{{ camelCase name }}Service.findOne(id, traceContext);
    
    if (!entity) {
      throw new ResourceNotFoundError('{{ pascalCase name }}', id);
    }
    
    return this.{{ camelCase name }}Service.update(id, updateDto, traceContext);
  }

  /**
   * Deletes a {{ pascalCase name }} entity by its ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to delete
   * @param traceContext - Trace context for distributed tracing
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
  @Span('{{ pascalCase name }}Controller.remove')
  async remove(
    @Param('id') id: string,
    @TraceContext() traceContext?: Record<string, any>
  ): Promise<void> {
    this.logger.log(`Removing {{ camelCase name }} with id: ${id}`, { id, traceId: traceContext?.traceId });
    
    const entity = await this.{{ camelCase name }}Service.findOne(id, traceContext);
    
    if (!entity) {
      throw new ResourceNotFoundError('{{ pascalCase name }}', id);
    }
    
    return this.{{ camelCase name }}Service.remove(id, traceContext);
  }
}