/**
 * @file useCoverage.ts
 * @description Custom hook to fetch insurance coverage details for a given plan ID.
 * This hook addresses the Coverage Information requirement (F-103-RQ-001) by providing
 * a clean interface to access and display detailed insurance coverage information.
 * 
 * @todo Optimization: This hook currently fetches all plans for a user and then filters 
 * by planId. For better performance, consider implementing a dedicated API endpoint 
 * for fetching a single plan by ID directly.
 */

import { useQuery } from '@tanstack/react-query'; // v5.25.0
import { Plan, Coverage } from '@austa/interfaces/plan';
import { getPlans } from '@app/api/plan';
import { useJourneyContext } from '@austa/journey-context';
import { useEffect } from 'react';

/**
 * Custom hook to fetch and manage insurance coverage data for a specific plan.
 * 
 * @param planId - The ID of the plan for which to retrieve coverage details
 * @returns Object containing loading state, error, coverage data, and plan details
 */
export const useCoverage = (planId: string): {
  coverage: Coverage[];
  plan: Plan | undefined;
  isLoading: boolean;
  isPending: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<Plan | undefined>;
} => {
  // Get the journey context for journey-aware logging and state management
  const { auth, logger } = useJourneyContext();
  
  // Extract user ID from the auth context
  const userId = auth.user?.id;
  
  // Use React Query v5 to fetch and cache the plan data
  const { 
    data: plan,
    isPending,
    isFetching,
    isLoading,
    error, 
    refetch 
  } = useQuery({
    queryKey: ['plans', userId, planId],
    queryFn: async () => {
      // Ensure we have a user ID before making the request
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Fetch all plans for the user
      return getPlans(userId);
    },
    select: (plans) => plans.find(p => p.id === planId),
    // Configuration options
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
    retry: 3,                    // Retry failed requests up to 3 times
    enabled: !!userId && !!planId, // Only run query if we have userId and planId
  });
  
  // Implement journey-aware error logging
  useEffect(() => {
    if (error) {
      logger.error('Failed to fetch plan coverage data', {
        planId,
        userId,
        journey: 'plan',
        error: error.message,
      });
    }
  }, [error, logger, planId, userId]);
  
  // Extract coverage information from the plan, or empty array if plan is undefined
  const coverage = plan?.coverages || [];
  
  // Return all relevant data and states with improved typing
  return {
    coverage,   // The coverage details
    plan,       // The full plan object
    isLoading,  // Loading state (isPending && isFetching)
    isPending,  // Pending state (replaces old isLoading)
    isFetching, // Fetching state
    error: error as Error | null,      // Any error that occurred
    refetch: () => refetch() as Promise<Plan | undefined>     // Function to manually refetch the data
  };
};