/**
 * @file version-detector.spec.ts
 * @description Unit tests for the version detection functionality
 * 
 * These tests verify the ability to correctly identify event versions from different sources
 * using various detection strategies including explicit version fields, structural analysis,
 * and header-based detection. The tests ensure proper version identification across different
 * event formats and sources, with and without explicit versioning.
 */

import { JourneyType } from '@austa/errors';
import { VersionDetector, detectEventVersion, hasVersion, ensureEventVersion } from '../../../src/versioning/version-detector';
import { VersionDetectionError } from '../../../src/versioning/errors';
import { LATEST_VERSION, VERSION_FIELD_NAMES, VERSION_HEADER_NAMES } from '../../../src/versioning/constants';

describe('VersionDetector', () => {
  describe('Explicit Field Detection', () => {
    it('should detect version from standard version field', () => {
      // Arrange
      const event = { version: '1.0.0', data: 'test' };
      const detector = new VersionDetector();
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.strategy).toBe('explicit');
      expect(result.confidence).toBe(1.0);
    });
    
    it('should detect version from custom field specified in config', () => {
      // Arrange
      const event = { schemaVersion: '2.1.0', data: 'test' };
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'explicit',
            field: 'schemaVersion',
          },
        ],
      });
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.1.0');
      expect(result.strategy).toBe('explicit');
    });
    
    it('should try all common version field names', () => {
      // Test each of the common field names
      VERSION_FIELD_NAMES.forEach(fieldName => {
        // Arrange
        const event = { [fieldName]: '1.2.3', data: 'test' };
        const detector = new VersionDetector();
        
        // Act
        const result = detector.detect(event);
        
        // Assert
        expect(result.detected).toBe(true);
        expect(result.version).toBe('1.2.3');
      });
    });
    
    it('should validate version format', () => {
      // Arrange
      const event = { version: 'invalid-format', data: 'test' };
      const detector = new VersionDetector();
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(false);
      expect(result.version).toBe(LATEST_VERSION); // Should use default version
    });
  });
  
  describe('Header-Based Detection', () => {
    it('should detect version from standard header field', () => {
      // Arrange
      const event = { 
        headers: { 'x-event-version': '1.5.0' }, 
        data: 'test' 
      };
      const detector = new VersionDetector();
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('1.5.0');
      expect(result.strategy).toBe('header');
    });
    
    it('should detect version from custom header field specified in config', () => {
      // Arrange
      const event = { 
        headers: { 'custom-version-header': '2.3.1' }, 
        data: 'test' 
      };
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'header',
            headerField: 'custom-version-header',
          },
        ],
      });
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.3.1');
      expect(result.strategy).toBe('header');
    });
    
    it('should try all common header field names', () => {
      // Test each of the common header field names
      VERSION_HEADER_NAMES.forEach(headerName => {
        // Arrange
        const event = { 
          headers: { [headerName]: '1.2.3' }, 
          data: 'test' 
        };
        const detector = new VersionDetector();
        
        // Act
        const result = detector.detect(event);
        
        // Assert
        expect(result.detected).toBe(true);
        expect(result.version).toBe('1.2.3');
      });
    });
    
    it('should detect version from metadata.headers', () => {
      // Arrange
      const event = { 
        metadata: {
          headers: { 'x-event-version': '1.6.0' }
        }, 
        data: 'test' 
      };
      const detector = new VersionDetector();
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('1.6.0');
      expect(result.strategy).toBe('header');
    });
    
    it('should detect version from meta.headers', () => {
      // Arrange
      const event = { 
        meta: {
          headers: { 'x-event-version': '1.7.0' }
        }, 
        data: 'test' 
      };
      const detector = new VersionDetector();
      
      // Act
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('1.7.0');
      expect(result.strategy).toBe('header');
    });
  });
  
  describe('Structure-Based Detection', () => {
    it('should detect version based on event structure', () => {
      // Arrange
      // Define structure matchers for different versions
      const versionMap = {
        '1.0.0': (event: any) => event.data && !event.extendedData,
        '2.0.0': (event: any) => event.data && event.extendedData,
      };
      
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'structure',
            versionMap,
          },
        ],
      });
      
      // Act & Assert - v1.0.0 structure
      const eventV1 = { data: 'test' };
      const resultV1 = detector.detect(eventV1);
      expect(resultV1.detected).toBe(true);
      expect(resultV1.version).toBe('1.0.0');
      expect(resultV1.strategy).toBe('structure');
      
      // Act & Assert - v2.0.0 structure
      const eventV2 = { data: 'test', extendedData: { extra: 'info' } };
      const resultV2 = detector.detect(eventV2);
      expect(resultV2.detected).toBe(true);
      expect(resultV2.version).toBe('2.0.0');
      expect(resultV2.strategy).toBe('structure');
    });
    
    it('should handle complex structure matching logic', () => {
      // Arrange
      // More complex structure matching based on field presence and values
      const versionMap = {
        '1.0.0': (event: any) => 
          event.type === 'legacy' && Array.isArray(event.items),
        '2.0.0': (event: any) => 
          event.type === 'standard' && typeof event.config === 'object',
        '3.0.0': (event: any) => 
          event.type === 'enhanced' && typeof event.metadata === 'object' && event.metadata.version === 3,
      };
      
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'structure',
            versionMap,
          },
        ],
      });
      
      // Act & Assert - v1.0.0 structure
      const eventV1 = { type: 'legacy', items: [] };
      const resultV1 = detector.detect(eventV1);
      expect(resultV1.detected).toBe(true);
      expect(resultV1.version).toBe('1.0.0');
      
      // Act & Assert - v2.0.0 structure
      const eventV2 = { type: 'standard', config: {} };
      const resultV2 = detector.detect(eventV2);
      expect(resultV2.detected).toBe(true);
      expect(resultV2.version).toBe('2.0.0');
      
      // Act & Assert - v3.0.0 structure
      const eventV3 = { type: 'enhanced', metadata: { version: 3 } };
      const resultV3 = detector.detect(eventV3);
      expect(resultV3.detected).toBe(true);
      expect(resultV3.version).toBe('3.0.0');
    });
  });
  
  describe('Custom Detection', () => {
    it('should use custom detector function', () => {
      // Arrange
      const customDetector = (event: any): string | null => {
        // Custom logic to extract version
        if (event.customField && event.customField.includes('v')) {
          return event.customField.replace('v', '');
        }
        return null;
      };
      
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'custom',
            detector: customDetector,
          },
        ],
      });
      
      // Act
      const event = { customField: 'v2.3.4', data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.3.4');
      expect(result.strategy).toBe('custom');
    });
    
    it('should handle errors in custom detector gracefully', () => {
      // Arrange
      const errorThrowingDetector = (event: any): string | null => {
        throw new Error('Custom detector error');
      };
      
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'custom',
            detector: errorThrowingDetector,
          },
        ],
        defaultVersion: '1.0.0',
        throwOnUndetected: false,
      });
      
      // Act
      const event = { data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(false);
      expect(result.version).toBe('1.0.0'); // Should use default version
    });
    
    it('should validate version format from custom detector', () => {
      // Arrange
      const invalidFormatDetector = (event: any): string | null => {
        return 'invalid-format';
      };
      
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'custom',
            detector: invalidFormatDetector,
          },
        ],
        defaultVersion: '1.0.0',
        throwOnUndetected: false,
      });
      
      // Act
      const event = { data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(false);
      expect(result.version).toBe('1.0.0'); // Should use default version
    });
  });
  
  describe('Fallback Chain', () => {
    it('should try strategies in order until one succeeds', () => {
      // Arrange
      const detector = new VersionDetector({
        strategies: [
          // This strategy will fail
          {
            type: 'explicit',
            field: 'nonExistentField',
          },
          // This strategy will succeed
          {
            type: 'header',
            headerField: 'x-event-version',
          },
          // This strategy won't be reached
          {
            type: 'structure',
            versionMap: {
              '3.0.0': (event: any) => true, // Always matches
            },
          },
        ],
      });
      
      // Act
      const event = { 
        headers: { 'x-event-version': '2.0.0' }, 
        data: 'test' 
      };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.0.0');
      expect(result.strategy).toBe('header');
    });
    
    it('should use default version when all strategies fail and throwOnUndetected is false', () => {
      // Arrange
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'explicit',
            field: 'nonExistentField',
          },
          {
            type: 'header',
            headerField: 'nonExistentHeader',
          },
        ],
        defaultVersion: '1.5.0',
        throwOnUndetected: false,
      });
      
      // Act
      const event = { data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(false);
      expect(result.version).toBe('1.5.0');
      expect(result.confidence).toBe(0.5); // Lower confidence for default version
    });
    
    it('should throw error when all strategies fail and throwOnUndetected is true', () => {
      // Arrange
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'explicit',
            field: 'nonExistentField',
          },
        ],
        throwOnUndetected: true,
      });
      
      // Act & Assert
      const event = { data: 'test', eventId: 'test-123' };
      expect(() => detector.detect(event)).toThrow(VersionDetectionError);
    });
  });
  
  describe('Factory Methods', () => {
    it('should create default detector', () => {
      // Act
      const detector = VersionDetector.createDefault();
      const event = { version: '1.0.0', data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('1.0.0');
    });
    
    it('should create explicit field detector', () => {
      // Act
      const detector = VersionDetector.createExplicitFieldDetector('customField');
      const event = { customField: '2.0.0', data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.0.0');
    });
    
    it('should create header detector', () => {
      // Act
      const detector = VersionDetector.createHeaderDetector('custom-header');
      const event = { headers: { 'custom-header': '2.0.0' }, data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('2.0.0');
    });
    
    it('should create custom detector', () => {
      // Act
      const detector = VersionDetector.createCustomDetector((event: any) => {
        return event.data === 'test' ? '3.0.0' : null;
      });
      const event = { data: 'test' };
      const result = detector.detect(event);
      
      // Assert
      expect(result.detected).toBe(true);
      expect(result.version).toBe('3.0.0');
    });
    
    it('should create comprehensive detector', () => {
      // Act
      const detector = VersionDetector.createComprehensiveDetector({
        '1.0.0': (event: any) => event.data === 'v1',
        '2.0.0': (event: any) => event.data === 'v2',
      });
      
      // Test explicit field detection
      const event1 = { version: '3.0.0', data: 'test' };
      const result1 = detector.detect(event1);
      expect(result1.detected).toBe(true);
      expect(result1.version).toBe('3.0.0');
      
      // Test structure-based detection
      const event2 = { data: 'v2' };
      const result2 = detector.detect(event2);
      expect(result2.detected).toBe(true);
      expect(result2.version).toBe('2.0.0');
    });
  });
  
  describe('Helper Functions', () => {
    it('should detect event version with helper function', () => {
      // Act & Assert
      const event = { version: '1.0.0', data: 'test' };
      expect(detectEventVersion(event)).toBe('1.0.0');
    });
    
    it('should throw error when version cannot be detected with helper function', () => {
      // Act & Assert
      const event = { data: 'test' };
      expect(() => detectEventVersion(event)).toThrow(VersionDetectionError);
    });
    
    it('should check if event has specific version', () => {
      // Act & Assert
      const event = { version: '1.0.0', data: 'test' };
      expect(hasVersion(event, '1.0.0')).toBe(true);
      expect(hasVersion(event, '2.0.0')).toBe(false);
    });
    
    it('should ensure event has version field', () => {
      // Act & Assert - Event with version
      const event1 = { version: '1.0.0', data: 'test' };
      const result1 = ensureEventVersion(event1);
      expect(result1.version).toBe('1.0.0');
      
      // Act & Assert - Event without version
      const event2 = { data: 'test' };
      const result2 = ensureEventVersion(event2);
      expect(result2.version).toBe(LATEST_VERSION);
      
      // Act & Assert - Event without version, custom default
      const event3 = { data: 'test' };
      const result3 = ensureEventVersion(event3, '2.0.0');
      expect(result3.version).toBe('2.0.0');
    });
    
    it('should throw error when trying to ensure version on null/undefined', () => {
      // Act & Assert
      expect(() => ensureEventVersion(null as any)).toThrow();
      expect(() => ensureEventVersion(undefined as any)).toThrow();
    });
  });
  
  describe('Error Handling', () => {
    it('should include journey type in error context', () => {
      // Arrange
      const detector = new VersionDetector({
        strategies: [
          {
            type: 'explicit',
            field: 'nonExistentField',
          },
        ],
        throwOnUndetected: true,
      });
      
      // Act & Assert
      const event = { data: 'test' };
      try {
        detector.detect(event, JourneyType.HEALTH);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(VersionDetectionError);
        expect((error as VersionDetectionError).context.journey).toBe(JourneyType.HEALTH);
      }
    });
    
    it('should extract event ID for error reporting', () => {
      // Arrange
      const detector = new VersionDetector({
        strategies: [],
        throwOnUndetected: true,
      });
      
      // Act & Assert - with eventId
      const event1 = { eventId: 'test-123', data: 'test' };
      try {
        detector.detect(event1);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(VersionDetectionError);
        expect(error.message).toContain('test-123');
      }
      
      // Act & Assert - with id
      const event2 = { id: 'test-456', data: 'test' };
      try {
        detector.detect(event2);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(VersionDetectionError);
        expect(error.message).toContain('test-456');
      }
      
      // Act & Assert - with uuid
      const event3 = { uuid: 'test-789', data: 'test' };
      try {
        detector.detect(event3);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(VersionDetectionError);
        expect(error.message).toContain('test-789');
      }
    });
  });
});