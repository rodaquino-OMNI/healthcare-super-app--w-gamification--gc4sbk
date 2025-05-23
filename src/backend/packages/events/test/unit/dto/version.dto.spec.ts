/**
 * @file version.dto.spec.ts
 * @description Unit tests for the VersionDto class that validate event schema versioning support.
 * Tests verify semantic versioning format validation, compatibility layer functionality, and
 * version migration utilities. These tests ensure proper schema evolution with backward
 * compatibility, allowing the system to handle older event versions while supporting new
 * fields and validation rules.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  EventVersionDto,
  VersionedEventDto,
  isVersionedEvent,
  parseVersion,
  compareVersions,
  checkVersionCompatibility,
  createVersionedEvent,
} from '../../../src/dto/version.dto';
import { EventVersion, VersionCompatibilityResult } from '../../../src/interfaces/event-versioning.interface';

describe('EventVersionDto', () => {
  describe('constructor', () => {
    it('should create a version with default values', () => {
      const version = new EventVersionDto();
      expect(version.major).toBe(1);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });

    it('should create a version with specified values', () => {
      const version = new EventVersionDto(2, 3, 4);
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(4);
    });
  });

  describe('fromString', () => {
    it('should parse a valid version string', () => {
      const version = EventVersionDto.fromString('2.3.4');
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(4);
    });

    it('should throw an error for an empty version string', () => {
      expect(() => EventVersionDto.fromString('')).toThrow('Version string cannot be empty');
    });

    it('should throw an error for an invalid format', () => {
      expect(() => EventVersionDto.fromString('2.3')).toThrow('Invalid version string format');
      expect(() => EventVersionDto.fromString('2.3.4.5')).toThrow('Invalid version string format');
    });

    it('should throw an error for non-numeric components', () => {
      expect(() => EventVersionDto.fromString('a.3.4')).toThrow('Invalid version component');
      expect(() => EventVersionDto.fromString('2.b.4')).toThrow('Invalid version component');
      expect(() => EventVersionDto.fromString('2.3.c')).toThrow('Invalid version component');
    });

    it('should throw an error for negative components', () => {
      expect(() => EventVersionDto.fromString('-1.3.4')).toThrow('Invalid version component');
      expect(() => EventVersionDto.fromString('2.-3.4')).toThrow('Invalid version component');
      expect(() => EventVersionDto.fromString('2.3.-4')).toThrow('Invalid version component');
    });
  });

  describe('toString', () => {
    it('should convert version to string format', () => {
      const version = new EventVersionDto(2, 3, 4);
      expect(version.toString()).toBe('2.3.4');
    });

    it('should handle zero values correctly', () => {
      const version = new EventVersionDto(0, 0, 0);
      expect(version.toString()).toBe('0.0.0');
    });
  });

  describe('validation', () => {
    it('should validate a valid version', async () => {
      const version = plainToInstance(EventVersionDto, { major: 2, minor: 3, patch: 4 });
      const errors = await validate(version);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for missing major version', async () => {
      const version = plainToInstance(EventVersionDto, { minor: 3, patch: 4 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('major');
    });

    it('should fail validation for missing minor version', async () => {
      const version = plainToInstance(EventVersionDto, { major: 2, patch: 4 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('minor');
    });

    it('should fail validation for missing patch version', async () => {
      const version = plainToInstance(EventVersionDto, { major: 2, minor: 3 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('patch');
    });

    it('should fail validation for negative major version', async () => {
      const version = plainToInstance(EventVersionDto, { major: -1, minor: 3, patch: 4 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('major');
    });

    it('should fail validation for negative minor version', async () => {
      const version = plainToInstance(EventVersionDto, { major: 2, minor: -3, patch: 4 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('minor');
    });

    it('should fail validation for negative patch version', async () => {
      const version = plainToInstance(EventVersionDto, { major: 2, minor: 3, patch: -4 });
      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('patch');
    });
  });

  describe('checkCompatibility', () => {
    it('should identify exact match compatibility', () => {
      const version1 = new EventVersionDto(2, 3, 4);
      const version2 = new EventVersionDto(2, 3, 4);
      const result = version1.checkCompatibility(version2);

      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('exact');
      expect(result.migrationRequired).toBe(false);
    });

    it('should identify backward compatibility (newer to older)', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(2, 2, 1);
      const result = newer.checkCompatibility(older);

      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('backward');
      expect(result.migrationRequired).toBe(false);
    });

    it('should identify forward compatibility (older to newer)', () => {
      const older = new EventVersionDto(2, 2, 1);
      const newer = new EventVersionDto(2, 3, 4);
      const result = older.checkCompatibility(newer);

      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('forward');
      expect(result.migrationRequired).toBe(true);
    });

    it('should identify incompatibility for different major versions', () => {
      const version1 = new EventVersionDto(1, 3, 4);
      const version2 = new EventVersionDto(2, 3, 4);
      const result = version1.checkCompatibility(version2);

      expect(result.compatible).toBe(false);
      expect(result.compatibilityType).toBe('none');
      expect(result.migrationRequired).toBe(true);
      expect(result.reason).toContain('Major version mismatch');
    });

    it('should handle same major and minor but different patch versions', () => {
      const version1 = new EventVersionDto(2, 3, 4);
      const version2 = new EventVersionDto(2, 3, 5);
      const result = version1.checkCompatibility(version2);

      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('forward');
      expect(result.migrationRequired).toBe(false);
    });
  });

  describe('compareTo', () => {
    it('should return 0 for equal versions', () => {
      const version1 = new EventVersionDto(2, 3, 4);
      const version2 = new EventVersionDto(2, 3, 4);
      expect(version1.compareTo(version2)).toBe(0);
    });

    it('should return -1 when this version is older (major)', () => {
      const older = new EventVersionDto(1, 3, 4);
      const newer = new EventVersionDto(2, 3, 4);
      expect(older.compareTo(newer)).toBe(-1);
    });

    it('should return 1 when this version is newer (major)', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(1, 3, 4);
      expect(newer.compareTo(older)).toBe(1);
    });

    it('should return -1 when this version is older (minor)', () => {
      const older = new EventVersionDto(2, 2, 4);
      const newer = new EventVersionDto(2, 3, 4);
      expect(older.compareTo(newer)).toBe(-1);
    });

    it('should return 1 when this version is newer (minor)', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(2, 2, 4);
      expect(newer.compareTo(older)).toBe(1);
    });

    it('should return -1 when this version is older (patch)', () => {
      const older = new EventVersionDto(2, 3, 3);
      const newer = new EventVersionDto(2, 3, 4);
      expect(older.compareTo(newer)).toBe(-1);
    });

    it('should return 1 when this version is newer (patch)', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(2, 3, 3);
      expect(newer.compareTo(older)).toBe(1);
    });
  });

  describe('isNewerThan, isOlderThan, isEqual', () => {
    it('should correctly identify newer versions', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(1, 9, 9);
      expect(newer.isNewerThan(older)).toBe(true);
      expect(older.isNewerThan(newer)).toBe(false);
    });

    it('should correctly identify older versions', () => {
      const newer = new EventVersionDto(2, 3, 4);
      const older = new EventVersionDto(1, 9, 9);
      expect(older.isOlderThan(newer)).toBe(true);
      expect(newer.isOlderThan(older)).toBe(false);
    });

    it('should correctly identify equal versions', () => {
      const version1 = new EventVersionDto(2, 3, 4);
      const version2 = new EventVersionDto(2, 3, 4);
      const version3 = new EventVersionDto(2, 3, 5);
      expect(version1.isEqual(version2)).toBe(true);
      expect(version1.isEqual(version3)).toBe(false);
    });
  });
});

describe('VersionedEventDto', () => {
  describe('constructor', () => {
    it('should create a versioned event with default version', () => {
      const event = new VersionedEventDto('test.event', { data: 'test' });
      expect(event.type).toBe('test.event');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.toString()).toBe('1.0.0');
      expect(event.metadata).toBeUndefined();
    });

    it('should create a versioned event with specified version', () => {
      const version = new EventVersionDto(2, 3, 4);
      const event = new VersionedEventDto('test.event', { data: 'test' }, version);
      expect(event.version).toBe(version);
    });

    it('should create a versioned event with plain version object', () => {
      const version = { major: 2, minor: 3, patch: 4 };
      const event = new VersionedEventDto('test.event', { data: 'test' }, version);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.major).toBe(2);
      expect(event.version.minor).toBe(3);
      expect(event.version.patch).toBe(4);
    });

    it('should create a versioned event with metadata', () => {
      const metadata = { source: 'test', timestamp: 123456789 };
      const event = new VersionedEventDto('test.event', { data: 'test' }, undefined, metadata);
      expect(event.metadata).toBe(metadata);
    });
  });

  describe('fromPlain', () => {
    it('should create a versioned event from a plain object with string version', () => {
      const plain = {
        type: 'test.event',
        payload: { data: 'test' },
        version: '2.3.4',
        metadata: { source: 'test' }
      };
      const event = VersionedEventDto.fromPlain(plain);
      expect(event.type).toBe('test.event');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.toString()).toBe('2.3.4');
      expect(event.metadata).toEqual({ source: 'test' });
    });

    it('should create a versioned event from a plain object with object version', () => {
      const plain = {
        type: 'test.event',
        payload: { data: 'test' },
        version: { major: 2, minor: 3, patch: 4 },
        metadata: { source: 'test' }
      };
      const event = VersionedEventDto.fromPlain(plain);
      expect(event.version).toBeInstanceOf(EventVersionDto);
      expect(event.version.toString()).toBe('2.3.4');
    });

    it('should create a versioned event with default version when not specified', () => {
      const plain = {
        type: 'test.event',
        payload: { data: 'test' }
      };
      const event = VersionedEventDto.fromPlain(plain);
      expect(event.version.toString()).toBe('1.0.0');
    });

    it('should throw an error for empty data', () => {
      expect(() => VersionedEventDto.fromPlain(null)).toThrow('Event data cannot be empty');
    });

    it('should throw an error for missing type', () => {
      const plain = {
        payload: { data: 'test' }
      };
      expect(() => VersionedEventDto.fromPlain(plain)).toThrow('Event type is required');
    });

    it('should throw an error for missing payload', () => {
      const plain = {
        type: 'test.event'
      };
      expect(() => VersionedEventDto.fromPlain(plain)).toThrow('Event payload is required');
    });

    it('should throw an error for invalid version format', () => {
      const plain = {
        type: 'test.event',
        payload: { data: 'test' },
        version: 123
      };
      expect(() => VersionedEventDto.fromPlain(plain)).toThrow('Invalid version format');
    });
  });

  describe('toPlain', () => {
    it('should convert a versioned event to a plain object', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4),
        { source: 'test' }
      );
      const plain = event.toPlain();
      expect(plain).toEqual({
        type: 'test.event',
        payload: { data: 'test' },
        version: '2.3.4',
        metadata: { source: 'test' }
      });
    });

    it('should omit metadata if not present', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4)
      );
      const plain = event.toPlain();
      expect(plain).toEqual({
        type: 'test.event',
        payload: { data: 'test' },
        version: '2.3.4'
      });
      expect(plain.metadata).toBeUndefined();
    });
  });

  describe('checkCompatibility', () => {
    it('should check compatibility with a target version', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4)
      );
      const targetVersion = new EventVersionDto(2, 4, 0);
      const result = event.checkCompatibility(targetVersion);
      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('forward');
      expect(result.migrationRequired).toBe(true);
    });
  });

  describe('withVersion, withPayload, withMetadata', () => {
    it('should create a new event with updated version', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4),
        { source: 'test' }
      );
      const newVersion = new EventVersionDto(3, 0, 0);
      const newEvent = event.withVersion(newVersion);

      // Original event should be unchanged
      expect(event.version.toString()).toBe('2.3.4');

      // New event should have updated version
      expect(newEvent).not.toBe(event);
      expect(newEvent.type).toBe('test.event');
      expect(newEvent.payload).toEqual({ data: 'test' });
      expect(newEvent.version).toBe(newVersion);
      expect(newEvent.metadata).toEqual({ source: 'test' });
    });

    it('should create a new event with updated payload', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4),
        { source: 'test' }
      );
      const newPayload = { data: 'updated', extra: true };
      const newEvent = event.withPayload(newPayload);

      // Original event should be unchanged
      expect(event.payload).toEqual({ data: 'test' });

      // New event should have updated payload
      expect(newEvent).not.toBe(event);
      expect(newEvent.type).toBe('test.event');
      expect(newEvent.payload).toBe(newPayload);
      expect(newEvent.version.toString()).toBe('2.3.4');
      expect(newEvent.metadata).toEqual({ source: 'test' });
    });

    it('should create a new event with updated metadata', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4),
        { source: 'test' }
      );
      const newMetadata = { source: 'updated', timestamp: 123456789 };
      const newEvent = event.withMetadata(newMetadata);

      // Original event should be unchanged
      expect(event.metadata).toEqual({ source: 'test' });

      // New event should have updated metadata
      expect(newEvent).not.toBe(event);
      expect(newEvent.type).toBe('test.event');
      expect(newEvent.payload).toEqual({ data: 'test' });
      expect(newEvent.version.toString()).toBe('2.3.4');
      expect(newEvent.metadata).toEqual({ source: 'updated', timestamp: 123456789 });
    });

    it('should merge metadata when updating', () => {
      const event = new VersionedEventDto(
        'test.event',
        { data: 'test' },
        new EventVersionDto(2, 3, 4),
        { source: 'test', id: 123 }
      );
      const newMetadata = { source: 'updated', timestamp: 123456789 };
      const newEvent = event.withMetadata(newMetadata);

      // New event should have merged metadata
      expect(newEvent.metadata).toEqual({
        source: 'updated',
        id: 123,
        timestamp: 123456789
      });
    });
  });
});

describe('Utility functions', () => {
  describe('isVersionedEvent', () => {
    it('should return true for valid versioned events', () => {
      const event = new VersionedEventDto('test.event', { data: 'test' });
      expect(isVersionedEvent(event)).toBe(true);
    });

    it('should return true for plain objects that match the structure', () => {
      const obj = {
        type: 'test.event',
        payload: { data: 'test' },
        version: { major: 1, minor: 0, patch: 0 }
      };
      expect(isVersionedEvent(obj)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isVersionedEvent(null)).toBe(false);
      expect(isVersionedEvent(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isVersionedEvent('string')).toBe(false);
      expect(isVersionedEvent(123)).toBe(false);
      expect(isVersionedEvent(true)).toBe(false);
    });

    it('should return false for objects missing required properties', () => {
      expect(isVersionedEvent({ payload: {}, version: { major: 1, minor: 0, patch: 0 } })).toBe(false);
      expect(isVersionedEvent({ type: 'test', version: { major: 1, minor: 0, patch: 0 } })).toBe(false);
      expect(isVersionedEvent({ type: 'test', payload: {} })).toBe(false);
    });

    it('should return false for objects with invalid property types', () => {
      expect(isVersionedEvent({ type: 123, payload: {}, version: { major: 1, minor: 0, patch: 0 } })).toBe(false);
      expect(isVersionedEvent({ type: 'test', payload: 'string', version: { major: 1, minor: 0, patch: 0 } })).toBe(false);
      expect(isVersionedEvent({ type: 'test', payload: {}, version: 'string' })).toBe(false);
      expect(isVersionedEvent({ type: 'test', payload: {}, version: { major: 'a', minor: 0, patch: 0 } })).toBe(false);
    });
  });

  describe('parseVersion', () => {
    it('should parse a valid version string', () => {
      const version = parseVersion('2.3.4');
      expect(version).toBeInstanceOf(EventVersionDto);
      expect(version.toString()).toBe('2.3.4');
    });

    it('should throw an error for invalid version strings', () => {
      expect(() => parseVersion('')).toThrow();
      expect(() => parseVersion('2.3')).toThrow();
      expect(() => parseVersion('a.b.c')).toThrow();
    });
  });

  describe('compareVersions', () => {
    it('should compare two EventVersionDto instances', () => {
      const v1 = new EventVersionDto(2, 3, 4);
      const v2 = new EventVersionDto(2, 4, 0);
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
      expect(compareVersions(v1, v1)).toBe(0);
    });

    it('should compare a plain object with an EventVersionDto', () => {
      const v1 = { major: 2, minor: 3, patch: 4 };
      const v2 = new EventVersionDto(2, 4, 0);
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
    });

    it('should compare two plain objects', () => {
      const v1 = { major: 2, minor: 3, patch: 4 };
      const v2 = { major: 2, minor: 3, patch: 4 };
      expect(compareVersions(v1, v2)).toBe(0);
    });
  });

  describe('checkVersionCompatibility', () => {
    it('should check compatibility between two EventVersionDto instances', () => {
      const v1 = new EventVersionDto(2, 3, 4);
      const v2 = new EventVersionDto(2, 4, 0);
      const result = checkVersionCompatibility(v1, v2);
      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('forward');
    });

    it('should check compatibility between a plain object and an EventVersionDto', () => {
      const v1 = { major: 2, minor: 3, patch: 4 };
      const v2 = new EventVersionDto(2, 4, 0);
      const result = checkVersionCompatibility(v1, v2);
      expect(result.compatible).toBe(true);
      expect(result.compatibilityType).toBe('forward');
    });

    it('should check compatibility between two plain objects', () => {
      const v1 = { major: 2, minor: 3, patch: 4 };
      const v2 = { major: 3, minor: 0, patch: 0 };
      const result = checkVersionCompatibility(v1, v2);
      expect(result.compatible).toBe(false);
      expect(result.compatibilityType).toBe('none');
    });
  });

  describe('createVersionedEvent', () => {
    it('should create a versioned event with default version', () => {
      const event = createVersionedEvent('test.event', { data: 'test' });
      expect(event).toBeInstanceOf(VersionedEventDto);
      expect(event.type).toBe('test.event');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.version.toString()).toBe('1.0.0');
    });

    it('should create a versioned event with specified version', () => {
      const version = new EventVersionDto(2, 3, 4);
      const event = createVersionedEvent('test.event', { data: 'test' }, version);
      expect(event.version).toBe(version);
    });

    it('should create a versioned event with metadata', () => {
      const metadata = { source: 'test' };
      const event = createVersionedEvent('test.event', { data: 'test' }, undefined, metadata);
      expect(event.metadata).toBe(metadata);
    });
  });
});

describe('Integration with event processing', () => {
  // Define a sample event type for testing
  interface HealthMetricRecorded {
    userId: string;
    metricType: string;
    value: number;
    unit: string;
    timestamp: number;
    deviceId?: string;
  }

  // Define a sample event processor
  class EventProcessor {
    private readonly supportedVersion = new EventVersionDto(1, 2, 0);

    processEvent(event: VersionedEventDto<unknown>): { success: boolean; result?: unknown; error?: string } {
      // Check if event is compatible with our supported version
      const compatibility = event.checkCompatibility(this.supportedVersion);

      if (!compatibility.compatible) {
        return {
          success: false,
          error: `Incompatible event version: ${event.version.toString()} is not compatible with ${this.supportedVersion.toString()}`
        };
      }

      // If migration is required, we would perform it here
      if (compatibility.migrationRequired) {
        // In a real implementation, we would transform the event
        // For this test, we'll just log it
        console.log(`Migration required from ${event.version.toString()} to ${this.supportedVersion.toString()}`);
      }

      // Process the event based on its type
      if (event.type === 'health.metric.recorded') {
        return this.processHealthMetricRecorded(event as VersionedEventDto<HealthMetricRecorded>);
      }

      return {
        success: false,
        error: `Unsupported event type: ${event.type}`
      };
    }

    private processHealthMetricRecorded(event: VersionedEventDto<HealthMetricRecorded>): { success: boolean; result: unknown } {
      const { userId, metricType, value, unit, timestamp } = event.payload;

      // Validate required fields
      if (!userId || !metricType || value === undefined || !unit || !timestamp) {
        return {
          success: false,
          error: 'Missing required fields in health metric event'
        };
      }

      // Process the event (in a real implementation, this would do something meaningful)
      return {
        success: true,
        result: {
          processed: true,
          userId,
          metricType,
          value,
          processedAt: Date.now()
        }
      };
    }
  }

  it('should process a compatible event successfully', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent<HealthMetricRecorded>(
      'health.metric.recorded',
      {
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: Date.now()
      },
      new EventVersionDto(1, 2, 0) // Exact match with supported version
    );

    const result = processor.processEvent(event);
    expect(result.success).toBe(true);
    expect(result.result).toHaveProperty('processed', true);
    expect(result.result).toHaveProperty('userId', 'user123');
    expect(result.result).toHaveProperty('metricType', 'HEART_RATE');
  });

  it('should process a backward compatible event successfully', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent<HealthMetricRecorded>(
      'health.metric.recorded',
      {
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: Date.now()
      },
      new EventVersionDto(1, 3, 0) // Newer minor version
    );

    const result = processor.processEvent(event);
    expect(result.success).toBe(true);
  });

  it('should process a forward compatible event with migration', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent<HealthMetricRecorded>(
      'health.metric.recorded',
      {
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: Date.now()
      },
      new EventVersionDto(1, 1, 0) // Older minor version
    );

    // Spy on console.log to verify migration message
    const consoleSpy = jest.spyOn(console, 'log');
    const result = processor.processEvent(event);
    
    expect(consoleSpy).toHaveBeenCalledWith('Migration required from 1.1.0 to 1.2.0');
    expect(result.success).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('should reject an incompatible event', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent<HealthMetricRecorded>(
      'health.metric.recorded',
      {
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: Date.now()
      },
      new EventVersionDto(2, 0, 0) // Different major version
    );

    const result = processor.processEvent(event);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Incompatible event version');
  });

  it('should reject an unsupported event type', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent(
      'unknown.event.type',
      { data: 'test' },
      new EventVersionDto(1, 2, 0)
    );

    const result = processor.processEvent(event);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported event type');
  });

  it('should reject an event with missing required fields', () => {
    const processor = new EventProcessor();
    const event = createVersionedEvent<Partial<HealthMetricRecorded>>(
      'health.metric.recorded',
      {
        userId: 'user123',
        // Missing metricType and other required fields
        timestamp: Date.now()
      },
      new EventVersionDto(1, 2, 0)
    );

    const result = processor.processEvent(event);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required fields');
  });
});