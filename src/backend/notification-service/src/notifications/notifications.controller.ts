import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Span } from '@nestjs/opentelemetry';

// Import from @austa/interfaces for standardized schemas
import { Notification as NotificationInterface, NotificationStatus, NotificationType, NotificationChannel } from '@austa/interfaces/notification/types';
import { PaginationDto } from '@austa/interfaces/common/dto/pagination.dto';
import { FilterDto } from '@austa/interfaces/common/dto/filter.dto';

// Import from local services using path aliases
import { NotificationsService } from './notifications.service';
import { RetryService } from '@app/retry/retry.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RetryStatus } from '@app/retry/interfaces/retry-status.enum';
import { IRetryableOperation } from '@app/retry/interfaces/retryable-operation.interface';

// Import DTOs
import { SendNotificationDto } from './dto/send-notification.dto';

/**
 * Controller that handles HTTP endpoints for the notification service.
 * Provides APIs for sending notifications, retrieving notification history,
 * and managing notification status.
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  /**
   * Creates an instance of NotificationsController.
   * 
   * @param notificationsService - Service for sending and managing notifications
   * @param retryService - Service for handling retry logic for failed notifications
   * @param logger - Service for structured logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly retryService: RetryService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Sends a notification based on the provided DTO.
   * 
   * @param sendNotificationDto - Data required to send the notification
   * @returns A success message when the notification is sent
   */
  @Post()
  @ApiOperation({ summary: 'Send a notification' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Notification sent successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid notification data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.send')
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto): Promise<{ message: string; notificationId?: number }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Received request to send notification to user ${sendNotificationDto.userId}`,
        'NotificationsController',
        { userId: sendNotificationDto.userId, type: sendNotificationDto.type, traceId }
      );

      // Send the notification
      await this.notificationsService.sendNotification(sendNotificationDto);

      return { message: 'Notification sent successfully' };
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${sendNotificationDto.userId}`,
        error,
        'NotificationsController',
        { userId: sendNotificationDto.userId, type: sendNotificationDto.type, traceId }
      );

      // Determine if this is a client error or server error
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw new HttpException(
          { message: 'Invalid notification data', details: error.message },
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        { message: 'Failed to send notification', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves notifications for a specific user with pagination.
   * 
   * @param userId - ID of the user
   * @param paginationDto - Pagination parameters
   * @returns Array of notifications for the user
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notifications retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.getForUser')
  async getNotificationsForUser(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ notifications: NotificationInterface[]; total: number; page: number; limit: number }> {
    const traceId = this.tracingService.getCurrentTraceId();
    const { page = 1, limit = 20 } = paginationDto;
    const offset = (page - 1) * limit;
    
    try {
      this.logger.log(
        `Retrieving notifications for user ${userId}`,
        'NotificationsController',
        { userId, page, limit, offset, traceId }
      );

      const [notifications, total] = await Promise.all([
        this.notificationsService.getNotificationsForUser(userId, limit, offset),
        this.notificationsService.countNotificationsForUser(userId)
      ]);

      return {
        notifications: notifications.map(notification => ({
          id: notification.id,
          userId: notification.userId,
          type: notification.type as NotificationType,
          title: notification.title,
          body: notification.body,
          channel: notification.channel as NotificationChannel,
          status: notification.status as NotificationStatus,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        })),
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving notifications for user ${userId}`,
        error,
        'NotificationsController',
        { userId, page, limit, offset, traceId }
      );

      throw new HttpException(
        { message: 'Failed to retrieve notifications', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Marks a specific notification as read.
   * 
   * @param id - ID of the notification
   * @returns The updated notification
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification marked as read' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.markAsRead')
  async markAsRead(@Param('id') id: string): Promise<NotificationInterface> {
    const traceId = this.tracingService.getCurrentTraceId();
    const notificationId = parseInt(id, 10);
    
    if (isNaN(notificationId)) {
      throw new HttpException(
        { message: 'Invalid notification ID' },
        HttpStatus.BAD_REQUEST
      );
    }
    
    try {
      this.logger.log(
        `Marking notification ${notificationId} as read`,
        'NotificationsController',
        { notificationId, traceId }
      );

      const notification = await this.notificationsService.markAsRead(notificationId);
      
      if (!notification) {
        throw new HttpException(
          { message: 'Notification not found' },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        channel: notification.channel,
        status: notification.status as NotificationStatus,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      };
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error marking notification ${notificationId} as read`,
        error,
        'NotificationsController',
        { notificationId, traceId }
      );

      throw new HttpException(
        { message: 'Failed to mark notification as read', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Marks all notifications for a user as read.
   * 
   * @param userId - ID of the user
   * @returns The number of notifications marked as read
   */
  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All notifications marked as read' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.markAllAsRead')
  async markAllAsRead(@Param('userId') userId: string): Promise<{ count: number }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Marking all notifications as read for user ${userId}`,
        'NotificationsController',
        { userId, traceId }
      );

      const count = await this.notificationsService.markAllAsRead(userId);

      return { count };
    } catch (error) {
      this.logger.error(
        `Error marking all notifications as read for user ${userId}`,
        error,
        'NotificationsController',
        { userId, traceId }
      );

      throw new HttpException(
        { message: 'Failed to mark notifications as read', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Gets the delivery status of a specific notification.
   * 
   * @param id - ID of the notification
   * @returns The current status of the notification
   */
  @Get(':id/status')
  @ApiOperation({ summary: 'Get notification delivery status' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification status retrieved' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.getStatus')
  async getNotificationStatus(@Param('id') id: string): Promise<{ status: NotificationStatus; details?: any }> {
    const traceId = this.tracingService.getCurrentTraceId();
    const notificationId = parseInt(id, 10);
    
    if (isNaN(notificationId)) {
      throw new HttpException(
        { message: 'Invalid notification ID' },
        HttpStatus.BAD_REQUEST
      );
    }
    
    try {
      this.logger.log(
        `Retrieving status for notification ${notificationId}`,
        'NotificationsController',
        { notificationId, traceId }
      );

      // Get notification by ID
      const notification = await this.notificationsService.getNotificationById(notificationId);
      
      if (!notification) {
        throw new HttpException(
          { message: 'Notification not found' },
          HttpStatus.NOT_FOUND
        );
      }

      // Return the status and any additional details
      return {
        status: notification.status as NotificationStatus,
        details: {
          channel: notification.channel,
          updatedAt: notification.updatedAt,
        },
      };
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving status for notification ${notificationId}`,
        error,
        'NotificationsController',
        { notificationId, traceId }
      );

      throw new HttpException(
        { message: 'Failed to retrieve notification status', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Gets notification statistics for a user.
   * 
   * @param userId - ID of the user
   * @returns Statistics about the user's notifications
   */
  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get notification statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.getUserStats')
  async getNotificationStats(@Param('userId') userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Retrieving notification statistics for user ${userId}`,
        'NotificationsController',
        { userId, traceId }
      );

      // In a real implementation, we would have a dedicated method for this
      // For this example, we'll simulate the statistics
      const stats = {
        total: 0,
        unread: 0,
        byType: {},
        byChannel: {}
      };

      // Get all notifications for the user
      const notifications = await this.notificationsService.getNotificationsForUser(
        userId,
        1000, // Get a large number to calculate stats
        0
      );

      // Calculate statistics
      stats.total = notifications.length;
      stats.unread = notifications.filter(n => n.status === 'sent').length;

      // Count by type
      notifications.forEach(notification => {
        // Count by type
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = 0;
        }
        stats.byType[notification.type]++;

        // Count by channel
        if (!stats.byChannel[notification.channel]) {
          stats.byChannel[notification.channel] = 0;
        }
        stats.byChannel[notification.channel]++;
      });

      return stats;
    } catch (error) {
      this.logger.error(
        `Error retrieving notification statistics for user ${userId}`,
        error,
        'NotificationsController',
        { userId, traceId }
      );

      throw new HttpException(
        { message: 'Failed to retrieve notification statistics', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sends notifications to multiple users in bulk.
   * 
   * @param bulkNotificationsDto - Array of notification DTOs
   * @returns A summary of the bulk operation
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Send notifications in bulk' })
  @ApiBody({ type: [SendNotificationDto] })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Bulk notification processing started' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid notification data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.sendBulk')
  async sendBulkNotifications(
    @Body() bulkNotificationsDto: SendNotificationDto[]
  ): Promise<{ message: string; total: number; accepted: number; rejected: number }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Received request to send ${bulkNotificationsDto.length} notifications in bulk`,
        'NotificationsController',
        { count: bulkNotificationsDto.length, traceId }
      );

      if (!Array.isArray(bulkNotificationsDto) || bulkNotificationsDto.length === 0) {
        throw new HttpException(
          { message: 'Invalid bulk notification data' },
          HttpStatus.BAD_REQUEST
        );
      }

      // Process each notification asynchronously
      const results = await Promise.allSettled(
        bulkNotificationsDto.map(dto => this.notificationsService.sendNotification(dto))
      );

      // Count successes and failures
      const accepted = results.filter(result => result.status === 'fulfilled').length;
      const rejected = results.filter(result => result.status === 'rejected').length;

      this.logger.log(
        `Bulk notification processing completed: ${accepted} accepted, ${rejected} rejected`,
        'NotificationsController',
        { total: bulkNotificationsDto.length, accepted, rejected, traceId }
      );

      return {
        message: 'Bulk notification processing completed',
        total: bulkNotificationsDto.length,
        accepted,
        rejected
      };
    } catch (error) {
      this.logger.error(
        `Error processing bulk notifications`,
        error,
        'NotificationsController',
        { count: bulkNotificationsDto?.length || 0, traceId }
      );

      throw new HttpException(
        { message: 'Failed to process bulk notifications', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retries sending a failed notification.
   * 
   * @param id - ID of the notification
   * @returns A success message when the retry is scheduled
   */
  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry sending a failed notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Retry scheduled' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Notification is not in a failed state' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  @Span('notifications.retry')
  async retryNotification(@Param('id') id: string): Promise<{ message: string }> {
    const traceId = this.tracingService.getCurrentTraceId();
    const notificationId = parseInt(id, 10);
    
    if (isNaN(notificationId)) {
      throw new HttpException(
        { message: 'Invalid notification ID' },
        HttpStatus.BAD_REQUEST
      );
    }
    
    try {
      this.logger.log(
        `Scheduling retry for notification ${notificationId}`,
        'NotificationsController',
        { notificationId, traceId }
      );

      // Get notification by ID
      const notification = await this.notificationsService.getNotificationById(notificationId);

      if (!notification) {
        throw new HttpException(
          { message: 'Notification not found' },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if the notification is in a failed state
      if (notification.status !== 'failed' && notification.status !== 'retry-failed') {
        throw new HttpException(
          { message: 'Notification is not in a failed state' },
          HttpStatus.BAD_REQUEST
        );
      }

      // Create a retryable operation
      const operation: IRetryableOperation = {
        execute: async () => {
          // Call the appropriate method on the NotificationsService to send the notification
          await this.notificationsService.sendThroughChannel(
            notification.channel,
            notification.userId,
            {
              title: notification.title,
              body: notification.body,
              type: notification.type,
              data: notification.data || {}
            }
          );
        },
        getPayload: () => ({
          userId: notification.userId,
          channel: notification.channel,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data || {}
        }),
        getMetadata: () => ({
          notificationId: notification.id,
          type: notification.type,
          createdAt: notification.createdAt,
          channel: notification.channel,
          traceId: this.tracingService.getCurrentTraceId()
        })
      };

      // Schedule the retry
      const retryStatus = await this.retryService.scheduleRetry(
        operation,
        new Error('Manual retry requested'),
        {
          notificationId: notification.id,
          userId: notification.userId,
          channel: notification.channel,
          attemptCount: 0 // Start fresh for manual retries
        }
      );
      
      // Log the retry status
      this.logger.log(
        `Retry scheduled for notification ${notificationId} with status ${retryStatus}`,
        'NotificationsController',
        { notificationId, userId: notification.userId, retryStatus, traceId }
      );
      
      // If the retry was exhausted, return an appropriate message
      if (retryStatus === RetryStatus.EXHAUSTED) {
        return { message: 'Notification cannot be retried, maximum attempts exceeded' };
      }

      return { message: 'Retry scheduled successfully' };
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error scheduling retry for notification ${notificationId}`,
        error,
        'NotificationsController',
        { notificationId, traceId }
      );

      throw new HttpException(
        { message: 'Failed to schedule retry', traceId },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}