import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Producer, Kafka } from 'kafkajs';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

/**
 * Service for handling dead letter queue (DLQ) operations.
 * This service is responsible for storing events that failed processing
 * after exhausting retry attempts or encountering non-retryable errors.
 */
@Injectable()
export class DeadLetterQueueService {
  private producer: Producer;
  private readonly dlqTopic: string;
  private isInitialized = false;

  /**
   * Creates an instance of DeadLetterQueueService.
   * 
   * @param configService Service for accessing configuration
   * @param logger Service for logging
   * @param tracingService Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService
  ) {
    this.dlqTopic = this.configService.get<string>(
      'gamificationEngine.kafka.topics.deadLetterQueue',
      'gamification.dlq'
    );

    this.logger.log(`DeadLetterQueueService initialized with topic: ${this.dlqTopic}`, 'DeadLetterQueueService');
  }

  /**
   * Initializes the DLQ producer if not already initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const brokers = this.configService.get<string>(
        'gamificationEngine.kafka.brokers',
        'localhost:9092'
      ).split(',');

      const ssl = this.configService.get<boolean>(
        'gamificationEngine.kafka.ssl',
        false
      );

      // Create Kafka instance
      const kafka = new Kafka({
        clientId: 'gamification-engine-dlq-producer',
        brokers,
        ssl
      });

      // Create producer
      this.producer = kafka.producer({
        allowAutoTopicCreation: true, // Allow DLQ topic creation if it doesn't exist
        idempotent: true
      });

      // Connect to Kafka
      await this.producer.connect();
      this.isInitialized = true;

      this.logger.log('DLQ producer initialized and connected', 'DeadLetterQueueService');
    } catch (error) {
      this.logger.error(
        `Failed to initialize DLQ producer: ${error.message}`,
        { error: error.stack },
        'DeadLetterQueueService'
      );
      throw error;
    }
  }

  /**
   * Adds a failed message to the dead letter queue
   * 
   * @param message The original message that failed processing
   * @param error The error that occurred
   * @param retryCount The number of retry attempts made
   * @param metadata Additional metadata about the failure
   */
  public async addToDlq(
    message: any,
    error: Error,
    retryCount: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Ensure the producer is initialized
      await this.ensureInitialized();

      // Create the DLQ record
      const dlqRecord = {
        originalMessage: message,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          retryCount,
          service: 'gamification-engine'
        }
      };

      // Generate a correlation ID for tracing
      const correlationId = this.tracingService.generateTraceId();

      // Start a trace span for the DLQ operation
      const span = this.tracingService.startSpan('kafka.dlq.add', {
        'kafka.topic': this.dlqTopic,
        'kafka.correlation_id': correlationId,
        'kafka.retry_count': retryCount,
        'kafka.error': error.message
      });

      try {
        // Send the message to the DLQ topic
        await this.producer.send({
          topic: this.dlqTopic,
          messages: [
            {
              key: message?.userId || 'unknown',
              value: JSON.stringify(dlqRecord),
              headers: {
                'correlation-id': correlationId,
                'retry-count': retryCount.toString(),
                'error-type': error.name,
                'timestamp': new Date().toISOString()
              }
            }
          ]
        });

        this.logger.log(
          `Message sent to DLQ: ${error.message}`,
          {
            userId: message?.userId,
            eventType: message?.type,
            correlationId,
            retryCount
          },
          'DeadLetterQueueService'
        );

        // End the trace span
        span.end();
      } catch (dlqError) {
        // Record error in the trace span
        span.recordException(dlqError);
        span.end();

        throw dlqError;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send message to DLQ: ${error.message}`,
        { error: error.stack },
        'DeadLetterQueueService'
      );
      // We don't rethrow here to prevent cascading failures
      // The original error handling should continue
    }
  }

  /**
   * Disconnects the DLQ producer
   */
  public async disconnect(): Promise<void> {
    if (this.isInitialized && this.producer) {
      try {
        await this.producer.disconnect();
        this.isInitialized = false;
        this.logger.log('DLQ producer disconnected', 'DeadLetterQueueService');
      } catch (error) {
        this.logger.error(
          `Error disconnecting DLQ producer: ${error.message}`,
          { error: error.stack },
          'DeadLetterQueueService'
        );
      }
    }
  }
}