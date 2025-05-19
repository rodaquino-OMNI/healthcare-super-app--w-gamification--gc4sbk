import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { LogEntry } from '../interfaces/log-entry.interface';
import { Transport } from '../interfaces/transport.interface';
import { CloudWatchFormatter } from '../formatters/cloudwatch.formatter';

/**
 * Configuration options for the CloudWatch transport
 */
export interface CloudWatchTransportOptions {
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
   */
  logStreamName: string;

  /**
   * Whether to create the log group if it doesn't exist (default: true)
   */
  createLogGroup?: boolean;

  /**
   * Whether to create the log stream if it doesn't exist (default: true)
   */
  createLogStream?: boolean;

  /**
   * Log retention in days (default: 30)
   */
  retentionInDays?: number;

  /**
   * Maximum batch size in bytes (default: 1048576, max: 1048576)
   */
  maxBatchSize?: number;

  /**
   * Maximum number of log events in a batch (default: 10000, max: 10000)
   */
  maxBatchCount?: number;

  /**
   * Batch sending interval in milliseconds (default: 1000)
   */
  batchInterval?: number;

  /**
   * Maximum number of retries for failed requests (default: 3)
   */
  maxRetries?: number;

  /**
   * Base delay for exponential backoff in milliseconds (default: 100)
   */
  retryBaseDelay?: number;
}

/**
 * CloudWatch transport for sending logs to AWS CloudWatch Logs
 * 
 * This transport sends log entries to AWS CloudWatch Logs, providing centralized
 * log aggregation for production environments. It includes features like log group/stream
 * management, batching for performance, and retry logic for network issues.
 */
export class CloudWatchTransport implements Transport {
  private client: CloudWatchLogsClient;
  private formatter: CloudWatchFormatter;
  private options: Required<CloudWatchTransportOptions>;
  private logQueue: { entry: LogEntry; formatted: string }[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private initializing = false;

  /**
   * Creates a new CloudWatch transport
   * 
   * @param options Configuration options for the CloudWatch transport
   */
  constructor(options: CloudWatchTransportOptions) {
    this.options = {
      region: options.region,
      credentials: options.credentials,
      logGroupName: options.logGroupName,
      logStreamName: options.logStreamName,
      createLogGroup: options.createLogGroup ?? true,
      createLogStream: options.createLogStream ?? true,
      retentionInDays: options.retentionInDays ?? 30,
      maxBatchSize: Math.min(options.maxBatchSize ?? 1048576, 1048576), // Max 1MB
      maxBatchCount: Math.min(options.maxBatchCount ?? 10000, 10000), // Max 10000 events
      batchInterval: options.batchInterval ?? 1000,
      maxRetries: options.maxRetries ?? 3,
      retryBaseDelay: options.retryBaseDelay ?? 100,
    } as Required<CloudWatchTransportOptions>;

    this.client = new CloudWatchLogsClient({
      region: this.options.region,
      credentials: this.options.credentials,
    });

    this.formatter = new CloudWatchFormatter();
  }

  /**
   * Initializes the CloudWatch transport by creating the log group and stream if needed
   */
  async initialize(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      // Create log group if it doesn't exist
      if (this.options.createLogGroup) {
        try {
          await this.client.send(
            new CreateLogGroupCommand({
              logGroupName: this.options.logGroupName,
            })
          );
        } catch (error) {
          // Ignore if the log group already exists
          if (error.name !== 'ResourceAlreadyExistsException') {
            throw error;
          }
        }
      }

      // Create log stream if it doesn't exist
      if (this.options.createLogStream) {
        try {
          await this.client.send(
            new CreateLogStreamCommand({
              logGroupName: this.options.logGroupName,
              logStreamName: this.options.logStreamName,
            })
          );
        } catch (error) {
          // Ignore if the log stream already exists
          if (error.name !== 'ResourceAlreadyExistsException') {
            throw error;
          }
        }
      }

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
   * 
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized && !this.initializing) {
      await this.initialize();
    }

    const formatted = this.formatter.format(entry);
    this.logQueue.push({ entry, formatted });

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.sendBatch(), this.options.batchInterval);
    }

    // Send batch immediately if we've reached the max batch size or count
    if (
      this.getQueueSizeInBytes() >= this.options.maxBatchSize ||
      this.logQueue.length >= this.options.maxBatchCount
    ) {
      this.sendBatch();
    }
  }

  /**
   * Calculates the current size of the log queue in bytes
   */
  private getQueueSizeInBytes(): number {
    return this.logQueue.reduce((size, item) => {
      // 26 bytes overhead per log event as per AWS docs
      return size + Buffer.byteLength(item.formatted, 'utf8') + 26;
    }, 0);
  }

  /**
   * Sends a batch of log entries to CloudWatch Logs
   */
  private async sendBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logQueue.length === 0) {
      return;
    }

    const batch = this.logQueue.splice(0, this.options.maxBatchCount);
    const logEvents = batch.map((item) => ({
      timestamp: item.entry.timestamp.getTime(),
      message: item.formatted,
    }));

    // Sort log events by timestamp as required by CloudWatch Logs
    logEvents.sort((a, b) => a.timestamp - b.timestamp);

    await this.sendWithRetry(logEvents);
  }

  /**
   * Sends log events to CloudWatch Logs with retry logic
   * 
   * @param logEvents The log events to send
   */
  private async sendWithRetry(logEvents: { timestamp: number; message: string }[]): Promise<void> {
    let retries = 0;

    while (true) {
      try {
        await this.client.send(
          new PutLogEventsCommand({
            logGroupName: this.options.logGroupName,
            logStreamName: this.options.logStreamName,
            logEvents,
          })
        );
        return;
      } catch (error) {
        if (retries >= this.options.maxRetries) {
          console.error('Failed to send logs to CloudWatch after maximum retries:', error);
          return;
        }

        // Exponential backoff with jitter
        const delay = this.options.retryBaseDelay * Math.pow(2, retries) * (0.5 + Math.random() * 0.5);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      }
    }
  }

  /**
   * Flushes any pending log entries and cleans up resources
   */
  async close(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Send any remaining logs in the queue
    if (this.logQueue.length > 0) {
      await this.sendBatch();
    }
  }
}