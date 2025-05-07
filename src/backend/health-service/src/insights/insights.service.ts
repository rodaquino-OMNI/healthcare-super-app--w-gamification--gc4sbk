import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import from @austa/interfaces package for type-safe data models
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health/health-metric.interface';
import { IHealthGoal, GoalType, GoalStatus, GoalPeriod } from '@austa/interfaces/journey/health/health-goal.interface';
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';

// Import from internal services using path aliases
import { Configuration } from '@app/config/configuration';
import { FhirService } from '@app/integrations/fhir/fhir.service';
import { WearablesService } from '@app/integrations/wearables/wearables.service';

// Import from shared packages using path aliases
import { Journey } from '@austa/interfaces/common/journey.enum';
import { PrismaService } from '@austa/database/prisma.service';
import { HealthContext } from '@austa/database/contexts/health.context';
import { KafkaService } from '@austa/events/kafka';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { CircuitBreaker } from '@austa/database/errors/circuit-breaker';
import { RetryStrategy, ExponentialBackoffStrategy } from '@austa/database/errors/retry-strategies';
import { DatabaseException, QueryException } from '@austa/database/errors/database-error.exception';
import { DatabaseErrorType } from '@austa/database/errors/database-error.types';

/**
 * Generates health insights for users based on their health data.
 * It retrieves health metrics, analyzes trends, and generates personalized recommendations.
 * This service integrates with external data sources and the gamification engine to provide a comprehensive health management experience.
 */
@Injectable()
export class InsightsService {
  private readonly healthContext: HealthContext;
  private readonly retryStrategy: RetryStrategy;
  private readonly circuitBreaker: CircuitBreaker;
  
