/**
 * @file validation.fixtures.ts
 * @description Test fixtures for event validation logic, including edge cases, boundary values, and invalid data patterns.
 * These fixtures provide comprehensive test scenarios for validating the event DTOs and ensuring proper error handling.
 */

import { JourneyType, HealthEventType, CareEventType, PlanEventType } from '../../../src/interfaces/journey-events.interface';
import { ValidationSeverity } from '../../../src/interfaces/event-validation.interface';

// ===== VALID EVENT FIXTURES =====

/**
 * Valid base event fixture with all required fields
 */
export const validBaseEventFixture = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  source: 'test-service',
  type: 'test.event.created',
  payload: { test: 'data' },
  metadata: {
    correlationId: 'corr-123456',
    userId: 'user-123456',
  },
};

/**
 * Valid journey event fixture with all required fields
 */
export const validJourneyEventFixture = {
  ...validBaseEventFixture,
  journeyType: JourneyType.HEALTH,
  userId: 'user-123456',
  correlationId: 'corr-123456',
  sessionId: 'session-123456',
  deviceInfo: {
    type: 'mobile',
    id: 'device-123456',
    model: 'iPhone 13',
    os: 'iOS 15.4',
    appVersion: '1.2.3',
  },
};

// ===== HEALTH JOURNEY EVENT FIXTURES =====

/**
 * Valid health metric recorded event fixture
 */
export const validHealthMetricRecordedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.HEALTH,
  type: HealthEventType.METRIC_RECORDED,
  payload: {
    metric: {
      id: 'metric-123456',
      userId: 'user-123456',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    source: 'manual',
  },
};

/**
 * Valid health goal achieved event fixture
 */
export const validHealthGoalAchievedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.HEALTH,
  type: HealthEventType.GOAL_ACHIEVED,
  payload: {
    goal: {
      id: 'goal-123456',
      userId: 'user-123456',
      type: 'STEPS',
    },
    achievedValue: 10000,
    targetValue: 8000,
    achievedDate: new Date().toISOString(),
    daysToAchieve: 5,
    streakCount: 3,
  },
};

/**
 * Valid device connected event fixture
 */
export const validDeviceConnectedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.HEALTH,
  type: HealthEventType.DEVICE_CONNECTED,
  payload: {
    device: {
      id: 'device-123456',
      userId: 'user-123456',
      type: 'Smartwatch',
    },
    deviceType: 'Smartwatch',
    connectionDate: new Date().toISOString(),
    isFirstConnection: true,
    permissions: ['heart_rate', 'steps', 'sleep'],
  },
};

// ===== CARE JOURNEY EVENT FIXTURES =====

/**
 * Valid appointment booked event fixture
 */
export const validAppointmentBookedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.CARE,
  type: CareEventType.APPOINTMENT_BOOKED,
  payload: {
    appointment: {
      id: 'appointment-123456',
      userId: 'user-123456',
      status: 'SCHEDULED',
    },
    provider: 'Dr. Smith',
    appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    appointmentType: 'Consultation',
    isFirstAppointment: false,
    isUrgent: false,
  },
};

/**
 * Valid medication taken event fixture
 */
export const validMedicationTakenEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.CARE,
  type: CareEventType.MEDICATION_TAKEN,
  payload: {
    medication: {
      id: 'medication-123456',
      userId: 'user-123456',
      name: 'Aspirin',
    },
    takenDate: new Date().toISOString(),
    scheduledTime: new Date().toISOString(),
    takenOnTime: true,
    dosageTaken: '100mg',
  },
};

/**
 * Valid telemedicine completed event fixture
 */
export const validTelemedicineCompletedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.CARE,
  type: CareEventType.TELEMEDICINE_COMPLETED,
  payload: {
    session: {
      id: 'session-123456',
      userId: 'user-123456',
      status: 'COMPLETED',
    },
    provider: 'Dr. Johnson',
    endDate: new Date().toISOString(),
    duration: 15, // 15 minutes
    connectionIssues: false,
    followUpRequired: true,
    prescriptionIssued: true,
    patientRating: 5,
  },
};

