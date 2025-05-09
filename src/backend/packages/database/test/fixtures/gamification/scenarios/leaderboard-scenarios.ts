/**
 * @file leaderboard-scenarios.ts
 * @description Test scenarios for leaderboard functionality in the gamification system.
 * These fixtures simulate competitive user activities, leaderboard updates, and XP calculations.
 * The scenarios validate leaderboard sorting, ranking algorithms, journey-specific leaderboards,
 * and time-period-specific boards.
 * 
 * This file implements the following requirements from the technical specification:
 * - Set up leaderboard functionality with Redis Sorted Sets
 * - Implement journey-specific and global leaderboards
 * - Create time-period leaderboards (daily, weekly, monthly)
 * - Develop leaderboard visualization components
 * - Enhanced Redis Sorted Sets integration for improved leaderboard caching resilience
 */

import { JourneyType } from '@austa/interfaces/common';
import { GameProfile } from '@austa/interfaces/gamification/profiles';

/**
 * Interface for leaderboard entry
 * This matches the LeaderboardEntry interface in the gamification engine
 */
export interface LeaderboardEntry {
  /** User's rank in the leaderboard (1-based) */
  rank: number;
  /** User ID */
  userId: string;
  /** User's display name */
  username: string;
  /** URL to user's avatar image */
  avatarUrl?: string;
  /** User's current level */
  level: number;
  /** User's experience points */
  xp: number;
  /** Optional rank change indicator (positive = improved, negative = declined) */
  rankChange?: number;
}

/**
 * Interface for journey leaderboard
 * This matches the JourneyLeaderboard interface in the gamification engine
 */
export interface JourneyLeaderboard {
  /** Journey identifier */
  journey: string;
  /** Leaderboard entries */
  entries: LeaderboardEntry[];
  /** Total number of entries in the complete leaderboard */
  totalCount: number;
  /** When the leaderboard was last updated */
  updatedAt: Date;
  /** Optional error message if leaderboard retrieval failed */
  error?: string;
  /** Optional user ID that is the focus of this leaderboard view */
  focusedUserId?: string;
}

/**
 * Interface for leaderboard test scenario
 */
export interface LeaderboardScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** Human-readable name of the scenario */
  name: string;
  /** Description of what the scenario tests */
  description: string;
  /** Journey type this scenario applies to (or 'global' for cross-journey) */
  journey: JourneyType | 'global';
  /** Time period for the leaderboard (daily, weekly, monthly, all-time) */
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'all-time';
  /** User profiles with XP data for the scenario */
  profiles: GameProfile[];
  /** Expected ranking order (array of user IDs in rank order) */
  expectedRanking: string[];
  /** Optional metadata for the scenario */
  metadata?: Record<string, any>;
  /** Optional function to transform profiles before using them in tests */
  transformProfiles?: (profiles: GameProfile[]) => GameProfile[];
  /** Optional function to validate the leaderboard result */
  validateResult?: (result: JourneyLeaderboard) => boolean;
}

/**
 * Base user profiles for leaderboard testing
 * These profiles are used as a foundation for creating scenario-specific profiles
 */
