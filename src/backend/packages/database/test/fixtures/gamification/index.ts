/**
 * @file Gamification Test Fixtures
 * 
 * This barrel file exports all gamification test fixtures for easy importing in test files.
 * It provides centralized access to achievement, reward, event, quest, profile, and rule fixtures,
 * simplifying test setup and promoting code reuse across the gamification engine test suite.
 */

// Import interfaces from the interfaces package
import {
  Achievement,
  UserAchievement,
  Reward,
  UserReward,
  Quest,
  UserQuest,
  GameProfile,
  GamificationEvent,
  Rule,
  LeaderboardEntry
} from '@austa/interfaces/gamification';

// Import fixtures from individual files
import * as achievementFixtures from './achievements.fixtures';
import * as rewardFixtures from './rewards.fixtures';
import * as eventFixtures from './events.fixtures';
import * as questFixtures from './quests.fixtures';
import * as profileFixtures from './profiles.fixtures';
import * as ruleFixtures from './rules.fixtures';

/**
 * Re-export all fixtures from individual files
 */
export { achievementFixtures, rewardFixtures, eventFixtures, questFixtures, profileFixtures, ruleFixtures };

/**
 * Namespace for achievement-related test fixtures
 */
export namespace achievements {
  export const { 
    mockAchievement,
    mockAchievementType,
    mockUserAchievement,
    mockAchievementProgress,
    createMockAchievement,
    createMockUserAchievement,
    healthJourneyAchievements,
    careJourneyAchievements,
    planJourneyAchievements,
    crossJourneyAchievements
  } = achievementFixtures;

  /**
   * Creates a complete set of achievements for testing all journeys
   * @returns An array of achievements covering all journeys
   */
  export function createFullAchievementSet(): Achievement[] {
    return [
      ...healthJourneyAchievements,
      ...careJourneyAchievements,
      ...planJourneyAchievements,
      ...crossJourneyAchievements
    ];
  }

  /**
   * Creates a set of user achievements with different progress states
   * @param userId The user ID to associate with the achievements
   * @returns An array of user achievements with varying progress
   */
  export function createUserAchievementSet(userId: string): UserAchievement[] {
    return [
      createMockUserAchievement({ userId, progress: 100, isCompleted: true }),
      createMockUserAchievement({ userId, progress: 50, isCompleted: false }),
      createMockUserAchievement({ userId, progress: 0, isCompleted: false }),
    ];
  }
}

/**
 * Namespace for reward-related test fixtures
 */
export namespace rewards {
  export const {
    mockReward,
    mockUserReward,
    createMockReward,
    createMockUserReward,
    healthJourneyRewards,
    careJourneyRewards,
    planJourneyRewards,
    crossJourneyRewards
  } = rewardFixtures;

  /**
   * Creates a complete set of rewards for testing all journeys
   * @returns An array of rewards covering all journeys
   */
  export function createFullRewardSet(): Reward[] {
    return [
      ...healthJourneyRewards,
      ...careJourneyRewards,
      ...planJourneyRewards,
      ...crossJourneyRewards
    ];
  }

  /**
   * Creates a set of user rewards with different redemption states
   * @param userId The user ID to associate with the rewards
   * @returns An array of user rewards with varying redemption states
   */
  export function createUserRewardSet(userId: string): UserReward[] {
    return [
      createMockUserReward({ userId, isRedeemed: true, redeemedAt: new Date() }),
      createMockUserReward({ userId, isRedeemed: false }),
      createMockUserReward({ userId, isRedeemed: false }),
    ];
  }
}

/**
 * Namespace for event-related test fixtures
 */
export namespace events {
  export const {
    mockEvent,
    createMockEvent,
    healthJourneyEvents,
    careJourneyEvents,
    planJourneyEvents,
    invalidEvents,
    mockEventBatch
  } = eventFixtures;

  /**
   * Creates a complete set of events for testing all journeys
   * @param userId The user ID to associate with the events
   * @returns An array of events covering all journeys
   */
  export function createFullEventSet(userId: string): GamificationEvent[] {
    return [
      ...healthJourneyEvents.map(event => ({ ...event, userId })),
      ...careJourneyEvents.map(event => ({ ...event, userId })),
      ...planJourneyEvents.map(event => ({ ...event, userId }))
    ];
  }

