import { describe, it, expect, jest } from '@jest/globals';
import {
  VersioningError,
  VersionDetectionError,
  IncompatibleVersionError,
  MigrationError,
  TransformationError,
  VersionNotSupportedError,
  SchemaValidationError
} from '../../../src/versioning/errors';

describe('Versioning Error Classes', () => {
  describe('VersioningError', () => {
    it('should be an instance of Error', () => {
      const error = new VersioningError('Test error message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have the correct name', () => {
      const error = new VersioningError('Test error message');
      expect(error.name).toBe('VersioningError');
    });

    it('should contain the provided message', () => {
      const message = 'Test error message';
      const error = new VersioningError(message);
      expect(error.message).toBe(message);
    });

    it('should capture stack trace', () => {
      const error = new VersioningError('Test error message');
      expect(error.stack).toBeDefined();
    });

    it('should include context data when provided', () => {
      const context = { eventType: 'test-event', version: '1.0.0' };
      const error = new VersioningError('Test error message', context);
      expect(error.context).toEqual(context);
    });

    it('should have undefined context when not provided', () => {
      const error = new VersioningError('Test error message');
      expect(error.context).toBeUndefined();
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new VersioningError('Test error message', undefined, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('VersionDetectionError', () => {
    it('should extend VersioningError', () => {
      const error = new VersionDetectionError('Failed to detect version');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new VersionDetectionError('Failed to detect version');
      expect(error.name).toBe('VersionDetectionError');
    });

    it('should include event data in context', () => {
      const eventData = { type: 'user-registered', payload: {} };
      const error = new VersionDetectionError('Failed to detect version', { eventData });
      expect(error.context).toHaveProperty('eventData', eventData);
    });

    it('should include detection strategy in context when provided', () => {
      const strategy = 'explicit-field';
      const error = new VersionDetectionError('Failed to detect version', { strategy });
      expect(error.context).toHaveProperty('strategy', strategy);
    });
  });

  describe('IncompatibleVersionError', () => {
    it('should extend VersioningError', () => {
      const error = new IncompatibleVersionError('Incompatible version');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new IncompatibleVersionError('Incompatible version');
      expect(error.name).toBe('IncompatibleVersionError');
    });

    it('should include source and target versions in context', () => {
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const error = new IncompatibleVersionError(
        'Incompatible version',
        { sourceVersion, targetVersion }
      );
      expect(error.context).toHaveProperty('sourceVersion', sourceVersion);
      expect(error.context).toHaveProperty('targetVersion', targetVersion);
    });

    it('should include compatibility mode in context when provided', () => {
      const mode = 'strict';
      const error = new IncompatibleVersionError('Incompatible version', { mode });
      expect(error.context).toHaveProperty('mode', mode);
    });
  });

  describe('MigrationError', () => {
    it('should extend VersioningError', () => {
      const error = new MigrationError('Migration failed');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new MigrationError('Migration failed');
      expect(error.name).toBe('MigrationError');
    });

    it('should include source and target versions in context', () => {
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const error = new MigrationError(
        'Migration failed',
        { sourceVersion, targetVersion }
      );
      expect(error.context).toHaveProperty('sourceVersion', sourceVersion);
      expect(error.context).toHaveProperty('targetVersion', targetVersion);
    });

    it('should include migration path in context when provided', () => {
      const migrationPath = ['1.0.0', '1.5.0', '2.0.0'];
      const error = new MigrationError('Migration failed', { migrationPath });
      expect(error.context).toHaveProperty('migrationPath', migrationPath);
    });

    it('should include step information in context when provided', () => {
      const currentStep = 2;
      const totalSteps = 3;
      const error = new MigrationError(
        'Migration failed',
        { currentStep, totalSteps }
      );
      expect(error.context).toHaveProperty('currentStep', currentStep);
      expect(error.context).toHaveProperty('totalSteps', totalSteps);
    });
  });

  describe('TransformationError', () => {
    it('should extend VersioningError', () => {
      const error = new TransformationError('Transformation failed');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new TransformationError('Transformation failed');
      expect(error.name).toBe('TransformationError');
    });

    it('should include source and target versions in context', () => {
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const error = new TransformationError(
        'Transformation failed',
        { sourceVersion, targetVersion }
      );
      expect(error.context).toHaveProperty('sourceVersion', sourceVersion);
      expect(error.context).toHaveProperty('targetVersion', targetVersion);
    });

    it('should include field information in context when provided', () => {
      const field = 'user.address';
      const error = new TransformationError('Transformation failed', { field });
      expect(error.context).toHaveProperty('field', field);
    });

    it('should include transformation direction in context when provided', () => {
      const direction = 'upgrade';
      const error = new TransformationError('Transformation failed', { direction });
      expect(error.context).toHaveProperty('direction', direction);
    });
  });

  describe('VersionNotSupportedError', () => {
    it('should extend VersioningError', () => {
      const error = new VersionNotSupportedError('Version not supported');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new VersionNotSupportedError('Version not supported');
      expect(error.name).toBe('VersionNotSupportedError');
    });

    it('should include version in context', () => {
      const version = '0.5.0';
      const error = new VersionNotSupportedError(
        'Version not supported',
        { version }
      );
      expect(error.context).toHaveProperty('version', version);
    });

    it('should include supported version range in context when provided', () => {
      const minVersion = '1.0.0';
      const maxVersion = '2.0.0';
      const error = new VersionNotSupportedError(
        'Version not supported',
        { minVersion, maxVersion }
      );
      expect(error.context).toHaveProperty('minVersion', minVersion);
      expect(error.context).toHaveProperty('maxVersion', maxVersion);
    });
  });

  describe('SchemaValidationError', () => {
    it('should extend VersioningError', () => {
      const error = new SchemaValidationError('Schema validation failed');
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should have the correct name', () => {
      const error = new SchemaValidationError('Schema validation failed');
      expect(error.name).toBe('SchemaValidationError');
    });

    it('should include version in context', () => {
      const version = '1.0.0';
      const error = new SchemaValidationError(
        'Schema validation failed',
        { version }
      );
      expect(error.context).toHaveProperty('version', version);
    });

    it('should include validation errors in context when provided', () => {
      const validationErrors = [
        { path: 'user.name', message: 'Required field missing' },
        { path: 'user.email', message: 'Invalid email format' }
      ];
      const error = new SchemaValidationError(
        'Schema validation failed',
        { validationErrors }
      );
      expect(error.context).toHaveProperty('validationErrors', validationErrors);
    });
  });

  describe('Error serialization and deserialization', () => {
    it('should properly serialize error to JSON', () => {
      const context = { eventType: 'test-event', version: '1.0.0' };
      const error = new VersioningError('Test error message', context);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('name', 'VersioningError');
      expect(serialized).toHaveProperty('message', 'Test error message');
      expect(serialized).toHaveProperty('context', context);
    });

    it('should include stack trace in serialized error when includeStack is true', () => {
      const error = new VersioningError('Test error message');
      const serialized = error.toJSON(true);
      
      expect(serialized).toHaveProperty('stack');
      expect(typeof serialized.stack).toBe('string');
    });

    it('should not include stack trace in serialized error by default', () => {
      const error = new VersioningError('Test error message');
      const serialized = error.toJSON();
      
      expect(serialized).not.toHaveProperty('stack');
    });

    it('should recreate error from serialized data', () => {
      const context = { eventType: 'test-event', version: '1.0.0' };
      const originalError = new VersioningError('Test error message', context);
      const serialized = originalError.toJSON(true);
      
      // Assuming there's a static fromJSON method
      const recreatedError = VersioningError.fromJSON(serialized);
      
      expect(recreatedError).toBeInstanceOf(VersioningError);
      expect(recreatedError.name).toBe('VersioningError');
      expect(recreatedError.message).toBe('Test error message');
      expect(recreatedError.context).toEqual(context);
    });

    it('should recreate specific error types from serialized data', () => {
      const context = { sourceVersion: '1.0.0', targetVersion: '2.0.0' };
      const originalError = new IncompatibleVersionError('Incompatible version', context);
      const serialized = originalError.toJSON();
      
      // Assuming there's a static fromJSON method in the base class
      const recreatedError = VersioningError.fromJSON(serialized);
      
      expect(recreatedError).toBeInstanceOf(IncompatibleVersionError);
      expect(recreatedError.name).toBe('IncompatibleVersionError');
      expect(recreatedError.context).toEqual(context);
    });
  });

  describe('Integration with global error handling', () => {
    it('should be compatible with global error classification system', () => {
      // Assuming there's a global error classifier
      const mockClassifier = {
        classify: jest.fn().mockReturnValue('versioning')
      };
      
      const error = new VersioningError('Test error message');
      const classification = mockClassifier.classify(error);
      
      expect(classification).toBe('versioning');
      expect(mockClassifier.classify).toHaveBeenCalledWith(error);
    });

    it('should provide journey context when available', () => {
      const journeyContext = { journey: 'health', userId: '123' };
      const error = new VersioningError('Test error message', { journeyContext });
      
      expect(error.context).toHaveProperty('journeyContext', journeyContext);
    });

    it('should support error aggregation', () => {
      const childErrors = [
        new SchemaValidationError('Field validation failed', { field: 'name' }),
        new SchemaValidationError('Field validation failed', { field: 'email' })
      ];
      
      const aggregateError = new MigrationError(
        'Multiple validation errors',
        { childErrors }
      );
      
      expect(aggregateError.context).toHaveProperty('childErrors');
      expect(aggregateError.context.childErrors).toHaveLength(2);
      expect(aggregateError.context.childErrors[0]).toBeInstanceOf(SchemaValidationError);
    });
  });
});