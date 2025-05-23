/**
 * @file mock-event-validator.ts
 * @description Provides a comprehensive validation framework for testing event payload compliance with schemas.
 * This mock allows tests to verify that events conform to the expected structure for each journey and event type
 * without requiring the full validation pipeline. It supports testing of both valid and invalid events with
 * detailed error reporting for validation failures.
 */

import { performance } from 'perf_hooks';
import { ZodSchema, z } from 'zod';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { 
  IEventValidator, 
  ValidationResult, 
  ValidationError,
  ValidationOptions 
} from '../../src/interfaces/event-validation.interface';

/**
 * Configuration options for the MockEventValidator
 */
export interface MockEventValidatorConfig {
  /**
   * Whether validation should always pass regardless of input
   */
  alwaysValid?: boolean;

  /**
   * Whether validation should always fail regardless of input
   */
  alwaysFail?: boolean;

  /**
   * Predefined validation errors to return when validation fails
   */
  predefinedErrors?: ValidationError[];

  /**
   * Specific event types that should be considered valid
   */
  validEventTypes?: string[];

  /**
   * Specific event types that should be considered invalid
   */
  invalidEventTypes?: string[];

  /**
   * Journey-specific validation rules
   */
  journeyValidators?: Record<JourneyType, (event: BaseEvent) => ValidationResult>;

  /**
   * Schema-based validators for specific event types
   */
  schemaValidators?: Record<string, ZodSchema>;

  /**
   * Whether to simulate validation performance metrics
   */
  trackPerformance?: boolean;

  /**
   * Simulated validation latency in milliseconds
   */
  simulatedLatencyMs?: number;

  /**
   * Whether to validate event versions
   */
  validateVersions?: boolean;

  /**
   * Minimum required version for events
   */
  minimumVersion?: string;

  /**
   * Whether to perform deep validation of nested fields
   */
  deepValidation?: boolean;
}

/**
 * Default validation errors for common issues
 */
export const DEFAULT_VALIDATION_ERRORS: Record<string, ValidationError> = {
  MISSING_EVENT_ID: {
    code: 'MISSING_FIELD',
    message: 'Event ID is required',
    path: 'eventId'
  },
  MISSING_TYPE: {
    code: 'MISSING_FIELD',
    message: 'Event type is required',
    path: 'type'
  },
  MISSING_TIMESTAMP: {
    code: 'MISSING_FIELD',
    message: 'Event timestamp is required',
    path: 'timestamp'
  },
  INVALID_TIMESTAMP: {
    code: 'INVALID_FORMAT',
    message: 'Event timestamp must be a valid ISO 8601 string',
    path: 'timestamp'
  },
  MISSING_VERSION: {
    code: 'MISSING_FIELD',
    message: 'Event version is required',
    path: 'version'
  },
  INVALID_VERSION: {
    code: 'INVALID_FORMAT',
    message: 'Event version must follow semantic versioning (major.minor.patch)',
    path: 'version'
  },
  OUTDATED_VERSION: {
    code: 'OUTDATED_VERSION',
    message: 'Event version is outdated',
    path: 'version'
  },
  MISSING_SOURCE: {
    code: 'MISSING_FIELD',
    message: 'Event source is required',
    path: 'source'
  },
  MISSING_PAYLOAD: {
    code: 'MISSING_FIELD',
    message: 'Event payload is required',
    path: 'payload'
  },
  INVALID_PAYLOAD: {
    code: 'INVALID_STRUCTURE',
    message: 'Event payload has an invalid structure',
    path: 'payload'
  },
  MISSING_USER_ID: {
    code: 'MISSING_FIELD',
    message: 'User ID is required',
    path: 'userId'
  },
  MISSING_JOURNEY: {
    code: 'MISSING_FIELD',
    message: 'Journey type is required',
    path: 'journey'
  },
  INVALID_JOURNEY: {
    code: 'INVALID_VALUE',
    message: 'Journey type must be one of: health, care, plan',
    path: 'journey'
  }
};

/**
 * Default schemas for validating journey-specific event payloads
 */
