/**
 * @file NavigationAdapter.ts
 * @description React Native-specific navigation adapter that provides a unified interface for routing operations,
 * deep linking, and programmatic navigation within the mobile application. This adapter abstracts the
 * React Navigation implementation details and provides journey-aware navigation capabilities.
 */

import { JourneyId, JOURNEY_IDS, isValidJourneyId } from '../../../types/journey.types';

/**
 * Navigation parameters that can be passed during navigation
 */
export interface NavigationParams {
  [key: string]: any;
}

/**
 * Deep link configuration for the application
 */
export interface DeepLinkConfig {
  /** The URL scheme for the app (e.g., 'austa://') */
  scheme: string;
  /** The host for universal links (e.g., 'app.austa.com.br') */
  host?: string;
  /** Whether to enable universal links */
  enableUniversalLinks: boolean;
  /** Mapping of URL paths to screen names */
  pathToScreenMap: Record<string, string>;
}

/**
 * Route guard function type
 * Returns true if navigation should proceed, false to block
 */
export type RouteGuard = (routeName: string, params?: NavigationParams) => boolean | Promise<boolean>;

/**
 * Navigation error with enhanced details
 */
export class NavigationError extends Error {
  /** The route that was being navigated to */
  routeName: string;
  /** The parameters that were being passed */
  params?: NavigationParams;
  /** The original error if available */
  originalError?: Error;

  constructor(message: string, routeName: string, params?: NavigationParams, originalError?: Error) {
    super(message);
    this.name = 'NavigationError';
    this.routeName = routeName;
    this.params = params;
    this.originalError = originalError;
  }
}

/**
 * React Native Navigation Adapter
 * 
 * Provides a unified interface for navigation operations in React Native,
 * abstracting the underlying React Navigation implementation details.
 */
export class NavigationAdapter {
  /** Reference to the navigation object */
  private navigationRef: any = null;
  /** Deep link configuration */
  private deepLinkConfig: DeepLinkConfig;
  /** Route guards for protected routes */
  private routeGuards: Map<string, RouteGuard> = new Map();
  /** Journey-specific route guards */
  private journeyRouteGuards: Map<JourneyId, RouteGuard> = new Map();
  /** Default journey to fallback to */
  private defaultJourney: JourneyId = JOURNEY_IDS.HEALTH;
  /** Current journey */
  private currentJourney: JourneyId = JOURNEY_IDS.HEALTH;
  /** Navigation state change listeners */
  private navigationStateListeners: Array<(state: any) => void> = [];

  /**
   * Creates a new NavigationAdapter instance
   * 
   * @param deepLinkConfig - Configuration for deep linking
   */
  constructor(deepLinkConfig: DeepLinkConfig) {
    this.deepLinkConfig = deepLinkConfig;
  }

  /**
   * Sets the navigation reference from React Navigation
   * 
   * @param navigationRef - Reference to the React Navigation object
   */
  public setNavigationRef(navigationRef: any): void {
    this.navigationRef = navigationRef;
  }

  /**
   * Sets the current journey
   * 
   * @param journeyId - The journey ID to set as current
   */
  public setCurrentJourney(journeyId: JourneyId): void {
    if (isValidJourneyId(journeyId)) {
      this.currentJourney = journeyId;
    } else {
      console.warn(`Invalid journey ID: ${journeyId}, using default journey instead`);
      this.currentJourney = this.defaultJourney;
    }
  }

  /**
   * Sets the default journey
   * 
   * @param journeyId - The journey ID to set as default
   */
  public setDefaultJourney(journeyId: JourneyId): void {
    if (isValidJourneyId(journeyId)) {
      this.defaultJourney = journeyId;
    } else {
      console.warn(`Invalid journey ID: ${journeyId}, default journey not changed`);
    }
  }

  /**
   * Adds a route guard for a specific route
   * 
   * @param routeName - The route name to guard
   * @param guard - The guard function
   */
  public addRouteGuard(routeName: string, guard: RouteGuard): void {
    this.routeGuards.set(routeName, guard);
  }

  /**
   * Removes a route guard for a specific route
   * 
   * @param routeName - The route name to remove the guard from
   */
  public removeRouteGuard(routeName: string): void {
    this.routeGuards.delete(routeName);
  }

  /**
   * Adds a journey-specific route guard
   * 
   * @param journeyId - The journey ID to guard
   * @param guard - The guard function
   */
  public addJourneyRouteGuard(journeyId: JourneyId, guard: RouteGuard): void {
    if (isValidJourneyId(journeyId)) {
      this.journeyRouteGuards.set(journeyId, guard);
    } else {
      console.warn(`Invalid journey ID: ${journeyId}, journey route guard not added`);
    }
  }

  /**
   * Removes a journey-specific route guard
   * 
   * @param journeyId - The journey ID to remove the guard from
   */
  public removeJourneyRouteGuard(journeyId: JourneyId): void {
    this.journeyRouteGuards.delete(journeyId);
  }

