import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

// Import from @austa packages
import { KafkaMessage, KafkaProducer, KafkaHeaders } from '@austa/events/kafka';
import { TransactionService } from '@austa/database/transactions';
import { DatabaseException } from '@austa/database/errors';
import { 
  BusinessRuleViolationError, 
  ExternalApiError, 
  InternalServerError 
} from '@austa/errors/categories';

// Import from local files
import { DlqEntry } from './entities/dlq-entry.entity';
import { DlqEntryStatus } from './types/dlq.types';
import { RetryStrategy } from './retry.strategy';

/**
 * Service that manages dead letter queues for failed Kafka message processing.
 * Routes messages that have exhausted their retry attempts to specialized DLQ topics,
 * preserves the original message with error context, and provides methods for
 * message inspection and replay.
 */
@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);
  private readonly dlqTopicPrefix: string;
  
  constructor(
    @InjectRepository(DlqEntry)
    private readonly dlqRepository: Repository<DlqEntry>,
    private readonly kafkaProducer: KafkaProducer,
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
  ) {
    this.dlqTopicPrefix = this.configService.get<string>('kafka.dlqTopicPrefix', 'dlq-');
  }

  /**
   * Sends a failed message to the appropriate dead letter queue topic and stores it in the database
   * 
   * @param message The original Kafka message that failed processing
   * @param error The error that caused the message processing to fail
   * @param topic The original topic the message was consumed from
   * @param consumerGroup The consumer group that was processing the message
   * @param retryCount The number of retry attempts that were made
   * @returns The created DLQ entry
   */
  async sendToDlq(
    message: KafkaMessage,
    error: Error,
    topic: string,
    consumerGroup: string,
    retryCount: number,
  ): Promise<DlqEntry> {
    const dlqTopic = this.getDlqTopicName(topic);
    const correlationId = this.extractCorrelationId(message);
    const userId = this.extractUserId(message);
    const journeyType = this.extractJourneyType(message);
    
    // Create DLQ entry with error details
    const dlqEntry = new DlqEntry();
    dlqEntry.id = uuidv4();
    dlqEntry.originalTopic = topic;
    dlqEntry.dlqTopic = dlqTopic;
    dlqEntry.consumerGroup = consumerGroup;
    dlqEntry.correlationId = correlationId;
    dlqEntry.userId = userId;
    dlqEntry.journeyType = journeyType;
    dlqEntry.payload = JSON.stringify(message.value);
    dlqEntry.headers = JSON.stringify(message.headers);
    dlqEntry.key = message.key?.toString();
    dlqEntry.partition = message.partition;
    dlqEntry.offset = message.offset?.toString();
    dlqEntry.timestamp = message.timestamp ? new Date(Number(message.timestamp)) : new Date();
    dlqEntry.errorType = this.classifyError(error);
    dlqEntry.errorMessage = error.message;
    dlqEntry.errorStack = error.stack;
    dlqEntry.retryCount = retryCount;
    dlqEntry.status = DlqEntryStatus.PENDING;
    dlqEntry.createdAt = new Date();
    dlqEntry.updatedAt = new Date();

    try {
      // Use a transaction to ensure both database storage and Kafka message sending succeed
      return await this.transactionService.executeInTransaction(async (transactionClient) => {
        // Store in database first
        const savedEntry = await this.dlqRepository.save(dlqEntry, { transaction: transactionClient });
        
        // Then send to Kafka DLQ topic with additional headers
        const dlqMessage: KafkaMessage = {
          ...message,
          headers: {
            ...message.headers,
            'dlq-entry-id': Buffer.from(dlqEntry.id),
            'dlq-error-type': Buffer.from(dlqEntry.errorType),
            'dlq-retry-count': Buffer.from(retryCount.toString()),
            'dlq-original-topic': Buffer.from(topic),
            'dlq-timestamp': Buffer.from(Date.now().toString()),
          },
        };
        
        await this.kafkaProducer.send({
          topic: dlqTopic,
          messages: [dlqMessage],
        });
        
        this.logger.log(
          `Message sent to DLQ topic ${dlqTopic} with entry ID ${dlqEntry.id}`,
          { correlationId, userId, journeyType, errorType: dlqEntry.errorType }
        );
        
        return savedEntry;
      });
    } catch (dbError) {
      this.logger.error(
        `Failed to process DLQ entry: ${dbError.message}`,
        dbError.stack,
        { correlationId, userId, journeyType, originalError: error.message }
      );
      
      // If database operation fails, still try to send to Kafka as a fallback
      try {
        const dlqMessage: KafkaMessage = {
          ...message,
          headers: {
            ...message.headers,
            'dlq-error-type': Buffer.from(this.classifyError(error)),
            'dlq-retry-count': Buffer.from(retryCount.toString()),
            'dlq-original-topic': Buffer.from(topic),
            'dlq-timestamp': Buffer.from(Date.now().toString()),
          },
        };
        
        await this.kafkaProducer.send({
          topic: dlqTopic,
          messages: [dlqMessage],
        });
        
        this.logger.warn(
          `Message sent to DLQ topic ${dlqTopic} but failed to store in database`,
          { correlationId, userId, journeyType, dbError: dbError.message }
        );
      } catch (kafkaError) {
        this.logger.error(
          `Complete DLQ failure - could not store in DB or send to Kafka: ${kafkaError.message}`,
          kafkaError.stack,
          { correlationId, userId, journeyType, dbError: dbError.message, originalError: error.message }
        );
      }
      
      // Re-throw as internal error since we couldn't properly handle the DLQ entry
      throw new InternalServerError(
        'Failed to process dead letter queue entry',
        { cause: dbError, context: { correlationId, userId, journeyType } }
      );
    }
  }

  /**
   * Retrieves DLQ entries with filtering options
   * 
   * @param options Filtering options for DLQ entries
   * @returns List of DLQ entries matching the filter criteria
   */
  async getDlqEntries(options: {
    userId?: string;
    journeyType?: string;
    errorType?: string;
    status?: DlqEntryStatus;
    originalTopic?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ entries: DlqEntry[]; total: number }> {
    const {
      userId,
      journeyType,
      errorType,
      status,
      originalTopic,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = options;

    const queryBuilder = this.dlqRepository.createQueryBuilder('dlq');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('dlq.userId = :userId', { userId });
    }
    
    if (journeyType) {
      queryBuilder.andWhere('dlq.journeyType = :journeyType', { journeyType });
    }
    
    if (errorType) {
      queryBuilder.andWhere('dlq.errorType = :errorType', { errorType });
    }
    
    if (status) {
      queryBuilder.andWhere('dlq.status = :status', { status });
    }
    
    if (originalTopic) {
      queryBuilder.andWhere('dlq.originalTopic = :originalTopic', { originalTopic });
    }
    
    if (fromDate) {
      queryBuilder.andWhere('dlq.createdAt >= :fromDate', { fromDate });
    }
    
    if (toDate) {
      queryBuilder.andWhere('dlq.createdAt <= :toDate', { toDate });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Order by most recent first
    queryBuilder.orderBy('dlq.createdAt', 'DESC');

    // Execute query with count
    const [entries, total] = await queryBuilder.getManyAndCount();

    return { entries, total };
  }

  /**
   * Retrieves a single DLQ entry by ID
   * 
   * @param id The ID of the DLQ entry to retrieve
   * @returns The DLQ entry if found
   * @throws BusinessRuleViolationError if the entry is not found
   */
  async getDlqEntryById(id: string): Promise<DlqEntry> {
    const entry = await this.dlqRepository.findOne({ where: { id } });
    
    if (!entry) {
      throw new BusinessRuleViolationError(
        `DLQ entry with ID ${id} not found`,
        { context: { entryId: id } }
      );
    }
    
    return entry;
  }

  /**
   * Reprocesses a failed message by sending it back to the original topic
   * 
   * @param entryId The ID of the DLQ entry to reprocess
   * @param options Optional parameters for reprocessing
   * @returns The updated DLQ entry
   */
  async reprocessMessage(
    entryId: string,
    options?: { overrideHeaders?: Record<string, string>; forceReprocess?: boolean }
  ): Promise<DlqEntry> {
    const { overrideHeaders, forceReprocess = false } = options || {};
    
    // Get the DLQ entry
    const entry = await this.getDlqEntryById(entryId);
    
    // Check if the entry is already resolved or being processed
    if (entry.status === DlqEntryStatus.RESOLVED && !forceReprocess) {
      throw new BusinessRuleViolationError(
        `DLQ entry ${entryId} is already resolved`,
        { context: { entryId, status: entry.status } }
      );
    }
    
    if (entry.status === DlqEntryStatus.REPROCESSING && !forceReprocess) {
      throw new BusinessRuleViolationError(
        `DLQ entry ${entryId} is already being reprocessed`,
        { context: { entryId, status: entry.status } }
      );
    }
    
    try {
      // Parse the original message
      const payload = JSON.parse(entry.payload);
      const headers = JSON.parse(entry.headers);
      
      // Create a new message with the original data
      const message: KafkaMessage = {
        value: payload,
        headers: {
          ...headers,
          // Add reprocessing metadata
          'reprocessed': Buffer.from('true'),
          'reprocessed-at': Buffer.from(Date.now().toString()),
          'original-dlq-entry-id': Buffer.from(entry.id),
          // Add any override headers
          ...(overrideHeaders && Object.entries(overrideHeaders).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: Buffer.from(value) }),
            {}
          )),
        },
        key: entry.key ? Buffer.from(entry.key) : null,
      };
      
      // Update the entry status to reprocessing
      entry.status = DlqEntryStatus.REPROCESSING;
      entry.reprocessedAt = new Date();
      entry.updatedAt = new Date();
      await this.dlqRepository.save(entry);
      
      // Send the message back to the original topic
      await this.kafkaProducer.send({
        topic: entry.originalTopic,
        messages: [message],
      });
      
      // Update the entry status to resolved
      entry.status = DlqEntryStatus.RESOLVED;
      entry.updatedAt = new Date();
      return await this.dlqRepository.save(entry);
    } catch (error) {
      // If reprocessing fails, update the entry with the error
      entry.status = DlqEntryStatus.FAILED_REPROCESSING;
      entry.reprocessingErrorMessage = error.message;
      entry.reprocessingErrorStack = error.stack;
      entry.updatedAt = new Date();
      await this.dlqRepository.save(entry);
      
      this.logger.error(
        `Failed to reprocess DLQ entry ${entryId}: ${error.message}`,
        error.stack,
        { entryId, originalTopic: entry.originalTopic, userId: entry.userId }
      );
      
      throw new InternalServerError(
        `Failed to reprocess DLQ entry: ${error.message}`,
        { cause: error, context: { entryId, originalTopic: entry.originalTopic } }
      );
    }
  }

  /**
   * Manually resolves a DLQ entry without reprocessing it
   * 
   * @param entryId The ID of the DLQ entry to resolve
   * @param resolution Optional resolution notes
   * @returns The updated DLQ entry
   */
  async resolveEntry(entryId: string, resolution?: string): Promise<DlqEntry> {
    const entry = await this.getDlqEntryById(entryId);
    
    // Check if the entry is already resolved
    if (entry.status === DlqEntryStatus.RESOLVED) {
      throw new BusinessRuleViolationError(
        `DLQ entry ${entryId} is already resolved`,
        { context: { entryId, status: entry.status } }
      );
    }
    
    // Update the entry status
    entry.status = DlqEntryStatus.RESOLVED;
    entry.resolution = resolution || 'Manually resolved';
    entry.resolvedAt = new Date();
    entry.updatedAt = new Date();
    
    return await this.dlqRepository.save(entry);
  }

  /**
   * Gets statistics about DLQ entries
   * 
   * @returns Statistics about DLQ entries
   */
  async getDlqStatistics(): Promise<{
    total: number;
    byStatus: Record<DlqEntryStatus, number>;
    byErrorType: Record<string, number>;
    byJourneyType: Record<string, number>;
    byTopic: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  }> {
    // Get total count
    const total = await this.dlqRepository.count();
    
    // Get counts by status
    const statusCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.status', 'status')
      .addSelect('COUNT(dlq.id)', 'count')
      .groupBy('dlq.status')
      .getRawMany();
    
    const byStatus = statusCounts.reduce(
      (acc, { status, count }) => ({ ...acc, [status]: Number(count) }),
      { 
        [DlqEntryStatus.PENDING]: 0, 
        [DlqEntryStatus.REPROCESSING]: 0, 
        [DlqEntryStatus.RESOLVED]: 0, 
        [DlqEntryStatus.FAILED_REPROCESSING]: 0 
      }
    );
    
    // Get counts by error type
    const errorTypeCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.errorType', 'errorType')
      .addSelect('COUNT(dlq.id)', 'count')
      .groupBy('dlq.errorType')
      .getRawMany();
    
    const byErrorType = errorTypeCounts.reduce(
      (acc, { errorType, count }) => ({ ...acc, [errorType]: Number(count) }),
      {}
    );
    
    // Get counts by journey type
    const journeyTypeCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.journeyType', 'journeyType')
      .addSelect('COUNT(dlq.id)', 'count')
      .groupBy('dlq.journeyType')
      .getRawMany();
    
    const byJourneyType = journeyTypeCounts.reduce(
      (acc, { journeyType, count }) => ({ ...acc, [journeyType]: Number(count) }),
      {}
    );
    
    // Get counts by topic
    const topicCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.originalTopic', 'topic')
      .addSelect('COUNT(dlq.id)', 'count')
      .groupBy('dlq.originalTopic')
      .getRawMany();
    
    const byTopic = topicCounts.reduce(
      (acc, { topic, count }) => ({ ...acc, [topic]: Number(count) }),
      {}
    );
    
    // Get counts for time periods
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last24Hours = await this.dlqRepository.count({
      where: { createdAt: { $gte: yesterday } }
    });
    
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const last7Days = await this.dlqRepository.count({
      where: { createdAt: { $gte: lastWeek } }
    });
    
    return {
      total,
      byStatus,
      byErrorType,
      byJourneyType,
      byTopic,
      last24Hours,
      last7Days,
    };
  }

  /**
   * Purges resolved DLQ entries older than the specified retention period
   * 
   * @param retentionDays Number of days to retain resolved entries (default: 30)
   * @returns Number of purged entries
   */
  async purgeResolvedEntries(retentionDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await this.dlqRepository.delete({
      status: DlqEntryStatus.RESOLVED,
      updatedAt: { $lt: cutoffDate },
    });
    
    this.logger.log(`Purged ${result.affected} resolved DLQ entries older than ${retentionDays} days`);
    
    return result.affected || 0;
  }

  /**
   * Determines the appropriate DLQ topic name based on the original topic
   * 
   * @param originalTopic The original topic name
   * @returns The DLQ topic name
   */
  private getDlqTopicName(originalTopic: string): string {
    return `${this.dlqTopicPrefix}${originalTopic}`;
  }

  /**
   * Extracts the correlation ID from the Kafka message headers
   * 
   * @param message The Kafka message
   * @returns The correlation ID or a generated UUID if not found
   */
  private extractCorrelationId(message: KafkaMessage): string {
    const correlationIdHeader = message.headers?.[KafkaHeaders.CORRELATION_ID];
    if (correlationIdHeader) {
      return correlationIdHeader.toString();
    }
    return uuidv4();
  }

  /**
   * Extracts the user ID from the Kafka message headers or payload
   * 
   * @param message The Kafka message
   * @returns The user ID or undefined if not found
   */
  private extractUserId(message: KafkaMessage): string | undefined {
    // Try to get from headers first
    const userIdHeader = message.headers?.['user-id'];
    if (userIdHeader) {
      return userIdHeader.toString();
    }
    
    // Then try to extract from the payload
    try {
      const payload = message.value ? JSON.parse(JSON.stringify(message.value)) : null;
      return payload?.userId || payload?.user_id || payload?.user?.id || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extracts the journey type from the Kafka message headers or topic
   * 
   * @param message The Kafka message
   * @param topic The original topic
   * @returns The journey type or 'unknown' if not found
   */
  private extractJourneyType(message: KafkaMessage, topic?: string): string {
    // Try to get from headers first
    const journeyHeader = message.headers?.['journey-type'];
    if (journeyHeader) {
      return journeyHeader.toString();
    }
    
    // Try to extract from topic
    if (topic) {
      if (topic.includes('health')) return 'health';
      if (topic.includes('care')) return 'care';
      if (topic.includes('plan')) return 'plan';
    }
    
    // Try to extract from the payload
    try {
      const payload = message.value ? JSON.parse(JSON.stringify(message.value)) : null;
      return payload?.journeyType || payload?.journey_type || payload?.journey || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Classifies the error type for better categorization and filtering
   * 
   * @param error The error that caused the message processing to fail
   * @returns The classified error type
   */
  private classifyError(error: Error): string {
    if (error instanceof BusinessRuleViolationError) {
      return 'business_rule';
    }
    
    if (error instanceof ExternalApiError) {
      return 'external_dependency';
    }
    
    if (error instanceof DatabaseException) {
      return 'database';
    }
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return 'timeout';
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    
    if (error.message.includes('permission') || error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return 'authorization';
    }
    
    return 'unknown';
  }
}