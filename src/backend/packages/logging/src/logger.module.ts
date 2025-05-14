import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerConfig } from './interfaces/log-config.interface';
import { TransportFactory } from './transports/transport-factory';
import { LogLevel } from './interfaces/log-level.enum';

/**
 * Configuration options for the LoggerModule
 */
export interface LoggerModuleOptions {
  /**
   * Default log level for all services
   * @default LogLevel.INFO
   */
  level?: LogLevel | string;

  /**
   * Journey-specific log levels
   */
  journeyLevels?: {
    health?: LogLevel | string;
    care?: LogLevel | string;
    plan?: LogLevel | string;
  };

  /**
   * Format of the logs
   * @default 'json' in production, 'text' in development
   */
  format?: 'json' | 'text' | 'cloudwatch';

  /**
   * Transport configuration for log output
   */
  transports?: {
    /**
     * Console transport configuration
     */
    console?: {
      enabled: boolean;
      level?: LogLevel | string;
    };

    /**
     * File transport configuration
     */
    file?: {
      enabled: boolean;
      path?: string;
      level?: LogLevel | string;
      maxSize?: string;
      maxFiles?: number;
      compress?: boolean;
    };

    /**
     * CloudWatch transport configuration
     */
    cloudwatch?: {
      enabled: boolean;
      logGroupName?: string;
      logStreamPrefix?: string;
      region?: string;
      level?: LogLevel | string;
      batchSize?: number;
      retryCount?: number;
      retryDelay?: number;
    };
  };

  /**
   * Default context values to include in all logs
   */
  defaultContext?: {
    /**
     * Application name
     */
    application?: string;

    /**
     * Service name
     */
    service?: string;

    /**
     * Environment (production, staging, development)
     */
    environment?: string;
  };

  /**
   * Tracing configuration
   */
  tracing?: {
    /**
     * Whether to enable trace correlation in logs
     * @default true
     */
    enabled?: boolean;
  };
}

/**
 * Global module that provides the LoggerService across the application.
 * This enables centralized logging with structured format and journey-specific context
 * throughout the AUSTA SuperApp backend services.
 *
 * The module supports various configuration options for log formats, transports,
 * and integration with the tracing system.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {
  /**
   * Register the LoggerModule with custom configuration options
   *
   * @param options Configuration options for the logger
   * @returns A DynamicModule with configured providers
   *
   * @example
   * ```typescript
   * // In your AppModule
   * @Module({
   *   imports: [
   *     LoggerModule.register({
   *       level: LogLevel.INFO,
   *       format: 'json',
   *       transports: {
   *         console: { enabled: true },
   *         cloudwatch: {
   *           enabled: true,
   *           logGroupName: 'austa-superapp',
   *           logStreamPrefix: 'api-gateway',
   *         },
   *       },
   *       defaultContext: {
   *         application: 'austa-superapp',
   *         service: 'api-gateway',
   *         environment: 'production',
   *       },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static register(options: LoggerModuleOptions = {}): DynamicModule {
    const loggerConfigProvider: Provider = {
      provide: 'LOGGER_CONFIG',
      useValue: this.createLoggerConfig(options),
    };

    const transportFactoryProvider: Provider = {
      provide: TransportFactory,
      useFactory: (config: LoggerConfig) => {
        return new TransportFactory(config);
      },
      inject: ['LOGGER_CONFIG'],
    };

    return {
      module: LoggerModule,
      providers: [
        loggerConfigProvider,
        transportFactoryProvider,
        {
          provide: LoggerService,
          useFactory: (config: LoggerConfig, transportFactory: TransportFactory) => {
            return new LoggerService(config, transportFactory);
          },
          inject: ['LOGGER_CONFIG', TransportFactory],
        },
      ],
      exports: [LoggerService],
    };
  }

  /**
   * Register the LoggerModule asynchronously, allowing for dependency injection
   * in the options factory method.
   *
   * @param options Async options for configuring the logger
   * @returns A DynamicModule with asynchronously configured providers
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
   *         format: configService.get('LOG_FORMAT'),
   *         transports: {
   *           cloudwatch: {
   *             enabled: configService.get('CLOUDWATCH_ENABLED') === 'true',
   *             logGroupName: configService.get('CLOUDWATCH_LOG_GROUP'),
   *             logStreamPrefix: configService.get('CLOUDWATCH_LOG_STREAM_PREFIX'),
   *           },
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
    useFactory: (...args: any[]) => LoggerModuleOptions | Promise<LoggerModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    const loggerConfigProvider: Provider = {
      provide: 'LOGGER_CONFIG',
      useFactory: async (...args: any[]) => {
        const moduleOptions = await options.useFactory(...args);
        return this.createLoggerConfig(moduleOptions);
      },
      inject: options.inject || [],
    };

    const transportFactoryProvider: Provider = {
      provide: TransportFactory,
      useFactory: (config: LoggerConfig) => {
        return new TransportFactory(config);
      },
      inject: ['LOGGER_CONFIG'],
    };

    return {
      module: LoggerModule,
      imports: options.imports || [],
      providers: [
        loggerConfigProvider,
        transportFactoryProvider,
        {
          provide: LoggerService,
          useFactory: (config: LoggerConfig, transportFactory: TransportFactory) => {
            return new LoggerService(config, transportFactory);
          },
          inject: ['LOGGER_CONFIG', TransportFactory],
        },
      ],
      exports: [LoggerService],
    };
  }

  /**
   * Creates a LoggerConfig object from the provided options
   *
   * @param options Module options provided by the user
   * @returns A complete LoggerConfig object with defaults applied
   * @private
   */
  private static createLoggerConfig(options: LoggerModuleOptions): LoggerConfig {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Default configuration
    const config: LoggerConfig = {
      level: options.level || (isDevelopment ? LogLevel.DEBUG : LogLevel.INFO),
      journeyLevels: options.journeyLevels || {},
      format: options.format || (isDevelopment ? 'text' : 'json'),
      transports: {
        console: {
          enabled: options.transports?.console?.enabled ?? true,
          level: options.transports?.console?.level,
        },
        file: {
          enabled: options.transports?.file?.enabled ?? isDevelopment,
          path: options.transports?.file?.path || 'logs/app.log',
          level: options.transports?.file?.level,
          maxSize: options.transports?.file?.maxSize || '10m',
          maxFiles: options.transports?.file?.maxFiles || 5,
          compress: options.transports?.file?.compress ?? true,
        },
        cloudwatch: {
          enabled: options.transports?.cloudwatch?.enabled ?? !isDevelopment,
          logGroupName: options.transports?.cloudwatch?.logGroupName || 'austa-superapp',
          logStreamPrefix: options.transports?.cloudwatch?.logStreamPrefix || '',
          region: options.transports?.cloudwatch?.region || process.env.AWS_REGION || 'us-east-1',
          level: options.transports?.cloudwatch?.level,
          batchSize: options.transports?.cloudwatch?.batchSize || 100,
          retryCount: options.transports?.cloudwatch?.retryCount || 3,
          retryDelay: options.transports?.cloudwatch?.retryDelay || 1000,
        },
      },
      defaultContext: {
        application: options.defaultContext?.application || 'austa-superapp',
        service: options.defaultContext?.service || process.env.SERVICE_NAME || 'unknown',
        environment: options.defaultContext?.environment || process.env.NODE_ENV || 'development',
      },
      tracing: {
        enabled: options.tracing?.enabled ?? true,
      },
    };

    return config;
  }
}