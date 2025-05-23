import { TextFormatter } from '../../../src/formatters/text.formatter';
import { LogEntry, JourneyType } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Test suite for the TextFormatter class.
 * These tests verify that the TextFormatter correctly transforms log entries
 * into human-readable text format with proper coloring and formatting.
 */
describe('TextFormatter', () => {
  let formatter: TextFormatter;
  
  // Sample timestamp for consistent testing
  const sampleTimestamp = new Date('2023-05-15T14:30:45.123Z');
  
  // ANSI color codes used by the formatter
  const colors = {
    reset: '\x1b[0m',
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
    timestamp: '\x1b[90m', // Gray
    context: '\x1b[1;34m', // Bright Blue
    journeyHealth: '\x1b[1;32m', // Bright Green
    journeyCare: '\x1b[1;36m',  // Bright Cyan
    journeyPlan: '\x1b[1;33m',  // Bright Yellow
  };
  
  beforeEach(() => {
    // Create a new formatter instance with colors enabled for testing
    formatter = new TextFormatter({ useColors: true });
  });
  
  /**
   * Helper function to create a basic log entry for testing.
   * @param level The log level
   * @param message The log message
   * @returns A basic log entry
   */
  function createBasicLogEntry(level: LogLevel, message: string): LogEntry {
    return {
      level,
      message,
      timestamp: sampleTimestamp,
    };
  }
  
  describe('Basic Formatting', () => {
    it('should format a basic log entry with the correct structure', () => {
      const entry = createBasicLogEntry(LogLevel.INFO, 'Test message');
      const result = formatter.format(entry);
      
      // The result should contain the timestamp, level, and message
      expect(result).toContain('2023-05-15 14:30:45.123');
      expect(result).toContain('INFO');
      expect(result).toContain('Test message');
    });
    
    it('should format log entries with different levels correctly', () => {
      // Test each log level
      const levels = [
        { level: LogLevel.DEBUG, name: 'DEBUG' },
        { level: LogLevel.INFO, name: 'INFO' },
        { level: LogLevel.WARN, name: 'WARN' },
        { level: LogLevel.ERROR, name: 'ERROR' },
        { level: LogLevel.FATAL, name: 'FATAL' },
      ];
      
      levels.forEach(({ level, name }) => {
        const entry = createBasicLogEntry(level, `${name} message`);
        const result = formatter.format(entry);
        
        // The result should contain the level name
        expect(result).toContain(name);
        expect(result).toContain(`${name} message`);
      });
    });
    
    it('should include context when provided', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Test with context'),
        context: 'TestContext',
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the context
      expect(result).toContain('[TestContext]');
    });
  });
  
  describe('Color Coding', () => {
    it('should apply the correct color for DEBUG level', () => {
      const entry = createBasicLogEntry(LogLevel.DEBUG, 'Debug message');
      const result = formatter.format(entry);
      
      // The result should contain the debug color code
      expect(result).toContain(colors.debug);
    });
    
    it('should apply the correct color for INFO level', () => {
      const entry = createBasicLogEntry(LogLevel.INFO, 'Info message');
      const result = formatter.format(entry);
      
      // The result should contain the info color code
      expect(result).toContain(colors.info);
    });
    
    it('should apply the correct color for WARN level', () => {
      const entry = createBasicLogEntry(LogLevel.WARN, 'Warning message');
      const result = formatter.format(entry);
      
      // The result should contain the warn color code
      expect(result).toContain(colors.warn);
    });
    
    it('should apply the correct color for ERROR level', () => {
      const entry = createBasicLogEntry(LogLevel.ERROR, 'Error message');
      const result = formatter.format(entry);
      
      // The result should contain the error color code
      expect(result).toContain(colors.error);
    });
    
    it('should apply the correct color for FATAL level', () => {
      const entry = createBasicLogEntry(LogLevel.FATAL, 'Fatal message');
      const result = formatter.format(entry);
      
      // The result should contain the fatal color code
      expect(result).toContain(colors.fatal);
    });
    
    it('should apply the correct color for timestamp', () => {
      const entry = createBasicLogEntry(LogLevel.INFO, 'Test message');
      const result = formatter.format(entry);
      
      // The result should contain the timestamp color code
      expect(result).toContain(colors.timestamp);
    });
    
    it('should not use colors when disabled', () => {
      // Create a formatter with colors disabled
      const noColorFormatter = new TextFormatter({ useColors: false });
      const entry = createBasicLogEntry(LogLevel.INFO, 'No color message');
      const result = noColorFormatter.format(entry);
      
      // The result should not contain any color codes
      expect(result).not.toContain(colors.reset);
      expect(result).not.toContain(colors.info);
      expect(result).not.toContain(colors.timestamp);
    });
  });
  
  describe('Journey Formatting', () => {
    it('should format HEALTH journey correctly', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Health journey message'),
        journey: {
          type: JourneyType.HEALTH,
          resourceId: 'health-123',
          action: 'view',
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the journey type and color
      expect(result).toContain('[HEALTH]');
      expect(result).toContain(colors.journeyHealth);
      expect(result).toContain('Resource: health-123');
      expect(result).toContain('Action: view');
    });
    
    it('should format CARE journey correctly', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Care journey message'),
        journey: {
          type: JourneyType.CARE,
          resourceId: 'care-456',
          action: 'book',
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the journey type and color
      expect(result).toContain('[CARE]');
      expect(result).toContain(colors.journeyCare);
      expect(result).toContain('Resource: care-456');
      expect(result).toContain('Action: book');
    });
    
    it('should format PLAN journey correctly', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Plan journey message'),
        journey: {
          type: JourneyType.PLAN,
          resourceId: 'plan-789',
          action: 'claim',
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the journey type and color
      expect(result).toContain('[PLAN]');
      expect(result).toContain(colors.journeyPlan);
      expect(result).toContain('Resource: plan-789');
      expect(result).toContain('Action: claim');
    });
    
    it('should format journey data when provided', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Journey with data'),
        journey: {
          type: JourneyType.HEALTH,
          data: {
            metricType: 'steps',
            value: 10000,
            unit: 'count',
          },
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the journey data
      expect(result).toContain('Journey Data:');
      expect(result).toContain('"metricType": "steps"');
      expect(result).toContain('"value": 10000');
      expect(result).toContain('"unit": "count"');
    });
  });
  
  describe('Context Data Formatting', () => {
    it('should format context data correctly', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Context data test'),
        contextData: {
          userId: 'user-123',
          sessionId: 'session-456',
          browser: 'Chrome',
          device: 'Desktop',
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the context data
      expect(result).toContain('Context Data:');
      expect(result).toContain('"userId": "user-123"');
      expect(result).toContain('"sessionId": "session-456"');
      expect(result).toContain('"browser": "Chrome"');
      expect(result).toContain('"device": "Desktop"');
    });
    
    it('should handle nested objects in context data', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Nested context data'),
        contextData: {
          user: {
            id: 'user-123',
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the nested context data
      expect(result).toContain('Context Data:');
      expect(result).toContain('"user": {');
      expect(result).toContain('"id": "user-123"');
      expect(result).toContain('"name": "Test User"');
      expect(result).toContain('"preferences": {');
      expect(result).toContain('"theme": "dark"');
      expect(result).toContain('"notifications": true');
    });
    
    it('should handle arrays in context data', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Array context data'),
        contextData: {
          items: ['item1', 'item2', 'item3'],
          counts: [1, 2, 3],
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the array context data
      expect(result).toContain('Context Data:');
      expect(result).toContain('"items": [');
      expect(result).toContain('"item1"');
      expect(result).toContain('"item2"');
      expect(result).toContain('"item3"');
      expect(result).toContain('"counts": [');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });
  });
  
  describe('Error Formatting', () => {
    it('should format error information correctly', () => {
      const error = {
        name: 'TestError',
        message: 'Test error message',
        stack: 'TestError: Test error message\n    at TestFunction (/test.ts:123:45)',
        code: 'ERR_TEST',
      };
      
      const entry = {
        ...createBasicLogEntry(LogLevel.ERROR, 'Error test'),
        error,
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the error information
      expect(result).toContain('TestError: Test error message');
      expect(result).toContain('Code: ERR_TEST');
      expect(result).toContain('Stack Trace:');
      expect(result).toContain('TestError: Test error message');
      expect(result).toContain('at TestFunction (/test.ts:123:45)');
    });
    
    it('should format error flags when present', () => {
      const error = {
        name: 'TransientError',
        message: 'Temporary failure',
        isTransient: true,
        isClientError: false,
        isExternalError: true,
      };
      
      const entry = {
        ...createBasicLogEntry(LogLevel.ERROR, 'Error with flags'),
        error,
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the error flags
      expect(result).toContain('Flags: Transient, External Error');
      expect(result).not.toContain('Client Error');
    });
    
    it('should handle errors without a stack trace', () => {
      const error = {
        name: 'SimpleError',
        message: 'Simple error without stack',
      };
      
      const entry = {
        ...createBasicLogEntry(LogLevel.ERROR, 'Error without stack'),
        error,
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the error information but no stack trace
      expect(result).toContain('SimpleError: Simple error without stack');
      expect(result).not.toContain('Stack Trace:');
    });
  });
  
  describe('Request Information Formatting', () => {
    it('should format request ID, user ID, and session ID', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Request info test'),
        requestId: 'req-123',
        userId: 'user-456',
        sessionId: 'session-789',
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the request information
      expect(result).toContain('Request ID: req-123');
      expect(result).toContain('User ID: user-456');
      expect(result).toContain('Session ID: session-789');
    });
    
    it('should format trace ID when provided', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Trace info test'),
        traceId: 'trace-123',
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the trace information
      expect(result).toContain('Trace ID: trace-123');
    });
    
    it('should handle partial request information', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Partial request info'),
        requestId: 'req-123',
        // No userId or sessionId
      };
      
      const result = formatter.format(entry);
      
      // The result should contain only the request ID
      expect(result).toContain('Request ID: req-123');
      expect(result).not.toContain('User ID:');
      expect(result).not.toContain('Session ID:');
    });
  });
  
  describe('Timestamp Formatting', () => {
    it('should format timestamp in the expected format', () => {
      const entry = createBasicLogEntry(LogLevel.INFO, 'Timestamp test');
      const result = formatter.format(entry);
      
      // The timestamp should be in the format: YYYY-MM-DD HH:MM:SS.mmm
      expect(result).toContain('2023-05-15 14:30:45.123');
    });
    
    it('should handle different timestamps correctly', () => {
      // Test with a different timestamp
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Different timestamp'),
        timestamp: new Date('2023-12-31T23:59:59.999Z'),
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the formatted timestamp
      expect(result).toContain('2023-12-31 23:59:59.999');
    });
  });
  
  describe('Metadata Formatting', () => {
    it('should format metadata correctly', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Metadata test'),
        metadata: {
          version: '1.0.0',
          environment: 'test',
          features: ['feature1', 'feature2'],
        },
      };
      
      const result = formatter.format(entry);
      
      // The result should contain the metadata
      expect(result).toContain('Metadata:');
      expect(result).toContain('"version": "1.0.0"');
      expect(result).toContain('"environment": "test"');
      expect(result).toContain('"features": [');
      expect(result).toContain('"feature1"');
      expect(result).toContain('"feature2"');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle circular references in objects', () => {
      // Create an object with a circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Circular reference'),
        contextData: { circular },
      };
      
      // The formatter should handle the circular reference without throwing
      expect(() => formatter.format(entry)).not.toThrow();
      
      const result = formatter.format(entry);
      
      // The result should contain a placeholder for the circular reference
      expect(result).toContain('Context Data:');
      expect(result).toContain('"name": "circular"');
      expect(result).toContain('"self": "[Circular Reference]"');
    });
    
    it('should handle very large objects', () => {
      // Create a large object that might cause performance issues
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = `value${i}`.repeat(10);
      }
      
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Large object'),
        contextData: { largeObject },
      };
      
      // The formatter should handle the large object without throwing
      expect(() => formatter.format(entry)).not.toThrow();
    });
    
    it('should handle empty objects', () => {
      const entry = {
        ...createBasicLogEntry(LogLevel.INFO, 'Empty object'),
        contextData: {},
      };
      
      const result = formatter.format(entry);
      
      // The result should not contain context data section
      expect(result).not.toContain('Context Data:');
    });
    
    it('should handle special characters in messages', () => {
      const entry = createBasicLogEntry(
        LogLevel.INFO,
        'Message with special characters: \n\t\r\"\'\\'
      );
      
      // The formatter should handle special characters without throwing
      expect(() => formatter.format(entry)).not.toThrow();
    });
    
    it('should handle non-string error messages', () => {
      const error = {
        name: 'TypeError',
        message: null as any, // Force null for testing
      };
      
      const entry = {
        ...createBasicLogEntry(LogLevel.ERROR, 'Error with null message'),
        error,
      };
      
      // The formatter should handle non-string error messages without throwing
      expect(() => formatter.format(entry)).not.toThrow();
    });
  });
});