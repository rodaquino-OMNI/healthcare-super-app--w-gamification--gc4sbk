/**
 * @file common-events.mock.ts
 * @description Provides shared mock data patterns for events that apply across multiple journeys,
 * such as user profile updates, achievement unlocks, and system notifications. This file centralizes
 * common event structures to ensure consistency when testing cross-journey functionality in the
 * gamification engine, reducing duplication and standardizing the approach to multi-journey event testing.
 *
 * @module events/test/unit/dto/mocks
 */

import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto, createEventMetadata } from '../../../../src/dto/event-metadata.dto';

/**
 * Creates a standard event metadata object for testing.
 * 
 * @param service The service that generated the event
 * @param overrides Optional overrides for the metadata
 * @returns Event metadata object for testing
 */
export function createTestEventMetadata(
  service: string = 'test-service',
  overrides: Partial<EventMetadataDto> = {}
): EventMetadataDto {
  const metadata = createEventMetadata(service);
  metadata.correlationId = overrides.correlationId || '550e8400-e29b-41d4-a716-446655440000';
  metadata.eventId = overrides.eventId || '63f5f96d-f5d9-4c3e-9a8c-b9c3d6e9a1b2';
  metadata.timestamp = overrides.timestamp || new Date('2023-04-15T10:30:00Z');
  
  if (overrides.origin) {
    metadata.origin = {
      ...metadata.origin,
      ...overrides.origin
    };
  }
  
  if (overrides.version) {
    metadata.version = {
      ...metadata.version,
      ...overrides.version
    };
  }
  
  if (overrides.context) {
    metadata.context = {
      ...metadata.context,
      ...overrides.context
    };
  }
  
  return metadata;
}

/**
 * Base interface for all mock event objects.
 */
export interface MockEvent {
  type: EventType;
  userId: string;
  metadata: EventMetadataDto;
  payload: Record<string, any>;
}

// ===== USER PROFILE EVENT MOCKS =====

/**
 * Mock for a user profile completed event.
 * This event is triggered when a user completes their profile information.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock user profile completed event
 */
