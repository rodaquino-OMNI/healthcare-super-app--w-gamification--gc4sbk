import { useMemo } from 'react';
import { JourneyAdapter } from '../adapters';

/**
 * Custom hook that provides access to the platform-specific JourneyAdapter.
 * This hook abstracts the platform-specific implementation details and provides
 * a consistent interface for journey-related operations.
 * 
 * @returns The platform-specific JourneyAdapter instance
 */
export const useJourneyAdapter = () => {
  // Create a memoized instance of the adapter to prevent unnecessary re-renders
  const adapter = useMemo(() => new JourneyAdapter(), []);
  
  return adapter;
};