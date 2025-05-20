import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ProducerConfig,
  ConsumerConfig,
  TopicMessages,
  Message,
  CompressionTypes,
  logLevel,
  RetryOptions,
} from 'kafkajs';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KAFKA_MODULE_OPTIONS } from '../constants/tokens.constants';
import { ERROR_CODES } from '../constants/errors.constants';
import { TOPICS } from '../constants/topics.constants';
import { EventMetadataDto } from '../dto/event-metadata.dto';
import { EventSchemaRegistry } from '../schema/schema-registry.service';
import { KafkaModuleOptions } from '../interfaces/kafka-options.interface';
import { KafkaMessage } from '../interfaces/kafka-message.interface';
import { EventValidationError, KafkaError } from '../errors/kafka.errors';

/**
 * Enhanced Kafka service for the AUSTA SuperApp that provides robust event streaming capabilities.
 * 
 * Features:
 * - Service-specific configuration namespace support
 * - Dead-letter queue support for error handling
 * - Exponential backoff for retry logic
 * - Message schema validation
 * - Distributed tracing across all Kafka operations
 * - Support for multiple consumer groups
 * - Batch message operations
 * - Standardized error types and logging
 * - Connection pooling for better resource management
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private readonly serviceName: string;
  private readonly schemaRegistry?: EventSchemaRegistry;
  private readonly deadLetterTopic: string;
  private readonly defaultConsumerGroup: string;
  private readonly defaultRetryOptions: RetryOptions;

  /**
   * Initializes the Kafka service with configuration and required dependencies.
   * 
   * @param configService - Service for accessing configuration variables
   * @param logger - Logger service for operational logging
   * @param tracingService - Service for distributed tracing
   * @param options - Optional module options for customizing Kafka behavior
   * @param schemaRegistry - Optional schema registry for message validation
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    @Optional() @Inject(KAFKA_MODULE_OPTIONS) private readonly options?: KafkaModuleOptions,
    @Optional() private readonly schemaRegistryService?: EventSchemaRegistry,
  ) {
    // Get service name from options or config
    this.serviceName = this.options?.serviceName || 
      this.configService.get<string>('service.name', 'austa-service');
    
    // Get configuration namespace
    const configNamespace = this.options?.configNamespace || this.serviceName;
    
    // Configure Kafka client
    const brokers = this.configService.get<string>(
      `${configNamespace}.kafka.brokers`, 
      this.configService.get<string>('kafka.brokers', 'localhost:9092')
    ).split(',');
    
    const clientId = this.configService.get<string>(
      `${configNamespace}.kafka.clientId`, 
      this.configService.get<string>('kafka.clientId', this.serviceName)
    );

    // Configure default retry options with exponential backoff
    this.defaultRetryOptions = {
      initialRetryTime: this.configService.get<number>(
        `${configNamespace}.kafka.retry.initialRetryTime`, 
        this.configService.get<number>('kafka.retry.initialRetryTime', 300)
      ),
      retries: this.configService.get<number>(
        `${configNamespace}.kafka.retry.retries`, 
        this.configService.get<number>('kafka.retry.retries', 10)
      ),
      factor: this.configService.get<number>(
        `${configNamespace}.kafka.retry.factor`, 
        this.configService.get<number>('kafka.retry.factor', 2)
      ),
      maxRetryTime: this.configService.get<number>(
        `${configNamespace}.kafka.retry.maxRetryTime`, 
        this.configService.get<number>('kafka.retry.maxRetryTime', 30000)
      ),
    };

    // Configure Kafka client
    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers,
      ssl: this.configService.get<boolean>(
        `${configNamespace}.kafka.ssl`, 
        this.configService.get<boolean>('kafka.ssl', false)
      ),
      sasl: this.getSaslConfig(configNamespace),
      retry: this.defaultRetryOptions,
      logLevel: this.getLogLevel(configNamespace),
      connectionTimeout: this.configService.get<number>(
        `${configNamespace}.kafka.connectionTimeout`, 
        this.configService.get<number>('kafka.connectionTimeout', 3000)
      ),
      requestTimeout: this.configService.get<number>(
        `${configNamespace}.kafka.requestTimeout`, 
        this.configService.get<number>('kafka.requestTimeout', 30000)
      ),
    };

    this.kafka = new Kafka(kafkaConfig);
    this.schemaRegistry = schemaRegistryService;
    
    // Configure dead letter topic
    this.deadLetterTopic = this.configService.get<string>(
      `${configNamespace}.kafka.deadLetterTopic`, 
      this.configService.get<string>('kafka.deadLetterTopic', TOPICS.DEAD_LETTER)
    );
    
    // Configure default consumer group
    this.defaultConsumerGroup = this.configService.get<string>(
      `${configNamespace}.kafka.groupId`, 
      this.configService.get<string>('kafka.groupId', `${this.serviceName}-consumer-group`)
    );

    this.logger.log(
      `Initialized Kafka service for ${this.serviceName} with brokers: ${brokers.join(', ')}`,
      'KafkaService'
    );
  }

  /**
   * Initializes the Kafka producer when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connectProducer();
      this.logger.log('Kafka service initialized successfully', 'KafkaService');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka service', error, 'KafkaService');
      throw new KafkaError(
        'Failed to initialize Kafka service',
        ERROR_CODES.INITIALIZATION_FAILED,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Disconnects all Kafka producers and consumers when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnectProducer();
      await this.disconnectAllConsumers();
      this.logger.log('Kafka service destroyed successfully', 'KafkaService');
    } catch (error) {
      this.logger.error('Error during Kafka service shutdown', error, 'KafkaService');
    }
  }

  /**
   * Sends a message to a Kafka topic with tracing, schema validation, and error handling.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer options
   */
  async produce<T = any>(
    topic: string, 
    message: T, 
    key?: string, 
    headers?: Record<string, string>,
    options?: {
      compression?: CompressionTypes;
      acks?: number;
      timeout?: number;
    }
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produce.${topic}`, async (span) => {
      try {
        // Add tracing context to headers
        const tracingHeaders = this.tracingService.getTraceHeaders();
        const enrichedHeaders = { ...headers, ...tracingHeaders };
        
        // Add metadata if not present
        let enrichedMessage = message;
        if (!this.hasMetadata(message)) {
          enrichedMessage = this.addMetadata(message as any);
        }
        
        // Validate message schema if registry is available
        if (this.schemaRegistry) {
          try {
            await this.schemaRegistry.validate(topic, enrichedMessage);
          } catch (validationError) {
            this.logger.error(
              `Schema validation failed for topic ${topic}`,
              validationError,
              'KafkaService'
            );
            throw new EventValidationError(
              `Schema validation failed for topic ${topic}`,
              ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              { topic, message: JSON.stringify(enrichedMessage).substring(0, 200) },
              validationError
            );
          }
        }
        
        // Serialize message
        const serializedMessage = this.serializeMessage(enrichedMessage);
        
        // Add span attributes for observability
        span.setAttribute('kafka.topic', topic);
        span.setAttribute('kafka.key', key || 'undefined');
        span.setAttribute('kafka.message_size', serializedMessage.length);
        
        // Send message to Kafka
        await this.producer.send({
          topic,
          compression: options?.compression,
          acks: options?.acks,
          timeout: options?.timeout,
          messages: [
            {
              value: serializedMessage,
              key: key || undefined,
              headers: this.convertHeadersToBuffers(enrichedHeaders)
            }
          ]
        });
        
        this.logger.debug(
          `Message sent to topic ${topic}: ${serializedMessage.substring(0, 100)}${serializedMessage.length > 100 ? '...' : ''}`,
          'KafkaService'
        );
      } catch (error) {
        this.logger.error(`Failed to produce message to topic ${topic}`, error, 'KafkaService');
        throw new KafkaError(
          `Failed to produce message to topic ${topic}`,
          ERROR_CODES.PRODUCER_SEND_FAILED,
          { topic, serviceName: this.serviceName },
          error
        );
      }
    });
  }

  /**
   * Sends multiple messages to a Kafka topic in a single batch.
   * 
   * @param topic - The Kafka topic to send the messages to
   * @param messages - Array of messages with optional keys and headers
   * @param options - Optional producer options
   */
  async produceBatch<T = any>(
    topic: string,
    messages: Array<{
      value: T;
      key?: string;
      headers?: Record<string, string>;
    }>,
    options?: {
      compression?: CompressionTypes;
      acks?: number;
      timeout?: number;
    }
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produceBatch.${topic}`, async (span) => {
      try {
        // Add tracing context and prepare messages
        const tracingHeaders = this.tracingService.getTraceHeaders();
        const kafkaMessages: Message[] = await Promise.all(
          messages.map(async (msg) => {
            // Add metadata if not present
            let enrichedValue = msg.value;
            if (!this.hasMetadata(msg.value)) {
              enrichedValue = this.addMetadata(msg.value as any);
            }
            
            // Validate message schema if registry is available
            if (this.schemaRegistry) {
              try {
                await this.schemaRegistry.validate(topic, enrichedValue);
              } catch (validationError) {
                this.logger.error(
                  `Schema validation failed for message in batch to topic ${topic}`,
                  validationError,
                  'KafkaService'
                );
                throw new EventValidationError(
                  `Schema validation failed for message in batch to topic ${topic}`,
                  ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                  { topic, message: JSON.stringify(enrichedValue).substring(0, 200) },
                  validationError
                );
              }
            }
            
            // Combine headers with tracing context
            const enrichedHeaders = { ...msg.headers, ...tracingHeaders };
            
            // Return formatted Kafka message
            return {
              value: this.serializeMessage(enrichedValue),
              key: msg.key || undefined,
              headers: this.convertHeadersToBuffers(enrichedHeaders)
            };
          })
        );
        
        // Add span attributes for observability
        span.setAttribute('kafka.topic', topic);
        span.setAttribute('kafka.batch_size', messages.length);
        
        // Send batch to Kafka
        const topicMessages: TopicMessages = {
          topic,
          compression: options?.compression,
          messages: kafkaMessages
        };
        
        await this.producer.sendBatch({
          topicMessages: [topicMessages],
          acks: options?.acks || -1,
          timeout: options?.timeout || 30000
        });
        
        this.logger.debug(
          `Batch of ${messages.length} messages sent to topic ${topic}`,
          'KafkaService'
        );
      } catch (error) {
        this.logger.error(`Failed to produce batch to topic ${topic}`, error, 'KafkaService');
        throw new KafkaError(
          `Failed to produce batch to topic ${topic}`,
          ERROR_CODES.PRODUCER_BATCH_FAILED,
          { topic, batchSize: messages.length, serviceName: this.serviceName },
          error
        );
      }
    });
  }

  /**
   * Subscribes to a Kafka topic and processes messages with automatic schema validation,
   * error handling, and dead-letter queue support.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   */
  async consume<T = any>(
    topic: string,
    callback: (message: T, metadata: KafkaMessage) => Promise<void>,
    options?: {
      groupId?: string;
      fromBeginning?: boolean;
      autoCommit?: boolean;
      maxRetries?: number;
      retryDelay?: number;
      useDLQ?: boolean;
    }
  ): Promise<void> {
    try {
      const groupId = options?.groupId || this.defaultConsumerGroup;
      const consumerKey = `${groupId}-${topic}`;
      
      // Create consumer if it doesn't exist for this group-topic combination
      if (!this.consumers.has(consumerKey)) {
        const consumer = this.kafka.consumer({
          groupId,
          sessionTimeout: this.configService.get<number>('kafka.sessionTimeout', 30000),
          heartbeatInterval: this.configService.get<number>('kafka.heartbeatInterval', 3000),
          maxWaitTimeInMs: this.configService.get<number>('kafka.maxWaitTime', 5000),
          maxBytes: this.configService.get<number>('kafka.maxBytes', 10485760), // 10MB
        });
        
        await consumer.connect();
        this.consumers.set(consumerKey, consumer);
        this.logger.log(
          `Created Kafka consumer for topic ${topic} with group ID ${groupId}`,
          'KafkaService'
        );
      }
      
      const consumer = this.consumers.get(consumerKey);
      await consumer.subscribe({
        topic,
        fromBeginning: options?.fromBeginning ?? false
      });
      
      // Configure consumer with retry logic and dead-letter queue
      await consumer.run({
        autoCommit: options?.autoCommit ?? true,
        eachMessage: async ({ topic, partition, message }) => {
          const messageKey = message.key?.toString();
          const messageHeaders = this.parseHeaders(message.headers);
          
          // Extract retry count from headers or initialize to 0
          const retryCount = parseInt(messageHeaders['retry-count'] || '0', 10);
          const maxRetries = options?.maxRetries ?? this.configService.get<number>('kafka.maxRetries', 3);
          
          return this.tracingService.createSpan(`kafka.consume.${topic}`, async (span) => {
            try {
              // Deserialize message
              const parsedMessage = this.deserializeMessage<T>(message.value);
              
              // Validate message schema if registry is available
              if (this.schemaRegistry) {
                try {
                  await this.schemaRegistry.validate(topic, parsedMessage);
                } catch (validationError) {
                  this.logger.error(
                    `Schema validation failed for consumed message from topic ${topic}`,
                    validationError,
                    'KafkaService'
                  );
                  
                  // Send to dead-letter queue if enabled
                  if (options?.useDLQ !== false) {
                    await this.sendToDLQ(topic, parsedMessage, messageKey, {
                      ...messageHeaders,
                      'error-type': 'schema-validation',
                      'error-message': validationError.message,
                      'source-topic': topic,
                      'source-partition': partition.toString(),
                    });
                  }
                  
                  // Don't rethrow to prevent consumer from crashing
                  return;
                }
              }
              
              // Add span attributes for observability
              span.setAttribute('kafka.topic', topic);
              span.setAttribute('kafka.partition', partition);
              span.setAttribute('kafka.offset', message.offset);
              span.setAttribute('kafka.key', messageKey || 'undefined');
              
              // Create metadata object for callback
              const metadata: KafkaMessage = {
                key: messageKey,
                headers: messageHeaders,
                topic,
                partition,
                offset: message.offset,
                timestamp: message.timestamp
              };
              
              this.logger.debug(
                `Processing message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
                'KafkaService'
              );
              
              // Process message with callback
              await callback(parsedMessage, metadata);
            } catch (error) {
              this.logger.error(
                `Error processing message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
                error,
                'KafkaService'
              );
              
              // Implement retry logic with exponential backoff
              if (retryCount < maxRetries) {
                const nextRetryCount = retryCount + 1;
                const retryDelay = options?.retryDelay ?? 
                  this.calculateRetryDelay(nextRetryCount, this.defaultRetryOptions);
                
                this.logger.log(
                  `Retrying message from topic ${topic}, attempt ${nextRetryCount} of ${maxRetries} after ${retryDelay}ms`,
                  'KafkaService'
                );
                
                // Wait for retry delay with exponential backoff
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                
                // Republish message with incremented retry count
                try {
                  const parsedMessage = this.deserializeMessage(message.value);
                  await this.produce(
                    topic,
                    parsedMessage,
                    messageKey,
                    {
                      ...messageHeaders,
                      'retry-count': nextRetryCount.toString(),
                    }
                  );
                } catch (retryError) {
                  this.logger.error(
                    `Failed to republish message for retry to topic ${topic}`,
                    retryError,
                    'KafkaService'
                  );
                  
                  // Send to dead-letter queue if enabled
                  if (options?.useDLQ !== false) {
                    const parsedMessage = this.deserializeMessage(message.value);
                    await this.sendToDLQ(topic, parsedMessage, messageKey, {
                      ...messageHeaders,
                      'error-type': 'processing-failed',
                      'error-message': error.message,
                      'retry-count': nextRetryCount.toString(),
                      'source-topic': topic,
                      'source-partition': partition.toString(),
                    });
                  }
                }
              } else {
                // Max retries exceeded, send to dead-letter queue if enabled
                if (options?.useDLQ !== false) {
                  const parsedMessage = this.deserializeMessage(message.value);
                  await this.sendToDLQ(topic, parsedMessage, messageKey, {
                    ...messageHeaders,
                    'error-type': 'max-retries-exceeded',
                    'error-message': error.message,
                    'retry-count': retryCount.toString(),
                    'max-retries': maxRetries.toString(),
                    'source-topic': topic,
                    'source-partition': partition.toString(),
                  });
                }
              }
              
              // Don't rethrow to prevent consumer from crashing
            }
          }, messageHeaders);
        }
      });
      
      this.logger.log(`Subscribed to topic ${topic} with group ID ${groupId}`, 'KafkaService');
    } catch (error) {
      this.logger.error(`Failed to consume from topic ${topic}`, error, 'KafkaService');
      throw new KafkaError(
        `Failed to consume from topic ${topic}`,
        ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED,
        { topic, serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Sends a message to the dead-letter queue topic.
   * 
   * @param sourceTopic - The original topic where the message was intended
   * @param message - The message that failed processing
   * @param key - Optional message key
   * @param headers - Optional message headers with error context
   * @private
   */
  private async sendToDLQ<T = any>(
    sourceTopic: string,
    message: T,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    try {
      // Add DLQ metadata to headers
      const dlqHeaders = {
        ...headers,
        'dlq-timestamp': Date.now().toString(),
        'source-topic': sourceTopic,
        'source-service': this.serviceName,
      };
      
      await this.produce(
        this.deadLetterTopic,
        message,
        key,
        dlqHeaders
      );
      
      this.logger.log(
        `Message from topic ${sourceTopic} sent to dead-letter queue`,
        'KafkaService'
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to dead-letter queue from topic ${sourceTopic}`,
        error,
        'KafkaService'
      );
      // Don't rethrow to prevent cascading failures
    }
  }

  /**
   * Connects to Kafka as a producer with enhanced configuration.
   * @private
   */
  private async connectProducer(): Promise<void> {
    try {
      const producerConfig: ProducerConfig = {
        allowAutoTopicCreation: this.configService.get<boolean>('kafka.allowAutoTopicCreation', true),
        transactionalId: this.configService.get<string>('kafka.transactionalId'),
        idempotent: this.configService.get<boolean>('kafka.idempotent', false),
        maxInFlightRequests: this.configService.get<number>('kafka.maxInFlightRequests', 5),
        retry: this.defaultRetryOptions,
      };
      
      this.producer = this.kafka.producer(producerConfig);
      
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully', 'KafkaService');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error, 'KafkaService');
      throw new KafkaError(
        'Failed to connect Kafka producer',
        ERROR_CODES.PRODUCER_CONNECTION_FAILED,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Disconnects the Kafka producer.
   * @private
   */
  private async disconnectProducer(): Promise<void> {
    if (this.producer) {
      try {
        await this.producer.disconnect();
        this.logger.log('Kafka producer disconnected successfully', 'KafkaService');
      } catch (error) {
        this.logger.error('Error disconnecting Kafka producer', error, 'KafkaService');
      }
    }
  }

  /**
   * Disconnects all Kafka consumers.
   * @private
   */
  private async disconnectAllConsumers(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    
    for (const [key, consumer] of this.consumers.entries()) {
      disconnectPromises.push(
        consumer.disconnect()
          .then(() => {
            this.logger.log(`Kafka consumer ${key} disconnected successfully`, 'KafkaService');
          })
          .catch((error) => {
            this.logger.error(`Error disconnecting Kafka consumer ${key}`, error, 'KafkaService');
          })
      );
    }
    
    await Promise.allSettled(disconnectPromises);
    this.consumers.clear();
  }

  /**
   * Serializes a message to JSON string.
   * @private
   */
  private serializeMessage(message: any): Buffer {
    try {
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to serialize message', error, 'KafkaService');
      throw new KafkaError(
        'Failed to serialize message',
        ERROR_CODES.MESSAGE_SERIALIZATION_FAILED,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Deserializes a message from JSON string.
   * @private
   */
  private deserializeMessage<T = any>(buffer: Buffer): T {
    try {
      const message = buffer.toString();
      return JSON.parse(message);
    } catch (error) {
      this.logger.error('Failed to deserialize message', error, 'KafkaService');
      throw new KafkaError(
        'Failed to deserialize message',
        ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Parses Kafka message headers from binary to string key-value pairs.
   * @private
   */
  private parseHeaders(headers: Record<string, Buffer>): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          result[key] = value.toString();
        }
      });
    }
    
    return result;
  }

  /**
   * Converts string headers to Buffer for Kafka.
   * @private
   */
  private convertHeadersToBuffers(headers: Record<string, string>): Record<string, Buffer> {
    const result: Record<string, Buffer> = {};
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          result[key] = Buffer.from(value.toString());
        }
      });
    }
    
    return result;
  }

  /**
   * Gets SASL configuration if enabled.
   * @private
   */
  private getSaslConfig(configNamespace: string): { mechanism: string; username: string; password: string } | undefined {
    const saslEnabled = this.configService.get<boolean>(
      `${configNamespace}.kafka.sasl.enabled`, 
      this.configService.get<boolean>('kafka.sasl.enabled', false)
    );
    
    if (!saslEnabled) {
      return undefined;
    }
    
    return {
      mechanism: this.configService.get<string>(
        `${configNamespace}.kafka.sasl.mechanism`, 
        this.configService.get<string>('kafka.sasl.mechanism', 'plain')
      ),
      username: this.configService.get<string>(
        `${configNamespace}.kafka.sasl.username`, 
        this.configService.get<string>('kafka.sasl.username', '')
      ),
      password: this.configService.get<string>(
        `${configNamespace}.kafka.sasl.password`, 
        this.configService.get<string>('kafka.sasl.password', '')
      )
    };
  }

  /**
   * Gets the log level for Kafka client.
   * @private
   */
  private getLogLevel(configNamespace: string): logLevel {
    const level = this.configService.get<string>(
      `${configNamespace}.kafka.logLevel`, 
      this.configService.get<string>('kafka.logLevel', 'info')
    );
    
    switch (level.toLowerCase()) {
      case 'debug':
        return logLevel.DEBUG;
      case 'info':
        return logLevel.INFO;
      case 'warn':
        return logLevel.WARN;
      case 'error':
        return logLevel.ERROR;
      case 'nothing':
        return logLevel.NOTHING;
      default:
        return logLevel.INFO;
    }
  }

  /**
   * Calculates retry delay with exponential backoff.
   * @private
   */
  private calculateRetryDelay(attempt: number, options: RetryOptions): number {
    const { initialRetryTime, factor, maxRetryTime } = options;
    const delay = Math.min(
      initialRetryTime * Math.pow(factor, attempt - 1),
      maxRetryTime
    );
    
    // Add jitter to prevent thundering herd problem
    return Math.floor(delay * (0.8 + Math.random() * 0.4));
  }

  /**
   * Checks if a message already has metadata attached.
   * @private
   */
  private hasMetadata(message: any): boolean {
    return message && typeof message === 'object' && message.metadata instanceof EventMetadataDto;
  }

  /**
   * Adds standard metadata to a message.
   * @private
   */
  private addMetadata<T = any>(message: T): T & { metadata: EventMetadataDto } {
    const metadata = new EventMetadataDto();
    metadata.timestamp = new Date().toISOString();
    metadata.source = this.serviceName;
    metadata.correlationId = this.tracingService.getCurrentTraceId() || undefined;
    
    return {
      ...message as any,
      metadata
    };
  }
}