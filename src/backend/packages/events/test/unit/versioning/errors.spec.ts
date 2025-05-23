/**
 * @file errors.spec.ts
 * @description Unit tests for versioning error classes
 */

import { BaseError, ErrorType, JourneyType } from '@austa/errors';
import {
  VersioningError,
  VersionDetectionError,
  IncompatibleVersionError,
  VersionMigrationError,
  VersionTransformationError,
  VERSIONING_ERROR_CODES
} from '../../../src/versioning/errors';

describe('Versioning Errors', () => {
  describe('VersioningError', () => {
    it('should extend BaseError', () => {
      const error = new VersioningError(
        'Test error',
        VERSIONING_ERROR_CODES.DETECTION_FAILED
      );
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(VersioningError);
    });

    it('should set correct error properties', () => {
      const message = 'Custom error message';
      const code = VERSIONING_ERROR_CODES.DETECTION_FAILED;
      const details = { eventId: '123' };
      const journey = JourneyType.HEALTH;
      const cause = new Error('Original error');

      const error = new VersioningError(message, code, details, journey, cause);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
      expect(error.context.journey).toBe(journey);
      expect(error.context.component).toBe('event-versioning');
      expect(error.context.isTransient).toBe(false);
    });

    it('should serialize to JSON correctly', () => {
      const message = 'Test error';
      const code = VERSIONING_ERROR_CODES.DETECTION_FAILED;
      const details = { eventId: '123' };
      const journey = JourneyType.HEALTH;

      const error = new VersioningError(message, code, details, journey);
      const json = error.toJSON();

      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('code', code);
      expect(json.error).toHaveProperty('message', message);
      expect(json.error).toHaveProperty('details', details);
      expect(json.error).toHaveProperty('journey', journey);
      expect(json.error).toHaveProperty('timestamp');
    });
  });

  describe('VersionDetectionError', () => {
    it('should extend VersioningError', () => {
      const error = new VersionDetectionError();
      
      expect(error).toBeInstanceOf(VersioningError);
      expect(error).toBeInstanceOf(VersionDetectionError);
    });

    it('should use default message if not provided', () => {
      const error = new VersionDetectionError();
      
      expect(error.message).toBe('Failed to detect event version');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.DETECTION_FAILED);
    });

    it('should accept custom message and details', () => {
      const message = 'Custom detection error';
      const details = { eventType: 'HealthMetricRecorded' };
      const journey = JourneyType.HEALTH;

      const error = new VersionDetectionError(message, details, journey);
      
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.context.journey).toBe(journey);
    });

    it('should create missingVersion error correctly', () => {
      const eventId = 'event-123';
      const journey = JourneyType.CARE;

      const error = VersionDetectionError.missingVersion(eventId, journey);
      
      expect(error).toBeInstanceOf(VersionDetectionError);
      expect(error.message).toBe('Missing version information in the event');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.DETECTION_FAILED);
      expect(error.details).toEqual({ eventId });
      expect(error.context.journey).toBe(journey);
    });

    it('should create invalidFormat error correctly', () => {
      const version = '1.x';
      const expectedFormat = 'major.minor.patch';
      const journey = JourneyType.PLAN;

      const error = VersionDetectionError.invalidFormat(version, expectedFormat, journey);
      
      expect(error).toBeInstanceOf(VersionDetectionError);
      expect(error.message).toBe('Invalid version format');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.DETECTION_FAILED);
      expect(error.details).toEqual({ version, expectedFormat });
      expect(error.context.journey).toBe(journey);
    });
  });

  describe('IncompatibleVersionError', () => {
    it('should extend VersioningError', () => {
      const error = new IncompatibleVersionError();
      
      expect(error).toBeInstanceOf(VersioningError);
      expect(error).toBeInstanceOf(IncompatibleVersionError);
    });

    it('should use default message if not provided', () => {
      const error = new IncompatibleVersionError();
      
      expect(error.message).toBe('Event version is not compatible with the expected version');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION);
    });

    it('should accept custom message and details', () => {
      const message = 'Custom incompatibility error';
      const details = { actualVersion: '1.0.0', expectedVersion: '2.0.0' };
      const journey = JourneyType.HEALTH;

      const error = new IncompatibleVersionError(message, details, journey);
      
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.context.journey).toBe(journey);
    });

    it('should create unsupportedVersion error correctly', () => {
      const version = '1.0.0';
      const supportedVersions = ['2.0.0', '3.0.0'];
      const journey = JourneyType.GAMIFICATION;

      const error = IncompatibleVersionError.unsupportedVersion(version, supportedVersions, journey);
      
      expect(error).toBeInstanceOf(IncompatibleVersionError);
      expect(error.message).toBe('Event version is not supported');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION);
      expect(error.details).toEqual({ version, supportedVersions });
      expect(error.context.journey).toBe(journey);
    });

    it('should create versionMismatch error correctly', () => {
      const actualVersion = '1.0.0';
      const expectedVersion = '2.0.0';
      const eventType = 'HealthMetricRecorded';
      const journey = JourneyType.HEALTH;

      const error = IncompatibleVersionError.versionMismatch(
        actualVersion,
        expectedVersion,
        eventType,
        journey
      );
      
      expect(error).toBeInstanceOf(IncompatibleVersionError);
      expect(error.message).toBe(
        `Event version mismatch: expected ${expectedVersion} but got ${actualVersion} for event type ${eventType}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION);
      expect(error.details).toEqual({ actualVersion, expectedVersion, eventType });
      expect(error.context.journey).toBe(journey);
    });
  });

  describe('VersionMigrationError', () => {
    it('should extend VersioningError', () => {
      const error = new VersionMigrationError();
      
      expect(error).toBeInstanceOf(VersioningError);
      expect(error).toBeInstanceOf(VersionMigrationError);
    });

    it('should use default message if not provided', () => {
      const error = new VersionMigrationError();
      
      expect(error.message).toBe('Failed to migrate event between versions');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.MIGRATION_FAILED);
    });

    it('should accept custom message and details', () => {
      const message = 'Custom migration error';
      const details = { fromVersion: '1.0.0', toVersion: '2.0.0' };
      const journey = JourneyType.CARE;

      const error = new VersionMigrationError(message, details, journey);
      
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.context.journey).toBe(journey);
    });

    it('should create noMigrationPath error correctly', () => {
      const fromVersion = '1.0.0';
      const toVersion = '3.0.0';
      const eventType = 'AppointmentBooked';
      const journey = JourneyType.CARE;

      const error = VersionMigrationError.noMigrationPath(
        fromVersion,
        toVersion,
        eventType,
        journey
      );
      
      expect(error).toBeInstanceOf(VersionMigrationError);
      expect(error.message).toBe(
        `No migration path found from version ${fromVersion} to ${toVersion} for event type ${eventType}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.MIGRATION_FAILED);
      expect(error.details).toEqual({ fromVersion, toVersion, eventType });
      expect(error.context.journey).toBe(journey);
    });

    it('should create validationFailed error correctly', () => {
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const validationErrors = [
        { field: 'timestamp', message: 'Invalid date format' },
        { field: 'userId', message: 'Required field missing' }
      ];
      const journey = JourneyType.PLAN;

      const error = VersionMigrationError.validationFailed(
        fromVersion,
        toVersion,
        validationErrors,
        journey
      );
      
      expect(error).toBeInstanceOf(VersionMigrationError);
      expect(error.message).toBe(
        `Validation failed after migrating from version ${fromVersion} to ${toVersion}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.MIGRATION_FAILED);
      expect(error.details).toEqual({ fromVersion, toVersion, validationErrors });
      expect(error.context.journey).toBe(journey);
    });

    it('should create downgradeNotAllowed error correctly', () => {
      const fromVersion = '2.0.0';
      const toVersion = '1.0.0';
      const eventType = 'ClaimSubmitted';
      const journey = JourneyType.PLAN;

      const error = VersionMigrationError.downgradeNotAllowed(
        fromVersion,
        toVersion,
        eventType,
        journey
      );
      
      expect(error).toBeInstanceOf(VersionMigrationError);
      expect(error.message).toBe('Version downgrade is not allowed');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.MIGRATION_FAILED);
      expect(error.details).toEqual({ fromVersion, toVersion, eventType });
      expect(error.context.journey).toBe(journey);
    });
  });

  describe('VersionTransformationError', () => {
    it('should extend VersioningError', () => {
      const error = new VersionTransformationError();
      
      expect(error).toBeInstanceOf(VersioningError);
      expect(error).toBeInstanceOf(VersionTransformationError);
    });

    it('should use default message if not provided', () => {
      const error = new VersionTransformationError();
      
      expect(error.message).toBe('Failed to transform event between versions');
      expect(error.code).toBe(VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED);
    });

    it('should accept custom message and details', () => {
      const message = 'Custom transformation error';
      const details = { field: 'metadata', reason: 'Invalid format' };
      const journey = JourneyType.GAMIFICATION;

      const error = new VersionTransformationError(message, details, journey);
      
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.context.journey).toBe(journey);
    });

    it('should create fieldTransformationFailed error correctly', () => {
      const field = 'bloodPressure';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const journey = JourneyType.HEALTH;
      const cause = new Error('Invalid format');

      const error = VersionTransformationError.fieldTransformationFailed(
        field,
        fromVersion,
        toVersion,
        journey,
        cause
      );
      
      expect(error).toBeInstanceOf(VersionTransformationError);
      expect(error.message).toBe(
        `Failed to transform field '${field}' from version ${fromVersion} to ${toVersion}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED);
      expect(error.details).toEqual({ field, fromVersion, toVersion });
      expect(error.context.journey).toBe(journey);
      expect(error.cause).toBe(cause);
    });

    it('should create schemaTransformationFailed error correctly', () => {
      const schemaName = 'HealthMetric';
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const journey = JourneyType.HEALTH;
      const cause = new Error('Schema validation failed');

      const error = VersionTransformationError.schemaTransformationFailed(
        schemaName,
        fromVersion,
        toVersion,
        journey,
        cause
      );
      
      expect(error).toBeInstanceOf(VersionTransformationError);
      expect(error.message).toBe(
        `Failed to transform schema '${schemaName}' from version ${fromVersion} to ${toVersion}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED);
      expect(error.details).toEqual({ schemaName, fromVersion, toVersion });
      expect(error.context.journey).toBe(journey);
      expect(error.cause).toBe(cause);
    });

    it('should create missingTransformer error correctly', () => {
      const fromVersion = '1.0.0';
      const toVersion = '2.0.0';
      const eventType = 'DeviceConnected';
      const journey = JourneyType.HEALTH;

      const error = VersionTransformationError.missingTransformer(
        fromVersion,
        toVersion,
        eventType,
        journey
      );
      
      expect(error).toBeInstanceOf(VersionTransformationError);
      expect(error.message).toBe(
        `No transformer found for converting from version ${fromVersion} to ${toVersion} for event type ${eventType}`
      );
      expect(error.code).toBe(VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED);
      expect(error.details).toEqual({ fromVersion, toVersion, eventType });
      expect(error.context.journey).toBe(journey);
    });
  });

  describe('Error integration with global error framework', () => {
    it('should convert to HTTP exception correctly', () => {
      const error = new VersioningError(
        'Test error',
        VERSIONING_ERROR_CODES.DETECTION_FAILED
      );
      
      const httpException = error.toHttpException();
      expect(httpException).toBeDefined();
      
      const response = httpException.getResponse() as { error: any };
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(response.error).toHaveProperty('code', VERSIONING_ERROR_CODES.DETECTION_FAILED);
      expect(response.error).toHaveProperty('message', 'Test error');
    });

    it('should provide detailed JSON for logging', () => {
      const message = 'Test error';
      const code = VERSIONING_ERROR_CODES.DETECTION_FAILED;
      const details = { eventId: '123' };
      const journey = JourneyType.HEALTH;
      const cause = new Error('Original error');

      const error = new VersioningError(message, code, details, journey, cause);
      const detailedJson = error.toDetailedJSON();

      expect(detailedJson).toHaveProperty('name', 'VersioningError');
      expect(detailedJson).toHaveProperty('message', message);
      expect(detailedJson).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(detailedJson).toHaveProperty('code', code);
      expect(detailedJson).toHaveProperty('details', details);
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', journey);
      expect(detailedJson.context).toHaveProperty('component', 'event-versioning');
      expect(detailedJson).toHaveProperty('cause');
      expect(detailedJson.cause).toHaveProperty('name', 'Error');
      expect(detailedJson.cause).toHaveProperty('message', 'Original error');
    });
  });

  describe('Error codes', () => {
    it('should have all required error codes', () => {
      expect(VERSIONING_ERROR_CODES).toHaveProperty('DETECTION_FAILED');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('INCOMPATIBLE_VERSION');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('MIGRATION_FAILED');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('TRANSFORMATION_FAILED');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('UNSUPPORTED_VERSION');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('MISSING_VERSION');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('INVALID_VERSION_FORMAT');
      expect(VERSIONING_ERROR_CODES).toHaveProperty('DOWNGRADE_NOT_ALLOWED');
    });

    it('should use the correct prefix for all error codes', () => {
      const prefix = 'EVENT_VERSION_';
      
      Object.values(VERSIONING_ERROR_CODES).forEach(code => {
        expect(code.startsWith(prefix)).toBe(true);
      });
    });
  });
});