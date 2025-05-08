import { Controller, Post, Body, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@austa/auth/decorators/current-user.decorator';

import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Notification } from './entities/notification.entity';

/**
 * Controller for managing notifications in the AUSTA SuperApp.
 * Provides endpoints for sending, retrieving, and managing notifications.
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Sends a notification to a user.
   * 
   * @param dto - The notification data to send
   * @returns The created notification
   */
  @Post()
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid notification data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendNotification(@Body() dto: SendNotificationDto): Promise<Notification> {
    return this.notificationsService.sendNotification(dto);
  }

  /**
   * Gets notifications for the authenticated user.
   * 
   * @param user - The authenticated user
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns Array of notifications for the user
   */
  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of notifications to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Notification[]> {
    return this.notificationsService.getNotificationsForUser(
      user.id,
      limit,
      offset,
    );
  }

  /**
   * Marks a notification as read.
   * 
   * @param id - The ID of the notification to mark as read
   * @param user - The authenticated user
   * @returns The updated notification
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  /**
   * Marks all notifications for the authenticated user as read.
   * 
   * @param user - The authenticated user
   * @returns The number of notifications marked as read
   */
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAllAsRead(@CurrentUser() user: any): Promise<{ count: number }> {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { count };
  }
}