import { Controller, Get, Post, Patch, Query, Body, Param, UseGuards, HttpStatus, HttpCode, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { NotificationPreference } from './entities/notification-preference.entity';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { CreatePreferenceDto, UpdatePreferenceDto } from './dto/preference.dto';
import { INotificationPreferences, INotificationPreferencesResponse, IUpdatePreferencesResponse } from '@austa/interfaces/notification/preferences';
import { AppException, ErrorCategory } from '@app/errors/exceptions';

/**
 * Controller for managing user notification preferences.
 * Provides endpoints for retrieving, creating, and updating notification preferences.
 */
@ApiTags('preferences')
@Controller('preferences')
@ApiBearerAuth()
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /**
   * Retrieves all notification preferences based on the provided filter and pagination parameters.
   * Users can only access their own preferences.
   *
   * @param filter - Optional filtering criteria
   * @param pagination - Optional pagination parameters
   * @param userId - The ID of the current authenticated user
   * @returns A promise that resolves to an array of NotificationPreference entities
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page for pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification preferences retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getPreferences(
    @Query() filter: FilterDto,
    @Query() pagination: PaginationDto,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationPreference[]> {
    try {
      // Add the userId to the filter to ensure users only see their own preferences
      if (!filter) {
        filter = {};
      }

      // Ensure the where clause exists
      if (!filter.where) {
        filter.where = {};
      }

      // Force userId filter to the current user's ID for security
      filter.where.userId = userId;

      return this.preferencesService.findAll(filter, pagination);
    } catch (error) {
      if (error instanceof AppException) {
        if (error.category === ErrorCategory.ENTITY_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Retrieves a user's notification preferences by ID.
   * Users can only access their own preferences.
   *
   * @param id - The ID of the notification preference record
   * @param userId - The ID of the current authenticated user
   * @returns A promise that resolves to the NotificationPreference entity
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get notification preference by ID' })
  @ApiParam({ name: 'id', description: 'Notification preference ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification preference retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification preference not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to access this preference' })
  async getPreferenceById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<INotificationPreferencesResponse> {
    try {
      const preference = await this.preferencesService.findById(id);
      
      // Security check: ensure users can only access their own preferences
      if (preference.userId !== userId) {
        throw new BadRequestException('You do not have permission to access this preference');
      }
      
      return {
        preferences: preference as unknown as INotificationPreferences,
        isDefault: false
      };
    } catch (error) {
      if (error instanceof AppException) {
        if (error.category === ErrorCategory.ENTITY_NOT_FOUND) {
          throw new NotFoundException(`Notification preference with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  /**
   * Creates a new notification preference record for the current user.
   *
   * @param userId - The ID of the current authenticated user
   * @returns A promise that resolves to the newly created NotificationPreference entity
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create notification preference' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification preference created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Notification preference already exists for this user' })
  async createPreference(
    @CurrentUser('id') userId: string,
  ): Promise<INotificationPreferencesResponse> {
    try {
      // Create DTO with the current user's ID
      const createDto = new CreatePreferenceDto();
      createDto.userId = userId;
      
      const preference = await this.preferencesService.create(createDto);
      
      return {
        preferences: preference as unknown as INotificationPreferences,
        isDefault: true
      };
    } catch (error) {
      if (error instanceof AppException) {
        if (error.category === ErrorCategory.DUPLICATE_ENTITY) {
          throw new BadRequestException('Notification preference already exists for this user');
        }
      }
      throw error;
    }
  }

  /**
   * Updates an existing notification preference record.
   * Users can only update their own preferences.
   *
   * @param id - The ID of the notification preference record
   * @param updateDto - Partial notification preference data to update
   * @param userId - The ID of the current authenticated user
   * @returns A promise that resolves to the updated NotificationPreference entity
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update notification preference' })
  @ApiParam({ name: 'id', description: 'Notification preference ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification preference updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification preference not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to update this preference' })
  async updatePreference(
    @Param('id') id: string,
    @Body() updateDto: UpdatePreferenceDto,
    @CurrentUser('id') userId: string,
  ): Promise<IUpdatePreferencesResponse> {
    try {
      // Verify the preference exists and belongs to the current user
      const existingPreference = await this.preferencesService.findById(id);
      
      // Security check: ensure users can only update their own preferences
      if (existingPreference.userId !== userId) {
        throw new BadRequestException('You do not have permission to update this preference');
      }
      
      const updatedPreference = await this.preferencesService.update(id, updateDto);
      
      // Determine which fields were updated
      const updatedFields = Object.keys(updateDto).filter(key => 
        updateDto[key] !== existingPreference[key]
      );
      
      return {
        preferences: updatedPreference as unknown as INotificationPreferences,
        updatedFields
      };
    } catch (error) {
      if (error instanceof AppException) {
        if (error.category === ErrorCategory.ENTITY_NOT_FOUND) {
          throw new NotFoundException(`Notification preference with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}