/**
 * @file Kafka Module
 * @description Configurable NestJS module that registers and exports all Kafka-related services for dependency injection.
 * This module serves as the entry point for Kafka integration in any NestJS application within the AUSTA SuperApp,
 * providing connection management, event production, and consumption capabilities with consistent configuration and error handling.
 */

import { Module, DynamicModule, Global, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { KafkaService } from './kafka.service';
import { KafkaProducer } from './kafka.producer';
import { IKafkaModuleOptions, IKafkaModuleAsyncOptions, IKafkaConfig } from './kafka.interfaces';

/**
 * Kafka Module for event streaming and asynchronous communication.
 * 
 * This module provides Kafka integration for all journey services, enabling event-driven
 * architecture particularly for the gamification engine and notifications. It can be configured
 * either statically or asynchronously to support service-specific settings.
 * 
 * Key capabilities supported:
 * - Publishing events from all journey services to appropriate topics
 * - Consuming events for processing in the gamification engine
 * - Reliable message delivery with error handling and retries
 * - Distributed tracing of message flow for observability
 * - Journey-specific event processing and routing
 * - Dead letter queue handling for failed messages
 * 
 * @example
 * // Static configuration
 * imports: [
 *   KafkaModule.register({
 *     config: {
 *       brokers: ['kafka:9092'],
 *       clientId: 'health-service',
 *     },
 *     isGlobal: true,
 *   }),
 * ]
 * 
 * @example
 * // Async configuration with factory
 * imports: [
 *   KafkaModule.registerAsync({
 *     imports: [ConfigModule],
 *     useFactory: (configService: ConfigService) => ({
 *       config: {
 *         brokers: configService.get<string[]>('kafka.brokers'),
 *         clientId: configService.get<string>('kafka.clientId'),
 *       },
 *       isGlobal: true,
 *     }),
 *     inject: [ConfigService],
 *   }),
 * ]
 */
@Module({})
export class KafkaModule {
  /**
   * Register the Kafka module with static configuration
   * 
   * @param options Module configuration options
   * @returns Configured dynamic module
   * 
   * @example
   * KafkaModule.register({
   *   config: {
   *     brokers: ['kafka:9092'],
   *     clientId: 'health-service',
   *   },
   *   isGlobal: true,
   * })
   */
  static register(options: IKafkaModuleOptions): DynamicModule {
    const providers = KafkaModule.createProviders(options);

    return {
      module: KafkaModule,
      imports: [ConfigModule],
      providers,
      exports: providers,
      global: options.isGlobal !== false, // Default to global if not specified
    };
  }

  /**
   * Register the Kafka module with async configuration
   * 
   * @param options Async module configuration options
   * @returns Configured dynamic module
   * 
   * @example
   * KafkaModule.registerAsync({
   *   imports: [ConfigModule],
   *   useFactory: (configService: ConfigService) => ({
   *     config: {
   *       brokers: configService.get<string[]>('kafka.brokers'),
   *       clientId: configService.get<string>('kafka.clientId'),
   *     },
   *     isGlobal: true,
   *   }),
   *   inject: [ConfigService],
   * })
   */
  static registerAsync(options: IKafkaModuleAsyncOptions): DynamicModule {
    const providers = [
      ...this.createAsyncProviders(options),
      {
        provide: KafkaService,
        useFactory: (moduleOptions: IKafkaModuleOptions) => {
          return new KafkaService(moduleOptions.config);
        },
        inject: ['KAFKA_MODULE_OPTIONS'],
      },
      {
        provide: KafkaProducer,
        useFactory: (kafkaService: KafkaService) => {
          return new KafkaProducer(kafkaService.getClient(), kafkaService.getTracingService(), kafkaService.getLoggingService());
        },
        inject: [KafkaService],
      },
    ];

    return {
      module: KafkaModule,
      imports: options.imports || [ConfigModule],
      providers,
      exports: providers,
      global: options.isGlobal !== false, // Default to global if not specified
    };
  }

  /**
   * Create providers for static configuration
   * 
   * @param options Module configuration options
   * @returns Array of providers
   * @private
   */
  private static createProviders(options: IKafkaModuleOptions): Provider[] {
    return [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useValue: options,
      },
      {
        provide: KafkaService,
        useFactory: () => {
          return new KafkaService(options.config);
        },
      },
      {
        provide: KafkaProducer,
        useFactory: (kafkaService: KafkaService) => {
          return new KafkaProducer(kafkaService.getClient(), kafkaService.getTracingService(), kafkaService.getLoggingService());
        },
        inject: [KafkaService],
      },
    ];
  }

  /**
   * Create providers for async configuration
   * 
   * @param options Async module configuration options
   * @returns Array of providers
   * @private
   */
  private static createAsyncProviders(options: IKafkaModuleAsyncOptions): Provider[] {
    return [
      {
        provide: 'KAFKA_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
    ];
  }

  /**
   * Create a module that is not registered globally for specialized use cases
   * 
   * @param options Module configuration options
   * @returns Configured dynamic module that is not global
   * 
   * @example
   * KafkaModule.forFeature({
   *   config: {
   *     brokers: ['kafka:9092'],
   *     clientId: 'specialized-client',
   *   },
   * })
   */
  static forFeature(options: Omit<IKafkaModuleOptions, 'isGlobal'>): DynamicModule {
    return this.register({ ...options, isGlobal: false });
  }

  /**
   * Create an async module that is not registered globally for specialized use cases
   * 
   * @param options Async module configuration options
   * @returns Configured dynamic module that is not global
   * 
   * @example
   * KafkaModule.forFeatureAsync({
   *   imports: [ConfigModule],
   *   useFactory: (configService: ConfigService) => ({
   *     config: {
   *       brokers: configService.get<string[]>('kafka.brokers'),
   *       clientId: 'specialized-client',
   *     },
   *   }),
   *   inject: [ConfigService],
   * })
   */
  static forFeatureAsync(options: Omit<IKafkaModuleAsyncOptions, 'isGlobal'>): DynamicModule {
    return this.registerAsync({ ...options, isGlobal: false });
  }
}