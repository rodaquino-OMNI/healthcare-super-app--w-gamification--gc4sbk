// Import types from @austa/interfaces instead of local type definitions
import { GamificationEventType, BaseGamificationEvent } from '@austa/interfaces/gamification/events';
import { JourneyId } from '@austa/interfaces/common';

// Import journey context from @austa/journey-context
import { useJourney } from '@austa/journey-context';

// Import constants
import * as Constants from '../constants';

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
  captureException: (_error: Error, _context?: any) => {},
  withScope: (_callback: (scope: any) => void) => {}
};

const datadogRum = {
  init: (_options: any) => {},
  addAction: (_name: string, _params: any) => {},
  setUser: (_user: any) => {},
  clearUser: () => {},
  addTiming: (_name: string, _time: number) => {},
  addError: (_error: Error, _source?: string, _context?: any) => {}
};

// Define environment-specific constants without using process.env
// Using type string to avoid literal type issues in comparisons
const ENVIRONMENT: string = 'development';
const APP_VERSION = '1.0.0';

// Enhanced logger implementation with better error handling
const logger = {
  log: (...args: any[]): void => {
    if (ENVIRONMENT !== 'production') {
      try {
        console.log('[Analytics]', ...args);
      } catch (e) {
        // Silent fail for logging errors
      }
    }
  },
  error: (...args: any[]): void => {
    if (ENVIRONMENT !== 'production') {
      try {
        console.error('[Analytics Error]', ...args);
      } catch (e) {
        // Silent fail for logging errors
      }
    }
  },
  warn: (...args: any[]): void => {
    if (ENVIRONMENT !== 'production') {
      try {
        console.warn('[Analytics Warning]', ...args);
      } catch (e) {
        // Silent fail for logging errors
      }
    }
  }
};

// Default to enabling analytics
let analyticsEnabled = true;

// Track current journey context for analytics
let currentJourneyId: JourneyId | null = null;

/**
 * Analytics initialization options
 */
export interface AnalyticsInitOptions {
  userId?: string;
  userProperties?: Record<string, any>;
  enableAnalytics?: boolean;
  currentJourneyId?: JourneyId;
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

    // Set current journey if provided
    if (options.currentJourneyId) {
      currentJourneyId = options.currentJourneyId;
    }

    // Initialize Google Analytics
    ReactGA.initialize('G-XXXXXXXXXX', { // Replace with actual tracking ID in production
      gaOptions: {
        userId: options.userId
      },
      testMode: ENVIRONMENT !== 'production'
    });

    // Initialize Datadog RUM with enhanced error handling
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

