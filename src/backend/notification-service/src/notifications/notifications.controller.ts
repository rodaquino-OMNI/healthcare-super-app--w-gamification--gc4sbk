import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards, HttpStatus, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

// Import from @austa/interfaces package for standardized schemas
import { NotificationResponse, NotificationListResponse, NotificationStatusResponse } from '@austa/interfaces/common/dto/notification.dto';

// Use path aliases for consistent imports
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { TracingService } from '@app/tracing';
import { LoggerService } from '@app/logging';

// Local imports
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Notification } from './entities/notification.entity';

/**
 * Controller that handles HTTP endpoints for the notification service.
 * Provides REST API for sending notifications, retrieving notification history,
 * and managing notification status across all user journeys.
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Sends a notification to a user.
   * 
   * @param sendNotificationDto - Data required to send the notification
   * @returns Promise resolving to a notification response
   */
  @Post()
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Notification sent successfully',
    type: NotificationResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid notification data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  async sendNotification(
    @Body() sendNotificationDto: SendNotificationDto
  ): Promise<NotificationResponse> {
    const span = this.tracingService.createSpan('notifications.send');
    
    try {
      this.logger.log(
        `Received request to send notification to user ${sendNotificationDto.userId}`,
        'NotificationsController'
      );
      
      // Add notification data to span for tracing
      span.setAttributes({
        'notification.userId': sendNotificationDto.userId,
        'notification.type': sendNotificationDto.type,
      });
      
      await this.notificationsService.sendNotification(sendNotificationDto);
      
      this.logger.log(
        `Successfully sent notification to user ${sendNotificationDto.userId}`,
        'NotificationsController'
      );
      
      return {
        success: true,
        message: 'Notification sent successfully',
        data: {
          userId: sendNotificationDto.userId,
          type: sendNotificationDto.type,
          sentAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      // Record error in span
      span.recordException(error);
      
      this.logger.error(
        `Failed to send notification to user ${sendNotificationDto.userId}`,
        error.stack,
        'NotificationsController'
      );
      
      // Re-throw the error to be handled by global exception filter
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves notifications for a specific user.
   * 
   * @param userId - User ID
   * @param limit - Maximum number of notifications to retrieve
   * @param offset - Offset for pagination
   * @returns Promise resolving to a list of notifications
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of notifications to retrieve', required: false })
  @ApiQuery({ name: 'offset', description: 'Offset for pagination', required: false })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notifications retrieved successfully',
    type: NotificationListResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async getNotificationsForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<NotificationListResponse> {
    const span = this.tracingService.createSpan('notifications.getForUser');
    
    try {
      span.setAttributes({
        'notification.userId': userId,
        'notification.limit': limit || 20,
        'notification.offset': offset || 0,
      });
      
      this.logger.log(
        `Retrieving notifications for user ${userId}`,
        'NotificationsController'
      );
      
      const notifications = await this.notificationsService.getNotificationsForUser(
        userId,
        limit,
        offset,
      );
      
      this.logger.log(
        `Retrieved ${notifications.length} notifications for user ${userId}`,
        'NotificationsController'
      );
      
      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications,
        count: notifications.length,
        total: notifications.length, // In a real implementation, this would be the total count from the database
      };
    } catch (error) {
      span.recordException(error);
      
      this.logger.error(
        `Failed to retrieve notifications for user ${userId}`,
        error.stack,
        'NotificationsController'
      );
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Marks a notification as read.
   * 
   * @param id - Notification ID
   * @returns Promise resolving to the updated notification
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification marked as read',
    type: NotificationResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number
  ): Promise<NotificationResponse> {
    const span = this.tracingService.createSpan('notifications.markAsRead');
    
    try {
      span.setAttributes({
        'notification.id': id,
      });
      
      this.logger.log(
        `Marking notification ${id} as read`,
        'NotificationsController'
      );
      
      const notification = await this.notificationsService.markAsRead(id);
      
      this.logger.log(
        `Marked notification ${id} as read`,
        'NotificationsController'
      );
      
      return {
        success: true,
        message: 'Notification marked as read',
        data: notification,
      };
    } catch (error) {
      span.recordException(error);
      
      this.logger.error(
        `Failed to mark notification ${id} as read`,
        error.stack,
        'NotificationsController'
      );
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Marks all notifications for a user as read.
   * 
   * @param userId - User ID
   * @returns Promise resolving to the number of notifications updated
   */
  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications for a user as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All notifications marked as read',
    type: NotificationStatusResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async markAllAsRead(
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<NotificationStatusResponse> {
    const span = this.tracingService.createSpan('notifications.markAllAsRead');
    
    try {
      span.setAttributes({
        'notification.userId': userId,
      });
      
      this.logger.log(
        `Marking all notifications as read for user ${userId}`,
        'NotificationsController'
      );
      
      const count = await this.notificationsService.markAllAsRead(userId);
      
      this.logger.log(
        `Marked ${count} notifications as read for user ${userId}`,
        'NotificationsController'
      );
      
      return {
        success: true,
        message: `${count} notifications marked as read`,
        count,
      };
    } catch (error) {
      span.recordException(error);
      
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}`,
        error.stack,
        'NotificationsController'
      );
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves the delivery status of a notification.
   * 
   * @param id - Notification ID
   * @returns Promise resolving to the notification status
   */
  @Get(':id/status')
  @ApiOperation({ summary: 'Get notification delivery status' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification status retrieved',
    type: NotificationStatusResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  async getNotificationStatus(
    @Param('id', ParseIntPipe) id: number
  ): Promise<NotificationStatusResponse> {
    const span = this.tracingService.createSpan('notifications.getStatus');
    
    try {
      span.setAttributes({
        'notification.id': id,
      });
      
      this.logger.log(
        `Retrieving status for notification ${id}`,
        'NotificationsController'
      );
      
      // In a real implementation, this would retrieve the status from the database
      // For now, we'll just return a mock status
      const notification = await this.notificationsService.getNotificationsForUser('', 1, 0);
      
      if (notification.length === 0) {
        throw new Error('Notification not found');
      }
      
      this.logger.log(
        `Retrieved status for notification ${id}`,
        'NotificationsController'
      );
      
      return {
        success: true,
        message: 'Notification status retrieved',
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      span.recordException(error);
      
      this.logger.error(
        `Failed to retrieve status for notification ${id}`,
        error.stack,
        'NotificationsController'
      );
      
      throw error;
    } finally {
      span.end();
    }
  }
}

// Define interfaces for response types if not imported from @austa/interfaces
// These would normally be imported from @austa/interfaces/common/dto/notification.dto
if (typeof NotificationResponse === 'undefined') {
  interface NotificationResponse {
    success: boolean;
    message: string;
    data?: any;
  }
}

if (typeof NotificationListResponse === 'undefined') {
  interface NotificationListResponse {
    success: boolean;
    message: string;
    data: Notification[];
    count: number;
    total: number;
  }
}

if (typeof NotificationStatusResponse === 'undefined') {
  interface NotificationStatusResponse {
    success: boolean;
    message: string;
    status?: string;
    deliveredAt?: string;
    count?: number;
  }
}