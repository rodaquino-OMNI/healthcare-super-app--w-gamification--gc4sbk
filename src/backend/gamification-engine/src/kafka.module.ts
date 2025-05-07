import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from './events/kafka/kafka.consumer';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { ExceptionsModule } from '@app/shared/exceptions/exceptions.module';
import { KafkaProducerService } from './kafka/kafka.producer.service';
import { KafkaService } from './kafka/kafka.service';
import { KafkaRetryService } from './kafka/kafka.retry.service';
import { KafkaDlqService } from './kafka/kafka.dlq.service';
import { KafkaHealthService } from './kafka/kafka.health.service';
import { KafkaMonitoringService } from './kafka/kafka.monitoring.service';
import { RetryStrategy } from './events/kafka/retry.strategy';

/**
 * Options for configuring the KafkaModule
 */
export interface KafkaModuleOptions {
  /**
   * Client ID for Kafka connection
   */
  clientId?: string;
  
  /**
   * Kafka broker addresses
   */
  brokers?: string[];
  
  /**
   * Consumer group ID
   */
  groupId?: string;
  
  /**
   * Topics to subscribe to
   */
  topics?: Record<string, string>;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Base retry interval in milliseconds
   */
  retryInterval?: number;
  
  /**
   * Whether to enable dead letter queue
   */
  enableDlq?: boolean;
  
  /**
   * Whether to enable monitoring
   */
  enableMonitoring?: boolean;
}

