import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { RulesService } from '../../rules/rules.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from '../../kafka/kafka.service';
import { KafkaRetryService } from '../../kafka/kafka.retry.service';
import { ProcessEventDto } from '../dto/process-event.dto';
import { KafkaModuleOptions } from '../../kafka.module';

/**
 * Consumes events from Kafka topics and processes them.
 * This consumer is responsible for handling events from all journeys (Health, Care, Plan)
 * and forwarding them to the EventsService for gamification processing.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  /**
   * Injects the necessary services.
   * 
   * @param eventsService Service for processing gamification events
   * @param rulesService Service for evaluating gamification rules
   * @param profilesService Service for managing user game profiles
   * @param kafkaService Service for Kafka interaction
   * @param kafkaRetryService Service for handling retry logic
   * @param logger Service for logging
   * @param options Kafka module options
   */
  constructor(
    private readonly eventsService: EventsService,
    private readonly rulesService: RulesService,
    private readonly profilesService: ProfilesService,
    private readonly kafkaService: KafkaService,
    private readonly kafkaRetryService: KafkaRetryService,
    private readonly logger: LoggerService,
    private readonly options: KafkaModuleOptions,
  ) {
    this.logger.log('KafkaConsumer initialized', 'KafkaConsumer');
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * This sets up consumers for all journey event topics defined in the configuration.
   */
  async onModuleInit(): Promise<void> {
    const topics = this.options.topics || {
      healthEvents: 'health.events',
      careEvents: 'care.events',
      planEvents: 'plan.events',
      userEvents: 'user.events',
      gameEvents: 'game.events',
    };
    
    const groupId = this.options.groupId || 'gamification-consumer-group';
    
    for (const [key, topic] of Object.entries(topics)) {
      if (!topic) {
        this.logger.warn(`Topic for ${key} is not defined, skipping subscription`, 'KafkaConsumer');
        continue;
      }
      
      try {
        await this.kafkaService.consume(
          topic,
          groupId,
          async (message: any, key?: string, headers?: Record<string, string>) => {
            await this.processMessage(message, topic, key, headers);
          },
        );
        
        this.logger.log(`Subscribed to Kafka topic: ${topic}`, 'KafkaConsumer');
      } catch (error) {
        this.logger.error(
          `Failed to subscribe to Kafka topic ${topic}: ${error.message}`,
          error.stack,
          'KafkaConsumer',
        );
      }
    }
  }

  /**
   * Processes a message from a Kafka topic.
   * Validates the message format and forwards it to the EventsService for processing.
   * 
   * @param message The message to process
   * @param topic The topic the message was received from
   * @param key The message key
   * @param headers The message headers
   */
  private async processMessage(
    message: any,
    topic: string,
    key?: string,
    headers?: Record<string, string>,
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Emit metric for monitoring
      process.emit('kafka:message:received', { topic, startTime });
      
      // Validate the message has the required ProcessEventDto structure
      if (!this.isValidEvent(message)) {
        this.logger.error(
          `Invalid event format from topic ${topic}: ${JSON.stringify(message)}`,
          '',
          'KafkaConsumer',
        );
        return;
      }

      const eventData = message as ProcessEventDto;
      
      // Add timestamp if not present
      if (!eventData.timestamp) {
        eventData.timestamp = new Date();
      }
      
      // Add journey if not present
      if (!eventData.journey) {
        // Extract journey from topic name (e.g., 'health.events' -> 'health')
        const journeyMatch = topic.match(/^([^.]+)\..+$/);
        eventData.journey = journeyMatch ? journeyMatch[1] : 'unknown';
      }
      
      this.logger.log(
        `Processing event: ${eventData.type} for user: ${eventData.userId} from journey: ${eventData.journey}`,
        'KafkaConsumer',
      );
      
      const result = await this.eventsService.processEvent(eventData);
      
      // Record processing time for metrics
      const processingTime = Date.now() - startTime;
      process.emit('kafka:message:processed', { topic, processingTimeMs: processingTime });
      
      this.logger.log(
        `Event processed successfully: ${eventData.type}, points earned: ${result.points || 0}`,
        'KafkaConsumer',
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Emit metric for monitoring
      process.emit('kafka:message:failed', { topic, error });
      
      this.logger.error(
        `Error processing Kafka message from topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaConsumer',
      );
      
      // Schedule retry if appropriate
      if (this.shouldRetry(error)) {
        this.logger.log(
          `Scheduling retry for message from topic ${topic}`,
          'KafkaConsumer',
        );
        
        this.kafkaRetryService.scheduleRetry(topic, message, error, key, headers);
      }
    }
  }

  /**
   * Validates that a message has the required structure for a ProcessEventDto
   * 
   * @param message The message to validate
   * @returns Whether the message is valid
   */
  private isValidEvent(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.userId === 'string' &&
      typeof message.data === 'object' &&
      message.data !== null
    );
  }

  /**
   * Determines whether an error should trigger a retry
   * 
   * @param error The error to check
   * @returns Whether the error should trigger a retry
   */
  private shouldRetry(error: Error): boolean {
    // Don't retry client errors (4xx)
    if (error.name === 'BadRequestException' || error.name === 'ValidationException') {
      return false;
    }
    
    // Don't retry if the error explicitly says not to
    if (error['noRetry'] === true) {
      return false;
    }
    
    // Retry server errors (5xx) and network errors
    return true;
  }
}