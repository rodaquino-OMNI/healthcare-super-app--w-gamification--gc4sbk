import { useQuery } from '@tanstack/react-query';
import { Coverage } from '@austa/interfaces/plan/coverage.types';
import { useAuth } from 'src/web/web/src/context/AuthContext';
import { apiConfig } from 'src/web/shared/config/apiConfig';
import { ApiError } from '@austa/interfaces/api/error.types';

/**
 * A React hook that fetches insurance coverage data for a given plan ID.
 * This hook implements the Display detailed insurance coverage information requirement
 * for the My Plan & Benefits journey.
 * 
 * @param planId - The ID of the plan to fetch coverage data for
 * @returns A React Query result object containing coverage data, loading state, and error information
 */
export const useCoverage = (planId: string) => {
  const { session } = useAuth();
  
  return useQuery<Coverage[], ApiError>(
    // Query key includes planId to ensure proper cache invalidation
    ['coverage', planId],
    
    // Query function that fetches the coverage data
    async () => {
      try {
        // Use standardized API endpoint configuration
        const response = await fetch(`${apiConfig.journeys.plan}/plans/${planId}/coverage`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw {
            status: response.status,
            message: errorData.message || `Failed to fetch coverage data: ${response.statusText}`,
            code: errorData.code || 'COVERAGE_FETCH_ERROR',
            details: errorData.details || {}
          } as ApiError;
        }
        
        return await response.json() as Coverage[];
      } catch (error) {
        console.error('Error fetching coverage data:', error);
        throw error;
      }
    },
    
    // Query options with enhanced configuration
    {
      // Only run the query if we have a planId and user is authenticated
      enabled: !!planId && !!session,
      
      // Coverage data doesn't change frequently, so we can cache it for a while
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      
      // Error handling with typed error responses
      onError: (error: ApiError) => {
        console.error('Error in coverage query:', error);
      },
      
      // Set a retry policy for transient errors
      retry: (failureCount, error: ApiError) => {
        // Don't retry for client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};