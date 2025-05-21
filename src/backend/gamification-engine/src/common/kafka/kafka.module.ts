import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import from @austa/events package for Kafka functionality
import {
  KafkaConsumerFactory,
  KafkaProducerFactory,
  KafkaService,
  KafkaConsumerOptions,
  KafkaProducerOptions,
  KafkaRetryPolicy,
  DeadLetterQueueService,
  KafkaHealthIndicator
} from '@austa/events/kafka';

// Import from @austa/interfaces package for type-safe event schemas
import {
  GamificationEvent,
  EventType,
  JourneyType
} from '@austa/interfaces/gamification/events';

// Import observability modules
import { LoggerModule, LoggerService } from '@austa/logging';
import { TracingModule, TracingService } from '@austa/tracing';

// Import local services and utilities
import { BaseConsumer } from './base-consumer.abstract';
import { BaseProducer } from './base-producer.abstract';
import { DlqService } from './dlq.service';
import { DlqController } from './dlq.controller';
import { ErrorHandler } from './error-handler';
import { MessageSerializer } from './message-serializer';
import { RetryStrategy } from './retry.strategy';
import { KafkaTypes } from './kafka.types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DlqEntry } from './entities/dlq-entry.entity';

/**
 * Configuration options for the Kafka module
 */
export interface KafkaModuleOptions {
  /**
   * Client ID for Kafka connections
   * @default 'gamification-engine'
   */
  clientId?: string;

  /**
   * Array of Kafka broker addresses
   * @example ['kafka:9092']
   */
  brokers?: string[];

  /**
   * Consumer group ID
   * @default 'gamification-consumer-group'
   */
  groupId?: string;

  /**
   * Journey-specific consumer group IDs
   */
  journeyGroupIds?: {
    health?: string;
    care?: string;
    plan?: string;
    user?: string;
  };

  /**
   * Topic configurations
   */
  topics?: {
    health?: string;
    care?: string;
    plan?: string;
    user?: string;
    dlq?: string;
    error?: string;
  };

  /**
   * SSL configuration
   */
  ssl?: boolean;

  /**
   * SASL authentication configuration
   */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };

  /**
   * Retry policy configuration
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     * @default 5
     */
    maxRetries?: number;

    /**
     * Initial retry delay in milliseconds
     * @default 1000
     */
    initialRetryTimeMs?: number;

    /**
     * Maximum retry delay in milliseconds
     * @default 30000
     */
    maxRetryTimeMs?: number;

    /**
     * Backoff multiplier for exponential backoff
     * @default 2
     */
    backoffMultiplier?: number;

    /**
     * Whether to add jitter to retry delays
     * @default true
     */
    jitter?: boolean;
  };

  /**
   * Dead letter queue configuration
   */
  deadLetterQueue?: {
    /**
     * Whether to enable dead letter queue
     * @default true
     */
    enabled?: boolean;

    /**
     * Dead letter queue topic suffix
     * @default '-dlq'
     */
    suffix?: string;
  };

  /**
   * Whether to allow auto topic creation
   * @default false
   */
  allowAutoTopicCreation?: boolean;
}

/**
 * Kafka module for the gamification engine that registers and configures all Kafka-related providers.
 * 
 * Features:
 * - Configurable through dynamic module pattern
 * - Type-safe event schemas using @austa/interfaces
 * - Dead-letter queues for failed message handling
 * - Exponential backoff retry strategies
 * - Journey-specific consumer groups
 * - Comprehensive error handling and observability
 */
@Module({
  imports: [
    LoggerModule,
    TracingModule,
    TypeOrmModule.forFeature([DlqEntry])
  ],
  controllers: [
    DlqController
  ],
  providers: [
    ErrorHandler,
    MessageSerializer,
    RetryStrategy,
    DlqService
  ],
  exports: [
    ErrorHandler,
    MessageSerializer,
    RetryStrategy,
    DlqService
  ]
})
export class KafkaModule {
  /**
   * Register the Kafka module with static configuration
   * @param options Kafka module configuration options
   * @returns Dynamic module
   */
  static forRoot(options: KafkaModuleOptions = {}): DynamicModule {
    const providers = this.createProviders(options);

    return {
      module: KafkaModule,
      imports: [
        LoggerModule,
        TracingModule,
        TypeOrmModule.forFeature([DlqEntry])
      ],
      providers,
      exports: providers
    };
  }

