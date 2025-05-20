/**
 * @file validation-events.ts
 * @description Provides event fixtures specifically designed for testing validation logic across different event types.
 * This file contains both valid and invalid event examples that exercise boundary conditions, required fields,
 * data type constraints, and business rules.
 * 
 * These fixtures are essential for unit testing validation decorators, ensuring validators reject improper data
 * while accepting valid events across all journeys.
 *
 * @module events/test/fixtures
 */

import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../src/dto/event-metadata.dto';
import { HealthMetricType, HealthGoalType, DeviceType, HealthInsightType } from '../../src/dto/health-event.dto';

// ===== VALID EVENT FIXTURES =====

/**
 * Collection of valid event fixtures that should pass all validation rules.
 * These fixtures can be used as positive test cases for validation logic.
 */
export const validEvents = {
  /**
   * Valid health journey events
   */
  health: {
    /**
     * Valid health metric recorded event with all required fields
     */
    metricRecorded: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'health-service',
          component: 'metric-processor'
        }
      }
    },

    /**
     * Valid health goal achieved event with all required fields
     */
    goalAchieved: {
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        goalId: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
        goalType: HealthGoalType.STEPS_TARGET,
        targetValue: 10000,
        achievedValue: 10250,
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'health-service',
          component: 'goal-processor'
        }
      }
    },

    /**
     * Valid device connected event with all required fields
     */
    deviceConnected: {
      type: EventType.HEALTH_DEVICE_CONNECTED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        deviceId: '9ba7b810-9dad-11d1-80b4-00c04fd430c8',
        deviceType: DeviceType.FITNESS_TRACKER,
        connectionMethod: 'oauth',
        connectedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'aba7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'health-service',
          component: 'device-manager'
        }
      }
    },

    /**
     * Valid health insight generated event with all required fields
     */
    insightGenerated: {
      type: EventType.HEALTH_INSIGHT_GENERATED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        insightId: 'bba7b810-9dad-11d1-80b4-00c04fd430c8',
        insightType: HealthInsightType.TREND_ANALYSIS,
        metricType: HealthMetricType.BLOOD_PRESSURE,
        description: 'Your blood pressure has been consistently improving over the past month.',
        severity: 'info',
        generatedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'cba7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'health-service',
          component: 'insight-generator'
        }
      }
    }
  },

  /**
   * Valid care journey events
   */
  care: {
    /**
     * Valid appointment booked event with all required fields
     */
    appointmentBooked: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        appointmentId: 'dba7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: 'eba7b810-9dad-11d1-80b4-00c04fd430c8',
        specialtyType: 'Cardiologia',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        bookedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'fba7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'care-service',
          component: 'appointment-scheduler'
        }
      }
    },

    /**
     * Valid medication taken event with all required fields
     */
    medicationTaken: {
      type: EventType.CARE_MEDICATION_TAKEN,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        medicationId: '0ca7b810-9dad-11d1-80b4-00c04fd430c8',
        medicationName: 'Atenolol',
        dosage: '50mg',
        takenAt: new Date().toISOString(),
        adherence: 'on_time'
      },
      metadata: {
        eventId: '1ca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'care-service',
          component: 'medication-tracker'
        }
      }
    },

    /**
     * Valid telemedicine completed event with all required fields
     */
    telemedicineCompleted: {
      type: EventType.CARE_TELEMEDICINE_COMPLETED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        sessionId: '2ca7b810-9dad-11d1-80b4-00c04fd430c8',
        appointmentId: '3ca7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: '4ca7b810-9dad-11d1-80b4-00c04fd430c8',
        startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        endedAt: new Date().toISOString(),
        duration: 30,
        quality: 'good'
      },
      metadata: {
        eventId: '5ca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'care-service',
          component: 'telemedicine-manager'
        }
      }
    }
  },

  /**
   * Valid plan journey events
   */
  plan: {
    /**
     * Valid claim submitted event with all required fields
     */
    claimSubmitted: {
      type: EventType.PLAN_CLAIM_SUBMITTED,
      journey: 'plan',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        claimId: '6ca7b810-9dad-11d1-80b4-00c04fd430c8',
        claimType: 'medical',
        providerId: '7ca7b810-9dad-11d1-80b4-00c04fd430c8',
        serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        amount: 250.00,
        submittedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '8ca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'plan-service',
          component: 'claim-processor'
        }
      }
    },

    /**
     * Valid benefit utilized event with all required fields
     */
    benefitUtilized: {
      type: EventType.PLAN_BENEFIT_UTILIZED,
      journey: 'plan',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        benefitId: '9ca7b810-9dad-11d1-80b4-00c04fd430c8',
        benefitType: 'preventive',
        providerId: 'aca7b810-9dad-11d1-80b4-00c04fd430c8',
        utilizationDate: new Date().toISOString(),
        savingsAmount: 150.00
      },
      metadata: {
        eventId: 'bca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'plan-service',
          component: 'benefit-tracker'
        }
      }
    },

    /**
     * Valid reward redeemed event with all required fields
     */
    rewardRedeemed: {
      type: EventType.PLAN_REWARD_REDEEMED,
      journey: 'plan',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        rewardId: 'cca7b810-9dad-11d1-80b4-00c04fd430c8',
        rewardType: 'gift_card',
        pointsRedeemed: 1000,
        value: 50.00,
        redeemedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'dca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'plan-service',
          component: 'reward-manager'
        }
      }
    }
  },

  /**
   * Valid gamification events
   */
  gamification: {
    /**
     * Valid points earned event with all required fields
     */
    pointsEarned: {
      type: EventType.GAMIFICATION_POINTS_EARNED,
      journey: 'gamification',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        sourceType: 'health',
        sourceId: 'eca7b810-9dad-11d1-80b4-00c04fd430c8',
        points: 50,
        reason: 'Completed daily step goal',
        earnedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'fca7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'gamification-engine',
          component: 'point-calculator'
        }
      }
    },

    /**
     * Valid achievement unlocked event with all required fields
     */
    achievementUnlocked: {
      type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
      journey: 'gamification',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        achievementId: '0da7b810-9dad-11d1-80b4-00c04fd430c8',
        achievementType: 'health-check-streak',
        tier: 'silver',
        points: 100,
        unlockedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '1da7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'gamification-engine',
          component: 'achievement-processor'
        }
      }
    }
  },

  /**
   * Valid user events
   */
  user: {
    /**
     * Valid user login event with all required fields
     */
    login: {
      type: EventType.USER_LOGIN,
      journey: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        loginMethod: 'password',
        deviceType: 'mobile',
        loginAt: new Date().toISOString()
      },
      metadata: {
        eventId: '2da7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'auth-service',
          component: 'login-processor'
        }
      }
    },

    /**
     * Valid user onboarding completed event with all required fields
     */
    onboardingCompleted: {
      type: EventType.USER_ONBOARDING_COMPLETED,
      journey: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        completedSteps: ['profile', 'preferences', 'health-assessment', 'plan-selection'],
        selectedJourneys: ['health', 'care', 'plan'],
        duration: 300, // 5 minutes in seconds
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '3da7b810-9dad-11d1-80b4-00c04fd430c8',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date(),
        version: {
          major: '1',
          minor: '0',
          patch: '0'
        },
        origin: {
          service: 'user-service',
          component: 'onboarding-manager'
        }
      }
    }
  },

  /**
   * Valid events with edge case values that should still pass validation
   */
  edgeCases: {
    /**
     * Valid health metric with minimum acceptable heart rate
     */
    minHeartRate: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 30, // Minimum acceptable heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '4da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Valid health metric with maximum acceptable heart rate
     */
    maxHeartRate: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 220, // Maximum acceptable heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '5da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Valid event with minimal metadata
     */
    minimalMetadata: {
      type: EventType.USER_LOGIN,
      journey: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        loginMethod: 'password',
        deviceType: 'mobile',
        loginAt: new Date().toISOString()
      },
      metadata: {
        timestamp: new Date()
      }
    }
  }
};

