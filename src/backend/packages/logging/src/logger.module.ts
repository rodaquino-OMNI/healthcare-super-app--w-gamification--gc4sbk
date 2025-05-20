import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerConfig } from './interfaces/log-config.interface';
import { TransportFactory } from './transports/transport-factory';

/**
 * Global module that provides the LoggerService across the application.
 * This enables centralized logging with structured format and journey-specific context
 * throughout the AUSTA SuperApp backend services.
 *
 * The module can be imported with custom configuration options to control log formats,
 * transports, and integration with the tracing system.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {
  /**
   * Register the LoggerModule with custom configuration options.
   * This allows services to customize their logging behavior while maintaining
   * a consistent structure across the application.
   *
   * @param config - Configuration options for the logger
   * @returns A dynamically configured LoggerModule
   *
   * @example
   * ```typescript
   * // In your AppModule
   * @Module({
   *   imports: [
   *     LoggerModule.register({
   *       level: LogLevel.INFO,
   *       transports: ['console', 'cloudwatch'],
   *       cloudwatch: {
   *         logGroupName: 'austa-superapp',
   *         logStreamName: 'api-gateway',
   *         region: 'us-east-1',
   *       },
   *       defaultContext: {
   *         service: 'api-gateway',
   *         journey: 'all',
   *       },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static register(config?: LoggerConfig): DynamicModule {
    const transportFactory = new TransportFactory(config);
    
    const loggerServiceProvider: Provider = {
      provide: LoggerService,
      useFactory: () => {
        const service = new LoggerService(config);
        service.setTransports(transportFactory.createTransports());
        return service;
      },
    };

    return {
      module: LoggerModule,
      providers: [transportFactory, loggerServiceProvider],
      exports: [LoggerService],
    };
  }

  /**
   * Register the LoggerModule with async configuration options.
   * This is useful when configuration needs to be loaded from external sources
   * like environment variables or configuration services.
   *
   * @param options - Async configuration options for the logger
   * @returns A dynamically configured LoggerModule
   *
   * @example
   * ```typescript
   * // In your AppModule
   * @Module({
   *   imports: [
   *     LoggerModule.registerAsync({
   *       imports: [ConfigModule],
   *       inject: [ConfigService],
   *       useFactory: (configService: ConfigService) => ({
   *         level: configService.get('LOG_LEVEL'),
   *         transports: configService.get('LOG_TRANSPORTS').split(','),
   *         cloudwatch: {
   *           logGroupName: configService.get('CLOUDWATCH_LOG_GROUP'),
   *           logStreamName: configService.get('CLOUDWATCH_LOG_STREAM'),
   *           region: configService.get('AWS_REGION'),
   *         },
   *         defaultContext: {
   *           service: configService.get('SERVICE_NAME'),
   *           journey: configService.get('JOURNEY_NAME'),
   *         },
   *       }),
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => LoggerConfig | Promise<LoggerConfig>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: LoggerModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'LOGGER_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: TransportFactory,
          useFactory: (config: LoggerConfig) => new TransportFactory(config),
          inject: ['LOGGER_CONFIG'],
        },
        {
          provide: LoggerService,
          useFactory: (config: LoggerConfig, transportFactory: TransportFactory) => {
            const service = new LoggerService(config);
            service.setTransports(transportFactory.createTransports());
            return service;
          },
          inject: ['LOGGER_CONFIG', TransportFactory],
        },
      ],
      exports: [LoggerService],
    };
  }

  /**
   * Register the LoggerModule with integration to the TracingModule.
   * This enables correlation between logs and traces for enhanced observability.
   *
   * @param config - Configuration options for the logger
   * @returns A dynamically configured LoggerModule with tracing integration
   *
   * @example
   * ```typescript
   * // In your AppModule
   * @Module({
   *   imports: [
   *     TracingModule.register(),
   *     LoggerModule.registerWithTracing({
   *       level: LogLevel.INFO,
   *       transports: ['console', 'cloudwatch'],
   *       includeTraceId: true,
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static registerWithTracing(config?: LoggerConfig): DynamicModule {
    const transportFactory = new TransportFactory(config);
    
    const loggerServiceProvider: Provider = {
      provide: LoggerService,
      useFactory: (tracingService: any) => {
        const service = new LoggerService({
          ...config,
          tracing: {
            enabled: true,
            service: tracingService,
          },
        });
        service.setTransports(transportFactory.createTransports());
        return service;
      },
      inject: ['TracingService'],
    };

    return {
      module: LoggerModule,
      providers: [transportFactory, loggerServiceProvider],
      exports: [LoggerService],
    };
  }
}