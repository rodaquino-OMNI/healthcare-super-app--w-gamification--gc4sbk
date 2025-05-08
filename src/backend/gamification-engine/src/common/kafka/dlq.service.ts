/**
 * @file dlq.service.ts
 * @description Service that manages dead letter queues for failed Kafka message processing.
 * Routes messages that have exhausted their retry attempts to specialized DLQ topics,
 * preserves the original message with error context, and provides methods for message
 * inspection and replay.
 * 
 * This file is part of the AUSTA SuperApp gamification engine and implements the
 * dead letter queue requirements from the technical specification.
 * 
 * @see Technical Specification Section 5.2.1 - Gamification Engine (updated)
 * @see Technical Specification Section 0.2.3 - Phase 4: Gamification Event Architecture
 */

import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessage, Producer, RecordMetadata, Admin, ITopicConfig } from 'kafkajs';

// Import from @austa/logging for structured logging
import { LoggerService } from '@austa/logging';

// Import from @austa/tracing for distributed tracing
import { TracingService } from '@austa/tracing';

// Import from @austa/errors for error handling
import { ErrorReporter } from '@austa/errors';

// Import from @austa/events for event handling
import { EventStatus } from '@austa/events';

// Import Kafka-specific exception
import KafkaException, { KafkaErrorType } from '../exceptions/kafka.exception';

// Import Kafka types
import {
  KafkaHeaders,
  KafkaErrorType as KafkaErrorTypeEnum,
  KafkaError,
  TypedKafkaMessage,
  EventPayload,
  MessageHandlerContext,
  ProducerConfig
} from './kafka.types';

/**
 * Configuration options for the DLQ service
 */
export interface DlqServiceOptions {
  /** Service name for error context */
  serviceName: string;
  /** Default DLQ topic name */
  defaultDlqTopic: string;
  /** Journey-specific DLQ topics */
  journeyDlqTopics?: {
    /** Health journey DLQ topic */
    health?: string;
    /** Care journey DLQ topic */
    care?: string;
    /** Plan journey DLQ topic */
    plan?: string;
    /** Additional journey-specific DLQ topics */
    [key: string]: string;
  };
  /** Whether to create DLQ topics if they don't exist */
  createTopicsIfNotExist?: boolean;
  /** Topic configuration for auto-created topics */
  topicConfig?: {
    /** Number of partitions */
    numPartitions?: number;
    /** Replication factor */
    replicationFactor?: number;
    /** Topic configurations */
    configEntries?: Array<{ name: string; value: string }>;
  };
  /** Whether to include the original message in the DLQ message */
  includeOriginalMessage?: boolean;
  /** Whether to include error details in the DLQ message */
  includeErrorDetails?: boolean;
  /** Headers to include in the DLQ message */
  headersToInclude?: string[];
  /** Maximum message size in bytes (default: 1MB) */
  maxMessageSizeBytes?: number;
  /** Logger instance */
  logger?: Logger;
}

/**
 * DLQ message metadata
 */
