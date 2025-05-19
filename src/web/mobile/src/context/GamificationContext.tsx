import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameProfile, JourneyType } from '@austa/interfaces/gamification';
import { useAuth } from '@austa/journey-context/providers/AuthProvider';
import { useJourney } from '@austa/journey-context/providers/JourneyProvider';
import { GamificationError } from '@austa/interfaces/gamification/events';

/**
 * Interface that defines the shape of the gamification context value
 */
interface GamificationContextType {
  /** The user's game profile data */
  gameProfile: GameProfile | undefined;
  /** Indicates whether the game profile is currently loading */
  isLoading: boolean;
  /** Any error that occurred while loading the game profile */
  error: GamificationError | null;
  /** Refetch the game profile data */
  refetchProfile: () => Promise<void>;
}

/**
 * Context object for the gamification system
 * Provides access to the user's game profile, achievements, quests, and rewards
 */
const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

/**
 * Provider component that manages gamification state and methods
 * Makes the gamification context available to all child components
 */
const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get the user ID from the authentication context
  const { userId } = useAuth();
  
  // Get the current journey from the journey context
  const { currentJourney } = useJourney();
  
  // Create a query key that includes both userId and journey
  // This ensures proper caching per user and journey combination
  const queryKey = ['gameProfile', userId, currentJourney?.id];
  
  // Use React Query to fetch and cache the game profile
  const {
    data: gameProfile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Don't try to fetch if there's no user ID or journey
      if (!userId || !currentJourney) {
        throw new Error('Cannot fetch game profile without user ID or journey');
      }
      
      try {
        // Import dynamically to avoid circular dependencies
        const { getGameProfile } = await import('../api/gamification');
        
        // Get the game profile from the API with journey context
        // Note: The API might need to be updated to accept journeyType parameter
        // For backward compatibility, we'll check if the function accepts 2 parameters
        if (getGameProfile.length >= 2) {
          return await getGameProfile(userId, currentJourney.id as JourneyType);
        } else {
          // Fallback to the original implementation if the API hasn't been updated yet
          const profile = await getGameProfile(userId);
          // Filter profile data based on journey if needed
          return profile;
        }
      } catch (err) {
        // Standardized error handling
        console.error(`Error fetching game profile for journey ${currentJourney.id}:`, err);
        throw new GamificationError(
          'profile_fetch_failed',
          `Failed to fetch gamification profile for journey ${currentJourney.id}`,
          err instanceof Error ? err.message : String(err)
        );
      }
    },
    enabled: !!userId && !!currentJourney,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    retry: 2, // Retry failed requests twice
    onError: (err) => {
      console.error('Gamification profile fetch error:', err);
    }
  });
  
  // Refetch profile wrapper function
  const refetchProfile = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      console.error('Error refetching game profile:', err);
    }
  }, [refetch]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useCallback(() => {
    return {
      gameProfile,
      isLoading,
      error: error as GamificationError | null,
      refetchProfile
    };
  }, [gameProfile, isLoading, error, refetchProfile]);

  return (
    <GamificationContext.Provider value={contextValue()}>
      {children}
    </GamificationContext.Provider>
  );
};

/**
 * Custom hook that provides access to the gamification context
 * @returns The gamification context object containing user state and gamification methods
 * @throws Error if used outside of GamificationProvider
 */
const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export { GamificationContext, GamificationProvider, useGamification };