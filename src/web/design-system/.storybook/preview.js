/**
 * Storybook Preview Configuration
 * 
 * This file configures the Storybook preview environment with AUSTA design themes,
 * journey context providers, and global decorators. It ensures all stories render
 * with proper theming and context.
 */

import React from 'react';
import { ThemeProvider } from 'styled-components';

// Import themes from the design system
import { baseTheme, healthTheme, careTheme, planTheme } from '../src/themes';

// Import journey decorator and toolbar configuration
import JourneyDecorator, { journeyToolbarConfig } from './JourneyDecorator';
import { JOURNEY_IDS } from '@austa/journey-context';

/**
 * Global decorator that wraps all stories with the ThemeProvider
 * This ensures all components have access to the theme context
 */
const withTheme = (Story, context) => {
  // Determine which theme to use based on the selected journey
  const { globals } = context;
  const journeyId = globals.journey || JOURNEY_IDS.HEALTH;
  
  // Map journey ID to the corresponding theme
  const themeMap = {
    [JOURNEY_IDS.HEALTH]: healthTheme,
    [JOURNEY_IDS.CARE]: careTheme,
    [JOURNEY_IDS.PLAN]: planTheme,
  };
  
  // Use the journey-specific theme or fall back to base theme
  const theme = themeMap[journeyId] || baseTheme;
  
  return (
    <ThemeProvider theme={theme}>
      <Story {...context} />
    </ThemeProvider>
  );
};

/**
 * Storybook parameters configuration
 */
export const parameters = {
  // Control how actions (on events) are handled
  actions: { argTypesRegex: '^on[A-Z].*' },
  
  // Controls configuration
  controls: {
    expanded: true,
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  
  // Accessibility addon configuration
  a11y: {
    // Enable automatic accessibility checks
    enabled: true,
    // Configure which elements to check
    element: '#storybook-root',
    // Configure which rules to check
    config: {
      rules: [
        {
          // Ensure all images have alt text
          id: 'image-alt',
          enabled: true,
        },
        {
          // Ensure proper color contrast
          id: 'color-contrast',
          enabled: true,
        },
      ],
    },
    // Configure manual checks
    manual: true,
  },
  
  // Viewport addon configuration for responsive testing
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1280px',
          height: '800px',
        },
      },
      largeDesktop: {
        name: 'Large Desktop',
        styles: {
          width: '1920px',
          height: '1080px',
        },
      },
    },
    // Default viewport
    defaultViewport: 'desktop',
  },
  
  // Journey context parameters
  journey: {
    defaultJourney: JOURNEY_IDS.HEALTH,
  },
  
  // Documentation parameters
  docs: {
    // Show component source code
    source: {
      state: 'open',
    },
    // Show component description
    description: {
      component: {
        // Show component description from JSDoc
        showComponentDescription: true,
      },
    },
  },
};

/**
 * Global decorators applied to all stories
 */
export const decorators = [
  // Apply theme provider
  withTheme,
  // Apply journey context provider
  JourneyDecorator,
];

/**
 * Global toolbar configuration
 */
export const globalTypes = {
  // Journey selection toolbar
  ...journeyToolbarConfig,
};