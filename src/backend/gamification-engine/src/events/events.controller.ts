import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { UseFilters } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '@austa/auth';
import { 
  Retry, 
  WithErrorContext, 
  GlobalExceptionFilter, 
  CircuitBreaker,
  Fallback
} from '@austa/errors';
import { 
  GamificationEvent, 
  GamificationEventResponse, 
  EventType 
} from '@austa/interfaces/gamification';

/**
 * Controller for handling incoming events from various parts of the AUSTA SuperApp
 * and dispatching them to the EventsService for processing.
 * 
 * This controller provides a secure API endpoint for event submission from all journeys
 * with enhanced error handling, standardized request/response formats, and improved validation.
 */
@Controller('events')
@UseFilters(GlobalExceptionFilter)
@WithErrorContext()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  /**
   * Injects the EventsService.
   */
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Handles incoming POST requests to process events.
   * 
   * Implements retry logic for transient errors and enhanced validation
   * for journey-specific event schemas.
   * 
   * @param event The gamification event to process containing type, userId, data, and journey
   * @returns A promise that resolves with the result of the event processing
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Retry({ 
    maxAttempts: 3, 
    backoffFactor: 2, 
    initialDelay: 300,
    retryableErrors: ['TimeoutError', 'ConnectionError', 'DatabaseError']
  })
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    maxFailures: 3,
    openStateCallback: (context) => {
      Logger.error(
        `Circuit opened for gamification events processing due to multiple failures`,
        context.error?.stack,
        'EventsController'
      );
    }
  })
  @Fallback({
    fallbackFn: (event: GamificationEvent) => {
      Logger.warn(
        `Using fallback for event processing: ${event.type}`,
        'EventsController'
      );
      return {
        success: false,
        points: 0,
        message: 'Event queued for later processing due to service degradation',
        fallback: true
      };
    }
  })
  async processEvent(@Body() event: GamificationEvent): Promise<GamificationEventResponse> {
    this.logger.log(`Processing event: ${event.type} for user: ${event.userId} in journey: ${event.journey || 'unknown'}`);
    
    // Validate event type against known event types
    if (!Object.values(EventType).includes(event.type as EventType)) {
      this.logger.warn(`Received unknown event type: ${event.type}`);
    }
    
    return this.eventsService.processEvent(event);
  }
}