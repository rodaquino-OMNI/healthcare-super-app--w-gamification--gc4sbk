/**
 * Mock implementation of AWS SDK CloudWatch Logs client for testing.
 * This mock simulates the CloudWatch Logs client without making real AWS API calls,
 * allowing tests to verify CloudWatch transport behavior in isolation.
 */

// Mock types to match AWS SDK structure
export interface MockCloudWatchLogsClient {
  send: (command: any) => Promise<any>;
}

export interface MockCreateLogGroupCommandOutput {
  $metadata: {
    httpStatusCode: number;
  };
}

export interface MockCreateLogStreamCommandOutput {
  $metadata: {
    httpStatusCode: number;
  };
}

export interface MockPutLogEventsCommandOutput {
  $metadata: {
    httpStatusCode: number;
  };
  nextSequenceToken?: string;
  rejectedLogEventsInfo?: {
    tooNewLogEventStartIndex?: number;
    tooOldLogEventEndIndex?: number;
    expiredLogEventEndIndex?: number;
  };
}

/**
 * Mock implementation of AWS SDK CloudWatch Logs client
 */
export class MockCloudWatchLogsClient implements MockCloudWatchLogsClient {
  // Track calls to AWS SDK methods
  private calls: {
    createLogGroup: { logGroupName: string }[];
    createLogStream: { logGroupName: string; logStreamName: string }[];
    putLogEvents: {
      logGroupName: string;
      logStreamName: string;
      logEvents: { timestamp: number; message: string }[];
      sequenceToken?: string;
    }[];
  } = {
    createLogGroup: [],
    createLogStream: [],
    putLogEvents: [],
  };

  // Configuration for simulating errors
  private errorConfig: {
    createLogGroup?: Error;
    createLogStream?: Error;
    putLogEvents?: Error;
    failAfterAttempts?: {
      createLogGroup?: number;
      createLogStream?: number;
      putLogEvents?: number;
    };
  } = {};

  // Track number of attempts for each operation
  private attempts: {
    createLogGroup: number;
    createLogStream: number;
    putLogEvents: number;
  } = {
    createLogGroup: 0,
    createLogStream: 0,
    putLogEvents: 0,
  };

  // Sequence token for PutLogEvents
  private sequenceToken: string = "mock-sequence-token";

  /**
   * Simulates sending a command to AWS CloudWatch Logs
   * @param command The command to send
   * @returns Promise that resolves with the command output or rejects with an error
   */
  async send(command: any): Promise<any> {
    // Handle CreateLogGroupCommand
    if (command.constructor.name === "CreateLogGroupCommand") {
      this.attempts.createLogGroup++;
      this.calls.createLogGroup.push({
        logGroupName: command.input.logGroupName,
      });

      // Check if we should simulate a resource already exists error
      const existingGroup = this.calls.createLogGroup.filter(
        (call) => call.logGroupName === command.input.logGroupName
      );
      if (existingGroup.length > 1) {
        const error = new Error("Log group already exists");
        error.name = "ResourceAlreadyExistsException";
        throw error;
      }

      // Check if we should simulate an error
      if (this.errorConfig.createLogGroup) {
        throw this.errorConfig.createLogGroup;
      }

      // Check if we should fail after a certain number of attempts
      if (
        this.errorConfig.failAfterAttempts?.createLogGroup &&
        this.attempts.createLogGroup <= this.errorConfig.failAfterAttempts.createLogGroup
      ) {
        const error = new Error("Simulated error for CreateLogGroupCommand");
        error.name = "InternalFailure";
        throw error;
      }

      return {
        $metadata: {
          httpStatusCode: 200,
        },
      } as MockCreateLogGroupCommandOutput;
    }

    // Handle CreateLogStreamCommand
    if (command.constructor.name === "CreateLogStreamCommand") {
      this.attempts.createLogStream++;
      this.calls.createLogStream.push({
        logGroupName: command.input.logGroupName,
        logStreamName: command.input.logStreamName,
      });

      // Check if we should simulate a resource already exists error
      const existingStream = this.calls.createLogStream.filter(
        (call) =>
          call.logGroupName === command.input.logGroupName &&
          call.logStreamName === command.input.logStreamName
      );
      if (existingStream.length > 1) {
        const error = new Error("Log stream already exists");
        error.name = "ResourceAlreadyExistsException";
        throw error;
      }

      // Check if we should simulate an error
      if (this.errorConfig.createLogStream) {
        throw this.errorConfig.createLogStream;
      }

      // Check if we should fail after a certain number of attempts
      if (
        this.errorConfig.failAfterAttempts?.createLogStream &&
        this.attempts.createLogStream <= this.errorConfig.failAfterAttempts.createLogStream
      ) {
        const error = new Error("Simulated error for CreateLogStreamCommand");
        error.name = "InternalFailure";
        throw error;
      }

      return {
        $metadata: {
          httpStatusCode: 200,
        },
      } as MockCreateLogStreamCommandOutput;
    }

    // Handle PutLogEventsCommand
    if (command.constructor.name === "PutLogEventsCommand") {
      this.attempts.putLogEvents++;
      this.calls.putLogEvents.push({
        logGroupName: command.input.logGroupName,
        logStreamName: command.input.logStreamName,
        logEvents: command.input.logEvents,
        sequenceToken: command.input.sequenceToken,
      });

      // Check if we should simulate an error
      if (this.errorConfig.putLogEvents) {
        throw this.errorConfig.putLogEvents;
      }

      // Check if we should fail after a certain number of attempts
      if (
        this.errorConfig.failAfterAttempts?.putLogEvents &&
        this.attempts.putLogEvents <= this.errorConfig.failAfterAttempts.putLogEvents
      ) {
        const error = new Error("Simulated error for PutLogEventsCommand");
        error.name = "InternalFailure";
        throw error;
      }

      // Generate a new sequence token for the next call
      this.sequenceToken = `mock-sequence-token-${Date.now()}`;

      return {
        $metadata: {
          httpStatusCode: 200,
        },
        nextSequenceToken: this.sequenceToken,
      } as MockPutLogEventsCommandOutput;
    }

    // Unhandled command type
    throw new Error(`Unhandled command type: ${command.constructor.name}`);
  }

