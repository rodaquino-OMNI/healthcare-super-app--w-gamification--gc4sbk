import {
  // Error Severity
  EventErrorSeverity,
  
  // Producer Error Codes
  EVENT_PRODUCER_VALIDATION_ERROR,
  EVENT_PRODUCER_SERIALIZATION_ERROR,
  EVENT_PRODUCER_CONNECTION_ERROR,
  EVENT_PRODUCER_DELIVERY_ERROR,
  EVENT_PRODUCER_VERSION_ERROR,
  
  // Consumer Error Codes
  EVENT_CONSUMER_DESERIALIZATION_ERROR,
  EVENT_CONSUMER_VALIDATION_ERROR,
  EVENT_CONSUMER_CONNECTION_ERROR,
  EVENT_CONSUMER_PROCESSING_ERROR,
  EVENT_CONSUMER_HANDLER_NOT_FOUND,
  EVENT_CONSUMER_GROUP_ERROR,
  
  // Schema Validation Error Codes
  EVENT_SCHEMA_MISSING_FIELD,
  EVENT_SCHEMA_INVALID_TYPE,
  EVENT_SCHEMA_INVALID_VALUE,
  EVENT_SCHEMA_UNKNOWN_TYPE,
  EVENT_SCHEMA_INVALID_FORMAT,
  
  // Delivery Error Codes
  EVENT_DELIVERY_TIMEOUT,
  EVENT_DELIVERY_BROKER_UNAVAILABLE,
  EVENT_DELIVERY_TOPIC_NOT_FOUND,
  EVENT_DELIVERY_PERMISSION_DENIED,
  EVENT_DELIVERY_SIZE_EXCEEDED,
  
  // Retry Error Codes
  EVENT_RETRY_EXHAUSTED,
  EVENT_RETRY_BACKOFF_ERROR,
  EVENT_RETRY_POLICY_NOT_FOUND,
  EVENT_RETRY_STATE_PERSISTENCE_ERROR,
  EVENT_RETRY_DLQ_DELIVERY_ERROR,
  
  // Journey-Specific Error Codes
  EVENT_HEALTH_METRIC_VALIDATION_ERROR,
  EVENT_HEALTH_GOAL_VALIDATION_ERROR,
  EVENT_HEALTH_DEVICE_VALIDATION_ERROR,
  EVENT_CARE_APPOINTMENT_VALIDATION_ERROR,
  EVENT_CARE_MEDICATION_VALIDATION_ERROR,
  EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR,
  EVENT_PLAN_CLAIM_VALIDATION_ERROR,
  EVENT_PLAN_BENEFIT_VALIDATION_ERROR,
  EVENT_PLAN_COVERAGE_VALIDATION_ERROR,
  
  // Error Mappings
  EVENT_ERROR_MESSAGES,
  EVENT_ERROR_SEVERITY,
  EVENT_ERROR_HTTP_STATUS,
  JOURNEY_EVENT_ERROR_MESSAGES,
  JOURNEY_EVENT_ERROR_HTTP_STATUS,
  JOURNEY_EVENT_ERROR_SEVERITY,
} from '../../../src/constants/errors.constants';

import { SYS_INTERNAL_SERVER_ERROR } from '@backend/shared/src/constants/error-codes.constants';

