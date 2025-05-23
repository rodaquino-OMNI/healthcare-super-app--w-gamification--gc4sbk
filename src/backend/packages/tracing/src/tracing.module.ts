import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TracingService } from './tracing.service';
import { LoggerModule } from '@austa/logging';
import { TracingOptions } from './interfaces/tracing-options.interface';

/**
 * Global module that provides distributed tracing capabilities across the AUSTA SuperApp.
 * 
 * This module integrates OpenTelemetry to enable end-to-end request tracing through all journey services,
 * supporting observability requirements for the application. The tracing functionality allows:
 * - Tracking requests as they flow through different microservices
 * - Measuring performance at different stages of request processing
 * - Identifying bottlenecks and errors in the request pipeline
 * - Correlating logs and traces for better debugging
 * - Supporting journey-specific context in traces (health, care, plan)
 * 
 * By marking this module as global, the TracingService is available for dependency injection
 * throughout the application without explicitly importing this module in each feature module.
 */
@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule {
  /**
   * Registers the TracingModule with custom options.
   * 
   * @param options - Configuration options for the tracing system
   * @returns A dynamically configured TracingModule
   */
  static register(options?: TracingOptions): DynamicModule {
    return {
      module: TracingModule,
      imports: [LoggerModule, ConfigModule],
      providers: [
        {
          provide: 'TRACING_OPTIONS',
          useValue: options || {},
        },
        TracingService,
      ],
      exports: [TracingService],
    };
  }

  /**
   * Registers the TracingModule with options loaded from configuration.
   * 
   * @param configKey - The configuration key to load options from
   * @returns A dynamically configured TracingModule
   */
  static registerAsync(configKey: string = 'tracing'): DynamicModule {
    return {
      module: TracingModule,
      imports: [LoggerModule, ConfigModule],
      providers: [
        {
          provide: 'TRACING_OPTIONS',
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return configService.get(configKey) || {};
          },
        },
        TracingService,
      ],
      exports: [TracingService],
    };
  }
}