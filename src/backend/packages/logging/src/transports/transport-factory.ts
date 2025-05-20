import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Interfaces
import { Transport } from '../interfaces/transport.interface';
import { LoggerConfig, TransportConfig, TransportType } from '../interfaces/log-config.interface';
import { LogLevel } from '../interfaces/log-level.enum';
import { Formatter } from '../formatters/formatter.interface';

// Formatters
import { JsonFormatter } from '../formatters/json.formatter';
import { TextFormatter } from '../formatters/text.formatter';
import { CloudWatchFormatter } from '../formatters/cloudwatch.formatter';

// Transports
import { ConsoleTransport } from './console.transport';
import { FileTransport } from './file.transport';
import { CloudWatchTransport } from './cloudwatch.transport';

/**
 * Factory responsible for creating and configuring transport instances
 * based on application configuration.
 * 
 * This factory handles the creation of multiple transports, configuration validation,
 * and proper initialization with appropriate formatters.
 *
 * The factory supports three types of transports:
 * - Console: For local development and debugging
 * - File: For persistent local logging
 * - CloudWatch: For centralized log aggregation in AWS
 *
 * Each transport is configured with an appropriate formatter based on its type and configuration.
 */
@Injectable()
export class TransportFactory {
  private readonly logger = new Logger(TransportFactory.name);
  
  /**
   * Creates a new TransportFactory instance
   * 
   * @param configService - NestJS ConfigService for accessing environment variables
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates transport instances based on the provided logger configuration
   * 
   * @param config - The logger configuration containing transport settings
   * @returns An array of configured Transport instances
   * @throws Error if transport configuration is invalid
   */
  createTransports(config: LoggerConfig): Transport[] {
    if (!config.transports || config.transports.length === 0) {
      this.logger.warn('No transports specified in configuration, using default console transport');
      // Default to console transport if none specified
      return [this.createConsoleTransport({ type: TransportType.CONSOLE })]; 
    }

    const transports: Transport[] = [];
    
    for (const transportConfig of config.transports) {
      try {
        const transport = this.createTransport(transportConfig);
        transports.push(transport);
        this.logger.log(`Created ${transportConfig.type} transport successfully`);
      } catch (error) {
        // Log error but don't throw to prevent logger initialization failure
        this.logger.error(
          `Failed to create ${transportConfig.type} transport: ${error.message}`,
          error.stack
        );
        
        // If all transports fail, we need at least one fallback
        if (transports.length === 0 && config.transports.length === 1) {
          this.logger.warn('Creating fallback console transport to ensure logging continues');
          transports.push(this.createConsoleTransport({ type: TransportType.CONSOLE }));
        }
      }
    }
    
    return transports;
  }

  /**
   * Creates a specific transport based on its type
   * 
   * @param config - Configuration for the transport
   * @returns The configured transport instance
   * @throws Error if transport type is unsupported or configuration is invalid
   */
  private createTransport(config: TransportConfig): Transport {
    this.validateTransportConfig(config);

    // Apply environment-specific overrides
    const environmentAdjustedConfig = this.applyEnvironmentOverrides(config);
    
    switch (environmentAdjustedConfig.type) {
      case TransportType.CONSOLE:
        return this.createConsoleTransport(environmentAdjustedConfig);
      case TransportType.FILE:
        return this.createFileTransport(environmentAdjustedConfig);
      case TransportType.CLOUDWATCH:
        return this.createCloudWatchTransport(environmentAdjustedConfig);
      default:
        throw new Error(`Unsupported transport type: ${environmentAdjustedConfig.type}`);
    }
  }

  /**
   * Applies environment-specific overrides to transport configuration
   * 
   * @param config - The base transport configuration
   * @returns The adjusted configuration with environment overrides applied
   */
  private applyEnvironmentOverrides(config: TransportConfig): TransportConfig {
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    const adjustedConfig = { ...config };
    
    // Apply environment-specific adjustments
    switch (env) {
      case 'development':
        // In development, ensure console output is human-readable
        if (config.type === TransportType.CONSOLE && adjustedConfig.useJsonFormat === undefined) {
          adjustedConfig.useJsonFormat = false;
          adjustedConfig.colorize = true;
        }
        // Set more verbose logging in development
        if (!adjustedConfig.level) {
          adjustedConfig.level = LogLevel.DEBUG;
        }
        break;
        
      case 'production':
        // In production, ensure CloudWatch transport is properly configured
        if (config.type === TransportType.CLOUDWATCH) {
          // Use application name in log group if not specified
          if (!adjustedConfig.logGroupName) {
            const appName = this.configService.get<string>('APP_NAME') || 'austa-app';
            adjustedConfig.logGroupName = `/aws/austa/${appName}`;
          }
        }
        // Set appropriate log level for production
        if (!adjustedConfig.level) {
          adjustedConfig.level = LogLevel.INFO;
        }
        break;
        
      case 'test':
        // In test environment, disable certain transports
        if (config.type === TransportType.CLOUDWATCH) {
          // Override with console transport for testing
          return {
            type: TransportType.CONSOLE,
            level: LogLevel.ERROR, // Only log errors in tests
            useJsonFormat: false,
            colorize: true
          };
        }
        break;
    }
    
    return adjustedConfig;
  }

