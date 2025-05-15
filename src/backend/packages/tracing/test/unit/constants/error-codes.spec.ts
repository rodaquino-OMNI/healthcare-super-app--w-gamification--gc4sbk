import {
  // Tracer initialization errors
  TRACER_INITIALIZATION_ERROR,
  TRACER_CONFIGURATION_ERROR,
  TRACER_PROVIDER_NOT_FOUND,
  TRACER_SERVICE_NAME_MISSING,
  TRACER_EXPORTER_ERROR,
  
  // Span operation errors
  SPAN_CREATION_ERROR,
  SPAN_RECORDING_ERROR,
  SPAN_ENDING_ERROR,
  SPAN_ATTRIBUTE_ERROR,
  SPAN_EVENT_ERROR,
  
  // Context propagation errors
  CONTEXT_EXTRACTION_ERROR,
  CONTEXT_INJECTION_ERROR,
  CONTEXT_INVALID_ERROR,
  CONTEXT_MISSING_ERROR,
  
  // Journey-specific errors
  JOURNEY_CONTEXT_ERROR,
  JOURNEY_ATTRIBUTE_ERROR,
  JOURNEY_CORRELATION_ERROR,
  
  // General tracing errors
  TRACING_DISABLED_ERROR,
  TRACING_SAMPLING_ERROR,
  TRACING_RESOURCE_ERROR,
  TRACING_PROPAGATOR_ERROR,
  
  // External system errors
  EXTERNAL_SYSTEM_TRACING_ERROR,
  EXTERNAL_CONTEXT_PROPAGATION_ERROR,
  
  // Performance and resource errors
  TRACING_RATE_LIMIT_EXCEEDED,
  TRACING_RESOURCE_EXHAUSTED,
  
  // OpenTelemetry status codes
  OTEL_STATUS_UNSET,
  OTEL_STATUS_OK,
  OTEL_STATUS_ERROR
} from '../../../src/constants/error-codes';

