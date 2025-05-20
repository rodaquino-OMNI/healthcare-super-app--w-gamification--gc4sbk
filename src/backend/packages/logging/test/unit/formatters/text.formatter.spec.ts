import { TextFormatter, TextFormatterOptions } from '../../../src/formatters/text.formatter';
import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { LogEntry } from '../../../src/formatters/formatter.interface';

describe('TextFormatter', () => {
  let formatter: TextFormatter;
  let defaultOptions: TextFormatterOptions;

  beforeEach(() => {
    defaultOptions = {
      colors: true,
      timestamps: true,
      prettyPrint: true,
      maxDepth: 3,
      includeContext: true,
    };
    formatter = new TextFormatter(defaultOptions);
  });

  describe('basic formatting', () => {
    it('should format a simple log entry with INFO level', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp,
      };

      const result = formatter.format(entry);

      expect(result).toContain('[2023-01-01 12:00:00.000]');
      expect(result).toContain('[INFO]');
      expect(result).toContain('Test message');
    });

    it('should format a log entry with DEBUG level', () => {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message: 'Debug message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      expect(result).toContain('[DEBUG]');
      expect(result).toContain('Debug message');
    });

    it('should format a log entry with WARN level', () => {
      const entry: LogEntry = {
        level: LogLevel.WARN,
        message: 'Warning message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      expect(result).toContain('[WARN]');
      expect(result).toContain('Warning message');
    });

    it('should format a log entry with ERROR level', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      expect(result).toContain('[ERROR]');
      expect(result).toContain('Error message');
    });

    it('should format a log entry with FATAL level', () => {
      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message: 'Fatal message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      expect(result).toContain('[FATAL]');
      expect(result).toContain('Fatal message');
    });
  });

  describe('color formatting', () => {
    it('should include ANSI color codes when colors are enabled', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      // Check for ANSI color codes
      expect(result).toMatch(/\x1b\[/); // Contains ANSI escape sequence
    });

    it('should not include ANSI color codes when colors are disabled', () => {
      formatter = new TextFormatter({ ...defaultOptions, colors: false });
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const result = formatter.format(entry);

      // Should not contain ANSI escape sequences
      expect(result).not.toMatch(/\x1b\[/);
    });

    it('should use different colors for different log levels', () => {
      const debugEntry: LogEntry = {
        level: LogLevel.DEBUG,
        message: 'Debug message',
        timestamp: new Date(),
      };

      const errorEntry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error message',
        timestamp: new Date(),
      };

      const debugResult = formatter.format(debugEntry);
      const errorResult = formatter.format(errorEntry);

      // Different log levels should have different color codes
      expect(debugResult).not.toEqual(errorResult);
      
      // Debug should contain cyan color code
      expect(debugResult).toMatch(/\x1b\[36m/); // Cyan color
      
      // Error should contain red color code
      expect(errorResult).toMatch(/\x1b\[31m/); // Red color
    });
  });

  describe('timestamp formatting', () => {
    it('should include formatted timestamp when timestamps are enabled', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp,
      };

      const result = formatter.format(entry);

      expect(result).toContain('[2023-01-01 12:00:00.000]');
    });

    it('should not include timestamp when timestamps are disabled', () => {
      formatter = new TextFormatter({ ...defaultOptions, timestamps: false });
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp,
      };

      const result = formatter.format(entry);

      expect(result).not.toContain('[2023-01-01 12:00:00.000]');
    });
  });

  describe('context formatting', () => {
    it('should include service name in context when available', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'test-service',
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[test-service]');
    });

    it('should include journey in context when available', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          journey: 'health',
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[health]');
    });

    it('should include request information in context when available', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          request: {
            id: '123',
            method: 'GET',
            path: '/api/test',
            userId: 'user-123',
            duration: 42,
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[req:123]');
      expect(result).toContain('[GET /api/test]');
      expect(result).toContain('[user:user-123]');
      expect(result).toContain('[42ms]');
    });

    it('should include trace information in context when available', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          trace: {
            id: 'trace-123',
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[trace:trace-123]');
    });

    it('should not include context when includeContext is disabled', () => {
      formatter = new TextFormatter({ ...defaultOptions, includeContext: false });
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'test-service',
          journey: 'health',
          request: {
            id: '123',
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).not.toContain('[test-service]');
      expect(result).not.toContain('[health]');
      expect(result).not.toContain('[req:123]');
    });
  });

  describe('error formatting', () => {
    it('should format error string', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error occurred',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: 'Simple error message',
      };

      const result = formatter.format(entry);

      expect(result).toContain('Error occurred');
      expect(result).toContain('Error: Simple error message');
    });

    it('should format Error object with stack trace', () => {
      const error = new Error('Test error');
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error occurred',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error,
      };

      const result = formatter.format(entry);

      expect(result).toContain('Error occurred');
      expect(result).toContain('Error: Error: Test error');
      expect(result).toContain('stack');
    });

    it('should format custom error with additional properties', () => {
      class CustomError extends Error {
        constructor(message: string, public code: string, public statusCode: number) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error', 'ERR_CUSTOM', 400);
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error occurred',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error,
      };

      const result = formatter.format(entry);

      expect(result).toContain('Error occurred');
      expect(result).toContain('Error: CustomError: Custom error');
      expect(result).toContain('code');
      expect(result).toContain('ERR_CUSTOM');
      expect(result).toContain('statusCode');
      expect(result).toContain('400');
    });
  });

  describe('object formatting', () => {
    it('should format simple objects', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        metadata: {
          key1: 'value1',
          key2: 42,
          key3: true,
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('key1');
      expect(result).toContain('value1');
      expect(result).toContain('key2');
      expect(result).toContain('42');
      expect(result).toContain('key3');
      expect(result).toContain('true');
    });

    it('should format nested objects with proper indentation', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        metadata: {
          user: {
            id: 'user-123',
            profile: {
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('user');
      expect(result).toContain('id');
      expect(result).toContain('user-123');
      expect(result).toContain('profile');
      expect(result).toContain('name');
      expect(result).toContain('Test User');
      expect(result).toContain('email');
      expect(result).toContain('test@example.com');

      // Check for indentation (spaces after newlines)
      expect(result).toMatch(/\n\s+/);
    });

    it('should format arrays with proper indentation', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        metadata: {
          items: [1, 2, 3],
          users: [
            { id: 'user-1', name: 'User 1' },
            { id: 'user-2', name: 'User 2' },
          ],
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('items');
      expect(result).toContain('[');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain(']');
      expect(result).toContain('users');
      expect(result).toContain('id');
      expect(result).toContain('user-1');
      expect(result).toContain('name');
      expect(result).toContain('User 1');
      expect(result).toContain('user-2');
      expect(result).toContain('User 2');

      // Check for indentation (spaces after newlines)
      expect(result).toMatch(/\n\s+/);
    });

    it('should respect maxDepth for nested objects', () => {
      formatter = new TextFormatter({ ...defaultOptions, maxDepth: 1 });
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        metadata: {
          user: {
            profile: {
              details: {
                preferences: {
                  theme: 'dark',
                },
              },
            },
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('user');
      expect(result).toContain('profile');
      expect(result).toContain('[Max Depth Exceeded]');
      expect(result).not.toContain('theme');
      expect(result).not.toContain('dark');
    });

    it('should handle special values like null, undefined, and dates', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        metadata: {
          nullValue: null,
          undefinedValue: undefined,
          dateValue: new Date('2023-02-01T00:00:00Z'),
          emptyObject: {},
          emptyArray: [],
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('nullValue');
      expect(result).toContain('null');
      expect(result).toContain('undefinedValue');
      expect(result).toContain('undefined');
      expect(result).toContain('dateValue');
      expect(result).toContain('2023-02-01');
      expect(result).toContain('emptyObject');
      expect(result).toContain('{}');
      expect(result).toContain('emptyArray');
      expect(result).toContain('[]');
    });
  });

  describe('configuration options', () => {
    it('should use default options when none are provided', () => {
      formatter = new TextFormatter();
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'test-service',
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[2023-01-01 12:00:00.000]'); // timestamps enabled
      expect(result).toMatch(/\x1b\[/); // colors enabled
      expect(result).toContain('[test-service]'); // includeContext enabled
    });

    it('should respect all configuration options when provided', () => {
      formatter = new TextFormatter({
        colors: false,
        timestamps: false,
        prettyPrint: false,
        maxDepth: 1,
        includeContext: false,
      });

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'test-service',
        },
        metadata: {
          user: {
            profile: {
              name: 'Test User',
            },
          },
        },
      };

      const result = formatter.format(entry);

      expect(result).not.toContain('[2023-01-01 12:00:00.000]'); // timestamps disabled
      expect(result).not.toMatch(/\x1b\[/); // colors disabled
      expect(result).not.toContain('[test-service]'); // includeContext disabled
      expect(result).toContain('[Max Depth Exceeded]'); // maxDepth respected
    });
  });

  describe('journey-specific formatting', () => {
    it('should format health journey context correctly', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Health metric recorded',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'health-service',
          journey: 'health',
          request: {
            id: 'req-123',
            userId: 'user-123',
          },
        },
        metadata: {
          metricType: 'heart-rate',
          value: 75,
          unit: 'bpm',
          deviceId: 'device-123',
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[health-service]');
      expect(result).toContain('[health]');
      expect(result).toContain('Health metric recorded');
      expect(result).toContain('metricType');
      expect(result).toContain('heart-rate');
      expect(result).toContain('value');
      expect(result).toContain('75');
    });

    it('should format care journey context correctly', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Appointment scheduled',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'care-service',
          journey: 'care',
          request: {
            id: 'req-456',
            userId: 'user-456',
          },
        },
        metadata: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          specialtyId: 'specialty-123',
          scheduledTime: new Date('2023-02-01T14:30:00Z'),
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[care-service]');
      expect(result).toContain('[care]');
      expect(result).toContain('Appointment scheduled');
      expect(result).toContain('appointmentId');
      expect(result).toContain('appt-123');
      expect(result).toContain('providerId');
      expect(result).toContain('provider-123');
    });

    it('should format plan journey context correctly', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Claim submitted',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        context: {
          service: 'plan-service',
          journey: 'plan',
          request: {
            id: 'req-789',
            userId: 'user-789',
          },
        },
        metadata: {
          claimId: 'claim-123',
          planId: 'plan-123',
          amount: 150.75,
          category: 'medical',
          status: 'submitted',
        },
      };

      const result = formatter.format(entry);

      expect(result).toContain('[plan-service]');
      expect(result).toContain('[plan]');
      expect(result).toContain('Claim submitted');
      expect(result).toContain('claimId');
      expect(result).toContain('claim-123');
      expect(result).toContain('planId');
      expect(result).toContain('plan-123');
    });
  });
});