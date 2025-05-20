import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { KafkaService } from './kafka.service';
import { EventSchemaRegistry } from '../schema/schema-registry.service';
import { KAFKA_MODULE_OPTIONS, EVENT_SCHEMA_REGISTRY } from '../constants/tokens.constants';
import { KafkaModuleOptions } from '../interfaces/kafka-options.interface';

/**
 * Module for Kafka integration in the AUSTA SuperApp.
 * 
 * This module provides the KafkaService for producing and consuming events,
 * with support for schema validation, dead-letter queues, and distributed tracing.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    TracingModule,
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {
  /**
   * Registers the KafkaModule with the provided options.
   * 
   * @param options - Configuration options for the Kafka module
   * @returns A dynamic module configuration
   */
  static register(options?: KafkaModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: KAFKA_MODULE_OPTIONS,
        useValue: options || {},
      },
    ];

    // Add schema registry if enabled
    if (options?.enableSchemaValidation) {
      providers.push({
        provide: EVENT_SCHEMA_REGISTRY,
        useClass: EventSchemaRegistry,
      });
    }

    return {
      module: KafkaModule,
      providers,
      exports: [KafkaService],
    };
  }

  /**
   * Registers the KafkaModule as a global module with the provided options.
   * 
   * @param options - Configuration options for the Kafka module
   * @returns A dynamic module configuration
   */
  static registerGlobal(options?: KafkaModuleOptions): DynamicModule {
    const module = this.register(options);
    return {
      ...module,
      global: true,
    };
  }

  /**
   * Registers the KafkaModule asynchronously with factory providers.
   * 
   * @param options - Async options for configuring the Kafka module
   * @returns A dynamic module configuration
   */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
    global?: boolean;
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: KAFKA_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
    ];

    // Add schema registry provider
    providers.push({
      provide: EVENT_SCHEMA_REGISTRY,
      useClass: EventSchemaRegistry,
    });

    return {
      module: KafkaModule,
      imports: options.imports || [],
      providers,
      exports: [KafkaService, EVENT_SCHEMA_REGISTRY],
      global: options.global,
    };
  }
}