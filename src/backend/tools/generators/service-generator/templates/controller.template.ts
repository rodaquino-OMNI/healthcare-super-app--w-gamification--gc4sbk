import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@nestjs/passport';
import { Roles, Role } from '@nestjs/common';
import { {{ pascalCase name }}Service } from '../services/{{ dashCase name }}.service';
import { LoggerService } from '../../../shared/src/logging/logger.service';
/** DTO imports */

/**
 * Controller for managing {{ pascalCase name }} entities.
 */
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
   * Retrieves all {{ pascalCase name }} entities.
   * 
   * @returns A promise that resolves to an array of {{ pascalCase name }} entities.
   */
  @Get()
  async findAll(): Promise<any[]> {
    this.logger.log('Finding all {{ camelCase name }}s', '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.findAll();
  }

  /**
   * Retrieves a {{ pascalCase name }} entity by its ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns A promise that resolves to a {{ pascalCase name }} entity.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    this.logger.log(`Finding {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.findOne(id);
  }

  /**
   * Creates a new {{ pascalCase name }} entity.
   * 
   * @param data - The data to create the {{ pascalCase name }} with
   * @returns A promise that resolves to the created {{ pascalCase name }} entity.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async create(@Body() data: any): Promise<any> {
    this.logger.log('Creating new {{ camelCase name }}', '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.create(data);
  }

  /**
   * Updates an existing {{ pascalCase name }} entity.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param data - The data to update the {{ pascalCase name }} with
   * @returns A promise that resolves to the updated {{ pascalCase name }} entity.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() data: any): Promise<any> {
    this.logger.log(`Updating {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.update(id, data);
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
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Removing {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Controller');
    return this.{{ camelCase name }}Service.remove(id);
  }
}