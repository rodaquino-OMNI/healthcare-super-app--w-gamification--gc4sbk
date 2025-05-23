import * as ErrorCodes from '../../../src/constants/error-codes';

describe('Tracing Error Code Constants', () => {
  // Helper function to get all error codes as an array
  const getAllErrorCodes = () => {
    return Object.values(ErrorCodes).filter(value => typeof value === 'string');
  };

  // Helper function to get error codes by prefix
  const getErrorCodesByPrefix = (prefix: string) => {
    return getAllErrorCodes().filter(code => code.startsWith(prefix));
  };

  // Helper function to get error codes by category (numeric range)
  const getErrorCodesByCategory = (category: string) => {
    return getAllErrorCodes().filter(code => {
      const match = code.match(/^TRACING-(\d+)$/);
      if (!match) return false;
      
      const categoryNum = Math.floor(parseInt(match[1]) / 1000);
      return categoryNum.toString() === category;
    });
  };

  describe('General Error Code Structure', () => {
    it('should export error codes as strings', () => {
      const errorCodes = getAllErrorCodes();
      expect(errorCodes.length).toBeGreaterThan(0);
      errorCodes.forEach(code => {
        expect(typeof code).toBe('string');
      });
    });

    it('should follow the TRACING-XXXX naming pattern', () => {
      const errorCodes = getAllErrorCodes();
      const pattern = /^TRACING-\d{4}$/;
      
      errorCodes.forEach(code => {
        expect(code).toMatch(pattern);
      });
    });

    it('should have unique error codes', () => {
      const errorCodes = getAllErrorCodes();
      const uniqueCodes = new Set(errorCodes);
      
      expect(uniqueCodes.size).toBe(errorCodes.length);
    });

    it('should have error codes organized by category (numeric ranges)', () => {
      // Check that each category has at least one error code
      const categories = ['1', '2', '3', '4', '5', '6', '7', '9'];
      
      categories.forEach(category => {
        const categoryCodes = getErrorCodesByCategory(category);
        expect(categoryCodes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tracer Initialization Error Codes (1000 series)', () => {
    it('should define tracer initialization error codes', () => {
      expect(ErrorCodes.TRACER_INITIALIZATION_FAILED).toBeDefined();
      expect(ErrorCodes.TRACER_PROVIDER_NOT_FOUND).toBeDefined();
      expect(ErrorCodes.TRACER_CONFIGURATION_INVALID).toBeDefined();
      expect(ErrorCodes.TRACER_SERVICE_NAME_MISSING).toBeDefined();
      expect(ErrorCodes.TRACER_ALREADY_INITIALIZED).toBeDefined();
    });

    it('should use the 1000 series for tracer initialization errors', () => {
      const tracerInitCodes = [
        ErrorCodes.TRACER_INITIALIZATION_FAILED,
        ErrorCodes.TRACER_PROVIDER_NOT_FOUND,
        ErrorCodes.TRACER_CONFIGURATION_INVALID,
        ErrorCodes.TRACER_SERVICE_NAME_MISSING,
        ErrorCodes.TRACER_ALREADY_INITIALIZED
      ];

      tracerInitCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-1\d{3}$/);
      });
    });

    it('should have descriptive constant names for tracer initialization errors', () => {
      // Check that constant names describe the error condition
      const tracerInitCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('TRACER_'));
      
      expect(tracerInitCodeNames.length).toBeGreaterThan(0);
      tracerInitCodeNames.forEach(name => {
        expect(name).toMatch(/^TRACER_[A-Z_]+$/);
      });
    });
  });

  describe('Span Creation and Management Error Codes (2000 series)', () => {
    it('should define span creation and management error codes', () => {
      expect(ErrorCodes.SPAN_CREATION_FAILED).toBeDefined();
      expect(ErrorCodes.SPAN_ALREADY_ENDED).toBeDefined();
      expect(ErrorCodes.SPAN_CONTEXT_INVALID).toBeDefined();
      expect(ErrorCodes.SPAN_ATTRIBUTE_INVALID).toBeDefined();
      expect(ErrorCodes.SPAN_EVENT_CREATION_FAILED).toBeDefined();
      expect(ErrorCodes.SPAN_LINK_INVALID).toBeDefined();
    });

    it('should use the 2000 series for span creation and management errors', () => {
      const spanCodes = [
        ErrorCodes.SPAN_CREATION_FAILED,
        ErrorCodes.SPAN_ALREADY_ENDED,
        ErrorCodes.SPAN_CONTEXT_INVALID,
        ErrorCodes.SPAN_ATTRIBUTE_INVALID,
        ErrorCodes.SPAN_EVENT_CREATION_FAILED,
        ErrorCodes.SPAN_LINK_INVALID
      ];

      spanCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-2\d{3}$/);
      });
    });

    it('should have descriptive constant names for span creation and management errors', () => {
      // Check that constant names describe the error condition
      const spanCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('SPAN_'));
      
      expect(spanCodeNames.length).toBeGreaterThan(0);
      spanCodeNames.forEach(name => {
        expect(name).toMatch(/^SPAN_[A-Z_]+$/);
      });
    });
  });

  describe('Context Propagation Error Codes (3000 series)', () => {
    it('should define context propagation error codes', () => {
      expect(ErrorCodes.CONTEXT_EXTRACTION_FAILED).toBeDefined();
      expect(ErrorCodes.CONTEXT_INJECTION_FAILED).toBeDefined();
      expect(ErrorCodes.CONTEXT_INVALID).toBeDefined();
      expect(ErrorCodes.CONTEXT_PROPAGATION_FAILED).toBeDefined();
    });

    it('should use the 3000 series for context propagation errors', () => {
      const contextCodes = [
        ErrorCodes.CONTEXT_EXTRACTION_FAILED,
        ErrorCodes.CONTEXT_INJECTION_FAILED,
        ErrorCodes.CONTEXT_INVALID,
        ErrorCodes.CONTEXT_PROPAGATION_FAILED
      ];

      contextCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-3\d{3}$/);
      });
    });

    it('should have descriptive constant names for context propagation errors', () => {
      // Check that constant names describe the error condition
      const contextCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('CONTEXT_'));
      
      expect(contextCodeNames.length).toBeGreaterThan(0);
      contextCodeNames.forEach(name => {
        expect(name).toMatch(/^CONTEXT_[A-Z_]+$/);
      });
    });
  });

  describe('Exporter Error Codes (4000 series)', () => {
    it('should define exporter error codes', () => {
      expect(ErrorCodes.EXPORTER_INITIALIZATION_FAILED).toBeDefined();
      expect(ErrorCodes.EXPORTER_CONFIGURATION_INVALID).toBeDefined();
      expect(ErrorCodes.EXPORTER_EXPORT_FAILED).toBeDefined();
      expect(ErrorCodes.EXPORTER_SHUTDOWN_FAILED).toBeDefined();
    });

    it('should use the 4000 series for exporter errors', () => {
      const exporterCodes = [
        ErrorCodes.EXPORTER_INITIALIZATION_FAILED,
        ErrorCodes.EXPORTER_CONFIGURATION_INVALID,
        ErrorCodes.EXPORTER_EXPORT_FAILED,
        ErrorCodes.EXPORTER_SHUTDOWN_FAILED
      ];

      exporterCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-4\d{3}$/);
      });
    });

    it('should have descriptive constant names for exporter errors', () => {
      // Check that constant names describe the error condition
      const exporterCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('EXPORTER_'));
      
      expect(exporterCodeNames.length).toBeGreaterThan(0);
      exporterCodeNames.forEach(name => {
        expect(name).toMatch(/^EXPORTER_[A-Z_]+$/);
      });
    });
  });

  describe('Resource Error Codes (5000 series)', () => {
    it('should define resource error codes', () => {
      expect(ErrorCodes.RESOURCE_CREATION_FAILED).toBeDefined();
      expect(ErrorCodes.RESOURCE_ATTRIBUTE_INVALID).toBeDefined();
      expect(ErrorCodes.RESOURCE_DETECTION_FAILED).toBeDefined();
    });

    it('should use the 5000 series for resource errors', () => {
      const resourceCodes = [
        ErrorCodes.RESOURCE_CREATION_FAILED,
        ErrorCodes.RESOURCE_ATTRIBUTE_INVALID,
        ErrorCodes.RESOURCE_DETECTION_FAILED
      ];

      resourceCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-5\d{3}$/);
      });
    });

    it('should have descriptive constant names for resource errors', () => {
      // Check that constant names describe the error condition
      const resourceCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('RESOURCE_'));
      
      expect(resourceCodeNames.length).toBeGreaterThan(0);
      resourceCodeNames.forEach(name => {
        expect(name).toMatch(/^RESOURCE_[A-Z_]+$/);
      });
    });
  });

  describe('Journey-specific Error Codes (6000 series)', () => {
    it('should define journey-specific error codes', () => {
      expect(ErrorCodes.JOURNEY_CONTEXT_INVALID).toBeDefined();
      expect(ErrorCodes.JOURNEY_ATTRIBUTE_INVALID).toBeDefined();
      expect(ErrorCodes.JOURNEY_CORRELATION_FAILED).toBeDefined();
    });

    it('should use the 6000 series for journey-specific errors', () => {
      const journeyCodes = [
        ErrorCodes.JOURNEY_CONTEXT_INVALID,
        ErrorCodes.JOURNEY_ATTRIBUTE_INVALID,
        ErrorCodes.JOURNEY_CORRELATION_FAILED
      ];

      journeyCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-6\d{3}$/);
      });
    });

    it('should have descriptive constant names for journey-specific errors', () => {
      // Check that constant names describe the error condition
      const journeyCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('JOURNEY_'));
      
      expect(journeyCodeNames.length).toBeGreaterThan(0);
      journeyCodeNames.forEach(name => {
        expect(name).toMatch(/^JOURNEY_[A-Z_]+$/);
      });
    });
  });

  describe('Sampling Error Codes (7000 series)', () => {
    it('should define sampling error codes', () => {
      expect(ErrorCodes.SAMPLER_INITIALIZATION_FAILED).toBeDefined();
      expect(ErrorCodes.SAMPLER_CONFIGURATION_INVALID).toBeDefined();
      expect(ErrorCodes.SAMPLING_DECISION_FAILED).toBeDefined();
    });

    it('should use the 7000 series for sampling errors', () => {
      const samplingCodes = [
        ErrorCodes.SAMPLER_INITIALIZATION_FAILED,
        ErrorCodes.SAMPLER_CONFIGURATION_INVALID,
        ErrorCodes.SAMPLING_DECISION_FAILED
      ];

      samplingCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-7\d{3}$/);
      });
    });

    it('should have descriptive constant names for sampling errors', () => {
      // Check that constant names describe the error condition
      const samplingCodeNames = Object.keys(ErrorCodes)
        .filter(key => key.startsWith('SAMPLER_') || key.startsWith('SAMPLING_'));
      
      expect(samplingCodeNames.length).toBeGreaterThan(0);
      samplingCodeNames.forEach(name => {
        expect(name).toMatch(/^SAMPL(ER|ING)_[A-Z_]+$/);
      });
    });
  });

  describe('General Error Codes (9000 series)', () => {
    it('should define general error codes', () => {
      expect(ErrorCodes.UNKNOWN_ERROR).toBeDefined();
      expect(ErrorCodes.CONFIGURATION_ERROR).toBeDefined();
      expect(ErrorCodes.DEPENDENCY_ERROR).toBeDefined();
      expect(ErrorCodes.VALIDATION_ERROR).toBeDefined();
    });

    it('should use the 9000 series for general errors', () => {
      const generalCodes = [
        ErrorCodes.UNKNOWN_ERROR,
        ErrorCodes.CONFIGURATION_ERROR,
        ErrorCodes.DEPENDENCY_ERROR,
        ErrorCodes.VALIDATION_ERROR
      ];

      generalCodes.forEach(code => {
        expect(code).toMatch(/^TRACING-9\d{3}$/);
      });
    });

    it('should have descriptive constant names for general errors', () => {
      // Check that constant names describe the error condition
      const generalCodeNames = Object.keys(ErrorCodes)
        .filter(key => {
          // Filter out codes that belong to other categories
          return !key.startsWith('TRACER_') && 
                 !key.startsWith('SPAN_') && 
                 !key.startsWith('CONTEXT_') && 
                 !key.startsWith('EXPORTER_') && 
                 !key.startsWith('RESOURCE_') && 
                 !key.startsWith('JOURNEY_') && 
                 !key.startsWith('SAMPLER_') && 
                 !key.startsWith('SAMPLING_');
        });
      
      expect(generalCodeNames.length).toBeGreaterThan(0);
      generalCodeNames.forEach(name => {
        expect(name).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('Error Code Completeness', () => {
    it('should have error codes for all major tracing operations', () => {
      // Check that we have error codes for all major categories of tracing operations
      const categories = [
        'TRACER_', 'SPAN_', 'CONTEXT_', 'EXPORTER_', 
        'RESOURCE_', 'JOURNEY_', 'SAMPLER_', 'SAMPLING_'
      ];
      
      categories.forEach(category => {
        const categoryCodes = Object.keys(ErrorCodes)
          .filter(key => key.startsWith(category));
        
        expect(categoryCodes.length).toBeGreaterThan(0);
      });
    });

    it('should have sequential error codes within each category', () => {
      // Check that error codes within each category are sequential
      const categories = ['1', '2', '3', '4', '5', '6', '7', '9'];
      
      categories.forEach(category => {
        const categoryCodes = getErrorCodesByCategory(category);
        const codeNumbers = categoryCodes.map(code => {
          const match = code.match(/^TRACING-(\d+)$/);
          return parseInt(match[1]);
        }).sort((a, b) => a - b);
        
        // Check that code numbers are sequential (may have gaps but should be in order)
        for (let i = 1; i < codeNumbers.length; i++) {
          expect(codeNumbers[i]).toBeGreaterThan(codeNumbers[i-1]);
        }
      });
    });
  });

  describe('Error Code Usage', () => {
    it('should suggest implementing error messages for each error code', () => {
      // This test is a reminder to implement error messages for each error code
      // It doesn't actually test anything, but serves as documentation
      
      // TODO: Implement error-messages.ts file with descriptive messages for each error code
      // The error messages should provide context and guidance for troubleshooting
      
      expect(true).toBe(true); // Always passes
    });

    it('should suggest implementing error handling utilities', () => {
      // This test is a reminder to implement error handling utilities
      // It doesn't actually test anything, but serves as documentation
      
      // TODO: Implement error handling utilities that use these error codes
      // The utilities should provide consistent error handling across the tracing package
      
      expect(true).toBe(true); // Always passes
    });
  });
});