import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { GamificationEvent } from '@austa/interfaces/gamification';

// Import from common/kafka folder
import {
  BaseConsumer,
  BaseProducer,
  DLQService,
  KafkaErrorHandler,
  MessageSerializer,
  RetryStrategy,
} from './common/kafka';

// Import journey-specific handlers
import {
  HealthJourneyHandler,
  CareJourneyHandler,
  PlanJourneyHandler,
} from './events/kafka/journey-handlers';

// Constants for Kafka configuration
export const KAFKA_CLIENT = 'KAFKA_CLIENT';
export const KAFKA_PRODUCER = 'KAFKA_PRODUCER';

// Topic constants
export const HEALTH_JOURNEY_TOPIC = 'health-journey-events';
export const CARE_JOURNEY_TOPIC = 'care-journey-events';
export const PLAN_JOURNEY_TOPIC = 'plan-journey-events';
export const DLQ_TOPIC_PREFIX = 'gamification-dlq';

// Consumer group constants
export const GAMIFICATION_CONSUMER_GROUP = 'gamification-engine-group';

/**
 * Configuration options for the KafkaModule
 */
export interface KafkaModuleOptions {
  /**
   * Kafka broker URLs
   */
  brokers: string[];
  
  /**
   * Consumer group ID
   */
  consumerGroup?: string;
  
  /**
   * Client ID for this Kafka client
   */
  clientId?: string;
  
  /**
   * Maximum number of retry attempts for failed messages
   */
  maxRetries?: number;
  
  /**
   * Initial retry delay in milliseconds
   */
  initialRetryDelay?: number;
  
  /**
   * Maximum retry delay in milliseconds
   */
  maxRetryDelay?: number;
  
  /**
   * Whether to enable dead letter queues
   */
  enableDLQ?: boolean;
  
  /**
   * SASL authentication configuration
   */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  
  /**
   * SSL configuration
   */
  ssl?: boolean;
}

/**
 * Default configuration options
 */
const defaultOptions: Partial<KafkaModuleOptions> = {
  consumerGroup: GAMIFICATION_CONSUMER_GROUP,
  clientId: 'gamification-engine',
  maxRetries: 5,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 60000, // 1 minute
  enableDLQ: true,
  ssl: false,
};

/**
 * KafkaModule provides integration with Kafka for the gamification engine.
 * It handles event consumption and production with comprehensive error handling,
 * retry mechanisms, and dead letter queues for failed events.
 */
