/**
 * @file Leaderboard test scenarios for the gamification system
 * @description Contains complex end-to-end test scenarios for testing leaderboard functionality in the gamification system.
 * Provides fixtures that simulate competitive user activities, leaderboard updates, and XP calculations.
 * These scenarios validate leaderboard sorting, ranking algorithms, journey-specific leaderboards, and time-period-specific boards.
 */

import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '@austa/interfaces';
import { 
  IGameProfile, 
  ILeaderboardEntry, 
  ILeaderboardData, 
  ILeaderboardTimePeriod 
} from '@austa/interfaces/gamification';
import { createGameProfile, getNextLevelXp } from '../profiles.fixtures';

/**
 * Generates a unique user ID for test scenarios
 * @returns A unique user ID string
 */
const generateUserId = (): string => `user-${uuidv4().slice(0, 8)}`;

/**
 * Creates a leaderboard entry for a user
 * @param userId User ID
 * @param rank User's position in the leaderboard
 * @param level User's current level
 * @param xp User's experience points
 * @param achievements Number of achievements the user has unlocked
 * @param options Additional options for the leaderboard entry
 * @returns A leaderboard entry object
 */
export const createLeaderboardEntry = (
  userId: string,
  rank: number,
  level: number,
  xp: number,
  achievements: number,
  options?: {
    displayName?: string;
    avatarUrl?: string;
  }
): ILeaderboardEntry => {
  return {
    userId,
    rank,
    level,
    xp,
    achievements,
    displayName: options?.displayName || `User ${rank}`,
    avatarUrl: options?.avatarUrl
  };
};

/**
 * Creates a time period for leaderboard data
 * @param type Type of time period
 * @param options Additional options for the time period
 * @returns A leaderboard time period object
 */
export const createLeaderboardTimePeriod = (
  type: 'daily' | 'weekly' | 'monthly' | 'all-time',
  options?: {
    startDate?: string;
    endDate?: string;
  }
): ILeaderboardTimePeriod => {
  const now = new Date();
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (!options?.startDate && !options?.endDate) {
    // Calculate default dates based on period type
    endDate = now.toISOString();
    
    switch (type) {
      case 'daily':
        const dailyStart = new Date(now);
        dailyStart.setHours(0, 0, 0, 0);
        startDate = dailyStart.toISOString();
        break;
      case 'weekly':
        const weeklyStart = new Date(now);
        weeklyStart.setDate(weeklyStart.getDate() - weeklyStart.getDay()); // Start of week (Sunday)
        weeklyStart.setHours(0, 0, 0, 0);
        startDate = weeklyStart.toISOString();
        break;
      case 'monthly':
        const monthlyStart = new Date(now);
        monthlyStart.setDate(1); // Start of month
        monthlyStart.setHours(0, 0, 0, 0);
        startDate = monthlyStart.toISOString();
        break;
      case 'all-time':
        // No start date for all-time
        startDate = undefined;
        break;
    }
  } else {
    startDate = options?.startDate;
    endDate = options?.endDate;
  }

  return {
    type,
    startDate,
    endDate
  };
};

/**
 * Creates a complete leaderboard data structure
 * @param entries Array of leaderboard entries
 * @param journey Journey type for this leaderboard
 * @param timePeriod Time period for this leaderboard
 * @param options Additional options for the leaderboard data
 * @returns A complete leaderboard data object
 */
export const createLeaderboardData = (
  entries: ILeaderboardEntry[],
  journey: JourneyType | 'global',
  timePeriod: ILeaderboardTimePeriod,
  options?: {
    totalUsers?: number;
    lastUpdated?: string;
    userPosition?: ILeaderboardEntry;
  }
): ILeaderboardData => {
  return {
    entries,
    totalUsers: options?.totalUsers || entries.length,
    journey: journey as JourneyType, // Cast to JourneyType for compatibility
    timePeriod,
    lastUpdated: options?.lastUpdated || new Date().toISOString(),
    userPosition: options?.userPosition
  };
};