describe('Event Error Constants', () => {
  // Helper function to check if a string follows the EVENT_XXX pattern
  const isValidEventErrorCode = (code: string): boolean => {
    return /^EVENT_\d{3}$/.test(code);
  };

  // Helper function to check if a string follows the EVENT_JOURNEY_XXX pattern
  const isValidJourneyEventErrorCode = (code: string): boolean => {
    return /^EVENT_(HEALTH|CARE|PLAN)_\d{3}$/.test(code);
  };

  describe('Error Code Format', () => {
    describe('Producer Error Codes', () => {
      const producerErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_PRODUCER_SERIALIZATION_ERROR,
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_PRODUCER_DELIVERY_ERROR,
        EVENT_PRODUCER_VERSION_ERROR,
      ];

      it('should follow the established prefix pattern', () => {
        producerErrorCodes.forEach(code => {
          expect(isValidEventErrorCode(code)).toBe(true);
        });
      });

      it('should have codes in the 001-099 range', () => {
        producerErrorCodes.forEach(code => {
          const codeNumber = parseInt(code.slice(-3));
          expect(codeNumber).toBeGreaterThanOrEqual(1);
          expect(codeNumber).toBeLessThanOrEqual(99);
        });
      });
    });

    describe('Consumer Error Codes', () => {
      const consumerErrorCodes = [
        EVENT_CONSUMER_DESERIALIZATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_CONSUMER_PROCESSING_ERROR,
        EVENT_CONSUMER_HANDLER_NOT_FOUND,
        EVENT_CONSUMER_GROUP_ERROR,
      ];

      it('should follow the established prefix pattern', () => {
        consumerErrorCodes.forEach(code => {
          expect(isValidEventErrorCode(code)).toBe(true);
        });
      });

      it('should have codes in the 100-199 range', () => {
        consumerErrorCodes.forEach(code => {
          const codeNumber = parseInt(code.slice(-3));
          expect(codeNumber).toBeGreaterThanOrEqual(100);
          expect(codeNumber).toBeLessThanOrEqual(199);
        });
      });
    });

    describe('Schema Validation Error Codes', () => {
      const schemaErrorCodes = [
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
      ];

      it('should follow the established prefix pattern', () => {
        schemaErrorCodes.forEach(code => {
          expect(isValidEventErrorCode(code)).toBe(true);
        });
      });

      it('should have codes in the 200-299 range', () => {
        schemaErrorCodes.forEach(code => {
          const codeNumber = parseInt(code.slice(-3));
          expect(codeNumber).toBeGreaterThanOrEqual(200);
          expect(codeNumber).toBeLessThanOrEqual(299);
        });
      });
    });

    describe('Delivery Error Codes', () => {
      const deliveryErrorCodes = [
        EVENT_DELIVERY_TIMEOUT,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
        EVENT_DELIVERY_TOPIC_NOT_FOUND,
        EVENT_DELIVERY_PERMISSION_DENIED,
        EVENT_DELIVERY_SIZE_EXCEEDED,
      ];

      it('should follow the established prefix pattern', () => {
        deliveryErrorCodes.forEach(code => {
          expect(isValidEventErrorCode(code)).toBe(true);
        });
      });

      it('should have codes in the 300-399 range', () => {
        deliveryErrorCodes.forEach(code => {
          const codeNumber = parseInt(code.slice(-3));
          expect(codeNumber).toBeGreaterThanOrEqual(300);
          expect(codeNumber).toBeLessThanOrEqual(399);
        });
      });
    });

    describe('Retry Error Codes', () => {
      const retryErrorCodes = [
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      it('should follow the established prefix pattern', () => {
        retryErrorCodes.forEach(code => {
          expect(isValidEventErrorCode(code)).toBe(true);
        });
      });

      it('should have codes in the 400-499 range', () => {
        retryErrorCodes.forEach(code => {
          const codeNumber = parseInt(code.slice(-3));
          expect(codeNumber).toBeGreaterThanOrEqual(400);
          expect(codeNumber).toBeLessThanOrEqual(499);
        });
      });
    });

    describe('Journey-Specific Error Codes', () => {
      const healthErrorCodes = [
        EVENT_HEALTH_METRIC_VALIDATION_ERROR,
        EVENT_HEALTH_GOAL_VALIDATION_ERROR,
        EVENT_HEALTH_DEVICE_VALIDATION_ERROR,
      ];

      const careErrorCodes = [
        EVENT_CARE_APPOINTMENT_VALIDATION_ERROR,
        EVENT_CARE_MEDICATION_VALIDATION_ERROR,
        EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR,
      ];

      const planErrorCodes = [
        EVENT_PLAN_CLAIM_VALIDATION_ERROR,
        EVENT_PLAN_BENEFIT_VALIDATION_ERROR,
        EVENT_PLAN_COVERAGE_VALIDATION_ERROR,
      ];

      it('should follow the journey-specific prefix pattern', () => {
        [...healthErrorCodes, ...careErrorCodes, ...planErrorCodes].forEach(code => {
          expect(isValidJourneyEventErrorCode(code)).toBe(true);
        });
      });

      it('should have health error codes with HEALTH prefix', () => {
        healthErrorCodes.forEach(code => {
          expect(code.startsWith('EVENT_HEALTH_')).toBe(true);
        });
      });

      it('should have care error codes with CARE prefix', () => {
        careErrorCodes.forEach(code => {
          expect(code.startsWith('EVENT_CARE_')).toBe(true);
        });
      });

      it('should have plan error codes with PLAN prefix', () => {
        planErrorCodes.forEach(code => {
          expect(code.startsWith('EVENT_PLAN_')).toBe(true);
        });
      });
    });
  });

  describe('Error Messages', () => {
    it('should have a message for each error code', () => {
      // General error codes
      const generalErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_PRODUCER_SERIALIZATION_ERROR,
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_PRODUCER_DELIVERY_ERROR,
        EVENT_PRODUCER_VERSION_ERROR,
        EVENT_CONSUMER_DESERIALIZATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_CONSUMER_PROCESSING_ERROR,
        EVENT_CONSUMER_HANDLER_NOT_FOUND,
        EVENT_CONSUMER_GROUP_ERROR,
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
        EVENT_DELIVERY_TIMEOUT,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
        EVENT_DELIVERY_TOPIC_NOT_FOUND,
        EVENT_DELIVERY_PERMISSION_DENIED,
        EVENT_DELIVERY_SIZE_EXCEEDED,
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      generalErrorCodes.forEach(code => {
        expect(EVENT_ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof EVENT_ERROR_MESSAGES[code]).toBe('string');
        expect(EVENT_ERROR_MESSAGES[code].length).toBeGreaterThan(10); // Ensure message is descriptive
      });

      // Journey-specific error codes
      const journeyErrorCodes = [
        EVENT_HEALTH_METRIC_VALIDATION_ERROR,
        EVENT_HEALTH_GOAL_VALIDATION_ERROR,
        EVENT_HEALTH_DEVICE_VALIDATION_ERROR,
        EVENT_CARE_APPOINTMENT_VALIDATION_ERROR,
        EVENT_CARE_MEDICATION_VALIDATION_ERROR,
        EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR,
        EVENT_PLAN_CLAIM_VALIDATION_ERROR,
        EVENT_PLAN_BENEFIT_VALIDATION_ERROR,
        EVENT_PLAN_COVERAGE_VALIDATION_ERROR,
      ];

      journeyErrorCodes.forEach(code => {
        expect(JOURNEY_EVENT_ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof JOURNEY_EVENT_ERROR_MESSAGES[code]).toBe('string');
        expect(JOURNEY_EVENT_ERROR_MESSAGES[code].length).toBeGreaterThan(10); // Ensure message is descriptive
      });
    });

    it('should include troubleshooting guidance in error messages', () => {
      // Check a sample of error messages for troubleshooting guidance
      const sampleErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_DELIVERY_TIMEOUT,
        EVENT_RETRY_EXHAUSTED,
      ];

      sampleErrorCodes.forEach(code => {
        const message = EVENT_ERROR_MESSAGES[code];
        expect(message.includes('Check') || 
               message.includes('Ensure') || 
               message.includes('Verify') ||
               message.includes('Configure')).toBe(true);
      });
    });

    it('should have a fallback message for unknown error codes', () => {
      expect(EVENT_ERROR_MESSAGES[SYS_INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(typeof EVENT_ERROR_MESSAGES[SYS_INTERNAL_SERVER_ERROR]).toBe('string');
    });
  });

  describe('Error Severity', () => {
    it('should have a severity level for each error code', () => {
      // General error codes
      const generalErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_PRODUCER_SERIALIZATION_ERROR,
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_PRODUCER_DELIVERY_ERROR,
        EVENT_PRODUCER_VERSION_ERROR,
        EVENT_CONSUMER_DESERIALIZATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_CONSUMER_PROCESSING_ERROR,
        EVENT_CONSUMER_HANDLER_NOT_FOUND,
        EVENT_CONSUMER_GROUP_ERROR,
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
        EVENT_DELIVERY_TIMEOUT,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
        EVENT_DELIVERY_TOPIC_NOT_FOUND,
        EVENT_DELIVERY_PERMISSION_DENIED,
        EVENT_DELIVERY_SIZE_EXCEEDED,
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      generalErrorCodes.forEach(code => {
        expect(EVENT_ERROR_SEVERITY[code]).toBeDefined();
        expect(Object.values(EventErrorSeverity)).toContain(EVENT_ERROR_SEVERITY[code]);
      });

      // Journey-specific error codes
      const journeyErrorCodes = [
        EVENT_HEALTH_METRIC_VALIDATION_ERROR,
        EVENT_HEALTH_GOAL_VALIDATION_ERROR,
        EVENT_HEALTH_DEVICE_VALIDATION_ERROR,
        EVENT_CARE_APPOINTMENT_VALIDATION_ERROR,
        EVENT_CARE_MEDICATION_VALIDATION_ERROR,
        EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR,
        EVENT_PLAN_CLAIM_VALIDATION_ERROR,
        EVENT_PLAN_BENEFIT_VALIDATION_ERROR,
        EVENT_PLAN_COVERAGE_VALIDATION_ERROR,
      ];

      journeyErrorCodes.forEach(code => {
        expect(JOURNEY_EVENT_ERROR_SEVERITY[code]).toBeDefined();
        expect(Object.values(EventErrorSeverity)).toContain(JOURNEY_EVENT_ERROR_SEVERITY[code]);
      });
    });

    it('should assign CRITICAL severity to broker unavailability', () => {
      expect(EVENT_ERROR_SEVERITY[EVENT_DELIVERY_BROKER_UNAVAILABLE]).toBe(EventErrorSeverity.CRITICAL);
    });

    it('should assign CRITICAL severity to DLQ delivery errors', () => {
      expect(EVENT_ERROR_SEVERITY[EVENT_RETRY_DLQ_DELIVERY_ERROR]).toBe(EventErrorSeverity.CRITICAL);
    });

    it('should have a fallback severity for unknown error codes', () => {
      expect(EVENT_ERROR_SEVERITY[SYS_INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(EVENT_ERROR_SEVERITY[SYS_INTERNAL_SERVER_ERROR]).toBe(EventErrorSeverity.CRITICAL);
    });
  });

  describe('HTTP Status Codes', () => {
    it('should have an HTTP status code for each error code', () => {
      // General error codes
      const generalErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_PRODUCER_SERIALIZATION_ERROR,
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_PRODUCER_DELIVERY_ERROR,
        EVENT_PRODUCER_VERSION_ERROR,
        EVENT_CONSUMER_DESERIALIZATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_CONSUMER_PROCESSING_ERROR,
        EVENT_CONSUMER_HANDLER_NOT_FOUND,
        EVENT_CONSUMER_GROUP_ERROR,
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
        EVENT_DELIVERY_TIMEOUT,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
        EVENT_DELIVERY_TOPIC_NOT_FOUND,
        EVENT_DELIVERY_PERMISSION_DENIED,
        EVENT_DELIVERY_SIZE_EXCEEDED,
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      generalErrorCodes.forEach(code => {
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBeDefined();
        expect(typeof EVENT_ERROR_HTTP_STATUS[code]).toBe('number');
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400); // Should be an error status code
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBeLessThanOrEqual(599); // Should be a valid HTTP status code
      });

      // Journey-specific error codes
      const journeyErrorCodes = [
        EVENT_HEALTH_METRIC_VALIDATION_ERROR,
        EVENT_HEALTH_GOAL_VALIDATION_ERROR,
        EVENT_HEALTH_DEVICE_VALIDATION_ERROR,
        EVENT_CARE_APPOINTMENT_VALIDATION_ERROR,
        EVENT_CARE_MEDICATION_VALIDATION_ERROR,
        EVENT_CARE_TELEMEDICINE_VALIDATION_ERROR,
        EVENT_PLAN_CLAIM_VALIDATION_ERROR,
        EVENT_PLAN_BENEFIT_VALIDATION_ERROR,
        EVENT_PLAN_COVERAGE_VALIDATION_ERROR,
      ];

      journeyErrorCodes.forEach(code => {
        expect(JOURNEY_EVENT_ERROR_HTTP_STATUS[code]).toBeDefined();
        expect(typeof JOURNEY_EVENT_ERROR_HTTP_STATUS[code]).toBe('number');
        expect(JOURNEY_EVENT_ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400); // Should be an error status code
        expect(JOURNEY_EVENT_ERROR_HTTP_STATUS[code]).toBeLessThanOrEqual(599); // Should be a valid HTTP status code
      });
    });

    it('should map validation errors to 400 Bad Request', () => {
      const validationErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
      ];

      validationErrorCodes.forEach(code => {
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBe(400);
      });
    });

    it('should map connection errors to 503 Service Unavailable', () => {
      const connectionErrorCodes = [
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
      ];

      connectionErrorCodes.forEach(code => {
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBe(503);
      });
    });

    it('should map timeout errors to 504 Gateway Timeout', () => {
      expect(EVENT_ERROR_HTTP_STATUS[EVENT_DELIVERY_TIMEOUT]).toBe(504);
    });

    it('should map permission errors to 403 Forbidden', () => {
      expect(EVENT_ERROR_HTTP_STATUS[EVENT_DELIVERY_PERMISSION_DENIED]).toBe(403);
    });

    it('should map not found errors to 404 Not Found', () => {
      expect(EVENT_ERROR_HTTP_STATUS[EVENT_DELIVERY_TOPIC_NOT_FOUND]).toBe(404);
    });

    it('should map size exceeded errors to 413 Payload Too Large', () => {
      expect(EVENT_ERROR_HTTP_STATUS[EVENT_DELIVERY_SIZE_EXCEEDED]).toBe(413);
    });

    it('should map retry errors to 500 Internal Server Error', () => {
      const retryErrorCodes = [
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      retryErrorCodes.forEach(code => {
        expect(EVENT_ERROR_HTTP_STATUS[code]).toBe(500);
      });
    });

    it('should have a fallback HTTP status code for unknown error codes', () => {
      expect(EVENT_ERROR_HTTP_STATUS[SYS_INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(EVENT_ERROR_HTTP_STATUS[SYS_INTERNAL_SERVER_ERROR]).toBe(500);
    });
  });

  describe('Error Categories', () => {
    it('should have producer error codes with EVENT_PRODUCER prefix', () => {
      const producerErrorCodes = [
        EVENT_PRODUCER_VALIDATION_ERROR,
        EVENT_PRODUCER_SERIALIZATION_ERROR,
        EVENT_PRODUCER_CONNECTION_ERROR,
        EVENT_PRODUCER_DELIVERY_ERROR,
        EVENT_PRODUCER_VERSION_ERROR,
      ];

      producerErrorCodes.forEach(code => {
        expect(code.includes('PRODUCER')).toBe(true);
      });
    });

    it('should have consumer error codes with EVENT_CONSUMER prefix', () => {
      const consumerErrorCodes = [
        EVENT_CONSUMER_DESERIALIZATION_ERROR,
        EVENT_CONSUMER_VALIDATION_ERROR,
        EVENT_CONSUMER_CONNECTION_ERROR,
        EVENT_CONSUMER_PROCESSING_ERROR,
        EVENT_CONSUMER_HANDLER_NOT_FOUND,
        EVENT_CONSUMER_GROUP_ERROR,
      ];

      consumerErrorCodes.forEach(code => {
        expect(code.includes('CONSUMER')).toBe(true);
      });
    });

    it('should have schema error codes with EVENT_SCHEMA prefix', () => {
      const schemaErrorCodes = [
        EVENT_SCHEMA_MISSING_FIELD,
        EVENT_SCHEMA_INVALID_TYPE,
        EVENT_SCHEMA_INVALID_VALUE,
        EVENT_SCHEMA_UNKNOWN_TYPE,
        EVENT_SCHEMA_INVALID_FORMAT,
      ];

      schemaErrorCodes.forEach(code => {
        expect(code.includes('SCHEMA')).toBe(true);
      });
    });

    it('should have delivery error codes with EVENT_DELIVERY prefix', () => {
      const deliveryErrorCodes = [
        EVENT_DELIVERY_TIMEOUT,
        EVENT_DELIVERY_BROKER_UNAVAILABLE,
        EVENT_DELIVERY_TOPIC_NOT_FOUND,
        EVENT_DELIVERY_PERMISSION_DENIED,
        EVENT_DELIVERY_SIZE_EXCEEDED,
      ];

      deliveryErrorCodes.forEach(code => {
        expect(code.includes('DELIVERY')).toBe(true);
      });
    });

    it('should have retry error codes with EVENT_RETRY prefix', () => {
      const retryErrorCodes = [
        EVENT_RETRY_EXHAUSTED,
        EVENT_RETRY_BACKOFF_ERROR,
        EVENT_RETRY_POLICY_NOT_FOUND,
        EVENT_RETRY_STATE_PERSISTENCE_ERROR,
        EVENT_RETRY_DLQ_DELIVERY_ERROR,
      ];

      retryErrorCodes.forEach(code => {
        expect(code.includes('RETRY')).toBe(true);
      });
    });
  });
});