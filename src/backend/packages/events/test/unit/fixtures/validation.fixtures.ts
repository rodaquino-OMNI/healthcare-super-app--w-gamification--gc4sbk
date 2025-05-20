/**
 * @file validation.fixtures.ts
 * @description Contains fixtures for testing event validation logic, including edge cases,
 * boundary values, and invalid data patterns. These fixtures provide comprehensive test
 * scenarios for validating the event DTOs and ensuring proper error handling for invalid events.
 * 
 * @module events/test/unit/fixtures
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { 
  HealthMetricType, 
  HealthGoalType, 
  DeviceType, 
  HealthInsightType 
} from '../../../src/dto/health-event.dto';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

// ===== VALID EVENT FIXTURES =====

/**
 * Valid event fixtures for testing basic validation
 */
export const validEventFixtures = {
  /**
   * Minimal valid event with only required fields
   */
  minimalValidEvent: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm'
    }
  },

  /**
   * Complete valid event with all fields populated
   */
  completeValidEvent: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    correlationId: '123e4567-e89b-12d3-a456-426614174001',
    version: '1.0.0',
    source: 'mobile-app',
    metadata: {
      deviceId: 'device-123',
      appVersion: '1.2.3',
      platform: 'iOS',
      sessionId: 'session-456'
    },
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      notes: 'After morning exercise',
      deviceId: 'fitbit-123'
    }
  }
};

// ===== INVALID EVENT FIXTURES =====

/**
 * Invalid event fixtures for testing validation failures
 */
export const invalidEventFixtures = {
  /**
   * Event missing required fields
   */
  missingRequiredFields: {
    // Missing type
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm'
    }
  },

  /**
   * Event with invalid journey value
   */
  invalidJourney: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'invalid-journey', // Invalid journey name
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm'
    }
  },

  /**
   * Event with mismatched journey and event type
   */
  mismatchedJourneyAndType: {
    type: EventType.CARE_APPOINTMENT_BOOKED, // Care journey event type
    journey: 'health', // Health journey
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174000',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      specialtyType: 'Cardiology',
      appointmentType: 'in_person',
      scheduledAt: new Date().toISOString(),
      bookedAt: new Date().toISOString()
    }
  },

  /**
   * Event with invalid UUID format
   */
  invalidUUID: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: 'not-a-valid-uuid', // Invalid UUID format
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm'
    }
  },

  /**
   * Event with invalid timestamp format
   */
  invalidTimestamp: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: '2023-13-45T25:70:99Z', // Invalid date format
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm'
    }
  },

  /**
   * Event with invalid data structure
   */
  invalidDataStructure: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: 'not-an-object' // Data should be an object
  },

  /**
   * Event with empty data object
   */
  emptyData: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {} // Empty data object
  }
};

// ===== JOURNEY-SPECIFIC VALIDATION FIXTURES =====

/**
 * Health journey validation fixtures
 */