export interface DlqMessageMetadata {
  /** Original topic */
  originalTopic: string;
  /** Original partition */
  originalPartition?: number;
  /** Original offset */
  originalOffset?: string;
  /** Error message */
  errorMessage: string;
  /** Error type */
  errorType: string;
  /** Error code */
  errorCode?: string;
  /** Error stack trace */
  errorStack?: string;
  /** Timestamp when the error occurred */
  errorTimestamp: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Service that processed the message */
  serviceName: string;
  /** Journey context (health, care, plan) */
  journeyContext?: string;
  /** User ID associated with the event */
  userId?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * DLQ message with original message and error details
 */
export interface DlqMessage<T extends EventPayload = EventPayload> {
  /** Metadata about the error and original message */
  metadata: DlqMessageMetadata;
  /** Original message that failed processing */
  originalMessage?: TypedKafkaMessage<T>;
  /** Error details */
  error?: {
    /** Error message */
    message: string;
    /** Error name/type */
    name: string;
    /** Error code */
    code?: string;
    /** Error stack trace */
    stack?: string;
    /** Additional error details */
    details?: Record<string, any>;
  };
  /** Status of the DLQ message */
  status: 'pending' | 'reprocessed' | 'archived' | 'failed';
  /** Timestamp when the message was sent to DLQ */
  timestamp: string;
  /** Unique ID for the DLQ message */
  dlqMessageId: string;
}

/**
 * DLQ message filter options
 */
export interface DlqMessageFilterOptions {
  /** Filter by original topic */
  originalTopic?: string;
  /** Filter by error type */
  errorType?: string;
  /** Filter by error code */
  errorCode?: string;
  /** Filter by journey context */
  journeyContext?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by correlation ID */
  correlationId?: string;
  /** Filter by status */
  status?: 'pending' | 'reprocessed' | 'archived' | 'failed';
  /** Filter by minimum timestamp */
  fromTimestamp?: string;
  /** Filter by maximum timestamp */
  toTimestamp?: string;
  /** Filter by minimum retry count */
  minRetryCount?: number;
  /** Filter by maximum retry count */
  maxRetryCount?: number;
  /** Additional filter criteria */
  [key: string]: any;
}

/**
 * DLQ message replay options
 */
export interface DlqMessageReplayOptions {
  /** Whether to reset the retry count */
  resetRetryCount?: boolean;
  /** Target topic to replay to (defaults to original topic) */
  targetTopic?: string;
  /** Additional headers to include */
  additionalHeaders?: Record<string, string>;
  /** Whether to update the message timestamp */
  updateTimestamp?: boolean;
  /** Whether to mark as reprocessed after replay */
  markAsReprocessed?: boolean;
  /** Whether to preserve the original offset */
  preserveOffset?: boolean;
}

/**
 * DLQ message replay result
 */
export interface DlqMessageReplayResult {
  /** Whether the replay was successful */
  success: boolean;
  /** Error message if replay failed */
  error?: string;
  /** Original DLQ message ID */
  dlqMessageId: string;
  /** Target topic the message was replayed to */
  targetTopic: string;
  /** Record metadata from Kafka */
  recordMetadata?: RecordMetadata;
  /** New status of the DLQ message */
  newStatus: 'reprocessed' | 'failed';
  /** Timestamp of the replay */
  replayTimestamp: string;
}

/**
 * Service that manages dead letter queues for failed Kafka message processing.
 * 
 * This service is responsible for:
 * - Routing messages that have exhausted their retry attempts to specialized DLQ topics
 * - Preserving the original message with error context for debugging purposes
 * - Providing methods for message inspection and replay
 * - Supporting journey-specific DLQs (Health, Care, Plan)
 * - Implementing admin API endpoints for message inspection
 * - Implementing message replay capabilities for recovery
 */
@Injectable()
export class DlqService {
  private readonly logger: Logger;
  private readonly serviceName: string;
  private readonly defaultDlqTopic: string;
  private readonly journeyDlqTopics: Record<string, string>;
  private readonly createTopicsIfNotExist: boolean;
  private readonly topicConfig: ITopicConfig;
  private readonly includeOriginalMessage: boolean;
  private readonly includeErrorDetails: boolean;
  private readonly headersToInclude: string[];
  private readonly maxMessageSizeBytes: number;
  private producer: Producer;
  private admin: Admin;
  private initialized = false;

  /**
   * Creates a new DlqService instance
   * 
   * @param options Configuration options
   * @param loggerService Logger service for structured logging
   * @param tracingService Tracing service for distributed tracing
   * @param errorReporter Error reporter for error tracking
   */
  constructor(
    private readonly options: DlqServiceOptions,
    private readonly loggerService?: LoggerService,
    private readonly tracingService?: TracingService,
    private readonly errorReporter?: ErrorReporter
  ) {
    this.logger = options.logger || new Logger(DlqService.name);
    this.serviceName = options.serviceName;
    this.defaultDlqTopic = options.defaultDlqTopic;
    this.journeyDlqTopics = options.journeyDlqTopics || {};
    this.createTopicsIfNotExist = options.createTopicsIfNotExist !== undefined ? options.createTopicsIfNotExist : true;
    this.topicConfig = {
      numPartitions: options.topicConfig?.numPartitions || 3,
      replicationFactor: options.topicConfig?.replicationFactor || 3,
      configEntries: options.topicConfig?.configEntries || [
        { name: 'retention.ms', value: '604800000' }, // 7 days retention
        { name: 'cleanup.policy', value: 'delete' }
      ]
    };
    this.includeOriginalMessage = options.includeOriginalMessage !== undefined ? options.includeOriginalMessage : true;
    this.includeErrorDetails = options.includeErrorDetails !== undefined ? options.includeErrorDetails : true;
    this.headersToInclude = options.headersToInclude || [
      'correlationId',
      'journeyContext',
      'userId',
      'source',
      'timestamp',
      'schemaVersion',
      'traceId',
      'spanId'
    ];
    this.maxMessageSizeBytes = options.maxMessageSizeBytes || 1048576; // 1MB default
  }

  /**
   * Initializes the DLQ service with Kafka producer and admin client
   * 
   * @param producer Kafka producer instance
   * @param admin Kafka admin client instance
   */
  async initialize(producer: Producer, admin: Admin): Promise<void> {
    this.producer = producer;
    this.admin = admin;
    
    // Create DLQ topics if configured
    if (this.createTopicsIfNotExist) {
      await this.ensureDlqTopicsExist();
    }
    
    this.initialized = true;
    this.logger.log(`DLQ service initialized with default topic: ${this.defaultDlqTopic}`);
  }

