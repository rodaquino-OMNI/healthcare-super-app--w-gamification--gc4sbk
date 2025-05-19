/**
 * Health API functions for the AUSTA SuperApp mobile application
 * Provides functions for fetching and updating health-related data
 * Implements the My Health journey functionality (F-101)
 * 
 * @module api/health
 */

import { useEffect, useState, useCallback } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.22.4
import { graphQLClient } from './client';
import { withErrorHandling, parseError, logError, withRetry, CircuitBreaker } from './errors';
import { GET_HEALTH_METRICS } from '@austa/shared/graphql/queries/health.queries';
import { CREATE_HEALTH_METRIC } from '@austa/shared/graphql/mutations/health.mutations';

// Import types from shared interfaces package
import { 
  HealthMetric, 
  HealthMetricType,
  CreateHealthMetricInput,
  HealthMetricSchema,
  CreateHealthMetricSchema
} from '@austa/interfaces/health';

// Create a dedicated circuit breaker for health API operations
const healthCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 15000,
  onStateChange: (from, to) => {
    logError(new Error(`Health API circuit breaker state changed from ${from} to ${to}`), {
      context: 'health-api',
      from,
      to
    });
  }
});

/**
 * Default retry options for health API operations
 */
const healthRetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 1.5
};

/**
 * Fetches health metrics for a specific user and metric types
 * Implements offline-first caching strategy for better user experience
 * 
 * @param userId - User ID to fetch metrics for
 * @param types - Array of metric types to fetch
 * @param startDate - Optional start date for filtering metrics
 * @param endDate - Optional end date for filtering metrics
 * @returns Promise resolving to an array of validated HealthMetric objects
 */
export const getHealthMetrics = withErrorHandling(
  async (
    userId: string,
    types: HealthMetricType[],
    startDate?: string,
    endDate?: string
  ): Promise<HealthMetric[]> => {
    try {
      // Validate input parameters
      const inputSchema = z.object({
        userId: z.string().uuid(),
        types: z.array(z.nativeEnum(HealthMetricType)).min(1),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional()
      });

      // Validate inputs before proceeding
      inputSchema.parse({ userId, types, startDate, endDate });

      // Execute the GraphQL query to fetch health metrics
      const { data } = await graphQLClient.query({
        query: GET_HEALTH_METRICS,
        variables: {
          userId,
          types,
          startDate,
          endDate
        },
        // Enhanced caching strategy for offline-first operation
        fetchPolicy: 'cache-and-network',
        // Enable cache persistence for offline access
        nextFetchPolicy: 'cache-first',
        // Don't refetch on component mount if we have cached data
        notifyOnNetworkStatusChange: true
      });

      // Validate response data against schema
      const metricsArray = z.array(HealthMetricSchema).parse(data.getHealthMetrics);

      return metricsArray;
    } catch (error) {
      // Parse and rethrow the error using our standardized error handling
      const parsedError = parseError(error);
      logError(parsedError, { 
        context: 'getHealthMetrics', 
        userId, 
        types, 
        startDate, 
        endDate 
      });
      throw parsedError;
    }
  },
  healthCircuitBreaker,
  healthRetryOptions
);

/**
 * Creates a new health metric for a specific user
 * Implements validation using Zod schemas from @austa/interfaces
 * 
 * @param recordId - Health record ID to associate metric with
 * @param createMetricDto - Object containing metric data (type, value, unit, etc.)
 * @returns Promise resolving to the created HealthMetric object
 */
export const createHealthMetric = withErrorHandling(
  async (
    recordId: string,
    createMetricDto: CreateHealthMetricInput
  ): Promise<HealthMetric> => {
    try {
      // Validate input parameters
      const inputSchema = z.object({
        recordId: z.string().uuid(),
        createMetricDto: CreateHealthMetricSchema
      });

      // Validate inputs before proceeding
      inputSchema.parse({ recordId, createMetricDto });

      // Execute the GraphQL mutation to create a health metric
      const { data } = await graphQLClient.mutate({
        mutation: CREATE_HEALTH_METRIC,
        variables: {
          recordId,
          createMetricDto
        },
        // Update cache with the new metric
        update: (cache, { data }) => {
          if (data?.createHealthMetric) {
            // Validate the returned data
            const newMetric = HealthMetricSchema.parse(data.createHealthMetric);
            
            try {
              // Try to update the cache with the new metric
              const existingMetricsQuery = {
                query: GET_HEALTH_METRICS,
                variables: {
                  userId: createMetricDto.userId,
                  types: [createMetricDto.type]
                }
              };
              
              const existingData = cache.readQuery(existingMetricsQuery);
              
              if (existingData) {
                cache.writeQuery({
                  ...existingMetricsQuery,
                  data: {
                    getHealthMetrics: [
                      newMetric,
                      ...existingData.getHealthMetrics
                    ]
                  }
                });
              }
            } catch (cacheError) {
              // Log cache update errors but don't fail the operation
              logError(parseError(cacheError), { 
                context: 'createHealthMetric.cacheUpdate', 
                recordId 
              });
            }
          }
        }
      });

      // Validate response data against schema
      const createdMetric = HealthMetricSchema.parse(data.createHealthMetric);

      return createdMetric;
    } catch (error) {
      // Parse and rethrow the error using our standardized error handling
      const parsedError = parseError(error);
      logError(parsedError, { 
        context: 'createHealthMetric', 
        recordId, 
        metricType: createMetricDto.type 
      });
      throw parsedError;
    }
  },
  healthCircuitBreaker,
  healthRetryOptions
);

/**
 * Custom hook for fetching health metrics with loading and error states
 * Provides a convenient way to use health metrics in React components
 * 
 * @param userId - User ID to fetch metrics for
 * @param types - Array of metric types to fetch
 * @param startDate - Optional start date for filtering metrics
 * @param endDate - Optional end date for filtering metrics
 * @returns Object containing metrics, loading state, error state, and refetch function
 */
export const useHealthMetrics = (
  userId: string,
  types: HealthMetricType[],
  startDate?: string,
  endDate?: string
) => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getHealthMetrics(userId, types, startDate, endDate);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId, types, startDate, endDate]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};