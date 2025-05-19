import React from 'react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { JourneyDecorator, journeyToolbarConfig } from './JourneyDecorator';

/**
 * Custom viewport presets for AUSTA SuperApp responsive testing
 */
const customViewports = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: '360px',
      height: '640px',
    },
    type: 'mobile',
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet',
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: '1280px',
      height: '800px',
    },
    type: 'desktop',
  },
  largeDesktop: {
    name: 'Large Desktop',
    styles: {
      width: '1440px',
      height: '900px',
    },
    type: 'desktop',
  },
};

/**
 * Storybook preview configuration
 * 
 * This file configures the Storybook preview environment with:
 * - AUSTA design themes through JourneyDecorator
 * - Responsive viewport presets for testing
 * - Accessibility testing parameters
 * - Controls for journey selection
 */
const preview = {
  // Global parameters for all stories
  parameters: {
    // Viewport configuration for responsive testing
    viewport: {
      viewports: {
        ...customViewports,
        ...INITIAL_VIEWPORTS,
      },
      defaultViewport: 'responsive',
    },
    
    // Accessibility testing configuration
    a11y: {
      // Enable automatic accessibility checks
      enabled: true,
      // Configure accessibility rules
      config: {
        rules: [
          // Example of a rule configuration
          {
            // The color-contrast rule will always run
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      // Set to 'error' to fail on accessibility violations
      test: 'warn',
    },
    
    // Controls configuration
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    
    // Docs configuration
    docs: {
      // Show code by default
      source: {
        state: 'open',
      },
    },
    
    // Disable default padding around stories
    layout: 'fullscreen',
    
    // Ensure actions are properly captured
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  
  // Global decorators for all stories
  decorators: [
    // Apply the JourneyDecorator to all stories
    JourneyDecorator,
  ],
  
  // Global toolbar configuration
  globalTypes: {
    // Add journey selector to toolbar
    ...journeyToolbarConfig,
  },
};

export default preview;