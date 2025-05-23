import { 
  CloudWatchLogsClient, 
  PutLogEventsCommand, 
  CreateLogGroupCommand, 
  CreateLogStreamCommand, 
  DescribeLogStreamsCommand,
  PutLogEventsCommandOutput,
  CreateLogGroupCommandOutput,
  CreateLogStreamCommandOutput,
  DescribeLogStreamsCommandOutput,
  LogStream
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * Mock implementation of AWS SDK CloudWatch Logs client for testing
 * 
 * This mock allows testing the CloudWatch transport without making real AWS API calls.
 * It tracks calls to createLogGroup, createLogStream, and putLogEvents, and can be
 * configured to return success or failure responses.
 */
export class MockCloudWatchLogsClient {
  /**
   * Tracks calls to createLogGroup
   */
  public createLogGroupCalls: CreateLogGroupCommand[] = [];
  
  /**
   * Tracks calls to createLogStream
   */
  public createLogStreamCalls: CreateLogStreamCommand[] = [];
  
  /**
   * Tracks calls to putLogEvents
   */
  public putLogEventsCalls: PutLogEventsCommand[] = [];
  
  /**
   * Tracks calls to describeLogStreams
   */
  public describeLogStreamsCalls: DescribeLogStreamsCommand[] = [];

  /**
   * Log groups that have been created
   */
  public logGroups: Set<string> = new Set();
  
  /**
   * Log streams that have been created, mapped by log group name
   */
  public logStreams: Map<string, Set<string>> = new Map();
  
  /**
   * Log events that have been sent, mapped by log group and stream name
   */
  public logEvents: Map<string, any[]> = new Map();

  /**
   * Flag to simulate errors for testing error handling
   */
  public shouldFail: boolean = false;
  
  /**
   * Specific operation to fail, if shouldFail is true
   * If undefined, all operations will fail
   */
  public failOperation?: 'createLogGroup' | 'createLogStream' | 'putLogEvents' | 'describeLogStreams';
  
  /**
   * Error to throw when shouldFail is true
   */
  public errorToThrow: Error = new Error('Simulated AWS SDK error');

  /**
   * Sends a command to the mock client
   * @param command The command to send
   * @returns The command output
   */
  async send(command: any): Promise<any> {
    if (command instanceof CreateLogGroupCommand) {
      return this.handleCreateLogGroup(command);
    } else if (command instanceof CreateLogStreamCommand) {
      return this.handleCreateLogStream(command);
    } else if (command instanceof PutLogEventsCommand) {
      return this.handlePutLogEvents(command);
    } else if (command instanceof DescribeLogStreamsCommand) {
      return this.handleDescribeLogStreams(command);
    }
    
    throw new Error(`Unsupported command: ${command.constructor.name}`);
  }

  /**
   * Handles a CreateLogGroupCommand
   * @param command The command to handle
   * @returns The command output
   */
  private handleCreateLogGroup(command: CreateLogGroupCommand): Promise<CreateLogGroupCommandOutput> {
    this.createLogGroupCalls.push(command);
    
    if (this.shouldFail && (!this.failOperation || this.failOperation === 'createLogGroup')) {
      return Promise.reject(this.errorToThrow);
    }
    
    const logGroupName = command.input.logGroupName!;
    
    if (this.logGroups.has(logGroupName)) {
      const error: any = new Error('Log group already exists');
      error.name = 'ResourceAlreadyExistsException';
      return Promise.reject(error);
    }
    
    this.logGroups.add(logGroupName);
    
    return Promise.resolve({
      $metadata: {
        httpStatusCode: 200,
        requestId: 'mock-request-id',
        attempts: 1,
        totalRetryDelay: 0
      }
    });
  }

  /**
   * Handles a CreateLogStreamCommand
   * @param command The command to handle
   * @returns The command output
   */
  private handleCreateLogStream(command: CreateLogStreamCommand): Promise<CreateLogStreamCommandOutput> {
    this.createLogStreamCalls.push(command);
    
    if (this.shouldFail && (!this.failOperation || this.failOperation === 'createLogStream')) {
      return Promise.reject(this.errorToThrow);
    }
    
    const logGroupName = command.input.logGroupName!;
    const logStreamName = command.input.logStreamName!;
    
    if (!this.logGroups.has(logGroupName)) {
      const error: any = new Error('Log group does not exist');
      error.name = 'ResourceNotFoundException';
      return Promise.reject(error);
    }
    
    if (!this.logStreams.has(logGroupName)) {
      this.logStreams.set(logGroupName, new Set());
    }
    
    const streams = this.logStreams.get(logGroupName)!;
    
    if (streams.has(logStreamName)) {
      const error: any = new Error('Log stream already exists');
      error.name = 'ResourceAlreadyExistsException';
      return Promise.reject(error);
    }
    
    streams.add(logStreamName);
    
    return Promise.resolve({
      $metadata: {
        httpStatusCode: 200,
        requestId: 'mock-request-id',
        attempts: 1,
        totalRetryDelay: 0
      }
    });
  }

  /**
   * Handles a PutLogEventsCommand
   * @param command The command to handle
   * @returns The command output
   */
  private handlePutLogEvents(command: PutLogEventsCommand): Promise<PutLogEventsCommandOutput> {
    this.putLogEventsCalls.push(command);
    
    if (this.shouldFail && (!this.failOperation || this.failOperation === 'putLogEvents')) {
      return Promise.reject(this.errorToThrow);
    }
    
    const logGroupName = command.input.logGroupName!;
    const logStreamName = command.input.logStreamName!;
    const logEvents = command.input.logEvents || [];
    
    if (!this.logGroups.has(logGroupName)) {
      const error: any = new Error('Log group does not exist');
      error.name = 'ResourceNotFoundException';
      return Promise.reject(error);
    }
    
    const streams = this.logStreams.get(logGroupName);
    if (!streams || !streams.has(logStreamName)) {
      const error: any = new Error('Log stream does not exist');
      error.name = 'ResourceNotFoundException';
      return Promise.reject(error);
    }
    
    const key = `${logGroupName}:${logStreamName}`;
    if (!this.logEvents.has(key)) {
      this.logEvents.set(key, []);
    }
    
    const events = this.logEvents.get(key)!;
    events.push(...logEvents);
    
    return Promise.resolve({
      $metadata: {
        httpStatusCode: 200,
        requestId: 'mock-request-id',
        attempts: 1,
        totalRetryDelay: 0
      },
      nextSequenceToken: 'mock-sequence-token'
    });
  }

  /**
   * Handles a DescribeLogStreamsCommand
   * @param command The command to handle
   * @returns The command output
   */
  private handleDescribeLogStreams(command: DescribeLogStreamsCommand): Promise<DescribeLogStreamsCommandOutput> {
    this.describeLogStreamsCalls.push(command);
    
    if (this.shouldFail && (!this.failOperation || this.failOperation === 'describeLogStreams')) {
      return Promise.reject(this.errorToThrow);
    }
    
    const logGroupName = command.input.logGroupName!;
    const logStreamNamePrefix = command.input.logStreamNamePrefix;
    
    if (!this.logGroups.has(logGroupName)) {
      const error: any = new Error('Log group does not exist');
      error.name = 'ResourceNotFoundException';
      return Promise.reject(error);
    }
    
    const streams = this.logStreams.get(logGroupName) || new Set();
    let logStreamsList: LogStream[] = [];
    
    streams.forEach(streamName => {
      if (!logStreamNamePrefix || streamName.startsWith(logStreamNamePrefix)) {
        logStreamsList.push({
          logStreamName: streamName,
          creationTime: Date.now(),
          arn: `arn:aws:logs:us-east-1:123456789012:log-group:${logGroupName}:log-stream:${streamName}`
        });
      }
    });
    
    return Promise.resolve({
      $metadata: {
        httpStatusCode: 200,
        requestId: 'mock-request-id',
        attempts: 1,
        totalRetryDelay: 0
      },
      logStreams: logStreamsList
    });
  }

  /**
   * Gets all log events for a specific log group and stream
   * @param logGroupName The log group name
   * @param logStreamName The log stream name
   * @returns The log events
   */
  getLogEvents(logGroupName: string, logStreamName: string): any[] {
    const key = `${logGroupName}:${logStreamName}`;
    return this.logEvents.get(key) || [];
  }

  /**
   * Gets all log events across all log groups and streams
   * @returns The log events
   */
  getAllLogEvents(): Map<string, any[]> {
    return this.logEvents;
  }

  /**
   * Resets the mock client state
   */
  reset(): void {
    this.createLogGroupCalls = [];
    this.createLogStreamCalls = [];
    this.putLogEventsCalls = [];
    this.describeLogStreamsCalls = [];
    this.logGroups = new Set();
    this.logStreams = new Map();
    this.logEvents = new Map();
    this.shouldFail = false;
    this.failOperation = undefined;
    this.errorToThrow = new Error('Simulated AWS SDK error');
  }
}

/**
 * Creates a mock CloudWatchLogsClient for testing
 * @returns A mock CloudWatchLogsClient
 */
export function createMockCloudWatchLogsClient(): CloudWatchLogsClient {
  const mockClient = new MockCloudWatchLogsClient();
  return mockClient as unknown as CloudWatchLogsClient;
}

/**
 * Gets the mock client from a CloudWatchLogsClient instance
 * @param client The CloudWatchLogsClient instance
 * @returns The mock client
 */
export function getMockFromClient(client: CloudWatchLogsClient): MockCloudWatchLogsClient {
  return client as unknown as MockCloudWatchLogsClient;
}