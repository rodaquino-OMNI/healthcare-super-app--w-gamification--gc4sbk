import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
  PutRetentionPolicyCommand,
  InputLogEvent,
  ResourceNotFoundException,
  ThrottlingException,
  ServiceUnavailableException,
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * Mock implementation of AWS SDK CloudWatch Logs client for testing
 * 
 * This mock allows testing the CloudWatch transport without making real AWS API calls.
 * It tracks calls to various CloudWatch Logs methods and can be configured to return
 * success or error responses for testing different scenarios.
 */
export class MockCloudWatchLogsClient {
  /**
   * Tracks calls to createLogGroup
   */
  public createLogGroupCalls: Array<{
    logGroupName: string;
    tags?: Record<string, string>;
  }> = [];

  /**
   * Tracks calls to createLogStream
   */
  public createLogStreamCalls: Array<{
    logGroupName: string;
    logStreamName: string;
  }> = [];

  /**
   * Tracks calls to describeLogGroups
   */
  public describeLogGroupsCalls: Array<{
    logGroupNamePrefix?: string;
    nextToken?: string;
    limit?: number;
  }> = [];

  /**
   * Tracks calls to describeLogStreams
   */
  public describeLogStreamsCalls: Array<{
    logGroupName: string;
    logStreamNamePrefix?: string;
    orderBy?: string;
    descending?: boolean;
    nextToken?: string;
    limit?: number;
  }> = [];

  /**
   * Tracks calls to putLogEvents
   */
  public putLogEventsCalls: Array<{
    logGroupName: string;
    logStreamName: string;
    logEvents: InputLogEvent[];
    sequenceToken?: string;
  }> = [];

  /**
   * Tracks calls to putRetentionPolicy
   */
  public putRetentionPolicyCalls: Array<{
    logGroupName: string;
    retentionInDays: number;
  }> = [];

  /**
   * Stores all log events sent to putLogEvents for inspection
   */
  public logEvents: InputLogEvent[] = [];

  /**
   * Configuration for simulating errors
   */
  private errorConfig: {
    createLogGroup?: Error;
    createLogStream?: Error;
    describeLogGroups?: Error;
    describeLogStreams?: Error;
    putLogEvents?: Error;
    putRetentionPolicy?: Error;
  } = {};

  /**
   * Configuration for simulating responses
   */
  private responseConfig: {
    describeLogGroups?: {
      logGroups?: Array<{ logGroupName: string }>;
    };
    describeLogStreams?: {
      logStreams?: Array<{ logStreamName: string; uploadSequenceToken?: string }>;
    };
    putLogEvents?: {
      nextSequenceToken?: string;
    };
  } = {};

  /**
   * Creates a new MockCloudWatchLogsClient instance
   */
  constructor() {
    this.reset();
  }

  /**
   * Resets all tracked calls and configurations
   */
  public reset(): void {
    this.createLogGroupCalls = [];
    this.createLogStreamCalls = [];
    this.describeLogGroupsCalls = [];
    this.describeLogStreamsCalls = [];
    this.putLogEventsCalls = [];
    this.putRetentionPolicyCalls = [];
    this.logEvents = [];
    this.errorConfig = {};
    this.responseConfig = {
      describeLogGroups: { logGroups: [] },
      describeLogStreams: { logStreams: [] },
      putLogEvents: { nextSequenceToken: '49612345678901234567890123456789012345678901234567890' },
    };
  }

