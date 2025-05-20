/**
 * @file invalid-events.mock.ts
 * @description Provides a collection of invalid event mock data that intentionally violates
 * validation rules to test error handling and validation logic. These mocks include various
 * types of invalid events (missing required fields, incorrect data types, empty values) to
 * ensure the system properly identifies and rejects malformed events from all journeys.
 *
 * These mocks are used in unit tests to verify that:
 * 1. Validation correctly identifies and rejects invalid events
 * 2. Proper error messages are generated for each validation failure
 * 3. Dead letter queues correctly capture invalid events
 * 4. Retry mechanisms handle validation failures appropriately
 * 5. Monitoring systems detect and log validation errors
 *
 * @module events/test/unit/dto/mocks
 */

import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto } from '../../../../src/dto/event-metadata.dto';
import { HealthMetricType, HealthGoalType, DeviceType, HealthInsightType } from '../../../../src/dto/health-event.dto';

/**
 * Collection of invalid events with missing required fields
 */
export const missingRequiredFieldsEvents = {
  /**
   * Event missing the required 'type' field
   */
  missingType: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event missing the required 'userId' field
   */
  missingUserId: {
    type: EventType.HEALTH_METRIC_RECORDED,
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event missing the required 'data' field
   */
  missingData: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'health'
  },

  /**
   * Event with empty data object
   */
  emptyData: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {},
    journey: 'health'
  },

  /**
   * Health event missing required metric type
   */
  missingMetricType: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Care appointment event missing required appointment ID
   */
  missingAppointmentId: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      specialtyType: 'Cardiologia',
      appointmentType: 'in_person',
      scheduledAt: new Date().toISOString(),
      bookedAt: new Date().toISOString()
    },
    journey: 'care'
  },

  /**
   * Plan claim event missing required claim type
   */
  missingClaimType: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      claimId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      serviceDate: new Date().toISOString(),
      amount: 150.75,
      submittedAt: new Date().toISOString()
    },
    journey: 'plan'
  }
};

/**
 * Collection of events with invalid data types
 */
export const invalidDataTypeEvents = {
  /**
   * Event with non-string type
   */
  nonStringType: {
    type: 123, // Should be a string
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event with non-UUID userId
   */
  nonUuidUserId: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'not-a-valid-uuid', // Should be a valid UUID
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event with non-object data
   */
  nonObjectData: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: 'not an object', // Should be an object
    journey: 'health'
  },

  /**
   * Event with non-string journey
   */
  nonStringJourney: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 123 // Should be a string
  },

  /**
   * Health event with non-numeric value
   */
  nonNumericValue: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 'seventy-five', // Should be a number
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Care event with non-ISO date
   */
  nonIsoDate: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      appointmentId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      specialtyType: 'Cardiologia',
      appointmentType: 'in_person',
      scheduledAt: '01/01/2023', // Should be ISO format
      bookedAt: new Date().toISOString()
    },
    journey: 'care'
  },

  /**
   * Plan event with non-numeric amount
   */
  nonNumericAmount: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      claimId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      claimType: 'medical',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      serviceDate: new Date().toISOString(),
      amount: '$150.75', // Should be a number
      submittedAt: new Date().toISOString()
    },
    journey: 'plan'
  }
};

/**
 * Collection of events with invalid journey values
 */
export const invalidJourneyEvents = {
  /**
   * Event with non-existent journey
   */
  nonExistentJourney: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'non-existent-journey' // Should be one of: health, care, plan, user, gamification
  },

  /**
   * Event with mismatched journey and type
   */
  mismatchedJourneyAndType: {
    type: EventType.HEALTH_METRIC_RECORDED, // Health event type
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'care' // Mismatched with health event type
  },

  /**
   * Event with empty journey string
   */
  emptyJourney: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: '' // Empty string
  }
};

/**
 * Collection of events with invalid event types
 */
export const invalidEventTypeEvents = {
  /**
   * Event with non-existent event type
   */
  nonExistentEventType: {
    type: 'NON_EXISTENT_EVENT_TYPE',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event with mismatched event type for journey
   */
  mismatchedEventTypeForJourney: {
    type: EventType.CARE_APPOINTMENT_BOOKED, // Care event type
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health' // Health journey with care event type
  },

  /**
   * Event with empty event type string
   */
  emptyEventType: {
    type: '',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  }
};

/**
 * Collection of events with invalid UUID values
 */
export const invalidUuidEvents = {
  /**
   * Event with malformed UUID
   */
  malformedUuid: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'g50e8400-e29b-41d4-a716-446655440000', // 'g' is not a valid hex character
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event with UUID of incorrect length
   */
  incorrectLengthUuid: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-4466554400', // Too short
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Event with UUID missing hyphens
   */
  uuidMissingHyphens: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400e29b41d4a716446655440000', // Missing hyphens
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health goal event with invalid goal ID
   */
  invalidGoalId: {
    type: EventType.HEALTH_GOAL_ACHIEVED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      goalId: 'not-a-valid-uuid',
      goalType: HealthGoalType.STEPS_TARGET,
      description: 'Daily steps goal',
      targetValue: 10000,
      unit: 'steps',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100
    },
    journey: 'health'
  }
};