  /**
   * Adds a navigation state change listener
   * 
   * @param listener - The listener function
   * @returns A function to remove the listener
   */
  public addNavigationStateListener(listener: (state: any) => void): () => void {
    this.navigationStateListeners.push(listener);
    return () => {
      this.navigationStateListeners = this.navigationStateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all navigation state listeners of a state change
   * 
   * @param state - The new navigation state
   */
  private notifyNavigationStateListeners(state: any): void {
    this.navigationStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in navigation state listener:', error);
      }
    });
  }

  /**
   * Checks if a route is allowed based on route guards
   * 
   * @param routeName - The route name to check
   * @param params - The navigation parameters
   * @returns True if navigation is allowed, false otherwise
   */
  private async isRouteAllowed(routeName: string, params?: NavigationParams): Promise<boolean> {
    // Check route-specific guard
    const routeGuard = this.routeGuards.get(routeName);
    if (routeGuard) {
      try {
        const isAllowed = await Promise.resolve(routeGuard(routeName, params));
        if (!isAllowed) {
          return false;
        }
      } catch (error) {
        console.error(`Error in route guard for ${routeName}:`, error);
        return false;
      }
    }

    // Check journey-specific guard if this is a journey route
    const journeyId = this.getJourneyIdFromRoute(routeName);
    if (journeyId) {
      const journeyGuard = this.journeyRouteGuards.get(journeyId);
      if (journeyGuard) {
        try {
          const isAllowed = await Promise.resolve(journeyGuard(routeName, params));
          if (!isAllowed) {
            return false;
          }
        } catch (error) {
          console.error(`Error in journey route guard for ${journeyId}:`, error);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Extracts the journey ID from a route name
   * 
   * @param routeName - The route name to check
   * @returns The journey ID if found, undefined otherwise
   */
  private getJourneyIdFromRoute(routeName: string): JourneyId | undefined {
    // Check if route name starts with a journey prefix
    if (routeName.startsWith('Health')) {
      return JOURNEY_IDS.HEALTH;
    } else if (routeName.startsWith('Care')) {
      return JOURNEY_IDS.CARE;
    } else if (routeName.startsWith('Plan')) {
      return JOURNEY_IDS.PLAN;
    }
    
    return undefined;
  }

  /**
   * Navigates to a specific screen
   * 
   * @param routeName - The name of the route to navigate to
   * @param params - Optional parameters to pass to the route
   * @throws NavigationError if navigation fails or is not allowed
   */
  public async navigate(routeName: string, params?: NavigationParams): Promise<void> {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        throw new NavigationError(
          'Navigation is not ready', 
          routeName, 
          params
        );
      }

      // Check if navigation is allowed by route guards
      const isAllowed = await this.isRouteAllowed(routeName, params);
      if (!isAllowed) {
        throw new NavigationError(
          'Navigation not allowed by route guard', 
          routeName, 
          params
        );
      }

      // Update journey context if navigating to a journey route
      const journeyId = this.getJourneyIdFromRoute(routeName);
      if (journeyId && journeyId !== this.currentJourney) {
        this.setCurrentJourney(journeyId);
      }

      // Perform the navigation
      this.navigationRef.navigate(routeName, params);
      
      // Notify state listeners
      const currentState = this.navigationRef.getRootState();
      this.notifyNavigationStateListeners(currentState);
    } catch (error) {
      if (error instanceof NavigationError) {
        throw error;
      } else {
        throw new NavigationError(
          `Failed to navigate to ${routeName}`, 
          routeName, 
          params, 
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Navigates back to the previous screen
   * 
   * @throws NavigationError if navigation fails
   */
  public goBack(): void {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        throw new NavigationError('Navigation is not ready', 'goBack');
      }

      if (this.navigationRef.canGoBack()) {
        this.navigationRef.goBack();
        
        // Notify state listeners
        const currentState = this.navigationRef.getRootState();
        this.notifyNavigationStateListeners(currentState);
      } else {
        throw new NavigationError('Cannot go back from this screen', 'goBack');
      }
    } catch (error) {
      if (error instanceof NavigationError) {
        throw error;
      } else {
        throw new NavigationError(
          'Failed to go back', 
          'goBack', 
          undefined, 
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Resets the navigation state to a specific route
   * 
   * @param routeName - The name of the route to reset to
   * @param params - Optional parameters to pass to the route
   * @throws NavigationError if navigation fails or is not allowed
   */
  public async reset(routeName: string, params?: NavigationParams): Promise<void> {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        throw new NavigationError(
          'Navigation is not ready', 
          routeName, 
          params
        );
      }

      // Check if navigation is allowed by route guards
      const isAllowed = await this.isRouteAllowed(routeName, params);
      if (!isAllowed) {
        throw new NavigationError(
          'Navigation not allowed by route guard', 
          routeName, 
          params
        );
      }

      // Update journey context if resetting to a journey route
      const journeyId = this.getJourneyIdFromRoute(routeName);
      if (journeyId && journeyId !== this.currentJourney) {
        this.setCurrentJourney(journeyId);
      }

      // Perform the reset
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      });
      
      // Notify state listeners
      const currentState = this.navigationRef.getRootState();
      this.notifyNavigationStateListeners(currentState);
    } catch (error) {
      if (error instanceof NavigationError) {
        throw error;
      } else {
        throw new NavigationError(
          `Failed to reset to ${routeName}`, 
          routeName, 
          params, 
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Handles a deep link URL
   * 
   * @param url - The deep link URL to handle
   * @returns True if the deep link was handled, false otherwise
   */
  public async handleDeepLink(url: string): Promise<boolean> {
    try {
      // Check if URL matches our scheme
      const { scheme, host, pathToScreenMap } = this.deepLinkConfig;
      
      // Handle app scheme links (e.g., austa://screen/param)
      if (url.startsWith(`${scheme}`)) {
        const path = url.substring(scheme.length);
        return await this.processDeepLinkPath(path, pathToScreenMap);
      }
      
      // Handle universal links (e.g., https://app.austa.com.br/screen/param)
      if (host && url.includes(host)) {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        return await this.processDeepLinkPath(path, pathToScreenMap);
      }
      
      return false;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  /**
   * Processes a deep link path and navigates to the corresponding screen
   * 
   * @param path - The path from the deep link URL
   * @param pathToScreenMap - Mapping of paths to screen names
   * @returns True if the path was processed successfully, false otherwise
   */
  private async processDeepLinkPath(path: string, pathToScreenMap: Record<string, string>): Promise<boolean> {
    // Find the matching path pattern
    const matchingPathPattern = Object.keys(pathToScreenMap).find(pattern => {
      // Convert route pattern to regex
      // e.g., '/health/:metricId' becomes /^\/health\/([^\/]+)$/
      const regexPattern = new RegExp(
        `^${pattern.replace(/\//g, '\\/').replace(/:[^/]+/g, '([^\\/]+)')}$`
      );
      return regexPattern.test(path);
    });

    if (matchingPathPattern) {
      const screenName = pathToScreenMap[matchingPathPattern];
      
      // Extract parameters from the path
      const params: NavigationParams = {};
      const paramNames = matchingPathPattern.match(/:[^/]+/g) || [];
      
      if (paramNames.length > 0) {
        // Convert route pattern to regex with capture groups
        const regexPattern = new RegExp(
          `^${matchingPathPattern.replace(/\//g, '\\/').replace(/:[^/]+/g, '([^\\/]+)')}$`
        );
        
        const matches = path.match(regexPattern);
        if (matches && matches.length > 1) {
          // Skip the first match (full string) and map remaining matches to param names
          paramNames.forEach((param, index) => {
            const paramName = param.substring(1); // Remove the ':' prefix
            params[paramName] = matches[index + 1];
          });
        }
      }
      
      // Navigate to the screen
      await this.navigate(screenName, params);
      return true;
    }
    
    return false;
  }

  /**
   * Gets the current route name
   * 
   * @returns The current route name or undefined if not available
   */
  public getCurrentRouteName(): string | undefined {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        return undefined;
      }
      
      const route = this.navigationRef.getCurrentRoute();
      return route?.name;
    } catch (error) {
      console.error('Error getting current route name:', error);
      return undefined;
    }
  }

  /**
   * Gets the current route parameters
   * 
   * @returns The current route parameters or undefined if not available
   */
  public getCurrentRouteParams(): NavigationParams | undefined {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        return undefined;
      }
      
      const route = this.navigationRef.getCurrentRoute();
      return route?.params;
    } catch (error) {
      console.error('Error getting current route params:', error);
      return undefined;
    }
  }

  /**
   * Checks if the navigation can go back
   * 
   * @returns True if navigation can go back, false otherwise
   */
  public canGoBack(): boolean {
    try {
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        return false;
      }
      
      return this.navigationRef.canGoBack();
    } catch (error) {
      console.error('Error checking if can go back:', error);
      return false;
    }
  }

  /**
   * Creates a deep link URL for a specific screen
   * 
   * @param screenName - The name of the screen to link to
   * @param params - Optional parameters to include in the link
   * @param useUniversalLink - Whether to use a universal link (if configured)
   * @returns The deep link URL or undefined if it couldn't be created
   */
  public createDeepLink(
    screenName: string, 
    params?: NavigationParams, 
    useUniversalLink: boolean = false
  ): string | undefined {
    try {
      const { scheme, host, enableUniversalLinks, pathToScreenMap } = this.deepLinkConfig;
      
      // Find the path pattern for this screen
      const pathPattern = Object.entries(pathToScreenMap).find(
        ([_, screen]) => screen === screenName
      )?.[0];
      
      if (!pathPattern) {
        return undefined;
      }
      
      // Replace path parameters with actual values
      let path = pathPattern;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          path = path.replace(`:${key}`, String(value));
        });
      }
      
      // Check if all parameters have been replaced
      if (path.includes(':')) {
        console.warn(`Not all parameters were provided for deep link to ${screenName}`);
        return undefined;
      }
      
      // Create the URL
      if (useUniversalLink && enableUniversalLinks && host) {
        return `https://${host}${path}`;
      } else {
        return `${scheme}${path}`;
      }
    } catch (error) {
      console.error('Error creating deep link:', error);
      return undefined;
    }
  }
}