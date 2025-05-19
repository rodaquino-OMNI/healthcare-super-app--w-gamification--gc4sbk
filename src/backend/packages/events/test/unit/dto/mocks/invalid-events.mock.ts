/**
 * Invalid event mocks for testing validation and error handling.
 * 
 * This file provides a collection of intentionally malformed event objects
 * that violate various validation rules. These mocks are used to test the
 * system's ability to properly identify and reject invalid events, ensuring
 * robust error handling throughout the event processing pipeline.
 */

/**
 * Events with missing required fields
 */
export const missingRequiredFields = {
  // Missing type field
  missingType: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // Missing userId field
  missingUserId: {
    type: 'HEALTH_METRIC_RECORDED',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // Missing data field
  missingData: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'health'
  },
  
  // Missing all required fields
  missingAllRequired: {
    journey: 'health'
  }
};

/**
 * Events with incorrect data types
 */
export const incorrectDataTypes = {
  // Type is not a string
  typeNotString: {
    type: 123, // Should be a string
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // UserId is not a UUID string
  userIdNotUuid: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: 'not-a-uuid',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // Data is not an object
  dataNotObject: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: 'not an object',
    journey: 'health'
  },
  
  // Journey is not a string
  journeyNotString: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 123 // Should be a string
  },
  
  // Multiple incorrect types
  multipleIncorrectTypes: {
    type: 123,
    userId: 456,
    data: 'string instead of object',
    journey: true
  }
};

/**
 * Events with empty values
 */
export const emptyValues = {
  // Empty type string
  emptyType: {
    type: '',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // Empty data object
  emptyData: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: {},
    journey: 'health'
  },
  
  // Empty journey string
  emptyJourney: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: ''
  },
  
  // All empty values
  allEmptyValues: {
    type: '',
    userId: '',
    data: {},
    journey: ''
  }
};

/**
 * Events with malformed UUIDs
 */
export const malformedUuids = {
  // Too short UUID
  tooShortUuid: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // UUID with invalid characters
  invalidCharactersUuid: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-42661417400Z', // Z is not valid hex
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // UUID with wrong format (missing dashes)
  wrongFormatUuid: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567e89b12d3a456426614174000', // Missing dashes
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  },
  
  // Completely invalid UUID
  completelyInvalidUuid: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: 'not-a-uuid-at-all',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  }
};

/**
 * Events with invalid journey values
 */
export const invalidJourneyValues = {
  // Journey value that doesn't match any valid journey
  nonExistentJourney: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'invalid-journey'
  },
  
  // Capitalization mismatch
  wrongCapitalization: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'Health' // Should be lowercase 'health'
  },
  
  // Misspelled journey
  misspelledJourney: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'helth' // Misspelled 'health'
  }
};

/**
 * Health journey events with invalid data
 */
export const invalidHealthEvents = {
  // Missing required metric type
  missingMetricType: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { value: 75 }, // Missing metricType
    journey: 'health'
  },
  
  // Invalid metric type
  invalidMetricType: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'INVALID_METRIC', value: 75 },
    journey: 'health'
  },
  
  // Missing metric value
  missingMetricValue: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE' }, // Missing value
    journey: 'health'
  },
  
  // Physiologically impossible value
  impossibleValue: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 500 }, // Impossible heart rate
    journey: 'health'
  },
  
  // Goal event with missing target
  goalMissingTarget: {
    type: 'GOAL_CREATED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { goalType: 'STEPS', currentValue: 0 }, // Missing target value
    journey: 'health'
  },
  
  // Device event with missing device info
  deviceMissingInfo: {
    type: 'DEVICE_CONNECTED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: {}, // Missing device information
    journey: 'health'
  }
};

/**
 * Care journey events with invalid data
 */
export const invalidCareEvents = {
  // Appointment with missing provider
  appointmentMissingProvider: {
    type: 'APPOINTMENT_BOOKED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      appointmentDate: '2023-12-01T10:00:00Z',
      // Missing providerId
    },
    journey: 'care'
  },
  
  // Appointment with invalid date format
  appointmentInvalidDate: {
    type: 'APPOINTMENT_BOOKED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      providerId: '123e4567-e89b-12d3-a456-426614174000',
      appointmentDate: 'not-a-date' // Invalid date format
    },
    journey: 'care'
  },
  
  // Medication event with missing medication name
  medicationMissingName: {
    type: 'MEDICATION_TAKEN',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      dosage: '10mg',
      timestamp: '2023-12-01T08:00:00Z'
      // Missing medication name
    },
    journey: 'care'
  },
  
  // Telemedicine event with missing session ID
  telemedicineMissingSession: {
    type: 'TELEMEDICINE_COMPLETED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      providerId: '123e4567-e89b-12d3-a456-426614174000',
      duration: 1800 // 30 minutes in seconds
      // Missing sessionId
    },
    journey: 'care'
  }
};

