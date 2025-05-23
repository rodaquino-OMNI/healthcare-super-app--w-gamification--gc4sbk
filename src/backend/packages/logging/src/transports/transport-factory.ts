import { Injectable } from '@nestjs/common';

/**
 * Transport types supported by the logging system
 */
export enum TransportType {
  CONSOLE = 'console',
  FILE = 'file',
  CLOUDWATCH = 'cloudwatch',
}

/**
 * Base configuration for all transports
 */
export interface TransportConfig {
  type: TransportType;
  level?: string;
  enabled?: boolean;
  formatter?: string;
}

/**
 * Console transport specific configuration
 */
export interface ConsoleTransportConfig extends TransportConfig {
  type: TransportType.CONSOLE;
  colorize?: boolean;
  prettyPrint?: boolean;
}

/**
 * File transport specific configuration
 */
export interface FileTransportConfig extends TransportConfig {
  type: TransportType.FILE;
  filename: string;
  dirname?: string;
  maxSize?: string;
  maxFiles?: number;
  compress?: boolean;
}

/**
 * CloudWatch transport specific configuration
 */
export interface CloudWatchTransportConfig extends TransportConfig {
  type: TransportType.CLOUDWATCH;
  logGroupName: string;
  logStreamName: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  retentionInDays?: number;
  batchSize?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Union type for all transport configurations
 */
export type AnyTransportConfig = ConsoleTransportConfig | FileTransportConfig | CloudWatchTransportConfig;

/**
 * Interface for the Transport implementations
 */
export interface Transport {
  /**
   * Initialize the transport
   */
  initialize(): Promise<void>;
  
  /**
   * Write a log entry to the transport
   * @param entry The formatted log entry to write
   */
  write(entry: any): Promise<void>;
  
  /**
   * Close the transport and clean up resources
   */
  close(): Promise<void>;
}

/**
 * Interface for the Formatter implementations
 */
export interface Formatter {
  /**
   * Format a log entry
   * @param entry The log entry to format
   */
  format(entry: any): any;
}

/**
 * Factory for creating transport instances based on configuration
 */
@Injectable()
export class TransportFactory {
  /**
   * Create transport instances based on configuration
   * @param configs Array of transport configurations
   * @param formatters Map of formatter instances by name
   * @returns Array of initialized transport instances
   */
  async createTransports(configs: AnyTransportConfig[], formatters: Map<string, Formatter>): Promise<Transport[]> {
    if (!configs || !Array.isArray(configs) || configs.length === 0) {
      throw new Error('Invalid transport configuration: configs must be a non-empty array');
    }

    if (!formatters || !(formatters instanceof Map) || formatters.size === 0) {
      throw new Error('Invalid formatters: formatters must be a non-empty Map');
    }

    const transports: Transport[] = [];

    for (const config of configs) {
      try {
        // Skip disabled transports
        if (config.enabled === false) {
          continue;
        }

        const transport = await this.createTransport(config, formatters);
        if (transport) {
          await transport.initialize();
          transports.push(transport);
        }
      } catch (error) {
        console.error(`Failed to create transport: ${error.message}`);
        // Continue with other transports if one fails
      }
    }

    if (transports.length === 0) {
      throw new Error('No valid transports could be created from the provided configuration');
    }

    return transports;
  }

