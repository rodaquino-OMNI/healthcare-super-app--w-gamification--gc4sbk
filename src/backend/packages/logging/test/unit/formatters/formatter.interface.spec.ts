import { Formatter, LogEntry, LogLevel, JourneyType } from '../../../src/formatters/formatter.interface';
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

/**
 * Mock implementation of the Formatter interface for testing purposes.
 * This allows us to test the interface contract without relying on actual implementations.
 */
class MockFormatter implements Formatter {
  /**
   * Simple implementation that returns a string representation of the log entry
   */
  format(entry: LogEntry): string {
    return `MOCK: ${entry.level} - ${entry.message}`;
  }
}

/**
 * Test suite for verifying that all formatter implementations correctly adhere to the Formatter interface contract.
 * These tests ensure that each formatter properly implements the format method with the expected signature and behavior,
 * and that the LogEntry interface accurately represents log entry structure.
 */
describe('Formatter Interface', () => {
  // Sample log entry for testing
  const sampleLogEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    level: LogLevel.INFO,
    message: 'Test message',
    context: 'TestContext',
    metadata: { test: 'value' },
    traceId: 'trace-123',
    spanId: 'span-456',
    userId: 'user-789',
    requestId: 'req-abc',
    journey: JourneyType.HEALTH,
    service: 'test-service',
    environment: 'test'
  };

  // Sample error log entry for testing
  const errorLogEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    level: LogLevel.ERROR,
    message: 'Error occurred',
    error: new Error('Test error'),
    context: 'ErrorContext',
    service: 'test-service'
  };

  describe('Interface Contract', () => {
    it('should define a format method that accepts a LogEntry and returns string or object', () => {
      // Arrange
      const formatter: Formatter = new MockFormatter();
      
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should allow implementation to return either string or object', () => {
      // This test verifies the TypeScript interface allows both return types
      // We'll create a mock implementation that returns an object
      const objectFormatter: Formatter = {
        format: (entry: LogEntry): Record<string, any> => {
          return { formatted: entry.message };
        }
      };

      // And another that returns a string
      const stringFormatter: Formatter = {
        format: (entry: LogEntry): string => {
          return entry.message;
        }
      };

      // Both should be valid implementations of the Formatter interface
      expect(objectFormatter.format(sampleLogEntry)).toEqual({ formatted: 'Test message' });
      expect(stringFormatter.format(sampleLogEntry)).toBe('Test message');
    });
  });

  describe('LogEntry Interface', () => {
    it('should accept all required fields', () => {
      // Minimal required fields
      const minimalEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Minimal message'
      };

      // Should be a valid LogEntry
      expect(() => validateLogEntry(minimalEntry)).not.toThrow();
    });

    it('should accept all optional fields', () => {
      // Complete entry with all fields
      const completeEntry: LogEntry = { ...sampleLogEntry };

      // Should be a valid LogEntry
      expect(() => validateLogEntry(completeEntry)).not.toThrow();
    });

    it('should validate LogLevel enum values', () => {
      // Test all valid log levels
      const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
      
      for (const level of logLevels) {
        const entry: LogEntry = { ...sampleLogEntry, level };
        expect(() => validateLogEntry(entry)).not.toThrow();
      }
    });

    it('should validate JourneyType enum values', () => {
      // Test all valid journey types
      const journeyTypes = [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN];
      
      for (const journey of journeyTypes) {
        const entry: LogEntry = { ...sampleLogEntry, journey };
        expect(() => validateLogEntry(entry)).not.toThrow();
      }
    });

    it('should handle Error objects in the error field', () => {
      // Entry with Error object
      const entry: LogEntry = { ...sampleLogEntry, error: new Error('Test error') };
      
      // Should be a valid LogEntry
      expect(() => validateLogEntry(entry)).not.toThrow();
    });

    it('should handle string errors in the error field', () => {
      // Entry with string error
      const entry: LogEntry = { ...sampleLogEntry, error: 'String error message' };
      
      // Should be a valid LogEntry
      expect(() => validateLogEntry(entry)).not.toThrow();
    });
  });

  describe('JsonFormatter Implementation', () => {
    let formatter: JsonFormatter;

    beforeEach(() => {
      formatter = new JsonFormatter();
    });

    it('should implement the Formatter interface', () => {
      // Verify it's an instance of Formatter
      expect(formatter).toBeInstanceOf(Object);
      expect(typeof formatter.format).toBe('function');
    });

    it('should return a string from format method', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert
      expect(typeof result).toBe('string');
    });

    it('should produce valid JSON output', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert - should be parseable as JSON
      expect(() => JSON.parse(result as string)).not.toThrow();
      const parsed = JSON.parse(result as string);
      
      // Verify essential fields are present
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level');
      expect(parsed).toHaveProperty('message', 'Test message');
    });

    it('should handle error objects correctly', () => {
      // Act
      const result = formatter.format(errorLogEntry);
      
      // Assert
      const parsed = JSON.parse(result as string);
      expect(parsed).toHaveProperty('error');
      expect(parsed.error).toHaveProperty('message', 'Test error');
      expect(parsed.error).toHaveProperty('name', 'Error');
      expect(parsed.error).toHaveProperty('stack');
    });

    it('should handle edge cases and null values', () => {
      // Entry with null/undefined values
      const edgeCaseEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Edge case',
        metadata: { nullValue: null, undefinedValue: undefined }
      };
      
      // Act
      const result = formatter.format(edgeCaseEntry);
      
      // Assert - should not throw and handle nulls properly
      expect(() => JSON.parse(result as string)).not.toThrow();
    });
  });

  describe('TextFormatter Implementation', () => {
    let formatter: TextFormatter;

    beforeEach(() => {
      // Disable colors for consistent testing
      formatter = new TextFormatter({ colors: false });
    });

    it('should implement the Formatter interface', () => {
      // Verify it's an instance of Formatter
      expect(formatter).toBeInstanceOf(Object);
      expect(typeof formatter.format).toBe('function');
    });

    it('should return a string from format method', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert
      expect(typeof result).toBe('string');
    });

    it('should include essential log information in output', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert - should contain essential information
      expect(result).toContain('Test message');
      expect(result).toContain('INFO');
      // Should contain timestamp in some format
      expect(result).toContain('2023-01-01');
    });

    it('should handle error objects correctly', () => {
      // Act
      const result = formatter.format(errorLogEntry);
      
      // Assert
      expect(result).toContain('Error occurred');
      expect(result).toContain('Test error');
      expect(result).toContain('ERROR');
    });

    it('should handle different formatter options', () => {
      // Formatter with different options
      const noTimestampFormatter = new TextFormatter({ 
        colors: false, 
        timestamps: false 
      });
      
      // Act
      const result = noTimestampFormatter.format(sampleLogEntry);
      
      // Assert - should not contain timestamp format
      expect(result).not.toContain('[2023-01-01');
      expect(result).toContain('Test message');
    });
  });

  describe('CloudWatchFormatter Implementation', () => {
    let formatter: CloudWatchFormatter;

    beforeEach(() => {
      formatter = new CloudWatchFormatter();
    });

    it('should implement the Formatter interface', () => {
      // Verify it's an instance of Formatter
      expect(formatter).toBeInstanceOf(Object);
      expect(typeof formatter.format).toBe('function');
    });

    it('should return a string from format method', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert
      expect(typeof result).toBe('string');
    });

    it('should produce valid JSON output with CloudWatch-specific fields', () => {
      // Act
      const result = formatter.format(sampleLogEntry);
      
      // Assert - should be parseable as JSON
      expect(() => JSON.parse(result as string)).not.toThrow();
      const parsed = JSON.parse(result as string);
      
      // Verify CloudWatch-specific fields
      expect(parsed).toHaveProperty('aws');
      expect(parsed.aws).toHaveProperty('service');
      expect(parsed.aws).toHaveProperty('environment');
      expect(parsed.aws).toHaveProperty('region');
      
      // Verify essential fields are present
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('logLevel');
      expect(parsed).toHaveProperty('message', 'Test message');
    });

    it('should handle error objects correctly with CloudWatch optimizations', () => {
      // Act
      const result = formatter.format(errorLogEntry);
      
      // Assert
      const parsed = JSON.parse(result as string);
      expect(parsed).toHaveProperty('error');
      expect(parsed.error).toHaveProperty('message', 'Test error');
      expect(parsed.error).toHaveProperty('name', 'Error');
      expect(parsed.error).toHaveProperty('stack');
    });

    it('should extend JsonFormatter functionality', () => {
      // CloudWatchFormatter should be an extension of JsonFormatter
      expect(formatter).toBeInstanceOf(JsonFormatter);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    // Test formatters
    let jsonFormatter: JsonFormatter;
    let textFormatter: TextFormatter;
    let cloudWatchFormatter: CloudWatchFormatter;

    beforeEach(() => {
      jsonFormatter = new JsonFormatter();
      textFormatter = new TextFormatter({ colors: false });
      cloudWatchFormatter = new CloudWatchFormatter();
    });

    it('should handle minimal log entries with only required fields', () => {
      // Minimal entry
      const minimalEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Minimal message'
      };
      
      // All formatters should handle this without errors
      expect(() => jsonFormatter.format(minimalEntry)).not.toThrow();
      expect(() => textFormatter.format(minimalEntry)).not.toThrow();
      expect(() => cloudWatchFormatter.format(minimalEntry)).not.toThrow();
    });

    it('should handle entries with null or undefined optional fields', () => {
      // Entry with explicit null/undefined values
      const nullEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Null fields',
        context: null as any, // Force null for testing
        metadata: undefined,
        traceId: null as any,
        userId: undefined
      };
      
      // All formatters should handle this without errors
      expect(() => jsonFormatter.format(nullEntry)).not.toThrow();
      expect(() => textFormatter.format(nullEntry)).not.toThrow();
      expect(() => cloudWatchFormatter.format(nullEntry)).not.toThrow();
    });

    it('should handle complex nested objects in metadata', () => {
      // Entry with complex nested metadata
      const complexEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Complex metadata',
        metadata: {
          nested: {
            deeply: {
              array: [1, 2, { test: 'value' }],
              map: new Map([['key', 'value']]),
              set: new Set([1, 2, 3]),
              date: new Date(),
              regex: /test/g
            }
          }
        }
      };
      
      // All formatters should handle this without errors
      expect(() => jsonFormatter.format(complexEntry)).not.toThrow();
      expect(() => textFormatter.format(complexEntry)).not.toThrow();
      expect(() => cloudWatchFormatter.format(complexEntry)).not.toThrow();
    });

    it('should handle circular references in objects', () => {
      // Create object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      const circularEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Circular reference',
        metadata: { circular }
      };
      
      // All formatters should handle this without errors
      expect(() => jsonFormatter.format(circularEntry)).not.toThrow();
      expect(() => textFormatter.format(circularEntry)).not.toThrow();
      expect(() => cloudWatchFormatter.format(circularEntry)).not.toThrow();
    });

    it('should handle very large log messages', () => {
      // Create a very large message
      const largeMessage = 'A'.repeat(10000);
      
      const largeEntry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: largeMessage
      };
      
      // All formatters should handle this without errors
      expect(() => jsonFormatter.format(largeEntry)).not.toThrow();
      expect(() => textFormatter.format(largeEntry)).not.toThrow();
      expect(() => cloudWatchFormatter.format(largeEntry)).not.toThrow();
    });
  });
});

