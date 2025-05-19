import { useJourneyContext } from '@austa/journey-context';
import { JourneyId } from '@austa/interfaces/common';

/**
 * A custom hook that provides access to the current journey and a function to update it.
 * 
 * This is a wrapper around useJourneyContext from @austa/journey-context that maintains
 * backward compatibility with existing components in the mobile app.
 * 
 * The hook provides access to:
 * - currentJourney: The currently active journey ID
 * - setJourney: Function to change the active journey
 * - journeyData: Additional journey-specific data and state
 * 
 * @returns An object containing the current journey state and methods to update it
 */
export const useJourney = () => {
  return useJourneyContext();
};