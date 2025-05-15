import { TextFormatter } from '../../../src/formatters/text.formatter';
import { LogEntry, LogLevel } from '../../../src/formatters/formatter.interface';

// Mock the chalk library which is likely used for coloring
jest.mock('chalk', () => {
  return {
    gray: jest.fn((text) => `<gray>${text}</gray>`),
    green: jest.fn((text) => `<green>${text}</green>`),
    yellow: jest.fn((text) => `<yellow>${text}</yellow>`),
    red: jest.fn((text) => `<red>${text}</red>`),
    magenta: jest.fn((text) => `<magenta>${text}</magenta>`),
    blue: jest.fn((text) => `<blue>${text}</blue>`),
    white: jest.fn((text) => `<white>${text}</white>`),
    bold: jest.fn((text) => `<bold>${text}</bold>`),
  };
});

describe('TextFormatter', () => {
  let formatter: TextFormatter;
  
  beforeEach(() => {
    formatter = new TextFormatter();
  });

  it('should format DEBUG level logs with proper color', () => {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message: 'Debug message',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
    };

    const result = formatter.format(entry);

    expect(result).toContain('<gray>DEBUG</gray>');
    expect(result).toContain('Debug message');
    expect(result).toContain('2023-01-01');
    expect(result).toContain('requestId: 123');
  });

  it('should format INFO level logs with proper color', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Info message',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
    };

    const result = formatter.format(entry);

    expect(result).toContain('<green>INFO</green>');
    expect(result).toContain('Info message');
  });

  it('should format WARN level logs with proper color', () => {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message: 'Warning message',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
    };

    const result = formatter.format(entry);

    expect(result).toContain('<yellow>WARN</yellow>');
    expect(result).toContain('Warning message');
  });

  it('should format ERROR level logs with proper color', () => {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: 'Error message',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
      error: new Error('Test error'),
    };

    const result = formatter.format(entry);

    expect(result).toContain('<red>ERROR</red>');
    expect(result).toContain('Error message');
    expect(result).toContain('Test error');
    expect(result).toContain('Error: Test error');
  });

  it('should format FATAL level logs with proper color', () => {
    const entry: LogEntry = {
      level: LogLevel.FATAL,
      message: 'Fatal message',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
    };

    const result = formatter.format(entry);

    expect(result).toContain('<magenta>FATAL</magenta>');
    expect(result).toContain('Fatal message');
  });

  it('should properly format complex objects in the context', () => {
    const complexContext = {
      user: {
        id: '123',
        name: 'Test User',
        roles: ['admin', 'user'],
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
      journey: 'health',
      requestId: 'abc-123',
    };

    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Message with complex context',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: complexContext,
    };

    const result = formatter.format(entry);

    expect(result).toContain('user:');
    expect(result).toContain('id: 123');
    expect(result).toContain('name: Test User');
    expect(result).toContain('roles:');
    expect(result).toContain('- admin');
    expect(result).toContain('- user');
    expect(result).toContain('preferences:');
    expect(result).toContain('theme: dark');
    expect(result).toContain('notifications: true');
    expect(result).toContain('journey: health');
    expect(result).toContain('requestId: abc-123');
  });

  it('should format timestamps in a human-readable format', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Message with timestamp',
      timestamp: new Date('2023-01-01T12:34:56.789Z'),
      context: { requestId: '123' },
    };

    const result = formatter.format(entry);

    expect(result).toContain('2023-01-01');
    expect(result).toContain('12:34:56');
  });

  it('should include journey information in the formatted output', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Journey-specific log',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { 
        requestId: '123',
        userId: 'user-456',
        journey: 'health',
      },
    };

    const result = formatter.format(entry);

    expect(result).toContain('journey: health');
    expect(result).toContain('userId: user-456');
    expect(result).toContain('requestId: 123');
  });

  it('should format error stack traces properly', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at TestFunction (/path/to/file.ts:10:15)\n    at AnotherFunction (/path/to/another.ts:20:5)';
    
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: 'Error with stack trace',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      context: { requestId: '123' },
      error,
    };

    const result = formatter.format(entry);

    expect(result).toContain('Error: Test error');
    expect(result).toContain('at TestFunction');
    expect(result).toContain('/path/to/file.ts:10:15');
    expect(result).toContain('at AnotherFunction');
    expect(result).toContain('/path/to/another.ts:20:5');
  });

  it('should handle missing context gracefully', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Message without context',
      timestamp: new Date('2023-01-01T12:00:00Z'),
    };

    const result = formatter.format(entry);

    expect(result).toContain('<green>INFO</green>');
    expect(result).toContain('Message without context');
    expect(result).toContain('2023-01-01');
    // Should not throw an error due to missing context
  });

  it('should handle missing timestamp gracefully', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: 'Message without timestamp',
      context: { requestId: '123' },
    } as LogEntry; // Cast to LogEntry to bypass TypeScript check

    const result = formatter.format(entry);

    expect(result).toContain('<green>INFO</green>');
    expect(result).toContain('Message without timestamp');
    expect(result).toContain('requestId: 123');
    // Should not throw an error due to missing timestamp
  });
});