/**
 * Collection of events with invalid date values
 */
export const invalidDateEvents = {
  /**
   * Event with malformed ISO date
   */
  malformedIsoDate: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: '2023-13-45T25:70:80Z' // Invalid date/time values
    },
    journey: 'health'
  },

  /**
   * Event with non-ISO date format
   */
  nonIsoDateFormat: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: '01/01/2023 14:30:00' // Not ISO format
    },
    journey: 'health'
  },

  /**
   * Event with future date (for fields that should be in the past)
   */
  futureDateForPastEvent: {
    type: EventType.CARE_APPOINTMENT_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      appointmentId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      appointmentType: 'in_person',
      scheduledAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 86400000).toISOString(), // Future date
      duration: 30
    },
    journey: 'care'
  },

  /**
   * Event with invalid date range (end before start)
   */
  invalidDateRange: {
    type: EventType.CARE_TELEMEDICINE_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      sessionId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      appointmentId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      providerId: '9a8b7c6d-5e4f-3g2h-1i0j-9k8l7m6n5o4p',
      startedAt: new Date().toISOString(),
      endedAt: new Date(Date.now() - 86400000).toISOString(), // Earlier than startedAt
      duration: 30,
      quality: 'good'
    },
    journey: 'care'
  }
};

/**
 * Collection of events with invalid enum values
 */
export const invalidEnumEvents = {
  /**
   * Health event with invalid metric type
   */
  invalidMetricType: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: 'INVALID_METRIC_TYPE', // Not in HealthMetricType enum
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with invalid goal type
   */
  invalidGoalType: {
    type: EventType.HEALTH_GOAL_ACHIEVED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      goalId: '550e8400-e29b-41d4-a716-446655440000',
      goalType: 'INVALID_GOAL_TYPE', // Not in HealthGoalType enum
      description: 'Invalid goal type',
      targetValue: 100,
      unit: 'units',
      achievedAt: new Date().toISOString(),
      progressPercentage: 100
    },
    journey: 'health'
  },

  /**
   * Health event with invalid device type
   */
  invalidDeviceType: {
    type: EventType.HEALTH_DEVICE_CONNECTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      deviceType: 'INVALID_DEVICE_TYPE', // Not in DeviceType enum
      connectionMethod: 'bluetooth',
      connectedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Care event with invalid appointment type
   */
  invalidAppointmentType: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      appointmentId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      specialtyType: 'Cardiologia',
      appointmentType: 'invalid_type', // Should be 'in_person' or 'telemedicine'
      scheduledAt: new Date().toISOString(),
      bookedAt: new Date().toISOString()
    },
    journey: 'care'
  },

  /**
   * Plan event with invalid claim type
   */
  invalidClaimType: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      claimId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      claimType: 'invalid_claim_type', // Not a valid claim type
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      serviceDate: new Date().toISOString(),
      amount: 150.75,
      submittedAt: new Date().toISOString()
    },
    journey: 'plan'
  }
};

/**
 * Collection of events with invalid numeric ranges
 */
export const invalidRangeEvents = {
  /**
   * Health event with heart rate out of valid range
   */
  heartRateOutOfRange: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 300, // Too high (valid range: 30-220 bpm)
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with blood glucose out of valid range
   */
  bloodGlucoseOutOfRange: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.BLOOD_GLUCOSE,
      value: 10, // Too low (valid range: 20-600 mg/dL)
      unit: 'mg/dL',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with negative steps count
   */
  negativeStepsCount: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.STEPS,
      value: -100, // Negative (valid range: 0-100000 steps)
      unit: 'steps',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with sleep duration out of valid range
   */
  sleepDurationOutOfRange: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.SLEEP,
      value: 30, // Too high (valid range: 0-24 hours)
      unit: 'hours',
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Care event with negative appointment duration
   */
  negativeAppointmentDuration: {
    type: EventType.CARE_APPOINTMENT_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      appointmentId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      appointmentType: 'in_person',
      scheduledAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: -30 // Negative duration
    },
    journey: 'care'
  },

  /**
   * Plan event with negative claim amount
   */
  negativeClaimAmount: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      claimId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      claimType: 'medical',
      providerId: '7f4c9f83-a83d-44c0-95cb-7ab76d8f14e1',
      serviceDate: new Date().toISOString(),
      amount: -150.75, // Negative amount
      submittedAt: new Date().toISOString()
    },
    journey: 'plan'
  }
};

