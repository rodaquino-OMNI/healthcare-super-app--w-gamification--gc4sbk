import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '../../common/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module'; // @app/shared ^1.0.0
import { TracingModule } from '@app/shared/tracing/tracing.module'; // @app/shared ^1.0.0
import { AchievementsModule } from '../achievements.module';
import { AchievementsService } from '../achievements.service';

// Journey-specific consumers
import { HealthJourneyConsumer } from './health-journey.consumer';
import { CareJourneyConsumer } from './care-journey.consumer';
import { PlanJourneyConsumer } from './plan-journey.consumer';

/**
 * Module that registers all achievement event consumers with the dependency injection system.
 * Configures Kafka consumer groups, topic subscriptions, and consumer factory settings.
 * Provides consistent configuration for all journey-specific consumers with proper error handling and monitoring.
 *
 * This module is responsible for:
 * - Registering all journey-specific consumers as providers
 * - Configuring Kafka consumer groups with proper naming
 * - Setting up topic subscriptions for each journey's events
 * - Implementing consumer factory with retry and backoff settings
 * - Configuring dead letter queues for failed messages
 */
@Module({
  imports: [
    KafkaModule,
    LoggerModule,
    TracingModule,
    ConfigModule,
    AchievementsModule,
  ],
  providers: [
    // Journey-specific consumers
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    
    // Factory provider for consumer configuration
    {
      provide: 'KAFKA_CONSUMER_CONFIG',
      useFactory: (configService: ConfigService) => {
        const kafkaConfig = configService.get('gamificationEngine.kafka');
        return {
          // Configure consumer group with proper naming for achievement events
          groupId: kafkaConfig?.groupId || 'gamification-achievement-consumer-group',
          
          // Set up topic subscriptions for each journey's events
          topics: {
            health: kafkaConfig?.topics?.healthEvents || 'health.events',
            care: kafkaConfig?.topics?.careEvents || 'care.events',
            plan: kafkaConfig?.topics?.planEvents || 'plan.events',
          },
          
          // Implement retry strategy with exponential backoff
          retry: {
            maxRetries: kafkaConfig?.maxRetries || 3,
            initialRetryTime: kafkaConfig?.retryInterval || 1000,
            retryFactor: 2, // Exponential backoff factor
            maxRetryTime: 30000, // Maximum retry time (30 seconds)
          },
          
          // Configure dead letter queue for failed messages
          dlq: {
            enabled: true,
            topic: 'achievements.events.dlq',
          },
          
          // Enable auto-commit for processed messages
          autoCommit: true,
          
          // Configure consumer to start from the latest offset by default
          fromBeginning: false,
        };
      },
      inject: [ConfigService],
    },
    
    // Factory provider for consumer error handler
    {
      provide: 'KAFKA_ERROR_HANDLER',
      useFactory: (achievementsService: AchievementsService) => {
        return {
          handleError: (error: Error, topic: string, partition: number, offset: string) => {
            // Log the error with context
            console.error(`Error processing message from ${topic}[${partition}:${offset}]: ${error.message}`, error.stack);
            
            // Track error metrics for monitoring
            // achievementsService.trackErrorMetric(topic, error.message);
            
            // Return true to continue processing, false to stop
            return true;
          }
        };
      },
      inject: [AchievementsService],
    },
  ],
  exports: [
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    'KAFKA_CONSUMER_CONFIG',
    'KAFKA_ERROR_HANDLER',
  ],
})
export class ConsumersModule {}