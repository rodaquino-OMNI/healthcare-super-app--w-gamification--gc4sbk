import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AchievementsService } from '../achievements/achievements.service';
import { ProfilesService } from '../profiles/profiles.service';
import { RulesService } from '../rules/rules.service';
import { RewardsService } from '../rewards/rewards.service';
import { QuestsService } from '../quests/quests.service';

// Import from @austa/interfaces package for standardized event schemas
import {
  GamificationEvent,
  EventType,
  JourneyType,
  EventMetadata
} from '@austa/interfaces/gamification/events';

// Import from @austa/events package for event handling utilities
import {
  KafkaService,
  KafkaConsumer,
  KafkaProducer,
  KafkaTopics,
  DeadLetterQueueService
} from '@austa/events/kafka';

// Import error handling and retry utilities
import {
  RetryService,
  CircuitBreakerService,
  EventProcessingError,
  RetryPolicy,
  RetryOptions
} from '@austa/events/errors';

// Import validation and versioning utilities
import {
  EventValidator,
  EventVersionDetector,
  EventTransformer
} from '@austa/events/utils';

// Import logging and tracing utilities
import { LoggerService } from '@app/shared/logging/logger.service';
import { TelemetryService } from '@app/shared/telemetry/telemetry.service';
import { CorrelationIdService } from '@austa/events/utils/correlation-id';

