/**
 * Apollo Client Type Augmentation
 * 
 * This file extends Apollo Client's type system with project-specific GraphQL schema types
 * from @austa/interfaces. It provides type safety for GraphQL queries, mutations, and
 * subscriptions by connecting Apollo's generic type parameters to the strongly-typed
 * schema definitions generated for the project.
 */

import { FieldPolicy, FieldReadFunction, TypePolicies } from '@apollo/client/cache';
import { DocumentNode } from 'graphql';
import { 
  // Import journey-specific GraphQL operation types
  HealthTypes, 
  CareTypes, 
  PlanTypes, 
  GamificationTypes, 
  AuthTypes,
  // Import error and response types
  ErrorTypes,
  ResponseTypes
} from '@austa/interfaces/api';

// Type for all possible GraphQL operations in the application
type AustaGraphQLOperations = 
  | HealthTypes.Operations
  | CareTypes.Operations
  | PlanTypes.Operations
  | GamificationTypes.Operations
  | AuthTypes.Operations;

// Type for all possible GraphQL errors in the application
type AustaGraphQLErrors = ErrorTypes.GraphQLError;

// Extend the Apollo Client module
declare module '@apollo/client' {
  /**
   * Extend the useQuery hook with AUSTA-specific types
   */
  export function useQuery<
    TData = any,
    TVariables = AustaGraphQLOperations['variables']
  >(
    query: DocumentNode,
    options?: QueryHookOptions<TData, TVariables>
  ): QueryResult<TData, TVariables> & {
    error?: AustaGraphQLErrors;
  };

  /**
   * Extend the useMutation hook with AUSTA-specific types
   */
  export function useMutation<
    TData = any,
    TVariables = AustaGraphQLOperations['variables']
  >(
    mutation: DocumentNode,
    options?: MutationHookOptions<TData, TVariables>
  ): MutationTuple<TData, TVariables> & {
    error?: AustaGraphQLErrors;
  };

  /**
   * Extend the useSubscription hook with AUSTA-specific types
   */
  export function useSubscription<
    TData = any,
    TVariables = AustaGraphQLOperations['variables']
  >(
    subscription: DocumentNode,
    options?: SubscriptionHookOptions<TData, TVariables>
  ): SubscriptionResult<TData> & {
    error?: AustaGraphQLErrors;
  };

  /**
   * Extend the ApolloError type with AUSTA-specific error details
   */
  export interface ApolloError {
    journeyContext?: string;
    errorCode?: ErrorTypes.ErrorCode;
    validationErrors?: ErrorTypes.ValidationError[];
    graphQLErrors: ReadonlyArray<AustaGraphQLErrors>;
  }

  /**
   * Extend the ApolloClient type with AUSTA-specific configuration
   */
  export interface ApolloClientOptions<TCacheShape> {
    journeyContext?: string;
    defaultOptions?: DefaultOptions;
  }

  /**
   * Extend the DefaultOptions type with AUSTA-specific defaults
   */
  export interface DefaultOptions {
    watchQuery?: WatchQueryOptions<AustaGraphQLOperations['variables']>;
    query?: QueryOptions<AustaGraphQLOperations['variables']>;
    mutation?: MutationOptions<any, AustaGraphQLOperations['variables']>;
  }
}

/**
 * Extend the Apollo Cache module
 */
declare module '@apollo/client/cache' {
  export interface TypePolicies {
    // Journey-specific type policies
    HealthMetric?: TypePolicy;
    Appointment?: TypePolicy;
    InsurancePlan?: TypePolicy;
    GamificationProfile?: TypePolicy;
    User?: TypePolicy;
    // Add other journey-specific types as needed
  }
}

/**
 * Extend the Apollo React Hooks module
 */
declare module '@apollo/client/react/hooks' {
  /**
   * Extend the QueryResult type with AUSTA-specific fields
   */
  export interface QueryResult<TData = any, TVariables = any> {
    journeyContext?: string;
    error?: AustaGraphQLErrors;
    data?: TData & ResponseTypes.GraphQLResponse<TData>;
  }

  /**
   * Extend the MutationResult type with AUSTA-specific fields
   */
  export interface MutationResult<TData = any> {
    journeyContext?: string;
    error?: AustaGraphQLErrors;
    data?: TData & ResponseTypes.GraphQLResponse<TData>;
  }

  /**
   * Extend the SubscriptionResult type with AUSTA-specific fields
   */
  export interface SubscriptionResult<TData = any> {
    journeyContext?: string;
    error?: AustaGraphQLErrors;
    data?: TData & ResponseTypes.GraphQLResponse<TData>;
  }
}