/**
 * Creates a set of user profiles for leaderboard testing
 * @param count Number of profiles to create
 * @param options Options for customizing the profiles
 * @returns Array of game profiles
 */
export const createLeaderboardProfiles = (
  count: number,
  options?: {
    startLevel?: number;
    xpMultiplier?: number;
    journeyFocus?: JourneyType;
    includeDisplayNames?: boolean;
  }
): IGameProfile[] => {
  const startLevel = options?.startLevel || 1;
  const xpMultiplier = options?.xpMultiplier || 1;
  const journeyFocus = options?.journeyFocus;
  const includeDisplayNames = options?.includeDisplayNames || false;

  return Array.from({ length: count }, (_, index) => {
    const userId = generateUserId();
    const level = startLevel + Math.floor(Math.random() * 10);
    const baseXp = getNextLevelXp(level - 1) + Math.floor(Math.random() * getNextLevelXp(level));
    const xp = Math.floor(baseXp * xpMultiplier);
    
    // Create journey-specific metrics based on focus
    let healthMetrics = { xpEarned: Math.floor(xp * 0.33), achievements: Math.floor(level * 0.5), quests: Math.floor(level * 0.3) };
    let careMetrics = { xpEarned: Math.floor(xp * 0.33), achievements: Math.floor(level * 0.5), quests: Math.floor(level * 0.3) };
    let planMetrics = { xpEarned: Math.floor(xp * 0.33), achievements: Math.floor(level * 0.5), quests: Math.floor(level * 0.3) };
    
    // Adjust metrics based on journey focus
    if (journeyFocus) {
      const focusMultiplier = 2.0;
      const otherMultiplier = 0.5;
      
      if (journeyFocus === JourneyType.HEALTH) {
        healthMetrics = {
          xpEarned: Math.floor(xp * 0.6),
          achievements: Math.floor(level * focusMultiplier),
          quests: Math.floor(level * focusMultiplier)
        };
        careMetrics.xpEarned = Math.floor(xp * 0.2);
        careMetrics.achievements = Math.floor(level * otherMultiplier);
        careMetrics.quests = Math.floor(level * otherMultiplier);
        planMetrics.xpEarned = Math.floor(xp * 0.2);
        planMetrics.achievements = Math.floor(level * otherMultiplier);
        planMetrics.quests = Math.floor(level * otherMultiplier);
      } else if (journeyFocus === JourneyType.CARE) {
        careMetrics = {
          xpEarned: Math.floor(xp * 0.6),
          achievements: Math.floor(level * focusMultiplier),
          quests: Math.floor(level * focusMultiplier)
        };
        healthMetrics.xpEarned = Math.floor(xp * 0.2);
        healthMetrics.achievements = Math.floor(level * otherMultiplier);
        healthMetrics.quests = Math.floor(level * otherMultiplier);
        planMetrics.xpEarned = Math.floor(xp * 0.2);
        planMetrics.achievements = Math.floor(level * otherMultiplier);
        planMetrics.quests = Math.floor(level * otherMultiplier);
      } else if (journeyFocus === JourneyType.PLAN) {
        planMetrics = {
          xpEarned: Math.floor(xp * 0.6),
          achievements: Math.floor(level * focusMultiplier),
          quests: Math.floor(level * focusMultiplier)
        };
        healthMetrics.xpEarned = Math.floor(xp * 0.2);
        healthMetrics.achievements = Math.floor(level * otherMultiplier);
        healthMetrics.quests = Math.floor(level * otherMultiplier);
        careMetrics.xpEarned = Math.floor(xp * 0.2);
        careMetrics.achievements = Math.floor(level * otherMultiplier);
        careMetrics.quests = Math.floor(level * otherMultiplier);
      }
    }
    
    // Create profile with metrics
    return createGameProfile(
      userId,
      level,
      xp,
      {
        metrics: {
          totalAchievements: healthMetrics.achievements + careMetrics.achievements + planMetrics.achievements,
          totalQuests: healthMetrics.quests + careMetrics.quests + planMetrics.quests,
          totalRewards: Math.floor((healthMetrics.achievements + careMetrics.achievements + planMetrics.achievements) / 3),
          totalXpEarned: xp,
          currentStreak: Math.floor(Math.random() * 10),
          highestStreak: Math.floor(Math.random() * 20) + 10,
          firstActivityDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivityDate: new Date().toISOString(),
          journeyMetrics: {
            health: healthMetrics,
            care: careMetrics,
            plan: planMetrics
          }
        },
        // Add display name if requested
        ...(includeDisplayNames ? { displayName: `Test User ${index + 1}` } : {})
      }
    );
  });
};