// ===== PLAN JOURNEY EVENT FIXTURES =====

/**
 * Valid claim submitted event fixture
 */
export const validClaimSubmittedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.PLAN,
  type: PlanEventType.CLAIM_SUBMITTED,
  payload: {
    claim: {
      id: 'claim-123456',
      userId: 'user-123456',
      status: 'SUBMITTED',
    },
    submissionDate: new Date().toISOString(),
    amount: 150.75,
    serviceDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    provider: 'City Hospital',
    hasDocuments: true,
    documentCount: 2,
    isFirstClaim: false,
  },
};

/**
 * Valid benefit used event fixture
 */
export const validBenefitUsedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.PLAN,
  type: PlanEventType.BENEFIT_USED,
  payload: {
    benefit: {
      id: 'benefit-123456',
      userId: 'user-123456',
      name: 'Dental Coverage',
    },
    usageDate: new Date().toISOString(),
    serviceDescription: 'Dental Cleaning',
    amountUsed: 75.0,
    remainingAmount: 425.0,
    remainingPercentage: 85,
    isFirstUse: false,
  },
};

/**
 * Valid plan selected event fixture
 */
export const validPlanSelectedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.PLAN,
  type: PlanEventType.PLAN_SELECTED,
  payload: {
    plan: {
      id: 'plan-123456',
      userId: 'user-123456',
      name: 'Premium Health Plan',
    },
    selectionDate: new Date().toISOString(),
    effectiveDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    premium: 350.0,
    paymentFrequency: 'monthly',
    isFirstPlan: false,
    comparedPlansCount: 3,
  },
};

// ===== INVALID EVENT FIXTURES =====

/**
 * Invalid base event fixture missing required fields
 */
export const invalidBaseEventFixture = {
  // Missing eventId
  timestamp: new Date().toISOString(),
  // Missing version
  source: 'test-service',
  type: 'test.event.created',
  payload: { test: 'data' },
};

/**
 * Invalid journey event fixture missing required fields
 */
export const invalidJourneyEventFixture = {
  ...validBaseEventFixture,
  // Missing journeyType
  // Missing userId
};

/**
 * Invalid health metric recorded event fixture with invalid data
 */
export const invalidHealthMetricRecordedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.HEALTH,
  type: HealthEventType.METRIC_RECORDED,
  payload: {
    // Missing metric object
    metricType: 'INVALID_TYPE', // Invalid metric type
    value: -10, // Invalid negative value
    // Missing unit
    timestamp: 'not-a-date', // Invalid date format
    source: 'unknown', // Invalid source
  },
};

/**
 * Invalid appointment booked event fixture with invalid data
 */
export const invalidAppointmentBookedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.CARE,
  type: CareEventType.APPOINTMENT_BOOKED,
  payload: {
    // Missing appointment object
    // Missing provider
    appointmentDate: new Date(Date.now() - 86400000).toISOString(), // Invalid past date
    appointmentType: '', // Empty string
    isFirstAppointment: 'yes', // Invalid boolean
    isUrgent: null, // Invalid null
  },
};

/**
 * Invalid claim submitted event fixture with invalid data
 */
export const invalidClaimSubmittedEventFixture = {
  ...validJourneyEventFixture,
  journeyType: JourneyType.PLAN,
  type: PlanEventType.CLAIM_SUBMITTED,
  payload: {
    claim: {
      // Missing id
      userId: 'user-123456',
      status: 'INVALID_STATUS', // Invalid status
    },
    submissionDate: new Date().toISOString(),
    amount: 'one-hundred', // Invalid amount
    serviceDate: new Date(Date.now() + 86400000).toISOString(), // Invalid future date
    // Missing provider
    hasDocuments: true,
    documentCount: -1, // Invalid negative count
    isFirstClaim: null, // Invalid null
  },
};

// ===== BOUNDARY VALUE TEST FIXTURES =====

