import { LogLevel, getLogLevelValue, parseLogLevel, isLevelEnabled, stringToLogLevel } from '../../../src/utils/level.utils';

describe('Log Level Utilities', () => {
  describe('stringToLogLevel', () => {
    it('should convert valid string levels to LogLevel enum', () => {
      expect(stringToLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(stringToLogLevel('INFO')).toBe(LogLevel.INFO);
      expect(stringToLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(stringToLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(stringToLogLevel('FATAL')).toBe(LogLevel.FATAL);
    });

    it('should handle lowercase string levels', () => {
      expect(stringToLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(stringToLogLevel('info')).toBe(LogLevel.INFO);
      expect(stringToLogLevel('warn')).toBe(LogLevel.WARN);
      expect(stringToLogLevel('error')).toBe(LogLevel.ERROR);
      expect(stringToLogLevel('fatal')).toBe(LogLevel.FATAL);
    });

    it('should handle mixed case string levels', () => {
      expect(stringToLogLevel('Debug')).toBe(LogLevel.DEBUG);
      expect(stringToLogLevel('Info')).toBe(LogLevel.INFO);
      expect(stringToLogLevel('Warn')).toBe(LogLevel.WARN);
      expect(stringToLogLevel('Error')).toBe(LogLevel.ERROR);
      expect(stringToLogLevel('Fatal')).toBe(LogLevel.FATAL);
    });

    it('should return default level for invalid inputs', () => {
      expect(stringToLogLevel('')).toBe(LogLevel.INFO);
      expect(stringToLogLevel('INVALID_LEVEL')).toBe(LogLevel.INFO);
      expect(stringToLogLevel(null as unknown as string)).toBe(LogLevel.INFO);
      expect(stringToLogLevel(undefined as unknown as string)).toBe(LogLevel.INFO);
    });
  });

  describe('getLogLevelValue', () => {
    it('should return correct numeric values for log levels', () => {
      expect(getLogLevelValue(LogLevel.DEBUG)).toBe(0);
      expect(getLogLevelValue(LogLevel.INFO)).toBe(1);
      expect(getLogLevelValue(LogLevel.WARN)).toBe(2);
      expect(getLogLevelValue(LogLevel.ERROR)).toBe(3);
      expect(getLogLevelValue(LogLevel.FATAL)).toBe(4);
    });

    it('should handle string inputs by converting them to LogLevel first', () => {
      expect(getLogLevelValue('DEBUG')).toBe(0);
      expect(getLogLevelValue('INFO')).toBe(1);
      expect(getLogLevelValue('WARN')).toBe(2);
      expect(getLogLevelValue('ERROR')).toBe(3);
      expect(getLogLevelValue('FATAL')).toBe(4);
    });

    it('should return default value for invalid inputs', () => {
      expect(getLogLevelValue('INVALID_LEVEL' as any)).toBe(1); // Default to INFO
      expect(getLogLevelValue(null as any)).toBe(1);
      expect(getLogLevelValue(undefined as any)).toBe(1);
    });
  });

  describe('isLevelEnabled', () => {
    it('should correctly determine if a level is enabled based on minimum level', () => {
      // When minimum level is DEBUG, all levels should be enabled
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);

      // When minimum level is INFO, DEBUG should be disabled
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.INFO)).toBe(true);

      // When minimum level is WARN, DEBUG and INFO should be disabled
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.WARN)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.WARN)).toBe(false);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.WARN)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.WARN)).toBe(true);

      // When minimum level is ERROR, only ERROR and FATAL should be enabled
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.ERROR)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.ERROR)).toBe(true);

      // When minimum level is FATAL, only FATAL should be enabled
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.FATAL)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.FATAL)).toBe(false);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.FATAL)).toBe(false);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.FATAL)).toBe(false);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.FATAL)).toBe(true);
    });

    it('should handle string inputs by converting them to LogLevel first', () => {
      expect(isLevelEnabled('ERROR', 'INFO')).toBe(true);
      expect(isLevelEnabled('INFO', 'WARN')).toBe(false);
      expect(isLevelEnabled('WARN', 'ERROR')).toBe(false);
      expect(isLevelEnabled('FATAL', 'ERROR')).toBe(true);
    });

    it('should handle invalid inputs gracefully', () => {
      // Invalid level with valid minimum level should return false
      expect(isLevelEnabled('INVALID_LEVEL' as any, LogLevel.INFO)).toBe(false);
      
      // Valid level with invalid minimum level should use INFO as default minimum
      expect(isLevelEnabled(LogLevel.ERROR, 'INVALID_LEVEL' as any)).toBe(true);
      expect(isLevelEnabled(LogLevel.DEBUG, 'INVALID_LEVEL' as any)).toBe(false);
      
      // Both invalid should return false
      expect(isLevelEnabled('INVALID_LEVEL' as any, 'ANOTHER_INVALID' as any)).toBe(false);
      
      // Null/undefined handling
      expect(isLevelEnabled(null as any, LogLevel.INFO)).toBe(false);
      expect(isLevelEnabled(LogLevel.ERROR, null as any)).toBe(true); // Default to INFO
      expect(isLevelEnabled(undefined as any, LogLevel.INFO)).toBe(false);
      expect(isLevelEnabled(LogLevel.ERROR, undefined as any)).toBe(true); // Default to INFO
    });
  });

  describe('parseLogLevel', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should parse log level from environment variable', () => {
      process.env.LOG_LEVEL = 'ERROR';
      expect(parseLogLevel()).toBe(LogLevel.ERROR);
      
      process.env.LOG_LEVEL = 'debug';
      expect(parseLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should use journey-specific log level if available', () => {
      process.env.LOG_LEVEL = 'INFO';
      process.env.HEALTH_JOURNEY_LOG_LEVEL = 'DEBUG';
      expect(parseLogLevel('health')).toBe(LogLevel.DEBUG);
      
      process.env.CARE_JOURNEY_LOG_LEVEL = 'WARN';
      expect(parseLogLevel('care')).toBe(LogLevel.WARN);
      
      process.env.PLAN_JOURNEY_LOG_LEVEL = 'ERROR';
      expect(parseLogLevel('plan')).toBe(LogLevel.ERROR);
    });

    it('should fall back to default log level if journey-specific level is not set', () => {
      process.env.LOG_LEVEL = 'WARN';
      expect(parseLogLevel('health')).toBe(LogLevel.WARN);
    });

    it('should use INFO as default if no log level is specified', () => {
      delete process.env.LOG_LEVEL;
      expect(parseLogLevel()).toBe(LogLevel.INFO);
    });

    it('should handle invalid environment variable values', () => {
      process.env.LOG_LEVEL = 'INVALID_LEVEL';
      expect(parseLogLevel()).toBe(LogLevel.INFO);
      
      process.env.HEALTH_JOURNEY_LOG_LEVEL = 'NOT_A_LEVEL';
      expect(parseLogLevel('health')).toBe(LogLevel.INFO);
    });
  });
});