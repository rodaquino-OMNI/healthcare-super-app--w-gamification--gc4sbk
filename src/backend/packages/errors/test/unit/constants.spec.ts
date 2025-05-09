/**
 * Unit tests for error constants
 * 
 * These tests verify that all error-related constants are properly defined,
 * maintain the expected format, and have appropriate values.
 */

import { HttpStatus } from '@nestjs/common';
import {
  ErrorType,
  ERROR_CODE_PREFIXES,
  HEALTH_ERROR_PREFIXES,
  CARE_ERROR_PREFIXES,
  PLAN_ERROR_PREFIXES,
  ERROR_TYPE_TO_HTTP_STATUS,
  ERROR_SCENARIO_TO_HTTP_STATUS,
  DEFAULT_RETRY_CONFIG,
  DATABASE_RETRY_CONFIG,
  EXTERNAL_API_RETRY_CONFIG,
  KAFKA_RETRY_CONFIG,
  HEALTH_INTEGRATION_RETRY_CONFIG,
  DEVICE_SYNC_RETRY_CONFIG,
  NOTIFICATION_RETRY_CONFIG,
  ERROR_TYPE_TO_RETRY_CONFIG,
  RETRYABLE_HTTP_STATUS_CODES,
  ERROR_MESSAGES,
  HEALTH_ERROR_MESSAGES,
  CARE_ERROR_MESSAGES,
  PLAN_ERROR_MESSAGES,
  AUTH_ERROR_MESSAGES,
  GAMIFICATION_ERROR_MESSAGES,
  NOTIFICATION_ERROR_MESSAGES
} from '../../src/constants';

