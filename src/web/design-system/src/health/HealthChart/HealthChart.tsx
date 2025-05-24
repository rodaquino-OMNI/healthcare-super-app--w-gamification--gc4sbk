import React from 'react';
import { Box, Text } from '@design-system/primitives';
import { useJourneyContext } from '@austa/journey-context';
import { HealthMetric } from '@austa/interfaces/health';
import { LineChart, BarChart, RadialChart } from '../../charts';

/**
 * Props interface for the HealthChart component.
 */
export interface HealthChartProps {
  /**
   * The type of chart to render (line, bar, or radial).
   */
  type: 'line' | 'bar' | 'radial';
  
  /**
   * The data to display in the chart.
   */
  data: HealthMetric[];
  
  /**
   * The key in the data for the x-axis values.
   */
  xAxisKey: string;
  
  /**
   * The key in the data for the y-axis values.
   */
  yAxisKey: string;
  
  /**
   * The label for the x-axis.
   */
  xAxisLabel?: string;
  
  /**
   * The label for the y-axis.
   */
  yAxisLabel?: string;
  
  /**
   * The color of the line (for line charts).
   */
  lineColor?: string;
  
  /**
   * The journey context for theming the chart.
   * @default 'health'
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * HealthChart is a reusable component for rendering various types of health charts
 * in the AUSTA SuperApp. It supports line, bar, and radial chart types with
 * journey-specific theming.
 * 
 * @example
 * ```jsx
 * <HealthChart
 *   type="line"
 *   data={healthMetrics}
 *   xAxisKey="timestamp"
 *   yAxisKey="value"
 *   xAxisLabel="Time"
 *   yAxisLabel="Heart Rate (BPM)"
 *   journey="health"
 * />
 * ```
 */
export const HealthChart: React.FC<HealthChartProps> = ({
  type,
  data,
  xAxisKey,
  yAxisKey,
  xAxisLabel = '',
  yAxisLabel = '',
  lineColor,
  journey = 'health',
}) => {
  // Get journey theme from context
  const { theme } = useJourneyContext(journey);
  const journeyColor = theme.colors.primary;
  
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Box 
        padding="md" 
        backgroundColor="gray100"
        borderRadius="md"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
        data-testid="health-chart-empty"
        role="img"
        aria-label="No health data available"
      >
        <Text color="gray600">No data available</Text>
      </Box>
    );
  }
  
  // Render the appropriate chart based on type
  switch (type) {
    case 'line':
      return (
        <LineChart
          data={data}
          xAxisKey={xAxisKey}
          yAxisKey={yAxisKey}
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
          lineColor={lineColor || journeyColor}
          journey={journey}
          aria-label={`Line chart showing ${yAxisLabel || 'values'} over ${xAxisLabel || 'time'}`}
        />
      );
      
    case 'bar':
      // Transform data for BarChart
      const values = data.map(item => Number(item[yAxisKey]));
      const labels = data.map(item => String(item[xAxisKey]));
      
      return (
        <BarChart
          data={values}
          labels={labels}
          colors={[lineColor || journeyColor]}
          journey={journey}
          title={`${yAxisLabel || 'Value'} by ${xAxisLabel || 'Category'}`}
          aria-label={`Bar chart showing ${yAxisLabel || 'values'} by ${xAxisLabel || 'category'}`}
        />
      );
      
    case 'radial':
      // Transform data for RadialChart
      const pieData = data.map(item => ({
        x: String(item[xAxisKey]),
        y: Number(item[yAxisKey])
      }));
      
      return (
        <RadialChart
          data={pieData}
          journey={journey}
          labelType="percentage"
          aria-label={`Radial chart showing distribution of ${yAxisLabel || 'values'}`}
        />
      );
      
    default:
      // This should never happen due to TypeScript, but added for safety
      return (
        <Box 
          padding="md" 
          backgroundColor="gray100"
          borderRadius="md"
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
          data-testid="health-chart-error"
          role="alert"
          aria-live="assertive"
        >
          <Text color="gray600">Invalid chart type</Text>
        </Box>
      );
  }
};

export default HealthChart;