/**
 * Converts game profiles to leaderboard entries
 * @param profiles Array of game profiles
 * @param journey Journey type to filter by (optional)
 * @returns Array of leaderboard entries sorted by XP
 */
export const profilesToLeaderboardEntries = (
  profiles: IGameProfile[],
  journey?: JourneyType
): ILeaderboardEntry[] => {
  // Sort profiles by XP (descending)
  const sortedProfiles = [...profiles].sort((a, b) => b.xp - a.xp);
  
  // Convert to leaderboard entries
  return sortedProfiles.map((profile, index) => {
    // Get journey-specific achievements count if journey is specified
    let achievements = profile.metrics?.totalAchievements || 0;
    if (journey && profile.metrics?.journeyMetrics) {
      const journeyMetrics = profile.metrics.journeyMetrics[journey.toLowerCase()];
      if (journeyMetrics) {
        achievements = journeyMetrics.achievements;
      }
    }
    
    return createLeaderboardEntry(
      profile.userId,
      index + 1, // Rank (1-based)
      profile.level,
      profile.xp,
      achievements,
      {
        displayName: profile.displayName || `User ${index + 1}`
      }
    );
  });
};

/**
 * Creates a global leaderboard scenario with multiple users
 * @param userCount Number of users in the leaderboard
 * @param timePeriodType Time period type for the leaderboard
 * @returns A test scenario with profiles and leaderboard data
 */
export const createGlobalLeaderboardScenario = (
  userCount: number = 10,
  timePeriodType: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
) => {
  // Create user profiles
  const profiles = createLeaderboardProfiles(userCount, { includeDisplayNames: true });
  
  // Convert to leaderboard entries
  const entries = profilesToLeaderboardEntries(profiles);
  
  // Create time period
  const timePeriod = createLeaderboardTimePeriod(timePeriodType);
  
  // Create leaderboard data
  const leaderboardData = createLeaderboardData(
    entries,
    'global',
    timePeriod,
    {
      totalUsers: userCount,
      lastUpdated: new Date().toISOString()
    }
  );
  
  return {
    profiles,
    entries,
    leaderboardData
  };
};

/**
 * Creates a journey-specific leaderboard scenario
 * @param journey Journey type for the leaderboard
 * @param userCount Number of users in the leaderboard
 * @param timePeriodType Time period type for the leaderboard
 * @returns A test scenario with profiles and leaderboard data
 */
export const createJourneyLeaderboardScenario = (
  journey: JourneyType,
  userCount: number = 10,
  timePeriodType: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
) => {
  // Create user profiles with focus on the specified journey
  const profiles = createLeaderboardProfiles(userCount, { 
    journeyFocus: journey,
    includeDisplayNames: true
  });
  
  // Convert to journey-specific leaderboard entries
  const entries = profilesToLeaderboardEntries(profiles, journey);
  
  // Create time period
  const timePeriod = createLeaderboardTimePeriod(timePeriodType);
  
  // Create leaderboard data
  const leaderboardData = createLeaderboardData(
    entries,
    journey,
    timePeriod,
    {
      totalUsers: userCount,
      lastUpdated: new Date().toISOString()
    }
  );
  
  return {
    profiles,
    entries,
    leaderboardData
  };
};

