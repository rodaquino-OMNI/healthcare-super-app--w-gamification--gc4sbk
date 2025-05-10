import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaConfig, ConsumerConfig, ProducerConfig, IHeaders, logLevel } from 'kafkajs';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { EventError, ErrorCategory } from '../errors';
import { KafkaConfigOptions, KafkaMessage, KafkaMessageMetadata, RetryOptions, DeadLetterQueueOptions, SchemaValidationOptions } from './kafka.types';
import { KAFKA_DEFAULT_RETRY_OPTIONS, KAFKA_DEFAULT_DLQ_OPTIONS, KAFKA_DEFAULT_SCHEMA_OPTIONS } from './kafka.constants';
import { KafkaServiceInterface } from './kafka.interfaces';

/**
 * Core service for Kafka client management implementing NestJS lifecycle hooks.
 * Manages connection to Kafka brokers, handles the lifecycle of producers and consumers,
 * provides methods for message serialization/deserialization, and implements error handling with observability.
 * 
 * This service is the foundation for all Kafka operations across the platform.
 */
@Injectable()
export class KafkaService implements KafkaServiceInterface, OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private connectionPool: Map<string, Kafka> = new Map();
  private readonly logger: LoggerService;
  private readonly tracingService: TracingService;
  private readonly retryOptions: RetryOptions;
  private readonly dlqOptions: DeadLetterQueueOptions;
  private readonly schemaOptions: SchemaValidationOptions;
  private readonly serviceNamespace: string;

  /**
   * Initializes the Kafka service with configuration and required dependencies.
   * 
   * @param configService - Service for accessing configuration variables
   * @param logger - Logger service for operational logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    @Inject(LoggerService) logger: LoggerService,
    @Inject(TracingService) tracingService: TracingService
  ) {
    this.serviceNamespace = this.configService.get<string>('service.namespace', 'default');
    
    // Initialize the logger with the service context
    this.logger = logger.createLogger('KafkaService', { serviceNamespace: this.serviceNamespace });
    this.tracingService = tracingService;
    
    // Load retry configuration with defaults
    this.retryOptions = this.loadRetryOptions();
    
    // Load dead letter queue configuration with defaults
    this.dlqOptions = this.loadDLQOptions();
    
    // Load schema validation configuration with defaults
    this.schemaOptions = this.loadSchemaOptions();
    
    // Initialize the Kafka client
    this.kafka = this.createKafkaClient();
    
    this.logger.log(`Initialized Kafka service for namespace: ${this.serviceNamespace}`);
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
      throw new EventError(
        'Failed to initialize Kafka service',
        ErrorCategory.CONNECTION,
        'KAFKA_INIT_001',
        { serviceNamespace: this.serviceNamespace },
        error
      );
    }
  }

  /**
   * Disconnects the Kafka producer and all consumers when the module is destroyed.
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
   * Sends a message to a Kafka topic with tracing, schema validation, and error handling.
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
    options?: { schemaId?: number, validateSchema?: boolean }
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produce.${topic}`, async (span) => {
      try {
        // Add trace context to headers if available
        const messageHeaders = this.addTracingHeaders(headers || {}, span);
        
        // Validate message against schema if enabled
        if (options?.validateSchema && this.schemaOptions.enabled) {
          await this.validateMessageSchema(message, options.schemaId);
        }
        
        const serializedMessage = this.serializeMessage(message);
        
        await this.producer.send({
          topic,
          messages: [
            {
              value: serializedMessage,
              key: key ? Buffer.from(key) : null,
              headers: this.convertHeadersToBuffers(messageHeaders)
            }
          ]
        });
        
        this.logger.debug(
          `Message sent to topic ${topic}`,
          { topic, messageSize: serializedMessage.length, key }
        );
      } catch (error) {
        this.logger.error(`Failed to produce message to topic ${topic}`, error);
        
        // Attempt to send to DLQ if enabled
        if (this.dlqOptions.enabled && this.dlqOptions.producerErrors) {
          await this.sendToDLQ(topic, message, key, messageHeaders, error);
        }
        
        throw new EventError(
          `Failed to produce message to topic ${topic}`,
          ErrorCategory.PRODUCER,
          'KAFKA_PRODUCE_001',
          { topic, key },
          error
        );
      }
    });
  }

  /**
   * Sends multiple messages to a Kafka topic in a batch operation.
   * 
   * @param topic - The Kafka topic to send the messages to
   * @param messages - Array of messages with optional keys and headers
   * @param options - Optional producer options
   */
  async produceBatch(
    topic: string,
    messages: Array<{ value: any, key?: string, headers?: Record<string, string> }>,
    options?: { schemaId?: number, validateSchema?: boolean }
  ): Promise<void> {
    return this.tracingService.createSpan(`kafka.produceBatch.${topic}`, async (span) => {
      try {
        const kafkaMessages = await Promise.all(messages.map(async (msg) => {
          // Add trace context to headers if available
          const messageHeaders = this.addTracingHeaders(msg.headers || {}, span);
          
          // Validate message against schema if enabled
          if (options?.validateSchema && this.schemaOptions.enabled) {
            await this.validateMessageSchema(msg.value, options.schemaId);
          }
          
          return {
            value: this.serializeMessage(msg.value),
            key: msg.key ? Buffer.from(msg.key) : null,
            headers: this.convertHeadersToBuffers(messageHeaders)
          };
        }));
        
        await this.producer.send({
          topic,
          messages: kafkaMessages
        });
        
        this.logger.debug(
          `Batch of ${messages.length} messages sent to topic ${topic}`,
          { topic, batchSize: messages.length }
        );
      } catch (error) {
        this.logger.error(`Failed to produce batch messages to topic ${topic}`, error);
        
        // Attempt to send failed messages to DLQ if enabled
        if (this.dlqOptions.enabled && this.dlqOptions.producerErrors) {
          await Promise.all(messages.map(async (msg) => {
            await this.sendToDLQ(topic, msg.value, msg.key, msg.headers, error);
          }));
        }
        
        throw new EventError(
          `Failed to produce batch messages to topic ${topic}`,
          ErrorCategory.PRODUCER,
          'KAFKA_PRODUCE_BATCH_001',
          { topic, batchSize: messages.length },
          error
        );
      }
    });
  }

  /**
   * Subscribes to a Kafka topic and processes messages with error handling and retries.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   */
  async consume(
    topic: string,
    groupId: string,
    callback: (message: KafkaMessage, metadata: KafkaMessageMetadata) => Promise<void>,
    options?: {
      fromBeginning?: boolean,
      autoCommit?: boolean,
      schemaId?: number,
      validateSchema?: boolean
    }
  ): Promise<void> {
    try {
      const consumerKey = `${groupId}-${topic}`;
      let consumer = this.consumers.get(consumerKey);
      
      if (!consumer) {
        consumer = this.kafka.consumer({
          groupId,
          sessionTimeout: this.configService.get<number>(`kafka.${this.serviceNamespace}.sessionTimeout`, 30000),
          heartbeatInterval: this.configService.get<number>(`kafka.${this.serviceNamespace}.heartbeatInterval`, 3000),
          maxWaitTimeInMs: this.configService.get<number>(`kafka.${this.serviceNamespace}.maxWaitTimeInMs`, 5000),
          allowAutoTopicCreation: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.allowAutoTopicCreation`, false)
        });
        
        await consumer.connect();
        this.consumers.set(consumerKey, consumer);
      }
      
      await consumer.subscribe({
        topic,
        fromBeginning: options?.fromBeginning ?? false
      });
      
      await consumer.run({
        autoCommit: options?.autoCommit ?? true,
        eachMessage: async ({ topic: messageTopic, partition, message }) => {
          const messageKey = message.key?.toString();
          const messageHeaders = this.parseHeaders(message.headers);
          const messageId = messageHeaders['message-id'] || `${messageTopic}-${partition}-${message.offset}`;
          
          return this.tracingService.createSpan(`kafka.consume.${messageTopic}`, async (span) => {
            // Extract tracing context from headers if available
            this.tracingService.extractAndSetContext(messageHeaders);
            
            let retryCount = parseInt(messageHeaders['retry-count'] || '0', 10);
            let retryAttempt = 0;
            let lastError: Error | null = null;
            
            // Process with retry logic
            while (retryAttempt <= retryCount) {
              try {
                const parsedMessage = this.deserializeMessage(message.value);
                
                // Validate message against schema if enabled
                if (options?.validateSchema && this.schemaOptions.enabled) {
                  await this.validateMessageSchema(parsedMessage, options.schemaId);
                }
                
                this.logger.debug(
                  `Processing message from topic ${messageTopic}, partition ${partition}, offset ${message.offset}`,
                  { messageId, topic: messageTopic, partition, offset: message.offset }
                );
                
                // Call the user-provided callback with the message and metadata
                await callback(
                  parsedMessage,
                  {
                    topic: messageTopic,
                    partition,
                    offset: message.offset.toString(),
                    timestamp: message.timestamp,
                    headers: messageHeaders,
                    key: messageKey
                  }
                );
                
                // If we get here, processing succeeded
                break;
              } catch (error) {
                lastError = error;
                retryAttempt++;
                
                if (retryAttempt <= retryCount) {
                  // Calculate backoff time using exponential backoff with jitter
                  const backoffTime = this.calculateBackoffTime(retryAttempt);
                  
                  this.logger.warn(
                    `Error processing message, retrying in ${backoffTime}ms (attempt ${retryAttempt}/${retryCount})`,
                    { messageId, topic: messageTopic, partition, offset: message.offset, error }
                  );
                  
                  // Wait for backoff time before retrying
                  await new Promise(resolve => setTimeout(resolve, backoffTime));
                } else {
                  // All retries exhausted, log error and send to DLQ if enabled
                  this.logger.error(
                    `Failed to process message after ${retryCount} retries`,
                    { messageId, topic: messageTopic, partition, offset: message.offset, error }
                  );
                  
                  if (this.dlqOptions.enabled && this.dlqOptions.consumerErrors) {
                    await this.sendToDLQ(
                      messageTopic,
                      this.deserializeMessage(message.value),
                      messageKey,
                      messageHeaders,
                      error,
                      { partition, offset: message.offset }
                    );
                  }
                  
                  // Rethrow the error for potential custom handling by the consumer
                  throw new EventError(
                    `Failed to process message after ${retryCount} retries`,
                    ErrorCategory.CONSUMER,
                    'KAFKA_CONSUME_001',
                    { topic: messageTopic, partition, offset: message.offset, messageId },
                    lastError
                  );
                }
              }
            }
          });
        }
      });
      
      this.logger.log(`Subscribed to topic ${topic} with group ID ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to consume from topic ${topic}`, error);
      throw new EventError(
        `Failed to consume from topic ${topic}`,
        ErrorCategory.CONSUMER,
        'KAFKA_CONSUME_002',
        { topic, groupId },
        error
      );
    }
  }

  /**
   * Disconnects a specific consumer by group ID and topic.
   * 
   * @param groupId - The consumer group ID
   * @param topic - The topic the consumer is subscribed to
   */
  async disconnectConsumer(groupId: string, topic: string): Promise<void> {
    const consumerKey = `${groupId}-${topic}`;
    const consumer = this.consumers.get(consumerKey);
    
    if (consumer) {
      try {
        await consumer.disconnect();
        this.consumers.delete(consumerKey);
        this.logger.log(`Disconnected consumer for topic ${topic} with group ID ${groupId}`);
      } catch (error) {
        this.logger.error(`Error disconnecting consumer for topic ${topic}`, error);
      }
    }
  }

  /**
   * Disconnects all consumers managed by this service.
   */
  private async disconnectAllConsumers(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    
    for (const [key, consumer] of this.consumers.entries()) {
      disconnectPromises.push(
        consumer.disconnect()
          .then(() => {
            this.logger.debug(`Disconnected consumer ${key}`);
          })
          .catch(error => {
            this.logger.error(`Error disconnecting consumer ${key}`, error);
          })
      );
    }
    
    await Promise.all(disconnectPromises);
    this.consumers.clear();
    this.logger.log('All Kafka consumers disconnected');
  }

  /**
   * Creates a Kafka client with the configured options.
   * @private
   */
  private createKafkaClient(): Kafka {
    const brokers = this.configService.get<string>(`kafka.${this.serviceNamespace}.brokers`, 
                                                 this.configService.get<string>('kafka.brokers', 'localhost:9092'))
                                      .split(',');
    
    const clientId = this.configService.get<string>(`kafka.${this.serviceNamespace}.clientId`, 
                                                  this.configService.get<string>('kafka.clientId', `austa-${this.serviceNamespace}`));
    
    const config: KafkaConfig = {
      clientId,
      brokers,
      ssl: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.ssl`, 
                                          this.configService.get<boolean>('kafka.ssl', false)),
      sasl: this.getSaslConfig(),
      retry: {
        initialRetryTime: this.retryOptions.initialInterval,
        retries: this.retryOptions.maxAttempts,
        factor: this.retryOptions.multiplier,
        maxRetryTime: this.retryOptions.maxInterval
      },
      logLevel: this.getLogLevel()
    };
    
    this.logger.debug(`Creating Kafka client with brokers: ${brokers.join(', ')}`);
    return new Kafka(config);
  }

  /**
   * Connects to Kafka as a producer.
   * @private
   */
  private async connectProducer(): Promise<void> {
    try {
      const producerConfig: ProducerConfig = {
        allowAutoTopicCreation: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.allowAutoTopicCreation`, 
                                                               this.configService.get<boolean>('kafka.allowAutoTopicCreation', false)),
        transactionalId: this.configService.get<string>(`kafka.${this.serviceNamespace}.transactionalId`, 
                                                       this.configService.get<string>('kafka.transactionalId')),
        idempotent: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.idempotent`, 
                                                  this.configService.get<boolean>('kafka.idempotent', false)),
        maxInFlightRequests: this.configService.get<number>(`kafka.${this.serviceNamespace}.maxInFlightRequests`, 
                                                           this.configService.get<number>('kafka.maxInFlightRequests', 5))
      };
      
      this.producer = this.kafka.producer(producerConfig);
      
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw new EventError(
        'Failed to connect Kafka producer',
        ErrorCategory.CONNECTION,
        'KAFKA_PRODUCER_001',
        { serviceNamespace: this.serviceNamespace },
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
        this.logger.log('Kafka producer disconnected successfully');
      } catch (error) {
        this.logger.error('Error disconnecting Kafka producer', error);
      }
    }
  }

  /**
   * Serializes a message to JSON string.
   * @private
   */
  private serializeMessage(message: any): Buffer {
    try {
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to serialize message', error);
      throw new EventError(
        'Failed to serialize message',
        ErrorCategory.SERIALIZATION,
        'KAFKA_SERIALIZE_001',
        {},
        error
      );
    }
  }

  /**
   * Deserializes a message from JSON string.
   * @private
   */
  private deserializeMessage(buffer: Buffer): any {
    try {
      const message = buffer.toString();
      return JSON.parse(message);
    } catch (error) {
      this.logger.error('Failed to deserialize message', error);
      throw new EventError(
        'Failed to deserialize message',
        ErrorCategory.DESERIALIZATION,
        'KAFKA_DESERIALIZE_001',
        {},
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
        if (value !== null) {
          result[key] = value.toString();
        }
      });
    }
    
    return result;
  }

  /**
   * Converts string headers to Buffer values for Kafka.
   * @private
   */
  private convertHeadersToBuffers(headers: Record<string, string>): IHeaders {
    const result: IHeaders = {};
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = Buffer.from(value);
      });
    }
    
    return result;
  }

  /**
   * Gets SASL configuration if enabled.
   * @private
   */
  private getSaslConfig(): { mechanism: string; username: string; password: string } | undefined {
    const saslEnabled = this.configService.get<boolean>(`kafka.${this.serviceNamespace}.sasl.enabled`, 
                                                       this.configService.get<boolean>('kafka.sasl.enabled', false));
    
    if (!saslEnabled) {
      return undefined;
    }
    
    return {
      mechanism: this.configService.get<string>(`kafka.${this.serviceNamespace}.sasl.mechanism`, 
                                               this.configService.get<string>('kafka.sasl.mechanism', 'plain')),
      username: this.configService.get<string>(`kafka.${this.serviceNamespace}.sasl.username`, 
                                              this.configService.get<string>('kafka.sasl.username', '')),
      password: this.configService.get<string>(`kafka.${this.serviceNamespace}.sasl.password`, 
                                              this.configService.get<string>('kafka.sasl.password', ''))
    };
  }

  /**
   * Adds tracing headers to the message headers.
   * @private
   */
  private addTracingHeaders(headers: Record<string, string>, span: any): Record<string, string> {
    const updatedHeaders = { ...headers };
    
    // Add trace ID if available
    if (span && span.context) {
      const traceId = this.tracingService.getTraceId();
      if (traceId) {
        updatedHeaders['trace-id'] = traceId;
      }
      
      const spanId = this.tracingService.getSpanId();
      if (spanId) {
        updatedHeaders['span-id'] = spanId;
      }
    }
    
    // Add message ID if not present
    if (!updatedHeaders['message-id']) {
      updatedHeaders['message-id'] = this.generateMessageId();
    }
    
    // Add timestamp if not present
    if (!updatedHeaders['timestamp']) {
      updatedHeaders['timestamp'] = Date.now().toString();
    }
    
    return updatedHeaders;
  }

  /**
   * Generates a unique message ID.
   * @private
   */
  private generateMessageId(): string {
    return `${this.serviceNamespace}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calculates backoff time for retries using exponential backoff with jitter.
   * @private
   */
  private calculateBackoffTime(attempt: number): number {
    // Base delay with exponential backoff
    const exponentialDelay = Math.min(
      this.retryOptions.maxInterval,
      this.retryOptions.initialInterval * Math.pow(this.retryOptions.multiplier, attempt - 1)
    );
    
    // Add jitter to prevent thundering herd problem
    const jitter = this.retryOptions.jitter * Math.random();
    return Math.floor(exponentialDelay * (1 + jitter));
  }

  /**
   * Sends a failed message to the Dead Letter Queue.
   * @private
   */
  private async sendToDLQ(
    originalTopic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    error?: any,
    metadata?: { partition: number, offset: string | number }
  ): Promise<void> {
    try {
      const dlqTopic = `${originalTopic}.${this.dlqOptions.topicSuffix}`;
      const dlqHeaders = { ...headers } || {};
      
      // Add error information to headers
      dlqHeaders['original-topic'] = originalTopic;
      dlqHeaders['error-message'] = error?.message || 'Unknown error';
      dlqHeaders['error-time'] = Date.now().toString();
      dlqHeaders['service-namespace'] = this.serviceNamespace;
      
      if (metadata) {
        dlqHeaders['original-partition'] = metadata.partition.toString();
        dlqHeaders['original-offset'] = metadata.offset.toString();
      }
      
      // Send to DLQ topic
      await this.producer.send({
        topic: dlqTopic,
        messages: [
          {
            value: this.serializeMessage(message),
            key: key ? Buffer.from(key) : null,
            headers: this.convertHeadersToBuffers(dlqHeaders)
          }
        ]
      });
      
      this.logger.debug(`Message sent to DLQ topic ${dlqTopic}`, { originalTopic, dlqTopic });
    } catch (dlqError) {
      // Log but don't throw - we don't want DLQ failures to affect the main flow
      this.logger.error('Failed to send message to DLQ', dlqError, { originalTopic });
    }
  }

  /**
   * Validates a message against a schema if schema validation is enabled.
   * This is a placeholder for schema validation implementation.
   * @private
   */
  private async validateMessageSchema(message: any, schemaId?: number): Promise<void> {
    // This is a placeholder for schema validation implementation
    // In a real implementation, this would validate against a schema registry
    if (!this.schemaOptions.enabled) {
      return;
    }
    
    try {
      // Placeholder for schema validation logic
      // In a real implementation, this would use a schema registry client
      // to validate the message against the schema
      this.logger.debug('Schema validation placeholder', { schemaId });
      
      // If validation fails, throw an error
      // For now, we'll just return as this is a placeholder
    } catch (error) {
      throw new EventError(
        'Schema validation failed',
        ErrorCategory.VALIDATION,
        'KAFKA_SCHEMA_001',
        { schemaId },
        error
      );
    }
  }

  /**
   * Loads retry options from configuration with defaults.
   * @private
   */
  private loadRetryOptions(): RetryOptions {
    return {
      initialInterval: this.configService.get<number>(`kafka.${this.serviceNamespace}.retry.initialInterval`, 
                                                    this.configService.get<number>('kafka.retry.initialInterval', KAFKA_DEFAULT_RETRY_OPTIONS.initialInterval)),
      maxInterval: this.configService.get<number>(`kafka.${this.serviceNamespace}.retry.maxInterval`, 
                                                this.configService.get<number>('kafka.retry.maxInterval', KAFKA_DEFAULT_RETRY_OPTIONS.maxInterval)),
      maxAttempts: this.configService.get<number>(`kafka.${this.serviceNamespace}.retry.maxAttempts`, 
                                                this.configService.get<number>('kafka.retry.maxAttempts', KAFKA_DEFAULT_RETRY_OPTIONS.maxAttempts)),
      multiplier: this.configService.get<number>(`kafka.${this.serviceNamespace}.retry.multiplier`, 
                                               this.configService.get<number>('kafka.retry.multiplier', KAFKA_DEFAULT_RETRY_OPTIONS.multiplier)),
      jitter: this.configService.get<number>(`kafka.${this.serviceNamespace}.retry.jitter`, 
                                           this.configService.get<number>('kafka.retry.jitter', KAFKA_DEFAULT_RETRY_OPTIONS.jitter))
    };
  }

  /**
   * Loads Dead Letter Queue options from configuration with defaults.
   * @private
   */
  private loadDLQOptions(): DeadLetterQueueOptions {
    return {
      enabled: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.dlq.enabled`, 
                                              this.configService.get<boolean>('kafka.dlq.enabled', KAFKA_DEFAULT_DLQ_OPTIONS.enabled)),
      topicSuffix: this.configService.get<string>(`kafka.${this.serviceNamespace}.dlq.topicSuffix`, 
                                                 this.configService.get<string>('kafka.dlq.topicSuffix', KAFKA_DEFAULT_DLQ_OPTIONS.topicSuffix)),
      producerErrors: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.dlq.producerErrors`, 
                                                    this.configService.get<boolean>('kafka.dlq.producerErrors', KAFKA_DEFAULT_DLQ_OPTIONS.producerErrors)),
      consumerErrors: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.dlq.consumerErrors`, 
                                                    this.configService.get<boolean>('kafka.dlq.consumerErrors', KAFKA_DEFAULT_DLQ_OPTIONS.consumerErrors))
    };
  }

  /**
   * Loads schema validation options from configuration with defaults.
   * @private
   */
  private loadSchemaOptions(): SchemaValidationOptions {
    return {
      enabled: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.schema.enabled`, 
                                              this.configService.get<boolean>('kafka.schema.enabled', KAFKA_DEFAULT_SCHEMA_OPTIONS.enabled)),
      registryUrl: this.configService.get<string>(`kafka.${this.serviceNamespace}.schema.registryUrl`, 
                                                 this.configService.get<string>('kafka.schema.registryUrl', KAFKA_DEFAULT_SCHEMA_OPTIONS.registryUrl)),
      validateProducer: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.schema.validateProducer`, 
                                                       this.configService.get<boolean>('kafka.schema.validateProducer', KAFKA_DEFAULT_SCHEMA_OPTIONS.validateProducer)),
      validateConsumer: this.configService.get<boolean>(`kafka.${this.serviceNamespace}.schema.validateConsumer`, 
                                                       this.configService.get<boolean>('kafka.schema.validateConsumer', KAFKA_DEFAULT_SCHEMA_OPTIONS.validateConsumer))
    };
  }

  /**
   * Gets the log level for KafkaJS based on the application's log level.
   * @private
   */
  private getLogLevel(): logLevel {
    const appLogLevel = this.configService.get<string>('logging.level', 'info').toLowerCase();
    
    switch (appLogLevel) {
      case 'debug':
        return logLevel.DEBUG;
      case 'info':
        return logLevel.INFO;
      case 'warn':
        return logLevel.WARN;
      case 'error':
        return logLevel.ERROR;
      default:
        return logLevel.INFO;
    }
  }
}