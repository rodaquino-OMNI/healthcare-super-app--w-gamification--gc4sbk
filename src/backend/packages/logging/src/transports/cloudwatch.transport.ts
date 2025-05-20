import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
  InputLogEvent,
  ResourceNotFoundException,
  ThrottlingException,
  ServiceUnavailableException,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { Transport } from '../interfaces/transport.interface';
import { LogEntry } from '../formatters/formatter.interface';
import { CloudWatchFormatter } from '../formatters/cloudwatch.formatter';

/**
 * Configuration options for the CloudWatch transport
 */
export interface CloudWatchTransportConfig {
  /**
   * AWS region for CloudWatch Logs
   */
  region: string;

  /**
   * AWS credentials (optional if using environment variables or instance profiles)
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
   * Log stream name (defaults to a date-based stream name)
   */
  logStreamName?: string;

  /**
   * Whether to create the log group if it doesn't exist (defaults to true)
   */
  createLogGroup?: boolean;

  /**
   * Whether to create the log stream if it doesn't exist (defaults to true)
   */
  createLogStream?: boolean;

  /**
   * Log retention in days (if specified, sets the retention policy for the log group)
   */
  retentionInDays?: number;

  /**
   * Maximum batch size for sending logs (defaults to 10000, max allowed by AWS)
   */
  batchSize?: number;

  /**
   * Interval in milliseconds to flush the log batch (defaults to 1000ms)
   */
  flushInterval?: number;

  /**
   * Maximum number of retries for failed requests (defaults to 3)
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for exponential backoff (defaults to 100ms)
   */
  retryBaseDelay?: number;
}

/**
 * CloudWatch transport for sending logs to AWS CloudWatch Logs
 * 
 * This transport sends log entries to AWS CloudWatch Logs, providing centralized
 * log aggregation for production environments. It includes features like log group/stream
 * management, batching for performance, and retry logic for network issues.
 * 
 * Features:
 * - Automatic log group and stream creation
 * - Configurable log retention policies
 * - Batched log submission for better performance
 * - Exponential backoff retry logic for reliability
 * - Proper error handling for AWS connectivity issues
 * - Integration with CloudWatch-specific formatting
 * 
 * @example
 * ```typescript
 * const cloudwatchTransport = new CloudWatchTransport({
 *   region: 'us-east-1',
 *   logGroupName: 'austa-superapp-logs',
 *   logStreamName: 'api-gateway',
 *   retentionInDays: 30,
 * });
 * 
 * const logger = new Logger({
 *   transports: [cloudwatchTransport],
 *   level: LogLevel.INFO,
 * });
 * ```
 */
export class CloudWatchTransport implements Transport {
  private client: CloudWatchLogsClient;
  private config: CloudWatchTransportConfig;
  private formatter: CloudWatchFormatter;
  private logGroupExists: boolean = false;
  private logStreamExists: boolean = false;
  private sequenceToken: string | undefined;
  private logBatch: InputLogEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private shutdownRequested: boolean = false;

