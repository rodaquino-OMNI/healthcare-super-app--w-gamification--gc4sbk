import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Span } from '@nestjs/opentelemetry';

import { LoggerService } from '../../../shared/src/logging/logger.service';
import { TracingService } from '../../../shared/src/tracing/tracing.service';
import { DlqItem } from './entities/dlq-item.entity';
import { CreateDlqItemDto } from './dto/create-dlq-item.dto';

/**
 * Service for managing the Dead Letter Queue (DLQ) for failed notifications.
 * The DLQ stores notifications that have failed after multiple retry attempts,
 * allowing for manual inspection, troubleshooting, and potential reprocessing.
 */
@Injectable()
export class DlqService {
  /**
   * Creates an instance of DlqService.
   * 
   * @param dlqRepository - Repository for DLQ items
   * @param logger - Service for structured logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    @InjectRepository(DlqItem)
    private readonly dlqRepository: Repository<DlqItem>,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Adds a failed notification to the Dead Letter Queue.
   * 
   * @param createDlqItemDto - Data for the DLQ item
   * @returns Promise resolving to the created DLQ item
   */
  @Span('dlq.addToDlq')
  async addToDlq(createDlqItemDto: CreateDlqItemDto): Promise<DlqItem> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Adding notification to DLQ for user ${createDlqItemDto.userId} on channel ${createDlqItemDto.channel}`,
        'DlqService',
        { userId: createDlqItemDto.userId, channel: createDlqItemDto.channel, notificationId: createDlqItemDto.notificationId, traceId }
      );

      // Create DLQ item
      const dlqItem = this.dlqRepository.create({
        notificationId: createDlqItemDto.notificationId,
        userId: createDlqItemDto.userId,
        channel: createDlqItemDto.channel,
        payload: JSON.stringify(createDlqItemDto.payload),
        errorDetails: JSON.stringify(createDlqItemDto.errorDetails),
        retryHistory: JSON.stringify(createDlqItemDto.retryHistory),
        metadata: createDlqItemDto.metadata ? JSON.stringify(createDlqItemDto.metadata) : null,
        status: 'pending',
        priority: this.determinePriority(createDlqItemDto)
      });

      const savedItem = await this.dlqRepository.save(dlqItem);

      this.logger.log(
        `Successfully added item to DLQ with ID ${savedItem.id}`,
        'DlqService',
        { dlqItemId: savedItem.id, userId: createDlqItemDto.userId, traceId }
      );

      return savedItem;
    } catch (error) {
      this.logger.error(
        `Failed to add notification to DLQ for user ${createDlqItemDto.userId}`,
        error,
        'DlqService',
        { userId: createDlqItemDto.userId, channel: createDlqItemDto.channel, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Retrieves DLQ items for processing.
   * 
   * @param limit - Maximum number of items to retrieve
   * @param status - Status filter (default: 'pending')
   * @returns Promise resolving to an array of DLQ items
   */
  @Span('dlq.getDlqItems')
  async getDlqItems(limit: number = 10, status: string = 'pending'): Promise<DlqItem[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Retrieving up to ${limit} ${status} items from DLQ`,
        'DlqService',
        { limit, status, traceId }
      );

      // Get items ordered by priority and creation date
      const items = await this.dlqRepository.find({
        where: { status },
        order: {
          priority: 'ASC', // Higher priority first
          createdAt: 'ASC' // Oldest first
        },
        take: limit
      });

      // Parse JSON fields
      const parsedItems = items.map(item => this.parseDlqItem(item));

      this.logger.log(
        `Retrieved ${parsedItems.length} items from DLQ`,
        'DlqService',
        { count: parsedItems.length, traceId }
      );

      return parsedItems;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve items from DLQ',
        error,
        'DlqService',
        { limit, status, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Updates a DLQ item with new information.
   * 
   * @param id - DLQ item ID
   * @param updates - Fields to update
   * @returns Promise resolving to the updated DLQ item
   */
  @Span('dlq.updateDlqItem')
  async updateDlqItem(id: number, updates: Record<string, any>): Promise<DlqItem> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Updating DLQ item ${id}`,
        'DlqService',
        { dlqItemId: id, updates: Object.keys(updates), traceId }
      );

      // Get current item
      const item = await this.dlqRepository.findOne({ where: { id } });
      if (!item) {
        throw new Error(`DLQ item ${id} not found`);
      }

      // Update retry history if provided
      if (updates.retryCount !== undefined) {
        const retryHistory = JSON.parse(item.retryHistory || '{}');
        retryHistory.attemptCount = updates.retryCount;
        
        if (updates.lastError) {
          if (!retryHistory.errors) {
            retryHistory.errors = [];
          }
          retryHistory.errors.push(updates.lastError);
        }
        
        if (updates.lastAttempt) {
          retryHistory.lastAttemptTime = updates.lastAttempt;
        }
        
        item.retryHistory = JSON.stringify(retryHistory);
      }

      // Update status if provided
      if (updates.status) {
        item.status = updates.status;
      }

      // Update other fields
      if (updates.notes) {
        item.notes = updates.notes;
      }

      // Save updates
      const updatedItem = await this.dlqRepository.save(item);

      this.logger.log(
        `Successfully updated DLQ item ${id}`,
        'DlqService',
        { dlqItemId: id, traceId }
      );

      return this.parseDlqItem(updatedItem);
    } catch (error) {
      this.logger.error(
        `Failed to update DLQ item ${id}`,
        error,
        'DlqService',
        { dlqItemId: id, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Removes a DLQ item after successful processing.
   * 
   * @param id - DLQ item ID
   * @returns Promise resolving when the item is removed
   */
  @Span('dlq.removeDlqItem')
  async removeDlqItem(id: number): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Removing DLQ item ${id}`,
        'DlqService',
        { dlqItemId: id, traceId }
      );

      // Option 1: Hard delete
      // await this.dlqRepository.delete(id);

      // Option 2: Soft delete (mark as processed)
      await this.dlqRepository.update(id, {
        status: 'processed',
        processedAt: new Date()
      });

      this.logger.log(
        `Successfully removed DLQ item ${id}`,
        'DlqService',
        { dlqItemId: id, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove DLQ item ${id}`,
        error,
        'DlqService',
        { dlqItemId: id, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Parses JSON fields in a DLQ item.
   * 
   * @param item - DLQ item with JSON string fields
   * @returns DLQ item with parsed JSON fields
   * @private
   */
  private parseDlqItem(item: DlqItem): DlqItem {
    try {
      // Create a copy of the item
      const parsedItem = { ...item };

      // Parse JSON fields
      if (parsedItem.payload) {
        parsedItem.payload = JSON.parse(parsedItem.payload);
      }

      if (parsedItem.errorDetails) {
        parsedItem.errorDetails = JSON.parse(parsedItem.errorDetails);
      }

      if (parsedItem.retryHistory) {
        parsedItem.retryHistory = JSON.parse(parsedItem.retryHistory);
      }

      if (parsedItem.metadata) {
        parsedItem.metadata = JSON.parse(parsedItem.metadata);
      }

      return parsedItem;
    } catch (error) {
      this.logger.warn(
        `Error parsing JSON fields in DLQ item ${item.id}`,
        'DlqService',
        { dlqItemId: item.id, error: error.message }
      );
      return item;
    }
  }

  /**
   * Determines the priority of a DLQ item based on its content.
   * 
   * @param createDlqItemDto - Data for the DLQ item
   * @returns Priority value (lower is higher priority)
   * @private
   */
  private determinePriority(createDlqItemDto: CreateDlqItemDto): number {
    // Check if payload contains priority information
    if (createDlqItemDto.payload?.priority) {
      return createDlqItemDto.payload.priority;
    }

    // Check notification type for critical notifications
    const notificationType = createDlqItemDto.payload?.type || '';
    if (
      notificationType.includes('emergency') || 
      notificationType.includes('critical') ||
      notificationType === 'medication-reminder'
    ) {
      return 1; // Highest priority
    }

    // Check channel - SMS is typically higher priority
    if (createDlqItemDto.channel === 'sms') {
      return 2;
    }

    // Default priority
    return 5;
  }
}