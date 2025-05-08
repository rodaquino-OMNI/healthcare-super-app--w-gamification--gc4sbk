import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { KafkaModuleOptions, KafkaModuleAsyncOptions } from './kafka.types';
import { KAFKA_MODULE_OPTIONS } from './kafka.constants';
import { DLQService } from './dlq.service';
import { MessageSerializer } from './message-serializer';
import { RetryStrategy } from './retry.strategy';
import { BaseConsumer } from './base-consumer.abstract';
import { BaseProducer } from './base-producer.abstract';

/**
 * KafkaModule provides a centralized configuration for all Kafka-related services
 * in the gamification engine. It uses the factory pattern to allow for flexible
 * configuration options and imports necessary dependencies like LoggerModule and
 * TracingModule.
 *
 * This module can be imported synchronously with static options or asynchronously
 * using a factory function, useClass, or useExisting pattern.
 *
 * @example
 * // Import with static configuration
 * @Module({
 *   imports: [
 *     KafkaModule.register({
 *       client: {
 *         clientId: 'gamification-engine',
 *         brokers: ['localhost:9092'],
 *       },
 *       consumer: {
 *         groupId: 'gamification-engine-group',
 *       },
 *       topics: ['health.events', 'care.events', 'plan.events'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // Import with async configuration from ConfigService
 * @Module({
 *   imports: [
 *     KafkaModule.forRootAsync(),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // Import with custom async factory
 * @Module({
 *   imports: [
 *     KafkaModule.registerAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (configService: ConfigService) => ({
 *         client: {
 *           clientId: configService.get('KAFKA_CLIENT_ID'),
 *           brokers: configService.get('KAFKA_BROKERS').split(','),
 *         },
 *         consumer: {
 *           groupId: configService.get('KAFKA_CONSUMER_GROUP'),
 *         },
 *         topics: configService.get('KAFKA_TOPICS').split(','),
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Global()
@Module({
  imports: [LoggerModule, TracingModule, ConfigModule],
})
export class KafkaModule {
  /**
   * Register the KafkaModule with static options
   * @param options Configuration options for the Kafka module
   * @returns A dynamically configured NestJS module
   */
  static register(options: KafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: KAFKA_MODULE_OPTIONS,
          useValue: options,
        },
        DLQService,
        MessageSerializer,
        RetryStrategy,
        BaseConsumer,
        BaseProducer,
      ],
      exports: [KAFKA_MODULE_OPTIONS, DLQService, MessageSerializer, RetryStrategy, BaseConsumer, BaseProducer],
    };
  }

  /**
   * Register the KafkaModule with async options using a factory function
   * @param options Async configuration options for the Kafka module
   * @returns A dynamically configured NestJS module
   */
  static registerAsync(options: KafkaModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        DLQService,
        MessageSerializer,
        RetryStrategy,
        BaseConsumer,
        BaseProducer,
        ...(options.providers || []),
      ],
      exports: [KAFKA_MODULE_OPTIONS, DLQService, MessageSerializer, RetryStrategy, BaseConsumer, BaseProducer],
    };
  }

  /**
   * Create providers for async module configuration
   * @param options Async configuration options
   * @returns An array of providers
   */
  private static createAsyncProviders(options: KafkaModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass as Type<any>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  /**
   * Create the async options provider based on the provided configuration
   * @param options Async configuration options
   * @returns A provider for the module options
   */
  private static createAsyncOptionsProvider(options: KafkaModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: KAFKA_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      options.useClass || options.useExisting,
    ];

    return {
      provide: KAFKA_MODULE_OPTIONS,
      useFactory: async (optionsFactory: any) => {
        return optionsFactory.createKafkaOptions();
      },
      inject,
    };
  }

  /**
   * Register the KafkaModule with configuration from ConfigService
   * @returns A dynamically configured NestJS module
   */
  static forRootAsync(): DynamicModule {
    return this.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const kafkaConfig = configService.get('kafka') || {};
        const gamificationConfig = configService.get('gamificationEngine') || {};
        
        return {
          client: {
            clientId: gamificationConfig.kafka?.clientId || kafkaConfig.clientId || 'gamification-engine',
            brokers: gamificationConfig.kafka?.brokers || kafkaConfig.brokers || ['localhost:9092'],
            ssl: gamificationConfig.kafka?.ssl || kafkaConfig.ssl || false,
            sasl: gamificationConfig.kafka?.sasl || kafkaConfig.sasl,
          },
          consumer: {
            groupId: gamificationConfig.kafka?.groupId || kafkaConfig.groupId || 'gamification-engine-group',
            allowAutoTopicCreation: true,
          },
          topics: [
            gamificationConfig.kafka?.topics?.healthEvents || kafkaConfig.topics?.healthEvents || 'health.events',
            gamificationConfig.kafka?.topics?.careEvents || kafkaConfig.topics?.careEvents || 'care.events',
            gamificationConfig.kafka?.topics?.planEvents || kafkaConfig.topics?.planEvents || 'plan.events',
            gamificationConfig.kafka?.topics?.userEvents || kafkaConfig.topics?.userEvents || 'user.events',
          ].filter(Boolean),
          dlq: {
            enabled: gamificationConfig.kafka?.dlq?.enabled || kafkaConfig.dlq?.enabled || true,
            topics: gamificationConfig.kafka?.dlq?.topics || kafkaConfig.dlq?.topics || {
              'health.events': 'health.events.dlq',
              'care.events': 'care.events.dlq',
              'plan.events': 'plan.events.dlq',
              'user.events': 'user.events.dlq',
            },
          },
          retry: {
            maxRetries: gamificationConfig.kafka?.retry?.maxRetries || kafkaConfig.retry?.maxRetries || 3,
            initialDelayMs: gamificationConfig.kafka?.retry?.initialDelayMs || kafkaConfig.retry?.initialDelayMs || 1000,
            maxDelayMs: gamificationConfig.kafka?.retry?.maxDelayMs || kafkaConfig.retry?.maxDelayMs || 30000,
            backoffFactor: gamificationConfig.kafka?.retry?.backoffFactor || kafkaConfig.retry?.backoffFactor || 2,
            jitterFactor: gamificationConfig.kafka?.retry?.jitterFactor || kafkaConfig.retry?.jitterFactor || 0.1,
          },
        };
      },
    });
  }
}