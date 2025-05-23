/**
 * @file event-versioning.interface.spec.ts
 * @description Unit tests for event versioning interfaces that ensure proper semantic versioning
 * implementation for event schemas. Tests validate version compatibility detection, upgrade paths
 * between versions, and correct functioning of versioning strategies.
 */

import {
  EventVersion,
  IVersionedEvent,
  VersionCompatibilityResult,
  VersionDetectionStrategy,
  VersionCompatibilityStrategy,
  VersionMigrationPath,
  EventVersioningStrategy,
  EventTransformationOptions,
  VersionRange,
} from '../../../src/interfaces/event-versioning.interface';

describe('EventVersion Interface', () => {
  describe('Semantic Versioning Structure', () => {
    it('should correctly represent a semantic version with major, minor, and patch components', () => {
      const version: EventVersion = { major: 1, minor: 2, patch: 3 };
      
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
    });

    it('should allow zero values for any component', () => {
      const version: EventVersion = { major: 0, minor: 0, patch: 0 };
      
      expect(version.major).toBe(0);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
    });
  });
});

describe('IVersionedEvent Interface', () => {
  it('should correctly implement the versioned event interface', () => {
    const event: IVersionedEvent<{ data: string }> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: { data: 'test data' },
    };

    expect(event.version).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(event.type).toBe('test-event');
    expect(event.payload).toEqual({ data: 'test data' });
  });

  it('should support optional metadata', () => {
    const event: IVersionedEvent<{ data: string }> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: { data: 'test data' },
      metadata: { source: 'test-source', timestamp: Date.now() },
    };

    expect(event.metadata).toBeDefined();
    expect(event.metadata?.source).toBe('test-source');
  });

  it('should support generic payload types', () => {
    // String payload
    const stringEvent: IVersionedEvent<string> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'string-event',
      payload: 'string data',
    };

    // Number payload
    const numberEvent: IVersionedEvent<number> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'number-event',
      payload: 42,
    };

    // Complex object payload
    interface ComplexPayload {
      id: number;
      name: string;
      nested: { value: boolean };
    }

    const complexEvent: IVersionedEvent<ComplexPayload> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'complex-event',
      payload: {
        id: 1,
        name: 'test',
        nested: { value: true },
      },
    };

    expect(stringEvent.payload).toBe('string data');
    expect(numberEvent.payload).toBe(42);
    expect(complexEvent.payload.nested.value).toBe(true);
  });
});

describe('Version Compatibility Detection', () => {
  // Mock implementation of VersionCompatibilityStrategy for testing
  class TestCompatibilityStrategy implements VersionCompatibilityStrategy {
    checkCompatibility(sourceVersion: EventVersion, targetVersion: EventVersion): VersionCompatibilityResult {
      // Simple implementation for testing: compatible if major versions match
      const compatible = sourceVersion.major === targetVersion.major;
      let compatibilityType: 'exact' | 'backward' | 'forward' | 'none' = 'none';
      
      if (sourceVersion.major === targetVersion.major) {
        if (sourceVersion.minor === targetVersion.minor && sourceVersion.patch === targetVersion.patch) {
          compatibilityType = 'exact';
        } else if (sourceVersion.minor <= targetVersion.minor) {
          compatibilityType = 'backward';
        } else {
          compatibilityType = 'forward';
        }
      }
      
      return {
        compatible,
        compatibilityType,
        reason: compatible ? undefined : 'Major versions do not match',
        migrationRequired: sourceVersion.minor !== targetVersion.minor || sourceVersion.patch !== targetVersion.patch,
        sourceVersion,
        targetVersion,
      };
    }
  }

  const strategy = new TestCompatibilityStrategy();

  it('should detect exact version match', () => {
    const sourceVersion: EventVersion = { major: 1, minor: 2, patch: 3 };
    const targetVersion: EventVersion = { major: 1, minor: 2, patch: 3 };
    
    const result = strategy.checkCompatibility(sourceVersion, targetVersion);
    
    expect(result.compatible).toBe(true);
    expect(result.compatibilityType).toBe('exact');
    expect(result.migrationRequired).toBe(false);
  });

  it('should detect backward compatibility (older to newer minor version)', () => {
    const sourceVersion: EventVersion = { major: 1, minor: 2, patch: 3 };
    const targetVersion: EventVersion = { major: 1, minor: 3, patch: 0 };
    
    const result = strategy.checkCompatibility(sourceVersion, targetVersion);
    
    expect(result.compatible).toBe(true);
    expect(result.compatibilityType).toBe('backward');
    expect(result.migrationRequired).toBe(true);
  });

  it('should detect forward compatibility (newer to older minor version)', () => {
    const sourceVersion: EventVersion = { major: 1, minor: 3, patch: 0 };
    const targetVersion: EventVersion = { major: 1, minor: 2, patch: 3 };
    
    const result = strategy.checkCompatibility(sourceVersion, targetVersion);
    
    expect(result.compatible).toBe(true);
    expect(result.compatibilityType).toBe('forward');
    expect(result.migrationRequired).toBe(true);
  });

  it('should detect incompatibility between different major versions', () => {
    const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
    const targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };
    
    const result = strategy.checkCompatibility(sourceVersion, targetVersion);
    
    expect(result.compatible).toBe(false);
    expect(result.compatibilityType).toBe('none');
    expect(result.reason).toBe('Major versions do not match');
  });
});

