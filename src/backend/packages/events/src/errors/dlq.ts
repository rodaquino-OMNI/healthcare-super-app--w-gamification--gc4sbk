import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '../kafka/kafka.service';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { JourneyType } from '../interfaces/journey-events.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { KafkaEvent } from '../interfaces/kafka-event.interface';

/**
 * Error types for categorizing DLQ entries
 */
export enum DlqErrorType {
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  SCHEMA = 'schema',
  SYSTEM = 'system',
  NETWORK = 'network',
  DATABASE = 'database',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Status of a DLQ entry
 */
export enum DlqEntryStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REPROCESSED = 'reprocessed',
  IGNORED = 'ignored'
}

/**
 * Actions that can be performed on a DLQ entry
 */
export enum DlqProcessAction {
  RESOLVE = 'resolve',
  REPROCESS = 'reprocess',
  IGNORE = 'ignore'
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  timestamp: Date;
  error: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for DLQ entries
 */
export interface IDlqEntry {
  id: string;
  eventId: string;
  userId?: string;
  journey?: JourneyType;
  eventType: string;
  payload: Record<string, any>;
  errorType: DlqErrorType;
  errorMessage: string;
  errorStack?: string;
  retryAttempts: RetryAttempt[];
  status: DlqEntryStatus;
  originalTopic: string;
  kafkaMetadata?: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers?: Record<string, string>;
  };
  processingMetadata?: Record<string, any>;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

/**
 * Entity for storing DLQ entries in the database
 */
export class DlqEntry implements IDlqEntry {
  id: string;
  eventId: string;
  userId?: string;
  journey?: JourneyType;
  eventType: string;
  payload: Record<string, any>;
  errorType: DlqErrorType;
  errorMessage: string;
  errorStack?: string;
  retryAttempts: RetryAttempt[];
  status: DlqEntryStatus;
  originalTopic: string;
  kafkaMetadata?: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers?: Record<string, string>;
  };
  processingMetadata?: Record<string, any>;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

/**
 * Options for sending an event to the DLQ
 */
export interface SendToDlqOptions {
  errorType: DlqErrorType;
  errorMessage: string;
  errorStack?: string;
  retryAttempts?: RetryAttempt[];
  originalTopic: string;
  kafkaMetadata?: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers?: Record<string, string>;
  };
  processingMetadata?: Record<string, any>;
}

/**
 * Options for querying DLQ entries
 */
export interface QueryDlqOptions {
  eventId?: string;
  userId?: string;
  journey?: JourneyType;
  eventType?: string;
  errorType?: DlqErrorType;
  status?: DlqEntryStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
}

/**
 * Statistics about DLQ entries
 */
export interface DlqStatistics {
  totalEntries: number;
  byErrorType: Record<DlqErrorType, number>;
  byJourney: Record<JourneyType, number>;
  byStatus: Record<DlqEntryStatus, number>;
  byTimeRange: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  averageTimeInQueue: number; // in milliseconds
}

/**
 * Service for managing Dead Letter Queue (DLQ) for failed events
 */