export const baseUserProfiles: GameProfile[] = [
  {
    id: '1',
    userId: 'user-1',
    username: 'HealthEnthusiast',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-1.png',
    level: 5,
    xp: 2500,
    journeyStats: {
      health: { xp: 1500, level: 6, hasActivity: true },
      care: { xp: 500, level: 3, hasActivity: true },
      plan: { xp: 500, level: 3, hasActivity: true }
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15')
  },
  {
    id: '2',
    userId: 'user-2',
    username: 'CareProvider',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-2.png',
    level: 7,
    xp: 3800,
    journeyStats: {
      health: { xp: 800, level: 4, hasActivity: true },
      care: { xp: 2500, level: 8, hasActivity: true },
      plan: { xp: 500, level: 3, hasActivity: true }
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-06-20')
  },
  {
    id: '3',
    userId: 'user-3',
    username: 'PlanMaster',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-3.png',
    level: 6,
    xp: 3200,
    journeyStats: {
      health: { xp: 700, level: 3, hasActivity: true },
      care: { xp: 500, level: 3, hasActivity: true },
      plan: { xp: 2000, level: 7, hasActivity: true }
    },
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-06-25')
  },
  {
    id: '4',
    userId: 'user-4',
    username: 'AllRounder',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-4.png',
    level: 8,
    xp: 4500,
    journeyStats: {
      health: { xp: 1500, level: 6, hasActivity: true },
      care: { xp: 1500, level: 6, hasActivity: true },
      plan: { xp: 1500, level: 6, hasActivity: true }
    },
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-06-30')
  },
  {
    id: '5',
    userId: 'user-5',
    username: 'Newcomer',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-5.png',
    level: 2,
    xp: 800,
    journeyStats: {
      health: { xp: 300, level: 2, hasActivity: true },
      care: { xp: 300, level: 2, hasActivity: true },
      plan: { xp: 200, level: 1, hasActivity: true }
    },
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-06-10')
  },
  {
    id: '6',
    userId: 'user-6',
    username: 'HealthPro',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-6.png',
    level: 9,
    xp: 5200,
    journeyStats: {
      health: { xp: 3000, level: 10, hasActivity: true },
      care: { xp: 1200, level: 5, hasActivity: true },
      plan: { xp: 1000, level: 4, hasActivity: true }
    },
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-07-01')
  },
  {
    id: '7',
    userId: 'user-7',
    username: 'CareFocused',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-7.png',
    level: 8,
    xp: 4800,
    journeyStats: {
      health: { xp: 1000, level: 4, hasActivity: true },
      care: { xp: 3000, level: 10, hasActivity: true },
      plan: { xp: 800, level: 3, hasActivity: true }
    },
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-07-05')
  },
  {
    id: '8',
    userId: 'user-8',
    username: 'PlanExpert',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-8.png',
    level: 8,
    xp: 4600,
    journeyStats: {
      health: { xp: 800, level: 3, hasActivity: true },
      care: { xp: 800, level: 3, hasActivity: true },
      plan: { xp: 3000, level: 10, hasActivity: true }
    },
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-07-10')
  },
  {
    id: '9',
    userId: 'user-9',
    username: 'Balanced',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-9.png',
    level: 7,
    xp: 3600,
    journeyStats: {
      health: { xp: 1200, level: 5, hasActivity: true },
      care: { xp: 1200, level: 5, hasActivity: true },
      plan: { xp: 1200, level: 5, hasActivity: true }
    },
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-07-15')
  },
  {
    id: '10',
    userId: 'user-10',
    username: 'TopAchiever',
    avatarUrl: 'https://austa-assets.s3.amazonaws.com/avatars/avatar-10.png',
    level: 10,
    xp: 6000,
    journeyStats: {
      health: { xp: 2000, level: 7, hasActivity: true },
      care: { xp: 2000, level: 7, hasActivity: true },
      plan: { xp: 2000, level: 7, hasActivity: true }
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-07-20')
  }
];

/**
 * Global leaderboard scenario - tests overall ranking across all journeys
 */
export const globalLeaderboardScenario: LeaderboardScenario = {
  id: 'global-all-time',
  name: 'Global All-Time Leaderboard',
  description: 'Tests the global leaderboard ranking based on total XP across all journeys',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:global',
    ttl: 3600 // 1 hour cache
  }
};

/**
 * Health journey leaderboard scenario - tests ranking within the health journey
 */
export const healthLeaderboardScenario: LeaderboardScenario = {
  id: 'health-all-time',
  name: 'Health Journey All-Time Leaderboard',
  description: 'Tests the health journey leaderboard ranking based on health-specific XP',
  journey: 'health',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-6',  // 3000 XP
    'user-1',  // 1500 XP
    'user-4',  // 1500 XP
    'user-9',  // 1200 XP
    'user-7',  // 1000 XP
    'user-2',  // 800 XP
    'user-8',  // 800 XP
    'user-3',  // 700 XP
    'user-5'   // 300 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:health',
    ttl: 1800 // 30 minutes cache
  }
};

/**
 * Care journey leaderboard scenario - tests ranking within the care journey
 */
export const careLeaderboardScenario: LeaderboardScenario = {
  id: 'care-all-time',
  name: 'Care Journey All-Time Leaderboard',
  description: 'Tests the care journey leaderboard ranking based on care-specific XP',
  journey: 'care',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-7',  // 3000 XP
    'user-2',  // 2500 XP
    'user-10', // 2000 XP
    'user-4',  // 1500 XP
    'user-6',  // 1200 XP
    'user-9',  // 1200 XP
    'user-8',  // 800 XP
    'user-1',  // 500 XP
    'user-3',  // 500 XP
    'user-5'   // 300 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:care',
    ttl: 1800 // 30 minutes cache
  }
};

