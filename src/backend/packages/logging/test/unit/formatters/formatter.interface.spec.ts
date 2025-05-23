import { Formatter, LogEntry as FormatterLogEntry } from '../../../src/formatters/formatter.interface';
import { LogEntry as InterfaceLogEntry, JourneyType } from '../../../src/interfaces/log-entry.interface';
import { LogLevel, LogLevelUtils } from '../../../src/interfaces/log-level.enum';
// Import formatters with consistent naming
import { JsonFormatter } from '../../../src/formatters/json.formatter';
const JSONFormatter = JsonFormatter; // Alias for consistent naming in tests
import { TextFormatter } from '../../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';

/**
 * Mock implementation of the Formatter interface for testing purposes.
 * This allows us to test the interface contract without relying on actual implementations.
 * 
 * The mock implementation simply returns a string representation of the log entry
 * with the message and level, which is sufficient for testing the interface contract.
 */
class MockFormatter implements Formatter {
  format(entry: FormatterLogEntry): string {
    return `MOCK: ${entry.message} [${entry.level}]`;
  }
}

/**
 * Adapter to convert between the two LogEntry interfaces.
 * This is needed because the formatter implementations use a different LogEntry interface
 * than the one defined in formatter.interface.ts.
 * 
 * The formatter.interface.ts defines LogEntry with string timestamp and string journey,
 * while interfaces/log-entry.interface.ts defines LogEntry with Date timestamp and JourneyContext journey.
 * This adapter handles the conversion between these two interfaces.
 */
function adaptLogEntry(entry: InterfaceLogEntry): FormatterLogEntry {
  return {
    message: entry.message,
    level: entry.level,
    timestamp: entry.timestamp.toISOString(),
    context: entry.contextData,
    service: entry.serviceName,
    error: entry.error,
    stack: entry.error?.stack,
    requestId: entry.requestId,
    userId: entry.userId,
    journey: entry.journey?.type,
    traceId: entry.traceId,
    spanId: entry.spanId,
    parentSpanId: entry.parentSpanId,
    metadata: entry.metadata
  };
}

/**
 * Creates a sample InterfaceLogEntry for testing.
 * This provides a consistent log entry structure for use in tests.
 * 
 * @returns A sample InterfaceLogEntry with typical values for all required fields
 */
function createSampleInterfaceLogEntry(): InterfaceLogEntry {
  return {
    message: 'Test message',
    level: LogLevel.INFO,
    timestamp: new Date(),
    serviceName: 'test-service',
    contextData: { requestId: '123', userId: '456' },
    journey: {
      type: JourneyType.HEALTH,
      resourceId: 'resource-123',
      action: 'view'
    }
  };
}

/**
 * Test suite for the Formatter interface contract.
 * These tests ensure that all formatter implementations correctly adhere to the interface.
 * 
 * This test suite verifies:
 * 1. The Formatter interface contract is properly defined and can be implemented
 * 2. The LogEntry interface structure is valid and can handle various field combinations
 * 3. All formatter implementations correctly implement the Formatter interface
 * 4. Edge cases and error handling are properly tested
 */
