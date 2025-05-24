/**
 * Global type declarations for the AUSTA SuperApp mobile application
 * Updated for React Native 0.73.4 and TypeScript 5.3.3
 */

// React Native global __DEV__ variable
declare const __DEV__: boolean;

// Type declarations for new design system packages
declare module '@austa/design-system' {
  import { ReactNode } from 'react';
  import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
  
  // Common prop types
  export interface BaseProps {
    testID?: string;
    style?: ViewStyle;
  }
  
  // Theme interfaces
  export interface ThemeProps {
    theme?: Theme;
    journey?: 'health' | 'care' | 'plan';
  }
  
  export interface Theme {
    colors: Record<string, string>;
    typography: Record<string, TextStyle>;
    spacing: Record<string, number>;
    shadows: Record<string, object>;
    borderRadius: Record<string, number>;
  }
  
  // Component exports
  export function useTheme(): Theme;
  export function ThemeProvider(props: { theme?: Theme; children: ReactNode }): JSX.Element;
  export function JourneyThemeProvider(props: { journey: 'health' | 'care' | 'plan'; children: ReactNode }): JSX.Element;
}

declare module '@design-system/primitives' {
  import { ReactNode } from 'react';
  import { ViewStyle, TextStyle, ViewProps, TextProps, TouchableOpacityProps } from 'react-native';
  
  // Design tokens
  export const colors: Record<string, string>;
  export const typography: Record<string, TextStyle>;
  export const spacing: Record<string, number>;
  export const shadows: Record<string, object>;
  export const borderRadius: Record<string, number>;
  
  // Primitive components
  export interface BoxProps extends ViewProps {
    padding?: number | string;
    margin?: number | string;
    backgroundColor?: string;
    borderRadius?: number | string;
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    width?: number | string;
    height?: number | string;
    shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  }
  
  export interface TextProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-sm' | 'caption' | 'button';
    color?: string;
    align?: 'left' | 'center' | 'right';
    weight?: 'normal' | 'bold' | 'semibold' | 'light';
    numberOfLines?: number;
  }
  
  export interface StackProps extends BoxProps {
    spacing?: number | string;
    direction?: 'row' | 'column';
    wrap?: boolean;
  }
  
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: ViewStyle;
  }
  
  export interface TouchableProps extends TouchableOpacityProps {
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
  }
  
  export function Box(props: BoxProps): JSX.Element;
  export function Text(props: TextProps): JSX.Element;
  export function Stack(props: StackProps): JSX.Element;
  export function Icon(props: IconProps): JSX.Element;
  export function Touchable(props: TouchableProps): JSX.Element;
}

declare module '@austa/interfaces' {
  // Common interfaces
  export interface User {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  }
  
  // Auth interfaces
  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: Error | null;
  }
  
  // Journey interfaces
  export interface JourneyState {
    activeJourney: 'health' | 'care' | 'plan' | null;
    previousJourney: 'health' | 'care' | 'plan' | null;
  }
  
  // Health journey interfaces
  export interface HealthMetric {
    id: string;
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    userId: string;
  }
  
  export interface HealthGoal {
    id: string;
    type: string;
    target: number;
    unit: string;
    currentValue: number;
    startDate: string;
    endDate: string;
    userId: string;
  }
  
  // Care journey interfaces
  export interface Appointment {
    id: string;
    providerId: string;
    userId: string;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    type: 'in-person' | 'telemedicine';
    notes?: string;
  }
  
  // Plan journey interfaces
  export interface InsuranceClaim {
    id: string;
    userId: string;
    type: string;
    amount: number;
    date: string;
    status: 'submitted' | 'in-review' | 'approved' | 'rejected';
    documents?: string[];
  }
  
  // Gamification interfaces
  export interface Achievement {
    id: string;
    title: string;
    description: string;
    xpValue: number;
    icon: string;
    unlockedAt?: string;
    progress?: number;
    isUnlocked: boolean;
  }
}

declare module '@austa/journey-context' {
  import { ReactNode } from 'react';
  import { User, JourneyState, HealthMetric, HealthGoal, Appointment, InsuranceClaim, Achievement } from '@austa/interfaces';
  
  // Context providers
  export function AuthProvider(props: { children: ReactNode }): JSX.Element;
  export function JourneyProvider(props: { children: ReactNode }): JSX.Element;
  export function GamificationProvider(props: { children: ReactNode }): JSX.Element;
  export function NotificationProvider(props: { children: ReactNode }): JSX.Element;
  
  // Context hooks
  export function useAuth(): {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
  };
  
  export function useJourney(): {
    activeJourney: 'health' | 'care' | 'plan' | null;
    setActiveJourney: (journey: 'health' | 'care' | 'plan') => void;
    previousJourney: 'health' | 'care' | 'plan' | null;
    journeyState: JourneyState;
  };
  
