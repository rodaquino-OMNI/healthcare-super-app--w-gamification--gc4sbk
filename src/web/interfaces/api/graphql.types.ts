/**
 * GraphQL-specific TypeScript interfaces for the AUSTA SuperApp
 * 
 * This file defines interfaces for GraphQL operations, fragments, and Apollo Client
 * integration. It provides type safety for all GraphQL operations across the application.
 * 
 * These interfaces are used by Apollo Client throughout the application to ensure
 * type safety for all GraphQL operations, including queries, mutations, and fragments.
 */

import { TypedDocumentNode } from '@apollo/client';
import { DocumentNode, OperationDefinitionNode } from 'graphql';

// Re-export types from shared types for use in GraphQL operations
import {
  // Authentication types
  AuthSession, AuthState,
  
  // Health Journey types
  HealthMetric, MedicalEvent, HealthGoal, DeviceConnection, HealthMetricType,
  
  // Care Journey types
  Appointment, Medication, TelemedicineSession, TreatmentPlan,
  
  // Plan Journey types
  ClaimStatus, ClaimType, PlanType, CoverageType, Claim, Plan, Coverage, Benefit,
  
  // Gamification types
  Achievement, Quest, Reward, GameProfile,
  
  // Notification types
  NotificationType, NotificationChannel, NotificationStatus, NotificationPriority,
  Notification, NotificationPreference, JourneyNotificationPreference,
  SendNotificationRequest, NotificationTemplate, NotificationFilter,
  NotificationCount, AchievementNotificationData, LevelUpNotificationData,
  AppointmentReminderData, ClaimStatusUpdateData
} from '../..';

/**
 * Base GraphQL operation types
 */

/**
 * Base interface for all GraphQL operation variables
 */
export interface GraphQLVariables {
  [key: string]: any;
}

/**
 * Base interface for all GraphQL operation results
 */
export interface GraphQLResult {
  [key: string]: any;
}

/**
 * Interface for GraphQL pagination input
 */
export interface PaginationInput {
  offset?: number;
  limit?: number;
}

/**
 * Interface for GraphQL pagination metadata in responses
 */
