/**
 * @module @austa/events/errors
 * 
 * This module provides Dead Letter Queue (DLQ) integration for event processing failures.
 * It handles moving failed events to the appropriate DLQ topic, captures failure context
 * and retry history, and supports manual reprocessing capabilities.
 * 
 * @example
 * // Basic usage in an event handler
 * try {
 *   await processEvent(event);
 * } catch (error) {
 *   await sendToDlq(event, error, { processorId: 'health-metrics' });
 * }
 * 
 * @example
 * // Using the DlqProducer in a NestJS service
 * @Injectable()
 * export class HealthEventProcessor {
 *   constructor(private readonly dlqProducer: DlqProducer) {}
 *   
 *   async processEvent(event: HealthEvent) {
 *     try {
 *       // Process event
 *     } catch (error) {
 *       await this.dlqProducer.sendToDlq(event, error, 'health', {
 *         processorId: 'health-metrics',
 *         userId: event.userId
 *       });
 *     }
 *   }
 * }
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { 
  AppException, 
  ErrorType, 
  TechnicalError,
  BusinessError
} from '@austa/errors';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IEventResponse } from '../interfaces/event-response.interface';
import { KafkaProducer } from '../kafka/kafka.producer';
import { KafkaConsumer } from '../kafka/kafka.consumer';
import { KafkaMessage } from '../kafka/kafka.types';
import { DLQ_PRODUCER_OPTIONS } from '../kafka/kafka.constants';
import { classifyError, ErrorClassification } from './handling';

/**
 * Metadata for DLQ messages
 */
export interface DlqMetadata {
  /** ID of the original event */
  eventId: string;
  /** Type of the original event */
  eventType: string;
  /** Source service that published the event */
  source: string;
  /** Service that was processing the event when it failed */
  processingService: string;
  /** Stage of processing where the failure occurred */
  processingStage?: string;
  /** Type of error that caused the failure */
  errorType: string;
  /** Error message */
  errorMessage: string;
  /** Error stack trace if available */
  errorStack?: string;
  /** Error code if available */
  errorCode?: string;
  /** Number of retry attempts made */
  retryCount: number;
  /** Timestamp of the first failure */
  firstFailureTime: string;
  /** Timestamp of the last failure */
  lastFailureTime: string;
  /** Journey context (health, care, plan) */
  journey?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** User ID if applicable */
  userId?: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Additional context about the failure */
  additionalContext?: Record<string, any>;
}

/**
 * DLQ message structure
 */
export interface DlqMessage<T extends IBaseEvent = IBaseEvent> {
  /** The original event that failed processing */
  originalEvent: T;
  /** Metadata about the failure */
  metadata: DlqMetadata;
  /** Timestamp when the message was sent to DLQ */
  dlqTimestamp: string;
}

/**
 * Options for DLQ producer
 */
export interface DlqProducerOptions {
  /** Whether to capture and include stack traces */
  captureStackTrace?: boolean;
  /** Whether to include the full event payload */
  includeEventPayload?: boolean;
  /** Function to enrich metadata */
  metadataEnricher?: (metadata: DlqMetadata, event: IBaseEvent, error: Error) => Promise<DlqMetadata>;
  /** Prefix for DLQ topic names */
  topicPrefix?: string;
  /** Default journey if not specified */
  defaultJourney?: string;
  /** Whether to log DLQ operations */
  logOperations?: boolean;
}

/**
 * Default DLQ producer options
 */
export const DEFAULT_DLQ_PRODUCER_OPTIONS: DlqProducerOptions = {
  captureStackTrace: true,
  includeEventPayload: true,
  topicPrefix: 'dlq',
  logOperations: true
};

/**
 * Options for DLQ consumer
 */
export interface DlqConsumerOptions {
  /** Number of messages to process in each batch */
  batchSize?: number;
  /** Number of messages to process concurrently */
  concurrency?: number;
  /** Filter function to select which messages to process */
  filter?: (message: DlqMessage) => boolean | Promise<boolean>;
  /** Transform function to modify messages before processing */
  transform?: (message: DlqMessage) => DlqMessage | Promise<DlqMessage>;
  /** Whether to automatically commit offsets */
  autoCommit?: boolean;
  /** Group ID for the consumer */
  groupId?: string;
}

