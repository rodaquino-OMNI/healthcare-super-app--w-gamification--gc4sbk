/**
 * Type definitions for Next.js page components in the AUSTA SuperApp
 * 
 * This file provides TypeScript declarations for page props, static generation functions
 * (getStaticProps, getStaticPaths), and server-side rendering functions (getServerSideProps),
 * ensuring type consistency across all journey pages.
 *
 * @module @austa/interfaces/next/next-page
 */

import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { GetStaticPropsContext, GetStaticPropsResult, GetStaticPathsContext, GetStaticPathsResult, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { ParsedUrlQuery } from 'querystring';

import type { JourneyId } from '@austa/journey-context';

/**
 * Journey-specific page props interface
 * Extends standard Next.js page props with journey-specific data
 */
export interface JourneyPageProps {
  /**
   * Current journey ID
   */
  journeyId?: JourneyId;
  
  /**
   * Whether the page requires authentication
   * @default true
   */
  requiresAuth?: boolean;
  
  /**
   * Required roles for accessing the page
   */
  requiredRoles?: string[];
  
  /**
   * Error information if page failed to load
   */
  error?: {
    /**
     * Error status code
     */
    statusCode: number;
    
    /**
     * Error message
     */
    message: string;
  };
}

/**
 * Extended Next.js Page type with journey-specific props
 */
export type AustaNextPage<P = {}, IP = P> = NextPage<P & JourneyPageProps, IP> & {
  /**
   * Journey ID associated with this page
   */
  journeyId?: JourneyId;
  
  /**
   * Whether the page requires authentication
   * @default true
   */
  requiresAuth?: boolean;
  
  /**
   * Required roles for accessing the page
   */
  requiredRoles?: string[];
  
  /**
   * Layout component to use for this page
   */
  Layout?: React.ComponentType<{ children: React.ReactNode }>;
};

/**
 * Extended AppProps with journey-specific page component
 */
export type AustaAppProps = AppProps & {
  Component: AustaNextPage;
};

/**
 * Extended GetStaticPropsContext with journey-specific context
 */
export interface AustaGetStaticPropsContext<Q extends ParsedUrlQuery = ParsedUrlQuery> extends GetStaticPropsContext<Q> {
  /**
   * Current journey ID derived from the page path
   */
  journeyId?: JourneyId;
}

/**
 * Extended GetStaticPropsResult with journey-specific props
 */
export type AustaGetStaticPropsResult<P = {}> = GetStaticPropsResult<P & JourneyPageProps>;

/**
 * Journey-aware getStaticProps function type
 */
export type AustaGetStaticProps<
  P extends JourneyPageProps = JourneyPageProps,
  Q extends ParsedUrlQuery = ParsedUrlQuery
> = (
  context: AustaGetStaticPropsContext<Q>
) => Promise<AustaGetStaticPropsResult<P>> | AustaGetStaticPropsResult<P>;

/**
 * Extended GetStaticPathsContext with journey-specific context
 */
export interface AustaGetStaticPathsContext extends GetStaticPathsContext {
  /**
   * Current journey ID for path generation
   */
  journeyId?: JourneyId;
}

/**
 * Journey-aware getStaticPaths function type
 */
export type AustaGetStaticPaths<Q extends ParsedUrlQuery = ParsedUrlQuery> = (
  context: AustaGetStaticPathsContext
) => Promise<GetStaticPathsResult<Q>> | GetStaticPathsResult<Q>;

/**
 * Extended GetServerSidePropsContext with journey-specific context
 */
export interface AustaGetServerSidePropsContext<Q extends ParsedUrlQuery = ParsedUrlQuery> extends GetServerSidePropsContext<Q> {
  /**
   * Current journey ID derived from the page path
   */
  journeyId?: JourneyId;
  
  /**
   * Authentication information if available
   */
  auth?: {
    /**
     * Whether the user is authenticated
     */
    isAuthenticated: boolean;
    
    /**
     * User ID if authenticated
     */
    userId?: string;
    
    /**
     * User roles if authenticated
     */
    roles?: string[];
  };
}

/**
 * Extended GetServerSidePropsResult with journey-specific props
 */
export type AustaGetServerSidePropsResult<P = {}> = GetServerSidePropsResult<P & JourneyPageProps>;

/**
 * Journey-aware getServerSideProps function type
 */
export type AustaGetServerSideProps<
  P extends JourneyPageProps = JourneyPageProps,
  Q extends ParsedUrlQuery = ParsedUrlQuery
> = (
  context: AustaGetServerSidePropsContext<Q>
) => Promise<AustaGetServerSidePropsResult<P>> | AustaGetServerSidePropsResult<P>;

/**
 * Helper type for journey-specific page components
 */
export type JourneyPage<P = {}> = AustaNextPage<P & JourneyPageProps>;

/**
 * Helper type for health journey page components
 */
export type HealthJourneyPage<P = {}> = JourneyPage<P> & {
  journeyId: 'health';
};

/**
 * Helper type for care journey page components
 */
export type CareJourneyPage<P = {}> = JourneyPage<P> & {
  journeyId: 'care';
};

/**
 * Helper type for plan journey page components
 */
export type PlanJourneyPage<P = {}> = JourneyPage<P> & {
  journeyId: 'plan';
};

/**
 * Helper type for home page components
 */
export type HomePage<P = {}> = JourneyPage<P> & {
  journeyId: 'home';
};

/**
 * Helper type for authentication page components
 */
export type AuthPage<P = {}> = JourneyPage<P> & {
  journeyId: 'auth';
  requiresAuth: false;
};

/**
 * Type for validating API request data in getServerSideProps
 */
export interface ApiValidationOptions<T> {
  /**
   * Schema for validating request data
   */
  schema: {
    /**
     * Validate function that returns validated data or throws an error
     */
    validate: (data: unknown) => T;
  };
  
  /**
   * Source of data to validate
   * @default 'query'
   */
  source?: 'query' | 'body' | 'cookies' | 'headers';
  
  /**
   * Error handler function
   */
  onError?: (error: Error) => AustaGetServerSidePropsResult;
}

/**
 * Helper function type for validating API request data
 */
export type ValidateApiRequest = <T>(
  context: AustaGetServerSidePropsContext,
  options: ApiValidationOptions<T>
) => Promise<T | null>;

/**
 * Helper function type for redirecting to login page
 */
export type RedirectToLogin = (
  context: AustaGetServerSidePropsContext,
  options?: {
    /**
     * Redirect destination after login
     * @default current URL
     */
    callbackUrl?: string;
    
    /**
     * Whether to preserve query parameters
     * @default true
     */
    preserveQuery?: boolean;
  }
) => AustaGetServerSidePropsResult;

/**
 * Helper function type for checking authentication
 */
export type CheckAuthentication = (
  context: AustaGetServerSidePropsContext,
  options?: {
    /**
     * Required roles for accessing the page
     */
    requiredRoles?: string[];
    
    /**
     * Redirect URL if authentication fails
     * @default '/login'
     */
    redirectTo?: string;
    
    /**
     * Whether to preserve query parameters
     * @default true
     */
    preserveQuery?: boolean;
  }
) => Promise<{
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * User ID if authenticated
   */
  userId?: string;
  
  /**
   * User roles if authenticated
   */
  roles?: string[];
  
  /**
   * Redirect result if authentication fails
   */
  redirectResult?: AustaGetServerSidePropsResult;
}>;

/**
 * Helper function type for getting journey context
 */
export type GetJourneyContext = (
  context: AustaGetServerSidePropsContext | AustaGetStaticPropsContext
) => {
  /**
   * Current journey ID
   */
  journeyId: JourneyId;
  
  /**
   * Whether the journey requires authentication
   */
  requiresAuth: boolean;
  
  /**
   * Required roles for accessing the journey
   */
  requiredRoles?: string[];
};