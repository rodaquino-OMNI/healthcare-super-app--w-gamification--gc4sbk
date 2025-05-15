import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Test suite for the CloudWatch formatter that verifies its ability to transform
 * log entries into a format optimized for AWS CloudWatch Logs.
 */
describe('CloudWatchFormatter', () => {
  let formatter: CloudWatchFormatter;
  
  // Sample log entries for testing
  const basicLogEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    level: LogLevel.INFO,
    message: 'Test message',
    context: { service: 'test-service' }
  };

  const errorLogEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    level: LogLevel.ERROR,
    message: 'Error occurred',
    context: { 
      service: 'test-service',
      requestId: '123456',
      userId: 'user-123',
      journey: 'health'
    },
    error: new Error('Test error'),
    traceId: 'trace-123',
    spanId: 'span-456'
  };

  beforeEach(() => {
    formatter = new CloudWatchFormatter();
  });

  describe('Basic Formatting', () => {
    it('should implement the Formatter interface', () => {
      expect(formatter.format).toBeDefined();
      expect(typeof formatter.format).toBe('function');
    });

    it('should return a string or object when formatting a log entry', () => {
      const result = formatter.format(basicLogEntry);
      expect(result).toBeDefined();
    });

    it('should include all required fields from the log entry', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('context');
    });
  });

  describe('CloudWatch-Specific Formatting', () => {
    it('should format timestamps in CloudWatch-compatible ISO8601 format', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      // CloudWatch expects ISO8601 format
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.timestamp).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should add AWS-specific metadata fields', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      // AWS metadata fields for enhanced filtering
      expect(result).toHaveProperty('aws');
      expect(result.aws).toHaveProperty('region');
      expect(result.aws).toHaveProperty('accountId');
      expect(result.aws).toHaveProperty('requestId');
    });

    it('should add environment information for filtering', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('service');
    });

    it('should structure context for efficient CloudWatch Logs Insights queries', () => {
      const result = JSON.parse(formatter.format(errorLogEntry) as string);
      
      // Context fields should be at the top level for easier querying
      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('journey');
      expect(result.requestId).toBe('123456');
      expect(result.userId).toBe('user-123');
      expect(result.journey).toBe('health');
    });

    it('should include trace correlation IDs at the top level', () => {
      const result = JSON.parse(formatter.format(errorLogEntry) as string);
      
      expect(result).toHaveProperty('traceId');
      expect(result).toHaveProperty('spanId');
      expect(result.traceId).toBe('trace-123');
      expect(result.spanId).toBe('span-456');
    });
  });

  describe('Error Formatting', () => {
    it('should format errors in a CloudWatch-optimized structure', () => {
      const result = JSON.parse(formatter.format(errorLogEntry) as string);
      
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('stack');
      expect(result.error).toHaveProperty('name');
      expect(result.error.message).toBe('Test error');
      expect(result.error.name).toBe('Error');
    });

    it('should add error detection fields for CloudWatch Logs Insights', () => {
      const result = JSON.parse(formatter.format(errorLogEntry) as string);
      
      // Special field for error filtering in CloudWatch
      expect(result).toHaveProperty('errorFlag');
      expect(result.errorFlag).toBe(true);
    });

    it('should handle nested errors in a CloudWatch-friendly way', () => {
      const nestedError = new Error('Outer error');
      (nestedError as any).cause = new Error('Inner error');
      
      const entryWithNestedError: LogEntry = {
        ...errorLogEntry,
        error: nestedError
      };
      
      const result = JSON.parse(formatter.format(entryWithNestedError) as string);
      
      expect(result.error).toHaveProperty('cause');
      expect(result.error.cause).toHaveProperty('message');
      expect(result.error.cause).toHaveProperty('name');
      expect(result.error.cause.message).toBe('Inner error');
    });
  });

  describe('CloudWatch Logs Insights Query Compatibility', () => {
    it('should format log levels as strings for better filtering', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(typeof result.level).toBe('string');
      expect(result.level).toBe('INFO');
    });

    it('should add a numeric log level for range queries', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result).toHaveProperty('levelNumber');
      expect(typeof result.levelNumber).toBe('number');
    });

    it('should include a searchable message field', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Test message');
    });

    it('should add a timestamp epoch field for time-based queries', () => {
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result).toHaveProperty('timestampEpoch');
      expect(typeof result.timestampEpoch).toBe('number');
      expect(result.timestampEpoch).toBe(new Date('2023-01-01T12:00:00Z').getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle log entries with missing context', () => {
      const entryWithoutContext: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'No context',
        context: undefined
      };
      
      expect(() => formatter.format(entryWithoutContext)).not.toThrow();
      const result = JSON.parse(formatter.format(entryWithoutContext) as string);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('No context');
    });

    it('should handle log entries with circular references', () => {
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject;
      
      const entryWithCircular: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Circular reference',
        context: { circular: circularObject }
      };
      
      expect(() => formatter.format(entryWithCircular)).not.toThrow();
      const result = JSON.parse(formatter.format(entryWithCircular) as string);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Circular reference');
    });

    it('should handle very large log entries efficiently', () => {
      // Create a large object with many nested properties
      const largeObject = {};
      for (let i = 0; i < 100; i++) {
        (largeObject as any)[`property${i}`] = {
          nestedValue: `value${i}`,
          deepNested: {
            evenDeeper: {
              veryDeep: `deep${i}`
            }
          }
        };
      }
      
      const largeEntry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Large log entry',
        context: { large: largeObject }
      };
      
      expect(() => formatter.format(largeEntry)).not.toThrow();
      const result = JSON.parse(formatter.format(largeEntry) as string);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Large log entry');
    });
  });

  describe('AWS Environment Detection', () => {
    const originalEnv = process.env;
    
    beforeEach(() => {
      // Reset environment variables before each test
      process.env = { ...originalEnv };
    });
    
    afterAll(() => {
      // Restore original environment variables after all tests
      process.env = originalEnv;
    });
    
    it('should detect AWS Lambda environment', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      process.env.AWS_REGION = 'us-east-1';
      
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result.aws).toHaveProperty('lambda');
      expect(result.aws.lambda).toHaveProperty('functionName');
      expect(result.aws.lambda.functionName).toBe('test-function');
      expect(result.aws.region).toBe('us-east-1');
    });
    
    it('should detect AWS ECS environment', () => {
      process.env.ECS_CONTAINER_METADATA_URI = 'http://ecs-metadata';
      
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result.aws).toHaveProperty('ecs');
      expect(result.aws.ecs).toBeDefined();
    });
    
    it('should detect AWS EC2 environment', () => {
      process.env.EC2_INSTANCE_ID = 'i-12345';
      
      const result = JSON.parse(formatter.format(basicLogEntry) as string);
      
      expect(result.aws).toHaveProperty('ec2');
      expect(result.aws.ec2).toHaveProperty('instanceId');
      expect(result.aws.ec2.instanceId).toBe('i-12345');
    });
  });
});