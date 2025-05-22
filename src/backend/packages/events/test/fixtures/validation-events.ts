/**
 * @file Validation Event Fixtures
 * @description Provides test fixtures for validating event processing across all journeys.
 * 
 * This file contains both valid and invalid event examples that exercise boundary conditions,
 * required fields, data type constraints, and business rules. These fixtures are essential for
 * unit testing validation decorators, ensuring validators reject improper data while accepting
 * valid events across all journeys.
 */

import { EventJourney, EventType, EventVersion } from '@austa/interfaces/gamification';
import { MetricSource, MetricType, GoalStatus, GoalType, DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health';
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus, ClaimType } from '@austa/interfaces/journey/plan';

// =============================================================================
// Common Test Values
// =============================================================================

/**
 * Valid UUID for testing
 */
export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

/**
 * Valid ISO timestamp for testing
 */
export const VALID_TIMESTAMP = '2023-04-15T14:32:17.123Z';

/**
 * Valid event version for testing
 */
export const VALID_VERSION: EventVersion = {
  major: 1,
  minor: 0,
  patch: 0
};

// =============================================================================
// Valid Event Fixtures
// =============================================================================

/**
 * Collection of valid event fixtures that pass all validation rules.
 * These can be used as positive test cases for validation logic.
 */
export const validEvents = {
  // Health Journey Events
  health: {
    /**
     * Valid HEALTH_METRIC_RECORDED event
     */
    metricRecorded: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL,
        isWithinHealthyRange: true
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid HEALTH_GOAL_ACHIEVED event
     */
    goalAchieved: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_GOAL_ACHIEVED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        goalId: VALID_UUID,
        goalType: GoalType.STEPS,
        targetValue: 10000,
        unit: 'steps',
        completionPercentage: 100,
        isFirstTimeAchievement: true
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid DEVICE_SYNCED event
     */
    deviceSynced: {
      eventId: VALID_UUID,
      type: EventType.DEVICE_SYNCED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        deviceId: VALID_UUID,
        deviceType: DeviceType.SMARTWATCH,
        manufacturer: 'Garmin',
        metricCount: 15
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app',
      correlationId: VALID_UUID
    }
  },

  // Care Journey Events
  care: {
    /**
     * Valid APPOINTMENT_BOOKED event
     */
    appointmentBooked: {
      eventId: VALID_UUID,
      type: EventType.APPOINTMENT_BOOKED,
      userId: VALID_UUID,
      journey: EventJourney.CARE,
      payload: {
        timestamp: VALID_TIMESTAMP,
        appointmentId: VALID_UUID,
        appointmentType: AppointmentType.IN_PERSON,
        providerId: VALID_UUID,
        isFirstAppointment: true
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid MEDICATION_TAKEN event
     */
    medicationTaken: {
      eventId: VALID_UUID,
      type: EventType.MEDICATION_TAKEN,
      userId: VALID_UUID,
      journey: EventJourney.CARE,
      payload: {
        timestamp: VALID_TIMESTAMP,
        medicationId: VALID_UUID,
        medicationName: 'Atorvastatin',
        takenOnTime: true
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid TELEMEDICINE_SESSION_COMPLETED event
     */
    telemedicineCompleted: {
      eventId: VALID_UUID,
      type: EventType.TELEMEDICINE_SESSION_COMPLETED,
      userId: VALID_UUID,
      journey: EventJourney.CARE,
      payload: {
        timestamp: VALID_TIMESTAMP,
        sessionId: VALID_UUID,
        providerId: VALID_UUID,
        durationMinutes: 30,
        isFirstSession: false
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app',
      correlationId: VALID_UUID
    }
  },

  // Plan Journey Events
  plan: {
    /**
     * Valid CLAIM_SUBMITTED event
     */
    claimSubmitted: {
      eventId: VALID_UUID,
      type: EventType.CLAIM_SUBMITTED,
      userId: VALID_UUID,
      journey: EventJourney.PLAN,
      payload: {
        timestamp: VALID_TIMESTAMP,
        claimId: VALID_UUID,
        claimType: ClaimType.MEDICAL_CONSULTATION,
        amount: 150.00
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid BENEFIT_UTILIZED event
     */
    benefitUtilized: {
      eventId: VALID_UUID,
      type: EventType.BENEFIT_UTILIZED,
      userId: VALID_UUID,
      journey: EventJourney.PLAN,
      payload: {
        timestamp: VALID_TIMESTAMP,
        benefitId: VALID_UUID,
        benefitType: 'ANNUAL_CHECKUP',
        value: 1
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app',
      correlationId: VALID_UUID
    },

    /**
     * Valid PLAN_COMPARED event
     */
    planCompared: {
      eventId: VALID_UUID,
      type: EventType.PLAN_COMPARED,
      userId: VALID_UUID,
      journey: EventJourney.PLAN,
      payload: {
        timestamp: VALID_TIMESTAMP,
        planId: VALID_UUID,
        planType: 'PREMIUM',
        comparedPlanIds: [VALID_UUID, VALID_UUID]
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app',
      correlationId: VALID_UUID
    }
  },

  // Cross-Journey Events
  crossJourney: {
    /**
     * Valid ACHIEVEMENT_UNLOCKED event
     */
    achievementUnlocked: {
      eventId: VALID_UUID,
      type: EventType.ACHIEVEMENT_UNLOCKED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        achievementId: VALID_UUID,
        achievementTitle: 'Health Enthusiast',
        achievementDescription: 'Record health metrics for 7 consecutive days',
        xpEarned: 100,
        relatedJourney: EventJourney.HEALTH
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine',
      correlationId: VALID_UUID
    },

    /**
     * Valid XP_EARNED event
     */
    xpEarned: {
      eventId: VALID_UUID,
      type: EventType.XP_EARNED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        amount: 50,
        source: 'daily-login',
        description: 'Logged in for 5 consecutive days',
        relatedJourney: EventJourney.CROSS_JOURNEY
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine',
      correlationId: VALID_UUID
    },

    /**
     * Valid LEVEL_UP event
     */
    levelUp: {
      eventId: VALID_UUID,
      type: EventType.LEVEL_UP,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        newLevel: 5,
        previousLevel: 4,
        totalXp: 1000,
        unlockedRewards: [
          {
            rewardId: VALID_UUID,
            rewardType: 'BADGE',
            rewardDescription: 'Health Explorer Badge'
          }
        ]
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine',
      correlationId: VALID_UUID
    }
  },

  // Edge Cases (Valid but testing boundaries)
  edgeCases: {
    /**
     * Valid event with minimum required fields
     */
    minimumRequiredFields: {
      eventId: VALID_UUID,
      type: EventType.DAILY_LOGIN,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
      // correlationId is optional and omitted
    },

    /**
     * Valid event with empty arrays where allowed
     */
    emptyArrays: {
      eventId: VALID_UUID,
      type: EventType.LEVEL_UP,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        newLevel: 2,
        previousLevel: 1,
        totalXp: 200,
        unlockedRewards: [] // Empty array is valid
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine',
      correlationId: VALID_UUID
    },

    /**
     * Valid event with maximum length strings
     */
    maxLengthStrings: {
      eventId: VALID_UUID,
      type: EventType.FEEDBACK_PROVIDED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        // 500 character string (assuming this is the max)
        feedback: 'A'.repeat(500)
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app',
      correlationId: VALID_UUID
    }
  }
};

// =============================================================================
// Invalid Event Fixtures
// =============================================================================

/**
 * Collection of invalid event fixtures that fail validation rules.
 * These can be used as negative test cases for validation logic.
 */
export const invalidEvents = {
  // Missing Required Fields
  missingRequired: {
    /**
     * Missing eventId
     */
    missingEventId: {
      // eventId: VALID_UUID, // Missing required field
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing type
     */
    missingType: {
      eventId: VALID_UUID,
      // type: EventType.HEALTH_METRIC_RECORDED, // Missing required field
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing userId
     */
    missingUserId: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      // userId: VALID_UUID, // Missing required field
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing journey
     */
    missingJourney: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      // journey: EventJourney.HEALTH, // Missing required field
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing payload
     */
    missingPayload: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      // payload: {...}, // Missing required field
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing version
     */
    missingVersion: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      // version: VALID_VERSION, // Missing required field
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Missing timestamp in payload
     */
    missingTimestamp: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        // timestamp: VALID_TIMESTAMP, // Missing required field
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    }
  },

  // Invalid Data Types
  invalidTypes: {
    /**
     * Invalid UUID format
     */
    invalidUuid: {
      eventId: 'not-a-valid-uuid',
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Invalid timestamp format
     */
    invalidTimestamp: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: '2023-04-15 14:32:17', // Invalid ISO format
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Invalid enum value
     */
    invalidEnum: {
      eventId: VALID_UUID,
      type: 'INVALID_EVENT_TYPE', // Invalid enum value
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Invalid number (string instead of number)
     */
    invalidNumber: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: '75', // String instead of number
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Invalid version format
     */
    invalidVersionFormat: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: '1.0.0', // String instead of object
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    }
  },

  // Out of Range Values
  outOfRange: {
    /**
     * Negative number where positive is required
     */
    negativeNumber: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: -75, // Negative value not allowed
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * String exceeding maximum length
     */
    stringTooLong: {
      eventId: VALID_UUID,
      type: EventType.FEEDBACK_PROVIDED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        feedback: 'A'.repeat(1001) // Exceeds maximum length
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Array with too many items
     */
    arrayTooLarge: {
      eventId: VALID_UUID,
      type: EventType.PLAN_COMPARED,
      userId: VALID_UUID,
      journey: EventJourney.PLAN,
      payload: {
        timestamp: VALID_TIMESTAMP,
        planId: VALID_UUID,
        planType: 'PREMIUM',
        comparedPlanIds: Array(101).fill(VALID_UUID) // Too many items
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Value below minimum
     */
    belowMinimum: {
      eventId: VALID_UUID,
      type: EventType.LEVEL_UP,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        newLevel: 0, // Below minimum (assuming 1 is minimum)
        previousLevel: -1, // Below minimum
        totalXp: 0 // Below minimum
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine'
    },

    /**
     * Value above maximum
     */
    aboveMaximum: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 500, // Above maximum for heart rate
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    }
  },

  // Invalid Patterns
  invalidPatterns: {
    /**
     * Invalid email format
     */
    invalidEmail: {
      eventId: VALID_UUID,
      type: EventType.PROFILE_UPDATED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        email: 'not-an-email' // Invalid email format
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Invalid phone number format
     */
    invalidPhone: {
      eventId: VALID_UUID,
      type: EventType.PROFILE_UPDATED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        phone: '123' // Invalid phone format
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Invalid URL format
     */
    invalidUrl: {
      eventId: VALID_UUID,
      type: EventType.APP_FEATURE_USED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        featurePath: 'not-a-url' // Invalid URL format
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    }
  },

  // Business Rule Violations
  businessRules: {
    /**
     * Inconsistent data (newLevel <= previousLevel)
     */
    inconsistentData: {
      eventId: VALID_UUID,
      type: EventType.LEVEL_UP,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        newLevel: 3,
        previousLevel: 3, // Should be less than newLevel
        totalXp: 500
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'gamification-engine'
    },

    /**
     * Future timestamp
     */
    futureTimestamp: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Invalid state transition
     */
    invalidStateTransition: {
      eventId: VALID_UUID,
      type: EventType.APPOINTMENT_CANCELLED,
      userId: VALID_UUID,
      journey: EventJourney.CARE,
      payload: {
        timestamp: VALID_TIMESTAMP,
        appointmentId: VALID_UUID,
        appointmentType: AppointmentType.IN_PERSON,
        providerId: VALID_UUID,
        cancellationReason: 'Schedule conflict',
        previousStatus: AppointmentStatus.COMPLETED // Can't cancel a completed appointment
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Mismatched journey and event type
     */
    mismatchedJourneyEventType: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED, // Health event type
      userId: VALID_UUID,
      journey: EventJourney.CARE, // Care journey
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    }
  }
};

// =============================================================================
// Specialized Test Cases
// =============================================================================

/**
 * Collection of specialized test cases for specific validation scenarios.
 */
export const specializedTestCases = {
  /**
   * Test cases for version compatibility validation
   */
  versionCompatibility: {
    /**
     * Event with older but compatible version
     */
    olderCompatibleVersion: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL
        // Missing newer fields that should be optional
      },
      version: { major: 1, minor: 0, patch: 0 }, // Older version
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Event with newer version that should be forward compatible
     */
    newerCompatibleVersion: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.MANUAL,
        additionalNewField: 'some value' // New field in newer version
      },
      version: { major: 1, minor: 2, patch: 0 }, // Newer version
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    },

    /**
     * Event with incompatible major version
     */
    incompatibleMajorVersion: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        // Different payload structure in major version 2
        healthData: {
          type: MetricType.HEART_RATE,
          measurement: 75,
          unit: 'bpm'
        },
        source: MetricSource.MANUAL
      },
      version: { major: 2, minor: 0, patch: 0 }, // Incompatible major version
      createdAt: VALID_TIMESTAMP,
      source: 'mobile-app'
    }
  },

  /**
   * Test cases for security validation
   */
  security: {
    /**
     * Event with potential SQL injection
     */
    sqlInjection: {
      eventId: VALID_UUID,
      type: EventType.PROFILE_UPDATED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        name: "Robert'); DROP TABLE Users; --" // SQL injection attempt
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Event with potential XSS attack
     */
    xssAttack: {
      eventId: VALID_UUID,
      type: EventType.FEEDBACK_PROVIDED,
      userId: VALID_UUID,
      journey: EventJourney.CROSS_JOURNEY,
      payload: {
        timestamp: VALID_TIMESTAMP,
        feedback: "<script>alert('XSS');</script>" // XSS attempt
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    }
  },

  /**
   * Test cases for performance validation
   */
  performance: {
    /**
     * Event with very large payload
     */
    largePayload: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_ASSESSMENT_COMPLETED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        assessmentId: VALID_UUID,
        // Large array with many items
        responses: Array(500).fill(0).map((_, i) => ({
          questionId: `question-${i}`,
          answer: `answer-${i}`,
          metadata: {
            timeSpent: Math.random() * 60,
            revisions: Math.floor(Math.random() * 3)
          }
        }))
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'web-app'
    },

    /**
     * Event with deeply nested objects
     */
    deeplyNested: {
      eventId: VALID_UUID,
      type: EventType.HEALTH_INSIGHT_GENERATED,
      userId: VALID_UUID,
      journey: EventJourney.HEALTH,
      payload: {
        timestamp: VALID_TIMESTAMP,
        insightId: VALID_UUID,
        // Deeply nested object structure
        analysis: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: {
                              result: 'Too deep for efficient processing'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      version: VALID_VERSION,
      createdAt: VALID_TIMESTAMP,
      source: 'health-service'
    }
  }
};

/**
 * Helper function to create a valid event with custom overrides.
 * Useful for creating test cases with specific variations.
 * 
 * @param overrides - Properties to override in the base valid event
 * @returns A new event object with the specified overrides
 */
export function createValidEvent(overrides: Partial<any> = {}): any {
  // Start with a basic valid event
  const baseEvent = {
    eventId: VALID_UUID,
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: VALID_UUID,
    journey: EventJourney.HEALTH,
    payload: {
      timestamp: VALID_TIMESTAMP,
      metricType: MetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      source: MetricSource.MANUAL
    },
    version: VALID_VERSION,
    createdAt: VALID_TIMESTAMP,
    source: 'mobile-app',
    correlationId: VALID_UUID
  };

  // Apply overrides using deep merge
  return deepMerge(baseEvent, overrides);
}

/**
 * Helper function to create an invalid event with custom overrides.
 * Useful for creating test cases with specific validation failures.
 * 
 * @param overrides - Properties to override in the base valid event
 * @returns A new event object with the specified overrides
 */
export function createInvalidEvent(overrides: Partial<any> = {}): any {
  // Start with a valid event and apply overrides to make it invalid
  return createValidEvent(overrides);
}

/**
 * Deep merge utility function for combining objects.
 * 
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new object with properties from both target and source
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Helper function to check if a value is an object.
 * 
 * @param item - The value to check
 * @returns True if the value is an object, false otherwise
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}