/**
 * @file useGamification.ts
 * @description A unified hook for accessing gamification features across web and mobile platforms.
 * Provides a consistent interface for retrieving user game profiles, tracking achievements and quests,
 * triggering gamification events, and calculating progress.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Platform } from 'react-native';

// Import types from the interfaces package
import {
  Achievement,
  GameProfile,
  Quest,
  Reward,
  GamificationEventType,
  JourneyType,
  BaseGamificationEvent,
  EventResponse
} from '@austa/interfaces/gamification';

// Import platform-specific auth hooks
import { useAuth as useWebAuth } from '../../adapters/web/useAuth';
import { useAuth as useMobileAuth } from '../../adapters/mobile/useAuth';

// GraphQL queries
const GET_GAME_PROFILE = gql`
  query GetGameProfile($userId: ID!) {
    gameProfile(userId: $userId) {
      level
      xp
      xpToNextLevel
      achievements {
        id
        title
        description
        journey
        category
        icon
        progress {
          current
          target
          percentage
        }
        unlocked
        unlockedAt
        xpReward
      }
      quests {
        id
        title
        description
        journey
        category
        icon
        progress
        total
        status
        deadline
        xpReward
      }
      badges {
        id
        name
        description
        journey
        icon
        earnedAt
        isDisplayed
        rarity
      }
      streaks {
        type
        current
        best
        lastUpdated
        expiresAt
      }
      statistics {
        achievementsUnlocked
        questsCompleted
        totalXpEarned
        loginStreak
      }
      lastUpdated
    }
  }
`;

const GET_ACHIEVEMENTS = gql`
  query GetAchievements($userId: ID!) {
    achievements(userId: $userId) {
      id
      title
      description
      journey
      category
      icon
      progress {
        current
        target
        percentage
      }
      unlocked
      unlockedAt
      xpReward
    }
  }
`;

const GET_QUESTS = gql`
  query GetQuests($userId: ID!) {
    quests(userId: $userId) {
      id
      title
      description
      journey
      category
      icon
      progress
      total
      status
      deadline
      xpReward
    }
  }
`;

const GET_REWARDS = gql`
  query GetRewards($userId: ID!) {
    rewards(userId: $userId) {
      id
      title
      description
      journey
      icon
      xp
      category
      status
      availableFrom
      availableUntil
    }
  }
`;

/**
 * Configuration options for the useGamification hook
 */
export interface UseGamificationOptions {
  /** Whether to skip the initial query */
  skip?: boolean;
  /** Fetch policy for the query */
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-and-network' | 'no-cache' | 'standby';
  /** Callback for when the query errors */
  onError?: (error: Error) => void;
}

/**
 * Return type for the useGamification hook
 */
export interface UseGamificationResult {
  /** The user's game profile containing level, XP, achievements, and quests */
  gameProfile: GameProfile | undefined;
  /** Whether the game profile is currently loading */
  isLoading: boolean;
  /** Any error that occurred while loading the game profile */
  error: Error | null;
  /** Achievements earned by the user */
  achievements: Achievement[] | undefined;
  /** Quests available to the user */
  quests: Quest[] | undefined;
  /** Rewards available to the user */
  rewards: Reward[] | undefined;
  /** Checks if a specific achievement is unlocked */
  hasAchievement: (achievementId: string) => boolean;
  /** Checks if a specific quest is completed */
  isQuestCompleted: (questId: string) => boolean;
  /** Returns the progress percentage for an achievement */
  getAchievementProgress: (achievementId: string) => number;
  /** Returns the progress percentage for a quest */
  getQuestProgress: (questId: string) => number;
  /** Triggers a gamification event */
  triggerGamificationEvent: (
    eventType: GamificationEventType,
    journey: JourneyType,
    eventData?: Record<string, any>
  ) => Promise<EventResponse>;
  /** Refetches the game profile data */
  refetch: () => Promise<void>;
}

