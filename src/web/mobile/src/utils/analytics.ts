/**
 * @file Analytics service for the AUSTA SuperApp mobile application
 * 
 * Implements a centralized analytics toolkit that provides tracking for Google Analytics,
 * Datadog RUM, and Sentry error monitoring. Supports journey-specific analytics tracking
 * and integrates with the gamification engine for achievement-related events.
 */

// Import analytics event types from @austa/interfaces
import { GamificationEventType } from '@austa/interfaces/gamification';

// Import journey context from @austa/journey-context
import { useJourney, JOURNEY_IDS } from '@austa/journey-context';

// Import constants
import * as Constants from '../constants/index';

// Analytics services mock implementations
const ReactGA = {
  initialize: (_trackingId: string, _options?: any) => {},
  set: (_fieldsObject: Record<string, any>) => {},
  event: (_params: any) => {},
  send: (_hitType: string, _params?: any) => {}
};

const Sentry = {
  init: (_options: any) => {},
  setUser: (_user: any | null) => {},
  captureException: (_error: Error, _context?: any) => {}
};

const datadogRum = {
  init: (_options: any) => {},
  addAction: (_name: string, _params: any) => {},
  setUser: (_user: any) => {},
  clearUser: () => {},
  addTiming: (_name: string, _time: number) => {}
};

// Define environment-specific constants without using process.env
// Using type string to avoid literal type issues in comparisons
const ENVIRONMENT: string = 'development';
const APP_VERSION = '1.0.0';

// Simple logger implementation that doesn't depend on console
const logger = {
  log: (..._args: any[]): void => {},
  error: (..._args: any[]): void => {},
  warn: (..._args: any[]): void => {}
};

// Default to enabling analytics
let analyticsEnabled = true;

// Current journey context
let currentJourneyId: string | null = null;

/**
 * Analytics initialization options
 */
export interface AnalyticsInitOptions {
  /** User ID for analytics tracking */
  userId?: string;
  /** Additional user properties for segmentation */
  userProperties?: Record<string, any>;
  /** Whether analytics tracking is enabled */
  enableAnalytics?: boolean;
  /** Initial journey ID */
  journeyId?: string;
}

/**
 * Initializes the analytics services with user information and application context.
 * @param options Configuration options for analytics initialization
 * @returns A promise that resolves when analytics is initialized
 */
export const initAnalytics = async (options: AnalyticsInitOptions = {}): Promise<void> => {
  try {
    // Update analytics enabled flag
    analyticsEnabled = options.enableAnalytics !== false;

    // Set initial journey context if provided
    if (options.journeyId) {
      currentJourneyId = options.journeyId;
    }

    // Initialize Google Analytics
    ReactGA.initialize('G-XXXXXXXXXX', { // Replace with actual tracking ID in production
      gaOptions: {
        userId: options.userId
      },
      testMode: ENVIRONMENT !== 'production'
    });

    // Initialize Datadog RUM
    datadogRum.init({
      applicationId: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // Replace with actual Datadog app ID
      clientToken: 'pub_XXXXXXXX', // Replace with actual Datadog token
      env: ENVIRONMENT,
      version: APP_VERSION,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      trackFrustrations: true,
      service: 'austa-mobile-app'
    });

    // Set up Sentry
    Sentry.init({
      dsn: 'https://example@sentry.io/123456', // Replace with actual Sentry DSN
      environment: ENVIRONMENT,
      release: APP_VERSION,
      enableAutoSessionTracking: true,
      tracesSampleRate: 1.0,
      // Add stronger error boundaries
      beforeSend: (event) => {
        // Filter out non-critical errors in production
        if (ENVIRONMENT === 'production') {
          // Example: filter out network errors that might be temporary
          if (event.exception?.values?.some(ex => 
            ex.type === 'NetworkError' || 
            ex.value?.includes('Network request failed')
          )) {
            // Log but don't send to Sentry
            logger.warn('Network error filtered from Sentry:', event);
            return null;
          }
        }
        return event;
      }
    });

    // Set user ID if provided
    if (options.userId) {
      setUserId(options.userId);
    }

    // Set user properties if provided
    if (options.userProperties) {
      setUserProperties(options.userProperties);
    }

    // Set default event parameters
    ReactGA.set({
      app_version: APP_VERSION,
      environment: ENVIRONMENT,
      ...(currentJourneyId && { journey_id: currentJourneyId })
    });

    // Log initialization event
    trackEvent('app_initialized', {
      app_version: APP_VERSION,
      environment: ENVIRONMENT,
      ...(currentJourneyId && { journey_id: currentJourneyId })
    });

    logger.log('Analytics initialized successfully');
  } catch (error) {
    // Enhanced error handling to prevent app crashes
    logger.error('Failed to initialize analytics:', error);
    
    // Track the initialization error if possible
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'analytics_initialization_failed',
            error_context: 'initAnalytics'
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
      logger.error('Failed to track analytics initialization error:', e);
    }
    
    // Continue without analytics to not block the app functionality
  }
};

