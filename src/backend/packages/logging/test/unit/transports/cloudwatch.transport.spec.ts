import { Test } from '@nestjs/testing';
import {
  CloudWatchLogsClient,
  ResourceNotFoundException,
  ThrottlingException,
  ServiceUnavailableException,
  InputLogEvent,
} from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchTransport, CloudWatchTransportConfig } from '../../../src/transports/cloudwatch.transport';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';
import { LogEntry, LogLevel } from '../../../src/interfaces/formatter.interface';
import {
  createMockCloudWatchLogsClient,
  MockCloudWatchLogsClient,
  createResourceNotFoundException,
  createThrottlingException,
  createServiceUnavailableException,
} from '../../mocks/aws-sdk.mock';
import { MockCloudWatchFormatter } from '../../mocks/formatter.mock';

// Mock the AWS SDK CloudWatch Logs client
jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
  const actual = jest.requireActual('@aws-sdk/client-cloudwatch-logs');
  return {
    ...actual,
    CloudWatchLogsClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
  };
});

describe('CloudWatchTransport', () => {
  let transport: CloudWatchTransport;
  let mockClient: MockCloudWatchLogsClient;
  let mockFormatter: MockCloudWatchFormatter;
  let defaultConfig: CloudWatchTransportConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock CloudWatch client
    const { client, mock } = createMockCloudWatchLogsClient();
    mockClient = mock;
    
    // Create mock formatter
    mockFormatter = new MockCloudWatchFormatter();
    
    // Default configuration for tests
    defaultConfig = {
      region: 'us-east-1',
      logGroupName: 'test-log-group',
      logStreamName: 'test-log-stream',
      createLogGroup: true,
      createLogStream: true,
      batchSize: 10,
      flushInterval: 100,
      maxRetries: 3,
      retryBaseDelay: 50,
    };

    // Mock the CloudWatchLogsClient constructor
    (CloudWatchLogsClient as jest.Mock).mockImplementation(() => client);
  });

  afterEach(async () => {
    // Clean up resources
    if (transport) {
      await transport.cleanup();
    }
  });

  describe('initialization', () => {
    it('should create a CloudWatchTransport with default configuration', () => {
      // Act
      transport = new CloudWatchTransport({
        region: 'us-east-1',
        logGroupName: 'test-log-group',
      });

      // Assert
      expect(transport).toBeDefined();
      expect(CloudWatchLogsClient).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: undefined,
      });
    });

    it('should create a CloudWatchTransport with custom configuration', () => {
      // Arrange
      const config: CloudWatchTransportConfig = {
        region: 'eu-west-1',
        logGroupName: 'custom-log-group',
        logStreamName: 'custom-log-stream',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
        createLogGroup: false,
        createLogStream: false,
        retentionInDays: 30,
        batchSize: 100,
        flushInterval: 500,
        maxRetries: 5,
        retryBaseDelay: 200,
      };

      // Act
      transport = new CloudWatchTransport(config);

      // Assert
      expect(transport).toBeDefined();
      expect(CloudWatchLogsClient).toHaveBeenCalledWith({
        region: 'eu-west-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });

    it('should create a CloudWatchTransport with a custom formatter', () => {
      // Act
      transport = new CloudWatchTransport(defaultConfig, mockFormatter as unknown as CloudWatchFormatter);

      // Assert
      expect(transport).toBeDefined();
    });

    it('should generate a date-based log stream name if not provided', () => {
      // Arrange
      const configWithoutStream = { ...defaultConfig };
      delete configWithoutStream.logStreamName;
      
      // Mock date to ensure consistent test results
      const mockDate = new Date('2023-01-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      // Act
      transport = new CloudWatchTransport(configWithoutStream);

      // Assert
      expect(transport).toBeDefined();
      // The log stream name should be in the format YYYY-MM-DD
      expect(mockClient.createLogStreamCalls[0]?.logStreamName).toBe('2023-01-15');

      // Restore the original Date implementation
      jest.restoreAllMocks();
    });
  });

  describe('log group and stream management', () => {
    it('should check if log group exists during initialization', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.describeLogGroupsCalls.length).toBe(1);
      expect(mockClient.describeLogGroupsCalls[0].logGroupNamePrefix).toBe('test-log-group');
    });

    it('should create log group if it does not exist', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.createLogGroupCalls.length).toBe(1);
      expect(mockClient.createLogGroupCalls[0].logGroupName).toBe('test-log-group');
    });

    it('should not create log group if it already exists', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.createLogGroupCalls.length).toBe(0);
    });

    it('should set retention policy if specified', async () => {
      // Arrange
      const configWithRetention = { ...defaultConfig, retentionInDays: 30 };
      transport = new CloudWatchTransport(configWithRetention);
      mockClient.mockDescribeLogGroupsResponse([]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.putRetentionPolicyCalls.length).toBe(1);
      expect(mockClient.putRetentionPolicyCalls[0].logGroupName).toBe('test-log-group');
      expect(mockClient.putRetentionPolicyCalls[0].retentionInDays).toBe(30);
    });

    it('should check if log stream exists during initialization', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.describeLogStreamsCalls.length).toBe(1);
      expect(mockClient.describeLogStreamsCalls[0].logGroupName).toBe('test-log-group');
      expect(mockClient.describeLogStreamsCalls[0].logStreamNamePrefix).toBe('test-log-stream');
    });

    it('should create log stream if it does not exist', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.createLogStreamCalls.length).toBe(1);
      expect(mockClient.createLogStreamCalls[0].logGroupName).toBe('test-log-group');
      expect(mockClient.createLogStreamCalls[0].logStreamName).toBe('test-log-stream');
    });

    it('should not create log stream if it already exists', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);

      // Act
      await transport.initialize();

      // Assert
      expect(mockClient.createLogStreamCalls.length).toBe(0);
    });

    it('should get sequence token if log stream exists', async () => {
      // Arrange
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ 
        logStreamName: 'test-log-stream',
        uploadSequenceToken: 'test-sequence-token'
      }]);

      // Act
      await transport.initialize();

      // Assert
      // Verify the sequence token is used in the next PutLogEvents call
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      await transport.write(testEntry);
      await transport.flush();
      
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].sequenceToken).toBe('test-sequence-token');
    });

    it('should throw error if log group does not exist and createLogGroup is false', async () => {
      // Arrange
      const configWithoutCreate = { ...defaultConfig, createLogGroup: false };
      transport = new CloudWatchTransport(configWithoutCreate);
      mockClient.mockDescribeLogGroupsResponse([]);

      // Act & Assert
      await expect(transport.initialize()).rejects.toThrow(
        'Log group test-log-group does not exist and createLogGroup is false'
      );
    });

    it('should throw error if log stream does not exist and createLogStream is false', async () => {
      // Arrange
      const configWithoutCreate = { ...defaultConfig, createLogStream: false };
      transport = new CloudWatchTransport(configWithoutCreate);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([]);

      // Act & Assert
      await expect(transport.initialize()).rejects.toThrow(
        'Log stream test-log-stream does not exist and createLogStream is false'
      );
    });
  });

  describe('writing logs', () => {
    beforeEach(async () => {
      // Create and initialize transport
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);
      await transport.initialize();
    });

    it('should format and add log entry to batch', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };

      // Act
      await transport.write(testEntry);

      // Assert - No immediate PutLogEvents call since batch size is not reached
      expect(mockClient.putLogEventsCalls.length).toBe(0);
    });

    it('should flush logs when batch size is reached', async () => {
      // Arrange
      const entries: LogEntry[] = Array.from({ length: defaultConfig.batchSize! }, (_, i) => ({
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: `Test message ${i}`,
      }));

      // Act
      for (const entry of entries) {
        await transport.write(entry);
      }

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(defaultConfig.batchSize);
    });

    it('should flush logs when manually called', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };

      // Act
      await transport.write(testEntry);
      await transport.flush();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents[0].message).toBe('Test message');
    });

    it('should sort log events by timestamp', async () => {
      // Arrange
      const now = Date.now();
      const entries: LogEntry[] = [
        {
          timestamp: new Date(now + 2000),
          level: LogLevel.INFO,
          message: 'Message 3',
        },
        {
          timestamp: new Date(now),
          level: LogLevel.INFO,
          message: 'Message 1',
        },
        {
          timestamp: new Date(now + 1000),
          level: LogLevel.INFO,
          message: 'Message 2',
        },
      ];

      // Act
      for (const entry of entries) {
        await transport.write(entry);
      }
      await transport.flush();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(3);
      expect(mockClient.putLogEventsCalls[0].logEvents[0].message).toBe('Message 1');
      expect(mockClient.putLogEventsCalls[0].logEvents[1].message).toBe('Message 2');
      expect(mockClient.putLogEventsCalls[0].logEvents[2].message).toBe('Message 3');
    });

    it('should update sequence token after successful put', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      mockClient.mockPutLogEventsResponse('new-sequence-token');

      // Act
      await transport.write(testEntry);
      await transport.flush();
      
      // Write another entry to verify sequence token is used
      await transport.write(testEntry);
      await transport.flush();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(2);
      expect(mockClient.putLogEventsCalls[1].sequenceToken).toBe('new-sequence-token');
    });

    it('should handle string and object formatted entries', async () => {
      // Arrange
      const stringEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'String message',
      };
      
      const objectEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Object message',
        metadata: { key: 'value' },
      };

      // Mock formatter to return string for first call and object for second call
      const mockFormat = jest.spyOn(CloudWatchFormatter.prototype, 'format');
      mockFormat.mockReturnValueOnce('Formatted string message');
      mockFormat.mockReturnValueOnce({ formatted: 'object message' });

      // Act
      await transport.write(stringEntry);
      await transport.write(objectEntry);
      await transport.flush();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(2);
      expect(mockClient.putLogEventsCalls[0].logEvents[0].message).toBe('Formatted string message');
      expect(mockClient.putLogEventsCalls[0].logEvents[1].message).toBe('{"formatted":"object message"}');

      // Restore the original implementation
      mockFormat.mockRestore();
    });
  });

  describe('error handling and retries', () => {
    beforeEach(async () => {
      // Create and initialize transport
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);
      await transport.initialize();
    });

    it('should retry on ThrottlingException', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // First call throws ThrottlingException, second call succeeds
      const throttlingError = createThrottlingException('Throttling error');
      mockClient.mockErrorFor('PutLogEventsCommand', throttlingError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      
      // Clear the error to allow the retry to succeed
      mockClient.mockErrorFor('PutLogEventsCommand', null as any);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.putLogEventsCalls.length).toBe(2); // Initial call + 1 retry
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should retry on ServiceUnavailableException', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // First call throws ServiceUnavailableException, second call succeeds
      const unavailableError = createServiceUnavailableException('Service unavailable');
      mockClient.mockErrorFor('PutLogEventsCommand', unavailableError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      
      // Clear the error to allow the retry to succeed
      mockClient.mockErrorFor('PutLogEventsCommand', null as any);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.putLogEventsCalls.length).toBe(2); // Initial call + 1 retry
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should recreate log group on ResourceNotFoundException with log group message', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // Create error with log group message
      const resourceError = createResourceNotFoundException('The specified log group does not exist');
      mockClient.mockErrorFor('PutLogEventsCommand', resourceError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      
      // Clear the error to allow the retry to succeed
      mockClient.mockErrorFor('PutLogEventsCommand', null as any);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.describeLogGroupsCalls.length).toBeGreaterThan(1); // Additional call to check log group
      expect(mockClient.putLogEventsCalls.length).toBe(2); // Initial call + 1 retry
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should recreate log stream on ResourceNotFoundException with log stream message', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // Create error with log stream message
      const resourceError = createResourceNotFoundException('The specified log stream does not exist');
      mockClient.mockErrorFor('PutLogEventsCommand', resourceError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      
      // Clear the error to allow the retry to succeed
      mockClient.mockErrorFor('PutLogEventsCommand', null as any);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.describeLogStreamsCalls.length).toBeGreaterThan(1); // Additional call to check log stream
      expect(mockClient.putLogEventsCalls.length).toBe(2); // Initial call + 1 retry
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should extract sequence token from error message', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // Create error with sequence token in message
      const invalidSeqError = new Error('The given sequenceToken is invalid. The next expected sequenceToken is: 12345');
      mockClient.mockErrorFor('PutLogEventsCommand', invalidSeqError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      
      // Clear the error to allow the retry to succeed
      mockClient.mockErrorFor('PutLogEventsCommand', null as any);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.putLogEventsCalls.length).toBe(2); // Initial call + 1 retry
      expect(mockClient.putLogEventsCalls[1].sequenceToken).toBe('12345'); // Should extract token from error
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should give up after max retries', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // Always throw ThrottlingException
      const throttlingError = createThrottlingException('Throttling error');
      mockClient.mockErrorFor('PutLogEventsCommand', throttlingError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockClient.putLogEventsCalls.length).toBe(4); // Initial call + 3 retries (maxRetries)
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle non-AWS errors', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      // Create a generic error
      const genericError = new Error('Generic error');
      mockClient.mockErrorFor('PutLogEventsCommand', genericError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.write(testEntry);
      await transport.flush();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending logs to CloudWatch:', genericError);
      expect(mockClient.putLogEventsCalls.length).toBe(1); // No retries for non-AWS errors
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      // Create and initialize transport
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);
      await transport.initialize();
    });

    it('should flush remaining logs during cleanup', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      await transport.write(testEntry);

      // Act
      await transport.cleanup();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(1);
    });

    it('should not process new logs after cleanup', async () => {
      // Arrange
      await transport.cleanup();

      // Act
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message after cleanup',
      };
      await transport.write(testEntry);
      await transport.flush();

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(0);
    });

    it('should handle errors during cleanup flush', async () => {
      // Arrange
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      await transport.write(testEntry);
      
      // Create an error for PutLogEvents
      const genericError = new Error('Error during cleanup');
      mockClient.mockErrorFor('PutLogEventsCommand', genericError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await transport.cleanup();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error flushing logs during cleanup:', genericError);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('flush timer', () => {
    it('should flush logs on timer', async () => {
      // Arrange
      jest.useFakeTimers();
      
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);
      await transport.initialize();
      
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      await transport.write(testEntry);

      // Act
      jest.advanceTimersByTime(defaultConfig.flushInterval! + 10);
      
      // Need to wait for the async flush to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(mockClient.putLogEventsCalls.length).toBe(1);
      expect(mockClient.putLogEventsCalls[0].logEvents.length).toBe(1);
      
      // Cleanup
      jest.useRealTimers();
    });

    it('should handle errors during timer-based flush', async () => {
      // Arrange
      jest.useFakeTimers();
      
      transport = new CloudWatchTransport(defaultConfig);
      mockClient.mockDescribeLogGroupsResponse([{ logGroupName: 'test-log-group' }]);
      mockClient.mockDescribeLogStreamsResponse([{ logStreamName: 'test-log-stream' }]);
      await transport.initialize();
      
      const testEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      await transport.write(testEntry);
      
      // Create an error for PutLogEvents
      const genericError = new Error('Error during timer flush');
      mockClient.mockErrorFor('PutLogEventsCommand', genericError);
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      jest.advanceTimersByTime(defaultConfig.flushInterval! + 10);
      
      // Need to wait for the async flush to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error flushing logs:', genericError);
      
      // Cleanup
      jest.useRealTimers();
      consoleErrorSpy.mockRestore();
    });
  });
});