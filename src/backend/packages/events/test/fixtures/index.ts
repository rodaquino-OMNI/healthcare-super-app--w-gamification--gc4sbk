/**
 * @file index.ts
 * @description Barrel file that exports all test fixtures from the events package.
 * This file consolidates exports from all other fixture files, enabling consumers to import
 * test data with a single import statement. It simplifies test setup by providing a unified
 * entry point to access event test fixtures across all journeys.
 */

// Re-export all base event fixtures
export * from './base-events';

// Re-export journey-specific event fixtures
import * as HealthEvents from './health-events';
import * as CareEvents from './care-events';
import * as PlanEvents from './plan-events';

// Re-export validation and versioning fixtures
import * as ValidationEvents from './validation-events';
import * as EventVersions from './event-versions';

// Re-export Kafka-specific fixtures
import * as KafkaEvents from './kafka-events';

/**
 * Namespace for Health journey event fixtures
 */
export const Health = HealthEvents;

/**
 * Namespace for Care journey event fixtures
 */
export const Care = CareEvents;

/**
 * Namespace for Plan journey event fixtures
 */
export const Plan = PlanEvents;

/**
 * Namespace for validation test fixtures
 */
export const Validation = ValidationEvents;

/**
 * Namespace for event versioning test fixtures
 */
export const Versions = EventVersions;

/**
 * Namespace for Kafka-specific event fixtures
 */
export const Kafka = KafkaEvents;

/**
 * Convenience object containing all journey-specific event collections
 */
export const Collections = {
  /**
   * Complete set of Health journey events for a user
   */
  Health: HealthEvents.createCompleteHealthEventSet,
  
  /**
   * Complete set of Care journey events for a user
   */
  Care: CareEvents.createCompleteCareEventSet,
  
  /**
   * Complete set of Plan journey events for a user
   */
  Plan: PlanEvents.createCompletePlanEventSet,
  
  /**
   * Creates a complete set of events across all journeys for a user
   * 
   * @param userId - The user ID
   * @returns An array of events from all journeys
   */
  createCompleteUserEventSet: (userId: string) => [
    ...HealthEvents.createCompleteHealthEventSet(userId),
    ...CareEvents.createCompleteCareEventSet(userId),
    ...PlanEvents.createCompletePlanEventSet(userId)
  ]
};

/**
 * Factory functions for creating common event scenarios
 */
export const Scenarios = {
  /**
   * Creates a set of events representing a user's first day onboarding
   * 
   * @param userId - The user ID
   * @returns An array of events representing first-day onboarding
   */
  createFirstDayOnboardingEvents: (userId: string) => [
    ...HealthEvents.createHealthGoalEventsCollection(userId),
    CareEvents.createProfileCompletedEvent(userId),
    PlanEvents.createPlanSelectedEvent(userId, 'standard-plan')
  ],
  
  /**
   * Creates a set of events representing a user achieving their first health goal
   * 
   * @param userId - The user ID
   * @returns An array of events for first goal achievement
   */
  createFirstGoalAchievementEvents: (userId: string) => {
    const goalId = `goal-steps-${Math.random().toString(36).substring(2, 10)}`;
    return [
      HealthEvents.createHealthGoalCreatedEvent(userId, 'STEPS', 10000),
      HealthEvents.createStepsRecordedEvent(userId, 10500),
      HealthEvents.createHealthGoalAchievedEvent(userId, goalId, 'STEPS', 10000, true)
    ];
  },
  
  /**
   * Creates a set of events representing a user completing a care appointment
   * 
   * @param userId - The user ID
   * @returns An array of events for appointment completion
   */
  createAppointmentCompletionEvents: (userId: string) => {
    const appointmentId = `appointment-${Math.random().toString(36).substring(2, 10)}`;
    return [
      CareEvents.createAppointmentBookedEvent(userId, appointmentId),
      CareEvents.createAppointmentCheckedInEvent(userId, appointmentId),
      CareEvents.createAppointmentCompletedEvent(userId, appointmentId)
    ];
  },
  
  /**
   * Creates a set of events representing a user submitting and receiving approval for a claim
   * 
   * @param userId - The user ID
   * @returns An array of events for claim submission and approval
   */
  createClaimApprovalEvents: (userId: string) => {
    const claimId = `claim-${Math.random().toString(36).substring(2, 10)}`;
    return [
      PlanEvents.createClaimSubmittedEvent(userId, claimId),
      PlanEvents.createClaimDocumentsUploadedEvent(userId, claimId),
      PlanEvents.createClaimApprovedEvent(userId, claimId)
    ];
  }
};

/**
 * Factory functions for creating events with specific characteristics for testing
 */
export const TestUtils = {
  /**
   * Creates a batch of events with timestamps spread over a specific time period
   * 
   * @param userId - The user ID
   * @param startDate - The start date for the events
   * @param endDate - The end date for the events
   * @param count - The number of events to create
   * @returns An array of events with timestamps spread between startDate and endDate
   */
  createTimePeriodEvents: (userId: string, startDate: Date, endDate: Date, count: number) => {
    const events = [];
    const startTime = startDate.getTime();
    const timeRange = endDate.getTime() - startTime;
    const timeStep = timeRange / (count - 1);
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(startTime + (i * timeStep)).toISOString();
      events.push({
        ...HealthEvents.createHeartRateRecordedEvent(userId, 70 + Math.floor(Math.random() * 20)),
        timestamp
      });
    }
    
    return events;
  },
  
  /**
   * Creates a set of events with correlation IDs for testing event chains
   * 
   * @param userId - The user ID
   * @returns An array of correlated events
   */
  createCorrelatedEventChain: (userId: string) => {
    const correlationId = `corr-${Math.random().toString(36).substring(2, 10)}`;
    return [
      { ...HealthEvents.createHealthGoalCreatedEvent(userId, 'STEPS', 10000), correlationId },
      { ...HealthEvents.createStepsRecordedEvent(userId, 10500), correlationId },
      { ...HealthEvents.createHealthGoalAchievedEvent(userId, 'goal-123', 'STEPS', 10000, true), correlationId }
    ];
  }
};