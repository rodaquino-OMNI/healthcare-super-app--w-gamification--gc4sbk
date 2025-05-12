import { Injectable } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConfigService } from '@nestjs/config';
import { BaseEvent } from '../interfaces/base-event.interface';
import { KafkaEvent } from '../interfaces/kafka-event.interface';

/**
 * Interface for DLQ entry metadata that captures failure context
 */
export interface DlqEntryMetadata {
  /** Original event ID that failed */
  originalEventId: string;
  /** Error message from the failure */
  errorMessage: string;
  /** Error type classification */
  errorType: 'client' | 'system' | 'transient' | 'external';
  /** Stack trace if available */
  stackTrace?: string;
  /** Service that reported the failure */
  sourceService: string;
  /** Journey context of the event */
  journey?: 'health' | 'care' | 'plan' | 'common';
  /** Timestamp when the event was sent to DLQ */
  dlqTimestamp: string;
  /** History of retry attempts if any */
  retryHistory?: {
    /** Timestamp of the retry attempt */
    timestamp: string;
    /** Error message from this attempt */
    errorMessage: string;
    /** Attempt number */
    attempt: number;
  }[];
}

/**
 * Interface for a DLQ entry combining the original event and failure metadata
 */
export interface DlqEntry<T extends BaseEvent = BaseEvent> {
  /** The original event that failed processing */
  originalEvent: T;
  /** Metadata about the failure */
  metadata: DlqEntryMetadata;
}

/**
 * Interface for DLQ producer operations
 */
export interface IDlqProducer {
  /**
   * Sends a failed event to the appropriate DLQ
   * 
   * @param event The original event that failed
   * @param error The error that caused the failure
   * @param retryHistory Optional history of retry attempts
   * @returns Promise resolving to boolean indicating success
   */
  sendToDlq<T extends BaseEvent>(event: T, error: Error, retryHistory?: DlqEntryMetadata['retryHistory']): Promise<boolean>;
}

/**
 * Interface for DLQ consumer operations
 */
export interface IDlqConsumer {
  /**
   * Retrieves entries from a DLQ for analysis or reprocessing
   * 
   * @param journey Optional journey to filter entries
   * @param limit Maximum number of entries to retrieve
   * @returns Promise resolving to array of DLQ entries
   */
  getEntries<T extends BaseEvent>(journey?: string, limit?: number): Promise<DlqEntry<T>[]>;
  
  /**
   * Reprocesses a specific DLQ entry
   * 
   * @param entryId ID of the DLQ entry to reprocess
   * @returns Promise resolving to boolean indicating success
   */
  reprocessEntry(entryId: string): Promise<boolean>;
}

/**
 * Service for managing Dead Letter Queue operations for failed events
 * 
 * This service provides functionality to handle events that have failed processing
 * and exceeded retry limits or are classified as non-retryable. It sends these
 * events to journey-specific DLQ topics, captures failure context, and supports
 * manual reprocessing capabilities.
 */
@Injectable()
export class DlqService implements IDlqProducer, IDlqConsumer {
  /** Topic prefix for DLQ topics */
  private readonly dlqTopicPrefix: string;
  /** Default DLQ topic if journey-specific topic can't be determined */
  private readonly defaultDlqTopic: string;

  /**
   * Creates an instance of DlqService
   * 
   * @param kafkaService Service for Kafka interactions
   * @param logger Service for structured logging
   * @param tracingService Service for distributed tracing
   * @param configService Service for configuration access
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
  ) {
    this.dlqTopicPrefix = this.configService.get<string>('kafka.dlqTopicPrefix', 'dlq-');
    this.defaultDlqTopic = this.configService.get<string>('kafka.defaultDlqTopic', 'dlq-events');
    
    this.logger.setContext('DlqService');
  }

  /**
   * Classifies an error to determine its type
   * 
   * @param error The error to classify
   * @returns The error type classification
   */
  private classifyError(error: Error): DlqEntryMetadata['errorType'] {
    // Check for known error types based on error name or properties
    if (error.name === 'ValidationError' || error.name === 'BadRequestException') {
      return 'client';
    }
    
    if (error.name === 'TimeoutError' || error.name === 'ConnectionError') {
      return 'transient';
    }
    
    if (error.name === 'ExternalServiceError' || error.name === 'IntegrationError') {
      return 'external';
    }
    
    // Default to system error for unknown error types
    return 'system';
  }

