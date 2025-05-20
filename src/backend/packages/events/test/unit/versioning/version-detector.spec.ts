/**
 * @file version-detector.spec.ts
 * @description Unit tests for the version detection functionality that verifies the ability to correctly
 * identify event versions from different sources. Tests various detection strategies including explicit
 * version fields, structural analysis, and header-based detection to ensure proper version identification
 * across different event formats and sources.
 */

import { VersionDetector, VersionDetectionStrategy } from '../../../src/versioning/version-detector';
import { EventVersionDto, EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { VersionDetectionError } from '../../../src/versioning/errors';

describe('VersionDetector', () => {
  let versionDetector: VersionDetector;

  beforeEach(() => {
    // Create a new VersionDetector instance before each test
    versionDetector = new VersionDetector();
  });

  describe('Explicit Version Detection Strategy', () => {
    it('should detect version from explicit version field in event payload', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        },
        metadata: {
          version: {
            major: '2',
            minor: '1',
            patch: '0'
          }
        }
      };

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('2');
      expect(detectedVersion.minor).toBe('1');
      expect(detectedVersion.patch).toBe('0');
    });

    it('should detect version from explicit __version field in event payload', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com',
          __version: '3.2.1'
        }
      };

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('3');
      expect(detectedVersion.minor).toBe('2');
      expect(detectedVersion.patch).toBe('1');
    });

    it('should detect version from explicit _v field in event payload', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        _v: '1.5.3',
        payload: {
          userId: '123',
          email: 'user@example.com'
        }
      };

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('1');
      expect(detectedVersion.minor).toBe('5');
      expect(detectedVersion.patch).toBe('3');
    });
  });

  describe('Structure-Based Version Detection Strategy', () => {
    it('should detect version based on event structure for known event types', () => {
      // Arrange
      const event = {
        type: 'HEALTH_METRIC_RECORDED',
        payload: {
          userId: '123',
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          deviceId: 'smartwatch-001'
        }
      };

      // Mock the structure-based detection to return a specific version
      const mockStructureDetection = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(EventVersionDto.fromString('2.0.0'));

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(mockStructureDetection).toHaveBeenCalledWith(event);
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('2');
      expect(detectedVersion.minor).toBe('0');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockStructureDetection.mockRestore();
    });

    it('should detect version based on presence of specific fields', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com',
          // Field only present in version 2.0.0+
          preferredLanguage: 'pt-BR'
        }
      };

      // Mock the structure-based detection to check for specific fields
      const mockStructureDetection = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromStructure'
      ).mockImplementation((event) => {
        if (event.payload && 'preferredLanguage' in event.payload) {
          return EventVersionDto.fromString('2.0.0');
        }
        return EventVersionDto.fromString('1.0.0');
      });

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(mockStructureDetection).toHaveBeenCalledWith(event);
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('2');
      expect(detectedVersion.minor).toBe('0');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockStructureDetection.mockRestore();
    });
  });

  describe('Header-Based Version Detection Strategy', () => {
    it('should detect version from event headers', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        },
        headers: {
          'x-event-version': '2.3.1'
        }
      };

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('2');
      expect(detectedVersion.minor).toBe('3');
      expect(detectedVersion.patch).toBe('1');
    });

    it('should detect version from content-type header with version parameter', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        },
        headers: {
          'content-type': 'application/json; version=1.2.3'
        }
      };

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('1');
      expect(detectedVersion.minor).toBe('2');
      expect(detectedVersion.patch).toBe('3');
    });
  });

  describe('Fallback Chain Functionality', () => {
    it('should try multiple strategies in order until one succeeds', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        }
      };

      // Mock the strategies to simulate fallback behavior
      const mockExplicitStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromExplicitField'
      ).mockReturnValue(null);

      const mockHeaderStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromHeaders'
      ).mockReturnValue(null);

      const mockStructureStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(EventVersionDto.fromString('1.0.0'));

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(mockExplicitStrategy).toHaveBeenCalledWith(event);
      expect(mockHeaderStrategy).toHaveBeenCalledWith(event);
      expect(mockStructureStrategy).toHaveBeenCalledWith(event);
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('1');
      expect(detectedVersion.minor).toBe('0');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockExplicitStrategy.mockRestore();
      mockHeaderStrategy.mockRestore();
      mockStructureStrategy.mockRestore();
    });

    it('should use default version when all strategies fail', () => {
      // Arrange
      const event = {
        type: 'UNKNOWN_EVENT',
        payload: {}
      };

      // Mock all strategies to fail
      const mockExplicitStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromExplicitField'
      ).mockReturnValue(null);

      const mockHeaderStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromHeaders'
      ).mockReturnValue(null);

      const mockStructureStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(null);

      // Act
      const detectedVersion = versionDetector.detectVersion(event);

      // Assert
      expect(mockExplicitStrategy).toHaveBeenCalledWith(event);
      expect(mockHeaderStrategy).toHaveBeenCalledWith(event);
      expect(mockStructureStrategy).toHaveBeenCalledWith(event);
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('1'); // Default version should be 1.0.0
      expect(detectedVersion.minor).toBe('0');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockExplicitStrategy.mockRestore();
      mockHeaderStrategy.mockRestore();
      mockStructureStrategy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw VersionDetectionError for malformed version strings', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com',
          __version: 'invalid-version'
        }
      };

      // Mock the explicit strategy to throw an error for invalid version
      const mockExplicitStrategy = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromExplicitField'
      ).mockImplementation(() => {
        throw new VersionDetectionError('Invalid version format: invalid-version');
      });

      // Act & Assert
      expect(() => versionDetector.detectVersion(event)).toThrow(VersionDetectionError);
      expect(() => versionDetector.detectVersion(event)).toThrow('Invalid version format');

      // Cleanup
      mockExplicitStrategy.mockRestore();
    });

    it('should handle null or undefined events gracefully', () => {
      // Act & Assert
      expect(() => versionDetector.detectVersion(null as any)).toThrow(VersionDetectionError);
      expect(() => versionDetector.detectVersion(undefined as any)).toThrow(VersionDetectionError);
    });
  });

  describe('Custom Configuration Options', () => {
    it('should respect custom strategy order when provided', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        }
      };

      // Create detector with custom strategy order
      const customOrderDetector = new VersionDetector({
        strategyOrder: [
          VersionDetectionStrategy.STRUCTURE,
          VersionDetectionStrategy.EXPLICIT,
          VersionDetectionStrategy.HEADER
        ]
      });

      // Mock the strategies to track call order
      const mockStructureStrategy = jest.spyOn(
        customOrderDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(EventVersionDto.fromString('2.0.0'));

      const mockExplicitStrategy = jest.spyOn(
        customOrderDetector as any, 
        'detectVersionFromExplicitField'
      );

      const mockHeaderStrategy = jest.spyOn(
        customOrderDetector as any, 
        'detectVersionFromHeaders'
      );

      // Act
      const detectedVersion = customOrderDetector.detectVersion(event);

      // Assert
      expect(mockStructureStrategy).toHaveBeenCalledWith(event);
      expect(mockExplicitStrategy).not.toHaveBeenCalled();
      expect(mockHeaderStrategy).not.toHaveBeenCalled();
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('2');
      expect(detectedVersion.minor).toBe('0');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockStructureStrategy.mockRestore();
      mockExplicitStrategy.mockRestore();
      mockHeaderStrategy.mockRestore();
    });

    it('should use custom default version when provided', () => {
      // Arrange
      const event = {
        type: 'UNKNOWN_EVENT',
        payload: {}
      };

      // Create detector with custom default version
      const customDefaultDetector = new VersionDetector({
        defaultVersion: '3.2.1'
      });

      // Mock all strategies to fail
      const mockExplicitStrategy = jest.spyOn(
        customDefaultDetector as any, 
        'detectVersionFromExplicitField'
      ).mockReturnValue(null);

      const mockHeaderStrategy = jest.spyOn(
        customDefaultDetector as any, 
        'detectVersionFromHeaders'
      ).mockReturnValue(null);

      const mockStructureStrategy = jest.spyOn(
        customDefaultDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(null);

      // Act
      const detectedVersion = customDefaultDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('3');
      expect(detectedVersion.minor).toBe('2');
      expect(detectedVersion.patch).toBe('1');

      // Cleanup
      mockExplicitStrategy.mockRestore();
      mockHeaderStrategy.mockRestore();
      mockStructureStrategy.mockRestore();
    });

    it('should disable specific strategies when configured', () => {
      // Arrange
      const event = {
        type: 'USER_CREATED',
        payload: {
          userId: '123',
          email: 'user@example.com'
        },
        metadata: {
          version: {
            major: '2',
            minor: '1',
            patch: '0'
          }
        }
      };

      // Create detector with disabled explicit strategy
      const customDetector = new VersionDetector({
        disabledStrategies: [VersionDetectionStrategy.EXPLICIT]
      });

      // Mock the structure strategy to return a version
      const mockStructureStrategy = jest.spyOn(
        customDetector as any, 
        'detectVersionFromStructure'
      ).mockReturnValue(EventVersionDto.fromString('1.5.0'));

      // Act
      const detectedVersion = customDetector.detectVersion(event);

      // Assert
      expect(detectedVersion).toBeDefined();
      expect(detectedVersion.major).toBe('1');
      expect(detectedVersion.minor).toBe('5');
      expect(detectedVersion.patch).toBe('0');

      // Cleanup
      mockStructureStrategy.mockRestore();
    });
  });

  describe('Integration with Event Types', () => {
    it('should detect different versions for different event types', () => {
      // Arrange
      const healthEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        payload: {
          userId: '123',
          metricType: 'HEART_RATE',
          value: 75
        }
      };

      const careEvent = {
        type: 'APPOINTMENT_BOOKED',
        payload: {
          userId: '123',
          providerId: '456',
          appointmentTime: new Date().toISOString()
        }
      };

      // Mock the structure detection to return different versions based on event type
      const mockStructureDetection = jest.spyOn(
        versionDetector as any, 
        'detectVersionFromStructure'
      ).mockImplementation((event) => {
        if (event.type === 'HEALTH_METRIC_RECORDED') {
          return EventVersionDto.fromString('2.1.0');
        } else if (event.type === 'APPOINTMENT_BOOKED') {
          return EventVersionDto.fromString('1.3.2');
        }
        return null;
      });

      // Act
      const healthVersion = versionDetector.detectVersion(healthEvent);
      const careVersion = versionDetector.detectVersion(careEvent);

      // Assert
      expect(healthVersion).toBeDefined();
      expect(healthVersion.major).toBe('2');
      expect(healthVersion.minor).toBe('1');
      expect(healthVersion.patch).toBe('0');

      expect(careVersion).toBeDefined();
      expect(careVersion.major).toBe('1');
      expect(careVersion.minor).toBe('3');
      expect(careVersion.patch).toBe('2');

      // Cleanup
      mockStructureDetection.mockRestore();
    });
  });
});