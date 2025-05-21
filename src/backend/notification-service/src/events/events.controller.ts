import { Controller, Post, Body, Get, Param, Query, UseGuards, UseFilters, HttpStatus, HttpCode, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventsService } from './events.service';
import { ProcessNotificationEventDto } from './dto/process-notification-event.dto';
import { NotificationEventResponseDto } from './dto/notification-event-response.dto';
import { NotificationDeliveryStatusDto } from './dto/notification-delivery-status.dto';
import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@austa/auth/guards/roles.guard';
import { Roles } from '@austa/auth/decorators/roles.decorator';
import { JourneyErrorFilter } from '@austa/errors/journey/journey-error.filter';
import { NotificationEventTypeEnum } from './dto/notification-event-type.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RetryService } from '../retry/retry.service';
import { IDeliveryStatus } from '../interfaces/delivery-tracking.interface';

/**
 * Controller for handling notification events through REST endpoints.
 * Provides interfaces for event triggering, status checking, and administrative operations.
 */
@ApiTags('events')
@Controller('events')
@UseFilters(JourneyErrorFilter)
export class EventsController {
  /**
   * Injects the required services.
   * 
   * @param eventsService Service for processing notification events
   * @param retryService Service for handling retry logic for failed notifications
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Processes a notification event, triggering the appropriate notification delivery.
   * 
   * @param processEventDto The notification event to process
   * @returns A standardized response with the event processing result
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a notification event' })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Event accepted for processing',
    type: NotificationEventResponseDto 
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid event payload' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async processEvent(
    @Body() processEventDto: ProcessNotificationEventDto
  ): Promise<NotificationEventResponseDto> {
    return this.eventsService.processEvent(processEventDto);
  }

  /**
   * Retrieves the delivery status of a notification event by its ID.
   * 
   * @param eventId The ID of the notification event
   * @returns The current delivery status of the notification
   */
  @Get(':eventId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification event delivery status' })
  @ApiParam({ name: 'eventId', description: 'Notification event ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification delivery status',
    type: NotificationDeliveryStatusDto 
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getEventStatus(
    @Param('eventId') eventId: string
  ): Promise<NotificationDeliveryStatusDto> {
    const status = await this.eventsService.getEventStatus(eventId);
    if (!status) {
      throw new NotFoundException(`Notification event with ID ${eventId} not found`);
    }
    return status;
  }

  /**
   * Retrieves delivery status for multiple notification events, with optional filtering.
   * 
   * @param userId Optional user ID to filter notifications by
   * @param type Optional notification type to filter by
   * @param journey Optional journey to filter by (health, care, plan)
   * @param status Optional delivery status to filter by
   * @returns Array of notification delivery statuses matching the filters
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get multiple notification event statuses' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationEventTypeEnum, description: 'Filter by notification type' })
  @ApiQuery({ name: 'journey', required: false, enum: ['health', 'care', 'plan'], description: 'Filter by journey' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'delivered', 'failed'], description: 'Filter by delivery status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of notification delivery statuses',
    type: [NotificationDeliveryStatusDto] 
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getEventStatuses(
    @Query('userId') userId?: string,
    @Query('type') type?: NotificationEventTypeEnum,
    @Query('journey') journey?: 'health' | 'care' | 'plan',
    @Query('status') status?: 'pending' | 'delivered' | 'failed',
  ): Promise<NotificationDeliveryStatusDto[]> {
    return this.eventsService.getEventStatuses({ userId, type, journey, status });
  }

  /**
   * Triggers a retry for a failed notification event.
   * 
   * @param eventId The ID of the failed notification event to retry
   * @returns The updated delivery status after scheduling the retry
   */
  @Post(':eventId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry a failed notification event' })
  @ApiParam({ name: 'eventId', description: 'Failed notification event ID' })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Retry scheduled',
    type: NotificationDeliveryStatusDto 
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Event is not in a failed state' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async retryEvent(
    @Param('eventId') eventId: string
  ): Promise<NotificationDeliveryStatusDto> {
    const status = await this.eventsService.getEventStatus(eventId);
    if (!status) {
      throw new NotFoundException(`Notification event with ID ${eventId} not found`);
    }
    
    if (status.status !== 'failed') {
      throw new BadRequestException(`Cannot retry notification event with status ${status.status}`);
    }
    
    return this.retryService.scheduleRetry(eventId);
  }

  /**
   * Administrative endpoint to replay events from the dead letter queue.
   * Requires admin role.
   * 
   * @param limit Maximum number of events to replay (default: 10)
   * @returns Summary of replay operation with count of events processed
   */
  @Post('dlq/replay')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replay events from the dead letter queue (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of events to replay' })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Replay operation started',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', description: 'Number of events processed for replay' },
        message: { type: 'string', description: 'Operation result message' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  async replayDlqEvents(
    @Query('limit') limit: number = 10
  ): Promise<{ processed: number; message: string }> {
    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100 events per replay operation');
    }
    
    const result = await this.retryService.replayFromDlq(limit);
    return {
      processed: result.processed,
      message: `Successfully scheduled ${result.processed} events for replay from DLQ`
    };
  }

  /**
   * Administrative endpoint to get a summary of notification delivery metrics.
   * Requires admin role.
   * 
   * @returns Metrics summary including counts by status, channel, and journey
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification delivery metrics (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notification delivery metrics',
    schema: {
      type: 'object',
      properties: {
        totalCount: { type: 'number' },
        byStatus: { 
          type: 'object',
          properties: {
            pending: { type: 'number' },
            delivered: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        byChannel: { 
          type: 'object',
          properties: {
            email: { type: 'number' },
            sms: { type: 'number' },
            push: { type: 'number' },
            inApp: { type: 'number' }
          }
        },
        byJourney: { 
          type: 'object',
          properties: {
            health: { type: 'number' },
            care: { type: 'number' },
            plan: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires admin role' })
  async getDeliveryMetrics(): Promise<any> {
    return this.eventsService.getDeliveryMetrics();
  }
}