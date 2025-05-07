import { Controller, Post, Body, UseGuards, UseFilters, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RetryInterceptor } from '@app/shared/interceptors/retry.interceptor';
import { CircuitBreakerInterceptor } from '@app/shared/interceptors/circuit-breaker.interceptor';
import { LoggingInterceptor } from '@app/shared/interceptors/logging.interceptor';
import { CorrelationIdInterceptor } from '@app/shared/interceptors/correlation-id.interceptor';
import { ErrorClassifier } from '@app/errors/decorators/error-classifier.decorator';

// Import standardized interfaces from @austa/interfaces
import { 
  GamificationEvent, 
  EventProcessingResult
} from '@austa/interfaces/gamification';

/**
 * Controller for handling incoming events from various parts of the AUSTA SuperApp
 * and dispatching them to the EventsService for processing.
 * 
 * This controller provides a secure API endpoint for event submission from all journeys
 * with enhanced error handling, standardized request/response formats, and improved validation.
 */
@Controller('events')
@UseInterceptors(
  CorrelationIdInterceptor,
  LoggingInterceptor,
  RetryInterceptor,
  CircuitBreakerInterceptor
)
@UseFilters(AllExceptionsFilter)
@ErrorClassifier()
export class EventsController {
  /**
   * Injects the EventsService.
   */
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Handles incoming POST requests to process events from any journey.
   * Validates the event payload, processes it through the gamification engine,
   * and returns the result with proper error handling and retry mechanisms.
   * 
   * @param event The gamification event to process containing type, userId, data, and journey
   * @returns A promise that resolves with the result of the event processing
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async processEvent(
    @Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
      validationError: { target: false, value: false },
    })) event: GamificationEvent
  ): Promise<EventProcessingResult> {
    return this.eventsService.processEvent(event);
  }
}