@Module({})
export class KafkaModule {
  /**
   * Register the KafkaModule with default configuration
   */
  static register(): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ConfigModule,
        LoggerModule,
        TracingModule,
      ],
      providers: [
        {
          provide: KAFKA_CLIENT,
          useFactory: (configService: ConfigService) => {
            const brokers = configService.get<string>('KAFKA_BROKERS').split(',');
            const clientId = configService.get<string>('KAFKA_CLIENT_ID', 'gamification-engine');
            const consumerGroup = configService.get<string>('KAFKA_CONSUMER_GROUP', GAMIFICATION_CONSUMER_GROUP);
            
            return ClientsModule.register([
              {
                name: KAFKA_CLIENT,
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId,
                    brokers,
                    // Add SSL and SASL if configured
                    ...(configService.get<boolean>('KAFKA_SSL', false) ? { ssl: true } : {}),
                    ...(configService.get<string>('KAFKA_SASL_USERNAME') ? {
                      sasl: {
                        mechanism: configService.get<'plain' | 'scram-sha-256' | 'scram-sha-512'>('KAFKA_SASL_MECHANISM', 'plain'),
                        username: configService.get<string>('KAFKA_SASL_USERNAME'),
                        password: configService.get<string>('KAFKA_SASL_PASSWORD'),
                      }
                    } : {}),
                  },
                  consumer: {
                    groupId: consumerGroup,
                    allowAutoTopicCreation: configService.get<boolean>('KAFKA_AUTO_TOPIC_CREATION', false),
                    sessionTimeout: 30000,
                    heartbeatInterval: 3000,
                    retry: {
                      initialRetryTime: 1000,
                      retries: 5,
                    },
                  },
                  producer: {
                    allowAutoTopicCreation: configService.get<boolean>('KAFKA_AUTO_TOPIC_CREATION', false),
                    idempotent: true, // Ensures exactly-once delivery semantics
                    transactionalId: `${clientId}-producer`,
                    retry: {
                      initialRetryTime: 1000,
                      retries: 5,
                    },
                  },
                  subscribe: {
                    fromBeginning: configService.get<boolean>('KAFKA_SUBSCRIBE_FROM_BEGINNING', false),
                  },
                },
              },
            ]);
          },
          inject: [ConfigService],
        },
        // Provide the Kafka error handler
        KafkaErrorHandler,
        // Provide the message serializer
        MessageSerializer,
        // Provide the retry strategy
        {
          provide: RetryStrategy,
          useFactory: (configService: ConfigService) => {
            return new RetryStrategy({
              maxRetries: configService.get<number>('KAFKA_MAX_RETRIES', 5),
              initialRetryDelay: configService.get<number>('KAFKA_INITIAL_RETRY_DELAY', 1000),
              maxRetryDelay: configService.get<number>('KAFKA_MAX_RETRY_DELAY', 60000),
              jitterFactor: 0.1, // Add 10% jitter to prevent thundering herd
            });
          },
          inject: [ConfigService],
        },
        // Provide the DLQ service
        {
          provide: DLQService,
          useFactory: (kafkaClient: ClientKafka, serializer: MessageSerializer) => {
            return new DLQService(kafkaClient, serializer, {
              topicPrefix: DLQ_TOPIC_PREFIX,
              journeyTopics: {
                health: HEALTH_JOURNEY_TOPIC,
                care: CARE_JOURNEY_TOPIC,
                plan: PLAN_JOURNEY_TOPIC,
              },
            });
          },
          inject: [KAFKA_CLIENT, MessageSerializer],
        },
        // Provide the Kafka producer
        {
          provide: KAFKA_PRODUCER,
          useFactory: (kafkaClient: ClientKafka, errorHandler: KafkaErrorHandler, serializer: MessageSerializer) => {
            return new BaseProducer<GamificationEvent>(kafkaClient, errorHandler, serializer, {
              defaultTopic: 'gamification-events',
              journeyTopics: {
                health: HEALTH_JOURNEY_TOPIC,
                care: CARE_JOURNEY_TOPIC,
                plan: PLAN_JOURNEY_TOPIC,
              },
            });
          },
          inject: [KAFKA_CLIENT, KafkaErrorHandler, MessageSerializer],
        },
        // Provide journey-specific handlers
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler,
      ],
      exports: [
        KAFKA_CLIENT,
        KAFKA_PRODUCER,
        KafkaErrorHandler,
        MessageSerializer,
        RetryStrategy,
        DLQService,
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler,
      ],
    };
  }

  /**
   * Register the KafkaModule with custom configuration
   * @param options Custom configuration options
   */
  static registerAsync(options: KafkaModuleOptions): DynamicModule {
    const mergedOptions = { ...defaultOptions, ...options };
    
    return {
      module: KafkaModule,
      imports: [
        ConfigModule,
        LoggerModule,
        TracingModule,
      ],
      providers: [
        {
          provide: KAFKA_CLIENT,
          useFactory: () => {
            return ClientsModule.register([
              {
                name: KAFKA_CLIENT,
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId: mergedOptions.clientId,
                    brokers: mergedOptions.brokers,
                    // Add SSL and SASL if configured
                    ...(mergedOptions.ssl ? { ssl: true } : {}),
                    ...(mergedOptions.sasl ? { sasl: mergedOptions.sasl } : {}),
                  },
                  consumer: {
                    groupId: mergedOptions.consumerGroup,
                    allowAutoTopicCreation: true,
                    sessionTimeout: 30000,
                    heartbeatInterval: 3000,
                    retry: {
                      initialRetryTime: mergedOptions.initialRetryDelay,
                      retries: mergedOptions.maxRetries,
                    },
                  },
                  producer: {
                    allowAutoTopicCreation: true,
                    idempotent: true, // Ensures exactly-once delivery semantics
                    transactionalId: `${mergedOptions.clientId}-producer`,
                    retry: {
                      initialRetryTime: mergedOptions.initialRetryDelay,
                      retries: mergedOptions.maxRetries,
                    },
                  },
                  subscribe: {
                    fromBeginning: false,
                  },
                },
              },
            ]);
          },
        },
        // Provide the Kafka error handler
        KafkaErrorHandler,
        // Provide the message serializer
        MessageSerializer,
        // Provide the retry strategy
        {
          provide: RetryStrategy,
          useFactory: () => {
            return new RetryStrategy({
              maxRetries: mergedOptions.maxRetries,
              initialRetryDelay: mergedOptions.initialRetryDelay,
              maxRetryDelay: mergedOptions.maxRetryDelay,
              jitterFactor: 0.1, // Add 10% jitter to prevent thundering herd
            });
          },
        },
        // Provide the DLQ service if enabled
        ...(mergedOptions.enableDLQ ? [
          {
            provide: DLQService,
            useFactory: (kafkaClient: ClientKafka, serializer: MessageSerializer) => {
              return new DLQService(kafkaClient, serializer, {
                topicPrefix: DLQ_TOPIC_PREFIX,
                journeyTopics: {
                  health: HEALTH_JOURNEY_TOPIC,
                  care: CARE_JOURNEY_TOPIC,
                  plan: PLAN_JOURNEY_TOPIC,
                },
              });
            },
            inject: [KAFKA_CLIENT, MessageSerializer],
          }
        ] : []),
        // Provide the Kafka producer
        {
          provide: KAFKA_PRODUCER,
          useFactory: (kafkaClient: ClientKafka, errorHandler: KafkaErrorHandler, serializer: MessageSerializer) => {
            return new BaseProducer<GamificationEvent>(kafkaClient, errorHandler, serializer, {
              defaultTopic: 'gamification-events',
              journeyTopics: {
                health: HEALTH_JOURNEY_TOPIC,
                care: CARE_JOURNEY_TOPIC,
                plan: PLAN_JOURNEY_TOPIC,
              },
            });
          },
          inject: [KAFKA_CLIENT, KafkaErrorHandler, MessageSerializer],
        },
        // Provide journey-specific handlers
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler,
      ],
      exports: [
        KAFKA_CLIENT,
        KAFKA_PRODUCER,
        KafkaErrorHandler,
        MessageSerializer,
        RetryStrategy,
        ...(mergedOptions.enableDLQ ? [DLQService] : []),
        HealthJourneyHandler,
        CareJourneyHandler,
        PlanJourneyHandler,
      ],
    };
  }

  /**
   * Register consumers for specific topics
   * @param consumers Array of consumer classes to register
   */
  static registerConsumers(consumers: Provider[]): DynamicModule {
    return {
      module: KafkaModule,
      imports: [KafkaModule.register()],
      providers: [...consumers],
      exports: [...consumers],
    };
  }

  /**
   * Register consumers for specific topics with custom configuration
   * @param options Custom configuration options
   * @param consumers Array of consumer classes to register
   */
  static registerConsumersAsync(options: KafkaModuleOptions, consumers: Provider[]): DynamicModule {
    return {
      module: KafkaModule,
      imports: [KafkaModule.registerAsync(options)],
      providers: [...consumers],
      exports: [...consumers],
    };
  }
}