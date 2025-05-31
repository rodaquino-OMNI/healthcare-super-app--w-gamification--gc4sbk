/**
 * Type augmentation for Apollo Client 3.8.10
 * 
 * This declaration file enhances Apollo Client's type system with project-specific
 * GraphQL schema types from @austa/interfaces. It provides type safety for GraphQL
 * queries, mutations, and subscriptions by connecting Apollo's generic type parameters
 * to the strongly-typed schema definitions generated for the project.
 * 
 * @module apollo-client
 */

import { 
  OperationVariables,
  QueryResult,
  MutationResult,
  SubscriptionResult,
  ApolloError,
  QueryHookOptions,
  MutationHookOptions,
  SubscriptionHookOptions
} from '@apollo/client';

import { 
  GraphQLOperation,
  GraphQLError,
  GraphQLErrorResponse,
  GraphQLQueryVariables,
  GraphQLMutationVariables,
  GraphQLSubscriptionVariables,
  GraphQLQueryResult,
  GraphQLMutationResult,
  GraphQLSubscriptionResult
} from '@austa/interfaces/api/graphql.types';

// Import journey-specific GraphQL types
import { 
  HealthGraphQLOperations,
  CareGraphQLOperations,
  PlanGraphQLOperations,
  AuthGraphQLOperations,
  GamificationGraphQLOperations
} from '@austa/interfaces';

/**
 * Augment the @apollo/client module with project-specific types
 */
declare module '@apollo/client' {
  /**
   * Enhanced useQuery hook with strong typing for journey-specific operations
   * 
   * @template TOperation - The GraphQL operation type (from @austa/interfaces)
   * @template TVariables - The variables type for the operation
   * @param query - The GraphQL query document
   * @param options - The query options
   * @returns Strongly-typed query result
   */
  export function useQuery<
    TOperation extends GraphQLOperation,
    TVariables extends GraphQLQueryVariables = OperationVariables
  >(
    query: any,
    options?: QueryHookOptions<GraphQLQueryResult<TOperation>, TVariables>
  ): QueryResult<GraphQLQueryResult<TOperation>, TVariables> & {
    error: ApolloError & {
      graphQLErrors: GraphQLError[];
      networkError: Error | null;
      errorResponse: GraphQLErrorResponse | null;
    };
  };

  /**
   * Enhanced useMutation hook with strong typing for journey-specific operations
   * 
   * @template TOperation - The GraphQL operation type (from @austa/interfaces)
   * @template TVariables - The variables type for the operation
   * @param mutation - The GraphQL mutation document
   * @param options - The mutation options
   * @returns Strongly-typed mutation result tuple
   */
  export function useMutation<
    TOperation extends GraphQLOperation,
    TVariables extends GraphQLMutationVariables = OperationVariables
  >(
    mutation: any,
    options?: MutationHookOptions<GraphQLMutationResult<TOperation>, TVariables>
  ): [
    (variables?: TVariables) => Promise<MutationResult<GraphQLMutationResult<TOperation>>>,
    MutationResult<GraphQLMutationResult<TOperation>> & {
      error: ApolloError & {
        graphQLErrors: GraphQLError[];
        networkError: Error | null;
        errorResponse: GraphQLErrorResponse | null;
      };
    }
  ];

  /**
   * Enhanced useSubscription hook with strong typing for journey-specific operations
   * 
   * @template TOperation - The GraphQL operation type (from @austa/interfaces)
   * @template TVariables - The variables type for the operation
   * @param subscription - The GraphQL subscription document
   * @param options - The subscription options
   * @returns Strongly-typed subscription result
   */
  export function useSubscription<
    TOperation extends GraphQLOperation,
    TVariables extends GraphQLSubscriptionVariables = OperationVariables
  >(
    subscription: any,
    options?: SubscriptionHookOptions<GraphQLSubscriptionResult<TOperation>, TVariables>
  ): SubscriptionResult<GraphQLSubscriptionResult<TOperation>, TVariables> & {
    error: ApolloError & {
      graphQLErrors: GraphQLError[];
      networkError: Error | null;
      errorResponse: GraphQLErrorResponse | null;
    };
  };

  /**
   * Enhanced ApolloError type with strongly-typed GraphQL errors
   */
  export interface ApolloError {
    graphQLErrors: GraphQLError[];
    networkError: Error | null;
    errorResponse: GraphQLErrorResponse | null;
    message: string;
    extraInfo?: any;
  }

  /**
   * Enhanced QueryResult type with journey-specific operation typing
   */
  export interface QueryResult<TData, TVariables> {
    data?: TData;
    loading: boolean;
    error?: ApolloError;
    variables?: TVariables;
    refetch: (variables?: TVariables) => Promise<QueryResult<TData, TVariables>>;
    fetchMore: (options: { variables?: TVariables }) => Promise<QueryResult<TData, TVariables>>;
    networkStatus: number;
    client: ApolloClient<any>;
    called: boolean;
  }

