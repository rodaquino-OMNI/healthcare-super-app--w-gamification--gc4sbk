import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaProducer as BaseKafkaProducer, KafkaError } from '@austa/events/kafka';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';
import { validateOrReject } from 'class-validator';
import {
  INotificationEvent,
  INotificationStatusEvent,
  NotificationEventType,
  NotificationStatus,
  INotificationEventResponse,
  IRetryableOperation,
  IJourneyContext,
} from '../interfaces';
import { BaseNotificationEventDto } from '../dto/base-notification-event.dto';
import { NotificationDeliveryStatusDto } from '../dto/notification-delivery-status.dto';
import { ProcessNotificationEventDto } from '../dto/process-notification-event.dto';
import { NotificationEventVersioningDto } from '../dto/notification-event-versioning.dto';
import { NotificationEventResponseDto } from '../dto/notification-event-response.dto';

/**
 * Service responsible for publishing notification delivery status events to Kafka topics.
 * 
 * This service provides:
 * - Type-safe notification status event schema validation
 * - Consistent error handling and logging for producer operations
 * - Automatic retry mechanism for failed publish operations
 * - Distributed tracing with span context propagation
 * - Event batching for improved performance under high load
 * - Methods for both synchronous and asynchronous event publication
 * - Dead letter queue integration for persistently failing events
 * - Journey-specific context propagation
 */
