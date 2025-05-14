/**
 * @file common-events.mock.ts
 * 
 * Provides shared mock data patterns for events that apply across multiple journeys,
 * such as user profile updates, achievement unlocks, and system notifications.
 * This file centralizes common event structures to ensure consistency when testing
 * cross-journey functionality in the gamification engine.
 */

import { v4 as uuidv4 } from 'uuid';

// Common user IDs for consistent testing
const TEST_USER_ID = '12345678-1234-1234-1234-123456789012';
const TEST_ADMIN_ID = '87654321-8765-4321-8765-432187654321';

/**
 * Base event structure that all events should follow
 */
export interface MockEventBase {
  type: string;
  userId: string;
  data: Record<string, any>;
  journey?: string;
  timestamp?: string | Date;
}

/**
 * Creates a base event object with common properties
 * 
 * @param type - The event type
 * @param userId - The user ID associated with the event
 * @param data - The event payload data
 * @param journey - Optional journey identifier
 * @returns A mock event object
 */
export const createMockEvent = (
  type: string,
  userId: string = TEST_USER_ID,
  data: Record<string, any> = {},
  journey?: string
): MockEventBase => ({
  type,
  userId,
  data,
  journey,
  timestamp: new Date().toISOString()
});

/**
 * User profile event mocks applicable to all journeys
 */
export const userProfileEvents = {
  /**
   * User profile created event
   * Triggered when a new user profile is created
   */
  profileCreated: (userId: string = TEST_USER_ID): MockEventBase => createMockEvent(
    'USER_PROFILE_CREATED',
    userId,
    {
      email: `user-${userId.substring(0, 8)}@example.com`,
      name: `Test User ${userId.substring(0, 4)}`,
      createdAt: new Date().toISOString()
    }
  ),

  /**
   * User profile updated event
   * Triggered when a user updates their profile information
   */
  profileUpdated: (userId: string = TEST_USER_ID, fields: Record<string, any> = {}): MockEventBase => createMockEvent(
    'USER_PROFILE_UPDATED',
    userId,
    {
      updatedFields: fields,
      updatedAt: new Date().toISOString()
    }
  ),

  /**
   * User login event
   * Triggered when a user logs into the system
   */
  userLogin: (userId: string = TEST_USER_ID): MockEventBase => createMockEvent(
    'USER_LOGIN',
    userId,
    {
      loginTime: new Date().toISOString(),
      deviceType: 'mobile',
      ipAddress: '192.168.1.1'
    }
  ),

  /**
   * User logout event
   * Triggered when a user logs out of the system
   */
  userLogout: (userId: string = TEST_USER_ID): MockEventBase => createMockEvent(
    'USER_LOGOUT',
    userId,
    {
      logoutTime: new Date().toISOString(),
      sessionDuration: 3600 // seconds
    }
  ),

  /**
   * User journey started event
   * Triggered when a user starts interacting with a specific journey
   */
  journeyStarted: (userId: string = TEST_USER_ID, journey: string): MockEventBase => createMockEvent(
    'USER_JOURNEY_STARTED',
    userId,
    {
      startTime: new Date().toISOString(),
      entryPoint: 'app_home'
    },
    journey
  ),

  /**
   * User journey completed event
   * Triggered when a user completes a specific journey flow
   */
  journeyCompleted: (userId: string = TEST_USER_ID, journey: string): MockEventBase => createMockEvent(
    'USER_JOURNEY_COMPLETED',
    userId,
    {
      completionTime: new Date().toISOString(),
      duration: 300 // seconds
    },
    journey
  )
};

/**
 * Achievement notification event templates
 */