@Injectable()
export class DlqService {
  private readonly logger: Logger;
  private readonly dlqTopicPrefix: string;
  
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService,
    private readonly loggerService: LoggerService,
    @InjectRepository(DlqEntry)
    private readonly dlqRepository: Repository<DlqEntry>
  ) {
    this.logger = new Logger(DlqService.name);
    this.dlqTopicPrefix = this.configService.get<string>('kafka.dlqTopicPrefix', 'dlq.');
  }

  /**
   * Sends a failed event to the appropriate DLQ topic
   * 
   * @param event The event that failed processing
   * @param options Options for sending to DLQ
   * @returns The created DLQ entry
   */
  async sendToDlq<T extends IBaseEvent>(event: T, options: SendToDlqOptions): Promise<DlqEntry> {
    const span = this.tracingService.startSpan('DlqService.sendToDlq');
    
    try {
      // Create DLQ entry
      const dlqEntry = new DlqEntry();
      dlqEntry.id = this.generateId();
      dlqEntry.eventId = event.eventId;
      dlqEntry.userId = event.userId;
      dlqEntry.journey = event.journey;
      dlqEntry.eventType = event.type;
      dlqEntry.payload = event.data;
      dlqEntry.errorType = options.errorType;
      dlqEntry.errorMessage = options.errorMessage;
      dlqEntry.errorStack = options.errorStack;
      dlqEntry.retryAttempts = options.retryAttempts || [];
      dlqEntry.status = DlqEntryStatus.PENDING;
      dlqEntry.originalTopic = options.originalTopic;
      dlqEntry.kafkaMetadata = options.kafkaMetadata;
      dlqEntry.processingMetadata = options.processingMetadata;
      dlqEntry.createdAt = new Date();
      dlqEntry.updatedAt = new Date();

      // Save to database
      await this.dlqRepository.save(dlqEntry);

      // Send to Kafka DLQ topic
      const dlqTopic = this.getDlqTopicForJourney(event.journey);
      await this.kafkaService.produce(dlqTopic, dlqEntry.id, dlqEntry);

      this.loggerService.log(
        `Event sent to DLQ: ${dlqEntry.eventType} (${dlqEntry.eventId})`,
        {
          eventId: dlqEntry.eventId,
          userId: dlqEntry.userId,
          journey: dlqEntry.journey,
          errorType: dlqEntry.errorType,
          dlqTopic
        },
        'DlqService'
      );

      return dlqEntry;
    } catch (error) {
      this.loggerService.error(
        `Failed to send event to DLQ: ${error.message}`,
        error.stack,
        {
          eventId: event.eventId,
          userId: event.userId,
          journey: event.journey,
          errorType: options.errorType
        },
        'DlqService'
      );
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Sends a failed Kafka event to the appropriate DLQ topic
   * 
   * @param kafkaEvent The Kafka event that failed processing
   * @param error The error that occurred
   * @param retryAttempts Previous retry attempts
   * @returns The created DLQ entry
   */
  async sendKafkaEventToDlq(kafkaEvent: KafkaEvent, error: Error, retryAttempts: RetryAttempt[] = []): Promise<DlqEntry> {
    const errorType = this.classifyError(error);
    
    return this.sendToDlq(kafkaEvent.event, {
      errorType,
      errorMessage: error.message,
      errorStack: error.stack,
      retryAttempts,
      originalTopic: kafkaEvent.topic,
      kafkaMetadata: {
        topic: kafkaEvent.topic,
        partition: kafkaEvent.partition,
        offset: kafkaEvent.offset,
        timestamp: kafkaEvent.timestamp,
        headers: kafkaEvent.headers
      }
    });
  }

  /**
   * Retrieves DLQ entries based on query options
   * 
   * @param options Query options
   * @returns Array of DLQ entries
   */
  async queryDlqEntries(options: QueryDlqOptions): Promise<[DlqEntry[], number]> {
    const {
      eventId,
      userId,
      journey,
      eventType,
      errorType,
      status,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 20
    } = options;

    const queryBuilder = this.dlqRepository.createQueryBuilder('dlq');

    // Apply filters
    if (eventId) queryBuilder.andWhere('dlq.eventId = :eventId', { eventId });
    if (userId) queryBuilder.andWhere('dlq.userId = :userId', { userId });
    if (journey) queryBuilder.andWhere('dlq.journey = :journey', { journey });
    if (eventType) queryBuilder.andWhere('dlq.eventType = :eventType', { eventType });
    if (errorType) queryBuilder.andWhere('dlq.errorType = :errorType', { errorType });
    if (status) queryBuilder.andWhere('dlq.status = :status', { status });
    if (createdAfter) queryBuilder.andWhere('dlq.createdAt >= :createdAfter', { createdAfter });
    if (createdBefore) queryBuilder.andWhere('dlq.createdAt <= :createdBefore', { createdBefore });

    // Apply pagination
    queryBuilder
      .orderBy('dlq.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Execute query
    return queryBuilder.getManyAndCount();
  }

  /**
   * Retrieves a single DLQ entry by ID
   * 
   * @param id DLQ entry ID
   * @returns DLQ entry or null if not found
   */
  async getDlqEntryById(id: string): Promise<DlqEntry | null> {
    return this.dlqRepository.findOne({ where: { id } });
  }

  /**
   * Processes a DLQ entry (resolve, reprocess, or ignore)
   * 
   * @param id DLQ entry ID
   * @param action Action to perform
   * @param comments Optional comments about the action
   * @param overridePayload Optional payload to use when reprocessing
   * @returns The updated DLQ entry
   */
  async processDlqEntry(
    id: string,
    action: DlqProcessAction,
    comments?: string,
    overridePayload?: Record<string, any>
  ): Promise<DlqEntry> {
    const span = this.tracingService.startSpan('DlqService.processDlqEntry');
    
    try {
      const dlqEntry = await this.getDlqEntryById(id);
      
      if (!dlqEntry) {
        throw new Error(`DLQ entry not found: ${id}`);
      }

      if (dlqEntry.status !== DlqEntryStatus.PENDING) {
        throw new Error(`DLQ entry already processed: ${id}, status: ${dlqEntry.status}`);
      }

      switch (action) {
        case DlqProcessAction.RESOLVE:
          dlqEntry.status = DlqEntryStatus.RESOLVED;
          dlqEntry.resolvedAt = new Date();
          dlqEntry.comments = comments;
          break;

        case DlqProcessAction.REPROCESS:
          // Prepare event for reprocessing
          const eventToReprocess: IBaseEvent = {
            eventId: dlqEntry.eventId,
            userId: dlqEntry.userId,
            journey: dlqEntry.journey,
            type: dlqEntry.eventType,
            data: overridePayload || dlqEntry.payload,
            timestamp: new Date().toISOString(),
            version: '1.0.0', // Default version
            source: 'dlq-reprocessing'
          };

          // Send to original topic
          await this.kafkaService.produce(dlqEntry.originalTopic, eventToReprocess.eventId, eventToReprocess);

          // Update DLQ entry
          dlqEntry.status = DlqEntryStatus.REPROCESSED;
          dlqEntry.resolvedAt = new Date();
          dlqEntry.comments = comments;
          dlqEntry.processingMetadata = {
            ...dlqEntry.processingMetadata,
            reprocessedAt: new Date(),
            reprocessedWith: overridePayload ? 'modified_payload' : 'original_payload'
          };
          break;

        case DlqProcessAction.IGNORE:
          dlqEntry.status = DlqEntryStatus.IGNORED;
          dlqEntry.resolvedAt = new Date();
          dlqEntry.comments = comments;
          break;

        default:
          throw new Error(`Invalid DLQ process action: ${action}`);
      }

      dlqEntry.updatedAt = new Date();
      await this.dlqRepository.save(dlqEntry);

      this.loggerService.log(
        `DLQ entry processed: ${dlqEntry.id}, action: ${action}`,
        {
          dlqEntryId: dlqEntry.id,
          eventId: dlqEntry.eventId,
          userId: dlqEntry.userId,
          journey: dlqEntry.journey,
          action,
          status: dlqEntry.status
        },
        'DlqService'
      );

      return dlqEntry;
    } catch (error) {
      this.loggerService.error(
        `Failed to process DLQ entry: ${error.message}`,
        error.stack,
        { dlqEntryId: id, action },
        'DlqService'
      );
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves statistics about DLQ entries
   * 
   * @returns DLQ statistics
   */
  async getDlqStatistics(): Promise<DlqStatistics> {
    // Get total count
    const totalEntries = await this.dlqRepository.count();

    // Get counts by error type
    const byErrorType = {} as Record<DlqErrorType, number>;
    for (const errorType of Object.values(DlqErrorType)) {
      byErrorType[errorType] = await this.dlqRepository.count({
        where: { errorType }
      });
    }

    // Get counts by journey
    const byJourney = {} as Record<JourneyType, number>;
    for (const journey of Object.values(JourneyType)) {
      byJourney[journey] = await this.dlqRepository.count({
        where: { journey }
      });
    }

    // Get counts by status
    const byStatus = {} as Record<DlqEntryStatus, number>;
    for (const status of Object.values(DlqEntryStatus)) {
      byStatus[status] = await this.dlqRepository.count({
        where: { status }
      });
    }

    // Get counts by time range
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const byTimeRange = {
      last24Hours: await this.dlqRepository.count({
        where: { createdAt: { $gte: last24Hours } }
      }),
      last7Days: await this.dlqRepository.count({
        where: { createdAt: { $gte: last7Days } }
      }),
      last30Days: await this.dlqRepository.count({
        where: { createdAt: { $gte: last30Days } }
      })
    };

    // Calculate average time in queue for resolved entries
    const resolvedEntries = await this.dlqRepository.find({
      where: [
        { status: DlqEntryStatus.RESOLVED },
        { status: DlqEntryStatus.REPROCESSED }
      ],
      select: ['createdAt', 'resolvedAt']
    });

    let totalTimeInQueue = 0;
    for (const entry of resolvedEntries) {
      if (entry.resolvedAt) {
        totalTimeInQueue += entry.resolvedAt.getTime() - entry.createdAt.getTime();
      }
    }

    const averageTimeInQueue = resolvedEntries.length > 0
      ? totalTimeInQueue / resolvedEntries.length
      : 0;

    return {
      totalEntries,
      byErrorType,
      byJourney,
      byStatus,
      byTimeRange,
      averageTimeInQueue
    };
  }

  /**
   * Purges old resolved DLQ entries
   * 
   * @param olderThan Date threshold for purging
   * @returns Number of purged entries
   */
  async purgeResolvedEntries(olderThan: Date): Promise<number> {
    const result = await this.dlqRepository.delete({
      status: { $in: [DlqEntryStatus.RESOLVED, DlqEntryStatus.REPROCESSED, DlqEntryStatus.IGNORED] },
      resolvedAt: { $lt: olderThan }
    });

    this.loggerService.log(
      `Purged ${result.affected || 0} resolved DLQ entries older than ${olderThan.toISOString()}`,
      { olderThan, affectedCount: result.affected },
      'DlqService'
    );

    return result.affected || 0;
  }

  /**
   * Classifies an error into a DLQ error type
   * 
   * @param error The error to classify
   * @returns The classified error type
   */
  private classifyError(error: Error): DlqErrorType {
    if (!error) return DlqErrorType.UNKNOWN;

    // Check error name for classification
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('validation') || errorMessage.includes('validation')) {
      return DlqErrorType.VALIDATION;
    }

    if (errorName.includes('schema') || errorMessage.includes('schema')) {
      return DlqErrorType.SCHEMA;
    }

    if (errorName.includes('timeout') || errorMessage.includes('timeout')) {
      return DlqErrorType.TIMEOUT;
    }

    if (errorName.includes('network') || errorMessage.includes('network') ||
        errorName.includes('connection') || errorMessage.includes('connection')) {
      return DlqErrorType.NETWORK;
    }

    if (errorName.includes('database') || errorMessage.includes('database') ||
        errorName.includes('db') || errorMessage.includes('db') ||
        errorName.includes('sql') || errorMessage.includes('sql')) {
      return DlqErrorType.DATABASE;
    }

    if (errorName.includes('system') || errorMessage.includes('system')) {
      return DlqErrorType.SYSTEM;
    }

    return DlqErrorType.PROCESSING;
  }

  /**
   * Gets the DLQ topic name for a specific journey
   * 
   * @param journey The journey type
   * @returns The DLQ topic name
   */
  private getDlqTopicForJourney(journey?: JourneyType): string {
    if (!journey) {
      return `${this.dlqTopicPrefix}events`;
    }
    
    return `${this.dlqTopicPrefix}${journey.toLowerCase()}`;
  }

  /**
   * Generates a unique ID for a DLQ entry
   * 
   * @returns A unique ID
   */
  private generateId(): string {
    return `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}