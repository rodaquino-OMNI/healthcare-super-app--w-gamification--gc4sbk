import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '@app/shared/logging/logger.service';
import { LOGGER_SERVICE } from '@app/shared/logging/logger.constants';

// Import journey-specific consumers
import { HealthJourneyConsumer } from './health-journey.consumer';
import { CareJourneyConsumer } from './care-journey.consumer';
import { PlanJourneyConsumer } from './plan-journey.consumer';

// Import common Kafka module and utilities
import { KafkaModule } from '../../../common/kafka';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

// Import interfaces from @austa/interfaces package
import { KafkaConsumerOptions } from '@austa/interfaces/common/dto/kafka.dto';

/**
 * Module that registers all reward event consumers with the dependency injection system.
 * Configures Kafka consumer groups, topic subscriptions, and consumer factory settings.
 * Provides consistent configuration for all journey-specific reward consumers with proper error handling and monitoring.
 *
 * This module is responsible for:
 * - Registering all journey-specific reward consumers as providers
 * - Configuring Kafka consumer groups with proper naming conventions
 * - Setting up topic subscriptions for each journey's reward events
 * - Implementing consumer factory with retry and backoff settings
 * - Adding proper dependency injection for required services
 */
@Module({
  imports: [
    // Import Kafka module with factory configuration
    KafkaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): KafkaConsumerOptions => ({
        clientId: 'gamification-engine',
        brokers: configService.get<string>('KAFKA_BROKERS').split(','),
        ssl: configService.get<boolean>('KAFKA_SSL', false),
        sasl: configService.get<boolean>('KAFKA_SASL_ENABLED', false)
          ? {
              mechanism: 'plain',
              username: configService.get<string>('KAFKA_SASL_USERNAME'),
              password: configService.get<string>('KAFKA_SASL_PASSWORD'),
            }
          : undefined,
        // Configure consumer group settings
        consumer: {
          groupId: 'gamification-rewards-consumers',
          // Allow consumers to read from the beginning of the topic if no offset is found
          allowAutoTopicCreation: false,
          // Configure session timeout and heartbeat interval for better failure detection
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          // Configure max bytes to prevent memory issues with large messages
          maxBytes: 1048576, // 1MB
          // Configure max wait time for batching messages
          maxWaitTimeInMs: 500,
        },
        // Configure retry settings for producer and consumer operations
        retry: {
          // Start with a short retry time and increase exponentially
          initialRetryTime: 300,
          // Allow up to 10 retries before considering the operation failed
          retries: 10,
          // Cap the maximum retry time to prevent excessive delays
          maxRetryTime: 30000,
          // Use a factor of 0.2 for exponential backoff calculation
          factor: 0.2,
          // Add jitter to prevent thundering herd problem
          multiplier: 1.5,
          retryFactor: 1.8,
          // Randomize retry times to prevent synchronized retries
          minRandomFactor: 0.8,
          maxRandomFactor: 1.2,
        },
      }),
    }),
    // Import logger module for structured logging
    LoggerModule,
    // Import tracing module for distributed tracing
    TracingModule,
  ],
  providers: [
    // Register all journey-specific consumers
    // Health journey consumer processes reward events from the Health service
    HealthJourneyConsumer,
    // Care journey consumer processes reward events from the Care service
    CareJourneyConsumer,
    // Plan journey consumer processes reward events from the Plan service
    PlanJourneyConsumer,
    // Provide factory for consumer configuration
    {
      provide: 'KAFKA_REWARD_CONSUMER_CONFIG',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Configure dead letter queue settings
        dlq: {
          enabled: configService.get<boolean>('KAFKA_DLQ_ENABLED', true),
          topicPrefix: 'dlq-rewards-',
          maxRetries: configService.get<number>('KAFKA_DLQ_MAX_RETRIES', 3),
        },
        // Configure topic subscriptions for each journey
        topics: {
          health: configService.get<string[]>('KAFKA_HEALTH_REWARD_TOPICS', [
            'health-metric-rewards',
            'health-goal-rewards',
            'health-insight-rewards',
            'health-device-rewards',
          ]),
          care: configService.get<string[]>('KAFKA_CARE_REWARD_TOPICS', [
            'care-appointment-rewards',
            'care-medication-rewards',
            'care-telemedicine-rewards',
            'care-plan-rewards',
          ]),
          plan: configService.get<string[]>('KAFKA_PLAN_REWARD_TOPICS', [
            'plan-claim-rewards',
            'plan-benefit-rewards',
            'plan-selection-rewards',
            'plan-redemption-rewards',
          ]),
        },
        // Configure monitoring settings
        monitoring: {
          enabled: configService.get<boolean>('KAFKA_MONITORING_ENABLED', true),
          metricsInterval: configService.get<number>('KAFKA_METRICS_INTERVAL', 15000),
        },
      }),
    },
  ],
  exports: [
    // Export consumers for use in other modules if needed
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    // Export consumer configuration for use in other modules
    'KAFKA_REWARD_CONSUMER_CONFIG',
  ],
})
export class ConsumersModule implements OnModuleInit {
  /**
   * Constructor logs initialization of the rewards consumers module
   * This helps with debugging and monitoring the application startup
   */
  constructor(
    private readonly configService: ConfigService,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
    private readonly healthJourneyConsumer: HealthJourneyConsumer,
    private readonly careJourneyConsumer: CareJourneyConsumer,
    private readonly planJourneyConsumer: PlanJourneyConsumer,
  ) {
    // Log the initialization of the consumers module with the configured topics
    const healthTopics = this.configService.get<string[]>('KAFKA_HEALTH_REWARD_TOPICS', [
      'health-metric-rewards',
      'health-goal-rewards',
      'health-insight-rewards',
      'health-device-rewards',
    ]);
    const careTopics = this.configService.get<string[]>('KAFKA_CARE_REWARD_TOPICS', [
      'care-appointment-rewards',
      'care-medication-rewards',
      'care-telemedicine-rewards',
      'care-plan-rewards',
    ]);
    const planTopics = this.configService.get<string[]>('KAFKA_PLAN_REWARD_TOPICS', [
      'plan-claim-rewards',
      'plan-benefit-rewards',
      'plan-selection-rewards',
      'plan-redemption-rewards',
    ]);

    this.logger.log(
      'Initialized Reward Consumers Module',
      {
        healthTopics,
        careTopics,
        planTopics,
        consumerGroup: this.configService.get<string>('KAFKA_CONSUMER_GROUP', 'gamification-rewards-consumers'),
        dlqEnabled: this.configService.get<boolean>('KAFKA_DLQ_ENABLED', true),
        maxRetries: this.configService.get<number>('KAFKA_DLQ_MAX_RETRIES', 3),
      },
      'ConsumersModule',
    );
  }

  /**
   * Lifecycle hook that runs when the module is initialized
   * Ensures all consumers are properly connected and subscribed to their topics
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing reward consumers...', {}, 'ConsumersModule');
      
      // Initialize all consumers in parallel
      await Promise.all([
        this.healthJourneyConsumer.connect(),
        this.careJourneyConsumer.connect(),
        this.planJourneyConsumer.connect(),
      ]);
      
      this.logger.log('All reward consumers initialized successfully', {}, 'ConsumersModule');
    } catch (error) {
      this.logger.error(
        'Failed to initialize reward consumers',
        {
          error: error.message,
          stack: error.stack,
        },
        'ConsumersModule',
      );
      // Re-throw the error to prevent the application from starting with failed consumers
      throw error;
    }
  }
}