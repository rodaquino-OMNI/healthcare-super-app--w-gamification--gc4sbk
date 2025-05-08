import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsService } from '../../events/events.service';
import { RulesService } from '../../rules/rules.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { ProcessEventDto } from '../dto/process-event.dto';
import { v4 as uuidv4 } from 'uuid';
import { ExternalDependencyUnavailableError, ExternalResponseFormatError } from '@austa/errors/categories';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Configuration interface for retry policies
 */
interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Backoff factor for exponential delay calculation */
  backoffFactor: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
}

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
export class KafkaConsumerService implements OnModuleInit {
  private readonly retryPolicy: RetryPolicy;
  private readonly dlqEnabled: boolean;
  private readonly journeyConsumerGroups: Record<string, string>;

  /**
   * Injects the necessary services and initializes configuration.
   * 
   * @param eventsService Service for processing gamification events
   * @param rulesService Service for evaluating gamification rules
   * @param profilesService Service for managing user game profiles
   * @param kafkaService Service for Kafka interaction
   * @param configService Service for accessing configuration
   * @param logger Service for logging
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly rulesService: RulesService,
    private readonly profilesService: ProfilesService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    // Initialize retry policy from configuration
    const kafkaConfig = this.configService.get('gamificationEngine.kafka');
    
    this.retryPolicy = {
      maxRetries: kafkaConfig?.maxRetries || 3,
      initialDelay: kafkaConfig?.retryInterval || 1000,
      backoffFactor: kafkaConfig?.backoffFactor || 2,
      maxDelay: kafkaConfig?.maxRetryDelay || 30000
    };
    
    // Initialize DLQ configuration
    this.dlqEnabled = kafkaConfig?.dlqEnabled !== false; // Enabled by default
    
    // Initialize journey-specific consumer groups
    this.journeyConsumerGroups = {
      health: kafkaConfig?.consumerGroups?.health || `${kafkaConfig?.groupId || 'gamification-consumer-group'}-health`,
      care: kafkaConfig?.consumerGroups?.care || `${kafkaConfig?.groupId || 'gamification-consumer-group'}-care`,
      plan: kafkaConfig?.consumerGroups?.plan || `${kafkaConfig?.groupId || 'gamification-consumer-group'}-plan`,
      default: kafkaConfig?.groupId || 'gamification-consumer-group'
    };
    
    this.logger.log('KafkaConsumer initialized with retry policy and DLQ configuration', {
      retryPolicy: this.retryPolicy,
      dlqEnabled: this.dlqEnabled,
      journeyConsumerGroups: this.journeyConsumerGroups
    }, 'KafkaConsumer');
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * Sets up consumers for all journey event topics with journey-specific consumer groups.
   */
  async onModuleInit(): Promise<void> {
    const kafkaConfig = this.configService.get('gamificationEngine.kafka');
    
    if (!kafkaConfig) {
      this.logger.warn('Kafka configuration not found, using default values', 'KafkaConsumer');
    }
    
    const topics = kafkaConfig?.topics || {};
    
    // Filter out undefined or empty topics
    const validTopics = Object.entries(topics)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({ key, value: value as string }));
    
    if (validTopics.length === 0) {
      this.logger.warn('No Kafka topics configured, skipping consumer initialization', 'KafkaConsumer');
      return;
    }
    
