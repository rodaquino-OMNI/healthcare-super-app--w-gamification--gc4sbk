/**
 * GraphQL-specific TypeScript interfaces for the AUSTA SuperApp
 * 
 * This file defines the TypeScript interfaces used for GraphQL operations
 * throughout the application, including query variables, fragment types,
 * operation results, and error handling. These interfaces are used by
 * Apollo Client to provide type safety for all GraphQL operations.
 * 
 * @package @austa/interfaces
 */

import { ReactElement } from 'react';
import {
  ApolloClient,
  ApolloError,
  ApolloQueryResult,
  FetchResult,
  MutationHookOptions,
  MutationResult,
  OperationVariables,
  QueryHookOptions,
  QueryResult,
  SubscriptionHookOptions,
  TypedDocumentNode,
  useQuery as apolloUseQuery,
  useMutation as apolloUseMutation,
  useSubscription as apolloUseSubscription
} from '@apollo/client';

import {
  AuthSession,
  HealthMetric,
  MedicalEvent,
  HealthGoal,
  DeviceConnection,
  Appointment,
  Medication,
  TelemedicineSession,
  TreatmentPlan,
  ClaimStatus,
  ClaimType,
  PlanType,
  CoverageType,
  Claim,
  Plan,
  Coverage,
  Benefit,
  Achievement,
  Quest,
  Reward,
  GameProfile,
  Notification
} from '../';

// -----------------------------------------------------------------------------
// Base Apollo Client Types
// -----------------------------------------------------------------------------

/**
 * Apollo Client instance with extended configuration
 */
export interface AustaApolloClient extends ApolloClient<any> {
  /**
   * Journey context for the current client instance
   */
  journeyContext?: {
    /**
     * Current active journey (health, care, plan)
     */
    currentJourney: 'health' | 'care' | 'plan' | null;
    
    /**
     * User session information
     */
    session: AuthSession | null;
  };
}

/**
 * Apollo Client context for GraphQL operations
 */
export interface ApolloContext {
  /**
   * Authentication token for the current user session
   */
  token?: string;
  
  /**
   * Current journey context
   */
  journeyContext?: {
    /**
     * Current active journey (health, care, plan)
     */
    currentJourney: 'health' | 'care' | 'plan' | null;
  };
  
  /**
   * Headers to include with the GraphQL request
   */
  headers?: Record<string, string>;
}

// -----------------------------------------------------------------------------
// GraphQL Operation Types
// -----------------------------------------------------------------------------

/**
 * Base interface for all GraphQL operations
 */
export interface GraphQLOperation<TData = any, TVariables = OperationVariables> {
  /**
   * GraphQL document node with type information
   */
  document: TypedDocumentNode<TData, TVariables>;
  
  /**
   * Variables for the GraphQL operation
   */
  variables?: TVariables;
  
  /**
   * Context for the GraphQL operation
   */
  context?: ApolloContext;
}

/**
 * GraphQL query operation
 */
export interface GraphQLQuery<TData = any, TVariables = OperationVariables> extends GraphQLOperation<TData, TVariables> {
  /**
   * Query-specific options
   */
  options?: Omit<QueryHookOptions<TData, TVariables>, 'variables' | 'context'>;
}

/**
 * GraphQL mutation operation
 */
export interface GraphQLMutation<TData = any, TVariables = OperationVariables> extends GraphQLOperation<TData, TVariables> {
  /**
   * Mutation-specific options
   */
  options?: Omit<MutationHookOptions<TData, TVariables>, 'variables' | 'context'>;
}

/**
 * GraphQL subscription operation
 */
export interface GraphQLSubscription<TData = any, TVariables = OperationVariables> extends GraphQLOperation<TData, TVariables> {
  /**
   * Subscription-specific options
   */
  options?: Omit<SubscriptionHookOptions<TData, TVariables>, 'variables' | 'context'>;
}

/**
 * Enhanced query result with additional utility methods
 */
export interface EnhancedQueryResult<TData = any, TVariables = OperationVariables> extends QueryResult<TData, TVariables> {
  /**
   * Refetch the query with new variables
   */
  refetch: (variables?: TVariables) => Promise<ApolloQueryResult<TData>>;
  
  /**
   * Refetch the query with the same variables
   */
  refresh: () => Promise<ApolloQueryResult<TData>>;
  
  /**
   * Check if the query is in a loading state (initial load or refetch)
   */
  isLoading: boolean;
  
  /**
   * Check if the query has successfully loaded data
   */
  isSuccess: boolean;
  
  /**
   * Check if the query has encountered an error
   */
  isError: boolean;
}

