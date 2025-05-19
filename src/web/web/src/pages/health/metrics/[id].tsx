import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, Text } from '@design-system/primitives';
import { HealthMetric } from '@austa/interfaces/health';
import { MetricCard } from '@austa/design-system/health';
import { HealthChart } from '@austa/design-system/charts';
import { useHealthContext } from '@austa/journey-context/hooks';
import { formatRelativeDate } from '@app/shared/utils/date';
import { formatHealthMetric } from '@app/shared/utils/format';
import HealthLayout from '@app/web/layouts/HealthLayout';
import { ErrorState, LoadingIndicator } from '@austa/design-system/components';

/**
 * MetricDetail component displays detailed information for a specific health metric.
 * It fetches the metric ID from the URL and uses the useHealthContext hook to retrieve data.
 */
const MetricDetail = () => {
  // Access the Next.js router object
  const router = useRouter();
  
  // Extract the metric ID from the dynamic route
  const { id } = router.query;

  // Access health metrics data from the journey context
  const { metrics, loading, error, refetch } = useHealthContext();

  // Check if the ID is valid before proceeding
  if (!id || typeof id !== 'string') {
    return (
      <HealthLayout>
        <Box padding="md">
          <ErrorState 
            title="Invalid Metric ID" 
            message="The metric ID is missing or invalid." 
            journey="health"
            onRetry={() => router.back()}
            retryText="Go Back"
          />
        </Box>
      </HealthLayout>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <HealthLayout>
        <Box padding="md" display="flex" justifyContent="center" alignItems="center" height="300px">
          <LoadingIndicator size="lg" journey="health" />
        </Box>
      </HealthLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <HealthLayout>
        <Box padding="md">
          <ErrorState 
            title="Error Loading Metric" 
            message={error.message} 
            journey="health"
            onRetry={() => refetch()}
          />
        </Box>
      </HealthLayout>
    );
  }

  // Find the specific metric based on the ID
  const metric = metrics.find((m) => m.id === id);

  // Handle case where metric is not found
  if (!metric) {
    return (
      <HealthLayout>
        <Box padding="md">
          <ErrorState 
            title="Metric Not Found" 
            message="The requested health metric could not be found." 
            journey="health"
            onRetry={() => router.back()}
            retryText="Go Back"
          />
        </Box>
      </HealthLayout>
    );
  }

  // Format the metric value and timestamp
  const formattedValue = formatHealthMetric(metric.value, metric.type, metric.unit);
  const formattedDate = formatRelativeDate(metric.timestamp);

  // Render the metric details
  return (
    <HealthLayout>
      <Box padding="md">
        <Stack spacing="lg">
          <Text as="h1" fontSize="2xl" fontWeight="bold" color="neutral.gray900">
            {metric.type} Details
          </Text>
          
          <MetricCard
            metricName={metric.type}
            value={metric.value}
            unit={metric.unit}
            trend={metric.source}
            journey="health"
            showChart={false}
          />
          
          <Stack spacing="sm">
            <Text fontSize="md" fontWeight="medium" color="neutral.gray700">
              Details
            </Text>
            <Box 
              padding="md" 
              backgroundColor="neutral.gray100" 
              borderRadius="md"
            >
              <Stack spacing="md">
                <Stack spacing="xs">
                  <Text fontSize="sm" fontWeight="medium" color="neutral.gray600">
                    Value
                  </Text>
                  <Text fontSize="md" color="neutral.gray900">
                    {formattedValue}
                  </Text>
                </Stack>
                
                <Stack spacing="xs">
                  <Text fontSize="sm" fontWeight="medium" color="neutral.gray600">
                    Last Updated
                  </Text>
                  <Text fontSize="md" color="neutral.gray900">
                    {formattedDate}
                  </Text>
                </Stack>
                
                {metric.source && (
                  <Stack spacing="xs">
                    <Text fontSize="sm" fontWeight="medium" color="neutral.gray600">
                      Source
                    </Text>
                    <Text fontSize="md" color="neutral.gray900">
                      {metric.source}
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
          
          <Stack spacing="sm">
            <Text fontSize="md" fontWeight="medium" color="neutral.gray700">
              History
            </Text>
            <Box 
              padding="md" 
              backgroundColor="white" 
              borderRadius="md"
              borderColor="neutral.gray200"
              borderWidth="1px"
              height="300px"
            >
              <HealthChart
                type="line"
                data={[metric]}
                xAxisKey="timestamp"
                yAxisKey="value"
                xAxisLabel="Time"
                yAxisLabel={metric.type}
                journey="health"
              />
            </Box>
          </Stack>
        </Stack>
      </Box>
    </HealthLayout>
  );
};

export default MetricDetail;