import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsService } from '../events.service';
import { RulesService } from '../../rules/rules.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { KafkaService } from '@app/shared/kafka/kafka.service'; // @app/shared ^1.0.0
import { LoggerService } from '@app/shared/logging/logger.service'; // @app/shared ^1.0.0
import { gamificationEngine } from '../../config/configuration';
import { ProcessEventDto } from '../dto/process-event.dto';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { EventRetryableException } from '../exceptions/event-retryable.exception';

/**
 * Consumes events from Kafka topics and processes them.
 * This consumer is responsible for handling events from all journeys (Health, Care, Plan)
 * and forwarding them to the EventsService for gamification processing.
 * 
 * Implements robust error handling with retry mechanisms and dead-letter queues for failed events.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly maxRetries: number;
  
  /**
   * Injects the necessary services.
   * 
   * @param eventsService Service for processing gamification events
   * @param rulesService Service for evaluating gamification rules
   * @param profilesService Service for managing user game profiles
   * @param kafkaService Service for Kafka interaction
   * @param logger Service for logging
   * @param dlqService Service for handling dead-letter queue entries
   * @param configService Service for accessing configuration
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly rulesService: RulesService,
    private readonly profilesService: ProfilesService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly dlqService: DeadLetterQueueService,
    private readonly configService: ConfigService
  ) {
    this.logger.log('KafkaConsumer initialized', 'KafkaConsumer');
    this.maxRetries = this.configService.get<number>(
      'gamificationEngine.kafka.retryPolicy.maxRetries',
      5
    );
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * This sets up consumers for all journey event topics defined in the configuration.
   */
  async onModuleInit(): Promise<void> {
    const kafkaConfig = gamificationEngine().kafka;
    const topics = Object.values(kafkaConfig.topics);
    
    for (const topic of topics) {
      await this.kafkaService.consume(
        topic,
        kafkaConfig.groupId,
        async (message: any, key?: string, headers?: Record<string, string>) => {
          // Extract retry count from headers if available
          const retryCount = headers?.['retry-count'] 
            ? parseInt(headers['retry-count'], 10) 
            : 0;
            
          await this.processMessage(message, retryCount, headers);
        }
      );
      
      this.logger.log(`Subscribed to Kafka topic: ${topic}`, 'KafkaConsumer');
    }
  }

  /**
   * Processes a message from a Kafka topic.
   * Validates the message format and forwards it to the EventsService for processing.
   * Implements retry logic and dead-letter queue handling for failed events.
   * 
   * @param message The message to process
   * @param retryCount Current retry attempt count
   * @param headers Kafka message headers
   */
  private async processMessage(
    message: any, 
    retryCount = 0,
    headers?: Record<string, string>
  ): Promise<void> {
    try {
      // Validate the message has the required ProcessEventDto structure
      if (!message || typeof message !== 'object' || !message.type || !message.userId || !message.data) {
        this.logger.error(`Invalid event format: ${JSON.stringify(message)}`, 'KafkaConsumer');
        return;
      }

      const eventData = message as ProcessEventDto;
      
      this.logger.log(
        `Processing event: ${eventData.type} for user: ${eventData.userId} from journey: ${eventData.journey || 'unknown'}`,
        { retryCount, eventId: eventData.id },
        'KafkaConsumer'
      );
      
      const result = await this.eventsService.processEvent(eventData);
      
      this.logger.log(
        `Event processed successfully: ${eventData.type}, points earned: ${result.points || 0}`,
        { eventId: eventData.id, userId: eventData.userId },
        'KafkaConsumer'
      );
    } catch (error) {
      // Handle the error with retry logic or send to DLQ
      await this.handleProcessingError(message, error, retryCount, headers);
    }
  }

  /**
   * Handles errors that occur during event processing.
   * Implements retry logic with exponential backoff for retryable errors,
   * and sends non-retryable errors or exhausted retries to the dead-letter queue.
   * 
   * @param message The original message that failed processing
   * @param error The error that occurred
   * @param retryCount Current retry attempt count
   * @param headers Kafka message headers
   */
  private async handleProcessingError(
    message: any,
    error: any,
    retryCount: number,
    headers?: Record<string, string>
  ): Promise<void> {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    // Log the error with context
    this.logger.error(
      `Error processing Kafka message: ${errorInstance.message}`,
      {
        stack: errorInstance.stack,
        eventType: message?.type,
        userId: message?.userId,
        retryCount,
      },
      'KafkaConsumer'
    );
    
    // Check if the error is retryable and hasn't exceeded max retries
    const isRetryable = error instanceof EventRetryableException || 
      this.isTransientError(errorInstance);
    
    if (isRetryable && retryCount < this.maxRetries) {
      // Calculate backoff delay using exponential backoff
      const initialDelay = this.configService.get<number>(
        'gamificationEngine.kafka.retryPolicy.initialDelayMs',
        100
      );
      const backoffFactor = this.configService.get<number>(
        'gamificationEngine.kafka.retryPolicy.backoffFactor',
        1.5
      );
      const maxDelay = this.configService.get<number>(
        'gamificationEngine.kafka.retryPolicy.maxDelayMs',
        10000
      );
      
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, retryCount),
        maxDelay
      );
      
      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);
      
      // Log retry attempt
      this.logger.log(
        `Retrying event processing (attempt ${retryCount + 1}/${this.maxRetries}) after ${Math.round(jitteredDelay)}ms`,
        {
          eventType: message?.type,
          userId: message?.userId,
          retryCount,
          delay: Math.round(jitteredDelay),
        },
        'KafkaConsumer'
      );
      
      // Determine the original topic for retry
      const journeyType = message?.journey?.toLowerCase() || 
        this.getJourneyFromEventType(message?.type);
      const topic = `${journeyType}.events`;
      
      // Set up retry headers
      const retryHeaders = {
        ...headers,
        'retry-count': (retryCount + 1).toString(),
        'original-timestamp': headers?.['original-timestamp'] || new Date().toISOString(),
        'last-retry-timestamp': new Date().toISOString(),
      };
      
      // Schedule retry after delay
      setTimeout(async () => {
        try {
          await this.kafkaService.produce({
            topic,
            messages: [
              {
                key: message.id,
                value: JSON.stringify(message),
                headers: retryHeaders,
              },
            ],
          });
        } catch (retryError) {
          this.logger.error(
            `Failed to schedule retry for event: ${retryError.message}`,
            {
              originalError: errorInstance.message,
              retryError: retryError.message,
              eventType: message?.type,
              userId: message?.userId,
              retryCount,
            },
            'KafkaConsumer'
          );
          
          // If retry scheduling fails, send to DLQ
          await this.dlqService.addToDlq(
            message,
            errorInstance,
            retryCount,
            { retryError: retryError.message }
          );
        }
      }, jitteredDelay);
    } else {
      // Max retries exceeded or non-retryable error, send to DLQ
      this.logger.warn(
        `Sending event to DLQ: ${isRetryable ? 'Max retries exceeded' : 'Non-retryable error'}`,
        {
          eventType: message?.type,
          userId: message?.userId,
          retryCount,
          error: errorInstance.message,
        },
        'KafkaConsumer'
      );
      
      await this.dlqService.addToDlq(
        message,
        errorInstance,
        retryCount,
        {
          maxRetriesExceeded: isRetryable && retryCount >= this.maxRetries,
          nonRetryableError: !isRetryable,
          originalHeaders: headers,
        }
      );
    }
  }

  /**
   * Determines if an error is transient and should be retried.
   * Transient errors include network issues, timeouts, and temporary service unavailability.
   * 
   * @param error The error to check
   * @returns True if the error is transient and should be retried
   */
  private isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Check for common transient error patterns
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('temporarily unavailable') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('socket hang up') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('server busy') ||
      message.includes('database connection') ||
      message.includes('deadlock')
    );
  }

  /**
   * Extracts the journey type from an event type string.
   * Used for determining the appropriate Kafka topic for retries.
   * 
   * @param eventType The event type string
   * @returns The journey type (health, care, plan) or 'health' as default
   */
  private getJourneyFromEventType(eventType?: string): string {
    if (!eventType) return 'health';
    
    const lowerEventType = eventType.toLowerCase();
    
    if (lowerEventType.startsWith('health_')) return 'health';
    if (lowerEventType.startsWith('care_')) return 'care';
    if (lowerEventType.startsWith('plan_')) return 'plan';
    
    return 'health'; // Default to health journey
  }
}