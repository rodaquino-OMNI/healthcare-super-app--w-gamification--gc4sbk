import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, HttpStatus, ParseUUIDPipe, ValidationPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@austa/auth/guards';
import { Roles, CurrentUser } from '@austa/auth/decorators';
import { ProcessNotificationEventDto } from './dto/process-notification-event.dto';
import { NotificationEventResponseDto } from './dto/notification-event-response.dto';
import { NotificationDeliveryStatusDto } from './dto/notification-delivery-status.dto';
import { EventsService } from './events.service';
import { RetryService } from '../retry/retry.service';
import { DlqService } from '../retry/dlq/dlq.service';
import { INotificationEventResponse } from './interfaces/notification-event-response.interface';
import { INotificationStatus } from './interfaces/notification-status.interface';
import { ValidationError, BusinessError, TechnicalError, ExternalError } from '@austa/errors/categories';
import { HealthError, CareError, PlanError } from '@austa/errors/journey';
import { TracingService } from '@austa/tracing';
import { User } from '@austa/interfaces/auth';

/**
 * Controller for handling notification events in the AUSTA SuperApp.
 * 
 * This controller provides endpoints for manually triggering notification events,
 * querying event status, replaying failed events, and performing administrative
 * operations related to notification events.
 */
@ApiTags('notification-events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  /**
   * Constructor for EventsController
   * 
   * @param eventsService - Service for processing notification events
   * @param retryService - Service for handling retry logic for failed notifications
   * @param dlqService - Service for managing dead letter queue entries
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Processes a notification event manually triggered via REST API.
   * 
   * This endpoint allows services to directly trigger notification events
   * without going through the Kafka event stream. It's useful for testing,
   * administrative operations, and handling critical notifications that
   * require immediate processing.
   * 
   * @param processEventDto - The notification event to process
   * @param user - The authenticated user triggering the event
   * @returns A promise that resolves with the result of the event processing
   */
  @Post()
  @Roles('admin', 'notification:publisher')
  @ApiOperation({ summary: 'Process a notification event' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The notification event has been successfully processed',
    type: NotificationEventResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid notification event data provided' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async processEvent(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    processEventDto: ProcessNotificationEventDto,
    @CurrentUser() user: User,
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.createSpan('notification.event.process');
    try {
      this.logger.log(`Processing notification event of type: ${processEventDto.type}`);
      span.setAttributes({
        'notification.type': processEventDto.type,
        'notification.journey': processEventDto.journeyContext?.journey || 'none',
      });

      // Add the user ID to the event if not provided
      if (!processEventDto.userId && user) {
        processEventDto.userId = user.id;
        this.logger.debug(`Added user ID ${user.id} to notification event`);
      }

      const result = await this.eventsService.processEvent(processEventDto);
      span.setAttributes({
        'notification.status': result.success ? 'success' : 'failure',
        'notification.id': result.notificationId || 'unknown',
      });
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process notification event: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message
      });

      if (error instanceof ValidationError) {
        throw error;
      } else if (error instanceof BusinessError) {
        throw error;
      } else if (error instanceof HealthError || error instanceof CareError || error instanceof PlanError) {
        throw error;
      } else if (error instanceof ExternalError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to process notification event',
          { originalError: error, eventType: processEventDto.type }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves the status of a notification event by its ID.
   * 
   * This endpoint allows tracking the delivery status of a notification
   * across all channels (email, SMS, push, in-app).
   * 
   * @param id - The UUID of the notification event
   * @returns The current status of the notification event
   */
  @Get(':id')
  @Roles('admin', 'notification:viewer')
  @ApiOperation({ summary: 'Get notification event status by ID' })
  @ApiParam({ name: 'id', description: 'Notification event UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the notification event status',
    type: NotificationDeliveryStatusDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification event not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async getEventStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<INotificationStatus> {
    const span = this.tracingService.createSpan('notification.event.status.get');
    try {
      this.logger.log(`Retrieving status for notification event: ${id}`);
      span.setAttributes({
        'notification.id': id
      });

      const status = await this.eventsService.getEventStatus(id);
      span.setAttributes({
        'notification.status': status.status,
        'notification.type': status.type,
        'notification.journey': status.journeyContext?.journey || 'none',
      });
      return status;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notification status for ${id}: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message
      });

      if (error instanceof BusinessError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to retrieve notification status',
          { originalError: error, notificationId: id }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves a list of notification events with optional filtering.
   * 
   * This endpoint allows querying notification events by various criteria
   * such as user ID, status, type, and time range.
   * 
   * @param userId - Optional user ID to filter notifications
   * @param status - Optional status to filter notifications
   * @param type - Optional notification type to filter
   * @param journey - Optional journey context to filter
   * @param from - Optional start date for filtering
   * @param to - Optional end date for filtering
   * @param page - Optional page number for pagination
   * @param limit - Optional limit of items per page
   * @returns A paginated list of notification events matching the criteria
   */
  @Get()
  @Roles('admin', 'notification:viewer')
  @ApiOperation({ summary: 'Get notification events with filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (PENDING, DELIVERED, FAILED)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'journey', required: false, description: 'Filter by journey (health, care, plan)' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page for pagination' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns a paginated list of notification events',
    type: [NotificationDeliveryStatusDto] 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid filter parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async getEvents(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('journey') journey?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ items: INotificationStatus[], total: number, page: number, limit: number }> {
    const span = this.tracingService.createSpan('notification.events.list');
    try {
      this.logger.log('Retrieving notification events with filters');
      span.setAttributes({
        'query.userId': userId || 'none',
        'query.status': status || 'all',
        'query.type': type || 'all',
        'query.journey': journey || 'all',
        'query.page': page,
        'query.limit': limit
      });

      const result = await this.eventsService.getEvents({
        userId,
        status,
        type,
        journey,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        page,
        limit,
      });
      
      this.logger.debug(`Retrieved ${result.items.length} notification events (total: ${result.total})`);
      span.setAttributes({
        'result.count': result.items.length,
        'result.total': result.total
      });
      
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notification events: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message
      });

      if (error instanceof ValidationError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to retrieve notification events',
          { originalError: error, filters: { userId, status, type, journey, from, to } }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Replays a failed notification event.
   * 
   * This endpoint allows administrators to retry a failed notification
   * by retrieving it from the dead letter queue and reprocessing it.
   * 
   * @param id - The UUID of the failed notification event
   * @returns The result of the replay attempt
   */
  @Post(':id/replay')
  @Roles('admin', 'notification:manager')
  @ApiOperation({ summary: 'Replay a failed notification event' })
  @ApiParam({ name: 'id', description: 'Failed notification event UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The notification event has been successfully replayed',
    type: NotificationEventResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Failed notification event not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Event is not in a failed state or cannot be replayed' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async replayEvent(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.createSpan('notification.event.replay');
    try {
      this.logger.log(`Attempting to replay notification event: ${id}`);
      span.setAttributes({
        'notification.id': id,
        'notification.action': 'replay'
      });

      // First check if the notification is in the DLQ
      const dlqEntry = await this.dlqService.findById(id);
      let result;
      
      if (dlqEntry) {
        // If it's in the DLQ, process it through the DLQ service
        this.logger.debug(`Notification ${id} found in DLQ, reprocessing`);
        span.setAttributes({ 'notification.source': 'dlq' });
        result = await this.dlqService.reprocessEntry(id);
      } else {
        // If not in DLQ, try to replay through the retry service
        this.logger.debug(`Notification ${id} not in DLQ, attempting retry`);
        span.setAttributes({ 'notification.source': 'retry' });
        result = await this.retryService.retryNotification(id);
      }
      
      span.setAttributes({
        'notification.replay.success': result.success,
        'notification.status': result.success ? 'processing' : 'failed'
      });
      
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to replay notification event ${id}: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message
      });

      if (error instanceof BusinessError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to replay notification event',
          { originalError: error, notificationId: id }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Cancels a pending notification event.
   * 
   * This endpoint allows administrators to cancel a notification that
   * has not yet been delivered.
   * 
   * @param id - The UUID of the pending notification event
   * @returns A success message if the cancellation was successful
   */
  @Delete(':id')
  @Roles('admin', 'notification:manager')
  @ApiOperation({ summary: 'Cancel a pending notification event' })
  @ApiParam({ name: 'id', description: 'Pending notification event UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The notification event has been successfully cancelled' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification event not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Event is not in a pending state or cannot be cancelled' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async cancelEvent(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean, message: string }> {
    const span = this.tracingService.createSpan('notification.event.cancel');
    try {
      this.logger.log(`Cancelling notification event: ${id} by user: ${user.id}`);
      span.setAttributes({
        'notification.id': id,
        'notification.action': 'cancel',
        'user.id': user.id
      });

      await this.eventsService.cancelEvent(id);
      
      this.logger.debug(`Successfully cancelled notification event: ${id}`);
      span.setAttributes({
        'notification.cancel.success': true
      });
      
      return { 
        success: true, 
        message: `Notification event ${id} has been successfully cancelled` 
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel notification event ${id}: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message,
        'notification.cancel.success': false
      });

      if (error instanceof BusinessError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to cancel notification event',
          { originalError: error, notificationId: id }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Updates the delivery status of a notification event.
   * 
   * This endpoint is primarily used by delivery channel services to
   * update the status of a notification (e.g., when an email is delivered
   * or a push notification is opened).
   * 
   * @param id - The UUID of the notification event
   * @param statusUpdate - The updated status information
   * @returns The updated notification status
   */
  @Patch(':id/status')
  @Roles('admin', 'notification:publisher', 'system')
  @ApiOperation({ summary: 'Update notification event delivery status' })
  @ApiParam({ name: 'id', description: 'Notification event UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The notification status has been successfully updated',
    type: NotificationDeliveryStatusDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification event not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid status update data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async updateEventStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    statusUpdate: NotificationDeliveryStatusDto,
  ): Promise<INotificationStatus> {
    const span = this.tracingService.createSpan('notification.event.status.update');
    try {
      this.logger.log(`Updating status for notification event: ${id} to ${statusUpdate.status}`);
      span.setAttributes({
        'notification.id': id,
        'notification.status.new': statusUpdate.status,
        'notification.channel': statusUpdate.channel
      });

      const updatedStatus = await this.eventsService.updateEventStatus(id, statusUpdate);
      
      this.logger.debug(`Successfully updated notification status for ${id}`);
      span.setAttributes({
        'notification.status.updated': true,
        'notification.status.current': updatedStatus.status
      });
      
      return updatedStatus;
    } catch (error) {
      this.logger.error(
        `Failed to update notification status for ${id}: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message,
        'notification.status.updated': false
      });

      if (error instanceof ValidationError) {
        throw error;
      } else if (error instanceof BusinessError) {
        throw error;
      } else if (error instanceof ExternalError) {
        throw error;
      } else {
        throw new TechnicalError(
          'Failed to update notification status',
          { originalError: error, notificationId: id }
        );
      }
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves notification event statistics.
   * 
   * This endpoint provides aggregated statistics about notification events,
   * such as delivery success rates, failure rates by channel, and average
   * delivery times.
   * 
   * @param journey - Optional journey context to filter statistics
   * @param from - Optional start date for filtering
   * @param to - Optional end date for filtering
   * @returns Aggregated notification statistics
   */
  @Get('stats')
  @Roles('admin', 'notification:viewer', 'analytics')
  @ApiOperation({ summary: 'Get notification event statistics' })
  @ApiQuery({ name: 'journey', required: false, description: 'Filter by journey (health, care, plan)' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter by end date (ISO format)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns notification event statistics' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid filter parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'User is not authenticated' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User does not have required permissions' 
  })
  async getEventStats(
    @Query('journey') journey?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    averageDeliveryTime: number;
    channelStats: {
      email: { total: number; delivered: number; failed: number; rate: number };
      sms: { total: number; delivered: number; failed: number; rate: number };
      push: { total: number; delivered: number; failed: number; rate: number };
      inApp: { total: number; delivered: number; failed: number; rate: number };
    };
    journeyStats?: {
      health?: { total: number; delivered: number; failed: number; rate: number };
      care?: { total: number; delivered: number; failed: number; rate: number };
      plan?: { total: number; delivered: number; failed: number; rate: number };
    };
  }> {
    const span = this.tracingService.createSpan('notification.events.stats');
    try {
      this.logger.log('Retrieving notification event statistics');
      span.setAttributes({
        'query.journey': journey || 'all',
        'query.from': from || 'none',
        'query.to': to || 'none'
      });

      const stats = await this.eventsService.getEventStats({
        journey,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
      
      this.logger.debug(`Retrieved notification statistics: ${stats.total} total, ${stats.deliveryRate}% delivery rate`);
      span.setAttributes({
        'stats.total': stats.total,
        'stats.delivered': stats.delivered,
        'stats.failed': stats.failed,
        'stats.pending': stats.pending,
        'stats.deliveryRate': stats.deliveryRate,
        'stats.averageDeliveryTime': stats.averageDeliveryTime
      });
      
      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notification statistics: ${error.message}`,
        error.stack
      );
      span.setAttributes({
        'error': true,
        'error.type': error.constructor.name,
        'error.message': error.message
      });

      throw new TechnicalError(
        'Failed to retrieve notification statistics',
        { originalError: error, filters: { journey, from, to } }
      );
    } finally {
      span.end();
    }
  }
}