describe('Error Constants', () => {
  /**
   * Tests for error type constants
   */
  describe('ErrorType', () => {
    it('should define all required error types', () => {
      expect(ErrorType.VALIDATION).toBe('validation');
      expect(ErrorType.BUSINESS).toBe('business');
      expect(ErrorType.TECHNICAL).toBe('technical');
      expect(ErrorType.EXTERNAL).toBe('external');
    });

    it('should have exactly 4 error types', () => {
      const errorTypeCount = Object.keys(ErrorType).length / 2; // Enum creates both key->value and value->key mappings
      expect(errorTypeCount).toBe(4);
    });
  });

  /**
   * Tests for error code prefixes
   */
  describe('Error Code Prefixes', () => {
    it('should define all required general prefixes', () => {
      expect(ERROR_CODE_PREFIXES.GENERAL).toBe('GEN');
      expect(ERROR_CODE_PREFIXES.HEALTH).toBe('HEALTH');
      expect(ERROR_CODE_PREFIXES.CARE).toBe('CARE');
      expect(ERROR_CODE_PREFIXES.PLAN).toBe('PLAN');
      expect(ERROR_CODE_PREFIXES.AUTH).toBe('AUTH');
      expect(ERROR_CODE_PREFIXES.GAMIFICATION).toBe('GAME');
      expect(ERROR_CODE_PREFIXES.NOTIFICATION).toBe('NOTIF');
    });

    it('should define all required health journey prefixes', () => {
      expect(HEALTH_ERROR_PREFIXES.METRICS).toBe('HEALTH_METRICS');
      expect(HEALTH_ERROR_PREFIXES.GOALS).toBe('HEALTH_GOALS');
      expect(HEALTH_ERROR_PREFIXES.INSIGHTS).toBe('HEALTH_INSIGHTS');
      expect(HEALTH_ERROR_PREFIXES.DEVICES).toBe('HEALTH_DEVICES');
      expect(HEALTH_ERROR_PREFIXES.FHIR).toBe('HEALTH_FHIR');
    });

    it('should define all required care journey prefixes', () => {
      expect(CARE_ERROR_PREFIXES.APPOINTMENTS).toBe('CARE_APPT');
      expect(CARE_ERROR_PREFIXES.MEDICATIONS).toBe('CARE_MED');
      expect(CARE_ERROR_PREFIXES.PROVIDERS).toBe('CARE_PROV');
      expect(CARE_ERROR_PREFIXES.TELEMEDICINE).toBe('CARE_TELE');
      expect(CARE_ERROR_PREFIXES.TREATMENTS).toBe('CARE_TREAT');
      expect(CARE_ERROR_PREFIXES.SYMPTOM_CHECKER).toBe('CARE_SYMPT');
    });

    it('should define all required plan journey prefixes', () => {
      expect(PLAN_ERROR_PREFIXES.BENEFITS).toBe('PLAN_BENEF');
      expect(PLAN_ERROR_PREFIXES.CLAIMS).toBe('PLAN_CLAIM');
      expect(PLAN_ERROR_PREFIXES.COVERAGE).toBe('PLAN_COVER');
      expect(PLAN_ERROR_PREFIXES.DOCUMENTS).toBe('PLAN_DOC');
      expect(PLAN_ERROR_PREFIXES.PLANS).toBe('PLAN_PLAN');
    });

    it('should ensure all journey-specific prefixes start with the journey prefix', () => {
      // Health journey prefixes
      Object.values(HEALTH_ERROR_PREFIXES).forEach(prefix => {
        expect(prefix.startsWith(ERROR_CODE_PREFIXES.HEALTH)).toBe(true);
      });

      // Care journey prefixes
      Object.values(CARE_ERROR_PREFIXES).forEach(prefix => {
        expect(prefix.startsWith(ERROR_CODE_PREFIXES.CARE)).toBe(true);
      });

      // Plan journey prefixes
      Object.values(PLAN_ERROR_PREFIXES).forEach(prefix => {
        expect(prefix.startsWith(ERROR_CODE_PREFIXES.PLAN)).toBe(true);
      });
    });
  });

  /**
   * Tests for HTTP status code mappings
   */
  describe('HTTP Status Code Mappings', () => {
    it('should map all error types to correct HTTP status codes', () => {
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.VALIDATION]).toBe(HttpStatus.BAD_REQUEST);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.BUSINESS]).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.TECHNICAL]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(ERROR_TYPE_TO_HTTP_STATUS[ErrorType.EXTERNAL]).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should have a mapping for every error type', () => {
      Object.values(ErrorType).forEach(type => {
        if (typeof type === 'string') { // Filter out numeric enum values
          expect(ERROR_TYPE_TO_HTTP_STATUS[type]).toBeDefined();
        }
      });
    });

    it('should define all required error scenario HTTP status mappings', () => {
      // Authentication errors
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.UNAUTHORIZED).toBe(HttpStatus.UNAUTHORIZED);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.FORBIDDEN).toBe(HttpStatus.FORBIDDEN);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.TOKEN_EXPIRED).toBe(HttpStatus.UNAUTHORIZED);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.INVALID_CREDENTIALS).toBe(HttpStatus.UNAUTHORIZED);
      
      // Resource errors
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.NOT_FOUND).toBe(HttpStatus.NOT_FOUND);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.ALREADY_EXISTS).toBe(HttpStatus.CONFLICT);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.CONFLICT).toBe(HttpStatus.CONFLICT);
      
      // Request errors
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.BAD_REQUEST).toBe(HttpStatus.BAD_REQUEST);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.INVALID_PARAMETERS).toBe(HttpStatus.BAD_REQUEST);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      
      // Server errors
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.INTERNAL_ERROR).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.NOT_IMPLEMENTED).toBe(HttpStatus.NOT_IMPLEMENTED);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      
      // External errors
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.EXTERNAL_SERVICE_ERROR).toBe(HttpStatus.BAD_GATEWAY);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.GATEWAY_TIMEOUT).toBe(HttpStatus.GATEWAY_TIMEOUT);
      expect(ERROR_SCENARIO_TO_HTTP_STATUS.TOO_MANY_REQUESTS).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should define all retryable HTTP status codes', () => {
      expect(RETRYABLE_HTTP_STATUS_CODES).toContain(HttpStatus.TOO_MANY_REQUESTS);
      expect(RETRYABLE_HTTP_STATUS_CODES).toContain(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(RETRYABLE_HTTP_STATUS_CODES).toContain(HttpStatus.BAD_GATEWAY);
      expect(RETRYABLE_HTTP_STATUS_CODES).toContain(HttpStatus.SERVICE_UNAVAILABLE);
      expect(RETRYABLE_HTTP_STATUS_CODES).toContain(HttpStatus.GATEWAY_TIMEOUT);
      
      // Non-retryable status codes should not be included
      expect(RETRYABLE_HTTP_STATUS_CODES).not.toContain(HttpStatus.BAD_REQUEST);
      expect(RETRYABLE_HTTP_STATUS_CODES).not.toContain(HttpStatus.UNAUTHORIZED);
      expect(RETRYABLE_HTTP_STATUS_CODES).not.toContain(HttpStatus.FORBIDDEN);
      expect(RETRYABLE_HTTP_STATUS_CODES).not.toContain(HttpStatus.NOT_FOUND);
      expect(RETRYABLE_HTTP_STATUS_CODES).not.toContain(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  /**
   * Tests for retry configuration
   */
  describe('Retry Configuration', () => {
    const validateRetryConfig = (config: any) => {
      expect(config.MAX_ATTEMPTS).toBeGreaterThanOrEqual(1);
      expect(config.MAX_ATTEMPTS).toBeLessThanOrEqual(10); // Reasonable upper limit
      
      expect(config.INITIAL_DELAY_MS).toBeGreaterThan(0);
      expect(config.INITIAL_DELAY_MS).toBeLessThanOrEqual(10000); // Max 10 seconds initial delay
      
      expect(config.BACKOFF_FACTOR).toBeGreaterThanOrEqual(1);
      expect(config.BACKOFF_FACTOR).toBeLessThanOrEqual(5); // Reasonable upper limit
      
      expect(config.MAX_DELAY_MS).toBeGreaterThan(config.INITIAL_DELAY_MS);
      expect(config.MAX_DELAY_MS).toBeLessThanOrEqual(300000); // Max 5 minutes delay
      
      expect(typeof config.USE_JITTER).toBe('boolean');
      
      if (config.USE_JITTER) {
        expect(config.JITTER_FACTOR).toBeGreaterThan(0);
        expect(config.JITTER_FACTOR).toBeLessThanOrEqual(1); // Max 100% jitter
      }
    };

    it('should define valid default retry configuration', () => {
      validateRetryConfig(DEFAULT_RETRY_CONFIG);
    });

    it('should define valid database retry configuration', () => {
      validateRetryConfig(DATABASE_RETRY_CONFIG);
    });

    it('should define valid external API retry configuration', () => {
      validateRetryConfig(EXTERNAL_API_RETRY_CONFIG);
    });

    it('should define valid Kafka retry configuration', () => {
      validateRetryConfig(KAFKA_RETRY_CONFIG);
    });

    it('should define valid health integration retry configuration', () => {
      validateRetryConfig(HEALTH_INTEGRATION_RETRY_CONFIG);
    });

    it('should define valid device sync retry configuration', () => {
      validateRetryConfig(DEVICE_SYNC_RETRY_CONFIG);
    });

    it('should define valid notification retry configuration', () => {
      validateRetryConfig(NOTIFICATION_RETRY_CONFIG);
    });

    it('should map error types to appropriate retry configurations', () => {
      // Technical and external errors should be retryable
      expect(ERROR_TYPE_TO_RETRY_CONFIG[ErrorType.TECHNICAL]).toBeDefined();
      expect(ERROR_TYPE_TO_RETRY_CONFIG[ErrorType.EXTERNAL]).toBeDefined();
      
      // Validation and business errors should not be retryable
      expect(ERROR_TYPE_TO_RETRY_CONFIG[ErrorType.VALIDATION]).toBeNull();
      expect(ERROR_TYPE_TO_RETRY_CONFIG[ErrorType.BUSINESS]).toBeNull();
    });
  });

  /**
   * Tests for error message templates
   */
  describe('Error Message Templates', () => {
    const validateMessageTemplates = (templates: Record<string, any>) => {
      // Check that all categories have at least one message template
      Object.keys(templates).forEach(category => {
        expect(Object.keys(templates[category]).length).toBeGreaterThan(0);
      });

      // Check that message templates contain placeholders (indicated by {})  
      const hasPlaceholders = (obj: Record<string, any>): boolean => {
        return Object.values(obj).some(value => {
          if (typeof value === 'string') {
            return value.includes('{') && value.includes('}');
          } else if (typeof value === 'object' && value !== null) {
            return hasPlaceholders(value);
          }
          return false;
        });
      };

      expect(hasPlaceholders(templates)).toBe(true);
    };

    it('should define valid generic error message templates', () => {
      expect(ERROR_MESSAGES.VALIDATION).toBeDefined();
      expect(ERROR_MESSAGES.BUSINESS).toBeDefined();
      expect(ERROR_MESSAGES.TECHNICAL).toBeDefined();
      expect(ERROR_MESSAGES.EXTERNAL).toBeDefined();
      
      validateMessageTemplates(ERROR_MESSAGES);
    });

    it('should define valid health journey error message templates', () => {
      expect(HEALTH_ERROR_MESSAGES.METRICS).toBeDefined();
      expect(HEALTH_ERROR_MESSAGES.GOALS).toBeDefined();
      expect(HEALTH_ERROR_MESSAGES.INSIGHTS).toBeDefined();
      expect(HEALTH_ERROR_MESSAGES.DEVICES).toBeDefined();
      expect(HEALTH_ERROR_MESSAGES.FHIR).toBeDefined();
      
      validateMessageTemplates(HEALTH_ERROR_MESSAGES);
    });

    it('should define valid care journey error message templates', () => {
      expect(CARE_ERROR_MESSAGES.APPOINTMENTS).toBeDefined();
      expect(CARE_ERROR_MESSAGES.MEDICATIONS).toBeDefined();
      expect(CARE_ERROR_MESSAGES.PROVIDERS).toBeDefined();
      expect(CARE_ERROR_MESSAGES.TELEMEDICINE).toBeDefined();
      expect(CARE_ERROR_MESSAGES.TREATMENTS).toBeDefined();
      expect(CARE_ERROR_MESSAGES.SYMPTOM_CHECKER).toBeDefined();
      
      validateMessageTemplates(CARE_ERROR_MESSAGES);
    });

    it('should define valid plan journey error message templates', () => {
      expect(PLAN_ERROR_MESSAGES.BENEFITS).toBeDefined();
      expect(PLAN_ERROR_MESSAGES.CLAIMS).toBeDefined();
      expect(PLAN_ERROR_MESSAGES.COVERAGE).toBeDefined();
      expect(PLAN_ERROR_MESSAGES.DOCUMENTS).toBeDefined();
      expect(PLAN_ERROR_MESSAGES.PLANS).toBeDefined();
      
      validateMessageTemplates(PLAN_ERROR_MESSAGES);
    });

    it('should define valid authentication error message templates', () => {
      expect(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined();
      expect(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED).toBeDefined();
      expect(AUTH_ERROR_MESSAGES.INVALID_TOKEN).toBeDefined();
      expect(AUTH_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS).toBeDefined();
      
      // Check that at least some messages have placeholders
      const hasPlaceholders = Object.values(AUTH_ERROR_MESSAGES).some(
        message => typeof message === 'string' && message.includes('{')
      );
      expect(hasPlaceholders).toBe(true);
    });

    it('should define valid gamification error message templates', () => {
      expect(GAMIFICATION_ERROR_MESSAGES.ACHIEVEMENT_NOT_FOUND).toBeDefined();
      expect(GAMIFICATION_ERROR_MESSAGES.QUEST_NOT_FOUND).toBeDefined();
      expect(GAMIFICATION_ERROR_MESSAGES.REWARD_NOT_FOUND).toBeDefined();
      expect(GAMIFICATION_ERROR_MESSAGES.EVENT_PROCESSING_FAILED).toBeDefined();
      
      // Check that at least some messages have placeholders
      const hasPlaceholders = Object.values(GAMIFICATION_ERROR_MESSAGES).some(
        message => typeof message === 'string' && message.includes('{')
      );
      expect(hasPlaceholders).toBe(true);
    });

    it('should define valid notification error message templates', () => {
      expect(NOTIFICATION_ERROR_MESSAGES.NOTIFICATION_SEND_FAILED).toBeDefined();
      expect(NOTIFICATION_ERROR_MESSAGES.TEMPLATE_NOT_FOUND).toBeDefined();
      expect(NOTIFICATION_ERROR_MESSAGES.CHANNEL_UNAVAILABLE).toBeDefined();
      expect(NOTIFICATION_ERROR_MESSAGES.DELIVERY_FAILED).toBeDefined();
      
      // Check that at least some messages have placeholders
      const hasPlaceholders = Object.values(NOTIFICATION_ERROR_MESSAGES).some(
        message => typeof message === 'string' && message.includes('{')
      );
      expect(hasPlaceholders).toBe(true);
    });
  });
});