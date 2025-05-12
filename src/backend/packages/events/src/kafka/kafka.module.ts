import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { IKafkaConfig } from './kafka.interfaces';

/**
 * Options for the Kafka module.
 */
export interface KafkaModuleOptions {
  /**
   * Configuration for the Kafka client.
   */
  config?: IKafkaConfig;
  
  /**
   * Whether to register the module globally.
   */
  isGlobal?: boolean;
  
  /**
   * Service name for the Kafka client.
   */
  serviceName?: string;
}

/**
 * Async options for the Kafka module.
 */
export interface KafkaModuleAsyncOptions {
  /**
   * Whether to register the module globally.
   */
  isGlobal?: boolean;
  
  /**
   * Factory function to create the Kafka module options.
   */
  useFactory: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  
  /**
   * Dependencies to inject into the factory function.
   */
  inject?: any[];
}

/**
 * NestJS module for Kafka integration.
 */
@Module({
  imports: [ConfigModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {
  /**
   * Register the Kafka module with static options.
   * 
   * @param options - Options for the Kafka module
   * @returns Dynamic module
   */
  static register(options: KafkaModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useValue: options,
      },
      KafkaService,
    ];

    return {
      module: KafkaModule,
      global: options.isGlobal ?? false,
      providers,
      exports: [KafkaService],
    };
  }

  /**
   * Register the Kafka module with async options.
   * 
   * @param options - Async options for the Kafka module
   * @returns Dynamic module
   */
  static registerAsync(options: KafkaModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      KafkaService,
    ];

    return {
      module: KafkaModule,
      global: options.isGlobal ?? false,
      imports: [ConfigModule],
      providers,
      exports: [KafkaService],
    };
  }

  /**
   * Register the Kafka module globally with static options.
   * 
   * @param options - Options for the Kafka module
   * @returns Dynamic module
   */
  static registerGlobal(options: KafkaModuleOptions = {}): DynamicModule {
    return this.register({ ...options, isGlobal: true });
  }

  /**
   * Register the Kafka module globally with async options.
   * 
   * @param options - Async options for the Kafka module
   * @returns Dynamic module
   */
  static registerAsyncGlobal(options: KafkaModuleAsyncOptions): DynamicModule {
    return this.registerAsync({ ...options, isGlobal: true });
  }
}