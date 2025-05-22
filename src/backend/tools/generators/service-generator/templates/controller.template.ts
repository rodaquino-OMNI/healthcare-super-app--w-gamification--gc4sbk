import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@austa/auth/guards/roles.guard';
import { Roles } from '@austa/auth/decorators/roles.decorator';
import { Role } from '@austa/interfaces/auth/role.enum';
import { {{ pascalCase name }}Service } from '../services/{{ dashCase name }}.service';
import { LoggerService } from '@austa/logging';
import { Create{{ pascalCase name }}Dto } from '../dto/create-{{ dashCase name }}.dto';
import { Update{{ pascalCase name }}Dto } from '../dto/update-{{ dashCase name }}.dto';
import { {{ pascalCase name }}ResponseDto } from '../dto/{{ dashCase name }}-response.dto';
import { PaginationDto } from '@austa/interfaces/common/dto/pagination.dto';

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
   * Retrieves all {{ pascalCase name }} entities with pagination.
   * 
   * @param paginationDto - Pagination parameters
   * @returns A promise that resolves to an array of {{ pascalCase name }} entities.
   */
  @Get()
  @ApiOperation({ summary: 'Get all {{ camelCase name }}s', description: 'Retrieves all {{ camelCase name }}s with pagination' })
  @ApiResponse({ status: 200, description: 'List of {{ camelCase name }}s retrieved successfully', type: [{{ pascalCase name }}ResponseDto] })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{{ pascalCase name }}ResponseDto[]> {
    this.logger.log('Finding all {{ camelCase name }}s', '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.findAll(paginationDto);
  }

  /**
   * Retrieves a {{ pascalCase name }} entity by its ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns A promise that resolves to a {{ pascalCase name }} entity.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get {{ camelCase name }} by ID', description: 'Retrieves a specific {{ camelCase name }} by its ID' })
  @ApiParam({ name: 'id', description: 'The ID of the {{ camelCase name }}' })
  @ApiResponse({ status: 200, description: '{{ pascalCase name }} retrieved successfully', type: {{ pascalCase name }}ResponseDto })
  @ApiResponse({ status: 404, description: '{{ pascalCase name }} not found' })
  async findOne(@Param('id') id: string): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log(`Finding {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.findOne(id);
  }

  /**
   * Creates a new {{ pascalCase name }} entity.
   * 
   * @param create{{ pascalCase name }}Dto - The data to create the {{ pascalCase name }} with
   * @returns A promise that resolves to the created {{ pascalCase name }} entity.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create {{ camelCase name }}', description: 'Creates a new {{ camelCase name }}' })
  @ApiBody({ type: Create{{ pascalCase name }}Dto })
  @ApiResponse({ status: 201, description: '{{ pascalCase name }} created successfully', type: {{ pascalCase name }}ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Admin role' })
  async create(@Body() create{{ pascalCase name }}Dto: Create{{ pascalCase name }}Dto): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log('Creating new {{ camelCase name }}', '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.create(create{{ pascalCase name }}Dto);
  }

  /**
   * Updates an existing {{ pascalCase name }} entity.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param update{{ pascalCase name }}Dto - The data to update the {{ pascalCase name }} with
   * @returns A promise that resolves to the updated {{ pascalCase name }} entity.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update {{ camelCase name }}', description: 'Updates an existing {{ camelCase name }}' })
  @ApiParam({ name: 'id', description: 'The ID of the {{ camelCase name }} to update' })
  @ApiBody({ type: Update{{ pascalCase name }}Dto })
  @ApiResponse({ status: 200, description: '{{ pascalCase name }} updated successfully', type: {{ pascalCase name }}ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Admin role' })
  @ApiResponse({ status: 404, description: '{{ pascalCase name }} not found' })
  async update(
    @Param('id') id: string, 
    @Body() update{{ pascalCase name }}Dto: Update{{ pascalCase name }}Dto
  ): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log(`Updating {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.update(id, update{{ pascalCase name }}Dto);
  }

  /**
   * Deletes a {{ pascalCase name }} entity by its ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to delete
   * @returns A promise that resolves when the entity is deleted.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete {{ camelCase name }}', description: 'Deletes a {{ camelCase name }} by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the {{ camelCase name }} to delete' })
  @ApiResponse({ status: 204, description: '{{ pascalCase name }} deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Admin role' })
  @ApiResponse({ status: 404, description: '{{ pascalCase name }} not found' })
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Removing {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.remove(id);
  }
}