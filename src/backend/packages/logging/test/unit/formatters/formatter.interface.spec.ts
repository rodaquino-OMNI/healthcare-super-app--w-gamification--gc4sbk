import { Formatter } from '../../../src/formatters/formatter.interface';
import { LogEntry } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { JsonFormatter } from '../../../src/formatters/json.formatter';
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

/**
 * Mock formatter implementation for testing interface compliance
 */
class MockFormatter implements Formatter {
  format(entry: LogEntry): string {
    return `MOCK: ${entry.level} - ${entry.message}`;
  }
}

/**
 * Test suite for verifying that all formatter implementations correctly
 * adhere to the Formatter interface contract.
 */
describe('Formatter Interface', () => {
  // Sample log entries for testing
  const basicLogEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00Z'),
    level: LogLevel.INFO,
    message: 'Test message',
    context: { service: 'test-service' }
  };

  const complexLogEntry: LogEntry = {
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

  describe('Interface Contract', () => {
    it('should define a format method that accepts a LogEntry and returns a string or object', () => {
      // This test verifies the interface structure through TypeScript compilation
      // If the interface is incorrectly defined, this test will fail to compile
      const formatter: Formatter = new MockFormatter();
      const result = formatter.format(basicLogEntry);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should allow formatters to return either string or object', () => {
      // Define a formatter that returns an object
      const objectFormatter: Formatter = {
        format: (entry: LogEntry) => ({ formatted: `${entry.level}: ${entry.message}` })
      };

      // Define a formatter that returns a string
      const stringFormatter: Formatter = {
        format: (entry: LogEntry) => `${entry.level}: ${entry.message}`
      };

      // Both should be valid implementations
      expect(objectFormatter.format(basicLogEntry)).toHaveProperty('formatted');
      expect(typeof stringFormatter.format(basicLogEntry)).toBe('string');
    });
  });

  describe('LogEntry Interface', () => {
    it('should define required fields for log entries', () => {
      // This test verifies the LogEntry interface structure through TypeScript compilation
      // If the interface is incorrectly defined, this test will fail to compile
      const entry: LogEntry = basicLogEntry;
      
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.level).toBeDefined();
      expect(entry.message).toBeDefined();
      expect(entry.context).toBeDefined();
    });

    it('should support optional fields for enhanced logging', () => {
      // This test verifies optional fields in the LogEntry interface
      const entry: LogEntry = complexLogEntry;
      
      expect(entry.error).toBeInstanceOf(Error);
      expect(entry.traceId).toBeDefined();
      expect(entry.spanId).toBeDefined();
    });

    it('should support journey-specific context information', () => {
      // This test verifies that journey context can be included
      const entry: LogEntry = complexLogEntry;
      
      expect(entry.context.journey).toBe('health');
      expect(entry.context.userId).toBeDefined();
      expect(entry.context.requestId).toBeDefined();
    });
  });

  describe('Formatter Implementations', () => {
    // Create instances of each formatter
    const jsonFormatter = new JsonFormatter();
    const textFormatter = new TextFormatter();
    const cloudWatchFormatter = new CloudWatchFormatter();
    const mockFormatter = new MockFormatter();

    it('should verify that JsonFormatter implements the Formatter interface', () => {
      expect(jsonFormatter.format).toBeDefined();
      expect(typeof jsonFormatter.format).toBe('function');
      
      const result = jsonFormatter.format(basicLogEntry);
      expect(result).toBeDefined();
    });

    it('should verify that TextFormatter implements the Formatter interface', () => {
      expect(textFormatter.format).toBeDefined();
      expect(typeof textFormatter.format).toBe('function');
      
      const result = textFormatter.format(basicLogEntry);
      expect(result).toBeDefined();
    });

    it('should verify that CloudWatchFormatter implements the Formatter interface', () => {
      expect(cloudWatchFormatter.format).toBeDefined();
      expect(typeof cloudWatchFormatter.format).toBe('function');
      
      const result = cloudWatchFormatter.format(basicLogEntry);
      expect(result).toBeDefined();
    });

    it('should verify that MockFormatter implements the Formatter interface', () => {
      expect(mockFormatter.format).toBeDefined();
      expect(typeof mockFormatter.format).toBe('function');
      
      const result = mockFormatter.format(basicLogEntry);
      expect(result).toBeDefined();
      expect(result).toContain('MOCK:');
      expect(result).toContain(LogLevel[basicLogEntry.level]);
      expect(result).toContain(basicLogEntry.message);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const formatter = new MockFormatter();

    it('should handle log entries with undefined context', () => {
      const entryWithoutContext: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'No context',
        context: undefined
      };

      expect(() => formatter.format(entryWithoutContext)).not.toThrow();
    });

    it('should handle log entries with circular references', () => {
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject;

      const entryWithCircular: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Circular reference',
        context: { circular: circularObject }
      };

      expect(() => formatter.format(entryWithCircular)).not.toThrow();
    });

    it('should handle log entries with complex error objects', () => {
      const complexError = new Error('Complex error');
      (complexError as any).customField = 'custom value';
      (complexError as any).nestedError = new Error('Nested error');

      const entryWithComplexError: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'Complex error object',
        context: { service: 'test' },
        error: complexError
      };

      expect(() => formatter.format(entryWithComplexError)).not.toThrow();
    });
  });

  describe('Type Checking', () => {
    it('should enforce type safety for the format method', () => {
      // This test verifies type safety through TypeScript compilation
      // If the types are incorrectly defined, this test will fail to compile
      const formatter: Formatter = new MockFormatter();
      
      // @ts-expect-error - This should cause a TypeScript error because the argument is not a LogEntry
      formatter.format('not a log entry');
      
      // @ts-expect-error - This should cause a TypeScript error because the argument is missing required fields
      formatter.format({ message: 'Incomplete entry' });
    });

    it('should enforce type safety for the LogEntry interface', () => {
      // This test verifies type safety through TypeScript compilation
      // If the types are incorrectly defined, this test will fail to compile
      
      // @ts-expect-error - This should cause a TypeScript error because timestamp is missing
      const invalidEntry1: LogEntry = {
        level: LogLevel.INFO,
        message: 'Missing timestamp',
        context: {}
      };
      
      // @ts-expect-error - This should cause a TypeScript error because level is missing
      const invalidEntry2: LogEntry = {
        timestamp: new Date(),
        message: 'Missing level',
        context: {}
      };
      
      // @ts-expect-error - This should cause a TypeScript error because message is missing
      const invalidEntry3: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        context: {}
      };
    });
  });
});