/**
 * Plan journey leaderboard scenario - tests ranking within the plan journey
 */
export const planLeaderboardScenario: LeaderboardScenario = {
  id: 'plan-all-time',
  name: 'Plan Journey All-Time Leaderboard',
  description: 'Tests the plan journey leaderboard ranking based on plan-specific XP',
  journey: 'plan',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-8',  // 3000 XP
    'user-10', // 2000 XP
    'user-3',  // 2000 XP
    'user-4',  // 1500 XP
    'user-9',  // 1200 XP
    'user-6',  // 1000 XP
    'user-7',  // 800 XP
    'user-2',  // 500 XP
    'user-1',  // 500 XP
    'user-5'   // 200 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:plan',
    ttl: 1800 // 30 minutes cache
  }
};

/**
 * Daily leaderboard scenario - tests ranking for a specific day
 */
export const dailyLeaderboardScenario: LeaderboardScenario = {
  id: 'global-daily',
  name: 'Global Daily Leaderboard',
  description: 'Tests the daily leaderboard ranking based on XP earned in a single day',
  journey: 'global',
  timePeriod: 'daily',
  // Create profiles with daily XP data
  profiles: baseUserProfiles.map(profile => ({
    ...profile,
    // Simulate daily XP (different from total XP)
    dailyXp: Math.floor(Math.random() * 500), // Random daily XP between 0-500
    // Override the total XP with daily XP for this scenario
    xp: Math.floor(Math.random() * 500)
  })),
  // Expected ranking will be determined at runtime based on the random daily XP
  expectedRanking: [], // Will be populated dynamically in tests
  metadata: {
    redisKey: 'gamification:leaderboard:daily:global:2023-07-20',
    ttl: 900, // 15 minutes cache
    date: '2023-07-20'
  }
};

/**
 * Weekly leaderboard scenario - tests ranking for a specific week
 */
export const weeklyLeaderboardScenario: LeaderboardScenario = {
  id: 'global-weekly',
  name: 'Global Weekly Leaderboard',
  description: 'Tests the weekly leaderboard ranking based on XP earned in a week',
  journey: 'global',
  timePeriod: 'weekly',
  // Create profiles with weekly XP data
  profiles: baseUserProfiles.map(profile => ({
    ...profile,
    // Simulate weekly XP (different from total XP)
    weeklyXp: Math.floor(Math.random() * 1000), // Random weekly XP between 0-1000
    // Override the total XP with weekly XP for this scenario
    xp: Math.floor(Math.random() * 1000)
  })),
  // Expected ranking will be determined at runtime based on the random weekly XP
  expectedRanking: [], // Will be populated dynamically in tests
  metadata: {
    redisKey: 'gamification:leaderboard:weekly:global:2023:29',
    ttl: 3600, // 1 hour cache
    weekNumber: 29,
    year: 2023
  }
};

/**
 * Monthly leaderboard scenario - tests ranking for a specific month
 */
export const monthlyLeaderboardScenario: LeaderboardScenario = {
  id: 'global-monthly',
  name: 'Global Monthly Leaderboard',
  description: 'Tests the monthly leaderboard ranking based on XP earned in a month',
  journey: 'global',
  timePeriod: 'monthly',
  // Create profiles with monthly XP data
  profiles: baseUserProfiles.map(profile => ({
    ...profile,
    // Simulate monthly XP (different from total XP)
    monthlyXp: Math.floor(Math.random() * 2000), // Random monthly XP between 0-2000
    // Override the total XP with monthly XP for this scenario
    xp: Math.floor(Math.random() * 2000)
  })),
  // Expected ranking will be determined at runtime based on the random monthly XP
  expectedRanking: [], // Will be populated dynamically in tests
  metadata: {
    redisKey: 'gamification:leaderboard:monthly:global:2023:7',
    ttl: 7200, // 2 hours cache
    month: 7,
    year: 2023
  }
};

