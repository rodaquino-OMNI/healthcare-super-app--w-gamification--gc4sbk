import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '../../common/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module'; // @app/shared ^1.0.0
import { TracingModule } from '@app/shared/tracing/tracing.module'; // @app/shared ^1.0.0
import { RewardsModule } from '../rewards.module';
import { RewardsService } from '../rewards.service';

// Journey-specific reward consumers
// Each consumer is responsible for processing reward events from its respective journey
// and triggering the appropriate reward distribution logic
import { HealthJourneyConsumer } from './health-journey.consumer'; // Processes health metric, goal achievement, and device sync events
import { CareJourneyConsumer } from './care-journey.consumer';   // Processes appointment, medication adherence, and telemedicine events
import { PlanJourneyConsumer } from './plan-journey.consumer';   // Processes claim submission, benefit utilization, and plan selection events

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
 * - Configuring dead letter queues for failed messages
 * - Setting up monitoring for event processing
 */
@Module({
  imports: [
    KafkaModule,
    LoggerModule,
    TracingModule,
    ConfigModule,
    RewardsModule,
  ],
  providers: [
    // Journey-specific reward consumers
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    
    // Factory provider for consumer configuration
    {
      provide: 'KAFKA_REWARD_CONSUMER_CONFIG',
      useFactory: (configService: ConfigService) => {
        const kafkaConfig = configService.get('gamificationEngine.kafka');
        return {
          // Configure consumer group with proper naming for reward events
          // Using a dedicated consumer group ensures proper message distribution and prevents duplicate processing
          groupId: kafkaConfig?.groupId || 'gamification-reward-consumer-group',
          
          // Set up topic subscriptions for each journey's reward events
          // Each journey publishes events to its own dedicated topic for better isolation and scaling
          topics: {
            health: kafkaConfig?.topics?.healthRewardEvents || 'health.reward.events',
            care: kafkaConfig?.topics?.careRewardEvents || 'care.reward.events',
            plan: kafkaConfig?.topics?.planRewardEvents || 'plan.reward.events',
            // Cross-journey events that may trigger rewards across multiple journeys
            crossJourney: kafkaConfig?.topics?.crossJourneyEvents || 'cross-journey.events',
          },
          
          // Implement retry strategy with exponential backoff
          // This prevents overwhelming the system during recovery and gives transient issues time to resolve
          retry: {
            maxRetries: kafkaConfig?.maxRetries || 3,
            initialRetryTime: kafkaConfig?.retryInterval || 1000,
            retryFactor: 2, // Exponential backoff factor (1s, 2s, 4s, etc.)
            maxRetryTime: 30000, // Maximum retry time (30 seconds)
            // Add jitter to prevent thundering herd problem when multiple consumers retry simultaneously
            jitter: true,
            // Track retry attempts in message headers for observability
            trackRetries: true,
          },
          
          // Configure dead letter queue (DLQ) for failed messages
          // Messages that exhaust retry attempts are sent to the DLQ for later inspection and potential replay
          dlq: {
            enabled: true,
            topic: 'rewards.events.dlq',
            // Preserve original message metadata and add error context
            enrichment: {
              includeHeaders: true,
              includeOriginalMessage: true,
              addErrorContext: true,
              addTimestamp: true,
            },
            // Configure separate DLQ topics for each journey if needed
            journeySpecificDlq: {
              enabled: kafkaConfig?.journeySpecificDlq || false,
              topics: {
                health: 'health.rewards.events.dlq',
                care: 'care.rewards.events.dlq',
                plan: 'plan.rewards.events.dlq',
              },
            },
          },
          
          // Enable auto-commit for processed messages
          // This ensures that successfully processed messages are not reprocessed after consumer restart
          autoCommit: true,
          autoCommitInterval: 5000, // Commit offsets every 5 seconds
          
          // Configure consumer to start from the latest offset by default
          // This prevents processing historical events on service restart
          fromBeginning: false,
          
          // Additional consumer configuration for performance and reliability
          sessionTimeout: 30000, // 30 seconds (default is 10000)
          heartbeatInterval: 3000, // 3 seconds (default is 3000)
          // Maximum number of messages to process in parallel
          maxParallelHandles: kafkaConfig?.maxParallelHandles || 100,
          // Enable monitoring and metrics collection
          monitoring: {
            enabled: true,
            // Collect consumer lag metrics
            consumerLag: true,
            // Track message processing time
            processingTime: true,
            // Monitor batch size statistics
            batchSize: true,
          },
        };
      },
      inject: [ConfigService],
    },
    
    // Factory provider for consumer error handler with comprehensive error handling
    {
      provide: 'KAFKA_REWARD_ERROR_HANDLER',
      useFactory: (rewardsService: RewardsService, configService: ConfigService) => {
        const maxConsecutiveErrors = configService.get('gamificationEngine.kafka.maxConsecutiveErrors') || 5;
        let consecutiveErrors = 0;
        
        return {
          handleError: (error: Error, topic: string, partition: number, offset: string) => {
            consecutiveErrors++;
            
            // Structured error logging with context for better observability
            console.error({
              message: `Error processing reward event`,
              error: error.message,
              stack: error.stack,
              metadata: {
                topic,
                partition,
                offset,
                consecutiveErrors,
                timestamp: new Date().toISOString(),
              }
            });
            
            // Track error metrics for monitoring and alerting
            // rewardsService.trackErrorMetric(topic, error.message);
            
            // Circuit breaker pattern: stop processing after too many consecutive errors
            // to prevent cascading failures and allow system recovery
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.error(`Circuit breaker triggered: Too many consecutive errors (${consecutiveErrors}) processing reward events`);
              return false; // Stop processing
            }
            
            return true; // Continue processing
          },
          
          // Reset error count on successful processing
          handleSuccess: () => {
            if (consecutiveErrors > 0) {
              consecutiveErrors = 0;
            }
          }
        };
      },
      inject: [RewardsService, ConfigService],
    },
  ],
  exports: [
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    'KAFKA_REWARD_CONSUMER_CONFIG',
    'KAFKA_REWARD_ERROR_HANDLER',
  ],
})
export class ConsumersModule {}