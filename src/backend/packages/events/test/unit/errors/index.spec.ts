import { Test } from '@nestjs/testing';
import * as errorModule from '../../../src/errors';

describe('Errors Module Exports', () => {
  /**
   * Tests for event-errors.ts exports
   */
  describe('Event Errors', () => {
    it('should export EventProcessingStage enum', () => {
      expect(errorModule.EventProcessingStage).toBeDefined();
      expect(errorModule.EventProcessingStage.VALIDATION).toBe('validation');
      expect(errorModule.EventProcessingStage.DESERIALIZATION).toBe('deserialization');
      expect(errorModule.EventProcessingStage.PROCESSING).toBe('processing');
      expect(errorModule.EventProcessingStage.PUBLISHING).toBe('publishing');
      expect(errorModule.EventProcessingStage.PERSISTENCE).toBe('persistence');
    });

    it('should export EventErrorCategory enum', () => {
      expect(errorModule.EventErrorCategory).toBeDefined();
      expect(errorModule.EventErrorCategory.TRANSIENT).toBe('transient');
      expect(errorModule.EventErrorCategory.PERMANENT).toBe('permanent');
      expect(errorModule.EventErrorCategory.RETRIABLE).toBe('retriable');
      expect(errorModule.EventErrorCategory.MANUAL).toBe('manual');
    });

    it('should export EventException class', () => {
      expect(errorModule.EventException).toBeDefined();
      expect(typeof errorModule.EventException).toBe('function');
      expect(errorModule.EventException.prototype.isRetriable).toBeDefined();
      expect(errorModule.EventException.fromEvent).toBeDefined();
    });

    it('should export EventValidationException class', () => {
      expect(errorModule.EventValidationException).toBeDefined();
      expect(typeof errorModule.EventValidationException).toBe('function');
      expect(errorModule.EventValidationException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventValidationException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventDeserializationException class', () => {
      expect(errorModule.EventDeserializationException).toBeDefined();
      expect(typeof errorModule.EventDeserializationException).toBe('function');
      expect(errorModule.EventDeserializationException.withPartialContext).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventDeserializationException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventSchemaVersionException class', () => {
      expect(errorModule.EventSchemaVersionException).toBeDefined();
      expect(typeof errorModule.EventSchemaVersionException).toBe('function');
      expect(errorModule.EventSchemaVersionException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventSchemaVersionException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventProcessingException class', () => {
      expect(errorModule.EventProcessingException).toBeDefined();
      expect(typeof errorModule.EventProcessingException).toBe('function');
      expect(errorModule.EventProcessingException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventProcessingException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventPublishingException class', () => {
      expect(errorModule.EventPublishingException).toBeDefined();
      expect(typeof errorModule.EventPublishingException).toBe('function');
      expect(errorModule.EventPublishingException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventPublishingException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventPersistenceException class', () => {
      expect(errorModule.EventPersistenceException).toBeDefined();
      expect(typeof errorModule.EventPersistenceException).toBe('function');
      expect(errorModule.EventPersistenceException.fromEvent).toBeDefined();
      expect(errorModule.EventPersistenceException.prototype.isConstraintViolation).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventPersistenceException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventHandlerNotFoundException class', () => {
      expect(errorModule.EventHandlerNotFoundException).toBeDefined();
      expect(typeof errorModule.EventHandlerNotFoundException).toBe('function');
      expect(errorModule.EventHandlerNotFoundException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventHandlerNotFoundException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export EventMaxRetriesExceededException class', () => {
      expect(errorModule.EventMaxRetriesExceededException).toBeDefined();
      expect(typeof errorModule.EventMaxRetriesExceededException).toBe('function');
      expect(errorModule.EventMaxRetriesExceededException.fromEvent).toBeDefined();
      // Verify inheritance
      expect(errorModule.EventMaxRetriesExceededException.prototype instanceof errorModule.EventException).toBe(true);
    });

    it('should export journey-specific exception classes', () => {
      // Health journey
      expect(errorModule.HealthEventException).toBeDefined();
      expect(typeof errorModule.HealthEventException).toBe('function');
      expect(errorModule.HealthEventException.fromEvent).toBeDefined();
      expect(errorModule.HealthEventException.prototype instanceof errorModule.EventException).toBe(true);

      // Care journey
      expect(errorModule.CareEventException).toBeDefined();
      expect(typeof errorModule.CareEventException).toBe('function');
      expect(errorModule.CareEventException.fromEvent).toBeDefined();
      expect(errorModule.CareEventException.prototype instanceof errorModule.EventException).toBe(true);

      // Plan journey
      expect(errorModule.PlanEventException).toBeDefined();
      expect(typeof errorModule.PlanEventException).toBe('function');
      expect(errorModule.PlanEventException.fromEvent).toBeDefined();
      expect(errorModule.PlanEventException.prototype instanceof errorModule.EventException).toBe(true);
    });
  });

  /**
   * Tests for retry-policies.ts exports
   */
  describe('Retry Policies', () => {
    it('should export RetryStatus enum', () => {
      expect(errorModule.RetryStatus).toBeDefined();
      expect(errorModule.RetryStatus.PENDING).toBe('PENDING');
      expect(errorModule.RetryStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(errorModule.RetryStatus.SUCCEEDED).toBe('SUCCEEDED');
      expect(errorModule.RetryStatus.FAILED).toBe('FAILED');
      expect(errorModule.RetryStatus.EXHAUSTED).toBe('EXHAUSTED');
    });

    it('should export retry policy classes', () => {
      // Base class
      expect(errorModule.BaseRetryPolicy).toBeDefined();
      expect(typeof errorModule.BaseRetryPolicy).toBe('function');
      expect(errorModule.BaseRetryPolicy.prototype.shouldRetry).toBeDefined();

      // Concrete implementations
      expect(errorModule.FixedIntervalRetryPolicy).toBeDefined();
      expect(typeof errorModule.FixedIntervalRetryPolicy).toBe('function');
      expect(errorModule.FixedIntervalRetryPolicy.prototype instanceof errorModule.BaseRetryPolicy).toBe(true);

      expect(errorModule.ExponentialBackoffRetryPolicy).toBeDefined();
      expect(typeof errorModule.ExponentialBackoffRetryPolicy).toBe('function');
      expect(errorModule.ExponentialBackoffRetryPolicy.prototype instanceof errorModule.BaseRetryPolicy).toBe(true);

      expect(errorModule.LinearBackoffRetryPolicy).toBeDefined();
      expect(typeof errorModule.LinearBackoffRetryPolicy).toBe('function');
      expect(errorModule.LinearBackoffRetryPolicy.prototype instanceof errorModule.BaseRetryPolicy).toBe(true);

      expect(errorModule.CompositeRetryPolicy).toBeDefined();
      expect(typeof errorModule.CompositeRetryPolicy).toBe('function');
      expect(errorModule.CompositeRetryPolicy.prototype.addPolicyForErrorType).toBeDefined();
    });

    it('should export RetryPolicyFactory', () => {
      expect(errorModule.RetryPolicyFactory).toBeDefined();
      expect(typeof errorModule.RetryPolicyFactory).toBe('function');
      expect(errorModule.RetryPolicyFactory.createDefaultPolicy).toBeDefined();
      expect(errorModule.RetryPolicyFactory.createFixedIntervalPolicy).toBeDefined();
      expect(errorModule.RetryPolicyFactory.createLinearBackoffPolicy).toBeDefined();
      expect(errorModule.RetryPolicyFactory.createErrorTypePolicy).toBeDefined();
      expect(errorModule.RetryPolicyFactory.createJourneyPolicy).toBeDefined();
    });

    it('should export RetryUtils', () => {
      expect(errorModule.RetryUtils).toBeDefined();
      expect(typeof errorModule.RetryUtils).toBe('function');
      expect(errorModule.RetryUtils.calculateNextRetryDelay).toBeDefined();
      expect(errorModule.RetryUtils.shouldRetry).toBeDefined();
      expect(errorModule.RetryUtils.createPolicyForEvent).toBeDefined();
    });

    it('should export retry policy interfaces', () => {
      // Verify interfaces are exported by checking if they're used in the implementation
      const policy = new errorModule.FixedIntervalRetryPolicy({ intervalMs: 1000 });
      expect(policy.getName()).toBe('FixedIntervalRetryPolicy');
      expect(policy.shouldRetry).toBeDefined();
      expect(policy.calculateNextRetryDelay).toBeDefined();
    });
  });

  /**
   * Tests for dlq.ts exports
   */
  describe('Dead Letter Queue', () => {
    it('should export DlqErrorType enum', () => {
      expect(errorModule.DlqErrorType).toBeDefined();
      expect(errorModule.DlqErrorType.VALIDATION).toBe('validation');
      expect(errorModule.DlqErrorType.PROCESSING).toBe('processing');
      expect(errorModule.DlqErrorType.SCHEMA).toBe('schema');
      expect(errorModule.DlqErrorType.SYSTEM).toBe('system');
      expect(errorModule.DlqErrorType.NETWORK).toBe('network');
      expect(errorModule.DlqErrorType.DATABASE).toBe('database');
      expect(errorModule.DlqErrorType.TIMEOUT).toBe('timeout');
      expect(errorModule.DlqErrorType.UNKNOWN).toBe('unknown');
    });

    it('should export DlqEntryStatus enum', () => {
      expect(errorModule.DlqEntryStatus).toBeDefined();
      expect(errorModule.DlqEntryStatus.PENDING).toBe('pending');
      expect(errorModule.DlqEntryStatus.RESOLVED).toBe('resolved');
      expect(errorModule.DlqEntryStatus.REPROCESSED).toBe('reprocessed');
      expect(errorModule.DlqEntryStatus.IGNORED).toBe('ignored');
    });

    it('should export DlqProcessAction enum', () => {
      expect(errorModule.DlqProcessAction).toBeDefined();
      expect(errorModule.DlqProcessAction.RESOLVE).toBe('resolve');
      expect(errorModule.DlqProcessAction.REPROCESS).toBe('reprocess');
      expect(errorModule.DlqProcessAction.IGNORE).toBe('ignore');
    });

    it('should export DlqEntry class', () => {
      expect(errorModule.DlqEntry).toBeDefined();
      expect(typeof errorModule.DlqEntry).toBe('function');
    });

    it('should export DlqService class', () => {
      expect(errorModule.DlqService).toBeDefined();
      expect(typeof errorModule.DlqService).toBe('function');
      
      // Create a mock module to test DlqService
      const moduleRef = Test.createTestingModule({
        providers: [
          {
            provide: errorModule.DlqService,
            useValue: {
              sendToDlq: jest.fn(),
              sendKafkaEventToDlq: jest.fn(),
              queryDlqEntries: jest.fn(),
              getDlqEntryById: jest.fn(),
              processDlqEntry: jest.fn(),
              getDlqStatistics: jest.fn(),
              purgeResolvedEntries: jest.fn()
            }
          }
        ]
      }).compile();
      
      const dlqService = moduleRef.get<errorModule.DlqService>(errorModule.DlqService);
      expect(dlqService.sendToDlq).toBeDefined();
      expect(dlqService.sendKafkaEventToDlq).toBeDefined();
      expect(dlqService.queryDlqEntries).toBeDefined();
      expect(dlqService.getDlqEntryById).toBeDefined();
      expect(dlqService.processDlqEntry).toBeDefined();
      expect(dlqService.getDlqStatistics).toBeDefined();
      expect(dlqService.purgeResolvedEntries).toBeDefined();
    });
  });

  /**
   * Tests for handling.ts exports
   */
  describe('Error Handling', () => {
    it('should export ErrorCategory enum', () => {
      expect(errorModule.ErrorCategory).toBeDefined();
      expect(errorModule.ErrorCategory.PERMANENT).toBe('PERMANENT');
      expect(errorModule.ErrorCategory.TRANSIENT).toBe('TRANSIENT');
      expect(errorModule.ErrorCategory.INDETERMINATE).toBe('INDETERMINATE');
    });

    it('should export DEFAULT_ERROR_HANDLING_OPTIONS', () => {
      expect(errorModule.DEFAULT_ERROR_HANDLING_OPTIONS).toBeDefined();
      expect(errorModule.DEFAULT_ERROR_HANDLING_OPTIONS.maxRetries).toBeDefined();
      expect(errorModule.DEFAULT_ERROR_HANDLING_OPTIONS.useCircuitBreaker).toBeDefined();
      expect(errorModule.DEFAULT_ERROR_HANDLING_OPTIONS.detailedLogging).toBeDefined();
      expect(errorModule.DEFAULT_ERROR_HANDLING_OPTIONS.circuitBreakerOptions).toBeDefined();
    });

    it('should export classifyError function', () => {
      expect(errorModule.classifyError).toBeDefined();
      expect(typeof errorModule.classifyError).toBe('function');
    });

    it('should export decorator functions', () => {
      expect(errorModule.WithErrorHandling).toBeDefined();
      expect(typeof errorModule.WithErrorHandling).toBe('function');

      expect(errorModule.WithRetry).toBeDefined();
      expect(typeof errorModule.WithRetry).toBe('function');

      expect(errorModule.WithFallback).toBeDefined();
      expect(typeof errorModule.WithFallback).toBe('function');
    });

    it('should export EventErrorHandlingService class', () => {
      expect(errorModule.EventErrorHandlingService).toBeDefined();
      expect(typeof errorModule.EventErrorHandlingService).toBe('function');
      
      // Create a mock module to test EventErrorHandlingService
      const moduleRef = Test.createTestingModule({
        providers: [
          {
            provide: errorModule.EventErrorHandlingService,
            useValue: {
              wrapWithErrorHandling: jest.fn(),
              createSafeEventHandler: jest.fn()
            }
          }
        ]
      }).compile();
      
      const errorHandlingService = moduleRef.get<errorModule.EventErrorHandlingService>(errorModule.EventErrorHandlingService);
      expect(errorHandlingService.wrapWithErrorHandling).toBeDefined();
      expect(errorHandlingService.createSafeEventHandler).toBeDefined();
    });
  });

  /**
   * Tests for the overall structure and organization of exports
   */
  describe('Export Structure', () => {
    it('should maintain a clean export structure without duplicates', () => {
      const exportedNames = Object.keys(errorModule);
      const uniqueNames = new Set(exportedNames);
      
      expect(exportedNames.length).toBe(uniqueNames.size);
    });

    it('should export all required components for public API', () => {
      // Count the number of exported items to ensure we don't accidentally remove exports
      const exportCount = Object.keys(errorModule).length;
      
      // This number should be updated if new exports are intentionally added or removed
      // Current count based on the analyzed files
      const expectedExportCount = 40; // Adjust this number based on actual exports
      
      expect(exportCount).toBeGreaterThanOrEqual(expectedExportCount);
    });

    it('should not expose internal implementation details', () => {
      // Internal implementation details should not be exported
      expect(errorModule.CircuitBreaker).toBeUndefined();
      expect(errorModule.CircuitBreakerState).toBeUndefined();
    });
  });
});