/**
 * @file Journey Interfaces Index
 * 
 * This file serves as the main entry point for all journey interfaces in the AUSTA SuperApp.
 * It re-exports interfaces from their respective journey folders (Health, Care, Plan) to provide
 * a clean, organized API for consumers.
 * 
 * By using this file, consumers can import from '@austa/interfaces/journey' directly
 * without needing to reference specific subfolders, simplifying imports and ensuring
 * consistent usage across the application.
 * 
 * @example
 * // Import interfaces from specific journeys
 * import { IHealthMetric, MetricType } from '@austa/interfaces/journey';
 * import { IAppointment, AppointmentStatus } from '@austa/interfaces/journey';
 * import { IClaim, ClaimStatus } from '@austa/interfaces/journey';
 */

// Export all Health Journey interfaces
export * from './health';

// Export all Care Journey interfaces
export * from './care';

// Export all Plan Journey interfaces
export * from './plan';