/**
 * Enhanced mutation result with additional utility methods
 */
export interface EnhancedMutationResult<TData = any, TVariables = OperationVariables> extends MutationResult<TData> {
  /**
   * Execute the mutation with variables
   */
  execute: (variables?: TVariables, context?: ApolloContext) => Promise<FetchResult<TData>>;
  
  /**
   * Check if the mutation is in progress
   */
  isLoading: boolean;
  
  /**
   * Check if the mutation has successfully completed
   */
  isSuccess: boolean;
  
  /**
   * Check if the mutation has encountered an error
   */
  isError: boolean;
  
  /**
   * Reset the mutation state
   */
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Fragment Types and Utilities
// -----------------------------------------------------------------------------

/**
 * Type for GraphQL fragments
 */
export type FragmentType<TFragment> = { __fragment: TFragment };

/**
 * Utility type to extract the actual data type from a fragment
 */
export type FragmentData<TFragment> = TFragment extends FragmentType<infer U> ? U : never;

/**
 * Utility type to create a fragment reference
 */
export type CreateFragmentRef<TFragment> = (data: FragmentData<TFragment>) => TFragment;

/**
 * Hook result for using a GraphQL fragment
 */
export interface UseFragmentResult<TFragment> {
  /**
   * Fragment data
   */
  data: FragmentData<TFragment> | null;
  
  /**
   * Check if the fragment data is complete
   */
  complete: boolean;
}

// -----------------------------------------------------------------------------
// Error Handling Types
// -----------------------------------------------------------------------------

/**
 * Enhanced Apollo error with additional context
 */
export interface EnhancedApolloError extends ApolloError {
  /**
   * Journey-specific error context
   */
  journeyContext?: {
    /**
     * Journey where the error occurred
     */
    journey: 'health' | 'care' | 'plan' | 'auth' | 'gamification';
    
    /**
     * Operation that caused the error
     */
    operation: string;
  };
  
  /**
   * User-friendly error message
   */
  userMessage?: string;
  
  /**
   * Error code for client-side handling
   */
  code?: string;
  
  /**
   * Field-specific validation errors
   */
  fieldErrors?: Record<string, string[]>;
}

/**
 * GraphQL error response from the server
 */
export interface GraphQLErrorResponse {
  /**
   * List of errors returned by the GraphQL server
   */
  errors: {
    /**
     * Error message
     */
    message: string;
    
    /**
     * Error locations in the GraphQL document
     */
    locations?: { line: number; column: number }[];
    
    /**
     * Path to the field that caused the error
     */
    path?: (string | number)[];
    
    /**
     * Additional error details
     */
    extensions?: {
      /**
       * Error code
       */
      code?: string;
      
      /**
       * Exception details
       */
      exception?: {
        /**
         * Stack trace
         */
        stacktrace?: string[];
      };
      
      /**
       * Field-specific validation errors
       */
      validationErrors?: Record<string, string[]>;
    };
  }[];
  