/**
 * Boundary value test fixtures for numeric fields
 */
export const numericBoundaryValueFixtures = {
  // Zero values
  zeroValue: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      value: 0,
    },
  },
  
  // Minimum valid values
  minValidValue: {
    ...validHealthGoalAchievedEventFixture,
    payload: {
      ...validHealthGoalAchievedEventFixture.payload,
      achievedValue: 1,
      daysToAchieve: 1,
    },
  },
  
  // Maximum valid values
  maxValidValue: {
    ...validClaimSubmittedEventFixture,
    payload: {
      ...validClaimSubmittedEventFixture.payload,
      amount: 999999.99,
    },
  },
  
  // Just below valid range
  belowMinValue: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      value: -0.1, // Negative value for health metric
    },
  },
  
  // Just above valid range
  aboveMaxValue: {
    ...validTelemedicineCompletedEventFixture,
    payload: {
      ...validTelemedicineCompletedEventFixture.payload,
      patientRating: 6, // Above 5 scale
    },
  },
  
  // Fractional values
  fractionalValue: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      value: 72.5, // Fractional heart rate
    },
  },
  
  // Very large values
  veryLargeValue: {
    ...validClaimSubmittedEventFixture,
    payload: {
      ...validClaimSubmittedEventFixture.payload,
      amount: 1000000000000, // Unrealistically large claim
    },
  },
};

/**
 * Boundary value test fixtures for date fields
 */
export const dateBoundaryValueFixtures = {
  // Current date
  currentDate: {
    ...validAppointmentBookedEventFixture,
    payload: {
      ...validAppointmentBookedEventFixture.payload,
      appointmentDate: new Date().toISOString(),
    },
  },
  
  // Past date (minimum valid)
  pastDate: {
    ...validClaimSubmittedEventFixture,
    payload: {
      ...validClaimSubmittedEventFixture.payload,
      serviceDate: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
    },
  },
  
  // Future date (maximum valid)
  futureDate: {
    ...validAppointmentBookedEventFixture,
    payload: {
      ...validAppointmentBookedEventFixture.payload,
      appointmentDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year in future
    },
  },
  
  // Invalid date format
  invalidDateFormat: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      timestamp: '2023-13-45T25:70:99Z', // Invalid date
    },
  },
  
  // Empty date string
  emptyDateString: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      timestamp: '',
    },
  },
  
  // Non-ISO format
  nonIsoFormat: {
    ...validHealthMetricRecordedEventFixture,
    payload: {
      ...validHealthMetricRecordedEventFixture.payload,
      timestamp: '04/15/2023 2:30 PM',
    },
  },
};

// ===== COMPLEX VALIDATION SCENARIOS =====

/**
 * Cross-field dependency validation fixtures
 */
export const crossFieldDependencyFixtures = {
  // Start date after end date
  startAfterEnd: {
    ...validJourneyEventFixture,
    journeyType: JourneyType.HEALTH,
    type: HealthEventType.GOAL_CREATED,
    payload: {
      goal: {
        id: 'goal-123456',
        userId: 'user-123456',
        type: 'STEPS',
      },
      goalType: 'STEPS',
      targetValue: 10000,
      unit: 'steps',
      startDate: new Date(Date.now() + 604800000).toISOString(), // 7 days in future
      endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
      recurrence: 'daily',
    },
  },
  
  // Achieved value less than target value
  achievedLessThanTarget: {
    ...validHealthGoalAchievedEventFixture,
    payload: {
      ...validHealthGoalAchievedEventFixture.payload,
      achievedValue: 6000,
      targetValue: 8000,
    },
  },
  
  // Remaining amount inconsistent with used amount
  inconsistentAmounts: {
    ...validBenefitUsedEventFixture,
    payload: {
      ...validBenefitUsedEventFixture.payload,
      amountUsed: 75.0,
      remainingAmount: 425.0,
      remainingPercentage: 50, // Inconsistent percentage
    },
  },
  
  // Medication taken before scheduled time
  takenBeforeScheduled: {
    ...validMedicationTakenEventFixture,
    payload: {
      ...validMedicationTakenEventFixture.payload,
      takenDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      scheduledTime: new Date().toISOString(), // Now
      takenOnTime: true, // Inconsistent with times
    },
  },
};

