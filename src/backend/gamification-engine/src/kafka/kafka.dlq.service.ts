import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from './kafka.service';
import { KafkaModuleOptions } from '../kafka.module';
import { RetryableMessage } from './kafka.retry.service';

/**
 * Dead Letter Queue (DLQ) entry
 */
export interface DlqEntry {
  /**
   * Unique ID for the entry
   */
  id: string;
  
  /**
   * Topic the message was originally sent to
   */
  topic: string;
  
  /**
   * Original message payload
   */
  message: any;
  
  /**
   * Optional message key
   */
  key?: string;
  
  /**
   * Optional message headers
   */
  headers?: Record<string, string>;
  
  /**
   * Error details
   */
  error: {
    message: string;
    stack?: string;
    name?: string;
  };
  
  /**
   * Number of retry attempts made
   */
  attempts: number;
  
  /**
   * Timestamp when the message was first received
   */
  originalTimestamp: Date;
  
  /**
   * Timestamp when the message was added to the DLQ
   */
  dlqTimestamp: Date;
  
  /**
   * Whether the entry has been processed
   */
  processed: boolean;
  
  /**
   * Timestamp when the entry was processed (if applicable)
   */
  processedTimestamp?: Date;
}

/**
 * Service for managing the Dead Letter Queue (DLQ) for failed Kafka messages
 * 
 * Handles messages that have exhausted their retry attempts and provides
 * functionality for storing, retrieving, and reprocessing DLQ entries.
 */
@Injectable()
export class KafkaDlqService implements OnModuleInit {
  private dlqEntries: Map<string, DlqEntry> = new Map();
  private readonly dlqTopic: string;
  private readonly enabled: boolean;
  
