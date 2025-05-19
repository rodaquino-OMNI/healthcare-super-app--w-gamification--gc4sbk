/**
 * Mock Event Validator
 * 
 * Provides a comprehensive validation framework for testing event payload compliance with schemas.
 * This mock allows tests to verify that events conform to the expected structure for each journey
 * and event type without requiring the full validation pipeline.
 * 
 * Features:
 * - Schema-based validation for event payloads
 * - Journey-specific validation rules
 * - Nested field validation support
 * - Detailed error reporting for validation failures
 * - Versioned schema validation
 * - Performance metrics for validation operations
 */

import { performance } from 'perf_hooks';

import { 
  IEventValidator,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  ValidationResultFactory,
  ISchemaValidator,
  ValidationStrategy
} from '../../src/interfaces/event-validation.interface';
import { IBaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';

/**
 * Configuration options for the MockEventValidator
 */
export interface MockEventValidatorConfig {
  /**
   * Whether to simulate validation failures
   * @default false
   */
  simulateFailures?: boolean;
  
  /**
   * Percentage of validations that should fail (0-100)
   * Only used when simulateFailures is true
   * @default 25
   */
  failureRate?: number;
  
  /**
   * Whether to track performance metrics
   * @default true
   */
  trackPerformance?: boolean;
  
  /**
   * Whether to validate event schema versions
   * @default true
   */
  validateVersions?: boolean;
  
  /**
   * Whether to perform deep validation of nested fields
   * @default true
   */
  validateNestedFields?: boolean;
  
  /**
   * Event types that this validator supports
   * If empty, all event types are supported
   * @default []
   */
  supportedEventTypes?: string[];
  
  /**
   * Journeys that this validator supports
   * If empty, all journeys are supported
   * @default ['health', 'care', 'plan']
   */
  supportedJourneys?: string[];
  
  /**
   * Custom validation rules to apply
   * @default []
   */
  customRules?: MockValidationRule[];
}

/**
 * Custom validation rule for the MockEventValidator
 */
export interface MockValidationRule {
  /**
   * Name of the rule
   */
  name: string;
  
  /**
   * Event types this rule applies to
   * If empty, applies to all event types
   */
  eventTypes?: string[];
  
  /**
   * Journeys this rule applies to
   * If empty, applies to all journeys
   */
  journeys?: string[];
  
  /**
   * Validation function that returns issues if validation fails
   * @param event The event to validate
   * @returns Array of validation issues, empty if validation passes
   */
  validate: (event: IBaseEvent) => ValidationIssue[];
}

/**
 * Performance metrics for validation operations
 */
export interface ValidationPerformanceMetrics {
  /**
   * Total number of validations performed
   */
  totalValidations: number;
  
  /**
   * Number of successful validations
   */
  successfulValidations: number;
  
  /**
   * Number of failed validations
   */
  failedValidations: number;
  
  /**
   * Average validation time in milliseconds
   */
  averageValidationTimeMs: number;
  
  /**
   * Validation times by event type
   */
  validationTimesByEventType: Record<string, number[]>;
  
  /**
   * Validation times by journey
   */
  validationTimesByJourney: Record<string, number[]>;
}

/**
 * Mock implementation of an event validator for testing purposes
 * Implements the IEventValidator interface to provide a realistic validation experience
 */
export class MockEventValidator implements IEventValidator {
  private config: Required<MockEventValidatorConfig>;
  private metrics: ValidationPerformanceMetrics;
  
  /**
   * Creates a new MockEventValidator with the specified configuration
   * @param config Configuration options
   */
  constructor(config: MockEventValidatorConfig = {}) {
    // Set default configuration values
    this.config = {
      simulateFailures: config.simulateFailures ?? false,
      failureRate: config.failureRate ?? 25,
      trackPerformance: config.trackPerformance ?? true,
      validateVersions: config.validateVersions ?? true,
      validateNestedFields: config.validateNestedFields ?? true,
      supportedEventTypes: config.supportedEventTypes ?? [],
      supportedJourneys: config.supportedJourneys ?? ['health', 'care', 'plan'],
      customRules: config.customRules ?? []
    };
    
    // Initialize performance metrics
    this.metrics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTimeMs: 0,
      validationTimesByEventType: {},
      validationTimesByJourney: {}
    };
  }
  
  /**
   * Validates an event synchronously
   * @param event The event to validate
   * @returns Validation result
   */
  public validate(event: IBaseEvent): ValidationResult {
    const startTime = this.config.trackPerformance ? performance.now() : 0;
    
    try {
      // Check if this validator supports the event type
      if (!this.canValidate(event.type)) {
        return ValidationResultFactory.invalid([
          {
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Event type '${event.type}' is not supported by this validator`,
            severity: ValidationSeverity.ERROR
          }
        ]);
      }
      
      // Check if journey is supported (from metadata)
      const journey = event.metadata?.journey;
      if (journey && this.config.supportedJourneys.length > 0 && !this.config.supportedJourneys.includes(journey)) {
        return ValidationResultFactory.invalid([
          {
            code: 'UNSUPPORTED_JOURNEY',
            message: `Journey '${journey}' is not supported by this validator`,
            severity: ValidationSeverity.ERROR
          }
        ]);
      }
      
      // Simulate random validation failures if configured
      if (this.config.simulateFailures && Math.random() * 100 < this.config.failureRate) {
        return this.createSimulatedFailure(event);
      }
      
      // Collect all validation issues
      const issues: ValidationIssue[] = [];
      
      // Validate base event structure
      issues.push(...this.validateBaseEventStructure(event));
      
      // Validate event version if configured
      if (this.config.validateVersions) {
        issues.push(...this.validateEventVersion(event));
      }
      
      // Validate nested fields if configured
      if (this.config.validateNestedFields) {
        issues.push(...this.validateNestedFields(event));
      }
      
      // Apply journey-specific validation rules
      issues.push(...this.validateJourneySpecificRules(event));
      
      // Apply custom validation rules
      issues.push(...this.applyCustomRules(event));
      
      // Create validation result
      const isValid = issues.length === 0;
      const result = isValid 
        ? ValidationResultFactory.valid(journey) 
        : ValidationResultFactory.invalid(issues, journey);
      
      // Update metrics
      this.updateMetrics(event, isValid, startTime);
      
      return result;
    } catch (error) {
      // Handle unexpected errors during validation
      const result = ValidationResultFactory.invalid([
        {
          code: 'VALIDATION_ERROR',
          message: `Unexpected error during validation: ${error.message}`,
          severity: ValidationSeverity.ERROR,
          context: { stack: error.stack }
        }
      ]);
      
      // Update metrics
      this.updateMetrics(event, false, startTime);
      
      return result;
    }
  }
  
  /**
   * Validates an event asynchronously
   * @param event The event to validate
   * @returns Promise resolving to validation result
   */
  public async validateAsync(event: IBaseEvent): Promise<ValidationResult> {
    // For the mock, we'll just wrap the synchronous validation in a Promise
    // In a real implementation, this might perform async operations like database lookups
    return Promise.resolve(this.validate(event));
  }
  
  /**
   * Checks if this validator can handle the given event type
   * @param eventType The type of event to check
   * @returns Whether this validator can handle the event type
   */
  public canValidate(eventType: string): boolean {
    // If no supported event types are specified, support all types
    if (this.config.supportedEventTypes.length === 0) {
      return true;
    }
    
    // Check if the event type is in the supported list
    return this.config.supportedEventTypes.includes(eventType);
  }
  
  /**
   * Gets the event types this validator can handle
   * @returns Array of supported event types
   */
  public getSupportedEventTypes(): string[] {
    return [...this.config.supportedEventTypes];
  }
  
  /**
   * Gets the current performance metrics
   * @returns Validation performance metrics
   */
  public getPerformanceMetrics(): ValidationPerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Resets the performance metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTimeMs: 0,
      validationTimesByEventType: {},
      validationTimesByJourney: {}
    };
  }
  
  /**
   * Updates the configuration of the validator
   * @param config New configuration options
   */
  public updateConfig(config: Partial<MockEventValidatorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Adds a custom validation rule
   * @param rule The rule to add
   */
  public addCustomRule(rule: MockValidationRule): void {
    this.config.customRules.push(rule);
  }
  
  /**
   * Validates the base structure of an event
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateBaseEventStructure(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check required fields
    if (!event.eventId) {
      issues.push({
        code: 'MISSING_EVENT_ID',
        message: 'Event ID is required',
        field: 'eventId',
        severity: ValidationSeverity.ERROR
      });
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.eventId)) {
      issues.push({
        code: 'INVALID_EVENT_ID',
        message: 'Event ID must be a valid UUID',
        field: 'eventId',
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (!event.timestamp) {
      issues.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Timestamp is required',
        field: 'timestamp',
        severity: ValidationSeverity.ERROR
      });
    } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(event.timestamp)) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        message: 'Timestamp must be a valid ISO 8601 string',
        field: 'timestamp',
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (!event.version) {
      issues.push({
        code: 'MISSING_VERSION',
        message: 'Version is required',
        field: 'version',
        severity: ValidationSeverity.ERROR
      });
    } else if (!/^\d+\.\d+\.\d+$/.test(event.version)) {
      issues.push({
        code: 'INVALID_VERSION',
        message: 'Version must be a valid semantic version (major.minor.patch)',
        field: 'version',
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (!event.source) {
      issues.push({
        code: 'MISSING_SOURCE',
        message: 'Source is required',
        field: 'source',
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (!event.type) {
      issues.push({
        code: 'MISSING_TYPE',
        message: 'Event type is required',
        field: 'type',
        severity: ValidationSeverity.ERROR
      });
    } else if (!/^[a-z-]+\.[a-z-]+\.[a-z-]+$/.test(event.type)) {
      issues.push({
        code: 'INVALID_TYPE_FORMAT',
        message: 'Event type must follow the format "journey.entity.action"',
        field: 'type',
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (!event.payload) {
      issues.push({
        code: 'MISSING_PAYLOAD',
        message: 'Payload is required',
        field: 'payload',
        severity: ValidationSeverity.ERROR
      });
    } else if (typeof event.payload !== 'object') {
      issues.push({
        code: 'INVALID_PAYLOAD',
        message: 'Payload must be an object',
        field: 'payload',
        severity: ValidationSeverity.ERROR
      });
    }
    
    return issues;
  }
  
  /**
   * Validates the event version
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateEventVersion(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Skip if version is missing (already handled in validateBaseEventStructure)
    if (!event.version || !/^\d+\.\d+\.\d+$/.test(event.version)) {
      return issues;
    }
    
    // Parse version components
    const [major, minor, patch] = event.version.split('.').map(Number);
    
    // Check for deprecated versions (example: consider major versions < 1 as deprecated)
    if (major < 1) {
      issues.push({
        code: 'DEPRECATED_VERSION',
        message: `Event version ${event.version} is deprecated and will be removed in future releases`,
        field: 'version',
        severity: ValidationSeverity.WARNING,
        context: { suggestedVersion: '1.0.0' }
      });
    }
    
    // Check for unsupported versions (example: consider major versions > 2 as unsupported)
    if (major > 2) {
      issues.push({
        code: 'UNSUPPORTED_VERSION',
        message: `Event version ${event.version} is not supported by this validator`,
        field: 'version',
        severity: ValidationSeverity.ERROR,
        context: { maxSupportedVersion: '2.x.x' }
      });
    }
    
    return issues;
  }
  
  /**
   * Validates nested fields in the event payload
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateNestedFields(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Skip if payload is missing or not an object (already handled in validateBaseEventStructure)
    if (!event.payload || typeof event.payload !== 'object') {
      return issues;
    }
    
    // Extract journey from event type or metadata
    const eventTypeParts = event.type.split('.');
    const journey = event.metadata?.journey || (eventTypeParts.length > 0 ? eventTypeParts[0] : null);
    
    // Validate based on journey and event type
    switch (journey) {
      case 'health':
        issues.push(...this.validateHealthPayload(event));
        break;
      case 'care':
        issues.push(...this.validateCarePayload(event));
        break;
      case 'plan':
        issues.push(...this.validatePlanPayload(event));
        break;
      default:
        // No journey-specific validation for unknown journeys
        break;
    }
    
    return issues;
  }
  
  /**
   * Validates health journey event payloads
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateHealthPayload(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const payload = event.payload as Record<string, any>;
    const eventType = event.type;
    
    // Validate health.metric.recorded events
    if (eventType === 'health.metric.recorded') {
      // Check required fields
      if (!payload.metricType) {
        issues.push({
          code: 'MISSING_METRIC_TYPE',
          message: 'Metric type is required for health.metric.recorded events',
          field: 'payload.metricType',
          severity: ValidationSeverity.ERROR
        });
      } else if (![
        'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 
        'STEPS', 'WEIGHT', 'SLEEP'
      ].includes(payload.metricType)) {
        issues.push({
          code: 'INVALID_METRIC_TYPE',
          message: `Metric type '${payload.metricType}' is not supported`,
          field: 'payload.metricType',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.value === undefined || payload.value === null) {
        issues.push({
          code: 'MISSING_METRIC_VALUE',
          message: 'Metric value is required for health.metric.recorded events',
          field: 'payload.value',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.value !== 'number' && typeof payload.value !== 'object') {
        issues.push({
          code: 'INVALID_METRIC_VALUE',
          message: 'Metric value must be a number or an object for composite metrics',
          field: 'payload.value',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.unit) {
        issues.push({
          code: 'MISSING_METRIC_UNIT',
          message: 'Metric unit is required for health.metric.recorded events',
          field: 'payload.unit',
          severity: ValidationSeverity.ERROR
        });
      }
      
      // Validate specific metric types
      if (payload.metricType === 'BLOOD_PRESSURE' && typeof payload.value === 'object') {
        if (payload.value.systolic === undefined || payload.value.diastolic === undefined) {
          issues.push({
            code: 'INVALID_BLOOD_PRESSURE',
            message: 'Blood pressure must include systolic and diastolic values',
            field: 'payload.value',
            severity: ValidationSeverity.ERROR
          });
        }
      }
    }
    
    // Validate health.goal.achieved events
    else if (eventType === 'health.goal.achieved') {
      if (!payload.goalId) {
        issues.push({
          code: 'MISSING_GOAL_ID',
          message: 'Goal ID is required for health.goal.achieved events',
          field: 'payload.goalId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.goalType) {
        issues.push({
          code: 'MISSING_GOAL_TYPE',
          message: 'Goal type is required for health.goal.achieved events',
          field: 'payload.goalType',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.progress === undefined || payload.progress === null) {
        issues.push({
          code: 'MISSING_GOAL_PROGRESS',
          message: 'Goal progress is required for health.goal.achieved events',
          field: 'payload.progress',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.progress !== 'number' || payload.progress < 0 || payload.progress > 100) {
        issues.push({
          code: 'INVALID_GOAL_PROGRESS',
          message: 'Goal progress must be a number between 0 and 100',
          field: 'payload.progress',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    // Validate health.device.connected events
    else if (eventType === 'health.device.connected') {
      if (!payload.deviceId) {
        issues.push({
          code: 'MISSING_DEVICE_ID',
          message: 'Device ID is required for health.device.connected events',
          field: 'payload.deviceId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.deviceType) {
        issues.push({
          code: 'MISSING_DEVICE_TYPE',
          message: 'Device type is required for health.device.connected events',
          field: 'payload.deviceType',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validates care journey event payloads
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateCarePayload(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const payload = event.payload as Record<string, any>;
    const eventType = event.type;
    
    // Validate care.appointment.booked events
    if (eventType === 'care.appointment.booked') {
      if (!payload.appointmentId) {
        issues.push({
          code: 'MISSING_APPOINTMENT_ID',
          message: 'Appointment ID is required for care.appointment.booked events',
          field: 'payload.appointmentId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.providerId) {
        issues.push({
          code: 'MISSING_PROVIDER_ID',
          message: 'Provider ID is required for care.appointment.booked events',
          field: 'payload.providerId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.appointmentDate) {
        issues.push({
          code: 'MISSING_APPOINTMENT_DATE',
          message: 'Appointment date is required for care.appointment.booked events',
          field: 'payload.appointmentDate',
          severity: ValidationSeverity.ERROR
        });
      } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(payload.appointmentDate)) {
        issues.push({
          code: 'INVALID_APPOINTMENT_DATE',
          message: 'Appointment date must be a valid ISO 8601 string',
          field: 'payload.appointmentDate',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.specialty) {
        issues.push({
          code: 'MISSING_SPECIALTY',
          message: 'Specialty is required for care.appointment.booked events',
          field: 'payload.specialty',
          severity: ValidationSeverity.WARNING
        });
      }
    }
    
    // Validate care.medication.taken events
    else if (eventType === 'care.medication.taken') {
      if (!payload.medicationId) {
        issues.push({
          code: 'MISSING_MEDICATION_ID',
          message: 'Medication ID is required for care.medication.taken events',
          field: 'payload.medicationId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.takenAt) {
        issues.push({
          code: 'MISSING_TAKEN_AT',
          message: 'Taken at timestamp is required for care.medication.taken events',
          field: 'payload.takenAt',
          severity: ValidationSeverity.ERROR
        });
      } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(payload.takenAt)) {
        issues.push({
          code: 'INVALID_TAKEN_AT',
          message: 'Taken at timestamp must be a valid ISO 8601 string',
          field: 'payload.takenAt',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.dosage === undefined || payload.dosage === null) {
        issues.push({
          code: 'MISSING_DOSAGE',
          message: 'Dosage is required for care.medication.taken events',
          field: 'payload.dosage',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.dosage !== 'number' || payload.dosage <= 0) {
        issues.push({
          code: 'INVALID_DOSAGE',
          message: 'Dosage must be a positive number',
          field: 'payload.dosage',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    // Validate care.telemedicine.completed events
    else if (eventType === 'care.telemedicine.completed') {
      if (!payload.sessionId) {
        issues.push({
          code: 'MISSING_SESSION_ID',
          message: 'Session ID is required for care.telemedicine.completed events',
          field: 'payload.sessionId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.providerId) {
        issues.push({
          code: 'MISSING_PROVIDER_ID',
          message: 'Provider ID is required for care.telemedicine.completed events',
          field: 'payload.providerId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.duration === undefined || payload.duration === null) {
        issues.push({
          code: 'MISSING_DURATION',
          message: 'Duration is required for care.telemedicine.completed events',
          field: 'payload.duration',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.duration !== 'number' || payload.duration <= 0) {
        issues.push({
          code: 'INVALID_DURATION',
          message: 'Duration must be a positive number',
          field: 'payload.duration',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validates plan journey event payloads
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validatePlanPayload(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const payload = event.payload as Record<string, any>;
    const eventType = event.type;
    
    // Validate plan.claim.submitted events
    if (eventType === 'plan.claim.submitted') {
      if (!payload.claimId) {
        issues.push({
          code: 'MISSING_CLAIM_ID',
          message: 'Claim ID is required for plan.claim.submitted events',
          field: 'payload.claimId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.claimType) {
        issues.push({
          code: 'MISSING_CLAIM_TYPE',
          message: 'Claim type is required for plan.claim.submitted events',
          field: 'payload.claimType',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.amount === undefined || payload.amount === null) {
        issues.push({
          code: 'MISSING_AMOUNT',
          message: 'Amount is required for plan.claim.submitted events',
          field: 'payload.amount',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.amount !== 'number' || payload.amount <= 0) {
        issues.push({
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
          field: 'payload.amount',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.currency) {
        issues.push({
          code: 'MISSING_CURRENCY',
          message: 'Currency is required for plan.claim.submitted events',
          field: 'payload.currency',
          severity: ValidationSeverity.ERROR
        });
      } else if (!/^[A-Z]{3}$/.test(payload.currency)) {
        issues.push({
          code: 'INVALID_CURRENCY',
          message: 'Currency must be a valid 3-letter ISO currency code',
          field: 'payload.currency',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.documents || !Array.isArray(payload.documents) || payload.documents.length === 0) {
        issues.push({
          code: 'MISSING_DOCUMENTS',
          message: 'At least one document is required for plan.claim.submitted events',
          field: 'payload.documents',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    // Validate plan.benefit.used events
    else if (eventType === 'plan.benefit.used') {
      if (!payload.benefitId) {
        issues.push({
          code: 'MISSING_BENEFIT_ID',
          message: 'Benefit ID is required for plan.benefit.used events',
          field: 'payload.benefitId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (!payload.benefitType) {
        issues.push({
          code: 'MISSING_BENEFIT_TYPE',
          message: 'Benefit type is required for plan.benefit.used events',
          field: 'payload.benefitType',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.usageAmount === undefined || payload.usageAmount === null) {
        issues.push({
          code: 'MISSING_USAGE_AMOUNT',
          message: 'Usage amount is required for plan.benefit.used events',
          field: 'payload.usageAmount',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.usageAmount !== 'number' || payload.usageAmount <= 0) {
        issues.push({
          code: 'INVALID_USAGE_AMOUNT',
          message: 'Usage amount must be a positive number',
          field: 'payload.usageAmount',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    // Validate plan.reward.redeemed events
    else if (eventType === 'plan.reward.redeemed') {
      if (!payload.rewardId) {
        issues.push({
          code: 'MISSING_REWARD_ID',
          message: 'Reward ID is required for plan.reward.redeemed events',
          field: 'payload.rewardId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      if (payload.pointsUsed === undefined || payload.pointsUsed === null) {
        issues.push({
          code: 'MISSING_POINTS_USED',
          message: 'Points used is required for plan.reward.redeemed events',
          field: 'payload.pointsUsed',
          severity: ValidationSeverity.ERROR
        });
      } else if (typeof payload.pointsUsed !== 'number' || payload.pointsUsed <= 0) {
        issues.push({
          code: 'INVALID_POINTS_USED',
          message: 'Points used must be a positive number',
          field: 'payload.pointsUsed',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validates journey-specific rules
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private validateJourneySpecificRules(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Extract journey from event type or metadata
    const eventTypeParts = event.type.split('.');
    const journey = event.metadata?.journey || (eventTypeParts.length > 0 ? eventTypeParts[0] : null);
    
    // Skip if journey is not recognized
    if (!journey || !['health', 'care', 'plan'].includes(journey)) {
      return issues;
    }
    
    // Check for required metadata based on journey
    if (journey === 'health') {
      // Health events should have userId in metadata
      if (!event.metadata?.userId) {
        issues.push({
          code: 'MISSING_USER_ID',
          message: 'User ID is required in metadata for health journey events',
          field: 'metadata.userId',
          severity: ValidationSeverity.ERROR
        });
      }
    }
    
    if (journey === 'care') {
      // Care events should have userId and may need correlationId for appointment chains
      if (!event.metadata?.userId) {
        issues.push({
          code: 'MISSING_USER_ID',
          message: 'User ID is required in metadata for care journey events',
          field: 'metadata.userId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      // Appointment-related events should have correlationId to track the appointment lifecycle
      if (event.type.startsWith('care.appointment.') && !event.metadata?.correlationId) {
        issues.push({
          code: 'MISSING_CORRELATION_ID',
          message: 'Correlation ID is recommended in metadata for appointment events',
          field: 'metadata.correlationId',
          severity: ValidationSeverity.WARNING
        });
      }
    }
    
    if (journey === 'plan') {
      // Plan events should have userId and may need correlationId for claim chains
      if (!event.metadata?.userId) {
        issues.push({
          code: 'MISSING_USER_ID',
          message: 'User ID is required in metadata for plan journey events',
          field: 'metadata.userId',
          severity: ValidationSeverity.ERROR
        });
      }
      
      // Claim-related events should have correlationId to track the claim lifecycle
      if (event.type.startsWith('plan.claim.') && !event.metadata?.correlationId) {
        issues.push({
          code: 'MISSING_CORRELATION_ID',
          message: 'Correlation ID is recommended in metadata for claim events',
          field: 'metadata.correlationId',
          severity: ValidationSeverity.WARNING
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Applies custom validation rules
   * @param event The event to validate
   * @returns Array of validation issues
   */
  private applyCustomRules(event: IBaseEvent): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Extract journey from event type or metadata
    const eventTypeParts = event.type.split('.');
    const journey = event.metadata?.journey || (eventTypeParts.length > 0 ? eventTypeParts[0] : null);
    
    // Apply each custom rule that matches the event type and journey
    for (const rule of this.config.customRules) {
      // Skip if rule specifies event types and this event type is not included
      if (rule.eventTypes && rule.eventTypes.length > 0 && !rule.eventTypes.includes(event.type)) {
        continue;
      }
      
      // Skip if rule specifies journeys and this journey is not included
      if (rule.journeys && rule.journeys.length > 0 && (!journey || !rule.journeys.includes(journey))) {
        continue;
      }
      
      // Apply the rule and collect any issues
      try {
        const ruleIssues = rule.validate(event);
        if (ruleIssues && ruleIssues.length > 0) {
          issues.push(...ruleIssues);
        }
      } catch (error) {
        // If rule execution fails, add an issue
        issues.push({
          code: 'RULE_EXECUTION_ERROR',
          message: `Error executing custom rule '${rule.name}': ${error.message}`,
          severity: ValidationSeverity.ERROR,
          context: { ruleName: rule.name, error: error.message }
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Creates a simulated validation failure
   * @param event The event being validated
   * @returns Validation result with simulated failures
   */
  private createSimulatedFailure(event: IBaseEvent): ValidationResult {
    // Extract journey from event type or metadata
    const eventTypeParts = event.type.split('.');
    const journey = event.metadata?.journey || (eventTypeParts.length > 0 ? eventTypeParts[0] : null);
    
    // Create a random validation issue based on the event type
    const issues: ValidationIssue[] = [];
    
    // Randomly select a field to fail validation on
    const fields = [
      'payload.userId',
      'payload.timestamp',
      'payload.data',
      'metadata.correlationId',
      'version'
    ];
    
    const randomField = fields[Math.floor(Math.random() * fields.length)];
    const errorCodes = [
      'VALIDATION_ERROR',
      'INVALID_FORMAT',
      'MISSING_REQUIRED_FIELD',
      'VALUE_OUT_OF_RANGE',
      'INVALID_REFERENCE'
    ];
    
    const randomErrorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    
    issues.push({
      code: randomErrorCode,
      message: `Simulated validation error for field '${randomField}'`,
      field: randomField,
      severity: ValidationSeverity.ERROR,
      context: { simulated: true }
    });
    
    // Sometimes add a warning too
    if (Math.random() > 0.5) {
      issues.push({
        code: 'SIMULATED_WARNING',
        message: 'Simulated validation warning',
        severity: ValidationSeverity.WARNING,
        context: { simulated: true }
      });
    }
    
    return ValidationResultFactory.invalid(issues, journey);
  }
  
  /**
   * Updates performance metrics after validation
   * @param event The validated event
   * @param isValid Whether validation passed
   * @param startTime Performance timing start
   */
  private updateMetrics(event: IBaseEvent, isValid: boolean, startTime: number): void {
    if (!this.config.trackPerformance) {
      return;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update overall metrics
    this.metrics.totalValidations++;
    if (isValid) {
      this.metrics.successfulValidations++;
    } else {
      this.metrics.failedValidations++;
    }
    
    // Update average validation time
    const totalTime = this.metrics.averageValidationTimeMs * (this.metrics.totalValidations - 1) + duration;
    this.metrics.averageValidationTimeMs = totalTime / this.metrics.totalValidations;
    
    // Update event type metrics
    if (!this.metrics.validationTimesByEventType[event.type]) {
      this.metrics.validationTimesByEventType[event.type] = [];
    }
    this.metrics.validationTimesByEventType[event.type].push(duration);
    
    // Update journey metrics
    const journey = event.metadata?.journey || event.type.split('.')[0];
    if (journey) {
      if (!this.metrics.validationTimesByJourney[journey]) {
        this.metrics.validationTimesByJourney[journey] = [];
      }
      this.metrics.validationTimesByJourney[journey].push(duration);
    }
  }
}

/**
 * Factory for creating pre-configured MockEventValidator instances
 */
export const MockEventValidatorFactory = {
  /**
   * Creates a validator that always passes validation
   * @returns MockEventValidator that always passes
   */
  createPassingValidator: (): MockEventValidator => {
    return new MockEventValidator({
      simulateFailures: false,
      validateVersions: true,
      validateNestedFields: true
    });
  },
  
  /**
   * Creates a validator that always fails validation
   * @returns MockEventValidator that always fails
   */
  createFailingValidator: (): MockEventValidator => {
    return new MockEventValidator({
      simulateFailures: true,
      failureRate: 100,
      validateVersions: true,
      validateNestedFields: true
    });
  },
  
  /**
   * Creates a validator for a specific journey
   * @param journey The journey to validate (health, care, plan)
   * @returns MockEventValidator for the specified journey
   */
  createJourneyValidator: (journey: 'health' | 'care' | 'plan'): MockEventValidator => {
    return new MockEventValidator({
      supportedJourneys: [journey],
      validateVersions: true,
      validateNestedFields: true
    });
  },
  
  /**
   * Creates a validator for specific event types
   * @param eventTypes Array of event types to validate
   * @returns MockEventValidator for the specified event types
   */
  createEventTypeValidator: (eventTypes: string[]): MockEventValidator => {
    return new MockEventValidator({
      supportedEventTypes: eventTypes,
      validateVersions: true,
      validateNestedFields: true
    });
  },
  
  /**
   * Creates a validator with custom validation rules
   * @param rules Array of custom validation rules
   * @returns MockEventValidator with the specified rules
   */
  createCustomValidator: (rules: MockValidationRule[]): MockEventValidator => {
    return new MockEventValidator({
      customRules: rules,
      validateVersions: true,
      validateNestedFields: true
    });
  }
};