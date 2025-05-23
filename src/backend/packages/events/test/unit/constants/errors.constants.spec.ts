import { describe, it, expect } from 'jest';
import {
  // Error severity and HTTP status enums
  EventErrorSeverity,
  EventErrorHttpStatus,
  
  // Producer error codes
  EVENT_PROD_SERIALIZATION_FAILED,
  EVENT_PROD_SCHEMA_VALIDATION_FAILED,
  EVENT_PROD_DELIVERY_TIMEOUT,
  EVENT_PROD_BROKER_UNAVAILABLE,
  EVENT_PROD_TOPIC_NOT_FOUND,
  EVENT_PROD_AUTHORIZATION_FAILED,
  EVENT_PROD_RATE_LIMIT_EXCEEDED,
  
  // Consumer error codes
  EVENT_CONS_DESERIALIZATION_FAILED,
  EVENT_CONS_SCHEMA_VALIDATION_FAILED,
  EVENT_CONS_PROCESSING_TIMEOUT,
  EVENT_CONS_HANDLER_NOT_FOUND,
  EVENT_CONS_RETRY_EXHAUSTED,
  EVENT_CONS_COMMIT_FAILED,
  EVENT_CONS_CONCURRENCY_LIMIT_EXCEEDED,
  
  // Schema validation error codes
  EVENT_SCHEMA_VERSION_MISMATCH,
  EVENT_SCHEMA_REQUIRED_FIELD_MISSING,
  EVENT_SCHEMA_INVALID_FIELD_TYPE,
  EVENT_SCHEMA_REGISTRY_UNAVAILABLE,
  EVENT_SCHEMA_EVOLUTION_INCOMPATIBLE,
  
  // Delivery error codes
  EVENT_DELIV_TIMEOUT,
  EVENT_DELIV_BROKER_UNAVAILABLE,
  EVENT_DELIV_NETWORK_FAILURE,
  EVENT_DELIV_PARTITION_ERROR,
  EVENT_DELIV_REBALANCE_IN_PROGRESS,
  
  // Dead Letter Queue error codes
  EVENT_DLQ_WRITE_FAILED,
  EVENT_DLQ_READ_FAILED,
  EVENT_DLQ_FULL,
  EVENT_DLQ_REPROCESSING_FAILED,
  
  // Error message mapping and utility functions
  ERROR_MESSAGES,
  getErrorDetails,
  isRetryableError,
  shouldSendToDLQ,
  getErrorLogLevel
} from '../../../src/constants/errors.constants';

