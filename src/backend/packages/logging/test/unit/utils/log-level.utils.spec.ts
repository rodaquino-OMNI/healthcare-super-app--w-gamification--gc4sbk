import { LogLevel, LogLevelUtils } from '../../../src/interfaces/log-level.enum';
import {
  parseLogLevel,
  logLevelToString,
  getLogLevelValue,
  shouldLog,
  getLogLevelFromEnv,
  getJourneyLogLevel,
  createLogLevelFilter,
  parseJourneyLogLevels,
  DEFAULT_LOG_LEVEL,
  JOURNEY_LOG_LEVEL_PREFIX,
  LOG_LEVEL_ENV_VAR
} from '../../../src/utils/level.utils';

describe('Log Level Utilities', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env[LOG_LEVEL_ENV_VAR];
    delete process.env[`${JOURNEY_LOG_LEVEL_PREFIX}HEALTH_LOG_LEVEL`];
    delete process.env[`${JOURNEY_LOG_LEVEL_PREFIX}CARE_LOG_LEVEL`];
    delete process.env[`${JOURNEY_LOG_LEVEL_PREFIX}PLAN_LOG_LEVEL`];
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('parseLogLevel', () => {
    it('should parse valid log level strings', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('INFO')).toBe(LogLevel.INFO);
      expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('FATAL')).toBe(LogLevel.FATAL);
    });

    it('should be case-insensitive when parsing log level strings', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('Info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('warn')).toBe(LogLevel.WARN);
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('Fatal')).toBe(LogLevel.FATAL);
    });

    it('should parse numeric string values', () => {
      expect(parseLogLevel('0')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('1')).toBe(LogLevel.INFO);
      expect(parseLogLevel('2')).toBe(LogLevel.WARN);
      expect(parseLogLevel('3')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('4')).toBe(LogLevel.FATAL);
    });

    it('should return default log level for invalid inputs', () => {
      expect(parseLogLevel('')).toBe(DEFAULT_LOG_LEVEL);
      expect(parseLogLevel(null as unknown as string)).toBe(DEFAULT_LOG_LEVEL);
      expect(parseLogLevel(undefined as unknown as string)).toBe(DEFAULT_LOG_LEVEL);
      expect(parseLogLevel('INVALID_LEVEL')).toBe(DEFAULT_LOG_LEVEL);
      expect(parseLogLevel('5')).toBe(DEFAULT_LOG_LEVEL); // Out of range
      expect(parseLogLevel('-1')).toBe(DEFAULT_LOG_LEVEL); // Out of range
    });
  });

  describe('logLevelToString', () => {
    it('should convert log level enum values to strings', () => {
      expect(logLevelToString(LogLevel.DEBUG)).toBe('DEBUG');
      expect(logLevelToString(LogLevel.INFO)).toBe('INFO');
      expect(logLevelToString(LogLevel.WARN)).toBe('WARN');
      expect(logLevelToString(LogLevel.ERROR)).toBe('ERROR');
      expect(logLevelToString(LogLevel.FATAL)).toBe('FATAL');
    });
  });

  describe('getLogLevelValue', () => {
    it('should return the numeric value of log levels', () => {
      expect(getLogLevelValue(LogLevel.DEBUG)).toBe(0);
      expect(getLogLevelValue(LogLevel.INFO)).toBe(1);
      expect(getLogLevelValue(LogLevel.WARN)).toBe(2);
      expect(getLogLevelValue(LogLevel.ERROR)).toBe(3);
      expect(getLogLevelValue(LogLevel.FATAL)).toBe(4);
    });
  });

  describe('shouldLog', () => {
    it('should return true when message level is equal to configured level', () => {
      expect(shouldLog(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(true);
      expect(shouldLog(LogLevel.INFO, LogLevel.INFO)).toBe(true);
      expect(shouldLog(LogLevel.WARN, LogLevel.WARN)).toBe(true);
      expect(shouldLog(LogLevel.ERROR, LogLevel.ERROR)).toBe(true);
      expect(shouldLog(LogLevel.FATAL, LogLevel.FATAL)).toBe(true);
    });

    it('should return true when message level is higher than configured level', () => {
      expect(shouldLog(LogLevel.INFO, LogLevel.DEBUG)).toBe(true);
      expect(shouldLog(LogLevel.WARN, LogLevel.DEBUG)).toBe(true);
      expect(shouldLog(LogLevel.ERROR, LogLevel.DEBUG)).toBe(true);
      expect(shouldLog(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);
      
      expect(shouldLog(LogLevel.WARN, LogLevel.INFO)).toBe(true);
      expect(shouldLog(LogLevel.ERROR, LogLevel.INFO)).toBe(true);
      expect(shouldLog(LogLevel.FATAL, LogLevel.INFO)).toBe(true);
      
      expect(shouldLog(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
      expect(shouldLog(LogLevel.FATAL, LogLevel.WARN)).toBe(true);
      
      expect(shouldLog(LogLevel.FATAL, LogLevel.ERROR)).toBe(true);
    });

    it('should return false when message level is lower than configured level', () => {
      expect(shouldLog(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
      expect(shouldLog(LogLevel.DEBUG, LogLevel.WARN)).toBe(false);
      expect(shouldLog(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
      expect(shouldLog(LogLevel.DEBUG, LogLevel.FATAL)).toBe(false);
      
      expect(shouldLog(LogLevel.INFO, LogLevel.WARN)).toBe(false);
      expect(shouldLog(LogLevel.INFO, LogLevel.ERROR)).toBe(false);
      expect(shouldLog(LogLevel.INFO, LogLevel.FATAL)).toBe(false);
      
      expect(shouldLog(LogLevel.WARN, LogLevel.ERROR)).toBe(false);
      expect(shouldLog(LogLevel.WARN, LogLevel.FATAL)).toBe(false);
      
      expect(shouldLog(LogLevel.ERROR, LogLevel.FATAL)).toBe(false);
    });
  });

  describe('getLogLevelFromEnv', () => {
    it('should return the log level from environment variable', () => {
      process.env[LOG_LEVEL_ENV_VAR] = 'DEBUG';
      expect(getLogLevelFromEnv()).toBe(LogLevel.DEBUG);
      
      process.env[LOG_LEVEL_ENV_VAR] = 'ERROR';
      expect(getLogLevelFromEnv()).toBe(LogLevel.ERROR);
    });

    it('should return the default log level when environment variable is not set', () => {
      expect(getLogLevelFromEnv()).toBe(DEFAULT_LOG_LEVEL);
      expect(getLogLevelFromEnv(LogLevel.ERROR)).toBe(LogLevel.ERROR);
    });

    it('should handle invalid environment variable values', () => {
      process.env[LOG_LEVEL_ENV_VAR] = 'INVALID_LEVEL';
      expect(getLogLevelFromEnv()).toBe(DEFAULT_LOG_LEVEL);
      
      process.env[LOG_LEVEL_ENV_VAR] = '';
      expect(getLogLevelFromEnv()).toBe(DEFAULT_LOG_LEVEL);
    });
  });

  describe('getJourneyLogLevel', () => {
    it('should return journey-specific log level when set', () => {
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}HEALTH_LOG_LEVEL`] = 'DEBUG';
      expect(getJourneyLogLevel('HEALTH')).toBe(LogLevel.DEBUG);
      
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}CARE_LOG_LEVEL`] = 'ERROR';
      expect(getJourneyLogLevel('CARE')).toBe(LogLevel.ERROR);
    });

    it('should be case-insensitive for journey names', () => {
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}HEALTH_LOG_LEVEL`] = 'DEBUG';
      expect(getJourneyLogLevel('health')).toBe(LogLevel.DEBUG);
      
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}CARE_LOG_LEVEL`] = 'ERROR';
      expect(getJourneyLogLevel('care')).toBe(LogLevel.ERROR);
    });

    it('should fall back to global log level when journey-specific level is not set', () => {
      process.env[LOG_LEVEL_ENV_VAR] = 'WARN';
      expect(getJourneyLogLevel('HEALTH')).toBe(LogLevel.WARN);
    });

    it('should return default log level when neither journey-specific nor global level is set', () => {
      expect(getJourneyLogLevel('HEALTH')).toBe(DEFAULT_LOG_LEVEL);
      expect(getJourneyLogLevel('HEALTH', LogLevel.ERROR)).toBe(LogLevel.ERROR);
    });

    it('should handle invalid journey names', () => {
      expect(getJourneyLogLevel('')).toBe(DEFAULT_LOG_LEVEL);
      expect(getJourneyLogLevel(null as unknown as string)).toBe(DEFAULT_LOG_LEVEL);
      expect(getJourneyLogLevel(undefined as unknown as string)).toBe(DEFAULT_LOG_LEVEL);
    });
  });

  describe('createLogLevelFilter', () => {
    it('should create a filter function that correctly filters log levels', () => {
      const filterDebug = createLogLevelFilter(LogLevel.DEBUG);
      expect(filterDebug(LogLevel.DEBUG)).toBe(true);
      expect(filterDebug(LogLevel.INFO)).toBe(true);
      expect(filterDebug(LogLevel.WARN)).toBe(true);
      expect(filterDebug(LogLevel.ERROR)).toBe(true);
      expect(filterDebug(LogLevel.FATAL)).toBe(true);
      
      const filterWarn = createLogLevelFilter(LogLevel.WARN);
      expect(filterWarn(LogLevel.DEBUG)).toBe(false);
      expect(filterWarn(LogLevel.INFO)).toBe(false);
      expect(filterWarn(LogLevel.WARN)).toBe(true);
      expect(filterWarn(LogLevel.ERROR)).toBe(true);
      expect(filterWarn(LogLevel.FATAL)).toBe(true);
      
      const filterFatal = createLogLevelFilter(LogLevel.FATAL);
      expect(filterFatal(LogLevel.DEBUG)).toBe(false);
      expect(filterFatal(LogLevel.INFO)).toBe(false);
      expect(filterFatal(LogLevel.WARN)).toBe(false);
      expect(filterFatal(LogLevel.ERROR)).toBe(false);
      expect(filterFatal(LogLevel.FATAL)).toBe(true);
    });
  });

  describe('parseJourneyLogLevels', () => {
    it('should parse log levels for all journeys', () => {
      process.env[LOG_LEVEL_ENV_VAR] = 'WARN';
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}HEALTH_LOG_LEVEL`] = 'DEBUG';
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}CARE_LOG_LEVEL`] = 'ERROR';
      
      const levels = parseJourneyLogLevels();
      
      expect(levels['HEALTH']).toBe(LogLevel.DEBUG);
      expect(levels['CARE']).toBe(LogLevel.ERROR);
      expect(levels['PLAN']).toBe(LogLevel.WARN); // Falls back to global level
    });

    it('should use default level when no environment variables are set', () => {
      const levels = parseJourneyLogLevels();
      
      expect(levels['HEALTH']).toBe(DEFAULT_LOG_LEVEL);
      expect(levels['CARE']).toBe(DEFAULT_LOG_LEVEL);
      expect(levels['PLAN']).toBe(DEFAULT_LOG_LEVEL);
    });

    it('should accept custom journey list', () => {
      process.env[`${JOURNEY_LOG_LEVEL_PREFIX}CUSTOM_LOG_LEVEL`] = 'DEBUG';
      
      const levels = parseJourneyLogLevels(['CUSTOM']);
      
      expect(levels['CUSTOM']).toBe(LogLevel.DEBUG);
    });

    it('should use provided default level when no environment variables are set', () => {
      const levels = parseJourneyLogLevels(['HEALTH', 'CARE', 'PLAN'], LogLevel.ERROR);
      
      expect(levels['HEALTH']).toBe(LogLevel.ERROR);
      expect(levels['CARE']).toBe(LogLevel.ERROR);
      expect(levels['PLAN']).toBe(LogLevel.ERROR);
    });
  });

  describe('LogLevelUtils', () => {
    describe('toString', () => {
      it('should convert log level enum values to strings', () => {
        expect(LogLevelUtils.toString(LogLevel.DEBUG)).toBe('DEBUG');
        expect(LogLevelUtils.toString(LogLevel.INFO)).toBe('INFO');
        expect(LogLevelUtils.toString(LogLevel.WARN)).toBe('WARN');
        expect(LogLevelUtils.toString(LogLevel.ERROR)).toBe('ERROR');
        expect(LogLevelUtils.toString(LogLevel.FATAL)).toBe('FATAL');
      });
    });

    describe('fromString', () => {
      it('should convert valid strings to log level enum values', () => {
        expect(LogLevelUtils.fromString('DEBUG')).toBe(LogLevel.DEBUG);
        expect(LogLevelUtils.fromString('INFO')).toBe(LogLevel.INFO);
        expect(LogLevelUtils.fromString('WARN')).toBe(LogLevel.WARN);
        expect(LogLevelUtils.fromString('ERROR')).toBe(LogLevel.ERROR);
        expect(LogLevelUtils.fromString('FATAL')).toBe(LogLevel.FATAL);
      });

      it('should be case-insensitive', () => {
        expect(LogLevelUtils.fromString('debug')).toBe(LogLevel.DEBUG);
        expect(LogLevelUtils.fromString('Info')).toBe(LogLevel.INFO);
        expect(LogLevelUtils.fromString('warn')).toBe(LogLevel.WARN);
        expect(LogLevelUtils.fromString('ERROR')).toBe(LogLevel.ERROR);
        expect(LogLevelUtils.fromString('Fatal')).toBe(LogLevel.FATAL);
      });

      it('should return undefined for invalid inputs', () => {
        expect(LogLevelUtils.fromString('INVALID_LEVEL')).toBeUndefined();
        expect(LogLevelUtils.fromString('')).toBeUndefined();
      });
    });

    describe('isLevelEnabled', () => {
      it('should return true when level is equal to or higher than minimum level', () => {
        expect(LogLevelUtils.isLevelEnabled(LogLevel.DEBUG, LogLevel.DEBUG)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.INFO, LogLevel.DEBUG)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.WARN, LogLevel.DEBUG)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.ERROR, LogLevel.DEBUG)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.FATAL, LogLevel.DEBUG)).toBe(true);
        
        expect(LogLevelUtils.isLevelEnabled(LogLevel.WARN, LogLevel.WARN)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.ERROR, LogLevel.WARN)).toBe(true);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.FATAL, LogLevel.WARN)).toBe(true);
      });

      it('should return false when level is lower than minimum level', () => {
        expect(LogLevelUtils.isLevelEnabled(LogLevel.DEBUG, LogLevel.INFO)).toBe(false);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.DEBUG, LogLevel.WARN)).toBe(false);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.DEBUG, LogLevel.ERROR)).toBe(false);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.DEBUG, LogLevel.FATAL)).toBe(false);
        
        expect(LogLevelUtils.isLevelEnabled(LogLevel.INFO, LogLevel.WARN)).toBe(false);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.INFO, LogLevel.ERROR)).toBe(false);
        expect(LogLevelUtils.isLevelEnabled(LogLevel.INFO, LogLevel.FATAL)).toBe(false);
      });
    });

    describe('getAllLevels', () => {
      it('should return all log level strings', () => {
        const levels = LogLevelUtils.getAllLevels();
        expect(levels).toContain('DEBUG');
        expect(levels).toContain('INFO');
        expect(levels).toContain('WARN');
        expect(levels).toContain('ERROR');
        expect(levels).toContain('FATAL');
        expect(levels.length).toBe(5);
      });
    });

    describe('getAllLevelValues', () => {
      it('should return all log level enum values', () => {
        const levels = LogLevelUtils.getAllLevelValues();
        expect(levels).toContain(LogLevel.DEBUG);
        expect(levels).toContain(LogLevel.INFO);
        expect(levels).toContain(LogLevel.WARN);
        expect(levels).toContain(LogLevel.ERROR);
        expect(levels).toContain(LogLevel.FATAL);
        expect(levels.length).toBe(5);
      });
    });
  });
});