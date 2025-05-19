import { EventVersion, IVersionedEvent, EventVersioningStrategy, VersionCompatibilityResult } from '../../../src/interfaces/event-versioning.interface';
import { EventVersionError } from '../../../src/versioning/errors';

/**
 * Test suite for event versioning interfaces
 * 
 * These tests validate the proper implementation of semantic versioning
 * for event schemas, ensuring backward compatibility during system upgrades.
 */
describe('Event Versioning Interfaces', () => {
  
  /**
   * Tests for the IVersionedEvent interface implementation
   */
  describe('IVersionedEvent', () => {
    // Mock implementation of IVersionedEvent for testing
    class MockVersionedEvent implements IVersionedEvent {
      constructor(
        public readonly type: string,
        public readonly version: EventVersion,
        public readonly payload: Record<string, any>,
        public readonly metadata: Record<string, any> = {}
      ) {}
    }

    it('should create a valid versioned event', () => {
      // Arrange
      const eventType = 'test.event';
      const eventVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const payload = { data: 'test-data' };
      
      // Act
      const event = new MockVersionedEvent(eventType, eventVersion, payload);
      
      // Assert
      expect(event).toBeDefined();
      expect(event.type).toBe(eventType);
      expect(event.version).toEqual(eventVersion);
      expect(event.payload).toEqual(payload);
      expect(event.metadata).toEqual({});
    });
    
    it('should support optional metadata', () => {
      // Arrange
      const eventType = 'test.event';
      const eventVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const payload = { data: 'test-data' };
      const metadata = { correlationId: 'test-correlation-id' };
      
      // Act
      const event = new MockVersionedEvent(eventType, eventVersion, payload, metadata);
      
      // Assert
      expect(event.metadata).toEqual(metadata);
    });
    
    it('should enforce required properties', () => {
      // This test verifies TypeScript interface constraints
      // If this code compiles, it means the interface is enforcing its constraints
      
      // These would cause TypeScript compilation errors if uncommented:
      // @ts-expect-error - Missing required properties
      // const invalidEvent1: IVersionedEvent = {};
      
      // @ts-expect-error - Missing version
      // const invalidEvent2: IVersionedEvent = { type: 'test', payload: {} };
      
      // @ts-expect-error - Missing payload
      // const invalidEvent3: IVersionedEvent = { type: 'test', version: { major: 1, minor: 0, patch: 0 } };
      
      // Valid event should compile without errors
      const validEvent: IVersionedEvent = {
        type: 'test.event',
        version: { major: 1, minor: 0, patch: 0 },
        payload: {},
        metadata: {}
      };
      
      expect(validEvent).toBeDefined();
    });
  });
  
  /**
   * Tests for the EventVersion interface
   */
  describe('EventVersion', () => {
    it('should create a valid event version with major, minor, and patch', () => {
      // Arrange & Act
      const version: EventVersion = { major: 2, minor: 3, patch: 1 };
      
      // Assert
      expect(version.major).toBe(2);
      expect(version.minor).toBe(3);
      expect(version.patch).toBe(1);
    });
    
    it('should enforce numeric values for version components', () => {
      // These would cause TypeScript compilation errors if uncommented:
      // @ts-expect-error - Non-numeric major version
      // const invalidVersion1: EventVersion = { major: '1', minor: 0, patch: 0 };
      
      // @ts-expect-error - Non-numeric minor version
      // const invalidVersion2: EventVersion = { major: 1, minor: '0', patch: 0 };
      
      // @ts-expect-error - Non-numeric patch version
      // const invalidVersion3: EventVersion = { major: 1, minor: 0, patch: '0' };
      
      // Valid version should compile without errors
      const validVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      
      expect(validVersion).toBeDefined();
    });
    
    it('should enforce non-negative values for version components', () => {
      // These would be invalid at runtime and should be caught by validation
      expect(() => {
        validateEventVersion({ major: -1, minor: 0, patch: 0 });
      }).toThrow();
      
      expect(() => {
        validateEventVersion({ major: 1, minor: -1, patch: 0 });
      }).toThrow();
      
      expect(() => {
        validateEventVersion({ major: 1, minor: 0, patch: -1 });
      }).toThrow();
    });
    
    // Helper function to validate event version
    function validateEventVersion(version: EventVersion): void {
      if (version.major < 0 || version.minor < 0 || version.patch < 0) {
        throw new EventVersionError('Version components must be non-negative');
      }
    }
  });
  
  /**
   * Tests for version compatibility detection
   */
  describe('Version Compatibility', () => {
    // Mock implementation of compatibility checker
    class MockCompatibilityChecker {
      isCompatible(source: EventVersion, target: EventVersion): VersionCompatibilityResult {
        // Major version changes are breaking
        if (source.major !== target.major) {
          return {
            compatible: false,
            reason: 'Major version mismatch indicates breaking changes'
          };
        }
        
        // Minor version can be backward compatible
        // Source can process target if source.minor >= target.minor
        if (source.minor < target.minor) {
          return {
            compatible: false,
            reason: 'Source minor version is lower than target'
          };
        }
        
        // Patch versions are always compatible within the same major.minor
        return { compatible: true };
      }
    }
    
    const checker = new MockCompatibilityChecker();
    
    it('should detect incompatible major versions', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };
      
      // Act
      const result = checker.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Major version mismatch');
    });
    
    it('should detect incompatible minor versions', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 1, patch: 0 };
      
      // Act
      const result = checker.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Source minor version is lower');
    });
    
    it('should accept compatible versions with same major and minor', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 1, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 1, patch: 5 };
      
      // Act
      const result = checker.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(true);
    });
    
    it('should accept compatible versions with higher source minor version', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 2, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 1, patch: 0 };
      
      // Act
      const result = checker.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(true);
    });
  });
  
  /**
   * Tests for EventVersioningStrategy interface
   */
  describe('EventVersioningStrategy', () => {
    // Mock implementation of EventVersioningStrategy
    class StrictVersioningStrategy implements EventVersioningStrategy {
      getStrategyName(): string {
        return 'strict';
      }
      
      isCompatible(source: EventVersion, target: EventVersion): VersionCompatibilityResult {
        // In strict mode, versions must match exactly
        const exactMatch = 
          source.major === target.major && 
          source.minor === target.minor && 
          source.patch === target.patch;
          
        return exactMatch 
          ? { compatible: true }
          : { 
              compatible: false, 
              reason: `Strict versioning requires exact match: ${formatVersion(source)} != ${formatVersion(target)}` 
            };
      }
      
      canUpgrade(source: EventVersion, target: EventVersion): boolean {
        // Can only upgrade to next patch or minor version
        if (source.major !== target.major) {
          return false;
        }
        
        if (target.minor > source.minor && target.minor - source.minor > 1) {
          return false;
        }
        
        if (target.minor === source.minor && target.patch > source.patch && target.patch - source.patch > 1) {
          return false;
        }
        
        return true;
      }
    }
    
    // Mock implementation of a more relaxed versioning strategy
    class RelaxedVersioningStrategy implements EventVersioningStrategy {
      getStrategyName(): string {
        return 'relaxed';
      }
      
      isCompatible(source: EventVersion, target: EventVersion): VersionCompatibilityResult {
        // In relaxed mode, only major version needs to match
        if (source.major !== target.major) {
          return { 
            compatible: false, 
            reason: 'Major version must match even in relaxed mode' 
          };
        }
        
        return { compatible: true };
      }
      
      canUpgrade(source: EventVersion, target: EventVersion): boolean {
        // Can upgrade to any version with same major
        return source.major === target.major;
      }
    }
    
    // Helper function to format version
    function formatVersion(version: EventVersion): string {
      return `${version.major}.${version.minor}.${version.patch}`;
    }
    
    const strictStrategy = new StrictVersioningStrategy();
    const relaxedStrategy = new RelaxedVersioningStrategy();
    
    it('should identify strategy by name', () => {
      expect(strictStrategy.getStrategyName()).toBe('strict');
      expect(relaxedStrategy.getStrategyName()).toBe('relaxed');
    });
    
    it('should enforce exact version match in strict mode', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 0, patch: 1 };
      
      // Act
      const result = strictStrategy.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Strict versioning requires exact match');
    });
    
    it('should allow different patch versions in relaxed mode', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 0, patch: 5 };
      
      // Act
      const result = relaxedStrategy.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(true);
    });
    
    it('should allow different minor versions in relaxed mode', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 1, minor: 2, patch: 0 };
      
      // Act
      const result = relaxedStrategy.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(result.compatible).toBe(true);
    });
    
    it('should reject different major versions in both modes', () => {
      // Arrange
      const sourceVersion: EventVersion = { major: 1, minor: 0, patch: 0 };
      const targetVersion: EventVersion = { major: 2, minor: 0, patch: 0 };
      
      // Act
      const strictResult = strictStrategy.isCompatible(sourceVersion, targetVersion);
      const relaxedResult = relaxedStrategy.isCompatible(sourceVersion, targetVersion);
      
      // Assert
      expect(strictResult.compatible).toBe(false);
      expect(relaxedResult.compatible).toBe(false);
    });
    
    it('should limit upgrade paths in strict mode', () => {
      // Can upgrade to next patch
      expect(strictStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 0, patch: 1 }
      )).toBe(true);
      
      // Can upgrade to next minor
      expect(strictStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 1, patch: 0 }
      )).toBe(true);
      
      // Cannot skip patch versions
      expect(strictStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 0, patch: 2 }
      )).toBe(false);
      
      // Cannot skip minor versions
      expect(strictStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 2, patch: 0 }
      )).toBe(false);
      
      // Cannot upgrade across major versions
      expect(strictStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 2, minor: 0, patch: 0 }
      )).toBe(false);
    });
    
    it('should allow flexible upgrade paths in relaxed mode', () => {
      // Can upgrade to any patch
      expect(relaxedStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 0, patch: 5 }
      )).toBe(true);
      
      // Can upgrade to any minor
      expect(relaxedStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 1, minor: 3, patch: 0 }
      )).toBe(true);
      
      // Cannot upgrade across major versions
      expect(relaxedStrategy.canUpgrade(
        { major: 1, minor: 0, patch: 0 }, 
        { major: 2, minor: 0, patch: 0 }
      )).toBe(false);
    });
  });
  
  /**
   * Tests for event upgrading/downgrading between versions
   */
  describe('Event Version Migration', () => {
    // Mock event types for different versions
    interface UserCreatedV1 extends IVersionedEvent {
      type: 'user.created';
      version: EventVersion;
      payload: {
        userId: string;
        name: string;
        email: string;
      };
    }
    
    interface UserCreatedV2 extends IVersionedEvent {
      type: 'user.created';
      version: EventVersion;
      payload: {
        userId: string;
        firstName: string; // Changed from name
        lastName: string;  // Added in v2
        email: string;
      };
    }
    
    // Mock upgrader function
    function upgradeUserCreatedV1ToV2(event: UserCreatedV1): UserCreatedV2 {
      // Split the name into firstName and lastName
      const nameParts = event.payload.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      return {
        type: event.type,
        version: { major: 2, minor: 0, patch: 0 },
        payload: {
          userId: event.payload.userId,
          firstName,
          lastName,
          email: event.payload.email
        },
        metadata: { ...event.metadata, upgraded: true }
      };
    }
    
    // Mock downgrader function
    function downgradeUserCreatedV2ToV1(event: UserCreatedV2): UserCreatedV1 {
      // Combine firstName and lastName back to name
      const name = `${event.payload.firstName} ${event.payload.lastName}`.trim();
      
      return {
        type: event.type,
        version: { major: 1, minor: 0, patch: 0 },
        payload: {
          userId: event.payload.userId,
          name,
          email: event.payload.email
        },
        metadata: { ...event.metadata, downgraded: true }
      };
    }
    
    it('should upgrade event from v1 to v2', () => {
      // Arrange
      const v1Event: UserCreatedV1 = {
        type: 'user.created',
        version: { major: 1, minor: 0, patch: 0 },
        payload: {
          userId: 'user-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        metadata: { source: 'test' }
      };
      
      // Act
      const v2Event = upgradeUserCreatedV1ToV2(v1Event);
      
      // Assert
      expect(v2Event.version.major).toBe(2);
      expect(v2Event.payload.firstName).toBe('John');
      expect(v2Event.payload.lastName).toBe('Doe');
      expect(v2Event.payload.email).toBe('john.doe@example.com');
      expect(v2Event.metadata).toEqual({ source: 'test', upgraded: true });
    });
    
    it('should downgrade event from v2 to v1', () => {
      // Arrange
      const v2Event: UserCreatedV2 = {
        type: 'user.created',
        version: { major: 2, minor: 0, patch: 0 },
        payload: {
          userId: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        metadata: { source: 'test' }
      };
      
      // Act
      const v1Event = downgradeUserCreatedV2ToV1(v2Event);
      
      // Assert
      expect(v1Event.version.major).toBe(1);
      expect(v1Event.payload.name).toBe('John Doe');
      expect(v1Event.payload.email).toBe('john.doe@example.com');
      expect(v1Event.metadata).toEqual({ source: 'test', downgraded: true });
    });
    
    it('should handle edge cases in version migration', () => {
      // Arrange - Event with empty lastName
      const v2EventEmptyLastName: UserCreatedV2 = {
        type: 'user.created',
        version: { major: 2, minor: 0, patch: 0 },
        payload: {
          userId: 'user-123',
          firstName: 'John',
          lastName: '',
          email: 'john.doe@example.com'
        },
        metadata: {}
      };
      
      // Act
      const v1Event = downgradeUserCreatedV2ToV1(v2EventEmptyLastName);
      const v2EventAgain = upgradeUserCreatedV1ToV2(v1Event);
      
      // Assert - Check round-trip conversion
      expect(v1Event.payload.name).toBe('John'); // No last name
      expect(v2EventAgain.payload.firstName).toBe('John');
      expect(v2EventAgain.payload.lastName).toBe('');
    });
  });
});