  /**
   * Creates a batch of events for stress testing the event processing pipeline
   * @param userId The user ID to associate with the events
   * @param count The number of events to create
   * @returns An array of events for stress testing
   */
  export function createEventBatch(userId: string, count: number): GamificationEvent[] {
    return Array.from({ length: count }, (_, i) => 
      createMockEvent({
        userId,
        eventType: i % 3 === 0 ? 'HEALTH_METRIC_RECORDED' : 
                  i % 3 === 1 ? 'APPOINTMENT_COMPLETED' : 'CLAIM_SUBMITTED',
        timestamp: new Date(Date.now() - i * 60000) // Events spaced 1 minute apart
      })
    );
  }
}

/**
 * Namespace for quest-related test fixtures
 */
export namespace quests {
  export const {
    mockQuest,
    mockUserQuest,
    createMockQuest,
    createMockUserQuest,
    dailyQuests,
    weeklyQuests,
    healthJourneyQuests,
    careJourneyQuests,
    planJourneyQuests,
    crossJourneyQuests
  } = questFixtures;

  /**
   * Creates a complete set of quests for testing all journeys
   * @returns An array of quests covering all journeys and frequencies
   */
  export function createFullQuestSet(): Quest[] {
    return [
      ...dailyQuests,
      ...weeklyQuests,
      ...healthJourneyQuests,
      ...careJourneyQuests,
      ...planJourneyQuests,
      ...crossJourneyQuests
    ];
  }

  /**
   * Creates a set of user quests with different progress states
   * @param userId The user ID to associate with the quests
   * @returns An array of user quests with varying progress
   */
  export function createUserQuestSet(userId: string): UserQuest[] {
    return [
      createMockUserQuest({ userId, progress: 100, isCompleted: true }),
      createMockUserQuest({ userId, progress: 50, isCompleted: false }),
      createMockUserQuest({ userId, progress: 0, isCompleted: false }),
    ];
  }
}

/**
 * Namespace for profile-related test fixtures
 */
export namespace profiles {
  export const {
    mockGameProfile,
    createMockGameProfile,
    newUserProfile,
    activeUserProfile,
    advancedUserProfile
  } = profileFixtures;

  /**
   * Creates a set of game profiles at different progression levels
   * @returns An array of game profiles with varying progression
   */
  export function createProfileProgressionSet(): GameProfile[] {
    return [
      newUserProfile,      // Level 1, minimal XP
      activeUserProfile,   // Mid-level, some achievements
      advancedUserProfile  // High level, many achievements
    ];
  }

  /**
   * Creates a leaderboard from the provided game profiles
   * @param profiles The game profiles to include in the leaderboard
   * @returns An array of leaderboard entries
   */
  export function createLeaderboardFromProfiles(profiles: GameProfile[]): LeaderboardEntry[] {
    return profiles.map((profile, index) => ({
      userId: profile.userId,
      username: `user${index}`,
      rank: index + 1,
      score: profile.totalXp,
      level: profile.level,
      avatarUrl: `https://example.com/avatar/${index}.png`
    }));
  }
}

/**
 * Namespace for rule-related test fixtures
 */
export namespace rules {
  export const {
    mockRule,
    createMockRule,
    healthJourneyRules,
    careJourneyRules,
    planJourneyRules,
    crossJourneyRules,
    complexConditionRules
  } = ruleFixtures;

  /**
   * Creates a complete set of rules for testing all journeys
   * @returns An array of rules covering all journeys
   */
  export function createFullRuleSet(): Rule[] {
    return [
      ...healthJourneyRules,
      ...careJourneyRules,
      ...planJourneyRules,
      ...crossJourneyRules,
      ...complexConditionRules
    ];
  }