  /**
   * Determines the appropriate DLQ topic for an event based on its journey
   * 
   * @param event The event to determine the DLQ topic for
   * @returns The DLQ topic name
   */
  private getDlqTopic(event: BaseEvent): string {
    // Extract journey from event if available
    const journey = event.journey || 
                   (event.source && event.source.includes('journey-') ? 
                    event.source.split('journey-')[1] : 
                    null);
    
    if (journey) {
      return `${this.dlqTopicPrefix}${journey}`;
    }
    
    return this.defaultDlqTopic;
  }

  /**
   * Sends a failed event to the appropriate DLQ
   * 
   * @param event The original event that failed
   * @param error The error that caused the failure
   * @param retryHistory Optional history of retry attempts
   * @returns Promise resolving to boolean indicating success
   */
  public async sendToDlq<T extends BaseEvent>(
    event: T, 
    error: Error, 
    retryHistory?: DlqEntryMetadata['retryHistory']
  ): Promise<boolean> {
    try {
      const span = this.tracingService.startSpan('dlq.sendToDlq');
      
      // Create DLQ entry with metadata
      const dlqEntry: DlqEntry<T> = {
        originalEvent: event,
        metadata: {
          originalEventId: event.eventId,
          errorMessage: error.message,
          errorType: this.classifyError(error),
          stackTrace: error.stack,
          sourceService: event.source || 'unknown',
          journey: event.journey as any,
          dlqTimestamp: new Date().toISOString(),
          retryHistory: retryHistory || [],
        },
      };
      
      // Determine the appropriate DLQ topic
      const dlqTopic = this.getDlqTopic(event);
      
      // Add trace context to the DLQ entry
      const traceContext = this.tracingService.getTraceContext();
      if (traceContext) {
        dlqEntry.metadata['traceId'] = traceContext.traceId;
        dlqEntry.metadata['spanId'] = traceContext.spanId;
      }
      
      // Send to Kafka DLQ topic
      await this.kafkaService.produce({
        topic: dlqTopic,
        messages: [
          {
            key: event.eventId,
            value: JSON.stringify(dlqEntry),
            headers: {
              'content-type': 'application/json',
              'event-type': 'dlq-entry',
              'source-service': event.source || 'unknown',
              'error-type': this.classifyError(error),
              ...(traceContext ? { 
                'trace-id': traceContext.traceId,
                'span-id': traceContext.spanId,
              } : {}),
            },
          },
        ],
      });
      
      this.logger.log(
        `Event ${event.eventId} sent to DLQ topic ${dlqTopic}`,
        {
          eventId: event.eventId,
          eventType: event.type,
          errorType: this.classifyError(error),
          errorMessage: error.message,
          dlqTopic,
        }
      );
      
      span.end();
      return true;
    } catch (dlqError) {
      this.logger.error(
        `Failed to send event ${event.eventId} to DLQ: ${dlqError.message}`,
        dlqError.stack,
        {
          eventId: event.eventId,
          eventType: event.type,
          originalError: error.message,
          dlqError: dlqError.message,
        }
      );
      return false;
    }
  }

