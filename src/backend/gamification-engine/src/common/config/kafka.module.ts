import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { kafkaConfig } from './kafka.config';
import { DeadLetterQueueHandler } from './kafka.dlq';
import { RetryHandler } from './kafka.retry';

/**
 * Options for configuring the KafkaModule
 */
export interface KafkaModuleOptions {
  /** Whether to register the module globally */
  isGlobal?: boolean;
  /** Service name to use for Kafka clients */
  serviceName?: string;
}

/**
 * Module for Kafka integration with the Gamification Engine
 * Provides configuration, retry strategies, and dead letter queue handling
 */
@Module({
  imports: [ConfigModule],
})
export class KafkaModule {
  /**
   * Registers the KafkaModule with the provided options
   * 
   * @param options Module configuration options
   * @returns Dynamic module configuration
   */
  static register(options: KafkaModuleOptions = {}): DynamicModule {
    const kafkaClientProvider: Provider = {
      provide: 'KAFKA_CLIENT',
      useFactory: (configService: ConfigService) => {
        const config = configService.get('kafka');
        return new Kafka({
          clientId: config.clientId,
          brokers: config.brokers,
          ...(config.client || {}),
        });
      },
      inject: [ConfigService],
    };
    
    const deadLetterQueueProvider: Provider = {
      provide: DeadLetterQueueHandler,
      useFactory: (kafkaClient: Kafka) => {
        return new DeadLetterQueueHandler(kafkaClient, options.serviceName);
      },
      inject: ['KAFKA_CLIENT'],
    };
    
    const retryHandlerProvider: Provider = {
      provide: RetryHandler,
      useFactory: (kafkaClient: Kafka) => {
        return new RetryHandler(kafkaClient, options.serviceName);
      },
      inject: ['KAFKA_CLIENT'],
    };
    
    return {
      module: KafkaModule,
      imports: [
        ConfigModule.forFeature(kafkaConfig),
      ],
      providers: [
        kafkaClientProvider,
        deadLetterQueueProvider,
        retryHandlerProvider,
      ],
      exports: [
        'KAFKA_CLIENT',
        DeadLetterQueueHandler,
        RetryHandler,
      ],
      global: options.isGlobal || false,
    };
  }
}