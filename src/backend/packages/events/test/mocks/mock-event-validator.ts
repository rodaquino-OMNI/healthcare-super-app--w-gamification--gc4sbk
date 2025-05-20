/**
 * @file mock-event-validator.ts
 * @description Provides a comprehensive validation framework for testing event payload compliance with schemas.
 * This mock allows tests to verify that events conform to the expected structure for each journey and event type
 * without requiring the full validation pipeline. It supports testing of both valid and invalid events with
 * detailed error reporting for validation failures.
 *
 * @module events/test/mocks
 */

import { ValidationError } from '../../src/dto/validation';
import { ERROR_CODES, ERROR_MESSAGES } from '../../src/constants/errors.constants';

/**
 * Interface for event validation result
 */
export interface EventValidationResult {
  /**
   * Whether the event is valid
   */
  isValid: boolean;

  /**
   * Validation errors, if any
   */
  errors?: ValidationError[];

  /**
   * Performance metrics for validation
   */
  metrics?: {
    /**
     * Time taken to validate the event in milliseconds
     */
    validationTimeMs: number;

    /**
     * Number of fields validated
     */
    fieldsValidated: number;

    /**
     * Number of schema rules applied
     */
    rulesApplied: number;
  };
}

/**
 * Interface for event validator
 */
export interface IEventValidator {
  /**
   * Validates an event against its schema
   * 
   * @param event The event to validate
   * @param options Additional validation options
   * @returns Promise resolving to validation result
   */
  validate(event: any, options?: EventValidatorOptions): Promise<EventValidationResult>;

  /**
   * Validates an event synchronously against its schema
   * 
   * @param event The event to validate
   * @param options Additional validation options
   * @returns Validation result
   */
  validateSync(event: any, options?: EventValidatorOptions): EventValidationResult;

  /**
   * Gets the schema for a specific event type and journey
   * 
   * @param eventType The event type
   * @param journey The journey
   * @param version Optional schema version
   * @returns The schema or null if not found
   */
  getSchema(eventType: string, journey: string, version?: string): any | null;
}

/**
 * Options for event validation
 */
export interface EventValidatorOptions {
  /**
   * Whether to collect performance metrics
   */
  collectMetrics?: boolean;

  /**
   * Whether to validate nested fields
   */
  validateNested?: boolean;

  /**
   * Whether to stop validation on first error
   */
  stopOnFirstError?: boolean;

  /**
   * Specific schema version to validate against
   */
  schemaVersion?: string;

  /**
   * Whether to apply journey-specific validation rules
   */
  applyJourneyRules?: boolean;
}

/**
 * Schema definition for event validation
 */
export interface EventSchema {
  /**
   * Schema version
   */
  version: string;

  /**
   * Schema properties
   */
  properties: Record<string, SchemaProperty>;

  /**
   * Required properties
   */
  required: string[];

  /**
   * Journey-specific validation rules
   */
  journeyRules?: Record<string, JourneyRule[]>;
}

/**
 * Schema property definition
 */
export interface SchemaProperty {
  /**
   * Property type
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /**
   * Property format (for string types)
   */
  format?: 'uuid' | 'date-time' | 'email' | 'uri';

  /**
   * Minimum value (for number types)
   */
  minimum?: number;

  /**
   * Maximum value (for number types)
   */
  maximum?: number;

  /**
   * Minimum length (for string types)
   */
  minLength?: number;

  /**
   * Maximum length (for string types)
   */
  maxLength?: number;

  /**
   * Pattern (for string types)
   */
  pattern?: string;

  /**
   * Enum values (for string types)
   */
  enum?: string[];

  /**
   * Properties (for object types)
   */
  properties?: Record<string, SchemaProperty>;

  /**
   * Required properties (for object types)
   */
  required?: string[];

  /**
   * Items (for array types)
   */
  items?: SchemaProperty;
}

/**
 * Journey-specific validation rule
 */
export interface JourneyRule {
  /**
   * Rule type
   */
  type: 'required' | 'prohibited' | 'conditional' | 'format' | 'range' | 'custom';

  /**
   * Fields affected by the rule
   */
  fields: string[];