/**
 * A unified hook for accessing gamification features across web and mobile platforms.
 * Provides a consistent interface for retrieving user game profiles, tracking achievements and quests,
 * triggering gamification events, and calculating progress.
 * 
 * @param options Configuration options for the hook
 * @returns Object containing gamification data and utility functions
 * 
 * @example
 * // Basic usage
 * const { gameProfile, isLoading, error } = useGamification();
 * 
 * // Display user level and XP
 * return (
 *   <View>
 *     {isLoading ? (
 *       <LoadingIndicator />
 *     ) : error ? (
 *       <ErrorMessage error={error} />
 *     ) : (
 *       <Text>Level {gameProfile?.level}: {gameProfile?.xp} XP</Text>
 *     )}
 *   </View>
 * );
 * 
 * @example
 * // Checking achievement status
 * const { hasAchievement, getAchievementProgress } = useGamification();
 * 
 * const isHealthyEaterUnlocked = hasAchievement('healthy-eater-2023');
 * const healthyEaterProgress = getAchievementProgress('healthy-eater-2023');
 * 
 * @example
 * // Triggering a gamification event
 * const { triggerGamificationEvent } = useGamification();
 * 
 * const completeHealthCheck = async () => {
 *   try {
 *     const result = await triggerGamificationEvent(
 *       GamificationEventType.HEALTH_METRIC_RECORDED,
 *       JourneyType.HEALTH,
 *       { metricType: 'blood_pressure', value: 120, unit: 'mmHg' }
 *     );
 *     
 *     if (result.unlockedAchievements?.length) {
 *       // Show achievement notification
 *     }
 *   } catch (error) {
 *     console.error('Failed to record health metric:', error);
 *   }
 * };
 */
