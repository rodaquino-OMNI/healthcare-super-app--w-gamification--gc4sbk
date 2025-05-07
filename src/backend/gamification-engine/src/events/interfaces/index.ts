/**
 * Barrel file for event interfaces
 * 
 * This file exports all event interfaces from the folder, providing a single entry point
 * for importing event-related interfaces. This simplifies imports and ensures consistent
 * usage patterns throughout the codebase.
 */

// Export event interfaces
export * from './event.interface';
export * from './event-handler.interface';
export * from './event-response.interface';
export * from './event-type.interface';
export * from './event-versioning.interface';
export * from './journey-events.interface';

// Re-export relevant interfaces from @austa/interfaces
export { 
  // Health journey interfaces
  IHealthMetric,
  IHealthGoal,
  MetricType,
  GoalType,
  GoalStatus,
  GoalPeriod
} from '@austa/interfaces/journey/health';

export {
  // Care journey interfaces
  IAppointment,
  IMedication,
  ITelemedicineSession,
  AppointmentType,
  AppointmentStatus
} from '@austa/interfaces/journey/care';

export {
  // Plan journey interfaces
  IClaim,
  IBenefit,
  IPlan,
  ClaimStatus
} from '@austa/interfaces/journey/plan';