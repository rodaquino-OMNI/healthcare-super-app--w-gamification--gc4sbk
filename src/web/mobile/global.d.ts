/**
 * Global type declarations for the AUSTA SuperApp mobile application
 * 
 * This file centralizes type definitions for React Native globals, module augmentations,
 * and simulated web interfaces to ensure type safety across the mobile application.
 * Compatible with React Native 0.73.4 and TypeScript 5.3.3
 */

// React Native global __DEV__ variable for development mode detection
// This is automatically set by the React Native environment
declare const __DEV__: boolean;

// Add module declarations for the new design system packages
declare module '@austa/design-system' {
  // Re-export all components from the design system
  export * from '@austa/design-system/components';
  export * from '@austa/design-system/health';
  export * from '@austa/design-system/care';
  export * from '@austa/design-system/plan';
  export * from '@austa/design-system/gamification';
  export * from '@austa/design-system/charts';
  export * from '@austa/design-system/themes';
}

declare module '@design-system/primitives' {
  // Design tokens
  export * from '@design-system/primitives/tokens';
  
  // Primitive components
  export * from '@design-system/primitives/components/Box';
  export * from '@design-system/primitives/components/Text';
  export * from '@design-system/primitives/components/Stack';
  export * from '@design-system/primitives/components/Icon';
  export * from '@design-system/primitives/components/Touchable';
}

declare module '@austa/interfaces' {
  // Common interfaces
  export * from '@austa/interfaces/common';
  
  // Journey-specific interfaces
  export * from '@austa/interfaces/health';
  export * from '@austa/interfaces/care';
  export * from '@austa/interfaces/plan';
  export * from '@austa/interfaces/gamification';
  
  // Component interfaces
  export * from '@austa/interfaces/components';
  
  // Theme interfaces
  export * from '@austa/interfaces/themes';
  
  // Auth interfaces
  export * from '@austa/interfaces/auth';
  
  // API interfaces
  export * from '@austa/interfaces/api';
  
  // Notification interfaces
  export * from '@austa/interfaces/notification';
}

declare module '@austa/journey-context' {
  // Context providers
  export * from '@austa/journey-context/providers';
  
  // Hooks
  export * from '@austa/journey-context/hooks';
  
  // Utilities
  export * from '@austa/journey-context/utils';
  
  // Storage adapters
  export * from '@austa/journey-context/storage';
  
  // Platform-specific adapters
  export * from '@austa/journey-context/adapters/mobile';
  
  // Types
  export * from '@austa/journey-context/types';
  
  // Constants
  export * from '@austa/journey-context/constants';
}

// Enhanced Apollo Client declarations to match version 3.8.10
declare module '@apollo/client' {
  // Core types
  export interface DefaultOptions {
    watchQuery?: WatchQueryOptions;
    query?: QueryOptions;
    mutate?: MutationOptions;
  }

  export interface WatchQueryOptions {
    fetchPolicy?: WatchQueryFetchPolicy;
    errorPolicy?: ErrorPolicy;
    nextFetchPolicy?: WatchQueryFetchPolicy;
    notifyOnNetworkStatusChange?: boolean;
    context?: Record<string, any>;
  }

  export interface QueryOptions {
    fetchPolicy?: QueryFetchPolicy;
    errorPolicy?: ErrorPolicy;
    notifyOnNetworkStatusChange?: boolean;
    context?: Record<string, any>;
  }

  export interface MutationOptions {
    errorPolicy?: ErrorPolicy;
    context?: Record<string, any>;
    fetchPolicy?: Extract<FetchPolicy, 'no-cache'>;
    optimisticResponse?: Record<string, any>;
    refetchQueries?: Array<string | { query: any; variables?: any }>;
    awaitRefetchQueries?: boolean;
    update?: (cache: any, result: any) => void;
  }

  // Fetch policies
  export type FetchPolicy = 
    | 'cache-first' 
    | 'network-only' 
    | 'cache-only' 
    | 'no-cache' 
    | 'standby';
  
  export type WatchQueryFetchPolicy = 
    | FetchPolicy 
    | 'cache-and-network';
  
  export type QueryFetchPolicy = 
    | FetchPolicy 
    | 'cache-and-network';
  
  export type ErrorPolicy = 
    | 'none' 
    | 'ignore' 
    | 'all';

  // Cache
  export interface InMemoryCacheConfig {
    typePolicies?: Record<string, any>;
    possibleTypes?: Record<string, string[]>;
    resultCaching?: boolean;
  }

