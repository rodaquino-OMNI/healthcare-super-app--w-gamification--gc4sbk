/**
 * Type augmentation for TanStack Query 5.25.0
 * 
 * This file extends TanStack Query with project-specific type augmentations to enhance
 * type safety for data fetching operations. It provides generic parameter defaults that
 * integrate with the @austa/interfaces type system, ensuring consistent typing for
 * query keys, variables, and results.
 */

// Import necessary types from @austa/interfaces
import { common } from '@austa/interfaces';
import { health } from '@austa/interfaces/health';
import { care } from '@austa/interfaces/care';
import { plan } from '@austa/interfaces/plan';
import { gamification } from '@austa/interfaces/gamification';
import { auth } from '@austa/interfaces/auth';

// Define journey-specific query key types
type HealthQueryKey = readonly ['health', string, ...unknown[]];
type CareQueryKey = readonly ['care', string, ...unknown[]];
type PlanQueryKey = readonly ['plan', string, ...unknown[]];
type GamificationQueryKey = readonly ['gamification', string, ...unknown[]];
type AuthQueryKey = readonly ['auth', string, ...unknown[]];

// Define the union of all possible query keys
type AustaQueryKey =
  | HealthQueryKey
  | CareQueryKey
  | PlanQueryKey
  | GamificationQueryKey
  | AuthQueryKey
  | readonly [string, ...unknown[]];

// Augment TanStack Query with AUSTA SuperApp specific types
declare module '@tanstack/react-query' {
  interface Register {
    // Set default error type to our common API error type
    defaultError: common.error.ApiError;
    
    // Set default query key type to our custom query key type
    queryKey: AustaQueryKey;
    
    // Set default mutation key type to our custom query key type
    mutationKey: AustaQueryKey;
    
    // Define metadata structure for queries and mutations
    queryMeta: {
      journey?: 'health' | 'care' | 'plan';
      requiresAuth?: boolean;
      cacheDuration?: number;
      [key: string]: unknown;
    };
    
    mutationMeta: {
      journey?: 'health' | 'care' | 'plan';
      requiresAuth?: boolean;
      retryConfig?: {
        maxRetries: number;
        backoffDelay: number;
      };
      [key: string]: unknown;
    };
  }
}

// Add journey-specific type helpers
declare global {
  namespace AustaQuery {
    // Health journey type helpers
    namespace Health {
      type QueryResult<TData> = import('@tanstack/react-query').UseQueryResult<TData, common.error.ApiError>;
      type QueryOptions<TData, TParams = unknown> = import('@tanstack/react-query').UseQueryOptions<TData, common.error.ApiError, TData, HealthQueryKey>;
      type MutationResult<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationResult<TData, common.error.ApiError, TVariables>;
      type MutationOptions<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationOptions<TData, common.error.ApiError, TVariables>;
    }
    
    // Care journey type helpers
    namespace Care {
      type QueryResult<TData> = import('@tanstack/react-query').UseQueryResult<TData, common.error.ApiError>;
      type QueryOptions<TData, TParams = unknown> = import('@tanstack/react-query').UseQueryOptions<TData, common.error.ApiError, TData, CareQueryKey>;
      type MutationResult<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationResult<TData, common.error.ApiError, TVariables>;
      type MutationOptions<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationOptions<TData, common.error.ApiError, TVariables>;
    }
    
    // Plan journey type helpers
    namespace Plan {
      type QueryResult<TData> = import('@tanstack/react-query').UseQueryResult<TData, common.error.ApiError>;
      type QueryOptions<TData, TParams = unknown> = import('@tanstack/react-query').UseQueryOptions<TData, common.error.ApiError, TData, PlanQueryKey>;
      type MutationResult<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationResult<TData, common.error.ApiError, TVariables>;
      type MutationOptions<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationOptions<TData, common.error.ApiError, TVariables>;
    }
    
    // Gamification type helpers
    namespace Gamification {
      type QueryResult<TData> = import('@tanstack/react-query').UseQueryResult<TData, common.error.ApiError>;
      type QueryOptions<TData, TParams = unknown> = import('@tanstack/react-query').UseQueryOptions<TData, common.error.ApiError, TData, GamificationQueryKey>;
      type MutationResult<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationResult<TData, common.error.ApiError, TVariables>;
      type MutationOptions<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationOptions<TData, common.error.ApiError, TVariables>;
    }
    
    // Auth type helpers
    namespace Auth {
      type QueryResult<TData> = import('@tanstack/react-query').UseQueryResult<TData, common.error.ApiError>;
      type QueryOptions<TData, TParams = unknown> = import('@tanstack/react-query').UseQueryOptions<TData, common.error.ApiError, TData, AuthQueryKey>;
      type MutationResult<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationResult<TData, common.error.ApiError, TVariables>;
      type MutationOptions<TData, TVariables = unknown> = import('@tanstack/react-query').UseMutationOptions<TData, common.error.ApiError, TVariables>;
    }
  }
}

// Add type helpers for common query patterns
export type QueryKeyFactory<TJourney extends string> = {
  create: <TResource extends string, TParams extends Record<string, unknown> | undefined = undefined>(
    resource: TResource,
    params?: TParams
  ) => readonly [TJourney, TResource, ...(TParams extends undefined ? [] : [TParams])];
};

// Create query key factories for each journey
export const healthQueryKeys: QueryKeyFactory<'health'> = {
  create: (resource, params) => 
    params ? ['health', resource, params] : ['health', resource],
};

export const careQueryKeys: QueryKeyFactory<'care'> = {
  create: (resource, params) => 
    params ? ['care', resource, params] : ['care', resource],
};

export const planQueryKeys: QueryKeyFactory<'plan'> = {
  create: (resource, params) => 
    params ? ['plan', resource, params] : ['plan', resource],
};

export const gamificationQueryKeys: QueryKeyFactory<'gamification'> = {
  create: (resource, params) => 
    params ? ['gamification', resource, params] : ['gamification', resource],
};

export const authQueryKeys: QueryKeyFactory<'auth'> = {
  create: (resource, params) => 
    params ? ['auth', resource, params] : ['auth', resource],
};