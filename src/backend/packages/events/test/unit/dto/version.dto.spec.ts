/**
 * @file version.dto.spec.ts
 * @description Unit tests for the VersionDto class that validate event schema versioning support.
 * Tests verify semantic versioning format validation, compatibility layer functionality, and version
 * migration utilities. These tests ensure proper schema evolution with backward compatibility,
 * allowing the system to handle older event versions while supporting new fields and validation rules.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  EventVersionDto,
  VersionedEventDto,
  IsValidSemVerConstraint,
  createVersionedEvent,
  extractPayload,
  extractVersion,
  extractType,
  extractMetadata,
} from '../../../src/dto/version.dto';

import {
  EventVersion,
  VersionCompatibility,
  parseVersion,
  versionToString,
  compareVersions,
} from '../../../src/interfaces/event-versioning.interface';

describe('EventVersionDto', () => {
  describe('constructor', () => {
    it('should create a version with default values (1.0.0)', () => {
      const version = new EventVersionDto();
      expect(version.major).toBe(1);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });

    it('should create a version with custom values', () => {
      const version = new EventVersionDto(2, 3, 4);
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(4);
    });
  });

  describe('toString', () => {
    it('should convert version to string in format "major.minor.patch"', () => {
      const version = new EventVersionDto(2, 3, 4);
      expect(version.toString()).toBe('2.3.4');
    });

    it('should handle single-digit versions correctly', () => {
      const version = new EventVersionDto(1, 0, 0);
      expect(version.toString()).toBe('1.0.0');
    });
  });

  describe('fromString', () => {
    it('should create a version from a valid version string', () => {
      const version = EventVersionDto.fromString('2.3.4');
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(4);
    });

    it('should throw an error for invalid version strings', () => {
      expect(() => EventVersionDto.fromString('invalid')).toThrow();
      expect(() => EventVersionDto.fromString('1.2')).toThrow();
      expect(() => EventVersionDto.fromString('1.2.3.4')).toThrow();
      expect(() => EventVersionDto.fromString('-1.2.3')).toThrow();
    });
  });

  describe('compareWith', () => {
    it('should return COMPATIBLE for identical versions', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 3);
      expect(v1.compareWith(v2)).toBe(VersionCompatibility.COMPATIBLE);
    });

    it('should return COMPATIBLE for versions with same major and minor but different patch', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 4);
      expect(v1.compareWith(v2)).toBe(VersionCompatibility.COMPATIBLE);
    });

    it('should return BACKWARD_COMPATIBLE when source has lower minor version', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 3, 0);
      expect(v1.compareWith(v2)).toBe(VersionCompatibility.BACKWARD_COMPATIBLE);
    });

    it('should return FORWARD_COMPATIBLE when source has higher minor version', () => {
      const v1 = new EventVersionDto(1, 3, 0);
      const v2 = new EventVersionDto(1, 2, 0);
      expect(v1.compareWith(v2)).toBe(VersionCompatibility.FORWARD_COMPATIBLE);
    });

    it('should return INCOMPATIBLE when major versions differ', () => {
      const v1 = new EventVersionDto(1, 0, 0);
      const v2 = new EventVersionDto(2, 0, 0);
      expect(v1.compareWith(v2)).toBe(VersionCompatibility.INCOMPATIBLE);
      expect(v2.compareWith(v1)).toBe(VersionCompatibility.INCOMPATIBLE);
    });
  });

  describe('isCompatibleWith', () => {
    it('should return true for identical versions', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 3);
      expect(v1.isCompatibleWith(v2)).toBe(true);
    });

    it('should return true for versions with same major and minor but different patch', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 4);
      expect(v1.isCompatibleWith(v2)).toBe(true);
    });

    it('should return true when source has lower minor version (backward compatible)', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 3, 0);
      expect(v1.isCompatibleWith(v2)).toBe(true);
    });

    it('should return false when source has higher minor version (forward compatible)', () => {
      const v1 = new EventVersionDto(1, 3, 0);
      const v2 = new EventVersionDto(1, 2, 0);
      expect(v1.isCompatibleWith(v2)).toBe(false);
    });

    it('should return false when major versions differ (incompatible)', () => {
      const v1 = new EventVersionDto(1, 0, 0);
      const v2 = new EventVersionDto(2, 0, 0);
      expect(v1.isCompatibleWith(v2)).toBe(false);
      expect(v2.isCompatibleWith(v1)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when major version is greater', () => {
      const v1 = new EventVersionDto(2, 0, 0);
      const v2 = new EventVersionDto(1, 9, 9);
      expect(v1.isGreaterThan(v2)).toBe(true);
    });

    it('should return false when major version is less', () => {
      const v1 = new EventVersionDto(1, 9, 9);
      const v2 = new EventVersionDto(2, 0, 0);
      expect(v1.isGreaterThan(v2)).toBe(false);
    });

    it('should return true when major versions are equal but minor version is greater', () => {
      const v1 = new EventVersionDto(1, 2, 0);
      const v2 = new EventVersionDto(1, 1, 9);
      expect(v1.isGreaterThan(v2)).toBe(true);
    });

    it('should return false when major versions are equal but minor version is less', () => {
      const v1 = new EventVersionDto(1, 1, 9);
      const v2 = new EventVersionDto(1, 2, 0);
      expect(v1.isGreaterThan(v2)).toBe(false);
    });

    it('should return true when major and minor versions are equal but patch version is greater', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 2);
      expect(v1.isGreaterThan(v2)).toBe(true);
    });

    it('should return false when major and minor versions are equal but patch version is less', () => {
      const v1 = new EventVersionDto(1, 2, 2);
      const v2 = new EventVersionDto(1, 2, 3);
      expect(v1.isGreaterThan(v2)).toBe(false);
    });

    it('should return false when versions are identical', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 3);
      expect(v1.isGreaterThan(v2)).toBe(false);
    });
  });

  describe('isEqual', () => {
    it('should return true when versions are identical', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 3);
      expect(v1.isEqual(v2)).toBe(true);
    });

    it('should return false when major versions differ', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(2, 2, 3);
      expect(v1.isEqual(v2)).toBe(false);
    });

    it('should return false when minor versions differ', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 3, 3);
      expect(v1.isEqual(v2)).toBe(false);
    });

    it('should return false when patch versions differ', () => {
      const v1 = new EventVersionDto(1, 2, 3);
      const v2 = new EventVersionDto(1, 2, 4);
      expect(v1.isEqual(v2)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate a valid version', async () => {
      const version = new EventVersionDto(1, 2, 3);
      const errors = await validate(version);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for negative major version', async () => {
      const version = new EventVersionDto(-1, 2, 3);
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('major');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for negative minor version', async () => {
      const version = new EventVersionDto(1, -2, 3);
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('minor');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for negative patch version', async () => {
      const version = new EventVersionDto(1, 2, -3);
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('patch');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for non-integer major version', async () => {
      const version = new EventVersionDto(1.5, 2, 3);
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('major');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });
  });
});

describe('IsValidSemVerConstraint', () => {
  const validator = new IsValidSemVerConstraint();

  it('should validate a valid version object', () => {
    expect(validator.validate({ major: 1, minor: 2, patch: 3 })).toBe(true);
  });

  it('should reject null or undefined', () => {
    expect(validator.validate(null)).toBe(false);
    expect(validator.validate(undefined)).toBe(false);
  });

  it('should reject non-object values', () => {
    expect(validator.validate('1.2.3')).toBe(false);
    expect(validator.validate(123)).toBe(false);
  });

  it('should reject objects with missing properties', () => {
    expect(validator.validate({ major: 1, minor: 2 })).toBe(false);
    expect(validator.validate({ major: 1, patch: 3 })).toBe(false);
    expect(validator.validate({ minor: 2, patch: 3 })).toBe(false);
  });

  it('should reject objects with non-numeric properties', () => {
    expect(validator.validate({ major: '1', minor: 2, patch: 3 })).toBe(false);
    expect(validator.validate({ major: 1, minor: '2', patch: 3 })).toBe(false);
    expect(validator.validate({ major: 1, minor: 2, patch: '3' })).toBe(false);
  });

  it('should reject objects with negative values', () => {
    expect(validator.validate({ major: -1, minor: 2, patch: 3 })).toBe(false);
    expect(validator.validate({ major: 1, minor: -2, patch: 3 })).toBe(false);
    expect(validator.validate({ major: 1, minor: 2, patch: -3 })).toBe(false);
  });

  it('should provide a default error message', () => {
    expect(validator.defaultMessage()).toContain('semantic versioning');
  });
});

describe('VersionedEventDto', () => {
  const testType = 'TEST_EVENT';
  const testPayload = { data: 'test data' };
  const testVersion = new EventVersionDto(2, 1, 0);
  const testMetadata = { source: 'test', correlationId: '123' };

  describe('constructor', () => {
    it('should create a versioned event with all properties', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );

      expect(event.type).toBe(testType);
      expect(event.payload).toBe(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(testVersion.major);
      expect(event.version.minor).toBe(testVersion.minor);
      expect(event.version.patch).toBe(testVersion.patch);
      expect(event.metadata).toBe(testMetadata);
    });

    it('should create a versioned event with default version (1.0.0)', () => {
      const event = new VersionedEventDto(testType, testPayload);

      expect(event.type).toBe(testType);
      expect(event.payload).toBe(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(1);
      expect(event.version.minor).toBe(0);
      expect(event.version.patch).toBe(0);
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('withPayload', () => {
    it('should create a new event with updated payload', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );
      const newPayload = { data: 'new data' };
      const newEvent = event.withPayload(newPayload);

      // New event should have updated payload
      expect(newEvent).not.toBe(event); // Should be a new instance
      expect(newEvent.payload).toBe(newPayload);
      
      // Other properties should remain the same
      expect(newEvent.type).toBe(testType);
      expect(newEvent.version.major).toBe(testVersion.major);
      expect(newEvent.version.minor).toBe(testVersion.minor);
      expect(newEvent.version.patch).toBe(testVersion.patch);
      expect(newEvent.metadata).toBe(testMetadata);
    });

    it('should create a new event with updated payload and version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );
      const newPayload = { data: 'new data' };
      const newVersion = new EventVersionDto(2, 2, 0);
      const newEvent = event.withPayload(newPayload, newVersion);

      // New event should have updated payload and version
      expect(newEvent).not.toBe(event); // Should be a new instance
      expect(newEvent.payload).toBe(newPayload);
      expect(newEvent.version.major).toBe(newVersion.major);
      expect(newEvent.version.minor).toBe(newVersion.minor);
      expect(newEvent.version.patch).toBe(newVersion.patch);
      
      // Other properties should remain the same
      expect(newEvent.type).toBe(testType);
      expect(newEvent.metadata).toBe(testMetadata);
    });
  });

  describe('withVersion', () => {
    it('should create a new event with updated version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );
      const newVersion = new EventVersionDto(3, 0, 0);
      const newEvent = event.withVersion(newVersion);

      // New event should have updated version
      expect(newEvent).not.toBe(event); // Should be a new instance
      expect(newEvent.version.major).toBe(newVersion.major);
      expect(newEvent.version.minor).toBe(newVersion.minor);
      expect(newEvent.version.patch).toBe(newVersion.patch);
      
      // Other properties should remain the same
      expect(newEvent.type).toBe(testType);
      expect(newEvent.payload).toBe(testPayload);
      expect(newEvent.metadata).toBe(testMetadata);
    });
  });

  describe('withMetadata', () => {
    it('should create a new event with updated metadata', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );
      const newMetadata = { source: 'new source', correlationId: '456' };
      const newEvent = event.withMetadata(newMetadata);

      // New event should have updated metadata
      expect(newEvent).not.toBe(event); // Should be a new instance
      expect(newEvent.metadata).toEqual(newMetadata);
      
      // Other properties should remain the same
      expect(newEvent.type).toBe(testType);
      expect(newEvent.payload).toBe(testPayload);
      expect(newEvent.version.major).toBe(testVersion.major);
      expect(newEvent.version.minor).toBe(testVersion.minor);
      expect(newEvent.version.patch).toBe(testVersion.patch);
    });

    it('should merge metadata when updating an event with existing metadata', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        { source: 'test', correlationId: '123' }
      );
      const additionalMetadata = { traceId: 'abc' };
      const newEvent = event.withMetadata(additionalMetadata);

      // New event should have merged metadata
      expect(newEvent.metadata).toEqual({
        source: 'test',
        correlationId: '123',
        traceId: 'abc'
      });
    });

    it('should create metadata when updating an event without existing metadata', () => {
      const event = new VersionedEventDto(testType, testPayload, testVersion);
      const newMetadata = { source: 'test' };
      const newEvent = event.withMetadata(newMetadata);

      expect(newEvent.metadata).toEqual(newMetadata);
    });
  });

  describe('fromObject', () => {
    it('should create a versioned event from a valid object', () => {
      const obj = {
        type: testType,
        payload: testPayload,
        version: { major: 2, minor: 1, patch: 0 },
        metadata: testMetadata
      };

      const event = VersionedEventDto.fromObject(obj);

      expect(event.type).toBe(testType);
      expect(event.payload).toEqual(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(2);
      expect(event.version.minor).toBe(1);
      expect(event.version.patch).toBe(0);
      expect(event.metadata).toEqual(testMetadata);
    });

    it('should create a versioned event with default version when version is missing', () => {
      const obj = {
        type: testType,
        payload: testPayload,
        metadata: testMetadata
      };

      const event = VersionedEventDto.fromObject(obj);

      expect(event.type).toBe(testType);
      expect(event.payload).toEqual(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(1);
      expect(event.version.minor).toBe(0);
      expect(event.version.patch).toBe(0);
      expect(event.metadata).toEqual(testMetadata);
    });

    it('should create a versioned event from an object with version as string', () => {
      const obj = {
        type: testType,
        payload: testPayload,
        version: '2.1.0',
        metadata: testMetadata
      };

      const event = VersionedEventDto.fromObject(obj);

      expect(event.type).toBe(testType);
      expect(event.payload).toEqual(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(2);
      expect(event.version.minor).toBe(1);
      expect(event.version.patch).toBe(0);
      expect(event.metadata).toEqual(testMetadata);
    });

    it('should throw an error for invalid objects', () => {
      expect(() => VersionedEventDto.fromObject(null)).toThrow('Invalid event object');
      expect(() => VersionedEventDto.fromObject({})).toThrow('valid type property');
      expect(() => VersionedEventDto.fromObject({ type: 'TEST' })).toThrow('valid payload property');
    });
  });

  describe('isCompatibleWith', () => {
    it('should return true when event version is compatible with target version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 1, minor: 1, patch: 0 };

      expect(event.isCompatibleWith(targetVersion)).toBe(true);
    });

    it('should return false when event version is incompatible with target version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 2, minor: 0, patch: 0 };

      expect(event.isCompatibleWith(targetVersion)).toBe(false);
    });
  });

  describe('needsUpgrade', () => {
    it('should return true when target version is greater than event version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 1, minor: 1, patch: 0 };

      expect(event.needsUpgrade(targetVersion)).toBe(true);
    });

    it('should return false when target version is equal to event version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 1, minor: 0, patch: 0 };

      expect(event.needsUpgrade(targetVersion)).toBe(false);
    });

    it('should return false when target version is less than event version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 1, 0)
      );
      const targetVersion = { major: 1, minor: 0, patch: 0 };

      expect(event.needsUpgrade(targetVersion)).toBe(false);
    });
  });

  describe('needsDowngrade', () => {
    it('should return true when event version is greater than target version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 1, 0)
      );
      const targetVersion = { major: 1, minor: 0, patch: 0 };

      expect(event.needsDowngrade(targetVersion)).toBe(true);
    });

    it('should return false when event version is equal to target version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 1, minor: 0, patch: 0 };

      expect(event.needsDowngrade(targetVersion)).toBe(false);
    });

    it('should return false when event version is less than target version', () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        new EventVersionDto(1, 0, 0)
      );
      const targetVersion = { major: 1, minor: 1, patch: 0 };

      expect(event.needsDowngrade(targetVersion)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate a valid versioned event', async () => {
      const event = new VersionedEventDto(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );
      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for missing type', async () => {
      const event = new VersionedEventDto(
        '',
        testPayload,
        testVersion,
        testMetadata
      );
      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation for invalid version', async () => {
      // Create an invalid version object that will fail the IsValidSemVerConstraint
      const invalidVersion = { major: -1, minor: 0, patch: 0 } as EventVersionDto;
      const event = plainToInstance(VersionedEventDto, {
        type: testType,
        payload: testPayload,
        version: invalidVersion,
        metadata: testMetadata
      });
      
      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('version');
    });

    it('should fail validation for non-object payload', async () => {
      const event = new VersionedEventDto(
        testType,
        'not an object' as any,
        testVersion,
        testMetadata
      );
      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('payload');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });
  });
});

describe('Utility Functions', () => {
  const testType = 'TEST_EVENT';
  const testPayload = { data: 'test data' };
  const testVersion = new EventVersionDto(2, 1, 0);
  const testMetadata = { source: 'test', correlationId: '123' };
  let testEvent: VersionedEventDto;

  beforeEach(() => {
    testEvent = new VersionedEventDto(
      testType,
      testPayload,
      testVersion,
      testMetadata
    );
  });

  describe('createVersionedEvent', () => {
    it('should create a versioned event with all properties', () => {
      const event = createVersionedEvent(
        testType,
        testPayload,
        testVersion,
        testMetadata
      );

      expect(event.type).toBe(testType);
      expect(event.payload).toBe(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(testVersion.major);
      expect(event.version.minor).toBe(testVersion.minor);
      expect(event.version.patch).toBe(testVersion.patch);
      expect(event.metadata).toBe(testMetadata);
    });

    it('should create a versioned event with default version', () => {
      const event = createVersionedEvent(testType, testPayload);

      expect(event.type).toBe(testType);
      expect(event.payload).toBe(testPayload);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(1);
      expect(event.version.minor).toBe(0);
      expect(event.version.patch).toBe(0);
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('extractPayload', () => {
    it('should extract the payload from a versioned event', () => {
      const payload = extractPayload(testEvent);
      expect(payload).toBe(testPayload);
    });
  });

  describe('extractVersion', () => {
    it('should extract the version from a versioned event', () => {
      const version = extractVersion(testEvent);
      expect(version).toBe(testEvent.version);
      expect(version.major).toBe(testVersion.major);
      expect(version.minor).toBe(testVersion.minor);
      expect(version.patch).toBe(testVersion.patch);
    });
  });

  describe('extractType', () => {
    it('should extract the type from a versioned event', () => {
      const type = extractType(testEvent);
      expect(type).toBe(testType);
    });
  });

  describe('extractMetadata', () => {
    it('should extract the metadata from a versioned event', () => {
      const metadata = extractMetadata(testEvent);
      expect(metadata).toBe(testMetadata);
    });

    it('should return an empty object when metadata is undefined', () => {
      const eventWithoutMetadata = new VersionedEventDto(
        testType,
        testPayload,
        testVersion
      );
      const metadata = extractMetadata(eventWithoutMetadata);
      expect(metadata).toEqual({});
    });
  });
});

describe('Integration with Event Processing', () => {
  // Test event types for different journeys
  const healthEventType = 'HEALTH_METRIC_RECORDED';
  const careEventType = 'APPOINTMENT_BOOKED';
  const planEventType = 'CLAIM_SUBMITTED';

  // Test payloads for different journeys
  const healthPayload = { metricType: 'HEART_RATE', value: 75, unit: 'bpm' };
  const carePayload = { providerId: '123', appointmentDate: '2023-05-15T10:00:00Z' };
  const planPayload = { claimType: 'Consulta Médica', amount: 250.0 };

  it('should support versioning for health journey events', () => {
    // Create a health event with version 1.0.0
    const v1Event = createVersionedEvent(
      healthEventType,
      healthPayload,
      new EventVersionDto(1, 0, 0)
    );

    // Create a health event with version 1.1.0 (added new fields)
    const v1_1Payload = { ...healthPayload, source: 'manual', timestamp: new Date().toISOString() };
    const v1_1Event = createVersionedEvent(
      healthEventType,
      v1_1Payload,
      new EventVersionDto(1, 1, 0)
    );

    // Verify compatibility
    expect(v1Event.isCompatibleWith(v1_1Event.version)).toBe(true);
    expect(v1_1Event.isCompatibleWith(v1Event.version)).toBe(false); // Forward compatibility not supported

    // Verify upgrade/downgrade needs
    expect(v1Event.needsUpgrade(v1_1Event.version)).toBe(true);
    expect(v1_1Event.needsDowngrade(v1Event.version)).toBe(true);
  });

  it('should support versioning for care journey events', () => {
    // Create a care event with version 1.0.0
    const v1Event = createVersionedEvent(
      careEventType,
      carePayload,
      new EventVersionDto(1, 0, 0)
    );

    // Create a care event with version 2.0.0 (breaking changes)
    const v2Payload = { 
      provider: { id: '123', name: 'Dr. Smith' }, // Changed structure
      schedule: { startTime: '2023-05-15T10:00:00Z', duration: 30 } // Changed field names
    };
    const v2Event = createVersionedEvent(
      careEventType,
      v2Payload,
      new EventVersionDto(2, 0, 0)
    );

    // Verify incompatibility
    expect(v1Event.isCompatibleWith(v2Event.version)).toBe(false);
    expect(v2Event.isCompatibleWith(v1Event.version)).toBe(false);

    // Verify upgrade/downgrade needs
    expect(v1Event.needsUpgrade(v2Event.version)).toBe(true);
    expect(v2Event.needsDowngrade(v1Event.version)).toBe(true);
  });

  it('should support versioning for plan journey events', () => {
    // Create a plan event with version 1.0.0
    const v1Event = createVersionedEvent(
      planEventType,
      planPayload,
      new EventVersionDto(1, 0, 0)
    );

    // Create a plan event with version 1.0.1 (patch update, no schema changes)
    const v1_0_1Event = createVersionedEvent(
      planEventType,
      planPayload,
      new EventVersionDto(1, 0, 1)
    );

    // Verify compatibility
    expect(v1Event.isCompatibleWith(v1_0_1Event.version)).toBe(true);
    expect(v1_0_1Event.isCompatibleWith(v1Event.version)).toBe(true);

    // Verify no upgrade/downgrade needs for patch versions
    expect(v1Event.needsUpgrade(v1_0_1Event.version)).toBe(true); // Still technically an upgrade
    expect(v1_0_1Event.needsDowngrade(v1Event.version)).toBe(true); // Still technically a downgrade
  });

  it('should demonstrate a complete version migration scenario', () => {
    // Original event (v1.0.0)
    const originalEvent = createVersionedEvent(
      healthEventType,
      { metricType: 'HEART_RATE', value: 75 }, // Missing unit in v1.0.0
      new EventVersionDto(1, 0, 0)
    );

    // Check if upgrade is needed to v1.1.0
    const targetVersion = new EventVersionDto(1, 1, 0);
    const needsUpgrade = originalEvent.needsUpgrade(targetVersion);
    expect(needsUpgrade).toBe(true);

    // Simulate upgrade to v1.1.0 (adding required unit field)
    const upgradedEvent = originalEvent.withPayload(
      { ...originalEvent.payload, unit: 'bpm' },
      targetVersion
    );

    // Verify upgraded event
    expect(upgradedEvent.version.major).toBe(1);
    expect(upgradedEvent.version.minor).toBe(1);
    expect(upgradedEvent.version.patch).toBe(0);
    expect(upgradedEvent.payload).toHaveProperty('unit', 'bpm');
    
    // Verify original event is unchanged
    expect(originalEvent.version.major).toBe(1);
    expect(originalEvent.version.minor).toBe(0);
    expect(originalEvent.version.patch).toBe(0);
    expect(originalEvent.payload).not.toHaveProperty('unit');
  });
});