/**
 * Service responsible for processing gamification events from all journeys in the AUSTA SuperApp.
 * It receives events, evaluates rules, and updates user profiles with points and achievements.
 * Acts as the central hub for the gamification engine with enhanced error handling and retry mechanisms.
 */
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly retryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    exponentialBackoff: true,
    jitter: true
  };

  private readonly consumerOptions = {
    groupId: 'gamification-engine',
    topics: [
      KafkaTopics.HEALTH_EVENTS,
      KafkaTopics.CARE_EVENTS,
      KafkaTopics.PLAN_EVENTS,
      KafkaTopics.USER_EVENTS
    ],
    fromBeginning: false
  };

  private consumer: KafkaConsumer;
  private producer: KafkaProducer;

  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService,
    private readonly rulesService: RulesService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly rewardsService: RewardsService,
    private readonly questsService: QuestsService,
    private readonly retryService: RetryService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly dlqService: DeadLetterQueueService,
    private readonly telemetryService: TelemetryService,
    private readonly eventValidator: EventValidator,
    private readonly versionDetector: EventVersionDetector,
    private readonly eventTransformer: EventTransformer,
    private readonly correlationService: CorrelationIdService
  ) {
    this.logger.log('EventsService initialized', 'EventsService');
  }

  /**
   * Initialize Kafka consumer and producer on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing Kafka consumer and producer', 'EventsService');
      
      // Initialize Kafka producer
      this.producer = await this.kafkaService.createProducer({
        clientId: 'gamification-engine-producer',
        retry: this.retryOptions
      });
      
      // Initialize Kafka consumer
      this.consumer = await this.kafkaService.createConsumer(this.consumerOptions);
      
      // Subscribe to events
      await this.consumer.subscribe();
      
      // Start consuming events
      this.consumer.consume(async (message) => {
        const correlationId = this.correlationService.extractFromMessage(message) || 
                             this.correlationService.generate();
        
        try {
          // Parse and validate the event
          const event = await this.parseAndValidateEvent(message.value, correlationId);
          
          // Process the event
          await this.processEvent(event);
          
          // Commit the message after successful processing
          await this.consumer.commitMessage(message);
        } catch (error) {
          this.logger.error(
            `Failed to process Kafka message: ${error.message}`,
            { error: error.stack, correlationId },
            'EventsService'
          );
          
          // Handle failed message
          await this.handleFailedMessage(message, error, correlationId);
        }
      });
      
      this.logger.log('Kafka consumer and producer initialized successfully', 'EventsService');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Kafka services: ${error.message}`,
        { error: error.stack },
        'EventsService'
      );
      throw error;
    }
  }

  /**
   * Clean up resources on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting Kafka consumer and producer', 'EventsService');
      
      // Disconnect consumer and producer
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      
      if (this.producer) {
        await this.producer.disconnect();
      }
      
      this.logger.log('Kafka consumer and producer disconnected successfully', 'EventsService');
    } catch (error) {
      this.logger.error(
        `Error disconnecting Kafka services: ${error.message}`,
        { error: error.stack },
        'EventsService'
      );
    }
  }

  /**
   * Parse and validate an event from a Kafka message
   * 
   * @param messageValue The raw message value from Kafka
   * @param correlationId The correlation ID for tracing
   * @returns A validated GamificationEvent
   */
  private async parseAndValidateEvent(messageValue: any, correlationId: string): Promise<GamificationEvent> {
    try {
      // Parse the message value
      const rawEvent = typeof messageValue === 'string' 
        ? JSON.parse(messageValue) 
        : messageValue;
      
      // Detect event version
      const version = this.versionDetector.detectVersion(rawEvent);
      
      // Transform event to latest version if needed
      const latestEvent = version !== 'latest' 
        ? await this.eventTransformer.transformToLatest(rawEvent, version) 
        : rawEvent;
      
      // Validate the event
      const validationResult = await this.eventValidator.validate(latestEvent);
      
      if (!validationResult.isValid) {
        throw new EventProcessingError(
          `Event validation failed: ${validationResult.errors.join(', ')}`,
          'VALIDATION_ERROR',
          {
            correlationId,
            eventType: latestEvent.type,
            errors: validationResult.errors
          }
        );
      }
      
      // Add correlation ID to event metadata
      if (!latestEvent.metadata) {
        latestEvent.metadata = {} as EventMetadata;
      }
      
      latestEvent.metadata.correlationId = correlationId;
      
      return latestEvent as GamificationEvent;
    } catch (error) {
      if (error instanceof EventProcessingError) {
        throw error;
      }
      
      throw new EventProcessingError(
        `Failed to parse or validate event: ${error.message}`,
        'PARSING_ERROR',
        { correlationId }
      );
    }
  }

  /**
   * Handle a failed message by sending it to the dead letter queue
   * 
   * @param message The failed Kafka message
   * @param error The error that occurred
   * @param correlationId The correlation ID for tracing
   */
  private async handleFailedMessage(message: any, error: Error, correlationId: string): Promise<void> {
    try {
      // Determine if the error is retryable
      const isRetryable = !(error instanceof EventProcessingError && 
                          ['VALIDATION_ERROR', 'PARSING_ERROR'].includes(error.code));
      
      // If retryable, attempt to retry processing
      if (isRetryable && message.retryCount < this.retryOptions.maxRetries) {
        // Increment retry count
        message.retryCount = (message.retryCount || 0) + 1;
        
        // Calculate delay using exponential backoff
        const delay = this.calculateRetryDelay(message.retryCount);
        
        this.logger.log(
          `Retrying message processing (attempt ${message.retryCount}/${this.retryOptions.maxRetries}) after ${delay}ms`,
          { correlationId, retryCount: message.retryCount },
          'EventsService'
        );
        
        // Schedule retry after delay
        setTimeout(async () => {
          try {
            // Parse and validate the event
            const event = await this.parseAndValidateEvent(message.value, correlationId);
            
            // Process the event
            await this.processEvent(event);
            
            // Commit the message after successful processing
            await this.consumer.commitMessage(message);
            
            this.logger.log(
              `Successfully processed message on retry ${message.retryCount}`,
              { correlationId, retryCount: message.retryCount },
              'EventsService'
            );
          } catch (retryError) {
            this.logger.error(
              `Retry ${message.retryCount} failed: ${retryError.message}`,
              { error: retryError.stack, correlationId, retryCount: message.retryCount },
              'EventsService'
            );
            
            // Handle the failed retry
            await this.handleFailedMessage(message, retryError, correlationId);
          }
        }, delay);
      } else {
        // Send to dead letter queue if max retries exceeded or non-retryable error
        await this.dlqService.sendToDLQ({
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
          value: message.value,
          key: message.key,
          headers: message.headers,
          error: {
            message: error.message,
            stack: error.stack,
            code: error instanceof EventProcessingError ? error.code : 'UNKNOWN_ERROR',
            retryable: isRetryable
          },
          metadata: {
            correlationId,
            retryCount: message.retryCount || 0,
            timestamp: new Date().toISOString()
          }
        });
        
        this.logger.warn(
          `Message sent to DLQ after ${message.retryCount || 0} retries: ${error.message}`,
          { correlationId, retryCount: message.retryCount || 0 },
          'EventsService'
        );
        
        // Commit the message to avoid reprocessing
        await this.consumer.commitMessage(message);
        
        // Record telemetry for DLQ
        this.telemetryService.incrementCounter('events.dlq.sent');
      }
    } catch (dlqError) {
      this.logger.error(
        `Failed to handle failed message: ${dlqError.message}`,
        { originalError: error.message, dlqError: dlqError.stack, correlationId },
        'EventsService'
      );
      
      // Attempt to commit the message to avoid endless reprocessing
      try {
        await this.consumer.commitMessage(message);
      } catch (commitError) {
        this.logger.error(
          `Failed to commit failed message: ${commitError.message}`,
          { correlationId },
          'EventsService'
        );
      }
    }
  }

  /**
   * Calculate retry delay using exponential backoff with jitter
   * 
   * @param retryCount The current retry count
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(retryCount: number): number {
    const { initialDelay, maxDelay, jitter } = this.retryOptions;
    
    // Calculate base delay with exponential backoff
    let delay = initialDelay * Math.pow(2, retryCount - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, maxDelay);
    
    // Add jitter to prevent thundering herd problem
    if (jitter) {
      const jitterFactor = 0.25; // 25% jitter
      const jitterAmount = delay * jitterFactor;
      delay = delay - jitterAmount + (Math.random() * jitterAmount * 2);
    }
    
    return Math.floor(delay);
  }

  /**
   * Processes a given event by evaluating rules and updating the user's profile.
   * This is the main entry point for handling all gamification events across all journeys.
   * 
   * @param event The event to process containing type, userId, data, and journey
   * @returns A promise that resolves with the result of the event processing
   */
  async processEvent(event: GamificationEvent): Promise<any> {
    const startTime = Date.now();
    const correlationId = event.metadata?.correlationId || this.correlationService.generate();
    
    this.logger.log(
      `Processing event: ${event.type} for user: ${event.userId}`,
      { userId: event.userId, eventType: event.type, correlationId, journey: event.journey },
      'EventsService'
    );
    
    // Record telemetry for event processing
    this.telemetryService.incrementCounter(`events.process.${event.type}`);
    this.telemetryService.incrementCounter(`events.process.journey.${event.journey || 'unknown'}`);
    
    try {
      // Use circuit breaker to prevent cascading failures
      return await this.circuitBreakerService.execute(
        `event-processing-${event.type}`,
        async () => {
          // Use retry service for transient failures
          return await this.retryService.execute(
            async () => {
              // Get the user's game profile
              let gameProfile;
              try {
                gameProfile = await this.profilesService.findById(event.userId);
              } catch (error) {
                // If profile doesn't exist, create it
                this.logger.log(
                  `Creating new game profile for user: ${event.userId}`,
                  { userId: event.userId, correlationId },
                  'EventsService'
                );
                gameProfile = await this.profilesService.create(event.userId);
              }
              
              // Process the event through the rules service
              await this.rulesService.processEvent(event);
              
              // Record successful processing
              this.telemetryService.incrementCounter('events.process.success');
              this.telemetryService.recordDuration('events.process.duration', Date.now() - startTime);
              
              // Emit event processed notification
              await this.producer.produce({
                topic: KafkaTopics.GAMIFICATION_EVENTS,
                messages: [{
                  key: event.userId,
                  value: JSON.stringify({
                    type: EventType.EVENT_PROCESSED,
                    userId: event.userId,
                    data: {
                      originalEventType: event.type,
                      journey: event.journey,
                      timestamp: new Date().toISOString()
                    },
                    metadata: {
                      correlationId,
                      sourceEvent: event.type,
                      processingTime: Date.now() - startTime
                    }
                  }),
                  headers: {
                    correlationId,
                    eventType: EventType.EVENT_PROCESSED
                  }
                }]
              });
              
              this.logger.log(
                `Event ${event.type} processed successfully for user ${event.userId}`,
                { userId: event.userId, eventType: event.type, correlationId, duration: Date.now() - startTime },
                'EventsService'
              );
              
              return {
                success: true,
                eventType: event.type,
                userId: event.userId,
                journey: event.journey,
                processingTime: Date.now() - startTime
              };
            },
            this.retryOptions
          );
        },
        {
          fallback: () => {
            this.logger.error(
              `Circuit breaker open for event type ${event.type}`,
              { userId: event.userId, eventType: event.type, correlationId },
              'EventsService'
            );
            
            this.telemetryService.incrementCounter('events.circuitBreaker.open');
            
            return {
              success: false,
              error: 'Service unavailable due to circuit breaker',
              eventType: event.type,
              userId: event.userId
            };
          },
          resetTimeout: 30000, // 30 seconds
          failureThreshold: 5 // 5 failures to open circuit
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to process event for user ${event.userId}: ${error.message}`,
        { error: error.stack, userId: event.userId, eventType: event.type, correlationId },
        'EventsService'
      );
      
      // Record error telemetry
      this.telemetryService.incrementCounter('events.process.error');
      
      // Emit error event for monitoring
      try {
        await this.producer.produce({
          topic: KafkaTopics.ERROR_EVENTS,
          messages: [{
            key: event.userId,
            value: JSON.stringify({
              type: EventType.PROCESSING_ERROR,
              userId: event.userId,
              data: {
                originalEventType: event.type,
                journey: event.journey,
                error: error.message,
                timestamp: new Date().toISOString()
              },
              metadata: {
                correlationId,
                sourceEvent: event.type
              }
            }),
            headers: {
              correlationId,
              eventType: EventType.PROCESSING_ERROR
            }
          }]
        });
      } catch (emitError) {
        this.logger.error(
          `Failed to emit error event: ${emitError.message}`,
          { originalError: error.message, emitError: emitError.stack, correlationId },
          'EventsService'
        );
      }
      
      // Rethrow as EventProcessingError for consistent error handling
      if (error instanceof EventProcessingError) {
        throw error;
      }
      
      throw new EventProcessingError(
        `Event processing failed: ${error.message}`,
        'PROCESSING_ERROR',
        {
          correlationId,
          eventType: event.type,
          userId: event.userId,
          journey: event.journey
        },
        error
      );
    }
  }

  /**
   * Manually publish an event to the Kafka topic
   * 
   * @param event The event to publish
   * @returns A promise that resolves when the event is published
   */
  async publishEvent(event: GamificationEvent): Promise<void> {
    const correlationId = event.metadata?.correlationId || this.correlationService.generate();
    
    try {
      // Validate the event before publishing
      const validationResult = await this.eventValidator.validate(event);
      
      if (!validationResult.isValid) {
        throw new EventProcessingError(
          `Event validation failed: ${validationResult.errors.join(', ')}`,
          'VALIDATION_ERROR',
          {
            correlationId,
            eventType: event.type,
            errors: validationResult.errors
          }
        );
      }
      
      // Determine the appropriate topic based on the journey
      let topic: string;
      switch (event.journey) {
        case JourneyType.HEALTH:
          topic = KafkaTopics.HEALTH_EVENTS;
          break;
        case JourneyType.CARE:
          topic = KafkaTopics.CARE_EVENTS;
          break;
        case JourneyType.PLAN:
          topic = KafkaTopics.PLAN_EVENTS;
          break;
        default:
          topic = KafkaTopics.GAMIFICATION_EVENTS;
      }
      
      // Add correlation ID to event metadata if not present
      if (!event.metadata) {
        event.metadata = {} as EventMetadata;
      }
      
      event.metadata.correlationId = correlationId;
      event.metadata.timestamp = event.metadata.timestamp || new Date().toISOString();
      
      // Publish the event
      await this.producer.produce({
        topic,
        messages: [{
          key: event.userId,
          value: JSON.stringify(event),
          headers: {
            correlationId,
            eventType: event.type,
            journey: event.journey || 'unknown'
          }
        }]
      });
      
      this.logger.log(
        `Event ${event.type} published successfully to topic ${topic}`,
        { eventType: event.type, userId: event.userId, correlationId, topic },
        'EventsService'
      );
      
      // Record telemetry
      this.telemetryService.incrementCounter(`events.publish.${event.type}`);
      this.telemetryService.incrementCounter(`events.publish.topic.${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${event.type}: ${error.message}`,
        { error: error.stack, eventType: event.type, userId: event.userId, correlationId },
        'EventsService'
      );
      
      // Record error telemetry
      this.telemetryService.incrementCounter('events.publish.error');
      
      // Rethrow as EventProcessingError for consistent error handling
      if (error instanceof EventProcessingError) {
        throw error;
      }
      
      throw new EventProcessingError(
        `Event publishing failed: ${error.message}`,
        'PUBLISHING_ERROR',
        {
          correlationId,
          eventType: event.type,
          userId: event.userId,
          journey: event.journey
        },
        error
      );
    }
  }
}