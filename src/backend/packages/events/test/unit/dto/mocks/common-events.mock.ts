/**
 * @file Provides shared mock data patterns for events that apply across multiple journeys.
 * 
 * This file centralizes common event structures to ensure consistency when testing
 * cross-journey functionality in the gamification engine, reducing duplication and
 * standardizing the approach to multi-journey event testing.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  EventType, 
  EventJourney, 
  GamificationEvent,
  AchievementUnlockedPayload,
  QuestCompletedPayload,
  XpEarnedPayload,
  LevelUpPayload
} from '@austa/interfaces/gamification/events';

/**
 * Creates a base event structure with common properties
 * 
 * @param type - The event type
 * @param userId - The user ID (defaults to a random UUID)
 * @param journey - The journey (defaults to CROSS_JOURNEY)
 * @returns A partial GamificationEvent with common properties
 */
const createBaseEvent = (
  type: EventType,
  userId: string = uuidv4(),
  journey: EventJourney = EventJourney.CROSS_JOURNEY
): Partial<GamificationEvent> => ({
  eventId: uuidv4(),
  type,
  userId,
  journey,
  createdAt: new Date().toISOString(),
  source: 'test',
  correlationId: uuidv4(),
  version: { major: 1, minor: 0, patch: 0 }
});

// User Profile Event Mocks

/**
 * Mock for PROFILE_COMPLETED event
 */
export const profileCompletedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.PROFILE_COMPLETED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    completedSections: ['personal', 'contact', 'health', 'preferences'],
    isFirstTimeCompletion: true,
    completionPercentage: 100,
    metadata: {
      platform: 'mobile',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

/**
 * Mock for PROFILE_UPDATED event
 */
export const profileUpdatedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.PROFILE_UPDATED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    updatedSections: ['health', 'preferences'],
    isSignificantUpdate: true,
    metadata: {
      platform: 'web',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

// Achievement Notification Event Mocks

/**
 * Mock for ACHIEVEMENT_UNLOCKED event with health journey achievement
 */
export const healthAchievementUnlockedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.ACHIEVEMENT_UNLOCKED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    achievementId: uuidv4(),
    achievementTitle: 'Monitor de Saúde',
    achievementDescription: 'Registre suas métricas de saúde por 7 dias consecutivos',
    xpEarned: 100,
    relatedJourney: EventJourney.HEALTH,
    metadata: {
      level: 1,
      iconUrl: 'heart-pulse',
      isFirstAchievement: false
    }
  } as AchievementUnlockedPayload
};

/**
 * Mock for ACHIEVEMENT_UNLOCKED event with care journey achievement
 */
export const careAchievementUnlockedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.ACHIEVEMENT_UNLOCKED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    achievementId: uuidv4(),
    achievementTitle: 'Compromisso com a Saúde',
    achievementDescription: 'Compareça a 5 consultas agendadas',
    xpEarned: 150,
    relatedJourney: EventJourney.CARE,
    metadata: {
      level: 2,
      iconUrl: 'calendar-check',
      isFirstAchievement: false
    }
  } as AchievementUnlockedPayload
};

/**
 * Mock for ACHIEVEMENT_UNLOCKED event with plan journey achievement
 */
export const planAchievementUnlockedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.ACHIEVEMENT_UNLOCKED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    achievementId: uuidv4(),
    achievementTitle: 'Mestre em Reembolsos',
    achievementDescription: 'Submeta 3 solicitações de reembolso completas',
    xpEarned: 120,
    relatedJourney: EventJourney.PLAN,
    metadata: {
      level: 1,
      iconUrl: 'receipt',
      isFirstAchievement: true
    }
  } as AchievementUnlockedPayload
};

/**
 * Mock for ACHIEVEMENT_UNLOCKED event with cross-journey achievement
 */
export const crossJourneyAchievementUnlockedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.ACHIEVEMENT_UNLOCKED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    achievementId: uuidv4(),
    achievementTitle: 'Usuário Dedicado',
    achievementDescription: 'Use o aplicativo por 30 dias consecutivos',
    xpEarned: 200,
    relatedJourney: EventJourney.CROSS_JOURNEY,
    metadata: {
      level: 3,
      iconUrl: 'trophy',
      isFirstAchievement: false
    }
  } as AchievementUnlockedPayload
};

// System-Level Event Mocks

/**
 * Mock for DAILY_LOGIN event
 */