/**
 * Scenario for testing Redis Sorted Sets integration
 * This scenario specifically tests the enhanced Redis Sorted Sets integration
 * for improved leaderboard caching resilience as specified in the technical requirements
 */
export const redisSortedSetScenario: LeaderboardScenario = {
  id: 'redis-sorted-set',
  name: 'Redis Sorted Set Integration',
  description: 'Tests the integration with Redis Sorted Sets for efficient leaderboard implementation with enhanced resilience',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:global',
    redisCommands: [
      'ZADD', // Add members to the sorted set
      'ZREVRANGE', // Get members in descending order
      'ZREVRANK', // Get rank of a member in descending order
      'ZSCORE', // Get score of a member
      'ZCARD', // Get number of members in the sorted set
      'ZCOUNT', // Count members within a score range
      'ZREVRANGEBYSCORE', // Get members within a score range in descending order
      'ZREVRANGEWITHSCORES', // Get members with scores in descending order
      'MULTI', // Start a transaction
      'EXEC', // Execute a transaction
      'DEL', // Delete a key
      'EXPIRE', // Set expiration time on a key
    ],
    batchSize: 50, // Process profiles in batches of 50
    circuitBreakerEnabled: true, // Use circuit breaker for Redis operations
    fallbackStrategy: 'in-memory-cache', // Use in-memory cache as fallback when Redis is unavailable
    resilience: {
      retryAttempts: 3, // Number of retry attempts for Redis operations
      retryDelay: 1000, // Delay between retries in milliseconds
      timeoutMs: 5000, // Timeout for Redis operations in milliseconds
      circuitBreakerFailureThreshold: 3, // Number of failures before circuit breaker opens
      circuitBreakerResetTimeout: 30000, // Time before circuit breaker resets in milliseconds
    }
  }
};

/**
 * Scenario for testing user rank changes over time
 */
export const rankChangeScenario: LeaderboardScenario = {
  id: 'rank-change',
  name: 'User Rank Changes',
  description: 'Tests tracking of user rank changes over time',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    // Previous ranking for comparison
    previousRanking: [
      'user-6',  // Was 1st, now 2nd (-1)
      'user-10', // Was 2nd, now 1st (+1)
      'user-4',  // Was 3rd, now 5th (-2)
      'user-7',  // Was 4th, now 3rd (+1)
      'user-8',  // Was 5th, now 4th (+1)
      'user-2',  // Was 6th, still 6th (0)
      'user-3',  // Was 7th, now 8th (-1)
      'user-9',  // Was 8th, now 7th (+1)
      'user-1',  // Was 9th, still 9th (0)
      'user-5'   // Was 10th, still 10th (0)
    ],
    // Expected rank changes (positive = improved, negative = declined)
    expectedRankChanges: {
      'user-10': 1,
      'user-6': -1,
      'user-7': 1,
      'user-8': 1,
      'user-4': -2,
      'user-2': 0,
      'user-9': 1,
      'user-3': -1,
      'user-1': 0,
      'user-5': 0
    }
  }
};

/**
 * Scenario for testing leaderboard with tied scores
 */
