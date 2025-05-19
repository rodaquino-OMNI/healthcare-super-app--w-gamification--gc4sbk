import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ROUTES } from '../../constants/routes';
import { JourneyHeader } from '../../components/shared/JourneyHeader';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { formatDate, formatHealthMetric } from '../../utils/format';
import { getHealthMetrics } from '../../api/health';

// Updated imports from new packages
import { Card } from '@austa/design-system/components/Card';
import { LineChart } from '@austa/design-system/charts/LineChart';
import { colors, spacing } from '@design-system/primitives/tokens';
import { useJourney } from '@austa/journey-context/hooks';
import { HealthMetric } from '@austa/interfaces/health';

/**
 * Interface defining the route parameters expected by this screen.
 */
interface MetricDetailRouteParams {
  metricId: string;
}

/**
 * Displays detailed information for a selected health metric.
 * Shows current value and historical trend chart with journey-specific theming.
 */
export const MetricDetailScreen: React.FC = () => {
  // 1. Retrieves the route object using `useRoute` to access the `metricId` parameter.
  const route = useRoute<any>();
  const { metricId } = route.params as MetricDetailRouteParams;

  // 2. Retrieves the navigation object using `useNavigation` for navigation purposes.
  const navigation = useNavigation();

  // 3. Retrieves the current journey using `useJourney` for theming.
  const { journey } = useJourney();

  // 4. Defines state variables for the selected metric and time range.
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<Date[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 5. Uses `useHealthMetrics` to fetch health metrics data for the specified `metricId` and time range.
  const { data, loading, error: fetchError } = useHealthMetrics(
    'user-123', // TODO: Replace with actual user ID
    timeRange ? timeRange[0] : null,
    timeRange ? timeRange[1] : null,
    [] // Fetch all metric types
  );

  // 6. Filters the fetched health metrics to find the selected metric.
  useEffect(() => {
    if (data?.getHealthMetrics) {
      const metric = data.getHealthMetrics.find(metric => metric.id === metricId);
      setSelectedMetric(metric);
      
      if (!metric && !loading) {
        setError('Metric not found. Please try again or select a different metric.');
      } else {
        setError(null);
      }
    }
  }, [data, metricId, loading]);

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      setError('Failed to load metric data. Please check your connection and try again.');
    }
  }, [fetchError]);

  // 7. Formats the start and end dates for the API request.
  const startDate = timeRange ? formatDate(timeRange[0]) : 'N/A';
  const endDate = timeRange ? formatDate(timeRange[1]) : 'N/A';

  // Render loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.journeys[journey].background }}>
        <JourneyHeader
          title="Loading Metric"
          showBackButton
          onBackPress={() => navigation.navigate(ROUTES.HEALTH_DASHBOARD)}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.journeys[journey].primary} />
          <Text style={{ marginTop: spacing.md, color: colors.journeys[journey].text }}>Loading metric data...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.journeys[journey].background }}>
        <JourneyHeader
          title="Metric Details"
          showBackButton
          onBackPress={() => navigation.navigate(ROUTES.HEALTH_DASHBOARD)}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Text style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}>{error}</Text>
          <Text 
            style={{ 
              color: colors.journeys[journey].primary, 
              textDecorationLine: 'underline' 
            }}
            onPress={() => navigation.navigate(ROUTES.HEALTH_DASHBOARD)}
          >
            Return to Health Dashboard
          </Text>
        </View>
      </View>
    );
  }

  // 8. If the selected metric is found, renders a `JourneyHeader` with a back button and the metric name as the title.
  if (selectedMetric) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.journeys[journey].background }}>
        <JourneyHeader
          title={selectedMetric.type}
          showBackButton
          onBackPress={() => navigation.navigate(ROUTES.HEALTH_DASHBOARD)}
        />

        {/* 9. Renders a `Card` component to display the metric details, including the current value and a `LineChart` to visualize the historical data. */}
        <View style={{ padding: spacing.md }}>
          <Card journey={journey}>
            <View style={{ padding: spacing.md }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm, color: colors.journeys[journey].text }}>
                Current Value
              </Text>
              <Text style={{ fontSize: 24, color: colors.journeys[journey].primary, marginBottom: spacing.md }}>
                {formatHealthMetric(selectedMetric.value, selectedMetric.type, selectedMetric.unit)}
              </Text>
              
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm, marginTop: spacing.md, color: colors.journeys[journey].text }}>
                Historical Trend
              </Text>
              <View style={{ height: 250, marginTop: spacing.sm }}>
                <LineChart
                  data={data?.getHealthMetrics || []}
                  xAxisKey="timestamp"
                  yAxisKey="value"
                  xAxisLabel="Date"
                  yAxisLabel="Value"
                  journey={journey}
                  emptyStateMessage="No historical data available"
                />
              </View>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  // Fallback return - should not reach here due to loading/error handling above
  return (
    <View style={{ flex: 1, backgroundColor: colors.journeys[journey].background }}>
      <JourneyHeader
        title="Metric Details"
        showBackButton
        onBackPress={() => navigation.navigate(ROUTES.HEALTH_DASHBOARD)}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No metric data available</Text>
      </View>
    </View>
  );
};