  export class InMemoryCache {
    constructor(config?: InMemoryCacheConfig);
    extract(optimistic?: boolean): Record<string, any>;
    restore(data: Record<string, any>): this;
    readQuery(options: any): any;
    writeQuery(options: any): any;
    readFragment(options: any): any;
    writeFragment(options: any): any;
    reset(): Promise<void>;
  }

  // Client
  export interface ApolloClientOptions<TCacheShape> {
    uri?: string;
    link: any;
    cache: any;
    ssrMode?: boolean;
    ssrForceFetchDelay?: number;
    connectToDevTools?: boolean;
    queryDeduplication?: boolean;
    defaultOptions?: DefaultOptions;
    assumeImmutableResults?: boolean;
    name?: string;
    version?: string;
  }

  export class ApolloClient<TCacheShape = any> {
    constructor(options: ApolloClientOptions<TCacheShape>);
    query(options: any): Promise<any>;
    mutate(options: any): Promise<any>;
    readQuery(options: any): any;
    readFragment(options: any): any;
    writeQuery(options: any): any;
    writeFragment(options: any): any;
    resetStore(): Promise<any>;
    clearStore(): Promise<any>;
    onResetStore(cb: () => Promise<any>): () => void;
    onClearStore(cb: () => Promise<any>): () => void;
    stop(): void;
    reFetchObservableQueries(): Promise<any>;
  }

  // Hooks
  export function useQuery<TData = any, TVariables = any>(query: any, options?: any): any;
  export function useLazyQuery<TData = any, TVariables = any>(query: any, options?: any): any;
  export function useMutation<TData = any, TVariables = any>(mutation: any, options?: any): any;
  export function useSubscription<TData = any, TVariables = any>(subscription: any, options?: any): any;
  export function useApolloClient(): ApolloClient<any>;
}

// Apollo Upload Client for file uploads
declare module 'apollo-upload-client' {
  export interface CreateUploadLinkOptions {
    uri: string;
    credentials?: string;
    headers?: Record<string, string>;
    fetch?: any;
    includeExtensions?: boolean;
    isExtractableFile?: (value: any) => boolean;
    FormData?: any;
    formDataAppendFile?: (formData: any, name: string, file: any) => void;
  }

  export function createUploadLink(options: CreateUploadLinkOptions): any;
}

// React Native Gesture Handler - compatible with React Native 0.73.4
declare module 'react-native-gesture-handler' {
  export * from 'react-native-gesture-handler/lib/typescript/handlers/gestureHandlers';
  export * from 'react-native-gesture-handler/lib/typescript/components/GestureComponents';
  export * from 'react-native-gesture-handler/lib/typescript/components/touchables';
}

// React Native SVG - for design system components
declare module 'react-native-svg' {
  import { ComponentClass, ReactNode } from 'react';
  import { ViewProps } from 'react-native';

  export interface SvgProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    preserveAspectRatio?: string;
    color?: string;
    title?: string;
  }

  export type PathProps = {
    d: string;
    fill?: string;
    fillOpacity?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeOpacity?: number | string;
    strokeLinecap?: 'butt' | 'square' | 'round';
    strokeLinejoin?: 'miter' | 'bevel' | 'round';
  };

  export const Svg: ComponentClass<SvgProps>;
  export const Path: ComponentClass<PathProps>;
  export const Circle: ComponentClass<any>;
  export const Rect: ComponentClass<any>;
  export const G: ComponentClass<any>;
  export const Text: ComponentClass<any>;
  export const Line: ComponentClass<any>;
  export const Defs: ComponentClass<any>;
  export const LinearGradient: ComponentClass<any>;
  export const RadialGradient: ComponentClass<any>;
  export const Stop: ComponentClass<any>;
  export const ClipPath: ComponentClass<any>;
}

// Enhanced localStorage emulation for React Native environment
// This provides web-compatible storage APIs in the React Native context
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  length: number;
  [key: string]: any;
}

// Properly augment the global scope for React Native environment
// This follows TypeScript best practices for global augmentation
declare global {
  // Add localStorage to global scope for mobile
  var localStorage: Storage;
  
  // Add sessionStorage to global scope for mobile
  var sessionStorage: Storage;
  
  // Add window.location for compatibility with web code
  interface Location {
    href: string;
    origin: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
  }
  
  interface Window {
    location: Location;
    localStorage: Storage;
    sessionStorage: Storage;
  }
  
  var window: Window;
  var location: Location;
  
  // Add __DEV__ to the NodeJS namespace for better type compatibility
  namespace NodeJS {
    interface Global {
      __DEV__: boolean;
      localStorage: Storage;
      sessionStorage: Storage;
      window: Window;
      location: Location;
    }
  }
}

export {};