export function createUserProfileCompletedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.USER_PROFILE_COMPLETED,
    userId,
    metadata: createTestEventMetadata('auth-service', overrides.metadata),
    payload: {
      completionPercentage: 100,
      completedSections: [
        'personal',
        'contact',
        'health',
        'insurance',
        'preferences'
      ],
      completedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a user login event.
 * This event is triggered when a user logs into the application.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock user login event
 */
export function createUserLoginEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.USER_LOGIN,
    userId,
    metadata: createTestEventMetadata('auth-service', overrides.metadata),
    payload: {
      loginMethod: 'password',
      deviceType: 'mobile',
      loginAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a user onboarding completed event.
 * This event is triggered when a user completes the onboarding process.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock user onboarding completed event
 */
export function createUserOnboardingCompletedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.USER_ONBOARDING_COMPLETED,
    userId,
    metadata: createTestEventMetadata('auth-service', overrides.metadata),
    payload: {
      completedSteps: [
        'welcome',
        'profile',
        'journey-selection',
        'preferences',
        'tutorial'
      ],
      selectedJourneys: ['health', 'care', 'plan'],
      duration: 300, // seconds
      completedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a user feedback submitted event.
 * This event is triggered when a user submits feedback about the application.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock user feedback submitted event
 */
export function createUserFeedbackSubmittedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.USER_FEEDBACK_SUBMITTED,
    userId,
    metadata: createTestEventMetadata('feedback-service', overrides.metadata),
    payload: {
      feedbackType: 'app',
      rating: 4,
      comments: 'Great app, but could use more features.',
      submittedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

// ===== ACHIEVEMENT EVENT MOCKS =====

/**
 * Mock for a gamification points earned event.
 * This event is triggered when a user earns points in the gamification system.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock gamification points earned event
 */
export function createGamificationPointsEarnedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.GAMIFICATION_POINTS_EARNED,
    userId,
    metadata: createTestEventMetadata('gamification-engine', overrides.metadata),
    payload: {
      sourceType: 'health',
      sourceId: 'health-metric-123',
      points: 50,
      reason: 'Recorded daily health metrics',
      earnedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a gamification achievement unlocked event.
 * This event is triggered when a user unlocks an achievement in the gamification system.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock gamification achievement unlocked event
 */
export function createGamificationAchievementUnlockedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    userId,
    metadata: createTestEventMetadata('gamification-engine', overrides.metadata),
    payload: {
      achievementId: 'achievement-123',
      achievementType: 'health-check-streak',
      tier: 'silver',
      points: 100,
      unlockedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a gamification level up event.
 * This event is triggered when a user levels up in the gamification system.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock gamification level up event
 */
export function createGamificationLevelUpEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.GAMIFICATION_LEVEL_UP,
    userId,
    metadata: createTestEventMetadata('gamification-engine', overrides.metadata),
    payload: {
      previousLevel: 2,
      newLevel: 3,
      totalPoints: 1000,
      leveledUpAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

/**
 * Mock for a gamification quest completed event.
 * This event is triggered when a user completes a quest in the gamification system.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock gamification quest completed event
 */
export function createGamificationQuestCompletedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.GAMIFICATION_QUEST_COMPLETED,
    userId,
    metadata: createTestEventMetadata('gamification-engine', overrides.metadata),
    payload: {
      questId: 'quest-123',
      questType: 'daily',
      difficulty: 'medium',
      points: 75,
      completedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

// ===== REWARD EVENT MOCKS =====

/**
 * Mock for a plan reward redeemed event.
 * This event is triggered when a user redeems a reward in the plan journey.
 * 
 * @param userId User ID for the event
 * @param overrides Optional overrides for the event
 * @returns Mock plan reward redeemed event
 */
export function createPlanRewardRedeemedEvent(
  userId: string = 'user-123',
  overrides: Partial<MockEvent> = {}
): MockEvent {
  return {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId,
    metadata: createTestEventMetadata('plan-service', overrides.metadata),
    payload: {
      rewardId: 'reward-123',
      rewardType: 'gift_card',
      pointsRedeemed: 500,
      value: 50.00,
      redeemedAt: '2023-04-15T10:30:00Z',
      ...overrides.payload
    }
  };
}

// ===== CROSS-JOURNEY EVENT MOCKS =====

/**
 * Creates a mock event for a specific journey type.
 * This is a helper function to create events for different journeys with consistent structure.
 * 
 * @param journeyType The journey type (health, care, plan)
 * @param eventType The specific event type
 * @param userId User ID for the event
 * @param payload Event payload
 * @param metadata Event metadata
 * @returns Mock journey-specific event
 */
export function createJourneyEvent(
  journeyType: 'health' | 'care' | 'plan',
  eventType: EventType,
  userId: string = 'user-123',
  payload: Record<string, any> = {},
  metadata: Partial<EventMetadataDto> = {}
): MockEvent {
  const serviceName = `${journeyType}-service`;
  
  return {
    type: eventType,
    userId,
    metadata: createTestEventMetadata(serviceName, metadata),
    payload
  };
}

/**
 * Creates a collection of mock events that represent a complete user journey flow.
 * This is useful for testing cross-journey interactions and gamification rules.
 * 
 * @param userId User ID for the events
 * @param journeyType The journey type to create events for
 * @returns Array of mock events representing a journey flow
 */
export function createJourneyFlowEvents(
  userId: string = 'user-123',
  journeyType: 'health' | 'care' | 'plan' = 'health'
): MockEvent[] {
  const events: MockEvent[] = [];
  const timestamp = new Date('2023-04-15T10:00:00Z');
  const correlationId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Add login event
  events.push(createUserLoginEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp)
    }
  }));
  
  // Add journey-specific events based on the journey type
  if (journeyType === 'health') {
    // Health journey flow
    events.push(createJourneyEvent('health', EventType.HEALTH_METRIC_RECORDED, userId, {
      metricType: 'blood_pressure',
      value: 120,
      unit: 'mmHg',
      timestamp: new Date(timestamp.getTime() + 5 * 60000).toISOString(),
      source: 'manual'
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 5 * 60000) }));
    
    events.push(createJourneyEvent('health', EventType.HEALTH_GOAL_CREATED, userId, {
      goalId: 'goal-123',
      goalType: 'steps',
      targetValue: 10000,
      startValue: 0,
      createdAt: new Date(timestamp.getTime() + 10 * 60000).toISOString()
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 10 * 60000) }));
    
    events.push(createJourneyEvent('health', EventType.HEALTH_GOAL_ACHIEVED, userId, {
      goalId: 'goal-123',
      goalType: 'steps',
      targetValue: 10000,
      achievedValue: 10500,
      completedAt: new Date(timestamp.getTime() + 15 * 60000).toISOString()
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 15 * 60000) }));
  } else if (journeyType === 'care') {
    // Care journey flow
    events.push(createJourneyEvent('care', EventType.CARE_APPOINTMENT_BOOKED, userId, {
      appointmentId: 'appointment-123',
      providerId: 'provider-123',
      specialtyType: 'Cardiologia',
      appointmentType: 'in_person',
      scheduledAt: new Date(timestamp.getTime() + 86400000).toISOString(), // Next day
      bookedAt: new Date(timestamp.getTime() + 5 * 60000).toISOString()
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 5 * 60000) }));
    
    events.push(createJourneyEvent('care', EventType.CARE_MEDICATION_TAKEN, userId, {
      medicationId: 'medication-123',
      medicationName: 'Aspirin',
      dosage: '100mg',
      takenAt: new Date(timestamp.getTime() + 10 * 60000).toISOString(),
      adherence: 'on_time'
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 10 * 60000) }));
    
    events.push(createJourneyEvent('care', EventType.CARE_APPOINTMENT_COMPLETED, userId, {
      appointmentId: 'appointment-123',
      providerId: 'provider-123',
      appointmentType: 'in_person',
      scheduledAt: new Date(timestamp.getTime() + 86400000).toISOString(),
      completedAt: new Date(timestamp.getTime() + 86400000 + 30 * 60000).toISOString(),
      duration: 30
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 86400000 + 30 * 60000) }));
  } else if (journeyType === 'plan') {
    // Plan journey flow
    events.push(createJourneyEvent('plan', EventType.PLAN_SELECTED, userId, {
      planId: 'plan-123',
      planType: 'health',
      coverageLevel: 'individual',
      premium: 250.00,
      startDate: new Date(timestamp.getTime() + 30 * 86400000).toISOString(), // 30 days later
      selectedAt: new Date(timestamp.getTime() + 5 * 60000).toISOString()
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 5 * 60000) }));
    
    events.push(createJourneyEvent('plan', EventType.PLAN_CLAIM_SUBMITTED, userId, {
      claimId: 'claim-123',
      claimType: 'medical',
      providerId: 'provider-123',
      serviceDate: new Date(timestamp.getTime() - 5 * 86400000).toISOString(), // 5 days ago
      amount: 150.00,
      submittedAt: new Date(timestamp.getTime() + 10 * 60000).toISOString()
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 10 * 60000) }));
    
    events.push(createJourneyEvent('plan', EventType.PLAN_CLAIM_PROCESSED, userId, {
      claimId: 'claim-123',
      status: 'approved',
      amount: 150.00,
      coveredAmount: 120.00,
      processedAt: new Date(timestamp.getTime() + 3 * 86400000).toISOString() // 3 days later
    }, { correlationId, timestamp: new Date(timestamp.getTime() + 3 * 86400000) }));
  }
  
  // Add achievement events that would result from the journey flow
  events.push(createGamificationPointsEarnedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 20 * 60000)
    },
    payload: {
      sourceType: journeyType,
      sourceId: `${journeyType}-action-123`,
      points: 50,
      reason: `Completed ${journeyType} journey action`,
      earnedAt: new Date(timestamp.getTime() + 20 * 60000).toISOString()
    }
  }));
  
  events.push(createGamificationAchievementUnlockedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 25 * 60000)
    },
    payload: {
      achievementId: 'achievement-123',
      achievementType: `${journeyType}-achievement`,
      tier: 'bronze',
      points: 100,
      unlockedAt: new Date(timestamp.getTime() + 25 * 60000).toISOString()
    }
  }));
  
  return events;
}