    // Set up Sentry with enhanced error handling
    Sentry.init({
      dsn: 'https://example@sentry.io/123456', // Replace with actual Sentry DSN
      environment: ENVIRONMENT,
      release: APP_VERSION,
      enableAutoSessionTracking: true,
      tracesSampleRate: 1.0,
      beforeSend: (event: any) => {
        // Add journey context to all error events
        if (currentJourneyId && event.tags) {
          event.tags.journey_id = currentJourneyId;
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
      environment: ENVIRONMENT
    });

    // Log initialization event
    trackEvent('app_initialized', {
      app_version: APP_VERSION,
      environment: ENVIRONMENT,
      ...(currentJourneyId && { current_journey: currentJourneyId })
    });

    logger.log('Analytics initialized successfully');
  } catch (error) {
    // Enhanced error handling to prevent app crashes
    logger.error('Failed to initialize analytics:', error);
    
    // Attempt to record the initialization failure if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Analytics initialization failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
    
    // Continue without analytics to not block the app functionality
  }
};

/**
 * Updates the current journey ID for analytics context
 * @param journeyId The current journey ID
 */
export const updateAnalyticsJourney = (journeyId: JourneyId): void => {
  if (!journeyId) return;

  try {
    // Update the current journey ID
    currentJourneyId = journeyId;

    // Track journey change event
    trackEvent('journey_changed', {
      journey_id: journeyId
    });

    logger.log(`Analytics journey updated to: ${journeyId}`);
  } catch (error) {
    logger.error('Error updating analytics journey:', error);
  }
};

/**
 * Tracks when a user views a screen in the application.
 * @param screenName The name of the screen being viewed
 * @param journeyId The journey ID the screen belongs to (optional, defaults to current journey)
 * @param params Additional parameters to include with the event (optional)
 */
export const trackScreenView = (
  screenName: string,
  journeyId?: JourneyId,
  params?: Record<string, any>
): void => {
  if (!analyticsEnabled || !screenName) return;

  try {
    // Use provided journeyId or fall back to current journey
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
    logger.error('Error tracking screen view:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Screen view tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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

    // Add current journey context if available and not already provided
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
    logger.error('Error tracking event:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Event tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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
  journeyId: JourneyId,
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
    logger.error('Error tracking journey event:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Journey event tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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
  trackJourneyEvent(Constants.JOURNEY_IDS.MyHealth as JourneyId, eventName, params);
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
  trackJourneyEvent(Constants.JOURNEY_IDS.CareNow as JourneyId, eventName, params);
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
  trackJourneyEvent(Constants.JOURNEY_IDS.MyPlan as JourneyId, eventName, params);
};

/**
 * Tracks a gamification-related event.
 * @param eventName The name of the event to track
 * @param params Additional parameters to include with the event (optional)
 */
export const trackGamificationEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  if (!analyticsEnabled || !eventName) return;

  try {
    // Format with gamification prefix
    const formattedEventName = `gamification_${eventName}`;

    // Add current journey context if available and not already provided
    const eventParams = {
      ...(currentJourneyId && !params?.journey_id && { journey_id: currentJourneyId }),
      ...params
    };

    // Track the event
    trackEvent(formattedEventName, eventParams);
  } catch (error) {
    logger.error('Error tracking gamification event:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Gamification event tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
  }
};

/**
 * Tracks when a user unlocks an achievement.
 * @param achievementId The ID of the unlocked achievement
 * @param achievementName The display name of the achievement
 * @param journeyId The journey the achievement belongs to
 * @param xpEarned The amount of XP earned from the achievement
 */
export const trackAchievementUnlocked = (
  achievementId: string,
  achievementName: string,
  journeyId: JourneyId,
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

    // Track as a gamification event
    trackGamificationEvent('achievement_unlocked', eventParams);

    // Also send to Datadog RUM as a specific action for better visibility
    datadogRum.addAction('achievement_unlocked', eventParams);
  } catch (error) {
    logger.error('Error tracking achievement unlock:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Achievement tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
  }
};

/**
 * Tracks when a user levels up in the gamification system.
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
      xp_earned: xpEarned,
      ...(currentJourneyId && { journey_id: currentJourneyId })
    };

    // Track as a gamification event
    trackGamificationEvent('level_up', eventParams);

    // Also send to Datadog RUM as a specific action for better visibility
    datadogRum.addAction('level_up', eventParams);
  } catch (error) {
    logger.error('Error tracking level up:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Level up tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
  }
};

/**
 * Tracks when a user completes a quest in the gamification system.
 * @param questId The ID of the completed quest
 * @param questName The display name of the quest
 * @param journeyId The journey the quest belongs to (optional)
 * @param xpEarned The amount of XP earned from the quest
 */
export const trackQuestCompleted = (
  questId: string,
  questName: string,
  journeyId?: JourneyId,
  xpEarned?: number
): void => {
  if (!analyticsEnabled) return;

  try {
    // Use provided journeyId or fall back to current journey
    const effectiveJourneyId = journeyId || currentJourneyId;

    // Get journey name if journey ID is available
    let journeyName = '';
    if (effectiveJourneyId) {
      const journeyKey = Object.keys(Constants.JOURNEY_IDS).find(
        key => Constants.JOURNEY_IDS[key as keyof typeof Constants.JOURNEY_IDS] === effectiveJourneyId
      );
      
      journeyName = journeyKey 
        ? Constants.JOURNEY_NAMES[journeyKey as keyof typeof Constants.JOURNEY_NAMES] 
        : '';
    }

    const eventParams = {
      quest_id: questId,
      quest_name: questName,
      ...(effectiveJourneyId && { journey_id: effectiveJourneyId, journey_name: journeyName }),
      ...(xpEarned !== undefined && { xp_earned: xpEarned })
    };

    // Track as a gamification event
    trackGamificationEvent('quest_completed', eventParams);

    // Also send to Datadog RUM as a specific action for better visibility
    datadogRum.addAction('quest_completed', eventParams);
  } catch (error) {
    logger.error('Error tracking quest completion:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Quest completion tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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
    // Add journey context if available and not already provided
    const errorContext = {
      ...(currentJourneyId && !context?.journey_id && { journey_id: currentJourneyId }),
      ...context
    };

    // Log error to Sentry with enhanced context
    Sentry.withScope((scope: any) => {
      // Add tags for filtering in Sentry UI
      scope.setTags({
        error_name: errorName,
        ...(errorContext && errorContext)
      });

      // Add extra context data
      if (errorContext) {
        Object.entries(errorContext).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });

    // Log error to Datadog RUM
    datadogRum.addError(error, errorName, errorContext);

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
    // Add journey context if available and not already provided
    const metricContext = {
      ...(currentJourneyId && !context?.journey_id && { journey_id: currentJourneyId }),
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
    logger.error('Error tracking performance metric:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Performance metric tracking failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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
    logger.error('Error setting user properties:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Setting user properties failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
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
    logger.error('Error setting user ID:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Setting user ID failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
  }
};

/**
 * Resets all analytics data, typically called on logout.
 */
export const resetAnalyticsData = (): void => {
  try {
    // Log user_logout event before resetting
    trackEvent('user_logout');

    // Reset analytics data in Google Analytics
    ReactGA.set({ userId: undefined });

    // Clear user ID from Sentry
    Sentry.setUser(null);

    // Reset user in Datadog RUM
    datadogRum.clearUser();

    // Reset current journey ID
    currentJourneyId = null;

    logger.log('Analytics data reset');
  } catch (error) {
    logger.error('Error resetting analytics data:', error);
    
    // Attempt to record the error if possible
    try {
      if (Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error instanceof Error ? error : new Error('Resetting analytics data failed'));
      }
    } catch (e) {
      // Silent fail for error reporting errors
    }
  }
};

/**
 * Hook that provides analytics functions with current journey context.
 * This hook should be used in components that need to track analytics events.
 * @returns Object containing analytics functions with journey context
 */
export const useAnalytics = () => {
  // Get current journey from context
  const { currentJourney } = useJourney();
  
  // Update analytics journey when journey changes
  React.useEffect(() => {
    if (currentJourney?.id) {
      updateAnalyticsJourney(currentJourney.id as JourneyId);
    }
  }, [currentJourney?.id]);

  return {
    trackEvent,
    trackScreenView: (screenName: string, params?: Record<string, any>) => 
      trackScreenView(screenName, currentJourney?.id as JourneyId, params),
    trackJourneyEvent: (eventName: string, params?: Record<string, any>) => 
      currentJourney?.id ? trackJourneyEvent(currentJourney.id as JourneyId, eventName, params) : undefined,
    trackHealthEvent,
    trackCareEvent,
    trackPlanEvent,
    trackGamificationEvent,
    trackAchievementUnlocked,
    trackLevelUp,
    trackQuestCompleted,
    trackError,
    trackPerformanceMetric,
    setUserProperties,
    setUserId,
    resetAnalyticsData
  };
};