/**
 * @file index.ts
 * @description Exports all custom hooks from the `src/web/mobile/src/hooks` directory and the @austa/journey-context package,
 * providing a single point of import for all hooks. This barrel file enables clean imports like
 * 'import { useAuth, useJourney, useJourneyContext } from 'src/hooks' instead of requiring separate imports
 * from individual files, while also helping maintain consistent hook usage patterns across the codebase.
 */

// Import hooks from local directory
import { useAppointments } from './useAppointments';
import { useAuth } from './useAuth';
import { useClaims } from './useClaims';
import { useCoverage } from './useCoverage';
import { useDevices } from './useDevices';
import { useGamification } from './useGamification';
import { useHealthMetrics } from './useHealthMetrics';
import { useJourney } from './useJourney';
import { useNotifications } from './useNotifications';
import { useTelemedicineSession } from './useTelemedicine';

// Import hooks from @austa/journey-context package
import { useJourney as useJourneyContext } from '@austa/journey-context';

export {
    useAppointments,
    useAuth,
    useClaims,
    useCoverage,
    useDevices,
    useGamification,
    useHealthMetrics,
    useJourney,
    useJourneyContext, // Export the new hook from @austa/journey-context
    useNotifications,
    useTelemedicineSession,
};