  /**
   * Creates a rule that triggers based on a sequence of events
   * @param eventTypes The sequence of event types that must occur in order
   * @returns A rule that triggers on the specified event sequence
   */
  export function createSequenceRule(eventTypes: string[]): Rule {
    return createMockRule({
      name: `sequence-rule-${eventTypes.join('-')}`,
      description: `Rule that triggers on a sequence of events: ${eventTypes.join(', ')}`,
      conditions: eventTypes.map((type, index) => ({
        eventType: type,
        requiredCount: 1,
        timeframe: 86400, // 24 hours in seconds
        order: index + 1
      })),
      actions: [
        {
          type: 'AWARD_ACHIEVEMENT',
          params: { achievementId: 'sequence-achievement' }
        },
        {
          type: 'AWARD_XP',
          params: { amount: 100 }
        }
      ]
    });
  }
}

/**
 * Convenience methods for common test scenarios
 */
export const scenarios = {
  /**
   * Creates a complete test environment with all fixture types
   * @param userId The user ID to associate with the fixtures
   * @returns An object containing all fixture types for comprehensive testing
   */
  createFullTestEnvironment(userId: string) {
    return {
      achievements: achievements.createFullAchievementSet(),
      userAchievements: achievements.createUserAchievementSet(userId),
      rewards: rewards.createFullRewardSet(),
      userRewards: rewards.createUserRewardSet(userId),
      events: events.createFullEventSet(userId),
      quests: quests.createFullQuestSet(),
      userQuests: quests.createUserQuestSet(userId),
      profile: profiles.createMockGameProfile({ userId }),
      rules: rules.createFullRuleSet(),
    };
  },

  /**
   * Creates a minimal test environment with essential fixtures
   * @param userId The user ID to associate with the fixtures
   * @returns An object containing essential fixtures for basic testing
   */
  createMinimalTestEnvironment(userId: string) {
    return {
      achievements: [achievements.mockAchievement],
      userAchievements: [achievements.createMockUserAchievement({ userId })],
      rewards: [rewards.mockReward],
      userRewards: [rewards.createMockUserReward({ userId })],
      events: [events.createMockEvent({ userId })],
      quests: [quests.mockQuest],
      userQuests: [quests.createMockUserQuest({ userId })],
      profile: profiles.createMockGameProfile({ userId }),
      rules: [rules.mockRule],
    };
  },

  /**
   * Creates a journey-specific test environment
   * @param userId The user ID to associate with the fixtures
   * @param journey The journey to create fixtures for ('health', 'care', or 'plan')
   * @returns An object containing journey-specific fixtures
   */
  createJourneyTestEnvironment(userId: string, journey: 'health' | 'care' | 'plan') {
    const journeyAchievements = 
      journey === 'health' ? achievements.healthJourneyAchievements :
      journey === 'care' ? achievements.careJourneyAchievements :
      achievements.planJourneyAchievements;

    const journeyRewards = 
      journey === 'health' ? rewards.healthJourneyRewards :
      journey === 'care' ? rewards.careJourneyRewards :
      rewards.planJourneyRewards;

    const journeyEvents = 
      journey === 'health' ? events.healthJourneyEvents :
      journey === 'care' ? events.careJourneyEvents :
      events.planJourneyEvents;

    const journeyQuests = 
      journey === 'health' ? quests.healthJourneyQuests :
      journey === 'care' ? quests.careJourneyQuests :
      quests.planJourneyQuests;

    const journeyRules = 
      journey === 'health' ? rules.healthJourneyRules :
      journey === 'care' ? rules.careJourneyRules :
      rules.planJourneyRules;

    return {
      achievements: journeyAchievements,
      userAchievements: journeyAchievements.map(achievement => 
        achievements.createMockUserAchievement({ 
          userId, 
          achievementId: achievement.id 
        })
      ),
      rewards: journeyRewards,
      userRewards: journeyRewards.map(reward => 
        rewards.createMockUserReward({ 
          userId, 
          rewardId: reward.id 
        })
      ),
      events: journeyEvents.map(event => ({ ...event, userId })),
      quests: journeyQuests,
      userQuests: journeyQuests.map(quest => 
        quests.createMockUserQuest({ 
          userId, 
          questId: quest.id 
        })
      ),
      profile: profiles.createMockGameProfile({ 
        userId,
        journeyProgress: { [journey]: { level: 5, xp: 2500 } }
      }),
      rules: journeyRules,
    };
  }
};