/**
 * Storybook Main Configuration
 * 
 * This file configures Storybook for the AUSTA SuperApp design system, enabling
 * component documentation with proper TypeScript support, path resolution for the
 * four design system packages, and essential addons for accessibility and controls.
 * 
 * The design system is organized into four discrete workspace packages:
 * - @austa/design-system: Main component library (this package)
 * - @design-system/primitives: Design tokens and primitive components
 * - @austa/interfaces: Shared TypeScript definitions
 * - @austa/journey-context: Journey-specific state management
 */

const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  // Define story patterns to include all component directories
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  // The patterns above will automatically include all stories from:
  // - components/
  // - health/
  // - care/
  // - plan/
  // - gamification/
  // - charts/
  // - themes/
  
  // Register essential addons
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials', // Includes docs, controls, actions, viewport, backgrounds, toolbars
    '@storybook/addon-a11y' // Additional accessibility testing
  ],
  // Note: addon-essentials already includes docs, controls, and viewport
  
  /**
   * TypeScript Configuration
   * 
   * Configures TypeScript support for Storybook, including type checking and
   * documentation generation. Uses react-docgen-typescript for accurate prop
   * table generation and filters out props from node_modules except for our
   * own packages.
   */
  typescript: {
    check: true,
    checkOptions: {
      eslint: true,
    },
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        // Filter out props from node_modules except the ones from our packages
        if (prop.parent) {
          const parentName = prop.parent.fileName;
          return (
            !parentName.includes('node_modules') ||
            parentName.includes('@austa/design-system') ||
            parentName.includes('@design-system/primitives') ||
            parentName.includes('@austa/interfaces') ||
            parentName.includes('@austa/journey-context')
          );
        }
        return true;
      },
    },
  },
  
  /**
   * Webpack Configuration
   * 
   * Customizes Storybook's webpack configuration to properly resolve paths to all
   * four design system packages, add TypeScript support, and configure loaders for
   * SVG files and styled-components. This ensures that components can be properly
   * imported and documented across the monorepo structure.
   */
  webpackFinal: async (config) => {
    // Add TypeScript support
    config.module.rules.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            configFile: path.resolve(__dirname, './tsconfig.json'),
          },
        },
      ],
    });
    
    // Add support for TypeScript path aliases
    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, './tsconfig.json'),
      })
    );
    
    // Add path aliases for our packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@austa/design-system': path.resolve(__dirname, '../src'),
      '@design-system/primitives': path.resolve(__dirname, '../../primitives/src'),
      '@austa/interfaces': path.resolve(__dirname, '../../interfaces'),
      '@austa/journey-context': path.resolve(__dirname, '../../journey-context/src'),
      '~': path.resolve(__dirname, '../src'), // Additional alias from tsconfig.json
    };
    
    // Add support for SVG files
    const fileLoaderRule = config.module.rules.find(rule => rule.test && rule.test.test('.svg'));
    fileLoaderRule.exclude = /\.svg$/;
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack', 'url-loader'],
    });
    
    // Add support for styled-components
    config.resolve.extensions.push('.ts', '.tsx');
    
    return config;
  },
  
  // Configure framework
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  
  // Configure docs
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  
  // Configure static assets directory
  staticDirs: ['../public'],
};