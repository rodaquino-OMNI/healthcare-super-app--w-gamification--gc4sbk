import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { LogEntry } from '../interfaces/log-entry.interface';
import { Transport } from '../interfaces/transport.interface';

/**
 * Configuration options for the CloudWatch transport
 */
export interface CloudWatchTransportConfig {
  /**
   * AWS region for CloudWatch Logs
   */
  region: string;

  /**
   * AWS credentials (optional, will use default credentials provider chain if not provided)
   */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };

  /**
   * Log group name
   */
  logGroupName: string;

  /**
   * Log stream name
   * If not provided, will use a default stream name based on the service name and environment
   */
  logStreamName?: string;

  /**
   * Log retention in days
   * @default 14
   */
  retentionInDays?: number;

  /**
   * Maximum batch size for sending logs to CloudWatch
   * @default 10000
   */
  batchSize?: number;

  /**
   * Maximum interval in milliseconds to wait before sending a batch
   * @default 1000
   */
  batchInterval?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for retry backoff
   * @default 100
   */
  retryBaseDelay?: number;

  /**
   * Service name to include in the log stream name
   */
  serviceName?: string;

  /**
   * Environment name to include in the log stream name
   */
  environment?: string;
}

/**
 * CloudWatch transport for sending logs to AWS CloudWatch Logs
 * 
 * This transport provides centralized log aggregation for production environments
 * with features like log group/stream management, batching for performance,
 * and retry logic for network issues.
 */
export class CloudWatchTransport implements Transport {
  private client: CloudWatchLogsClient;
  private config: CloudWatchTransportConfig;
  private logStreamName: string;
  private logGroupName: string;
  private logBatch: { timestamp: number; message: string }[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private initializing = false;

  /**
   * Creates a new CloudWatch transport
   * @param config Configuration options for the CloudWatch transport
   */
  constructor(config: CloudWatchTransportConfig) {
    this.config = {
      batchSize: 10000,
      batchInterval: 1000,
      maxRetries: 3,
      retryBaseDelay: 100,
      retentionInDays: 14,
      ...config,
    };

    this.logGroupName = this.config.logGroupName;
    this.logStreamName = this.config.logStreamName || this.generateLogStreamName();

    this.client = new CloudWatchLogsClient({
      region: this.config.region,
      credentials: this.config.credentials,
    });
  }

  /**
   * Initializes the CloudWatch transport by ensuring the log group and stream exist
   */
  async initialize(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      // Ensure log group exists
      await this.createLogGroupIfNotExists();

      // Ensure log stream exists
      await this.createLogStreamIfNotExists();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize CloudWatch transport:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Writes a log entry to CloudWatch Logs
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Add the log entry to the batch
    this.logBatch.push({
      timestamp: entry.timestamp.getTime(),
      message: JSON.stringify(entry),
    });

    // If we've reached the batch size, send the batch immediately
    if (this.logBatch.length >= this.config.batchSize!) {
      await this.flushBatch();
      return;
    }

    // Otherwise, set a timer to send the batch after the batch interval
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.config.batchInterval!);
    }
  }

  /**
   * Flushes the current batch of log entries to CloudWatch Logs
   */
  private async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logBatch.length === 0) {
      return;
    }

    const batch = [...this.logBatch];
    this.logBatch = [];

    await this.sendLogsWithRetry(batch);
  }

  /**
   * Sends logs to CloudWatch with retry logic
   * @param logEvents The log events to send
   */
  private async sendLogsWithRetry(logEvents: { timestamp: number; message: string }[]): Promise<void> {
    let retries = 0;

    while (retries <= this.config.maxRetries!) {
      try {
        const command = new PutLogEventsCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents: logEvents.sort((a, b) => a.timestamp - b.timestamp), // Ensure logs are in chronological order
        });

        await this.client.send(command);
        return;
      } catch (error) {
        retries++;

        // If we've reached the maximum number of retries, give up
        if (retries > this.config.maxRetries!) {
          console.error('Failed to send logs to CloudWatch after maximum retries:', error);
          throw error;
        }

        // Otherwise, wait and retry with exponential backoff
        const delay = this.config.retryBaseDelay! * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Creates the log group if it doesn't exist
   */
  private async createLogGroupIfNotExists(): Promise<void> {
    try {
      const command = new CreateLogGroupCommand({
        logGroupName: this.logGroupName,
      });

      await this.client.send(command);
    } catch (error: any) {
      // Ignore if the log group already exists
      if (error.name === 'ResourceAlreadyExistsException') {
        return;
      }

      throw error;
    }
  }

  /**
   * Creates the log stream if it doesn't exist
   */
  private async createLogStreamIfNotExists(): Promise<void> {
    try {
      // Check if the log stream exists
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: this.logGroupName,
        logStreamNamePrefix: this.logStreamName,
      });

      const response = await this.client.send(describeCommand);
      const streamExists = response.logStreams?.some(stream => stream.logStreamName === this.logStreamName);

      if (!streamExists) {
        const command = new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        });

        await this.client.send(command);
      }
    } catch (error) {
      // If the error is not related to the log stream not existing, rethrow it
      throw error;
    }
  }

  /**
   * Generates a default log stream name based on service name, environment, and date
   */
  private generateLogStreamName(): string {
    const serviceName = this.config.serviceName || 'austa-service';
    const environment = this.config.environment || 'production';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `${serviceName}-${environment}-${date}`;
  }

  /**
   * Closes the transport and flushes any pending logs
   */
  async close(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logBatch.length > 0) {
      await this.flushBatch();
    }
  }
}