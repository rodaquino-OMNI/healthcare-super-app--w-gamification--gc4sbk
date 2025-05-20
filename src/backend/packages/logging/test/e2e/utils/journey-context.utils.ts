/**
 * @file Journey Context Utilities for E2E Testing
 * @description Provides utilities for creating and manipulating journey-specific contexts in tests.
 * These utilities make it easy to generate realistic journey contexts for testing that logs
 * correctly include journey context information.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  JourneyContext,
  JourneyState,
  JourneyType,
  CrossJourneyContext,
  LoggingContext
} from '../../../src/context';

/**
 * Default base context properties that are common across all logging contexts
 */
const DEFAULT_BASE_CONTEXT: Partial<LoggingContext> = {
  correlationId: uuidv4(),
  timestamp: new Date().toISOString(),
  serviceName: 'test-service',
  applicationName: 'austa-superapp',
  environment: 'test',
  version: '1.0.0',
};

/**
 * Creates a timestamp string in ISO format for a specified number of minutes ago
 * @param minutesAgo Number of minutes in the past
 * @returns ISO timestamp string
 */
export function createTimestampMinutesAgo(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

/**
 * Creates a basic journey state object with default values
 * @param overrides Optional properties to override defaults
 * @returns JourneyState object
 */
export function createJourneyState(overrides: Partial<JourneyState> = {}): JourneyState {
  return {
    journeySessionId: uuidv4(),
    currentStep: 'dashboard',
    previousStep: 'login',
    stepDuration: 45000, // 45 seconds in milliseconds
    ...overrides,
  };
}

/**
 * Creates a cross-journey context for testing flows between journeys
 * @param sourceJourney The source journey type
 * @param targetJourney The target journey type
 * @param overrides Optional properties to override defaults
 * @returns CrossJourneyContext object
 */
export function createCrossJourneyContext(
  sourceJourney: JourneyType,
  targetJourney: JourneyType,
  overrides: Partial<CrossJourneyContext> = {}
): CrossJourneyContext {
  return {
    sourceJourney,
    targetJourney,
    flowId: uuidv4(),
    startedAt: new Date().toISOString(),
    metadata: {
      reason: 'User initiated journey switch',
      entryPoint: 'navigation_menu',
    },
    ...overrides,
  };
}

/**
 * Creates business transaction data for journey context
 * @param transactionType Type of business transaction
 * @param status Current status of the transaction
 * @param overrides Optional properties to override defaults
 * @returns Business transaction object
 */
export function createBusinessTransaction(
  transactionType: string,
  status: string,
  overrides: Partial<JourneyContext['businessTransaction']> = {}
): NonNullable<JourneyContext['businessTransaction']> {
  return {
    transactionId: uuidv4(),
    transactionType,
    status,
    startedAt: createTimestampMinutesAgo(5),
    updatedAt: new Date().toISOString(),
    metadata: {
      originatedFrom: 'mobile_app',
      priority: 'normal',
    },
    ...overrides,
  };
}

/**
 * Creates user interaction data for journey context
 * @param interactionType Type of user interaction
 * @param interactionTarget Target of the interaction
 * @param overrides Optional properties to override defaults
 * @returns User interaction object
 */
export function createUserInteraction(
  interactionType: string,
  interactionTarget: string,
  overrides: Partial<JourneyContext['userInteraction']> = {}
): NonNullable<JourneyContext['userInteraction']> {
  return {
    interactionType,
    interactionTarget,
    interactionResult: 'success',
    interactionDuration: 350, // 350 milliseconds
    ...overrides,
  };
}

/**
 * Creates journey performance metrics for testing
 * @param overrides Optional properties to override defaults
 * @returns Journey performance object
 */
export function createJourneyPerformance(
  overrides: Partial<NonNullable<JourneyContext['journeyPerformance']>> = {}
): NonNullable<JourneyContext['journeyPerformance']> {
  return {
    timeToInteractive: 1200, // 1.2 seconds
    actionDuration: 350, // 350 milliseconds
    apiCallCount: 3,
    renderTime: 250, // 250 milliseconds
    networkLatency: 120, // 120 milliseconds
    ...overrides,
  };
}

/**
 * Creates a complete Health journey context for testing
 * @param userId Optional user ID
 * @param overrides Optional properties to override defaults
 * @returns JourneyContext for Health journey
 */
export function createHealthJourneyContext(
  userId?: string,
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  return {
    ...DEFAULT_BASE_CONTEXT,
    journeyType: JourneyType.HEALTH,
    userId,
    journeyState: createJourneyState({
      currentStep: 'health_dashboard',
      previousStep: 'health_metrics',
    }),
    journeyFeatureFlags: {
      enableWearableSync: true,
      showHealthInsights: true,
      enableGoalTracking: true,
    },
    journeyPerformance: createJourneyPerformance({
      healthMetricsLoadTime: 450, // 450 milliseconds
    }),
    businessTransaction: createBusinessTransaction('health_metric_update', 'completed'),
    userInteraction: createUserInteraction('view', 'health_dashboard'),
    ...overrides,
  } as JourneyContext;
}

/**
 * Creates a complete Care journey context for testing
 * @param userId Optional user ID
 * @param overrides Optional properties to override defaults
 * @returns JourneyContext for Care journey
 */
export function createCareJourneyContext(
  userId?: string,
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  return {
    ...DEFAULT_BASE_CONTEXT,
    journeyType: JourneyType.CARE,
    userId,
    journeyState: createJourneyState({
      currentStep: 'appointment_booking',
      previousStep: 'provider_search',
    }),
    journeyFeatureFlags: {
      enableTelemedicine: true,
      showProviderRatings: true,
      enableInstantBooking: false,
    },
    journeyPerformance: createJourneyPerformance({
      providerSearchTime: 650, // 650 milliseconds
    }),
    businessTransaction: createBusinessTransaction('appointment_booking', 'in_progress'),
    userInteraction: createUserInteraction('form_submit', 'appointment_form'),
    ...overrides,
  } as JourneyContext;
}

/**
 * Creates a complete Plan journey context for testing
 * @param userId Optional user ID
 * @param overrides Optional properties to override defaults
 * @returns JourneyContext for Plan journey
 */
export function createPlanJourneyContext(
  userId?: string,
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  return {
    ...DEFAULT_BASE_CONTEXT,
    journeyType: JourneyType.PLAN,
    userId,
    journeyState: createJourneyState({
      currentStep: 'claim_submission',
      previousStep: 'coverage_details',
    }),
    journeyFeatureFlags: {
      enableDigitalCards: true,
      showCoverageComparison: true,
      enableClaimTracking: true,
    },
    journeyPerformance: createJourneyPerformance({
      coverageCheckTime: 550, // 550 milliseconds
    }),
    businessTransaction: createBusinessTransaction('claim_submission', 'submitted'),
    userInteraction: createUserInteraction('upload', 'claim_documents'),
    ...overrides,
  } as JourneyContext;
}

/**
 * Creates a cross-journey context that spans multiple journeys
 * @param sourceJourney The source journey type
 * @param targetJourney The target journey type
 * @param userId Optional user ID
 * @param overrides Optional properties to override defaults
 * @returns JourneyContext with cross-journey information
 */
export function createCrossJourneyFlowContext(
  sourceJourney: JourneyType,
  targetJourney: JourneyType,
  userId?: string,
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  return {
    ...DEFAULT_BASE_CONTEXT,
    journeyType: sourceJourney,
    userId,
    journeyState: createJourneyState({
      currentStep: 'transition',
    }),
    crossJourneyContext: createCrossJourneyContext(sourceJourney, targetJourney),
    journeyFeatureFlags: {
      enableCrossJourneyNavigation: true,
      preserveJourneyState: true,
    },
    businessTransaction: createBusinessTransaction('cross_journey_navigation', 'in_progress'),
    userInteraction: createUserInteraction('navigation', 'journey_switcher'),
    ...overrides,
  } as JourneyContext;
}

/**
 * Verifies that a journey context contains all required properties
 * @param context The journey context to verify
 * @returns Boolean indicating if the context is valid
 */
export function isValidJourneyContext(context: JourneyContext): boolean {
  return (
    !!context &&
    !!context.journeyType &&
    !!context.correlationId &&
    !!context.timestamp &&
    !!context.serviceName &&
    !!context.applicationName &&
    !!context.environment &&
    !!context.version
  );
}

/**
 * Verifies that a journey context contains journey-specific properties for the given journey type
 * @param context The journey context to verify
 * @param journeyType The expected journey type
 * @returns Boolean indicating if the context has the expected journey-specific properties
 */
export function hasJourneySpecificProperties(
  context: JourneyContext,
  journeyType: JourneyType
): boolean {
  if (!isValidJourneyContext(context) || context.journeyType !== journeyType) {
    return false;
  }

  // Check for journey-specific feature flags based on journey type
  switch (journeyType) {
    case JourneyType.HEALTH:
      return (
        !!context.journeyFeatureFlags?.enableWearableSync !== undefined &&
        !!context.journeyFeatureFlags?.showHealthInsights !== undefined
      );
    case JourneyType.CARE:
      return (
        !!context.journeyFeatureFlags?.enableTelemedicine !== undefined &&
        !!context.journeyFeatureFlags?.showProviderRatings !== undefined
      );
    case JourneyType.PLAN:
      return (
        !!context.journeyFeatureFlags?.enableDigitalCards !== undefined &&
        !!context.journeyFeatureFlags?.showCoverageComparison !== undefined
      );
    default:
      return false;
  }
}

/**
 * Creates a journey context with randomized data for testing
 * @param journeyType Optional journey type (random if not specified)
 * @param userId Optional user ID
 * @returns JourneyContext with randomized data
 */
export function createRandomJourneyContext(
  journeyType?: JourneyType,
  userId?: string
): JourneyContext {
  // If no journey type specified, pick one randomly
  const type = journeyType || [
    JourneyType.HEALTH,
    JourneyType.CARE,
    JourneyType.PLAN
  ][Math.floor(Math.random() * 3)];
  
  // Create journey context based on the selected type
  switch (type) {
    case JourneyType.HEALTH:
      return createHealthJourneyContext(userId);
    case JourneyType.CARE:
      return createCareJourneyContext(userId);
    case JourneyType.PLAN:
      return createPlanJourneyContext(userId);
    default:
      return createHealthJourneyContext(userId);
  }
}