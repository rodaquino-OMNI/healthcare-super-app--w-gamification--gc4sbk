import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducer } from './kafka.producer';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { ErrorsModule } from '@austa/errors';

// Import journey handlers
import { 
  HealthJourneyHandler, 
  CareJourneyHandler, 
  PlanJourneyHandler 
} from './journey-handlers';

// Import interfaces for type-safe event schemas
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';

/**
 * Configuration options for the Kafka module
 */
export interface KafkaModuleOptions {
  /** Client ID for Kafka connection */
  clientId?: string;
  /** Consumer group ID for Kafka consumers */
  consumerGroup?: string;
  /** Enable dead-letter queue for failed messages */
  enableDLQ?: boolean;
  /** Topic name for dead-letter queue */
  dlqTopic?: string;
  /** Retry configuration for failed message processing */
  retryConfig?: {
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Initial backoff delay in milliseconds */
    initialBackoff?: number;
    /** Maximum backoff delay in milliseconds */
    maxBackoff?: number;
    /** Use exponential backoff strategy */
    exponentialBackoff?: boolean;
    /** List of error types that should trigger retries */
    retryableErrors?: string[];
  };
  /** Kafka broker connection configuration */
  brokers?: string[];
  /** Topic configuration for different journeys */
  topics?: {
    /** Health journey events topic */
    health?: string;
    /** Care journey events topic */
    care?: string;
    /** Plan journey events topic */
    plan?: string;
    /** User events topic */
    user?: string;
    /** Achievement events topic */
    achievement?: string;
    /** Reward events topic */
    reward?: string;
    /** Quest events topic */
    quest?: string;
  };
  /** Consumer group configuration for different journeys */
  consumerGroups?: {
    /** Health journey consumer group */
    health?: string;
    /** Care journey consumer group */
    care?: string;
    /** Plan journey consumer group */
    plan?: string;
    /** User events consumer group */
    user?: string;
  };
}

/**
 * Default configuration for the Kafka module
 */
const defaultOptions: KafkaModuleOptions = {
  clientId: 'gamification-engine',
  consumerGroup: 'gamification-events',
  enableDLQ: true,
  dlqTopic: 'gamification-events-dlq',
  retryConfig: {
    maxRetries: 3,
    initialBackoff: 500,
    maxBackoff: 5000,
    exponentialBackoff: true,
    retryableErrors: ['CONNECTION_ERROR', 'PROCESSING_ERROR', 'TIMEOUT_ERROR']
  },
  topics: {
    health: 'health.events',
    care: 'care.events',
    plan: 'plan.events',
    user: 'user.events',
    achievement: 'achievement.events',
    reward: 'reward.events',
    quest: 'quest.events'
  },
  consumerGroups: {
    health: 'gamification-consumer-group-health',
    care: 'gamification-consumer-group-care',
    plan: 'gamification-consumer-group-plan',
    user: 'gamification-consumer-group-user'
  }
};

