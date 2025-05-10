import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { KafkaService } from './kafka.service';
import { KafkaConfigOptions } from './kafka.types';

/**
 * Options for configuring the KafkaModule.
 */
export interface KafkaModuleOptions {
  /**
   * Whether to register the module as global.
   * @default true
   */
  isGlobal?: boolean;
  
  /**
   * Service-specific namespace for configuration.
   */
  serviceNamespace?: string;
  
  /**
   * Additional providers to register with the module.
   */
  providers?: Provider[];
}

/**
 * NestJS module for Kafka integration.
 * Provides Kafka services for dependency injection.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [KafkaService],
  exports: [KafkaService]
})
export class KafkaModule {
  /**
   * Registers the KafkaModule with default configuration.
   * @returns A dynamic module configuration.
   */
  static register(): DynamicModule {
    return {
      module: KafkaModule,
      providers: [KafkaService],
      exports: [KafkaService]
    };
  }

  /**
   * Registers the KafkaModule with custom options.
   * 
   * @param options - Configuration options for the module.
   * @returns A dynamic module configuration.
   */
  static registerAsync(options: KafkaModuleOptions = {}): DynamicModule {
    const { isGlobal = true, serviceNamespace, providers = [] } = options;
    
    return {
      module: KafkaModule,
      global: isGlobal,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'KAFKA_OPTIONS',
          useFactory: (configService: ConfigService) => ({
            serviceNamespace: serviceNamespace || configService.get<string>('service.namespace', 'default')
          }),
          inject: [ConfigService]
        },
        {
          provide: KafkaService,
          useFactory: (configService: ConfigService, loggerService: LoggerService, tracingService: TracingService, kafkaOptions: KafkaConfigOptions) => {
            return new KafkaService(configService, loggerService, tracingService);
          },
          inject: [ConfigService, LoggerService, TracingService, 'KAFKA_OPTIONS']
        },
        ...providers
      ],
      exports: [KafkaService, ...providers.map(provider => 
        typeof provider === 'function' ? provider : provider.provide
      )]
    };
  }

  /**
   * Registers the KafkaModule with configuration from a factory function.
   * 
   * @param optionsFactory - Factory function that returns module options.
   * @returns A dynamic module configuration.
   */
  static registerWithFactory(
    optionsFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>,
    extraProviders: Provider[] = []
  ): DynamicModule {
    return {
      module: KafkaModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'KAFKA_MODULE_OPTIONS',
          useFactory: optionsFactory,
          inject: extraProviders.map(provider => 
            typeof provider === 'function' ? provider : provider.provide
          )
        },
        {
          provide: KafkaService,
          useFactory: async (configService: ConfigService, loggerService: LoggerService, tracingService: TracingService, options: KafkaModuleOptions) => {
            return new KafkaService(
              configService,
              loggerService,
              tracingService
            );
          },
          inject: [ConfigService, LoggerService, TracingService, 'KAFKA_MODULE_OPTIONS']
        },
        ...extraProviders
      ],
      exports: [KafkaService]
    };
  }
}