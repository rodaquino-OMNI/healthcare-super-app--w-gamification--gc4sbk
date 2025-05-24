/**
 * @file useGamification.ts
 * @description Unified hook for accessing gamification features across web and mobile platforms.
 * Provides a consistent interface for retrieving user game profiles, tracking achievements
 * and quests, triggering gamification events, and calculating progress.
 * 
 * This hook abstracts the complexity of gamification data fetching and manipulation,
 * offering a consistent interface regardless of platform (web or mobile).
 */

import { useCallback, useEffect, useState } from 'react';
import { isPlatformWeb } from '../utils/platform';
import { ALL_JOURNEYS } from '../constants/journeys';
import { useAuth } from './useAuth';

// Import platform-specific adapters
import { GamificationAdapter as WebGamificationAdapter } from '../adapters/web/GamificationAdapter';
import { GamificationAdapter as MobileGamificationAdapter } from '../adapters/mobile/GamificationAdapter';

// Import gamification interfaces
import {
  GameProfile,
  Achievement,
  Quest,
  Reward,
  GamificationEvent,
  GamificationEventType
} from '@austa/interfaces/gamification';

/**
 * Return type for the useGamification hook
 */
/**
 * Return type for the useGamification hook
 */
export interface UseGamificationReturn {
  /** The user's game profile containing level, XP, achievements, and quests */
  gameProfile: GameProfile | undefined;
  
  /** Indicates whether gamification data is currently loading */
  isLoading: boolean;
  
  /** Contains any error that occurred during gamification operations */
  error: Error | null;
  
  /** 
   * Triggers a gamification event (e.g., completing a task, reaching a milestone)
   * @param eventType - The type of event being triggered
   * @param eventData - Additional data related to the event
   * @returns Promise that resolves when the event is processed
   */
  triggerGamificationEvent: (eventType: GamificationEventType, eventData?: Record<string, any>) => Promise<void>;
  
  /**
   * Checks if a specific achievement is unlocked
   * @param achievementId - ID of the achievement to check
   * @returns boolean indicating if the achievement is unlocked
   */
  hasAchievement: (achievementId: string) => boolean;
  
  /**
   * Checks if a specific quest is completed
   * @param questId - ID of the quest to check
   * @returns boolean indicating if the quest is completed
   */
  isQuestCompleted: (questId: string) => boolean;
  
  /**
   * Returns the progress percentage for an achievement
   * @param achievementId - ID of the achievement
   * @returns number between 0-100 representing completion percentage
   */
  getAchievementProgress: (achievementId: string) => number;
  
  /**
   * Returns the progress percentage for a quest
   * @param questId - ID of the quest
   * @returns number between 0-100 representing completion percentage
   */
  getQuestProgress: (questId: string) => number;
  
  /**
   * Retrieves all achievements for the current user
   * @returns Array of achievements or undefined if not loaded
   */
  getAchievements: () => Achievement[] | undefined;
  
  /**
   * Retrieves all quests for the current user
   * @returns Array of quests or undefined if not loaded
   */
  getQuests: () => Quest[] | undefined;
  
  /**
   * Retrieves all rewards for the current user
   * @returns Array of rewards or undefined if not loaded
   */
  getRewards: () => Reward[] | undefined;
  
  /**
   * Refreshes gamification data from the server
   * @returns Promise that resolves when the refresh is complete
   */
  refreshGamificationData: () => Promise<void>;
}

/**
 * Hook for accessing and interacting with gamification features.
 * Provides a unified interface across web and mobile platforms.
 * 
 * @example
 * const { 
 *   gameProfile, 
 *   triggerGamificationEvent, 
 *   hasAchievement,
 *   getAchievementProgress 
 * } = useGamification();
 * 
 * // Display user level and XP
 * <Text>Level {gameProfile?.level}: {gameProfile?.xp} XP</Text>
 * 
 * // Trigger a gamification event when user completes a health check
 * const completeHealthCheck = async () => {
 *   await triggerGamificationEvent(GamificationEventType.HEALTH_METRIC_RECORDED, { 
 *     metricType: 'bloodPressure',
 *     value: 120,
 *     unit: 'mmHg'
 *   });
 * };
 * 
 * // Check if user has unlocked an achievement
 * if (hasAchievement('daily-streak-7')) {
 *   // Show achievement badge
 * }
 * 
 * // Display achievement progress
 * const progress = getAchievementProgress('steps-master');
 * <ProgressBar value={progress} />
 */
