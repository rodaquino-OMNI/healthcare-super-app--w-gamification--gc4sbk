import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage, ConsumerConfig, ProducerConfig, IHeaders, RetryOptions, logLevel } from 'kafkajs';
import { TracingService } from '../../tracing';
import { EventValidationError, KafkaConnectionError, KafkaProducerError, KafkaConsumerError, KafkaSerializationError } from './kafka.errors';
import { IKafkaConfig, IKafkaConsumerOptions, IKafkaProducerOptions, IKafkaDeadLetterQueueConfig } from './kafka.interfaces';
import { KafkaErrorCode } from './kafka.constants';

/**
 * Enhanced Kafka service for managing Kafka connections, producers, and consumers.
 * Provides support for message validation, dead letter queues, and distributed tracing.
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private readonly logger = new Logger(KafkaService.name);
  private connectionPool: Map<string, Kafka> = new Map();
  private producerPool: Map<string, Producer> = new Map();
  private isProducerConnected = false;
  private readonly defaultConsumerGroup: string;
  private readonly serviceName: string;

  /**
   * Initializes the Kafka service with configuration and required dependencies.
   * 
   * @param configService - Service for accessing configuration variables
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService
  ) {
    // Get service-specific namespace from config
    this.serviceName = this.configService.get<string>('service.name', 'austa-service');
    const configNamespace = this.configService.get<string>('kafka.configNamespace', this.serviceName);
    
    // Load broker configuration with service-specific namespace support
    const brokers = this.configService.get<string>(`${configNamespace}.kafka.brokers`, 
                                                  this.configService.get<string>('kafka.brokers', 'localhost:9092')).split(',');
    const clientId = this.configService.get<string>(`${configNamespace}.kafka.clientId`, 
                                                 this.configService.get<string>('kafka.clientId', this.serviceName));
    
    // Default consumer group with service-specific namespace
    this.defaultConsumerGroup = this.configService.get<string>(`${configNamespace}.kafka.groupId`, 
                                                             this.configService.get<string>('kafka.groupId', `${this.serviceName}-consumer-group`));
    
    // Configure retry options with exponential backoff
    const retryOptions: RetryOptions = {
      initialRetryTime: this.configService.get<number>(`${configNamespace}.kafka.retry.initialRetryTime`, 300),
      retries: this.configService.get<number>(`${configNamespace}.kafka.retry.retries`, 10),
      factor: this.configService.get<number>(`${configNamespace}.kafka.retry.factor`, 2), // Exponential backoff factor
      maxRetryTime: this.configService.get<number>(`${configNamespace}.kafka.retry.maxRetryTime`, 30000),
      multiplier: this.configService.get<number>(`${configNamespace}.kafka.retry.multiplier`, 1.5),
    };

    // Create Kafka client with enhanced configuration
    this.kafka = new Kafka({
      clientId,
      brokers,
      ssl: this.configService.get<boolean>(`${configNamespace}.kafka.ssl`, false),
      sasl: this.getSaslConfig(configNamespace),
      retry: retryOptions,
      logLevel: this.configService.get<logLevel>(`${configNamespace}.kafka.logLevel`, logLevel.ERROR),
      connectionTimeout: this.configService.get<number>(`${configNamespace}.kafka.connectionTimeout`, 3000),
      requestTimeout: this.configService.get<number>(`${configNamespace}.kafka.requestTimeout`, 30000),
    });

    this.logger.log(`Initialized Kafka service for ${this.serviceName} with brokers: ${brokers.join(', ')}`);
  }

  /**
   * Initializes the Kafka producer when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connectProducer();
      this.logger.log('Kafka service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka service', error);
      throw new KafkaConnectionError(
        'Failed to initialize Kafka service',
        KafkaErrorCode.INITIALIZATION_ERROR,
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
      this.logger.log('Kafka service destroyed successfully');
    } catch (error) {
      this.logger.error('Error during Kafka service shutdown', error);
    }
  }

  /**
   * Sends a message to a Kafka topic with tracing and error handling.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer options
   */
  async produce(
    topic: string, 
    message: any, 
    key?: string, 
    headers?: Record<string, string>,
    options?: IKafkaProducerOptions
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produce.${topic}`, async (span) => {
      try {
        // Add trace context to headers if available
        const enhancedHeaders = this.enhanceHeadersWithTracing(headers, span);
        
        // Validate message schema if validator is provided
        if (options?.validator) {
          const validationResult = await options.validator(message);
          if (!validationResult.isValid) {
            throw new EventValidationError(
              `Message validation failed for topic ${topic}: ${validationResult.error}`,
              KafkaErrorCode.VALIDATION_ERROR,
              { topic, error: validationResult.error },
            );
          }
        }

        // Serialize message
        const serializedMessage = this.serializeMessage(message, options?.serializer);
        
        // Get producer from pool or use default
        const producer = options?.producerId 
          ? await this.getOrCreateProducer(options.producerId, options.producerConfig)
          : this.producer;
        
        // Send message
        await producer.send({
          topic,
          messages: [
            {
              value: serializedMessage,
              key: key || undefined,
              headers: enhancedHeaders || undefined
            }
          ],
          acks: options?.acks ?? -1, // Default to all acks for maximum reliability
          timeout: options?.timeout,
        });
        
        this.logger.debug(
          `Message sent to topic ${topic}: ${serializedMessage.substring(0, 100)}${serializedMessage.length > 100 ? '...' : ''}`
        );
      } catch (error) {
        // Handle specific error types
        if (error instanceof EventValidationError) {
          throw error; // Re-throw validation errors
        }
        
        this.logger.error(`Failed to produce message to topic ${topic}`, error);
        throw new KafkaProducerError(
          `Failed to produce message to topic ${topic}`,
          KafkaErrorCode.PRODUCER_ERROR,
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
  async produceBatch(
    topic: string,
    messages: Array<{ value: any; key?: string; headers?: Record<string, string> }>,
    options?: IKafkaProducerOptions
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produceBatch.${topic}`, async (span) => {
      try {
        if (!messages.length) {
          this.logger.debug(`No messages to send to topic ${topic}`);
          return;
        }

        // Get producer from pool or use default
        const producer = options?.producerId 
          ? await this.getOrCreateProducer(options.producerId, options.producerConfig)
          : this.producer;

        // Process and validate each message
        const kafkaMessages = await Promise.all(messages.map(async (msg) => {
          // Validate message schema if validator is provided
          if (options?.validator) {
            const validationResult = await options.validator(msg.value);
            if (!validationResult.isValid) {
              throw new EventValidationError(
                `Message validation failed for topic ${topic}: ${validationResult.error}`,
                KafkaErrorCode.VALIDATION_ERROR,
                { topic, error: validationResult.error },
              );
            }
          }

          // Add trace context to headers if available
          const enhancedHeaders = this.enhanceHeadersWithTracing(msg.headers, span);
          
          // Serialize message
          const serializedMessage = this.serializeMessage(msg.value, options?.serializer);
          
          return {
            value: serializedMessage,
            key: msg.key || undefined,
            headers: enhancedHeaders || undefined
          };
        }));

        // Send batch
        await producer.send({
          topic,
          messages: kafkaMessages,
          acks: options?.acks ?? -1, // Default to all acks for maximum reliability
          timeout: options?.timeout,
        });
        
        this.logger.debug(`Batch of ${messages.length} messages sent to topic ${topic}`);
      } catch (error) {
        // Handle specific error types
        if (error instanceof EventValidationError) {
          throw error; // Re-throw validation errors
        }
        
        this.logger.error(`Failed to produce batch messages to topic ${topic}`, error);
        throw new KafkaProducerError(
          `Failed to produce batch messages to topic ${topic}`,
          KafkaErrorCode.PRODUCER_ERROR,
          { topic, batchSize: messages.length, serviceName: this.serviceName },
          error
        );
      }
    });
  }

  /**
   * Sends a message to a dead letter queue topic with additional metadata.
   * 
   * @param originalTopic - The original Kafka topic where the message failed
   * @param message - The original message that failed processing
   * @param error - The error that occurred during processing
   * @param metadata - Additional metadata about the failure
   * @param config - Configuration for the dead letter queue
   */
  async sendToDeadLetterQueue(
    originalTopic: string,
    message: any,
    error: Error,
    metadata: Record<string, any> = {},
    config?: IKafkaDeadLetterQueueConfig
  ): Promise<void> {
    const dlqTopic = config?.topic || `${originalTopic}.dlq`;
    const retryCount = metadata.retryCount || 0;
    
    try {
      // Create DLQ message with error information and metadata
      const dlqMessage = {
        originalMessage: message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        metadata: {
          ...metadata,
          originalTopic,
          timestamp: new Date().toISOString(),
          serviceName: this.serviceName,
          retryCount,
        }
      };

      // Send to DLQ topic
      await this.produce(dlqTopic, dlqMessage, metadata.key, {
        'x-original-topic': originalTopic,
        'x-error-type': error.name,
        'x-retry-count': retryCount.toString(),
        'x-timestamp': new Date().toISOString(),
      });
      
      this.logger.warn(
        `Message sent to dead letter queue ${dlqTopic} from topic ${originalTopic} after ${retryCount} retries`,
        { error: error.message, metadata }
      );
    } catch (dlqError) {
      // Log but don't throw - we don't want DLQ failures to cause additional issues
      this.logger.error(
        `Failed to send message to dead letter queue ${dlqTopic}`,
        dlqError
      );
    }
  }

  /**
   * Subscribes to a Kafka topic and processes messages with error handling and DLQ support.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID (defaults to service-specific group)
   * @param callback - The function to process each message
   * @param options - Additional consumer options including DLQ configuration
   */
  async consume(
    topic: string,
    groupId: string | undefined,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    const consumerGroupId = groupId || this.defaultConsumerGroup;
    const consumerKey = `${topic}-${consumerGroupId}`;
    
    try {
      // Create consumer with enhanced configuration
      const consumer = this.kafka.consumer({
        groupId: consumerGroupId,
        sessionTimeout: options?.sessionTimeout || this.configService.get<number>('kafka.sessionTimeout', 30000),
        heartbeatInterval: options?.heartbeatInterval || this.configService.get<number>('kafka.heartbeatInterval', 3000),
        maxWaitTimeInMs: options?.maxWaitTimeInMs || 1000,
        maxBytes: options?.maxBytes || 1048576, // 1MB default
        retry: {
          initialRetryTime: options?.retry?.initialRetryTime || 300,
          retries: options?.retry?.retries || 10,
          factor: options?.retry?.factor || 2, // Exponential backoff factor
          maxRetryTime: options?.retry?.maxRetryTime || 30000,
        },
      });
      
      // Store consumer for cleanup
      this.consumers.set(consumerKey, consumer);
      
      await consumer.connect();
      await consumer.subscribe({
        topic,
        fromBeginning: options?.fromBeginning || false
      });
      
      await consumer.run({
        eachMessage: async ({ topic: messageTopic, partition, message }) => {
          const messageKey = message.key?.toString();
          const messageHeaders = this.parseHeaders(message.headers);
          
          return this.tracingService.createSpan(`kafka.consume.${messageTopic}`, async (span) => {
            // Extract trace context from headers if available
            this.extractTraceContext(messageHeaders, span);
            
            try {
              // Deserialize message
              const parsedMessage = this.deserializeMessage(message.value, options?.deserializer);
              
              // Validate message schema if validator is provided
              if (options?.validator) {
                const validationResult = await options.validator(parsedMessage);
                if (!validationResult.isValid) {
                  throw new EventValidationError(
                    `Message validation failed for topic ${messageTopic}: ${validationResult.error}`,
                    KafkaErrorCode.VALIDATION_ERROR,
                    { topic: messageTopic, error: validationResult.error },
                  );
                }
              }
              
              this.logger.debug(
                `Processing message from topic ${messageTopic}, partition ${partition}`
              );
              
              // Process message
              await callback(parsedMessage, messageKey, messageHeaders);
            } catch (error) {
              this.logger.error(
                `Error processing message from topic ${messageTopic}, partition ${partition}`,
                error
              );

              // Handle DLQ if configured
              if (options?.deadLetterQueue?.enabled !== false) {
                const retryCount = parseInt(messageHeaders['x-retry-count'] || '0', 10);
                const maxRetries = options?.deadLetterQueue?.maxRetries || 3;
                
                // Check if we should retry or send to DLQ
                if (retryCount < maxRetries && options?.deadLetterQueue?.retryEnabled !== false) {
                  // Retry by sending to retry topic
                  const retryTopic = options?.deadLetterQueue?.retryTopic || `${messageTopic}.retry`;
                  try {
                    await this.produce(
                      retryTopic,
                      this.deserializeMessage(message.value, options?.deserializer),
                      messageKey,
                      {
                        ...messageHeaders,
                        'x-retry-count': (retryCount + 1).toString(),
                        'x-original-topic': messageTopic,
                        'x-retry-timestamp': new Date().toISOString(),
                      }
                    );
                    
                    this.logger.warn(
                      `Message sent to retry topic ${retryTopic} from topic ${messageTopic}, retry ${retryCount + 1}/${maxRetries}`
                    );
                  } catch (retryError) {
                    this.logger.error(`Failed to send message to retry topic ${retryTopic}`, retryError);
                    // If retry fails, send to DLQ
                    await this.sendToDeadLetterQueue(
                      messageTopic,
                      this.deserializeMessage(message.value, options?.deserializer),
                      error,
                      { retryCount, key: messageKey, headers: messageHeaders },
                      options?.deadLetterQueue
                    );
                  }
                } else {
                  // Max retries reached, send to DLQ
                  await this.sendToDeadLetterQueue(
                    messageTopic,
                    this.deserializeMessage(message.value, options?.deserializer),
                    error,
                    { retryCount, key: messageKey, headers: messageHeaders },
                    options?.deadLetterQueue
                  );
                }
              }
              
              // Don't rethrow to prevent consumer from crashing
              // unless explicitly configured to do so
              if (options?.throwOriginalError) {
                throw error;
              }
            }
          });
        },
        ...(options?.consumerRunConfig || {})
      });
      
      this.logger.log(`Subscribed to topic ${topic} with group ID ${consumerGroupId}`);
    } catch (error) {
      this.logger.error(`Failed to consume from topic ${topic}`, error);
      throw new KafkaConsumerError(
        `Failed to consume from topic ${topic}`,
        KafkaErrorCode.CONSUMER_ERROR,
        { topic, groupId: consumerGroupId, serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Subscribes to a retry topic to handle message retries with exponential backoff.
   * 
   * @param originalTopic - The original topic name
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   * @param options - Additional consumer options
   */
  async consumeRetry(
    originalTopic: string,
    groupId: string | undefined,
    callback: (message: any, key?: string, headers?: Record<string, string>) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    const retryTopic = options?.deadLetterQueue?.retryTopic || `${originalTopic}.retry`;
    const consumerGroupId = groupId || `${this.defaultConsumerGroup}-retry`;
    
    return this.consume(
      retryTopic,
      consumerGroupId,
      async (message, key, headers) => {
        // Extract retry information
        const retryCount = parseInt(headers?.['x-retry-count'] || '1', 10);
        const maxRetries = options?.deadLetterQueue?.maxRetries || 3;
        
        try {
          // Apply exponential backoff based on retry count
          // This is just a simulation as Kafka doesn't natively support delayed processing
          // In production, consider using a scheduled consumer or a time-based partitioning strategy
          const backoffMs = Math.min(
            options?.deadLetterQueue?.maxBackoffMs || 30000,
            Math.pow(2, retryCount) * (options?.deadLetterQueue?.baseBackoffMs || 1000)
          );
          
          this.logger.debug(
            `Processing retry message from topic ${retryTopic}, retry ${retryCount}/${maxRetries} with backoff ${backoffMs}ms`
          );
          
          // Process the message
          await callback(message, key, headers);
        } catch (error) {
          this.logger.error(
            `Error processing retry message from topic ${retryTopic}, retry ${retryCount}/${maxRetries}`,
            error
          );
          
          // Check if we should retry again or send to DLQ
          if (retryCount < maxRetries) {
            // Send back to retry topic with incremented retry count
            await this.produce(
              retryTopic,
              message,
              key,
              {
                ...headers,
                'x-retry-count': (retryCount + 1).toString(),
                'x-retry-timestamp': new Date().toISOString(),
              }
            );
            
            this.logger.warn(
              `Message sent back to retry topic ${retryTopic}, retry ${retryCount + 1}/${maxRetries}`
            );
          } else {
            // Max retries reached, send to DLQ
            await this.sendToDeadLetterQueue(
              originalTopic,
              message,
              error,
              { retryCount, key, headers },
              options?.deadLetterQueue
            );
          }
        }
      },
      options
    );
  }

  /**
   * Subscribes to a dead letter queue topic to handle failed messages.
   * 
   * @param originalTopic - The original topic name
   * @param groupId - The consumer group ID
   * @param callback - The function to process each dead letter message
   * @param options - Additional consumer options
   */
  async consumeDeadLetterQueue(
    originalTopic: string,
    groupId: string | undefined,
    callback: (message: any, error: any, metadata: any) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    const dlqTopic = options?.deadLetterQueue?.topic || `${originalTopic}.dlq`;
    const consumerGroupId = groupId || `${this.defaultConsumerGroup}-dlq`;
    
    return this.consume(
      dlqTopic,
      consumerGroupId,
      async (dlqMessage, key, headers) => {
        try {
          // Extract original message and error information
          const { originalMessage, error, metadata } = dlqMessage;
          
          // Process the dead letter message
          await callback(originalMessage, error, metadata);
          
          this.logger.debug(
            `Processed dead letter message from topic ${dlqTopic}, original topic ${originalTopic}`
          );
        } catch (error) {
          this.logger.error(
            `Error processing dead letter message from topic ${dlqTopic}`,
            error
          );
          // Don't retry DLQ processing to avoid infinite loops
        }
      },
      options
    );
  }

  /**
   * Connects to Kafka as a producer with enhanced configuration.
   * @private
   */
  private async connectProducer(): Promise<void> {
    if (this.isProducerConnected) {
      return;
    }

    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: this.configService.get<boolean>('kafka.allowAutoTopicCreation', true),
        transactionalId: this.configService.get<string>('kafka.transactionalId'),
        idempotent: this.configService.get<boolean>('kafka.idempotent', true),
        maxInFlightRequests: this.configService.get<number>('kafka.maxInFlightRequests', 5),
        retry: {
          initialRetryTime: this.configService.get<number>('kafka.retry.initialRetryTime', 300),
          retries: this.configService.get<number>('kafka.retry.retries', 10),
          factor: this.configService.get<number>('kafka.retry.factor', 2), // Exponential backoff factor
          maxRetryTime: this.configService.get<number>('kafka.retry.maxRetryTime', 30000),
        },
      });
      
      await this.producer.connect();
      this.isProducerConnected = true;
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw new KafkaConnectionError(
        'Failed to connect Kafka producer',
        KafkaErrorCode.PRODUCER_CONNECTION_ERROR,
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
        this.isProducerConnected = false;
        this.logger.log('Kafka producer disconnected successfully');
      } catch (error) {
        this.logger.error('Error disconnecting Kafka producer', error);
      }
    }
    
    // Disconnect all producers in the pool
    for (const [producerId, producer] of this.producerPool.entries()) {
      try {
        await producer.disconnect();
        this.logger.log(`Kafka producer ${producerId} from pool disconnected successfully`);
      } catch (error) {
        this.logger.error(`Error disconnecting Kafka producer ${producerId} from pool`, error);
      }
    }
    
    this.producerPool.clear();
  }

  /**
   * Disconnects all Kafka consumers.
   * @private
   */
  private async disconnectAllConsumers(): Promise<void> {
    for (const [consumerKey, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect();
        this.logger.log(`Kafka consumer ${consumerKey} disconnected successfully`);
      } catch (error) {
        this.logger.error(`Error disconnecting Kafka consumer ${consumerKey}`, error);
      }
    }
    
    this.consumers.clear();
  }

  /**
   * Gets or creates a producer from the connection pool.
   * @private
   */
  private async getOrCreateProducer(producerId: string, config?: ProducerConfig): Promise<Producer> {
    if (this.producerPool.has(producerId)) {
      return this.producerPool.get(producerId)!;
    }
    
    try {
      const producer = this.kafka.producer({
        ...config,
        allowAutoTopicCreation: config?.allowAutoTopicCreation ?? this.configService.get<boolean>('kafka.allowAutoTopicCreation', true),
        idempotent: config?.idempotent ?? this.configService.get<boolean>('kafka.idempotent', true),
      });
      
      await producer.connect();
      this.producerPool.set(producerId, producer);
      this.logger.log(`Created and connected Kafka producer ${producerId} in pool`);
      
      return producer;
    } catch (error) {
      this.logger.error(`Failed to create Kafka producer ${producerId} in pool`, error);
      throw new KafkaConnectionError(
        `Failed to create Kafka producer ${producerId} in pool`,
        KafkaErrorCode.PRODUCER_CONNECTION_ERROR,
        { producerId, serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Serializes a message to JSON string or uses custom serializer if provided.
   * @private
   */
  private serializeMessage(message: any, serializer?: (message: any) => Buffer): Buffer {
    try {
      if (serializer) {
        return serializer(message);
      }
      
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to serialize message', error);
      throw new KafkaSerializationError(
        'Failed to serialize message',
        KafkaErrorCode.SERIALIZATION_ERROR,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Deserializes a message from JSON string or uses custom deserializer if provided.
   * @private
   */
  private deserializeMessage(buffer: Buffer, deserializer?: (buffer: Buffer) => any): any {
    try {
      if (deserializer) {
        return deserializer(buffer);
      }
      
      const message = buffer.toString();
      return JSON.parse(message);
    } catch (error) {
      this.logger.error('Failed to deserialize message', error);
      throw new KafkaSerializationError(
        'Failed to deserialize message',
        KafkaErrorCode.DESERIALIZATION_ERROR,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Parses Kafka message headers from binary to string key-value pairs.
   * @private
   */
  private parseHeaders(headers: IHeaders): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = value?.toString() || '';
      });
    }
    
    return result;
  }

  /**
   * Gets SASL configuration if enabled.
   * @private
   */
  private getSaslConfig(configNamespace: string): { mechanism: string; username: string; password: string } | undefined {
    const saslEnabled = this.configService.get<boolean>(`${configNamespace}.kafka.sasl.enabled`, 
                                                      this.configService.get<boolean>('kafka.sasl.enabled', false));
    
    if (!saslEnabled) {
      return undefined;
    }
    
    return {
      mechanism: this.configService.get<string>(`${configNamespace}.kafka.sasl.mechanism`, 
                                              this.configService.get<string>('kafka.sasl.mechanism', 'plain')),
      username: this.configService.get<string>(`${configNamespace}.kafka.sasl.username`, 
                                             this.configService.get<string>('kafka.sasl.username', '')),
      password: this.configService.get<string>(`${configNamespace}.kafka.sasl.password`, 
                                             this.configService.get<string>('kafka.sasl.password', ''))
    };
  }

  /**
   * Enhances message headers with tracing information.
   * @private
   */
  private enhanceHeadersWithTracing(headers: Record<string, string> = {}, span: any): Record<string, string> {
    const enhancedHeaders = { ...headers };
    
    // Add trace context to headers if available
    if (span) {
      const traceContext = this.tracingService.getTraceContext(span);
      if (traceContext) {
        Object.entries(traceContext).forEach(([key, value]) => {
          enhancedHeaders[`x-trace-${key}`] = value;
        });
      }
    }
    
    // Add service name and timestamp
    enhancedHeaders['x-service-name'] = this.serviceName;
    enhancedHeaders['x-timestamp'] = new Date().toISOString();
    
    return enhancedHeaders;
  }

  /**
   * Extracts trace context from message headers.
   * @private
   */
  private extractTraceContext(headers: Record<string, string>, span: any): void {
    if (!span) return;
    
    const traceContext: Record<string, string> = {};
    
    // Extract trace headers
    Object.entries(headers).forEach(([key, value]) => {
      if (key.startsWith('x-trace-')) {
        const traceKey = key.replace('x-trace-', '');
        traceContext[traceKey] = value;
      }
    });
    
    // Set trace context if available
    if (Object.keys(traceContext).length > 0) {
      this.tracingService.setTraceContext(span, traceContext);
    }
  }
}