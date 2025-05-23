import { LogLevel, LogLevelString } from '../../../src/interfaces/log-level.enum';
import {
  parseLogLevel,
  logLevelToString,
  getLogLevelValue,
  isLevelEnabled,
  DEFAULT_LOG_LEVEL,
  isMoreSevere,
  isLessSevere,
  getMostSevereLevel,
  parseLogLevelFromEnv,
  getJourneyLogLevel,
  JOURNEY_ENV_PREFIXES
} from '../../../src/utils/level.utils';

/**
 * Unit tests for log level utility functions.
 * Tests validation, conversion, and comparison of log levels within the logging system.
 */
describe('Log Level Utilities', () => {
  /**
   * Tests for parseLogLevel function which converts string representations to LogLevel enum values.
   * Verifies case-insensitivity and proper handling of invalid inputs.
   */
  describe('parseLogLevel', () => {
    it('should convert valid string log levels to enum values', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('warn')).toBe(LogLevel.WARN);
      expect(parseLogLevel('error')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('fatal')).toBe(LogLevel.FATAL);
    });

    it('should be case-insensitive when parsing log levels', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('Info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(parseLogLevel('Error')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('FATAL')).toBe(LogLevel.FATAL);
    });

    it('should return the default log level for undefined input', () => {
      expect(parseLogLevel(undefined)).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should return the default log level for invalid input', () => {
      expect(parseLogLevel('invalid')).toBe(DEFAULT_LOG_LEVEL);
      expect(parseLogLevel('')).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should return the specified default level when input is invalid', () => {
      expect(parseLogLevel('invalid', LogLevel.ERROR)).toBe(LogLevel.ERROR);
      expect(parseLogLevel(undefined, LogLevel.DEBUG)).toBe(LogLevel.DEBUG);
    });
  });

  /**
   * Tests for logLevelToString function which converts LogLevel enum values to their string representation.
   */
  describe('logLevelToString', () => {
    it('should convert enum log levels to their string representation', () => {
      expect(logLevelToString(LogLevel.DEBUG)).toBe('debug');
      expect(logLevelToString(LogLevel.INFO)).toBe('info');
      expect(logLevelToString(LogLevel.WARN)).toBe('warn');
      expect(logLevelToString(LogLevel.ERROR)).toBe('error');
      expect(logLevelToString(LogLevel.FATAL)).toBe('fatal');
    });
  });

  /**
   * Tests for getLogLevelValue function which returns numeric values for log levels.
   * Verifies correct ordering and consistent values for comparison operations.
   */
  describe('getLogLevelValue', () => {
    it('should return the correct numeric value for each log level', () => {
      expect(getLogLevelValue(LogLevel.DEBUG)).toBe(0);
      expect(getLogLevelValue(LogLevel.INFO)).toBe(1);
      expect(getLogLevelValue(LogLevel.WARN)).toBe(2);
      expect(getLogLevelValue(LogLevel.ERROR)).toBe(3);
      expect(getLogLevelValue(LogLevel.FATAL)).toBe(4);
    });

    it('should maintain the correct ordering of log levels', () => {
      const levels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL
      ];

      // Verify that each level has a higher value than the previous one
      for (let i = 1; i < levels.length; i++) {
        expect(getLogLevelValue(levels[i])).toBeGreaterThan(getLogLevelValue(levels[i - 1]));
      }
    });
  });

  /**
   * Tests for isLevelEnabled function which determines if a message should be logged based on configured level.
   * Critical for ensuring proper log filtering behavior across the application.
   */
  describe('isLevelEnabled', () => {
    it('should return true when message level is equal to configured level', () => {
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.WARN)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.ERROR)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.FATAL)).toBe(true);
    });

    it('should return true when message level is more severe than configured level', () => {
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.DEBUG)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);

      expect(isLevelEnabled(LogLevel.WARN, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.INFO)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.INFO)).toBe(true);

      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.WARN)).toBe(true);

      expect(isLevelEnabled(LogLevel.FATAL, LogLevel.ERROR)).toBe(true);
    });

    it('should return false when message level is less severe than configured level', () => {
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.WARN)).toBe(false);
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.DEBUG, LogLevel.FATAL)).toBe(false);

      expect(isLevelEnabled(LogLevel.INFO, LogLevel.WARN)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.INFO, LogLevel.FATAL)).toBe(false);

      expect(isLevelEnabled(LogLevel.WARN, LogLevel.ERROR)).toBe(false);
      expect(isLevelEnabled(LogLevel.WARN, LogLevel.FATAL)).toBe(false);

      expect(isLevelEnabled(LogLevel.ERROR, LogLevel.FATAL)).toBe(false);
    });

    it('should handle all possible level combinations correctly', () => {
      const levels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL
      ];

      // Test all combinations of message level and configured level
      for (const messageLevel of levels) {
        for (const configuredLevel of levels) {
          const expected = getLogLevelValue(messageLevel) >= getLogLevelValue(configuredLevel);
          expect(isLevelEnabled(messageLevel, configuredLevel)).toBe(expected);
        }
      }
    });
  });

  /**
   * Tests for isMoreSevere function which compares severity of log levels.
   * Verifies that level comparisons work correctly for all defined levels.
   */
  describe('isMoreSevere', () => {
    it('should return true when first level is more severe than second level', () => {
      expect(isMoreSevere(LogLevel.INFO, LogLevel.DEBUG)).toBe(true);
      expect(isMoreSevere(LogLevel.WARN, LogLevel.INFO)).toBe(true);
      expect(isMoreSevere(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
      expect(isMoreSevere(LogLevel.FATAL, LogLevel.ERROR)).toBe(true);

      expect(isMoreSevere(LogLevel.WARN, LogLevel.DEBUG)).toBe(true);
      expect(isMoreSevere(LogLevel.ERROR, LogLevel.DEBUG)).toBe(true);
      expect(isMoreSevere(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);

      expect(isMoreSevere(LogLevel.ERROR, LogLevel.INFO)).toBe(true);
      expect(isMoreSevere(LogLevel.FATAL, LogLevel.INFO)).toBe(true);

      expect(isMoreSevere(LogLevel.FATAL, LogLevel.WARN)).toBe(true);
    });

    it('should return false when first level is equal to or less severe than second level', () => {
      // Equal severity
      expect(isMoreSevere(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(false);
      expect(isMoreSevere(LogLevel.INFO, LogLevel.INFO)).toBe(false);
      expect(isMoreSevere(LogLevel.WARN, LogLevel.WARN)).toBe(false);
      expect(isMoreSevere(LogLevel.ERROR, LogLevel.ERROR)).toBe(false);
      expect(isMoreSevere(LogLevel.FATAL, LogLevel.FATAL)).toBe(false);

      // Less severity
      expect(isMoreSevere(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
      expect(isMoreSevere(LogLevel.DEBUG, LogLevel.WARN)).toBe(false);
      expect(isMoreSevere(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
      expect(isMoreSevere(LogLevel.DEBUG, LogLevel.FATAL)).toBe(false);

      expect(isMoreSevere(LogLevel.INFO, LogLevel.WARN)).toBe(false);
      expect(isMoreSevere(LogLevel.INFO, LogLevel.ERROR)).toBe(false);
      expect(isMoreSevere(LogLevel.INFO, LogLevel.FATAL)).toBe(false);

      expect(isMoreSevere(LogLevel.WARN, LogLevel.ERROR)).toBe(false);
      expect(isMoreSevere(LogLevel.WARN, LogLevel.FATAL)).toBe(false);

      expect(isMoreSevere(LogLevel.ERROR, LogLevel.FATAL)).toBe(false);
    });
  });

  /**
   * Tests for isLessSevere function which compares severity of log levels.
   * Complements isMoreSevere tests to ensure consistent comparison behavior.
   */
  describe('isLessSevere', () => {
    it('should return true when first level is less severe than second level', () => {
      expect(isLessSevere(LogLevel.DEBUG, LogLevel.INFO)).toBe(true);
      expect(isLessSevere(LogLevel.INFO, LogLevel.WARN)).toBe(true);
      expect(isLessSevere(LogLevel.WARN, LogLevel.ERROR)).toBe(true);
      expect(isLessSevere(LogLevel.ERROR, LogLevel.FATAL)).toBe(true);

      expect(isLessSevere(LogLevel.DEBUG, LogLevel.WARN)).toBe(true);
      expect(isLessSevere(LogLevel.DEBUG, LogLevel.ERROR)).toBe(true);
      expect(isLessSevere(LogLevel.DEBUG, LogLevel.FATAL)).toBe(true);

      expect(isLessSevere(LogLevel.INFO, LogLevel.ERROR)).toBe(true);
      expect(isLessSevere(LogLevel.INFO, LogLevel.FATAL)).toBe(true);

      expect(isLessSevere(LogLevel.WARN, LogLevel.FATAL)).toBe(true);
    });

    it('should return false when first level is equal to or more severe than second level', () => {
      // Equal severity
      expect(isLessSevere(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(false);
      expect(isLessSevere(LogLevel.INFO, LogLevel.INFO)).toBe(false);
      expect(isLessSevere(LogLevel.WARN, LogLevel.WARN)).toBe(false);
      expect(isLessSevere(LogLevel.ERROR, LogLevel.ERROR)).toBe(false);
      expect(isLessSevere(LogLevel.FATAL, LogLevel.FATAL)).toBe(false);

      // More severity
      expect(isLessSevere(LogLevel.INFO, LogLevel.DEBUG)).toBe(false);
      expect(isLessSevere(LogLevel.WARN, LogLevel.DEBUG)).toBe(false);
      expect(isLessSevere(LogLevel.ERROR, LogLevel.DEBUG)).toBe(false);
      expect(isLessSevere(LogLevel.FATAL, LogLevel.DEBUG)).toBe(false);

      expect(isLessSevere(LogLevel.WARN, LogLevel.INFO)).toBe(false);
      expect(isLessSevere(LogLevel.ERROR, LogLevel.INFO)).toBe(false);
      expect(isLessSevere(LogLevel.FATAL, LogLevel.INFO)).toBe(false);

      expect(isLessSevere(LogLevel.ERROR, LogLevel.WARN)).toBe(false);
      expect(isLessSevere(LogLevel.FATAL, LogLevel.WARN)).toBe(false);

      expect(isLessSevere(LogLevel.FATAL, LogLevel.ERROR)).toBe(false);
    });
  });

  /**
   * Tests for getMostSevereLevel function which finds the most severe level from an array.
   * Verifies handling of empty arrays, single elements, and duplicate levels.
   */
  describe('getMostSevereLevel', () => {
    it('should return the most severe level from an array of levels', () => {
      expect(getMostSevereLevel([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN])).toBe(LogLevel.WARN);
      expect(getMostSevereLevel([LogLevel.INFO, LogLevel.ERROR, LogLevel.WARN])).toBe(LogLevel.ERROR);
      expect(getMostSevereLevel([LogLevel.DEBUG, LogLevel.FATAL, LogLevel.INFO])).toBe(LogLevel.FATAL);
      expect(getMostSevereLevel([LogLevel.ERROR, LogLevel.WARN, LogLevel.DEBUG])).toBe(LogLevel.ERROR);
    });

    it('should return the default log level for an empty array', () => {
      expect(getMostSevereLevel([])).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should return the only level in a single-element array', () => {
      expect(getMostSevereLevel([LogLevel.DEBUG])).toBe(LogLevel.DEBUG);
      expect(getMostSevereLevel([LogLevel.INFO])).toBe(LogLevel.INFO);
      expect(getMostSevereLevel([LogLevel.WARN])).toBe(LogLevel.WARN);
      expect(getMostSevereLevel([LogLevel.ERROR])).toBe(LogLevel.ERROR);
      expect(getMostSevereLevel([LogLevel.FATAL])).toBe(LogLevel.FATAL);
    });

    it('should handle duplicate levels correctly', () => {
      expect(getMostSevereLevel([LogLevel.DEBUG, LogLevel.DEBUG])).toBe(LogLevel.DEBUG);
      expect(getMostSevereLevel([LogLevel.ERROR, LogLevel.ERROR, LogLevel.ERROR])).toBe(LogLevel.ERROR);
      expect(getMostSevereLevel([LogLevel.INFO, LogLevel.WARN, LogLevel.WARN])).toBe(LogLevel.WARN);
      expect(getMostSevereLevel([LogLevel.FATAL, LogLevel.DEBUG, LogLevel.FATAL])).toBe(LogLevel.FATAL);
    });
  });

  /**
   * Tests for parseLogLevelFromEnv function which retrieves log levels from environment variables.
   * Verifies proper handling of missing or invalid environment variables.
   */
  describe('parseLogLevelFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Create a fresh copy of process.env for each test
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original process.env after each test
      process.env = originalEnv;
    });

    it('should parse log level from environment variable', () => {
      process.env.TEST_LOG_LEVEL = 'debug';
      expect(parseLogLevelFromEnv('TEST_LOG_LEVEL')).toBe(LogLevel.DEBUG);

      process.env.TEST_LOG_LEVEL = 'ERROR';
      expect(parseLogLevelFromEnv('TEST_LOG_LEVEL')).toBe(LogLevel.ERROR);

      process.env.TEST_LOG_LEVEL = 'Warn';
      expect(parseLogLevelFromEnv('TEST_LOG_LEVEL')).toBe(LogLevel.WARN);
    });

    it('should return default log level when environment variable is not set', () => {
      // Ensure the environment variable is not set
      delete process.env.NONEXISTENT_VAR;
      expect(parseLogLevelFromEnv('NONEXISTENT_VAR')).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should return specified default level when environment variable is not set', () => {
      delete process.env.NONEXISTENT_VAR;
      expect(parseLogLevelFromEnv('NONEXISTENT_VAR', LogLevel.ERROR)).toBe(LogLevel.ERROR);
    });

    it('should return default log level when environment variable has invalid value', () => {
      process.env.INVALID_LEVEL_VAR = 'not_a_level';
      expect(parseLogLevelFromEnv('INVALID_LEVEL_VAR')).toBe(DEFAULT_LOG_LEVEL);
    });
  });

  /**
   * Tests for getJourneyLogLevel function which retrieves journey-specific log levels.
   * Verifies fallback behavior to global log level and default values.
   */
  describe('getJourneyLogLevel', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return journey-specific log level when set', () => {
      process.env.TEST_JOURNEY_LOG_LEVEL = 'error';
      expect(getJourneyLogLevel('TEST_JOURNEY')).toBe(LogLevel.ERROR);
    });

    it('should fall back to global log level when journey-specific level is not set', () => {
      delete process.env.TEST_JOURNEY_LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';
      expect(getJourneyLogLevel('TEST_JOURNEY')).toBe(LogLevel.WARN);
    });

    it('should use default level when neither journey-specific nor global level is set', () => {
      delete process.env.TEST_JOURNEY_LOG_LEVEL;
      delete process.env.LOG_LEVEL;
      expect(getJourneyLogLevel('TEST_JOURNEY')).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should use provided default level when no levels are configured', () => {
      delete process.env.TEST_JOURNEY_LOG_LEVEL;
      delete process.env.LOG_LEVEL;
      expect(getJourneyLogLevel('TEST_JOURNEY', LogLevel.ERROR)).toBe(LogLevel.ERROR);
    });

    it('should handle all journey prefixes correctly', () => {
      // Test with actual journey prefixes from the constants
      process.env.HEALTH_JOURNEY_LOG_LEVEL = 'debug';
      process.env.CARE_JOURNEY_LOG_LEVEL = 'warn';
      process.env.PLAN_JOURNEY_LOG_LEVEL = 'error';

      expect(getJourneyLogLevel(JOURNEY_ENV_PREFIXES.HEALTH)).toBe(LogLevel.DEBUG);
      expect(getJourneyLogLevel(JOURNEY_ENV_PREFIXES.CARE)).toBe(LogLevel.WARN);
      expect(getJourneyLogLevel(JOURNEY_ENV_PREFIXES.PLAN)).toBe(LogLevel.ERROR);
    });
  });

  /**
   * Tests for boundary cases and edge conditions to ensure robust error handling.
   * Verifies that the utility functions handle unexpected inputs gracefully.
   */
  describe('Boundary and Error Cases', () => {
    it('should handle non-string inputs to parseLogLevel gracefully', () => {
      // @ts-expect-error Testing with invalid input type
      expect(parseLogLevel(123)).toBe(DEFAULT_LOG_LEVEL);
      // @ts-expect-error Testing with invalid input type
      expect(parseLogLevel(null)).toBe(DEFAULT_LOG_LEVEL);
      // @ts-expect-error Testing with invalid input type
      expect(parseLogLevel({})).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should handle invalid enum values gracefully', () => {
      // @ts-expect-error Testing with invalid enum value
      expect(() => logLevelToString(99)).toThrow();
      // @ts-expect-error Testing with invalid enum value
      expect(() => getLogLevelValue(-1)).toThrow();
    });

    it('should handle mixed case and whitespace in log level strings', () => {
      expect(parseLogLevel('  DEBUG  ')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('\tinfo\n')).toBe(LogLevel.INFO);
      expect(parseLogLevel('  WaRn  ')).toBe(LogLevel.WARN);
    });
  });
});