  /**
   * Validates transport configuration
   * 
   * @param config - The transport configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateTransportConfig(config: TransportConfig): void {
    if (!config) {
      throw new Error('Transport configuration is required');
    }

    if (!config.type) {
      throw new Error('Transport type is required');
    }

    // Validate log level if specified
    if (config.level !== undefined && !(config.level in LogLevel)) {
      throw new Error(`Invalid log level: ${config.level}`);
    }

    // Validate specific transport configurations
    switch (config.type) {
      case TransportType.FILE:
        if (!config.filename) {
          throw new Error('Filename is required for file transport');
        }
        if (config.maxSize && typeof config.maxSize === 'string') {
          // Validate maxSize format (e.g., '10m', '1g')
          if (!config.maxSize.match(/^\d+[kmg]$/i)) {
            throw new Error('Invalid maxSize format. Use format like "10m" or "1g"');
          }
        }
        if (config.maxFiles && typeof config.maxFiles === 'number' && config.maxFiles < 1) {
          throw new Error('maxFiles must be at least 1');
        }
        break;
        
      case TransportType.CLOUDWATCH:
        if (!config.logGroupName) {
          throw new Error('Log group name is required for CloudWatch transport');
        }
        if (config.batchSize && (typeof config.batchSize !== 'number' || config.batchSize < 1 || config.batchSize > 10000)) {
          throw new Error('batchSize must be between 1 and 10000');
        }
        if (config.retryCount && (typeof config.retryCount !== 'number' || config.retryCount < 0)) {
          throw new Error('retryCount must be a non-negative number');
        }
        break;
    }
  }

  /**
   * Creates a console transport instance
   * 
   * @param config - Console transport configuration
   * @returns Configured ConsoleTransport instance
   */
  private createConsoleTransport(config: TransportConfig): ConsoleTransport {
    const formatter = this.createFormatter(config);

    return new ConsoleTransport({
      formatter,
      colorize: config.colorize !== false, // Default to true if not specified
      level: config.level || LogLevel.INFO,
    });
  }

  /**
   * Creates a file transport instance
   * 
   * @param config - File transport configuration
   * @returns Configured FileTransport instance
   */
  private createFileTransport(config: TransportConfig): FileTransport {
    // File transport always uses JSON formatter for machine readability
    // Override any formatter setting for file transport
    const formatter = new JsonFormatter();

    return new FileTransport({
      formatter,
      filename: config.filename!,
      maxSize: config.maxSize || '10m',
      maxFiles: config.maxFiles || 5,
      compress: config.compress !== false, // Default to true if not specified
      level: config.level || LogLevel.INFO,
      // Add additional file transport options
      tailable: config.tailable !== false, // Default to true if not specified
      eol: config.eol || '\n',
      // Ensure directory exists
      createDirectory: config.createDirectory !== false, // Default to true if not specified
    });
  }

  /**
   * Creates a CloudWatch transport instance
   * 
   * @param config - CloudWatch transport configuration
   * @returns Configured CloudWatchTransport instance
   * @throws Error if required AWS configuration is missing
   */
  private createCloudWatchTransport(config: TransportConfig): CloudWatchTransport {
    // CloudWatch transport uses specialized CloudWatch formatter
    // Override any formatter setting for CloudWatch transport
    const formatter = new CloudWatchFormatter();

    // Get AWS region from environment if not specified in config
    const region = config.region || this.configService.get<string>('AWS_REGION');
    
    if (!region) {
      throw new Error('AWS region is required for CloudWatch transport');
    }

    // Get application environment for tagging
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    const appName = this.configService.get<string>('APP_NAME') || 'austa-app';
    
    // Create CloudWatch transport with proper configuration
    return new CloudWatchTransport({
      formatter,
      logGroupName: config.logGroupName!,
      logStreamName: config.logStreamName || this.getDefaultLogStreamName(),
      region,
      batchSize: config.batchSize || 1000,
      retryCount: config.retryCount || 3,
      level: config.level || LogLevel.INFO,
      awsAccessKeyId: config.awsAccessKeyId || this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      awsSecretAccessKey: config.awsSecretAccessKey || this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      // Add additional CloudWatch options
      tags: {
        Environment: env,
        Application: appName,
        Service: config.serviceName || this.configService.get<string>('SERVICE_NAME') || 'unknown',
        ...(config.tags || {})
      },
      // Configure retention policy based on environment
      retentionInDays: config.retentionInDays || this.getDefaultRetentionDays(env),
      // Add throttling protection
      throttleInterval: config.throttleInterval || 1000,
      // Add error handling options
      handleExceptions: config.handleExceptions !== false, // Default to true if not specified
    });
  }

  /**
   * Creates the appropriate formatter based on transport configuration
   * 
   * @param config - Transport configuration
   * @returns Configured formatter instance
   */
  private createFormatter(config: TransportConfig): Formatter {
    // Determine which formatter to use based on configuration
    if (config.type === TransportType.CLOUDWATCH) {
      // CloudWatch always uses CloudWatch formatter
      return new CloudWatchFormatter();
    }
    
    if (config.useJsonFormat) {
      return new JsonFormatter();
    }
    
    // Default to text formatter for human readability
    return new TextFormatter();
  }

  /**
   * Determines the default log retention period based on environment
   * 
   * @param env - The application environment
   * @returns The number of days to retain logs
   */
  private getDefaultRetentionDays(env: string): number {
    switch (env) {
      case 'production':
        return 90; // 90 days retention for production
      case 'staging':
        return 30; // 30 days retention for staging
      case 'development':
        return 7;  // 7 days retention for development
      default:
        return 1;  // 1 day retention for other environments
    }
  }

  /**
   * Generates a default log stream name based on environment and instance information
   * 
   * @returns Default log stream name
   */
  private getDefaultLogStreamName(): string {
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    const appName = this.configService.get<string>('APP_NAME') || 'austa-app';
    const instanceId = this.configService.get<string>('INSTANCE_ID') || 'default';
    const serviceName = this.configService.get<string>('SERVICE_NAME') || 'app';
    
    // Format: app-service-env-instance-date
    return `${appName}-${serviceName}-${env}-${instanceId}-${new Date().toISOString().split('T')[0]}`;
  }
}