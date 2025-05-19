/**
 * @file Hooks Index
 * 
 * This barrel file exports all custom React hooks from the hooks directory,
 * providing a centralized public API for hook consumption across the application.
 * 
 * Import pattern follows the standardized module resolution strategy:
 * - Hooks from this directory use relative imports
 * - External packages use direct imports from their package names
 * - Shared utilities use absolute imports with path aliases
 */

// Journey-specific hooks
import { useAppointments } from './useAppointments';
import { useClaims } from './useClaims';
import { useCoverage } from './useCoverage';
import { useDevices } from './useDevices';
import { useHealthMetrics } from './useHealthMetrics';
import { useTelemedicine } from './useTelemedicine';

// Cross-journey hooks
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { useJourney } from './useJourney';
import { useNotifications } from './useNotifications';

/**
 * Exports the hook for managing appointments in the Care Now journey.
 * @see useAppointments
 */
export { useAppointments };

/**
 * Exports the hook for authentication functionality.
 * @see useAuth
 */
export { useAuth };

/**
 * Exports the hook for managing insurance claims in the My Plan journey.
 * @see useClaims
 */
export { useClaims };

/**
 * Exports the hook for accessing insurance coverage information in the My Plan journey.
 */
export { useCoverage };

/**
 * Exports the hook for managing connected health devices in the My Health journey.
 * @see useDevices
 */
export { useDevices };

/**
 * Exports the hook for accessing gamification features across all journeys.
 * @see useGamification
 */
export { useGamification };

/**
 * Exports the hook for fetching and managing health metrics in the My Health journey.
 * @see useHealthMetrics
 */
export { useHealthMetrics };

/**
 * Exports the hook for managing the current journey context.
 * @see useJourney
 */
export { useJourney };

/**
 * Exports the hook for managing user notifications across all journeys.
 * @see useNotifications
 */
export { useNotifications };

/**
 * Exports the hook for managing telemedicine sessions in the Care Now journey.
 * @see useTelemedicine
 */
export { useTelemedicine };