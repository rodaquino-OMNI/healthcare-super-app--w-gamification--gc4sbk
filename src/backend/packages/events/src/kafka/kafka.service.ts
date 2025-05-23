import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage, TopicPartitionOffsetAndMetadata, RecordMetadata, ProducerRecord, ConsumerRunConfig, ConsumerSubscribeTopics, ConsumerConfig, ProducerConfig } from 'kafkajs';
import { OpenTelemetryTracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { EventValidationError, EventProcessingError, KafkaConnectionError, KafkaProducerError, KafkaConsumerError, KafkaSerializationError } from '../errors/event-errors';
import { IKafkaConfig, IKafkaConsumerOptions, IKafkaProducerOptions, IKafkaMessage, IKafkaHeaders } from './kafka.interfaces';
import { RetryPolicy, createExponentialRetryPolicy } from '../errors/retry-policies';
import { sendToDLQ } from '../errors/dlq';
import { validateEventSchema } from '../validation/schema-validator';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { KAFKA_DEFAULT_CONFIG, KAFKA_ERROR_CODES, KAFKA_RETRY_OPTIONS } from './kafka.constants';

/**
 * Enhanced Kafka service for reliable event processing across microservices.
 * Provides connection management, message serialization/deserialization, and error handling
 * with support for dead-letter queues, schema validation, and distributed tracing.
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private readonly logger: Logger;
  private readonly retryPolicy: RetryPolicy;
  private readonly serviceName: string;
  private readonly configNamespace: string;

  /**
   * Initializes the Kafka service with configuration and required dependencies.
   * 
   * @param configService - Service for accessing configuration variables
   * @param tracingService - Service for distributed tracing
   * @param loggerService - Logger service for operational logging
   * @param options - Optional service-specific configuration
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly tracingService: OpenTelemetryTracingService,
    @Inject(LoggerService) loggerService: LoggerService,
    @Inject('KAFKA_OPTIONS') private readonly options: { serviceName?: string; configNamespace?: string } = {}
  ) {
    this.serviceName = options.serviceName || this.configService.get<string>('service.name', 'austa-service');
    this.configNamespace = options.configNamespace || 'kafka';
    this.logger = loggerService.createLogger('KafkaService');
    this.retryPolicy = createExponentialRetryPolicy(this.getRetryOptions());
    
    this.initializeKafkaClient();
  }

  /**
   * Initializes the Kafka client with configuration from the service-specific namespace
   */
  private initializeKafkaClient(): void {
    try {
      const config = this.getKafkaConfig();
      this.logger.log(`Initializing Kafka client with brokers: ${config.brokers.join(', ')}`);
      
      this.kafka = new Kafka({
        clientId: config.clientId,
        brokers: config.brokers,
        ssl: config.ssl,
        sasl: config.sasl,
        connectionTimeout: config.connectionTimeout,
        requestTimeout: config.requestTimeout,
        retry: {
          initialRetryTime: config.retry.initialRetryTime,
          retries: config.retry.retries,
          maxRetryTime: config.retry.maxRetryTime,
          factor: config.retry.factor,
          multiplier: config.retry.multiplier
        },
        logCreator: () => ({
          namespace, level, label, log
        }) => {
          const { message, ...extra } = log;
          switch (level) {
            case 0: // ERROR
              this.logger.error(`[${namespace}] ${message}`, extra);
              break;
            case 1: // WARN
              this.logger.warn(`[${namespace}] ${message}`, extra);
              break;
            case 2: // INFO
              this.logger.log(`[${namespace}] ${message}`, extra);
              break;
            case 3: // DEBUG
            case 4: // TRACE
              this.logger.debug(`[${namespace}] ${message}`, extra);
              break;
            default:
              this.logger.log(`[${namespace}] ${message}`, extra);
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize Kafka client', error);
      throw new KafkaConnectionError(
        'Failed to initialize Kafka client',
        KAFKA_ERROR_CODES.INITIALIZATION_ERROR,
        { serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Initializes the Kafka producer and connects when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connectProducer();
      this.logger.log('Kafka service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka service', error);
      throw new KafkaConnectionError(
        'Failed to initialize Kafka service',
        KAFKA_ERROR_CODES.INITIALIZATION_ERROR,
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
   * Sends a message to a Kafka topic with tracing, validation, and error handling.
   * 
   * @param topic - The Kafka topic to send the message to
   * @param message - The message object to be serialized and sent
   * @param key - Optional message key for partitioning
   * @param headers - Optional message headers
   * @param options - Optional producer options
   * @returns Promise with the record metadata
   */
  async produce<T extends IBaseEvent>(
    topic: string, 
    message: T, 
    key?: string, 
    headers?: IKafkaHeaders,
    options?: IKafkaProducerOptions
  ): Promise<RecordMetadata[]> {
    return this.tracingService.startActiveSpan(`kafka.produce.${topic}`, async (span) => {
      try {
        // Add validation if schema is provided
        if (options?.schemaId) {
          const validationResult = await validateEventSchema(message, options.schemaId);
          if (!validationResult.valid) {
            throw new EventValidationError(
              `Event validation failed for topic ${topic}`,
              KAFKA_ERROR_CODES.VALIDATION_ERROR,
              { 
                topic, 
                errors: validationResult.errors,
                eventType: message.type
              }
            );
          }
        }

        // Add tracing context to headers
        const tracingHeaders = this.tracingService.getPropagationHeaders();
        const enrichedHeaders = {
          ...headers,
          ...tracingHeaders,
          'x-event-id': message.eventId || crypto.randomUUID(),
          'x-source-service': this.serviceName,
          'x-event-type': message.type,
          'x-event-version': message.version?.toString() || '1.0.0',
          'x-timestamp': new Date().toISOString()
        };

        // Add span attributes for observability
        span.setAttributes({
          'messaging.system': 'kafka',
          'messaging.destination': topic,
          'messaging.destination_kind': 'topic',
          'messaging.kafka.message_key': key,
          'messaging.kafka.client_id': this.getKafkaConfig().clientId,
          'event.type': message.type,
          'event.id': message.eventId
        });

        const serializedMessage = this.serializeMessage(message);
        
        const producerRecord: ProducerRecord = {
          topic,
          messages: [
            {
              value: serializedMessage,
              key: key ? Buffer.from(key) : null,
              headers: this.formatHeaders(enrichedHeaders)
            }
          ],
          acks: options?.acks ?? -1, // Default to all acks for reliability
          timeout: options?.timeout ?? this.getKafkaConfig().requestTimeout
        };

        const result = await this.producer.send(producerRecord);
        
        this.logger.debug(
          `Message sent to topic ${topic}: ${serializedMessage.slice(0, 100)}${serializedMessage.length > 100 ? '...' : ''}`,
          { eventType: message.type, eventId: message.eventId }
        );

        return result;
      } catch (error) {
        this.logger.error(`Failed to produce message to topic ${topic}`, error);
        
        // Determine if we should retry based on the error type
        const shouldRetry = this.retryPolicy.shouldRetry(error);
        
        if (shouldRetry && options?.retry !== false) {
          const retryDelay = this.retryPolicy.getDelayForAttempt(options?.retryAttempt || 0);
          
          if (retryDelay !== null) {
            this.logger.log(`Retrying message production to topic ${topic} after ${retryDelay}ms`);
            
            // Wait for the retry delay
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Retry with incremented attempt count
            return this.produce(topic, message, key, headers, {
              ...options,
              retryAttempt: (options?.retryAttempt || 0) + 1
            });
          }
        }
        
        // If we shouldn't retry or have exhausted retries, throw the error
        throw new KafkaProducerError(
          `Failed to produce message to topic ${topic}`,
          KAFKA_ERROR_CODES.PRODUCER_ERROR,
          { 
            topic, 
            eventType: message.type,
            eventId: message.eventId
          },
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
   * @returns Promise with the record metadata
   */
  async produceBatch<T extends IBaseEvent>(
    topic: string,
    messages: Array<{
      message: T;
      key?: string;
      headers?: IKafkaHeaders;
    }>,
    options?: IKafkaProducerOptions
  ): Promise<RecordMetadata[]> {
    return this.tracingService.startActiveSpan(`kafka.produceBatch.${topic}`, async (span) => {
      try {
        // Add span attributes for observability
        span.setAttributes({
          'messaging.system': 'kafka',
          'messaging.destination': topic,
          'messaging.destination_kind': 'topic',
          'messaging.kafka.client_id': this.getKafkaConfig().clientId,
          'batch.size': messages.length
        });

        const kafkaMessages = await Promise.all(messages.map(async ({ message, key, headers }) => {
          // Validate if schema is provided
          if (options?.schemaId) {
            const validationResult = await validateEventSchema(message, options.schemaId);
            if (!validationResult.valid) {
              throw new EventValidationError(
                `Event validation failed for topic ${topic}`,
                KAFKA_ERROR_CODES.VALIDATION_ERROR,
                { 
                  topic, 
                  errors: validationResult.errors,
                  eventType: message.type,
                  eventId: message.eventId
                }
              );
            }
          }

          // Add tracing context to headers
          const tracingHeaders = this.tracingService.getPropagationHeaders();
          const enrichedHeaders = {
            ...headers,
            ...tracingHeaders,
            'x-event-id': message.eventId || crypto.randomUUID(),
            'x-source-service': this.serviceName,
            'x-event-type': message.type,
            'x-event-version': message.version?.toString() || '1.0.0',
            'x-timestamp': new Date().toISOString()
          };

          return {
            value: this.serializeMessage(message),
            key: key ? Buffer.from(key) : null,
            headers: this.formatHeaders(enrichedHeaders)
          };
        }));

        const producerRecord: ProducerRecord = {
          topic,
          messages: kafkaMessages,
          acks: options?.acks ?? -1, // Default to all acks for reliability
          timeout: options?.timeout ?? this.getKafkaConfig().requestTimeout
        };

        const result = await this.producer.send(producerRecord);
        
        this.logger.debug(
          `Batch of ${messages.length} messages sent to topic ${topic}`,
          { batchSize: messages.length }
        );

        return result;
      } catch (error) {
        this.logger.error(`Failed to produce batch messages to topic ${topic}`, error);
        
        // Determine if we should retry based on the error type
        const shouldRetry = this.retryPolicy.shouldRetry(error);
        
        if (shouldRetry && options?.retry !== false) {
          const retryDelay = this.retryPolicy.getDelayForAttempt(options?.retryAttempt || 0);
          
          if (retryDelay !== null) {
            this.logger.log(`Retrying batch message production to topic ${topic} after ${retryDelay}ms`);
            
            // Wait for the retry delay
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Retry with incremented attempt count
            return this.produceBatch(topic, messages, {
              ...options,
              retryAttempt: (options?.retryAttempt || 0) + 1
            });
          }
        }
        
        throw new KafkaProducerError(
          `Failed to produce batch messages to topic ${topic}`,
          KAFKA_ERROR_CODES.PRODUCER_ERROR,
          { topic, batchSize: messages.length },
          error
        );
      }
    });
  }

  /**
   * Subscribes to a Kafka topic and processes messages with error handling and DLQ support.
   * 
   * @param topic - The Kafka topic to subscribe to
   * @param groupId - The consumer group ID
   * @param callback - The function to process each message
   * @param options - Optional consumer configuration
   * @returns Promise that resolves when subscription is established
   */
  async consume<T extends IBaseEvent>(
    topic: string,
    groupId: string,
    callback: (message: T, metadata: IKafkaMessage) => Promise<void>,
    options?: IKafkaConsumerOptions
  ): Promise<void> {
    try {
      const consumerKey = `${groupId}-${topic}`;
      let consumer = this.consumers.get(consumerKey);
      
      if (!consumer) {
        const consumerConfig: ConsumerConfig = {
          groupId,
          sessionTimeout: options?.sessionTimeout || this.configService.get<number>(`${this.configNamespace}.sessionTimeout`, 30000),
          heartbeatInterval: options?.heartbeatInterval || this.configService.get<number>(`${this.configNamespace}.heartbeatInterval`, 3000),
          maxWaitTimeInMs: options?.maxWaitTimeInMs || this.configService.get<number>(`${this.configNamespace}.maxWaitTimeInMs`, 1000),
          allowAutoTopicCreation: options?.allowAutoTopicCreation || this.configService.get<boolean>(`${this.configNamespace}.allowAutoTopicCreation`, false),
          maxBytesPerPartition: options?.maxBytesPerPartition || this.configService.get<number>(`${this.configNamespace}.maxBytesPerPartition`, 1048576),
          readUncommitted: options?.readUncommitted || false
        };
        
        consumer = this.kafka.consumer(consumerConfig);
        this.consumers.set(consumerKey, consumer);
        
        await consumer.connect();
        this.logger.log(`Kafka consumer connected successfully with group ID ${groupId}`);
      }
      
      const subscribeOptions: ConsumerSubscribeTopics = {
        topic,
        fromBeginning: options?.fromBeginning || false
      };
      
      await consumer.subscribe(subscribeOptions);
      
      const runConfig: ConsumerRunConfig = {
        eachBatchAutoResolve: options?.eachBatchAutoResolve || true,
        autoCommit: options?.autoCommit !== false,
        autoCommitInterval: options?.autoCommitInterval || 5000,
        autoCommitThreshold: options?.autoCommitThreshold || 100,
        partitionsConsumedConcurrently: options?.partitionsConsumedConcurrently || 1,
        eachBatch: options?.batchProcessing ? 
          async ({ batch, resolveOffset, heartbeat, isRunning, commitOffsetsIfNecessary }) => {
            const messages: Array<{ message: T; metadata: IKafkaMessage }> = [];
            
            for (const message of batch.messages) {
              if (!isRunning() || !message.value) continue;
              
              try {
                const parsedMessage = this.deserializeMessage<T>(message.value);
                const messageKey = message.key?.toString();
                const messageHeaders = this.parseHeaders(message.headers);
                
                messages.push({
                  message: parsedMessage,
                  metadata: {
                    topic: batch.topic,
                    partition: batch.partition,
                    offset: message.offset,
                    timestamp: message.timestamp,
                    key: messageKey,
                    headers: messageHeaders
                  }
                });
                
                resolveOffset(message.offset);
              } catch (error) {
                this.logger.error(
                  `Error deserializing message from topic ${batch.topic}, partition ${batch.partition}, offset ${message.offset}`,
                  error
                );
                
                // Handle deserialization errors by sending to DLQ if enabled
                if (options?.dlq?.enabled) {
                  await this.handleDLQ(
                    batch.topic,
                    message,
                    error,
                    options.dlq.topic || `${batch.topic}.dlq`,
                    { partition: batch.partition, offset: message.offset }
                  );
                }
                
                resolveOffset(message.offset);
              }
              
              await heartbeat();
            }
            
            if (messages.length > 0) {
              try {
                await this.tracingService.startActiveSpan(`kafka.consumeBatch.${batch.topic}`, async (span) => {
                  span.setAttributes({
                    'messaging.system': 'kafka',
                    'messaging.destination': batch.topic,
                    'messaging.destination_kind': 'topic',
                    'messaging.kafka.consumer_group': groupId,
                    'messaging.kafka.client_id': this.getKafkaConfig().clientId,
                    'messaging.kafka.partition': batch.partition,
                    'batch.size': messages.length
                  });
                  
                  // Process the batch of messages
                  if (options?.batchCallback) {
                    await options.batchCallback(messages.map(m => m.message), {
                      topic: batch.topic,
                      partition: batch.partition,
                      messageCount: messages.length
                    });
                  } else {
                    // Process messages individually if no batch callback is provided
                    for (const { message, metadata } of messages) {
                      await callback(message, metadata);
                    }
                  }
                });
              } catch (error) {
                this.logger.error(
                  `Error processing batch from topic ${batch.topic}, partition ${batch.partition}`,
                  error
                );
                
                // Handle batch processing errors
                if (options?.dlq?.enabled && options?.dlq?.sendOnBatchFailure) {
                  for (let i = 0; i < batch.messages.length; i++) {
                    await this.handleDLQ(
                      batch.topic,
                      batch.messages[i],
                      error,
                      options.dlq.topic || `${batch.topic}.dlq`,
                      { partition: batch.partition, offset: batch.messages[i].offset }
                    );
                  }
                }
              }
            }
            
            if (options?.autoCommit === false) {
              await commitOffsetsIfNecessary();
            }
          } : undefined,
        eachMessage: !options?.batchProcessing ? 
          async ({ topic, partition, message }) => {
            if (!message.value) return;
            
            return this.tracingService.startActiveSpan(`kafka.consume.${topic}`, async (span) => {
              const messageKey = message.key?.toString();
              const messageHeaders = this.parseHeaders(message.headers);
              
              // Extract tracing context from headers and set span attributes
              this.tracingService.setSpanContextFromHeaders(span, messageHeaders);
              span.setAttributes({
                'messaging.system': 'kafka',
                'messaging.destination': topic,
                'messaging.destination_kind': 'topic',
                'messaging.kafka.message_key': messageKey,
                'messaging.kafka.consumer_group': groupId,
                'messaging.kafka.client_id': this.getKafkaConfig().clientId,
                'messaging.kafka.partition': partition,
                'messaging.kafka.offset': message.offset
              });
              
              try {
                const parsedMessage = this.deserializeMessage<T>(message.value);
                
                // Add event-specific attributes to span
                if (parsedMessage.type) {
                  span.setAttribute('event.type', parsedMessage.type);
                }
                if (parsedMessage.eventId) {
                  span.setAttribute('event.id', parsedMessage.eventId);
                }
                
                this.logger.debug(
                  `Processing message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
                  { eventType: parsedMessage.type, eventId: parsedMessage.eventId }
                );
                
                // Validate message against schema if provided
                if (options?.schemaId) {
                  const validationResult = await validateEventSchema(parsedMessage, options.schemaId);
                  if (!validationResult.valid) {
                    throw new EventValidationError(
                      `Event validation failed for topic ${topic}`,
                      KAFKA_ERROR_CODES.VALIDATION_ERROR,
                      { 
                        topic, 
                        errors: validationResult.errors,
                        eventType: parsedMessage.type,
                        eventId: parsedMessage.eventId
                      }
                    );
                  }
                }
                
                const metadata: IKafkaMessage = {
                  topic,
                  partition,
                  offset: message.offset,
                  timestamp: message.timestamp,
                  key: messageKey,
                  headers: messageHeaders
                };
                
                await callback(parsedMessage, metadata);
              } catch (error) {
                this.logger.error(
                  `Error processing message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
                  error
                );
                
                // Handle processing errors by sending to DLQ if enabled
                if (options?.dlq?.enabled) {
                  await this.handleDLQ(
                    topic,
                    message,
                    error,
                    options.dlq.topic || `${topic}.dlq`,
                    { partition, offset: message.offset }
                  );
                }
                
                // Don't rethrow to prevent consumer from crashing
                // but mark the span as errored
                span.recordException(error);
                span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
              }
            });
          } : undefined
      };
      
      await consumer.run(runConfig);
      
      this.logger.log(`Subscribed to topic ${topic} with group ID ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to consume from topic ${topic}`, error);
      throw new KafkaConsumerError(
        `Failed to consume from topic ${topic}`,
        KAFKA_ERROR_CODES.CONSUMER_ERROR,
        { topic, groupId, serviceName: this.serviceName },
        error
      );
    }
  }

  /**
   * Handles sending a failed message to the Dead Letter Queue (DLQ).
   * 
   * @param sourceTopic - The original topic the message was consumed from
   * @param message - The original Kafka message
   * @param error - The error that occurred during processing
   * @param dlqTopic - The DLQ topic to send the message to
   * @param metadata - Additional metadata about the message
   */
  private async handleDLQ(
    sourceTopic: string,
    message: KafkaMessage,
    error: Error,
    dlqTopic: string,
    metadata: { partition: number; offset: string }
  ): Promise<void> {
    try {
      await sendToDLQ({
        producer: this.producer,
        sourceTopic,
        dlqTopic,
        message,
        error,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          serviceName: this.serviceName,
          errorMessage: error.message,
          errorName: error.name,
          errorStack: error.stack
        }
      });
      
      this.logger.log(
        `Message from topic ${sourceTopic}, partition ${metadata.partition}, offset ${metadata.offset} sent to DLQ ${dlqTopic}`,
        { error: error.message }
      );
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to DLQ ${dlqTopic}`,
        dlqError
      );
    }
  }

  /**
   * Commits specific offsets for a consumer group.
   * 
   * @param groupId - The consumer group ID
   * @param topic - The topic to commit offsets for
   * @param offsets - The offsets to commit
   */
  async commitOffsets(
    groupId: string,
    topic: string,
    offsets: Array<TopicPartitionOffsetAndMetadata>
  ): Promise<void> {
    const consumerKey = `${groupId}-${topic}`;
    const consumer = this.consumers.get(consumerKey);
    
    if (!consumer) {
      throw new KafkaConsumerError(
        `Consumer not found for group ${groupId} and topic ${topic}`,
        KAFKA_ERROR_CODES.CONSUMER_NOT_FOUND,
        { groupId, topic }
      );
    }
    
    try {
      await consumer.commitOffsets(offsets);
      this.logger.debug(
        `Committed offsets for topic ${topic}, group ${groupId}`,
        { offsets }
      );
    } catch (error) {
      this.logger.error(
        `Failed to commit offsets for topic ${topic}, group ${groupId}`,
        error
      );
      throw new KafkaConsumerError(
        `Failed to commit offsets for topic ${topic}`,
        KAFKA_ERROR_CODES.COMMIT_ERROR,
        { topic, groupId },
        error
      );
    }
  }

  /**
   * Pauses consumption for specific topic-partitions.
   * 
   * @param groupId - The consumer group ID
   * @param topicPartitions - The topic-partitions to pause
   */
  async pauseConsumer(
    groupId: string,
    topic: string,
    topicPartitions: Array<{ topic: string; partitions: number[] }>
  ): Promise<void> {
    const consumerKey = `${groupId}-${topic}`;
    const consumer = this.consumers.get(consumerKey);
    
    if (!consumer) {
      throw new KafkaConsumerError(
        `Consumer not found for group ${groupId} and topic ${topic}`,
        KAFKA_ERROR_CODES.CONSUMER_NOT_FOUND,
        { groupId, topic }
      );
    }
    
    try {
      await consumer.pause(topicPartitions);
      this.logger.log(
        `Paused consumption for topic-partitions`,
        { topicPartitions }
      );
    } catch (error) {
      this.logger.error(
        `Failed to pause consumption for topic-partitions`,
        error
      );
      throw new KafkaConsumerError(
        `Failed to pause consumption`,
        KAFKA_ERROR_CODES.CONSUMER_ERROR,
        { topicPartitions },
        error
      );
    }
  }

  /**
   * Resumes consumption for specific topic-partitions.
   * 
   * @param groupId - The consumer group ID
   * @param topicPartitions - The topic-partitions to resume
   */
  async resumeConsumer(
    groupId: string,
    topic: string,
    topicPartitions: Array<{ topic: string; partitions: number[] }>
  ): Promise<void> {
    const consumerKey = `${groupId}-${topic}`;
    const consumer = this.consumers.get(consumerKey);
    
    if (!consumer) {
      throw new KafkaConsumerError(
        `Consumer not found for group ${groupId} and topic ${topic}`,
        KAFKA_ERROR_CODES.CONSUMER_NOT_FOUND,
        { groupId, topic }
      );
    }
    
    try {
      await consumer.resume(topicPartitions);
      this.logger.log(
        `Resumed consumption for topic-partitions`,
        { topicPartitions }
      );
    } catch (error) {
      this.logger.error(
        `Failed to resume consumption for topic-partitions`,
        error
      );
      throw new KafkaConsumerError(
        `Failed to resume consumption`,
        KAFKA_ERROR_CODES.CONSUMER_ERROR,
        { topicPartitions },
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
        this.logger.log(`Kafka consumer for group ${groupId} and topic ${topic} disconnected successfully`);
      } catch (error) {
        this.logger.error(`Error disconnecting Kafka consumer for group ${groupId} and topic ${topic}`, error);
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
            this.logger.log(`Kafka consumer ${key} disconnected successfully`);
          })
          .catch(error => {
            this.logger.error(`Error disconnecting Kafka consumer ${key}`, error);
          })
      );
    }
    
    await Promise.allSettled(disconnectPromises);
    this.consumers.clear();
    this.logger.log('All Kafka consumers disconnected');
  }

  /**
   * Connects to Kafka as a producer with connection pooling.
   */
  private async connectProducer(): Promise<void> {
    // Use connection pooling to prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = (async () => {
      try {
        const producerConfig: ProducerConfig = {
          allowAutoTopicCreation: this.configService.get<boolean>(`${this.configNamespace}.allowAutoTopicCreation`, false),
          transactionalId: this.configService.get<string>(`${this.configNamespace}.transactionalId`),
          idempotent: this.configService.get<boolean>(`${this.configNamespace}.idempotent`, true),
          maxInFlightRequests: this.configService.get<number>(`${this.configNamespace}.maxInFlightRequests`, 5),
          retry: {
            initialRetryTime: this.getRetryOptions().initialRetryTime,
            retries: this.getRetryOptions().maxRetries,
            maxRetryTime: this.getRetryOptions().maxRetryTime,
            factor: this.getRetryOptions().factor
          }
        };
        
        this.producer = this.kafka.producer(producerConfig);
        
        await this.producer.connect();
        this.logger.log('Kafka producer connected successfully');
      } catch (error) {
        this.logger.error('Failed to connect Kafka producer', error);
        this.connectionPromise = null;
        throw new KafkaConnectionError(
          'Failed to connect Kafka producer',
          KAFKA_ERROR_CODES.CONNECTION_ERROR,
          { serviceName: this.serviceName },
          error
        );
      }
    })();
    
    try {
      await this.connectionPromise;
      return;
    } finally {
      // Clear the promise after it resolves or rejects
      this.connectionPromise = null;
    }
  }

  /**
   * Disconnects the Kafka producer.
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
   * Serializes a message to JSON string with error handling.
   */
  private serializeMessage(message: any): Buffer {
    try {
      return Buffer.from(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Failed to serialize message', error);
      throw new KafkaSerializationError(
        'Failed to serialize message',
        KAFKA_ERROR_CODES.SERIALIZATION_ERROR,
        { messageType: typeof message },
        error
      );
    }
  }

  /**
   * Deserializes a message from JSON string with error handling.
   */
  private deserializeMessage<T>(buffer: Buffer): T {
    try {
      const message = buffer.toString();
      return JSON.parse(message) as T;
    } catch (error) {
      this.logger.error('Failed to deserialize message', error);
      throw new KafkaSerializationError(
        'Failed to deserialize message',
        KAFKA_ERROR_CODES.DESERIALIZATION_ERROR,
        { bufferLength: buffer.length },
        error
      );
    }
  }

  /**
   * Parses Kafka message headers from binary to string key-value pairs.
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
   * Formats headers for Kafka messages, converting string values to Buffer.
   */
  private formatHeaders(headers: Record<string, string>): Record<string, Buffer> {
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
   * Gets SASL configuration if enabled from the service-specific namespace.
   */
  private getSaslConfig(): { mechanism: string; username: string; password: string } | undefined {
    const saslEnabled = this.configService.get<boolean>(`${this.configNamespace}.sasl.enabled`, false);
    
    if (!saslEnabled) {
      return undefined;
    }
    
    return {
      mechanism: this.configService.get<string>(`${this.configNamespace}.sasl.mechanism`, 'plain'),
      username: this.configService.get<string>(`${this.configNamespace}.sasl.username`, ''),
      password: this.configService.get<string>(`${this.configNamespace}.sasl.password`, '')
    };
  }

  /**
   * Gets Kafka configuration from the service-specific namespace.
   */
  private getKafkaConfig(): IKafkaConfig {
    const brokers = this.configService.get<string>(`${this.configNamespace}.brokers`, 'localhost:9092').split(',');
    const clientId = this.configService.get<string>(`${this.configNamespace}.clientId`, this.serviceName);
    
    return {
      clientId,
      brokers,
      ssl: this.configService.get<boolean>(`${this.configNamespace}.ssl`, false),
      sasl: this.getSaslConfig(),
      connectionTimeout: this.configService.get<number>(`${this.configNamespace}.connectionTimeout`, KAFKA_DEFAULT_CONFIG.connectionTimeout),
      requestTimeout: this.configService.get<number>(`${this.configNamespace}.requestTimeout`, KAFKA_DEFAULT_CONFIG.requestTimeout),
      retry: {
        initialRetryTime: this.configService.get<number>(`${this.configNamespace}.retry.initialRetryTime`, KAFKA_DEFAULT_CONFIG.retry.initialRetryTime),
        retries: this.configService.get<number>(`${this.configNamespace}.retry.retries`, KAFKA_DEFAULT_CONFIG.retry.retries),
        maxRetryTime: this.configService.get<number>(`${this.configNamespace}.retry.maxRetryTime`, KAFKA_DEFAULT_CONFIG.retry.maxRetryTime),
        factor: this.configService.get<number>(`${this.configNamespace}.retry.factor`, KAFKA_DEFAULT_CONFIG.retry.factor),
        multiplier: this.configService.get<number>(`${this.configNamespace}.retry.multiplier`, KAFKA_DEFAULT_CONFIG.retry.multiplier)
      }
    };
  }

  /**
   * Gets retry options from configuration.
   */
  private getRetryOptions() {
    return {
      maxRetries: this.configService.get<number>(`${this.configNamespace}.retry.maxRetries`, KAFKA_RETRY_OPTIONS.maxRetries),
      initialRetryTime: this.configService.get<number>(`${this.configNamespace}.retry.initialRetryTime`, KAFKA_RETRY_OPTIONS.initialRetryTime),
      maxRetryTime: this.configService.get<number>(`${this.configNamespace}.retry.maxRetryTime`, KAFKA_RETRY_OPTIONS.maxRetryTime),
      factor: this.configService.get<number>(`${this.configNamespace}.retry.factor`, KAFKA_RETRY_OPTIONS.factor),
      retryableErrors: this.configService.get<string[]>(`${this.configNamespace}.retry.retryableErrors`, KAFKA_RETRY_OPTIONS.retryableErrors)
    };
  }
}