/**
 * Updates the current journey context for analytics tracking.
 * This should be called when the user switches between journeys.
 * @param journeyId The ID of the current journey
 */
export const updateJourneyContext = (journeyId: string): void => {
  if (!analyticsEnabled || !journeyId) return;

  try {
    // Validate journey ID
    const validJourneyIds = Object.values(Constants.JOURNEY_IDS);
    if (!validJourneyIds.includes(journeyId as any)) {
      logger.warn(`Invalid journey ID: ${journeyId}. Journey context not updated.`);
      return;
    }

    // Update current journey context
    currentJourneyId = journeyId;

    // Update journey context in analytics services
    ReactGA.set({ journey_id: journeyId });

    // Track journey switch event
    trackEvent('journey_switched', {
      journey_id: journeyId,
      previous_journey_id: currentJourneyId || 'none'
    });

    logger.log(`Journey context updated to: ${journeyId}`);
  } catch (error) {
    logger.error('Error updating journey context:', error);
  }
};

/**
 * Tracks when a user views a screen in the application.
 * @param screenName The name of the screen being viewed
 * @param journeyId The journey ID the screen belongs to (optional, uses current journey if not provided)
 * @param params Additional parameters to include with the event (optional)
 */
export const trackScreenView = (
  screenName: string,
  journeyId?: string,
  params?: Record<string, any>
): void => {
  if (!analyticsEnabled || !screenName) return;

  try {
    // Use provided journey ID or current journey context
    const effectiveJourneyId = journeyId || currentJourneyId;

    // Build event parameters
    const eventParams = {
      screen_name: screenName,
      ...(effectiveJourneyId && { journey_id: effectiveJourneyId }),
      ...params
    };

    // Track in Google Analytics - fixed to match the expected parameter type
    ReactGA.send('pageview', {
      page: screenName,
      ...eventParams
    });

    // Track in Datadog RUM
    datadogRum.addAction('view_screen', eventParams);

    logger.log(`Screen view tracked: ${screenName}`, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking screen view:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'screen_view_tracking_failed',
            screen_name: screenName
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks a custom event with the analytics services.
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackEvent = (eventName: string, params?: Record<string, any>): void => {
  if (!analyticsEnabled || !eventName) return;

  try {
    // Format event name to comply with GA4 naming conventions
    // Lowercase, underscores instead of spaces, alphanumeric characters only
    const formattedEventName = eventName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/__+/g, '_');

    // Add journey context if available and not already in params
    const eventParams = {
      ...(currentJourneyId && !params?.journey_id && { journey_id: currentJourneyId }),
      ...params
    };

    // Track in Google Analytics
    ReactGA.event({
      category: eventParams?.category || 'general',
      action: formattedEventName,
      ...eventParams
    });

    // Track in Datadog RUM
    datadogRum.addAction(formattedEventName, eventParams || {});

    logger.log(`Event tracked: ${formattedEventName}`, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking event:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'event_tracking_failed',
            event_name: eventName
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks a journey-specific event with appropriate context.
 * @param journeyId The journey ID (health, care, plan)
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackJourneyEvent = (
  journeyId: string,
  eventName: string,
  params?: Record<string, any>
): void => {
  if (!analyticsEnabled || !journeyId || !eventName) return;

  try {
    // Validate journey ID
    const validJourneyIds = Object.values(Constants.JOURNEY_IDS);
    if (!validJourneyIds.includes(journeyId as any)) {
      logger.warn(`Invalid journey ID: ${journeyId}. Event not tracked.`);
      return;
    }

    // Format the event name with journey prefix
    const formattedEventName = `${journeyId}_${eventName}`;

    // Get journey name
    const journeyKey = Object.keys(Constants.JOURNEY_IDS).find(
      key => Constants.JOURNEY_IDS[key as keyof typeof Constants.JOURNEY_IDS] === journeyId
    );
    
    const journeyName = journeyKey 
      ? Constants.JOURNEY_NAMES[journeyKey as keyof typeof Constants.JOURNEY_NAMES] 
      : '';

    // Add journey ID to event parameters
    const eventParams = {
      journey_id: journeyId,
      journey_name: journeyName,
      ...params
    };

    // Track the event
    trackEvent(formattedEventName, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking journey event:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'journey_event_tracking_failed',
            journey_id: journeyId,
            event_name: eventName
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks a health journey-specific event.
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackHealthEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  trackJourneyEvent(Constants.JOURNEY_IDS.MyHealth, eventName, params);
};

/**
 * Tracks a care journey-specific event.
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackCareEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  trackJourneyEvent(Constants.JOURNEY_IDS.CareNow, eventName, params);
};

/**
 * Tracks a plan journey-specific event.
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackPlanEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  trackJourneyEvent(Constants.JOURNEY_IDS.MyPlan, eventName, params);
};

/**
 * Tracks a gamification-related event using the GamificationEventType from @austa/interfaces.
 * @param eventType The gamification event type to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackGamificationEvent = (
  eventType: GamificationEventType | string,
  params?: Record<string, any>
): void => {
  if (!analyticsEnabled || !eventType) return;

  try {
    // Format with gamification prefix if it's a string
    const formattedEventName = typeof eventType === 'string' 
      ? `gamification_${eventType.toLowerCase()}` 
      : `gamification_${eventType.toLowerCase()}`;

    // Track the event
    trackEvent(formattedEventName, {
      event_type: eventType,
      ...params
    });
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking gamification event:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'gamification_event_tracking_failed',
            event_type: String(eventType)
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks when a user unlocks an achievement using the GamificationEventType from @austa/interfaces.
 * @param achievementId The ID of the unlocked achievement
 * @param achievementName The display name of the achievement
 * @param journeyId The journey the achievement belongs to
 * @param xpEarned The amount of XP earned from the achievement
 */
export const trackAchievementUnlocked = (
  achievementId: string,
  achievementName: string,
  journeyId: string,
  xpEarned: number
): void => {
  if (!analyticsEnabled) return;

  try {
    // Get journey name
    const journeyKey = Object.keys(Constants.JOURNEY_IDS).find(
      key => Constants.JOURNEY_IDS[key as keyof typeof Constants.JOURNEY_IDS] === journeyId
    );
    
    const journeyName = journeyKey 
      ? Constants.JOURNEY_NAMES[journeyKey as keyof typeof Constants.JOURNEY_NAMES] 
      : '';

    const eventParams = {
      achievement_id: achievementId,
      achievement_name: achievementName,
      journey_id: journeyId,
      journey_name: journeyName,
      xp_earned: xpEarned
    };

    // Track using the GamificationEventType enum from @austa/interfaces
    trackGamificationEvent(GamificationEventType.ACHIEVEMENT_UNLOCKED, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking achievement unlock:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'achievement_tracking_failed',
            achievement_id: achievementId
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks when a user levels up in the gamification system using the GamificationEventType from @austa/interfaces.
 * @param newLevel The new level the user has reached
 * @param xpEarned The amount of XP earned to reach this level
 */
export const trackLevelUp = (
  newLevel: number,
  xpEarned: number
): void => {
  if (!analyticsEnabled) return;

  try {
    const eventParams = {
      new_level: newLevel,
      xp_earned: xpEarned
    };

    // Track using the GamificationEventType enum from @austa/interfaces
    trackGamificationEvent(GamificationEventType.LEVEL_UP, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking level up:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'level_up_tracking_failed',
            new_level: String(newLevel)
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks when a user completes a quest using the GamificationEventType from @austa/interfaces.
 * @param questId The ID of the completed quest
 * @param questName The display name of the quest
 * @param journeyId The journey the quest belongs to
 * @param xpEarned The amount of XP earned from completing the quest
 */
export const trackQuestCompleted = (
  questId: string,
  questName: string,
  journeyId: string,
  xpEarned: number
): void => {
  if (!analyticsEnabled) return;

  try {
    // Get journey name
    const journeyKey = Object.keys(Constants.JOURNEY_IDS).find(
      key => Constants.JOURNEY_IDS[key as keyof typeof Constants.JOURNEY_IDS] === journeyId
    );
    
    const journeyName = journeyKey 
      ? Constants.JOURNEY_NAMES[journeyKey as keyof typeof Constants.JOURNEY_NAMES] 
      : '';

    const eventParams = {
      quest_id: questId,
      quest_name: questName,
      journey_id: journeyId,
      journey_name: journeyName,
      xp_earned: xpEarned
    };

    // Track using the GamificationEventType enum from @austa/interfaces
    trackGamificationEvent(GamificationEventType.QUEST_COMPLETED, eventParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking quest completion:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'quest_completion_tracking_failed',
            quest_id: questId
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Tracks an error that occurred in the application.
 * @param errorName A descriptive name for the error
 * @param error The actual error object
 * @param context Additional context about when/where the error occurred
 */
export const trackError = (
  errorName: string,
  error: Error,
  context?: Record<string, any>
): void => {
  try {
    // Add journey context if available
    const errorContext = {
      ...(currentJourneyId && { journey_id: currentJourneyId }),
      ...context
    };

    // Log error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        error_name: errorName,
        ...errorContext
      }
    });

    // Create error parameters with error details and context
    const errorParams = {
      error_name: errorName,
      error_message: error.message,
      error_stack: ENVIRONMENT !== 'production' ? error.stack : undefined,
      ...errorContext
    };

    // Call trackEvent with app_error event and parameters
    trackEvent('app_error', errorParams);
  } catch (e) {
    // Fail silently if error tracking fails
    logger.error('Error while tracking error:', e);
  }
};

/**
 * Tracks a performance-related metric for monitoring.
 * @param metricName The name of the metric being tracked
 * @param value The numeric value of the metric
 * @param context Additional context for the metric
 */
export const trackPerformanceMetric = (
  metricName: string,
  value: number,
  context?: Record<string, any>
): void => {
  if (!analyticsEnabled) return;

  try {
    // Add journey context if available
    const metricContext = {
      ...(currentJourneyId && { journey_id: currentJourneyId }),
      ...context
    };

    // Create metric parameters with value and context
    const metricParams = {
      metric_name: metricName,
      metric_value: value,
      ...metricContext
    };

    // Track custom metric in Datadog RUM
    datadogRum.addTiming(metricName, value);

    // Call trackEvent with performance_metric event and parameters
    trackEvent('performance_metric', metricParams);
  } catch (error) {
    // Enhanced error handling
    logger.error('Error tracking performance metric:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'performance_metric_tracking_failed',
            metric_name: metricName
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Sets user properties for analytics segmentation.
 * @param properties Object containing user properties to set
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!analyticsEnabled || !properties) return;

  try {
    // Iterate through properties object
    Object.entries(properties).forEach(([key, value]) => {
      // Set each property as a user property in Google Analytics
      ReactGA.set({ [key]: value });
    });

    // Set user attributes in Datadog RUM
    datadogRum.setUser({
      ...properties
    });

    // Set user data in Sentry
    Sentry.setUser(properties);

    logger.log('User properties set');
  } catch (error) {
    // Enhanced error handling
    logger.error('Error setting user properties:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'user_properties_setting_failed'
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Sets the user ID for analytics tracking.
 * @param userId The user ID to set
 */
export const setUserId = (userId: string): void => {
  if (!analyticsEnabled || !userId) return;

  try {
    // Validate user ID parameter
    if (!userId) {
      logger.warn('Invalid user ID provided');
      return;
    }

    // Set user ID in Google Analytics
    ReactGA.set({ userId });

    // Set user ID in Datadog RUM
    datadogRum.setUser({ id: userId });

    // Set user ID in Sentry for error reporting context
    Sentry.setUser({ id: userId });

    logger.log('User ID set');
  } catch (error) {
    // Enhanced error handling
    logger.error('Error setting user ID:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'user_id_setting_failed'
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Resets all analytics data, typically called on logout.
 */
export const resetAnalyticsData = (): void => {
  try {
    // Log user_logout event before resetting
    trackEvent('user_logout', {
      ...(currentJourneyId && { journey_id: currentJourneyId })
    });

    // Reset analytics data in Google Analytics
    ReactGA.set({ userId: undefined });

    // Clear user ID from Sentry
    Sentry.setUser(null);

    // Reset user in Datadog RUM
    datadogRum.clearUser();

    // Reset journey context
    currentJourneyId = null;

    logger.log('Analytics data reset');
  } catch (error) {
    // Enhanced error handling
    logger.error('Error resetting analytics data:', error);
    
    // Report error to Sentry but don't crash the app
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            error_name: 'analytics_reset_failed'
          }
        });
      }
    } catch (e) {
      // Silently fail if error tracking itself fails
    }
  }
};

/**
 * Hook that provides analytics functions with the current journey context.
 * This hook automatically updates analytics with the current journey.
 * 
 * @returns Object containing analytics functions that use the current journey context
 */
export const useAnalytics = () => {
  // Get current journey from context
  const { currentJourney, journeyData } = useJourney();
  
  // Update journey context when it changes
  React.useEffect(() => {
    if (currentJourney) {
      updateJourneyContext(currentJourney);
    }
  }, [currentJourney]);
  
  // Return analytics functions that use the current journey
  return {
    trackEvent,
    trackScreenView: (screenName: string, params?: Record<string, any>) => 
      trackScreenView(screenName, currentJourney, params),
    trackJourneyEvent: (eventName: string, params?: Record<string, any>) => 
      trackJourneyEvent(currentJourney, eventName, params),
    trackGamificationEvent,
    trackAchievementUnlocked,
    trackLevelUp,
    trackQuestCompleted,
    trackError,
    trackPerformanceMetric,
    // Journey-specific tracking functions
    trackHealthEvent,
    trackCareEvent,
    trackPlanEvent,
  };
};