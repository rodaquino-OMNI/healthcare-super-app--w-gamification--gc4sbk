/**
 * @file NavigationAdapter.ts
 * @description Next.js-specific navigation adapter that provides a unified interface for routing operations,
 * deep linking, and programmatic navigation within the web application. This adapter abstracts the
 * Next.js Router implementation details and provides journey-aware navigation capabilities.
 */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { JourneyId, isValidJourneyId, JOURNEY_IDS } from '../../../types/journey.types';
import { WEB_AUTH_ROUTES, WEB_HEALTH_ROUTES, WEB_CARE_ROUTES, WEB_PLAN_ROUTES } from '@austa/interfaces/common';

/**
 * Navigation options interface
 */
export interface NavigationOptions {
  /** Whether to scroll to top after navigation */
  scroll?: boolean;
  /** Whether to replace the current history entry instead of adding a new one */
  replace?: boolean;
  /** Whether to skip route guards for this navigation */
  skipGuards?: boolean;
}

/**
 * Deep link configuration interface
 */
export interface DeepLinkConfig {
  /** Pattern to match against URLs */
  pattern: string | RegExp;
  /** Journey ID associated with this pattern */
  journeyId: JourneyId;
  /** Handler function for this deep link */
  handler: (params: Record<string, string>) => string;
}

/**
 * Route guard interface
 */
export interface RouteGuard {
  /** Pattern to match against URLs */
  pattern: string | RegExp;
  /** Guard function that returns true if navigation should proceed, or a redirect URL if not */
  guard: () => boolean | string;
}

/**
 * Web Navigation Adapter class
 * Provides a unified interface for routing operations in the web application
 */
export class NavigationAdapter {
  private router;
  private pathname;
  private searchParams;
  private deepLinkConfigs: DeepLinkConfig[] = [];
  private routeGuards: RouteGuard[] = [];

  /**
   * Creates an instance of NavigationAdapter.
   */
  constructor() {
    // These hooks must be used within a Client Component
    this.router = useRouter();
    this.pathname = usePathname();
    this.searchParams = useSearchParams();

    // Initialize deep link configurations
    this.initializeDeepLinkConfigs();
    
    // Initialize route guards
    this.initializeRouteGuards();
  }

  /**
   * Initialize deep link configurations
   * @private
   */
  private initializeDeepLinkConfigs(): void {
    this.deepLinkConfigs = [
      {
        pattern: /^\/health\/(.*)/,
        journeyId: JOURNEY_IDS.HEALTH,
        handler: (params) => `/health/${params[1] || ''}`
      },
      {
        pattern: /^\/care\/(.*)/,
        journeyId: JOURNEY_IDS.CARE,
        handler: (params) => `/care/${params[1] || ''}`
      },
      {
        pattern: /^\/plan\/(.*)/,
        journeyId: JOURNEY_IDS.PLAN,
        handler: (params) => `/plan/${params[1] || ''}`
      },
      // Add more deep link patterns as needed
    ];
  }

  /**
   * Initialize route guards
   * @private
   */
  private initializeRouteGuards(): void {
    // Example route guards - these would be customized based on application requirements
    this.routeGuards = [
      {
        // Protect health journey routes
        pattern: /^\/health\/(.*)/,
        guard: () => {
          // Check if user is authenticated, otherwise redirect to login
          const isAuthenticated = this.isAuthenticated();
          return isAuthenticated || WEB_AUTH_ROUTES.LOGIN;
        }
      },
      {
        // Protect care journey routes
        pattern: /^\/care\/(.*)/,
        guard: () => {
          // Check if user is authenticated, otherwise redirect to login
          const isAuthenticated = this.isAuthenticated();
          return isAuthenticated || WEB_AUTH_ROUTES.LOGIN;
        }
      },
      {
        // Protect plan journey routes
        pattern: /^\/plan\/(.*)/,
        guard: () => {
          // Check if user is authenticated, otherwise redirect to login
          const isAuthenticated = this.isAuthenticated();
          return isAuthenticated || WEB_AUTH_ROUTES.LOGIN;
        }
      },
      // Add more route guards as needed
    ];
  }

  /**
   * Check if the user is authenticated
   * This is a placeholder implementation - would be replaced with actual auth check
   * @private
   * @returns {boolean} Whether the user is authenticated
   */
  private isAuthenticated(): boolean {
    // This would be replaced with actual authentication check
    // For example, checking if a token exists in localStorage or in an auth context
    return typeof window !== 'undefined' && !!localStorage.getItem('auth_session');
  }