  /**
   * Condition for the rule
   */
  condition?: {
    /**
     * Field to check
     */
    field: string;

    /**
     * Operator for the condition
     */
    operator: '==' | '!=' | 'in' | 'not-in' | '>' | '<' | '>=' | '<=';

    /**
     * Value to compare against
     */
    value: any;
  };

  /**
   * Custom validation function
   */
  validate?: (value: any, event: any) => boolean;

  /**
   * Error message for validation failure
   */
  errorMessage?: string;
}

/**
 * Mock implementation of event validator for testing
 */
export class MockEventValidator implements IEventValidator {
  private schemas: Record<string, Record<string, Record<string, EventSchema>>> = {};
  private defaultOptions: EventValidatorOptions = {
    collectMetrics: true,
    validateNested: true,
    stopOnFirstError: false,
    applyJourneyRules: true,
  };

  /**
   * Creates a new instance of MockEventValidator
   * 
   * @param mockSchemas Optional mock schemas to initialize with
   */
  constructor(mockSchemas?: Record<string, Record<string, Record<string, EventSchema>>>) {
    if (mockSchemas) {
      this.schemas = mockSchemas;
    } else {
      this.initializeDefaultSchemas();
    }
  }

  /**
   * Initializes default schemas for common event types
   */
  private initializeDefaultSchemas(): void {
    // Health journey schemas
    this.registerSchema('HEALTH_METRIC_RECORDED', 'health', this.createHealthMetricSchema());
    this.registerSchema('HEALTH_GOAL_ACHIEVED', 'health', this.createHealthGoalSchema());
    this.registerSchema('DEVICE_SYNCHRONIZED', 'health', this.createDeviceSyncSchema());

    // Care journey schemas
    this.registerSchema('APPOINTMENT_BOOKED', 'care', this.createAppointmentSchema());
    this.registerSchema('MEDICATION_ADHERENCE', 'care', this.createMedicationSchema());

    // Plan journey schemas
    this.registerSchema('CLAIM_SUBMITTED', 'plan', this.createClaimSchema());
    this.registerSchema('BENEFIT_UTILIZED', 'plan', this.createBenefitSchema());

    // User journey schemas
    this.registerSchema('USER_REGISTERED', 'user', this.createUserSchema());

    // Gamification journey schemas
    this.registerSchema('ACHIEVEMENT_UNLOCKED', 'gamification', this.createAchievementSchema());
  }