export interface PaginationMeta {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface for paginated GraphQL responses
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Apollo Client specific types
 */

/**
 * Apollo error interface for GraphQL errors
 */
export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

/**
 * Apollo error interface for network errors
 */
export interface NetworkError extends Error {
  statusCode?: number;
  response?: any;
}

/**
 * Apollo operation context interface
 */
export interface ApolloContext {
  headers?: Record<string, string>;
  journeyContext?: 'health' | 'care' | 'plan' | 'home';
  authToken?: string;
  language?: string;
  deviceInfo?: {
    platform: 'web' | 'ios' | 'android';
    version: string;
    model?: string;
  };
  [key: string]: any;
}

/**
 * Apollo query result interface
 */
export interface ApolloQueryResult<T> {
  data: T | null;
  loading: boolean;
  error?: ApolloError;
  networkStatus?: number;
  stale?: boolean;
}

/**
 * Apollo mutation result interface
 */
export interface ApolloMutationResult<T> {
  data: T | null;
  loading: boolean;
  error?: ApolloError;
  called: boolean;
}

/**
 * Apollo error interface combining GraphQL and network errors
 */
export interface ApolloError {
  message: string;
  graphQLErrors: GraphQLError[];
  networkError: NetworkError | null;
  extraInfo?: any;
}

/**
 * Fragment types
 */

/**
 * Fragment reference interface for type-safe fragment usage
 */
export interface FragmentReference {
  readonly __fragmentName: string;
  readonly __fragments: { [fragmentName: string]: any };
}

/**
 * Fragment type interface for fragment matching
 */
export interface FragmentType<TFragment> {
  readonly __typename: string;
  readonly fragment: TFragment;
}

/**
 * Interface for possible types in fragment matching
 */
export interface PossibleTypesMap {
  [abstractType: string]: string[];
}

/**
 * Common fragments for health journey
 */
export interface HealthMetricFragment {
  id: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  userId: string;
  notes?: string;
  source?: string;
}

export interface HealthGoalFragment {
  id: string;
  metricType: HealthMetricType;
  targetValue: number;
  currentValue?: number;
  startDate: string;
  endDate?: string;
  status: string;
  userId: string;
}

export interface DeviceConnectionFragment {
  id: string;
  deviceType: string;
  deviceId: string;
  connectionStatus: string;
  lastSyncDate?: string;
  userId: string;
}

/**
 * Common fragments for care journey
 */
export interface AppointmentFragment {
  id: string;
  providerId: string;
  providerName: string;
  speciality?: string;
  date: string;
  duration: number;
  status: string;
  notes?: string;
  location?: string;
  userId: string;
}

export interface MedicationFragment {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: string;
  notes?: string;
  userId: string;
}

export interface TelemedicineSessionFragment {
  id: string;
  providerId: string;
  providerName: string;
  speciality?: string;
  startTime: string;
  endTime?: string;
  status: string;
  notes?: string;
  userId: string;
}

/**
 * Common fragments for plan journey
 */
export interface ClaimFragment {
  id: string;
  type: ClaimType;
  amount: number;
  date: string;
  status: ClaimStatus;
  description?: string;
  receiptUrl?: string;
  planId: string;
  userId: string;
}

export interface PlanFragment {
  id: string;
  type: PlanType;
  name: string;
  startDate: string;
  endDate?: string;
  status: string;
  userId: string;
}

export interface BenefitFragment {
  id: string;
  name: string;
  description: string;
  coverageType: CoverageType;
  coverageAmount: number;
  coveragePercentage?: number;
  annualLimit?: number;
  remainingLimit?: number;
  planId: string;
}

/**
 * Common fragments for gamification
 */
export interface AchievementFragment {
  id: string;
  title: string;
  description: string;
  points: number;
  iconUrl: string;
  unlockedAt?: string;
  journeyType: 'health' | 'care' | 'plan' | 'all';
  userId: string;
}

export interface QuestFragment {
  id: string;
  title: string;
  description: string;
  points: number;
  iconUrl: string;
  startDate?: string;
  endDate?: string;
  status: string;
  progress?: number;
  journeyType: 'health' | 'care' | 'plan' | 'all';
  userId: string;
}

export interface RewardFragment {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  iconUrl: string;
  expiryDate?: string;
  status: string;
  userId: string;
}

export interface GameProfileFragment {
  id: string;
  userId: string;
  level: number;
  currentXp: number;
  totalXp: number;
  nextLevelXp: number;
  achievements: number;
  quests: number;
  rewards: number;
}

/**
 * GraphQL operation types
 */

/**
 * Type for GraphQL query operations
 */
export type GraphQLQuery<TData = any, TVariables = GraphQLVariables> = TypedDocumentNode<TData, TVariables>;

/**
 * Type for GraphQL mutation operations
 */
export type GraphQLMutation<TData = any, TVariables = GraphQLVariables> = TypedDocumentNode<TData, TVariables>;

/**
 * Type for GraphQL subscription operations
 */
export type GraphQLSubscription<TData = any, TVariables = GraphQLVariables> = TypedDocumentNode<TData, TVariables>;

/**
 * Type for GraphQL fragment definitions
 */
export type GraphQLFragment<TData = any> = TypedDocumentNode<TData, any>;

/**
 * Common query result interfaces
 */

/**
 * Health journey query results
 */
export interface GetHealthMetricsQuery {
  healthMetrics: {
    items: HealthMetricFragment[];
    meta: PaginationMeta;
  };
}

export interface GetHealthGoalsQuery {
  healthGoals: {
    items: HealthGoalFragment[];
    meta: PaginationMeta;
  };
}

export interface GetDeviceConnectionsQuery {
  deviceConnections: {
    items: DeviceConnectionFragment[];
    meta: PaginationMeta;
  };
}

/**
 * Care journey query results
 */
export interface GetAppointmentsQuery {
  appointments: {
    items: AppointmentFragment[];
    meta: PaginationMeta;
  };
}

export interface GetMedicationsQuery {
  medications: {
    items: MedicationFragment[];
    meta: PaginationMeta;
  };
}

export interface GetTelemedicineSessionsQuery {
  telemedicineSessions: {
    items: TelemedicineSessionFragment[];
    meta: PaginationMeta;
  };
}

/**
 * Plan journey query results
 */
export interface GetClaimsQuery {
  claims: {
    items: ClaimFragment[];
    meta: PaginationMeta;
  };
}

export interface GetPlansQuery {
  plans: {
    items: PlanFragment[];
    meta: PaginationMeta;
  };
}

export interface GetBenefitsQuery {
  benefits: {
    items: BenefitFragment[];
    meta: PaginationMeta;
  };
}

/**
 * Gamification query results
 */
export interface GetAchievementsQuery {
  achievements: {
    items: AchievementFragment[];
    meta: PaginationMeta;
  };
}

export interface GetQuestsQuery {
  quests: {
    items: QuestFragment[];
    meta: PaginationMeta;
  };
}

export interface GetRewardsQuery {
  rewards: {
    items: RewardFragment[];
    meta: PaginationMeta;
  };
}

export interface GetGameProfileQuery {
  gameProfile: GameProfileFragment;
}

/**
 * Common mutation result interfaces
 */

/**
 * Health journey mutation results
 */
export interface AddHealthMetricMutation {
  addHealthMetric: HealthMetricFragment;
}

export interface UpdateHealthGoalMutation {
  updateHealthGoal: HealthGoalFragment;
}

export interface ConnectDeviceMutation {
  connectDevice: DeviceConnectionFragment;
}

/**
 * Care journey mutation results
 */
export interface BookAppointmentMutation {
  bookAppointment: AppointmentFragment;
}

export interface UpdateMedicationMutation {
  updateMedication: MedicationFragment;
}

export interface StartTelemedicineSessionMutation {
  startTelemedicineSession: TelemedicineSessionFragment;
}

/**
 * Plan journey mutation results
 */
export interface SubmitClaimMutation {
  submitClaim: ClaimFragment;
}

export interface UpdateClaimMutation {
  updateClaim: ClaimFragment;
}

/**
 * Gamification mutation results
 */
export interface ClaimRewardMutation {
  claimReward: RewardFragment;
}

export interface StartQuestMutation {
  startQuest: QuestFragment;
}

/**
 * Journey-specific operation result types
 */

/**
 * Health journey operation result types
 */
export interface HealthQueryResult<T> extends ApolloQueryResult<T> {
  refetch: (variables?: any) => Promise<ApolloQueryResult<T>>;
  fetchMore?: (options: { variables?: any; updateQuery?: any }) => Promise<ApolloQueryResult<T>>;
}

export interface HealthMutationResult<T> extends ApolloMutationResult<T> {
  reset: () => void;
}

/**
 * Health journey query variables
 */
export interface HealthMetricsQueryVariables extends GraphQLVariables {
  userId?: string;
  type?: HealthMetricType;
  startDate?: string;
  endDate?: string;
  pagination?: PaginationInput;
}

export interface HealthGoalsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  pagination?: PaginationInput;
}