  /**
   * Creates an instance of KafkaDlqService
   * 
   * @param kafkaService Core Kafka service for broker communication
   * @param logger Logger service for structured logging
   * @param options Kafka module options
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly options: KafkaModuleOptions,
  ) {
    this.dlqTopic = 'gamification-engine-dlq';
    this.enabled = options.enableDlq !== undefined ? options.enableDlq : true;
    
    this.logger.log(
      `KafkaDlqService initialized (${this.enabled ? 'enabled' : 'disabled'})`,
      'KafkaDlqService',
    );
  }

  /**
   * Sets up event listeners for retry exhausted events on module initialization
   */
  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('DLQ is disabled, skipping initialization', 'KafkaDlqService');
      return;
    }
    
    // Listen for retry exhausted events
    process.on('kafka:retry:exhausted', (event: any) => {
      this.handleRetryExhausted(event);
    });
    
    this.logger.log('DLQ event listeners registered', 'KafkaDlqService');
  }

  /**
   * Handles a message that has exhausted its retry attempts
   * 
   * @param event Retry exhausted event
   */
  private handleRetryExhausted(event: any): void {
    if (!this.enabled) {
      return;
    }
    
    const id = this.generateDlqId(event.topic, event.message, event.key);
    
    const dlqEntry: DlqEntry = {
      id,
      topic: event.topic,
      message: event.message,
      key: event.key,
      headers: { ...event.headers, 'x-dlq': 'true' },
      error: event.error,
      attempts: event.attempts,
      originalTimestamp: new Date(event.originalTimestamp),
      dlqTimestamp: new Date(),
      processed: false,
    };
    
    this.dlqEntries.set(id, dlqEntry);
    
    this.logger.warn(
      `Added message to DLQ: ${id} (topic: ${event.topic}, attempts: ${event.attempts})`,
      'KafkaDlqService',
    );
    
    // Publish to DLQ topic for persistence
    this.publishToDlqTopic(dlqEntry).catch(error => {
      this.logger.error(
        `Failed to publish to DLQ topic: ${error.message}`,
        error.stack,
        'KafkaDlqService',
      );
    });
  }

  /**
   * Publishes a DLQ entry to the DLQ topic
   * 
   * @param entry DLQ entry to publish
   */
  private async publishToDlqTopic(entry: DlqEntry): Promise<void> {
    try {
      await this.kafkaService.produce(
        this.dlqTopic,
        {
          ...entry,
          originalTimestamp: entry.originalTimestamp.toISOString(),
          dlqTimestamp: entry.dlqTimestamp.toISOString(),
          processedTimestamp: entry.processedTimestamp?.toISOString(),
        },
        entry.id,
        { 'x-dlq-entry': 'true' },
      );
      
      this.logger.log(`Published DLQ entry ${entry.id} to topic ${this.dlqTopic}`, 'KafkaDlqService');
    } catch (error) {
      this.logger.error(
        `Failed to publish DLQ entry to topic ${this.dlqTopic}: ${error.message}`,
        error.stack,
        'KafkaDlqService',
      );
      throw error;
    }
  }

  /**
   * Gets all DLQ entries
   * 
   * @returns Array of DLQ entries
   */
  getAllEntries(): DlqEntry[] {
    return Array.from(this.dlqEntries.values());
  }

  /**
   * Gets a DLQ entry by ID
   * 
   * @param id DLQ entry ID
   * @returns DLQ entry or undefined if not found
   */
  getEntry(id: string): DlqEntry | undefined {
    return this.dlqEntries.get(id);
  }

  /**
   * Reprocesses a DLQ entry by sending it to its original topic
   * 
   * @param id DLQ entry ID
   * @returns Promise that resolves when the entry is reprocessed
   */
  async reprocessEntry(id: string): Promise<boolean> {
    const entry = this.dlqEntries.get(id);
    
    if (!entry) {
      this.logger.warn(`DLQ entry not found: ${id}`, 'KafkaDlqService');
      return false;
    }
    
    if (entry.processed) {
      this.logger.warn(`DLQ entry already processed: ${id}`, 'KafkaDlqService');
      return false;
    }
    
    try {
      // Add reprocessing metadata to headers
      const reprocessHeaders = {
        ...entry.headers,
        'x-dlq-reprocessed': 'true',
        'x-dlq-original-timestamp': entry.originalTimestamp.toISOString(),
        'x-dlq-timestamp': entry.dlqTimestamp.toISOString(),
      };
      
      await this.kafkaService.produce(
        entry.topic,
        entry.message,
        entry.key,
        reprocessHeaders,
      );
      
      // Mark as processed
      entry.processed = true;
      entry.processedTimestamp = new Date();
      this.dlqEntries.set(id, entry);
      
      this.logger.log(`Successfully reprocessed DLQ entry: ${id}`, 'KafkaDlqService');
      
      // Update the entry in the DLQ topic
      await this.publishToDlqTopic(entry);
      
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reprocess DLQ entry ${id}: ${error.message}`,
        error.stack,
        'KafkaDlqService',
      );
      return false;
    }
  }

  /**
   * Deletes a DLQ entry
   * 
   * @param id DLQ entry ID
   * @returns Whether the entry was deleted
   */
  deleteEntry(id: string): boolean {
    const exists = this.dlqEntries.has(id);
    
    if (exists) {
      this.dlqEntries.delete(id);
      this.logger.log(`Deleted DLQ entry: ${id}`, 'KafkaDlqService');
    }
    
    return exists;
  }

  /**
   * Generates a unique ID for a DLQ entry
   * 
   * @param topic Topic the message was sent to
   * @param message Message payload
   * @param key Optional message key
   * @returns Unique DLQ entry ID
   */
  private generateDlqId(topic: string, message: any, key?: string): string {
    let messageString: string;
    
    if (typeof message === 'object' && message !== null) {
      try {
        messageString = JSON.stringify(message);
      } catch (error) {
        messageString = String(message);
      }
    } else {
      messageString = String(message);
    }
    
    // Create a hash of the message content
    const hash = this.simpleHash(messageString);
    const timestamp = Date.now();
    
    return `${topic}:${key || 'nokey'}:${hash}:${timestamp}`;
  }

  /**
   * Creates a simple hash of a string
   * 
   * @param str String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}