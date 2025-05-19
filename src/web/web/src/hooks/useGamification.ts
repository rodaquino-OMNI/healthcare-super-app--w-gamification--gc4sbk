import { useQuery } from '@apollo/client'; // v3.7.17
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { GetGameProfileResponse, GET_GAME_PROFILE } from '@app/shared/graphql/queries/gamification.queries';
import { JOURNEY_IDS } from '@austa/journey-context/src/constants';
import { formatJourneyValue } from '@app/shared/utils';
import { logger } from '@app/shared/utils/logger';

/**
 * React hook for accessing and managing the user's game profile data.
 * Provides access to gamification data including level, XP, achievements, and quests
 * from the gamification engine.
 * 
 * @param userId The ID of the user whose game profile should be fetched
 * @returns Object containing the game profile data, loading state, and error information
 */
export const useGamification = (userId: string) => {
  return useQuery<GetGameProfileResponse>(
    GET_GAME_PROFILE,
    {
      variables: { userId },
      skip: !userId, // Skip query execution if userId is falsy
      fetchPolicy: 'cache-and-network', // First return cached data, then fetch from network
      nextFetchPolicy: 'cache-first', // For subsequent executions, check cache first
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      onError: (error) => {
        logger.error('Error fetching game profile', {
          userId,
          error: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          context: 'useGamification'
        });
      }
    }
  );
};

/**
 * @deprecated Use useGamification instead
 */
export const useGameProfile = useGamification;