  /**
   * Data returned by the GraphQL server (may be partial)
   */
  data?: Record<string, any> | null;
}

// -----------------------------------------------------------------------------
// Journey-Specific Operation Result Types
// -----------------------------------------------------------------------------

// Health Journey

/**
 * Result of the GetHealthMetrics query
 */
export interface GetHealthMetricsResult {
  /**
   * List of health metrics
   */
  healthMetrics: HealthMetric[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of health metrics
     */
    totalCount: number;
    
    /**
     * Whether there are more health metrics to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetHealthGoals query
 */
export interface GetHealthGoalsResult {
  /**
   * List of health goals
   */
  healthGoals: HealthGoal[];
}

/**
 * Result of the GetMedicalEvents query
 */
export interface GetMedicalEventsResult {
  /**
   * List of medical events
   */
  medicalEvents: MedicalEvent[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of medical events
     */
    totalCount: number;
    
    /**
     * Whether there are more medical events to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetDeviceConnections query
 */
export interface GetDeviceConnectionsResult {
  /**
   * List of device connections
   */
  deviceConnections: DeviceConnection[];
}

// Care Journey

/**
 * Result of the GetAppointments query
 */
export interface GetAppointmentsResult {
  /**
   * List of appointments
   */
  appointments: Appointment[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of appointments
     */
    totalCount: number;
    
    /**
     * Whether there are more appointments to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetMedications query
 */
export interface GetMedicationsResult {
  /**
   * List of medications
   */
  medications: Medication[];
}

/**
 * Result of the GetTelemedicineSessions query
 */
export interface GetTelemedicineSessionsResult {
  /**
   * List of telemedicine sessions
   */
  telemedicineSessions: TelemedicineSession[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of telemedicine sessions
     */
    totalCount: number;
    
    /**
     * Whether there are more telemedicine sessions to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetTreatmentPlans query
 */
export interface GetTreatmentPlansResult {
  /**
   * List of treatment plans
   */
  treatmentPlans: TreatmentPlan[];
}

// Plan Journey

/**
 * Result of the GetClaims query
 */
export interface GetClaimsResult {
  /**
   * List of claims
   */
  claims: Claim[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of claims
     */
    totalCount: number;
    
    /**
     * Whether there are more claims to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetPlans query
 */
export interface GetPlansResult {
  /**
   * List of plans
   */
  plans: Plan[];
}

/**
 * Result of the GetCoverage query
 */
export interface GetCoverageResult {
  /**
   * List of coverage items
   */
  coverage: Coverage[];
}

/**
 * Result of the GetBenefits query
 */
export interface GetBenefitsResult {
  /**
   * List of benefits
   */
  benefits: Benefit[];
}

// Gamification

/**
 * Result of the GetAchievements query
 */
export interface GetAchievementsResult {
  /**
   * List of achievements
   */
  achievements: Achievement[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of achievements
     */
    totalCount: number;
    
    /**
     * Whether there are more achievements to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetQuests query
 */
export interface GetQuestsResult {
  /**
   * List of quests
   */
  quests: Quest[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of quests
     */
    totalCount: number;
    
    /**
     * Whether there are more quests to load
     */
    hasMore: boolean;
  };
}

/**
 * Result of the GetRewards query
 */
export interface GetRewardsResult {
  /**
   * List of rewards
   */
  rewards: Reward[];
}

/**
 * Result of the GetGameProfile query
 */
export interface GetGameProfileResult {
  /**
   * Game profile
   */
  gameProfile: GameProfile;
}

// Auth

/**
 * Result of the Login mutation
 */
export interface LoginResult {
  /**
   * Login response
   */
  login: {
    /**
     * Access token
     */
    accessToken: string;
    
    /**
     * Refresh token
     */
    refreshToken: string;
    
    /**
     * User session
     */
    session: AuthSession;
  };
}

/**
 * Result of the RefreshToken mutation
 */
export interface RefreshTokenResult {
  /**
   * Refresh token response
   */
  refreshToken: {
    /**
     * New access token
     */
    accessToken: string;
    
    /**
     * New refresh token
     */
    refreshToken: string;
  };
}

// Notifications

/**
 * Result of the GetNotifications query
 */
export interface GetNotificationsResult {
  /**
   * List of notifications
   */
  notifications: Notification[];
  
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of notifications
     */
    totalCount: number;
    
    /**
     * Whether there are more notifications to load
     */
    hasMore: boolean;
  };
}

// -----------------------------------------------------------------------------
// Custom Hooks
// -----------------------------------------------------------------------------

/**
 * Custom hook for GraphQL queries with enhanced result
 */
export function useQuery<TData = any, TVariables = OperationVariables>(
  query: GraphQLQuery<TData, TVariables>
): EnhancedQueryResult<TData, TVariables> {
  // This is just a type definition - the actual implementation will be in the hooks package
  throw new Error('Not implemented - this is just a type definition');
}

/**
 * Custom hook for GraphQL mutations with enhanced result
 */
export function useMutation<TData = any, TVariables = OperationVariables>(
  mutation: GraphQLMutation<TData, TVariables>
): EnhancedMutationResult<TData, TVariables> {
  // This is just a type definition - the actual implementation will be in the hooks package
  throw new Error('Not implemented - this is just a type definition');
}

/**
 * Custom hook for GraphQL fragments
 */
export function useFragment<TFragment>(
  fragment: TypedDocumentNode<TFragment, any>,
  fragmentRef: FragmentType<TFragment> | null | undefined
): UseFragmentResult<TFragment> {
  // This is just a type definition - the actual implementation will be in the hooks package
  throw new Error('Not implemented - this is just a type definition');
}

/**
 * Type for components that use GraphQL fragments
 */
export interface FragmentComponentProps<TFragment> {
  /**
   * Fragment reference
   */
  fragmentRef: FragmentType<TFragment> | null | undefined;
}

/**
 * Higher-order component that wraps a component with fragment handling
 */
export function withFragment<TFragment, TProps extends FragmentComponentProps<TFragment>>(
  fragment: TypedDocumentNode<TFragment, any>,
  Component: React.ComponentType<TProps>
): React.ComponentType<TProps> {
  // This is just a type definition - the actual implementation will be in the hooks package
  throw new Error('Not implemented - this is just a type definition');
}