describe('Version Detection Strategies', () => {
  // Mock implementation of VersionDetectionStrategy for testing
  class ExplicitFieldStrategy implements VersionDetectionStrategy {
    detectVersion(event: unknown): EventVersion | null {
      if (typeof event !== 'object' || event === null) {
        return null;
      }
      
      const eventObj = event as Record<string, any>;
      if ('version' in eventObj && typeof eventObj.version === 'object') {
        const version = eventObj.version;
        if ('major' in version && 'minor' in version && 'patch' in version) {
          return {
            major: Number(version.major),
            minor: Number(version.minor),
            patch: Number(version.patch),
          };
        }
      }
      
      return null;
    }

    canHandle(event: unknown): boolean {
      if (typeof event !== 'object' || event === null) {
        return false;
      }
      
      const eventObj = event as Record<string, any>;
      return 'version' in eventObj && typeof eventObj.version === 'object';
    }
  }

  class HeaderBasedStrategy implements VersionDetectionStrategy {
    detectVersion(event: unknown): EventVersion | null {
      if (typeof event !== 'object' || event === null) {
        return null;
      }
      
      const eventObj = event as Record<string, any>;
      if ('headers' in eventObj && typeof eventObj.headers === 'object' && eventObj.headers !== null) {
        const headers = eventObj.headers as Record<string, any>;
        if ('x-event-version' in headers && typeof headers['x-event-version'] === 'string') {
          const versionStr = headers['x-event-version'];
          const parts = versionStr.split('.');
          if (parts.length === 3) {
            return {
              major: Number(parts[0]),
              minor: Number(parts[1]),
              patch: Number(parts[2]),
            };
          }
        }
      }
      
      return null;
    }

    canHandle(event: unknown): boolean {
      if (typeof event !== 'object' || event === null) {
        return false;
      }
      
      const eventObj = event as Record<string, any>;
      return 'headers' in eventObj && typeof eventObj.headers === 'object' && eventObj.headers !== null;
    }
  }

  const explicitStrategy = new ExplicitFieldStrategy();
  const headerStrategy = new HeaderBasedStrategy();

  it('should detect version from explicit version field', () => {
    const event = {
      version: { major: 1, minor: 2, patch: 3 },
      type: 'test-event',
      payload: {},
    };
    
    expect(explicitStrategy.canHandle(event)).toBe(true);
    expect(explicitStrategy.detectVersion(event)).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should detect version from headers', () => {
    const event = {
      headers: { 'x-event-version': '2.3.4' },
      type: 'test-event',
      payload: {},
    };
    
    expect(headerStrategy.canHandle(event)).toBe(true);
    expect(headerStrategy.detectVersion(event)).toEqual({ major: 2, minor: 3, patch: 4 });
  });

  it('should return null for unsupported event formats', () => {
    const invalidEvent = {
      type: 'test-event',
      payload: {},
    };
    
    expect(explicitStrategy.canHandle(invalidEvent)).toBe(false);
    expect(explicitStrategy.detectVersion(invalidEvent)).toBeNull();
    
    expect(headerStrategy.canHandle(invalidEvent)).toBe(false);
    expect(headerStrategy.detectVersion(invalidEvent)).toBeNull();
  });

  it('should handle null or undefined inputs gracefully', () => {
    expect(explicitStrategy.canHandle(null)).toBe(false);
    expect(explicitStrategy.detectVersion(null)).toBeNull();
    
    expect(headerStrategy.canHandle(undefined)).toBe(false);
    expect(headerStrategy.detectVersion(undefined)).toBeNull();
  });
});