export function useGamification(): UseGamificationReturn {
  // Get the appropriate adapter based on platform
  const GamificationAdapter = isPlatformWeb() 
    ? WebGamificationAdapter 
    : MobileGamificationAdapter;
  
  // Get the user ID from the auth context
  const { userId } = useAuth();
  
  // State for game profile data
  const [gameProfile, setGameProfile] = useState<GameProfile | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Fetches the game profile from the server
   */
  const fetchGameProfile = useCallback(async () => {
    // Don't try to fetch if there's no user ID
    if (!userId) {
      setGameProfile(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get the game profile using the platform-specific adapter
      const profile = await GamificationAdapter.getGameProfile(userId);
      setGameProfile(profile);
      setError(null);
    } catch (err) {
      console.error('Error fetching game profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch game profile'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, GamificationAdapter]);
  
  /**
   * Refreshes gamification data from the server
   */
  const refreshGamificationData = useCallback(async () => {
    await fetchGameProfile();
  }, [fetchGameProfile]);
  
  /**
   * Triggers a gamification event on the server
   * @param eventType - The type of event being triggered
   * @param eventData - Additional data related to the event as a key-value record
   * @returns Promise that resolves when the event is processed
   */
  const triggerGamificationEvent = useCallback(async (
    eventType: GamificationEventType, 
    eventData?: Record<string, any>
  ): Promise<void> => {
    // Ensure the user is authenticated
    if (!userId) {
      const authError = new Error('User must be authenticated to trigger gamification events');
      setError(authError);
      return Promise.reject(authError);
    }
    
    try {
      // Create the event object
      const event: GamificationEvent = {
        type: eventType,
        userId,
        timestamp: new Date().toISOString(),
        journey: determineJourneyFromEventType(eventType),
        payload: eventData || {}
      } as GamificationEvent; // Type assertion needed due to complex union type
      
      // Trigger the event using the platform-specific adapter
      await GamificationAdapter.triggerEvent(event);
      
      // Refresh the game profile to get updated data
      await fetchGameProfile();
      
      // Clear any previous errors
      setError(null);
      
    } catch (err) {
      // Log and set the error
      console.error('Error triggering gamification event:', err);
      const eventError = err instanceof Error ? err : new Error('Failed to trigger gamification event');
      setError(eventError);
      return Promise.reject(eventError);
    }
  }, [userId, fetchGameProfile, GamificationAdapter]);
  
  /**
   * Checks if the user has unlocked a specific achievement
   * @param achievementId - ID of the achievement to check
   * @returns boolean indicating if the achievement is unlocked
   */
  const hasAchievement = useCallback((achievementId: string): boolean => {
    if (!gameProfile?.achievements) return false;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    return achievement ? achievement.unlocked : false;
  }, [gameProfile]);
  
  /**
   * Checks if the user has completed a specific quest
   * @param questId - ID of the quest to check
   * @returns boolean indicating if the quest is completed
   */
  const isQuestCompleted = useCallback((questId: string): boolean => {
    if (!gameProfile?.quests) return false;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    return quest ? quest.status === 'completed' : false;
  }, [gameProfile]);
  
  /**
   * Calculates the progress percentage for an achievement
   * @param achievementId - ID of the achievement
   * @returns number between 0-100 representing completion percentage
   */
  const getAchievementProgress = useCallback((achievementId: string): number => {
    if (!gameProfile?.achievements) return 0;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    
    if (achievement.unlocked) return 100;
    
    const { current, required } = achievement.progress;
    return Math.round((current / required) * 100);
  }, [gameProfile]);
  
  /**
   * Calculates the progress percentage for a quest
   * @param questId - ID of the quest
   * @returns number between 0-100 representing completion percentage
   */
  const getQuestProgress = useCallback((questId: string): number => {
    if (!gameProfile?.quests) return 0;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    if (!quest) return 0;
    
    if (quest.status === 'completed') return 100;
    
    return Math.round((quest.progress / quest.total) * 100);
  }, [gameProfile]);
  
  /**
   * Retrieves all achievements for the current user
   * @returns Array of achievements or undefined if not loaded
   */
  const getAchievements = useCallback((): Achievement[] | undefined => {
    return gameProfile?.achievements;
  }, [gameProfile]);
  
  /**
   * Retrieves all quests for the current user
   * @returns Array of quests or undefined if not loaded
   */
  const getQuests = useCallback((): Quest[] | undefined => {
    return gameProfile?.quests;
  }, [gameProfile]);
  
  /**
   * Retrieves all rewards for the current user
   * @returns Array of rewards or undefined if not loaded
   */
  const getRewards = useCallback((): Reward[] | undefined => {
    return gameProfile?.rewards;
  }, [gameProfile]);
  
  // Fetch the game profile when the user ID changes
  useEffect(() => {
    fetchGameProfile();
  }, [userId, fetchGameProfile]);
  
  // Return the hook interface
  return {
    gameProfile,
    isLoading,
    error,
    triggerGamificationEvent,
    hasAchievement,
    isQuestCompleted,
    getAchievementProgress,
    getQuestProgress,
    getAchievements,
    getQuests,
    getRewards,
    refreshGamificationData
  };
}

/**
 * Helper function to determine the journey from an event type
 * @param eventType - The type of gamification event
 * @returns The journey associated with the event type
 */
/**
 * Helper function to determine the journey from an event type
 * @param eventType - The type of gamification event
 * @returns The journey associated with the event type
 */
function determineJourneyFromEventType(eventType: GamificationEventType): 'health' | 'care' | 'plan' | 'system' {
  if (eventType.startsWith('HEALTH_')) {
    return 'health';
  } else if (eventType.startsWith('CARE_') || 
             eventType === GamificationEventType.APPOINTMENT_BOOKED || 
             eventType === GamificationEventType.APPOINTMENT_COMPLETED || 
             eventType === GamificationEventType.MEDICATION_ADDED || 
             eventType === GamificationEventType.MEDICATION_TAKEN || 
             eventType === GamificationEventType.TELEMEDICINE_SESSION_STARTED || 
             eventType === GamificationEventType.TELEMEDICINE_SESSION_COMPLETED || 
             eventType === GamificationEventType.SYMPTOM_CHECKED || 
             eventType === GamificationEventType.PROVIDER_RATED) {
    return 'care';
  } else if (eventType.startsWith('PLAN_') || 
             eventType === GamificationEventType.PLAN_VIEWED || 
             eventType === GamificationEventType.BENEFIT_EXPLORED || 
             eventType === GamificationEventType.CLAIM_SUBMITTED || 
             eventType === GamificationEventType.CLAIM_APPROVED || 
             eventType === GamificationEventType.DOCUMENT_UPLOADED || 
             eventType === GamificationEventType.COVERAGE_CHECKED) {
    return 'plan';
  } else {
    return 'system';
  }
}