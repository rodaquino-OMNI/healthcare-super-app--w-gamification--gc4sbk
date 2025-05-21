import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerModule } from '@austa/logging';
import { KafkaModule } from '@austa/events/kafka';

import { QuestsConsumer } from './quests.consumer';
import { QuestsModule } from '../quests.module';

/**
 * Configuration options for the QuestsConsumersModule
 */
export interface QuestsConsumersModuleOptions {
  /**
   * Whether quest consumers are enabled
   * @default true
   */
  enabled: boolean;
}

/**
 * Module that registers all quest-related event consumers
 * with the NestJS dependency injection system.
 */
@Module({})
export class QuestsConsumersModule {
  /**
   * Creates a dynamically configured QuestsConsumersModule with the provided options
   * 
   * @param options - Configuration options for the module
   * @returns A dynamically configured module
   */
  static forRoot(options: QuestsConsumersModuleOptions): DynamicModule {
    return {
      module: QuestsConsumersModule,
      imports: [
        QuestsModule,
        KafkaModule,
        LoggerModule
      ],
      providers: [
        {
          provide: 'QUESTS_CONSUMERS_MODULE_OPTIONS',
          useValue: options,
        },
        ...(options.enabled ? [QuestsConsumer] : []),
      ],
      exports: [
        ...(options.enabled ? [QuestsConsumer] : []),
      ],
    };
  }
  
  /**
   * Creates a dynamically configured QuestsConsumersModule with options from a factory function
   * 
   * @param options - Factory for creating module options
   * @returns A dynamically configured module
   */
  static forRootAsync(options: {
    imports: any[];
    inject: any[];
    useFactory: (...args: any[]) => QuestsConsumersModuleOptions | Promise<QuestsConsumersModuleOptions>;
  }): DynamicModule {
    return {
      module: QuestsConsumersModule,
      imports: [
        QuestsModule,
        KafkaModule,
        LoggerModule,
        ...options.imports,
      ],
      providers: [
        {
          provide: 'QUESTS_CONSUMERS_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: QuestsConsumer,
          useFactory: (moduleOptions: QuestsConsumersModuleOptions) => {
            // Only create the consumer if enabled
            if (moduleOptions.enabled) {
              return new QuestsConsumer(
                /* Dependencies will be injected by NestJS */
              );
            }
            return null;
          },
          inject: ['QUESTS_CONSUMERS_MODULE_OPTIONS'],
        },
      ],
      exports: [
        QuestsConsumer,
      ],
    };
  }
}