/**
 * Kafka Module for the Gamification Engine
 * 
 * This module provides reliable event consumption and production with:
 * - Comprehensive error handling
 * - Dead letter queues for failed events
 * - Retry mechanisms with exponential backoff
 * - Monitoring and health checks
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    TracingModule,
    ExceptionsModule,
  ],
  providers: [
    KafkaService,
    KafkaConsumerService,
    KafkaProducerService,
    KafkaRetryService,
    KafkaDlqService,
    KafkaHealthService,
    KafkaMonitoringService,
    RetryStrategy,
  ],
  exports: [
    KafkaService,
    KafkaConsumerService,
    KafkaProducerService,
    KafkaRetryService,
    KafkaDlqService,
    KafkaHealthService,
    KafkaMonitoringService,
    RetryStrategy,
  ],
})
export class KafkaModule {
  /**
   * Register the KafkaModule with default configuration from environment variables
   */
  static register(): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ConfigModule,
        LoggerModule,
        TracingModule,
        ExceptionsModule,
      ],
      providers: [
        KafkaService,
        KafkaConsumerService,
        KafkaProducerService,
        KafkaRetryService,
        KafkaDlqService,
        KafkaHealthService,
        KafkaMonitoringService,
        RetryStrategy,
      ],
      exports: [
        KafkaService,
        KafkaConsumerService,
        KafkaProducerService,
        KafkaRetryService,
        KafkaDlqService,
        KafkaHealthService,
        KafkaMonitoringService,
        RetryStrategy,
      ],
    };
  }

  /**
   * Register the KafkaModule with custom options
   * 
   * @param options Custom configuration options for the Kafka module
   */
  static registerAsync(options: KafkaModuleOptions): DynamicModule {
    const kafkaOptionsProvider: Provider = {
      provide: 'KAFKA_MODULE_OPTIONS',
      useFactory: (configService: ConfigService) => {
        const kafkaConfig = configService.get('gamificationEngine.kafka');
        
        return {
          clientId: options.clientId || kafkaConfig.clientId,
          brokers: options.brokers || kafkaConfig.brokers,
          groupId: options.groupId || kafkaConfig.groupId,
          topics: options.topics || kafkaConfig.topics,
          maxRetries: options.maxRetries || kafkaConfig.maxRetries,
          retryInterval: options.retryInterval || kafkaConfig.retryInterval,
          enableDlq: options.enableDlq !== undefined ? options.enableDlq : true,
          enableMonitoring: options.enableMonitoring !== undefined ? options.enableMonitoring : true,
        };
      },
      inject: [ConfigService],
    };

    return {
      module: KafkaModule,
      imports: [
        ConfigModule,
        LoggerModule,
        TracingModule,
        ExceptionsModule,
      ],
      providers: [
        kafkaOptionsProvider,
        {
          provide: KafkaService,
          useFactory: (options: KafkaModuleOptions, logger: LoggerService, tracing: TracingService) => {
            return new KafkaService(options, logger, tracing);
          },
          inject: ['KAFKA_MODULE_OPTIONS', LoggerService, TracingService],
        },
        {
          provide: KafkaConsumerService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaConsumerService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaProducerService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, tracing: TracingService) => {
            return new KafkaProducerService(kafkaService, logger, tracing);
          },
          inject: [KafkaService, LoggerService, TracingService],
        },
        {
          provide: KafkaRetryService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaRetryService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaDlqService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaDlqService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaHealthService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService) => {
            return new KafkaHealthService(kafkaService, logger);
          },
          inject: [KafkaService, LoggerService],
        },
        {
          provide: KafkaMonitoringService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaMonitoringService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
      ],
      exports: [
        KafkaService,
        KafkaConsumerService,
        KafkaProducerService,
        KafkaRetryService,
        KafkaDlqService,
        KafkaHealthService,
        KafkaMonitoringService,
      ],
    };
  }

  /**
   * Register the KafkaModule with configuration from the ConfigService
   */
  static registerWithConfigService(): DynamicModule {
    const kafkaOptionsProvider: Provider = {
      provide: 'KAFKA_MODULE_OPTIONS',
      useFactory: (configService: ConfigService) => {
        const kafkaConfig = configService.get('gamificationEngine.kafka');
        
        return {
          clientId: kafkaConfig.clientId,
          brokers: kafkaConfig.brokers,
          groupId: kafkaConfig.groupId,
          topics: kafkaConfig.topics,
          maxRetries: kafkaConfig.maxRetries,
          retryInterval: kafkaConfig.retryInterval,
          enableDlq: true,
          enableMonitoring: true,
        };
      },
      inject: [ConfigService],
    };

    return {
      module: KafkaModule,
      imports: [
        ConfigModule,
        LoggerModule,
        TracingModule,
        ExceptionsModule,
      ],
      providers: [
        kafkaOptionsProvider,
        {
          provide: KafkaService,
          useFactory: (options: KafkaModuleOptions, logger: LoggerService, tracing: TracingService) => {
            return new KafkaService(options, logger, tracing);
          },
          inject: ['KAFKA_MODULE_OPTIONS', LoggerService, TracingService],
        },
        {
          provide: KafkaConsumerService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaConsumerService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaProducerService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, tracing: TracingService) => {
            return new KafkaProducerService(kafkaService, logger, tracing);
          },
          inject: [KafkaService, LoggerService, TracingService],
        },
        {
          provide: KafkaRetryService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaRetryService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaDlqService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaDlqService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: KafkaHealthService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService) => {
            return new KafkaHealthService(kafkaService, logger);
          },
          inject: [KafkaService, LoggerService],
        },
        {
          provide: KafkaMonitoringService,
          useFactory: (kafkaService: KafkaService, logger: LoggerService, options: KafkaModuleOptions) => {
            return new KafkaMonitoringService(kafkaService, logger, options);
          },
          inject: [KafkaService, LoggerService, 'KAFKA_MODULE_OPTIONS'],
        },
        {
          provide: RetryStrategy,
          useFactory: (configService: ConfigService, logger: LoggerService) => {
            return new RetryStrategy(configService, logger);
          },
          inject: [ConfigService, LoggerService],
        },
        {
          provide: RetryStrategy,
          useFactory: (configService: ConfigService, logger: LoggerService) => {
            return new RetryStrategy(configService, logger);
          },
          inject: [ConfigService, LoggerService],
        },
      ],
      exports: [
        KafkaService,
        KafkaConsumerService,
        KafkaProducerService,
        KafkaRetryService,
        KafkaDlqService,
        KafkaHealthService,
        KafkaMonitoringService,
        RetryStrategy,
      ],
    };
  }
}