export const healthValidationFixtures = {
  /**
   * Valid health metric recorded event
   */
  validHealthMetricRecorded: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },

  /**
   * Invalid health metric with value out of range
   */
  invalidHealthMetricValue: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 300, // Heart rate too high (out of range)
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },

  /**
   * Invalid health metric with incorrect unit
   */
  invalidHealthMetricUnit: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'kg', // Incorrect unit for heart rate
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },

  /**
   * Valid health goal achieved event
   */
  validHealthGoalAchieved: {
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      goalId: '123e4567-e89b-12d3-a456-426614174000',
      goalType: HealthGoalType.STEPS_TARGET,
      targetValue: 10000,
      achievedValue: 10500,
      completedAt: new Date().toISOString()
    }
  },

  /**
   * Valid device connected event
   */
  validDeviceConnected: {
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      deviceId: '123e4567-e89b-12d3-a456-426614174000',
      deviceType: DeviceType.SMARTWATCH,
      connectionMethod: 'bluetooth',
      connectedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid device type
   */
  invalidDeviceType: {
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      deviceId: '123e4567-e89b-12d3-a456-426614174000',
      deviceType: 'INVALID_DEVICE_TYPE', // Invalid device type
      connectionMethod: 'bluetooth',
      connectedAt: new Date().toISOString()
    }
  },

  /**
   * Health metric boundary values for testing range validation
   */
  healthMetricBoundaryValues: {
    heartRateMin: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 30, // Minimum valid heart rate
        unit: 'bpm',
        recordedAt: new Date().toISOString()
      }
    },
    heartRateMax: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 220, // Maximum valid heart rate
        unit: 'bpm',
        recordedAt: new Date().toISOString()
      }
    },
    bloodGlucoseMin: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.BLOOD_GLUCOSE,
        value: 20, // Minimum valid blood glucose
        unit: 'mg/dL',
        recordedAt: new Date().toISOString()
      }
    },
    bloodGlucoseMax: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.BLOOD_GLUCOSE,
        value: 600, // Maximum valid blood glucose
        unit: 'mg/dL',
        recordedAt: new Date().toISOString()
      }
    },
    stepsZero: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.STEPS,
        value: 0, // Minimum valid steps
        unit: 'steps',
        recordedAt: new Date().toISOString()
      }
    },
    stepsMax: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.STEPS,
        value: 100000, // Maximum valid steps
        unit: 'steps',
        recordedAt: new Date().toISOString()
      }
    }
  }
};

/**
 * Care journey validation fixtures
 */
export const careValidationFixtures = {
  /**
   * Valid appointment booked event
   */
  validAppointmentBooked: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    journey: 'care',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174000',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      specialtyType: 'Cardiology',
      appointmentType: 'in_person',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      bookedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid appointment with past scheduled date
   */
  invalidAppointmentPastDate: {
    type: EventType.CARE_APPOINTMENT_BOOKED,
    journey: 'care',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174000',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      specialtyType: 'Cardiology',
      appointmentType: 'in_person',
      scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      bookedAt: new Date().toISOString()
    }
  },

  /**
   * Valid medication taken event
   */
  validMedicationTaken: {
    type: EventType.CARE_MEDICATION_TAKEN,
    journey: 'care',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174000',
      medicationName: 'Aspirin',
      dosage: '100mg',
      takenAt: new Date().toISOString(),
      adherence: 'on_time'
    }
  },

  /**
   * Invalid medication taken event with invalid adherence value
   */
  invalidMedicationAdherence: {
    type: EventType.CARE_MEDICATION_TAKEN,
    journey: 'care',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      medicationId: '123e4567-e89b-12d3-a456-426614174000',
      medicationName: 'Aspirin',
      dosage: '100mg',
      takenAt: new Date().toISOString(),
      adherence: 'invalid_adherence' // Invalid adherence value
    }
  },

  /**
   * Valid appointment status values
   */
  appointmentStatusValues: {
    scheduled: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        specialtyType: 'Cardiology',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookedAt: new Date().toISOString(),
        status: 'SCHEDULED'
      }
    },
    completed: {
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date().toISOString(),
        duration: 30,
        status: 'COMPLETED'
      }
    },
    cancelled: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        specialtyType: 'Cardiology',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookedAt: new Date(Date.now() - 86400000).toISOString(),
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'Patient request',
        status: 'CANCELLED'
      }
    }
  }
};

/**
 * Plan journey validation fixtures
 */