  /**
   * Retrieves entries from a DLQ for analysis or reprocessing
   * 
   * @param journey Optional journey to filter entries
   * @param limit Maximum number of entries to retrieve
   * @returns Promise resolving to array of DLQ entries
   */
  public async getEntries<T extends BaseEvent>(
    journey?: string, 
    limit: number = 100
  ): Promise<DlqEntry<T>[]> {
    try {
      const span = this.tracingService.startSpan('dlq.getEntries');
      
      // Determine which DLQ topic to consume from
      const dlqTopic = journey ? 
        `${this.dlqTopicPrefix}${journey}` : 
        this.defaultDlqTopic;
      
      // Create a temporary consumer group ID for this operation
      const consumerGroupId = `dlq-admin-${Date.now()}`;
      
      // Consume messages from the DLQ topic
      const messages = await this.kafkaService.consumeBatch(
        dlqTopic,
        consumerGroupId,
        limit
      );
      
      // Parse DLQ entries from messages
      const entries: DlqEntry<T>[] = messages
        .map(message => {
          try {
            return JSON.parse(message.value.toString()) as DlqEntry<T>;
          } catch (e) {
            this.logger.warn(
              `Failed to parse DLQ entry: ${e.message}`,
              { messageKey: message.key?.toString() }
            );
            return null;
          }
        })
        .filter(entry => entry !== null);
      
      this.logger.log(
        `Retrieved ${entries.length} entries from DLQ topic ${dlqTopic}`,
        { dlqTopic, requestedLimit: limit }
      );
      
      span.end();
      return entries;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve entries from DLQ: ${error.message}`,
        error.stack,
        { journey, limit }
      );
      return [];
    }
  }

  /**
   * Reprocesses a specific DLQ entry by sending it back to its original topic
   * 
   * @param entryId ID of the DLQ entry to reprocess
   * @returns Promise resolving to boolean indicating success
   */
  public async reprocessEntry(entryId: string): Promise<boolean> {
    try {
      const span = this.tracingService.startSpan('dlq.reprocessEntry');
      
      // Find the entry in the DLQ
      // For simplicity, we'll search all DLQ topics
      // In a production implementation, this would be more targeted
      const allJourneys = ['health', 'care', 'plan', 'common'];
      let targetEntry: DlqEntry | null = null;
      
      for (const journey of allJourneys) {
        const entries = await this.getEntries(journey, 100);
        targetEntry = entries.find(entry => entry.originalEvent.eventId === entryId) || null;
        if (targetEntry) break;
      }
      
      if (!targetEntry) {
        this.logger.warn(`DLQ entry with ID ${entryId} not found for reprocessing`);
        span.end();
        return false;
      }
      
      // Determine the original topic from the event
      // This would typically be stored in the DLQ entry metadata or derived from event type
      const originalTopic = this.determineOriginalTopic(targetEntry.originalEvent);
      
      if (!originalTopic) {
        this.logger.warn(
          `Could not determine original topic for event ${entryId}`,
          { eventType: targetEntry.originalEvent.type }
        );
        span.end();
        return false;
      }
      
      // Send the original event back to its topic
      await this.kafkaService.produce({
        topic: originalTopic,
        messages: [
          {
            key: targetEntry.originalEvent.eventId,
            value: JSON.stringify(targetEntry.originalEvent),
            headers: {
              'content-type': 'application/json',
              'event-type': targetEntry.originalEvent.type,
              'reprocessed-from-dlq': 'true',
              'original-error': targetEntry.metadata.errorMessage,
              'reprocessed-at': new Date().toISOString(),
            },
          },
        ],
      });
      
      this.logger.log(
        `Reprocessed event ${entryId} from DLQ to topic ${originalTopic}`,
        {
          eventId: entryId,
          eventType: targetEntry.originalEvent.type,
          originalTopic,
          originalError: targetEntry.metadata.errorMessage,
        }
      );
      
      span.end();
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reprocess DLQ entry ${entryId}: ${error.message}`,
        error.stack,
        { entryId }
      );
      return false;
    }
  }

  /**
   * Determines the original topic for an event based on its type and journey
   * 
   * @param event The event to determine the original topic for
   * @returns The original topic name or null if it cannot be determined
   */
  private determineOriginalTopic(event: BaseEvent): string | null {
    // This is a simplified implementation
    // In a real system, this would be more sophisticated and possibly use a mapping configuration
    
    const journey = event.journey || 'common';
    const eventType = event.type;
    
    // Map journey and event type to topic
    const topicMappings: Record<string, Record<string, string>> = {
      health: {
        'health.metric.recorded': 'health-metrics',
        'health.goal.achieved': 'health-achievements',
        'health.device.connected': 'health-devices',
        // Add more mappings as needed
      },
      care: {
        'care.appointment.booked': 'care-appointments',
        'care.medication.taken': 'care-medications',
        'care.telemedicine.started': 'care-telemedicine',
        // Add more mappings as needed
      },
      plan: {
        'plan.claim.submitted': 'plan-claims',
        'plan.benefit.used': 'plan-benefits',
        'plan.reward.redeemed': 'plan-rewards',
        // Add more mappings as needed
      },
      common: {
        'user.registered': 'user-events',
        'user.logged.in': 'user-events',
        // Add more mappings as needed
      },
    };
    
    // Look up the topic based on journey and event type
    const journeyMappings = topicMappings[journey];
    if (journeyMappings && journeyMappings[eventType]) {
      return journeyMappings[eventType];
    }
    
    // Fallback to a generic topic based on journey
    return `${journey}-events`;
  }
}