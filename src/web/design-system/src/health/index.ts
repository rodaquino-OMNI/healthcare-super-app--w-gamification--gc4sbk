/**
 * Health Journey UI Components
 * 
 * This barrel file exports all Health journey-specific UI components from the design system.
 * It serves as the central import point for consuming applications, enabling them to import
 * any health component through a single, consistent entry point.
 */

// Device management components
export { DeviceCard } from './DeviceCard';

// Goal tracking components
export { default as GoalCard } from './GoalCard';
export { GoalCardProps } from './GoalCard';

// Health data visualization components
export { default as HealthChart } from './HealthChart';
export { HealthChartProps } from './HealthChart';

// Health metric display components
export { MetricCard, MetricCardProps } from './MetricCard';