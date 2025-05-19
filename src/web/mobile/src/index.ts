/**
 * @file Main entry point for the AUSTA SuperApp mobile application
 * 
 * This file serves as a centralized entry point for accessing key components, hooks, 
 * utilities, and types throughout the mobile application. It simplifies imports and 
 * ensures consistent module resolution across the codebase.
 */

// Import from new packages
// Design System Primitives
import * as primitives from '@design-system/primitives';
export { primitives };

// Design System Components
import * as designSystem from '@austa/design-system';
export { designSystem };

// Shared Interfaces
import * as interfaces from '@austa/interfaces';
export { interfaces };

// Journey Context
import * as journeyContext from '@austa/journey-context';
export { journeyContext };

// Re-export API modules
export * from './api';

// Re-export components
export * from './components';

// Re-export constants
export * from './constants';

// Re-export context
export * from './context';

// Re-export hooks
export * from './hooks';

// Re-export i18n
export * from './i18n';

// Re-export navigation
export * from './navigation';

// Re-export screens
export * from './screens';

// Re-export types
export * from './types';

// Re-export utilities
export * from './utils';

// Export specific journey-related utilities
export { useJourney } from './hooks/useJourney';
export { useAuth } from './hooks/useAuth';
export { useGamification } from './hooks/useGamification';

// Export specific components for direct access
export { JourneyHeader } from './components/shared/JourneyHeader';
export { LoadingIndicator } from './components/shared/LoadingIndicator';
export { ErrorState } from './components/shared/ErrorState';
export { EmptyState } from './components/shared/EmptyState';

// Export specific utilities for direct access
export { formatDate, formatRelativeDate } from './utils/date';
export { trackEvent, trackScreenView, trackJourneyEvent } from './utils/analytics';