/**
 * Default DLQ consumer options
 */
export const DEFAULT_DLQ_CONSUMER_OPTIONS: DlqConsumerOptions = {
  batchSize: 100,
  concurrency: 10,
  autoCommit: true,
  groupId: 'dlq-consumer'
};

/**
 * Context for sending events to DLQ
 */
export interface DlqContext {
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Number of retry attempts made */
  retryCount?: number;
  /** Timestamp of the first failure */
  firstFailureTime?: Date;
  /** Processing stage where the failure occurred */
  processingStage?: string;
  /** Service that was processing the event */
  processingService?: string;
  /** User ID if applicable */
  userId?: string;
  /** Additional context about the failure */
  [key: string]: any;
}

/**
 * Result of DLQ reprocessing operation
 */
export interface DlqReprocessingResult {
  /** Number of messages successfully reprocessed */
  successful: number;
  /** Number of messages that failed reprocessing */
  failed: number;
  /** Details of failed reprocessing attempts */
  failureDetails: Array<{
    eventId: string;
    eventType: string;
    error: string;
    retryCount: number;
  }>;
  /** Total number of messages processed */
  total: number;
  /** Time taken for the operation in milliseconds */
  timeTakenMs: number;
}

/**
 * Error pattern analysis result
 */
export interface ErrorPatternAnalysis {
  /** Most common error types */
  mostCommonErrorTypes: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
  /** Most common error messages */
  mostCommonErrorMessages: Array<{
    errorMessage: string;
    count: number;
    percentage: number;
  }>;
  /** Error distribution by journey */
  errorsByJourney: Record<string, number>;
  /** Error distribution by event type */
  errorsByEventType: Record<string, number>;
  /** Error distribution by processing service */
  errorsByProcessingService: Record<string, number>;
  /** Retryable vs non-retryable errors */
  retryableVsNonRetryable: {
    retryable: number;
    nonRetryable: number;
    retryablePercentage: number;
  };
  /** Total number of errors analyzed */
  totalErrors: number;
  /** Time range of the analysis */
  timeRange: {
    oldest: string;
    newest: string;
    durationHours: number;
  };
}

/**
 * Producer for sending failed events to Dead Letter Queues
 */
@Injectable()
export class DlqProducer {
  private readonly logger: LoggerService;
  private readonly options: DlqProducerOptions;

  /**
   * Creates a new DLQ producer
   * 
   * @param kafkaProducer Kafka producer for sending messages
   * @param options DLQ producer options
   * @param logger Logger service
   * @param tracer Optional tracing service
   */
  constructor(
    private readonly kafkaProducer: KafkaProducer,
    @Optional() @Inject(DLQ_PRODUCER_OPTIONS) options?: DlqProducerOptions,
    @Optional() logger?: LoggerService,
    @Optional() private readonly tracer?: TracingService
  ) {
    this.options = { ...DEFAULT_DLQ_PRODUCER_OPTIONS, ...options };
    this.logger = logger || new Logger(DlqProducer.name) as unknown as LoggerService;
  }

