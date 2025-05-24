/**
 * @file GamificationProvider.tsx
 * @description Platform-agnostic gamification provider that implements a centralized React context
 * for managing gamification features across web and mobile applications.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

// Import platform-specific adapters
import { GamificationAdapter } from '../adapters';
import { AuthAdapter } from '../adapters';

// Import interfaces
import { 
  GameProfile, 
  GamificationEvent, 
  GamificationEventType,
  EventProcessingResponse 
} from '@austa/interfaces/gamification';

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
  triggerGamificationEvent: (eventType: GamificationEventType, eventData?: any) => Promise<EventProcessingResponse | undefined>;
  
  /** Checks if a specific achievement is unlocked */
  hasAchievement: (achievementId: string) => boolean;
  
  /** Checks if a specific quest is completed */
  isQuestCompleted: (questId: string) => boolean;
  
  /** Returns the progress percentage for an achievement */
  getAchievementProgress: (achievementId: string) => number;
  
  /** Returns the progress percentage for a quest */
  getQuestProgress: (questId: string) => number;

  /** Refreshes the gamification profile data */
  refreshGameProfile: () => Promise<void>;
}

// Create the context with a default value of null
const GamificationContext = createContext<GamificationContextType | null>(null);

/**
 * Props for the GamificationProvider component
 */
interface GamificationProviderProps {
  /** Child components that will have access to the gamification context */
  children: ReactNode;
}

/**
 * Provider component for the Gamification context
 * Makes gamification data and functionality available throughout the application
 */
export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  // Get the user ID from the auth adapter
  const userId = AuthAdapter.getUserId();
  
  // State for the game profile
  const [gameProfile, setGameProfile] = useState<GameProfile | undefined>(undefined);
  
  // State for tracking loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State for tracking errors
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches the user's game profile from the API
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
      const profile = await GamificationAdapter.getGameProfile(userId);
      setGameProfile(profile);
      setError(null);
    } catch (err) {
      console.error('Error fetching game profile:', err);
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch game profile');
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refreshes the gamification profile data
   * This can be called after events to ensure the UI reflects the latest state
   */
  const refreshGameProfile = async (): Promise<void> => {
    await fetchGameProfile();
  };
  
  /**
   * Triggers a gamification event on the server
   * @param eventType - The type of event being triggered (e.g., "HEALTH_METRIC_RECORDED")
   * @param eventData - Additional data related to the event
   * @returns Promise that resolves with the event processing response
   */
  const triggerGamificationEvent = async (
    eventType: GamificationEventType, 
    eventData?: any
  ): Promise<EventProcessingResponse | undefined> => {
    // Ensure the user is authenticated
    if (!userId) {
      const authError = new Error('User must be authenticated to trigger gamification events');
      setError(authError);
      return Promise.reject(authError);
    }
    
    try {
      // Use the platform-specific adapter to trigger the event
      const response = await GamificationAdapter.triggerEvent({
        type: eventType,
        userId,
        timestamp: new Date().toISOString(),
        journey: getJourneyFromEventType(eventType),
        payload: eventData,
      });
      
      // Refresh the game profile to reflect any changes
      await refreshGameProfile();
      
      // Clear any previous errors
      setError(null);
      
      return response;
    } catch (err) {
      // Log and set the error
      console.error('Error triggering gamification event:', err);
      const eventError = err instanceof Error ? err : new Error('Failed to trigger gamification event');
      setError(eventError);
      return Promise.reject(eventError);
    }
  };
  
  /**
   * Determines the journey from the event type
   * @param eventType - The type of gamification event
   * @returns The journey associated with the event type
   */
  const getJourneyFromEventType = (eventType: GamificationEventType): 'health' | 'care' | 'plan' | 'system' => {
    if (eventType.startsWith('HEALTH_')) {
      return 'health';
    } else if (eventType.startsWith('APPOINTMENT_') || 
               eventType.startsWith('MEDICATION_') || 
               eventType.startsWith('TELEMEDICINE_') || 
               eventType === GamificationEventType.SYMPTOM_CHECKED || 
               eventType === GamificationEventType.PROVIDER_RATED) {
      return 'care';
    } else if (eventType.startsWith('PLAN_') || 
               eventType.startsWith('BENEFIT_') || 
               eventType.startsWith('CLAIM_') || 
               eventType === GamificationEventType.DOCUMENT_UPLOADED || 
               eventType === GamificationEventType.COVERAGE_CHECKED) {
      return 'plan';
    } else {
      return 'system';
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
    return quest ? quest.completed : false;
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
    
    // If the achievement has progress tracking
    if (typeof achievement.progress === 'number' && typeof achievement.total === 'number') {
      return Math.round((achievement.progress / achievement.total) * 100);
    }
    
    return 0;
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
    
    if (quest.completed) return 100;
    
    // If the quest has progress tracking
    if (typeof quest.progress === 'number' && typeof quest.total === 'number') {
      return Math.round((quest.progress / quest.total) * 100);
    }
    
    return 0;
  };
  
  // Fetch the game profile when the component mounts or when the user ID changes
  useEffect(() => {
    fetchGameProfile();
  }, [userId]);
  
  // Reset error when user ID changes
  useEffect(() => {
    setError(null);
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
 *   await triggerGamificationEvent(GamificationEventType.HEALTH_METRIC_RECORDED, { 
 *     metricType: 'bloodPressure',
 *     value: 120,
 *     unit: 'mmHg'
 *   });
 * };
 */
export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};