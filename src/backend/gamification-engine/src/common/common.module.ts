import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Import interfaces from @austa/interfaces package for standardized schemas
import { 
  GamificationEventSchema, 
  JourneyType,
  DatabaseConfig,
  KafkaConfig,
  RedisConfig
} from '@austa/interfaces';

// Database
import { DatabaseModule } from './database/database.module';
import { PrismaService } from './database/prisma.service';
import { TransactionService } from './database/transaction.service';
import { JourneyContextService } from './database/journey-context.service';
import { ErrorHandlerService as DatabaseErrorHandlerService } from './database/error-handler.service';

// Kafka
import { KafkaModule } from './kafka/kafka.module';
import { BaseConsumerAbstract } from './kafka/base-consumer.abstract';
import { BaseProducerAbstract } from './kafka/base-producer.abstract';
import { DlqService } from './kafka/dlq.service';
import { MessageSerializer } from './kafka/message-serializer';
import { RetryStrategy } from './kafka/retry.strategy';
import { ErrorHandler as KafkaErrorHandler } from './kafka/error-handler';
import { EventHandlerInterface } from './kafka/event-handler.interface';

// Config
import * as appConfig from './config/app.config';
import * as databaseConfig from './config/database.config';
import * as eventsConfig from './config/events.config';
import * as gamificationConfig from './config/gamification.config';
import * as kafkaConfig from './config/kafka.config';
import * as redisConfig from './config/redis.config';
import { validationSchema } from './config/validation.schema';

// Exceptions
import { ExceptionFilter } from './exceptions/exception.filter';
import { CircuitBreaker } from './exceptions/circuit-breaker';
import { AppExceptionBase } from './exceptions/app-exception.base';
import { SystemException } from './exceptions/system.exception';
import { ClientException } from './exceptions/client.exception';
import { TransientException } from './exceptions/transient.exception';
import { ExternalDependencyException } from './exceptions/external-dependency.exception';
import { KafkaException } from './exceptions/kafka.exception';
import { DatabaseException } from './exceptions/database.exception';

// Utilities
import * as dateTimeUtil from './utils/date-time.util';
import * as formatUtil from './utils/format.util';
import * as circuitBreakerUtil from './utils/circuit-breaker.util';
import * as loggingUtil from './utils/logging.util';
import * as eventProcessingUtil from './utils/event-processing.util';
import * as validationUtil from './utils/validation.util';
import * as retryUtil from './utils/retry.util';
import * as errorHandlingUtil from './utils/error-handling.util';

// Decorators
import { GamificationJourneyDecorator } from './decorators/gamification-journey.decorator';
import { EventHandlerDecorator } from './decorators/event-handler.decorator';
import { RetryOnFailureDecorator } from './decorators/retry-on-failure.decorator';
import { TrackPerformanceDecorator } from './decorators/track-performance.decorator';
import { CacheResultDecorator } from './decorators/cache-result.decorator';
import { LogMethodDecorator } from './decorators/log-method.decorator';
import { ValidateEventDecorator } from './decorators/validate-event.decorator';

// Constants
import * as redisKeys from './constants/redis-keys';
import * as kafkaTopics from './constants/kafka-topics';
import * as pointValues from './constants/point-values';
import * as retryPolicies from './constants/retry-policies';
import * as errorCodes from './constants/error-codes';
import * as achievementTypes from './constants/achievement-types';
import * as eventTypes from './constants/event-types';
import * as journeyConstants from './constants/journey';

/**
 * CommonModule serves as the central point for importing shared functionality into other modules.
 * It registers all common providers, services, and utilities for the gamification engine,
 * ensuring consistent initialization and configuration.
 *
 * Key features:
 * - Standardized, versioned event schemas defined in @austa/interfaces package
 * - Kafka.js consumers configured with dead-letter queues and exponential backoff retry strategies
 * - Enhanced error handling with centralized retry policies, fallback strategies, and circuit breakers
 * - Enhanced PrismaService with connection pooling and journey-specific database contexts
 * - Centralized configuration management with environment validation
 * - Global exception filtering and error handling
 * - Utility services for common operations across the gamification engine
 */
