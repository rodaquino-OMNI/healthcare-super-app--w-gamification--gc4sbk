import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import configuration modules
import { 
  appConfig, 
  databaseConfig, 
  eventsConfig, 
  gamificationConfig, 
  kafkaConfig, 
  redisConfig 
} from './config';
import { validationSchema } from './config/validation.schema';

// Import database module and services
import { DatabaseModule } from './database/database.module';
import { PrismaService } from './database/prisma.service';
import { TransactionService } from './database/transaction.service';
import { JourneyContextService } from './database/journey-context.service';
import { ErrorHandlerService as DatabaseErrorHandlerService } from './database/error-handler.service';

// Import Kafka module and services
import { KafkaModule } from './kafka/kafka.module';
import { DlqService } from './kafka/dlq.service';
import { RetryStrategy } from './kafka/retry.strategy';

// Import exception filters and utilities
import { AppExceptionBase } from './exceptions/app-exception.base';
import { GamificationExceptionFilter } from './exceptions/exception.filter';
import { CircuitBreaker } from './exceptions/circuit-breaker';

// Import decorators
import { RetryOnFailure } from './decorators/retry-on-failure.decorator';
import { EventHandler } from './decorators/event-handler.decorator';
import { GamificationJourney } from './decorators/gamification-journey.decorator';
import { TrackPerformance } from './decorators/track-performance.decorator';
import { CacheResult } from './decorators/cache-result.decorator';
import { LogMethod } from './decorators/log-method.decorator';
import { ValidateEvent } from './decorators/validate-event.decorator';
import { RequiresRole } from './decorators/requires-role.decorator';

// Import utility services
import * as utils from './utils';

/**
 * CommonModule serves as the central point for importing shared functionality into other modules,
 * ensuring consistent initialization and configuration across the gamification engine.
 * 
 * This module registers all common providers, services, and utilities that are used throughout
 * the application, including:
 * - Configuration services for app, database, events, Kafka, Redis, and gamification settings
 * - Database services with connection pooling and journey-specific contexts
 * - Kafka integration with dead-letter queues and exponential backoff retry strategies
 * - Error handling with centralized retry policies, fallback strategies, and circuit breakers
 * - Utility decorators for retry logic, event handling, performance tracking, and more
 */
@Global()
@Module({
  imports: [
    // Register configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        eventsConfig,
        gamificationConfig,
        kafkaConfig,
        redisConfig
      ],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    // Register database module
    DatabaseModule,
    // Register Kafka module
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config) => ({
        clientId: config.get('kafka.clientId'),
        brokers: config.get('kafka.brokers'),
        ssl: config.get('kafka.ssl'),
        sasl: config.get('kafka.sasl'),
        connectionTimeout: config.get('kafka.connectionTimeout'),
        retry: config.get('kafka.retry'),
      }),
      inject: [ConfigModule],
    }),
  ],
  providers: [
    // Database services
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
    
    // Kafka services
    DlqService,
    RetryStrategy,
    
    // Exception handling
    GamificationExceptionFilter,
    CircuitBreaker,
    
    // Utility providers
    ...Object.values(utils),
  ],
  exports: [
    // Export configuration
    ConfigModule,
    
    // Export database services
    DatabaseModule,
    PrismaService,
    TransactionService,
    JourneyContextService,
    DatabaseErrorHandlerService,
    
    // Export Kafka services
    KafkaModule,
    DlqService,
    RetryStrategy,
    
    // Export exception handling
    GamificationExceptionFilter,
    CircuitBreaker,
    
    // Export utility services
    ...Object.values(utils),
  ],
})
export class CommonModule {
  /**
   * Creates a dynamic module instance with custom configuration options.
   * This allows consumers to provide custom configuration when importing the module.
   * 
   * @param options Configuration options for the CommonModule
   * @returns A DynamicModule instance of CommonModule with the provided configuration
   */
  static forRoot(options?: any): DynamicModule {
    return {
      module: CommonModule,
      global: true,
      providers: [
        {
          provide: 'COMMON_MODULE_OPTIONS',
          useValue: options || {},
        },
      ],
      exports: ['COMMON_MODULE_OPTIONS'],
    };
  }

  /**
   * Creates a dynamic module instance with asynchronously provided configuration options.
   * This allows for configuration to be loaded from external sources like ConfigService.
   * 
   * @param options Async configuration options for the CommonModule
   * @returns A DynamicModule instance of CommonModule with the provided configuration
   */
  static forRootAsync(options: any): DynamicModule {
    return {
      module: CommonModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: 'COMMON_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: ['COMMON_MODULE_OPTIONS'],
    };
  }
}

// Export decorators for use in other modules
export {
  RetryOnFailure,
  EventHandler,
  GamificationJourney,
  TrackPerformance,
  CacheResult,
  LogMethod,
  ValidateEvent,
  RequiresRole,
};

// Export base exception classes
export { AppExceptionBase };