/**
 * Plan journey events with invalid data
 */
export const invalidPlanEvents = {
  // Claim with missing amount
  claimMissingAmount: {
    type: 'CLAIM_SUBMITTED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      claimType: 'MEDICAL_CONSULTATION',
      // Missing amount
      description: 'Regular checkup'
    },
    journey: 'plan'
  },
  
  // Claim with invalid amount (negative)
  claimNegativeAmount: {
    type: 'CLAIM_SUBMITTED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      claimType: 'MEDICAL_CONSULTATION',
      amount: -100.00, // Negative amount
      description: 'Regular checkup'
    },
    journey: 'plan'
  },
  
  // Benefit with missing benefit ID
  benefitMissingId: {
    type: 'BENEFIT_UTILIZED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      // Missing benefitId
      utilizationDate: '2023-12-01T14:30:00Z'
    },
    journey: 'plan'
  },
  
  // Plan selection with missing plan details
  planSelectionMissingDetails: {
    type: 'PLAN_SELECTED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: {}, // Missing plan details
    journey: 'plan'
  }
};

/**
 * Events with malformed timestamps
 */
export const invalidTimestamps = {
  // Invalid ISO format
  invalidIsoFormat: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      metricType: 'HEART_RATE', 
      value: 75,
      timestamp: '2023-13-45T99:99:99Z' // Invalid date/time
    },
    journey: 'health'
  },
  
  // Future timestamp
  futureTimestamp: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      metricType: 'HEART_RATE', 
      value: 75,
      timestamp: '2099-12-31T23:59:59Z' // Far future date
    },
    journey: 'health'
  },
  
  // Timestamp with wrong timezone format
  wrongTimezoneFormat: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      metricType: 'HEART_RATE', 
      value: 75,
      timestamp: '2023-12-01T10:00:00+5:00' // Incorrect timezone format
    },
    journey: 'health'
  }
};

/**
 * Events with invalid event types
 */
export const invalidEventTypes = {
  // Non-existent event type
  nonExistentType: {
    type: 'NON_EXISTENT_EVENT_TYPE',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { someData: 'value' },
    journey: 'health'
  },
  
  // Event type from wrong journey
  wrongJourneyType: {
    type: 'CLAIM_SUBMITTED', // Plan journey event type
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 }, // Health journey data
    journey: 'health' // Mismatch between type and journey
  },
  
  // Misspelled event type
  misspelledType: {
    type: 'HELTH_METRIC_RECORDED', // Misspelled 'HEALTH'
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { metricType: 'HEART_RATE', value: 75 },
    journey: 'health'
  }
};

/**
 * Events with security issues
 */
export const securityIssueEvents = {
  // Potential SQL injection
  sqlInjectionAttempt: {
    type: 'HEALTH_METRIC_RECORDED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      metricType: "' OR 1=1; --", // SQL injection attempt
      value: 75 
    },
    journey: 'health'
  },
  
  // Potential XSS attack
  xssAttempt: {
    type: 'APPOINTMENT_BOOKED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      providerId: '123e4567-e89b-12d3-a456-426614174000',
      appointmentDate: '2023-12-01T10:00:00Z',
      notes: '<script>alert("XSS")</script>' // XSS attempt
    },
    journey: 'care'
  },
  
  // Potential NoSQL injection
  noSqlInjectionAttempt: {
    type: 'CLAIM_SUBMITTED',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    data: { 
      claimType: { $ne: null }, // NoSQL injection attempt
      amount: 100.00,
      description: 'Regular checkup'
    },
    journey: 'plan'
  }
};

/**
 * Export all invalid events in a single object for easy access
 */
export const invalidEvents = {
  missingRequiredFields,
  incorrectDataTypes,
  emptyValues,
  malformedUuids,
  invalidJourneyValues,
  invalidHealthEvents,
  invalidCareEvents,
  invalidPlanEvents,
  invalidTimestamps,
  invalidEventTypes,
  securityIssueEvents
};

export default invalidEvents;