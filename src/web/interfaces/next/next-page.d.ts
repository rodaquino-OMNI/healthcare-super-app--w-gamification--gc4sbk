/**
 * TypeScript declarations for Next.js page components in the AUSTA SuperApp
 * 
 * This file provides type definitions for page props, static generation functions
 * (getStaticProps, getStaticPaths), and server-side rendering functions (getServerSideProps),
 * ensuring type consistency across all journey pages.
 */

import { NextPage } from 'next';
import { AppProps } from 'next/app';
import { GetServerSidePropsContext, GetServerSidePropsResult, GetStaticPathsContext, GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from 'next';
import { ReactElement, ReactNode } from 'react';

// Import journey-specific types from shared interfaces package
import { HealthJourneyData, HealthMetric, HealthGoal, DeviceConnection } from '@austa/interfaces/health';
import { CareJourneyData, Appointment, Provider, Treatment } from '@austa/interfaces/care';
import { PlanJourneyData, Claim, Benefit, Coverage } from '@austa/interfaces/plan';
import { AuthData, UserProfile, Permission } from '@austa/interfaces/auth';
import { GamificationData, Achievement, Quest, Reward } from '@austa/interfaces/gamification';
import { ValidationError, ErrorCategory } from '@austa/interfaces/common';

/**
 * Base interface for all page props in the application
 */
export interface BasePageProps {
  /** 
   * Authentication data for the current user
   * @optional - Will be undefined for unauthenticated pages
   */
  authData?: AuthData;
  
  /**
   * Error information if page data fetching failed
   * @optional - Will be undefined if no errors occurred
   */
  error?: {
    statusCode: number;
    message: string;
    category?: ErrorCategory;
    details?: unknown;
  };

  /**
   * Flag indicating if data is being loaded
   * @default false
   */
  isLoading?: boolean;

  /**
   * SEO metadata for the page
   */
  seo?: {
    title: string;
    description: string;
    keywords?: string[];
    canonical?: string;
    openGraph?: {
      title?: string;
      description?: string;
      image?: string;
      url?: string;
    };
  };

  /**
   * Locale information for internationalization
   */
  locale?: {
    current: string;
    available: string[];
  };
}

/**
 * Journey-specific page props interfaces
 */
export interface HealthJourneyPageProps extends BasePageProps {
  /** Health journey specific data */
  journeyData: HealthJourneyData;
  
  /** Specific health metrics for the current view */
  metrics?: HealthMetric[];
  
  /** Health goals for the current user */
  goals?: HealthGoal[];
  
  /** Connected health devices */
  devices?: DeviceConnection[];
  
  /** Flag indicating if health data is being synchronized */
  isSyncing?: boolean;
}

export interface CareJourneyPageProps extends BasePageProps {
  /** Care journey specific data */
  journeyData: CareJourneyData;
  
  /** Appointments for the current user */
  appointments?: Appointment[];
  
  /** Healthcare providers */
  providers?: Provider[];
  
  /** Treatment plans */
  treatments?: Treatment[];
  
  /** Flag indicating if telemedicine is available */
  telemedicineAvailable?: boolean;
}

export interface PlanJourneyPageProps extends BasePageProps {
  /** Plan journey specific data */
  journeyData: PlanJourneyData;
  
  /** Insurance claims */
  claims?: Claim[];
  
  /** Plan benefits */
  benefits?: Benefit[];
  
  /** Coverage details */
  coverage?: Coverage;
  
  /** Flag indicating if digital card is available */
  digitalCardAvailable?: boolean;
}

export interface GamificationPageProps extends BasePageProps {
  /** Gamification data */
  gamificationData: GamificationData;
  
  /** User achievements */
  achievements?: Achievement[];
  
  /** Available quests */
  quests?: Quest[];
  
  /** Available rewards */
  rewards?: Reward[];
  
  /** Recently earned achievements */
  recentAchievements?: Achievement[];
}

/**
 * Union type of all possible journey page props
 */
export type JourneyPageProps = 
  | HealthJourneyPageProps 
  | CareJourneyPageProps 
  | PlanJourneyPageProps 
  | GamificationPageProps
  | BasePageProps;

/**
 * Extended NextPage type with layout support
 */
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  /**
   * Optional function to return the layout for this page
   * @param page The page component to wrap with a layout
   * @param props The props for the page
   */
  getLayout?: (page: ReactElement, props: P) => ReactNode;
  
  /**
   * Flag to indicate if the page requires authentication
   * @default false
   */
  requireAuth?: boolean;
  
  /**
   * The journey this page belongs to (if any)
   * @optional
   */
  journey?: 'health' | 'care' | 'plan' | 'common';
  
  /**
   * Required permissions to access this page
   * @optional
   */
  requiredPermissions?: Permission[];
  
  /**
   * Flag to indicate if the page should use journey-specific theming
   * @default true for journey pages, false otherwise
   */
  useJourneyTheme?: boolean;
  
  /**
   * Flag to indicate if the page should show gamification elements
   * @default true for authenticated pages, false otherwise
   */
  showGamification?: boolean;
  
  /**
   * Flag to indicate if the page should be accessible offline in the mobile app
   * @default false
   */
  offlineAccessible?: boolean;
};