/**
 * Creates a leaderboard scenario with a specific user highlighted
 * @param userCount Number of users in the leaderboard
 * @param targetUserRank Rank of the user to highlight (1-based)
 * @param journey Journey type for the leaderboard (optional)
 * @returns A test scenario with profiles, leaderboard data, and highlighted user
 */
export const createUserFocusedLeaderboardScenario = (
  userCount: number = 20,
  targetUserRank: number = 10,
  journey?: JourneyType
) => {
  // Ensure target rank is valid
  if (targetUserRank < 1 || targetUserRank > userCount) {
    throw new Error(`Target rank (${targetUserRank}) must be between 1 and user count (${userCount})`);
  }
  
  // Create user profiles
  const profiles = createLeaderboardProfiles(userCount, { 
    journeyFocus: journey,
    includeDisplayNames: true
  });
  
  // Sort profiles by XP (descending) to establish ranks
  const sortedProfiles = [...profiles].sort((a, b) => b.xp - a.xp);
  
  // Get the target user profile
  const targetUserProfile = sortedProfiles[targetUserRank - 1];
  
  // Convert to leaderboard entries
  const entries = profilesToLeaderboardEntries(sortedProfiles, journey);
  
  // Get the target user's entry
  const targetUserEntry = entries[targetUserRank - 1];
  
  // Create time period (all-time for this scenario)
  const timePeriod = createLeaderboardTimePeriod('all-time');
  
  // Create leaderboard data with user position
  const leaderboardData = createLeaderboardData(
    entries,
    journey || 'global',
    timePeriod,
    {
      totalUsers: userCount,
      lastUpdated: new Date().toISOString(),
      userPosition: targetUserEntry
    }
  );
  
  // Create a subset of entries around the target user
  const above = 5;
  const below = 5;
  const startIndex = Math.max(0, targetUserRank - 1 - above);
  const endIndex = Math.min(userCount, targetUserRank - 1 + below + 1);
  const entriesAroundUser = entries.slice(startIndex, endIndex);
  
  // Create leaderboard data for entries around user
  const leaderboardAroundUserData = createLeaderboardData(
    entriesAroundUser,
    journey || 'global',
    timePeriod,
    {
      totalUsers: userCount,
      lastUpdated: new Date().toISOString(),
      userPosition: targetUserEntry
    }
  );
  
  return {
    profiles: sortedProfiles,
    entries,
    leaderboardData,
    targetUserProfile,
    targetUserEntry,
    entriesAroundUser,
    leaderboardAroundUserData
  };
};

/**
 * Creates a time-period specific leaderboard scenario
 * @param timePeriodType Time period type for the leaderboard
 * @param userCount Number of users in the leaderboard
 * @param journey Journey type for the leaderboard (optional)
 * @returns A test scenario with profiles and time-period specific leaderboard data
 */
export const createTimePeriodLeaderboardScenario = (
  timePeriodType: 'daily' | 'weekly' | 'monthly',
  userCount: number = 10,
  journey?: JourneyType
) => {
  // Create user profiles
  const profiles = createLeaderboardProfiles(userCount, { 
    journeyFocus: journey,
    includeDisplayNames: true
  });
  
  // Convert to leaderboard entries
  const entries = profilesToLeaderboardEntries(profiles, journey);
  
  // Create time period
  const timePeriod = createLeaderboardTimePeriod(timePeriodType);
  
  // Create leaderboard data
  const leaderboardData = createLeaderboardData(
    entries,
    journey || 'global',
    timePeriod,
    {
      totalUsers: userCount,
      lastUpdated: new Date().toISOString()
    }
  );
  
  return {
    profiles,
    entries,
    leaderboardData,
    timePeriod
  };
};

/**
 * Creates a Redis-compatible leaderboard scenario
 * @param userCount Number of users in the leaderboard
 * @param journey Journey type for the leaderboard (optional)
 * @returns A test scenario with profiles and Redis-compatible data
 */
