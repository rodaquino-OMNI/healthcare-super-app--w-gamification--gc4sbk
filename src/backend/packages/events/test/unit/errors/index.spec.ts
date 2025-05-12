import { describe, expect, it } from '@jest/globals';

/**
 * Test suite for the error handling barrel file
 * 
 * This test suite verifies that all error-related components are properly exported
 * from the error handling barrel file. It ensures that the public API contract
 * for error handling components is maintained and prevents accidental breaking
 * changes through missing exports.
 */
describe('Error Handling Barrel File', () => {
  // Import the entire barrel file to test exports
  const errorModule = require('../../../src/errors');

  describe('Error Classes', () => {
    it('should export EventError base class', () => {
      expect(errorModule.EventError).toBeDefined();
      expect(typeof errorModule.EventError).toBe('function');
    });

    it('should export EventProcessingStage enum', () => {
      expect(errorModule.EventProcessingStage).toBeDefined();
      expect(typeof errorModule.EventProcessingStage).toBe('object');
    });

    it('should export all specialized error classes', () => {
      // Validation and schema errors
      expect(errorModule.EventValidationError).toBeDefined();
      expect(errorModule.EventSchemaError).toBeDefined();
      
      // Processing pipeline errors
      expect(errorModule.EventDeserializationError).toBeDefined();
      expect(errorModule.EventRoutingError).toBeDefined();
      expect(errorModule.EventProcessingError).toBeDefined();
      expect(errorModule.EventPersistenceError).toBeDefined();
      
      // External and system errors
      expect(errorModule.EventExternalSystemError).toBeDefined();
      expect(errorModule.EventTimeoutError).toBeDefined();
      expect(errorModule.EventDatabaseError).toBeDefined();
      expect(errorModule.EventDataProcessingError).toBeDefined();
      
      // Specialized errors
      expect(errorModule.EventVersionError).toBeDefined();
      expect(errorModule.DuplicateEventError).toBeDefined();
      expect(errorModule.EventRateLimitError).toBeDefined();
    });

    it('should export journey-specific error namespaces', () => {
      // Health journey errors
      expect(errorModule.HealthEventErrors).toBeDefined();
      expect(errorModule.HealthEventErrors.MetricEventError).toBeDefined();
      expect(errorModule.HealthEventErrors.GoalEventError).toBeDefined();
      expect(errorModule.HealthEventErrors.DeviceSyncEventError).toBeDefined();
      
      // Care journey errors
      expect(errorModule.CareEventErrors).toBeDefined();
      expect(errorModule.CareEventErrors.AppointmentEventError).toBeDefined();
      expect(errorModule.CareEventErrors.MedicationEventError).toBeDefined();
      expect(errorModule.CareEventErrors.TelemedicineEventError).toBeDefined();
      
      // Plan journey errors
      expect(errorModule.PlanEventErrors).toBeDefined();
      expect(errorModule.PlanEventErrors.ClaimEventError).toBeDefined();
      expect(errorModule.PlanEventErrors.BenefitEventError).toBeDefined();
      expect(errorModule.PlanEventErrors.CoverageEventError).toBeDefined();
    });
  });

  describe('Error Handling Utilities', () => {
    it('should export error handling decorators', () => {
      expect(errorModule.HandleEventErrors).toBeDefined();
      expect(typeof errorModule.HandleEventErrors).toBe('function');
      
      expect(errorModule.HandleValidationErrors).toBeDefined();
      expect(typeof errorModule.HandleValidationErrors).toBe('function');
      
      expect(errorModule.EventErrorHandler).toBeDefined();
      expect(typeof errorModule.EventErrorHandler).toBe('function');
    });

    it('should export error logging utilities', () => {
      expect(errorModule.logEventError).toBeDefined();
      expect(typeof errorModule.logEventError).toBe('function');
    });

    it('should export error response utilities', () => {
      expect(errorModule.createErrorResponse).toBeDefined();
      expect(typeof errorModule.createErrorResponse).toBe('function');
    });

    it('should export fallback handler utilities', () => {
      expect(errorModule.createFallbackHandler).toBeDefined();
      expect(typeof errorModule.createFallbackHandler).toBe('function');
    });

    it('should export EventErrorHandlingService', () => {
      expect(errorModule.EventErrorHandlingService).toBeDefined();
      expect(typeof errorModule.EventErrorHandlingService).toBe('function');
    });
  });

  describe('DLQ Utilities', () => {
    it('should export DLQ interfaces', () => {
      expect(errorModule.DlqEntryMetadata).toBeDefined();
      expect(typeof errorModule.DlqEntryMetadata).toBe('object');
      
      expect(errorModule.DlqEntry).toBeDefined();
      expect(typeof errorModule.DlqEntry).toBe('object');
      
      expect(errorModule.IDlqProducer).toBeDefined();
      expect(typeof errorModule.IDlqProducer).toBe('object');
      
      expect(errorModule.IDlqConsumer).toBeDefined();
      expect(typeof errorModule.IDlqConsumer).toBe('object');
    });

    it('should export DLQ service', () => {
      expect(errorModule.DlqService).toBeDefined();
      expect(typeof errorModule.DlqService).toBe('function');
    });

    it('should export sendToDlq utility function', () => {
      expect(errorModule.sendToDlq).toBeDefined();
      expect(typeof errorModule.sendToDlq).toBe('function');
    });
  });

  describe('Retry Policies', () => {
    it('should export retry policy interfaces and types', () => {
      expect(errorModule.RetryStatus).toBeDefined();
      expect(typeof errorModule.RetryStatus).toBe('object');
      
      expect(errorModule.RetryOptions).toBeDefined();
      expect(typeof errorModule.RetryOptions).toBe('object');
      
      expect(errorModule.ExponentialBackoffOptions).toBeDefined();
      expect(typeof errorModule.ExponentialBackoffOptions).toBe('object');
      
      expect(errorModule.FixedIntervalOptions).toBeDefined();
      expect(typeof errorModule.FixedIntervalOptions).toBe('object');
      
      expect(errorModule.JourneyRetryConfig).toBeDefined();
      expect(typeof errorModule.JourneyRetryConfig).toBe('object');
      
      expect(errorModule.RetryContext).toBeDefined();
      expect(typeof errorModule.RetryContext).toBe('object');
      
      expect(errorModule.RetryPolicy).toBeDefined();
      expect(typeof errorModule.RetryPolicy).toBe('object');
    });

    it('should export retry policy implementations', () => {
      expect(errorModule.BaseRetryPolicy).toBeDefined();
      expect(typeof errorModule.BaseRetryPolicy).toBe('function');
      
      expect(errorModule.ExponentialBackoffPolicy).toBeDefined();
      expect(typeof errorModule.ExponentialBackoffPolicy).toBe('function');
      
      expect(errorModule.FixedIntervalPolicy).toBeDefined();
      expect(typeof errorModule.FixedIntervalPolicy).toBe('function');
      
      expect(errorModule.MaxAttemptsPolicy).toBeDefined();
      expect(typeof errorModule.MaxAttemptsPolicy).toBe('function');
      
      expect(errorModule.CompositeRetryPolicy).toBeDefined();
      expect(typeof errorModule.CompositeRetryPolicy).toBe('function');
    });

    it('should export retry policy factory', () => {
      expect(errorModule.RetryPolicyFactory).toBeDefined();
      expect(typeof errorModule.RetryPolicyFactory).toBe('function');
    });

    it('should export applyRetryPolicy utility function', () => {
      expect(errorModule.applyRetryPolicy).toBeDefined();
      expect(typeof errorModule.applyRetryPolicy).toBe('function');
    });
  });

  describe('Circuit Breaker', () => {
    it('should export circuit breaker interfaces and types', () => {
      expect(errorModule.CircuitBreakerOptions).toBeDefined();
      expect(typeof errorModule.CircuitBreakerOptions).toBe('object');
    });

    it('should export circuit breaker implementation', () => {
      expect(errorModule.CircuitBreaker).toBeDefined();
      expect(typeof errorModule.CircuitBreaker).toBe('function');
    });
  });

  describe('Error Enums and Constants', () => {
    it('should export error category enum', () => {
      expect(errorModule.EventErrorCategory).toBeDefined();
      expect(typeof errorModule.EventErrorCategory).toBe('object');
      expect(Object.keys(errorModule.EventErrorCategory).length).toBeGreaterThan(0);
    });

    it('should export error severity enum', () => {
      expect(errorModule.EventErrorSeverity).toBeDefined();
      expect(typeof errorModule.EventErrorSeverity).toBe('object');
      expect(Object.keys(errorModule.EventErrorSeverity).length).toBeGreaterThan(0);
    });

    it('should export retry strategy enum', () => {
      expect(errorModule.RetryStrategy).toBeDefined();
      expect(typeof errorModule.RetryStrategy).toBe('object');
      expect(Object.keys(errorModule.RetryStrategy).length).toBeGreaterThan(0);
    });

    it('should export error constants', () => {
      expect(errorModule.ErrorConstants).toBeDefined();
      expect(typeof errorModule.ErrorConstants).toBe('object');
      
      // Check a few specific error constants
      expect(errorModule.ErrorConstants.EVENT_PRODUCER_VALIDATION_ERROR).toBeDefined();
      expect(errorModule.ErrorConstants.EVENT_CONSUMER_PROCESSING_ERROR).toBeDefined();
      expect(errorModule.ErrorConstants.EVENT_SCHEMA_INVALID_FORMAT).toBeDefined();
      expect(errorModule.ErrorConstants.EVENT_DELIVERY_TIMEOUT).toBeDefined();
      expect(errorModule.ErrorConstants.EVENT_RETRY_EXHAUSTED).toBeDefined();
    });
  });

  describe('Interfaces and Types', () => {
    it('should export EventErrorContext interface', () => {
      expect(errorModule.EventErrorContext).toBeDefined();
      expect(typeof errorModule.EventErrorContext).toBe('object');
    });

    it('should export validation interfaces', () => {
      expect(errorModule.ValidationResult).toBeDefined();
      expect(typeof errorModule.ValidationResult).toBe('object');
    });

    it('should export response interfaces', () => {
      expect(errorModule.EventResponse).toBeDefined();
      expect(typeof errorModule.EventResponse).toBe('object');
    });

    it('should export utility functions', () => {
      expect(errorModule.isRetryableError).toBeDefined();
      expect(typeof errorModule.isRetryableError).toBe('function');
    });
  });

  describe('Module Structure', () => {
    it('should not have circular dependencies', () => {
      // This test ensures that the module can be imported without circular dependency issues
      expect(() => require('../../../src/errors')).not.toThrow();
    });

    it('should have a consistent export structure', () => {
      // Get all exported keys
      const exportedKeys = Object.keys(errorModule);
      
      // Check that we have a reasonable number of exports
      expect(exportedKeys.length).toBeGreaterThan(20);
      
      // Check that exports are organized by category
      const errorClasses = exportedKeys.filter(key => key.includes('Error') && typeof errorModule[key] === 'function');
      expect(errorClasses.length).toBeGreaterThan(5);
      
      const utilityFunctions = exportedKeys.filter(key => 
        typeof errorModule[key] === 'function' && 
        !key.includes('Error') && 
        !key.includes('Policy') &&
        !key.includes('Service')
      );
      expect(utilityFunctions.length).toBeGreaterThan(3);
      
      const enums = exportedKeys.filter(key => 
        typeof errorModule[key] === 'object' && 
        Object.keys(errorModule[key]).every(k => typeof errorModule[key][k] === 'string' || typeof errorModule[key][k] === 'number')
      );
      expect(enums.length).toBeGreaterThan(2);
    });
  });
});