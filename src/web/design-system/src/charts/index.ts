/**
 * Charts module for the AUSTA SuperApp design system.
 * 
 * This module provides reusable chart components for visualizing data across all journeys,
 * with particular focus on health metrics, trends, and analytics. The components support
 * journey-specific theming and responsive design.
 * 
 * These chart components are part of the @austa/design-system package and utilize:
 * - Design tokens from @design-system/primitives for consistent styling
 * - Type definitions from @austa/interfaces for prop typing
 * - Journey-specific theming through the @austa/journey-context package
 * 
 * @packageDocumentation
 */

// Export BarChart and its props
export { BarChart, BarChartProps } from './BarChart';

// Import and re-export LineChart and its props
import LineChart, { LineChartProps } from './LineChart';
export { LineChartProps };
export { LineChart };

// Export RadialChart and its props
export { RadialChart, RadialChartProps } from './RadialChart';