export interface DeviceConnectionsQueryVariables extends GraphQLVariables {
  userId?: string;
  deviceType?: string;
  pagination?: PaginationInput;
}

/**
 * Health journey mutation variables
 */
export interface AddHealthMetricMutationVariables extends GraphQLVariables {
  metric: Omit<HealthMetric, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateHealthGoalMutationVariables extends GraphQLVariables {
  goalId: string;
  goal: Partial<Omit<HealthGoal, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface ConnectDeviceMutationVariables extends GraphQLVariables {
  connection: Omit<DeviceConnection, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * Care journey operation result types
 */
export interface CareQueryResult<T> extends ApolloQueryResult<T> {
  refetch: (variables?: any) => Promise<ApolloQueryResult<T>>;
  fetchMore?: (options: { variables?: any; updateQuery?: any }) => Promise<ApolloQueryResult<T>>;
}

export interface CareMutationResult<T> extends ApolloMutationResult<T> {
  reset: () => void;
}

/**
 * Care journey query variables
 */
export interface AppointmentsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  providerId?: string;
  pagination?: PaginationInput;
}

export interface MedicationsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  pagination?: PaginationInput;
}

export interface TelemedicineSessionsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  providerId?: string;
  pagination?: PaginationInput;
}

/**
 * Care journey mutation variables
 */