/**
 * NestJS module that registers and configures all Kafka-related providers for the gamification engine.
 * 
 * This module implements the NestJS dynamic module pattern to allow flexible configuration
 * of Kafka consumers and producers. It integrates with the @austa/interfaces package for
 * type-safe event schemas and configures consumers with proper error handling and retry strategies.
 * 
 * Key features:
 * - Dead-letter queue support for failed message processing
 * - Exponential backoff retry strategies for transient errors
 * - Journey-specific consumer groups for proper message distribution
 * - Type-safe event schemas using @austa/interfaces
 * - Centralized error handling and logging
 * - Distributed tracing integration
 * 
 * @example
 * ```typescript
 * // Import in your module
 * @Module({
 *   imports: [
 *     KafkaModule.forRoot({
 *       clientId: 'gamification-engine',
 *       consumerGroup: 'gamification-events',
 *       enableDLQ: true,
 *       dlqTopic: 'gamification-events-dlq',
 *       retryConfig: {
 *         maxRetries: 3,
 *         initialBackoff: 500,
 *         maxBackoff: 5000,
 *         exponentialBackoff: true
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    LoggerModule,
    TracingModule,
    ErrorsModule,
    ConfigModule
  ]
})
export class KafkaModule {
  /**
   * Creates a dynamic module with the provided configuration options.
   * 
   * @param options Configuration options for the Kafka module
   * @returns A dynamic module with configured providers
   */
  static forRoot(options: KafkaModuleOptions = {}): DynamicModule {
    const mergedOptions = this.mergeDefaults(options);
    
    const kafkaOptionsProvider: Provider = {
      provide: 'KAFKA_MODULE_OPTIONS',
      useValue: mergedOptions
    };
    
    const schemaRegistryProvider: Provider = {
      provide: 'EVENT_SCHEMA_REGISTRY',
      useValue: {
        schemaVersion: '1.0.0',
        schemas: {
          [EventType.HEALTH_METRIC_RECORDED]: GamificationEvent,
          [EventType.HEALTH_GOAL_ACHIEVED]: GamificationEvent,
          [EventType.DEVICE_CONNECTED]: GamificationEvent,
          [EventType.DEVICE_SYNCED]: GamificationEvent,
          [EventType.MEDICAL_EVENT_RECORDED]: GamificationEvent,
          [EventType.CARE_APPOINTMENT_BOOKED]: GamificationEvent,
          [EventType.CARE_APPOINTMENT_ATTENDED]: GamificationEvent,
          [EventType.CARE_MEDICATION_TAKEN]: GamificationEvent,
          [EventType.CARE_TELEMEDICINE_COMPLETED]: GamificationEvent,
          [EventType.CARE_TREATMENT_COMPLETED]: GamificationEvent,
          [EventType.PLAN_SELECTED]: GamificationEvent,
          [EventType.PLAN_CLAIM_SUBMITTED]: GamificationEvent,
          [EventType.PLAN_CLAIM_APPROVED]: GamificationEvent,
          [EventType.PLAN_BENEFIT_USED]: GamificationEvent,
          [EventType.PLAN_DOCUMENT_UPLOADED]: GamificationEvent,
          [EventType.USER_REGISTERED]: GamificationEvent,
          [EventType.USER_LOGGED_IN]: GamificationEvent,
          [EventType.USER_COMPLETED_PROFILE]: GamificationEvent,
          [EventType.USER_REFERRED_FRIEND]: GamificationEvent,
          [EventType.USER_COMPLETED_ONBOARDING]: GamificationEvent
        }
      }
    };
    
    return {
      module: KafkaModule,
      imports: [
        LoggerModule.forRoot({
          service: mergedOptions.clientId || 'gamification-engine',
          context: 'kafka'
        }),
        TracingModule.forRoot({
          serviceName: mergedOptions.clientId || 'gamification-engine',
          enableTracing: true
        }),
        ErrorsModule.forRoot({
          enableGlobalFilters: true,
          journeyContext: 'gamification'
        }),
        ConfigModule
      ],
      providers: [
        kafkaOptionsProvider,
        schemaRegistryProvider,
        KafkaConsumerService,
        KafkaProducer,
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler,
        {
          provide: 'KAFKA_CLIENT',
          useFactory: (configService: ConfigService) => {
            const brokers = mergedOptions.brokers || 
              configService.get<string[]>('kafka.brokers') || 
              ['localhost:9092'];
              
            return new (require('kafkajs')).Kafka({
              clientId: mergedOptions.clientId,
              brokers: brokers,
              retry: {
                initialRetryTime: 300,
                retries: 10
              }
            });
          },
          inject: [ConfigService]
        }
      ],
      exports: [
        KafkaConsumerService,
        KafkaProducer,
        'KAFKA_CLIENT',
        'KAFKA_MODULE_OPTIONS',
        'EVENT_SCHEMA_REGISTRY',
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler
      ]
    };
  }
  
  /**
   * Creates a dynamic module that uses the configuration from the root module.
   * 
   * @returns A dynamic module that reuses the root module's configuration
   */
  static forFeature(): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        LoggerModule,
        TracingModule,
        ErrorsModule
      ],
      providers: [
        KafkaConsumerService,
        KafkaProducer
      ],
      exports: [
        KafkaConsumerService,
        KafkaProducer
      ]
    };
  }
  
  /**
   * Merges the provided options with the default options.
   * 
   * @param options User-provided options
   * @returns Merged options
   */
  private static mergeDefaults(options: KafkaModuleOptions): KafkaModuleOptions {
    return {
      ...defaultOptions,
      ...options,
      retryConfig: {
        ...defaultOptions.retryConfig,
        ...options.retryConfig
      },
      topics: {
        ...defaultOptions.topics,
        ...options.topics
      },
      consumerGroups: {
        ...defaultOptions.consumerGroups,
        ...options.consumerGroups
      }
    };
  }
}