export const planValidationFixtures = {
  /**
   * Valid claim submitted event
   */
  validClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      claimId: '123e4567-e89b-12d3-a456-426614174000',
      claimType: 'medical',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      amount: 150.75,
      submittedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid claim with negative amount
   */
  invalidClaimNegativeAmount: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      claimId: '123e4567-e89b-12d3-a456-426614174000',
      claimType: 'medical',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      serviceDate: new Date(Date.now() - 604800000).toISOString(),
      amount: -50.25, // Negative amount
      submittedAt: new Date().toISOString()
    }
  },

  /**
   * Valid claim processed event
   */
  validClaimProcessed: {
    type: EventType.PLAN_CLAIM_PROCESSED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      claimId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'approved',
      amount: 150.75,
      coveredAmount: 120.60,
      processedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid claim status
   */
  invalidClaimStatus: {
    type: EventType.PLAN_CLAIM_PROCESSED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      claimId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'invalid_status', // Invalid status
      amount: 150.75,
      coveredAmount: 120.60,
      processedAt: new Date().toISOString()
    }
  },

  /**
   * Valid benefit utilized event
   */
  validBenefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      benefitId: '123e4567-e89b-12d3-a456-426614174000',
      benefitType: 'wellness',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      utilizationDate: new Date().toISOString(),
      savingsAmount: 75.50
    }
  },

  /**
   * Valid reward redeemed event
   */
  validRewardRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      rewardId: '123e4567-e89b-12d3-a456-426614174000',
      rewardType: 'gift_card',
      pointsRedeemed: 1000,
      value: 25.00,
      redeemedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid reward with insufficient points
   */
  invalidRewardInsufficientPoints: {
    type: EventType.PLAN_REWARD_REDEEMED,
    journey: 'plan',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      rewardId: '123e4567-e89b-12d3-a456-426614174000',
      rewardType: 'gift_card',
      pointsRedeemed: -100, // Negative points
      value: 25.00,
      redeemedAt: new Date().toISOString()
    }
  }
};

/**
 * Gamification validation fixtures
 */
export const gamificationValidationFixtures = {
  /**
   * Valid points earned event
   */
  validPointsEarned: {
    type: EventType.GAMIFICATION_POINTS_EARNED,
    journey: 'gamification',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      sourceType: 'health',
      sourceId: '123e4567-e89b-12d3-a456-426614174000',
      points: 50,
      reason: 'Completed daily step goal',
      earnedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid points with zero value
   */
  invalidZeroPoints: {
    type: EventType.GAMIFICATION_POINTS_EARNED,
    journey: 'gamification',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      sourceType: 'health',
      sourceId: '123e4567-e89b-12d3-a456-426614174000',
      points: 0, // Zero points
      reason: 'Completed daily step goal',
      earnedAt: new Date().toISOString()
    }
  },

  /**
   * Valid achievement unlocked event
   */
  validAchievementUnlocked: {
    type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    journey: 'gamification',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      achievementId: '123e4567-e89b-12d3-a456-426614174000',
      achievementType: 'health-check-streak',
      tier: 'silver',
      points: 100,
      unlockedAt: new Date().toISOString()
    }
  },

  /**
   * Valid level up event
   */
  validLevelUp: {
    type: EventType.GAMIFICATION_LEVEL_UP,
    journey: 'gamification',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      previousLevel: 2,
      newLevel: 3,
      totalPoints: 1500,
      leveledUpAt: new Date().toISOString()
    }
  },

  /**
   * Invalid level up with level decrease
   */
  invalidLevelDecrease: {
    type: EventType.GAMIFICATION_LEVEL_UP,
    journey: 'gamification',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      previousLevel: 3,
      newLevel: 2, // Level decrease
      totalPoints: 1500,
      leveledUpAt: new Date().toISOString()
    }
  }
};

/**
 * User validation fixtures
 */
export const userValidationFixtures = {
  /**
   * Valid profile completed event
   */
  validProfileCompleted: {
    type: EventType.USER_PROFILE_COMPLETED,
    journey: 'user',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      completionPercentage: 100,
      completedSections: ['personal', 'contact', 'health', 'preferences'],
      completedAt: new Date().toISOString()
    }
  },

  /**
   * Invalid profile completion percentage
   */
  invalidProfileCompletionPercentage: {
    type: EventType.USER_PROFILE_COMPLETED,
    journey: 'user',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      completionPercentage: 120, // Over 100%
      completedSections: ['personal', 'contact', 'health', 'preferences'],
      completedAt: new Date().toISOString()
    }
  },

  /**
   * Valid login event
   */
  validLogin: {
    type: EventType.USER_LOGIN,
    journey: 'user',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      loginMethod: 'password',
      deviceType: 'mobile',
      loginAt: new Date().toISOString()
    }
  },

  /**
   * Valid onboarding completed event
   */
  validOnboardingCompleted: {
    type: EventType.USER_ONBOARDING_COMPLETED,
    journey: 'user',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    data: {
      completedSteps: ['welcome', 'profile', 'preferences', 'journeys'],
      selectedJourneys: ['health', 'care', 'plan'],
      duration: 300, // 5 minutes in seconds
      completedAt: new Date().toISOString()
    }
  }
};