describe('Version Migration Paths', () => {
  // Define test event types for different versions
  interface EventV1Payload {
    message: string;
  }

  interface EventV2Payload {
    message: string;
    timestamp: number;
  }

  // Mock implementation of VersionMigrationPath for testing
  class TestMigrationPath implements VersionMigrationPath<EventV1Payload, EventV2Payload> {
    sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
    targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };

    migrate(sourceEvent: IVersionedEvent<EventV1Payload>): IVersionedEvent<EventV2Payload> {
      // Transform V1 to V2 by adding timestamp
      return {
        version: this.targetVersion,
        type: sourceEvent.type,
        payload: {
          message: sourceEvent.payload.message,
          timestamp: Date.now(),
        },
        metadata: sourceEvent.metadata,
      };
    }
  }

  const migrationPath = new TestMigrationPath();

  it('should correctly migrate from source to target version', () => {
    const sourceEvent: IVersionedEvent<EventV1Payload> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: { message: 'Hello, world!' },
    };
    
    const migratedEvent = migrationPath.migrate(sourceEvent);
    
    expect(migratedEvent.version).toEqual({ major: 2, minor: 0, patch: 0 });
    expect(migratedEvent.type).toBe('test-event');
    expect(migratedEvent.payload.message).toBe('Hello, world!');
    expect(migratedEvent.payload.timestamp).toBeDefined();
    expect(typeof migratedEvent.payload.timestamp).toBe('number');
  });

  it('should preserve metadata during migration', () => {
    const sourceEvent: IVersionedEvent<EventV1Payload> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: { message: 'Hello, world!' },
      metadata: { source: 'test-source', correlationId: '123' },
    };
    
    const migratedEvent = migrationPath.migrate(sourceEvent);
    
    expect(migratedEvent.metadata).toEqual({ source: 'test-source', correlationId: '123' });
  });
});

describe('Event Versioning Strategy', () => {
  // Mock implementation of EventVersioningStrategy for testing
  class TestVersioningStrategy implements EventVersioningStrategy {
    private migrationPaths: VersionMigrationPath[] = [];

    detectVersion(event: unknown): EventVersion {
      if (typeof event !== 'object' || event === null) {
        throw new Error('Invalid event format');
      }
      
      const eventObj = event as Record<string, any>;
      if ('version' in eventObj && typeof eventObj.version === 'object') {
        const version = eventObj.version;
        if ('major' in version && 'minor' in version && 'patch' in version) {
          return {
            major: Number(version.major),
            minor: Number(version.minor),
            patch: Number(version.patch),
          };
        }
      }
      
      throw new Error('Version not found in event');
    }

    checkCompatibility(event: unknown, targetVersion: EventVersion): VersionCompatibilityResult {
      try {
        const sourceVersion = this.detectVersion(event);
        
        // Simple compatibility check: major versions must match
        const compatible = sourceVersion.major === targetVersion.major;
        let compatibilityType: 'exact' | 'backward' | 'forward' | 'none' = 'none';
        
        if (sourceVersion.major === targetVersion.major) {
          if (sourceVersion.minor === targetVersion.minor && sourceVersion.patch === targetVersion.patch) {
            compatibilityType = 'exact';
          } else if (sourceVersion.minor <= targetVersion.minor) {
            compatibilityType = 'backward';
          } else {
            compatibilityType = 'forward';
          }
        }
        
        return {
          compatible,
          compatibilityType,
          reason: compatible ? undefined : 'Major versions do not match',
          migrationRequired: sourceVersion.minor !== targetVersion.minor || sourceVersion.patch !== targetVersion.patch,
          sourceVersion,
          targetVersion,
        };
      } catch (error) {
        return {
          compatible: false,
          compatibilityType: 'none',
          reason: (error as Error).message,
          migrationRequired: false,
          sourceVersion: { major: 0, minor: 0, patch: 0 },
          targetVersion,
        };
      }
    }

    transformToVersion<T = unknown, R = unknown>(
      event: IVersionedEvent<T>,
      targetVersion: EventVersion,
      options?: EventTransformationOptions
    ): IVersionedEvent<R> {
      const sourceVersion = event.version;
      
      // If versions are the same, no transformation needed
      if (
        sourceVersion.major === targetVersion.major &&
        sourceVersion.minor === targetVersion.minor &&
        sourceVersion.patch === targetVersion.patch
      ) {
        return event as unknown as IVersionedEvent<R>;
      }
      
      // Find migration path
      const migrationPath = this.findMigrationPath<T, R>(sourceVersion, targetVersion);
      
      if (!migrationPath) {
        throw new Error(`No migration path found from ${JSON.stringify(sourceVersion)} to ${JSON.stringify(targetVersion)}`);
      }
      
      // Apply migration
      return migrationPath.migrate(event);
    }

    registerMigrationPath<TSource = unknown, TTarget = unknown>(
      migrationPath: VersionMigrationPath<TSource, TTarget>
    ): void {
      this.migrationPaths.push(migrationPath);
    }

    getMigrationPaths(): VersionMigrationPath[] {
      return [...this.migrationPaths];
    }

    findMigrationPath<TSource = unknown, TTarget = unknown>(
      sourceVersion: EventVersion,
      targetVersion: EventVersion
    ): VersionMigrationPath<TSource, TTarget> | null {
      // Simple implementation: find direct path
      for (const path of this.migrationPaths) {
        if (
          path.sourceVersion.major === sourceVersion.major &&
          path.sourceVersion.minor === sourceVersion.minor &&
          path.sourceVersion.patch === sourceVersion.patch &&
          path.targetVersion.major === targetVersion.major &&
          path.targetVersion.minor === targetVersion.minor &&
          path.targetVersion.patch === targetVersion.patch
        ) {
          return path as VersionMigrationPath<TSource, TTarget>;
        }
      }
      
      return null;
    }
  }

  // Define test event types for different versions
  interface EventV1Payload {
    message: string;
  }

  interface EventV2Payload {
    message: string;
    timestamp: number;
  }

  // Mock implementation of VersionMigrationPath for testing
  class TestMigrationPath implements VersionMigrationPath<EventV1Payload, EventV2Payload> {
    sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
    targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };

    migrate(sourceEvent: IVersionedEvent<EventV1Payload>): IVersionedEvent<EventV2Payload> {
      // Transform V1 to V2 by adding timestamp
      return {
        version: this.targetVersion,
        type: sourceEvent.type,
        payload: {
          message: sourceEvent.payload.message,
          timestamp: Date.now(),
        },
        metadata: sourceEvent.metadata,
      };
    }
  }

  let strategy: TestVersioningStrategy;
  let migrationPath: TestMigrationPath;

  beforeEach(() => {
    strategy = new TestVersioningStrategy();
    migrationPath = new TestMigrationPath();
    strategy.registerMigrationPath(migrationPath);
  });

  it('should detect version from event', () => {
    const event: IVersionedEvent = {
      version: { major: 1, minor: 2, patch: 3 },
      type: 'test-event',
      payload: {},
    };
    
    expect(strategy.detectVersion(event)).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should check compatibility between event and target version', () => {
    const event: IVersionedEvent = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: {},
    };
    
    const targetVersion: EventVersion = { major: 1, minor: 1, patch: 0 };
    
    const result = strategy.checkCompatibility(event, targetVersion);
    
    expect(result.compatible).toBe(true);
    expect(result.compatibilityType).toBe('backward');
    expect(result.migrationRequired).toBe(true);
  });

  it('should transform event to target version using registered migration path', () => {
    const event: IVersionedEvent<EventV1Payload> = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: { message: 'Hello, world!' },
    };
    
    const targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };
    
    const transformedEvent = strategy.transformToVersion<EventV1Payload, EventV2Payload>(
      event,
      targetVersion
    );
    
    expect(transformedEvent.version).toEqual(targetVersion);
    expect(transformedEvent.payload.message).toBe('Hello, world!');
    expect(transformedEvent.payload.timestamp).toBeDefined();
  });

  it('should throw error when no migration path is found', () => {
    const event: IVersionedEvent = {
      version: { major: 1, minor: 0, patch: 0 },
      type: 'test-event',
      payload: {},
    };
    
    const targetVersion: EventVersion = { major: 3, minor: 0, patch: 0 };
    
    expect(() => {
      strategy.transformToVersion(event, targetVersion);
    }).toThrow('No migration path found');
  });

  it('should return registered migration paths', () => {
    const paths = strategy.getMigrationPaths();
    
    expect(paths).toHaveLength(1);
    expect(paths[0]).toBe(migrationPath);
  });
});