export interface BookAppointmentMutationVariables extends GraphQLVariables {
  appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateMedicationMutationVariables extends GraphQLVariables {
  medicationId: string;
  medication: Partial<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface StartTelemedicineSessionMutationVariables extends GraphQLVariables {
  session: Omit<TelemedicineSession, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * Plan journey operation result types
 */
export interface PlanQueryResult<T> extends ApolloQueryResult<T> {
  refetch: (variables?: any) => Promise<ApolloQueryResult<T>>;
  fetchMore?: (options: { variables?: any; updateQuery?: any }) => Promise<ApolloQueryResult<T>>;
}

export interface PlanMutationResult<T> extends ApolloMutationResult<T> {
  reset: () => void;
}

/**
 * Plan journey query variables
 */
export interface ClaimsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: ClaimStatus;
  type?: ClaimType;
  startDate?: string;
  endDate?: string;
  pagination?: PaginationInput;
}

export interface PlansQueryVariables extends GraphQLVariables {
  userId?: string;
  type?: PlanType;
  pagination?: PaginationInput;
}

export interface BenefitsQueryVariables extends GraphQLVariables {
  planId: string;
  pagination?: PaginationInput;
}

/**
 * Plan journey mutation variables
 */
export interface SubmitClaimMutationVariables extends GraphQLVariables {
  claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
}

export interface UpdateClaimMutationVariables extends GraphQLVariables {
  claimId: string;
  claim: Partial<Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Gamification operation result types
 */
export interface GamificationQueryResult<T> extends ApolloQueryResult<T> {
  refetch: (variables?: any) => Promise<ApolloQueryResult<T>>;
  fetchMore?: (options: { variables?: any; updateQuery?: any }) => Promise<ApolloQueryResult<T>>;
}

export interface GamificationMutationResult<T> extends ApolloMutationResult<T> {
  reset: () => void;
}

/**
 * Gamification query variables
 */
export interface AchievementsQueryVariables extends GraphQLVariables {
  userId?: string;
  journeyType?: 'health' | 'care' | 'plan' | 'all';
  pagination?: PaginationInput;
}

export interface QuestsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  journeyType?: 'health' | 'care' | 'plan' | 'all';
  pagination?: PaginationInput;
}

export interface RewardsQueryVariables extends GraphQLVariables {
  userId?: string;
  status?: string;
  pagination?: PaginationInput;
}

export interface GameProfileQueryVariables extends GraphQLVariables {
  userId?: string;
}

/**
 * Gamification mutation variables
 */
export interface ClaimRewardMutationVariables extends GraphQLVariables {
  rewardId: string;
  userId?: string;
}

export interface StartQuestMutationVariables extends GraphQLVariables {
  questId: string;
  userId?: string;
}

/**
 * Utility types for GraphQL code generation
 */

/**
 * Type for extracting operation name from a GraphQL document
 */
export type GetOperationName<T extends DocumentNode> = T extends { definitions: Array<infer U> }
  ? U extends OperationDefinitionNode
    ? U['name'] extends { value: infer V }
      ? V
      : never
    : never
  : never;

/**
 * Type for extracting operation type from a GraphQL document
 */
export type GetOperationType<T extends DocumentNode> = T extends { definitions: Array<infer U> }
  ? U extends OperationDefinitionNode
    ? U['operation']
    : never
  : never;

/**
 * Type for extracting variables from a GraphQL operation
 */
export type GetVariables<T extends TypedDocumentNode<any, any>> = T extends TypedDocumentNode<any, infer V> ? V : never;

/**
 * Type for extracting data from a GraphQL operation
 */
export type GetData<T extends TypedDocumentNode<any, any>> = T extends TypedDocumentNode<infer D, any> ? D : never;

/**
 * Type for creating a typed hook result
 */
export type HookResult<TData, TVariables> = {
  data?: TData;
  loading: boolean;
  error?: ApolloError;
  variables?: TVariables;
  refetch: (variables?: Partial<TVariables>) => Promise<ApolloQueryResult<TData>>;
  fetchMore: (options: { variables?: Partial<TVariables>; updateQuery?: any }) => Promise<ApolloQueryResult<TData>>;
  networkStatus: number;
  client: any;
  previousData?: TData;
  startPolling: (pollInterval: number) => void;
  stopPolling: () => void;
  subscribeToMore: (options: any) => () => void;
  updateQuery: (updaterFn: (prev: TData, options: { variables?: TVariables }) => TData) => void;
};

/**
 * Type for creating a typed mutation hook result
 */
export type MutationHookResult<TData, TVariables> = {
  data?: TData;
  loading: boolean;
  error?: ApolloError;
  called: boolean;
  reset: () => void;
  client: any;
  executeMutation: (variables?: TVariables) => Promise<ApolloMutationResult<TData>>;
};

/**
 * Type for creating a typed fragment hook result
 */
export type FragmentHookResult<TData> = {
  data?: TData;
  complete: boolean;
};

/**
 * Type for creating a typed subscription hook result
 */
export type SubscriptionHookResult<TData> = {
  data?: TData;
  loading: boolean;
  error?: ApolloError;
};

/**
 * Network status codes used by Apollo Client
 */
export enum NetworkStatus {
  loading = 1,
  setVariables = 2,
  fetchMore = 3,
  refetch = 4,
  poll = 6,
  ready = 7,
  error = 8,
}

/**
 * Type for Apollo Client cache shape
 */
export interface ApolloCache<T> {
  read<QueryType, TVariables>(options: { query: GraphQLQuery<QueryType, TVariables>; variables?: TVariables }): QueryType;
  write<QueryType, TVariables>(options: { query: GraphQLQuery<QueryType, TVariables>; variables?: TVariables; data: QueryType }): void;
  modify(options: { id?: string; fields: Record<string, any> }): boolean;
  readFragment<FragmentType, TVariables>(options: { fragment: GraphQLFragment<FragmentType>; id: string; variables?: TVariables }): FragmentType | null;
  writeFragment<FragmentType, TVariables>(options: { fragment: GraphQLFragment<FragmentType>; id: string; variables?: TVariables; data: FragmentType }): void;
  evict(options: { id?: string; fieldName?: string; broadcast?: boolean }): boolean;
  reset(): Promise<void>;
  gc(): string[];
  identify(object: T): string | undefined;
  extract(optimistic?: boolean): Record<string, any>;
  restore(serializedState: Record<string, any>): ApolloCache<T>;
  removeOptimistic(id: string): void;
}

/**
 * Type for Apollo Client cache policies
 */
export interface CachePolicy {
  fetch?: boolean;
  cache?: boolean;
}

/**
 * Type for Apollo Client error policies
 */
export type ErrorPolicy = 'none' | 'ignore' | 'all';

/**
 * Type for Apollo Client fetch policies
 */
export type FetchPolicy = 
  | 'cache-first' 
  | 'network-only' 
  | 'cache-only' 
  | 'no-cache' 
  | 'standby' 
  | 'cache-and-network';