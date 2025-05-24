/**
 * Type augmentation for TanStack Query (React Query) 5.25.0
 * 
 * This file extends TanStack Query with AUSTA SuperApp specific type augmentations
 * to enhance type safety for data fetching operations across all journeys.
 * 
 * It provides generic parameter defaults that integrate with the @austa/interfaces
 * type system, ensuring consistent typing for query keys, variables, and results.
 */

import { 
  QueryKey, 
  UseQueryOptions, 
  UseMutationOptions, 
  QueryFunction, 
  MutationFunction,
  UseQueryResult,
  UseMutationResult,
  QueryClient,
  QueryFilters
} from '@tanstack/react-query';

// Import interfaces from the @austa/interfaces package
import { ApiError, ApiResponse } from '@austa/interfaces/common';
import { HealthTypes } from '@austa/interfaces/health';
import { CareTypes } from '@austa/interfaces/care';
import { PlanTypes } from '@austa/interfaces/plan';
import { GamificationTypes } from '@austa/interfaces/gamification';
import { AuthTypes } from '@austa/interfaces/auth';

/**
 * Journey-specific query key types to ensure type safety when using query keys
 */
declare module '@tanstack/react-query' {
  /**
   * Maps journey namespaces to their specific query key types
   * This enables type-safe query keys for each journey
   */
  export interface JourneyQueryKeyTypes {
    health: HealthTypes.QueryKeys;
    care: CareTypes.QueryKeys;
    plan: PlanTypes.QueryKeys;
    gamification: GamificationTypes.QueryKeys;
    auth: AuthTypes.QueryKeys;
  }
  
  /**
   * Maps journey namespaces to their specific error types
   * This enables journey-specific error handling
   */
  export interface JourneyErrorTypes {
    health: HealthTypes.Errors;
    care: CareTypes.Errors;
    plan: PlanTypes.Errors;
    gamification: GamificationTypes.Errors;
    auth: AuthTypes.Errors;
    common: ApiError;
  }

  /**
   * Strongly typed journey-specific query keys
   * Ensures that query keys follow the pattern [journeyName, ...journeySpecificKeys]
   * 
   * @example
   * // Health journey query key for fetching metrics
   * const queryKey: JourneyQueryKey<'health'> = ['health', 'metrics', userId];
   * 
   * @template T - Journey namespace (health, care, plan, etc.)
   */
  export type JourneyQueryKey<T extends keyof JourneyQueryKeyTypes> = 
    [T, ...JourneyQueryKeyTypes[T]];
    
  /**
   * Journey-specific error type helper
   * Retrieves the appropriate error type for a given journey
   * 
   * @template T - Journey namespace (health, care, plan, etc.)
   */
  export type JourneyError<T extends keyof JourneyErrorTypes> = JourneyErrorTypes[T];

  /**
   * Enhanced useQuery hook with AUSTA-specific defaults
   * - Sets ApiError as the default error type
   * - Integrates with journey-specific query keys
   */
  export function useQuery<
    TQueryFnData = unknown,
    TError = ApiError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;

  /**
   * Enhanced useMutation hook with AUSTA-specific defaults
   * - Sets ApiError as the default error type
   * - Provides better typing for mutation responses
   */
  export function useMutation<
    TData = unknown,
    TError = ApiError,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Enhanced QueryClient with journey-specific type safety
   */
  interface AustaQueryClient extends QueryClient {
    /**
     * Invalidate queries with journey-specific type checking
     */
    invalidateJourneyQueries<T extends keyof JourneyQueryKeyTypes>(
      journey: T,
      filters?: Omit<QueryFilters, 'queryKey'> & {
        queryKey?: JourneyQueryKeyTypes[T];
      },
      options?: { throwOnError?: boolean }
    ): Promise<void>;
  }

  /**
   * Journey-specific useQuery hooks with proper typing
   * These hooks provide enhanced type safety for each journey
   */
  
  /**
   * Health journey specific query hook
   * Automatically sets the correct query key type and error type
   */
  export function useHealthQuery<
    TQueryFnData = unknown,
    TError = JourneyError<'health'>,
    TData = TQueryFnData,
  >(
    queryKey: JourneyQueryKey<'health'>,
    queryFn: QueryFunction<TQueryFnData, JourneyQueryKey<'health'>>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, JourneyQueryKey<'health'>>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;

  /**
   * Care journey specific query hook
   * Automatically sets the correct query key type and error type
   */
  export function useCareQuery<
    TQueryFnData = unknown,
    TError = JourneyError<'care'>,
    TData = TQueryFnData,
  >(
    queryKey: JourneyQueryKey<'care'>,
    queryFn: QueryFunction<TQueryFnData, JourneyQueryKey<'care'>>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, JourneyQueryKey<'care'>>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;

  /**
   * Plan journey specific query hook
   * Automatically sets the correct query key type and error type
   */
  export function usePlanQuery<
    TQueryFnData = unknown,
    TError = JourneyError<'plan'>,
    TData = TQueryFnData,
  >(
    queryKey: JourneyQueryKey<'plan'>,
    queryFn: QueryFunction<TQueryFnData, JourneyQueryKey<'plan'>>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, JourneyQueryKey<'plan'>>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;

  /**
   * Gamification specific query hook
   * Automatically sets the correct query key type and error type
   */
  export function useGamificationQuery<
    TQueryFnData = unknown,
    TError = JourneyError<'gamification'>,
    TData = TQueryFnData,
  >(
    queryKey: JourneyQueryKey<'gamification'>,
    queryFn: QueryFunction<TQueryFnData, JourneyQueryKey<'gamification'>>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, JourneyQueryKey<'gamification'>>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;
  
  /**
   * Auth specific query hook
   * Automatically sets the correct query key type and error type
   */
  export function useAuthQuery<
    TQueryFnData = unknown,
    TError = JourneyError<'auth'>,
    TData = TQueryFnData,
  >(
    queryKey: JourneyQueryKey<'auth'>,
    queryFn: QueryFunction<TQueryFnData, JourneyQueryKey<'auth'>>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, JourneyQueryKey<'auth'>>, 'queryKey' | 'queryFn'>,
  ): UseQueryResult<TData, TError>;
  /**
   * Journey-specific mutation hooks with proper typing
   */
  
  /**
   * Health journey specific mutation hook
   */
  export function useHealthMutation<
    TData = unknown,
    TError = JourneyError<'health'>,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Care journey specific mutation hook
   */
  export function useCareMutation<
    TData = unknown,
    TError = JourneyError<'care'>,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Plan journey specific mutation hook
   */
  export function usePlanMutation<
    TData = unknown,
    TError = JourneyError<'plan'>,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Gamification specific mutation hook
   */
  export function useGamificationMutation<
    TData = unknown,
    TError = JourneyError<'gamification'>,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Auth specific mutation hook
   */
  export function useAuthMutation<
    TData = unknown,
    TError = JourneyError<'auth'>,
    TVariables = void,
    TContext = unknown,
  >(
    mutationFn: MutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
  ): UseMutationResult<TData, TError, TVariables, TContext>;
  
  /**
   * Type helpers for working with API responses
   */
  export type QueryResponseData<T> = T extends ApiResponse<infer U> ? U : T;
  export type MutationResponseData<T> = T extends ApiResponse<infer U> ? U : T;
}