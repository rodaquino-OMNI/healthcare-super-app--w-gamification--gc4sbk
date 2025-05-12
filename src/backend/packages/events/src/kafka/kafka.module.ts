import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaProducer } from './kafka.producer';
import { KAFKA_MODULE_OPTIONS } from './kafka.constants';
import { KafkaModuleAsyncOptions, KafkaModuleOptions, KafkaOptionsFactory } from './kafka.interfaces';

/**
 * Module that provides Kafka integration for event streaming and asynchronous communication.
 * 
 * This module serves as the entry point for Kafka integration in any NestJS application
 * within the AUSTA SuperApp, providing connection management, event production, and
 * consumption capabilities with consistent configuration and error handling.
 * 
 * Key capabilities supported:
 * - Publishing events from all journey services to appropriate topics
 * - Consuming events for processing in the gamification engine
 * - Reliable message delivery with error handling and retries
 * - Distributed tracing of message flow for observability
 * - Journey-specific event processing and routing
 * 
 * @example
 * // Static registration with direct options
 * @Module({
 *   imports: [
 *     KafkaModule.register({
 *       clientId: 'my-service',
 *       brokers: ['localhost:9092'],
 *       groupId: 'my-service-group',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Module({})
export class KafkaModule {
  /**
   * Register the Kafka module with static options
   * 
   * @param options Configuration options for the Kafka client
   * @param global Whether the module should be registered as global (default: true)
   * @returns A dynamic module that can be imported into other modules
   * 
   * @example
   * KafkaModule.register({
   *   clientId: 'my-service',
   *   brokers: ['localhost:9092'],
   *   groupId: 'my-service-group',
   * })
   */
  static register(options: KafkaModuleOptions, global = true): DynamicModule {
    const providers = [
      {
        provide: KAFKA_MODULE_OPTIONS,
        useValue: options,
      },
      KafkaService,
      KafkaProducer,
    ];

    return {
      module: KafkaModule,
      global,
      imports: [ConfigModule],
      providers,
      exports: [KafkaService, KafkaProducer],
    };
  }

  /**
   * Register the Kafka module with async options using a factory
   * 
   * @param options Async configuration options for the Kafka client
   * @param global Whether the module should be registered as global (default: true)
   * @returns A dynamic module that can be imported into other modules
   * 
   * @example
   * KafkaModule.registerAsync({
   *   imports: [ConfigModule],
   *   useFactory: (configService: ConfigService) => ({
   *     clientId: configService.get('KAFKA_CLIENT_ID'),
   *     brokers: configService.get('KAFKA_BROKERS').split(','),
   *     groupId: configService.get('KAFKA_GROUP_ID'),
   *   }),
   *   inject: [ConfigService],
   * })
   */
  static registerAsync(options: KafkaModuleAsyncOptions, global = true): DynamicModule {
    const providers = [
      ...this.createAsyncProviders(options),
      KafkaService,
      KafkaProducer,
    ];

    return {
      module: KafkaModule,
      global,
      imports: options.imports || [],
      providers,
      exports: [KafkaService, KafkaProducer],
    };
  }

  /**
   * Create async providers for the Kafka module
   * 
   * @param options Async configuration options for the Kafka client
   * @returns An array of providers for the Kafka module
   * @private
   */
  private static createAsyncProviders(options: KafkaModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass as Type<KafkaOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  /**
   * Create an async options provider for the Kafka module
   * 
   * @param options Async configuration options for the Kafka client
   * @returns A provider for the Kafka module options
   * @private
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
      (options.useClass || options.useExisting) as Type<KafkaOptionsFactory>,
    ];

    return {
      provide: KAFKA_MODULE_OPTIONS,
      useFactory: async (optionsFactory: KafkaOptionsFactory) =>
        await optionsFactory.createKafkaOptions(),
      inject,
    };
  }

  /**
   * Register the Kafka module for a specific journey service
   * 
   * This method is a convenience wrapper around registerAsync that configures
   * the Kafka module with journey-specific settings.
   * 
   * @param journeyName The name of the journey service (e.g., 'health', 'care', 'plan')
   * @param options Additional configuration options for the Kafka client
   * @param global Whether the module should be registered as global (default: true)
   * @returns A dynamic module that can be imported into other modules
   * 
   * @example
   * KafkaModule.forJourney('health', {
   *   additionalBrokers: ['kafka-broker-2:9092'],
   *   customOptions: { ... },
   * })
   */
  static forJourney(
    journeyName: string,
    options: Partial<KafkaModuleOptions> = {},
    global = true,
  ): DynamicModule {
    return this.registerAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const baseClientId = configService.get('KAFKA_CLIENT_ID') || 'austa';
          const baseBrokers = configService.get('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];
          const baseGroupId = configService.get('KAFKA_GROUP_ID') || 'austa-group';
          
          return {
            clientId: `${baseClientId}-${journeyName}`,
            brokers: [...baseBrokers, ...(options.brokers || [])],
            groupId: `${baseGroupId}-${journeyName}`,
            ...options,
          };
        },
      },
      global,
    );
  }
}