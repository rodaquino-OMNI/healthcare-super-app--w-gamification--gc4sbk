import {
  TRACE_HEADERS,
  VERSION_HEADERS,
  SOURCE_HEADERS,
  CONTEXT_HEADERS,
  DELIVERY_HEADERS,
  HEADERS,
  REQUIRED_HEADERS,
  PROPAGATED_HEADERS,
  HeaderKey
} from '../../../src/constants/headers.constants';

describe('Header Constants', () => {
  describe('Naming Conventions', () => {
    it('should use kebab-case for all header keys', () => {
      // Regular expression for kebab-case (allowing x- prefix)
      const kebabCaseRegex = /^(x-)?[a-z]+(-[a-z]+)*$/;
      
      // Test all header categories
      Object.values(TRACE_HEADERS).forEach(header => {
        expect(header).toMatch(kebabCaseRegex);
      });
      
      Object.values(VERSION_HEADERS).forEach(header => {
        expect(header).toMatch(kebabCaseRegex);
      });
      
      Object.values(SOURCE_HEADERS).forEach(header => {
        expect(header).toMatch(kebabCaseRegex);
      });
      
      Object.values(CONTEXT_HEADERS).forEach(header => {
        expect(header).toMatch(kebabCaseRegex);
      });
      
      Object.values(DELIVERY_HEADERS).forEach(header => {
        expect(header).toMatch(kebabCaseRegex);
      });
    });
    
    it('should use x- prefix for custom headers', () => {
      // Standard headers that don't need x- prefix
      const standardHeaders = ['content-type'];
      
      // Test all header categories except standard headers
      Object.values(TRACE_HEADERS).forEach(header => {
        if (!standardHeaders.includes(header)) {
          expect(header).toMatch(/^x-/);
        }
      });
      
      Object.values(VERSION_HEADERS).forEach(header => {
        if (!standardHeaders.includes(header)) {
          expect(header).toMatch(/^x-/);
        }
      });
      
      Object.values(SOURCE_HEADERS).forEach(header => {
        if (!standardHeaders.includes(header)) {
          expect(header).toMatch(/^x-/);
        }
      });
      
      Object.values(CONTEXT_HEADERS).forEach(header => {
        if (!standardHeaders.includes(header)) {
          expect(header).toMatch(/^x-/);
        }
      });
      
      Object.values(DELIVERY_HEADERS).forEach(header => {
        if (!standardHeaders.includes(header)) {
          expect(header).toMatch(/^x-/);
        }
      });
    });
  });
  
  describe('Tracing Headers', () => {
    it('should define all required tracing headers', () => {
      expect(TRACE_HEADERS.TRACE_ID).toBeDefined();
      expect(TRACE_HEADERS.SPAN_ID).toBeDefined();
      expect(TRACE_HEADERS.PARENT_SPAN_ID).toBeDefined();
      expect(TRACE_HEADERS.CORRELATION_ID).toBeDefined();
    });
    
    it('should include session ID for user session tracking', () => {
      expect(TRACE_HEADERS.SESSION_ID).toBeDefined();
      expect(TRACE_HEADERS.SESSION_ID).toBe('x-session-id');
    });
  });
  
  describe('Version Headers', () => {
    it('should define schema version header for backward compatibility', () => {
      expect(VERSION_HEADERS.SCHEMA_VERSION).toBeDefined();
      expect(VERSION_HEADERS.SCHEMA_VERSION).toBe('x-schema-version');
    });
    
    it('should define content type header for payload format', () => {
      expect(VERSION_HEADERS.CONTENT_TYPE).toBeDefined();
      expect(VERSION_HEADERS.CONTENT_TYPE).toBe('content-type');
    });
    
    it('should define minimum compatible version header', () => {
      expect(VERSION_HEADERS.MIN_COMPATIBLE_VERSION).toBeDefined();
      expect(VERSION_HEADERS.MIN_COMPATIBLE_VERSION).toBe('x-min-compatible-version');
    });
    
    it('should define deprecated flag header', () => {
      expect(VERSION_HEADERS.DEPRECATED).toBeDefined();
      expect(VERSION_HEADERS.DEPRECATED).toBe('x-deprecated');
    });
  });
  
  describe('Source Headers', () => {
    it('should define service name header for event provenance', () => {
      expect(SOURCE_HEADERS.SERVICE_NAME).toBeDefined();
      expect(SOURCE_HEADERS.SERVICE_NAME).toBe('x-source-service');
    });
    
    it('should define journey type header for journey context', () => {
      expect(SOURCE_HEADERS.JOURNEY_TYPE).toBeDefined();
      expect(SOURCE_HEADERS.JOURNEY_TYPE).toBe('x-journey-type');
    });
    
    it('should define timestamp header for event creation time', () => {
      expect(SOURCE_HEADERS.TIMESTAMP).toBeDefined();
      expect(SOURCE_HEADERS.TIMESTAMP).toBe('x-created-at');
    });
    
    it('should define environment header for deployment context', () => {
      expect(SOURCE_HEADERS.ENVIRONMENT).toBeDefined();
      expect(SOURCE_HEADERS.ENVIRONMENT).toBe('x-environment');
    });
    
    it('should define service version header', () => {
      expect(SOURCE_HEADERS.SERVICE_VERSION).toBeDefined();
      expect(SOURCE_HEADERS.SERVICE_VERSION).toBe('x-service-version');
    });
  });
  
  describe('Context Headers', () => {
    it('should define user ID header for user context', () => {
      expect(CONTEXT_HEADERS.USER_ID).toBeDefined();
      expect(CONTEXT_HEADERS.USER_ID).toBe('x-user-id');
    });
    
    it('should define event type header for event routing', () => {
      expect(CONTEXT_HEADERS.EVENT_TYPE).toBeDefined();
      expect(CONTEXT_HEADERS.EVENT_TYPE).toBe('x-event-type');
    });
    
    it('should define journey context ID header', () => {
      expect(CONTEXT_HEADERS.JOURNEY_CONTEXT_ID).toBeDefined();
      expect(CONTEXT_HEADERS.JOURNEY_CONTEXT_ID).toBe('x-journey-context-id');
    });
    
    it('should define tenant ID header for multi-tenant deployments', () => {
      expect(CONTEXT_HEADERS.TENANT_ID).toBeDefined();
      expect(CONTEXT_HEADERS.TENANT_ID).toBe('x-tenant-id');
    });
    
    it('should define locale header for internationalization', () => {
      expect(CONTEXT_HEADERS.LOCALE).toBeDefined();
      expect(CONTEXT_HEADERS.LOCALE).toBe('x-locale');
    });
  });
  
  describe('Delivery Headers', () => {
    it('should define priority header for message prioritization', () => {
      expect(DELIVERY_HEADERS.PRIORITY).toBeDefined();
      expect(DELIVERY_HEADERS.PRIORITY).toBe('x-priority');
    });
    
    it('should define retry count header for tracking retry attempts', () => {
      expect(DELIVERY_HEADERS.RETRY_COUNT).toBeDefined();
      expect(DELIVERY_HEADERS.RETRY_COUNT).toBe('x-retry-count');
    });
    
    it('should define max retries header for retry limits', () => {
      expect(DELIVERY_HEADERS.MAX_RETRIES).toBeDefined();
      expect(DELIVERY_HEADERS.MAX_RETRIES).toBe('x-max-retries');
    });
    
    it('should define retry strategy header for backoff configuration', () => {
      expect(DELIVERY_HEADERS.RETRY_STRATEGY).toBeDefined();
      expect(DELIVERY_HEADERS.RETRY_STRATEGY).toBe('x-retry-strategy');
    });
    
    it('should define DLQ reason header for error tracking', () => {
      expect(DELIVERY_HEADERS.DLQ_REASON).toBeDefined();
      expect(DELIVERY_HEADERS.DLQ_REASON).toBe('x-dlq-reason');
    });
    
    it('should define process-at header for delayed processing', () => {
      expect(DELIVERY_HEADERS.PROCESS_AT).toBeDefined();
      expect(DELIVERY_HEADERS.PROCESS_AT).toBe('x-process-at');
    });
    
    it('should define TTL header for message expiration', () => {
      expect(DELIVERY_HEADERS.TTL).toBeDefined();
      expect(DELIVERY_HEADERS.TTL).toBe('x-ttl');
    });
  });
  
  describe('Combined Headers', () => {
    it('should include all trace headers in the combined HEADERS object', () => {
      Object.entries(TRACE_HEADERS).forEach(([key, value]) => {
        expect(HEADERS[key]).toBe(value);
      });
    });
    
    it('should include all version headers in the combined HEADERS object', () => {
      Object.entries(VERSION_HEADERS).forEach(([key, value]) => {
        expect(HEADERS[key]).toBe(value);
      });
    });
    
    it('should include all source headers in the combined HEADERS object', () => {
      Object.entries(SOURCE_HEADERS).forEach(([key, value]) => {
        expect(HEADERS[key]).toBe(value);
      });
    });
    
    it('should include all context headers in the combined HEADERS object', () => {
      Object.entries(CONTEXT_HEADERS).forEach(([key, value]) => {
        expect(HEADERS[key]).toBe(value);
      });
    });
    
    it('should include all delivery headers in the combined HEADERS object', () => {
      Object.entries(DELIVERY_HEADERS).forEach(([key, value]) => {
        expect(HEADERS[key]).toBe(value);
      });
    });
  });
  
  describe('Required Headers', () => {
    it('should define essential headers as required', () => {
      expect(REQUIRED_HEADERS).toContain(TRACE_HEADERS.TRACE_ID);
      expect(REQUIRED_HEADERS).toContain(SOURCE_HEADERS.SERVICE_NAME);
      expect(REQUIRED_HEADERS).toContain(SOURCE_HEADERS.TIMESTAMP);
      expect(REQUIRED_HEADERS).toContain(CONTEXT_HEADERS.EVENT_TYPE);
      expect(REQUIRED_HEADERS).toContain(VERSION_HEADERS.SCHEMA_VERSION);
    });
    
    it('should ensure all required headers exist in the main headers objects', () => {
      REQUIRED_HEADERS.forEach(header => {
        const headerExists = Object.values(HEADERS).includes(header);
        expect(headerExists).toBe(true);
      });
    });
  });
  
  describe('Propagated Headers', () => {
    it('should define headers that must be propagated to child events', () => {
      expect(PROPAGATED_HEADERS).toContain(TRACE_HEADERS.TRACE_ID);
      expect(PROPAGATED_HEADERS).toContain(TRACE_HEADERS.CORRELATION_ID);
      expect(PROPAGATED_HEADERS).toContain(CONTEXT_HEADERS.USER_ID);
      expect(PROPAGATED_HEADERS).toContain(CONTEXT_HEADERS.TENANT_ID);
      expect(PROPAGATED_HEADERS).toContain(CONTEXT_HEADERS.LOCALE);
      expect(PROPAGATED_HEADERS).toContain(SOURCE_HEADERS.ENVIRONMENT);
    });
    
    it('should ensure all propagated headers exist in the main headers objects', () => {
      PROPAGATED_HEADERS.forEach(header => {
        const headerExists = Object.values(HEADERS).includes(header);
        expect(headerExists).toBe(true);
      });
    });
  });
  
  describe('Header Key Type', () => {
    it('should correctly type all header keys', () => {
      // Create a union of all header values
      const allHeaderValues = [
        ...Object.values(TRACE_HEADERS),
        ...Object.values(VERSION_HEADERS),
        ...Object.values(SOURCE_HEADERS),
        ...Object.values(CONTEXT_HEADERS),
        ...Object.values(DELIVERY_HEADERS)
      ];
      
      // Check that each header value is assignable to HeaderKey type
      allHeaderValues.forEach(header => {
        const headerKey: HeaderKey = header as HeaderKey;
        expect(headerKey).toBe(header);
      });
    });
  });
  
  describe('Uniqueness', () => {
    it('should have unique header keys across all categories', () => {
      const allHeaderValues = [
        ...Object.values(TRACE_HEADERS),
        ...Object.values(VERSION_HEADERS),
        ...Object.values(SOURCE_HEADERS),
        ...Object.values(CONTEXT_HEADERS),
        ...Object.values(DELIVERY_HEADERS)
      ];
      
      const uniqueHeaderValues = new Set(allHeaderValues);
      expect(uniqueHeaderValues.size).toBe(allHeaderValues.length);
    });
  });
});