export const tiedScoreScenario: LeaderboardScenario = {
  id: 'tied-scores',
  name: 'Tied Scores Handling',
  description: 'Tests how the leaderboard handles users with identical XP scores',
  journey: 'global',
  timePeriod: 'all-time',
  // Create profiles with some tied scores
  profiles: [
    // Two users tied at 5000 XP
    {
      ...baseUserProfiles[0],
      xp: 5000,
      username: 'TiedUser1'
    },
    {
      ...baseUserProfiles[1],
      xp: 5000,
      username: 'TiedUser2'
    },
    // Three users tied at 3000 XP
    {
      ...baseUserProfiles[2],
      xp: 3000,
      username: 'TiedUser3'
    },
    {
      ...baseUserProfiles[3],
      xp: 3000,
      username: 'TiedUser4'
    },
    {
      ...baseUserProfiles[4],
      xp: 3000,
      username: 'TiedUser5'
    },
    // Unique scores
    {
      ...baseUserProfiles[5],
      xp: 4000,
      username: 'UniqueUser1'
    },
    {
      ...baseUserProfiles[6],
      xp: 2000,
      username: 'UniqueUser2'
    },
    {
      ...baseUserProfiles[7],
      xp: 1000,
      username: 'UniqueUser3'
    }
  ],
  // Expected ranking will have tied users, but the exact order of tied users may vary
  expectedRanking: [
    // Tied at 5000 XP (ranks 1-2)
    'user-1', // TiedUser1
    'user-2', // TiedUser2
    // Unique at 4000 XP (rank 3)
    'user-6', // UniqueUser1
    // Tied at 3000 XP (ranks 4-6)
    'user-3', // TiedUser3
    'user-4', // TiedUser4
    'user-5', // TiedUser5
    // Unique at 2000 XP (rank 7)
    'user-7', // UniqueUser2
    // Unique at 1000 XP (rank 8)
    'user-8'  // UniqueUser3
  ],
  metadata: {
    tieBreaker: 'creation-date', // In case of ties, earlier created profiles rank higher
    redisKey: 'gamification:leaderboard:global:tied'
  }
};

/**
 * Scenario for testing leaderboard pagination
 */
export const paginationScenario: LeaderboardScenario = {
  id: 'pagination',
  name: 'Leaderboard Pagination',
  description: 'Tests retrieving paginated results from the leaderboard',
  journey: 'global',
  timePeriod: 'all-time',
  // Create a larger set of profiles for pagination testing
  profiles: Array(50).fill(null).map((_, index) => ({
    ...baseUserProfiles[index % 10], // Reuse base profiles
    id: `${index + 1}`,
    userId: `user-${index + 1}`,
    username: `User${index + 1}`,
    xp: 10000 - (index * 200) // Descending XP values for clear ranking
  })),
  // Expected ranking will be in descending XP order
  expectedRanking: Array(50).fill(null).map((_, index) => `user-${index + 1}`),
  metadata: {
    pageSize: 10, // Number of items per page
    totalPages: 5, // Total number of pages
    redisKey: 'gamification:leaderboard:global:paginated'
  }
};

/**
 * Scenario for testing user's position in the leaderboard
 */
export const userPositionScenario: LeaderboardScenario = {
  id: 'user-position',
  name: 'User Position in Leaderboard',
  description: 'Tests retrieving a specific user\'s position in the leaderboard with surrounding users',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    targetUserId: 'user-3', // User whose position we want to find
    expectedRank: 8, // Expected rank of the target user
    surroundingUsers: 2, // Number of users to retrieve before and after the target user
    expectedWindow: ['user-9', 'user-3', 'user-1'], // Expected users in the window
    redisKey: 'gamification:leaderboard:global'
  }
};

/**
 * Scenario for testing real-time leaderboard updates
 */
export const realTimeUpdateScenario: LeaderboardScenario = {
  id: 'real-time-update',
  name: 'Real-Time Leaderboard Updates',
  description: 'Tests updating the leaderboard in real-time when user XP changes',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    // XP updates to apply
    xpUpdates: [
      { userId: 'user-5', xp: 5500 }, // Newcomer gets a big boost
      { userId: 'user-1', xp: 3000 }, // Small increase
      { userId: 'user-10', xp: 6200 } // Small increase for the leader
    ],
    // Expected ranking after updates
    expectedRankingAfterUpdates: [
      'user-10', // 6200 XP (was 6000)
      'user-5',  // 5500 XP (was 800) - big jump from 10th to 2nd
      'user-6',  // 5200 XP
      'user-7',  // 4800 XP
      'user-8',  // 4600 XP
      'user-4',  // 4500 XP
      'user-2',  // 3800 XP
      'user-9',  // 3600 XP
      'user-3',  // 3200 XP
      'user-1'   // 3000 XP (was 2500)
    ],
    redisKey: 'gamification:leaderboard:global',
    redisCommands: ['ZADD', 'ZREVRANGE']
  }
};

/**
 * Scenario for testing journey-specific daily leaderboards
 */