  export function useGamification(): {
    achievements: Achievement[];
    xp: number;
    level: number;
    unlockAchievement: (achievementId: string) => Promise<void>;
    trackEvent: (eventType: string, eventData: any) => Promise<void>;
  };
  
  export function useNotifications(): {
    notifications: any[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
  };
  
  // Journey-specific hooks
  export function useHealthJourney(): {
    metrics: HealthMetric[];
    goals: HealthGoal[];
    addMetric: (metric: Omit<HealthMetric, 'id' | 'userId'>) => Promise<void>;
    addGoal: (goal: Omit<HealthGoal, 'id' | 'userId'>) => Promise<void>;
    loading: boolean;
    error: Error | null;
  };
  
  export function useCareJourney(): {
    appointments: Appointment[];
    scheduleAppointment: (appointment: Omit<Appointment, 'id' | 'userId'>) => Promise<void>;
    cancelAppointment: (appointmentId: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
  };
  
  export function usePlanJourney(): {
    claims: InsuranceClaim[];
    submitClaim: (claim: Omit<InsuranceClaim, 'id' | 'userId'>) => Promise<void>;
    loading: boolean;
    error: Error | null;
  };
}

// Enhanced Apollo Client type definitions for v3.8.10
declare module '@apollo/client' {
  import { DocumentNode } from 'graphql';
  import { ReactNode } from 'react';
  
  // Client options
  export interface DefaultOptions {
    watchQuery?: WatchQueryOptions;
    query?: QueryOptions;
    mutate?: MutationOptions;
    subscription?: SubscriptionOptions;
  }
  
  // Fetch policies
  export type FetchPolicy = 
    | 'cache-first' 
    | 'network-only' 
    | 'cache-only' 
    | 'no-cache' 
    | 'standby' 
    | 'cache-and-network';
  
  export type ErrorPolicy = 'none' | 'ignore' | 'all';
  
  // Operation options
  export interface WatchQueryOptions {
    query?: DocumentNode;
    variables?: Record<string, any>;
    fetchPolicy?: FetchPolicy;
    errorPolicy?: ErrorPolicy;
    context?: Record<string, any>;
    notifyOnNetworkStatusChange?: boolean;
    returnPartialData?: boolean;
    pollInterval?: number;
  }
  
  export interface QueryOptions {
    query?: DocumentNode;
    variables?: Record<string, any>;
    fetchPolicy?: FetchPolicy;
    errorPolicy?: ErrorPolicy;
    context?: Record<string, any>;
    notifyOnNetworkStatusChange?: boolean;
    returnPartialData?: boolean;
  }
  
  export interface MutationOptions {
    mutation?: DocumentNode;
    variables?: Record<string, any>;
    optimisticResponse?: Record<string, any>;
    refetchQueries?: Array<string | { query: DocumentNode; variables?: Record<string, any> }>;
    awaitRefetchQueries?: boolean;
    errorPolicy?: ErrorPolicy;
    context?: Record<string, any>;
    update?: (cache: any, result: any) => void;
    onCompleted?: (data: any) => void;
    onError?: (error: any) => void;
  }
  
  export interface SubscriptionOptions {
    query?: DocumentNode;
    variables?: Record<string, any>;
    fetchPolicy?: FetchPolicy;
    errorPolicy?: ErrorPolicy;
    context?: Record<string, any>;
  }
  
  // Cache
  export interface InMemoryCacheConfig {
    typePolicies?: Record<string, any>;
    possibleTypes?: Record<string, string[]>;
    resultCaching?: boolean;
    addTypename?: boolean;
  }
  
  export class InMemoryCache {
    constructor(config?: InMemoryCacheConfig);
    extract(optimistic?: boolean): Record<string, any>;
    restore(data: Record<string, any>): this;
    readQuery(options: { query: DocumentNode; variables?: Record<string, any> }): any;
    writeQuery(options: { query: DocumentNode; variables?: Record<string, any>; data: any }): void;
    readFragment(options: { id: string; fragment: DocumentNode; fragmentName?: string; variables?: Record<string, any> }): any;
    writeFragment(options: { id: string; fragment: DocumentNode; fragmentName?: string; variables?: Record<string, any>; data: any }): void;
    modify(options: { id?: string; fields: Record<string, (value: any, details: any) => any> }): boolean;
    gc(): string[];
    reset(): Promise<void>;
    evict(options: { id?: string; fieldName?: string; args?: Record<string, any> }): boolean;
  }
  
  // Client
  export interface ApolloClientOptions<TCacheShape> {
    uri?: string;
    credentials?: string;
    headers?: Record<string, string>;
    link?: any;
    cache: any;
    ssrMode?: boolean;
    ssrForceFetchDelay?: number;
    connectToDevTools?: boolean;
    queryDeduplication?: boolean;
    defaultOptions?: DefaultOptions;
    assumeImmutableResults?: boolean;
    resolvers?: any;
    typeDefs?: string | string[] | DocumentNode | DocumentNode[];
    name?: string;
    version?: string;
  }
  
  export class ApolloClient<TCacheShape> {
    constructor(options: ApolloClientOptions<TCacheShape>);
    watchQuery<T = any, TVariables = Record<string, any>>(options: WatchQueryOptions & { variables?: TVariables }): any;
    query<T = any, TVariables = Record<string, any>>(options: QueryOptions & { variables?: TVariables }): Promise<{ data: T }>;
    mutate<T = any, TVariables = Record<string, any>>(options: MutationOptions & { variables?: TVariables }): Promise<{ data: T }>;
    subscribe<T = any, TVariables = Record<string, any>>(options: SubscriptionOptions & { variables?: TVariables }): any;
    readQuery<T = any, TVariables = Record<string, any>>(options: { query: DocumentNode; variables?: TVariables }): T | null;
    readFragment<T = any, TVariables = Record<string, any>>(options: { id: string; fragment: DocumentNode; fragmentName?: string; variables?: TVariables }): T | null;
    writeQuery<TData = any, TVariables = Record<string, any>>(options: { query: DocumentNode; variables?: TVariables; data: TData }): void;
    writeFragment<TData = any, TVariables = Record<string, any>>(options: { id: string; fragment: DocumentNode; fragmentName?: string; variables?: TVariables; data: TData }): void;
    resetStore(): Promise<void>;
    clearStore(): Promise<void>;
    onResetStore(cb: () => Promise<any>): () => void;
    onClearStore(cb: () => Promise<any>): () => void;
    stop(): void;
    reFetchObservableQueries(includeStandby?: boolean): Promise<void>;
  }
  
  // Provider
  export interface ApolloProviderProps<TCacheShape> {
    client: ApolloClient<TCacheShape>;
    children: ReactNode;
  }
  
  export function ApolloProvider<TCacheShape = any>(props: ApolloProviderProps<TCacheShape>): JSX.Element;
  
  // Hooks
  export function useQuery<TData = any, TVariables = Record<string, any>>(query: DocumentNode, options?: QueryOptions & { variables?: TVariables }): {
    data?: TData;
    loading: boolean;
    error?: any;
    refetch: (variables?: TVariables) => Promise<{ data: TData }>;
    fetchMore: (options: { variables?: TVariables; updateQuery?: (previousResult: TData, options: { fetchMoreResult: TData; variables: TVariables }) => TData }) => Promise<{ data: TData }>;
    networkStatus: number;
    client: ApolloClient<any>;
  };
  
  export function useMutation<TData = any, TVariables = Record<string, any>>(mutation: DocumentNode, options?: MutationOptions & { variables?: TVariables }): [
    (variables?: TVariables, options?: MutationOptions) => Promise<{ data: TData }>,
    {
      data?: TData;
      loading: boolean;
      error?: any;
      called: boolean;
      client: ApolloClient<any>;
      reset: () => void;
    }
  ];
  
  export function useLazyQuery<TData = any, TVariables = Record<string, any>>(query: DocumentNode, options?: QueryOptions & { variables?: TVariables }): [
    (variables?: TVariables, options?: QueryOptions) => void,
    {
      data?: TData;
      loading: boolean;
      error?: any;
      called: boolean;
      client: ApolloClient<any>;
    }
  ];
  
  export function useSubscription<TData = any, TVariables = Record<string, any>>(subscription: DocumentNode, options?: SubscriptionOptions & { variables?: TVariables }): {
    data?: TData;
    loading: boolean;
    error?: any;
  };
}

// Enhanced apollo-upload-client type definitions
declare module 'apollo-upload-client' {
  import { ApolloLink } from '@apollo/client';
  
  export interface CreateUploadLinkOptions {
    uri: string;
    fetch?: any;
    fetchOptions?: Record<string, any>;
    credentials?: string;
    headers?: Record<string, string>;
    includeExtensions?: boolean;
  }
  
  export function createUploadLink(options: CreateUploadLinkOptions): ApolloLink;
}

// Enhanced localStorage type emulation for React Native environment
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  length: number;
}

declare global {
  // Add localStorage to global scope for mobile
  var localStorage: Storage;
  
  // Add window.matchMedia for React Native environment
  interface Window {
    matchMedia(query: string): {
      matches: boolean;
      addListener: (listener: (event: { matches: boolean }) => void) => void;
      removeListener: (listener: (event: { matches: boolean }) => void) => void;
    };
  }
}

export {};