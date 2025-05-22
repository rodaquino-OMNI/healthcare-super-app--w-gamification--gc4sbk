import { HttpStatus } from '@nestjs/common';
import {
  ErrorType,
  ERROR_TYPE_TO_HTTP_STATUS,
  ERROR_CODE_PREFIXES,
  COMMON_ERROR_CODES,
  HEALTH_ERROR_CODES,
  CARE_ERROR_CODES,
  PLAN_ERROR_CODES,
  GAMIFICATION_ERROR_CODES,
  AUTH_ERROR_CODES,
  ERROR_MESSAGES,
  RETRY_CONFIG,
  DLQ_CONFIG,
  CIRCUIT_BREAKER_CONFIG,
  FALLBACK_STRATEGY,
  CACHE_CONFIG
} from '../../src/constants';

describe('Error Constants', () => {
  describe('ErrorType enum', () => {
    it('should define all required error types', () => {
      expect(ErrorType.VALIDATION).toBe('VALIDATION');
      expect(ErrorType.BUSINESS).toBe('BUSINESS');
      expect(ErrorType.EXTERNAL).toBe('EXTERNAL');
      expect(ErrorType.TECHNICAL).toBe('TECHNICAL');
    });

    it('should have exactly 4 error types', () => {
      const errorTypeCount = Object.keys(ErrorType).length;
      expect(errorTypeCount).toBe(4);
    });
  });

  describe('ERROR_TYPE_TO_HTTP_STATUS mapping', () => {
    it('should map all error types to appropriate HTTP status codes', () => {
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.VALIDATION]).toBe(HttpStatus.BAD_REQUEST);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.BUSINESS]).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.EXTERNAL]).toBe(HttpStatus.BAD_GATEWAY);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.TECHNICAL]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should have a mapping for every error type', () => {
      const errorTypes = Object.values(ErrorType);
      const mappedTypes = Object.keys(ERROR_TYPE_TO_HTTP_STATUS);
      
      expect(mappedTypes.length).toBe(errorTypes.length);
      errorTypes.forEach(type => {
        expect(ERROR_TYPE_TO_HTTP_STATUS[type]).toBeDefined();
      });
    });
  });

  describe('ERROR_CODE_PREFIXES', () => {
    it('should define all journey-specific prefixes', () => {
      expect(ERROR_CODE_PREFIXES.HEALTH).toBe('HEALTH_');
      expect(ERROR_CODE_PREFIXES.CARE).toBe('CARE_');
      expect(ERROR_CODE_PREFIXES.PLAN).toBe('PLAN_');
      expect(ERROR_CODE_PREFIXES.GAMIFICATION).toBe('GAMIFICATION_');
      expect(ERROR_CODE_PREFIXES.AUTH).toBe('AUTH_');
      expect(ERROR_CODE_PREFIXES.GENERAL).toBe('GENERAL_');
    });

    it('should have all prefixes ending with underscore', () => {
      Object.values(ERROR_CODE_PREFIXES).forEach(prefix => {
        expect(prefix.endsWith('_')).toBe(true);
      });
    });
  });

  describe('Common Error Codes', () => {
    it('should define all common error codes', () => {
      expect(COMMON_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(COMMON_ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(COMMON_ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(COMMON_ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(COMMON_ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
      expect(COMMON_ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(COMMON_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
      expect(COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(COMMON_ERROR_CODES.CONFLICT).toBe('CONFLICT');
    });

    it('should have at least 10 common error codes', () => {
      expect(Object.keys(COMMON_ERROR_CODES).length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Journey-specific Error Codes', () => {
    it('should prefix all health error codes with HEALTH_', () => {
      Object.values(HEALTH_ERROR_CODES).forEach(code => {
        expect(code.startsWith(ERROR_CODE_PREFIXES.HEALTH)).toBe(true);
      });
    });

    it('should prefix all care error codes with CARE_', () => {
      Object.values(CARE_ERROR_CODES).forEach(code => {
        expect(code.startsWith(ERROR_CODE_PREFIXES.CARE)).toBe(true);
      });
    });

    it('should prefix all plan error codes with PLAN_', () => {
      Object.values(PLAN_ERROR_CODES).forEach(code => {
        expect(code.startsWith(ERROR_CODE_PREFIXES.PLAN)).toBe(true);
      });
    });

    it('should prefix all gamification error codes with GAMIFICATION_', () => {
      Object.values(GAMIFICATION_ERROR_CODES).forEach(code => {
        expect(code.startsWith(ERROR_CODE_PREFIXES.GAMIFICATION)).toBe(true);
      });
    });

    it('should prefix all auth error codes with AUTH_', () => {
      Object.values(AUTH_ERROR_CODES).forEach(code => {
        expect(code.startsWith(ERROR_CODE_PREFIXES.AUTH)).toBe(true);
      });
    });

    it('should have at least 5 error codes for each journey', () => {
      expect(Object.keys(HEALTH_ERROR_CODES).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(CARE_ERROR_CODES).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(PLAN_ERROR_CODES).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(GAMIFICATION_ERROR_CODES).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(AUTH_ERROR_CODES).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Error Messages', () => {
    it('should have a message for each common error code', () => {
      Object.keys(COMMON_ERROR_CODES).forEach(key => {
        const errorCode = COMMON_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have a message for each health error code', () => {
      Object.keys(HEALTH_ERROR_CODES).forEach(key => {
        const errorCode = HEALTH_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have a message for each care error code', () => {
      Object.keys(CARE_ERROR_CODES).forEach(key => {
        const errorCode = CARE_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have a message for each plan error code', () => {
      Object.keys(PLAN_ERROR_CODES).forEach(key => {
        const errorCode = PLAN_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have a message for each gamification error code', () => {
      Object.keys(GAMIFICATION_ERROR_CODES).forEach(key => {
        const errorCode = GAMIFICATION_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have a message for each auth error code', () => {
      Object.keys(AUTH_ERROR_CODES).forEach(key => {
        const errorCode = AUTH_ERROR_CODES[key];
        expect(ERROR_MESSAGES[errorCode]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });
  });

  describe('Retry Configuration', () => {
    it('should define all required retry configurations', () => {
      expect(RETRY_CONFIG.DEFAULT).toBeDefined();
      expect(RETRY_CONFIG.DATABASE).toBeDefined();
      expect(RETRY_CONFIG.EXTERNAL_API).toBeDefined();
      expect(RETRY_CONFIG.EVENT_PROCESSING).toBeDefined();
      expect(RETRY_CONFIG.NOTIFICATION).toBeDefined();
    });

    it('should have valid retry attempt ranges', () => {
      // Check that max attempts are within reasonable ranges
      Object.values(RETRY_CONFIG).forEach(config => {
        expect(config.MAX_ATTEMPTS).toBeGreaterThanOrEqual(1);
        expect(config.MAX_ATTEMPTS).toBeLessThanOrEqual(20); // Reasonable upper limit
      });
    });

    it('should have valid delay ranges', () => {
      // Check that delays are within reasonable ranges
      Object.values(RETRY_CONFIG).forEach(config => {
        // Initial delay should be positive
        expect(config.INITIAL_DELAY_MS).toBeGreaterThan(0);
        
        // Max delay should be greater than initial delay
        expect(config.MAX_DELAY_MS).toBeGreaterThan(config.INITIAL_DELAY_MS);
        
        // Max delay should be reasonable (less than 10 minutes)
        expect(config.MAX_DELAY_MS).toBeLessThanOrEqual(10 * 60 * 1000);
      });
    });

    it('should have valid backoff factors', () => {
      Object.values(RETRY_CONFIG).forEach(config => {
        expect(config.BACKOFF_FACTOR).toBeGreaterThanOrEqual(1);
        expect(config.BACKOFF_FACTOR).toBeLessThanOrEqual(10); // Reasonable upper limit
      });
    });

    it('should have valid jitter factors', () => {
      Object.values(RETRY_CONFIG).forEach(config => {
        expect(config.JITTER_FACTOR).toBeGreaterThanOrEqual(0);
        expect(config.JITTER_FACTOR).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Dead Letter Queue Configuration', () => {
    it('should define all required DLQ configuration parameters', () => {
      expect(DLQ_CONFIG.BATCH_SIZE).toBeDefined();
      expect(DLQ_CONFIG.PROCESSING_INTERVAL_MS).toBeDefined();
      expect(DLQ_CONFIG.MAX_AGE_MS).toBeDefined();
      expect(DLQ_CONFIG.MAX_RETRIES).toBeDefined();
    });

    it('should have valid batch size', () => {
      expect(DLQ_CONFIG.BATCH_SIZE).toBeGreaterThanOrEqual(1);
      expect(DLQ_CONFIG.BATCH_SIZE).toBeLessThanOrEqual(100); // Reasonable upper limit
    });

    it('should have valid processing interval', () => {
      expect(DLQ_CONFIG.PROCESSING_INTERVAL_MS).toBeGreaterThan(0);
      // Should be less than 1 hour
      expect(DLQ_CONFIG.PROCESSING_INTERVAL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
    });

    it('should have valid max age', () => {
      expect(DLQ_CONFIG.MAX_AGE_MS).toBeGreaterThan(0);
      // Should be less than 30 days
      expect(DLQ_CONFIG.MAX_AGE_MS).toBeLessThanOrEqual(30 * 24 * 60 * 60 * 1000);
    });

    it('should have valid max retries', () => {
      expect(DLQ_CONFIG.MAX_RETRIES).toBeGreaterThanOrEqual(1);
      expect(DLQ_CONFIG.MAX_RETRIES).toBeLessThanOrEqual(20); // Reasonable upper limit
    });
  });

  describe('Circuit Breaker Configuration', () => {
    it('should define all required circuit breaker configurations', () => {
      expect(CIRCUIT_BREAKER_CONFIG.DEFAULT).toBeDefined();
      expect(CIRCUIT_BREAKER_CONFIG.CRITICAL).toBeDefined();
      expect(CIRCUIT_BREAKER_CONFIG.NON_CRITICAL).toBeDefined();
    });

    it('should have valid failure threshold percentages', () => {
      Object.values(CIRCUIT_BREAKER_CONFIG).forEach(config => {
        expect(config.FAILURE_THRESHOLD_PERCENTAGE).toBeGreaterThan(0);
        expect(config.FAILURE_THRESHOLD_PERCENTAGE).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid request volume thresholds', () => {
      Object.values(CIRCUIT_BREAKER_CONFIG).forEach(config => {
        expect(config.REQUEST_VOLUME_THRESHOLD).toBeGreaterThanOrEqual(1);
        expect(config.REQUEST_VOLUME_THRESHOLD).toBeLessThanOrEqual(100); // Reasonable upper limit
      });
    });

    it('should have valid rolling window durations', () => {
      Object.values(CIRCUIT_BREAKER_CONFIG).forEach(config => {
        expect(config.ROLLING_WINDOW_MS).toBeGreaterThan(0);
        // Should be less than 5 minutes
        expect(config.ROLLING_WINDOW_MS).toBeLessThanOrEqual(5 * 60 * 1000);
      });
    });

    it('should have valid reset timeout durations', () => {
      Object.values(CIRCUIT_BREAKER_CONFIG).forEach(config => {
        expect(config.RESET_TIMEOUT_MS).toBeGreaterThan(0);
        // Should be less than 10 minutes
        expect(config.RESET_TIMEOUT_MS).toBeLessThanOrEqual(10 * 60 * 1000);
      });
    });
  });

  describe('Fallback Strategy', () => {
    it('should define all required fallback strategies', () => {
      expect(FALLBACK_STRATEGY.USE_CACHED_DATA).toBe('USE_CACHED_DATA');
      expect(FALLBACK_STRATEGY.USE_DEFAULT_VALUES).toBe('USE_DEFAULT_VALUES');
      expect(FALLBACK_STRATEGY.GRACEFUL_DEGRADATION).toBe('GRACEFUL_DEGRADATION');
      expect(FALLBACK_STRATEGY.RETURN_EMPTY).toBe('RETURN_EMPTY');
      expect(FALLBACK_STRATEGY.FAIL_FAST).toBe('FAIL_FAST');
    });

    it('should have at least 5 fallback strategies', () => {
      expect(Object.keys(FALLBACK_STRATEGY).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Cache Configuration', () => {
    it('should define all required cache configuration parameters', () => {
      expect(CACHE_CONFIG.DEFAULT_TTL_MS).toBeDefined();
      expect(CACHE_CONFIG.DEGRADED_SERVICE_TTL_MS).toBeDefined();
      expect(CACHE_CONFIG.MAX_ITEMS).toBeDefined();
    });

    it('should have valid TTL values', () => {
      expect(CACHE_CONFIG.DEFAULT_TTL_MS).toBeGreaterThan(0);
      expect(CACHE_CONFIG.DEGRADED_SERVICE_TTL_MS).toBeGreaterThan(CACHE_CONFIG.DEFAULT_TTL_MS);
      
      // Should be less than 1 day
      expect(CACHE_CONFIG.DEFAULT_TTL_MS).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      expect(CACHE_CONFIG.DEGRADED_SERVICE_TTL_MS).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('should have valid max items', () => {
      expect(CACHE_CONFIG.MAX_ITEMS).toBeGreaterThan(0);
      // Reasonable upper limit for in-memory cache
      expect(CACHE_CONFIG.MAX_ITEMS).toBeLessThanOrEqual(10000);
    });
  });
});