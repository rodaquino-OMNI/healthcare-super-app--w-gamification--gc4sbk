import { Controller, Get, Post, Patch, Query, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { NotificationPreference } from './entities/notification-preference.entity';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { INotificationPreferences, IPreferenceUpdate } from '@austa/interfaces/notification';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Controller for managing user notification preferences.
 * Provides endpoints for retrieving, creating, and updating notification preferences.
 */
@ApiTags('preferences')
@ApiBearerAuth()
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /**
   * Retrieves all notification preferences based on the provided filter and pagination parameters.
   * Users can only access their own preferences.
   *
   * @param filter - Optional filtering criteria
   * @param pagination - Optional pagination parameters
   * @param user - The ID of the current authenticated user
   * @returns A promise that resolves to an array of NotificationPreference entities
   */
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully retrieved notification preferences',
    type: NotificationPreference,
    isArray: true
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @Get()
  @UseGuards(JwtAuthGuard)
  async getPreferences(
    @Query() filter: FilterDto,
    @Query() pagination: PaginationDto,
    @CurrentUser('id') user: string,
  ): Promise<NotificationPreference[]> {
    // Add the userId to the filter to ensure users only see their own preferences
    if (!filter) {
      filter = {};
    }

    // Ensure the where clause exists
    if (!filter.where) {
      filter.where = {};
    }

    // Force userId filter to the current user's ID for security
    filter.where.userId = user;

    return this.preferencesService.findAll(filter, pagination);
  }

  /**
   * Creates a new notification preference record for the current user.
   *
   * @param user - The ID of the current authenticated user
   * @returns A promise that resolves to the newly created NotificationPreference entity
   */
  @ApiOperation({ summary: 'Create notification preferences for user' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Successfully created notification preferences',
    type: NotificationPreference
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Preferences already exist for this user' })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPreference(
    @CurrentUser('id') user: string,
  ): Promise<INotificationPreferences> {
    return this.preferencesService.create(user);
  }

  /**
   * Updates an existing notification preference record.
   * Note: Additional security checks may be necessary in the service layer
   * to ensure users can only update their own preferences.
   *
   * @param id - The ID of the notification preference record
   * @param data - Partial notification preference data to update
   * @returns A promise that resolves to the updated NotificationPreference entity
   */
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully updated notification preferences',
    type: NotificationPreference
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification preferences not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot update preferences for another user' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePreference(
    @Param('id') id: string,
    @Body() data: IPreferenceUpdate,
    @CurrentUser('id') user: string,
  ): Promise<INotificationPreferences> {
    // Add security check to ensure users can only update their own preferences
    return this.preferencesService.update(id, data, user);
  }
}