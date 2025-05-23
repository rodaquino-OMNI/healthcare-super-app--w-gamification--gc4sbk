/**
 * @file transformer.spec.ts
 * @description Unit tests for the event transformer functionality that validates the system's ability
 * to convert events between different versions. Tests bidirectional transformations (upgrading and
 * downgrading), transformation pipelines for chaining multiple transformations, and field-level
 * transformations with validation.
 */

import { JourneyType } from '@austa/errors';
import {
  TransformDirection,
  TransformOptions,
  EventTransformer,
  MigrationPath,
} from '../../../src/versioning/types';
import {
  IVersionedEvent,
} from '../../../src/interfaces';
import {
  cloneEvent,
  compareVersions,
  createAddFieldsTransformer,
  createCompositeTransformer,
  createFieldTransformer,
  createRemoveFieldsTransformer,
  createRenameFieldsTransformer,
  createSchemaTransformer,
  createValidatingTransformer,
  determineTransformDirection,
  parseVersion,
  registerBidirectionalTransformer,
  registerTransformer,
  transformEvent,
  transformToLatestVersion,
  transformToVersion,
  TransformerRegistry,
  validateTransformation,
} from '../../../src/versioning/transformer';
import { IncompatibleVersionError, VersionTransformationError } from '../../../src/versioning/errors';
import { DEFAULT_TRANSFORM_OPTIONS, LATEST_VERSION } from '../../../src/versioning/constants';

// Mock event interfaces for testing
interface TestEventV1 extends IVersionedEvent {
  version: string;
  type: string;
  data: {
    id: string;
    name: string;
    count: number;
  };
  metadata?: Record<string, unknown>;
}

interface TestEventV2 extends IVersionedEvent {
  version: string;
  type: string;
  data: {
    id: string;
    name: string;
    count: number;
    tags: string[];
  };
  metadata?: Record<string, unknown>;
}

interface TestEventV3 extends IVersionedEvent {
  version: string;
  type: string;
  data: {
    id: string;
    displayName: string; // renamed from name
    count: number;
    tags: string[];
    priority: number; // new field
  };
  metadata?: Record<string, unknown>;
}

// Sample events for testing
const testEventV1: TestEventV1 = {
  version: '1.0.0',
  type: 'test.event',
  data: {
    id: '123',
    name: 'Test Event',
    count: 42,
  },
  metadata: {
    source: 'test',
  },
};

const testEventV2: TestEventV2 = {
  version: '2.0.0',
  type: 'test.event',
  data: {
    id: '123',
    name: 'Test Event',
    count: 42,
    tags: ['test', 'event'],
  },
  metadata: {
    source: 'test',
  },
};

const testEventV3: TestEventV3 = {
  version: '3.0.0',
  type: 'test.event',
  data: {
    id: '123',
    displayName: 'Test Event',
    count: 42,
    tags: ['test', 'event'],
    priority: 1,
  },
  metadata: {
    source: 'test',
  },
};

// Sample schemas for testing
const schemaV1 = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  count: { type: 'number', required: true },
};

const schemaV2 = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  count: { type: 'number', required: true },
  tags: { type: 'array', items: { type: 'string' }, default: [] },
};

const schemaV3 = {
  id: { type: 'string', required: true },
  displayName: { type: 'string', required: true },
  count: { type: 'number', required: true },
  tags: { type: 'array', items: { type: 'string' }, default: [] },
  priority: { type: 'number', default: 0 },
};

// Mock validator function for testing
const mockValidator = jest.fn((event: unknown, version: string) => true);