  /**
   * Register the Kafka module with async configuration
   * @param options Async module options
   * @returns Dynamic module
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || []
      },
      ...this.createAsyncProviders()
    ];

    return {
      module: KafkaModule,
      imports: [...(options.imports || []), LoggerModule, TracingModule, TypeOrmModule.forFeature([DlqEntry])],
      providers,
      exports: providers
    };
  }

  /**
   * Create providers with static configuration
   * @param options Kafka module configuration options
   * @returns Array of providers
   */
  private static createProviders(options: KafkaModuleOptions): Provider[] {
    const retryPolicy: KafkaRetryPolicy = {
      maxRetries: options.retry?.maxRetries ?? 5,
      initialRetryTimeMs: options.retry?.initialRetryTimeMs ?? 1000,
      maxRetryTimeMs: options.retry?.maxRetryTimeMs ?? 30000,
      backoffMultiplier: options.retry?.backoffMultiplier ?? 2,
      jitter: options.retry?.jitter ?? true
    };

    return [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useValue: options
      },
      {
        provide: 'KAFKA_RETRY_POLICY',
        useValue: retryPolicy
      },
      {
        provide: KafkaService,
        useFactory: (loggerService: LoggerService, tracingService: TracingService) => {
          return new KafkaService({
            clientId: options.clientId || 'gamification-engine',
            brokers: options.brokers || ['localhost:9092'],
            ssl: options.ssl || false,
            sasl: options.sasl,
            loggerService,
            tracingService,
            allowAutoTopicCreation: options.allowAutoTopicCreation || false
          });
        },
        inject: [LoggerService, TracingService]
      },
      {
        provide: KafkaConsumerFactory,
        useFactory: (kafkaService: KafkaService, loggerService: LoggerService) => {
          return new KafkaConsumerFactory(kafkaService, {
            groupId: options.groupId || 'gamification-consumer-group',
            loggerService
          });
        },
        inject: [KafkaService, LoggerService]
      },
      {
        provide: KafkaProducerFactory,
        useFactory: (kafkaService: KafkaService, loggerService: LoggerService, tracingService: TracingService) => {
          return new KafkaProducerFactory(kafkaService, {
            retryPolicy,
            loggerService,
            tracingService
          });
        },
        inject: [KafkaService, LoggerService, TracingService]
      },
      {
        provide: DlqService,
        useFactory: (producerFactory: KafkaProducerFactory, loggerService: LoggerService, configService: ConfigService, dlqRepository: Repository<DlqEntry>, transactionService: TransactionService) => {
          return new DlqService(
            dlqRepository,
            producerFactory.createProducer(),
            configService,
            transactionService
          );
        },
        inject: [KafkaProducerFactory, LoggerService, ConfigService, getRepositoryToken(DlqEntry), TransactionService]
      },
      {
        provide: getRepositoryToken(DlqEntry),
        useFactory: (connection: Connection) => connection.getRepository(DlqEntry),
        inject: [Connection]
      },
      {
        provide: KafkaHealthIndicator,
        useFactory: (kafkaService: KafkaService) => {
          return new KafkaHealthIndicator(kafkaService);
        },
        inject: [KafkaService]
      },
      {
        provide: RetryStrategy,
        useFactory: (loggerService: LoggerService) => {
          return new RetryStrategy({
            ...retryPolicy,
            loggerService
          });
        },
        inject: [LoggerService]
      },
      {
        provide: ErrorHandler,
        useFactory: (loggerService: LoggerService, tracingService: TracingService) => {
          return new ErrorHandler(loggerService, tracingService);
        },
        inject: [LoggerService, TracingService]
      },
      {
        provide: MessageSerializer,
        useFactory: (errorHandler: ErrorHandler) => {
          return new MessageSerializer(errorHandler);
        },
        inject: [ErrorHandler]
      },
      BaseConsumer,
      BaseProducer
    ];
  }

  /**
   * Create providers with async configuration
   * @returns Array of providers
   */
  private static createAsyncProviders(): Provider[] {
    return [
      {
        provide: 'KAFKA_RETRY_POLICY',
        useFactory: (options: KafkaModuleOptions) => {
          return {
            maxRetries: options.retry?.maxRetries ?? 5,
            initialRetryTimeMs: options.retry?.initialRetryTimeMs ?? 1000,
            maxRetryTimeMs: options.retry?.maxRetryTimeMs ?? 30000,
            backoffMultiplier: options.retry?.backoffMultiplier ?? 2,
            jitter: options.retry?.jitter ?? true
          };
        },
        inject: ['KAFKA_MODULE_OPTIONS']
      },
      {
        provide: KafkaService,
        useFactory: (options: KafkaModuleOptions, loggerService: LoggerService, tracingService: TracingService) => {
          return new KafkaService({
            clientId: options.clientId || 'gamification-engine',
            brokers: options.brokers || ['localhost:9092'],
            ssl: options.ssl || false,
            sasl: options.sasl,
            loggerService,
            tracingService,
            allowAutoTopicCreation: options.allowAutoTopicCreation || false
          });
        },
        inject: ['KAFKA_MODULE_OPTIONS', LoggerService, TracingService]
      },
      {
        provide: KafkaConsumerFactory,
        useFactory: (options: KafkaModuleOptions, kafkaService: KafkaService, loggerService: LoggerService) => {
          return new KafkaConsumerFactory(kafkaService, {
            groupId: options.groupId || 'gamification-consumer-group',
            loggerService
          });
        },
        inject: ['KAFKA_MODULE_OPTIONS', KafkaService, LoggerService]
      },
      {
        provide: KafkaProducerFactory,
        useFactory: (
          options: KafkaModuleOptions,
          kafkaService: KafkaService,
          loggerService: LoggerService,
          tracingService: TracingService,
          retryPolicy: KafkaRetryPolicy
        ) => {
          return new KafkaProducerFactory(kafkaService, {
            retryPolicy,
            loggerService,
            tracingService
          });
        },
        inject: ['KAFKA_MODULE_OPTIONS', KafkaService, LoggerService, TracingService, 'KAFKA_RETRY_POLICY']
      },
      {
        provide: DlqService,
        useFactory: (options: KafkaModuleOptions, producerFactory: KafkaProducerFactory, loggerService: LoggerService, configService: ConfigService, dlqRepository: Repository<DlqEntry>, transactionService: TransactionService) => {
          return new DlqService(
            dlqRepository,
            producerFactory.createProducer(),
            configService,
            transactionService
          );
        },
        inject: ['KAFKA_MODULE_OPTIONS', KafkaProducerFactory, LoggerService, ConfigService, getRepositoryToken(DlqEntry), TransactionService]
      },
      {
        provide: getRepositoryToken(DlqEntry),
        useFactory: (connection: Connection) => connection.getRepository(DlqEntry),
        inject: [Connection]
      },
      {
        provide: KafkaHealthIndicator,
        useFactory: (kafkaService: KafkaService) => {
          return new KafkaHealthIndicator(kafkaService);
        },
        inject: [KafkaService]
      },
      {
        provide: RetryStrategy,
        useFactory: (options: KafkaModuleOptions, loggerService: LoggerService) => {
          const retryPolicy = {
            maxRetries: options.retry?.maxRetries ?? 5,
            initialRetryTimeMs: options.retry?.initialRetryTimeMs ?? 1000,
            maxRetryTimeMs: options.retry?.maxRetryTimeMs ?? 30000,
            backoffMultiplier: options.retry?.backoffMultiplier ?? 2,
            jitter: options.retry?.jitter ?? true
          };
          
          return new RetryStrategy({
            ...retryPolicy,
            loggerService
          });
        },
        inject: ['KAFKA_MODULE_OPTIONS', LoggerService]
      },
      {
        provide: ErrorHandler,
        useFactory: (loggerService: LoggerService, tracingService: TracingService) => {
          return new ErrorHandler(loggerService, tracingService);
        },
        inject: [LoggerService, TracingService]
      },
      {
        provide: MessageSerializer,
        useFactory: (errorHandler: ErrorHandler) => {
          return new MessageSerializer(errorHandler);
        },
        inject: [ErrorHandler]
      },
      BaseConsumer,
      BaseProducer
    ];
  }

  /**
   * Register the Kafka module for a specific feature
   * @param feature Feature name
   * @param options Kafka module configuration options
   * @returns Dynamic module
   */
  static forFeature(feature: string, options: KafkaModuleOptions = {}): DynamicModule {
    const featureGroupId = options.groupId ? `${options.groupId}-${feature}` : `gamification-${feature}-consumer`;
    const featureOptions = { ...options, groupId: featureGroupId };
    
    const providers = this.createProviders(featureOptions);

    return {
      module: KafkaModule,
      imports: [
        LoggerModule,
        TracingModule,
        TypeOrmModule.forFeature([DlqEntry])
      ],
      providers,
      exports: providers
    };
  }

  /**
   * Register the Kafka module for a specific feature with async configuration
   * @param feature Feature name
   * @param options Async module options
   * @returns Dynamic module
   */
  static forFeatureAsync(feature: string, options: {
    imports?: any[];
    useFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useFactory: async (...args: any[]) => {
          const baseOptions = await options.useFactory(...args);
          const featureGroupId = baseOptions.groupId 
            ? `${baseOptions.groupId}-${feature}` 
            : `gamification-${feature}-consumer`;
          
          return { ...baseOptions, groupId: featureGroupId };
        },
        inject: options.inject || []
      },
      ...this.createAsyncProviders()
    ];

    return {
      module: KafkaModule,
      imports: [...(options.imports || []), LoggerModule, TracingModule, TypeOrmModule.forFeature([DlqEntry])],
      providers,
      exports: providers
    };
  }

  /**
   * Register the Kafka module for a specific journey
   * @param journey Journey type
   * @param options Kafka module configuration options
   * @returns Dynamic module
   */
  static forJourney(journey: JourneyType, options: KafkaModuleOptions = {}): DynamicModule {
    const journeyGroupId = options.journeyGroupIds?.[journey] || 
                          options.groupId ? `${options.groupId}-${journey}` : 
                          `gamification-${journey}-consumer`;
    
    const journeyTopic = options.topics?.[journey] || `${journey}-events`;
    
    const journeyOptions = { 
      ...options, 
      groupId: journeyGroupId,
      topics: {
        ...options.topics,
        [journey]: journeyTopic
      }
    };
    
    const providers = this.createProviders(journeyOptions);

    return {
      module: KafkaModule,
      imports: [
        LoggerModule,
        TracingModule,
        TypeOrmModule.forFeature([DlqEntry])
      ],
      providers,
      exports: providers
    };
  }

  /**
   * Register the Kafka module for a specific journey with async configuration
   * @param journey Journey type
   * @param options Async module options
   * @returns Dynamic module
   */
  static forJourneyAsync(journey: JourneyType, options: {
    imports?: any[];
    useFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useFactory: async (...args: any[]) => {
          const baseOptions = await options.useFactory(...args);
          
          const journeyGroupId = baseOptions.journeyGroupIds?.[journey] || 
                                baseOptions.groupId ? `${baseOptions.groupId}-${journey}` : 
                                `gamification-${journey}-consumer`;
          
          const journeyTopic = baseOptions.topics?.[journey] || `${journey}-events`;
          
          return { 
            ...baseOptions, 
            groupId: journeyGroupId,
            topics: {
              ...baseOptions.topics,
              [journey]: journeyTopic
            }
          };
        },
        inject: options.inject || []
      },
      ...this.createAsyncProviders()
    ];

    return {
      module: KafkaModule,
      imports: [...(options.imports || []), LoggerModule, TracingModule, TypeOrmModule.forFeature([DlqEntry])],
      providers,
      exports: providers
    };
  }
}