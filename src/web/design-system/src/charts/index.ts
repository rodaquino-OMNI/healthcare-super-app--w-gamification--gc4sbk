/**
 * Charts module for the AUSTA SuperApp design system.
 * 
 * This module provides reusable chart components for visualizing data across all journeys,
 * with particular focus on health metrics, trends, and analytics. The components support
 * journey-specific theming and responsive design.
 * 
 * Part of the @austa/design-system package, these chart components leverage design tokens
 * from @design-system/primitives and type definitions from @austa/interfaces to ensure
 * consistent visualization across web and mobile platforms.
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