/**
 * Extended AppProps type with layout support
 */
export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

/**
 * Type for getStaticProps with journey context
 */
export type GetStaticPropsWithJourney<
  P extends JourneyPageProps = JourneyPageProps,
  Q extends { [key: string]: string } = { [key: string]: string }
> = (
  context: GetStaticPropsContext<Q> & {
    /**
     * Current journey context
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
    
    /**
     * Preview data for CMS integration
     */
    previewData?: unknown;
  }
) => Promise<GetStaticPropsResult<P>>;

/**
 * Type for getServerSideProps with journey context
 */
export type GetServerSidePropsWithJourney<
  P extends JourneyPageProps = JourneyPageProps,
  Q extends { [key: string]: string } = { [key: string]: string }
> = (
  context: GetServerSidePropsContext<Q> & {
    /**
     * Current journey context
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
    
    /**
     * User authentication status
     */
    isAuthenticated?: boolean;
    
    /**
     * User permissions
     */
    userPermissions?: Permission[];
  }
) => Promise<GetServerSidePropsResult<P>>;

/**
 * Type for getStaticPaths with journey context
 */
export type GetStaticPathsWithJourney<
  P extends { [key: string]: string } = { [key: string]: string }
> = (
  context: GetStaticPathsContext & {
    /**
     * Current journey context
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
    
    /**
     * Locales for internationalization
     */
    locales?: string[];
    
    /**
     * Default locale
     */
    defaultLocale?: string;
  }
) => Promise<GetStaticPathsResult<P>>;

/**
 * Error handler type for data fetching methods
 */
export type DataFetchingErrorHandler = (
  error: unknown,
  context: {
    journey?: 'health' | 'care' | 'plan' | 'common';
    path: string;
    method: 'getStaticProps' | 'getServerSideProps' | 'getStaticPaths';
  }
) => {
  props: {
    error: {
      statusCode: number;
      message: string;
      category: ErrorCategory;
      details?: unknown;
    };
  };
};

/**
 * Helper type for journey-specific pages
 */
export type HealthJourneyPage<P = HealthJourneyPageProps> = NextPageWithLayout<P> & {
  journey: 'health';
  useJourneyTheme: true;
};

export type CareJourneyPage<P = CareJourneyPageProps> = NextPageWithLayout<P> & {
  journey: 'care';
  useJourneyTheme: true;
};

export type PlanJourneyPage<P = PlanJourneyPageProps> = NextPageWithLayout<P> & {
  journey: 'plan';
  useJourneyTheme: true;
};

/**
 * Type for common pages that don't belong to a specific journey
 */
export type CommonPage<P = BasePageProps> = NextPageWithLayout<P> & {
  journey: 'common';
};

/**
 * Type for authentication pages
 */
export type AuthPage<P = BasePageProps> = NextPageWithLayout<P> & {
  requireAuth: false;
  journey: 'common';
};

/**
 * Type for layout components
 */
export interface LayoutProps {
  children: ReactNode;
  journeyContext?: 'health' | 'care' | 'plan' | 'common';
}

/**
 * Type for journey-specific layout components
 */
export interface HealthJourneyLayoutProps extends LayoutProps {
  journeyContext: 'health';
  healthData?: HealthJourneyData;
}

