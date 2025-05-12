import { describe, expect, it, jest } from '@jest/globals';
import { BaseError, ErrorCategory, ErrorType } from '@austa/errors';

import {
  VersioningError,
  VersionDetectionError,
  VersionCompatibilityError,
  MigrationError,
  TransformationError,
  VersioningErrorCode,
  VersioningErrorContext,
  createVersioningError
} from '../../../src/versioning/errors';

/**
 * Test suite for the versioning error classes
 * Validates proper error classification, construction, and serialization
 */
describe('Versioning Errors', () => {
  // Sample error data for testing
  const errorMessage = 'Test versioning error';
  const eventId = 'event-123';
  const eventType = 'health.metrics.recorded';
  const sourceVersion = '1.0.0';
  const targetVersion = '2.0.0';
  const journeyType = 'health';
  
  // Sample context data for testing
  const errorContext: VersioningErrorContext = {
    eventId,
    eventType,
    sourceVersion,
    targetVersion,
    journeyType
  };

  describe('VersioningError (Base Class)', () => {
    it('should create a VersioningError with all required properties', () => {
      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage,
        errorContext
      );

      // Verify all properties are set correctly
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(VersioningErrorCode.VERSION_DETECTION_FAILED);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.category).toBe(ErrorCategory.VERSIONING);
      expect(error.context).toEqual(expect.objectContaining(errorContext));
      expect(error.name).toBe('VersioningError');
    });

    it('should properly extend BaseError class', () => {
      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof VersioningError).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage
      );

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack.includes('VersioningError')).toBe(true);
    });

    it('should include cause error when provided', () => {
      const causeError = new Error('Original error');
      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage,
        errorContext,
        causeError
      );

      expect(error.cause).toBe(causeError);
    });

    it('should serialize to JSON with all properties', () => {
      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage,
        errorContext
      );

      const json = error.toJSON();

      // Verify JSON structure
      expect(json.error).toBeDefined();
      expect(json.error.type).toBe(ErrorType.TECHNICAL);
      expect(json.error.category).toBe(ErrorCategory.VERSIONING);
      expect(json.error.code).toBe(VersioningErrorCode.VERSION_DETECTION_FAILED);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.context).toEqual(expect.objectContaining({
        eventId,
        eventType,
        sourceVersion,
        targetVersion,
        journeyType
      }));
    });
  });

  describe('VersionDetectionError', () => {
    it('should create a VersionDetectionError with default code', () => {
      const error = new VersionDetectionError(errorMessage, errorContext);

      expect(error.code).toBe(VersioningErrorCode.VERSION_DETECTION_FAILED);
      expect(error.name).toBe('VersionDetectionError');
      expect(error instanceof VersionDetectionError).toBe(true);
      expect(error instanceof VersioningError).toBe(true);
    });

    it('should create a VersionDetectionError with custom code', () => {
      const error = new VersionDetectionError(
        errorMessage,
        errorContext,
        undefined,
        VersioningErrorCode.VERSION_FIELD_MISSING
      );

      expect(error.code).toBe(VersioningErrorCode.VERSION_FIELD_MISSING);
    });

    it('should create error for missing version field', () => {
      const fieldName = 'version';
      const error = VersionDetectionError.fieldMissing(fieldName, eventId, eventType);

      expect(error.code).toBe(VersioningErrorCode.VERSION_FIELD_MISSING);
      expect(error.message).toContain(fieldName);
      expect(error.context.fieldName).toBe(fieldName);
      expect(error.context.eventId).toBe(eventId);
      expect(error.context.eventType).toBe(eventType);
    });

    it('should create error for invalid version format', () => {
      const invalidVersion = 'invalid-version';
      const error = VersionDetectionError.invalidFormat(invalidVersion, eventId, eventType);

      expect(error.code).toBe(VersioningErrorCode.VERSION_FORMAT_INVALID);
      expect(error.message).toContain(invalidVersion);
      expect(error.context.sourceVersion).toBe(invalidVersion);
      expect(error.context.eventId).toBe(eventId);
      expect(error.context.eventType).toBe(eventType);
    });
  });

  describe('VersionCompatibilityError', () => {
    it('should create a VersionCompatibilityError with default code', () => {
      const error = new VersionCompatibilityError(errorMessage, errorContext);

      expect(error.code).toBe(VersioningErrorCode.VERSION_INCOMPATIBLE);
      expect(error.name).toBe('VersionCompatibilityError');
      expect(error instanceof VersionCompatibilityError).toBe(true);
      expect(error instanceof VersioningError).toBe(true);
    });

    it('should create a VersionCompatibilityError with custom code', () => {
      const error = new VersionCompatibilityError(
        errorMessage,
        errorContext,
        undefined,
        VersioningErrorCode.VERSION_UNSUPPORTED
      );

      expect(error.code).toBe(VersioningErrorCode.VERSION_UNSUPPORTED);
    });

    it('should create error for unsupported version', () => {
      const supportedVersions = ['1.0.0', '1.1.0', '2.0.0'];
      const error = VersionCompatibilityError.unsupported(sourceVersion, supportedVersions, eventId);

      expect(error.code).toBe(VersioningErrorCode.VERSION_UNSUPPORTED);
      expect(error.message).toContain(sourceVersion);
      expect(error.message).toContain(supportedVersions.join(', '));
      expect(error.context.sourceVersion).toBe(sourceVersion);
      expect(error.context.eventId).toBe(eventId);
    });

    it('should create error for version too old', () => {
      const oldVersion = '0.5.0';
      const minVersion = '1.0.0';
      const error = VersionCompatibilityError.tooOld(oldVersion, minVersion, eventId);

      expect(error.code).toBe(VersioningErrorCode.VERSION_TOO_OLD);
      expect(error.message).toContain(oldVersion);
      expect(error.message).toContain(minVersion);
      expect(error.context.sourceVersion).toBe(oldVersion);
      expect(error.context.targetVersion).toBe(minVersion);
      expect(error.context.eventId).toBe(eventId);
    });

    it('should create error for version too new', () => {
      const newVersion = '3.0.0';
      const maxVersion = '2.0.0';
      const error = VersionCompatibilityError.tooNew(newVersion, maxVersion, eventId);

      expect(error.code).toBe(VersioningErrorCode.VERSION_TOO_NEW);
      expect(error.message).toContain(newVersion);
      expect(error.message).toContain(maxVersion);
      expect(error.context.sourceVersion).toBe(newVersion);
      expect(error.context.targetVersion).toBe(maxVersion);
      expect(error.context.eventId).toBe(eventId);
    });
  });

  describe('MigrationError', () => {
    it('should create a MigrationError with default code', () => {
      const error = new MigrationError(errorMessage, errorContext);

      expect(error.code).toBe(VersioningErrorCode.MIGRATION_FAILED);
      expect(error.name).toBe('MigrationError');
      expect(error instanceof MigrationError).toBe(true);
      expect(error instanceof VersioningError).toBe(true);
    });

    it('should create a MigrationError with custom code', () => {
      const error = new MigrationError(
        errorMessage,
        errorContext,
        undefined,
        VersioningErrorCode.MIGRATION_PATH_NOT_FOUND
      );

      expect(error.code).toBe(VersioningErrorCode.MIGRATION_PATH_NOT_FOUND);
    });

    it('should create error for missing migration path', () => {
      const error = MigrationError.pathNotFound(sourceVersion, targetVersion, eventType);

      expect(error.code).toBe(VersioningErrorCode.MIGRATION_PATH_NOT_FOUND);
      expect(error.message).toContain(sourceVersion);
      expect(error.message).toContain(targetVersion);
      expect(error.message).toContain(eventType);
      expect(error.context.sourceVersion).toBe(sourceVersion);
      expect(error.context.targetVersion).toBe(targetVersion);
      expect(error.context.eventType).toBe(eventType);
    });

    it('should create error for failed validation after migration', () => {
      const validationErrors = ['Field x is required', 'Field y must be a number'];
      const error = MigrationError.validationFailed(sourceVersion, targetVersion, validationErrors, eventId);

      expect(error.code).toBe(VersioningErrorCode.MIGRATION_VALIDATION_FAILED);
      expect(error.message).toContain(sourceVersion);
      expect(error.message).toContain(targetVersion);
      validationErrors.forEach(validationError => {
        expect(error.message).toContain(validationError);
      });
      expect(error.context.sourceVersion).toBe(sourceVersion);
      expect(error.context.targetVersion).toBe(targetVersion);
      expect(error.context.eventId).toBe(eventId);
      expect(error.context.validationErrors).toEqual(validationErrors);
    });
  });

  describe('TransformationError', () => {
    it('should create a TransformationError with default code', () => {
      const error = new TransformationError(errorMessage, errorContext);

      expect(error.code).toBe(VersioningErrorCode.TRANSFORMATION_FAILED);
      expect(error.name).toBe('TransformationError');
      expect(error instanceof TransformationError).toBe(true);
      expect(error instanceof VersioningError).toBe(true);
    });

    it('should create a TransformationError with custom code', () => {
      const error = new TransformationError(
        errorMessage,
        errorContext,
        undefined,
        VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID
      );

      expect(error.code).toBe(VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID);
    });

    it('should create error for invalid schema during transformation', () => {
      const schemaPath = 'data.metrics[0].value';
      const reason = 'Expected number, got string';
      const error = TransformationError.schemaInvalid(schemaPath, reason, eventId);

      expect(error.code).toBe(VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID);
      expect(error.message).toContain(schemaPath);
      expect(error.message).toContain(reason);
      expect(error.context.schemaPath).toBe(schemaPath);
      expect(error.context.eventId).toBe(eventId);
    });

    it('should create error for missing required field during transformation', () => {
      const fieldName = 'timestamp';
      const error = TransformationError.fieldMissing(fieldName, sourceVersion, targetVersion, eventId);

      expect(error.code).toBe(VersioningErrorCode.TRANSFORMATION_FIELD_MISSING);
      expect(error.message).toContain(fieldName);
      expect(error.message).toContain(sourceVersion);
      expect(error.message).toContain(targetVersion);
      expect(error.context.fieldName).toBe(fieldName);
      expect(error.context.sourceVersion).toBe(sourceVersion);
      expect(error.context.targetVersion).toBe(targetVersion);
      expect(error.context.eventId).toBe(eventId);
    });

    it('should create error for a specific transformation step failure', () => {
      const step = 'normalizeMetrics';
      const reason = 'Invalid metric unit';
      const error = TransformationError.stepFailed(step, sourceVersion, targetVersion, reason, eventId);

      expect(error.code).toBe(VersioningErrorCode.TRANSFORMATION_FAILED);
      expect(error.message).toContain(step);
      expect(error.message).toContain(sourceVersion);
      expect(error.message).toContain(targetVersion);
      expect(error.message).toContain(reason);
      expect(error.context.transformationStep).toBe(step);
      expect(error.context.sourceVersion).toBe(sourceVersion);
      expect(error.context.targetVersion).toBe(targetVersion);
      expect(error.context.eventId).toBe(eventId);
    });
  });

  describe('createVersioningError Factory Function', () => {
    it('should create VersionDetectionError for detection error codes', () => {
      const codes = [
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        VersioningErrorCode.VERSION_FIELD_MISSING,
        VersioningErrorCode.VERSION_FORMAT_INVALID
      ];

      codes.forEach(code => {
        const error = createVersioningError(code, errorMessage, errorContext);
        expect(error instanceof VersionDetectionError).toBe(true);
        expect(error.code).toBe(code);
      });
    });

    it('should create VersionCompatibilityError for compatibility error codes', () => {
      const codes = [
        VersioningErrorCode.VERSION_INCOMPATIBLE,
        VersioningErrorCode.VERSION_UNSUPPORTED,
        VersioningErrorCode.VERSION_TOO_OLD,
        VersioningErrorCode.VERSION_TOO_NEW
      ];

      codes.forEach(code => {
        const error = createVersioningError(code, errorMessage, errorContext);
        expect(error instanceof VersionCompatibilityError).toBe(true);
        expect(error.code).toBe(code);
      });
    });

    it('should create MigrationError for migration error codes', () => {
      const codes = [
        VersioningErrorCode.MIGRATION_PATH_NOT_FOUND,
        VersioningErrorCode.MIGRATION_FAILED,
        VersioningErrorCode.MIGRATION_VALIDATION_FAILED
      ];

      codes.forEach(code => {
        const error = createVersioningError(code, errorMessage, errorContext);
        expect(error instanceof MigrationError).toBe(true);
        expect(error.code).toBe(code);
      });
    });

    it('should create TransformationError for transformation error codes', () => {
      const codes = [
        VersioningErrorCode.TRANSFORMATION_FAILED,
        VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID,
        VersioningErrorCode.TRANSFORMATION_FIELD_MISSING
      ];

      codes.forEach(code => {
        const error = createVersioningError(code, errorMessage, errorContext);
        expect(error instanceof TransformationError).toBe(true);
        expect(error.code).toBe(code);
      });
    });

    it('should include cause error when provided', () => {
      const causeError = new Error('Original error');
      const error = createVersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage,
        errorContext,
        causeError
      );

      expect(error.cause).toBe(causeError);
    });
  });

  describe('Error Integration with Global Error Framework', () => {
    it('should set correct error category for all versioning errors', () => {
      const errors = [
        new VersioningError(VersioningErrorCode.VERSION_DETECTION_FAILED, errorMessage),
        new VersionDetectionError(errorMessage),
        new VersionCompatibilityError(errorMessage),
        new MigrationError(errorMessage),
        new TransformationError(errorMessage)
      ];

      errors.forEach(error => {
        expect(error.category).toBe(ErrorCategory.VERSIONING);
      });
    });

    it('should set correct error type for all versioning errors', () => {
      const errors = [
        new VersioningError(VersioningErrorCode.VERSION_DETECTION_FAILED, errorMessage),
        new VersionDetectionError(errorMessage),
        new VersionCompatibilityError(errorMessage),
        new MigrationError(errorMessage),
        new TransformationError(errorMessage)
      ];

      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
      });
    });

    it('should set default HTTP status code for all versioning errors', () => {
      const error = new VersioningError(VersioningErrorCode.VERSION_DETECTION_FAILED, errorMessage);
      
      // Convert to HTTP exception and check status code
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(400); // Default status code for versioning errors
    });

    it('should include journey context in error context when provided', () => {
      const journeyContext: VersioningErrorContext = {
        eventId,
        eventType,
        sourceVersion,
        targetVersion,
        journeyType: 'health'
      };

      const error = new VersioningError(
        VersioningErrorCode.VERSION_DETECTION_FAILED,
        errorMessage,
        journeyContext
      );

      expect(error.context.journeyType).toBe('health');
      
      // Verify journey context is included in serialized output
      const json = error.toJSON();
      expect(json.error.context.journeyType).toBe('health');
    });
  });
});