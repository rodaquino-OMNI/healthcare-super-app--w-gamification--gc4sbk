/**
 * @file Health Component Types
 * @description Defines TypeScript interfaces for Health journey-specific UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props that integrate with Health journey data models.
 */

// Import types from the shared interfaces package
import { DeviceConnection, HealthGoal, HealthMetric, HealthMetricType, MedicalEvent } from '@austa/interfaces/health';

/**
 * Common props shared across all Health journey components
 */
export interface HealthComponentBaseProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testID?: string;
  
  /**
   * Optional theme override for the component
   */
  themeOverride?: Record<string, any>;
}

/**
 * Props for the DeviceCard component that displays a connected health device.
 */
export interface DeviceCardProps extends HealthComponentBaseProps {
  /**
   * The device connection data to display
   */
  device: DeviceConnection;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the last sync information
   * @default true
   */
  showLastSync?: boolean;
  
  /**
   * Whether to show the connection status
   * @default true
   */
  showStatus?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the sync button is clicked
   */
  onSync?: () => void;
  
  /**
   * Optional handler for when the disconnect button is clicked
   */
  onDisconnect?: () => void;
  
  /**
   * Optional handler for when the settings button is clicked
   */
  onSettings?: () => void;
  
  /**
   * Whether the device is currently syncing
   * @default false
   */
  isSyncing?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
  
  /**
   * Optional icon or image URL for the device
   */
  deviceIcon?: string;
}

/**
 * Props for the GoalCard component that displays a health goal.
 */
export interface GoalCardProps extends HealthComponentBaseProps {
  /**
   * The health goal data to display
   */
  goal: HealthGoal;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the progress towards the goal
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Whether to show the date range for the goal
   * @default true
   */
  showDateRange?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the edit button is clicked
   */
  onEdit?: () => void;
  
  /**
   * Optional handler for when the delete button is clicked
   */
  onDelete?: () => void;
  
  /**
   * Optional handler for when the share button is clicked
   */
  onShare?: () => void;
  
  /**
   * Current progress value towards the goal (0-100)
   */
  progressValue?: number;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'achievement';
  
  /**
   * Whether to show gamification elements (achievements, points)
   * @default false
   */
  showGamification?: boolean;
  
  /**
   * Optional points earned for this goal (for gamification)
   */
  pointsEarned?: number;
}

/**
 * Props for the HealthChart component that displays health metrics over time.
 */
export interface HealthChartProps extends HealthComponentBaseProps {
  /**
   * The health metric data to display in the chart
   */
  metrics: HealthMetric[];
  
  /**
   * The type of health metric being displayed
   */
  metricType: HealthMetricType;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Optional custom subtitle
   */
  subtitle?: string;
  
  /**
   * Time period to display
   * @default 'week'
   */
  period?: 'day' | 'week' | 'month' | 'year' | 'custom';
  
  /**
   * Custom date range for when period is 'custom'
   */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  
  /**
   * Chart type to display
   * @default 'line'
   */
  chartType?: 'line' | 'bar' | 'scatter' | 'area';
  
  /**
   * Whether to show the chart legend
   * @default true
   */
  showLegend?: boolean;
  
  /**
   * Whether to show data points on the chart
   * @default true
   */
  showDataPoints?: boolean;
  
  /**
   * Whether to show goal reference lines
   * @default false
   */
  showGoalLines?: boolean;
  
  /**
   * Optional goal value to display as reference line
   */
  goalValue?: number;
  
  /**
   * Optional handler for when a data point is clicked
   */
  onDataPointClick?: (metric: HealthMetric) => void;
  
  /**
   * Optional handler for when the period selector is changed
   */
  onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year' | 'custom') => void;
  
  /**
   * Optional handler for when the chart type is changed
   */
  onChartTypeChange?: (type: 'line' | 'bar' | 'scatter' | 'area') => void;
  
  /**
   * Optional handler for when the export button is clicked
   */
  onExport?: () => void;
  
  /**
   * Whether the chart is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Optional error message to display
   */
  error?: string;
  
  /**
   * Optional theme variant for the chart
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'dashboard';
  
  /**
   * Optional color scheme for the chart
   */
  colorScheme?: string[];
  
  /**
   * Whether to show min/max values
   * @default true
   */
  showMinMax?: boolean;
  
  /**
   * Whether to show average value
   * @default true
   */
  showAverage?: boolean;
  
  /**
   * Whether the chart should be responsive
   * @default true
   */
  responsive?: boolean;
  
  /**
   * Fixed height for the chart (in pixels)
   */
  height?: number;
  
  /**
   * Fixed width for the chart (in pixels)
   */
  width?: number;
}

/**
 * Props for the MetricCard component that displays a single health metric.
 */
export interface MetricCardProps extends HealthComponentBaseProps {
  /**
   * The health metric data to display
   */
  metric: HealthMetric;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the timestamp of the measurement
   * @default true
   */
  showTimestamp?: boolean;
  
  /**
   * Whether to show the source of the measurement
   * @default false
   */
  showSource?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the add measurement button is clicked
   */
  onAddMeasurement?: () => void;
  
  /**
   * Optional handler for when the view history button is clicked
   */
  onViewHistory?: () => void;
  
  /**
   * Optional handler for when the share button is clicked
   */
  onShare?: () => void;
  
  /**
   * Whether to show a trend indicator
   * @default true
   */
  showTrend?: boolean;
  
  /**
   * Optional trend value (positive for increase, negative for decrease)
   */
  trendValue?: number;
  
  /**
   * Optional trend period description (e.g., "since yesterday")
   */
  trendPeriod?: string;
  
  /**
   * Whether an increasing trend is positive (green) or negative (red)
   * @default true for steps, false for blood pressure
   */
  increasingIsBetter?: boolean;
  
  /**
   * Optional reference range for the metric
   */
  referenceRange?: {
    min: number;
    max: number;
  };
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'dashboard';
  
  /**
   * Optional icon or image URL for the metric
   */
  metricIcon?: string;
  
  /**
   * Whether to show a mini chart of recent values
   * @default false
   */
  showMiniChart?: boolean;
  
  /**
   * Recent metric values for the mini chart
   */
  recentValues?: HealthMetric[];
}