/**
 * Cross-journey validation fixtures
 */
export const crossJourneyValidationFixtures = {
  // Health event with care journey type
  healthEventWithCareJourney: {
    ...validHealthMetricRecordedEventFixture,
    journeyType: JourneyType.CARE, // Inconsistent journey type
  },
  
  // Care event with plan journey type
  careEventWithPlanJourney: {
    ...validAppointmentBookedEventFixture,
    journeyType: JourneyType.PLAN, // Inconsistent journey type
  },
  
  // Plan event with health journey type
  planEventWithHealthJourney: {
    ...validClaimSubmittedEventFixture,
    journeyType: JourneyType.HEALTH, // Inconsistent journey type
  },
};

/**
 * Validation error fixtures for testing error handling
 */
export const validationErrorFixtures = {
  // Missing required field
  missingRequiredField: {
    code: 'VALIDATION_ERROR_001',
    message: 'Required field is missing',
    field: 'payload.metric',
    severity: ValidationSeverity.ERROR,
  },
  
  // Invalid field type
  invalidFieldType: {
    code: 'VALIDATION_ERROR_002',
    message: 'Field has invalid type',
    field: 'payload.value',
    severity: ValidationSeverity.ERROR,
    context: { expected: 'number', received: 'string' },
  },
  
  // Invalid date format
  invalidDateFormat: {
    code: 'VALIDATION_ERROR_003',
    message: 'Invalid date format',
    field: 'payload.timestamp',
    severity: ValidationSeverity.ERROR,
    context: { expected: 'ISO 8601', received: '04/15/2023' },
  },
  
  // Value out of range
  valueOutOfRange: {
    code: 'VALIDATION_ERROR_004',
    message: 'Value is out of allowed range',
    field: 'payload.patientRating',
    severity: ValidationSeverity.ERROR,
    context: { min: 1, max: 5, received: 6 },
  },
  
  // Cross-field validation error
  crossFieldValidationError: {
    code: 'VALIDATION_ERROR_005',
    message: 'Fields are inconsistent with each other',
    field: 'payload',
    severity: ValidationSeverity.ERROR,
    context: { fields: ['startDate', 'endDate'], reason: 'startDate must be before endDate' },
  },
  
  // Warning level validation issue
  warningValidationIssue: {
    code: 'VALIDATION_WARNING_001',
    message: 'Unusual value detected',
    field: 'payload.value',
    severity: ValidationSeverity.WARNING,
    context: { typical: '60-100', received: '150' },
  },
  
  // Info level validation issue
  infoValidationIssue: {
    code: 'VALIDATION_INFO_001',
    message: 'Field will be deprecated in future versions',
    field: 'payload.legacyField',
    severity: ValidationSeverity.INFO,
    context: { deprecatedVersion: '2.0.0', alternative: 'payload.newField' },
  },
};

/**
 * Schema validation fixtures for testing Zod/class-validator integration
 */
export const schemaValidationFixtures = {
  // Zod validation errors
  zodValidationErrors: [
    {
      code: 'invalid_type',
      expected: 'number',
      received: 'string',
      path: ['payload', 'value'],
      message: 'Expected number, received string',
    },
    {
      code: 'invalid_string',
      validation: 'regex',
      path: ['type'],
      message: 'Invalid event type format',
    },
  ],
  
  // Class-validator validation errors
  classValidatorErrors: [
    {
      property: 'payload.value',
      constraints: {
        isNumber: 'value must be a number',
        min: 'value must be at least 0',
      },
      value: -10,
    },
    {
      property: 'type',
      constraints: {
        matches: 'type must match pattern ^[a-z]+\\.[a-z]+\\.[a-z]+$',
      },
      value: 'invalid-type',
    },
  ],
};