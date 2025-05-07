import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ValidationPipe, ParseUUIDPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

/**
 * Controller for managing treatment plans in the Care Journey.
 * Provides RESTful API endpoints for creating, reading, updating, and deleting treatment plans.
 */
@Controller('treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  /**
   * Initializes the TreatmentsController with required dependencies.
   * 
   * @param treatmentsService - Service for treatment plan operations
   * @param logger - Service for logging
   * @param tracing - Service for request tracing
   */
  constructor(
    private readonly treatmentsService: TreatmentsService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService
  ) {}

  /**
   * Creates a new treatment plan.
   * 
   * @param createTreatmentPlanDto - Data for creating the treatment plan
   * @param user - The authenticated user making the request
   * @returns The newly created treatment plan
   */
  @Post()
  @Roles('user', 'admin', 'provider')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false }
    })) createTreatmentPlanDto: CreateTreatmentPlanDto,
    @CurrentUser() user: any
  ): Promise<TreatmentPlan> {
    return this.tracing.createSpan('treatments.controller.create', async () => {
      this.logger.log(
        `User ${user.id} creating treatment plan: ${JSON.stringify(createTreatmentPlanDto)}`,
        'TreatmentsController'
      );
      return this.treatmentsService.create(createTreatmentPlanDto);
    });
  }

  /**
   * Retrieves all treatment plans with optional filtering and pagination.
   * 
   * @param filter - Filter criteria for the query
   * @param pagination - Pagination parameters
   * @param user - The authenticated user making the request
   * @returns A list of treatment plans matching the criteria
   */
  @Get()
  @Roles('user', 'admin', 'provider')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('filter') filter: FilterDto,
    @Query('pagination', new ValidationPipe({ transform: true })) pagination: PaginationDto,
    @CurrentUser() user: any
  ): Promise<TreatmentPlan[]> {
    return this.tracing.createSpan('treatments.controller.findAll', async () => {
      this.logger.log(
        `User ${user.id} retrieving treatment plans with filter: ${JSON.stringify(filter)} and pagination: ${JSON.stringify(pagination)}`,
        'TreatmentsController'
      );
      return this.treatmentsService.findAll(filter, pagination);
    });
  }

  /**
   * Retrieves a specific treatment plan by ID.
   * 
   * @param id - The ID of the treatment plan to retrieve
   * @param user - The authenticated user making the request
   * @returns The treatment plan with the specified ID
   */
  @Get(':id')
  @Roles('user', 'admin', 'provider')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string,
    @CurrentUser() user: any
  ): Promise<TreatmentPlan> {
    return this.tracing.createSpan('treatments.controller.findOne', async () => {
      this.logger.log(
        `User ${user.id} retrieving treatment plan with ID: ${id}`,
        'TreatmentsController'
      );
      return this.treatmentsService.findOne(id);
    });
  }

  /**
   * Updates a specific treatment plan by ID.
   * 
   * @param id - The ID of the treatment plan to update
   * @param updateTreatmentPlanDto - The data to update the treatment plan with
   * @param user - The authenticated user making the request
   * @returns The updated treatment plan
   */
  @Patch(':id')
  @Roles('user', 'admin', 'provider')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string,
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false }
    })) updateTreatmentPlanDto: UpdateTreatmentPlanDto,
    @CurrentUser() user: any
  ): Promise<TreatmentPlan> {
    return this.tracing.createSpan('treatments.controller.update', async () => {
      this.logger.log(
        `User ${user.id} updating treatment plan with ID: ${id} with data: ${JSON.stringify(updateTreatmentPlanDto)}`,
        'TreatmentsController'
      );
      return this.treatmentsService.update(id, updateTreatmentPlanDto);
    });
  }

  /**
   * Deletes a specific treatment plan by ID.
   * 
   * @param id - The ID of the treatment plan to delete
   * @param user - The authenticated user making the request
   * @returns The deleted treatment plan
   */
  @Delete(':id')
  @Roles('admin', 'provider')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string,
    @CurrentUser() user: any
  ): Promise<TreatmentPlan> {
    return this.tracing.createSpan('treatments.controller.remove', async () => {
      this.logger.log(
        `User ${user.id} deleting treatment plan with ID: ${id}`,
        'TreatmentsController'
      );
      return this.treatmentsService.remove(id);
    });
  }
}