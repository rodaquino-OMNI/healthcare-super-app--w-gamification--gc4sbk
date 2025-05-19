/**
 * @file GamificationProvider.tsx
 * @description Platform-agnostic gamification provider that implements a centralized React context
 * for managing gamification features across web and mobile applications.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

// Import interfaces from the interfaces package
import { 
  GameProfile, 
  Achievement, 
  Quest,
  GamificationEventType,
  BaseGamificationEvent,
  EventResponse,
  JourneyType
} from '@austa/interfaces/gamification';

// Import hooks and utilities
import { useAuth } from '../hooks/useAuth';
import { detectPlatform } from '../utils/platformDetection';

// Import platform-specific adapters (will be dynamically loaded)
import { getAdapter } from '../adapters';

/**
 * Interface defining the shape of the Gamification Context
 * Provides access to gamification data and functionality
 */
interface GamificationContextType {
  /** The user's gamification profile containing level, XP, achievements, and quests */
  gameProfile: GameProfile | undefined;
  
  /** Indicates whether gamification data is currently loading */
  isLoading: boolean;
  
  /** Contains any error that occurred during gamification operations */
  error: Error | null;
  
  /** Triggers a gamification event (e.g., completing a task, reaching a milestone) */
  triggerGamificationEvent: (eventType: GamificationEventType, journey: JourneyType, eventData?: any) => Promise<EventResponse | undefined>;
  
  /** Checks if a specific achievement is unlocked */
  hasAchievement: (achievementId: string) => boolean;
  
  /** Checks if a specific quest is completed */
  isQuestCompleted: (questId: string) => boolean;
  
  /** Returns the progress percentage for an achievement */
  getAchievementProgress: (achievementId: string) => number;
  
  /** Returns the progress percentage for a quest */
  getQuestProgress: (questId: string) => number;
  
  /** Refreshes the game profile data */
  refreshGameProfile: () => Promise<void>;
  
  /** Resets any error state */
  resetError: () => void;
}

// Create the context with a default value of null
const GamificationContext = createContext<GamificationContextType | null>(null);

/**
 * Props for the GamificationProvider component
 */
interface GamificationProviderProps {
  /** Child components that will have access to the gamification context */
  children: ReactNode;
  
  /** Optional initial game profile for testing or SSR */
  initialGameProfile?: GameProfile;
}

/**
 * Provider component for the Gamification context
 * Makes gamification data and functionality available throughout the application
 */