@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  // Topic configuration
  private readonly NOTIFICATION_STATUS_TOPIC: string;
  private readonly NOTIFICATION_EVENTS_TOPIC: string;
  private readonly JOURNEY_TOPICS: Record<string, string>;
  
  // Service identification
  private readonly SERVICE_NAME = 'notification-service';
  
  // Batching configuration
  private readonly MAX_BATCH_SIZE: number;
  private readonly BATCH_WINDOW_MS: number; // Window for batching in milliseconds
  
  // Event versioning
  private readonly CURRENT_EVENT_VERSION = '1.0';
  
  // Error classification
  private readonly RETRIABLE_ERROR_TYPES = [
    'BROKER_NOT_AVAILABLE',
    'NETWORK_ERROR',
    'LEADER_NOT_AVAILABLE',
    'REQUEST_TIMED_OUT',
    'UNKNOWN_TOPIC_OR_PARTITION',
  ];
  
  private eventBatch: INotificationStatusEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly kafkaProducer: BaseKafkaProducer,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
  ) {
    this.logger.setContext('KafkaProducer');
    
    // Initialize configuration from environment variables
    this.NOTIFICATION_STATUS_TOPIC = this.configService.get<string>(
      'KAFKA_NOTIFICATION_STATUS_TOPIC',
      'notification.status'
    );
    
    this.NOTIFICATION_EVENTS_TOPIC = this.configService.get<string>(
      'KAFKA_NOTIFICATION_EVENTS_TOPIC',
      'notification.events'
    );
    
    // Journey-specific topics for targeted event publishing
    this.JOURNEY_TOPICS = {
      health: this.configService.get<string>('KAFKA_HEALTH_JOURNEY_TOPIC', 'health.notifications'),
      care: this.configService.get<string>('KAFKA_CARE_JOURNEY_TOPIC', 'care.notifications'),
      plan: this.configService.get<string>('KAFKA_PLAN_JOURNEY_TOPIC', 'plan.notifications'),
      game: this.configService.get<string>('KAFKA_GAMIFICATION_TOPIC', 'gamification.events'),
    };
    
    // Batching configuration
    this.MAX_BATCH_SIZE = this.configService.get<number>('KAFKA_MAX_BATCH_SIZE', 100);
    this.BATCH_WINDOW_MS = this.configService.get<number>('KAFKA_BATCH_WINDOW_MS', 100);
    
    this.logger.debug('KafkaProducer initialized with configuration', {
      statusTopic: this.NOTIFICATION_STATUS_TOPIC,
      eventsTopic: this.NOTIFICATION_EVENTS_TOPIC,
      journeyTopics: this.JOURNEY_TOPICS,
      batchSize: this.MAX_BATCH_SIZE,
      batchWindow: this.BATCH_WINDOW_MS,
    });
  }

  /**
   * Initializes the Kafka producer when the module is initialized.
   * Establishes connection to Kafka brokers and sets up health check.
   */
  async onModuleInit(): Promise<void> {
    try {
      const span = this.tracingService.startSpan('KafkaProducer.connect');
      
      try {
        await this.kafkaProducer.connect();
        this.logger.log('Kafka producer connected successfully');
        
        // Verify topics exist or can be created
        await this.verifyTopics();
      } catch (error) {
        this.tracingService.setSpanError(span, error);
        this.logger.error('Failed to connect Kafka producer', error);
        // We don't throw here to allow the service to start even if Kafka is temporarily unavailable
        // The retry mechanism will handle reconnection attempts
      } finally {
        this.tracingService.endSpan(span);
      }
      
      // Start the health check interval
      this.startHealthCheck();
    } catch (error) {
      this.logger.error('Error during KafkaProducer initialization', error);
    }
  }
  
  /**
   * Cleans up resources when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // Clear any pending batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      
      // Publish any remaining events in the batch
      if (this.eventBatch.length > 0) {
        await this.publishBatchEvents();
      }
      
      // Disconnect the Kafka producer
      await this.kafkaProducer.disconnect();
      this.logger.log('Kafka producer disconnected successfully');
    } catch (error) {
      this.logger.error('Error during KafkaProducer cleanup', error);
    }
  }
  
  /**
   * Verifies that required Kafka topics exist or can be created.
   * @private
   */
  private async verifyTopics(): Promise<void> {
    try {
      const requiredTopics = [
        this.NOTIFICATION_STATUS_TOPIC,
        this.NOTIFICATION_EVENTS_TOPIC,
        ...Object.values(this.JOURNEY_TOPICS),
      ];
      
      for (const topic of requiredTopics) {
        try {
          await this.kafkaProducer.verifyTopic(topic);
          this.logger.debug(`Verified Kafka topic exists: ${topic}`);
        } catch (error) {
          this.logger.warn(`Could not verify Kafka topic: ${topic}`, error);
          // Continue with other topics - we don't want to fail initialization
          // if a single topic verification fails
        }
      }
    } catch (error) {
      this.logger.error('Failed to verify Kafka topics', error);
    }
  }
  
  /**
   * Starts a periodic health check for the Kafka connection.
   * @private
   */
  private startHealthCheck(): void {
    // Check connection health every 30 seconds
    setInterval(async () => {
      try {
        const isConnected = await this.kafkaProducer.isConnected();
        if (!isConnected) {
          this.logger.warn('Kafka producer connection lost, attempting to reconnect');
          try {
            await this.kafkaProducer.connect();
            this.logger.log('Kafka producer reconnected successfully');
          } catch (reconnectError) {
            this.logger.error('Failed to reconnect Kafka producer', reconnectError);
          }
        }
      } catch (error) {
        this.logger.error('Error checking Kafka producer connection health', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Publishes a notification status event to Kafka synchronously.
   * 
   * @param notificationId - The ID of the notification
   * @param userId - The ID of the user who received the notification
   * @param status - The delivery status of the notification
   * @param channel - The channel through which the notification was sent
   * @param metadata - Additional metadata about the notification
   * @param journeyContext - Optional journey context for journey-specific routing
   * @returns Promise that resolves when the event is published
   */
  async publishNotificationStatus(
    notificationId: string | number,
    userId: string,
    status: NotificationStatus,
    channel: string,
    metadata: Record<string, any> = {},
    journeyContext?: IJourneyContext,
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('publishNotificationStatus');
    
    try {
      // Create and validate the event
      const event = this.createNotificationStatusEvent(
        notificationId,
        userId,
        status,
        channel,
        metadata,
        journeyContext,
      );
      
      // Create a DTO for validation
      const statusDto = new NotificationDeliveryStatusDto();
      Object.assign(statusDto, event.payload);
      
      // Validate the event payload
      try {
        await validateOrReject(statusDto);
      } catch (validationError) {
        this.logger.error(
          `Invalid notification status event payload: ${notificationId}`,
          validationError,
          { notificationId, userId, status, channel },
        );
        
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification status event payload',
            details: validationError,
          },
          metadata: {
            notificationId: notificationId.toString(),
            userId,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Set span attributes for tracing
      this.tracingService.setSpanAttributes(span, {
        'notification.id': notificationId.toString(),
        'notification.user_id': userId,
        'notification.status': status,
        'notification.channel': channel,
        'notification.journey': journeyContext?.journey || 'unknown',
      });

      // Determine the appropriate topic based on journey context
      const topic = journeyContext && this.JOURNEY_TOPICS[journeyContext.journey]
        ? this.JOURNEY_TOPICS[journeyContext.journey]
        : this.NOTIFICATION_STATUS_TOPIC;

      // Publish the event to Kafka
      await this.kafkaProducer.produce(
        topic,
        event,
        userId, // Use userId as key for consistent partitioning
        {
          headers: {
            ...this.tracingService.getTraceHeaders(span),
            'content-type': 'application/json',
            'event-type': NotificationEventType.STATUS_UPDATE,
            'event-version': this.CURRENT_EVENT_VERSION,
            'source-service': this.SERVICE_NAME,
          },
        },
      );

      this.logger.debug(
        `Published notification status event: ${notificationId} - ${status}`,
        { notificationId, userId, status, channel, topic },
      );
      
      return {
        success: true,
        metadata: {
          notificationId: notificationId.toString(),
          userId,
          timestamp: new Date().toISOString(),
          topic,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to publish notification status event: ${notificationId} - ${status}`,
        error,
        { notificationId, userId, status, channel },
      );

      // Schedule retry with exponential backoff for retriable errors
      if (this.isRetriableError(error)) {
        this.scheduleRetry(
          'publishNotificationStatus',
          [notificationId, userId, status, channel, metadata, journeyContext],
          error,
        );
      } else {
        // For non-retriable errors, send to DLQ immediately
        await this.sendToDlq(
          'publishNotificationStatus',
          [notificationId, userId, status, channel, metadata, journeyContext],
          error,
        );
      }

      this.tracingService.setSpanError(span, error);
      
      return {
        success: false,
        error: {
          code: error instanceof KafkaError ? error.code : 'UNKNOWN_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          notificationId: notificationId.toString(),
          userId,
          timestamp: new Date().toISOString(),
        },
      };
    } finally {
      this.tracingService.endSpan(span);
    }
  }

  /**
   * Publishes a notification status event to Kafka asynchronously.
   * The method returns immediately and handles the publishing in the background.
   * 
   * @param notificationId - The ID of the notification
   * @param userId - The ID of the user who received the notification
   * @param status - The delivery status of the notification
   * @param channel - The channel through which the notification was sent
   * @param metadata - Additional metadata about the notification
   * @param journeyContext - Optional journey context for journey-specific routing
   */
  publishNotificationStatusAsync(
    notificationId: string | number,
    userId: string,
    status: NotificationStatus,
    channel: string,
    metadata: Record<string, any> = {},
    journeyContext?: IJourneyContext,
  ): void {
    try {
      // Create the event
      const event = this.createNotificationStatusEvent(
        notificationId,
        userId,
        status,
        channel,
        metadata,
        journeyContext,
      );
      
      // Create a DTO for validation
      const statusDto = new NotificationDeliveryStatusDto();
      Object.assign(statusDto, event.payload);
      
      // Validate the event payload (synchronously to avoid blocking)
      try {
        // Use synchronous validation for async publishing
        const errors = statusDto.validate();
        if (errors && errors.length > 0) {
          this.logger.error(
            `Invalid notification status event payload for async publishing: ${notificationId}`,
            errors,
            { notificationId, userId, status, channel },
          );
          return; // Skip invalid events
        }
      } catch (validationError) {
        this.logger.error(
          `Error validating notification status event for async publishing: ${notificationId}`,
          validationError,
          { notificationId, userId, status, channel },
        );
        return; // Skip invalid events
      }

      // Add to batch for efficient publishing
      this.addToBatch(event, userId, journeyContext);
      
      this.logger.debug(
        `Queued notification status event for batch publishing: ${notificationId} - ${status}`,
        { notificationId, userId, status, channel, journey: journeyContext?.journey },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue notification status event: ${notificationId} - ${status}`,
        error,
        { notificationId, userId, status, channel },
      );
    }
  }

  /**
   * Publishes a generic notification event to Kafka.
   * 
   * @param event - The notification event to publish
   * @param key - Optional key for partitioning
   * @param journeyContext - Optional journey context for journey-specific routing
   * @returns Promise that resolves with the event response
   */
  async publishEvent<T extends BaseNotificationEventDto>(
    event: T,
    key?: string,
    journeyContext?: IJourneyContext,
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('publishEvent');
    
    try {
      // Validate the event
      try {
        await validateOrReject(event);
      } catch (validationError) {
        this.logger.error(
          `Invalid notification event: ${event.type}`,
          validationError,
          { eventType: event.type, userId: event.userId },
        );
        
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification event',
            details: validationError,
          },
          metadata: {
            eventType: event.type,
            userId: event.userId,
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // Apply versioning
      const versionedEvent = this.applyVersioning(event);
      
      // Set span attributes for tracing
      this.tracingService.setSpanAttributes(span, {
        'event.type': versionedEvent.type,
        'event.user_id': versionedEvent.userId,
        'event.version': versionedEvent.version,
        'event.journey': journeyContext?.journey || 'unknown',
      });

      // Determine the appropriate topic based on journey context
      const topic = journeyContext && this.JOURNEY_TOPICS[journeyContext.journey]
        ? this.JOURNEY_TOPICS[journeyContext.journey]
        : this.NOTIFICATION_EVENTS_TOPIC;

      // Publish the event to Kafka
      await this.kafkaProducer.produce(
        topic,
        versionedEvent,
        key || versionedEvent.userId,
        {
          headers: {
            ...this.tracingService.getTraceHeaders(span),
            'content-type': 'application/json',
            'event-type': versionedEvent.type,
            'event-version': versionedEvent.version,
            'source-service': this.SERVICE_NAME,
          },
        },
      );

      this.logger.debug(
        `Published notification event: ${versionedEvent.type}`,
        { eventType: versionedEvent.type, userId: versionedEvent.userId, topic },
      );
      
      return {
        success: true,
        metadata: {
          eventType: versionedEvent.type,
          userId: versionedEvent.userId,
          timestamp: new Date().toISOString(),
          topic,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to publish notification event: ${event.type}`,
        error,
        { eventType: event.type, userId: event.userId },
      );

      // Schedule retry with exponential backoff for retriable errors
      if (this.isRetriableError(error)) {
        this.scheduleRetry('publishEvent', [event, key, journeyContext], error);
      } else {
        // For non-retriable errors, send to DLQ immediately
        await this.sendToDlq('publishEvent', [event, key, journeyContext], error);
      }

      this.tracingService.setSpanError(span, error);
      
      return {
        success: false,
        error: {
          code: error instanceof KafkaError ? error.code : 'UNKNOWN_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          eventType: event.type,
          userId: event.userId,
          timestamp: new Date().toISOString(),
        },
      };
    } finally {
      this.tracingService.endSpan(span);
    }
  }
  
  /**
   * Applies versioning to an event, ensuring it has the correct version and format.
   * 
   * @param event - The event to version
   * @returns The versioned event
   * @private
   */
  private applyVersioning<T extends BaseNotificationEventDto>(event: T): T {
    // If the event already has a version, use it
    if (event.version) {
      return event;
    }
    
    // Create a versioning DTO to handle version transformation
    const versioningDto = new NotificationEventVersioningDto();
    
    // Apply the current version
    return {
      ...event,
      version: this.CURRENT_EVENT_VERSION,
    };
  }

  /**
   * Publishes a batch of notification events to Kafka.
   * 
   * @param events - Array of notification events to publish
   * @param journeyContext - Optional journey context for journey-specific routing
   * @returns Promise that resolves with the batch response
   */
  async publishBatch<T extends BaseNotificationEventDto>(
    events: T[],
    journeyContext?: IJourneyContext,
  ): Promise<INotificationEventResponse> {
    if (events.length === 0) {
      return {
        success: true,
        metadata: {
          batchSize: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const span = this.tracingService.startSpan('publishBatch');
    
    try {
      // Validate all events in the batch
      const validEvents: T[] = [];
      const invalidEvents: { event: T; errors: any }[] = [];
      
      for (const event of events) {
        try {
          await validateOrReject(event);
          validEvents.push(event);
        } catch (validationError) {
          invalidEvents.push({ event, errors: validationError });
          this.logger.warn(
            `Skipping invalid event in batch: ${event.type}`,
            { eventType: event.type, userId: event.userId, errors: validationError },
          );
        }
      }
      
      if (validEvents.length === 0) {
        this.logger.error('No valid events in batch to publish', {
          totalEvents: events.length,
          invalidEvents: invalidEvents.length,
        });
        
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid events in batch to publish',
            details: invalidEvents,
          },
          metadata: {
            batchSize: events.length,
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // Apply versioning to all events
      const versionedEvents = validEvents.map(event => this.applyVersioning(event));
      
      // Set span attributes for tracing
      this.tracingService.setSpanAttributes(span, {
        'batch.size': versionedEvents.length,
        'batch.event_types': versionedEvents.map(e => e.type).join(','),
        'batch.journey': journeyContext?.journey || 'unknown',
      });

      // Determine the appropriate topic based on journey context
      const topic = journeyContext && this.JOURNEY_TOPICS[journeyContext.journey]
        ? this.JOURNEY_TOPICS[journeyContext.journey]
        : this.NOTIFICATION_EVENTS_TOPIC;

      // Create messages for batch sending
      const messages = versionedEvents.map(event => ({
        topic,
        value: JSON.stringify(event),
        key: event.userId,
        headers: {
          ...this.tracingService.getTraceHeaders(span),
          'content-type': 'application/json',
          'event-type': event.type,
          'event-version': event.version,
          'source-service': this.SERVICE_NAME,
        },
      }));

      // Send the batch to Kafka
      await this.kafkaProducer.sendBatch(messages);

      this.logger.debug(
        `Published batch of ${versionedEvents.length} notification events`,
        { batchSize: versionedEvents.length, topic, invalidCount: invalidEvents.length },
      );
      
      return {
        success: true,
        metadata: {
          batchSize: versionedEvents.length,
          invalidCount: invalidEvents.length,
          timestamp: new Date().toISOString(),
          topic,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to publish batch of ${events.length} notification events`,
        error,
        { batchSize: events.length },
      );

      // For batch failures, we retry individual events to avoid failing the entire batch
      if (this.isRetriableError(error)) {
        events.forEach(event => {
          this.scheduleRetry('publishEvent', [event, event.userId, journeyContext], error);
        });
      } else {
        // For non-retriable errors, send each event to DLQ
        events.forEach(async event => {
          await this.sendToDlq('publishEvent', [event, event.userId, journeyContext], error);
        });
      }

      this.tracingService.setSpanError(span, error);
      
      return {
        success: false,
        error: {
          code: error instanceof KafkaError ? error.code : 'UNKNOWN_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          batchSize: events.length,
          timestamp: new Date().toISOString(),
        },
      };
    } finally {
      this.tracingService.endSpan(span);
    }
  }

  /**
   * Creates a notification status event object.
   * 
   * @param notificationId - The ID of the notification
   * @param userId - The ID of the user who received the notification
   * @param status - The delivery status of the notification
   * @param channel - The channel through which the notification was sent
   * @param metadata - Additional metadata about the notification
   * @param journeyContext - Optional journey context for journey-specific processing
   * @returns The notification status event object
   * @private
   */
  private createNotificationStatusEvent(
    notificationId: string | number,
    userId: string,
    status: NotificationStatus,
    channel: string,
    metadata: Record<string, any> = {},
    journeyContext?: IJourneyContext,
  ): INotificationStatusEvent {
    // Generate a unique event ID
    const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the event object
    return {
      eventId,
      type: NotificationEventType.STATUS_UPDATE,
      timestamp: new Date().toISOString(),
      version: this.CURRENT_EVENT_VERSION,
      source: this.SERVICE_NAME,
      userId,
      payload: {
        notificationId: notificationId.toString(),
        status,
        channel,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          // Include journey context in metadata if provided
          ...(journeyContext && { journey: journeyContext.journey }),
          ...(journeyContext?.context && { journeyContext: journeyContext.context }),
        },
      },
      // Include journey context at the top level if provided
      ...(journeyContext && { journey: journeyContext.journey }),
    };
  }

  /**
   * Adds an event to the batch for efficient publishing.
   * If the batch reaches the maximum size or the batch window expires,
   * the batch is published automatically.
   * 
   * @param event - The event to add to the batch
   * @param key - The key for partitioning
   * @param journeyContext - Optional journey context for journey-specific routing
   * @private
   */
  private addToBatch(
    event: INotificationStatusEvent, 
    key: string,
    journeyContext?: IJourneyContext,
  ): void {
    // Add journey context to the event if provided
    const eventWithContext = journeyContext 
      ? { ...event, journeyContext } 
      : event;
    
    this.eventBatch.push(eventWithContext);

    // If this is the first event in the batch, start the timer
    if (this.eventBatch.length === 1 && !this.batchTimer) {
      this.batchTimer = setTimeout(() => this.publishBatchEvents(), this.BATCH_WINDOW_MS);
    }

    // If we've reached the max batch size, publish immediately
    if (this.eventBatch.length >= this.MAX_BATCH_SIZE) {
      this.publishBatchEvents();
    }
  }

  /**
   * Publishes the current batch of events and resets the batch.
   * 
   * @private
   */
  private async publishBatchEvents(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.eventBatch.length === 0) {
      return;
    }

    const batchToPublish = [...this.eventBatch];
    this.eventBatch = [];

    const span = this.tracingService.startSpan('publishBatchEvents');
    
    try {
      this.tracingService.setSpanAttributes(span, {
        'batch.size': batchToPublish.length,
      });

      // Group events by journey for efficient topic-based publishing
      const eventsByJourney: Record<string, INotificationStatusEvent[]> = {
        default: [],
      };
      
      // Organize events by journey
      for (const event of batchToPublish) {
        const journey = event.journeyContext?.journey || 'default';
        if (!eventsByJourney[journey]) {
          eventsByJourney[journey] = [];
        }
        eventsByJourney[journey].push(event);
      }
      
      // Create messages for each journey group
      const allMessages = [];
      
      // Process each journey group
      for (const [journey, events] of Object.entries(eventsByJourney)) {
        if (events.length === 0) continue;
        
        // Determine the appropriate topic based on journey
        const topic = journey !== 'default' && this.JOURNEY_TOPICS[journey]
          ? this.JOURNEY_TOPICS[journey]
          : this.NOTIFICATION_STATUS_TOPIC;
        
        // Create messages for this journey group
        const journeyMessages = events.map(event => ({
          topic,
          value: JSON.stringify(event),
          key: event.userId,
          headers: {
            ...this.tracingService.getTraceHeaders(span),
            'content-type': 'application/json',
            'event-type': event.type,
            'event-version': event.version,
            'source-service': this.SERVICE_NAME,
            ...(journey !== 'default' && { 'journey': journey }),
          },
        }));
        
        allMessages.push(...journeyMessages);
      }

      // Send all messages in a single batch
      await this.kafkaProducer.sendBatch(allMessages);

      this.logger.debug(
        `Published batch of ${batchToPublish.length} notification status events`,
        { batchSize: batchToPublish.length, journeyGroups: Object.keys(eventsByJourney) },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish batch of ${batchToPublish.length} notification status events`,
        error,
        { batchSize: batchToPublish.length },
      );

      // For batch failures, we retry individual events to avoid failing the entire batch
      if (this.isRetriableError(error)) {
        batchToPublish.forEach(event => {
          const { notificationId, status, channel, metadata } = event.payload;
          this.scheduleRetry(
            'publishNotificationStatus',
            [notificationId, event.userId, status, channel, metadata, event.journeyContext],
            error,
          );
        });
      } else {
        // For non-retriable errors, send each event to DLQ
        batchToPublish.forEach(async event => {
          const { notificationId, status, channel, metadata } = event.payload;
          await this.sendToDlq(
            'publishNotificationStatus',
            [notificationId, event.userId, status, channel, metadata, event.journeyContext],
            error,
          );
        });
      }

      this.tracingService.setSpanError(span, error);
    } finally {
      this.tracingService.endSpan(span);
    }
  }

  /**
   * Schedules a retry for a failed operation using the retry service.
   * 
   * @param method - The method name to retry
   * @param args - The arguments to pass to the method
   * @param error - The error that caused the failure
   * @private
   */
  private scheduleRetry(method: string, args: any[], error: Error): void {
    try {
      // Create a retryable operation that will call the specified method with the given arguments
      const operation: IRetryableOperation = {
        execute: async () => {
          return await this[method as keyof KafkaProducer](...args);
        },
        getMetadata: () => ({
          service: this.SERVICE_NAME,
          operation: method,
          args: JSON.stringify(args),
        }),
      };

      // Determine the appropriate retry policy based on the error type
      const retryOptions = this.getRetryOptionsForError(error);

      // Schedule the retry with the retry service
      this.retryService.scheduleRetry(operation, error, retryOptions);

      this.logger.debug(
        `Scheduled retry for failed ${method} operation`,
        { method, args: JSON.stringify(args), retryOptions },
      );
    } catch (retryError) {
      this.logger.error(
        `Failed to schedule retry for ${method} operation`,
        retryError,
        { method, originalError: error },
      );
      
      // If we can't schedule a retry, send to DLQ
      this.sendToDlq(method, args, error).catch(dlqError => {
        this.logger.error(
          `Failed to send to DLQ after retry scheduling failure for ${method}`,
          dlqError,
          { method, originalError: error },
        );
      });
    }
  }
  
  /**
   * Sends a failed operation to the dead letter queue.
   * 
   * @param method - The method name that failed
   * @param args - The arguments passed to the method
   * @param error - The error that caused the failure
   * @private
   */
  private async sendToDlq(method: string, args: any[], error: Error): Promise<void> {
    try {
      await this.dlqService.addToDlq({
        service: this.SERVICE_NAME,
        operation: method,
        payload: JSON.stringify(args),
        error: {
          message: error.message,
          stack: error.stack,
          code: error instanceof KafkaError ? error.code : 'UNKNOWN_ERROR',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          retriable: this.isRetriableError(error),
        },
      });
      
      this.logger.debug(
        `Added failed ${method} operation to DLQ`,
        { method, args: JSON.stringify(args) },
      );
    } catch (dlqError) {
      this.logger.error(
        `Failed to add ${method} operation to DLQ`,
        dlqError,
        { method, originalError: error },
      );
    }
  }
  
  /**
   * Determines if an error is retriable based on its type and properties.
   * 
   * @param error - The error to check
   * @returns True if the error is retriable, false otherwise
   * @private
   */
  private isRetriableError(error: any): boolean {
    // If it's a KafkaError, check if it's a retriable type
    if (error instanceof KafkaError) {
      return this.RETRIABLE_ERROR_TYPES.includes(error.code);
    }
    
    // For network errors, they are generally retriable
    if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return true;
    }
    
    // For timeout errors, they are generally retriable
    if (error.name === 'TimeoutError' || error.message.includes('timeout') || error.message.includes('timed out')) {
      return true;
    }
    
    // For other errors, check if they are marked as retriable
    return error.retriable === true;
  }
  
  /**
   * Gets the appropriate retry options for an error based on its type.
   * 
   * @param error - The error to get retry options for
   * @returns The retry options to use
   * @private
   */
  private getRetryOptionsForError(error: any): any {
    // Default retry options with exponential backoff
    const defaultOptions = {
      policyType: 'exponential',
      maxRetries: 5,
      initialDelay: 100,
      maxDelay: 30000, // 30 seconds max delay
      backoffFactor: 2,
      jitter: true,
    };
    
    // For network errors, use more aggressive retry with more attempts
    if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return {
        ...defaultOptions,
        maxRetries: 10,
        initialDelay: 200,
      };
    }
    
    // For timeout errors, use longer initial delay
    if (error.name === 'TimeoutError' || error.message.includes('timeout') || error.message.includes('timed out')) {
      return {
        ...defaultOptions,
        initialDelay: 500,
      };
    }
    
    // For Kafka-specific errors, customize based on error code
    if (error instanceof KafkaError) {
      switch (error.code) {
        case 'LEADER_NOT_AVAILABLE':
          return {
            ...defaultOptions,
            initialDelay: 1000, // Longer initial delay for leader election
          };
        case 'REQUEST_TIMED_OUT':
          return {
            ...defaultOptions,
            initialDelay: 500,
          };
        case 'BROKER_NOT_AVAILABLE':
          return {
            ...defaultOptions,
            maxRetries: 10, // More retries for broker availability issues
          };
        default:
          return defaultOptions;
      }
    }
    
    return defaultOptions;
  }
}