/**
 * @file useClaims.ts
 * @description Custom React hook for fetching and managing claim data within the 'My Plan & Benefits' journey.
 * This hook encapsulates the logic for making API requests to retrieve claims and handles the loading and error states.
 */

import { useQuery } from 'react-query'; // v4.0+
import { Claim } from '@austa/interfaces/plan';
import { ApiError } from '@austa/interfaces/common/error';
import { useAuth } from './useAuth';
import { useJourneyContext } from '@austa/journey-context';
import { getClaims } from '@app/api/plan';

/**
 * Custom hook to fetch and manage claims data for a specific user.
 * 
 * @param planId - The ID of the plan for which to fetch claims
 * @returns An object containing the loading state, error, and claims data
 */
export function useClaims(planId: string) {
  // Get the authentication context to ensure the user is logged in
  const auth = useAuth();
  
  // Get the journey context for journey-specific state and error handling
  const { activeJourney, logError } = useJourneyContext();
  
  // Use react-query to fetch and cache the claims data
  const { 
    data, 
    isLoading,
    error,
    refetch 
  } = useQuery<Claim[], ApiError>({
    queryKey: ['claims', planId, activeJourney],
    queryFn: () => getClaims(planId),
    // Only fetch if we have a plan ID, user is authenticated, and we're in the plan journey
    enabled: !!planId && auth.isAuthenticated && activeJourney === 'plan',
    // Handle errors with journey-aware error logging
    onError: (error) => {
      logError({
        context: 'useClaims',
        message: `Error fetching claims for plan ${planId}`,
        error,
        journey: 'plan'
      });
    },
    // Cache configuration for optimal performance
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Unused data remains in cache for 30 minutes
  });
  
  return {
    claims: data || [],
    isLoading,
    error,
    refetch
  };
}