export const GamificationProvider: React.FC<GamificationProviderProps> = ({ 
  children,
  initialGameProfile
}) => {
  // Get the user ID from the auth context
  const { userId } = useAuth();
  
  // State for the game profile
  const [gameProfile, setGameProfile] = useState<GameProfile | undefined>(initialGameProfile);
  
  // State for tracking loading state
  const [isLoading, setIsLoading] = useState<boolean>(!initialGameProfile);
  
  // State for tracking errors
  const [error, setError] = useState<Error | null>(null);
  
  // Determine the current platform
  const platform = detectPlatform();
  
  // Get the platform-specific gamification adapter
  const gamificationAdapter = useMemo(() => getAdapter('gamification', platform), [platform]);
  
  /**
   * Fetches the user's game profile from the appropriate platform-specific API
   */
  const fetchGameProfile = async (): Promise<void> => {
    // Don't try to fetch if there's no user ID
    if (!userId) {
      setGameProfile(undefined);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the platform-specific adapter to fetch the profile
      const profile = await gamificationAdapter.getGameProfile(userId);
      setGameProfile(profile);
      setError(null);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch game profile');
      console.error('Error fetching game profile:', fetchError);
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Refreshes the game profile data
   * Can be called manually to update the profile after events
   */
  const refreshGameProfile = async (): Promise<void> => {
    await fetchGameProfile();
  };
  
  /**
   * Resets any error state
   */
  const resetError = (): void => {
    setError(null);
  };
  
  /**
   * Triggers a gamification event on the server
   * @param eventType - The type of event being triggered (e.g., "COMPLETE_HEALTH_CHECK")
   * @param journey - The journey context for the event (HEALTH, CARE, PLAN, SYSTEM)
   * @param eventData - Additional data related to the event
   * @returns Promise that resolves with the event response when the event is processed
   */
  const triggerGamificationEvent = async (
    eventType: GamificationEventType, 
    journey: JourneyType, 
    eventData?: any
  ): Promise<EventResponse | undefined> => {
    // Ensure the user is authenticated
    if (!userId) {
      const authError = new Error('User must be authenticated to trigger gamification events');
      setError(authError);
      return Promise.reject(authError);
    }
    
    try {
      // Create the event object
      const event: BaseGamificationEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        journey,
        userId,
        timestamp: new Date().toISOString(),
        payload: eventData || {}
      };
      
      // Use the platform-specific adapter to trigger the event
      const response = await gamificationAdapter.triggerEvent(event);
      
      // Clear any previous errors
      setError(null);
      
      // Refresh the game profile to reflect any changes
      await refreshGameProfile();
      
      return response;
      
    } catch (err) {
      // Log and set the error
      console.error('Error triggering gamification event:', err);
      const eventError = err instanceof Error ? err : new Error('Failed to trigger gamification event');
      setError(eventError);
      
      // Implement retry logic for failed events
      try {
        // Wait a short time and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await gamificationAdapter.retryEvent(eventType, journey, userId, eventData);
      } catch (retryErr) {
        // If retry fails, queue the event for later processing
        await gamificationAdapter.queueEventForSync(eventType, journey, userId, eventData);
        return undefined;
      }
    }
  };
  
  /**
   * Checks if the user has unlocked a specific achievement
   * @param achievementId - ID of the achievement to check
   * @returns boolean indicating if the achievement is unlocked
   */
  const hasAchievement = (achievementId: string): boolean => {
    if (!gameProfile?.achievements) return false;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    return achievement ? achievement.unlocked : false;
  };
  
  /**
   * Checks if the user has completed a specific quest
   * @param questId - ID of the quest to check
   * @returns boolean indicating if the quest is completed
   */
  const isQuestCompleted = (questId: string): boolean => {
    if (!gameProfile?.quests) return false;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    return quest ? quest.status === 'completed' : false;
  };
  
  /**
   * Calculates the progress percentage for an achievement
   * @param achievementId - ID of the achievement
   * @returns number between 0-100 representing completion percentage
   */
  const getAchievementProgress = (achievementId: string): number => {
    if (!gameProfile?.achievements) return 0;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    
    if (achievement.unlocked) return 100;
    return achievement.progress.percentage;
  };
  
  /**
   * Calculates the progress percentage for a quest
   * @param questId - ID of the quest
   * @returns number between 0-100 representing completion percentage
   */
  const getQuestProgress = (questId: string): number => {
    if (!gameProfile?.quests) return 0;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    if (!quest) return 0;
    
    if (quest.status === 'completed') return 100;
    return Math.round((quest.progress / quest.total) * 100);
  };
  
  // Fetch the game profile when the user ID changes
  useEffect(() => {
    fetchGameProfile();
  }, [userId]);
  
  // Create the context value
  const value = useMemo(() => ({
    gameProfile,
    isLoading,
    error,
    triggerGamificationEvent,
    hasAchievement,
    isQuestCompleted,
    getAchievementProgress,
    getQuestProgress,
    refreshGameProfile,
    resetError,
  }), [gameProfile, isLoading, error, userId]);
  
  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

/**
 * Hook to use the gamification context
 * Provides access to gamification data and functionality
 * 
 * @example
 * const { gameProfile, triggerGamificationEvent } = useGamification();
 * 
 * // Display user level and XP
 * <Text>Level {gameProfile?.level}: {gameProfile?.xp} XP</Text>
 * 
 * // Trigger a gamification event when user completes a health check
 * const completeHealthCheck = async () => {
 *   await triggerGamificationEvent(
 *     GamificationEventType.HEALTH_METRIC_RECORDED,
 *     JourneyType.HEALTH,
 *     { metricType: 'bloodPressure', value: 120, unit: 'mmHg' }
 *   );
 * };
 */
export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};