describe('Event Error Constants', () => {
  // Group error codes by category for easier testing
  const producerErrorCodes = [
    EVENT_PROD_SERIALIZATION_FAILED,
    EVENT_PROD_SCHEMA_VALIDATION_FAILED,
    EVENT_PROD_DELIVERY_TIMEOUT,
    EVENT_PROD_BROKER_UNAVAILABLE,
    EVENT_PROD_TOPIC_NOT_FOUND,
    EVENT_PROD_AUTHORIZATION_FAILED,
    EVENT_PROD_RATE_LIMIT_EXCEEDED
  ];
  
  const consumerErrorCodes = [
    EVENT_CONS_DESERIALIZATION_FAILED,
    EVENT_CONS_SCHEMA_VALIDATION_FAILED,
    EVENT_CONS_PROCESSING_TIMEOUT,
    EVENT_CONS_HANDLER_NOT_FOUND,
    EVENT_CONS_RETRY_EXHAUSTED,
    EVENT_CONS_COMMIT_FAILED,
    EVENT_CONS_CONCURRENCY_LIMIT_EXCEEDED
  ];
  
  const schemaErrorCodes = [
    EVENT_SCHEMA_VERSION_MISMATCH,
    EVENT_SCHEMA_REQUIRED_FIELD_MISSING,
    EVENT_SCHEMA_INVALID_FIELD_TYPE,
    EVENT_SCHEMA_REGISTRY_UNAVAILABLE,
    EVENT_SCHEMA_EVOLUTION_INCOMPATIBLE
  ];
  
  const deliveryErrorCodes = [
    EVENT_DELIV_TIMEOUT,
    EVENT_DELIV_BROKER_UNAVAILABLE,
    EVENT_DELIV_NETWORK_FAILURE,
    EVENT_DELIV_PARTITION_ERROR,
    EVENT_DELIV_REBALANCE_IN_PROGRESS
  ];
  
  const dlqErrorCodes = [
    EVENT_DLQ_WRITE_FAILED,
    EVENT_DLQ_READ_FAILED,
    EVENT_DLQ_FULL,
    EVENT_DLQ_REPROCESSING_FAILED
  ];
  
  // All error codes combined
  const allErrorCodes = [
    ...producerErrorCodes,
    ...consumerErrorCodes,
    ...schemaErrorCodes,
    ...deliveryErrorCodes,
    ...dlqErrorCodes
  ];
  
  describe('Error Code Format', () => {
    it('should have producer error codes that follow the EVENT_PROD_XXX pattern', () => {
      const producerPattern = /^EVENT_PROD_[A-Z_]+$/;
      producerErrorCodes.forEach(code => {
        expect(code).toMatch(producerPattern);
      });
    });
    
    it('should have consumer error codes that follow the EVENT_CONS_XXX pattern', () => {
      const consumerPattern = /^EVENT_CONS_[A-Z_]+$/;
      consumerErrorCodes.forEach(code => {
        expect(code).toMatch(consumerPattern);
      });
    });
    
    it('should have schema error codes that follow the EVENT_SCHEMA_XXX pattern', () => {
      const schemaPattern = /^EVENT_SCHEMA_[A-Z_]+$/;
      schemaErrorCodes.forEach(code => {
        expect(code).toMatch(schemaPattern);
      });
    });
    
    it('should have delivery error codes that follow the EVENT_DELIV_XXX pattern', () => {
      const deliveryPattern = /^EVENT_DELIV_[A-Z_]+$/;
      deliveryErrorCodes.forEach(code => {
        expect(code).toMatch(deliveryPattern);
      });
    });
    
    it('should have DLQ error codes that follow the EVENT_DLQ_XXX pattern', () => {
      const dlqPattern = /^EVENT_DLQ_[A-Z_]+$/;
      dlqErrorCodes.forEach(code => {
        expect(code).toMatch(dlqPattern);
      });
    });
    
    it('should have numeric suffixes in the error codes', () => {
      const numericSuffixPattern = /\d{3}$/;
      allErrorCodes.forEach(code => {
        // Extract the numeric part from the code (last 3 characters)
        const numericPart = code.slice(-3);
        expect(numericPart).toMatch(numericSuffixPattern);
      });
    });
  });
  
  describe('Error Messages', () => {
    it('should have an entry in ERROR_MESSAGES for each error code', () => {
      allErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES).toHaveProperty(code);
      });
    });
    
    it('should have a non-empty message for each error code', () => {
      allErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].message).toBeDefined();
        expect(ERROR_MESSAGES[code].message.length).toBeGreaterThan(10); // Ensure message is descriptive
      });
    });
    
    it('should have a valid severity level for each error code', () => {
      const validSeverities = Object.values(EventErrorSeverity);
      allErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        expect(validSeverities).toContain(ERROR_MESSAGES[code].severity);
      });
    });
    
    it('should have a valid HTTP status code for each error code', () => {
      const validStatusCodes = Object.values(EventErrorHttpStatus);
      allErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].status).toBeDefined();
        expect(validStatusCodes).toContain(ERROR_MESSAGES[code].status);
      });
    });
    
    it('should include troubleshooting guidance in error messages', () => {
      // Check that messages contain action-oriented guidance
      const actionPhrases = ['Check', 'Verify', 'Ensure', 'Consider'];
      
      allErrorCodes.forEach(code => {
        const message = ERROR_MESSAGES[code].message;
        const containsActionGuidance = actionPhrases.some(phrase => message.includes(phrase));
        expect(containsActionGuidance).toBe(true);
      });
    });
  });
  
  describe('Error Categories', () => {
    it('should assign appropriate severity levels to producer errors', () => {
      producerErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        // Critical errors should have CRITICAL or ERROR severity
        if (code === EVENT_PROD_BROKER_UNAVAILABLE) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.CRITICAL);
        }
      });
    });
    
    it('should assign appropriate severity levels to consumer errors', () => {
      consumerErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        // Commit failures are critical as they can cause data loss
        if (code === EVENT_CONS_COMMIT_FAILED) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.CRITICAL);
        }
      });
    });
    
    it('should assign appropriate severity levels to schema errors', () => {
      schemaErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        // Schema registry unavailability is critical
        if (code === EVENT_SCHEMA_REGISTRY_UNAVAILABLE || code === EVENT_SCHEMA_EVOLUTION_INCOMPATIBLE) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.CRITICAL);
        }
      });
    });
    
    it('should assign appropriate severity levels to delivery errors', () => {
      deliveryErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        // Broker unavailability is critical
        if (code === EVENT_DELIV_BROKER_UNAVAILABLE) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.CRITICAL);
        }
        // Rebalance is just informational
        if (code === EVENT_DELIV_REBALANCE_IN_PROGRESS) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.INFO);
        }
      });
    });
    
    it('should assign appropriate severity levels to DLQ errors', () => {
      dlqErrorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code].severity).toBeDefined();
        // DLQ write failures and capacity issues are critical
        if (code === EVENT_DLQ_WRITE_FAILED || code === EVENT_DLQ_FULL) {
          expect(ERROR_MESSAGES[code].severity).toBe(EventErrorSeverity.CRITICAL);
        }
      });
    });
    
    it('should assign appropriate HTTP status codes to different error categories', () => {
      // Validation errors should be 400 or 422
      expect(ERROR_MESSAGES[EVENT_SCHEMA_REQUIRED_FIELD_MISSING].status).toBe(EventErrorHttpStatus.BAD_REQUEST);
      expect(ERROR_MESSAGES[EVENT_SCHEMA_INVALID_FIELD_TYPE].status).toBe(EventErrorHttpStatus.BAD_REQUEST);
      expect(ERROR_MESSAGES[EVENT_PROD_SCHEMA_VALIDATION_FAILED].status).toBe(EventErrorHttpStatus.UNPROCESSABLE);
      
      // Timeout errors should be 504
      expect(ERROR_MESSAGES[EVENT_PROD_DELIVERY_TIMEOUT].status).toBe(EventErrorHttpStatus.GATEWAY_TIMEOUT);
      expect(ERROR_MESSAGES[EVENT_CONS_PROCESSING_TIMEOUT].status).toBe(EventErrorHttpStatus.GATEWAY_TIMEOUT);
      expect(ERROR_MESSAGES[EVENT_DELIV_TIMEOUT].status).toBe(EventErrorHttpStatus.GATEWAY_TIMEOUT);
      
      // Service unavailable errors should be 503
      expect(ERROR_MESSAGES[EVENT_PROD_BROKER_UNAVAILABLE].status).toBe(EventErrorHttpStatus.SERVICE_UNAVAILABLE);
      expect(ERROR_MESSAGES[EVENT_DELIV_BROKER_UNAVAILABLE].status).toBe(EventErrorHttpStatus.SERVICE_UNAVAILABLE);
      expect(ERROR_MESSAGES[EVENT_SCHEMA_REGISTRY_UNAVAILABLE].status).toBe(EventErrorHttpStatus.SERVICE_UNAVAILABLE);
    });
  });
  
  describe('Utility Functions', () => {
    describe('getErrorDetails', () => {
      it('should return error details for a valid error code', () => {
        const details = getErrorDetails(EVENT_PROD_SERIALIZATION_FAILED);
        expect(details).toEqual(ERROR_MESSAGES[EVENT_PROD_SERIALIZATION_FAILED]);
      });
      
      it('should return a default error for an invalid error code', () => {
        const details = getErrorDetails('INVALID_CODE');
        expect(details).toEqual({
          message: 'Unknown error occurred during event processing.',
          severity: EventErrorSeverity.ERROR,
          status: EventErrorHttpStatus.INTERNAL_ERROR
        });
      });
    });
    
    describe('isRetryableError', () => {
      it('should identify timeout errors as retryable', () => {
        expect(isRetryableError(EVENT_PROD_DELIVERY_TIMEOUT)).toBe(true);
        expect(isRetryableError(EVENT_CONS_PROCESSING_TIMEOUT)).toBe(true);
        expect(isRetryableError(EVENT_DELIV_TIMEOUT)).toBe(true);
      });
      
      it('should identify broker unavailability as retryable', () => {
        expect(isRetryableError(EVENT_PROD_BROKER_UNAVAILABLE)).toBe(true);
        expect(isRetryableError(EVENT_DELIV_BROKER_UNAVAILABLE)).toBe(true);
      });
      
      it('should identify network failures as retryable', () => {
        expect(isRetryableError(EVENT_DELIV_NETWORK_FAILURE)).toBe(true);
      });
      
      it('should identify rebalance in progress as retryable', () => {
        expect(isRetryableError(EVENT_DELIV_REBALANCE_IN_PROGRESS)).toBe(true);
      });
      
      it('should identify validation errors as non-retryable', () => {
        expect(isRetryableError(EVENT_PROD_SCHEMA_VALIDATION_FAILED)).toBe(false);
        expect(isRetryableError(EVENT_CONS_SCHEMA_VALIDATION_FAILED)).toBe(false);
        expect(isRetryableError(EVENT_SCHEMA_REQUIRED_FIELD_MISSING)).toBe(false);
      });
      
      it('should identify handler not found as non-retryable', () => {
        expect(isRetryableError(EVENT_CONS_HANDLER_NOT_FOUND)).toBe(false);
      });
      
      it('should identify DLQ errors as non-retryable', () => {
        expect(isRetryableError(EVENT_DLQ_WRITE_FAILED)).toBe(false);
        expect(isRetryableError(EVENT_DLQ_READ_FAILED)).toBe(false);
        expect(isRetryableError(EVENT_DLQ_FULL)).toBe(false);
      });
    });
    
    describe('shouldSendToDLQ', () => {
      it('should send non-retryable errors to DLQ immediately', () => {
        expect(shouldSendToDLQ(EVENT_PROD_SCHEMA_VALIDATION_FAILED, 0, 3)).toBe(true);
        expect(shouldSendToDLQ(EVENT_CONS_SCHEMA_VALIDATION_FAILED, 0, 3)).toBe(true);
        expect(shouldSendToDLQ(EVENT_SCHEMA_REQUIRED_FIELD_MISSING, 0, 3)).toBe(true);
      });
      
      it('should not send retryable errors to DLQ if retries not exhausted', () => {
        expect(shouldSendToDLQ(EVENT_PROD_DELIVERY_TIMEOUT, 0, 3)).toBe(false);
        expect(shouldSendToDLQ(EVENT_PROD_DELIVERY_TIMEOUT, 1, 3)).toBe(false);
        expect(shouldSendToDLQ(EVENT_PROD_DELIVERY_TIMEOUT, 2, 3)).toBe(false);
      });
      
      it('should send retryable errors to DLQ if retries exhausted', () => {
        expect(shouldSendToDLQ(EVENT_PROD_DELIVERY_TIMEOUT, 3, 3)).toBe(true);
        expect(shouldSendToDLQ(EVENT_PROD_DELIVERY_TIMEOUT, 4, 3)).toBe(true);
      });
    });
    
    describe('getErrorLogLevel', () => {
      it('should return "info" for INFO severity errors', () => {
        expect(getErrorLogLevel(EVENT_DELIV_REBALANCE_IN_PROGRESS)).toBe('info');
      });
      
      it('should return "warn" for WARNING severity errors', () => {
        expect(getErrorLogLevel(EVENT_PROD_DELIVERY_TIMEOUT)).toBe('warn');
        expect(getErrorLogLevel(EVENT_CONS_PROCESSING_TIMEOUT)).toBe('warn');
        expect(getErrorLogLevel(EVENT_PROD_RATE_LIMIT_EXCEEDED)).toBe('warn');
      });
      
      it('should return "error" for ERROR severity errors', () => {
        expect(getErrorLogLevel(EVENT_PROD_SCHEMA_VALIDATION_FAILED)).toBe('error');
        expect(getErrorLogLevel(EVENT_CONS_SCHEMA_VALIDATION_FAILED)).toBe('error');
        expect(getErrorLogLevel(EVENT_SCHEMA_REQUIRED_FIELD_MISSING)).toBe('error');
      });
      
      it('should return "fatal" for CRITICAL severity errors', () => {
        expect(getErrorLogLevel(EVENT_PROD_BROKER_UNAVAILABLE)).toBe('fatal');
        expect(getErrorLogLevel(EVENT_CONS_COMMIT_FAILED)).toBe('fatal');
        expect(getErrorLogLevel(EVENT_SCHEMA_REGISTRY_UNAVAILABLE)).toBe('fatal');
      });
      
      it('should return "fatal" for FATAL severity errors', () => {
        // Create a mock error code with FATAL severity for testing
        const mockFatalErrorCode = 'MOCK_FATAL_ERROR';
        const mockErrorMessages = {
          ...ERROR_MESSAGES,
          [mockFatalErrorCode]: {
            message: 'Fatal error for testing',
            severity: EventErrorSeverity.FATAL,
            status: EventErrorHttpStatus.INTERNAL_ERROR
          }
        };
        
        // Mock the getErrorDetails function to use our mock error messages
        jest.spyOn(global, 'getErrorDetails').mockImplementation((errorCode) => {
          return mockErrorMessages[errorCode] || {
            message: 'Unknown error',
            severity: EventErrorSeverity.ERROR,
            status: EventErrorHttpStatus.INTERNAL_ERROR
          };
        });
        
        expect(getErrorLogLevel(mockFatalErrorCode)).toBe('fatal');
        
        // Restore the original implementation
        jest.restoreAllMocks();
      });
      
      it('should return "error" as default for unknown error codes', () => {
        expect(getErrorLogLevel('UNKNOWN_ERROR_CODE')).toBe('error');
      });
    });
  });
});