export const journeyDailyLeaderboardScenario: LeaderboardScenario = {
  id: 'health-daily',
  name: 'Health Journey Daily Leaderboard',
  description: 'Tests the daily leaderboard for the health journey',
  journey: 'health',
  timePeriod: 'daily',
  // Create profiles with daily health journey XP data
  profiles: baseUserProfiles.map(profile => ({
    ...profile,
    // Simulate daily health XP
    journeyStats: {
      ...profile.journeyStats,
      health: {
        ...profile.journeyStats.health,
        dailyXp: Math.floor(Math.random() * 300) // Random daily health XP
      }
    },
    // For this scenario, we'll use the daily health XP as the sorting criteria
    xp: Math.floor(Math.random() * 300)
  })),
  // Expected ranking will be determined at runtime based on the random daily XP
  expectedRanking: [], // Will be populated dynamically in tests
  metadata: {
    redisKey: 'gamification:leaderboard:daily:health:2023-07-20',
    ttl: 900, // 15 minutes cache
    date: '2023-07-20'
  }
};

/**
 * Scenario for testing Redis resilience with circuit breaker
 */
export const redisResilienceScenario: LeaderboardScenario = {
  id: 'redis-resilience',
  name: 'Redis Resilience with Circuit Breaker',
  description: 'Tests the resilience of leaderboard functionality when Redis is temporarily unavailable',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:global',
    simulateRedisFailure: true,
    circuitBreakerEnabled: true,
    fallbackStrategy: 'in-memory-cache',
    expectedFallbackBehavior: {
      shouldUseInMemoryCache: true,
      shouldReturnErrorFlag: true,
      errorMessage: 'Using cached data. Real-time updates may not be reflected.'
    },
    resilience: {
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutMs: 5000,
      circuitBreakerFailureThreshold: 3,
      circuitBreakerResetTimeout: 30000,
    }
  },
  // Validate that the result contains the expected error message
  validateResult: (result: JourneyLeaderboard): boolean => {
    return !!result.error && result.error.includes('cached data');
  }
};

/**
 * Scenario for testing batch updates to leaderboards
 */
export const batchUpdateScenario: LeaderboardScenario = {
  id: 'batch-update',
  name: 'Batch Leaderboard Updates',
  description: 'Tests updating multiple user scores in the leaderboard in a batch operation',
  journey: 'global',
  timePeriod: 'all-time',
  profiles: baseUserProfiles,
  expectedRanking: [
    'user-10', // 6000 XP
    'user-6',  // 5200 XP
    'user-7',  // 4800 XP
    'user-8',  // 4600 XP
    'user-4',  // 4500 XP
    'user-2',  // 3800 XP
    'user-9',  // 3600 XP
    'user-3',  // 3200 XP
    'user-1',  // 2500 XP
    'user-5'   // 800 XP
  ],
  metadata: {
    redisKey: 'gamification:leaderboard:global',
    batchUpdates: [
      { userId: 'user-1', journey: 'health', xp: 2000 },
      { userId: 'user-2', journey: 'care', xp: 3000 },
      { userId: 'user-3', journey: 'plan', xp: 2500 },
      { userId: 'user-5', journey: 'global', xp: 3500 }
    ],
    expectedRankingAfterUpdates: [
      'user-10', // 6000 XP
      'user-6',  // 5200 XP
      'user-7',  // 4800 XP
      'user-8',  // 4600 XP
      'user-4',  // 4500 XP
      'user-5',  // 3500 XP (was 800) - big jump
      'user-2',  // 3800 XP
      'user-9',  // 3600 XP
      'user-3',  // 3200 XP
      'user-1'   // 2500 XP
    ],
    redisCommands: ['MULTI', 'ZADD', 'EXEC']
  }
};

/**
 * Export all scenarios as a collection
 */
export const leaderboardScenarios: LeaderboardScenario[] = [
  globalLeaderboardScenario,
  healthLeaderboardScenario,
  careLeaderboardScenario,
  planLeaderboardScenario,
  dailyLeaderboardScenario,
  weeklyLeaderboardScenario,
  monthlyLeaderboardScenario,
  redisSortedSetScenario,
  rankChangeScenario,
  tiedScoreScenario,
  paginationScenario,
  userPositionScenario,
  realTimeUpdateScenario,
  journeyDailyLeaderboardScenario,
  redisResilienceScenario,
  batchUpdateScenario
];

