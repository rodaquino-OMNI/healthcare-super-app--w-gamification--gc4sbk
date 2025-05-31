import React from 'react';
import { useEffect, useState } from 'react';
import { Decorator } from '@storybook/react';
import { useGlobals, useParameter } from '@storybook/preview-api';
import { JourneyProvider, JOURNEY_IDS, Journey, JourneyId } from '@austa/journey-context';

/**
 * Parameter interface for journey decorator configuration
 */
export interface JourneyDecoratorParams {
  /**
   * Default journey to use for the story
   */
  defaultJourney?: JourneyId;
  
  /**
   * Whether to disable journey selection for this story
   */
  disableJourneySelection?: boolean;
  
  /**
   * List of journeys to include (if not specified, all journeys are included)
   */
  includeJourneys?: JourneyId[];
  
  /**
   * List of journeys to exclude
   */
  excludeJourneys?: JourneyId[];
  
  /**
   * Callback when journey changes
   */
  onJourneyChange?: (journeyId: JourneyId, journey: Journey) => void;
}

/**
 * Default parameters for the journey decorator
 */
const DEFAULT_PARAMS: JourneyDecoratorParams = {
  defaultJourney: JOURNEY_IDS.HEALTH,
  disableJourneySelection: false,
  includeJourneys: [JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN],
  excludeJourneys: [],
};

/**
 * Journey Decorator for Storybook
 * 
 * This decorator wraps stories with the JourneyProvider from @austa/journey-context,
 * allowing components to access and respond to journey-specific state. It enables
 * testing of components in different journey contexts (health, care, plan) directly
 * within Storybook.
 * 
 * The decorator adds a toolbar button for quick journey switching and provides
 * parameters for configuring the available journeys and default selection.
 */
export const JourneyDecorator: Decorator = (Story, context) => {
  // Get journey parameters from the story
  const params = {
    ...DEFAULT_PARAMS,
    ...useParameter<JourneyDecoratorParams>('journey', {}),
  };
  
  // Get the current journey from globals (set by toolbar)
  const [globals, updateGlobals] = useGlobals();
  const globalJourney = globals.journey as JourneyId | undefined;
  
  // Determine which journey to use (global selection or default from params)
  const [currentJourney, setCurrentJourney] = useState<JourneyId>(
    globalJourney || params.defaultJourney || JOURNEY_IDS.HEALTH
  );
  
  // Update the current journey when the global selection changes
  useEffect(() => {
    if (globalJourney && !params.disableJourneySelection) {
      setCurrentJourney(globalJourney);
    }
  }, [globalJourney, params.disableJourneySelection]);
  
  // Handle journey changes
  const handleJourneyChange = (journeyId: JourneyId, journey: Journey) => {
    // Update the global journey selection
    if (!params.disableJourneySelection) {
      updateGlobals({ journey: journeyId });
    }
    
    // Call the onJourneyChange callback if provided
    if (params.onJourneyChange) {
      params.onJourneyChange(journeyId, journey);
    }
  };
  
  return (
    <JourneyProvider 
      initialJourney={currentJourney}
      onJourneyChange={handleJourneyChange}
    >
      <Story {...context} />
    </JourneyProvider>
  );
};

/**
 * Storybook toolbar configuration for the journey decorator
 */
export const journeyToolbarConfig = {
  // Toolbar item for journey selection
  journey: {
    name: 'Journey',
    description: 'Select the current journey context',
    defaultValue: JOURNEY_IDS.HEALTH,
    toolbar: {
      icon: 'lightning',
      items: [
        { value: JOURNEY_IDS.HEALTH, title: 'Health Journey' },
        { value: JOURNEY_IDS.CARE, title: 'Care Journey' },
        { value: JOURNEY_IDS.PLAN, title: 'Plan Journey' },
      ],
      showName: true,
    },
  },
};

export default JourneyDecorator;