export const achievementEvents = {
  /**
   * Achievement unlocked event
   * Triggered when a user unlocks a new achievement
   */
  achievementUnlocked: (
    userId: string = TEST_USER_ID,
    achievementId: string = uuidv4(),
    achievementName: string = 'Test Achievement',
    journey?: string
  ): MockEventBase => createMockEvent(
    'ACHIEVEMENT_UNLOCKED',
    userId,
    {
      achievementId,
      achievementName,
      level: 1,
      unlockedAt: new Date().toISOString(),
      description: `You've unlocked the ${achievementName} achievement!`,
      iconUrl: `https://assets.austa.com.br/achievements/${achievementId}.png`
    },
    journey
  ),

  /**
   * Achievement level up event
   * Triggered when a user levels up an existing achievement
   */
  achievementLevelUp: (
    userId: string = TEST_USER_ID,
    achievementId: string = uuidv4(),
    achievementName: string = 'Test Achievement',
    level: number = 2,
    journey?: string
  ): MockEventBase => createMockEvent(
    'ACHIEVEMENT_LEVEL_UP',
    userId,
    {
      achievementId,
      achievementName,
      previousLevel: level - 1,
      newLevel: level,
      leveledUpAt: new Date().toISOString(),
      description: `You've reached level ${level} of the ${achievementName} achievement!`,
      iconUrl: `https://assets.austa.com.br/achievements/${achievementId}_${level}.png`
    },
    journey
  ),

  /**
   * Achievement progress updated event
   * Triggered when a user makes progress toward an achievement
   */
  achievementProgressUpdated: (
    userId: string = TEST_USER_ID,
    achievementId: string = uuidv4(),
    achievementName: string = 'Test Achievement',
    progress: number = 50,
    journey?: string
  ): MockEventBase => createMockEvent(
    'ACHIEVEMENT_PROGRESS_UPDATED',
    userId,
    {
      achievementId,
      achievementName,
      previousProgress: progress - 10,
      currentProgress: progress,
      threshold: 100,
      updatedAt: new Date().toISOString()
    },
    journey
  ),

  /**
   * Multi-journey achievement unlocked event
   * Triggered when a user unlocks an achievement that spans multiple journeys
   */
  multiJourneyAchievementUnlocked: (
    userId: string = TEST_USER_ID,
    achievementId: string = uuidv4(),
    achievementName: string = 'Cross-Journey Master',
    journeys: string[] = ['health', 'care', 'plan']
  ): MockEventBase => createMockEvent(
    'MULTI_JOURNEY_ACHIEVEMENT_UNLOCKED',
    userId,
    {
      achievementId,
      achievementName,
      level: 1,
      unlockedAt: new Date().toISOString(),
      description: `You've unlocked the ${achievementName} achievement across multiple journeys!`,
      iconUrl: `https://assets.austa.com.br/achievements/multi/${achievementId}.png`,
      journeys,
      isSpecial: true
    }
  )
};

/**
 * System-level event mocks for cross-journey scenarios
 */
export const systemEvents = {
  /**
   * System notification event
   * Triggered for system-wide notifications
   */
  systemNotification: (
    userId: string = TEST_USER_ID,
    title: string = 'System Notification',
    message: string = 'This is a system notification'
  ): MockEventBase => createMockEvent(
    'SYSTEM_NOTIFICATION',
    userId,
    {
      title,
      message,
      priority: 'normal',
      sentAt: new Date().toISOString(),
      requiresAction: false
    }
  ),

  /**
   * Feature announcement event
   * Triggered when a new feature is announced
   */
  featureAnnouncement: (
    userId: string = TEST_USER_ID,
    featureName: string = 'New Feature',
    description: string = 'A new feature has been added to the platform'
  ): MockEventBase => createMockEvent(
    'FEATURE_ANNOUNCEMENT',
    userId,
    {
      featureName,
      description,
      announcedAt: new Date().toISOString(),
      journeysAffected: ['health', 'care', 'plan'],
      learnMoreUrl: `https://austa.com.br/features/${featureName.toLowerCase().replace(/\s+/g, '-')}`
    }
  ),

  /**
   * Maintenance notification event
   * Triggered for system maintenance notifications
   */
  maintenanceNotification: (
    userId: string = TEST_USER_ID,
    startTime: Date = new Date(Date.now() + 86400000), // 24 hours from now
    endTime: Date = new Date(Date.now() + 90000000) // 25 hours from now
  ): MockEventBase => createMockEvent(
    'MAINTENANCE_NOTIFICATION',
    userId,
    {
      title: 'Scheduled Maintenance',
      message: 'The system will be undergoing scheduled maintenance.',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      affectedServices: ['all'],
      priority: 'high'
    }
  ),

  /**
   * Achievement visualization event
   * Triggered when an achievement is displayed to a user
   */
  achievementVisualization: (
    userId: string = TEST_USER_ID,
    achievementId: string = uuidv4(),
    achievementName: string = 'Test Achievement'
  ): MockEventBase => createMockEvent(
    'ACHIEVEMENT_VISUALIZATION',
    userId,
    {
      achievementId,
      achievementName,
      visualizedAt: new Date().toISOString(),
      visualizationType: 'popup',
      interactionDuration: 5 // seconds
    }
  )
};