export const DEFAULT_SCHEMAS = {
  // Health journey schemas
  HEALTH_METRIC_RECORDED: z.object({
    metricType: z.string(),
    metricValue: z.number().or(z.string()),
    unit: z.string(),
    timestamp: z.string().datetime().optional(),
    source: z.string().optional(),
    previousValue: z.number().optional(),
    change: z.number().optional(),
    isImprovement: z.boolean().optional()
  }),
  HEALTH_GOAL_ACHIEVED: z.object({
    goalId: z.string(),
    goalType: z.string(),
    achievedValue: z.number(),
    targetValue: z.number(),
    daysToAchieve: z.number().optional(),
    isEarlyCompletion: z.boolean().optional()
  }),
  HEALTH_DEVICE_CONNECTED: z.object({
    deviceId: z.string(),
    deviceType: z.string(),
    connectionDate: z.string().datetime().optional(),
    isFirstConnection: z.boolean().optional()
  }),

  // Care journey schemas
  CARE_APPOINTMENT_BOOKED: z.object({
    appointmentId: z.string(),
    providerId: z.string(),
    appointmentType: z.string(),
    scheduledDate: z.string().datetime(),
    isFirstAppointment: z.boolean().optional(),
    isUrgent: z.boolean().optional()
  }),
  CARE_MEDICATION_TAKEN: z.object({
    medicationId: z.string(),
    medicationName: z.string(),
    takenDate: z.string().datetime(),
    takenOnTime: z.boolean(),
    dosage: z.string()
  }),
  CARE_TELEMEDICINE_SESSION_COMPLETED: z.object({
    sessionId: z.string(),
    providerId: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    duration: z.number(),
    appointmentId: z.string().optional(),
    technicalIssues: z.boolean().optional()
  }),

  // Plan journey schemas
  PLAN_CLAIM_SUBMITTED: z.object({
    claimId: z.string(),
    submissionDate: z.string().datetime(),
    amount: z.number().positive(),
    claimType: z.string(),
    hasDocuments: z.boolean(),
    isComplete: z.boolean()
  }),
  PLAN_BENEFIT_UTILIZED: z.object({
    benefitId: z.string(),
    benefitType: z.string(),
    utilizationDate: z.string().datetime(),
    serviceProvider: z.string().optional(),
    amount: z.number().optional(),
    remainingCoverage: z.number().optional(),
    isFirstUtilization: z.boolean()
  }),
  PLAN_REWARD_REDEEMED: z.object({
    rewardId: z.string(),
    rewardName: z.string(),
    redemptionDate: z.string().datetime(),
    pointValue: z.number().positive(),
    monetaryValue: z.number().optional(),
    rewardType: z.string(),
    isPremiumReward: z.boolean()
  })
};

/**
 * A mock implementation of IEventValidator for testing purposes.
 * Provides configurable validation behavior for event payloads.
 */
export class MockEventValidator<T = any> implements IEventValidator<T> {
  private config: MockEventValidatorConfig;
  private validationCount = 0;
  private totalValidationTimeMs = 0;
  private validationResults: Record<string, { valid: number; invalid: number }> = {};

  /**
   * Creates a new MockEventValidator with the specified configuration.
   * 
   * @param config Configuration options for the validator
   */
  constructor(config: MockEventValidatorConfig = {}) {
    this.config = {
      alwaysValid: false,
      alwaysFail: false,
      trackPerformance: true,
      simulatedLatencyMs: 0,
      validateVersions: true,
      deepValidation: true,
      ...config,
      schemaValidators: {
        ...DEFAULT_SCHEMAS,
        ...config.schemaValidators
      }
    };
  }

  /**
   * Validates the provided event data synchronously.
   * 
   * @param data The event data to validate
   * @returns ValidationResult with validation outcome
   */
  validate(data: T): ValidationResult {
    if (this.config.trackPerformance) {
      const startTime = performance.now();
      const result = this.performValidation(data);
      const endTime = performance.now();
      
      this.validationCount++;
      this.totalValidationTimeMs += (endTime - startTime);
      
      // Track results by event type
      if (this.isBaseEvent(data)) {
        const eventType = data.type;
        if (!this.validationResults[eventType]) {
          this.validationResults[eventType] = { valid: 0, invalid: 0 };
        }
        
        if (result.isValid) {
          this.validationResults[eventType].valid++;
        } else {
          this.validationResults[eventType].invalid++;
        }
      }
      
      return result;
    }
    
    return this.performValidation(data);
  }