describe('Tracing Error Code Constants', () => {
  // Create a map of all error codes for uniqueness testing
  const allErrorCodes = {
    // Tracer initialization errors
    TRACER_INITIALIZATION_ERROR,
    TRACER_CONFIGURATION_ERROR,
    TRACER_PROVIDER_NOT_FOUND,
    TRACER_SERVICE_NAME_MISSING,
    TRACER_EXPORTER_ERROR,
    
    // Span operation errors
    SPAN_CREATION_ERROR,
    SPAN_RECORDING_ERROR,
    SPAN_ENDING_ERROR,
    SPAN_ATTRIBUTE_ERROR,
    SPAN_EVENT_ERROR,
    
    // Context propagation errors
    CONTEXT_EXTRACTION_ERROR,
    CONTEXT_INJECTION_ERROR,
    CONTEXT_INVALID_ERROR,
    CONTEXT_MISSING_ERROR,
    
    // Journey-specific errors
    JOURNEY_CONTEXT_ERROR,
    JOURNEY_ATTRIBUTE_ERROR,
    JOURNEY_CORRELATION_ERROR,
    
    // General tracing errors
    TRACING_DISABLED_ERROR,
    TRACING_SAMPLING_ERROR,
    TRACING_RESOURCE_ERROR,
    TRACING_PROPAGATOR_ERROR,
    
    // External system errors
    EXTERNAL_SYSTEM_TRACING_ERROR,
    EXTERNAL_CONTEXT_PROPAGATION_ERROR,
    
    // Performance and resource errors
    TRACING_RATE_LIMIT_EXCEEDED,
    TRACING_RESOURCE_EXHAUSTED,
    
    // OpenTelemetry status codes
    OTEL_STATUS_UNSET,
    OTEL_STATUS_OK,
    OTEL_STATUS_ERROR
  };

  describe('General error code requirements', () => {
    it('should have all error codes defined', () => {
      // Check that all error codes are defined
      Object.entries(allErrorCodes).forEach(([name, value]) => {
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have all error codes following the TRACING_ prefix pattern', () => {
      // All error codes should start with TRACING_
      Object.values(allErrorCodes).forEach(value => {
        expect(value.startsWith('TRACING_')).toBe(true);
      });
    });

    it('should have all error codes in uppercase for consistency', () => {
      // All error codes should be uppercase
      Object.values(allErrorCodes).forEach(value => {
        expect(value).toBe(value.toUpperCase());
      });
    });

    it('should have all error codes with descriptive names', () => {
      // Error codes should have descriptive names with at least one underscore
      Object.values(allErrorCodes).forEach(value => {
        const parts = value.split('_');
        expect(parts.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have unique error codes', () => {
      // All error codes should be unique
      const errorCodeValues = Object.values(allErrorCodes);
      const uniqueErrorCodes = new Set(errorCodeValues);
      expect(uniqueErrorCodes.size).toBe(errorCodeValues.length);
    });
  });

  describe('Tracer initialization error codes', () => {
    const tracerInitErrors = {
      TRACER_INITIALIZATION_ERROR,
      TRACER_CONFIGURATION_ERROR,
      TRACER_PROVIDER_NOT_FOUND,
      TRACER_SERVICE_NAME_MISSING,
      TRACER_EXPORTER_ERROR
    };

    it('should have all tracer initialization error codes defined', () => {
      Object.values(tracerInitErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for tracer initialization errors', () => {
      // All tracer initialization errors should contain INIT, CONFIG, PROVIDER, SERVICE, or EXPORTER
      Object.entries(tracerInitErrors).forEach(([name, value]) => {
        expect(value).toMatch(/TRACING_(INIT|CONFIG|PROVIDER|SERVICE|EXPORTER)/);
      });
    });

    it('should have descriptive error codes for tracer initialization', () => {
      expect(TRACER_INITIALIZATION_ERROR).toContain('INIT');
      expect(TRACER_CONFIGURATION_ERROR).toContain('CONFIG');
      expect(TRACER_PROVIDER_NOT_FOUND).toContain('PROVIDER');
      expect(TRACER_SERVICE_NAME_MISSING).toContain('SERVICE');
      expect(TRACER_EXPORTER_ERROR).toContain('EXPORTER');
    });
  });

  describe('Span operation error codes', () => {
    const spanErrors = {
      SPAN_CREATION_ERROR,
      SPAN_RECORDING_ERROR,
      SPAN_ENDING_ERROR,
      SPAN_ATTRIBUTE_ERROR,
      SPAN_EVENT_ERROR
    };

    it('should have all span operation error codes defined', () => {
      Object.values(spanErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for span operation errors', () => {
      // All span operation errors should contain SPAN
      Object.values(spanErrors).forEach(value => {
        expect(value).toContain('SPAN');
      });
    });

    it('should have descriptive error codes for span operations', () => {
      expect(SPAN_CREATION_ERROR).toContain('CREATION');
      expect(SPAN_RECORDING_ERROR).toContain('RECORDING');
      expect(SPAN_ENDING_ERROR).toContain('ENDING');
      expect(SPAN_ATTRIBUTE_ERROR).toContain('ATTRIBUTE');
      expect(SPAN_EVENT_ERROR).toContain('EVENT');
    });
  });

  describe('Context propagation error codes', () => {
    const contextErrors = {
      CONTEXT_EXTRACTION_ERROR,
      CONTEXT_INJECTION_ERROR,
      CONTEXT_INVALID_ERROR,
      CONTEXT_MISSING_ERROR
    };

    it('should have all context propagation error codes defined', () => {
      Object.values(contextErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for context propagation errors', () => {
      // All context propagation errors should contain CONTEXT
      Object.values(contextErrors).forEach(value => {
        expect(value).toContain('CONTEXT');
      });
    });

    it('should have descriptive error codes for context propagation', () => {
      expect(CONTEXT_EXTRACTION_ERROR).toContain('EXTRACTION');
      expect(CONTEXT_INJECTION_ERROR).toContain('INJECTION');
      expect(CONTEXT_INVALID_ERROR).toContain('INVALID');
      expect(CONTEXT_MISSING_ERROR).toContain('MISSING');
    });
  });

  describe('Journey-specific error codes', () => {
    const journeyErrors = {
      JOURNEY_CONTEXT_ERROR,
      JOURNEY_ATTRIBUTE_ERROR,
      JOURNEY_CORRELATION_ERROR
    };

    it('should have all journey-specific error codes defined', () => {
      Object.values(journeyErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for journey-specific errors', () => {
      // All journey-specific errors should contain JOURNEY
      Object.values(journeyErrors).forEach(value => {
        expect(value).toContain('JOURNEY');
      });
    });

    it('should have descriptive error codes for journey-specific operations', () => {
      expect(JOURNEY_CONTEXT_ERROR).toContain('CONTEXT');
      expect(JOURNEY_ATTRIBUTE_ERROR).toContain('ATTRIBUTE');
      expect(JOURNEY_CORRELATION_ERROR).toContain('CORRELATION');
    });
  });

  describe('General tracing error codes', () => {
    const generalErrors = {
      TRACING_DISABLED_ERROR,
      TRACING_SAMPLING_ERROR,
      TRACING_RESOURCE_ERROR,
      TRACING_PROPAGATOR_ERROR
    };

    it('should have all general tracing error codes defined', () => {
      Object.values(generalErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have descriptive error codes for general tracing operations', () => {
      expect(TRACING_DISABLED_ERROR).toContain('DISABLED');
      expect(TRACING_SAMPLING_ERROR).toContain('SAMPLING');
      expect(TRACING_RESOURCE_ERROR).toContain('RESOURCE');
      expect(TRACING_PROPAGATOR_ERROR).toContain('PROPAGATOR');
    });
  });

  describe('External system error codes', () => {
    const externalErrors = {
      EXTERNAL_SYSTEM_TRACING_ERROR,
      EXTERNAL_CONTEXT_PROPAGATION_ERROR
    };

    it('should have all external system error codes defined', () => {
      Object.values(externalErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for external system errors', () => {
      // All external system errors should contain EXTERNAL
      Object.values(externalErrors).forEach(value => {
        expect(value).toContain('EXTERNAL');
      });
    });

    it('should have descriptive error codes for external system operations', () => {
      expect(EXTERNAL_SYSTEM_TRACING_ERROR).toContain('SYSTEM');
      expect(EXTERNAL_CONTEXT_PROPAGATION_ERROR).toContain('CONTEXT');
    });
  });

  describe('Performance and resource error codes', () => {
    const performanceErrors = {
      TRACING_RATE_LIMIT_EXCEEDED,
      TRACING_RESOURCE_EXHAUSTED
    };

    it('should have all performance and resource error codes defined', () => {
      Object.values(performanceErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have descriptive error codes for performance and resource constraints', () => {
      expect(TRACING_RATE_LIMIT_EXCEEDED).toContain('RATE_LIMIT');
      expect(TRACING_RESOURCE_EXHAUSTED).toContain('RESOURCE');
    });
  });

  describe('OpenTelemetry status code error codes', () => {
    const otelStatusErrors = {
      OTEL_STATUS_UNSET,
      OTEL_STATUS_OK,
      OTEL_STATUS_ERROR
    };

    it('should have all OpenTelemetry status code error codes defined', () => {
      Object.values(otelStatusErrors).forEach(value => {
        expect(value).toBeDefined();
      });
    });

    it('should have consistent naming pattern for OpenTelemetry status codes', () => {
      // All OpenTelemetry status codes should contain STATUS
      Object.values(otelStatusErrors).forEach(value => {
        expect(value).toContain('STATUS');
      });
    });

    it('should have descriptive error codes for OpenTelemetry status codes', () => {
      expect(OTEL_STATUS_UNSET).toContain('UNSET');
      expect(OTEL_STATUS_OK).toContain('OK');
      expect(OTEL_STATUS_ERROR).toContain('ERROR');
    });
  });

  describe('Error code categorization', () => {
    it('should have error codes properly categorized by functional area', () => {
      // Tracer initialization errors
      const tracerInitErrorCodes = [
        TRACER_INITIALIZATION_ERROR,
        TRACER_CONFIGURATION_ERROR,
        TRACER_PROVIDER_NOT_FOUND,
        TRACER_SERVICE_NAME_MISSING,
        TRACER_EXPORTER_ERROR
      ];
      
      // Span operation errors
      const spanErrorCodes = [
        SPAN_CREATION_ERROR,
        SPAN_RECORDING_ERROR,
        SPAN_ENDING_ERROR,
        SPAN_ATTRIBUTE_ERROR,
        SPAN_EVENT_ERROR
      ];
      
      // Context propagation errors
      const contextErrorCodes = [
        CONTEXT_EXTRACTION_ERROR,
        CONTEXT_INJECTION_ERROR,
        CONTEXT_INVALID_ERROR,
        CONTEXT_MISSING_ERROR
      ];
      
      // Journey-specific errors
      const journeyErrorCodes = [
        JOURNEY_CONTEXT_ERROR,
        JOURNEY_ATTRIBUTE_ERROR,
        JOURNEY_CORRELATION_ERROR
      ];
      
      // Check that each category has the expected number of error codes
      expect(tracerInitErrorCodes.length).toBe(5);
      expect(spanErrorCodes.length).toBe(5);
      expect(contextErrorCodes.length).toBe(4);
      expect(journeyErrorCodes.length).toBe(3);
      
      // Check that each error code in a category follows the expected pattern
      tracerInitErrorCodes.forEach(code => {
        expect(code.includes('TRACER_') || code.includes('EXPORTER')).toBe(true);
      });
      
      spanErrorCodes.forEach(code => {
        expect(code.includes('SPAN_')).toBe(true);
      });
      
      contextErrorCodes.forEach(code => {
        expect(code.includes('CONTEXT_')).toBe(true);
      });
      
      journeyErrorCodes.forEach(code => {
        expect(code.includes('JOURNEY_')).toBe(true);
      });
    });
  });

  describe('Error code naming patterns', () => {
    it('should have error codes with clear failure indication', () => {
      // Error codes should indicate failure with terms like ERROR, FAILED, INVALID, etc.
      const errorIndicators = ['ERROR', 'FAILED', 'INVALID', 'MISSING', 'EXCEEDED', 'EXHAUSTED'];
      
      // Check that each error code (except status codes) contains at least one error indicator
      Object.entries(allErrorCodes).forEach(([name, value]) => {
        // Skip OpenTelemetry status codes which don't always indicate errors
        if (!name.startsWith('OTEL_STATUS_')) {
          const hasErrorIndicator = errorIndicators.some(indicator => value.includes(indicator));
          expect(hasErrorIndicator).toBe(true, `Error code ${value} should contain an error indicator`);
        }
      });
    });

    it('should have error codes with consistent word ordering', () => {
      // Error codes should follow the pattern: TRACING_[CATEGORY]_[DESCRIPTION]
      Object.values(allErrorCodes).forEach(value => {
        const parts = value.split('_');
        expect(parts[0]).toBe('TRACING', `Error code ${value} should start with TRACING_`);
        expect(parts.length).toBeGreaterThanOrEqual(3, `Error code ${value} should have at least 3 parts`);
      });
    });
  });

  describe('Error code completeness', () => {
    it('should have error codes for all critical tracing operations', () => {
      // Check that we have error codes for all critical areas of tracing functionality
      const criticalAreas = [
        'INIT', // Initialization
        'CONFIG', // Configuration
        'SPAN', // Span operations
        'CONTEXT', // Context propagation
        'JOURNEY', // Journey-specific operations
        'RESOURCE', // Resource management
        'EXTERNAL' // External system integration
      ];
      
      criticalAreas.forEach(area => {
        const hasErrorCodesForArea = Object.values(allErrorCodes).some(code => code.includes(area));
        expect(hasErrorCodesForArea).toBe(true, `Should have error codes for ${area} operations`);
      });
    });
  });
});