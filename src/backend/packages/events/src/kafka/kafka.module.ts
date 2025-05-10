import { DynamicModule, Global, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';

/**
 * Configuration options for the KafkaModule
 */
export interface KafkaModuleOptions {
  /**
   * Service-specific configuration namespace in the configuration
   * Used to isolate settings for different services
   */
  configNamespace?: string;

  /**
   * Whether to automatically connect to Kafka on module initialization
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Whether to register schema validation for messages
   * @default false
   */
  enableSchemaValidation?: boolean;

  /**
   * Whether to enable distributed tracing for Kafka messages
   * @default true
   */
  enableTracing?: boolean;

  /**
   * Whether to register the consumer service
   * @default true
   */
  registerConsumer?: boolean;

  /**
   * Whether to register the producer service
   * @default true
   */
  registerProducer?: boolean;

  /**
   * Custom providers to register with the module
   */
  extraProviders?: Provider[];
}

/**
 * Options for asynchronous module configuration
 */
export interface KafkaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Whether to register the module as global
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Factory function to create module options
   */
  useFactory?: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];

  /**
   * Class to use for creating module options
   */
  useClass?: Type<KafkaModuleOptionsFactory>;

  /**
   * Existing provider to use for module options
   */
  useExisting?: Type<KafkaModuleOptionsFactory>;
}

/**
 * Interface for factories that create KafkaModuleOptions
 */
export interface KafkaModuleOptionsFactory {
  /**
   * Creates KafkaModuleOptions
   */
  createKafkaOptions(): Promise<KafkaModuleOptions> | KafkaModuleOptions;
}

/**
 * Module that provides Kafka integration for event streaming and asynchronous communication.
 * 
 * This module can be configured to support service-specific settings and can be registered
 * either globally or locally depending on the application's needs.
 * 
 * Key capabilities supported:
 * - Publishing events from all journey services to appropriate topics
 * - Consuming events for processing in the gamification engine and other services
 * - Reliable message delivery with error handling and retries
 * - Distributed tracing of message flow for observability
 * - Journey-specific event processing and routing
 * - Schema validation for message format consistency
 * - Dead letter queue handling for failed messages
 * 
 * @example
 * // Register globally with default options
 * @Module({
 *   imports: [KafkaModule.register()],
 * })
 * export class AppModule {}
 * 
 * @example
 * // Register with custom options
 * @Module({
 *   imports: [KafkaModule.register({
 *     configNamespace: 'gamification',
 *     enableSchemaValidation: true,
 *   })],
 * })
 * export class AppModule {}
 * 
 * @example
 * // Register asynchronously with factory
 * @Module({
 *   imports: [KafkaModule.registerAsync({
 *     imports: [ConfigModule],
 *     useFactory: (configService: ConfigService) => ({
 *       configNamespace: configService.get('SERVICE_NAME'),
 *       enableSchemaValidation: configService.get('ENABLE_SCHEMA_VALIDATION') === 'true',
 *     }),
 *     inject: [ConfigService],
 *   })],
 * })
 * export class AppModule {}
 */
@Module({})
export class KafkaModule {
  /**
   * Register the KafkaModule with static options
   * 
   * @param options - Configuration options for the module
   * @returns A dynamically configured module
   */
  static register(options: KafkaModuleOptions = {}): DynamicModule {
    const {
      configNamespace,
      autoConnect = true,
      enableSchemaValidation = false,
      enableTracing = true,
      registerConsumer = true,
      registerProducer = true,
      extraProviders = [],
    } = options;

    // Core providers that are always included
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useValue: {
          configNamespace,
          autoConnect,
          enableSchemaValidation,
          enableTracing,
        },
      },
      KafkaService,
    ];

    // Conditionally add producer and consumer
    if (registerProducer) {
      providers.push(KafkaProducer);
    }

    if (registerConsumer) {
      providers.push(KafkaConsumer);
    }

    // Add any extra providers
    if (extraProviders.length > 0) {
      providers.push(...extraProviders);
    }

    return {
      module: KafkaModule,
      global: true,
      imports: [ConfigModule],
      providers,
      exports: [KafkaService, KafkaProducer, KafkaConsumer, ...extraProviders],
    };
  }

  /**
   * Register the KafkaModule with options provided asynchronously
   * 
   * @param options - Async configuration options for the module
   * @returns A dynamically configured module
   */
  static registerAsync(options: KafkaModuleAsyncOptions): DynamicModule {
    const { isGlobal = true } = options;

    const providers: Provider[] = [
      ...this.createAsyncProviders(options),
      KafkaService,
      KafkaProducer,
      KafkaConsumer,
    ];

    return {
      module: KafkaModule,
      global: isGlobal,
      imports: options.imports || [],
      providers,
      exports: [KafkaService, KafkaProducer, KafkaConsumer],
    };
  }

  /**
   * Register the KafkaModule without global scope
   * 
   * @param options - Configuration options for the module
   * @returns A dynamically configured module with local scope
   */
  static registerForFeature(options: KafkaModuleOptions = {}): DynamicModule {
    const module = this.register(options);
    return {
      ...module,
      global: false,
    };
  }

  /**
   * Creates providers for async module configuration
   * 
   * @param options - Async configuration options
   * @returns Array of providers for async configuration
   * @private
   */
  private static createAsyncProviders(options: KafkaModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: 'KAFKA_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    // If useClass is provided, use it to create options
    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: 'KAFKA_MODULE_OPTIONS',
          useFactory: (optionsFactory: KafkaModuleOptionsFactory) =>
            optionsFactory.createKafkaOptions(),
          inject: [options.useClass],
        },
      ];
    }

    // If useExisting is provided, use the existing provider
    if (options.useExisting) {
      return [
        {
          provide: 'KAFKA_MODULE_OPTIONS',
          useFactory: (optionsFactory: KafkaModuleOptionsFactory) =>
            optionsFactory.createKafkaOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    return [];
  }
}