  /**
   * Sends a failed event to the appropriate Dead Letter Queue
   * 
   * @param event The event that failed processing
   * @param error The error that caused the failure
   * @param journey Optional journey context for routing to specific DLQ
   * @param context Additional context about the failure
   * @returns Promise that resolves when the event is sent to DLQ
   */
  async sendToDlq<T extends IBaseEvent>(
    event: T,
    error: Error,
    journey?: string,
    context: DlqContext = {}
  ): Promise<void> {
    try {
      // Determine the journey context
      const eventJourney = journey || event.journey || this.options.defaultJourney;
      
      // Create DLQ topic name
      const dlqTopic = eventJourney 
        ? `${this.options.topicPrefix || 'dlq'}.${eventJourney}` 
        : `${this.options.topicPrefix || 'dlq'}.general`;
      
      // Get correlation ID for tracing
      const correlationId = context.correlationId || 
        event.metadata?.correlationId || 
        (this.tracer ? this.tracer.getCurrentTraceId() : undefined) || 
        `dlq-${event.eventId}-${Date.now()}`;
      
      // Determine if error is retryable
      const errorClassification = classifyError(error);
      const retryable = errorClassification === ErrorClassification.RETRYABLE;
      
      // Create metadata for DLQ message
      const metadata: DlqMetadata = {
        eventId: event.eventId,
        eventType: event.type,
        source: event.source,
        processingService: context.processingService || 'unknown',
        processingStage: context.processingStage || 'unknown',
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: this.options.captureStackTrace ? error.stack : undefined,
        errorCode: error instanceof AppException ? error.code : undefined,
        retryCount: context.retryCount || 0,
        firstFailureTime: context.firstFailureTime 
          ? context.firstFailureTime.toISOString() 
          : new Date().toISOString(),
        lastFailureTime: new Date().toISOString(),
        journey: eventJourney,
        correlationId,
        userId: context.userId || event.userId,
        retryable,
        additionalContext: { ...context }
      };
      
      // Enrich metadata if enricher is provided
      if (this.options.metadataEnricher) {
        await this.options.metadataEnricher(metadata, event, error);
      }
      
      // Create DLQ message
      const dlqMessage: DlqMessage<T> = {
        originalEvent: this.options.includeEventPayload ? event : undefined as any,
        metadata,
        dlqTimestamp: new Date().toISOString()
      };
      
      // Send to DLQ topic
      await this.kafkaProducer.produce({
        topic: dlqTopic,
        messages: [{
          key: event.eventId,
          value: JSON.stringify(dlqMessage),
          headers: {
            'correlation-id': correlationId,
            'event-type': event.type,
            'source': event.source,
            'error-type': error.constructor.name,
            'retry-count': String(metadata.retryCount),
            'journey': eventJourney || 'unknown'
          }
        }]
      });
      
      // Log the operation if enabled
      if (this.options.logOperations) {
        this.logger.log(
          `Event sent to DLQ: ${event.type}`,
          { 
            correlationId,
            eventId: event.eventId,
            eventType: event.type,
            source: event.source,
            dlqTopic,
            errorType: error.constructor.name,
            retryCount: metadata.retryCount,
            journey: eventJourney
          },
          'DlqProducer'
        );
      }
    } catch (dlqError) {
      // Log error when sending to DLQ fails
      this.logger.error(
        `Failed to send event to DLQ: ${event.type}`,
        dlqError instanceof Error ? dlqError.stack : String(dlqError),
        'DlqProducer',
        { 
          correlationId: context.correlationId || event.metadata?.correlationId,
          eventId: event.eventId,
          eventType: event.type,
          source: event.source,
          originalError: error.message
        }
      );
      
      // Rethrow as a technical error
      throw new TechnicalError(
        `Failed to send event to DLQ: ${dlqError instanceof Error ? dlqError.message : String(dlqError)}`,
        {
          cause: dlqError,
          code: 'DLQ_SEND_FAILED',
          context: {
            eventId: event.eventId,
            eventType: event.type,
            originalError: error.message
          }
        }
      );
    }
  }

  /**
   * Gets the DLQ topic name for a journey
   * 
   * @param journey Journey name
   * @returns DLQ topic name
   */
  getDlqTopicName(journey?: string): string {
    return journey 
      ? `${this.options.topicPrefix || 'dlq'}.${journey}` 
      : `${this.options.topicPrefix || 'dlq'}.general`;
  }
}

/**
 * Consumer for processing messages from Dead Letter Queues
 */
@Injectable()
export class DlqConsumer {
  private readonly logger: LoggerService;
  private readonly options: DlqConsumerOptions;

  /**
   * Creates a new DLQ consumer
   * 
   * @param kafkaConsumer Kafka consumer for receiving messages
   * @param options DLQ consumer options
   * @param logger Logger service
   * @param tracer Optional tracing service
   */
  constructor(
    private readonly kafkaConsumer: KafkaConsumer,
    @Optional() options?: DlqConsumerOptions,
    @Optional() logger?: LoggerService,
    @Optional() private readonly tracer?: TracingService
  ) {
    this.options = { ...DEFAULT_DLQ_CONSUMER_OPTIONS, ...options };
    this.logger = logger || new Logger(DlqConsumer.name) as unknown as LoggerService;
  }