  /**
   * Initializes the InsightsService.
   * @param prisma - The Prisma service for database access.
   * @param fhirService - The FHIR service for integrating with EHR systems.
   * @param wearablesService - The Wearables service for integrating with wearable devices.
   * @param kafkaService - The Kafka service for event-driven communication.
   * @param logger - The logger service for logging events.
   * @param tracingService - The tracing service for distributed tracing.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly fhirService: FhirService,
    private readonly wearablesService: WearablesService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.setContext(InsightsService.name);
    
    // Initialize health-specific database context
    this.healthContext = this.prisma.getContext(Journey.HEALTH) as HealthContext;
    
    // Configure retry strategy with exponential backoff
    this.retryStrategy = new ExponentialBackoffStrategy({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });
    
    // Configure circuit breaker for external service calls
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      monitorIntervalMs: 5000,
      name: 'insights-service',
    });
  }

  /**
   * Generates health insights for all users.
   * This method is scheduled to run every day at midnight.
   * @returns A promise that resolves when the insights have been generated.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateInsights(): Promise<void> {
    const traceId = this.tracingService.generateTraceId();
    const span = this.tracingService.startSpan('insights.generateInsights', { traceId });
    
    this.logger.log('Starting daily health insights generation...', { traceId });

    try {
      // Retrieves all users from the database using HealthContext
      const users = await this.healthContext.findAllUsers();

      // Iterates through each user and generates insights by calling generateUserInsights
      for (const user of users) {
        await this.generateUserInsights(user.id, traceId);
        this.logger.log(`Generated insights for user ${user.id}`, { traceId, userId: user.id });
      }

      this.logger.log('Daily health insights generation completed.', { traceId });
      span.end();
    } catch (error) {
      this.logger.error('Error during daily health insights generation', { 
        traceId, 
        error: error.message, 
        stack: error.stack 
      });
      span.recordException(error);
      span.end();
    }
  }

  /**
   * Generates health insights for a specific user.
   * @param userId - The ID of the user to generate insights for.
   * @param parentTraceId - Optional trace ID for distributed tracing.
   * @returns A promise that resolves with the generated insights for the user.
   */
  async generateUserInsights(userId: string, parentTraceId?: string): Promise<any> {
    const traceId = parentTraceId || this.tracingService.generateTraceId();
    const span = this.tracingService.startSpan('insights.generateUserInsights', { 
      traceId,
      attributes: { userId }
    });
    
    this.logger.log(`Generating health insights for user ${userId}`, { traceId, userId });

    try {
      // Retrieves the user's health metrics from the database using HealthContext with retry strategy
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const metricsSpan = this.tracingService.startSpan('insights.getUserHealthMetrics', { 
        traceId, 
        attributes: { userId, startDate, endDate }
      });
      
      const metrics = await this.retryStrategy.execute(() => 
        this.getUserHealthMetrics(userId, startDate, endDate, traceId)
      );
      
      metricsSpan.end();

      // Retrieves the user's health goals from the database using HealthContext with retry strategy
      const goalsSpan = this.tracingService.startSpan('insights.getUserHealthGoals', { 
        traceId, 
        attributes: { userId }
      });
      
      const goals = await this.retryStrategy.execute(() => 
        this.getUserHealthGoals(userId, traceId)
      );
      
      goalsSpan.end();

      // Analyzes the user's health data and goals to generate personalized insights
      const analysisSpan = this.tracingService.startSpan('insights.analyzeHealthData', { 
        traceId, 
        attributes: { userId, metricsCount: metrics.length, goalsCount: goals.length }
      });
      
      const insightsData = this.analyzeHealthData(metrics, goals);
      
      analysisSpan.end();

      // Publishes insight generation events to Kafka for gamification processing
      const publishSpan = this.tracingService.startSpan('insights.publishInsightEvent', { 
        traceId, 
        attributes: { userId }
      });
      
      await this.circuitBreaker.execute(() => 
        this.publishInsightEvent(userId, insightsData, traceId)
      );
      
      publishSpan.end();

      this.logger.log(`Generated insights for user ${userId}`, { 
        traceId, 
        userId, 
        insightsData: JSON.stringify(insightsData) 
      });

      span.end();
      return insightsData;
    } catch (error) {
      this.logger.error(`Error generating insights for user ${userId}`, { 
        traceId, 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      
      span.recordException(error);
      span.end();
      
      // Rethrow with enhanced error information
      if (error instanceof DatabaseException) {
        throw error; // Already a properly formatted database exception
      } else {
        throw new QueryException(
          'Failed to generate user insights',
          DatabaseErrorType.QUERY,
          { userId, operation: 'generateUserInsights' },
          error
        );
      }
    }
  }

  /**
   * Retrieves health metrics for a specific user.
   * @param userId - The ID of the user to retrieve metrics for.
   * @param startDate - The start date for the metrics query.
   * @param endDate - The end date for the metrics query.
   * @param traceId - Optional trace ID for distributed tracing.
   * @returns A promise that resolves with an array of health metrics.
   */
  async getUserHealthMetrics(
    userId: string, 
    startDate: Date, 
    endDate: Date, 
    traceId?: string
  ): Promise<IHealthMetric[]> {
    const span = this.tracingService.startSpan('insights.getUserHealthMetrics.db', { 
      traceId, 
      attributes: { userId, startDate, endDate }
    });
    
    this.logger.log(`Retrieving health metrics for user ${userId}`, { 
      traceId, 
      userId, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });

    try {
      // Use the health context for optimized time-series queries
      const metrics = await this.healthContext.findHealthMetrics({
        where: {
          userId: userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      this.logger.log(`Retrieved ${metrics.length} health metrics for user ${userId}`, { 
        traceId, 
        userId, 
        count: metrics.length 
      });

      span.end();
      return metrics;
    } catch (error) {
      this.logger.error(`Error retrieving health metrics for user ${userId}`, { 
        traceId, 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      
      span.recordException(error);
      span.end();
      
      throw new QueryException(
        'Failed to retrieve user health metrics',
        DatabaseErrorType.QUERY,
        { userId, operation: 'getUserHealthMetrics', startDate, endDate },
        error
      );
    }
  }

  /**
   * Retrieves health goals for a specific user.
   * @param userId - The ID of the user to retrieve goals for.
   * @param traceId - Optional trace ID for distributed tracing.
   * @returns A promise that resolves with an array of health goals.
   */
  async getUserHealthGoals(userId: string, traceId?: string): Promise<IHealthGoal[]> {
    const span = this.tracingService.startSpan('insights.getUserHealthGoals.db', { 
      traceId, 
      attributes: { userId }
    });
    
    this.logger.log(`Retrieving health goals for user ${userId}`, { traceId, userId });

    try {
      // Use the health context for optimized queries
      const goals = await this.healthContext.findHealthGoals({
        where: {
          recordId: userId, // Assuming recordId is used to store userId
          status: GoalStatus.ACTIVE, // Filters active goals by default
        },
      });

      this.logger.log(`Retrieved ${goals.length} health goals for user ${userId}`, { 
        traceId, 
        userId, 
        count: goals.length 
      });

      span.end();
      return goals;
    } catch (error) {
      this.logger.error(`Error retrieving health goals for user ${userId}`, { 
        traceId, 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      
      span.recordException(error);
      span.end();
      
      throw new QueryException(
        'Failed to retrieve user health goals',
        DatabaseErrorType.QUERY,
        { userId, operation: 'getUserHealthGoals' },
        error
      );
    }
  }

  /**
   * Analyzes health data to generate insights.
   * @param metrics - An array of health metrics to analyze.
   * @param goals - An array of health goals to consider.
   * @returns The generated insights based on the health data.
   */
  analyzeHealthData(metrics: IHealthMetric[], goals: IHealthGoal[]): any {
    this.logger.log('Analyzing health data to generate insights', { 
      metricsCount: metrics.length, 
      goalsCount: goals.length 
    });

    // Analyzes trends in health metrics.
    // Identifies abnormal values.
    // Checks progress towards goals.
    // Generates personalized recommendations.

    const insights = {
      metricsCount: metrics.length,
      goalsCount: goals.length,
      recommendations: ['Stay hydrated', 'Get some exercise'],
      // Additional analysis results would be added here
    };

    this.logger.log(`Generated insights`, { insights: JSON.stringify(insights) });

    return insights;
  }

  /**
   * Publishes insight generation events to Kafka for gamification processing.
   * @param userId - The ID of the user to publish the event for.
   * @param insightData - The generated insight data.
   * @param traceId - Optional trace ID for distributed tracing.
   * @returns A promise that resolves when the event has been published.
   */
  async publishInsightEvent(userId: string, insightData: any, traceId?: string): Promise<void> {
    const span = this.tracingService.startSpan('insights.publishInsightEvent.kafka', { 
      traceId, 
      attributes: { userId }
    });
    
    this.logger.log(`Publishing insight event for user ${userId}`, { traceId, userId });

    try {
      // Create a standardized event payload using the GamificationEvent interface
      const eventPayload: GamificationEvent = {
        eventType: EventType.HEALTH_INSIGHT_GENERATED,
        userId: userId,
        timestamp: new Date().toISOString(),
        journeyType: Journey.HEALTH,
        version: '1.0',
        data: {
          insightData,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          correlationId: traceId,
          source: 'health-service',
        },
      };

      // Publish the event to the Kafka topic for gamification processing
      await this.kafkaService.produce(
        'austa.health.insights',
        eventPayload,
        { headers: { 'trace-id': traceId } }
      );

      this.logger.log(`Published insight event for user ${userId}`, { traceId, userId });
      span.end();
    } catch (error) {
      this.logger.error(`Error publishing insight event for user ${userId}`, { 
        traceId, 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      
      span.recordException(error);
      span.end();
      
      throw new QueryException(
        'Failed to publish insight event',
        DatabaseErrorType.EXTERNAL,
        { userId, operation: 'publishInsightEvent' },
        error
      );
    }
  }
}