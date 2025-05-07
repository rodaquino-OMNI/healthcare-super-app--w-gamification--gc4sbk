import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, Producer, KafkaMessage, logLevel } from 'kafkajs';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { KafkaModuleOptions } from '../kafka.module';

/**
 * Core service for Kafka client management
 * 
 * Handles connection to Kafka brokers, manages the lifecycle of producers and consumers,
 * and provides methods for message serialization/deserialization.
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private readonly clientId: string;
  private readonly brokers: string[];

  /**
   * Creates an instance of KafkaService
   * 
   * @param options Configuration options for Kafka
   * @param logger Logger service for structured logging
   * @param tracingService Tracing service for distributed tracing
   */
  constructor(
    private readonly options: KafkaModuleOptions,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.clientId = options.clientId || 'gamification-engine';
    this.brokers = options.brokers || ['localhost:9092'];

    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      logLevel: process.env.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.INFO,
      retry: {
        initialRetryTime: 300,
        retries: 10,
        maxRetryTime: 30000,
      },
    });

    this.logger.log(`KafkaService initialized with clientId: ${this.clientId}`, 'KafkaService');
  }

  /**
   * Initializes the Kafka producer on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionalId: `${this.clientId}-producer`,
      });

      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully', 'KafkaService');
    } catch (error) {
      this.logger.error(
        `Failed to connect Kafka producer: ${error.message}`,
        error.stack,
        'KafkaService',
      );
      throw error;
    }
  }

  /**
   * Disconnects all Kafka clients on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.producer?.disconnect();
      this.logger.log('Kafka producer disconnected', 'KafkaService');

      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        this.logger.log(`Kafka consumer for group ${groupId} disconnected`, 'KafkaService');
      }
    } catch (error) {
      this.logger.error(
        `Error during Kafka client disconnection: ${error.message}`,
        error.stack,
        'KafkaService',
      );
    }
  }

  /**
   * Gets or creates a Kafka consumer for the specified group
   * 
   * @param groupId Consumer group ID
   * @returns Kafka consumer instance
   */
  getConsumer(groupId: string): Consumer {
    if (!this.consumers.has(groupId)) {
      const consumer = this.kafka.consumer({
        groupId,
        allowAutoTopicCreation: true,
        retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`Created Kafka consumer for group: ${groupId}`, 'KafkaService');
    }

    return this.consumers.get(groupId);
  }

  /**
   * Gets the Kafka producer instance
   * 
   * @returns Kafka producer instance
   */
  getProducer(): Producer {
    return this.producer;
  }

  /**
   * Subscribes to a Kafka topic with the specified consumer group and message handler
   * 
   * @param topic Topic to subscribe to
   * @param groupId Consumer group ID
   * @param handler Message handler function
   */
  async consume(
    topic: string,
    groupId: string,
    handler: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>,
  ): Promise<void> {
    const consumer = this.getConsumer(groupId);

    try {
      await consumer.connect();
      this.logger.log(`Consumer connected for group: ${groupId}`, 'KafkaService');

      await consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`Subscribed to topic: ${topic} with group: ${groupId}`, 'KafkaService');

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const span = this.tracingService.startSpan(`kafka.consume.${topic}`);
          
          try {
            const key = message.key?.toString();
            const headers = this.parseHeaders(message);
            const value = this.parseMessage(message);

            this.logger.log(
              `Processing message from topic: ${topic}, partition: ${partition}`,
              'KafkaService',
            );

            await handler(value, key, headers);
            
            span.finish();
          } catch (error) {
            span.setTag('error', true);
            span.log({ event: 'error', 'error.object': error, message: error.message });
            span.finish();

            this.logger.error(
              `Error processing message from topic ${topic}: ${error.message}`,
              error.stack,
              'KafkaService',
            );

            // We don't rethrow the error to prevent the consumer from crashing
            // Error handling is delegated to the retry service
          }
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to set up consumer for topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaService',
      );
      throw error;
    }
  }

  /**
   * Produces a message to the specified Kafka topic
   * 
   * @param topic Topic to produce to
   * @param message Message to produce
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves when the message is sent
   */
  async produce(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
  ): Promise<void> {
    const span = this.tracingService.startSpan(`kafka.produce.${topic}`);
    
    try {
      const serializedMessage = this.serializeMessage(message);
      const serializedHeaders = this.serializeHeaders(headers);

      await this.producer.send({
        topic,
        messages: [
          {
            key: key ? Buffer.from(key) : null,
            value: serializedMessage,
            headers: serializedHeaders,
          },
        ],
      });

      this.logger.log(`Message sent to topic: ${topic}`, 'KafkaService');
      span.finish();
    } catch (error) {
      span.setTag('error', true);
      span.log({ event: 'error', 'error.object': error, message: error.message });
      span.finish();

      this.logger.error(
        `Failed to produce message to topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaService',
      );
      throw error;
    }
  }

  /**
   * Parses a Kafka message value
   * 
   * @param message Kafka message
   * @returns Parsed message value
   */
  private parseMessage(message: KafkaMessage): any {
    if (!message.value) {
      return null;
    }

    try {
      return JSON.parse(message.value.toString());
    } catch (error) {
      this.logger.warn(
        `Failed to parse message as JSON: ${error.message}. Returning raw buffer.`,
        'KafkaService',
      );
      return message.value.toString();
    }
  }

  /**
   * Parses Kafka message headers
   * 
   * @param message Kafka message
   * @returns Parsed headers
   */
  private parseHeaders(message: KafkaMessage): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!message.headers) {
      return headers;
    }

    for (const [key, value] of Object.entries(message.headers)) {
      if (value !== null && value !== undefined) {
        headers[key] = Buffer.isBuffer(value) ? value.toString() : String(value);
      }
    }

    return headers;
  }

  /**
   * Serializes a message for Kafka
   * 
   * @param message Message to serialize
   * @returns Serialized message
   */
  private serializeMessage(message: any): Buffer {
    if (message === null || message === undefined) {
      return null;
    }

    if (Buffer.isBuffer(message)) {
      return message;
    }

    if (typeof message === 'string') {
      return Buffer.from(message);
    }

    try {
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error(
        `Failed to serialize message: ${error.message}`,
        error.stack,
        'KafkaService',
      );
      throw error;
    }
  }

  /**
   * Serializes headers for Kafka
   * 
   * @param headers Headers to serialize
   * @returns Serialized headers
   */
  private serializeHeaders(headers?: Record<string, string>): Record<string, Buffer> {
    if (!headers) {
      return {};
    }

    const result: Record<string, Buffer> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (value !== null && value !== undefined) {
        result[key] = Buffer.from(String(value));
      }
    }

    return result;
  }
}