/**
 * Creates a collection of mock events that represent a multi-journey achievement scenario.
 * This is useful for testing cross-journey achievement tracking and gamification rules.
 * 
 * @param userId User ID for the events
 * @returns Array of mock events representing a multi-journey achievement scenario
 */
export function createMultiJourneyAchievementEvents(
  userId: string = 'user-123'
): MockEvent[] {
  const events: MockEvent[] = [];
  const timestamp = new Date('2023-04-15T10:00:00Z');
  const correlationId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Health journey event
  events.push(createJourneyEvent('health', EventType.HEALTH_METRIC_RECORDED, userId, {
    metricType: 'blood_pressure',
    value: 120,
    unit: 'mmHg',
    timestamp: new Date(timestamp.getTime()).toISOString(),
    source: 'manual'
  }, { correlationId, timestamp: new Date(timestamp.getTime()) }));
  
  // Care journey event
  events.push(createJourneyEvent('care', EventType.CARE_MEDICATION_TAKEN, userId, {
    medicationId: 'medication-123',
    medicationName: 'Aspirin',
    dosage: '100mg',
    takenAt: new Date(timestamp.getTime() + 5 * 60000).toISOString(),
    adherence: 'on_time'
  }, { correlationId, timestamp: new Date(timestamp.getTime() + 5 * 60000) }));
  
  // Plan journey event
  events.push(createJourneyEvent('plan', EventType.PLAN_BENEFIT_UTILIZED, userId, {
    benefitId: 'benefit-123',
    benefitType: 'wellness',
    utilizationDate: new Date(timestamp.getTime() + 10 * 60000).toISOString(),
    savingsAmount: 50.00
  }, { correlationId, timestamp: new Date(timestamp.getTime() + 10 * 60000) }));
  
  // Points earned from each journey
  events.push(createGamificationPointsEarnedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 15 * 60000)
    },
    payload: {
      sourceType: 'health',
      sourceId: 'health-metric-123',
      points: 25,
      reason: 'Recorded health metrics',
      earnedAt: new Date(timestamp.getTime() + 15 * 60000).toISOString()
    }
  }));
  
  events.push(createGamificationPointsEarnedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 16 * 60000)
    },
    payload: {
      sourceType: 'care',
      sourceId: 'medication-123',
      points: 25,
      reason: 'Medication adherence',
      earnedAt: new Date(timestamp.getTime() + 16 * 60000).toISOString()
    }
  }));
  
  events.push(createGamificationPointsEarnedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 17 * 60000)
    },
    payload: {
      sourceType: 'plan',
      sourceId: 'benefit-123',
      points: 25,
      reason: 'Benefit utilization',
      earnedAt: new Date(timestamp.getTime() + 17 * 60000).toISOString()
    }
  }));
  
  // Cross-journey achievement unlocked
  events.push(createGamificationAchievementUnlockedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 20 * 60000)
    },
    payload: {
      achievementId: 'cross-journey-achievement-123',
      achievementType: 'wellness-master',
      tier: 'gold',
      points: 200,
      unlockedAt: new Date(timestamp.getTime() + 20 * 60000).toISOString()
    }
  }));
  
  // Level up event resulting from cross-journey achievement
  events.push(createGamificationLevelUpEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 25 * 60000)
    },
    payload: {
      previousLevel: 3,
      newLevel: 4,
      totalPoints: 1500,
      leveledUpAt: new Date(timestamp.getTime() + 25 * 60000).toISOString()
    }
  }));
  
  return events;
}