describe('Event Transformer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Version Utilities', () => {
    describe('parseVersion', () => {
      it('should parse a valid version string', () => {
        const result = parseVersion('1.2.3');
        expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
      });

      it('should throw an error for invalid version format', () => {
        expect(() => parseVersion('1.2')).toThrow(VersionTransformationError);
        expect(() => parseVersion('1.2.3.4')).toThrow(VersionTransformationError);
        expect(() => parseVersion('invalid')).toThrow(VersionTransformationError);
      });
    });

    describe('compareVersions', () => {
      it('should return -1 when first version is lower', () => {
        expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
        expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
        expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      });

      it('should return 0 when versions are equal', () => {
        expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      });

      it('should return 1 when first version is higher', () => {
        expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
        expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
        expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      });

      it('should compare major versions first', () => {
        expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      });

      it('should compare minor versions second', () => {
        expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
      });

      it('should compare patch versions last', () => {
        expect(compareVersions('1.1.2', '1.1.1')).toBe(1);
      });
    });

    describe('determineTransformDirection', () => {
      it('should return UPGRADE when target version is higher', () => {
        expect(determineTransformDirection('1.0.0', '2.0.0')).toBe(TransformDirection.UPGRADE);
      });

      it('should return DOWNGRADE when target version is lower', () => {
        expect(determineTransformDirection('2.0.0', '1.0.0')).toBe(TransformDirection.DOWNGRADE);
      });
    });

    describe('validateTransformation', () => {
      const upgradeOptions: TransformOptions = {
        direction: TransformDirection.UPGRADE,
        strict: true,
      };

      const downgradeOptions: TransformOptions = {
        direction: TransformDirection.DOWNGRADE,
        strict: true,
      };

      it('should not throw for valid upgrade', () => {
        expect(() => validateTransformation('1.0.0', '2.0.0', upgradeOptions)).not.toThrow();
      });

      it('should not throw for valid downgrade', () => {
        expect(() => validateTransformation('2.0.0', '1.0.0', downgradeOptions)).not.toThrow();
      });

      it('should throw for direction mismatch in strict mode', () => {
        expect(() => validateTransformation('1.0.0', '2.0.0', downgradeOptions)).toThrow(IncompatibleVersionError);
        expect(() => validateTransformation('2.0.0', '1.0.0', upgradeOptions)).toThrow(IncompatibleVersionError);
      });

      it('should include event type in error context when provided', () => {
        try {
          validateTransformation('1.0.0', '2.0.0', downgradeOptions, 'test.event');
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(IncompatibleVersionError);
          expect((error as IncompatibleVersionError).details).toHaveProperty('eventType', 'test.event');
        }
      });
    });

    describe('cloneEvent', () => {
      it('should create a deep clone of the event', () => {
        const clone = cloneEvent(testEventV1);
        expect(clone).toEqual(testEventV1);
        expect(clone).not.toBe(testEventV1);
        expect(clone.data).not.toBe(testEventV1.data);
      });

      it('should handle nested objects and arrays', () => {
        const eventWithNested = {
          ...testEventV2,
          data: {
            ...testEventV2.data,
            nested: { foo: 'bar' },
          },
        };
        const clone = cloneEvent(eventWithNested);
        expect(clone).toEqual(eventWithNested);
        expect(clone.data.nested).not.toBe(eventWithNested.data.nested);
      });
    });
  });

  describe('Basic Transformers', () => {
    describe('transformEvent', () => {
      it('should apply the transformer to the event', () => {
        const transformer: EventTransformer<TestEventV1> = (event) => {
          const transformed = cloneEvent(event);
          transformed.version = '1.1.0';
          return transformed;
        };

        const result = transformEvent(testEventV1, transformer);
        expect(result.version).toBe('1.1.0');
      });

      it('should throw for non-versioned events', () => {
        const nonVersionedEvent = { type: 'test' } as any;
        const transformer = jest.fn();

        expect(() => transformEvent(nonVersionedEvent, transformer)).toThrow(VersionTransformationError);
        expect(transformer).not.toHaveBeenCalled();
      });

      it('should throw if transformer returns non-versioned event', () => {
        const transformer = () => ({ type: 'test' } as any);
        expect(() => transformEvent(testEventV1, transformer)).toThrow(VersionTransformationError);
      });

      it('should wrap non-VersionTransformationError errors', () => {
        const transformer = () => {
          throw new Error('Test error');
        };

        try {
          transformEvent(testEventV1, transformer);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(VersionTransformationError);
          expect((error as VersionTransformationError).cause).toBeDefined();
          expect((error as VersionTransformationError).cause?.message).toBe('Test error');
        }
      });
    });

    describe('createFieldTransformer', () => {
      it('should transform specified fields', () => {
        const fieldTransformers = {
          'data.count': (value: number) => value * 2,
          'data.name': (value: string) => value.toUpperCase(),
        };

        const transformer = createFieldTransformer(fieldTransformers, '1.1.0');
        const result = transformer(testEventV1);

        expect(result.version).toBe('1.1.0');
        expect(result.data.count).toBe(84); // 42 * 2
        expect(result.data.name).toBe('TEST EVENT');
      });

      it('should skip fields that don\'t exist in the source event', () => {
        const fieldTransformers = {
          'nonexistent': () => 'should not be called',
        };

        const transformer = createFieldTransformer(fieldTransformers, '1.1.0');
        const result = transformer(testEventV1);

        expect(result).toEqual({ ...testEventV1, version: '1.1.0' });
      });

      it('should throw VersionTransformationError for field transformation errors', () => {
        const fieldTransformers = {
          'data.count': () => {
            throw new Error('Field transform error');
          },
        };

        const transformer = createFieldTransformer(fieldTransformers, '1.1.0');

        try {
          transformer(testEventV1);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(VersionTransformationError);
          expect((error as VersionTransformationError).details).toHaveProperty('field', 'data.count');
        }
      });
    });

    describe('createAddFieldsTransformer', () => {
      it('should add new fields with static values', () => {
        const newFields = {
          'data.tags': ['new', 'tags'],
          'data.timestamp': 123456789,
        };

        const transformer = createAddFieldsTransformer(newFields, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('1.1.0');
        expect(result.data.tags).toEqual(['new', 'tags']);
        expect(result.data.timestamp).toBe(123456789);
      });

      it('should add new fields with dynamic values from functions', () => {
        const newFields = {
          'data.tags': (event: TestEventV1) => [event.data.name.toLowerCase()],
          'data.timestamp': () => Date.now(),
        };

        const transformer = createAddFieldsTransformer(newFields, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('1.1.0');
        expect(result.data.tags).toEqual(['test event']);
        expect(result.data.timestamp).toBeDefined();
        expect(typeof result.data.timestamp).toBe('number');
      });

      it('should skip fields that already exist', () => {
        const newFields = {
          'data.name': 'Should not override',
          'data.newField': 'New value',
        };

        const transformer = createAddFieldsTransformer(newFields, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.data.name).toBe('Test Event'); // Original value preserved
        expect(result.data.newField).toBe('New value'); // New field added
      });

      it('should throw VersionTransformationError for field addition errors', () => {
        const newFields = {
          'data.error': () => {
            throw new Error('Field addition error');
          },
        };

        const transformer = createAddFieldsTransformer(newFields, '1.1.0');

        try {
          transformer(testEventV1);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(VersionTransformationError);
          expect((error as VersionTransformationError).details).toHaveProperty('field', 'data.error');
        }
      });
    });

    describe('createRemoveFieldsTransformer', () => {
      it('should remove specified fields', () => {
        const fieldsToRemove = ['data.name', 'metadata.source'];

        const transformer = createRemoveFieldsTransformer(fieldsToRemove, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('1.1.0');
        expect(result.data).not.toHaveProperty('name');
        expect(result.metadata).not.toHaveProperty('source');
      });

      it('should preserve fields in the PRESERVED_FIELDS list', () => {
        // Mock that 'type' is in PRESERVED_FIELDS
        const fieldsToRemove = ['type', 'data.id'];

        const transformer = createRemoveFieldsTransformer(fieldsToRemove, '1.1.0');
        const result = transformer(testEventV1);

        expect(result.type).toBe('test.event'); // Should be preserved
        expect(result.data).not.toHaveProperty('id'); // Should be removed
      });
    });

    describe('createRenameFieldsTransformer', () => {
      it('should rename fields', () => {
        const fieldMappings = {
          'data.name': 'data.displayName',
          'metadata.source': 'metadata.origin',
        };

        const transformer = createRenameFieldsTransformer(fieldMappings, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('1.1.0');
        expect(result.data).not.toHaveProperty('name');
        expect(result.data).toHaveProperty('displayName', 'Test Event');
        expect(result.metadata).not.toHaveProperty('source');
        expect(result.metadata).toHaveProperty('origin', 'test');
      });

      it('should skip fields that don\'t exist in the source', () => {
        const fieldMappings = {
          'nonexistent': 'data.newField',
          'data.name': 'data.displayName',
        };

        const transformer = createRenameFieldsTransformer(fieldMappings, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.data).not.toHaveProperty('newField');
        expect(result.data).toHaveProperty('displayName', 'Test Event');
      });

      it('should skip if target field already exists', () => {
        const eventWithBothFields = {
          ...testEventV1,
          data: {
            ...testEventV1.data,
            displayName: 'Already exists',
          },
        } as any;

        const fieldMappings = {
          'data.name': 'data.displayName',
        };

        const transformer = createRenameFieldsTransformer(fieldMappings, '1.1.0');
        const result = transformer(eventWithBothFields);

        expect(result.data).toHaveProperty('name', 'Test Event');
        expect(result.data).toHaveProperty('displayName', 'Already exists');
      });

      it('should throw VersionTransformationError for field rename errors', () => {
        // Create a special object that throws on property access
        const problematicEvent = {
          ...testEventV1,
          data: new Proxy({}, {
            get: () => {
              throw new Error('Property access error');
            },
            has: () => true,
          }),
        } as any;

        const fieldMappings = {
          'data.name': 'data.displayName',
        };

        const transformer = createRenameFieldsTransformer(fieldMappings, '1.1.0');

        try {
          transformer(problematicEvent);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(VersionTransformationError);
          expect((error as VersionTransformationError).details).toHaveProperty('field', 'data.name -> data.displayName');
        }
      });
    });
  });

  describe('Advanced Transformers', () => {
    describe('createCompositeTransformer', () => {
      it('should apply multiple transformers in sequence', () => {
        // First transformer: double the count
        const transformer1 = createFieldTransformer({
          'data.count': (value: number) => value * 2,
        }, '1.1.0');

        // Second transformer: add tags field
        const transformer2 = createAddFieldsTransformer({
          'data.tags': ['test'],
        }, '1.2.0');

        // Third transformer: rename name to displayName
        const transformer3 = createRenameFieldsTransformer({
          'data.name': 'data.displayName',
        }, '2.0.0');

        const compositeTransformer = createCompositeTransformer([
          transformer1,
          transformer2,
          transformer3,
        ]);

        const result = compositeTransformer(testEventV1) as any;

        // Should have the version from the last transformer
        expect(result.version).toBe('2.0.0');
        // Should have doubled count from first transformer
        expect(result.data.count).toBe(84);
        // Should have tags from second transformer
        expect(result.data.tags).toEqual(['test']);
        // Should have renamed name to displayName from third transformer
        expect(result.data).not.toHaveProperty('name');
        expect(result.data).toHaveProperty('displayName', 'Test Event');
      });

      it('should handle empty transformer array', () => {
        const compositeTransformer = createCompositeTransformer([]);
        const result = compositeTransformer(testEventV1);

        // Should return a clone of the original event
        expect(result).toEqual(testEventV1);
        expect(result).not.toBe(testEventV1);
      });
    });

    describe('createValidatingTransformer', () => {
      beforeEach(() => {
        mockValidator.mockReset();
      });

      it('should validate the transformed event', () => {
        mockValidator.mockReturnValue(true);

        const baseTransformer = createFieldTransformer({
          'data.count': (value: number) => value * 2,
        }, '1.1.0');

        const validatingTransformer = createValidatingTransformer(
          baseTransformer,
          mockValidator,
          '1.1.0'
        );

        const result = validatingTransformer(testEventV1);

        expect(result.version).toBe('1.1.0');
        expect(result.data.count).toBe(84);
        expect(mockValidator).toHaveBeenCalledWith(expect.objectContaining({
          version: '1.1.0',
          data: expect.objectContaining({ count: 84 }),
        }), '1.1.0');
      });

      it('should throw if validation fails', () => {
        mockValidator.mockReturnValue(false);

        const baseTransformer = createFieldTransformer({
          'data.count': (value: number) => value * 2,
        }, '1.1.0');

        const validatingTransformer = createValidatingTransformer(
          baseTransformer,
          mockValidator,
          '1.1.0'
        );

        expect(() => validatingTransformer(testEventV1)).toThrow(VersionTransformationError);
      });

      it('should skip validation if validateResult is false', () => {
        const baseTransformer = createFieldTransformer({
          'data.count': (value: number) => value * 2,
        }, '1.1.0');

        const validatingTransformer = createValidatingTransformer(
          baseTransformer,
          mockValidator,
          '1.1.0'
        );

        const options: TransformOptions = {
          ...DEFAULT_TRANSFORM_OPTIONS,
          validateResult: false,
        };

        const result = validatingTransformer(testEventV1, options);

        expect(result.version).toBe('1.1.0');
        expect(mockValidator).not.toHaveBeenCalled();
      });
    });

    describe('createSchemaTransformer', () => {
      it('should add fields present in target schema but not in source schema', () => {
        const transformer = createSchemaTransformer(schemaV1, schemaV2, '2.0.0');
        const result = transformer(testEventV1) as TestEventV2;

        expect(result.version).toBe('2.0.0');
        expect(result.data).toHaveProperty('tags');
        expect(result.data.tags).toEqual([]);
      });

      it('should remove fields present in source schema but not in target schema', () => {
        // Create a custom schema without the 'name' field
        const targetSchema = {
          id: { type: 'string', required: true },
          count: { type: 'number', required: true },
        };

        const transformer = createSchemaTransformer(schemaV1, targetSchema, '1.1.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('1.1.0');
        expect(result.data).not.toHaveProperty('name');
      });

      it('should transform fields with different types', () => {
        // Create schemas with type differences
        const sourceSchema = {
          id: { type: 'string', required: true },
          count: { type: 'string', required: true }, // string in source
        };

        const targetSchema = {
          id: { type: 'string', required: true },
          count: { type: 'number', required: true }, // number in target
        };

        // Create an event with string count
        const eventWithStringCount = {
          ...testEventV1,
          data: {
            ...testEventV1.data,
            count: '42',
          },
        } as any;

        const transformer = createSchemaTransformer(sourceSchema, targetSchema, '1.1.0');
        const result = transformer(eventWithStringCount);

        expect(result.version).toBe('1.1.0');
        expect(result.data.count).toBe(42); // Should be converted to number
        expect(typeof result.data.count).toBe('number');
      });

      it('should handle multiple transformations in one operation', () => {
        const transformer = createSchemaTransformer(schemaV1, schemaV3, '3.0.0');
        const result = transformer(testEventV1) as any;

        expect(result.version).toBe('3.0.0');
        // Added fields
        expect(result.data).toHaveProperty('tags', []);
        expect(result.data).toHaveProperty('priority', 0);
        // Renamed fields (not handled by schema transformer)
        expect(result.data).toHaveProperty('name', 'Test Event'); // Not renamed
        expect(result.data).not.toHaveProperty('displayName');
      });

      it('should create a simple version updater if no transformations needed', () => {
        // Create identical schemas
        const sourceSchema = { ...schemaV1 };
        const targetSchema = { ...schemaV1 };

        const transformer = createSchemaTransformer(sourceSchema, targetSchema, '1.1.0');
        const result = transformer(testEventV1);

        // Should only update the version
        expect(result).toEqual({
          ...testEventV1,
          version: '1.1.0',
        });
      });
    });
  });

  describe('TransformerRegistry', () => {
    let registry: TransformerRegistry;

    beforeEach(() => {
      registry = new TransformerRegistry();
    });

    describe('registerTransformer', () => {
      it('should register a transformer for a specific path', () => {
        const transformer = jest.fn();
        registry.registerTransformer('1.0.0', '2.0.0', transformer);

        const registeredTransformer = registry.getTransformer('1.0.0', '2.0.0');
        expect(registeredTransformer).toBe(transformer);
      });

      it('should register a transformer for a specific event type', () => {
        const genericTransformer = jest.fn();
        const specificTransformer = jest.fn();

        registry.registerTransformer('1.0.0', '2.0.0', genericTransformer);
        registry.registerTransformer('1.0.0', '2.0.0', specificTransformer, 'test.event');

        // Should return the specific transformer for the event type
        const registeredTransformer = registry.getTransformer('1.0.0', '2.0.0', 'test.event');
        expect(registeredTransformer).toBe(specificTransformer);

        // Should return the generic transformer for other event types
        const genericRegisteredTransformer = registry.getTransformer('1.0.0', '2.0.0', 'other.event');
        expect(genericRegisteredTransformer).toBe(genericTransformer);
      });
    });

    describe('getTransformer', () => {
      it('should return undefined for non-registered paths', () => {
        const transformer = registry.getTransformer('1.0.0', '2.0.0');
        expect(transformer).toBeUndefined();
      });

      it('should fall back to generic transformer if type-specific not found', () => {
        const genericTransformer = jest.fn();
        registry.registerTransformer('1.0.0', '2.0.0', genericTransformer);

        const transformer = registry.getTransformer('1.0.0', '2.0.0', 'test.event');
        expect(transformer).toBe(genericTransformer);
      });
    });

    describe('findMigrationPath', () => {
      it('should return a direct path if available', () => {
        const transformer = jest.fn();
        registry.registerTransformer('1.0.0', '2.0.0', transformer);

        const path = registry.findMigrationPath('1.0.0', '2.0.0');
        expect(path).toEqual(['1.0.0', '2.0.0']);
      });

      it('should return a multi-step path if direct path not available', () => {
        const transformer1 = jest.fn();
        const transformer2 = jest.fn();

        registry.registerTransformer('1.0.0', '1.5.0', transformer1);
        registry.registerTransformer('1.5.0', '2.0.0', transformer2);

        const path = registry.findMigrationPath('1.0.0', '2.0.0');
        expect(path).toEqual(['1.0.0', '1.5.0', '2.0.0']);
      });

      it('should return undefined if no path found', () => {
        const path = registry.findMigrationPath('1.0.0', '2.0.0');
        expect(path).toBeUndefined();
      });

      it('should return [version] if source and target are the same', () => {
        const path = registry.findMigrationPath('1.0.0', '1.0.0');
        expect(path).toEqual(['1.0.0']);
      });

      it('should respect event type when finding paths', () => {
        const genericTransformer = jest.fn();
        const specificTransformer = jest.fn();

        registry.registerTransformer('1.0.0', '1.5.0', genericTransformer);
        registry.registerTransformer('1.5.0', '2.0.0', genericTransformer);

        // Register a different path for a specific event type
        registry.registerTransformer('1.0.0', '2.0.0', specificTransformer, 'test.event');

        // For the specific event type, should use the direct path
        const specificPath = registry.findMigrationPath('1.0.0', '2.0.0', 'test.event');
        expect(specificPath).toEqual(['1.0.0', '2.0.0']);

        // For other event types, should use the multi-step path
        const genericPath = registry.findMigrationPath('1.0.0', '2.0.0', 'other.event');
        expect(genericPath).toEqual(['1.0.0', '1.5.0', '2.0.0']);
      });
    });

    describe('transformToVersion', () => {
      it('should transform an event to the target version', () => {
        // Create transformers for the migration path
        const transformer1to2 = createAddFieldsTransformer({
          'data.tags': ['test'],
        }, '2.0.0');

        const transformer2to3 = createCompositeTransformer([
          createRenameFieldsTransformer({
            'data.name': 'data.displayName',
          }, '3.0.0'),
          createAddFieldsTransformer({
            'data.priority': 1,
          }, '3.0.0'),
        ]);

        // Register the transformers
        registry.registerTransformer('1.0.0', '2.0.0', transformer1to2);
        registry.registerTransformer('2.0.0', '3.0.0', transformer2to3);

        // Transform from v1 to v3
        const result = registry.transformToVersion(testEventV1, '3.0.0') as any;

        expect(result.version).toBe('3.0.0');
        expect(result.data.tags).toEqual(['test']);
        expect(result.data).not.toHaveProperty('name');
        expect(result.data.displayName).toBe('Test Event');
        expect(result.data.priority).toBe(1);
      });

      it('should return a clone if already at target version', () => {
        const result = registry.transformToVersion(testEventV1, '1.0.0');

        expect(result).toEqual(testEventV1);
        expect(result).not.toBe(testEventV1);
      });

      it('should throw if no migration path found', () => {
        expect(() => registry.transformToVersion(testEventV1, '2.0.0')).toThrow(VersionTransformationError);
      });

      it('should throw if a transformer in the path is missing', () => {
        // Register only the first step
        const transformer1to2 = jest.fn();
        registry.registerTransformer('1.0.0', '1.5.0', transformer1to2);
        registry.registerTransformer('1.5.0', '2.0.0', undefined as any);

        expect(() => registry.transformToVersion(testEventV1, '2.0.0')).toThrow(VersionTransformationError);
      });

      it('should use the provided options for each transformation step', () => {
        const transformer1to2 = jest.fn((event) => ({
          ...event,
          version: '2.0.0',
        }));

        const transformer2to3 = jest.fn((event) => ({
          ...event,
          version: '3.0.0',
        }));

        registry.registerTransformer('1.0.0', '2.0.0', transformer1to2);
        registry.registerTransformer('2.0.0', '3.0.0', transformer2to3);

        const options: TransformOptions = {
          direction: TransformDirection.UPGRADE,
          validateResult: false,
        };

        registry.transformToVersion(testEventV1, '3.0.0', options);

        // First transformer should be called with UPGRADE direction
        expect(transformer1to2).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            direction: TransformDirection.UPGRADE,
            validateResult: false,
          })
        );

        // Second transformer should be called with UPGRADE direction
        expect(transformer2to3).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            direction: TransformDirection.UPGRADE,
            validateResult: false,
          })
        );
      });
    });

    describe('registerBidirectionalTransformer', () => {
      it('should register transformers for both directions', () => {
        const upgradeTransformer = jest.fn();
        const downgradeTransformer = jest.fn();

        registry.registerBidirectionalTransformer(
          '1.0.0',
          '2.0.0',
          upgradeTransformer,
          downgradeTransformer
        );

        expect(registry.getTransformer('1.0.0', '2.0.0')).toBe(upgradeTransformer);
        expect(registry.getTransformer('2.0.0', '1.0.0')).toBe(downgradeTransformer);
      });

      it('should register type-specific bidirectional transformers', () => {
        const upgradeTransformer = jest.fn();
        const downgradeTransformer = jest.fn();

        registry.registerBidirectionalTransformer(
          '1.0.0',
          '2.0.0',
          upgradeTransformer,
          downgradeTransformer,
          'test.event'
        );

        expect(registry.getTransformer('1.0.0', '2.0.0', 'test.event')).toBe(upgradeTransformer);
        expect(registry.getTransformer('2.0.0', '1.0.0', 'test.event')).toBe(downgradeTransformer);

        // Should not be available for other event types
        expect(registry.getTransformer('1.0.0', '2.0.0', 'other.event')).toBeUndefined();
      });
    });

    describe('registerMigrationPath', () => {
      it('should register multiple transformers from a migration path', () => {
        const transformer1 = jest.fn();
        const transformer2 = jest.fn();

        const migrationPath: MigrationPath[] = [
          { sourceVersion: '1.0.0', targetVersion: '1.5.0', transformer: transformer1 },
          { sourceVersion: '1.5.0', targetVersion: '2.0.0', transformer: transformer2 },
        ];

        registry.registerMigrationPath(migrationPath);

        expect(registry.getTransformer('1.0.0', '1.5.0')).toBe(transformer1);
        expect(registry.getTransformer('1.5.0', '2.0.0')).toBe(transformer2);
      });

      it('should register type-specific migration paths', () => {
        const transformer1 = jest.fn();
        const transformer2 = jest.fn();

        const migrationPath: MigrationPath[] = [
          { sourceVersion: '1.0.0', targetVersion: '1.5.0', transformer: transformer1 },
          { sourceVersion: '1.5.0', targetVersion: '2.0.0', transformer: transformer2 },
        ];

        registry.registerMigrationPath(migrationPath, 'test.event');

        expect(registry.getTransformer('1.0.0', '1.5.0', 'test.event')).toBe(transformer1);
        expect(registry.getTransformer('1.5.0', '2.0.0', 'test.event')).toBe(transformer2);

        // Should not be available for other event types
        expect(registry.getTransformer('1.0.0', '1.5.0', 'other.event')).toBeUndefined();
      });
    });

    describe('getRegisteredEventTypes', () => {
      it('should return all registered event types', () => {
        const transformer = jest.fn();

        registry.registerTransformer('1.0.0', '2.0.0', transformer);
        registry.registerTransformer('1.0.0', '2.0.0', transformer, 'test.event');
        registry.registerTransformer('1.0.0', '2.0.0', transformer, 'other.event');

        const eventTypes = registry.getRegisteredEventTypes();

        expect(eventTypes).toContain('*'); // Generic transformer
        expect(eventTypes).toContain('test.event');
        expect(eventTypes).toContain('other.event');
        expect(eventTypes.length).toBe(3);
      });
    });

    describe('getRegisteredPaths', () => {
      it('should return all registered paths', () => {
        const transformer = jest.fn();

        registry.registerTransformer('1.0.0', '2.0.0', transformer);
        registry.registerTransformer('2.0.0', '3.0.0', transformer);

        const paths = registry.getRegisteredPaths();

        expect(paths).toContainEqual({ from: '1.0.0', to: '2.0.0' });
        expect(paths).toContainEqual({ from: '2.0.0', to: '3.0.0' });
        expect(paths.length).toBe(2);
      });

      it('should filter paths by event type', () => {
        const transformer = jest.fn();

        registry.registerTransformer('1.0.0', '2.0.0', transformer);
        registry.registerTransformer('2.0.0', '3.0.0', transformer, 'test.event');

        const genericPaths = registry.getRegisteredPaths();
        expect(genericPaths.length).toBe(2);

        const specificPaths = registry.getRegisteredPaths('test.event');
        expect(specificPaths).toContainEqual({ from: '2.0.0', to: '3.0.0' });
        expect(specificPaths.length).toBe(1);
      });
    });

    describe('clear', () => {
      it('should remove all registered transformers', () => {
        const transformer = jest.fn();

        registry.registerTransformer('1.0.0', '2.0.0', transformer);
        registry.registerTransformer('2.0.0', '3.0.0', transformer, 'test.event');

        registry.clear();

        expect(registry.getTransformer('1.0.0', '2.0.0')).toBeUndefined();
        expect(registry.getTransformer('2.0.0', '3.0.0', 'test.event')).toBeUndefined();
        expect(registry.getRegisteredEventTypes().length).toBe(0);
        expect(registry.getRegisteredPaths().length).toBe(0);
      });
    });
  });

  describe('Global Functions', () => {
    // Reset the global registry before each test
    beforeEach(() => {
      // Clear the global registry
      const anyRegistry = globalTransformerRegistry as any;
      anyRegistry.clear();
    });

    describe('transformToLatestVersion', () => {
      it('should transform to the latest version using the global registry', () => {
        const transformer = jest.fn((event) => ({
          ...event,
          version: LATEST_VERSION,
        }));

        registerTransformer('1.0.0', LATEST_VERSION, transformer);

        const result = transformToLatestVersion(testEventV1);

        expect(result.version).toBe(LATEST_VERSION);
        expect(transformer).toHaveBeenCalled();
      });
    });

    describe('transformToVersion', () => {
      it('should transform to a specific version using the global registry', () => {
        const transformer = jest.fn((event) => ({
          ...event,
          version: '2.0.0',
        }));

        registerTransformer('1.0.0', '2.0.0', transformer);

        const result = transformToVersion(testEventV1, '2.0.0');

        expect(result.version).toBe('2.0.0');
        expect(transformer).toHaveBeenCalled();
      });
    });

    describe('registerTransformer', () => {
      it('should register a transformer in the global registry', () => {
        const transformer = jest.fn();

        registerTransformer('1.0.0', '2.0.0', transformer);

        // Use the global registry to transform
        try {
          transformToVersion(testEventV1, '2.0.0');
        } catch (error) {
          // Ignore errors, we just want to check if the transformer was called
        }

        expect(transformer).toHaveBeenCalled();
      });
    });

    describe('registerBidirectionalTransformer', () => {
      it('should register bidirectional transformers in the global registry', () => {
        const upgradeTransformer = jest.fn((event) => ({
          ...event,
          version: '2.0.0',
        }));

        const downgradeTransformer = jest.fn((event) => ({
          ...event,
          version: '1.0.0',
        }));

        registerBidirectionalTransformer(
          '1.0.0',
          '2.0.0',
          upgradeTransformer,
          downgradeTransformer
        );

        // Test upgrade
        const upgradedEvent = transformToVersion(testEventV1, '2.0.0');
        expect(upgradedEvent.version).toBe('2.0.0');
        expect(upgradeTransformer).toHaveBeenCalled();

        // Test downgrade
        const downgradedEvent = transformToVersion({
          ...testEventV1,
          version: '2.0.0',
        }, '1.0.0');
        expect(downgradedEvent.version).toBe('1.0.0');
        expect(downgradeTransformer).toHaveBeenCalled();
      });
    });
  });

  describe('Integration Tests', () => {
    // Reset the global registry before each test
    beforeEach(() => {
      // Clear the global registry
      const anyRegistry = globalTransformerRegistry as any;
      anyRegistry.clear();
    });

    it('should support bidirectional transformations between versions', () => {
      // Create upgrade transformer: V1 -> V2
      const upgradeV1toV2: EventTransformer<TestEventV1 | TestEventV2> = (event) => {
        const result = cloneEvent(event) as TestEventV2;
        result.version = '2.0.0';
        result.data.tags = ['test', 'event'];
        return result;
      };

      // Create downgrade transformer: V2 -> V1
      const downgradeV2toV1: EventTransformer<TestEventV2 | TestEventV1> = (event) => {
        const result = cloneEvent(event) as TestEventV1;
        result.version = '1.0.0';
        delete (result as any).data.tags;
        return result;
      };

      // Register bidirectional transformers
      registerBidirectionalTransformer(
        '1.0.0',
        '2.0.0',
        upgradeV1toV2,
        downgradeV2toV1
      );

      // Test upgrade: V1 -> V2
      const upgradedEvent = transformToVersion(testEventV1, '2.0.0') as TestEventV2;
      expect(upgradedEvent.version).toBe('2.0.0');
      expect(upgradedEvent.data.tags).toEqual(['test', 'event']);

      // Test downgrade: V2 -> V1
      const downgradedEvent = transformToVersion(upgradedEvent, '1.0.0') as TestEventV1;
      expect(downgradedEvent.version).toBe('1.0.0');
      expect((downgradedEvent as any).data.tags).toBeUndefined();
    });

    it('should support transformation pipelines with multiple steps', () => {
      // Create transformers for each step
      const v1tov2: EventTransformer = (event) => {
        const result = cloneEvent(event) as TestEventV2;
        result.version = '2.0.0';
        result.data.tags = ['test', 'event'];
        return result;
      };

      const v2tov3: EventTransformer = (event) => {
        const result = cloneEvent(event) as TestEventV3;
        result.version = '3.0.0';
        result.data.displayName = result.data.name;
        delete (result as any).data.name;
        result.data.priority = 1;
        return result;
      };

      // Register transformers
      registerTransformer('1.0.0', '2.0.0', v1tov2);
      registerTransformer('2.0.0', '3.0.0', v2tov3);

      // Transform from V1 to V3 (should use both transformers)
      const result = transformToVersion(testEventV1, '3.0.0') as TestEventV3;

      expect(result.version).toBe('3.0.0');
      expect(result.data.tags).toEqual(['test', 'event']);
      expect(result.data.displayName).toBe('Test Event');
      expect((result as any).data.name).toBeUndefined();
      expect(result.data.priority).toBe(1);
    });

    it('should validate transformed events', () => {
      // Create a validator that checks if the event has required fields
      const validator = (event: unknown, version: string): boolean => {
        if (version === '2.0.0') {
          const typedEvent = event as TestEventV2;
          return !!typedEvent.data?.tags;
        }
        return true;
      };

      // Create a transformer that doesn't add the required tags field
      const invalidTransformer: EventTransformer = (event) => {
        const result = cloneEvent(event);
        result.version = '2.0.0';
        // Deliberately not adding tags field
        return result;
      };

      // Create a validating transformer
      const validatingTransformer = createValidatingTransformer(
        invalidTransformer,
        validator,
        '2.0.0'
      );

      // Register the transformer
      registerTransformer('1.0.0', '2.0.0', validatingTransformer);

      // Should throw validation error
      expect(() => transformToVersion(testEventV1, '2.0.0')).toThrow(VersionTransformationError);

      // Create a valid transformer
      const validTransformer: EventTransformer = (event) => {
        const result = cloneEvent(event) as TestEventV2;
        result.version = '2.0.0';
        result.data.tags = ['test'];
        return result;
      };

      // Create a new validating transformer
      const newValidatingTransformer = createValidatingTransformer(
        validTransformer,
        validator,
        '2.0.0'
      );

      // Register the new transformer
      const anyRegistry = globalTransformerRegistry as any;
      anyRegistry.clear();
      registerTransformer('1.0.0', '2.0.0', newValidatingTransformer);

      // Should pass validation
      const result = transformToVersion(testEventV1, '2.0.0') as TestEventV2;
      expect(result.version).toBe('2.0.0');
      expect(result.data.tags).toEqual(['test']);
    });

    it('should handle automated transformations based on schema differences', () => {
      // Create schema-based transformers
      const v1tov2Transformer = createSchemaTransformer(schemaV1, schemaV2, '2.0.0');
      const v2tov3Transformer = createCompositeTransformer([
        createSchemaTransformer(schemaV2, schemaV3, '3.0.0'),
        createRenameFieldsTransformer({
          'data.name': 'data.displayName',
        }, '3.0.0'),
      ]);

      // Register transformers
      registerTransformer('1.0.0', '2.0.0', v1tov2Transformer);
      registerTransformer('2.0.0', '3.0.0', v2tov3Transformer);

      // Transform from V1 to V3
      const result = transformToVersion(testEventV1, '3.0.0') as any;

      expect(result.version).toBe('3.0.0');
      expect(result.data.tags).toEqual([]);
      expect(result.data.priority).toBe(0);
      expect(result.data).not.toHaveProperty('name');
      expect(result.data.displayName).toBe('Test Event');
    });
  });
});