  /**
   * Navigate to a specific route
   * @param {string} url - The URL to navigate to
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} A promise that resolves when navigation is complete
   */
  public async navigate(url: string, options?: NavigationOptions): Promise<boolean> {
    try {
      // Apply route guards if not skipped
      if (!options?.skipGuards) {
        const guardResult = this.applyRouteGuards(url);
        if (typeof guardResult === 'string') {
          // Redirect to the URL returned by the guard
          return this.navigate(guardResult, { ...options, skipGuards: true });
        } else if (guardResult === false) {
          // Navigation blocked by guard
          return false;
        }
      }

      // Perform the navigation
      if (options?.replace) {
        this.router.replace(url, { scroll: options?.scroll });
      } else {
        this.router.push(url, { scroll: options?.scroll });
      }
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }

  /**
   * Replace the current route without adding to history
   * @param {string} url - The URL to navigate to
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} A promise that resolves when navigation is complete
   */
  public async replace(url: string, options?: NavigationOptions): Promise<boolean> {
    return this.navigate(url, { ...options, replace: true });
  }

  /**
   * Navigate back in history
   * @returns {void}
   */
  public back(): void {
    this.router.back();
  }

  /**
   * Navigate forward in history
   * @returns {void}
   */
  public forward(): void {
    this.router.forward();
  }

  /**
   * Refresh the current route
   * @returns {void}
   */
  public refresh(): void {
    this.router.refresh();
  }

  /**
   * Prefetch a route for faster navigation
   * @param {string} url - The URL to prefetch
   * @returns {void}
   */
  public prefetch(url: string): void {
    this.router.prefetch(url);
  }

  /**
   * Parse a deep link URL and return the appropriate route
   * @param {string} url - The deep link URL to parse
   * @returns {{ route: string, journeyId: JourneyId | null }} The parsed route and journey ID
   */
  public parseDeepLink(url: string): { route: string; journeyId: JourneyId | null } {
    // Default result
    const defaultResult = { route: url, journeyId: null };

    // Check if URL is valid
    if (!url) return defaultResult;

    try {
      // Try to match the URL against our deep link patterns
      for (const config of this.deepLinkConfigs) {
        if (typeof config.pattern === 'string') {
          if (url.startsWith(config.pattern)) {
            return {
              route: config.handler({ '0': url, '1': url.substring(config.pattern.length) }),
              journeyId: config.journeyId
            };
          }
        } else if (config.pattern instanceof RegExp) {
          const match = url.match(config.pattern);
          if (match) {
            return {
              route: config.handler(match.groups || match),
              journeyId: config.journeyId
            };
          }
        }
      }

      // If no pattern matches, try to extract journey from URL path
      const journeyId = this.getJourneyFromUrl(url);
      return { route: url, journeyId };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return defaultResult;
    }
  }

  /**
   * Extract journey ID from a URL
   * @param {string} url - The URL to extract journey from
   * @returns {JourneyId | null} The extracted journey ID or null if not found
   */
  public getJourneyFromUrl(url: string): JourneyId | null {
    try {
      // Parse the URL to get the path
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;

      // Check if path starts with a journey ID
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0 && isValidJourneyId(segments[0])) {
        return segments[0] as JourneyId;
      }

      // Check if path contains journey-specific patterns
      if (path.includes('/health/')) return JOURNEY_IDS.HEALTH;
      if (path.includes('/care/')) return JOURNEY_IDS.CARE;
      if (path.includes('/plan/')) return JOURNEY_IDS.PLAN;

      return null;
    } catch (error) {
      console.error('Error extracting journey from URL:', error);
      return null;
    }
  }

  /**
   * Apply route guards to a URL
   * @param {string} url - The URL to check against guards
   * @returns {boolean | string} True if navigation should proceed, a redirect URL if not, or false if blocked
   * @private
   */
  private applyRouteGuards(url: string): boolean | string {
    try {
      // Normalize the URL
      const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

      // Check each guard
      for (const guard of this.routeGuards) {
        if (typeof guard.pattern === 'string') {
          if (normalizedUrl.startsWith(guard.pattern)) {
            return guard.guard();
          }
        } else if (guard.pattern instanceof RegExp) {
          if (guard.pattern.test(normalizedUrl)) {
            return guard.guard();
          }
        }
      }

      // If no guard matches, allow navigation
      return true;
    } catch (error) {
      console.error('Error applying route guards:', error);
      return true; // Allow navigation on error to prevent blocking users
    }
  }

  /**
   * Get the current pathname
   * @returns {string} The current pathname
   */
  public getCurrentPathname(): string {
    return this.pathname || '';
  }

  /**
   * Get the current search parameters
   * @returns {URLSearchParams} The current search parameters
   */
  public getSearchParams(): URLSearchParams {
    return this.searchParams as URLSearchParams;
  }

  /**
   * Get a specific search parameter
   * @param {string} name - The name of the parameter to get
   * @returns {string | null} The parameter value or null if not found
   */
  public getSearchParam(name: string): string | null {
    return this.searchParams?.get(name) || null;
  }

  /**
   * Build a URL with search parameters
   * @param {string} baseUrl - The base URL
   * @param {Record<string, string>} params - The parameters to add
   * @returns {string} The complete URL with parameters
   */
  public buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.pathname + url.search;
  }

  /**
   * Navigate to a journey route
   * @param {JourneyId} journeyId - The journey ID
   * @param {string} [subpath] - Optional subpath within the journey
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} A promise that resolves when navigation is complete
   */
  public navigateToJourney(journeyId: JourneyId, subpath?: string, options?: NavigationOptions): Promise<boolean> {
    let route = '/';
    
    switch (journeyId) {
      case JOURNEY_IDS.HEALTH:
        route = subpath ? `${WEB_HEALTH_ROUTES.DASHBOARD}/${subpath}` : WEB_HEALTH_ROUTES.DASHBOARD;
        break;
      case JOURNEY_IDS.CARE:
        route = subpath ? `${WEB_CARE_ROUTES.APPOINTMENTS}/${subpath}` : WEB_CARE_ROUTES.APPOINTMENTS;
        break;
      case JOURNEY_IDS.PLAN:
        route = subpath ? `${WEB_PLAN_ROUTES.DASHBOARD}/${subpath}` : WEB_PLAN_ROUTES.DASHBOARD;
        break;
      default:
        route = '/';
    }
    
    return this.navigate(route, options);
  }
}

/**
 * Create a navigation adapter instance
 * @returns {NavigationAdapter} A new navigation adapter instance
 */
export function createNavigationAdapter(): NavigationAdapter {
  return new NavigationAdapter();
}

export default NavigationAdapter;