// ===== INVALID EVENT FIXTURES =====

/**
 * Collection of invalid event fixtures that should fail validation.
 * These fixtures can be used as negative test cases for validation logic.
 */
export const invalidEvents = {
  /**
   * Events with missing required fields
   */
  missingRequiredFields: {
    /**
     * Missing event type
     */
    missingType: {
      // type is missing
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '6da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Missing journey
     */
    missingJourney: {
      type: EventType.HEALTH_METRIC_RECORDED,
      // journey is missing
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '7da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Missing user ID
     */
    missingUserId: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      // userId is missing
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '8da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Missing data
     */
    missingData: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      // data is missing
      metadata: {
        eventId: '9da7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Missing metadata
     */
    missingMetadata: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
      // metadata is missing
    },

    /**
     * Missing required field in data (health metric)
     */
    missingMetricType: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        // metricType is missing
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'ada7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Missing required field in data (appointment)
     */
    missingAppointmentId: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        // appointmentId is missing
        providerId: 'bda7b810-9dad-11d1-80b4-00c04fd430c8',
        specialtyType: 'Cardiologia',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'cda7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    }
  },

  /**
   * Events with incorrect data types
   */
  incorrectDataTypes: {
    /**
     * Incorrect type for event type (number instead of string)
     */
    numericEventType: {
      type: 123, // Should be a string
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'dda7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Incorrect type for user ID (number instead of UUID string)
     */
    numericUserId: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: 12345, // Should be a UUID string
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'eda7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Incorrect type for metric value (string instead of number)
     */
    stringMetricValue: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: '75', // Should be a number
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'fda7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Incorrect type for timestamp (Date object instead of ISO string)
     */
    dateObjectTimestamp: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date(), // Should be an ISO string
        source: 'manual'
      },
      metadata: {
        eventId: '0ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Incorrect type for metadata (string instead of object)
     */
    stringMetadata: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: 'invalid metadata' // Should be an object
    },

    /**
     * Incorrect type for array field (string instead of array)
     */
    stringInsteadOfArray: {
      type: EventType.USER_ONBOARDING_COMPLETED,
      journey: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        completedSteps: 'profile,preferences', // Should be an array
        selectedJourneys: ['health', 'care', 'plan'],
        duration: 300,
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '1ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    }
  },

  /**
   * Events with values outside acceptable ranges
   */
  outOfRangeValues: {
    /**
     * Heart rate below minimum acceptable value
     */
    heartRateTooLow: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 20, // Below minimum of 30
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '2ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Heart rate above maximum acceptable value
     */
    heartRateTooHigh: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 250, // Above maximum of 220
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '3ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Negative steps count
     */
    negativeSteps: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.STEPS,
        value: -100, // Should be non-negative
        unit: 'steps',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '4ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Unrealistically high steps count
     */
    tooManySteps: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.STEPS,
        value: 200000, // Above maximum of 100000
        unit: 'steps',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '5ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Negative duration for telemedicine session
     */
    negativeDuration: {
      type: EventType.CARE_TELEMEDICINE_COMPLETED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        sessionId: '6ea7b810-9dad-11d1-80b4-00c04fd430c8',
        appointmentId: '7ea7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: '8ea7b810-9dad-11d1-80b4-00c04fd430c8',
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        endedAt: new Date().toISOString(),
        duration: -30, // Should be positive
        quality: 'good'
      },
      metadata: {
        eventId: '9ea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Progress percentage above 100%
     */
    progressTooHigh: {
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        goalId: 'aea7b810-9dad-11d1-80b4-00c04fd430c8',
        goalType: HealthGoalType.STEPS_TARGET,
        progressPercentage: 120, // Should be max 100
        targetValue: 10000,
        achievedValue: 12000,
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'bea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    }
  },

  /**
   * Events with invalid relationships between fields
   */
  invalidRelationships: {
    /**
     * End time before start time
     */
    endBeforeStart: {
      type: EventType.CARE_TELEMEDICINE_COMPLETED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        sessionId: 'cea7b810-9dad-11d1-80b4-00c04fd430c8',
        appointmentId: 'dea7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: 'eea7b810-9dad-11d1-80b4-00c04fd430c8',
        startedAt: new Date().toISOString(), // Now
        endedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        duration: 30,
        quality: 'good'
      },
      metadata: {
        eventId: 'fea7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Appointment scheduled in the past
     */
    appointmentInPast: {
      type: EventType.CARE_APPOINTMENT_BOOKED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        appointmentId: '0fa7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: '1fa7b810-9dad-11d1-80b4-00c04fd430c8',
        specialtyType: 'Cardiologia',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        bookedAt: new Date().toISOString() // Now
      },
      metadata: {
        eventId: '2fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Achieved value less than target value for goal
     */
    achievedLessThanTarget: {
      type: EventType.HEALTH_GOAL_ACHIEVED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        goalId: '3fa7b810-9dad-11d1-80b4-00c04fd430c8',
        goalType: HealthGoalType.STEPS_TARGET,
        targetValue: 10000,
        achievedValue: 9000, // Less than target
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: '4fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Mismatched unit for metric type
     */
    mismatchedUnit: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'kg', // Should be 'bpm' for heart rate
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '5fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    }
  },

  /**
   * Events with invalid enum values
   */
  invalidEnumValues: {
    /**
     * Invalid journey name
     */
    invalidJourney: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'invalid_journey', // Not a valid journey
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '6fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Invalid event type
     */
    invalidEventType: {
      type: 'INVALID_EVENT_TYPE', // Not a valid event type
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '7fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Invalid metric type
     */
    invalidMetricType: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: 'INVALID_METRIC', // Not a valid metric type
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '8fa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Invalid device type
     */
    invalidDeviceType: {
      type: EventType.HEALTH_DEVICE_CONNECTED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        deviceId: '9fa7b810-9dad-11d1-80b4-00c04fd430c8',
        deviceType: 'INVALID_DEVICE', // Not a valid device type
        connectionMethod: 'oauth',
        connectedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'afa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    },

    /**
     * Invalid appointment status
     */
    invalidAppointmentStatus: {
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      journey: 'care',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        appointmentId: 'bfa7b810-9dad-11d1-80b4-00c04fd430c8',
        providerId: 'cfa7b810-9dad-11d1-80b4-00c04fd430c8',
        status: 'INVALID_STATUS', // Not a valid appointment status
        completedAt: new Date().toISOString()
      },
      metadata: {
        eventId: 'dfa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date()
      }
    }
  },

  /**
   * Events with invalid metadata
   */
  invalidMetadata: {
    /**
     * Invalid event ID (not a UUID)
     */
    invalidEventId: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'not-a-uuid', // Not a valid UUID
        timestamp: new Date()
      }
    },

    /**
     * Invalid timestamp (string instead of Date)
     */
    invalidTimestamp: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'efa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: 'not-a-date' // Should be a Date object
      }
    },

    /**
     * Invalid version format
     */
    invalidVersionFormat: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: 'ffa7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date(),
        version: {
          major: 'one', // Should be a numeric string
          minor: '0',
          patch: '0'
        }
      }
    },

    /**
     * Missing required field in origin
     */
    missingServiceInOrigin: {
      type: EventType.HEALTH_METRIC_RECORDED,
      journey: 'health',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      },
      metadata: {
        eventId: '00a7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: new Date(),
        origin: {
          // service is missing
          component: 'metric-processor'
        }
      }
    }
  }
};

/**
 * Helper function to create a valid event with custom overrides.
 * Useful for creating test cases with specific variations.
 * 
 * @param baseEvent The base event to start with
 * @param overrides Properties to override in the base event
 * @returns A new event with the specified overrides
 */
export function createEventWithOverrides(baseEvent: any, overrides: any): any {
  return {
    ...JSON.parse(JSON.stringify(baseEvent)), // Deep clone
    ...overrides,
    // Handle nested overrides
    data: overrides.data ? { ...baseEvent.data, ...overrides.data } : baseEvent.data,
    metadata: overrides.metadata ? { ...baseEvent.metadata, ...overrides.metadata } : baseEvent.metadata
  };
}

/**
 * Helper function to create a batch of events for testing batch validation.
 * 
 * @param count Number of events to create
 * @param baseEvent Base event to use as a template
 * @param modifierFn Optional function to modify each event
 * @returns Array of events
 */
export function createEventBatch(count: number, baseEvent: any, modifierFn?: (event: any, index: number) => any): any[] {
  const batch = [];
  
  for (let i = 0; i < count; i++) {
    const event = JSON.parse(JSON.stringify(baseEvent)); // Deep clone
    
    // Generate a unique event ID for each event
    if (event.metadata && event.metadata.eventId) {
      event.metadata.eventId = `batch-${i}-${Date.now()}`;
    }
    
    // Apply custom modifications if provided
    if (modifierFn) {
      const modifiedEvent = modifierFn(event, i);
      batch.push(modifiedEvent);
    } else {
      batch.push(event);
    }
  }
  
  return batch;
}