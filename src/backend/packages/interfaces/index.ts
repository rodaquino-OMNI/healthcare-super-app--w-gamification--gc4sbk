/**
 * @austa/interfaces
 * 
 * This package provides centralized TypeScript interfaces for all AUSTA SuperApp
 * services, ensuring consistent type definitions across the entire application.
 * 
 * The interfaces are organized by domain (common, auth, journey, gamification)
 * and can be imported either directly from their domain path or through this
 * central entry point.
 * 
 * @example Import all interfaces from a specific domain
 * import { auth } from '@austa/interfaces';
 * 
 * @example Import specific interfaces directly
 * import { Repository } from '@austa/interfaces/common';
 * import { IHealthMetric } from '@austa/interfaces/journey/health';
 */

// Re-export all interfaces from the common domain
export * as common from './common/dto';
export { Repository } from './common/repository.interface';

// Re-export all interfaces from the auth domain
export * as auth from './auth';

// Re-export all interfaces from the journey domain
export * as journey from './journey';

// Re-export all interfaces from the gamification domain
export * as gamification from './gamification';

/**
 * Export specific journey interfaces for direct access
 * This allows consumers to import journey interfaces without
 * having to specify the full path to the journey subdomain.
 */
export * as health from './journey/health';
export * as care from './journey/care';
export * as plan from './journey/plan';