/**
 * Reward-related event mocks that apply across journeys
 */
export const rewardEvents = {
  /**
   * Reward earned event
   * Triggered when a user earns a reward
   */
  rewardEarned: (
    userId: string = TEST_USER_ID,
    rewardId: string = uuidv4(),
    rewardName: string = 'Test Reward',
    journey?: string
  ): MockEventBase => createMockEvent(
    'REWARD_EARNED',
    userId,
    {
      rewardId,
      rewardName,
      earnedAt: new Date().toISOString(),
      description: `You've earned the ${rewardName} reward!`,
      iconUrl: `https://assets.austa.com.br/rewards/${rewardId}.png`,
      expiresAt: new Date(Date.now() + 2592000000).toISOString() // 30 days from now
    },
    journey
  ),

  /**
   * Reward redeemed event
   * Triggered when a user redeems a reward
   */
  rewardRedeemed: (
    userId: string = TEST_USER_ID,
    rewardId: string = uuidv4(),
    rewardName: string = 'Test Reward',
    journey?: string
  ): MockEventBase => createMockEvent(
    'REWARD_REDEEMED',
    userId,
    {
      rewardId,
      rewardName,
      redeemedAt: new Date().toISOString(),
      redemptionCode: `RED-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      value: 500 // points
    },
    journey
  ),

  /**
   * Points earned event
   * Triggered when a user earns points
   */
  pointsEarned: (
    userId: string = TEST_USER_ID,
    points: number = 100,
    reason: string = 'Activity Completion',
    journey?: string
  ): MockEventBase => createMockEvent(
    'POINTS_EARNED',
    userId,
    {
      points,
      reason,
      earnedAt: new Date().toISOString(),
      currentTotal: 1500 // example total points
    },
    journey
  ),

  /**
   * Reward distribution event
   * Triggered when rewards are distributed to users
   */
  rewardDistribution: (
    userId: string = TEST_USER_ID,
    rewardId: string = uuidv4(),
    rewardName: string = 'Special Reward',
    distributionReason: string = 'Special Event'
  ): MockEventBase => createMockEvent(
    'REWARD_DISTRIBUTION',
    userId,
    {
      rewardId,
      rewardName,
      distributedAt: new Date().toISOString(),
      reason: distributionReason,
      description: `You've received the ${rewardName} as part of ${distributionReason}!`,
      iconUrl: `https://assets.austa.com.br/rewards/special/${rewardId}.png`,
      expiresAt: new Date(Date.now() + 7776000000).toISOString() // 90 days from now
    }
  )
};

/**
 * Combined export of all common event mocks
 */
export const commonEventMocks = {
  userProfileEvents,
  achievementEvents,
  systemEvents,
  rewardEvents
};

export default commonEventMocks;