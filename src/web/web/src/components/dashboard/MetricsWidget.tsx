import React from 'react';
import { Box, Stack } from '@design-system/primitives';
import { Card } from '@austa/design-system';
import { MetricCard } from '@austa/design-system/health';
import { HealthMetric } from '@austa/interfaces/health';
import { JOURNEY_IDS } from '@austa/journey-context/constants';
import { useJourneyContext } from '@austa/journey-context';
import { useHealthMetrics } from 'src/web/web/src/hooks/useHealthMetrics.ts';

/**
 * A widget component that displays a summary of key health metrics.
 *
 * @returns The rendered MetricsWidget component.
 */
export const MetricsWidget: React.FC = () => {
  // Get the current journey context
  const { currentJourney, journeyData } = useJourneyContext();

  // Call the `useHealthMetrics` hook to fetch health metrics for the user.
  const { loading, error, metrics } = useHealthMetrics(
    'user-123', // TODO: Replace with actual user ID
    [], // Fetch all metric types
  );

  // Render a `Card` component with journey-specific styling.
  return (
    <Card journey={JOURNEY_IDS.HEALTH} elevation="sm">
      {loading && (
        // Display a loading indicator while the data is being fetched.
        <Box padding="medium">
          Loading metrics...
        </Box>
      )}
      {error && (
        // Display an error message if there is an error fetching the data.
        <Box padding="medium">
          Error fetching metrics: {error.message}
        </Box>
      )}
      {!loading && !error && (
        // Render a list of `MetricCard` components for each health metric.
        <Stack direction="vertical" spacing="medium" padding="medium">
          {metrics.map((metric: HealthMetric) => (
            <MetricCard
              key={metric.id}
              metricName={metric.type}
              value={metric.value}
              unit={metric.unit}
              trend="stable" // TODO: Replace with actual trend data
              journey={JOURNEY_IDS.HEALTH}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};