import { describe, expect, it } from '@jest/globals';

// Import the constants to test
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  HTTP_STATUS_MAPPINGS,
  RETRY_CONFIGURATIONS,
  JOURNEY_ERROR_PREFIXES
} from '../../src/constants';

describe('Error Constants', () => {
  describe('ERROR_CODES', () => {
    it('should export ERROR_CODES as an object', () => {
      expect(ERROR_CODES).toBeDefined();
      expect(typeof ERROR_CODES).toBe('object');
    });

    it('should contain common error codes', () => {
      // Common error codes that should exist
      const expectedCommonCodes = [
        'INTERNAL_ERROR',
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'BAD_REQUEST',
        'SERVICE_UNAVAILABLE'
      ];

      expectedCommonCodes.forEach(code => {
        expect(ERROR_CODES).toHaveProperty(code);
        expect(typeof ERROR_CODES[code]).toBe('string');
      });
    });

    it('should have journey-specific error code prefixes', () => {
      // Check that journey-specific error codes exist with proper prefixes
      const journeyPrefixes = ['HEALTH_', 'CARE_', 'PLAN_'];
      
      // Verify that at least some error codes exist with each prefix
      journeyPrefixes.forEach(prefix => {
        const hasCodesWithPrefix = Object.values(ERROR_CODES).some(
          (code: string) => code.startsWith(prefix)
        );
        expect(hasCodesWithPrefix).toBe(true);
      });
    });
  });

  describe('JOURNEY_ERROR_PREFIXES', () => {
    it('should export JOURNEY_ERROR_PREFIXES as an object', () => {
      expect(JOURNEY_ERROR_PREFIXES).toBeDefined();
      expect(typeof JOURNEY_ERROR_PREFIXES).toBe('object');
    });

    it('should contain prefixes for all journeys', () => {
      expect(JOURNEY_ERROR_PREFIXES).toHaveProperty('HEALTH');
      expect(JOURNEY_ERROR_PREFIXES).toHaveProperty('CARE');
      expect(JOURNEY_ERROR_PREFIXES).toHaveProperty('PLAN');
      
      expect(JOURNEY_ERROR_PREFIXES.HEALTH).toBe('HEALTH_');
      expect(JOURNEY_ERROR_PREFIXES.CARE).toBe('CARE_');
      expect(JOURNEY_ERROR_PREFIXES.PLAN).toBe('PLAN_');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should export ERROR_MESSAGES as an object', () => {
      expect(ERROR_MESSAGES).toBeDefined();
      expect(typeof ERROR_MESSAGES).toBe('object');
    });

    it('should contain message templates for all error codes', () => {
      // All error codes should have corresponding message templates
      Object.keys(ERROR_CODES).forEach(codeKey => {
        const errorCode = ERROR_CODES[codeKey];
        expect(ERROR_MESSAGES).toHaveProperty(errorCode);
        expect(typeof ERROR_MESSAGES[errorCode]).toBe('string');
      });
    });

    it('should have properly formatted message templates', () => {
      // Message templates should be strings and may contain placeholders like {0}, {1}, etc.
      const messageTemplateRegex = /^[^{}]*(?:\{\d+\}[^{}]*)*$/;
      
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string');
        // Check if message templates with placeholders are properly formatted
        if (message.includes('{')) {
          expect(message).toMatch(messageTemplateRegex);
        }
      });
    });
  });

  describe('HTTP_STATUS_MAPPINGS', () => {
    it('should export HTTP_STATUS_MAPPINGS as an object', () => {
      expect(HTTP_STATUS_MAPPINGS).toBeDefined();
      expect(typeof HTTP_STATUS_MAPPINGS).toBe('object');
    });

    it('should map error types to valid HTTP status codes', () => {
      // Common error types and their expected HTTP status codes
      const expectedMappings = {
        'VALIDATION': 400, // Bad Request
        'BUSINESS': 422,   // Unprocessable Entity
        'TECHNICAL': 500,  // Internal Server Error
        'EXTERNAL': 502,   // Bad Gateway
        'UNAUTHORIZED': 401,
        'FORBIDDEN': 403,
        'NOT_FOUND': 404,
        'CONFLICT': 409,
        'SERVICE_UNAVAILABLE': 503
      };

      Object.entries(expectedMappings).forEach(([errorType, statusCode]) => {
        expect(HTTP_STATUS_MAPPINGS).toHaveProperty(errorType);
        expect(HTTP_STATUS_MAPPINGS[errorType]).toBe(statusCode);
      });
    });

    it('should only contain valid HTTP status codes', () => {
      // Valid HTTP status codes range from 100 to 599
      Object.values(HTTP_STATUS_MAPPINGS).forEach(statusCode => {
        expect(typeof statusCode).toBe('number');
        expect(statusCode).toBeGreaterThanOrEqual(100);
        expect(statusCode).toBeLessThanOrEqual(599);
      });
    });
  });

  describe('RETRY_CONFIGURATIONS', () => {
    it('should export RETRY_CONFIGURATIONS as an object', () => {
      expect(RETRY_CONFIGURATIONS).toBeDefined();
      expect(typeof RETRY_CONFIGURATIONS).toBe('object');
    });

    it('should define retry configurations for different error scenarios', () => {
      // Common retry configuration scenarios
      const expectedScenarios = [
        'DEFAULT',
        'NETWORK_ERROR',
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR',
        'RATE_LIMIT_ERROR'
      ];

      expectedScenarios.forEach(scenario => {
        expect(RETRY_CONFIGURATIONS).toHaveProperty(scenario);
        expect(typeof RETRY_CONFIGURATIONS[scenario]).toBe('object');
      });
    });

    it('should have valid retry configuration parameters', () => {
      // Each retry configuration should have these parameters
      const requiredParams = [
        'maxRetries',
        'initialDelayMs',
        'maxDelayMs',
        'backoffFactor',
        'jitterFactor'
      ];

      Object.values(RETRY_CONFIGURATIONS).forEach(config => {
        requiredParams.forEach(param => {
          expect(config).toHaveProperty(param);
        });

        // Validate parameter types and ranges
        expect(typeof config.maxRetries).toBe('number');
        expect(config.maxRetries).toBeGreaterThanOrEqual(0);
        expect(config.maxRetries).toBeLessThanOrEqual(10); // Reasonable upper limit

        expect(typeof config.initialDelayMs).toBe('number');
        expect(config.initialDelayMs).toBeGreaterThanOrEqual(0);
        
        expect(typeof config.maxDelayMs).toBe('number');
        expect(config.maxDelayMs).toBeGreaterThanOrEqual(config.initialDelayMs);
        
        expect(typeof config.backoffFactor).toBe('number');
        expect(config.backoffFactor).toBeGreaterThanOrEqual(1);
        
        expect(typeof config.jitterFactor).toBe('number');
        expect(config.jitterFactor).toBeGreaterThanOrEqual(0);
        expect(config.jitterFactor).toBeLessThanOrEqual(1);
      });
    });

    it('should have reasonable retry limits for different scenarios', () => {
      // Network errors might need more retries than other types
      expect(RETRY_CONFIGURATIONS.NETWORK_ERROR.maxRetries)
        .toBeGreaterThanOrEqual(RETRY_CONFIGURATIONS.DEFAULT.maxRetries);
      
      // Rate limit errors should have longer delays
      expect(RETRY_CONFIGURATIONS.RATE_LIMIT_ERROR.initialDelayMs)
        .toBeGreaterThanOrEqual(RETRY_CONFIGURATIONS.DEFAULT.initialDelayMs);
    });
  });
});