  /**
   * Configure the mock to simulate an error for a specific operation
   * @param operation The operation to simulate an error for
   * @param error The error to throw
   */
  simulateError(operation: 'createLogGroup' | 'createLogStream' | 'putLogEvents', error: Error): void {
    this.errorConfig[operation] = error;
  }

  /**
   * Configure the mock to fail after a certain number of attempts for a specific operation
   * @param operation The operation to fail
   * @param attempts The number of attempts before success
   */
  failAfterAttempts(operation: 'createLogGroup' | 'createLogStream' | 'putLogEvents', attempts: number): void {
    if (!this.errorConfig.failAfterAttempts) {
      this.errorConfig.failAfterAttempts = {};
    }
    this.errorConfig.failAfterAttempts[operation] = attempts;
  }

  /**
   * Get all recorded calls to createLogGroup
   */
  getCreateLogGroupCalls(): { logGroupName: string }[] {
    return [...this.calls.createLogGroup];
  }

  /**
   * Get all recorded calls to createLogStream
   */
  getCreateLogStreamCalls(): { logGroupName: string; logStreamName: string }[] {
    return [...this.calls.createLogStream];
  }

  /**
   * Get all recorded calls to putLogEvents
   */
  getPutLogEventsCalls(): {
    logGroupName: string;
    logStreamName: string;
    logEvents: { timestamp: number; message: string }[];
    sequenceToken?: string;
  }[] {
    return [...this.calls.putLogEvents];
  }

  /**
   * Get all log events that have been sent to CloudWatch
   */
  getAllLogEvents(): { timestamp: number; message: string }[] {
    return this.calls.putLogEvents.flatMap((call) => call.logEvents);
  }

  /**
   * Get the number of attempts for a specific operation
   * @param operation The operation to get attempts for
   */
  getAttempts(operation: 'createLogGroup' | 'createLogStream' | 'putLogEvents'): number {
    return this.attempts[operation];
  }

  /**
   * Reset the mock state
   */
  reset(): void {
    this.calls = {
      createLogGroup: [],
      createLogStream: [],
      putLogEvents: [],
    };
    this.errorConfig = {};
    this.attempts = {
      createLogGroup: 0,
      createLogStream: 0,
      putLogEvents: 0,
    };
    this.sequenceToken = "mock-sequence-token";
  }
}

/**
 * Mock implementation of CreateLogGroupCommand
 */
export class MockCreateLogGroupCommand {
  constructor(public readonly input: { logGroupName: string }) {}
}

/**
 * Mock implementation of CreateLogStreamCommand
 */
export class MockCreateLogStreamCommand {
  constructor(public readonly input: { logGroupName: string; logStreamName: string }) {}
}

/**
 * Mock implementation of PutLogEventsCommand
 */
export class MockPutLogEventsCommand {
  constructor(
    public readonly input: {
      logGroupName: string;
      logStreamName: string;
      logEvents: { timestamp: number; message: string }[];
      sequenceToken?: string;
    }
  ) {}
}