/**
 * Helper function to get a scenario by ID
 * @param id Scenario ID
 * @returns The matching scenario or undefined if not found
 */
export function getScenarioById(id: string): LeaderboardScenario | undefined {
  return leaderboardScenarios.find(scenario => scenario.id === id);
}

/**
 * Helper function to get scenarios by journey
 * @param journey Journey type
 * @returns Array of scenarios for the specified journey
 */
export function getScenariosByJourney(journey: JourneyType | 'global'): LeaderboardScenario[] {
  return leaderboardScenarios.filter(scenario => scenario.journey === journey);
}

/**
 * Helper function to get scenarios by time period
 * @param timePeriod Time period
 * @returns Array of scenarios for the specified time period
 */
export function getScenariosByTimePeriod(
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'all-time'
): LeaderboardScenario[] {
  return leaderboardScenarios.filter(scenario => scenario.timePeriod === timePeriod);
}

/**
 * Helper function to generate Redis key for a leaderboard scenario
 * @param scenario Leaderboard scenario
 * @param date Optional date for time-based leaderboards
 * @returns Redis key for the scenario
 */
export function generateRedisKeyForScenario(
  scenario: LeaderboardScenario,
  date?: Date
): string {
  const { journey, timePeriod } = scenario;
  const prefix = 'gamification:leaderboard';
  
  if (timePeriod === 'all-time') {
    return journey === 'global' ? `${prefix}:global` : `${prefix}:${journey}`;
  }
  
  if (timePeriod === 'daily') {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `${prefix}:daily:${journey}:${dateStr}`;
  }
  
  if (timePeriod === 'weekly') {
    const now = date || new Date();
    const year = now.getFullYear();
    // Calculate week number (1-53)
    const weekNumber = Math.ceil((((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
    return `${prefix}:weekly:${journey}:${year}:${weekNumber}`;
  }
  
  if (timePeriod === 'monthly') {
    const now = date || new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    return `${prefix}:monthly:${journey}:${year}:${month}`;
  }
  
  // Fallback
  return `${prefix}:${journey}`;
}

/**
 * Helper function to simulate Redis Sorted Set operations for testing
 * @param profiles User profiles to add to the sorted set
 * @param command Redis command to simulate
 * @param args Command arguments
 * @returns Simulated command result
 */
export function simulateRedisSortedSetOperation(
  profiles: GameProfile[],
  command: string,
  ...args: any[]
): any {
  // Create a sorted set from profiles
  const sortedSet = new Map<string, number>();
  profiles.forEach(profile => {
    sortedSet.set(profile.userId, profile.xp);
  });
  
  // Simulate Redis commands
  switch (command.toUpperCase()) {
    case 'ZADD':
      // args: key, score, member, [score, member, ...]
      // We'll ignore the key for this simulation
      for (let i = 1; i < args.length; i += 2) {
        const score = args[i];
        const member = args[i + 1];
        sortedSet.set(member, score);
      }
      return sortedSet.size;
      
    case 'ZREVRANGE':
      // args: key, start, stop
      // We'll ignore the key for this simulation
      const start = args[1] || 0;
      const stop = args[2] || -1;
      
      // Sort by score (descending)
      const sorted = Array.from(sortedSet.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      // Handle negative indices and slicing
      const actualStop = stop < 0 ? sorted.length + stop + 1 : stop + 1;
      return sorted.slice(start, actualStop);
      
    case 'ZREVRANK':
      // args: key, member
      // We'll ignore the key for this simulation
      const member = args[1];
      
      // Sort by score (descending)
      const sortedForRank = Array.from(sortedSet.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      const rank = sortedForRank.indexOf(member);
      return rank >= 0 ? rank : null;
      
    case 'ZSCORE':
      // args: key, member
      // We'll ignore the key for this simulation
      return sortedSet.get(args[1]) || null;
      
    case 'ZCARD':
      // args: key
      // We'll ignore the key for this simulation
      return sortedSet.size;
      
    default:
      throw new Error(`Unsupported Redis command: ${command}`);
  }
}