  /**
   * Validates the provided event data asynchronously.
   * Useful for validations that require database lookups or external service calls.
   * 
   * @param data The event data to validate
   * @returns Promise resolving to ValidationResult with validation outcome
   */
  async validateAsync(data: T): Promise<ValidationResult> {
    if (this.config.simulatedLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulatedLatencyMs));
    }
    
    return this.validate(data);
  }

  /**
   * Returns the schema or validation rules used by this validator.
   * 
   * @returns The validation schema or rules
   */
  getSchema(): any {
    return this.config.schemaValidators || {};
  }

  /**
   * Returns performance metrics for validation operations.
   * 
   * @returns Object containing validation performance metrics
   */
  getPerformanceMetrics() {
    if (!this.config.trackPerformance) {
      return { enabled: false };
    }
    
    return {
      enabled: true,
      validationCount: this.validationCount,
      totalValidationTimeMs: this.totalValidationTimeMs,
      averageValidationTimeMs: this.validationCount > 0 
        ? this.totalValidationTimeMs / this.validationCount 
        : 0,
      validationResults: this.validationResults
    };
  }

  /**
   * Resets all performance metrics.
   */
  resetPerformanceMetrics() {
    this.validationCount = 0;
    this.totalValidationTimeMs = 0;
    this.validationResults = {};
  }

  /**
   * Updates the validator configuration.
   * 
   * @param config New configuration options
   */
  updateConfig(config: Partial<MockEventValidatorConfig>) {
    this.config = {
      ...this.config,
      ...config,
      schemaValidators: {
        ...this.config.schemaValidators,
        ...config.schemaValidators
      }
    };
  }

  /**
   * Performs the actual validation logic based on the configuration.
   * 
   * @param data The event data to validate
   * @returns ValidationResult with validation outcome
   */
  private performValidation(data: T): ValidationResult {
    // Handle forced validation results
    if (this.config.alwaysValid) {
      return { isValid: true, errors: [] };
    }
    
    if (this.config.alwaysFail) {
      return { 
        isValid: false, 
        errors: this.config.predefinedErrors || [
          {
            code: 'FORCED_FAILURE',
            message: 'Validation failed due to alwaysFail configuration',
            path: ''
          }
        ] 
      };
    }
    
    // Check if this is a BaseEvent
    if (!this.isBaseEvent(data)) {
      return {
        isValid: false,
        errors: [
          {
            code: 'INVALID_EVENT',
            message: 'Data is not a valid event object',
            path: ''
          }
        ]
      };
    }
    
    const event = data as unknown as BaseEvent;
    
    // Check for specific event types that should pass or fail
    if (this.config.validEventTypes?.includes(event.type)) {
      return { isValid: true, errors: [] };
    }
    
    if (this.config.invalidEventTypes?.includes(event.type)) {
      return {
        isValid: false,
        errors: [
          {
            code: 'INVALID_EVENT_TYPE',
            message: `Event type '${event.type}' is configured as invalid`,
            path: 'type'
          }
        ]
      };
    }
    
    // Perform basic event validation
    const basicValidationResult = this.validateBaseEvent(event);
    if (!basicValidationResult.isValid) {
      return basicValidationResult;
    }
    
    // Perform version validation if enabled
    if (this.config.validateVersions && this.config.minimumVersion) {
      const versionValidationResult = this.validateEventVersion(event);
      if (!versionValidationResult.isValid) {
        return versionValidationResult;
      }
    }
    
    // Perform journey-specific validation if available
    if (event.journey && this.config.journeyValidators?.[event.journey as JourneyType]) {
      const journeyValidator = this.config.journeyValidators[event.journey as JourneyType];
      const journeyValidationResult = journeyValidator(event);
      if (!journeyValidationResult.isValid) {
        return journeyValidationResult;
      }
    }
    
    // Perform schema validation if available for this event type
    if (this.config.schemaValidators?.[event.type]) {
      return this.validateEventAgainstSchema(event);
    }
    
    // If we've made it this far, the event is valid
    return { isValid: true, errors: [] };
  }

  /**
   * Validates that an object is a BaseEvent.
   * 
   * @param data The data to check
   * @returns True if the data is a BaseEvent, false otherwise
   */
  private isBaseEvent(data: any): data is BaseEvent {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.source === 'string' &&
      typeof data.payload === 'object'
    );
  }

  /**
   * Validates the basic structure of a BaseEvent.
   * 
   * @param event The event to validate
   * @returns ValidationResult with validation outcome
   */
  private validateBaseEvent(event: BaseEvent): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check required fields
    if (!event.eventId) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_EVENT_ID);
    if (!event.type) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_TYPE);
    if (!event.timestamp) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_TIMESTAMP);
    if (!event.version) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_VERSION);
    if (!event.source) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_SOURCE);
    if (!event.payload) errors.push(DEFAULT_VALIDATION_ERRORS.MISSING_PAYLOAD);
    
    // Validate timestamp format if present
    if (event.timestamp && !this.isValidISODateString(event.timestamp)) {
      errors.push(DEFAULT_VALIDATION_ERRORS.INVALID_TIMESTAMP);
    }
    
    // Validate version format if present
    if (event.version && !this.isValidSemVer(event.version)) {
      errors.push(DEFAULT_VALIDATION_ERRORS.INVALID_VERSION);
    }
    
    // Validate journey if present
    if (event.journey) {
      const validJourneys = Object.values(JourneyType);
      if (!validJourneys.includes(event.journey as JourneyType)) {
        errors.push(DEFAULT_VALIDATION_ERRORS.INVALID_JOURNEY);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates that an event version meets the minimum required version.
   * 
   * @param event The event to validate
   * @returns ValidationResult with validation outcome
   */
  private validateEventVersion(event: BaseEvent): ValidationResult {
    if (!this.config.minimumVersion || !event.version) {
      return { isValid: true, errors: [] };
    }
    
    if (this.compareVersions(event.version, this.config.minimumVersion) < 0) {
      return {
        isValid: false,
        errors: [
          {
            ...DEFAULT_VALIDATION_ERRORS.OUTDATED_VERSION,
            message: `Event version ${event.version} is outdated. Minimum required version is ${this.config.minimumVersion}`,
            context: {
              eventVersion: event.version,
              minimumVersion: this.config.minimumVersion
            }
          }
        ]
      };
    }
    
    return { isValid: true, errors: [] };
  }

  /**
   * Validates an event against its schema if available.
   * 
   * @param event The event to validate
   * @returns ValidationResult with validation outcome
   */
  private validateEventAgainstSchema(event: BaseEvent): ValidationResult {
    const schema = this.config.schemaValidators?.[event.type];
    if (!schema) {
      return { isValid: true, errors: [] };
    }
    
    const result = schema.safeParse(event.payload);
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(err => ({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: err.message,
          path: `payload${err.path.length > 0 ? '.' + err.path.join('.') : ''}`,
          context: {
            expected: err.expected,
            received: err.received
          }
        }))
      };
    }
    
    return { isValid: true, errors: [] };
  }

  /**
   * Checks if a string is a valid ISO date string.
   * 
   * @param dateString The string to check
   * @returns True if the string is a valid ISO date string, false otherwise
   */
  private isValidISODateString(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a string is a valid semantic version.
   * 
   * @param version The string to check
   * @returns True if the string is a valid semantic version, false otherwise
   */
  private isValidSemVer(version: string): boolean {
    const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semVerRegex.test(version);
  }

  /**
   * Compares two semantic versions.
   * 
   * @param versionA First version
   * @param versionB Second version
   * @returns -1 if versionA < versionB, 0 if versionA = versionB, 1 if versionA > versionB
   */
  private compareVersions(versionA: string, versionB: string): number {
    const partsA = versionA.split('.').map(Number);
    const partsB = versionB.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = i < partsA.length ? partsA[i] : 0;
      const partB = i < partsB.length ? partsB[i] : 0;
      
      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }
    
    return 0;
  }
}

