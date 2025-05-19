/**
 * JourneyContext.tsx
 * 
 * This file serves as an adapter layer that imports and re-exports the journey context
 * functionality from the @austa/journey-context package. It maintains backward compatibility
 * with existing components while delegating the core journey state management logic to the
 * shared package.
 */

import { ReactNode } from 'react';
import {
  JourneyProvider as BaseJourneyProvider,
  useJourney as useBaseJourney,
  JourneyContextType,
  Journey
} from '@austa/journey-context';

// Re-export the Journey type for backward compatibility
export type { Journey };

/**
 * Context for managing the current user journey
 * Re-exported from @austa/journey-context for backward compatibility
 */
export type { JourneyContextType };

/**
 * Props for the JourneyProvider component
 */
interface JourneyProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the JourneyContext
 * This is a thin wrapper around the @austa/journey-context JourneyProvider
 * that adds web-specific adaptations where needed
 */
export const JourneyProvider = ({ children }: JourneyProviderProps) => {
  // Use the base JourneyProvider from @austa/journey-context
  // with platform set to 'web' for web-specific adaptations
  return (
    <BaseJourneyProvider platform="web">
      {children}
    </BaseJourneyProvider>
  );
};

/**
 * Hook to access the JourneyContext
 * This is a re-export of the useJourney hook from @austa/journey-context
 * @returns The journey context value
 * @throws Error if used outside of a JourneyProvider
 */
export const useJourney = (): JourneyContextType => {
  return useBaseJourney();
};