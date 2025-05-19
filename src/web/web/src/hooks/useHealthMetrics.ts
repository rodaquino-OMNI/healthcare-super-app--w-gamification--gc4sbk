import { useQuery, ApolloError } from '@apollo/client'; // 3.7.17
import { useContext } from 'react';
import { HealthMetric, HealthMetricType } from '@austa/interfaces/health';
import { GET_HEALTH_METRICS } from '@app/shared/graphql/queries/health.queries';
import { AuthContext } from '@app/web/context/AuthContext';
import { apiConfig } from '@app/shared/config/apiConfig';

/**
 * Error interface for health metrics query errors
 * Extends Apollo error with additional type information
 */
export interface HealthMetricsError extends ApolloError {
  code?: string;
  journeyContext?: 'health';
}

/**
 * Response interface for health metrics query
 */
export interface HealthMetricsResponse {
  getHealthMetrics: HealthMetric[];
}

/**
 * A React hook that fetches and manages health metrics data for the My Health journey.
 * Used to retrieve health metrics for display in the Health Dashboard.
 * 
 * @param userId - The ID of the user whose health metrics to fetch
 * @param types - An array of metric types to filter the results
 * @param startDate - Optional start date to filter metrics by time range
 * @param endDate - Optional end date to filter metrics by time range
 * @returns An object containing loading state, error state, metrics data, and refetch function
 */
export const useHealthMetrics = (
  userId: string,
  types: HealthMetricType[] = [],
  startDate?: string,
  endDate?: string
) => {
  const auth = useContext(AuthContext);

  const { loading, error, data, refetch } = useQuery<HealthMetricsResponse, {
    userId: string;
    types: HealthMetricType[];
    startDate?: string;
    endDate?: string;
  }>(
    GET_HEALTH_METRICS,
    {
      variables: {
        userId,
        types,
        startDate,
        endDate
      },
      // Skip the query if there's no authenticated session
      skip: auth.status !== 'authenticated',
      // Cache and network strategy for optimal user experience with health metrics
      fetchPolicy: 'cache-and-network',
      // Keep data fresh by refetching when the user returns to the app
      refetchOnWindowFocus: true,
      // Ensure proper authorization headers are sent with the request
      context: {
        headers: {
          Authorization: auth.session?.accessToken ? `Bearer ${auth.session.accessToken}` : '',
          'Api-Base-Url': apiConfig.baseURL, // Include base URL for monitoring and logging
          'Journey-Context': 'health', // Add journey context for better error tracking
        },
      },
      // Enhanced error handling with journey-specific context
      onError: (error: HealthMetricsError) => {
        // Add journey context to the error for better error tracking
        error.journeyContext = 'health';
        
        // Log detailed error information
        console.error(
          `[Health Journey] Error fetching metrics for user ${userId}:`,
          {
            message: error.message,
            code: error.code,
            graphQLErrors: error.graphQLErrors,
            networkError: error.networkError,
            journeyContext: error.journeyContext,
          }
        );
      }
    }
  );

  return {
    loading,
    error: error as HealthMetricsError | undefined,
    metrics: data?.getHealthMetrics || [],
    refetch
  };
};