/**
 * Factory function to create a MockEventValidator with default configuration.
 * 
 * @returns A new MockEventValidator instance
 */
export function createMockEventValidator(): MockEventValidator {
  return new MockEventValidator();
}

/**
 * Factory function to create a MockEventValidator that always passes validation.
 * 
 * @returns A new MockEventValidator instance that always passes validation
 */
export function createAlwaysValidEventValidator(): MockEventValidator {
  return new MockEventValidator({ alwaysValid: true });
}

/**
 * Factory function to create a MockEventValidator that always fails validation.
 * 
 * @param errors Optional custom validation errors to return
 * @returns A new MockEventValidator instance that always fails validation
 */
export function createAlwaysFailingEventValidator(errors?: ValidationError[]): MockEventValidator {
  return new MockEventValidator({ 
    alwaysFail: true,
    predefinedErrors: errors
  });
}

/**
 * Factory function to create a MockEventValidator with journey-specific validation.
 * 
 * @param journeyValidators Record of journey-specific validation functions
 * @returns A new MockEventValidator instance with journey-specific validation
 */
export function createJourneyAwareEventValidator(
  journeyValidators: Record<JourneyType, (event: BaseEvent) => ValidationResult>
): MockEventValidator {
  return new MockEventValidator({ journeyValidators });
}

/**
 * Factory function to create a MockEventValidator with schema-based validation.
 * 
 * @param schemas Record of event type to schema mappings
 * @returns A new MockEventValidator instance with schema-based validation
 */
export function createSchemaEventValidator(
  schemas: Record<string, ZodSchema>
): MockEventValidator {
  return new MockEventValidator({ 
    schemaValidators: schemas,
    deepValidation: true
  });
}

/**
 * Factory function to create a MockEventValidator with version validation.
 * 
 * @param minimumVersion Minimum required version for events
 * @returns A new MockEventValidator instance with version validation
 */
export function createVersionedEventValidator(
  minimumVersion: string
): MockEventValidator {
  return new MockEventValidator({ 
    validateVersions: true,
    minimumVersion
  });
}

/**
 * Factory function to create a MockEventValidator with performance tracking.
 * 
 * @param simulatedLatencyMs Optional simulated latency in milliseconds
 * @returns A new MockEventValidator instance with performance tracking
 */
export function createPerformanceTrackingEventValidator(
  simulatedLatencyMs?: number
): MockEventValidator {
  return new MockEventValidator({ 
    trackPerformance: true,
    simulatedLatencyMs
  });
}