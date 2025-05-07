import { Controller, Get, UseGuards, Request, UseFilters, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@austa/auth/decorators/current-user.decorator';

// Import from @austa/interfaces package for type-safe data models
import { Journey } from '@austa/interfaces/common/journey.enum';
import { IUser } from '@austa/interfaces/auth/user.interface';

// Import from internal services using path aliases
import { InsightsService } from '@app/insights/insights.service';

// Import from shared packages using path aliases
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { JourneyExceptionFilter } from '@austa/errors/journey/health/exception.filter';
import { CircuitBreaker } from '@austa/database/errors/circuit-breaker';

/**
 * Handles incoming requests related to health insights.
 * Provides endpoints for retrieving personalized health insights based on user data.
 */
@Controller('insights')
@UseFilters(JourneyExceptionFilter)
export class InsightsController {
  private readonly circuitBreaker: CircuitBreaker;

  /**
   * Initializes the InsightsController.
   * @param insightsService - The InsightsService for generating health insights.
   * @param logger - The logger service for logging events.
   * @param tracingService - The tracing service for distributed tracing.
   */
  constructor(
    private readonly insightsService: InsightsService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.setContext('InsightsController');
    
    // Configure circuit breaker for resilience
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 10000,
      monitorIntervalMs: 2000,
      name: 'insights-controller',
    });
  }

  /**
   * Retrieves health insights for the current user.
   * This endpoint is protected by JWT authentication.
   * 
   * @param req - The request object.
   * @param user - The current authenticated user.
   * @returns A promise that resolves with the generated insights for the user.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getInsights(@Request() req: any, @CurrentUser() user: IUser): Promise<any> {
    const traceId = this.tracingService.generateTraceId();
    const span = this.tracingService.startSpan('insights.getInsights', { 
      traceId,
      attributes: { userId: user.id, journey: Journey.HEALTH }
    });
    
    this.logger.log(`Request to retrieve insights for user ${user.id}`, { 
      traceId, 
      userId: user.id,
      journey: Journey.HEALTH,
      requestId: req.id,
      method: req.method,
      path: req.path
    });

    try {
      // Use circuit breaker to handle potential service failures
      const insights = await this.circuitBreaker.execute(() => 
        this.insightsService.generateUserInsights(user.id, traceId)
      );
      
      this.logger.log(`Successfully retrieved insights for user ${user.id}`, { 
        traceId, 
        userId: user.id,
        journey: Journey.HEALTH,
        statusCode: HttpStatus.OK
      });
      
      span.end();
      return insights;
    } catch (error) {
      this.logger.error(`Error retrieving insights for user ${user.id}`, { 
        traceId, 
        userId: user.id,
        journey: Journey.HEALTH,
        error: error.message,
        stack: error.stack,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR
      });
      
      span.recordException(error);
      span.end();
      
      // The JourneyExceptionFilter will handle the error response
      throw error;
    }
  }
}