import React from 'react';
import { DecoratorFunction } from '@storybook/react';
import { JourneyProvider } from '@austa/journey-context';
import { ThemeProvider } from 'styled-components';
import { useGlobals } from '@storybook/client-api';
import { baseTheme, healthTheme, careTheme, planTheme } from '../src/themes';
import { JourneyId, JOURNEY_IDS } from '@austa/journey-context/dist/types';

/**
 * Maps journey IDs to their corresponding themes
 */
const journeyThemeMap = {
  health: healthTheme,
  care: careTheme,
  plan: planTheme,
  // Default to base theme if no journey is selected
  default: baseTheme,
};

/**
 * A Storybook decorator that wraps stories with the JourneyProvider from @austa/journey-context
 * and coordinates with ThemeProvider to apply journey-specific themes.
 *
 * This decorator enables testing components in different journey contexts (health, care, plan)
 * directly within Storybook.
 */
export const JourneyDecorator: DecoratorFunction = (Story, context) => {
  // Get the current journey from Storybook globals
  const [globals] = useGlobals();
  const journeyId = (globals.journey || 'default') as JourneyId | 'default';

  // Get the theme corresponding to the selected journey
  const theme = journeyThemeMap[journeyId] || baseTheme;

  // Create journey configuration with the selected journey as active
  const journeyConfig = {
    availableJourneys: JOURNEY_IDS,
    defaultJourney: journeyId !== 'default' ? journeyId : 'health',
  };

  return (
    <ThemeProvider theme={theme}>
      <JourneyProvider
        initialJourney={journeyId !== 'default' ? journeyId : 'health'}
        config={journeyConfig}
      >
        <Story {...context} />
      </JourneyProvider>
    </ThemeProvider>
  );
};

/**
 * Storybook toolbar configuration for the journey selector
 */
export const journeyToolbarConfig = {
  journey: {
    name: 'Journey',
    description: 'Select the active journey context',
    defaultValue: 'default',
    toolbar: {
      icon: 'compass',
      items: [
        { value: 'default', title: 'Default Theme' },
        { value: 'health', title: 'Health Journey', icon: 'heart' },
        { value: 'care', title: 'Care Journey', icon: 'medicine' },
        { value: 'plan', title: 'Plan Journey', icon: 'document' },
      ],
      showName: true,
    },
  },
};

export default JourneyDecorator;