/**
 * Storybook main configuration
 * 
 * This file configures Storybook's core functionality including:
 * - Story discovery patterns
 * - Addon registration
 * - Webpack configuration for proper package resolution
 * - TypeScript support
 */

const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  /**
   * Story discovery patterns
   * Configures where Storybook looks for story files across the design system
   */
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/stories.@(js|jsx|ts|tsx)',
  ],

  /**
   * Addons configuration
   * Registers essential Storybook addons for enhanced documentation
   */
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],

  /**
   * Framework configuration
   * Specifies the framework and builder to use
   */
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },

  /**
   * TypeScript configuration
   * Configures TypeScript support and documentation generation
   */
  typescript: {
    check: true,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules') || 
                 prop.parent.fileName.includes('@austa/') || 
                 prop.parent.fileName.includes('@design-system/');
        }
        return true;
      },
    },
  },

  /**
   * Docs configuration
   * Sets up automatic documentation generation
   */
  docs: {
    autodocs: 'tag',
  },

  /**
   * Static files configuration
   * Specifies directories to copy to the Storybook output
   */
  staticDirs: ['../public'],

  /**
   * Core configuration
   * Sets global Storybook options
   */
  core: {
    disableTelemetry: true,
  },

  /**
   * Webpack configuration
   * Customizes webpack to properly resolve design system packages
   */
  webpackFinal: async (config) => {
    // Add TypeScript path resolution support
    if (config.resolve) {
      config.resolve.plugins = [
        ...(config.resolve.plugins || []),
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, './tsconfig.json'),
          extensions: config.resolve.extensions,
        }),
      ];

      // Add path aliases for design system packages
      config.resolve.alias = {
        ...config.resolve.alias,
        '@austa/design-system': path.resolve(__dirname, '../src'),
        '@design-system/primitives': path.resolve(__dirname, '../../primitives/src'),
        '@austa/interfaces': path.resolve(__dirname, '../../interfaces'),
        '@austa/journey-context': path.resolve(__dirname, '../../journey-context/src'),
      };
    }

    // Return the modified config
    return config;
  },
};