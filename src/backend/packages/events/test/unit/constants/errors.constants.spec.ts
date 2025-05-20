import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY, HTTP_STATUS_CODES } from '../../../src/constants/errors.constants';

describe('Event Error Constants', () => {
  describe('Error Code Format', () => {
    it('should have all error codes following the KAFKA_XXX pattern', () => {
      // Check that all error codes follow the pattern KAFKA_XXX where XXX is a number
      Object.values(ERROR_CODES).forEach(code => {
        expect(code).toMatch(/^KAFKA_\d{3}$/);
      });
    });

    it('should have unique error codes', () => {
      const codeValues = Object.values(ERROR_CODES);
      const uniqueValues = new Set(codeValues);
      expect(uniqueValues.size).toBe(codeValues.length);
    });
  });

  describe('Error Code Categories', () => {
    it('should have initialization errors in the 000-099 range', () => {
      expect(ERROR_CODES.INITIALIZATION_FAILED).toMatch(/^KAFKA_0\d{2}$/);
    });

    it('should have producer errors in the 100-199 range', () => {
      expect(ERROR_CODES.PRODUCER_CONNECTION_FAILED).toMatch(/^KAFKA_1\d{2}$/);
      expect(ERROR_CODES.PRODUCER_SEND_FAILED).toMatch(/^KAFKA_1\d{2}$/);
      expect(ERROR_CODES.PRODUCER_BATCH_FAILED).toMatch(/^KAFKA_1\d{2}$/);
      expect(ERROR_CODES.PRODUCER_TRANSACTION_FAILED).toMatch(/^KAFKA_1\d{2}$/);
    });

    it('should have consumer errors in the 200-299 range', () => {
      expect(ERROR_CODES.CONSUMER_CONNECTION_FAILED).toMatch(/^KAFKA_2\d{2}$/);
      expect(ERROR_CODES.CONSUMER_SUBSCRIPTION_FAILED).toMatch(/^KAFKA_2\d{2}$/);
      expect(ERROR_CODES.CONSUMER_GROUP_ERROR).toMatch(/^KAFKA_2\d{2}$/);
      expect(ERROR_CODES.CONSUMER_PROCESSING_FAILED).toMatch(/^KAFKA_2\d{2}$/);
    });

    it('should have message errors in the 300-399 range', () => {
      expect(ERROR_CODES.MESSAGE_SERIALIZATION_FAILED).toMatch(/^KAFKA_3\d{2}$/);
      expect(ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED).toMatch(/^KAFKA_3\d{2}$/);
    });

    it('should have schema errors in the 400-499 range', () => {
      expect(ERROR_CODES.SCHEMA_VALIDATION_FAILED).toMatch(/^KAFKA_4\d{2}$/);
      expect(ERROR_CODES.SCHEMA_VALIDATION_ERROR).toMatch(/^KAFKA_4\d{2}$/);
      expect(ERROR_CODES.SCHEMA_NOT_FOUND).toMatch(/^KAFKA_4\d{2}$/);
    });

    it('should have dead-letter queue errors in the 500-599 range', () => {
      expect(ERROR_CODES.DLQ_SEND_FAILED).toMatch(/^KAFKA_5\d{2}$/);
    });

    it('should have retry errors in the 600-699 range', () => {
      expect(ERROR_CODES.RETRY_EXHAUSTED).toMatch(/^KAFKA_6\d{2}$/);
      expect(ERROR_CODES.RETRY_FAILED).toMatch(/^KAFKA_6\d{2}$/);
    });
  });

  describe('Error Messages', () => {
    it('should have a corresponding message for each error code', () => {
      // Check that all error codes have a corresponding message
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code]).toBe('string');
      });
    });

    it('should have descriptive error messages', () => {
      // Check that all error messages are descriptive (not empty and have a minimum length)
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(10);
      });
    });

    it('should have error messages that mention the relevant component', () => {
      // Producer errors should mention producer or producing
      Object.entries(ERROR_CODES)
        .filter(([key]) => key.startsWith('PRODUCER_'))
        .forEach(([_, code]) => {
          expect(ERROR_MESSAGES[code].toLowerCase()).toMatch(/produc/);
        });

      // Consumer errors should mention consumer or consuming
      Object.entries(ERROR_CODES)
        .filter(([key]) => key.startsWith('CONSUMER_'))
        .forEach(([_, code]) => {
          expect(ERROR_MESSAGES[code].toLowerCase()).toMatch(/consum/);
        });

      // Schema errors should mention schema or validation
      Object.entries(ERROR_CODES)
        .filter(([key]) => key.startsWith('SCHEMA_'))
        .forEach(([_, code]) => {
          expect(ERROR_MESSAGES[code].toLowerCase()).toMatch(/schema|validat/);
        });

      // Retry errors should mention retry
      Object.entries(ERROR_CODES)
        .filter(([key]) => key.startsWith('RETRY_'))
        .forEach(([_, code]) => {
          expect(ERROR_MESSAGES[code].toLowerCase()).toMatch(/retry/);
        });

      // DLQ errors should mention dead-letter queue or DLQ
      Object.entries(ERROR_CODES)
        .filter(([key]) => key.startsWith('DLQ_'))
        .forEach(([_, code]) => {
          expect(ERROR_MESSAGES[code].toLowerCase()).toMatch(/dead-letter queue|dlq/);
        });
    });
  });

  describe('Error Code Completeness', () => {
    it('should have error codes for all critical event processing stages', () => {
      // Check that we have error codes for all critical stages
      const errorCodeKeys = Object.keys(ERROR_CODES);
      
      // Initialization
      expect(errorCodeKeys.some(key => key.includes('INITIALIZATION'))).toBeTruthy();
      
      // Producer
      expect(errorCodeKeys.some(key => key.includes('PRODUCER_CONNECTION'))).toBeTruthy();
      expect(errorCodeKeys.some(key => key.includes('PRODUCER_SEND'))).toBeTruthy();
      
      // Consumer
      expect(errorCodeKeys.some(key => key.includes('CONSUMER_CONNECTION'))).toBeTruthy();
      expect(errorCodeKeys.some(key => key.includes('CONSUMER_PROCESSING'))).toBeTruthy();
      
      // Schema
      expect(errorCodeKeys.some(key => key.includes('SCHEMA_VALIDATION'))).toBeTruthy();
      
      // Retry
      expect(errorCodeKeys.some(key => key.includes('RETRY'))).toBeTruthy();
      
      // Dead Letter Queue
      expect(errorCodeKeys.some(key => key.includes('DLQ'))).toBeTruthy();
    });
  });

  describe('Error Code Integration', () => {
    it('should have error codes that align with the retry mechanism requirements', () => {
      // Verify we have error codes for retry exhaustion and retry failure
      expect(ERROR_CODES.RETRY_EXHAUSTED).toBeDefined();
      expect(ERROR_CODES.RETRY_FAILED).toBeDefined();
      
      // Verify the messages are descriptive for retry-related errors
      expect(ERROR_MESSAGES[ERROR_CODES.RETRY_EXHAUSTED]).toContain('Maximum retry');
      expect(ERROR_MESSAGES[ERROR_CODES.RETRY_FAILED]).toContain('Failed to retry');
    });

    it('should have error codes that support dead letter queue implementation', () => {
      // Verify we have error codes for DLQ operations
      expect(ERROR_CODES.DLQ_SEND_FAILED).toBeDefined();
      
      // Verify the message is descriptive for DLQ-related errors
      expect(ERROR_MESSAGES[ERROR_CODES.DLQ_SEND_FAILED]).toContain('dead-letter queue');
    });

    it('should have error codes that enable proper monitoring categorization', () => {
      // Verify we have distinct categories of error codes for monitoring
      const categories = {
        initialization: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('INITIALIZATION')),
        producer: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('PRODUCER')),
        consumer: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('CONSUMER')),
        message: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('MESSAGE')),
        schema: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('SCHEMA')),
        dlq: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('DLQ')),
        retry: Object.entries(ERROR_CODES).filter(([key]) => key.startsWith('RETRY')),
      };
      
      // Each category should have at least one error code
      Object.values(categories).forEach(category => {
        expect(category.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Severity Classification', () => {
    it('should define severity levels for all error codes', () => {
      // Check that all error codes have a severity level assigned
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_SEVERITY[code]).toBeDefined();
      });
    });

    it('should have valid severity levels', () => {
      // Valid severity levels should be one of: 'CRITICAL', 'ERROR', 'WARNING', 'INFO'
      const validSeverities = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];
      
      Object.values(ERROR_CODES).forEach(code => {
        expect(validSeverities).toContain(ERROR_SEVERITY[code]);
      });
    });

    it('should assign appropriate severity levels based on error category', () => {
      // Connection failures should be CRITICAL
      expect(ERROR_SEVERITY[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe('CRITICAL');
      expect(ERROR_SEVERITY[ERROR_CODES.CONSUMER_CONNECTION_FAILED]).toBe('CRITICAL');
      
      // Initialization failures should be CRITICAL
      expect(ERROR_SEVERITY[ERROR_CODES.INITIALIZATION_FAILED]).toBe('CRITICAL');
      
      // Schema validation issues should be ERROR
      expect(ERROR_SEVERITY[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe('ERROR');
      expect(ERROR_SEVERITY[ERROR_CODES.SCHEMA_VALIDATION_ERROR]).toBe('ERROR');
      
      // Retry exhaustion should be WARNING (expected in some cases)
      expect(ERROR_SEVERITY[ERROR_CODES.RETRY_EXHAUSTED]).toBe('WARNING');
    });
  });

  describe('HTTP Status Code Mappings', () => {
    it('should define HTTP status codes for all error codes', () => {
      // Check that all error codes have an HTTP status code assigned
      Object.values(ERROR_CODES).forEach(code => {
        expect(HTTP_STATUS_CODES[code]).toBeDefined();
        expect(typeof HTTP_STATUS_CODES[code]).toBe('number');
      });
    });

    it('should have valid HTTP status codes', () => {
      // HTTP status codes should be in the range 400-599 for errors
      Object.values(ERROR_CODES).forEach(code => {
        const statusCode = HTTP_STATUS_CODES[code];
        expect(statusCode).toBeGreaterThanOrEqual(400);
        expect(statusCode).toBeLessThanOrEqual(599);
      });
    });

    it('should assign appropriate HTTP status codes based on error category', () => {
      // Schema validation errors should be 400 Bad Request
      expect(HTTP_STATUS_CODES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]).toBe(400);
      expect(HTTP_STATUS_CODES[ERROR_CODES.SCHEMA_VALIDATION_ERROR]).toBe(400);
      
      // Connection failures should be 503 Service Unavailable
      expect(HTTP_STATUS_CODES[ERROR_CODES.PRODUCER_CONNECTION_FAILED]).toBe(503);
      expect(HTTP_STATUS_CODES[ERROR_CODES.CONSUMER_CONNECTION_FAILED]).toBe(503);
      
      // Initialization failures should be 500 Internal Server Error
      expect(HTTP_STATUS_CODES[ERROR_CODES.INITIALIZATION_FAILED]).toBe(500);
      
      // Retry exhaustion should be 503 Service Unavailable
      expect(HTTP_STATUS_CODES[ERROR_CODES.RETRY_EXHAUSTED]).toBe(503);
    });
  });
});