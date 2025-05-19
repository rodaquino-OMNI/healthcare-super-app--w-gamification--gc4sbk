/**
 * @file NavigationAdapter.ts
 * @description Next.js-specific navigation adapter that provides a unified interface for routing operations,
 * deep linking, and programmatic navigation within the web application.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { JourneyId, JOURNEY_IDS } from '../../types/journey.types';
import { WebJourneyContextType } from '../../types/context.types';
import { WEB_AUTH_ROUTES, WEB_HEALTH_ROUTES, WEB_CARE_ROUTES, WEB_PLAN_ROUTES } from 'src/web/shared/constants/routes';

/**
 * Navigation error types for consistent error handling
 */
export enum NavigationErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_ROUTE = 'INVALID_ROUTE',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  JOURNEY_RESTRICTED = 'JOURNEY_RESTRICTED',
}

/**
 * Navigation error class for handling navigation-specific errors
 */
export class NavigationError extends Error {
  type: NavigationErrorType;
  details?: Record<string, any>;

  constructor(type: NavigationErrorType, message: string, details?: Record<string, any>) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'NavigationError';
  }
}

/**
 * Deep link configuration interface
 */
export interface DeepLinkConfig {
  /** The journey ID this deep link belongs to */
  journeyId: JourneyId;
  /** The route pattern to match (e.g., '/health/metrics/:metricId') */
  pattern: string;
  /** Whether authentication is required to access this route */
  requiresAuth: boolean;
  /** Optional function to validate access to this route */
  accessValidator?: (params: Record<string, string>) => boolean | Promise<boolean>;
}

/**
 * Navigation options interface
 */
export interface NavigationOptions {
  /** Whether to replace the current history entry instead of adding a new one */
  replace?: boolean;
  /** Whether to scroll to the top of the page after navigation */
  scroll?: boolean;
  /** Whether to update the journey context when navigating */
  updateJourney?: boolean;
  /** Query parameters to include in the URL */
  query?: Record<string, string>;
}

/**
 * Route guard result interface
 */
export interface RouteGuardResult {
  /** Whether the navigation should proceed */
  canProceed: boolean;
  /** Redirect URL if navigation should not proceed */
  redirectTo?: string;
  /** Error message if navigation should not proceed */
  error?: NavigationError;
}

/**
 * Navigation adapter interface
 */
export interface NavigationAdapterInterface {
  /**
   * Navigate to a specific route
   * @param route The route to navigate to
   * @param options Navigation options
   */
  navigate(route: string, options?: NavigationOptions): Promise<void>;

  /**
   * Navigate to a specific journey
   * @param journeyId The journey ID to navigate to
   * @param options Navigation options
   */
  navigateToJourney(journeyId: JourneyId, options?: NavigationOptions): Promise<void>;

  /**
   * Get the current journey ID from the URL
   * @returns The current journey ID or undefined if not in a journey
   */
  getCurrentJourneyFromUrl(): JourneyId | undefined;

  /**
   * Check if a route is accessible based on authentication and journey access
   * @param route The route to check
   * @param isAuthenticated Whether the user is authenticated
   * @param allowedJourneys Optional list of journeys the user has access to
   * @returns Route guard result
   */
  checkRouteAccess(route: string, isAuthenticated: boolean, allowedJourneys?: JourneyId[]): Promise<RouteGuardResult>;

  /**
   * Register a deep link configuration
   * @param config The deep link configuration
   */
  registerDeepLink(config: DeepLinkConfig): void;

  /**
   * Process a deep link URL
   * @param url The URL to process
   * @param isAuthenticated Whether the user is authenticated
   * @returns Whether the deep link was processed successfully
   */
  processDeepLink(url: string, isAuthenticated: boolean): Promise<boolean>;

  /**
   * Synchronize journey state with URL parameters
   * @param setJourney Function to update the journey context
   */
  syncJourneyWithUrl(setJourney: WebJourneyContextType['setCurrentJourney']): void;
}

/**
 * Next.js implementation of the navigation adapter
 */