describe('Formatter Interface', () => {
  // Sample log entries for testing
  const sampleFormatterLogEntry: FormatterLogEntry = {
    message: 'Test message',
    level: LogLevel.INFO,
    timestamp: new Date().toISOString(),
    service: 'test-service',
    context: { requestId: '123', userId: '456' },
    journey: 'health',
  };
  
  const sampleInterfaceLogEntry = createSampleInterfaceLogEntry();

  describe('Interface Contract', () => {
    it('should define a format method that accepts a LogEntry and returns a string or object', () => {
      // Create an instance of the mock formatter
      const formatter: Formatter = new MockFormatter();
      
      // Verify the format method exists and returns the expected type
      const result = formatter.format(sampleFormatterLogEntry);
      expect(result).toBeDefined();
      expect(typeof result === 'string' || typeof result === 'object').toBeTruthy();
    });

    it('should allow implementation of the format method with different return types', () => {
      // Create a mock formatter that returns a string
      const stringFormatter: Formatter = {
        format: (entry: FormatterLogEntry): string => `String: ${entry.message}`
      };
      
      // Create a mock formatter that returns an object
      const objectFormatter: Formatter = {
        format: (entry: FormatterLogEntry): Record<string, any> => ({ formattedMessage: entry.message })
      };
      
      // Verify both implementations are valid
      expect(typeof stringFormatter.format(sampleFormatterLogEntry)).toBe('string');
      expect(typeof objectFormatter.format(sampleFormatterLogEntry)).toBe('object');
    });
  });

  describe('LogEntry Interface', () => {
    it('should validate the structure of the LogEntry interface', () => {
      // Create a complete log entry with all possible fields
      const completeLogEntry: FormatterLogEntry = {
        message: 'Complete test message',
        level: LogLevel.DEBUG,
        timestamp: new Date().toISOString(),
        context: { requestId: '123', userId: '456' },
        service: 'test-service',
        error: new Error('Test error'),
        stack: 'Error: Test error\n    at Object.<anonymous> (/test.ts:1:1)',
        requestId: 'req-123',
        userId: 'user-456',
        journey: 'care',
        traceId: 'trace-789',
        spanId: 'span-101',
        parentSpanId: 'span-100',
        metadata: { test: true, count: 42 }
      };
      
      // Verify the log entry is valid according to the interface
      expect(() => validateLogEntry(completeLogEntry)).not.toThrow();
    });

    it('should require only message, level, and timestamp fields', () => {
      // Create a minimal log entry with only required fields
      const minimalLogEntry: FormatterLogEntry = {
        message: 'Minimal test message',
        level: LogLevel.INFO,
        timestamp: new Date().toISOString()
      };
      
      // Verify the minimal log entry is valid according to the interface
      expect(() => validateLogEntry(minimalLogEntry)).not.toThrow();
    });

    it('should handle optional fields correctly', () => {
      // Create a log entry with some optional fields
      const partialLogEntry: FormatterLogEntry = {
        message: 'Partial test message',
        level: LogLevel.WARN,
        timestamp: new Date().toISOString(),
        requestId: 'req-123',
        journey: 'plan'
      };
      
      // Verify the partial log entry is valid according to the interface
      expect(() => validateLogEntry(partialLogEntry)).not.toThrow();
    });

    it('should validate log level values', () => {
      // Test each valid log level
      LogLevelUtils.getAllLevels().forEach(level => {
        const entry: FormatterLogEntry = {
          message: 'Log level test',
          level,
          timestamp: new Date().toISOString()
        };
        
        expect(() => validateLogEntry(entry)).not.toThrow();
      });
    });
  });

  describe('Formatter Implementations', () => {
    // Test that the adapter function works correctly
    it('should correctly adapt between LogEntry interfaces', () => {
      const interfaceEntry = createSampleInterfaceLogEntry();
      const formatterEntry = adaptLogEntry(interfaceEntry);
      
      expect(formatterEntry.message).toBe(interfaceEntry.message);
      expect(formatterEntry.level).toBe(interfaceEntry.level);
      expect(formatterEntry.timestamp).toBe(interfaceEntry.timestamp.toISOString());
      expect(formatterEntry.service).toBe(interfaceEntry.serviceName);
      expect(formatterEntry.context).toBe(interfaceEntry.contextData);
      expect(formatterEntry.journey).toBe(interfaceEntry.journey?.type);
    });
    it('should verify JSONFormatter implements the Formatter interface', () => {
      // Create an instance of JSONFormatter
      const formatter: Formatter = new JSONFormatter();
      
      // Verify it implements the format method
      expect(formatter.format).toBeDefined();
      expect(typeof formatter.format).toBe('function');
      
      // Verify it returns the expected type
      const result = formatter.format(adaptLogEntry(sampleInterfaceLogEntry));
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Verify the result is valid JSON
      expect(() => JSON.parse(result as string)).not.toThrow();
    });

    it('should verify TextFormatter implements the Formatter interface', () => {
      // Create an instance of TextFormatter
      const formatter: Formatter = new TextFormatter();
      
      // Verify it implements the format method
      expect(formatter.format).toBeDefined();
      expect(typeof formatter.format).toBe('function');
      
      // Verify it returns the expected type
      const result = formatter.format(adaptLogEntry(sampleInterfaceLogEntry));
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should verify CloudWatchFormatter implements the Formatter interface', () => {
      // Create an instance of CloudWatchFormatter
      const formatter: Formatter = new CloudWatchFormatter();
      
      // Verify it implements the format method
      expect(formatter.format).toBeDefined();
      expect(typeof formatter.format).toBe('function');
      
      // Verify it returns the expected type
      const result = formatter.format(adaptLogEntry(sampleInterfaceLogEntry));
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // CloudWatchFormatter extends JsonFormatter, so the result should be valid JSON
      expect(() => JSON.parse(result as string)).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    // Add a test for null and undefined values in optional fields
    it('should handle null and undefined values in optional fields', () => {
      const formatter = new JSONFormatter();
      
      const interfaceEntry: InterfaceLogEntry = {
        message: 'Test with null values',
        level: LogLevel.INFO,
        timestamp: new Date(),
        contextData: { nullValue: null, undefinedValue: undefined },
        userId: null as any, // Force null for testing
        requestId: undefined as any // Force undefined for testing
      };
      
      // The formatter should handle null and undefined values without throwing
      expect(() => formatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
    });
    it('should handle empty messages', () => {
      // Test with all formatter implementations
      const mockFormatter = new MockFormatter();
      const jsonFormatter = new JSONFormatter();
      const textFormatter = new TextFormatter();
      const cloudwatchFormatter = new CloudWatchFormatter();
      
      // Create a log entry with an empty message
      const entry: FormatterLogEntry = {
        message: '',
        level: LogLevel.INFO,
        timestamp: new Date().toISOString()
      };
      
      // Create an interface log entry with an empty message
      const interfaceEntry: InterfaceLogEntry = {
        message: '',
        level: LogLevel.INFO,
        timestamp: new Date()
      };
      
      // All formatters should handle the empty message without throwing
      expect(() => mockFormatter.format(entry)).not.toThrow();
      expect(() => jsonFormatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
      expect(() => textFormatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
      expect(() => cloudwatchFormatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
    });

    it('should handle complex error objects', () => {
      // Test with both MockFormatter and JSONFormatter
      const mockFormatter = new MockFormatter();
      const jsonFormatter = new JSONFormatter();
      
      // Create a complex error object with custom properties
      const error = new Error('Complex error');
      error.name = 'CustomError';
      Object.defineProperty(error, 'customProp', { value: 'custom value' });
      
      // Add a nested error to test deep error handling
      const nestedError = new Error('Nested error');
      (error as any).cause = nestedError;
      
      // Create formatter log entry with the error
      const entry: FormatterLogEntry = {
        message: 'Error test',
        level: LogLevel.ERROR,
        timestamp: new Date().toISOString(),
        error
      };
      
      // Create interface log entry with the error
      const interfaceEntry: InterfaceLogEntry = {
        message: 'Error test',
        level: LogLevel.ERROR,
        timestamp: new Date(),
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          originalError: error
        }
      };
      
      // Both formatters should handle the complex error without throwing
      expect(() => mockFormatter.format(entry)).not.toThrow();
      expect(() => jsonFormatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
    });

    it('should handle circular references in context objects', () => {
      // Use JSONFormatter which needs to handle circular references for JSON serialization
      const formatter = new JSONFormatter();
      
      // Create an object with a circular reference
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;
      
      // Create a log entry with the circular object in the context
      const interfaceEntry: InterfaceLogEntry = {
        message: 'Circular reference test',
        level: LogLevel.INFO,
        timestamp: new Date(),
        contextData: { circular: circularObj }
      };
      
      // The formatter should handle the circular reference without throwing
      expect(() => formatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
      
      // The result should be valid JSON
      const result = formatter.format(adaptLogEntry(interfaceEntry));
      expect(() => JSON.parse(result as string)).not.toThrow();
    });

    it('should handle very large log entries', () => {
      // Test with both MockFormatter and JSONFormatter to ensure both can handle large entries
      const mockFormatter = new MockFormatter();
      const jsonFormatter = new JSONFormatter();
      
      // Create a very large string that might cause performance issues
      const largeString = 'a'.repeat(10000);
      
      // Create a log entry with the large string in the context
      const entry: FormatterLogEntry = {
        message: 'Large entry test',
        level: LogLevel.INFO,
        timestamp: new Date().toISOString(),
        context: { largeString }
      };
      
      // Create an interface log entry with the large string in the context data
      const interfaceEntry: InterfaceLogEntry = {
        message: 'Large entry test',
        level: LogLevel.INFO,
        timestamp: new Date(),
        contextData: { largeString }
      };
      
      // Both formatters should handle the large entry without throwing
      expect(() => mockFormatter.format(entry)).not.toThrow();
      expect(() => jsonFormatter.format(adaptLogEntry(interfaceEntry))).not.toThrow();
    });
  });
});

/**
 * Helper function to validate a FormatterLogEntry object against the interface.
 * This is used for testing purposes only to ensure that log entries conform to the
 * expected structure defined in the FormatterLogEntry interface.
 * 
 * @param entry The log entry to validate against the FormatterLogEntry interface
 * @throws Error if the entry is invalid according to the interface contract
 */
function validateLogEntry(entry: FormatterLogEntry): void {
  // Check required fields
  if (typeof entry.message !== 'string') {
    throw new Error('LogEntry.message must be a string');
  }
  
  if (typeof entry.level !== 'number' || !Object.values(LogLevel).includes(entry.level)) {
    throw new Error('LogEntry.level must be a valid LogLevel enum value');
  }
  
  if (typeof entry.timestamp !== 'string') {
    throw new Error('LogEntry.timestamp must be a string');
  }
  
  // Check optional fields if present
  if (entry.context !== undefined && typeof entry.context !== 'object') {
    throw new Error('LogEntry.context must be an object if present');
  }
  
  if (entry.service !== undefined && typeof entry.service !== 'string') {
    throw new Error('LogEntry.service must be a string if present');
  }
  
  if (entry.error !== undefined && !(entry.error instanceof Error) && typeof entry.error !== 'object') {
    throw new Error('LogEntry.error must be an Error or object if present');
  }
  
  if (entry.stack !== undefined && typeof entry.stack !== 'string') {
    throw new Error('LogEntry.stack must be a string if present');
  }
  
  if (entry.requestId !== undefined && typeof entry.requestId !== 'string') {
    throw new Error('LogEntry.requestId must be a string if present');
  }
  
  if (entry.userId !== undefined && typeof entry.userId !== 'string') {
    throw new Error('LogEntry.userId must be a string if present');
  }
  
  if (entry.journey !== undefined && typeof entry.journey !== 'string') {
    throw new Error('LogEntry.journey must be a string if present');
  }
  
  if (entry.traceId !== undefined && typeof entry.traceId !== 'string') {
    throw new Error('LogEntry.traceId must be a string if present');
  }
  
  if (entry.spanId !== undefined && typeof entry.spanId !== 'string') {
    throw new Error('LogEntry.spanId must be a string if present');
  }
  
  if (entry.parentSpanId !== undefined && typeof entry.parentSpanId !== 'string') {
    throw new Error('LogEntry.parentSpanId must be a string if present');
  }
  
  if (entry.metadata !== undefined && typeof entry.metadata !== 'object') {
    throw new Error('LogEntry.metadata must be an object if present');
  }
}