  /**
   * Create a single transport instance based on configuration
   * @param config Transport configuration
   * @param formatters Map of formatter instances by name
   * @returns Transport instance
   */
  private async createTransport(config: AnyTransportConfig, formatters: Map<string, Formatter>): Promise<Transport> {
    this.validateTransportConfig(config);

    // Get the formatter for this transport
    const formatter = this.getFormatter(config, formatters);

    switch (config.type) {
      case TransportType.CONSOLE:
        return this.createConsoleTransport(config as ConsoleTransportConfig, formatter);
      case TransportType.FILE:
        return this.createFileTransport(config as FileTransportConfig, formatter);
      case TransportType.CLOUDWATCH:
        return this.createCloudWatchTransport(config as CloudWatchTransportConfig, formatter);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  /**
   * Validate transport configuration
   * @param config Transport configuration to validate
   */
  private validateTransportConfig(config: AnyTransportConfig): void {
    if (!config) {
      throw new Error('Transport configuration cannot be null or undefined');
    }

    if (!config.type) {
      throw new Error('Transport configuration must specify a type');
    }

    // Validate type-specific configuration
    switch (config.type) {
      case TransportType.FILE:
        this.validateFileTransportConfig(config as FileTransportConfig);
        break;
      case TransportType.CLOUDWATCH:
        this.validateCloudWatchTransportConfig(config as CloudWatchTransportConfig);
        break;
      case TransportType.CONSOLE:
        // No specific validation needed for console transport
        break;
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  /**
   * Validate file transport configuration
   * @param config File transport configuration to validate
   */
  private validateFileTransportConfig(config: FileTransportConfig): void {
    if (!config.filename) {
      throw new Error('File transport configuration must specify a filename');
    }
  }

  /**
   * Validate CloudWatch transport configuration
   * @param config CloudWatch transport configuration to validate
   */
  private validateCloudWatchTransportConfig(config: CloudWatchTransportConfig): void {
    if (!config.logGroupName) {
      throw new Error('CloudWatch transport configuration must specify a logGroupName');
    }

    if (!config.logStreamName) {
      throw new Error('CloudWatch transport configuration must specify a logStreamName');
    }
  }

  /**
   * Get the formatter for a transport
   * @param config Transport configuration
   * @param formatters Map of formatter instances by name
   * @returns Formatter instance
   */
  private getFormatter(config: AnyTransportConfig, formatters: Map<string, Formatter>): Formatter {
    // Default formatter based on transport type
    let formatterName = 'json';

    // Use console-specific formatter for console transport in development
    if (config.type === TransportType.CONSOLE && process.env.NODE_ENV !== 'production') {
      formatterName = 'text';
    }

    // Use CloudWatch-specific formatter for CloudWatch transport
    if (config.type === TransportType.CLOUDWATCH) {
      formatterName = 'cloudwatch';
    }

    // Override with configured formatter if specified
    if (config.formatter) {
      formatterName = config.formatter;
    }

    const formatter = formatters.get(formatterName);
    if (!formatter) {
      throw new Error(`Formatter not found: ${formatterName}`);
    }

    return formatter;
  }

  /**
   * Create a console transport
   * @param config Console transport configuration
   * @param formatter Formatter instance
   * @returns Console transport instance
   */
  private async createConsoleTransport(config: ConsoleTransportConfig, formatter: Formatter): Promise<Transport> {
    // Dynamically import the console transport to avoid circular dependencies
    const { ConsoleTransport } = await import('./console.transport');
    return new ConsoleTransport(config, formatter);
  }

  /**
   * Create a file transport
   * @param config File transport configuration
   * @param formatter Formatter instance
   * @returns File transport instance
   */
  private async createFileTransport(config: FileTransportConfig, formatter: Formatter): Promise<Transport> {
    // Dynamically import the file transport to avoid circular dependencies
    const { FileTransport } = await import('./file.transport');
    return new FileTransport(config, formatter);
  }

  /**
   * Create a CloudWatch transport
   * @param config CloudWatch transport configuration
   * @param formatter Formatter instance
   * @returns CloudWatch transport instance
   */
  private async createCloudWatchTransport(config: CloudWatchTransportConfig, formatter: Formatter): Promise<Transport> {
    // Dynamically import the CloudWatch transport to avoid circular dependencies
    const { CloudWatchTransport } = await import('./cloudwatch.transport');
    return new CloudWatchTransport(config, formatter);
  }

  /**
   * Create environment-specific transport configurations
   * @param env Environment name (development, test, production)
   * @param serviceName Name of the service for logging context
   * @returns Array of transport configurations
   */
  static createDefaultTransportConfigs(env: string, serviceName: string): AnyTransportConfig[] {
    const configs: AnyTransportConfig[] = [];

    // Console transport for all environments
    configs.push({
      type: TransportType.CONSOLE,
      enabled: true,
      colorize: env !== 'production',
      prettyPrint: env !== 'production',
      formatter: env === 'production' ? 'json' : 'text',
    });

    // File transport for all environments
    configs.push({
      type: TransportType.FILE,
      enabled: true,
      filename: `${serviceName}.log`,
      dirname: 'logs',
      maxSize: '10m',
      maxFiles: 5,
      compress: true,
      formatter: 'json',
    });

    // CloudWatch transport only for production
    if (env === 'production') {
      configs.push({
        type: TransportType.CLOUDWATCH,
        enabled: true,
        logGroupName: `/austa/${serviceName}`,
        logStreamName: `${serviceName}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        retentionInDays: 30,
        batchSize: 100,
        retryCount: 3,
        retryDelay: 1000,
        formatter: 'cloudwatch',
      });
    }

    return configs;
  }
}