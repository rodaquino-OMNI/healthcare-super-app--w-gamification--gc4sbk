/**
 * @file Health Journey Component Interfaces
 * @description TypeScript interfaces for Health journey-specific UI components in the AUSTA SuperApp.
 * 
 * This file defines the component interfaces for the Health journey, including DeviceCard,
 * GoalCard, HealthChart, and MetricCard. These interfaces inherit and extend core component
 * interfaces while adding Health journey-specific props and behavior.
 * 
 * The interfaces utilize the health data models from the domain types to ensure tight
 * type coupling between data and presentation layers.
 * 
 * @module interfaces/components/health
 */

import { ReactNode } from 'react';

// Import health domain models
import { 
  DeviceConnection, 
  HealthGoal, 
  HealthMetric, 
  HealthMetricType,
  MedicalEvent 
} from '../health';

// Import base component interfaces
import { BaseComponentProps } from './primitives.types';
import { CardProps } from './core.types';

/**
 * DeviceCard Component Props
 * 
 * Interface for the DeviceCard component that displays health device connection information
 * and status. Extends the base CardProps interface with device-specific properties.
 */
export interface DeviceCardProps extends CardProps {
  /**
   * The device connection data to display
   */
  device: DeviceConnection;
  
  /**
   * Optional callback when the sync button is pressed
   */
  onSync?: (deviceId: string) => void;
  
  /**
   * Optional callback when the disconnect button is pressed
   */
  onDisconnect?: (deviceId: string) => void;
  
  /**
   * Whether the device is currently syncing
   * @default false
   */
  isSyncing?: boolean;
  
  /**
   * Custom icon to display for the device
   * If not provided, a default icon based on deviceType will be used
   */
  deviceIcon?: ReactNode;
  
  /**
   * Whether to show detailed device information
   * @default false
   */
  showDetails?: boolean;
}

/**
 * GoalCard Component Props
 * 
 * Interface for the GoalCard component that displays health goal information
 * and progress. Extends the base CardProps interface with goal-specific properties.
 */
export interface GoalCardProps extends CardProps {
  /**
   * The health goal data to display
   */
  goal: HealthGoal;
  
  /**
   * Optional callback when the goal card is pressed
   */
  onPress?: (goalId: string) => void;
  
  /**
   * Optional callback when the edit button is pressed
   */
  onEdit?: (goalId: string) => void;
  
  /**
   * Optional callback when the delete button is pressed
   */
  onDelete?: (goalId: string) => void;
  
  /**
   * Whether to show the goal progress
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Custom progress indicator component
   * If not provided, a default ProgressCircle will be used
   */
  progressIndicator?: ReactNode;
  
  /**
   * Whether to show the goal date range
   * @default true
   */
  showDateRange?: boolean;
  
  /**
   * Whether the goal is currently being updated
   * @default false
   */
  isUpdating?: boolean;
}

/**
 * Chart time range options for the HealthChart component
 */
export type HealthChartTimeRange = 'day' | 'week' | 'month' | 'year' | 'custom';

/**
 * Chart display type options for the HealthChart component
 */
export type HealthChartType = 'line' | 'bar' | 'radial';

/**
 * HealthChart Component Props
 * 
 * Interface for the HealthChart component that visualizes health metric data
 * over time. Extends the base component props with chart-specific properties.
 */
export interface HealthChartProps extends BaseComponentProps {
  /**
   * The health metric data to display in the chart
   */
  metrics: HealthMetric[];
  
  /**
   * The type of health metric being displayed
   */
  metricType: HealthMetricType;
  
  /**
   * The time range to display in the chart
   * @default 'week'
   */
  timeRange?: HealthChartTimeRange;
  
  /**
   * The type of chart to display
   * @default 'line'
   */
  chartType?: HealthChartType;
  
  /**
   * Optional callback when a data point is pressed
   */
  onDataPointPress?: (metric: HealthMetric) => void;
  
  /**
   * Optional callback when the time range is changed
   */
  onTimeRangeChange?: (range: HealthChartTimeRange) => void;
  
  /**
   * Whether to show the chart legend
   * @default true
   */
  showLegend?: boolean;
  
  /**
   * Whether to show the chart grid lines
   * @default true
   */
  showGridLines?: boolean;
  
  /**
   * Whether to animate the chart when data changes
   * @default true
   */
  animate?: boolean;
  
  /**
   * Custom formatter for the Y-axis labels
   */
  yAxisFormatter?: (value: number) => string;
  
  /**
   * Custom formatter for the X-axis labels
   */
  xAxisFormatter?: (value: string) => string;
  
  /**
   * Whether the chart is currently loading data
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Optional reference line value to display on the chart
   * (e.g., target goal value or normal range)
   */
  referenceLineValue?: number;
  
  /**
   * Label for the reference line
   */
  referenceLineLabel?: string;
  
  /**
   * Whether to show min/max indicators on the chart
   * @default false
   */
  showMinMax?: boolean;
  
  /**
   * Whether to show the average value on the chart
   * @default false
   */
  showAverage?: boolean;
  
  /**
   * Custom chart height
   * @default 200
   */
  height?: number;
}

/**
 * MetricCard Component Props
 * 
 * Interface for the MetricCard component that displays a single health metric
 * with its value and trend. Extends the base CardProps interface with metric-specific properties.
 */
export interface MetricCardProps extends CardProps {
  /**
   * The health metric data to display
   */
  metric: HealthMetric;
  
  /**
   * Optional array of historical metrics to show trend
   */
  historicalMetrics?: HealthMetric[];
  
  /**
   * Optional callback when the metric card is pressed
   */
  onPress?: (metricId: string) => void;
  
  /**
   * Optional callback when the add button is pressed
   */
  onAddReading?: (metricType: HealthMetricType) => void;
  
  /**
   * Whether to show the metric trend
   * @default true
   */
  showTrend?: boolean;
  
  /**
   * Whether to show the metric source
   * @default false
   */
  showSource?: boolean;
  
  /**
   * Whether to show a mini chart of historical values
   * @default false
   */
  showMiniChart?: boolean;
  
  /**
   * Custom formatter for the metric value
   */
  valueFormatter?: (value: number, unit: string) => string;
  
  /**
   * Whether the metric is currently being updated
   * @default false
   */
  isUpdating?: boolean;
  
  /**
   * Optional reference value for comparison
   * (e.g., normal range or previous reading)
   */
  referenceValue?: number;
  
  /**
   * Label for the reference value
   */
  referenceLabel?: string;
}

/**
 * MedicalEventCard Component Props
 * 
 * Interface for the MedicalEventCard component that displays medical event information.
 * Extends the base CardProps interface with medical event-specific properties.
 */
export interface MedicalEventCardProps extends CardProps {
  /**
   * The medical event data to display
   */
  event: MedicalEvent;
  
  /**
   * Optional callback when the event card is pressed
   */
  onPress?: (eventId: string) => void;
  
  /**
   * Optional callback when the view documents button is pressed
   */
  onViewDocuments?: (documentIds: string[]) => void;
  
  /**
   * Whether to show the event provider
   * @default true
   */
  showProvider?: boolean;
  
  /**
   * Whether to show document count
   * @default true
   */
  showDocumentCount?: boolean;
  
  /**
   * Custom icon to display for the event type
   * If not provided, a default icon based on event type will be used
   */
  eventIcon?: ReactNode;
  
  /**
   * Whether to show the full event description
   * @default false
   */
  showFullDescription?: boolean;
}