export class NavigationAdapter implements NavigationAdapterInterface {
  private router = useRouter();
  private pathname = usePathname();
  private searchParams = useSearchParams();
  private deepLinks: DeepLinkConfig[] = [];

  /**
   * Journey route maps for quick lookup
   */
  private journeyRouteMaps = {
    [JOURNEY_IDS.HEALTH]: WEB_HEALTH_ROUTES,
    [JOURNEY_IDS.CARE]: WEB_CARE_ROUTES,
    [JOURNEY_IDS.PLAN]: WEB_PLAN_ROUTES,
  };

  /**
   * Default routes for each journey
   */
  private defaultJourneyRoutes = {
    [JOURNEY_IDS.HEALTH]: WEB_HEALTH_ROUTES.DASHBOARD,
    [JOURNEY_IDS.CARE]: WEB_CARE_ROUTES.APPOINTMENTS,
    [JOURNEY_IDS.PLAN]: WEB_PLAN_ROUTES.DASHBOARD,
  };

  /**
   * Navigate to a specific route
   * @param route The route to navigate to
   * @param options Navigation options
   */
  async navigate(route: string, options: NavigationOptions = {}): Promise<void> {
    try {
      // Build the URL with query parameters if provided
      let url = route;
      if (options.query && Object.keys(options.query).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(options.query).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        url = `${route}?${queryParams.toString()}`;
      }

      // Perform the navigation
      if (options.replace) {
        this.router.replace(url, { scroll: options.scroll !== false });
      } else {
        this.router.push(url, { scroll: options.scroll !== false });
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      throw new NavigationError(
        NavigationErrorType.NAVIGATION_FAILED,
        `Failed to navigate to ${route}`,
        { originalError: error }
      );
    }
  }

  /**
   * Navigate to a specific journey
   * @param journeyId The journey ID to navigate to
   * @param options Navigation options
   */
  async navigateToJourney(journeyId: JourneyId, options: NavigationOptions = {}): Promise<void> {
    // Get the default route for the journey
    const defaultRoute = this.defaultJourneyRoutes[journeyId];
    if (!defaultRoute) {
      throw new NavigationError(
        NavigationErrorType.INVALID_ROUTE,
        `No default route found for journey: ${journeyId}`
      );
    }

    // Navigate to the default route for the journey
    await this.navigate(defaultRoute, options);
  }

  /**
   * Get the current journey ID from the URL
   * @returns The current journey ID or undefined if not in a journey
   */
  getCurrentJourneyFromUrl(): JourneyId | undefined {
    const path = this.pathname;
    
    if (path.startsWith('/health')) {
      return JOURNEY_IDS.HEALTH;
    } else if (path.startsWith('/care')) {
      return JOURNEY_IDS.CARE;
    } else if (path.startsWith('/plan')) {
      return JOURNEY_IDS.PLAN;
    }
    
    return undefined;
  }

  /**
   * Check if a route is accessible based on authentication and journey access
   * @param route The route to check
   * @param isAuthenticated Whether the user is authenticated
   * @param allowedJourneys Optional list of journeys the user has access to
   * @returns Route guard result
   */
  async checkRouteAccess(
    route: string,
    isAuthenticated: boolean,
    allowedJourneys: JourneyId[] = [JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN]
  ): Promise<RouteGuardResult> {
    // Check if the route is an auth route (login, register, etc.)
    const isAuthRoute = Object.values(WEB_AUTH_ROUTES).some(authRoute => route.startsWith(authRoute));
    
    // If it's an auth route, authenticated users should be redirected to the default journey
    if (isAuthRoute && isAuthenticated) {
      return {
        canProceed: false,
        redirectTo: this.defaultJourneyRoutes[JOURNEY_IDS.HEALTH],
      };
    }
    
    // For non-auth routes, check if authentication is required
    if (!isAuthRoute && !isAuthenticated) {
      return {
        canProceed: false,
        redirectTo: WEB_AUTH_ROUTES.LOGIN,
        error: new NavigationError(
          NavigationErrorType.UNAUTHORIZED,
          'Authentication required to access this route'
        ),
      };
    }
    
    // Check if the route belongs to a journey
    const journeyId = this.getJourneyIdFromRoute(route);
    
    // If the route belongs to a journey, check if the user has access to that journey
    if (journeyId && !allowedJourneys.includes(journeyId)) {
      return {
        canProceed: false,
        redirectTo: this.defaultJourneyRoutes[allowedJourneys[0] || JOURNEY_IDS.HEALTH],
        error: new NavigationError(
          NavigationErrorType.JOURNEY_RESTRICTED,
          `Access to journey '${journeyId}' is restricted`,
          { journeyId }
        ),
      };
    }
    
    // If all checks pass, allow navigation to proceed
    return { canProceed: true };
  }

  /**
   * Register a deep link configuration
   * @param config The deep link configuration
   */
  registerDeepLink(config: DeepLinkConfig): void {
    this.deepLinks.push(config);
  }

  /**
   * Process a deep link URL
   * @param url The URL to process
   * @param isAuthenticated Whether the user is authenticated
   * @returns Whether the deep link was processed successfully
   */
  async processDeepLink(url: string, isAuthenticated: boolean): Promise<boolean> {
    // Parse the URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url, window.location.origin);
    } catch (error) {
      console.error('Invalid deep link URL:', error);
      return false;
    }
    
    const path = parsedUrl.pathname;
    
    // Find a matching deep link configuration
    for (const deepLink of this.deepLinks) {
      const match = this.matchRoutePattern(path, deepLink.pattern);
      
      if (match) {
        // Check if authentication is required
        if (deepLink.requiresAuth && !isAuthenticated) {
          // Redirect to login with a return URL
          await this.navigate(
            WEB_AUTH_ROUTES.LOGIN,
            {
              query: { returnUrl: encodeURIComponent(url) },
              replace: true,
            }
          );
          return true;
        }
        
        // Check if access validation is required
        if (deepLink.accessValidator) {
          const hasAccess = await Promise.resolve(deepLink.accessValidator(match.params));
          if (!hasAccess) {
            console.warn('Access denied to deep link:', url);
            return false;
          }
        }
        
        // Navigate to the deep link URL
        await this.navigate(path, {
          query: Object.fromEntries(parsedUrl.searchParams.entries()),
          updateJourney: true,
        });
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Synchronize journey state with URL parameters
   * @param setJourney Function to update the journey context
   */
  syncJourneyWithUrl(setJourney: WebJourneyContextType['setCurrentJourney']): void {
    const journeyId = this.getCurrentJourneyFromUrl();
    if (journeyId) {
      setJourney(journeyId);
    }
  }

  /**
   * Get the journey ID from a route
   * @param route The route to check
   * @returns The journey ID or undefined if not in a journey
   * @private
   */
  private getJourneyIdFromRoute(route: string): JourneyId | undefined {
    if (route.startsWith('/health')) {
      return JOURNEY_IDS.HEALTH;
    } else if (route.startsWith('/care')) {
      return JOURNEY_IDS.CARE;
    } else if (route.startsWith('/plan')) {
      return JOURNEY_IDS.PLAN;
    }
    
    return undefined;
  }

  /**
   * Match a route against a pattern
   * @param route The route to match
   * @param pattern The pattern to match against
   * @returns Match result with parameters or null if no match
   * @private
   */
  private matchRoutePattern(route: string, pattern: string): { params: Record<string, string> } | null {
    // Convert pattern to regex
    const paramNames: string[] = [];
    const regexPattern = pattern
      .replace(/:[a-zA-Z0-9_]+/g, (match) => {
        const paramName = match.slice(1); // Remove the leading :
        paramNames.push(paramName);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    const match = route.match(regex);
    
    if (!match) {
      return null;
    }
    
    // Extract parameters
    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1]; // +1 because the first match is the full string
    });
    
    return { params };
  }
}

/**
 * Create a navigation adapter instance
 * @returns NavigationAdapter instance
 */
export const createNavigationAdapter = (): NavigationAdapter => {
  return new NavigationAdapter();
};

export default NavigationAdapter;