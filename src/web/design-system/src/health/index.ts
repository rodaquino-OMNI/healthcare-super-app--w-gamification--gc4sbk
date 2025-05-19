/**
 * Health Journey UI Components
 * 
 * This barrel file exports all Health journey-specific UI components from the design system.
 * It serves as the central import point for consuming applications, enabling them to import
 * any health component through a single, consistent entry point.
 */

// Export components
export { default as DeviceCard } from './DeviceCard';
export { default as GoalCard } from './GoalCard';
export { default as HealthChart } from './HealthChart';
export { default as MetricCard } from './MetricCard';

// Re-export component props for type safety
export type { DeviceCardProps } from './DeviceCard/DeviceCard';
export type { GoalCardProps } from './GoalCard/GoalCard';
export type { HealthChartProps } from './HealthChart/HealthChart';
export type { MetricCardProps } from './MetricCard/MetricCard';