export const createRedisLeaderboardScenario = (
  userCount: number = 10,
  journey?: JourneyType
) => {
  // Create user profiles
  const profiles = createLeaderboardProfiles(userCount, { 
    journeyFocus: journey,
    includeDisplayNames: true
  });
  
  // Create Redis key based on journey and time period
  const journeyKey = journey ? journey.toLowerCase() : 'global';
  const timePeriodKey = 'all-time';
  const redisKey = `leaderboard:${journeyKey}:${timePeriodKey}`;
  
  // Create Redis sorted set entries (userId -> score)
  const redisSortedSetEntries = profiles.map(profile => ({
    member: profile.userId,
    score: profile.xp
  }));
  
  // Create Redis hash entries for user data (userId -> userData)
  const redisHashEntries = profiles.map(profile => ({
    key: `user:${profile.userId}`,
    fields: {
      userId: profile.userId,
      level: profile.level.toString(),
      xp: profile.xp.toString(),
      achievements: profile.metrics?.totalAchievements?.toString() || '0',
      displayName: profile.displayName || `User ${profile.userId.slice(0, 8)}`,
      lastUpdated: new Date().toISOString()
    }
  }));
  
  // Convert to leaderboard entries for comparison
  const entries = profilesToLeaderboardEntries(profiles, journey);
  
  return {
    profiles,
    entries,
    redisKey,
    redisSortedSetEntries,
    redisHashEntries,
    // Helper function to convert Redis data back to leaderboard entries
    convertRedisToEntries: () => {
      return redisSortedSetEntries
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => {
          const userData = redisHashEntries.find(hash => hash.key === `user:${entry.member}`)?.fields;
          if (!userData) return null;
          
          return createLeaderboardEntry(
            userData.userId,
            index + 1,
            parseInt(userData.level, 10),
            parseInt(userData.xp, 10),
            parseInt(userData.achievements, 10),
            {
              displayName: userData.displayName
            }
          );
        })
        .filter(Boolean) as ILeaderboardEntry[];
    }
  };
};

/**
 * Creates a multi-journey leaderboard comparison scenario
 * @returns A test scenario with profiles and leaderboard data for all journeys
 */
export const createMultiJourneyLeaderboardScenario = () => {
  // Create user profiles for each journey
  const healthProfiles = createLeaderboardProfiles(10, { journeyFocus: JourneyType.HEALTH });
  const careProfiles = createLeaderboardProfiles(10, { journeyFocus: JourneyType.CARE });
  const planProfiles = createLeaderboardProfiles(10, { journeyFocus: JourneyType.PLAN });
  
  // Create some profiles that are active across multiple journeys
  const crossJourneyProfiles = createLeaderboardProfiles(5, { xpMultiplier: 1.5 });
  
  // Combine all profiles
  const allProfiles = [
    ...healthProfiles,
    ...careProfiles,
    ...planProfiles,
    ...crossJourneyProfiles
  ];
  
  // Create leaderboard entries for each journey
  const healthEntries = profilesToLeaderboardEntries([...healthProfiles, ...crossJourneyProfiles], JourneyType.HEALTH);
  const careEntries = profilesToLeaderboardEntries([...careProfiles, ...crossJourneyProfiles], JourneyType.CARE);
  const planEntries = profilesToLeaderboardEntries([...planProfiles, ...crossJourneyProfiles], JourneyType.PLAN);
  const globalEntries = profilesToLeaderboardEntries(allProfiles);
  
  // Create time period (all-time for this scenario)
  const timePeriod = createLeaderboardTimePeriod('all-time');
  
  // Create leaderboard data for each journey
  const healthLeaderboard = createLeaderboardData(
    healthEntries,
    JourneyType.HEALTH,
    timePeriod,
    { totalUsers: healthProfiles.length + crossJourneyProfiles.length }
  );
  
  const careLeaderboard = createLeaderboardData(
    careEntries,
    JourneyType.CARE,
    timePeriod,
    { totalUsers: careProfiles.length + crossJourneyProfiles.length }
  );
  
  const planLeaderboard = createLeaderboardData(
    planEntries,
    JourneyType.PLAN,
    timePeriod,
    { totalUsers: planProfiles.length + crossJourneyProfiles.length }
  );
  
  const globalLeaderboard = createLeaderboardData(
    globalEntries,
    'global',
    timePeriod,
    { totalUsers: allProfiles.length }
  );
  
  return {
    healthProfiles,
    careProfiles,
    planProfiles,
    crossJourneyProfiles,
    allProfiles,
    healthEntries,
    careEntries,
    planEntries,
    globalEntries,
    healthLeaderboard,
    careLeaderboard,
    planLeaderboard,
    globalLeaderboard
  };
};

