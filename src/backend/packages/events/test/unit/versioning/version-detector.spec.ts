/**
 * @file version-detector.spec.ts
 * @description Unit tests for the version detection functionality that verifies the ability to correctly
 * identify event versions from different sources. Tests various detection strategies including explicit
 * version field, structural analysis, and header-based detection.
 */

import { jest } from '@jest/globals';
import {
  detectVersion,
  detectExplicitVersion,
  detectHeaderVersion,
  detectStructureVersion,
  getDefaultStrategies,
  createStructureCheck,
  createDetectionConfig,
} from '../../../src/versioning/version-detector';
import { VERSION_CONSTANTS, DEFAULT_VERSION_CONFIG } from '../../../src/versioning/constants';
import { VersionDetectionError } from '../../../src/versioning/errors';
import { VersionDetectionStrategy } from '../../../src/versioning/types';
import { KafkaEvent } from '../../../src/interfaces/kafka-event.interface';

describe('Version Detector', () => {
  describe('detectVersion', () => {
    it('should detect version using explicit strategy', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-1',
        type: 'test.event',
        version: '1.0.0',
        payload: { data: 'test' },
      };

      // Act
      const result = detectVersion(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.strategy).toBe('explicit');
    });

    it('should detect version using header strategy', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-2',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          [VERSION_CONSTANTS.VERSION_HEADER]: '1.2.0',
        },
      };

      // Act
      const result = detectVersion(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.2.0');
      expect(result.strategy).toBe('header');
    });

    it('should detect version using structure strategy', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-3',
        type: 'test.event',
        payload: { data: 'test', schemaVersion: 2 },
      };

      const structureCheck = (payload: unknown) => {
        const p = payload as any;
        return p?.payload?.schemaVersion === 2;
      };

      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'structure',
          versionMap: { '0': '2.0.0' },
          structureChecks: [structureCheck],
        },
      ];

      // Act
      const result = detectVersion(payload, { strategies });

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('2.0.0');
      expect(result.strategy).toBe('structure');
    });

    it('should use fallback strategy when all others fail', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-4',
        type: 'test.event',
        payload: { data: 'test' },
      };

      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'nonExistentField',
        },
        {
          type: 'fallback',
          defaultVersion: '3.0.0',
        },
      ];

      // Act
      const result = detectVersion(payload, { strategies });

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('3.0.0');
      expect(result.strategy).toBe('fallback');
    });

    it('should return failure when no strategy succeeds and throwOnFailure is false', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-5',
        type: 'test.event',
        payload: { data: 'test' },
      };

      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'nonExistentField',
        },
      ];

      // Act
      const result = detectVersion(payload, { strategies, throwOnFailure: false });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
    });

    it('should throw error when no strategy succeeds and throwOnFailure is true', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-6',
        type: 'test.event',
        payload: { data: 'test' },
      };

      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'nonExistentField',
        },
      ];

      // Act & Assert
      expect(() => {
        detectVersion(payload, { strategies, throwOnFailure: true });
      }).toThrow(VersionDetectionError);
    });

    it('should use default version when provided and no strategy succeeds', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-7',
        type: 'test.event',
        payload: { data: 'test' },
      };

      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'nonExistentField',
        },
        {
          type: 'fallback',
          defaultVersion: '4.0.0',
        },
      ];

      // Act
      const result = detectVersion(payload, { strategies, defaultVersion: '5.0.0' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('4.0.0'); // Should use the fallback strategy's version
      expect(result.strategy).toBe('fallback');
    });
  });

  describe('detectExplicitVersion', () => {
    it('should detect version from explicit field', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-8',
        type: 'test.event',
        version: '1.0.0',
        payload: { data: 'test' },
      };

      // Act
      const result = detectExplicitVersion(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.strategy).toBe('explicit');
    });

    it('should detect version from nested field using dot notation', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-9',
        type: 'test.event',
        metadata: {
          version: '1.5.0',
        },
        payload: { data: 'test' },
      };

      // Act
      const result = detectExplicitVersion(payload, 'metadata.version');

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.5.0');
      expect(result.strategy).toBe('explicit');
    });

    it('should return failure when field is missing', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-10',
        type: 'test.event',
        payload: { data: 'test' },
      };

      // Act
      const result = detectExplicitVersion(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('is missing');
    });

    it('should return failure when version format is invalid', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-11',
        type: 'test.event',
        version: 'invalid-version',
        payload: { data: 'test' },
      };

      // Act
      const result = detectExplicitVersion(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('Invalid version format');
    });

    it('should return failure when payload is not an object', () => {
      // Arrange
      const payload = 'not-an-object';

      // Act
      const result = detectExplicitVersion(payload as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('not an object');
    });
  });

  describe('detectHeaderVersion', () => {
    it('should detect version from Kafka message headers', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-12',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          [VERSION_CONSTANTS.VERSION_HEADER]: '2.1.0',
        },
      };

      // Act
      const result = detectHeaderVersion(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('2.1.0');
      expect(result.strategy).toBe('header');
    });

    it('should handle Buffer header values', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-13',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          [VERSION_CONSTANTS.VERSION_HEADER]: Buffer.from('2.2.0', 'utf8'),
        },
      };

      // Act
      const result = detectHeaderVersion(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('2.2.0');
      expect(result.strategy).toBe('header');
    });

    it('should return failure when headers are missing', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-14',
        type: 'test.event',
        payload: { data: 'test' },
      };

      // Act
      const result = detectHeaderVersion(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('no headers');
    });

    it('should return failure when version header is missing', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-15',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          'other-header': '1.0.0',
        },
      };

      // Act
      const result = detectHeaderVersion(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('is missing');
    });

    it('should return failure when version format is invalid', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-16',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          [VERSION_CONSTANTS.VERSION_HEADER]: 'invalid-version',
        },
      };

      // Act
      const result = detectHeaderVersion(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('Invalid version format');
    });

    it('should use custom header name when provided', () => {
      // Arrange
      const payload: Partial<KafkaEvent> = {
        eventId: 'test-event-17',
        type: 'test.event',
        payload: { data: 'test' },
        headers: {
          'custom-version-header': '2.3.0',
        },
      };

      // Act
      const result = detectHeaderVersion(payload, 'custom-version-header');

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('2.3.0');
      expect(result.strategy).toBe('header');
    });
  });

  describe('detectStructureVersion', () => {
    it('should detect version based on structure checks', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-18',
        type: 'test.event',
        payload: { data: 'test', format: 'v1' },
      };

      const structureChecks = [
        (p: unknown) => (p as any)?.payload?.format === 'v2', // First check fails
        (p: unknown) => (p as any)?.payload?.format === 'v1', // Second check passes
      ];

      const versionMap = {
        '0': '3.0.0', // For first check
        '1': '3.1.0', // For second check
      };

      // Act
      const result = detectStructureVersion(payload, versionMap, structureChecks);

      // Assert
      expect(result.success).toBe(true);
      expect(result.version).toBe('3.1.0');
      expect(result.strategy).toBe('structure');
    });

    it('should return failure when no structure check passes', () => {
      // Arrange
      const payload = {
        eventId: 'test-event-19',
        type: 'test.event',
        payload: { data: 'test', format: 'v3' },
      };

      const structureChecks = [
        (p: unknown) => (p as any)?.payload?.format === 'v1',
        (p: unknown) => (p as any)?.payload?.format === 'v2',
      ];

      const versionMap = {
        '0': '3.0.0',
        '1': '3.1.0',
      };

      // Act
      const result = detectStructureVersion(payload, versionMap, structureChecks);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('No matching structure');
    });

    it('should return failure when payload is not an object', () => {
      // Arrange
      const payload = 'not-an-object';
      const structureChecks = [(p: unknown) => true]; // Always passes
      const versionMap = { '0': '3.0.0' };

      // Act
      const result = detectStructureVersion(payload as any, versionMap, structureChecks);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(VersionDetectionError);
      expect(result.error?.message).toContain('not an object');
    });
  });

  describe('getDefaultStrategies', () => {
    it('should return strategies based on default configuration', () => {
      // Act
      const strategies = getDefaultStrategies();

      // Assert
      expect(strategies).toHaveLength(DEFAULT_VERSION_CONFIG.DEFAULT_DETECTION_STRATEGIES.length);
      expect(strategies[0].type).toBe('explicit');
      expect(strategies[1].type).toBe('header');
      expect(strategies[2].type).toBe('structure');
      expect(strategies[3].type).toBe('fallback');
    });
  });

  describe('createStructureCheck', () => {
    it('should create a function that checks for required fields', () => {
      // Arrange
      const requiredFields = ['type', 'payload.data'];
      const check = createStructureCheck(requiredFields);

      const validPayload = {
        type: 'test.event',
        payload: { data: 'test' },
      };

      const invalidPayload = {
        type: 'test.event',
        payload: {},
      };

      // Act & Assert
      expect(check(validPayload)).toBe(true);
      expect(check(invalidPayload)).toBe(false);
    });

    it('should create a function that checks for excluded fields', () => {
      // Arrange
      const requiredFields = ['type'];
      const excludedFields = ['version', 'payload.schemaVersion'];
      const check = createStructureCheck(requiredFields, excludedFields);

      const validPayload = {
        type: 'test.event',
        payload: { data: 'test' },
      };

      const invalidPayload1 = {
        type: 'test.event',
        version: '1.0.0',
        payload: { data: 'test' },
      };

      const invalidPayload2 = {
        type: 'test.event',
        payload: { data: 'test', schemaVersion: 1 },
      };

      // Act & Assert
      expect(check(validPayload)).toBe(true);
      expect(check(invalidPayload1)).toBe(false);
      expect(check(invalidPayload2)).toBe(false);
    });

    it('should return false for non-object payloads', () => {
      // Arrange
      const check = createStructureCheck(['field']);

      // Act & Assert
      expect(check(null)).toBe(false);
      expect(check(undefined)).toBe(false);
      expect(check('string')).toBe(false);
      expect(check(123)).toBe(false);
    });
  });

  describe('createDetectionConfig', () => {
    it('should create a configuration with custom strategies', () => {
      // Arrange
      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'custom.version.field',
        },
      ];

      // Act
      const config = createDetectionConfig(strategies);

      // Assert
      expect(config.strategies).toBe(strategies);
      expect(config.throwOnFailure).toBe(DEFAULT_VERSION_CONFIG.THROW_ON_VERSION_DETECTION_FAILURE);
      expect(config.defaultVersion).toBe(VERSION_CONSTANTS.DEFAULT_VERSION);
    });

    it('should override default options with provided options', () => {
      // Arrange
      const strategies: VersionDetectionStrategy[] = [
        {
          type: 'explicit',
          field: 'custom.version.field',
        },
      ];

      const options = {
        throwOnFailure: false,
        defaultVersion: '5.0.0',
      };

      // Act
      const config = createDetectionConfig(strategies, options);

      // Assert
      expect(config.strategies).toBe(strategies);
      expect(config.throwOnFailure).toBe(false);
      expect(config.defaultVersion).toBe('5.0.0');
    });
  });
});