/**
 * Creates a collection of mock events that represent a reward distribution scenario.
 * This is useful for testing reward distribution mechanisms and redemption flows.
 * 
 * @param userId User ID for the events
 * @returns Array of mock events representing a reward distribution scenario
 */
export function createRewardDistributionEvents(
  userId: string = 'user-123'
): MockEvent[] {
  const events: MockEvent[] = [];
  const timestamp = new Date('2023-04-15T10:00:00Z');
  const correlationId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Achievement unlocked that grants a reward
  events.push(createGamificationAchievementUnlockedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime())
    },
    payload: {
      achievementId: 'achievement-123',
      achievementType: 'health-check-streak',
      tier: 'gold',
      points: 200,
      unlockedAt: new Date(timestamp.getTime()).toISOString()
    }
  }));
  
  // Points earned from achievement
  events.push(createGamificationPointsEarnedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 1000)
    },
    payload: {
      sourceType: 'achievement',
      sourceId: 'achievement-123',
      points: 200,
      reason: 'Achievement unlocked: Health Check Streak (Gold)',
      earnedAt: new Date(timestamp.getTime() + 1000).toISOString()
    }
  }));
  
  // Reward redemption
  events.push(createPlanRewardRedeemedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 5 * 60000)
    },
    payload: {
      rewardId: 'reward-123',
      rewardType: 'premium_discount',
      pointsRedeemed: 500,
      value: 25.00,
      redeemedAt: new Date(timestamp.getTime() + 5 * 60000).toISOString()
    }
  }));
  
  return events;
}

