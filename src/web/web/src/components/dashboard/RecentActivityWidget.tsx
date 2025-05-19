import React, { useEffect, useState } from 'react'; // React v18.0.0
import { Box, Stack, Text } from '@design-system/primitives';
import { Card } from '@austa/design-system';
import { LoadingIndicator } from '@austa/design-system/components';
import { useAuth } from 'src/web/web/src/hooks/useAuth.ts';
import { JOURNEY_CONFIG } from 'src/web/web/src/constants/journeys.ts';
import { formatJourneyDate } from '@austa/interfaces/common/utils';
import { HealthMetric, Appointment, Claim } from '@austa/interfaces/common';
import { getHealthMetrics } from '@austa/interfaces/api';

/**
 * Represents a single recent activity item.
 */
interface ActivityItem {
  id: string;
  journey: string;
  description: string;
  timestamp: Date;
}

/**
 * Displays a list of recent user activities.
 * This widget provides a quick overview of the user's engagement with the AUSTA SuperApp and encourages continued interaction.
 */
export const RecentActivityWidget: React.FC = () => {
  // Retrieves the authentication session using the useAuth hook.
  const { session } = useAuth();
  // useState hook to manage the loading state of the component
  const [loading, setLoading] = useState(true);
  // useState hook to manage the recent activities
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // If there is no session, returns null.
  if (!session) {
    return null;
  }

  // useEffect hook to fetch recent activities when the component mounts
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Mock data for demonstration purposes
        const mockHealthMetrics: HealthMetric[] = [
          {
            id: '1',
            userId: session.userId,
            type: 'HEART_RATE',
            value: 72,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'Wearable',
          },
        ];

        const mockAppointments: Appointment[] = [
          {
            id: '101',
            providerId: 'doc1',
            userId: session.userId,
            dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            type: 'Telemedicine',
            status: 'Scheduled',
            reason: 'Follow-up',
            notes: 'Discuss recent lab results',
          },
        ];

        const mockClaims: Claim[] = [
          {
            id: '201',
            planId: 'plan1',
            type: 'medical',
            amount: 150.00,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            documents: [],
            userId: session.userId,
          },
        ];

        const activities: ActivityItem[] = [
          ...mockHealthMetrics.map((metric) => ({
            id: metric.id,
            journey: JOURNEY_CONFIG.HEALTH.id,
            description: `Recorded ${metric.type}: ${metric.value} ${metric.unit}`,
            timestamp: new Date(metric.timestamp),
          })),
          ...mockAppointments.map((appointment) => ({
            id: appointment.id,
            journey: JOURNEY_CONFIG.CARE.id,
            description: `Appointment scheduled for ${formatJourneyDate(
              appointment.dateTime,
              JOURNEY_CONFIG.CARE.id
            )}`,
            timestamp: new Date(appointment.dateTime),
          })),
          ...mockClaims.map((claim) => ({
            id: claim.id,
            journey: JOURNEY_CONFIG.PLAN.id,
            description: `Claim submitted for $${claim.amount}`,
            timestamp: new Date(claim.submittedAt),
          })),
        ];

        // Sort activities by timestamp in descending order
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Set the recent activities state with the fetched and sorted activities
        setRecentActivities(activities);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        // Implement error handling, such as displaying an error message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [session]);

  // Displays a loading indicator while fetching activities.
  if (loading) {
    return (
      <Card>
        <Box padding="medium">
          <LoadingIndicator text="Loading recent activities..." />
        </Box>
      </Card>
    );
  }

  // Returns an empty state if there are no activities.
  if (recentActivities.length === 0) {
    return (
      <Card>
        <Box padding="medium">
          <Text variant="body">No recent activity.</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box padding="medium">
        <Text variant="h3" marginBottom="medium">Recent Activities</Text>
        <Stack direction="vertical" spacing="small">
          {recentActivities.map((activity) => (
            <Box 
              key={activity.id} 
              padding="small" 
              borderRadius="medium" 
              backgroundColor="background.subtle"
            >
              <Text variant="body">{activity.description}</Text>
              <Text variant="caption" color="text.secondary">
                {formatJourneyDate(activity.timestamp, activity.journey)}
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>
    </Card>
  );
};