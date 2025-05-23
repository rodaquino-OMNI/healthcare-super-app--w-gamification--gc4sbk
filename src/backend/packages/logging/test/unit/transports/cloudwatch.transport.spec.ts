import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchTransport, CloudWatchTransportConfig } from '../../../src/transports/cloudwatch.transport';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { createMockCloudWatchLogsClient, getMockFromClient, MockCloudWatchLogsClient } from '../../mocks/aws-sdk.mock';

// Mock the AWS SDK client
jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-cloudwatch-logs');
  return {
    ...originalModule,
    CloudWatchLogsClient: jest.fn().mockImplementation(() => createMockCloudWatchLogsClient()),
  };
});

describe('CloudWatchTransport', () => {
  let transport: CloudWatchTransport;
  let mockClient: MockCloudWatchLogsClient;
  let defaultConfig: CloudWatchTransportConfig;

  beforeEach(() => {
    // Reset the mock client before each test
    jest.clearAllMocks();
    
    // Default configuration for tests
    defaultConfig = {
      region: 'us-east-1',
      logGroupName: 'test-log-group',
      serviceName: 'test-service',
      environment: 'test',
    };

    // Create the transport with the default configuration
    transport = new CloudWatchTransport(defaultConfig);
    
    // Get the mock client from the transport
    mockClient = getMockFromClient(transport['client']);
    mockClient.reset();
  });

  afterEach(() => {
    // Clean up after each test
    if (transport['batchTimer']) {
      clearTimeout(transport['batchTimer']);
    }
  });

  describe('constructor', () => {
    it('should initialize with default configuration values', () => {
      // Create a transport with minimal configuration
      const minimalConfig: CloudWatchTransportConfig = {
        region: 'us-east-1',
        logGroupName: 'test-log-group',
      };
      const minimalTransport = new CloudWatchTransport(minimalConfig);

      // Verify default values are set
      expect(minimalTransport['config'].batchSize).toBe(10000);
      expect(minimalTransport['config'].batchInterval).toBe(1000);
      expect(minimalTransport['config'].maxRetries).toBe(3);
      expect(minimalTransport['config'].retryBaseDelay).toBe(100);
      expect(minimalTransport['config'].retentionInDays).toBe(14);
    });

    it('should use provided configuration values', () => {
      // Create a transport with custom configuration
      const customConfig: CloudWatchTransportConfig = {
        region: 'eu-west-1',
        logGroupName: 'custom-log-group',
        logStreamName: 'custom-log-stream',
        batchSize: 5000,
        batchInterval: 2000,
        maxRetries: 5,
        retryBaseDelay: 200,
        retentionInDays: 30,
        serviceName: 'custom-service',
        environment: 'custom',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      };
      const customTransport = new CloudWatchTransport(customConfig);

      // Verify custom values are set
      expect(customTransport['config'].region).toBe('eu-west-1');
      expect(customTransport['config'].logGroupName).toBe('custom-log-group');
      expect(customTransport['config'].logStreamName).toBe('custom-log-stream');
      expect(customTransport['config'].batchSize).toBe(5000);
      expect(customTransport['config'].batchInterval).toBe(2000);
      expect(customTransport['config'].maxRetries).toBe(5);
      expect(customTransport['config'].retryBaseDelay).toBe(200);
      expect(customTransport['config'].retentionInDays).toBe(30);
      expect(customTransport['config'].serviceName).toBe('custom-service');
      expect(customTransport['config'].environment).toBe('custom');
      expect(customTransport['config'].credentials).toEqual({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      });
    });

    it('should generate a log stream name if not provided', () => {
      // Create a transport without a log stream name
      const config: CloudWatchTransportConfig = {
        region: 'us-east-1',
        logGroupName: 'test-log-group',
        serviceName: 'test-service',
        environment: 'test',
      };
      const testTransport = new CloudWatchTransport(config);

      // Verify a log stream name was generated
      expect(testTransport['logStreamName']).toBeDefined();
      expect(testTransport['logStreamName']).toContain('test-service');
      expect(testTransport['logStreamName']).toContain('test');
      expect(testTransport['logStreamName']).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should use the provided log stream name if available', () => {
      // Create a transport with a log stream name
      const config: CloudWatchTransportConfig = {
        region: 'us-east-1',
        logGroupName: 'test-log-group',
        logStreamName: 'custom-log-stream',
      };
      const testTransport = new CloudWatchTransport(config);

      // Verify the provided log stream name is used
      expect(testTransport['logStreamName']).toBe('custom-log-stream');
    });

    it('should create a CloudWatchLogsClient with the correct configuration', () => {
      // Create a transport with credentials
      const config: CloudWatchTransportConfig = {
        region: 'us-west-2',
        logGroupName: 'test-log-group',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          sessionToken: 'test-session-token',
        },
      };
      const testTransport = new CloudWatchTransport(config);

      // Verify the client was created with the correct configuration
      expect(CloudWatchLogsClient).toHaveBeenCalledWith({
        region: 'us-west-2',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          sessionToken: 'test-session-token',
        },
      });
    });
  });

  describe('initialize', () => {
    it('should create log group and log stream if they do not exist', async () => {
      // Initialize the transport
      await transport.initialize();

      // Verify the log group and stream were created
      expect(mockClient.createLogGroupCalls.length).toBe(1);
      expect(mockClient.createLogGroupCalls[0].input.logGroupName).toBe('test-log-group');
      
      expect(mockClient.describeLogStreamsCalls.length).toBe(1);
      expect(mockClient.describeLogStreamsCalls[0].input.logGroupName).toBe('test-log-group');
      expect(mockClient.describeLogStreamsCalls[0].input.logStreamNamePrefix).toBe(transport['logStreamName']);
      
      expect(mockClient.createLogStreamCalls.length).toBe(1);
      expect(mockClient.createLogStreamCalls[0].input.logGroupName).toBe('test-log-group');
      expect(mockClient.createLogStreamCalls[0].input.logStreamName).toBe(transport['logStreamName']);
      
      // Verify the transport is marked as initialized
      expect(transport['initialized']).toBe(true);
    });

    it('should not create log group if it already exists', async () => {
      // Set up the mock client to simulate the log group already existing
      mockClient.logGroups.add('test-log-group');

      // Initialize the transport
      await transport.initialize();

      // Verify the log group creation was attempted
      expect(mockClient.createLogGroupCalls.length).toBe(1);
      
      // Verify the log stream was still created
      expect(mockClient.createLogStreamCalls.length).toBe(1);
      
      // Verify the transport is marked as initialized
      expect(transport['initialized']).toBe(true);
    });

    it('should not create log stream if it already exists', async () => {
      // Set up the mock client to simulate the log group and stream already existing
      mockClient.logGroups.add('test-log-group');
      if (!mockClient.logStreams.has('test-log-group')) {
        mockClient.logStreams.set('test-log-group', new Set());
      }
      mockClient.logStreams.get('test-log-group')!.add(transport['logStreamName']);

      // Initialize the transport
      await transport.initialize();

      // Verify the log stream creation was not attempted
      expect(mockClient.createLogStreamCalls.length).toBe(0);
      
      // Verify the transport is marked as initialized
      expect(transport['initialized']).toBe(true);
    });

    it('should only initialize once even if called multiple times', async () => {
      // Initialize the transport twice
      await transport.initialize();
      await transport.initialize();

      // Verify the log group and stream were only created once
      expect(mockClient.createLogGroupCalls.length).toBe(1);
      expect(mockClient.createLogStreamCalls.length).toBe(1);
    });

    it('should handle errors during initialization', async () => {
      // Set up the mock client to simulate an error
      mockClient.shouldFail = true;
      mockClient.errorToThrow = new Error('Simulated AWS SDK error');

      // Attempt to initialize the transport
      await expect(transport.initialize()).rejects.toThrow('Simulated AWS SDK error');

      // Verify the transport is not marked as initialized
      expect(transport['initialized']).toBe(false);
    });
  });

  describe('write', () => {
    beforeEach(async () => {
      // Initialize the transport before each test
      await transport.initialize();
      // Reset the mock client after initialization
      mockClient.reset();
      mockClient.logGroups.add('test-log-group');
      if (!mockClient.logStreams.has('test-log-group')) {
        mockClient.logStreams.set('test-log-group', new Set());
      }
      mockClient.logStreams.get('test-log-group')!.add(transport['logStreamName']);
    });

    it('should add log entry to the batch', async () => {
      // Create a log entry
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };

      // Write the log entry
      await transport.write(logEntry);

      // Verify the log entry was added to the batch
      expect(transport['logBatch'].length).toBe(1);
      expect(transport['logBatch'][0].timestamp).toBe(logEntry.timestamp.getTime());
      expect(transport['logBatch'][0].message).toBe(JSON.stringify(logEntry));
      
      // Verify no logs were sent to CloudWatch yet (batch not full)
      expect(mockClient.putLogEventsCalls.length).toBe(0);
    });

    it('should flush the batch when it reaches the batch size', async () => {
      // Set a small batch size for testing
      transport['config'].batchSize = 2;

      // Create log entries
      const logEntry1: LogEntry = {
        message: 'Test log message 1',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };

      const logEntry2: LogEntry = {
        message: 'Test log message 2',
        level: LogLevel.INFO,
        timestamp: new Date(Date.now() + 1000), // 1 second later
        serviceName: 'test-service',
      };

      // Write the first log entry
      await transport.write(logEntry1);
      
      // Verify the first log entry was added to the batch
      expect(transport['logBatch'].length).toBe(1);
      
      // Write the second log entry, which should trigger a flush
      await transport.write(logEntry2);
      
      // Verify the batch was flushed
      expect(transport['logBatch'].length).toBe(0);
      
      // Verify logs were sent to CloudWatch
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].input.logGroupName).toBe('test-log-group');
      expect(mockClient.putLogEventsCalls[0].input.logStreamName).toBe(transport['logStreamName']);
      expect(mockClient.putLogEventsCalls[0].input.logEvents?.length).toBe(2);
      
      // Verify the log events are in chronological order
      const logEvents = mockClient.putLogEventsCalls[0].input.logEvents || [];
      expect(logEvents[0].message).toBe(JSON.stringify(logEntry1));
      expect(logEvents[1].message).toBe(JSON.stringify(logEntry2));
    });

    it('should set a timer to flush the batch after the batch interval', async () => {
      // Mock setTimeout
      jest.useFakeTimers();

      // Create a log entry
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };

      // Write the log entry
      await transport.write(logEntry);

      // Verify a timer was set
      expect(transport['batchTimer']).toBeDefined();
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      // Verify the batch was flushed
      expect(transport['logBatch'].length).toBe(0);
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should initialize the transport if not already initialized', async () => {
      // Create a new transport that is not initialized
      const uninitializedTransport = new CloudWatchTransport(defaultConfig);
      const uninitializedMockClient = getMockFromClient(uninitializedTransport['client']);
      
      // Create a log entry
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };

      // Write the log entry
      await uninitializedTransport.write(logEntry);

      // Verify the transport was initialized
      expect(uninitializedTransport['initialized']).toBe(true);
      expect(uninitializedMockClient.createLogGroupCalls.length).toBe(1);
    });
  });

  describe('flushBatch', () => {
    beforeEach(async () => {
      // Initialize the transport before each test
      await transport.initialize();
      // Reset the mock client after initialization
      mockClient.reset();
      mockClient.logGroups.add('test-log-group');
      if (!mockClient.logStreams.has('test-log-group')) {
        mockClient.logStreams.set('test-log-group', new Set());
      }
      mockClient.logStreams.get('test-log-group')!.add(transport['logStreamName']);
    });

    it('should clear the batch timer when flushing', async () => {
      // Mock setTimeout and clearTimeout
      jest.useFakeTimers();

      // Create a log entry and write it to set the timer
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };
      await transport.write(logEntry);

      // Verify a timer was set
      expect(transport['batchTimer']).toBeDefined();
      
      // Manually flush the batch
      await transport['flushBatch']();
      
      // Verify the timer was cleared
      expect(transport['batchTimer']).toBeNull();
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should not send logs if the batch is empty', async () => {
      // Ensure the batch is empty
      transport['logBatch'] = [];

      // Flush the batch
      await transport['flushBatch']();

      // Verify no logs were sent to CloudWatch
      expect(mockClient.putLogEventsCalls.length).toBe(0);
    });

    it('should send logs to CloudWatch with the correct parameters', async () => {
      // Add log entries to the batch
      const timestamp1 = new Date();
      const timestamp2 = new Date(timestamp1.getTime() + 1000);
      transport['logBatch'] = [
        { timestamp: timestamp1.getTime(), message: 'Test log message 1' },
        { timestamp: timestamp2.getTime(), message: 'Test log message 2' },
      ];

      // Flush the batch
      await transport['flushBatch']();

      // Verify logs were sent to CloudWatch
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].input.logGroupName).toBe('test-log-group');
      expect(mockClient.putLogEventsCalls[0].input.logStreamName).toBe(transport['logStreamName']);
      expect(mockClient.putLogEventsCalls[0].input.logEvents?.length).toBe(2);
      
      // Verify the log events are in chronological order
      const logEvents = mockClient.putLogEventsCalls[0].input.logEvents || [];
      expect(logEvents[0].timestamp).toBe(timestamp1.getTime());
      expect(logEvents[0].message).toBe('Test log message 1');
      expect(logEvents[1].timestamp).toBe(timestamp2.getTime());
      expect(logEvents[1].message).toBe('Test log message 2');
      
      // Verify the batch was cleared
      expect(transport['logBatch'].length).toBe(0);
    });
  });

  describe('sendLogsWithRetry', () => {
    beforeEach(async () => {
      // Initialize the transport before each test
      await transport.initialize();
      // Reset the mock client after initialization
      mockClient.reset();
      mockClient.logGroups.add('test-log-group');
      if (!mockClient.logStreams.has('test-log-group')) {
        mockClient.logStreams.set('test-log-group', new Set());
      }
      mockClient.logStreams.get('test-log-group')!.add(transport['logStreamName']);
    });

    it('should send logs to CloudWatch successfully on the first try', async () => {
      // Create log events
      const logEvents = [
        { timestamp: Date.now(), message: 'Test log message' },
      ];

      // Send logs with retry
      await transport['sendLogsWithRetry'](logEvents);

      // Verify logs were sent to CloudWatch
      expect(mockClient.putLogEventsCalls.length).toBe(1);
    });

    it('should retry sending logs when there is an error', async () => {
      // Mock setTimeout
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      // Set up the mock client to fail on the first attempt but succeed on the second
      let attempts = 0;
      mockClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof PutLogEventsCommand) {
          attempts++;
          if (attempts === 1) {
            return Promise.reject(new Error('Simulated AWS SDK error'));
          }
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
        return Promise.resolve({});
      });

      // Create log events
      const logEvents = [
        { timestamp: Date.now(), message: 'Test log message' },
      ];

      // Send logs with retry
      const sendPromise = transport['sendLogsWithRetry'](logEvents);
      
      // Fast-forward time to trigger the retry
      jest.advanceTimersByTime(100); // First retry delay
      
      // Wait for the promise to resolve
      await sendPromise;

      // Verify the send was retried
      expect(mockClient.send).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should use exponential backoff for retries', async () => {
      // Mock setTimeout
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      // Set up the mock client to fail on the first two attempts but succeed on the third
      let attempts = 0;
      mockClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof PutLogEventsCommand) {
          attempts++;
          if (attempts <= 2) {
            return Promise.reject(new Error('Simulated AWS SDK error'));
          }
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
        return Promise.resolve({});
      });

      // Create log events
      const logEvents = [
        { timestamp: Date.now(), message: 'Test log message' },
      ];

      // Send logs with retry
      const sendPromise = transport['sendLogsWithRetry'](logEvents);
      
      // Fast-forward time to trigger the first retry
      jest.advanceTimersByTime(100); // First retry delay (100ms)
      
      // Fast-forward time to trigger the second retry
      jest.advanceTimersByTime(200); // Second retry delay (100ms * 2^1 = 200ms)
      
      // Wait for the promise to resolve
      await sendPromise;

      // Verify the send was retried with exponential backoff
      expect(mockClient.send).toHaveBeenCalledTimes(3);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should give up after the maximum number of retries', async () => {
      // Mock setTimeout
      jest.useFakeTimers();

      // Set up the mock client to always fail
      mockClient.send = jest.fn().mockRejectedValue(new Error('Simulated AWS SDK error'));

      // Create log events
      const logEvents = [
        { timestamp: Date.now(), message: 'Test log message' },
      ];

      // Send logs with retry
      const sendPromise = transport['sendLogsWithRetry'](logEvents);
      
      // Fast-forward time to trigger all retries
      jest.advanceTimersByTime(100); // First retry delay
      jest.advanceTimersByTime(200); // Second retry delay
      jest.advanceTimersByTime(400); // Third retry delay
      
      // Verify the promise is rejected after all retries
      await expect(sendPromise).rejects.toThrow('Simulated AWS SDK error');

      // Verify the send was retried the maximum number of times
      expect(mockClient.send).toHaveBeenCalledTimes(4); // Initial attempt + 3 retries
      
      // Restore timers
      jest.useRealTimers();
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      // Initialize the transport before each test
      await transport.initialize();
    });

    it('should flush any pending logs', async () => {
      // Add a log entry to the batch
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };
      await transport.write(logEntry);

      // Spy on the flushBatch method
      const flushBatchSpy = jest.spyOn(transport as any, 'flushBatch');

      // Close the transport
      await transport.close();

      // Verify flushBatch was called
      expect(flushBatchSpy).toHaveBeenCalled();
    });

    it('should clear the batch timer', async () => {
      // Mock setTimeout and clearTimeout
      jest.useFakeTimers();

      // Add a log entry to the batch to set the timer
      const logEntry: LogEntry = {
        message: 'Test log message',
        level: LogLevel.INFO,
        timestamp: new Date(),
        serviceName: 'test-service',
      };
      await transport.write(logEntry);

      // Verify a timer was set
      expect(transport['batchTimer']).toBeDefined();

      // Close the transport
      await transport.close();

      // Verify the timer was cleared
      expect(transport['batchTimer']).toBeNull();
      
      // Restore timers
      jest.useRealTimers();
    });

    it('should not flush if there are no pending logs', async () => {
      // Ensure the batch is empty
      transport['logBatch'] = [];

      // Spy on the flushBatch method
      const flushBatchSpy = jest.spyOn(transport as any, 'flushBatch');

      // Close the transport
      await transport.close();

      // Verify flushBatch was not called
      expect(flushBatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      // Initialize the transport before each test
      await transport.initialize();
      // Reset the mock client after initialization
      mockClient.reset();
      mockClient.logGroups.add('test-log-group');
      if (!mockClient.logStreams.has('test-log-group')) {
        mockClient.logStreams.set('test-log-group', new Set());
      }
      mockClient.logStreams.get('test-log-group')!.add(transport['logStreamName']);
    });

    it('should handle errors during log group creation', async () => {
      // Create a new transport that is not initialized
      const uninitializedTransport = new CloudWatchTransport(defaultConfig);
      const uninitializedMockClient = getMockFromClient(uninitializedTransport['client']);
      
      // Set up the mock client to fail during log group creation
      uninitializedMockClient.shouldFail = true;
      uninitializedMockClient.failOperation = 'createLogGroup';
      uninitializedMockClient.errorToThrow = new Error('Simulated log group creation error');

      // Attempt to initialize the transport
      await expect(uninitializedTransport.initialize()).rejects.toThrow('Simulated log group creation error');

      // Verify the transport is not marked as initialized
      expect(uninitializedTransport['initialized']).toBe(false);
    });

    it('should handle errors during log stream creation', async () => {
      // Create a new transport that is not initialized
      const uninitializedTransport = new CloudWatchTransport(defaultConfig);
      const uninitializedMockClient = getMockFromClient(uninitializedTransport['client']);
      
      // Set up the mock client to fail during log stream creation
      uninitializedMockClient.shouldFail = true;
      uninitializedMockClient.failOperation = 'createLogStream';
      uninitializedMockClient.errorToThrow = new Error('Simulated log stream creation error');

      // Attempt to initialize the transport
      await expect(uninitializedTransport.initialize()).rejects.toThrow('Simulated log stream creation error');

      // Verify the transport is not marked as initialized
      expect(uninitializedTransport['initialized']).toBe(false);
    });

    it('should handle errors during log stream description', async () => {
      // Create a new transport that is not initialized
      const uninitializedTransport = new CloudWatchTransport(defaultConfig);
      const uninitializedMockClient = getMockFromClient(uninitializedTransport['client']);
      
      // Set up the mock client to fail during log stream description
      uninitializedMockClient.shouldFail = true;
      uninitializedMockClient.failOperation = 'describeLogStreams';
      uninitializedMockClient.errorToThrow = new Error('Simulated log stream description error');

      // Attempt to initialize the transport
      await expect(uninitializedTransport.initialize()).rejects.toThrow('Simulated log stream description error');

      // Verify the transport is not marked as initialized
      expect(uninitializedTransport['initialized']).toBe(false);
    });

    it('should handle errors during log event submission', async () => {
      // Set up the mock client to fail during log event submission
      mockClient.shouldFail = true;
      mockClient.failOperation = 'putLogEvents';
      mockClient.errorToThrow = new Error('Simulated log event submission error');

      // Add log entries to the batch
      transport['logBatch'] = [
        { timestamp: Date.now(), message: 'Test log message' },
      ];

      // Attempt to flush the batch
      await expect(transport['flushBatch']()).rejects.toThrow('Simulated log event submission error');

      // Verify the batch was not cleared (to allow for retry)
      expect(transport['logBatch'].length).toBe(1);
    });

    it('should ignore ResourceAlreadyExistsException during log group creation', async () => {
      // Create a new transport that is not initialized
      const uninitializedTransport = new CloudWatchTransport(defaultConfig);
      const uninitializedMockClient = getMockFromClient(uninitializedTransport['client']);
      
      // Set up the mock client to throw ResourceAlreadyExistsException
      uninitializedMockClient.send = jest.fn().mockImplementation((command) => {
        if (command instanceof CreateLogGroupCommand) {
          const error: any = new Error('Log group already exists');
          error.name = 'ResourceAlreadyExistsException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      // Attempt to initialize the transport
      await uninitializedTransport.initialize();

      // Verify the transport is marked as initialized despite the error
      expect(uninitializedTransport['initialized']).toBe(true);
    });
  });
});