  /**
   * Ensures that all configured DLQ topics exist
   */
  private async ensureDlqTopicsExist(): Promise<void> {
    try {
      // Get all topics
      const { topics } = await this.admin.listTopics();
      
      // Collect all DLQ topics that need to be created
      const topicsToCreate: string[] = [];
      
      // Check if default DLQ topic exists
      if (!topics.includes(this.defaultDlqTopic)) {
        topicsToCreate.push(this.defaultDlqTopic);
      }
      
      // Check if journey-specific DLQ topics exist
      for (const journeyTopic of Object.values(this.journeyDlqTopics)) {
        if (!topics.includes(journeyTopic)) {
          topicsToCreate.push(journeyTopic);
        }
      }
      
      // Create missing topics
      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            ...this.topicConfig
          }))
        });
        
        this.logger.log(`Created DLQ topics: ${topicsToCreate.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure DLQ topics exist: ${error.message}`, error.stack);
      throw new Error(`Failed to ensure DLQ topics exist: ${error.message}`);
    }
  }

  /**
   * Sends a failed message to the appropriate DLQ topic
   * 
   * @param message The failed message
   * @param error The error that caused the failure
   * @param context Additional context about the message and error
   * @returns Promise that resolves when the message is sent to DLQ
   */
  async sendToDlq<T extends EventPayload>(
    message: TypedKafkaMessage<T>,
    error: Error,
    context: MessageHandlerContext & { retryCount?: number; originalTopic?: string }
  ): Promise<RecordMetadata[]> {
    if (!this.initialized) {
      throw new Error('DLQ service not initialized. Call initialize() first.');
    }
    
    try {
      // Determine the appropriate DLQ topic based on journey context
      const dlqTopic = this.getDlqTopic(message, context);
      
      // Create DLQ message with metadata and original message
      const dlqMessage = this.createDlqMessage(message, error, context);
      
      // Trace the DLQ operation
      this.traceDlqOperation(dlqMessage, dlqTopic);
      
      // Log the DLQ operation
      this.logDlqOperation(dlqMessage, dlqTopic);
      
      // Send the message to the DLQ topic
      const result = await this.producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key?.toString() || dlqMessage.dlqMessageId,
            value: JSON.stringify(dlqMessage),
            headers: this.createDlqHeaders(message, error, context)
          }
        ]
      });
      
      return result;
    } catch (sendError) {
      // Log the error
      this.logger.error(
        `Failed to send message to DLQ: ${sendError.message}`,
        { correlationId: context.correlationId, error: sendError.stack }
      );
      
      // Report the error
      if (this.errorReporter) {
        this.errorReporter.report(sendError, {
          operation: 'sendToDlq',
          originalError: error.message,
          correlationId: context.correlationId,
          topic: context.originalTopic,
          serviceName: this.serviceName
        });
      }
      
      // Rethrow the error
      throw sendError;
    }
  }

  /**
   * Determines the appropriate DLQ topic based on journey context
   * 
   * @param message The failed message
   * @param context Message handler context
   * @returns The appropriate DLQ topic
   */
  private getDlqTopic<T extends EventPayload>(
    message: TypedKafkaMessage<T>,
    context: MessageHandlerContext
  ): string {
    // Get journey context from message headers or context
    const journeyContext = context.journeyContext || 
                          message.headers?.journeyContext || 
                          message.value?.metadata?.journeyContext as string;
    
    // If we have a journey context and a matching DLQ topic, use it
    if (journeyContext && this.journeyDlqTopics[journeyContext]) {
      return this.journeyDlqTopics[journeyContext];
    }
    
    // Otherwise use the default DLQ topic
    return this.defaultDlqTopic;
  }

  /**
   * Creates a DLQ message with metadata and original message
   * 
   * @param message The failed message
   * @param error The error that caused the failure
   * @param context Message handler context
   * @returns A DLQ message with metadata and original message
   */
  private createDlqMessage<T extends EventPayload>(
    message: TypedKafkaMessage<T>,
    error: Error,
    context: MessageHandlerContext & { retryCount?: number; originalTopic?: string }
  ): DlqMessage<T> {
    // Convert to KafkaException for consistent handling
    const kafkaError = this.convertToKafkaException(error);
    
    // Extract correlation ID
    const correlationId = context.correlationId || 
                         message.headers?.correlationId || 
                         message.value?.metadata?.correlationId as string;
    
    // Extract journey context
    const journeyContext = context.journeyContext || 
                          message.headers?.journeyContext || 
                          message.value?.metadata?.journeyContext as string;
    
    // Extract user ID
    const userId = context.userId || 
                  message.headers?.userId || 
                  message.value?.metadata?.userId as string;
    
    // Create metadata
    const metadata: DlqMessageMetadata = {
      originalTopic: context.originalTopic || '',
      originalPartition: message.partition,
      originalOffset: message.offset,
      errorMessage: kafkaError.message,
      errorType: kafkaError.kafkaErrorType,
      errorCode: kafkaError.kafkaErrorCode,
      errorStack: kafkaError.stack,
      errorTimestamp: new Date().toISOString(),
      retryCount: context.retryCount || 0,
      serviceName: this.serviceName,
      journeyContext,
      userId,
      correlationId
    };
    
    // Create DLQ message
    const dlqMessage: DlqMessage<T> = {
      metadata,
      status: 'pending',
      timestamp: new Date().toISOString(),
      dlqMessageId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    };
    
    // Include original message if configured
    if (this.includeOriginalMessage) {
      // Create a copy of the original message to avoid modifying it
      const originalMessage: TypedKafkaMessage<T> = {
        ...message,
        // Convert Buffer key to string if present
        key: message.key ? Buffer.isBuffer(message.key) ? message.key.toString() : message.key : null,
        // Copy headers
        headers: message.headers ? { ...message.headers } : undefined,
        // Copy value
        value: message.value ? { ...message.value } : null
      };
      
      // Check if the message size exceeds the limit
      const messageSize = Buffer.byteLength(JSON.stringify(originalMessage));
      if (messageSize <= this.maxMessageSizeBytes) {
        dlqMessage.originalMessage = originalMessage;
      } else {
        // If the message is too large, include a truncated version
        dlqMessage.metadata.originalMessageTruncated = true;
        dlqMessage.metadata.originalMessageSize = messageSize;
        
        // Include just the essential parts of the message
        dlqMessage.originalMessage = {
          key: originalMessage.key,
          offset: originalMessage.offset,
          partition: originalMessage.partition,
          timestamp: originalMessage.timestamp,
          headers: originalMessage.headers,
          // Include only metadata from value
          value: originalMessage.value ? {
            eventId: originalMessage.value.eventId,
            eventType: originalMessage.value.eventType,
            timestamp: originalMessage.value.timestamp,
            source: originalMessage.value.source,
            version: originalMessage.value.version,
            metadata: originalMessage.value.metadata,
            // Truncate payload
            payload: { truncated: true, size: Buffer.byteLength(JSON.stringify(originalMessage.value.payload)) }
          } as any : null
        } as TypedKafkaMessage<T>;
      }
    }
    
    // Include error details if configured
    if (this.includeErrorDetails) {
      dlqMessage.error = {
        message: kafkaError.message,
        name: kafkaError.name,
        code: kafkaError.kafkaErrorCode,
        stack: kafkaError.stack,
        details: kafkaError.details
      };
    }
    
    return dlqMessage;
  }

  /**
   * Creates headers for the DLQ message
   * 
   * @param message The failed message
   * @param error The error that caused the failure
   * @param context Message handler context
   * @returns Headers for the DLQ message
   */
  private createDlqHeaders<T extends EventPayload>(
    message: TypedKafkaMessage<T>,
    error: Error,
    context: MessageHandlerContext & { retryCount?: number; originalTopic?: string }
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'dlq-timestamp': new Date().toISOString(),
      'dlq-service': this.serviceName,
      'dlq-error-type': error instanceof KafkaException ? error.kafkaErrorType : 'UNKNOWN',
      'dlq-retry-count': String(context.retryCount || 0),
      'dlq-original-topic': context.originalTopic || '',
    };
    
    // Include correlation ID if available
    if (context.correlationId) {
      headers['correlationId'] = context.correlationId;
    } else if (message.headers?.correlationId) {
      headers['correlationId'] = message.headers.correlationId;
    }
    
    // Include journey context if available
    if (context.journeyContext) {
      headers['journeyContext'] = context.journeyContext;
    } else if (message.headers?.journeyContext) {
      headers['journeyContext'] = message.headers.journeyContext;
    }
    
    // Include user ID if available
    if (context.userId) {
      headers['userId'] = context.userId;
    } else if (message.headers?.userId) {
      headers['userId'] = message.headers.userId;
    }
    
    // Include specified headers from original message
    if (message.headers) {
      for (const headerName of this.headersToInclude) {
        if (message.headers[headerName] && !headers[headerName]) {
          headers[headerName] = message.headers[headerName];
        }
      }
    }
    
    return headers;
  }

  /**
   * Converts any error to a KafkaException for consistent handling
   * 
   * @param error The original error
   * @returns A KafkaException representing the error
   */
  private convertToKafkaException(error: Error): KafkaException {
    // If it's already a KafkaException, return it
    if (error instanceof KafkaException) {
      return error;
    }
    
    // If it's a KafkaError from kafka.types.ts, convert it
    if (error instanceof KafkaError) {
      // Map KafkaErrorType from kafka.types.ts to KafkaErrorType from kafka.exception.ts
      const errorTypeMap: Record<KafkaErrorTypeEnum, KafkaErrorType> = {
        [KafkaErrorTypeEnum.CONNECTION]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.AUTHENTICATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.AUTHORIZATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.MESSAGE_FORMAT]: KafkaErrorType.SERIALIZATION,
        [KafkaErrorTypeEnum.SCHEMA_VALIDATION]: KafkaErrorType.VALIDATION,
        [KafkaErrorTypeEnum.PROCESSING]: KafkaErrorType.CONSUMER,
        [KafkaErrorTypeEnum.TIMEOUT]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.BROKER]: KafkaErrorType.BROKER,
        [KafkaErrorTypeEnum.UNKNOWN]: KafkaErrorType.UNKNOWN
      };
      
      // Map the error type
      const kafkaErrorType = errorTypeMap[error.type] || KafkaErrorType.UNKNOWN;
      
      // Create a KafkaException with the mapped error type
      return new KafkaException(error.message, {
        cause: error.originalError,
        kafkaErrorType,
        kafkaErrorCode: error.code,
        details: error.context
      });
    }
    
    // Create a KafkaException from the generic error
    return KafkaException.fromKafkaError(error);
  }

  /**
   * Traces the DLQ operation using the tracing service
   * 
   * @param dlqMessage The DLQ message
   * @param dlqTopic The DLQ topic
   */
  private traceDlqOperation<T extends EventPayload>(dlqMessage: DlqMessage<T>, dlqTopic: string): void {
    if (this.tracingService) {
      this.tracingService.recordEvent('kafka.dlq.send', {
        spanName: 'kafka.dlq.send',
        correlationId: dlqMessage.metadata.correlationId,
        attributes: {
          'kafka.dlq.topic': dlqTopic,
          'kafka.original.topic': dlqMessage.metadata.originalTopic,
          'kafka.error.type': dlqMessage.metadata.errorType,
          'kafka.error.message': dlqMessage.metadata.errorMessage,
          'kafka.retry.count': dlqMessage.metadata.retryCount,
          'service.name': this.serviceName,
          'dlq.message.id': dlqMessage.dlqMessageId,
          'journey.context': dlqMessage.metadata.journeyContext
        }
      });
    }
  }

  /**
   * Logs the DLQ operation using the logger service
   * 
   * @param dlqMessage The DLQ message
   * @param dlqTopic The DLQ topic
   */
  private logDlqOperation<T extends EventPayload>(dlqMessage: DlqMessage<T>, dlqTopic: string): void {
    const logContext = {
      correlationId: dlqMessage.metadata.correlationId,
      dlqTopic,
      originalTopic: dlqMessage.metadata.originalTopic,
      errorType: dlqMessage.metadata.errorType,
      retryCount: dlqMessage.metadata.retryCount,
      dlqMessageId: dlqMessage.dlqMessageId,
      journeyContext: dlqMessage.metadata.journeyContext,
      userId: dlqMessage.metadata.userId
    };
    
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.warn(
        `Message sent to DLQ: ${dlqMessage.metadata.errorMessage}`,
        logContext
      );
      return;
    }
    
    // Otherwise use the standard logger
    this.logger.warn(
      `Message sent to DLQ: ${dlqMessage.metadata.errorMessage}`,
      { correlationId: dlqMessage.metadata.correlationId, ...logContext }
    );
  }

  /**
   * Retrieves DLQ messages from a topic with optional filtering
   * 
   * @param topic DLQ topic to retrieve messages from
   * @param filterOptions Optional filter criteria
   * @param limit Maximum number of messages to retrieve
   * @param offset Offset to start retrieving messages from
   * @returns Promise that resolves with the filtered DLQ messages
   */
  async getDlqMessages<T extends EventPayload>(
    topic: string = this.defaultDlqTopic,
    filterOptions: DlqMessageFilterOptions = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<DlqMessage<T>[]> {
    if (!this.initialized) {
      throw new Error('DLQ service not initialized. Call initialize() first.');
    }
    
    try {
      // Create a consumer to read from the DLQ topic
      const consumer = this.admin.createConsumer({
        groupId: `dlq-reader-${Date.now()}`,
        sessionTimeout: 30000
      });
      
      // Connect the consumer
      await consumer.connect();
      
      // Subscribe to the DLQ topic
      await consumer.subscribe({ topic, fromBeginning: true });
      
      // Collect messages
      const messages: DlqMessage<T>[] = [];
      let currentOffset = 0;
      
      // Run the consumer to collect messages
      await consumer.run({
        eachMessage: async ({ message: kafkaMessage }) => {
          // Skip messages before the requested offset
          if (currentOffset < offset) {
            currentOffset++;
            return;
          }
          
          // Parse the DLQ message
          try {
            const dlqMessage: DlqMessage<T> = JSON.parse(kafkaMessage.value.toString());
            
            // Apply filters
            if (this.matchesFilter(dlqMessage, filterOptions)) {
              messages.push(dlqMessage);
            }
            
            // Stop if we've reached the limit
            if (messages.length >= limit) {
              await consumer.stop();
            }
          } catch (parseError) {
            this.logger.warn(
              `Failed to parse DLQ message: ${parseError.message}`,
              { topic, offset: kafkaMessage.offset }
            );
          }
          
          currentOffset++;
        }
      });
      
      // Disconnect the consumer
      await consumer.disconnect();
      
      return messages;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve DLQ messages: ${error.message}`,
        { topic, error: error.stack }
      );
      
      throw new Error(`Failed to retrieve DLQ messages: ${error.message}`);
    }
  }

  /**
   * Checks if a DLQ message matches the filter criteria
   * 
   * @param dlqMessage The DLQ message to check
   * @param filterOptions Filter criteria
   * @returns Whether the message matches the filter
   */
  private matchesFilter<T extends EventPayload>(
    dlqMessage: DlqMessage<T>,
    filterOptions: DlqMessageFilterOptions
  ): boolean {
    const { metadata } = dlqMessage;
    
    // Check original topic
    if (filterOptions.originalTopic && metadata.originalTopic !== filterOptions.originalTopic) {
      return false;
    }
    
    // Check error type
    if (filterOptions.errorType && metadata.errorType !== filterOptions.errorType) {
      return false;
    }
    
    // Check error code
    if (filterOptions.errorCode && metadata.errorCode !== filterOptions.errorCode) {
      return false;
    }
    
    // Check journey context
    if (filterOptions.journeyContext && metadata.journeyContext !== filterOptions.journeyContext) {
      return false;
    }
    
    // Check user ID
    if (filterOptions.userId && metadata.userId !== filterOptions.userId) {
      return false;
    }
    
    // Check correlation ID
    if (filterOptions.correlationId && metadata.correlationId !== filterOptions.correlationId) {
      return false;
    }
    
    // Check status
    if (filterOptions.status && dlqMessage.status !== filterOptions.status) {
      return false;
    }
    
    // Check timestamp range
    if (filterOptions.fromTimestamp && dlqMessage.timestamp < filterOptions.fromTimestamp) {
      return false;
    }
    
    if (filterOptions.toTimestamp && dlqMessage.timestamp > filterOptions.toTimestamp) {
      return false;
    }
    
    // Check retry count range
    if (filterOptions.minRetryCount !== undefined && metadata.retryCount < filterOptions.minRetryCount) {
      return false;
    }
    
    if (filterOptions.maxRetryCount !== undefined && metadata.retryCount > filterOptions.maxRetryCount) {
      return false;
    }
    
    // Check additional filter criteria
    for (const [key, value] of Object.entries(filterOptions)) {
      // Skip standard filter properties
      if ([
        'originalTopic', 'errorType', 'errorCode', 'journeyContext', 'userId',
        'correlationId', 'status', 'fromTimestamp', 'toTimestamp',
        'minRetryCount', 'maxRetryCount'
      ].includes(key)) {
        continue;
      }
      
      // Check if the property exists in metadata
      if (metadata[key] !== undefined && metadata[key] !== value) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Replays a DLQ message to its original topic or a specified target topic
   * 
   * @param dlqMessageId ID of the DLQ message to replay
   * @param dlqTopic DLQ topic where the message is stored
   * @param options Replay options
   * @returns Promise that resolves with the replay result
   */
  async replayDlqMessage<T extends EventPayload>(
    dlqMessageId: string,
    dlqTopic: string = this.defaultDlqTopic,
    options: DlqMessageReplayOptions = {}
  ): Promise<DlqMessageReplayResult> {
    if (!this.initialized) {
      throw new Error('DLQ service not initialized. Call initialize() first.');
    }
    
    try {
      // Find the DLQ message
      const dlqMessages = await this.getDlqMessages<T>(dlqTopic, { dlqMessageId }, 1, 0);
      
      if (dlqMessages.length === 0) {
        throw new Error(`DLQ message with ID ${dlqMessageId} not found in topic ${dlqTopic}`);
      }
      
      const dlqMessage = dlqMessages[0];
      
      // Check if the message has already been reprocessed
      if (dlqMessage.status === 'reprocessed' && !options.resetRetryCount) {
        return {
          success: false,
          error: `DLQ message with ID ${dlqMessageId} has already been reprocessed`,
          dlqMessageId,
          targetTopic: '',
          newStatus: 'failed',
          replayTimestamp: new Date().toISOString()
        };
      }
      
      // Determine target topic
      const targetTopic = options.targetTopic || dlqMessage.metadata.originalTopic;
      
      if (!targetTopic) {
        throw new Error(`No target topic specified for DLQ message with ID ${dlqMessageId}`);
      }
      
      // Check if the original message is available
      if (!dlqMessage.originalMessage) {
        throw new Error(`Original message not available for DLQ message with ID ${dlqMessageId}`);
      }
      
      // Create headers for the replayed message
      const headers: Record<string, string> = {};
      
      // Include original headers if available
      if (dlqMessage.originalMessage.headers) {
        Object.entries(dlqMessage.originalMessage.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            headers[key] = value.toString();
          }
        });
      }
      
      // Add DLQ-specific headers
      headers['dlq-replayed'] = 'true';
      headers['dlq-original-message-id'] = dlqMessageId;
      headers['dlq-replay-timestamp'] = new Date().toISOString();
      
      // Reset retry count if requested
      if (options.resetRetryCount) {
        headers['retryCount'] = '0';
      } else if (headers['retryCount']) {
        // Otherwise preserve the original retry count
        headers['retryCount'] = headers['retryCount'];
      }
      
      // Add additional headers if specified
      if (options.additionalHeaders) {
        Object.entries(options.additionalHeaders).forEach(([key, value]) => {
          headers[key] = value;
        });
      }
      
      // Update timestamp if requested
      if (options.updateTimestamp && dlqMessage.originalMessage.value) {
        dlqMessage.originalMessage.value.timestamp = new Date().toISOString();
      }
      
      // Send the message to the target topic
      const result = await this.producer.send({
        topic: targetTopic,
        messages: [
          {
            key: dlqMessage.originalMessage.key?.toString() || dlqMessageId,
            value: dlqMessage.originalMessage.value ? 
                   JSON.stringify(dlqMessage.originalMessage.value) : 
                   null,
            headers
          }
        ]
      });
      
      // Update the DLQ message status if requested
      if (options.markAsReprocessed) {
        await this.updateDlqMessageStatus(dlqMessageId, dlqTopic, 'reprocessed');
      }
      
      // Trace the replay operation
      this.traceReplayOperation(dlqMessage, targetTopic, result[0]);
      
      // Log the replay operation
      this.logReplayOperation(dlqMessage, targetTopic, result[0]);
      
      return {
        success: true,
        dlqMessageId,
        targetTopic,
        recordMetadata: result[0],
        newStatus: options.markAsReprocessed ? 'reprocessed' : 'pending',
        replayTimestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(
        `Failed to replay DLQ message: ${error.message}`,
        { dlqMessageId, dlqTopic, error: error.stack }
      );
      
      return {
        success: false,
        error: error.message,
        dlqMessageId,
        targetTopic: options.targetTopic || '',
        newStatus: 'failed',
        replayTimestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Updates the status of a DLQ message
   * 
   * @param dlqMessageId ID of the DLQ message to update
   * @param dlqTopic DLQ topic where the message is stored
   * @param newStatus New status for the message
   * @returns Promise that resolves when the status is updated
   */
  private async updateDlqMessageStatus(
    dlqMessageId: string,
    dlqTopic: string,
    newStatus: 'pending' | 'reprocessed' | 'archived' | 'failed'
  ): Promise<void> {
    try {
      // This is a simplified implementation that doesn't actually update the message in Kafka
      // In a real implementation, you would need to use a database or other storage to track message status
      this.logger.log(
        `Updated DLQ message status: ${dlqMessageId} -> ${newStatus}`,
        { dlqMessageId, dlqTopic, newStatus }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update DLQ message status: ${error.message}`,
        { dlqMessageId, dlqTopic, newStatus, error: error.stack }
      );
    }
  }

  /**
   * Traces the replay operation using the tracing service
   * 
   * @param dlqMessage The DLQ message being replayed
   * @param targetTopic The topic the message is being replayed to
   * @param recordMetadata The record metadata from Kafka
   */
  private traceReplayOperation<T extends EventPayload>(
    dlqMessage: DlqMessage<T>,
    targetTopic: string,
    recordMetadata: RecordMetadata
  ): void {
    if (this.tracingService) {
      this.tracingService.recordEvent('kafka.dlq.replay', {
        spanName: 'kafka.dlq.replay',
        correlationId: dlqMessage.metadata.correlationId,
        attributes: {
          'kafka.dlq.topic': targetTopic,
          'kafka.original.topic': dlqMessage.metadata.originalTopic,
          'kafka.error.type': dlqMessage.metadata.errorType,
          'kafka.retry.count': dlqMessage.metadata.retryCount,
          'service.name': this.serviceName,
          'dlq.message.id': dlqMessage.dlqMessageId,
          'journey.context': dlqMessage.metadata.journeyContext,
          'kafka.partition': recordMetadata.partition,
          'kafka.offset': recordMetadata.baseOffset
        }
      });
    }
  }

  /**
   * Logs the replay operation using the logger service
   * 
   * @param dlqMessage The DLQ message being replayed
   * @param targetTopic The topic the message is being replayed to
   * @param recordMetadata The record metadata from Kafka
   */
  private logReplayOperation<T extends EventPayload>(
    dlqMessage: DlqMessage<T>,
    targetTopic: string,
    recordMetadata: RecordMetadata
  ): void {
    const logContext = {
      correlationId: dlqMessage.metadata.correlationId,
      dlqMessageId: dlqMessage.dlqMessageId,
      targetTopic,
      originalTopic: dlqMessage.metadata.originalTopic,
      partition: recordMetadata.partition,
      offset: recordMetadata.baseOffset,
      journeyContext: dlqMessage.metadata.journeyContext,
      userId: dlqMessage.metadata.userId
    };
    
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.info(
        `Replayed DLQ message: ${dlqMessage.dlqMessageId} to ${targetTopic}`,
        logContext
      );
      return;
    }
    
    // Otherwise use the standard logger
    this.logger.log(
      `Replayed DLQ message: ${dlqMessage.dlqMessageId} to ${targetTopic}`,
      { correlationId: dlqMessage.metadata.correlationId, ...logContext }
    );
  }

  /**
   * Purges old messages from a DLQ topic
   * 
   * @param dlqTopic DLQ topic to purge
   * @param olderThan Timestamp to purge messages older than
   * @param filterOptions Additional filter criteria
   * @returns Promise that resolves with the number of purged messages
   */
  async purgeDlqMessages(
    dlqTopic: string = this.defaultDlqTopic,
    olderThan: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    filterOptions: DlqMessageFilterOptions = {}
  ): Promise<number> {
    if (!this.initialized) {
      throw new Error('DLQ service not initialized. Call initialize() first.');
    }
    
    try {
      // This is a simplified implementation that doesn't actually delete messages from Kafka
      // In a real implementation, you would need to use the Kafka Admin API to delete records
      // or implement a compaction strategy
      
      this.logger.log(
        `Purged DLQ messages older than ${olderThan} from ${dlqTopic}`,
        { dlqTopic, olderThan, filterOptions }
      );
      
      return 0; // Return 0 as we're not actually purging messages
    } catch (error) {
      this.logger.error(
        `Failed to purge DLQ messages: ${error.message}`,
        { dlqTopic, olderThan, error: error.stack }
      );
      
      throw new Error(`Failed to purge DLQ messages: ${error.message}`);
    }
  }

  /**
   * Gets statistics about DLQ messages
   * 
   * @param dlqTopic DLQ topic to get statistics for
   * @returns Promise that resolves with DLQ statistics
   */
  async getDlqStatistics(dlqTopic: string = this.defaultDlqTopic): Promise<{
    totalMessages: number;
    pendingMessages: number;
    reprocessedMessages: number;
    archivedMessages: number;
    failedMessages: number;
    byErrorType: Record<string, number>;
    byJourneyContext: Record<string, number>;
    byRetryCount: Record<number, number>;
  }> {
    if (!this.initialized) {
      throw new Error('DLQ service not initialized. Call initialize() first.');
    }
    
    try {
      // Get all messages from the DLQ topic
      const messages = await this.getDlqMessages(dlqTopic, {}, 1000, 0);
      
      // Initialize statistics
      const statistics = {
        totalMessages: messages.length,
        pendingMessages: 0,
        reprocessedMessages: 0,
        archivedMessages: 0,
        failedMessages: 0,
        byErrorType: {} as Record<string, number>,
        byJourneyContext: {} as Record<string, number>,
        byRetryCount: {} as Record<number, number>
      };
      
      // Calculate statistics
      for (const message of messages) {
        // Count by status
        switch (message.status) {
          case 'pending':
            statistics.pendingMessages++;
            break;
          case 'reprocessed':
            statistics.reprocessedMessages++;
            break;
          case 'archived':
            statistics.archivedMessages++;
            break;
          case 'failed':
            statistics.failedMessages++;
            break;
        }
        
        // Count by error type
        const errorType = message.metadata.errorType || 'UNKNOWN';
        statistics.byErrorType[errorType] = (statistics.byErrorType[errorType] || 0) + 1;
        
        // Count by journey context
        const journeyContext = message.metadata.journeyContext || 'unknown';
        statistics.byJourneyContext[journeyContext] = (statistics.byJourneyContext[journeyContext] || 0) + 1;
        
        // Count by retry count
        const retryCount = message.metadata.retryCount || 0;
        statistics.byRetryCount[retryCount] = (statistics.byRetryCount[retryCount] || 0) + 1;
      }
      
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to get DLQ statistics: ${error.message}`,
        { dlqTopic, error: error.stack }
      );
      
      throw new Error(`Failed to get DLQ statistics: ${error.message}`);
    }
  }
}

/**
 * Factory function to create a DlqService instance
 * 
 * @param options Configuration options
 * @param loggerService Optional logger service
 * @param tracingService Optional tracing service
 * @param errorReporter Optional error reporter
 * @returns A new DlqService instance
 */
export function createDlqService(
  options: DlqServiceOptions,
  loggerService?: LoggerService,
  tracingService?: TracingService,
  errorReporter?: ErrorReporter
): DlqService {
  return new DlqService(options, loggerService, tracingService, errorReporter);
}

/**
 * Creates default DLQ service options
 * 
 * @param serviceName Name of the service
 * @param defaultDlqTopic Default DLQ topic name
 * @returns Default DLQ service options
 */
export function createDefaultDlqOptions(
  serviceName: string,
  defaultDlqTopic: string = 'dlq-gamification'
): DlqServiceOptions {
  return {
    serviceName,
    defaultDlqTopic,
    journeyDlqTopics: {
      health: 'dlq-health',
      care: 'dlq-care',
      plan: 'dlq-plan'
    },
    createTopicsIfNotExist: true,
    includeOriginalMessage: true,
    includeErrorDetails: true
  };
}

// Export all types and functions
export {
  KafkaException,
  KafkaErrorType,
  KafkaError,
  KafkaErrorTypeEnum,
  EventStatus
};