export function useGamification(options: UseGamificationOptions = {}): UseGamificationResult {
  // Determine which auth hook to use based on platform
  const useAuth = Platform.OS === 'web' ? useWebAuth : useMobileAuth;
  const { userId } = useAuth();
  
  // State for tracking errors
  const [error, setError] = useState<Error | null>(null);
  
  // Default options
  const {
    skip = !userId,
    fetchPolicy = 'cache-and-network',
    onError = (err: Error) => console.error('Error in useGamification:', err)
  } = options;
  
  // Query for game profile
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery(GET_GAME_PROFILE, {
    variables: { userId },
    skip,
    fetchPolicy,
    onError: (err) => {
      const error = new Error(`Failed to fetch game profile: ${err.message}`);
      setError(error);
      onError(error);
    }
  });
  
  // Query for achievements (separate query for more granular updates)
  const {
    data: achievementsData,
    loading: achievementsLoading,
    refetch: refetchAchievements
  } = useQuery(GET_ACHIEVEMENTS, {
    variables: { userId },
    skip,
    fetchPolicy,
    onError: (err) => {
      const error = new Error(`Failed to fetch achievements: ${err.message}`);
      setError(error);
      onError(error);
    }
  });
  
  // Query for quests (separate query for more granular updates)
  const {
    data: questsData,
    loading: questsLoading,
    refetch: refetchQuests
  } = useQuery(GET_QUESTS, {
    variables: { userId },
    skip,
    fetchPolicy,
    onError: (err) => {
      const error = new Error(`Failed to fetch quests: ${err.message}`);
      setError(error);
      onError(error);
    }
  });
  
  // Query for rewards (separate query for more granular updates)
  const {
    data: rewardsData,
    loading: rewardsLoading,
    refetch: refetchRewards
  } = useQuery(GET_REWARDS, {
    variables: { userId },
    skip,
    fetchPolicy,
    onError: (err) => {
      const error = new Error(`Failed to fetch rewards: ${err.message}`);
      setError(error);
      onError(error);
    }
  });
  
  // Extract data from queries
  const gameProfile = profileData?.gameProfile;
  const achievements = achievementsData?.achievements || gameProfile?.achievements;
  const quests = questsData?.quests || gameProfile?.quests;
  const rewards = rewardsData?.rewards;
  
  // Determine loading state
  const isLoading = profileLoading || achievementsLoading || questsLoading || rewardsLoading;
  
  // Reset error when userId changes
  useEffect(() => {
    setError(null);
  }, [userId]);
  
  /**
   * Checks if a specific achievement is unlocked
   * @param achievementId ID of the achievement to check
   * @returns boolean indicating if the achievement is unlocked
   */
  const hasAchievement = useCallback((achievementId: string): boolean => {
    if (!achievements) return false;
    
    const achievement = achievements.find(a => a.id === achievementId);
    return achievement ? achievement.unlocked : false;
  }, [achievements]);
  
  /**
   * Checks if a specific quest is completed
   * @param questId ID of the quest to check
   * @returns boolean indicating if the quest is completed
   */
  const isQuestCompleted = useCallback((questId: string): boolean => {
    if (!quests) return false;
    
    const quest = quests.find(q => q.id === questId);
    return quest ? quest.status === 'COMPLETED' : false;
  }, [quests]);
  
  /**
   * Calculates the progress percentage for an achievement
   * @param achievementId ID of the achievement
   * @returns number between 0-100 representing completion percentage
   */
  const getAchievementProgress = useCallback((achievementId: string): number => {
    if (!achievements) return 0;
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    
    if (achievement.unlocked) return 100;
    return achievement.progress?.percentage || 0;
  }, [achievements]);
  
  /**
   * Calculates the progress percentage for a quest
   * @param questId ID of the quest
   * @returns number between 0-100 representing completion percentage
   */
  const getQuestProgress = useCallback((questId: string): number => {
    if (!quests) return 0;
    
    const quest = quests.find(q => q.id === questId);
    if (!quest) return 0;
    
    if (quest.status === 'COMPLETED') return 100;
    return Math.round((quest.progress / quest.total) * 100);
  }, [quests]);
  
  /**
   * Triggers a gamification event on the server
   * @param eventType The type of event being triggered
   * @param journey The journey context for the event
   * @param eventData Additional data related to the event
   * @returns Promise that resolves with the event response when the event is processed
   */
  const triggerGamificationEvent = useCallback(async (
    eventType: GamificationEventType,
    journey: JourneyType,
    eventData?: Record<string, any>
  ): Promise<EventResponse> => {
    // Ensure the user is authenticated
    if (!userId) {
      const authError = new Error('User must be authenticated to trigger gamification events');
      setError(authError);
      onError(authError);
      return Promise.reject(authError);
    }
    
    try {
      // Create the event object
      const event: Partial<BaseGamificationEvent> = {
        type: eventType,
        journey,
        userId,
        timestamp: new Date().toISOString(),
        payload: eventData || {}
      };
      
      // Make an API call to trigger the event
      const response = await fetch('/api/gamification/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(`Failed to trigger gamification event: ${response.statusText}`);
      }
      
      // Parse the response
      const result: EventResponse = await response.json();
      
      // Refetch data if achievements or quests were affected
      if (
        result.unlockedAchievements?.length ||
        result.questProgress?.some(q => q.completed) ||
        result.leveledUp
      ) {
        await refetch();
      }
      
      // Clear any previous errors
      setError(null);
      
      return result;
    } catch (err) {
      // Log and set the error
      const eventError = err instanceof Error ? err : new Error('Failed to trigger gamification event');
      setError(eventError);
      onError(eventError);
      return Promise.reject(eventError);
    }
  }, [userId, onError]);
  
  /**
   * Refetches all gamification data
   */
  const refetch = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        refetchProfile(),
        refetchAchievements(),
        refetchQuests(),
        refetchRewards()
      ]);
      setError(null);
    } catch (err) {
      const refetchError = err instanceof Error ? err : new Error('Failed to refetch gamification data');
      setError(refetchError);
      onError(refetchError);
    }
  }, [refetchProfile, refetchAchievements, refetchQuests, refetchRewards, onError]);
  
  // Return the hook result
  return {
    gameProfile,
    isLoading,
    error: error || (profileError ? new Error(profileError.message) : null),
    achievements,
    quests,
    rewards,
    hasAchievement,
    isQuestCompleted,
    getAchievementProgress,
    getQuestProgress,
    triggerGamificationEvent,
    refetch
  };
}

export default useGamification;