    for (const { key, value: topic } of validTopics) {
      // Determine the appropriate consumer group based on the topic key
      const journeyType = this.getJourneyTypeFromTopicKey(key);
      const consumerGroup = this.journeyConsumerGroups[journeyType] || this.journeyConsumerGroups.default;
      
      try {
        await this.kafkaService.consume(
          topic,
          consumerGroup,
          async (message: any, key?: string, headers?: Record<string, string>) => {
            // Generate or extract correlation ID for tracing
            const correlationId = headers?.correlationId || uuidv4();
            
            await this.processMessage(message, {
              correlationId,
              topic,
              journeyType,
              messageKey: key
            });
          }
        );
        
        this.logger.log(`Subscribed to Kafka topic: ${topic} with consumer group: ${consumerGroup}`, {
          topic,
          consumerGroup,
          journeyType
        }, 'KafkaConsumer');
      } catch (error) {
        this.logger.error(
          `Failed to subscribe to Kafka topic: ${topic}`,
          error instanceof Error ? error.stack : String(error),
          'KafkaConsumer',
          { topic, consumerGroup, journeyType }
        );
      }
    }
  }

  /**
   * Determines the journey type from the topic key.
   * 
   * @param topicKey The configuration key for the topic
   * @returns The journey type (health, care, plan) or 'default'
   */
  private getJourneyTypeFromTopicKey(topicKey: string): string {
    if (topicKey.toLowerCase().includes('health')) return 'health';
    if (topicKey.toLowerCase().includes('care')) return 'care';
    if (topicKey.toLowerCase().includes('plan')) return 'plan';
    return 'default';
  }

  /**
   * Processes a message from a Kafka topic with retry logic and dead-letter queue handling.
   * 
   * @param message The message to process
   * @param context Additional context for processing and logging
   */
  private async processMessage(
    message: any,
    context: { correlationId: string; topic: string; journeyType: string; messageKey?: string }
  ): Promise<void> {
    const { correlationId, topic, journeyType, messageKey } = context;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Validate message format before processing
    try {
      this.validateMessage(message);
    } catch (error) {
      // Log invalid message format and send to DLQ if enabled
      this.logger.error(
        `Invalid event format: ${JSON.stringify(message)}`,
        error instanceof Error ? error.stack : String(error),
        'KafkaConsumer',
        { correlationId, topic, journeyType, messageKey }
      );
      
      if (this.dlqEnabled) {
        await this.sendToDLQ(message, context, error as Error);
      }
      
      return;
    }
    
    // Convert plain object to class instance for type safety
    const eventData = plainToInstance(ProcessEventDto, message);
    
    // Add journey type if not present
    if (!eventData.journey && journeyType !== 'default') {
      eventData.journey = journeyType;
    }
    
    // Log the start of processing with correlation ID
    this.logger.log(
      `Processing event: ${eventData.type} for user: ${eventData.userId} from journey: ${eventData.journey || journeyType || 'unknown'}`,
      { correlationId, eventType: eventData.type, userId: eventData.userId, journey: eventData.journey || journeyType },
      'KafkaConsumer'
    );
    
    // Implement retry with exponential backoff
    while (retryCount <= this.retryPolicy.maxRetries) {
      try {
        // Process the event
        const result = await this.eventsService.processEvent(eventData);
        
        // Log successful processing
        this.logger.log(
          `Event processed successfully: ${eventData.type}, points earned: ${result.points || 0}`,
          { 
            correlationId, 
            eventType: eventData.type, 
            userId: eventData.userId, 
            journey: eventData.journey || journeyType,
            points: result.points || 0,
            achievements: result.achievements?.length || 0
          },
          'KafkaConsumer'
        );
        
        return; // Success, exit the retry loop
      } catch (error) {
        lastError = error as Error;
        
        // Determine if the error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || retryCount >= this.retryPolicy.maxRetries) {
          // Log final failure
          this.logger.error(
            `Failed to process event after ${retryCount} retries: ${eventData.type}`,
            error instanceof Error ? error.stack : String(error),
            'KafkaConsumer',
            { 
              correlationId, 
              eventType: eventData.type, 
              userId: eventData.userId, 
              journey: eventData.journey || journeyType,
              retryCount,
              isRetryable
            }
          );
          
          // Send to DLQ if enabled
          if (this.dlqEnabled) {
            await this.sendToDLQ(message, context, error as Error);
          }
          
          break; // Exit the retry loop
        }
        
        // Calculate backoff delay with exponential strategy
        const delay = Math.min(
          this.retryPolicy.initialDelay * Math.pow(this.retryPolicy.backoffFactor, retryCount),
          this.retryPolicy.maxDelay
        );
        
        // Log retry attempt
        this.logger.warn(
          `Retrying event processing (${retryCount + 1}/${this.retryPolicy.maxRetries + 1}): ${eventData.type} after ${delay}ms`,
          { 
            correlationId, 
            eventType: eventData.type, 
            userId: eventData.userId, 
            journey: eventData.journey || journeyType,
            retryCount: retryCount + 1,
            delay,
            error: error instanceof Error ? error.message : String(error)
          },
          'KafkaConsumer'
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }
    
    // If we reach here, all retries have failed
    if (lastError) {
      // Final error logging is already done in the loop
    }
  }

  /**
   * Validates that the message has the required structure.
   * 
   * @param message The message to validate
   * @throws Error if the message is invalid
   */
  private validateMessage(message: any): void {
    // Basic structure validation
    if (!message || typeof message !== 'object') {
      throw new ExternalResponseFormatError('Message is not an object');
    }
    
    // Required fields validation
    if (!message.type || !message.userId || !message.data) {
      throw new ExternalResponseFormatError(
        `Message missing required fields: ${!message.type ? 'type' : ''} ${!message.userId ? 'userId' : ''} ${!message.data ? 'data' : ''}`.trim()
      );
    }
    
    // Use class-validator for more detailed validation
    const eventData = plainToInstance(ProcessEventDto, message);
    const errors = validateSync(eventData);
    
    if (errors.length > 0) {
      const validationErrors = errors.map(error => {
        return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
      }).join('; ');
      
      throw new ExternalResponseFormatError(`Validation failed: ${validationErrors}`);
    }
  }

  /**
   * Determines if an error is retryable based on its type and characteristics.
   * 
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: unknown): boolean {
    // Network and external dependency errors are typically retryable
    if (error instanceof ExternalDependencyUnavailableError) {
      return true;
    }
    
    // Format errors are not retryable as they indicate a structural problem
    if (error instanceof ExternalResponseFormatError) {
      return false;
    }
    
    // For other errors, check if they have a retryable property or are transient
    if (error instanceof Error) {
      // @ts-ignore - Check for custom retryable property
      if (typeof error.retryable === 'boolean') {
        // @ts-ignore
        return error.retryable;
      }
      
      // Check for common transient error messages
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('temporarily unavailable')
      );
    }
    
    // By default, don't retry unknown error types
    return false;
  }

  /**
   * Sends a failed message to the dead-letter queue.
   * 
   * @param message The original message
   * @param context The processing context
   * @param error The error that caused the failure
   */
  private async sendToDLQ(
    message: any,
    context: { correlationId: string; topic: string; journeyType: string; messageKey?: string },
    error: Error
  ): Promise<void> {
    try {
      const { correlationId, topic, journeyType, messageKey } = context;
      const dlqTopic = `${topic}.dlq`;
      
      // Prepare the DLQ message with error context
      const dlqMessage = {
        originalMessage: message,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        metadata: {
          correlationId,
          originalTopic: topic,
          journeyType,
          timestamp: new Date().toISOString(),
          processingAttempts: this.retryPolicy.maxRetries + 1
        }
      };
      
      // Send to DLQ topic
      await this.kafkaService.produce(
        dlqTopic,
        dlqMessage,
        messageKey || `dlq-${uuidv4()}`,
        { correlationId }
      );
      
      this.logger.log(
        `Message sent to DLQ: ${dlqTopic}`,
        { correlationId, originalTopic: topic, dlqTopic, journeyType },
        'KafkaConsumer'
      );
    } catch (dlqError) {
      // Log DLQ failure but don't throw to prevent cascading failures
      this.logger.error(
        `Failed to send message to DLQ: ${dlqError instanceof Error ? dlqError.message : String(dlqError)}`,
        dlqError instanceof Error ? dlqError.stack : undefined,
        'KafkaConsumer',
        { correlationId: context.correlationId, topic: context.topic }
      );
    }
  }
}