  /**
   * Consumes messages from a DLQ topic
   * 
   * @param topic DLQ topic to consume from
   * @param handler Handler function for processing messages
   * @param options Options for consumption
   * @returns Promise that resolves when consumption is complete
   */
  async consumeFromDlq<T extends IBaseEvent>(
    topic: string,
    handler: (message: DlqMessage<T>) => Promise<IEventResponse>,
    options?: Partial<DlqConsumerOptions>
  ): Promise<void> {
    const mergedOptions = { ...this.options, ...options };
    
    // Subscribe to the DLQ topic
    await this.kafkaConsumer.subscribe({
      topic,
      fromBeginning: true,
      groupId: mergedOptions.groupId || this.options.groupId
    });
    
    // Process messages in batches
    const processMessages = async (messages: KafkaMessage[]): Promise<void> => {
      // Apply filter if provided
      let filteredMessages = messages;
      if (mergedOptions.filter) {
        const filterResults = await Promise.all(
          messages.map(async (message) => {
            try {
              const dlqMessage = JSON.parse(message.value.toString()) as DlqMessage<T>;
              return await mergedOptions.filter!(dlqMessage);
            } catch (error) {
              this.logger.warn(
                `Failed to filter DLQ message: ${error instanceof Error ? error.message : String(error)}`,
                { messageKey: message.key?.toString() },
                'DlqConsumer'
              );
              return false;
            }
          })
        );
        
        filteredMessages = messages.filter((_, index) => filterResults[index]);
      }
      
      // Process filtered messages concurrently with limited concurrency
      const concurrency = mergedOptions.concurrency || 10;
      const chunks = [];
      for (let i = 0; i < filteredMessages.length; i += concurrency) {
        chunks.push(filteredMessages.slice(i, i + concurrency));
      }
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (message) => {
            try {
              // Parse DLQ message
              const dlqMessage = JSON.parse(message.value.toString()) as DlqMessage<T>;
              
              // Apply transform if provided
              const transformedMessage = mergedOptions.transform 
                ? await mergedOptions.transform(dlqMessage)
                : dlqMessage;
              
              // Get correlation ID for tracing
              const correlationId = 
                transformedMessage.metadata.correlationId || 
                message.headers?.['correlation-id']?.toString() || 
                `dlq-reprocess-${transformedMessage.metadata.eventId}-${Date.now()}`;
              
              // Process the message
              this.logger.log(
                `Processing DLQ message: ${transformedMessage.metadata.eventType}`,
                { 
                  correlationId,
                  eventId: transformedMessage.metadata.eventId,
                  eventType: transformedMessage.metadata.eventType,
                  retryCount: transformedMessage.metadata.retryCount,
                  journey: transformedMessage.metadata.journey
                },
                'DlqConsumer'
              );
              
              const result = await handler(transformedMessage);
              
              // Log the result
              if (result.success) {
                this.logger.log(
                  `Successfully reprocessed DLQ message: ${transformedMessage.metadata.eventType}`,
                  { 
                    correlationId,
                    eventId: transformedMessage.metadata.eventId,
                    eventType: transformedMessage.metadata.eventType,
                    retryCount: transformedMessage.metadata.retryCount,
                    journey: transformedMessage.metadata.journey
                  },
                  'DlqConsumer'
                );
              } else {
                this.logger.warn(
                  `Failed to reprocess DLQ message: ${transformedMessage.metadata.eventType}`,
                  { 
                    correlationId,
                    eventId: transformedMessage.metadata.eventId,
                    eventType: transformedMessage.metadata.eventType,
                    retryCount: transformedMessage.metadata.retryCount,
                    journey: transformedMessage.metadata.journey,
                    error: result.error
                  },
                  'DlqConsumer'
                );
              }
              
              // Commit offset if auto-commit is enabled
              if (mergedOptions.autoCommit) {
                await this.kafkaConsumer.commitOffset({
                  topic: message.topic,
                  partition: message.partition,
                  offset: message.offset
                });
              }
            } catch (error) {
              this.logger.error(
                `Error processing DLQ message: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error.stack : undefined,
                'DlqConsumer',
                { messageKey: message.key?.toString() }
              );
            }
          })
        );
      }
    };
    
    // Start consuming messages
    await this.kafkaConsumer.consume({
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, commitOffsetsIfNecessary }) => {
        if (!isRunning() || !batch.messages.length) return;
        
        try {
          // Process the batch of messages
          await processMessages(batch.messages);
          
          // Commit offsets if auto-commit is disabled
          if (!mergedOptions.autoCommit) {
            await commitOffsetsIfNecessary();
          }
          
          // Send heartbeat to keep the consumer alive
          await heartbeat();
        } catch (error) {
          this.logger.error(
            `Error processing DLQ batch: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
            'DlqConsumer'
          );
        }
      },
      autoCommit: false,
      maxBatchSize: mergedOptions.batchSize || 100
    });
  }

  /**
   * Reprocesses messages from a DLQ topic
   * 
   * @param topic DLQ topic to reprocess
   * @param handler Handler function for reprocessing messages
   * @param options Options for reprocessing
   * @returns Promise that resolves with the reprocessing result
   */
  async reprocessDlqMessages<T extends IBaseEvent>(
    topic: string,
    handler: (event: T) => Promise<IEventResponse>,
    options?: Partial<DlqConsumerOptions>
  ): Promise<DlqReprocessingResult> {
    const result: DlqReprocessingResult = {
      successful: 0,
      failed: 0,
      failureDetails: [],
      total: 0,
      timeTakenMs: 0
    };
    
    const startTime = Date.now();
    
    // Create handler for DLQ messages
    const dlqHandler = async (message: DlqMessage<T>): Promise<IEventResponse> => {
      try {
        // Check if the original event is available
        if (!message.originalEvent) {
          throw new BusinessError(
            'Cannot reprocess DLQ message: original event payload not available',
            { code: 'DLQ_MISSING_PAYLOAD' }
          );
        }
        
        // Reprocess the original event
        const reprocessResult = await handler(message.originalEvent);
        
        if (reprocessResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.failureDetails.push({
            eventId: message.metadata.eventId,
            eventType: message.metadata.eventType,
            error: reprocessResult.error?.message || 'Unknown error',
            retryCount: message.metadata.retryCount + 1
          });
        }
        
        result.total++;
        return reprocessResult;
      } catch (error) {
        result.failed++;
        result.failureDetails.push({
          eventId: message.metadata.eventId,
          eventType: message.metadata.eventType,
          error: error instanceof Error ? error.message : String(error),
          retryCount: message.metadata.retryCount + 1
        });
        
        result.total++;
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: error instanceof AppException ? error.code : 'REPROCESSING_ERROR',
            type: error instanceof AppException ? error.type : ErrorType.TECHNICAL
          }
        };
      }
    };
    
    // Consume and reprocess messages
    await this.consumeFromDlq(topic, dlqHandler, options);
    
    // Calculate time taken
    result.timeTakenMs = Date.now() - startTime;
    
    return result;
  }
}