/**
 * Helper function to validate a LogEntry object.
 * This is used for testing the LogEntry interface compliance.
 * 
 * @param entry The log entry to validate
 * @throws Error if the entry is invalid
 */
function validateLogEntry(entry: LogEntry): void {
  // Check required fields
  if (!(entry.timestamp instanceof Date)) {
    throw new Error('timestamp must be a Date object');
  }
  
  if (typeof entry.level !== 'number' || !(entry.level in LogLevel)) {
    throw new Error('level must be a valid LogLevel enum value');
  }
  
  if (typeof entry.message !== 'string') {
    throw new Error('message must be a string');
  }
  
  // Check optional fields if present
  if (entry.context !== undefined && entry.context !== null && typeof entry.context !== 'string' && typeof entry.context !== 'object') {
    throw new Error('context must be a string or object if provided');
  }
  
  if (entry.error !== undefined && !(entry.error instanceof Error) && typeof entry.error !== 'string') {
    throw new Error('error must be an Error object or string if provided');
  }
  
  if (entry.metadata !== undefined && (entry.metadata === null || typeof entry.metadata !== 'object')) {
    throw new Error('metadata must be an object if provided');
  }
  
  if (entry.traceId !== undefined && entry.traceId !== null && typeof entry.traceId !== 'string') {
    throw new Error('traceId must be a string if provided');
  }
  
  if (entry.spanId !== undefined && entry.spanId !== null && typeof entry.spanId !== 'string') {
    throw new Error('spanId must be a string if provided');
  }
  
  if (entry.userId !== undefined && entry.userId !== null && typeof entry.userId !== 'string') {
    throw new Error('userId must be a string if provided');
  }
  
  if (entry.requestId !== undefined && entry.requestId !== null && typeof entry.requestId !== 'string') {
    throw new Error('requestId must be a string if provided');
  }
  
  if (entry.journey !== undefined && entry.journey !== null && !(entry.journey in JourneyType)) {
    throw new Error('journey must be a valid JourneyType enum value if provided');
  }
  
  if (entry.service !== undefined && entry.service !== null && typeof entry.service !== 'string') {
    throw new Error('service must be a string if provided');
  }
  
  if (entry.environment !== undefined && entry.environment !== null && typeof entry.environment !== 'string') {
    throw new Error('environment must be a string if provided');
  }
}