/**
 * Collection of events with invalid metadata
 */
export const invalidMetadataEvents = {
  /**
   * Event with invalid version format in metadata
   */
  invalidVersionFormat: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health',
    metadata: {
      version: {
        major: 'one', // Should be numeric string
        minor: '0',
        patch: '0'
      },
      timestamp: new Date()
    }
  },

  /**
   * Event with invalid correlation ID format
   */
  invalidCorrelationId: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health',
    metadata: {
      correlationId: 'not-a-valid-uuid', // Should be UUID
      timestamp: new Date()
    }
  },

  /**
   * Event with missing required service in origin
   */
  missingServiceInOrigin: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health',
    metadata: {
      origin: {
        // Missing required 'service' field
        instance: 'health-service-pod-1234',
        component: 'metric-processor'
      },
      timestamp: new Date()
    }
  },

  /**
   * Event with invalid timestamp type
   */
  invalidTimestampType: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString()
    },
    journey: 'health',
    metadata: {
      timestamp: '2023-01-01T12:00:00Z' // Should be Date object
    }
  }
};

/**
 * Collection of events with invalid unit values
 */
export const invalidUnitEvents = {
  /**
   * Health event with invalid unit for heart rate
   */
  invalidHeartRateUnit: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'beats', // Should be 'bpm'
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with invalid unit for blood glucose
   */
  invalidBloodGlucoseUnit: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.BLOOD_GLUCOSE,
      value: 100,
      unit: 'units', // Should be 'mg/dL' or 'mmol/L'
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with invalid unit for steps
   */
  invalidStepsUnit: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.STEPS,
      value: 10000,
      unit: 'count', // Should be 'steps'
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Health event with invalid unit for weight
   */
  invalidWeightUnit: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.WEIGHT,
      value: 70,
      unit: 'g', // Should be 'kg' or 'lb'
      recordedAt: new Date().toISOString()
    },
    journey: 'health'
  }
};

/**
 * Collection of events with malformed nested objects
 */
export const malformedNestedObjectEvents = {
  /**
   * Health event with malformed nested metric data
   */
  malformedMetricData: {
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      // Missing required 'unit' field
      recordedAt: new Date().toISOString(),
      // Additional invalid field
      invalidField: 'some value'
    },
    journey: 'health'
  },

  /**
   * Health insight event with malformed insight data
   */
  malformedInsightData: {
    type: EventType.HEALTH_INSIGHT_GENERATED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      insightId: '550e8400-e29b-41d4-a716-446655440000',
      insightType: HealthInsightType.ANOMALY_DETECTION,
      // Missing required 'title' and 'description' fields
      relatedMetricTypes: [HealthMetricType.HEART_RATE],
      confidenceScore: 150, // Out of range (0-100)
      generatedAt: new Date().toISOString()
    },
    journey: 'health'
  },

  /**
   * Care appointment event with malformed appointment data
   */
  malformedAppointmentData: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      appointmentId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      // Missing required 'providerId' field
      specialtyType: 'Cardiologia',
      appointmentType: 'in_person',
      // Malformed date fields
      scheduledAt: 'tomorrow',
      bookedAt: 'today'
    },
    journey: 'care'
  },

  /**
   * Plan claim event with malformed claim data
   */
  malformedClaimData: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    data: {
      claimId: 'c5d8a8f0-3d1a-4e1d-8f8a-7b9c1d2e3f4a',
      claimType: 'medical',
      // Missing required 'providerId' field
      // Missing required 'serviceDate' field
      amount: 'one hundred fifty', // Should be number
      submittedAt: new Date().toISOString()
    },
    journey: 'plan'
  }
};

/**
 * Collection of all invalid events for easy access in tests
 */
export const allInvalidEvents = {
  ...missingRequiredFieldsEvents,
  ...invalidDataTypeEvents,
  ...invalidJourneyEvents,
  ...invalidEventTypeEvents,
  ...invalidUuidEvents,
  ...invalidDateEvents,
  ...invalidEnumEvents,
  ...invalidRangeEvents,
  ...invalidMetadataEvents,
  ...invalidUnitEvents,
  ...malformedNestedObjectEvents
};