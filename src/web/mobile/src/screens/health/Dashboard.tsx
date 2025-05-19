import React from 'react';
import { useNavigation } from '@react-navigation/native'; // version ^6.0.0
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  StyleSheet,
} from 'react-native'; // react-native version 0.71+

// Import from shared components
import { LoadingIndicator } from '../components/shared/LoadingIndicator';
import { ErrorState } from '../components/shared/ErrorState';
import { JourneyHeader } from '../components/shared/JourneyHeader';

// Import from @austa/design-system instead of direct paths
import { MetricCard } from '@austa/design-system/health';
import { Card } from '@austa/design-system/components';

// Import from @design-system/primitives for design tokens
import { colors } from '@design-system/primitives/tokens';

// Import from @austa/interfaces for type definitions
import { HealthMetric } from '@austa/interfaces/health';
import { JOURNEY_IDS } from '@austa/interfaces/common';

// Import from @austa/journey-context for journey state management
import { useHealthJourney } from '@austa/journey-context/hooks';

// Import hooks with standardized error handling
import { useHealthMetrics } from '../hooks/useHealthMetrics';
import { useGameProfile } from '../hooks/useGamification';

/**
 * Displays the main dashboard for the My Health journey.
 * This component serves as the primary entry point to the health section of the app,
 * showing user health metrics and providing navigation to other health features.
 *
 * @returns The rendered dashboard component.
 */
export const Dashboard: React.FC = () => {
  // Access the navigation object
  const navigation = useNavigation();

  // Access safe area insets for handling notch and status bar
  const insets = useSafeAreaInsets();

  // Use the health journey context from @austa/journey-context
  const { journey, theme } = useHealthJourney();

  // Fetch health metrics data using the useHealthMetrics hook with retry logic
  const { 
    data: healthMetricsData, 
    loading: healthMetricsLoading, 
    error: healthMetricsError,
    refetch: refetchHealthMetrics 
  } = useHealthMetrics(
    'user-123', // Replace with actual user ID
    null,
    null,
    []
  );

  // Fetch the user's game profile using the useGameProfile hook
  const gameProfile = useGameProfile();

  // Handle loading state
  if (healthMetricsLoading || !gameProfile) {
    return <LoadingIndicator journey="health" label="Carregando métricas de saúde..." />;
  }

  // Handle error state with retry capability
  if (healthMetricsError) {
    return (
      <ErrorState 
        message="Não foi possível carregar as métricas de saúde."
        onRetry={() => refetchHealthMetrics()}
        journey="health"
      />
    );
  }

  // Extract health metrics from the fetched data
  const healthMetrics = healthMetricsData?.getHealthMetrics || [];

  // Define styles for the dashboard using journey-specific theming
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background, // Use theme from journey context
      paddingBottom: insets.bottom,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    metricCard: {
      marginBottom: 16,
    },
  });

  // Render the dashboard
  return (
    <View style={styles.container}>
      <JourneyHeader title="Minha Saúde" showBackButton={false} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {healthMetrics.length > 0 ? (
          healthMetrics.map((metric: HealthMetric, index: number) => (
            <MetricCard
              key={`metric-${metric.id || index}`}
              metricName={metric.type}
              value={metric.value}
              unit={metric.unit}
              trend={metric.trend}
              journey="health"
              style={styles.metricCard}
              onPress={() => navigation.navigate('MetricDetail', { metricId: metric.id })}
            />
          ))
        ) : (
          <Card
            title="Nenhuma métrica encontrada"
            description="Adicione sua primeira métrica de saúde para começar a monitorar seu bem-estar."
            actionLabel="Adicionar Métrica"
            onAction={() => navigation.navigate('AddMetric')}
            journey="health"
          />
        )}
      </ScrollView>
    </View>
  );
};