@Global()
@Module({
  imports: [
    // Configure environment variables with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        eventsConfig,
        gamificationConfig,
        kafkaConfig,
        redisConfig,
      ],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    // Import database module with connection pooling and journey-specific contexts
    DatabaseModule,
    // Import Kafka module with dead-letter queues and retry strategies
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        brokers: configService.get<string[]>('kafka.brokers'),
        clientId: configService.get<string>('kafka.clientId'),
        consumerGroup: configService.get<string>('kafka.consumerGroup'),
        retryConfig: {
          initialRetryTime: configService.get<number>('kafka.retry.initialRetryTime'),
          maxRetryTime: configService.get<number>('kafka.retry.maxRetryTime'),
          retries: configService.get<number>('kafka.retry.retries'),
          factor: configService.get<number>('kafka.retry.factor'),
        },
        dlqConfig: {
          enabled: configService.get<boolean>('kafka.dlq.enabled'),
          topicPrefix: configService.get<string>('kafka.dlq.topicPrefix'),
          maxAttempts: configService.get<number>('kafka.dlq.maxAttempts'),
        },
      }),
    }),
  ],
  providers: [
    // Database services
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
    
    // Exception handling
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    CircuitBreaker,
    
    // Kafka services
    DlqService,
    MessageSerializer,
    RetryStrategy,
    KafkaErrorHandler,
    
    // Decorators as providers
    GamificationJourneyDecorator,
    EventHandlerDecorator,
    RetryOnFailureDecorator,
    TrackPerformanceDecorator,
    CacheResultDecorator,
    LogMethodDecorator,
    ValidateEventDecorator,
    
    // Utility providers
    {
      provide: 'DATE_TIME_UTILS',
      useValue: dateTimeUtil,
    },
    {
      provide: 'FORMAT_UTILS',
      useValue: formatUtil,
    },
    {
      provide: 'CIRCUIT_BREAKER_UTILS',
      useValue: circuitBreakerUtil,
    },
    {
      provide: 'LOGGING_UTILS',
      useValue: loggingUtil,
    },
    {
      provide: 'EVENT_PROCESSING_UTILS',
      useValue: eventProcessingUtil,
    },
    {
      provide: 'VALIDATION_UTILS',
      useValue: validationUtil,
    },
    {
      provide: 'RETRY_UTILS',
      useValue: retryUtil,
    },
    {
      provide: 'ERROR_HANDLING_UTILS',
      useValue: errorHandlingUtil,
    },
    
    // Constants as providers
    {
      provide: 'REDIS_KEYS',
      useValue: redisKeys,
    },
    {
      provide: 'KAFKA_TOPICS',
      useValue: kafkaTopics,
    },
    {
      provide: 'POINT_VALUES',
      useValue: pointValues,
    },
    {
      provide: 'RETRY_POLICIES',
      useValue: retryPolicies,
    },
    {
      provide: 'ERROR_CODES',
      useValue: errorCodes,
    },
    {
      provide: 'ACHIEVEMENT_TYPES',
      useValue: achievementTypes,
    },
    {
      provide: 'EVENT_TYPES',
      useValue: eventTypes,
    },
    {
      provide: 'JOURNEY_CONSTANTS',
      useValue: journeyConstants,
    },
  ],
  exports: [
    // Re-export ConfigModule for access to configuration
    ConfigModule,
    
    // Database services
    DatabaseModule,
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
    
    // Kafka module and services
    KafkaModule,
    DlqService,
    MessageSerializer,
    RetryStrategy,
    KafkaErrorHandler,
    BaseConsumerAbstract,
    BaseProducerAbstract,
    
    // Exception handling
    CircuitBreaker,
    AppExceptionBase,
    SystemException,
    ClientException,
    TransientException,
    ExternalDependencyException,
    KafkaException,
    DatabaseException,
    
    // Decorators
    GamificationJourneyDecorator,
    EventHandlerDecorator,
    RetryOnFailureDecorator,
    TrackPerformanceDecorator,
    CacheResultDecorator,
    LogMethodDecorator,
    ValidateEventDecorator,
    
    // Utility providers
    'DATE_TIME_UTILS',
    'FORMAT_UTILS',
    'CIRCUIT_BREAKER_UTILS',
    'LOGGING_UTILS',
    'EVENT_PROCESSING_UTILS',
    'VALIDATION_UTILS',
    'RETRY_UTILS',
    'ERROR_HANDLING_UTILS',
    
    // Constants
    'REDIS_KEYS',
    'KAFKA_TOPICS',
    'POINT_VALUES',
    'RETRY_POLICIES',
    'ERROR_CODES',
    'ACHIEVEMENT_TYPES',
    'EVENT_TYPES',
    'JOURNEY_CONSTANTS',
  ],
})
/**
 * Configuration options for the CommonModule.forRoot method
 */
