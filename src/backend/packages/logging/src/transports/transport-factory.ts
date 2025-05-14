import { Injectable } from '@nestjs/common';
import { Transport } from '../interfaces/transport.interface';
import { LoggerConfig, TransportConfig, TransportType } from '../interfaces/log-config.interface';
import { ConsoleTransport } from './console.transport';
import { FileTransport } from './file.transport';
import { CloudWatchTransport } from './cloudwatch.transport';

/**
 * Factory class responsible for creating and configuring transport instances
 * based on application configuration.
 * 
 * This factory handles the creation of multiple transports, configuration validation,
 * and proper initialization of each transport based on the environment and settings.
 */
@Injectable()
export class TransportFactory {
  /**
   * Creates transport instances based on the provided logger configuration.
   * 
   * @param config The logger configuration containing transport settings
   * @returns An array of initialized transport instances
   * @throws Error if transport configuration is invalid
   */
  createTransports(config: LoggerConfig): Transport[] {
    if (!config.transports || config.transports.length === 0) {
      // Default to console transport if none specified
      return [this.createConsoleTransport({ type: TransportType.CONSOLE })]; 
    }

    return config.transports
      .map(transportConfig => this.createTransport(transportConfig))
      .filter(Boolean) as Transport[];
  }

  /**
   * Creates a single transport instance based on the provided transport configuration.
   * 
   * @param transportConfig The configuration for the transport
   * @returns A transport instance or null if creation failed
   */
  private createTransport(transportConfig: TransportConfig): Transport | null {
    try {
      this.validateTransportConfig(transportConfig);

      switch (transportConfig.type) {
        case TransportType.CONSOLE:
          return this.createConsoleTransport(transportConfig);
        case TransportType.FILE:
          return this.createFileTransport(transportConfig);
        case TransportType.CLOUDWATCH:
          return this.createCloudWatchTransport(transportConfig);
        default:
          throw new Error(`Unsupported transport type: ${transportConfig.type}`);
      }
    } catch (error) {
      console.error(`Failed to create transport: ${error.message}`);
      // Return null instead of throwing to allow other transports to be created
      return null;
    }
  }

  /**
   * Validates the transport configuration for required fields and valid values.
   * 
   * @param config The transport configuration to validate
   * @throws Error if the configuration is invalid
   */
  private validateTransportConfig(config: TransportConfig): void {
    if (!config) {
      throw new Error('Transport configuration is required');
    }

    if (!config.type) {
      throw new Error('Transport type is required');
    }

    // Validate specific transport configurations
    switch (config.type) {
      case TransportType.FILE:
        if (!config.filename) {
          throw new Error('Filename is required for file transport');
        }
        break;
      case TransportType.CLOUDWATCH:
        if (!config.logGroupName) {
          throw new Error('Log group name is required for CloudWatch transport');
        }
        break;
    }
  }

  /**
   * Creates a console transport instance with the provided configuration.
   * 
   * @param config The console transport configuration
   * @returns A configured console transport instance
   */
  private createConsoleTransport(config: TransportConfig): ConsoleTransport {
    return new ConsoleTransport(config);
  }

  /**
   * Creates a file transport instance with the provided configuration.
   * 
   * @param config The file transport configuration
   * @returns A configured file transport instance
   */
  private createFileTransport(config: TransportConfig): FileTransport {
    return new FileTransport(config);
  }

  /**
   * Creates a CloudWatch transport instance with the provided configuration.
   * 
   * @param config The CloudWatch transport configuration
   * @returns A configured CloudWatch transport instance
   */
  private createCloudWatchTransport(config: TransportConfig): CloudWatchTransport {
    return new CloudWatchTransport(config);
  }

  /**
   * Creates environment-specific transport configurations based on the current
   * environment and application needs.
   * 
   * @param env The current environment (development, staging, production)
   * @param appName The name of the application or service
   * @returns An array of transport configurations suitable for the environment
   */
  createEnvironmentTransports(env: string, appName: string): TransportConfig[] {
    const transports: TransportConfig[] = [];
    
    // Always add console transport in development
    if (env === 'development') {
      transports.push({
        type: TransportType.CONSOLE,
        level: 'debug',
        colorize: true,
      });
    }

    // Add file transport in development and staging
    if (env === 'development' || env === 'staging') {
      transports.push({
        type: TransportType.FILE,
        level: 'debug',
        filename: `logs/${appName}.log`,
        maxSize: '10m',
        maxFiles: 5,
        compress: true,
      });
    }

    // Add CloudWatch transport in staging and production
    if (env === 'staging' || env === 'production') {
      transports.push({
        type: TransportType.CLOUDWATCH,
        level: env === 'production' ? 'info' : 'debug',
        logGroupName: `/austa/${env}/${appName}`,
        logStreamName: `${appName}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        retentionDays: env === 'production' ? 90 : 30,
        batchSize: 20,
        maxRetries: 3,
      });
    }

    return transports;
  }
}