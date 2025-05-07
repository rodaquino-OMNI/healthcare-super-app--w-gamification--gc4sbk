import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '@app/health/health.service';
import { CreateMetricDto } from '@app/health/dto/create-metric.dto';
import { UpdateMetricDto } from '@app/health/dto/update-metric.dto';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { AUTH_INSUFFICIENT_PERMISSIONS } from '@app/shared/constants/error-codes.constants';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { HealthMetric } from '@austa/interfaces/health/metric';
import { ApiErrorResponse } from '@austa/interfaces/api/error.types';

/**
 * Handles incoming HTTP requests related to health data.
 */
@ApiTags('Health')
@Controller('health')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AllExceptionsFilter)
export class HealthController {
  /**
   * Initializes the HealthController.
   * @param healthService The HealthService to inject.
   */
  constructor(
    @Inject(HealthService)
    private readonly healthService: HealthService,
  ) {}

  /**
   * Creates a new health metric for a user.
   * @param recordId The ID of the health record to associate the metric with.
   * @param createMetricDto The data for creating the new health metric.
   * @returns The newly created HealthMetric entity.
   */
  @Post(':recordId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new health metric', 
    description: 'Creates a new health metric for a user and associates it with the specified health record.'
  })
  @ApiParam({ 
    name: 'recordId', 
    description: 'The ID of the health record to associate the metric with', 
    type: String 
  })
  @ApiBody({ 
    type: CreateMetricDto, 
    description: 'The data for creating the new health metric' 
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The health metric has been successfully created.', 
    type: HealthMetric 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data provided.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have permission to create health metrics.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'An error occurred while creating the health metric.', 
    type: ApiErrorResponse 
  })
  async createHealthMetric(
    @Param('recordId') recordId: string,
    @Body() createMetricDto: CreateMetricDto,
  ): Promise<HealthMetric> {
    // Calls the healthService to create a new health metric.
    return await this.healthService.createHealthMetric(recordId, createMetricDto);
  }

  /**
   * Updates an existing health metric for a user.
   * @param id The ID of the health metric to update.
   * @param updateMetricDto The data for updating the health metric.
   * @returns The updated HealthMetric entity.
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update an existing health metric', 
    description: 'Updates an existing health metric with the provided data.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The ID of the health metric to update', 
    type: String 
  })
  @ApiBody({ 
    type: UpdateMetricDto, 
    description: 'The data for updating the health metric' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The health metric has been successfully updated.', 
    type: HealthMetric 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data provided.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Health metric with the specified ID was not found.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have permission to update health metrics.', 
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'An error occurred while updating the health metric.', 
    type: ApiErrorResponse 
  })
  async updateHealthMetric(
    @Param('id') id: string,
    @Body() updateMetricDto: UpdateMetricDto,
  ): Promise<HealthMetric> {
    // Calls the healthService to update an existing health metric.
    return await this.healthService.updateHealthMetric(id, updateMetricDto);
  }
}