/**
 * Utility for sending a failed event to the appropriate Dead Letter Queue
 * 
 * @param event The event that failed processing
 * @param error The error that caused the failure
 * @param context Additional context about the failure
 * @param journey Optional journey context for routing to specific DLQ
 * @param retryCount Number of retry attempts made
 * @param firstFailureTime Timestamp of the first failure
 * @param processingStage Stage of processing where the failure occurred
 * @returns Promise that resolves when the event is sent to DLQ
 */
export async function sendToDlq<T extends IBaseEvent>(
  event: T,
  error: Error,
  context: Record<string, any> = {},
  journey?: string,
  retryCount?: number,
  firstFailureTime?: Date,
  processingStage?: string
): Promise<void> {
  // This is a placeholder implementation that will be replaced at runtime
  // by the actual DlqProducer instance when used in a NestJS application.
  // For standalone usage, it logs a warning and doesn't actually send to DLQ.
  
  const logger = new Logger('DLQ') as unknown as LoggerService;
  
  logger.warn(
    'Using standalone sendToDlq function without DlqProducer. Event will not be sent to DLQ.',
    {
      eventId: event.eventId,
      eventType: event.type,
      error: error.message,
      journey,
      retryCount,
      processingStage
    },
    'sendToDlq'
  );
  
  // In a real application, this function would be replaced by the DlqProducer.sendToDlq method
  // through dependency injection. This implementation is just a fallback for standalone usage.
}