  /**
   * Creates a new CloudWatch transport instance
   * 
   * @param config Configuration options for the CloudWatch transport
   * @param formatter Optional CloudWatch formatter (will create one if not provided)
   */
  constructor(config: CloudWatchTransportConfig, formatter?: CloudWatchFormatter) {
    this.config = {
      createLogGroup: true,
      createLogStream: true,
      batchSize: 10000, // AWS maximum
      flushInterval: 1000,
      maxRetries: 3,
      retryBaseDelay: 100,
      ...config,
    };

    // If log stream name is not provided, create a date-based one
    if (!this.config.logStreamName) {
      const now = new Date();
      this.config.logStreamName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // Create AWS CloudWatch Logs client
    this.client = new CloudWatchLogsClient({
      region: this.config.region,
      credentials: this.config.credentials,
    });

    // Use provided formatter or create a new one
    this.formatter = formatter || new CloudWatchFormatter();
  }

  /**
   * Initializes the CloudWatch transport
   * Creates log group and stream if they don't exist and are configured to be created
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if log group exists
      if (this.config.createLogGroup) {
        await this.ensureLogGroupExists();
      }

      // Check if log stream exists
      if (this.config.createLogStream) {
        await this.ensureLogStreamExists();
      }

      // Start the flush timer
      this.startFlushTimer();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize CloudWatch transport:', error);
      throw error;
    }
  }

  /**
   * Writes a log entry to CloudWatch Logs
   * Formats the entry using the CloudWatch formatter and adds it to the batch queue
   * The entry will be sent to CloudWatch Logs on the next flush (either by timer or when batch size is reached)
   * 
   * @param entry The log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.shutdownRequested) {
      return;
    }

    try {
      // Format the log entry for CloudWatch
      const formattedEntry = this.formatter.format(entry);
      
      // Create the log event
      const logEvent: InputLogEvent = {
        timestamp: entry.timestamp?.getTime() || Date.now(),
        message: typeof formattedEntry === 'string' 
          ? formattedEntry 
          : JSON.stringify(formattedEntry),
      };

      // Add to batch
      this.logBatch.push(logEvent);

      // Flush if batch size exceeds the limit
      if (this.logBatch.length >= (this.config.batchSize || 10000)) {
        await this.flush();
      }
    } catch (error) {
      console.error('Error writing to CloudWatch Logs:', error);
    }
  }

  /**
   * Flushes the log batch to CloudWatch Logs
   * This method is called automatically by the flush timer or when the batch size is reached
   * It can also be called manually to force sending logs immediately
   */
  async flush(): Promise<void> {
    if (this.logBatch.length === 0 || this.shutdownRequested) {
      return;
    }

    // Sort log events by timestamp (required by CloudWatch)
    const batch = [...this.logBatch];
    batch.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // Clear the batch
    this.logBatch = [];

    // Send the batch to CloudWatch Logs with retries
    await this.sendBatchWithRetry(batch);
  }

  /**
   * Sends a batch of log events to CloudWatch Logs with retry logic
   * 
   * @param batch The batch of log events to send
   * @param retryCount Current retry count
   */
  private async sendBatchWithRetry(batch: InputLogEvent[], retryCount = 0): Promise<void> {
    if (this.shutdownRequested) {
      return;
    }

    try {
      // Ensure log group and stream exist
      if (!this.logGroupExists || !this.logStreamExists) {
        await this.initialize();
      }

      const command = new PutLogEventsCommand({
        logGroupName: this.config.logGroupName,
        logStreamName: this.config.logStreamName,
        logEvents: batch,
        sequenceToken: this.sequenceToken,
      });

      const response = await this.client.send(command);
      
      // Update sequence token for next batch
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      // Handle specific AWS errors
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ThrottlingException ||
        error instanceof ServiceUnavailableException
      ) {
        // If we've exceeded max retries, log and give up
        if (retryCount >= (this.config.maxRetries || 3)) {
          console.error(`Failed to send logs to CloudWatch after ${retryCount} retries:`, error);
          return;
        }

        // If log stream doesn't exist, recreate it
        if (error instanceof ResourceNotFoundException) {
          const errorMessage = (error as Error).message || '';
          
          if (errorMessage.includes('log group')) {
            this.logGroupExists = false;
            await this.ensureLogGroupExists();
          }
          
          if (errorMessage.includes('log stream')) {
            this.logStreamExists = false;
            await this.ensureLogStreamExists();
          }
        }

        // Extract sequence token from error message if available
        const errorMessage = (error as Error).message || '';
        const sequenceTokenMatch = errorMessage.match(/sequenceToken:\s*([^\s]+)/);
        if (sequenceTokenMatch && sequenceTokenMatch[1]) {
          this.sequenceToken = sequenceTokenMatch[1];
        }

        // Exponential backoff
        const delay = (this.config.retryBaseDelay || 100) * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry
        return this.sendBatchWithRetry(batch, retryCount + 1);
      } else {
        // For other errors, log and continue
        console.error('Error sending logs to CloudWatch:', error);
      }
    }
  }

  /**
   * Ensures the log group exists, creating it if necessary
   */
  private async ensureLogGroupExists(): Promise<void> {
    try {
      // Check if log group exists
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.config.logGroupName,
      });
      
      const response = await this.client.send(describeCommand);
      
      const logGroupExists = response.logGroups?.some(
        group => group.logGroupName === this.config.logGroupName
      );

      if (!logGroupExists) {
        if (this.config.createLogGroup) {
          // Create log group
          const createCommand = new CreateLogGroupCommand({
            logGroupName: this.config.logGroupName,
          });
          
          await this.client.send(createCommand);
          
          // Set retention policy if specified
          if (this.config.retentionInDays) {
            const retentionCommand = new PutRetentionPolicyCommand({
              logGroupName: this.config.logGroupName,
              retentionInDays: this.config.retentionInDays,
            });
            
            await this.client.send(retentionCommand);
          }
        } else {
          throw new Error(`Log group ${this.config.logGroupName} does not exist and createLogGroup is false`);
        }
      }

      this.logGroupExists = true;
    } catch (error) {
      console.error('Error ensuring log group exists:', error);
      throw error;
    }
  }

  /**
   * Ensures the log stream exists, creating it if necessary
   */
  private async ensureLogStreamExists(): Promise<void> {
    try {
      // Check if log stream exists
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: this.config.logGroupName,
        logStreamNamePrefix: this.config.logStreamName,
      });
      
      const response = await this.client.send(describeCommand);
      
      const logStream = response.logStreams?.find(
        stream => stream.logStreamName === this.config.logStreamName
      );

      if (logStream) {
        this.sequenceToken = logStream.uploadSequenceToken;
      } else if (this.config.createLogStream) {
        // Create log stream
        const createCommand = new CreateLogStreamCommand({
          logGroupName: this.config.logGroupName,
          logStreamName: this.config.logStreamName,
        });
        
        await this.client.send(createCommand);
      } else {
        throw new Error(`Log stream ${this.config.logStreamName} does not exist and createLogStream is false`);
      }

      this.logStreamExists = true;
    } catch (error) {
      console.error('Error ensuring log stream exists:', error);
      throw error;
    }
  }

  /**
   * Starts the flush timer to periodically flush logs
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Error flushing logs:', error);
      }
    }, this.config.flushInterval || 1000);
  }

  /**
   * Cleans up resources used by the transport
   * This method should be called when the application is shutting down
   * to ensure all logs are flushed and resources are released properly
   */
  async cleanup(): Promise<void> {
    this.shutdownRequested = true;
    
    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    try {
      await this.flush();
    } catch (error) {
      console.error('Error flushing logs during cleanup:', error);
    }
  }
}