  /**
   * Configures the mock to throw an error for a specific command
   * 
   * @param command The command to throw an error for
   * @param error The error to throw
   */
  public mockErrorFor(command: string, error: Error): void {
    switch (command) {
      case 'CreateLogGroupCommand':
        this.errorConfig.createLogGroup = error;
        break;
      case 'CreateLogStreamCommand':
        this.errorConfig.createLogStream = error;
        break;
      case 'DescribeLogGroupsCommand':
        this.errorConfig.describeLogGroups = error;
        break;
      case 'DescribeLogStreamsCommand':
        this.errorConfig.describeLogStreams = error;
        break;
      case 'PutLogEventsCommand':
        this.errorConfig.putLogEvents = error;
        break;
      case 'PutRetentionPolicyCommand':
        this.errorConfig.putRetentionPolicy = error;
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Configures the mock to return a specific response for describeLogGroups
   * 
   * @param logGroups The log groups to return
   */
  public mockDescribeLogGroupsResponse(logGroups: Array<{ logGroupName: string }>): void {
    this.responseConfig.describeLogGroups = { logGroups };
  }

  /**
   * Configures the mock to return a specific response for describeLogStreams
   * 
   * @param logStreams The log streams to return
   */
  public mockDescribeLogStreamsResponse(logStreams: Array<{ logStreamName: string; uploadSequenceToken?: string }>): void {
    this.responseConfig.describeLogStreams = { logStreams };
  }

  /**
   * Configures the mock to return a specific sequence token for putLogEvents
   * 
   * @param nextSequenceToken The next sequence token to return
   */
  public mockPutLogEventsResponse(nextSequenceToken: string): void {
    this.responseConfig.putLogEvents = { nextSequenceToken };
  }

  /**
   * Simulates sending a command to the CloudWatch Logs client
   * 
   * @param command The command to send
   * @returns The response for the command
   */
  public async send(command: any): Promise<any> {
    if (command instanceof CreateLogGroupCommand) {
      return this.handleCreateLogGroup(command);
    } else if (command instanceof CreateLogStreamCommand) {
      return this.handleCreateLogStream(command);
    } else if (command instanceof DescribeLogGroupsCommand) {
      return this.handleDescribeLogGroups(command);
    } else if (command instanceof DescribeLogStreamsCommand) {
      return this.handleDescribeLogStreams(command);
    } else if (command instanceof PutLogEventsCommand) {
      return this.handlePutLogEvents(command);
    } else if (command instanceof PutRetentionPolicyCommand) {
      return this.handlePutRetentionPolicy(command);
    } else {
      throw new Error(`Unsupported command: ${command.constructor.name}`);
    }
  }

  /**
   * Handles CreateLogGroupCommand
   * 
   * @param command The CreateLogGroupCommand
   * @returns Empty response
   */
  private async handleCreateLogGroup(command: CreateLogGroupCommand): Promise<{}> {
    const input = command.input;
    
    this.createLogGroupCalls.push({
      logGroupName: input.logGroupName!,
      tags: input.tags,
    });

    if (this.errorConfig.createLogGroup) {
      throw this.errorConfig.createLogGroup;
    }

    return {};
  }

  /**
   * Handles CreateLogStreamCommand
   * 
   * @param command The CreateLogStreamCommand
   * @returns Empty response
   */
  private async handleCreateLogStream(command: CreateLogStreamCommand): Promise<{}> {
    const input = command.input;
    
    this.createLogStreamCalls.push({
      logGroupName: input.logGroupName!,
      logStreamName: input.logStreamName!,
    });

    if (this.errorConfig.createLogStream) {
      throw this.errorConfig.createLogStream;
    }

    return {};
  }

  /**
   * Handles DescribeLogGroupsCommand
   * 
   * @param command The DescribeLogGroupsCommand
   * @returns Response with log groups
   */
  private async handleDescribeLogGroups(command: DescribeLogGroupsCommand): Promise<{ logGroups?: Array<{ logGroupName: string }> }> {
    const input = command.input;
    
    this.describeLogGroupsCalls.push({
      logGroupNamePrefix: input.logGroupNamePrefix,
      nextToken: input.nextToken,
      limit: input.limit,
    });

    if (this.errorConfig.describeLogGroups) {
      throw this.errorConfig.describeLogGroups;
    }

    return this.responseConfig.describeLogGroups || { logGroups: [] };
  }

  /**
   * Handles DescribeLogStreamsCommand
   * 
   * @param command The DescribeLogStreamsCommand
   * @returns Response with log streams
   */
  private async handleDescribeLogStreams(command: DescribeLogStreamsCommand): Promise<{ logStreams?: Array<{ logStreamName: string; uploadSequenceToken?: string }> }> {
    const input = command.input;
    
    this.describeLogStreamsCalls.push({
      logGroupName: input.logGroupName!,
      logStreamNamePrefix: input.logStreamNamePrefix,
      orderBy: input.orderBy,
      descending: input.descending,
      nextToken: input.nextToken,
      limit: input.limit,
    });

    if (this.errorConfig.describeLogStreams) {
      throw this.errorConfig.describeLogStreams;
    }

    return this.responseConfig.describeLogStreams || { logStreams: [] };
  }

  /**
   * Handles PutLogEventsCommand
   * 
   * @param command The PutLogEventsCommand
   * @returns Response with next sequence token
   */
  private async handlePutLogEvents(command: PutLogEventsCommand): Promise<{ nextSequenceToken?: string }> {
    const input = command.input;
    
    this.putLogEventsCalls.push({
      logGroupName: input.logGroupName!,
      logStreamName: input.logStreamName!,
      logEvents: input.logEvents!,
      sequenceToken: input.sequenceToken,
    });

    // Store log events for inspection
    this.logEvents.push(...(input.logEvents || []));

    if (this.errorConfig.putLogEvents) {
      throw this.errorConfig.putLogEvents;
    }

    return this.responseConfig.putLogEvents || { nextSequenceToken: '49612345678901234567890123456789012345678901234567890' };
  }

  /**
   * Handles PutRetentionPolicyCommand
   * 
   * @param command The PutRetentionPolicyCommand
   * @returns Empty response
   */
  private async handlePutRetentionPolicy(command: PutRetentionPolicyCommand): Promise<{}> {
    const input = command.input;
    
    this.putRetentionPolicyCalls.push({
      logGroupName: input.logGroupName!,
      retentionInDays: input.retentionInDays!,
    });

    if (this.errorConfig.putRetentionPolicy) {
      throw this.errorConfig.putRetentionPolicy;
    }

    return {};
  }

  /**
   * Gets all log messages sent to CloudWatch
   * 
   * @returns Array of log messages
   */
  public getLogMessages(): string[] {
    return this.logEvents.map(event => event.message || '');
  }

  /**
   * Gets all log events sent to CloudWatch
   * 
   * @returns Array of log events
   */
  public getLogEvents(): InputLogEvent[] {
    return [...this.logEvents];
  }

  /**
   * Checks if a specific log message was sent to CloudWatch
   * 
   * @param message The message to check for
   * @returns True if the message was sent, false otherwise
   */
  public hasLogMessage(message: string): boolean {
    return this.getLogMessages().some(msg => msg === message);
  }

  /**
   * Checks if a log message matching the pattern was sent to CloudWatch
   * 
   * @param pattern The pattern to match against
   * @returns True if a matching message was sent, false otherwise
   */
  public hasLogMessageMatching(pattern: RegExp): boolean {
    return this.getLogMessages().some(msg => pattern.test(msg));
  }
}

/**
 * Creates a mock CloudWatchLogsClient for testing
 * 
 * @returns A mock CloudWatchLogsClient instance
 */
export function createMockCloudWatchLogsClient(): { client: CloudWatchLogsClient; mock: MockCloudWatchLogsClient } {
  const mock = new MockCloudWatchLogsClient();
  const client = mock as unknown as CloudWatchLogsClient;
  
  return { client, mock };
}

/**
 * Creates a ResourceNotFoundException for testing
 * 
 * @param message The error message
 * @returns A ResourceNotFoundException
 */
export function createResourceNotFoundException(message: string): ResourceNotFoundException {
  return Object.assign(
    new ResourceNotFoundException({ message }),
    { message }
  );
}

/**
 * Creates a ThrottlingException for testing
 * 
 * @param message The error message
 * @returns A ThrottlingException
 */
export function createThrottlingException(message: string): ThrottlingException {
  return Object.assign(
    new ThrottlingException({ message }),
    { message }
  );
}

/**
 * Creates a ServiceUnavailableException for testing
 * 
 * @param message The error message
 * @returns A ServiceUnavailableException
 */
export function createServiceUnavailableException(message: string): ServiceUnavailableException {
  return Object.assign(
    new ServiceUnavailableException({ message }),
    { message }
  );
}