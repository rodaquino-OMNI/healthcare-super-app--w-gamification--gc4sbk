import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerConfig } from './interfaces/log-config.interface';
import { TransportFactory } from './transports/transport-factory';
import { LogLevel } from './interfaces/log-level.enum';
import { ContextManager } from './context/context-manager';

/**
 * Configuration token for the LoggerModule
 * @internal
 */
export const LOGGER_CONFIG = Symbol('LOGGER_CONFIG');

/**
 * Options for configuring the LoggerModule asynchronously
 */
export interface LoggerModuleAsyncOptions {
  /**
   * List of modules to import
   */
  imports?: any[];
  /**
   * Factory function to create the logger configuration
   */
  useFactory: (...args: any[]) => Promise<LoggerConfig> | LoggerConfig;
  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
  /**
   * Optional class to use for configuration
   */
  useClass?: Type<LoggerConfigFactory>;
  /**
   * Optional existing provider to use for configuration
   */
  useExisting?: Type<LoggerConfigFactory>;
}

/**
 * Interface for classes that can create logger configuration
 */
export interface LoggerConfigFactory {
  createLoggerConfig(): Promise<LoggerConfig> | LoggerConfig;
}

/**
 * Global module that configures and exposes the enhanced LoggerService across all AUSTA SuperApp backend services.
 * This module handles dynamic configuration of log formats, transports, and integration with the tracing system.
 */
@Global()
@Module({})
export class LoggerModule {
  /**
   * Configure the LoggerModule with static options
   * @param config Configuration options for the logger
   * @returns Configured LoggerModule
   */
  static forRoot(config: LoggerConfig): DynamicModule {
    const loggerConfigProvider = {
      provide: LOGGER_CONFIG,
      useValue: config,
    };

    return {
      module: LoggerModule,
      providers: [loggerConfigProvider, LoggerService, TransportFactory, ContextManager],
      exports: [LoggerService],
    };
  }

  /**
   * Configure the LoggerModule with default options
   * @returns Configured LoggerModule with default settings
   */
  static forRootDefault(): DynamicModule {
    const defaultConfig: LoggerConfig = {
      level: LogLevel.INFO,
      format: 'json',
      transports: [{ type: 'console' }],
      includeTimestamp: true,
      traceEnabled: true,
    };

    return this.forRoot(defaultConfig);
  }

  /**
   * Configure the LoggerModule asynchronously
   * @param options Async options for configuring the logger
   * @returns Dynamically configured LoggerModule
   */
  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options);

    return {
      module: LoggerModule,
      imports: options.imports || [],
      providers: [...providers, LoggerService, TransportFactory, ContextManager],
      exports: [LoggerService],
    };
  }

  /**
   * Create providers for async configuration
   * @param options Async options for the logger module
   * @returns Array of providers for the module
   * @private
   */
  private static createAsyncProviders(options: LoggerModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  /**
   * Create the async options provider
   * @param options Async options for the logger module
   * @returns Provider for the logger configuration
   * @private
   */
  private static createAsyncOptionsProvider(options: LoggerModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: LOGGER_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: LOGGER_CONFIG,
      useFactory: async (optionsFactory: LoggerConfigFactory) =>
        await optionsFactory.createLoggerConfig(),
      inject: [options.useExisting || options.useClass],
    };
  }
}