/**
 * Creates a leaderboard update scenario that simulates changes over time
 * @param userCount Number of users in the leaderboard
 * @param updatesCount Number of updates to simulate
 * @returns A test scenario with profiles and multiple leaderboard snapshots
 */
export const createLeaderboardUpdateScenario = (
  userCount: number = 10,
  updatesCount: number = 3
) => {
  // Create initial user profiles
  const initialProfiles = createLeaderboardProfiles(userCount, { includeDisplayNames: true });
  
  // Create snapshots array to track changes
  const snapshots = [];
  
  // Add initial snapshot
  snapshots.push({
    profiles: [...initialProfiles],
    entries: profilesToLeaderboardEntries(initialProfiles),
    timestamp: new Date().toISOString()
  });
  
  // Create updated profiles for each update
  let currentProfiles = [...initialProfiles];
  
  for (let i = 0; i < updatesCount; i++) {
    // Update a random subset of profiles
    const updatedProfiles = currentProfiles.map(profile => {
      // 50% chance to update each profile
      if (Math.random() > 0.5) {
        // Add random XP (50-200)
        const xpGain = Math.floor(Math.random() * 150) + 50;
        const newXp = profile.xp + xpGain;
        
        // Check if level up is needed
        let newLevel = profile.level;
        while (newXp >= getNextLevelXp(newLevel)) {
          newLevel++;
        }
        
        // Update metrics
        const metrics = { ...profile.metrics };
        if (metrics) {
          metrics.totalXpEarned = (metrics.totalXpEarned || 0) + xpGain;
          
          // Randomly update journey metrics
          const journeyTypes = ['health', 'care', 'plan'] as const;
          const journeyToUpdate = journeyTypes[Math.floor(Math.random() * journeyTypes.length)];
          
          if (metrics.journeyMetrics && metrics.journeyMetrics[journeyToUpdate]) {
            metrics.journeyMetrics[journeyToUpdate].xpEarned += xpGain;
          }
        }
        
        return {
          ...profile,
          level: newLevel,
          xp: newXp,
          metrics,
          updatedAt: new Date().toISOString()
        };
      }
      return profile;
    });
    
    // Update current profiles
    currentProfiles = updatedProfiles;
    
    // Add snapshot
    snapshots.push({
      profiles: [...currentProfiles],
      entries: profilesToLeaderboardEntries(currentProfiles),
      timestamp: new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString() // 1 hour later for each update
    });
  }
  
  // Create time period (all-time for this scenario)
  const timePeriod = createLeaderboardTimePeriod('all-time');
  
  // Create leaderboard data for each snapshot
  const leaderboards = snapshots.map(snapshot => {
    return createLeaderboardData(
      snapshot.entries,
      'global',
      timePeriod,
      {
        totalUsers: userCount,
        lastUpdated: snapshot.timestamp
      }
    );
  });
  
  return {
    initialProfiles,
    finalProfiles: currentProfiles,
    snapshots,
    leaderboards
  };
};

/**
 * Export all leaderboard scenarios
 */
export const leaderboardScenarios = {
  createGlobalLeaderboardScenario,
  createJourneyLeaderboardScenario,
  createUserFocusedLeaderboardScenario,
  createTimePeriodLeaderboardScenario,
  createRedisLeaderboardScenario,
  createMultiJourneyLeaderboardScenario,
  createLeaderboardUpdateScenario
};

export default leaderboardScenarios;