export interface CareJourneyLayoutProps extends LayoutProps {
  journeyContext: 'care';
  careData?: CareJourneyData;
}

export interface PlanJourneyLayoutProps extends LayoutProps {
  journeyContext: 'plan';
  planData?: PlanJourneyData;
}

/**
 * Type for API response validation
 */
export interface ApiResponse<T> {
  /**
   * Response data when request is successful
   */
  data?: T;
  
  /**
   * Error information when request fails
   */
  error?: {
    /**
     * Error code for programmatic handling
     */
    code: string;
    
    /**
     * Human-readable error message
     */
    message: string;
    
    /**
     * Error category for classification
     */
    category: ErrorCategory;
    
    /**
     * Additional error details
     */
    details?: unknown;
    
    /**
     * Validation errors if applicable
     */
    validation?: ValidationError[];
    
    /**
     * Journey context where the error occurred
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
  };
  
  /**
   * HTTP status code
   */
  status: number;
  
  /**
   * Metadata for pagination, caching, etc.
   */
  meta?: {
    /**
     * Pagination information
     */
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    
    /**
     * Cache control directives
     */
    cache?: {
      maxAge: number;
      staleWhileRevalidate?: number;
      etag?: string;
    };
    
    /**
     * Request processing time in milliseconds
     */
    processingTimeMs?: number;
  };
}

/**
 * Type for validated API request
 */
export interface ValidatedApiRequest<T> {
  /**
   * Parsed and validated request body
   */
  body: T;
  
  /**
   * Flag indicating if the request is valid
   */
  isValid: boolean;
  
  /**
   * Validation errors if request is invalid
   */
  validationErrors?: ValidationError[];
  
  /**
   * Request metadata
   */
  meta?: {
    /**
     * Request ID for tracing
     */
    requestId: string;
    
    /**
     * Journey context for the request
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
    
    /**
     * User ID if authenticated
     */
    userId?: string;
    
    /**
     * User permissions
     */
    permissions?: Permission[];
  };
}

/**
 * Type for Next.js API handler with journey context
 */
export type NextApiHandlerWithJourney<T = any> = (
  req: ValidatedApiRequest<T> & {
    /**
     * Journey context for the request
     */
    journeyContext?: 'health' | 'care' | 'plan' | 'common';
  },
  res: {
    status: (statusCode: number) => {
      json: (data: ApiResponse<any>) => void;
    };
  }
) => Promise<void> | void;

/**
 * Type for journey-specific data fetching hooks
 */
export interface UseJourneyDataOptions {
  /**
   * Whether to enable automatic refetching
   */
  enableRefetch?: boolean;
  
  /**
   * Refetch interval in milliseconds
   */
  refetchInterval?: number;
  
  /**
   * Whether to refetch on window focus
   */
  refetchOnWindowFocus?: boolean;
  
  /**
   * Whether to skip the request
   */
  skip?: boolean;
  
  /**
   * Callback for successful data fetching
   */
  onSuccess?: (data: any) => void;
  
  /**
   * Callback for failed data fetching
   */
  onError?: (error: any) => void;
}

/**
 * Type for journey-specific data fetching hook results
 */
export interface UseJourneyDataResult<T> {
  /**
   * The fetched data
   */
  data?: T;
  
  /**
   * Whether the data is being loaded
   */
  isLoading: boolean;
  
  /**
   * Whether the data is being refetched
   */
  isRefetching: boolean;
  
  /**
   * Whether there was an error fetching the data
   */
  isError: boolean;
  
  /**
   * The error if there was one
   */
  error?: {
    message: string;
    code: string;
    category: ErrorCategory;
  };
  
  /**
   * Function to manually refetch the data
   */
  refetch: () => Promise<T>;
}

/**
 * Type for journey context provider props
 */
export interface JourneyContextProviderProps {
  /**
   * The children to render
   */
  children: ReactNode;
  
  /**
   * Initial journey data
   */
  initialData?: {
    health?: HealthJourneyData;
    care?: CareJourneyData;
    plan?: PlanJourneyData;
  };
  
  /**
   * Current active journey
   */
  activeJourney?: 'health' | 'care' | 'plan' | 'common';
}