export const dailyLoginEvent: GamificationEvent = {
  ...createBaseEvent(EventType.DAILY_LOGIN) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    loginStreak: 7,
    isWeeklyStreak: true,
    isMonthlyStreak: false,
    metadata: {
      platform: 'mobile',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

/**
 * Mock for WEEKLY_ACTIVE event
 */
export const weeklyActiveEvent: GamificationEvent = {
  ...createBaseEvent(EventType.WEEKLY_ACTIVE) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    daysActive: 5,
    weekNumber: 23,
    year: 2023,
    metadata: {
      platform: 'web',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

/**
 * Mock for MONTHLY_ACTIVE event
 */
export const monthlyActiveEvent: GamificationEvent = {
  ...createBaseEvent(EventType.MONTHLY_ACTIVE) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    daysActive: 22,
    month: 6,
    year: 2023,
    metadata: {
      platform: 'mobile',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

/**
 * Mock for APP_FEATURE_USED event
 */
export const appFeatureUsedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.APP_FEATURE_USED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    featureName: 'symptom-checker',
    usageCount: 3,
    journeyContext: EventJourney.CARE,
    metadata: {
      platform: 'mobile',
      appVersion: '1.0.0',
      sessionId: uuidv4(),
      screenName: 'SymptomCheckerScreen'
    }
  }
};

/**
 * Mock for FEEDBACK_PROVIDED event
 */
export const feedbackProvidedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.FEEDBACK_PROVIDED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    feedbackType: 'app-rating',
    rating: 4.5,
    hasComments: true,
    journeyContext: EventJourney.CROSS_JOURNEY,
    metadata: {
      platform: 'mobile',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

/**
 * Mock for SURVEY_COMPLETED event
 */
export const surveyCompletedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.SURVEY_COMPLETED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    surveyId: uuidv4(),
    surveyName: 'User Satisfaction Survey',
    questionCount: 10,
    completionTime: 180, // seconds
    journeyContext: EventJourney.CROSS_JOURNEY,
    metadata: {
      platform: 'web',
      appVersion: '1.0.0',
      sessionId: uuidv4()
    }
  }
};

// Reward-Related Event Mocks

/**
 * Mock for QUEST_COMPLETED event
 */
export const questCompletedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.QUEST_COMPLETED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    questId: uuidv4(),
    questTitle: 'Semana Saudável',
    xpEarned: 250,
    rewards: [
      {
        rewardId: uuidv4(),
        rewardType: 'discount',
        rewardValue: 15
      },
      {
        rewardId: uuidv4(),
        rewardType: 'badge',
        rewardValue: 1
      }
    ],
    metadata: {
      difficulty: 'medium',
      durationDays: 7,
      category: 'health'
    }
  } as QuestCompletedPayload
};

/**
 * Mock for XP_EARNED event from health journey
 */
export const healthXpEarnedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.XP_EARNED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    amount: 50,
    source: 'health-metric-recorded',
    description: 'Recorded daily steps goal',
    relatedJourney: EventJourney.HEALTH,
    metadata: {
      metricType: 'steps',
      goalAchieved: true
    }
  } as XpEarnedPayload
};

/**
 * Mock for XP_EARNED event from care journey
 */
export const careXpEarnedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.XP_EARNED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    amount: 75,
    source: 'appointment-attended',
    description: 'Attended scheduled appointment',
    relatedJourney: EventJourney.CARE,
    metadata: {
      appointmentType: 'check-up',
      providerId: uuidv4()
    }
  } as XpEarnedPayload
};

/**
 * Mock for XP_EARNED event from plan journey
 */
export const planXpEarnedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.XP_EARNED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    amount: 60,
    source: 'claim-submitted',
    description: 'Submitted complete claim with all required documents',
    relatedJourney: EventJourney.PLAN,
    metadata: {
      claimType: 'medical',
      documentCount: 3
    }
  } as XpEarnedPayload
};

/**
 * Mock for LEVEL_UP event
 */
export const levelUpEvent: GamificationEvent = {
  ...createBaseEvent(EventType.LEVEL_UP) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    newLevel: 5,
    previousLevel: 4,
    totalXp: 2500,
    unlockedRewards: [
      {
        rewardId: uuidv4(),
        rewardType: 'discount',
        rewardDescription: '20% off on next lab test'
      },
      {
        rewardId: uuidv4(),
        rewardType: 'feature',
        rewardDescription: 'Access to premium health content'
      }
    ],
    metadata: {
      nextLevelXp: 3000,
      xpToNextLevel: 500
    }
  } as LevelUpPayload
};

/**
 * Mock for REWARD_REDEEMED event
 */
export const rewardRedeemedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.REWARD_REDEEMED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    rewardId: uuidv4(),
    rewardType: 'discount',
    rewardValue: 20,
    rewardDescription: '20% off on next lab test',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    metadata: {
      redemptionCode: 'HEALTH20',
      partnerName: 'LabTest Inc.',
      category: 'health'
    }
  }
};

/**
 * Mock for REFERRAL_SENT event
 */
export const referralSentEvent: GamificationEvent = {
  ...createBaseEvent(EventType.REFERRAL_SENT) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    referralCode: 'REF123456',
    referralMethod: 'email',
    potentialXp: 100,
    metadata: {
      emailDomain: 'gmail.com',
      referralCount: 3
    }
  }
};

/**
 * Mock for REFERRAL_COMPLETED event
 */
export const referralCompletedEvent: GamificationEvent = {
  ...createBaseEvent(EventType.REFERRAL_COMPLETED) as GamificationEvent,
  payload: {
    timestamp: new Date().toISOString(),
    referralCode: 'REF123456',
    referrerUserId: uuidv4(),
    xpEarned: 100,
    rewards: [
      {
        rewardId: uuidv4(),
        rewardType: 'discount',
        rewardValue: 10
      }
    ],
    metadata: {
      conversionTime: 48, // hours
      referralMethod: 'email'
    }
  }
};

// Collection of all common events for easy export
export const commonEvents = {
  // User Profile Events
  profileCompletedEvent,
  profileUpdatedEvent,
  
  // Achievement Notification Events
  healthAchievementUnlockedEvent,
  careAchievementUnlockedEvent,
  planAchievementUnlockedEvent,
  crossJourneyAchievementUnlockedEvent,
  
  // System-Level Events
  dailyLoginEvent,
  weeklyActiveEvent,
  monthlyActiveEvent,
  appFeatureUsedEvent,
  feedbackProvidedEvent,
  surveyCompletedEvent,
  
  // Reward-Related Events
  questCompletedEvent,
  healthXpEarnedEvent,
  careXpEarnedEvent,
  planXpEarnedEvent,
  levelUpEvent,
  rewardRedeemedEvent,
  referralSentEvent,
  referralCompletedEvent
};