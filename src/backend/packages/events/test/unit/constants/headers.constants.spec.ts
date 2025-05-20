import { HEADERS } from '../../../src/constants/headers.constants';

describe('Headers Constants', () => {
  describe('Naming Pattern Consistency', () => {
    it('should follow the austa-* naming pattern for all headers', () => {
      // Check all headers follow the pattern
      const allHeaders = getAllHeaderValues(HEADERS);
      
      for (const header of allHeaders) {
        expect(header).toMatch(/^austa-[a-z-]+$/);
      }
    });
    
    it('should use consistent category prefixes', () => {
      // Tracing headers
      expect(HEADERS.TRACING.CORRELATION_ID).toMatch(/^austa-correlation-/);
      expect(HEADERS.TRACING.TRACE_ID).toMatch(/^austa-trace-/);
      expect(HEADERS.TRACING.SPAN_ID).toMatch(/^austa-span-/);
      
      // Versioning headers
      expect(HEADERS.VERSIONING.SCHEMA_VERSION).toMatch(/^austa-schema-/);
      expect(HEADERS.VERSIONING.API_VERSION).toMatch(/^austa-api-/);
      
      // Metadata headers
      expect(HEADERS.METADATA.SOURCE_SERVICE).toMatch(/^austa-source-/);
      expect(HEADERS.METADATA.TIMESTAMP).toMatch(/^austa-timestamp/);
      expect(HEADERS.METADATA.EVENT_TYPE).toMatch(/^austa-event-/);
      
      // Delivery headers
      expect(HEADERS.DELIVERY.PRIORITY).toMatch(/^austa-priority/);
      expect(HEADERS.DELIVERY.RETRY_COUNT).toMatch(/^austa-retry-/);
      expect(HEADERS.DELIVERY.MAX_RETRIES).toMatch(/^austa-max-retries/);
      expect(HEADERS.DELIVERY.RETRY_BACKOFF).toMatch(/^austa-retry-/);
      
      // Journey context headers
      expect(HEADERS.JOURNEY.CONTEXT).toMatch(/^austa-journey-/);
      expect(HEADERS.JOURNEY.USER_ID).toMatch(/^austa-user-/);
    });
  });
  
  describe('Tracing Headers', () => {
    it('should define correlation ID header for distributed tracing', () => {
      expect(HEADERS.TRACING.CORRELATION_ID).toBe('austa-correlation-id');
    });
    
    it('should define trace ID header for distributed tracing', () => {
      expect(HEADERS.TRACING.TRACE_ID).toBe('austa-trace-id');
    });
    
    it('should define span ID header for distributed tracing', () => {
      expect(HEADERS.TRACING.SPAN_ID).toBe('austa-span-id');
    });
    
    it('should define parent span ID header for distributed tracing', () => {
      expect(HEADERS.TRACING.PARENT_SPAN_ID).toBe('austa-parent-span-id');
    });
  });
  
  describe('Versioning Headers', () => {
    it('should define schema version header for backward compatibility', () => {
      expect(HEADERS.VERSIONING.SCHEMA_VERSION).toBe('austa-schema-version');
    });
    
    it('should define API version header for backward compatibility', () => {
      expect(HEADERS.VERSIONING.API_VERSION).toBe('austa-api-version');
    });
  });
  
  describe('Metadata Headers', () => {
    it('should define source service header for event provenance', () => {
      expect(HEADERS.METADATA.SOURCE_SERVICE).toBe('austa-source-service');
    });
    
    it('should define timestamp header for event provenance', () => {
      expect(HEADERS.METADATA.TIMESTAMP).toBe('austa-timestamp');
    });
    
    it('should define event type header for message classification', () => {
      expect(HEADERS.METADATA.EVENT_TYPE).toBe('austa-event-type');
    });
    
    it('should define event ID header for message deduplication', () => {
      expect(HEADERS.METADATA.EVENT_ID).toBe('austa-event-id');
    });
  });
  
  describe('Delivery Headers', () => {
    it('should define priority header for message prioritization', () => {
      expect(HEADERS.DELIVERY.PRIORITY).toBe('austa-priority');
    });
    
    it('should define retry count header for tracking retry attempts', () => {
      expect(HEADERS.DELIVERY.RETRY_COUNT).toBe('austa-retry-count');
    });
    
    it('should define max retries header for limiting retry attempts', () => {
      expect(HEADERS.DELIVERY.MAX_RETRIES).toBe('austa-max-retries');
    });
    
    it('should define retry backoff header for exponential backoff', () => {
      expect(HEADERS.DELIVERY.RETRY_BACKOFF).toBe('austa-retry-backoff');
    });
    
    it('should define delivery deadline header for time-sensitive messages', () => {
      expect(HEADERS.DELIVERY.DELIVERY_DEADLINE).toBe('austa-delivery-deadline');
    });
  });
  
  describe('Journey Context Headers', () => {
    it('should define journey context header for event routing', () => {
      expect(HEADERS.JOURNEY.CONTEXT).toBe('austa-journey-context');
    });
    
    it('should define user ID header for user-specific events', () => {
      expect(HEADERS.JOURNEY.USER_ID).toBe('austa-user-id');
    });
    
    it('should define journey type header for journey-specific processing', () => {
      expect(HEADERS.JOURNEY.TYPE).toBe('austa-journey-type');
    });
  });
  
  describe('Header Coverage', () => {
    it('should cover all required tracing headers', () => {
      expect(HEADERS.TRACING.CORRELATION_ID).toBeDefined();
      expect(HEADERS.TRACING.TRACE_ID).toBeDefined();
      expect(HEADERS.TRACING.SPAN_ID).toBeDefined();
      expect(HEADERS.TRACING.PARENT_SPAN_ID).toBeDefined();
    });
    
    it('should cover all required versioning headers', () => {
      expect(HEADERS.VERSIONING.SCHEMA_VERSION).toBeDefined();
      expect(HEADERS.VERSIONING.API_VERSION).toBeDefined();
    });
    
    it('should cover all required metadata headers', () => {
      expect(HEADERS.METADATA.SOURCE_SERVICE).toBeDefined();
      expect(HEADERS.METADATA.TIMESTAMP).toBeDefined();
      expect(HEADERS.METADATA.EVENT_TYPE).toBeDefined();
      expect(HEADERS.METADATA.EVENT_ID).toBeDefined();
    });
    
    it('should cover all required delivery headers', () => {
      expect(HEADERS.DELIVERY.PRIORITY).toBeDefined();
      expect(HEADERS.DELIVERY.RETRY_COUNT).toBeDefined();
      expect(HEADERS.DELIVERY.MAX_RETRIES).toBeDefined();
      expect(HEADERS.DELIVERY.RETRY_BACKOFF).toBeDefined();
      expect(HEADERS.DELIVERY.DELIVERY_DEADLINE).toBeDefined();
    });
    
    it('should cover all required journey context headers', () => {
      expect(HEADERS.JOURNEY.CONTEXT).toBeDefined();
      expect(HEADERS.JOURNEY.USER_ID).toBeDefined();
      expect(HEADERS.JOURNEY.TYPE).toBeDefined();
    });
  });
});

/**
 * Helper function to extract all header values from the HEADERS object,
 * including nested values.
 */
function getAllHeaderValues(headers: any): string[] {
  const result: string[] = [];
  
  function extractValues(obj: any) {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        result.push(value);
      } else if (typeof value === 'object' && value !== null) {
        extractValues(value);
      }
    }
  }
  
  extractValues(headers);
  return result;
}