/**
 * Utilities for working with Dead Letter Queues
 */
export const dlqUtils = {
  /**
   * Analyzes the contents of a DLQ topic to identify error patterns
   * 
   * @param topic DLQ topic to analyze
   * @param options Options for analysis
   * @returns Promise that resolves with the analysis result
   */
  async analyzeErrorPatterns(
    topic: string,
    options?: {
      maxMessages?: number;
      timeRangeHours?: number;
      includeStackTraces?: boolean;
    }
  ): Promise<ErrorPatternAnalysis> {
    // This is a placeholder implementation
    // In a real application, this would analyze the DLQ contents
    
    return {
      mostCommonErrorTypes: [],
      mostCommonErrorMessages: [],
      errorsByJourney: {},
      errorsByEventType: {},
      errorsByProcessingService: {},
      retryableVsNonRetryable: {
        retryable: 0,
        nonRetryable: 0,
        retryablePercentage: 0
      },
      totalErrors: 0,
      timeRange: {
        oldest: new Date().toISOString(),
        newest: new Date().toISOString(),
        durationHours: 0
      }
    };
  },
  
  /**
   * Reprocesses events from a DLQ topic
   * 
   * @param topic DLQ topic to reprocess
   * @param options Options for reprocessing
   * @returns Promise that resolves with the reprocessing result
   */
  async reprocessEvents(
    topic: string,
    options?: {
      filter?: (message: DlqMessage) => boolean | Promise<boolean>;
      batchSize?: number;
      concurrency?: number;
      dryRun?: boolean;
    }
  ): Promise<DlqReprocessingResult> {
    // This is a placeholder implementation
    // In a real application, this would reprocess events from the DLQ
    
    return {
      successful: 0,
      failed: 0,
      failureDetails: [],
      total: 0,
      timeTakenMs: 0
    };
  },
  
  /**
   * Purges messages from a DLQ topic
   * 
   * @param topic DLQ topic to purge
   * @param options Options for purging
   * @returns Promise that resolves with the number of purged messages
   */
  async purgeDlqMessages(
    topic: string,
    options?: {
      filter?: (message: DlqMessage) => boolean | Promise<boolean>;
      olderThanHours?: number;
      dryRun?: boolean;
    }
  ): Promise<number> {
    // This is a placeholder implementation
    // In a real application, this would purge messages from the DLQ
    
    return 0;
  },
  
  /**
   * Exports messages from a DLQ topic to a file
   * 
   * @param topic DLQ topic to export
   * @param filePath Path to export file
   * @param options Options for export
   * @returns Promise that resolves with the number of exported messages
   */
  async exportDlqMessages(
    topic: string,
    filePath: string,
    options?: {
      format?: 'json' | 'csv';
      filter?: (message: DlqMessage) => boolean | Promise<boolean>;
      includePayload?: boolean;
    }
  ): Promise<number> {
    // This is a placeholder implementation
    // In a real application, this would export messages from the DLQ
    
    return 0;
  },
  
  /**
   * Imports messages from a file to a DLQ topic
   * 
   * @param filePath Path to import file
   * @param topic DLQ topic to import to
   * @param options Options for import
   * @returns Promise that resolves with the number of imported messages
   */
  async importDlqMessages(
    filePath: string,
    topic: string,
    options?: {
      format?: 'json' | 'csv';
      transform?: (message: DlqMessage) => DlqMessage | Promise<DlqMessage>;
      dryRun?: boolean;
    }
  ): Promise<number> {
    // This is a placeholder implementation
    // In a real application, this would import messages to the DLQ
    
    return 0;
  },
  
  /**
   * Creates a DLQ topic name for a journey
   * 
   * @param journey Journey name
   * @param prefix Optional prefix for the topic name
   * @returns DLQ topic name
   */
  getDlqTopicName(journey?: string, prefix: string = 'dlq'): string {
    return journey ? `${prefix}.${journey}` : `${prefix}.general`;
  }
};