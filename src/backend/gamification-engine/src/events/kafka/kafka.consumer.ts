import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConsumerService as BaseKafkaConsumerService } from '@austa/events/kafka';
import { EventsService } from '../events.service';
import { ProcessEventDto } from '../dto/process-event.dto';
import { LoggerService } from '../../common/utils/logger.service';
import { KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { KafkaRetryPolicy, RetryableError, NonRetryableError } from '@austa/events/kafka';
import { KafkaErrorTypes } from '@austa/events/kafka';

/**
 * Enhanced Kafka consumer for the gamification engine that processes events from all journey services.
 * Features:
 * - Dead-letter queue routing for persistently failed events
 * - Exponential backoff retry strategy with configurable parameters
 * - Enhanced error classification and proper error propagation
 * - Structured logging with correlation IDs for traceability
 * - Consumer groups by journey type for proper message distribution
 */
@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumer.name);
  private readonly retryPolicy: KafkaRetryPolicy;
  private readonly maxRetries: number;
  private readonly initialRetryMs: number;
  private readonly maxRetryMs: number;
  private readonly retryBackoffMultiplier: number;
  private readonly dlqEnabled: boolean;
  private readonly dlqSuffix: string;
  private readonly consumerGroupId: string;
  private readonly healthTopic: string;
  private readonly careTopic: string;
  private readonly planTopic: string;
  private readonly userTopic: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsService: EventsService,
    private readonly baseKafkaConsumerService: BaseKafkaConsumerService,
    private readonly loggerService: LoggerService,
  ) {
    // Load retry configuration from config service
    this.maxRetries = this.configService.get<number>('gamificationEngine.kafka.retry.maxRetries', 5);
    this.initialRetryMs = this.configService.get<number>('gamificationEngine.kafka.retry.initialRetryMs', 1000);
    this.maxRetryMs = this.configService.get<number>('gamificationEngine.kafka.retry.maxRetryMs', 30000);
    this.retryBackoffMultiplier = this.configService.get<number>('gamificationEngine.kafka.retry.backoffMultiplier', 2);
    
    // Configure retry policy
    this.retryPolicy = {
      maxRetries: this.maxRetries,
      initialRetryTimeMs: this.initialRetryMs,
      maxRetryTimeMs: this.maxRetryMs,
      backoffMultiplier: this.retryBackoffMultiplier,
    };

    // Load DLQ configuration
    this.dlqEnabled = this.configService.get<boolean>('gamificationEngine.kafka.dlq.enabled', true);
    this.dlqSuffix = this.configService.get<string>('gamificationEngine.kafka.dlq.suffix', '-dlq');

    // Load consumer group configuration
    this.consumerGroupId = this.configService.get<string>(
      'gamificationEngine.kafka.groupId',
      this.configService.get<string>('kafka.groupId', 'gamification-consumer-group')
    );

    // Load topic configurations
    this.healthTopic = this.configService.get<string>('gamificationEngine.kafka.topics.health', 'health.events');
    this.careTopic = this.configService.get<string>('gamificationEngine.kafka.topics.care', 'care.events');
    this.planTopic = this.configService.get<string>('gamificationEngine.kafka.topics.plan', 'plan.events');
    this.userTopic = this.configService.get<string>('gamificationEngine.kafka.topics.user', 'user.events');
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Kafka consumer service');
    
    // Subscribe to topics if configured
    const topics = [
      { name: this.healthTopic, journeyType: 'health' },
      { name: this.careTopic, journeyType: 'care' },
      { name: this.planTopic, journeyType: 'plan' },
      { name: this.userTopic, journeyType: 'user' },
    ];

    // Filter out undefined topics
    const validTopics = topics.filter(topic => !!topic.name);

    if (validTopics.length === 0) {
      this.logger.warn('No Kafka topics configured for consumption');
      return;
    }

    // Subscribe to each topic with journey-specific consumer groups
    for (const topic of validTopics) {
      const journeySpecificGroupId = `${this.consumerGroupId}-${topic.journeyType}`;
      
      this.logger.log(`Subscribing to topic ${topic.name} with consumer group ${journeySpecificGroupId}`);
      
      await this.baseKafkaConsumerService.consume(
        topic.name,
        journeySpecificGroupId,
        this.createMessageHandler(topic.journeyType),
        this.retryPolicy,
        this.dlqEnabled ? `${topic.name}${this.dlqSuffix}` : undefined
      );
    }
  }

  /**
   * Creates a message handler for the specified journey type
   * @param journeyType The type of journey (health, care, plan, user)
   * @returns A function that handles Kafka messages
   */
  private createMessageHandler(journeyType: string) {
    return async (message: KafkaMessage): Promise<void> => {
      // Generate correlation ID for tracing
      const correlationId = message.headers?.['correlation-id'] 
        ? message.headers['correlation-id'].toString() 
        : uuidv4();

      // Create a logger context with correlation ID
      const logContext = {
        correlationId,
        topic: journeyType,
        partition: message.partition,
        offset: message.offset,
      };

      try {
        this.loggerService.debug(
          `Processing ${journeyType} event message`, 
          { ...logContext, messageKey: message.key?.toString() }
        );

        // Parse message value
        if (!message.value) {
          throw new NonRetryableError(
            'Message value is empty or null',
            KafkaErrorTypes.INVALID_MESSAGE_FORMAT
          );
        }

        let payload: any;
        try {
          payload = JSON.parse(message.value.toString());
        } catch (error) {
          throw new NonRetryableError(
            `Failed to parse message value: ${error.message}`,
            KafkaErrorTypes.DESERIALIZATION_ERROR
          );
        }

        // Validate message structure
        this.validateEventPayload(payload);

        // Add journey type if not present
        if (!payload.journey) {
          payload.journey = journeyType;
        }

        // Convert timestamp to Date if it's a string
        if (payload.timestamp && typeof payload.timestamp === 'string') {
          payload.timestamp = new Date(payload.timestamp);
        }

        // Create DTO for processing
        const eventDto = new ProcessEventDto();
        Object.assign(eventDto, payload);

        // Process the event
        await this.eventsService.processEvent(eventDto);

        this.loggerService.info(
          `Successfully processed ${journeyType} event`, 
          { ...logContext, eventType: payload.type }
        );
      } catch (error) {
        // Enhance error with context for better traceability
        const enhancedError = this.enhanceError(error, logContext);

        // Log the error with context
        this.loggerService.error(
          `Error processing ${journeyType} event: ${enhancedError.message}`,
          { 
            ...logContext, 
            errorType: enhancedError.name, 
            errorStack: enhancedError.stack,
            isRetryable: this.isRetryableError(enhancedError)
          }
        );

        // Rethrow the error to trigger retry or DLQ routing
        throw enhancedError;
      }
    };
  }

  /**
   * Validates that the event payload has the required fields
   * @param payload The event payload to validate
   * @throws NonRetryableError if validation fails
   */
  private validateEventPayload(payload: any): void {
    if (!payload) {
      throw new NonRetryableError(
        'Event payload is null or undefined',
        KafkaErrorTypes.INVALID_MESSAGE_FORMAT
      );
    }

    if (!payload.type || typeof payload.type !== 'string') {
      throw new NonRetryableError(
        'Event type is missing or not a string',
        KafkaErrorTypes.INVALID_MESSAGE_FORMAT
      );
    }

    if (!payload.userId) {
      throw new NonRetryableError(
        'Event userId is missing',
        KafkaErrorTypes.INVALID_MESSAGE_FORMAT
      );
    }

    if (!payload.data || typeof payload.data !== 'object') {
      throw new NonRetryableError(
        'Event data is missing or not an object',
        KafkaErrorTypes.INVALID_MESSAGE_FORMAT
      );
    }
  }

  /**
   * Enhances an error with additional context for better traceability
   * @param error The original error
   * @param context The context to add to the error
   * @returns The enhanced error
   */
  private enhanceError(error: any, context: any): Error {
    // If it's already a classified error, just add context
    if (error instanceof RetryableError || error instanceof NonRetryableError) {
      error.context = { ...error.context, ...context };
      return error;
    }

    // Classify the error based on its type
    if (this.isConnectionError(error)) {
      return new RetryableError(
        error.message || 'Connection error',
        KafkaErrorTypes.CONNECTION_ERROR,
        { originalError: error, ...context }
      );
    }

    if (this.isTimeoutError(error)) {
      return new RetryableError(
        error.message || 'Timeout error',
        KafkaErrorTypes.TIMEOUT_ERROR,
        { originalError: error, ...context }
      );
    }

    if (this.isTransientError(error)) {
      return new RetryableError(
        error.message || 'Transient error',
        KafkaErrorTypes.TRANSIENT_ERROR,
        { originalError: error, ...context }
      );
    }

    // Default to non-retryable error
    return new NonRetryableError(
      error.message || 'Unknown error',
      KafkaErrorTypes.UNKNOWN_ERROR,
      { originalError: error, ...context }
    );
  }

  /**
   * Determines if an error is related to connection issues
   * @param error The error to check
   * @returns True if it's a connection error
   */
  private isConnectionError(error: any): boolean {
    const connectionErrorPatterns = [
      /connection/i,
      /network/i,
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /broker/i,
    ];

    return connectionErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determines if an error is related to timeouts
   * @param error The error to check
   * @returns True if it's a timeout error
   */
  private isTimeoutError(error: any): boolean {
    const timeoutErrorPatterns = [
      /timeout/i,
      /timed out/i,
      /ETIMEDOUT/,
    ];

    return timeoutErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determines if an error is transient (temporary) and can be retried
   * @param error The error to check
   * @returns True if it's a transient error
   */
  private isTransientError(error: any): boolean {
    const transientErrorPatterns = [
      /temporary/i,
      /transient/i,
      /retry/i,
      /unavailable/i,
      /overload/i,
      /throttl/i,
      /capacity/i,
      /congestion/i,
      /backpressure/i,
    ];

    return transientErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determines if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable
   */
  private isRetryableError(error: any): boolean {
    return error instanceof RetryableError;
  }
}