describe('Version Range', () => {
  it('should correctly check if a version is within range', () => {
    const range: VersionRange = {
      minVersion: { major: 1, minor: 0, patch: 0 },
      maxVersion: { major: 2, minor: 0, patch: 0 },
      includes: function(version: EventVersion): boolean {
        // Version is within range if it's >= minVersion and <= maxVersion
        if (version.major < this.minVersion.major) return false;
        if (version.major > this.maxVersion.major) return false;
        
        if (version.major === this.minVersion.major) {
          if (version.minor < this.minVersion.minor) return false;
          if (version.minor === this.minVersion.minor && version.patch < this.minVersion.patch) return false;
        }
        
        if (version.major === this.maxVersion.major) {
          if (version.minor > this.maxVersion.minor) return false;
          if (version.minor === this.maxVersion.minor && version.patch > this.maxVersion.patch) return false;
        }
        
        return true;
      }
    };

    // Test versions within range
    expect(range.includes({ major: 1, minor: 0, patch: 0 })).toBe(true); // Min boundary
    expect(range.includes({ major: 1, minor: 5, patch: 0 })).toBe(true); // Middle
    expect(range.includes({ major: 2, minor: 0, patch: 0 })).toBe(true); // Max boundary

    // Test versions outside range
    expect(range.includes({ major: 0, minor: 9, patch: 9 })).toBe(false); // Below min
    expect(range.includes({ major: 2, minor: 0, patch: 1 })).toBe(false); // Above max
  });
});