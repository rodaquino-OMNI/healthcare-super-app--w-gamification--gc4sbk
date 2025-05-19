import { Test } from '@nestjs/testing';
import { CloudWatchTransport } from '../../../src/transports/cloudwatch.transport';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
  const mockSend = jest.fn();
  return {
    CloudWatchLogsClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutLogEventsCommand: jest.fn(),
    CreateLogGroupCommand: jest.fn(),
    CreateLogStreamCommand: jest.fn(),
    DescribeLogStreamsCommand: jest.fn(),
  };
});

describe('CloudWatchTransport', () => {
  let transport: CloudWatchTransport;
  let mockCloudWatchLogsClient: jest.Mocked<CloudWatchLogsClient>;

  const mockConfig = {
    logGroupName: 'test-log-group',
    logStreamName: 'test-log-stream',
    region: 'us-east-1',
    createLogGroup: true,
    createLogStream: true,
    retryCount: 3,
    batchSize: 10,
    awsAccessKeyId: 'test-access-key',
    awsSecretAccessKey: 'test-secret-key',
    retentionInDays: 14,
  };

  const mockLogEntry: LogEntry = {
    level: LogLevel.INFO,
    message: 'Test log message',
    timestamp: new Date(),
    context: {
      requestId: 'req-123',
      userId: 'user-456',
      journey: 'health',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CloudWatchTransport,
          useFactory: () => new CloudWatchTransport(mockConfig),
        },
      ],
    }).compile();

    transport = moduleRef.get<CloudWatchTransport>(CloudWatchTransport);
    mockCloudWatchLogsClient = transport['client'] as jest.Mocked<CloudWatchLogsClient>;
  });

  describe('initialization', () => {
    it('should initialize with AWS configuration', () => {
      expect(CloudWatchLogsClient).toHaveBeenCalledWith({
        region: mockConfig.region,
        credentials: {
          accessKeyId: mockConfig.awsAccessKeyId,
          secretAccessKey: mockConfig.awsSecretAccessKey,
        },
      });
    });

    it('should create log group and stream if configured', async () => {
      // Setup the mock implementation for the initialization process
      (mockCloudWatchLogsClient.send as jest.Mock).mockImplementation((command) => {
        if (command instanceof CreateLogGroupCommand) {
          return Promise.resolve({});
        }
        if (command instanceof CreateLogStreamCommand) {
          return Promise.resolve({});
        }
        if (command instanceof DescribeLogStreamsCommand) {
          return Promise.resolve({
            logStreams: [],
          });
        }
        return Promise.resolve({});
      });

      // Call initialize method
      await transport.initialize();

      // Verify log group creation
      expect(CreateLogGroupCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
      });

      // Verify log stream creation
      expect(CreateLogStreamCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
      });
    });

    it('should handle existing log group error gracefully', async () => {
      // Mock AWS SDK to throw ResourceAlreadyExistsException for log group
      (mockCloudWatchLogsClient.send as jest.Mock).mockImplementationOnce(() => {
        const error = new Error('Log group already exists');
        error.name = 'ResourceAlreadyExistsException';
        return Promise.reject(error);
      }).mockImplementation(() => Promise.resolve({}));

      // Call initialize method
      await expect(transport.initialize()).resolves.not.toThrow();

      // Verify log group creation was attempted
      expect(CreateLogGroupCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
      });
    });

    it('should handle existing log stream error gracefully', async () => {
      // Mock AWS SDK to throw ResourceAlreadyExistsException for log stream
      (mockCloudWatchLogsClient.send as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve({});
      }).mockImplementationOnce(() => {
        const error = new Error('Log stream already exists');
        error.name = 'ResourceAlreadyExistsException';
        return Promise.reject(error);
      });

      // Call initialize method
      await expect(transport.initialize()).resolves.not.toThrow();

      // Verify log stream creation was attempted
      expect(CreateLogStreamCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
      });
    });

    it('should not create log group if disabled in config', async () => {
      // Create a new transport with createLogGroup set to false
      const customConfig = { ...mockConfig, createLogGroup: false };
      const customTransport = new CloudWatchTransport(customConfig);
      
      await customTransport.initialize();
      
      // Verify log group creation was not attempted
      expect(CreateLogGroupCommand).not.toHaveBeenCalled();
    });
  });

  describe('write', () => {
    beforeEach(async () => {
      // Mock successful initialization
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValue({});
      await transport.initialize();
      jest.clearAllMocks(); // Clear initialization calls
    });

    it('should format and send log entry to CloudWatch', async () => {
      // Mock successful PutLogEvents response
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValueOnce({
        nextSequenceToken: 'next-token-123',
      });

      await transport.write(mockLogEntry);

      // Verify PutLogEventsCommand was called with correct parameters
      expect(PutLogEventsCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: [
          {
            timestamp: expect.any(Number), // Timestamp in milliseconds
            message: expect.any(String),  // Formatted log message
          },
        ],
      });

      // Verify client.send was called with the command
      expect(mockCloudWatchLogsClient.send).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple log entries', async () => {
      // Create multiple log entries
      const logEntries = Array(15).fill(null).map((_, i) => ({
        ...mockLogEntry,
        message: `Test log message ${i}`,
      }));

      // Mock successful PutLogEvents responses
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValueOnce({
        nextSequenceToken: 'next-token-123',
      }).mockResolvedValueOnce({
        nextSequenceToken: 'next-token-456',
      });

      // Write all log entries
      for (const entry of logEntries) {
        await transport.write(entry);
      }

      // Verify PutLogEventsCommand was called twice (batch size is 10)
      expect(PutLogEventsCommand).toHaveBeenCalledTimes(2);
      
      // First batch should have 10 entries
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(1, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            message: expect.any(String),
          }),
        ]),
      });
      
      // Second batch should have 5 entries
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(2, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should use sequence token for subsequent requests', async () => {
      // Mock successful PutLogEvents responses with sequence tokens
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValueOnce({
        nextSequenceToken: 'token-1',
      }).mockResolvedValueOnce({
        nextSequenceToken: 'token-2',
      });

      // Write two log entries
      await transport.write(mockLogEntry);
      await transport.write({
        ...mockLogEntry,
        message: 'Second log message',
      });

      // First call should not include a sequence token
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(1, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
      });

      // Second call should include the sequence token from the first response
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(2, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
        sequenceToken: 'token-1',
      });
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      // Mock successful initialization
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValue({});
      await transport.initialize();
      jest.clearAllMocks(); // Clear initialization calls
    });

    it('should retry on transient errors', async () => {
      // Mock a transient error followed by success
      (mockCloudWatchLogsClient.send as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          nextSequenceToken: 'next-token-123',
        });

      await transport.write(mockLogEntry);

      // Verify send was called twice (initial + 1 retry)
      expect(mockCloudWatchLogsClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid sequence token errors', async () => {
      // Mock an InvalidSequenceTokenException followed by success
      const invalidSequenceError = new Error('Invalid sequence token');
      invalidSequenceError.name = 'InvalidSequenceTokenException';
      (invalidSequenceError as any).expectedSequenceToken = 'correct-token';

      (mockCloudWatchLogsClient.send as jest.Mock)
        .mockRejectedValueOnce(invalidSequenceError)
        .mockResolvedValueOnce({
          nextSequenceToken: 'next-token-123',
        });

      await transport.write(mockLogEntry);

      // Verify second attempt used the correct sequence token
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(2, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
        sequenceToken: 'correct-token',
      });
    });

    it('should handle DataAlreadyAcceptedException', async () => {
      // Mock a DataAlreadyAcceptedException with a next sequence token
      const dataAlreadyAcceptedError = new Error('Data already accepted');
      dataAlreadyAcceptedError.name = 'DataAlreadyAcceptedException';
      (dataAlreadyAcceptedError as any).expectedSequenceToken = 'next-token-456';

      (mockCloudWatchLogsClient.send as jest.Mock)
        .mockRejectedValueOnce(dataAlreadyAcceptedError);

      await transport.write(mockLogEntry);

      // Verify we stored the next sequence token for future use
      await transport.write({
        ...mockLogEntry,
        message: 'Second log message',
      });

      // Second write should use the token from the error
      expect(PutLogEventsCommand).toHaveBeenNthCalledWith(2, {
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
        sequenceToken: 'next-token-456',
      });
    });

    it('should give up after max retries', async () => {
      // Mock persistent failures
      (mockCloudWatchLogsClient.send as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await transport.write(mockLogEntry);

      // Verify send was called retryCount + 1 times (initial + retries)
      expect(mockCloudWatchLogsClient.send).toHaveBeenCalledTimes(mockConfig.retryCount + 1);
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send logs to CloudWatch after'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('log group and stream management', () => {
    it('should set retention policy if specified', async () => {
      // Mock the AWS SDK for retention policy
      const PutRetentionPolicyCommand = jest.fn();
      jest.mock('@aws-sdk/client-cloudwatch-logs', () => ({
        ...jest.requireActual('@aws-sdk/client-cloudwatch-logs'),
        PutRetentionPolicyCommand,
      }));

      // Mock successful responses
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValue({});

      await transport.initialize();

      // Verify retention policy was set
      expect(mockCloudWatchLogsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            logGroupName: mockConfig.logGroupName,
            retentionInDays: mockConfig.retentionInDays,
          },
        })
      );
    });

    it('should use existing log stream if available', async () => {
      // Mock DescribeLogStreamsCommand to return an existing stream
      (mockCloudWatchLogsClient.send as jest.Mock).mockImplementation((command) => {
        if (command instanceof DescribeLogStreamsCommand) {
          return Promise.resolve({
            logStreams: [
              {
                logStreamName: mockConfig.logStreamName,
                uploadSequenceToken: 'existing-token',
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      await transport.initialize();

      // Verify CreateLogStreamCommand was not called
      expect(CreateLogStreamCommand).not.toHaveBeenCalled();

      // Write a log entry and verify it uses the existing token
      jest.clearAllMocks();
      await transport.write(mockLogEntry);

      expect(PutLogEventsCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
        sequenceToken: 'existing-token',
      });
    });
  });

  describe('cleanup', () => {
    it('should flush pending logs on cleanup', async () => {
      // Mock successful PutLogEvents response
      (mockCloudWatchLogsClient.send as jest.Mock).mockResolvedValue({});

      // Add some logs but don't trigger a flush
      transport['logEvents'] = [
        {
          timestamp: Date.now(),
          message: JSON.stringify(mockLogEntry),
        },
      ];

      await transport.cleanup();

      // Verify logs were flushed
      expect(PutLogEventsCommand).toHaveBeenCalledWith({
        logGroupName: mockConfig.logGroupName,
        logStreamName: mockConfig.logStreamName,
        logEvents: expect.any(Array),
      });
    });

    it('should handle errors during cleanup flush', async () => {
      // Mock a failure during flush
      (mockCloudWatchLogsClient.send as jest.Mock).mockRejectedValue(new Error('Flush error'));

      // Add some logs but don't trigger a flush
      transport['logEvents'] = [
        {
          timestamp: Date.now(),
          message: JSON.stringify(mockLogEntry),
        },
      ];

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await transport.cleanup();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush logs during cleanup'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});