export interface CommonModuleOptions {
  /** Additional providers to register with the module */
  additionalProviders?: Provider[];
  /** Enable or disable specific features */
  features?: {
    /** Enable or disable Kafka integration */
    kafka?: boolean;
    /** Enable or disable Redis integration */
    redis?: boolean;
    /** Enable or disable circuit breaker pattern */
    circuitBreaker?: boolean;
    /** Enable or disable global exception filter */
    exceptionFilter?: boolean;
  };
  /** Journey-specific configuration */
  journeys?: {
    /** Enable specific journeys for this module instance */
    enabled?: JourneyType[];
  };
}

/**
 * Configuration options for the CommonModule.forRootAsync method
 */
export interface CommonModuleAsyncOptions {
  /** Modules to import */
  imports?: any[];
  /** Injection tokens for the factory function */
  inject?: any[];
  /** Factory function to create the module options */
  useFactory?: (...args: any[]) => Promise<CommonModuleOptions> | CommonModuleOptions;
  /** Additional providers to register */
  providers?: Provider[];
  /** Additional exports from the module */
  exports?: any[];
}

export class CommonModule {
  /**
   * Creates a dynamic module instance with custom configuration.
   * This allows for flexible configuration when importing the CommonModule.
   * 
   * @param options Configuration options for the CommonModule
   * @returns A dynamically configured CommonModule
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     CommonModule.forRoot({
   *       features: {
   *         kafka: true,
   *         redis: true,
   *         circuitBreaker: true,
   *       },
   *       journeys: {
   *         enabled: [JourneyType.HEALTH, JourneyType.CARE],
   *       },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options?: CommonModuleOptions): DynamicModule {
    const providers: Provider[] = [];
    
    // Add any additional providers based on options
    if (options?.additionalProviders) {
      providers.push(...options.additionalProviders);
    }
    
    // Configure feature flags
    providers.push({
      provide: 'COMMON_MODULE_FEATURES',
      useValue: {
        kafka: options?.features?.kafka !== false, // enabled by default
        redis: options?.features?.redis !== false, // enabled by default
        circuitBreaker: options?.features?.circuitBreaker !== false, // enabled by default
        exceptionFilter: options?.features?.exceptionFilter !== false, // enabled by default
      },
    });
    
    // Configure journey settings
    if (options?.journeys?.enabled) {
      providers.push({
        provide: 'ENABLED_JOURNEYS',
        useValue: options.journeys.enabled,
      });
    }
    
    return {
      module: CommonModule,
      providers,
      exports: [...providers, 'COMMON_MODULE_FEATURES', 'ENABLED_JOURNEYS'],
    };
  }
  
  /**
   * Creates an asynchronously configured dynamic module instance.
   * This allows for configuration to be determined at runtime from external sources.
   * 
   * @param options Async configuration options for the CommonModule
   * @returns A dynamically configured CommonModule with async initialization
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     CommonModule.forRootAsync({
   *       imports: [ConfigModule],
   *       inject: [ConfigService],
   *       useFactory: async (configService: ConfigService) => ({
   *         features: {
   *           kafka: configService.get<boolean>('features.kafka'),
   *           redis: configService.get<boolean>('features.redis'),
   *         },
   *         journeys: {
   *           enabled: configService.get<JourneyType[]>('journeys.enabled'),
   *         },
   *       }),
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(options: CommonModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'COMMON_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: 'COMMON_MODULE_FEATURES',
        useFactory: (...args: any[]) => {
          const moduleOptions = options.useFactory(...args);
          return {
            kafka: moduleOptions?.features?.kafka !== false,
            redis: moduleOptions?.features?.redis !== false,
            circuitBreaker: moduleOptions?.features?.circuitBreaker !== false,
            exceptionFilter: moduleOptions?.features?.exceptionFilter !== false,
          };
        },
        inject: options.inject || [],
      },
      {
        provide: 'ENABLED_JOURNEYS',
        useFactory: (...args: any[]) => {
          const moduleOptions = options.useFactory(...args);
          return moduleOptions?.journeys?.enabled || Object.values(JourneyType);
        },
        inject: options.inject || [],
      },
    ];
    
    if (options.providers) {
      providers.push(...options.providers);
    }
    
    return {
      module: CommonModule,
      imports: options.imports || [],
      providers,
      exports: [
        'COMMON_MODULE_OPTIONS',
        'COMMON_MODULE_FEATURES',
        'ENABLED_JOURNEYS',
        ...(options.exports || []),
      ],
    };
  }
}