/**
 * Creates a collection of mock events that represent an achievement notification scenario.
 * This is useful for testing achievement notification systems and visualization components.
 * 
 * @param userId User ID for the events
 * @returns Array of mock events representing an achievement notification scenario
 */
export function createAchievementNotificationEvents(
  userId: string = 'user-123'
): MockEvent[] {
  const events: MockEvent[] = [];
  const timestamp = new Date('2023-04-15T10:00:00Z');
  const correlationId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Achievement unlocked
  events.push(createGamificationAchievementUnlockedEvent(userId, {
    metadata: {
      correlationId,
      timestamp: new Date(timestamp.getTime())
    },
    payload: {
      achievementId: 'achievement-123',
      achievementType: 'steps-goal',
      tier: 'silver',
      points: 100,
      unlockedAt: new Date(timestamp.getTime()).toISOString()
    }
  }));
  
  // System notification for achievement (would be created by notification service)
  events.push({
    type: EventType.USER_FEEDBACK_SUBMITTED, // Using this as a proxy for notification event
    userId,
    metadata: createTestEventMetadata('notification-service', {
      correlationId,
      timestamp: new Date(timestamp.getTime() + 1000)
    }),
    payload: {
      notificationType: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You earned the Caminhante Dedicado (Silver) achievement!',
      achievementId: 'achievement-123',
      achievementType: 'steps-goal',
      tier: 'silver',
      points: 100,
      iconUrl: 'https://austa.com.br/assets/achievements/steps-goal-silver.png',
      createdAt: new Date(timestamp.getTime() + 1000).toISOString(),
      expiresAt: new Date(timestamp.getTime() + 86400000).toISOString() // 24 hours later
    }
  });
  
  return events;
}

// Export all mock event creators
export const CommonEventMocks = {
  createUserProfileCompletedEvent,
  createUserLoginEvent,
  createUserOnboardingCompletedEvent,
  createUserFeedbackSubmittedEvent,
  createGamificationPointsEarnedEvent,
  createGamificationAchievementUnlockedEvent,
  createGamificationLevelUpEvent,
  createGamificationQuestCompletedEvent,
  createPlanRewardRedeemedEvent,
  createJourneyEvent,
  createJourneyFlowEvents,
  createMultiJourneyAchievementEvents,
  createRewardDistributionEvents,
  createAchievementNotificationEvents
};