  /**
   * Creates a schema for health metric events
   * 
   * @returns Health metric event schema
   */
  private createHealthMetricSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['health'] },
        type: { type: 'string', enum: ['HEALTH_METRIC_RECORDED'] },
        payload: {
          type: 'object',
          properties: {
            metricType: {
              type: 'string',
              enum: [
                'HEART_RATE',
                'BLOOD_PRESSURE',
                'BLOOD_GLUCOSE',
                'STEPS',
                'WEIGHT',
                'SLEEP',
                'TEMPERATURE',
                'OXYGEN_SATURATION',
                'RESPIRATORY_RATE',
                'WATER_INTAKE',
                'CALORIES'
              ],
            },
            value: { type: 'number' },
            unit: { type: 'string' },
            recordedAt: { type: 'string', format: 'date-time' },
            deviceId: { type: 'string', format: 'uuid' },
            deviceType: { type: 'string' },
          },
          required: ['metricType', 'value', 'unit', 'recordedAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
      journeyRules: {
        'health': [
          {
            type: 'custom',
            fields: ['payload.value'],
            validate: (value, event) => {
              const metricType = event.payload.metricType;
              switch (metricType) {
                case 'HEART_RATE':
                  return value >= 30 && value <= 220;
                case 'BLOOD_GLUCOSE':
                  return value >= 20 && value <= 600;
                case 'STEPS':
                  return value >= 0 && value <= 100000;
                case 'SLEEP':
                  return value >= 0 && value <= 24;
                case 'WEIGHT':
                  return value >= 0 && value <= 500;
                case 'TEMPERATURE':
                  return value >= 30 && value <= 45;
                case 'OXYGEN_SATURATION':
                  return value >= 50 && value <= 100;
                case 'RESPIRATORY_RATE':
                  return value >= 0 && value <= 100;
                case 'WATER_INTAKE':
                  return value >= 0 && value <= 10000;
                case 'CALORIES':
                  return value >= 0 && value <= 10000;
                default:
                  return true;
              }
            },
            errorMessage: 'Value is out of range for the specified metric type',
          },
          {
            type: 'custom',
            fields: ['payload.unit'],
            validate: (value, event) => {
              const metricType = event.payload.metricType;
              switch (metricType) {
                case 'HEART_RATE':
                  return value === 'bpm';
                case 'BLOOD_GLUCOSE':
                  return ['mg/dL', 'mmol/L'].includes(value);
                case 'STEPS':
                  return value === 'steps';
                case 'SLEEP':
                  return ['hours', 'minutes'].includes(value);
                case 'WEIGHT':
                  return ['kg', 'lb'].includes(value);
                case 'TEMPERATURE':
                  return ['°C', '°F'].includes(value);
                case 'OXYGEN_SATURATION':
                  return value === '%';
                case 'RESPIRATORY_RATE':
                  return value === 'breaths/min';
                case 'WATER_INTAKE':
                  return ['ml', 'oz'].includes(value);
                case 'CALORIES':
                  return value === 'kcal';
                default:
                  return true;
              }
            },
            errorMessage: 'Unit is not valid for the specified metric type',
          },
        ],
      },
    };
  }

  /**
   * Creates a schema for health goal events
   * 
   * @returns Health goal event schema
   */
  private createHealthGoalSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['health'] },
        type: { type: 'string', enum: ['HEALTH_GOAL_ACHIEVED'] },
        payload: {
          type: 'object',
          properties: {
            goalId: { type: 'string', format: 'uuid' },
            goalType: {
              type: 'string',
              enum: [
                'STEPS_GOAL',
                'WEIGHT_GOAL',
                'SLEEP_GOAL',
                'ACTIVITY_GOAL',
                'WATER_INTAKE_GOAL',
                'NUTRITION_GOAL',
              ],
            },
            targetValue: { type: 'number' },
            achievedValue: { type: 'number' },
            unit: { type: 'string' },
            achievedAt: { type: 'string', format: 'date-time' },
            streakCount: { type: 'number' },
          },
          required: ['goalId', 'goalType', 'targetValue', 'achievedValue', 'achievedAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
      journeyRules: {
        'health': [
          {
            type: 'conditional',
            fields: ['payload.unit'],
            condition: {
              field: 'payload.goalType',
              operator: '==',
              value: 'STEPS_GOAL',
            },
            validate: (value) => value === 'steps',
            errorMessage: 'Unit must be "steps" for step goals',
          },
          {
            type: 'conditional',
            fields: ['payload.unit'],
            condition: {
              field: 'payload.goalType',
              operator: '==',
              value: 'WEIGHT_GOAL',
            },
            validate: (value) => ['kg', 'lb'].includes(value),
            errorMessage: 'Unit must be "kg" or "lb" for weight goals',
          },
        ],
      },
    };
  }

  /**
   * Creates a schema for device synchronization events
   * 
   * @returns Device synchronization event schema
   */
  private createDeviceSyncSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['health'] },
        type: { type: 'string', enum: ['DEVICE_SYNCHRONIZED'] },
        payload: {
          type: 'object',
          properties: {
            deviceId: { type: 'string', format: 'uuid' },
            deviceType: {
              type: 'string',
              enum: [
                'FITNESS_TRACKER',
                'SMARTWATCH',
                'BLOOD_PRESSURE_MONITOR',
                'GLUCOSE_MONITOR',
                'SCALE',
                'SLEEP_TRACKER',
                'THERMOMETER',
                'PULSE_OXIMETER',
              ],
            },
            manufacturer: { type: 'string' },
            model: { type: 'string' },
            syncedAt: { type: 'string', format: 'date-time' },
            metricsCount: { type: 'number', minimum: 0 },
            batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['deviceId', 'deviceType', 'syncedAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
    };
  }

  /**
   * Creates a schema for appointment events
   * 
   * @returns Appointment event schema
   */
  private createAppointmentSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['care'] },
        type: { type: 'string', enum: ['APPOINTMENT_BOOKED'] },
        payload: {
          type: 'object',
          properties: {
            appointmentId: { type: 'string', format: 'uuid' },
            providerId: { type: 'string', format: 'uuid' },
            specialtyId: { type: 'string', format: 'uuid' },
            appointmentType: {
              type: 'string',
              enum: ['IN_PERSON', 'TELEMEDICINE', 'HOME_VISIT'],
            },
            status: {
              type: 'string',
              enum: [
                'SCHEDULED',
                'CONFIRMED',
                'CHECKED_IN',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
                'NO_SHOW',
                'RESCHEDULED',
              ],
            },
            scheduledAt: { type: 'string', format: 'date-time' },
            duration: { type: 'number', minimum: 0 },
            location: { type: 'string' },
          },
          required: ['appointmentId', 'providerId', 'appointmentType', 'status', 'scheduledAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
      journeyRules: {
        'care': [
          {
            type: 'conditional',
            fields: ['payload.location'],
            condition: {
              field: 'payload.appointmentType',
              operator: '==',
              value: 'IN_PERSON',
            },
            validate: (value) => !!value && value.length > 0,
            errorMessage: 'Location is required for in-person appointments',
          },
        ],
      },
    };
  }

  /**
   * Creates a schema for medication events
   * 
   * @returns Medication event schema
   */
  private createMedicationSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['care'] },
        type: { type: 'string', enum: ['MEDICATION_ADHERENCE'] },
        payload: {
          type: 'object',
          properties: {
            medicationId: { type: 'string', format: 'uuid' },
            medicationName: { type: 'string' },
            dosage: { type: 'string' },
            adherenceType: {
              type: 'string',
              enum: ['TAKEN_ON_TIME', 'TAKEN_LATE', 'MISSED', 'SKIPPED'],
            },
            scheduledAt: { type: 'string', format: 'date-time' },
            takenAt: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
          },
          required: ['medicationId', 'medicationName', 'adherenceType', 'scheduledAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
      journeyRules: {
        'care': [
          {
            type: 'conditional',
            fields: ['payload.takenAt'],
            condition: {
              field: 'payload.adherenceType',
              operator: 'in',
              value: ['TAKEN_ON_TIME', 'TAKEN_LATE'],
            },
            validate: (value) => !!value,
            errorMessage: 'takenAt is required when medication is taken',
          },
        ],
      },
    };
  }

  /**
   * Creates a schema for claim events
   * 
   * @returns Claim event schema
   */
  private createClaimSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['plan'] },
        type: { type: 'string', enum: ['CLAIM_SUBMITTED'] },
        payload: {
          type: 'object',
          properties: {
            claimId: { type: 'string', format: 'uuid' },
            claimType: {
              type: 'string',
              enum: [
                'MEDICAL_CONSULTATION',
                'EXAMINATION',
                'THERAPY',
                'HOSPITALIZATION',
                'MEDICATION',
                'OTHER',
              ],
            },
            amount: { type: 'number', minimum: 0 },
            currency: { type: 'string', enum: ['BRL'] },
            serviceDate: { type: 'string', format: 'date-time' },
            providerId: { type: 'string', format: 'uuid' },
            providerName: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'SUBMITTED',
                'UNDER_REVIEW',
                'ADDITIONAL_INFO_REQUIRED',
                'APPROVED',
                'PARTIALLY_APPROVED',
                'REJECTED',
                'PAYMENT_PENDING',
                'PAYMENT_PROCESSED',
                'APPEALED',
              ],
            },
            documents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  documentId: { type: 'string', format: 'uuid' },
                  documentType: {
                    type: 'string',
                    enum: ['RECEIPT', 'PRESCRIPTION', 'MEDICAL_REPORT', 'OTHER'],
                  },
                  fileName: { type: 'string' },
                  fileSize: { type: 'number', minimum: 0 },
                  mimeType: { type: 'string' },
                  uploadedAt: { type: 'string', format: 'date-time' },
                },
                required: ['documentId', 'documentType', 'fileName', 'uploadedAt'],
              },
            },
          },
          required: ['claimId', 'claimType', 'amount', 'currency', 'serviceDate', 'status'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
      journeyRules: {
        'plan': [
          {
            type: 'conditional',
            fields: ['payload.documents'],
            condition: {
              field: 'payload.status',
              operator: '==',
              value: 'SUBMITTED',
            },
            validate: (value) => Array.isArray(value) && value.length > 0,
            errorMessage: 'At least one document is required for submitted claims',
          },
        ],
      },
    };
  }

  /**
   * Creates a schema for benefit events
   * 
   * @returns Benefit event schema
   */
  private createBenefitSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['plan'] },
        type: { type: 'string', enum: ['BENEFIT_UTILIZED'] },
        payload: {
          type: 'object',
          properties: {
            benefitId: { type: 'string', format: 'uuid' },
            benefitType: {
              type: 'string',
              enum: [
                'DISCOUNT',
                'CASHBACK',
                'FREE_SERVICE',
                'WELLNESS_PROGRAM',
                'OTHER',
              ],
            },
            benefitName: { type: 'string' },
            utilizedAt: { type: 'string', format: 'date-time' },
            value: { type: 'number' },
            currency: { type: 'string', enum: ['BRL'] },
            partnerId: { type: 'string', format: 'uuid' },
            partnerName: { type: 'string' },
          },
          required: ['benefitId', 'benefitType', 'benefitName', 'utilizedAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
    };
  }

  /**
   * Creates a schema for user events
   * 
   * @returns User event schema
   */
  private createUserSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['user'] },
        type: { type: 'string', enum: ['USER_REGISTERED'] },
        payload: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            cpf: { type: 'string', pattern: '^\\d{11}$' },
            birthDate: { type: 'string', format: 'date-time' },
            gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
            registeredAt: { type: 'string', format: 'date-time' },
            source: { type: 'string' },
          },
          required: ['name', 'email', 'registeredAt'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
    };
  }

  /**
   * Creates a schema for achievement events
   * 
   * @returns Achievement event schema
   */
  private createAchievementSchema(): EventSchema {
    return {
      version: '1.0.0',
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        userId: { type: 'string', format: 'uuid' },
        journey: { type: 'string', enum: ['gamification'] },
        type: { type: 'string', enum: ['ACHIEVEMENT_UNLOCKED'] },
        payload: {
          type: 'object',
          properties: {
            achievementId: { type: 'string', format: 'uuid' },
            achievementType: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            level: { type: 'number', minimum: 1 },
            maxLevel: { type: 'number', minimum: 1 },
            xpEarned: { type: 'number', minimum: 0 },
            unlockedAt: { type: 'string', format: 'date-time' },
            sourceJourney: { type: 'string', enum: ['health', 'care', 'plan'] },
            icon: { type: 'string' },
          },
          required: ['achievementId', 'achievementType', 'title', 'level', 'xpEarned', 'unlockedAt', 'sourceJourney'],
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
          },
          required: ['source'],
        },
      },
      required: ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'],
    };
  }

  /**
   * Registers a schema for a specific event type and journey
   * 
   * @param eventType The event type
   * @param journey The journey
   * @param schema The schema to register
   */
  public registerSchema(eventType: string, journey: string, schema: EventSchema): void {
    if (!this.schemas[journey]) {
      this.schemas[journey] = {};
    }
    if (!this.schemas[journey][eventType]) {
      this.schemas[journey][eventType] = {};
    }
    this.schemas[journey][eventType][schema.version] = schema;
  }

  /**
   * Gets the schema for a specific event type and journey
   * 
   * @param eventType The event type
   * @param journey The journey
   * @param version Optional schema version
   * @returns The schema or null if not found
   */
  public getSchema(eventType: string, journey: string, version?: string): EventSchema | null {
    if (!this.schemas[journey] || !this.schemas[journey][eventType]) {
      return null;
    }

    if (version) {
      return this.schemas[journey][eventType][version] || null;
    }

    // Return the latest version if no specific version is requested
    const versions = Object.keys(this.schemas[journey][eventType]);
    if (versions.length === 0) {
      return null;
    }

    // Sort versions semantically
    versions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = i < aParts.length ? aParts[i] : 0;
        const bVal = i < bParts.length ? bParts[i] : 0;

        if (aVal !== bVal) {
          return bVal - aVal; // Descending order
        }
      }

      return 0;
    });

    return this.schemas[journey][eventType][versions[0]] || null;
  }

  /**
   * Validates an event against its schema
   * 
   * @param event The event to validate
   * @param options Additional validation options
   * @returns Promise resolving to validation result
   */
  public async validate(event: any, options?: EventValidatorOptions): Promise<EventValidationResult> {
    // Simulate async validation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.validateSync(event, options));
      }, 10);
    });
  }

  /**
   * Validates an event synchronously against its schema
   * 
   * @param event The event to validate
   * @param options Additional validation options
   * @returns Validation result
   */
  public validateSync(event: any, options?: EventValidatorOptions): EventValidationResult {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    const errors: ValidationError[] = [];
    let fieldsValidated = 0;
    let rulesApplied = 0;

    // Basic event structure validation
    if (!event) {
      errors.push({
        property: 'event',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Event cannot be null or undefined',
      });
      return {
        isValid: false,
        errors,
        metrics: mergedOptions.collectMetrics ? {
          validationTimeMs: Date.now() - startTime,
          fieldsValidated,
          rulesApplied,
        } : undefined,
      };
    }

    if (typeof event !== 'object') {
      errors.push({
        property: 'event',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Event must be an object',
      });
      return {
        isValid: false,
        errors,
        metrics: mergedOptions.collectMetrics ? {
          validationTimeMs: Date.now() - startTime,
          fieldsValidated,
          rulesApplied,
        } : undefined,
      };
    }

    // Check required top-level fields
    const requiredFields = ['eventId', 'timestamp', 'userId', 'journey', 'type', 'payload'];
    for (const field of requiredFields) {
      fieldsValidated++;
      rulesApplied++;
      if (event[field] === undefined) {
        errors.push({
          property: field,
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: `${field} is required`,
        });
        if (mergedOptions.stopOnFirstError) {
          return {
            isValid: false,
            errors,
            metrics: mergedOptions.collectMetrics ? {
              validationTimeMs: Date.now() - startTime,
              fieldsValidated,
              rulesApplied,
            } : undefined,
          };
        }
      }
    }

    // Get schema for the event
    const schema = this.getSchema(
      event.type,
      event.journey,
      mergedOptions.schemaVersion
    );

    if (!schema) {
      errors.push({
        property: 'event',
        errorCode: ERROR_CODES.SCHEMA_NOT_FOUND,
        message: `Schema not found for event type ${event.type} and journey ${event.journey}${mergedOptions.schemaVersion ? ` with version ${mergedOptions.schemaVersion}` : ''}`,
      });
      return {
        isValid: false,
        errors,
        metrics: mergedOptions.collectMetrics ? {
          validationTimeMs: Date.now() - startTime,
          fieldsValidated,
          rulesApplied,
        } : undefined,
      };
    }

    // Validate against schema
    this.validateAgainstSchema(event, schema, '', errors, mergedOptions, fieldsValidated, rulesApplied);

    // Apply journey-specific rules if enabled
    if (mergedOptions.applyJourneyRules && schema.journeyRules && schema.journeyRules[event.journey]) {
      this.applyJourneyRules(event, schema.journeyRules[event.journey], errors, mergedOptions);
      rulesApplied += schema.journeyRules[event.journey].length;
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      metrics: mergedOptions.collectMetrics ? {
        validationTimeMs: Date.now() - startTime,
        fieldsValidated,
        rulesApplied,
      } : undefined,
    };
  }

  /**
   * Validates an event against a schema
   * 
   * @param event The event to validate
   * @param schema The schema to validate against
   * @param path The current path in the event
   * @param errors Array to collect validation errors
   * @param options Validation options
   * @param fieldsValidated Number of fields validated so far
   * @param rulesApplied Number of rules applied so far
   */
  private validateAgainstSchema(
    event: any,
    schema: EventSchema,
    path: string,
    errors: ValidationError[],
    options: EventValidatorOptions,
    fieldsValidated: number,
    rulesApplied: number
  ): void {
    // Validate required fields
    for (const field of schema.required) {
      fieldsValidated++;
      rulesApplied++;
      const fieldPath = path ? `${path}.${field}` : field;
      const value = this.getValueAtPath(event, fieldPath);

      if (value === undefined) {
        errors.push({
          property: fieldPath,
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: `${fieldPath} is required`,
        });
        if (options.stopOnFirstError) {
          return;
        }
      }
    }

    // Validate properties
    for (const [field, propSchema] of Object.entries(schema.properties)) {
      fieldsValidated++;
      const fieldPath = path ? `${path}.${field}` : field;
      const value = this.getValueAtPath(event, fieldPath);

      if (value === undefined) {
        continue; // Skip validation for undefined fields that aren't required
      }

      // Validate type
      rulesApplied++;
      if (!this.validateType(value, propSchema.type)) {
        errors.push({
          property: fieldPath,
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: `${fieldPath} must be of type ${propSchema.type}`,
        });
        if (options.stopOnFirstError) {
          return;
        }
        continue; // Skip further validation for this field
      }

      // Validate format
      if (propSchema.format) {
        rulesApplied++;
        if (!this.validateFormat(value, propSchema.format)) {
          errors.push({
            property: fieldPath,
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: `${fieldPath} must be a valid ${propSchema.format}`,
          });
          if (options.stopOnFirstError) {
            return;
          }
        }
      }

      // Validate enum
      if (propSchema.enum) {
        rulesApplied++;
        if (!propSchema.enum.includes(value)) {
          errors.push({
            property: fieldPath,
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: `${fieldPath} must be one of [${propSchema.enum.join(', ')}]`,
          });
          if (options.stopOnFirstError) {
            return;
          }
        }
      }

      // Validate string constraints
      if (propSchema.type === 'string') {
        if (propSchema.minLength !== undefined) {
          rulesApplied++;
          if (value.length < propSchema.minLength) {
            errors.push({
              property: fieldPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${fieldPath} must be at least ${propSchema.minLength} characters long`,
            });
            if (options.stopOnFirstError) {
              return;
            }
          }
        }

        if (propSchema.maxLength !== undefined) {
          rulesApplied++;
          if (value.length > propSchema.maxLength) {
            errors.push({
              property: fieldPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${fieldPath} must be at most ${propSchema.maxLength} characters long`,
            });
            if (options.stopOnFirstError) {
              return;
            }
          }
        }

        if (propSchema.pattern) {
          rulesApplied++;
          const regex = new RegExp(propSchema.pattern);
          if (!regex.test(value)) {
            errors.push({
              property: fieldPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${fieldPath} must match pattern ${propSchema.pattern}`,
            });
            if (options.stopOnFirstError) {
              return;
            }
          }
        }
      }

      // Validate number constraints
      if (propSchema.type === 'number') {
        if (propSchema.minimum !== undefined) {
          rulesApplied++;
          if (value < propSchema.minimum) {
            errors.push({
              property: fieldPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${fieldPath} must be at least ${propSchema.minimum}`,
            });
            if (options.stopOnFirstError) {
              return;
            }
          }
        }

        if (propSchema.maximum !== undefined) {
          rulesApplied++;
          if (value > propSchema.maximum) {
            errors.push({
              property: fieldPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${fieldPath} must be at most ${propSchema.maximum}`,
            });
            if (options.stopOnFirstError) {
              return;
            }
          }
        }
      }

      // Validate nested objects
      if (propSchema.type === 'object' && propSchema.properties && options.validateNested) {
        const nestedSchema: EventSchema = {
          version: schema.version,
          properties: propSchema.properties,
          required: propSchema.required || [],
        };
        this.validateAgainstSchema(event, nestedSchema, fieldPath, errors, options, fieldsValidated, rulesApplied);
      }

      // Validate arrays
      if (propSchema.type === 'array' && propSchema.items && Array.isArray(value) && options.validateNested) {
        for (let i = 0; i < value.length; i++) {
          const itemPath = `${fieldPath}[${i}]`;
          const itemValue = value[i];

          // Validate item type
          rulesApplied++;
          if (!this.validateType(itemValue, propSchema.items.type)) {
            errors.push({
              property: itemPath,
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: `${itemPath} must be of type ${propSchema.items.type}`,
            });
            if (options.stopOnFirstError) {
              return;
            }
            continue; // Skip further validation for this item
          }

          // Validate nested object in array
          if (propSchema.items.type === 'object' && propSchema.items.properties) {
            const nestedSchema: EventSchema = {
              version: schema.version,
              properties: propSchema.items.properties,
              required: propSchema.items.required || [],
            };
            this.validateAgainstSchema(itemValue, nestedSchema, itemPath, errors, options, fieldsValidated, rulesApplied);
          }
        }
      }
    }
  }

  /**
   * Applies journey-specific validation rules
   * 
   * @param event The event to validate
   * @param rules The rules to apply
   * @param errors Array to collect validation errors
   * @param options Validation options
   */
  private applyJourneyRules(
    event: any,
    rules: JourneyRule[],
    errors: ValidationError[],
    options: EventValidatorOptions
  ): void {
    for (const rule of rules) {
      // Skip rule if condition doesn't match
      if (rule.condition) {
        const conditionValue = this.getValueAtPath(event, rule.condition.field);
        if (!this.evaluateCondition(conditionValue, rule.condition.operator, rule.condition.value)) {
          continue;
        }
      }

      // Apply rule to all specified fields
      for (const field of rule.fields) {
        const value = this.getValueAtPath(event, field);

        switch (rule.type) {
          case 'required':
            if (value === undefined) {
              errors.push({
                property: field,
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: rule.errorMessage || `${field} is required`,
              });
              if (options.stopOnFirstError) {
                return;
              }
            }
            break;

          case 'prohibited':
            if (value !== undefined) {
              errors.push({
                property: field,
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: rule.errorMessage || `${field} is not allowed`,
              });
              if (options.stopOnFirstError) {
                return;
              }
            }
            break;

          case 'conditional':
          case 'custom':
            if (rule.validate && !rule.validate(value, event)) {
              errors.push({
                property: field,
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: rule.errorMessage || `${field} failed validation`,
              });
              if (options.stopOnFirstError) {
                return;
              }
            }
            break;
        }
      }
    }
  }

  /**
   * Gets a value at a specific path in an object
   * 
   * @param obj The object to get the value from
   * @param path The path to the value
   * @returns The value at the path or undefined if not found
   */
  private getValueAtPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      // Handle array indexing
      const match = part.match(/^([^\[]+)\[(\d+)\]$/);
      if (match) {
        const [, arrayName, indexStr] = match;
        const index = parseInt(indexStr, 10);
        current = current[arrayName];
        if (!Array.isArray(current) || index >= current.length) {
          return undefined;
        }
        current = current[index];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Validates that a value is of the specified type
   * 
   * @param value The value to validate
   * @param type The expected type
   * @returns Whether the value is of the expected type
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validates that a value matches the specified format
   * 
   * @param value The value to validate
   * @param format The expected format
   * @returns Whether the value matches the expected format
   */
  private validateFormat(value: any, format: string): boolean {
    switch (format) {
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      case 'date-time':
        try {
          const date = new Date(value);
          return !isNaN(date.getTime());
        } catch (e) {
          return false;
        }
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'uri':
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Evaluates a condition
   * 
   * @param value The value to evaluate
   * @param operator The operator to use
   * @param compareValue The value to compare against
   * @returns Whether the condition is met
   */
  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case '==':
        return value === compareValue;
      case '!=':
        return value !== compareValue;
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);
      case 'not-in':
        return Array.isArray(compareValue) && !compareValue.includes(value);
      case '>':
        return value > compareValue;
      case '<':
        return value < compareValue;
      case '>=':
        return value >= compareValue;
      case '<=':
        return value <= compareValue;
      default:
        return false;
    }
  }
}