  /**
   * Enhanced MutationResult type with journey-specific operation typing
   */
  export interface MutationResult<TData> {
    data?: TData;
    loading: boolean;
    error?: ApolloError;
    called: boolean;
    client: ApolloClient<any>;
    reset: () => void;
  }

  /**
   * Enhanced SubscriptionResult type with journey-specific operation typing
   */
  export interface SubscriptionResult<TData, TVariables> {
    data?: TData;
    loading: boolean;
    error?: ApolloError;
    variables?: TVariables;
  }
}

/**
 * Journey-specific type helpers for GraphQL operations
 */
declare global {
  namespace ApolloClientTypes {
    /**
     * Health journey GraphQL operation types
     */
    export namespace Health {
      export type Query<T extends keyof HealthGraphQLOperations['queries']> = 
        GraphQLQueryResult<HealthGraphQLOperations['queries'][T]>;
      
      export type QueryVariables<T extends keyof HealthGraphQLOperations['queries']> = 
        GraphQLQueryVariables & HealthGraphQLOperations['queries'][T]['variables'];
      
      export type Mutation<T extends keyof HealthGraphQLOperations['mutations']> = 
        GraphQLMutationResult<HealthGraphQLOperations['mutations'][T]>;
      
      export type MutationVariables<T extends keyof HealthGraphQLOperations['mutations']> = 
        GraphQLMutationVariables & HealthGraphQLOperations['mutations'][T]['variables'];
    }

    /**
     * Care journey GraphQL operation types
     */
    export namespace Care {
      export type Query<T extends keyof CareGraphQLOperations['queries']> = 
        GraphQLQueryResult<CareGraphQLOperations['queries'][T]>;
      
      export type QueryVariables<T extends keyof CareGraphQLOperations['queries']> = 
        GraphQLQueryVariables & CareGraphQLOperations['queries'][T]['variables'];
      
      export type Mutation<T extends keyof CareGraphQLOperations['mutations']> = 
        GraphQLMutationResult<CareGraphQLOperations['mutations'][T]>;
      
      export type MutationVariables<T extends keyof CareGraphQLOperations['mutations']> = 
        GraphQLMutationVariables & CareGraphQLOperations['mutations'][T]['variables'];
    }

    /**
     * Plan journey GraphQL operation types
     */
    export namespace Plan {
      export type Query<T extends keyof PlanGraphQLOperations['queries']> = 
        GraphQLQueryResult<PlanGraphQLOperations['queries'][T]>;
      
      export type QueryVariables<T extends keyof PlanGraphQLOperations['queries']> = 
        GraphQLQueryVariables & PlanGraphQLOperations['queries'][T]['variables'];
      
      export type Mutation<T extends keyof PlanGraphQLOperations['mutations']> = 
        GraphQLMutationResult<PlanGraphQLOperations['mutations'][T]>;
      
      export type MutationVariables<T extends keyof PlanGraphQLOperations['mutations']> = 
        GraphQLMutationVariables & PlanGraphQLOperations['mutations'][T]['variables'];
    }

    /**
     * Auth GraphQL operation types
     */
    export namespace Auth {
      export type Query<T extends keyof AuthGraphQLOperations['queries']> = 
        GraphQLQueryResult<AuthGraphQLOperations['queries'][T]>;
      
      export type QueryVariables<T extends keyof AuthGraphQLOperations['queries']> = 
        GraphQLQueryVariables & AuthGraphQLOperations['queries'][T]['variables'];
      
      export type Mutation<T extends keyof AuthGraphQLOperations['mutations']> = 
        GraphQLMutationResult<AuthGraphQLOperations['mutations'][T]>;
      
      export type MutationVariables<T extends keyof AuthGraphQLOperations['mutations']> = 
        GraphQLMutationVariables & AuthGraphQLOperations['mutations'][T]['variables'];
    }

    /**
     * Gamification GraphQL operation types
     */
    export namespace Gamification {
      export type Query<T extends keyof GamificationGraphQLOperations['queries']> = 
        GraphQLQueryResult<GamificationGraphQLOperations['queries'][T]>;
      
      export type QueryVariables<T extends keyof GamificationGraphQLOperations['queries']> = 
        GraphQLQueryVariables & GamificationGraphQLOperations['queries'][T]['variables'];
      
      export type Mutation<T extends keyof GamificationGraphQLOperations['mutations']> = 
        GraphQLMutationResult<GamificationGraphQLOperations['mutations'][T]>;
      
      export type MutationVariables<T extends keyof GamificationGraphQLOperations['mutations']> = 
        GraphQLMutationVariables & GamificationGraphQLOperations['mutations'][T]['variables'];
    }
  }
}