// ===== CROSS-FIELD VALIDATION FIXTURES =====

/**
 * Fixtures for testing cross-field validation rules
 */
export const crossFieldValidationFixtures = {
  /**
   * Required field based on another field's value
   */
  requiredWhenFixtures: {
    /**
     * Valid: providerId is required when appointmentType is 'in_person'
     */
    validRequiredField: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001', // Required for in_person
        specialtyType: 'Cardiology',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookedAt: new Date().toISOString()
      }
    },
    
    /**
     * Invalid: missing providerId when appointmentType is 'in_person'
     */
    missingRequiredField: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing providerId
        specialtyType: 'Cardiology',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookedAt: new Date().toISOString()
      }
    }
  },
  
  /**
   * Prohibited field based on another field's value
   */
  prohibitedWhenFixtures: {
    /**
     * Valid: deviceId should not be present when source is 'manual'
     */
    validProhibitedField: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        source: 'manual'
        // No deviceId as expected
      }
    },
    
    /**
     * Invalid: deviceId present when source is 'manual'
     */
    invalidProhibitedFieldPresent: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        source: 'manual',
        deviceId: 'device-123' // Should not be present with manual source
      }
    }
  },
  
  /**
   * Logical relationship between fields
   */
  logicalRelationshipFixtures: {
    /**
     * Valid: completedAt is after scheduledAt
     */
    validDateSequence: {
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        completedAt: new Date().toISOString(), // Now
        duration: 30
      }
    },
    
    /**
     * Invalid: completedAt is before scheduledAt
     */
    invalidDateSequence: {
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      journey: 'care',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      data: {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        completedAt: new Date().toISOString(), // Now
        duration: 30
      }
    }
  }
};

// ===== METADATA VALIDATION FIXTURES =====

/**
 * Fixtures for testing event metadata validation
 */
export const metadataValidationFixtures = {
  /**
   * Valid event with complete metadata
   */
  validCompleteMetadata: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    correlationId: '123e4567-e89b-12d3-a456-426614174001',
    version: '1.0.0',
    source: 'mobile-app',
    metadata: {
      deviceId: 'device-123',
      appVersion: '1.2.3',
      platform: 'iOS',
      sessionId: 'session-456',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    },
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },
  
  /**
   * Valid event with minimal metadata
   */
  validMinimalMetadata: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    metadata: {
      // Minimal valid metadata
      deviceId: 'device-123'
    },
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },
  
  /**
   * Invalid event with malformed metadata
   */
  invalidMetadataStructure: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    metadata: 'not-an-object', // Should be an object
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  },
  
  /**
   * Invalid event with invalid metadata fields
   */
  invalidMetadataFields: {
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString(),
    metadata: {
      deviceId: 123, // Should be a string
      appVersion: true, // Should be a string
      platform: null // Should be a string
    },
    data: {
      metricType: HealthMetricType.HEART_RATE,
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual'
    }
  }
};

// ===== EXPORT ALL FIXTURES =====

/**
 * All validation fixtures grouped by category
 */
export const validationFixtures = {
  validEventFixtures,
  invalidEventFixtures,
  healthValidationFixtures,
  careValidationFixtures,
  planValidationFixtures,
  gamificationValidationFixtures,
  userValidationFixtures,
  crossFieldValidationFixtures,
  metadataValidationFixtures
};

export default validationFixtures;