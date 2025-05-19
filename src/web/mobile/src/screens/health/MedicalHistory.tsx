import React, { useState, useEffect } from 'react'; // react v18.0.0
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native'; // react-native v0.71.8

// Updated imports using the new package structure
import { MedicalEvent } from '@austa/interfaces/health';
import { ROUTES } from 'src/web/mobile/src/constants/routes';
import { getMedicalHistory } from 'src/web/mobile/src/api/health';
import { JourneyHeader } from 'src/web/mobile/src/components/shared/JourneyHeader';
import { Card } from '@austa/design-system/components/Card';
import { Text } from '@austa/design-system/primitives/Text';
import { useJourney } from '@austa/journey-context';
import { formatDate } from '@austa/utils/date';
import { useErrorHandler } from '@austa/errors';

/**
 * MedicalHistory Component:
 * Displays the user's medical history timeline, fetching data and rendering it in a chronological order.
 * It includes filtering options and handles empty state scenarios.
 */
const MedicalHistory = () => {
  // State variables for managing medical history data and loading state
  const [medicalHistory, setMedicalHistory] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Get journey context for journey-specific styling
  const { journey, journeyTheme } = useJourney();
  
  // Use standardized error handling
  const { handleError, isRetrying } = useErrorHandler({
    context: 'health',
    component: 'MedicalHistory',
    onRetry: () => setRetryCount(prev => prev + 1),
  });

  // useEffect hook to fetch medical history data when the component mounts
  useEffect(() => {
    // Reset error state on retry
    setError(null);
    
    // Async function to fetch medical history
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Fetch medical history data from the API
        const history = await getMedicalHistory('user-123', [], null, null);
        setMedicalHistory(history);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch medical history');
        setError(error);
        // Use standardized error handling with retry logic
        handleError(error, {
          message: 'Failed to fetch medical history',
          retry: retryCount < 3,
          fallback: () => setMedicalHistory([]),
        });
      } finally {
        setLoading(false);
      }
    };

    // Call the fetchHistory function
    fetchHistory();
  }, [retryCount, handleError]);

  // Render item for the FlatList
  const renderItem = ({ item }: { item: MedicalEvent }) => (
    <Card 
      style={styles.card}
      journey={journey}
      elevation="md"
      testID={`medical-event-${item.id}`}
    >
      <View style={styles.eventContainer}>
        <View style={styles.eventDetails}>
          <Text 
            style={[styles.eventTitle, { color: journeyTheme.colors.primary }]}
            fontWeight="bold"
          >
            {item.type}
          </Text>
          <Text 
            style={styles.eventDate}
            color={journeyTheme.colors.text.secondary}
          >
            {formatDate(new Date(item.date), 'MMMM dd, yyyy')}
          </Text>
          <Text style={styles.eventDescription}>
            {item.description}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Key extractor for FlatList
  const keyExtractor = (item: MedicalEvent) => item.id;

  // Handle retry button press
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Render the component
  return (
    <View style={[styles.container, { backgroundColor: journeyTheme.colors.background }]}>
      <JourneyHeader title="Medical History" showBackButton={true} />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={journeyTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading medical history...</Text>
        </View>
      ) : error && !isRetrying ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load medical history</Text>
          <Text style={styles.errorDescription}>{error.message}</Text>
          <Card 
            style={styles.retryButton}
            onPress={handleRetry}
            journey={journey}
            elevation="sm"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Card>
        </View>
      ) : medicalHistory.length > 0 ? (
        <FlatList
          data={medicalHistory}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          testID="medical-history-list"
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No medical history available.</Text>
        </View>
      )}
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetails: {
    marginLeft: 10,
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  retryButton: {
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MedicalHistory;