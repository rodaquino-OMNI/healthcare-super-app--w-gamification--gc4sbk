/**
 * @file NavigationAdapter.ts
 * @description React Native-specific navigation adapter that provides a unified interface for routing operations,
 * deep linking, and programmatic navigation within the mobile application. This adapter abstracts the
 * React Navigation implementation details and provides journey-aware navigation capabilities.
 */

import { Platform } from 'react-native';
import { NavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';
import { Linking } from 'react-native';
import { JourneyId, JOURNEY_IDS } from '../../../types/journey.types';

/**
 * Navigation parameters that can be passed during navigation
 */
export type NavigationParams = Record<string, any>;

/**
 * Route configuration for deep linking
 */
export interface DeepLinkConfig {
  /** The URL scheme for the app (e.g., 'austa://') */
  scheme: string;
  /** The URL host for universal links (e.g., 'app.austa.com.br') */
  host: string;
  /** Map of paths to screen names */
  screens: Record<string, string>;
}

/**
 * Route guard function type
 * Returns true if navigation should proceed, false to block
 */
export type RouteGuard = (routeName: string, params?: NavigationParams) => boolean | Promise<boolean>;

/**
 * Navigation error with additional context
 */
export class NavigationError extends Error {
  /** The route that was being navigated to */
  routeName: string;
  /** The parameters that were being passed */
  params?: NavigationParams;
  /** The original error if this is a wrapper */
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
 * Mobile-specific navigation adapter for React Navigation
 */
export class NavigationAdapter {
  /** Reference to the navigation container */
  private navigationRef: React.RefObject<NavigationContainerRef<any>> | null = null;
  /** Route guards to check before navigation */
  private routeGuards: RouteGuard[] = [];
  /** Deep link configuration */
  private deepLinkConfig: DeepLinkConfig | null = null;
  /** Current journey ID */
  private currentJourney: JourneyId = JOURNEY_IDS.HEALTH;
  /** Callback to update journey context when navigation changes */
  private onJourneyChange: ((journeyId: JourneyId) => void) | null = null;

  /**
   * Initialize the navigation adapter
   * @param navigationRef Reference to the React Navigation container
   */
  public initialize(navigationRef: React.RefObject<NavigationContainerRef<any>>): void {
    this.navigationRef = navigationRef;
    this.setupDeepLinkHandlers();
  }

  /**
   * Configure deep linking for the application
   * @param config Deep link configuration
   */
  public configureDeepLinks(config: DeepLinkConfig): void {
    this.deepLinkConfig = config;
  }

  /**
   * Set up handlers for deep links
   */
  private setupDeepLinkHandlers(): void {
    if (!this.deepLinkConfig) return;

    // Handle initial URL when app is opened from a link
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLink(url);
      }
    }).catch(err => {
      console.error('Error getting initial URL:', err);
    });

    // Handle deep links when app is already running
    const linkingListener = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    // Return cleanup function (not used here but good practice)
    return () => {
      linkingListener.remove();
    };
  }

  /**
   * Process a deep link URL and navigate accordingly
   * @param url The deep link URL to process
   */
  private handleDeepLink(url: string): void {
    if (!this.deepLinkConfig || !this.navigationRef?.current) return;

    try {
      const { scheme, host, screens } = this.deepLinkConfig;
      const parsedUrl = new URL(url);
      
      // Check if this is a valid deep link for our app
      const isAppScheme = url.startsWith(`${scheme}`);
      const isUniversalLink = parsedUrl.host === host;
      
      if (!isAppScheme && !isUniversalLink) return;
      
      // Extract the path without leading slash
      const path = parsedUrl.pathname.startsWith('/') 
        ? parsedUrl.pathname.substring(1) 
        : parsedUrl.pathname;
      
      // Find matching screen
      const screenName = screens[path];
      if (!screenName) return;
      
      // Extract query parameters
      const params: NavigationParams = {};
      parsedUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      // Extract journey ID from params or path
      const journeyId = params.journeyId as JourneyId || this.getJourneyFromPath(path);
      if (journeyId && Object.values(JOURNEY_IDS).includes(journeyId)) {
        this.updateJourney(journeyId);
      }
      
      // Navigate to the screen
      this.navigate(screenName, params);
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Extract journey ID from a path if possible
   * @param path URL path
   * @returns Journey ID if found, undefined otherwise
   */
  private getJourneyFromPath(path: string): JourneyId | undefined {
    // Check if path starts with a journey ID
    const pathParts = path.split('/');
    const firstPart = pathParts[0]?.toLowerCase();
    
    if (firstPart === 'health') return JOURNEY_IDS.HEALTH;
    if (firstPart === 'care') return JOURNEY_IDS.CARE;
    if (firstPart === 'plan') return JOURNEY_IDS.PLAN;
    
    return undefined;
  }

  /**
   * Set the callback for journey changes
   * @param callback Function to call when journey changes
   */
  public setJourneyChangeCallback(callback: (journeyId: JourneyId) => void): void {
    this.onJourneyChange = callback;
  }

  /**
   * Update the current journey and notify listeners
   * @param journeyId The new journey ID
   */
  private updateJourney(journeyId: JourneyId): void {
    if (this.currentJourney !== journeyId) {
      this.currentJourney = journeyId;
      if (this.onJourneyChange) {
        this.onJourneyChange(journeyId);
      }
    }
  }

  /**
   * Add a route guard to check before navigation
   * @param guard Function that returns true to allow navigation or false to block
   * @returns Function to remove the guard
   */
  public addRouteGuard(guard: RouteGuard): () => void {
    this.routeGuards.push(guard);
    return () => {
      this.routeGuards = this.routeGuards.filter(g => g !== guard);
    };
  }

  /**
   * Check if navigation should be allowed based on route guards
   * @param routeName Screen to navigate to
   * @param params Navigation parameters
   * @returns Promise that resolves to true if navigation is allowed
   */
  private async checkRouteGuards(routeName: string, params?: NavigationParams): Promise<boolean> {
    for (const guard of this.routeGuards) {
      try {
        const result = await Promise.resolve(guard(routeName, params));
        if (!result) return false;
      } catch (error) {
        console.error('Error in route guard:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Navigate to a screen
   * @param routeName Screen to navigate to
   * @param params Navigation parameters
   * @throws NavigationError if navigation fails
   */
  public async navigate(routeName: string, params?: NavigationParams): Promise<void> {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        routeName,
        params
      );
    }

    try {
      // Check route guards
      const isAllowed = await this.checkRouteGuards(routeName, params);
      if (!isAllowed) {
        throw new NavigationError(
          'Navigation blocked by route guard',
          routeName,
          params
        );
      }

      // Extract journey ID from params if present
      if (params?.journeyId && Object.values(JOURNEY_IDS).includes(params.journeyId)) {
        this.updateJourney(params.journeyId as JourneyId);
      }

      // Perform navigation
      this.navigationRef.current.navigate(routeName, params);
    } catch (error) {
      if (error instanceof NavigationError) {
        throw error;
      } else {
        throw new NavigationError(
          `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
          routeName,
          params,
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * Navigate to a specific journey's main screen
   * @param journeyId Journey to navigate to
   * @param params Additional navigation parameters
   */
  public navigateToJourney(journeyId: JourneyId, params?: NavigationParams): Promise<void> {
    // Map journey IDs to their main screen routes
    const journeyRoutes: Record<JourneyId, string> = {
      [JOURNEY_IDS.HEALTH]: 'HealthDashboard',
      [JOURNEY_IDS.CARE]: 'CareDashboard',
      [JOURNEY_IDS.PLAN]: 'PlanDashboard'
    };

    const routeName = journeyRoutes[journeyId];
    return this.navigate(routeName, { ...params, journeyId });
  }

  /**
   * Go back to the previous screen
   * @param fallbackRoute Route to navigate to if there's no screen to go back to
   */
  public goBack(fallbackRoute?: string): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        'goBack',
        { fallbackRoute }
      );
    }

    try {
      if (this.navigationRef.current.canGoBack()) {
        this.navigationRef.current.goBack();
      } else if (fallbackRoute) {
        this.navigate(fallbackRoute);
      }
    } catch (error) {
      throw new NavigationError(
        `Failed to go back: ${error instanceof Error ? error.message : String(error)}`,
        'goBack',
        { fallbackRoute },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Reset the navigation state to a given route
   * @param routeName Screen to reset to
   * @param params Navigation parameters
   */
  public reset(routeName: string, params?: NavigationParams): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        routeName,
        params
      );
    }

    try {
      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: routeName, params },
          ],
        })
      );
    } catch (error) {
      throw new NavigationError(
        `Failed to reset navigation: ${error instanceof Error ? error.message : String(error)}`,
        routeName,
        params,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Replace the current screen with a new one
   * @param routeName Screen to navigate to
   * @param params Navigation parameters
   */
  public replace(routeName: string, params?: NavigationParams): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        routeName,
        params
      );
    }

    try {
      this.navigationRef.current.dispatch(
        StackActions.replace(routeName, params)
      );
    } catch (error) {
      throw new NavigationError(
        `Failed to replace screen: ${error instanceof Error ? error.message : String(error)}`,
        routeName,
        params,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Push a new screen onto the stack
   * @param routeName Screen to navigate to
   * @param params Navigation parameters
   */
  public push(routeName: string, params?: NavigationParams): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        routeName,
        params
      );
    }

    try {
      this.navigationRef.current.dispatch(
        StackActions.push(routeName, params)
      );
    } catch (error) {
      throw new NavigationError(
        `Failed to push screen: ${error instanceof Error ? error.message : String(error)}`,
        routeName,
        params,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Pop a number of screens from the stack
   * @param count Number of screens to pop (default: 1)
   */
  public pop(count: number = 1): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        'pop',
        { count }
      );
    }

    try {
      this.navigationRef.current.dispatch(
        StackActions.pop(count)
      );
    } catch (error) {
      throw new NavigationError(
        `Failed to pop screen: ${error instanceof Error ? error.message : String(error)}`,
        'pop',
        { count },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Pop to a specific screen in the stack
   * @param routeName Screen to pop to
   */
  public popTo(routeName: string): void {
    if (!this.navigationRef?.current) {
      throw new NavigationError(
        'Navigation failed: Navigation container not initialized',
        routeName
      );
    }

    try {
      // Get the current route name
      const state = this.navigationRef.current.getState();
      const routes = state.routes;
      
      // Find the target route in the stack
      const targetIndex = routes.findIndex(route => route.name === routeName);
      
      if (targetIndex >= 0) {
        // Calculate how many screens to pop
        const currentIndex = state.index;
        const popCount = currentIndex - targetIndex;
        
        if (popCount > 0) {
          this.pop(popCount);
        }
      }
    } catch (error) {
      throw new NavigationError(
        `Failed to pop to screen: ${error instanceof Error ? error.message : String(error)}`,
        routeName,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the current route information
   * @returns Current route name and params, or null if not available
   */
  public getCurrentRoute(): { name: string; params?: NavigationParams } | null {
    if (!this.navigationRef?.current) return null;

    try {
      const route = this.navigationRef.current.getCurrentRoute();
      return route ? { name: route.name, params: route.params } : null;
    } catch (error) {
      console.error('Error getting current route:', error);
      return null;
    }
  }

  /**
   * Check if a specific screen is in the navigation stack
   * @param routeName Screen name to check for
   * @returns True if the screen is in the stack
   */
  public isRouteInStack(routeName: string): boolean {
    if (!this.navigationRef?.current) return false;

    try {
      const state = this.navigationRef.current.getState();
      return state.routes.some(route => route.name === routeName);
    } catch (error) {
      console.error('Error checking route in stack:', error);
      return false;
    }
  }

  /**
   * Create a deep link URL for a specific screen
   * @param routeName Screen to link to
   * @param params Parameters to include in the link
   * @param useUniversalLink Whether to use universal link format (default: false)
   * @returns Deep link URL or null if deep linking is not configured
   */
  public createDeepLink(
    routeName: string, 
    params?: NavigationParams, 
    useUniversalLink: boolean = false
  ): string | null {
    if (!this.deepLinkConfig) return null;

    try {
      const { scheme, host, screens } = this.deepLinkConfig;
      
      // Find the path for this route name
      const path = Object.entries(screens).find(([_, screen]) => screen === routeName)?.[0];
      if (!path) return null;
      
      // Build query string from params
      let queryString = '';
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const search = searchParams.toString();
        if (search) {
          queryString = `?${search}`;
        }
      }
      
      // Create the URL in the appropriate format
      if (useUniversalLink) {
        // Universal link format (https://app.austa.com.br/path)
        return `https://${host}/${path}${queryString}`;
      } else {
        // App scheme format (austa://path)
        return `${scheme}${path}${queryString}`;
      }
    } catch (error) {
      console.error('Error creating deep link:', error);
      return null;
    }
  }

  /**
   * Open a URL in the device's browser
   * @param url URL to open
   * @returns Promise that resolves when the URL is opened
   */
  public async openURL(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      throw new NavigationError(
        `Failed to open URL: ${error instanceof Error ? error.message : String(error)}`,
        'openURL',
        { url },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Add a journey-specific route guard
   * @param journeyId Journey to guard routes for
   * @param guard Function that returns true to allow navigation or false to block
   * @returns Function to remove the guard
   */
  public addJourneyRouteGuard(journeyId: JourneyId, guard: RouteGuard): () => void {
    // Create a wrapper guard that only applies to the specified journey
    const journeyGuard: RouteGuard = (routeName, params) => {
      // Only apply this guard if we're in the specified journey
      if (this.currentJourney === journeyId) {
        return guard(routeName, params);
      }
      // Otherwise, allow navigation
      return true;
    };
    
    return this.addRouteGuard(journeyGuard);
  }
}

// Create and export a singleton instance
const navigationAdapter = new NavigationAdapter();
export default navigationAdapter;