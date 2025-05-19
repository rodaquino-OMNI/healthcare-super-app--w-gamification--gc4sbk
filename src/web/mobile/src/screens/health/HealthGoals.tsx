import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import components from design system packages
import { Card, Button, ProgressBar } from '@austa/design-system/components';
import { Text } from '@design-system/primitives/components/Text';
import {
  LoadingIndicator,
  ErrorState,
  JourneyHeader,
} from 'src/web/mobile/src/components/shared';
import { HealthGoalForm } from 'src/web/mobile/src/components/forms';

// Import hooks from journey-context package
import { useJourneyContext } from '@austa/journey-context/hooks';
import { useAuth } from '@austa/journey-context/hooks';
import { useHealthMetrics } from 'src/web/mobile/src/hooks/useHealthMetrics';
import { useGamification } from '@austa/journey-context/hooks';

// Import types from interfaces package
import { HealthGoal } from '@austa/interfaces/health';
import { MOBILE_HEALTH_ROUTES } from '@austa/interfaces/common';

// Define the style for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  addButtonContainer: {
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});

/**
 * Displays and manages health goals for the user.
 * Implements the Health Goals screen for the My Health Journey (F-101).
 * Allows users to set and track health-related goals (F-101-RQ-005).
 * Integrates with the gamification system for goal achievements.
 */
const HealthGoals: React.FC = () => {
  // Get the current user's ID from the authentication context
  const { userId } = useAuth();

  // Fetch available health metric types using the useHealthMetrics hook
  const { data: healthMetricTypes, loading, error, refetch } = useHealthMetrics(userId, null, null, []);

  // Access gamification data and functions using the useGamification hook
  const { gameProfile, achievements, quests, triggerEvent } = useGamification();

  // Get the current journey from the JourneyContext
  const { journey } = useJourneyContext();

  // Access the navigation object for screen navigation
  const navigation = useNavigation();

  // State to manage the visibility of the HealthGoalForm modal
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Function to handle the addition of a new health goal
  const handleAddGoal = () => {
    setIsFormVisible(true);
  };

  // Function to close the HealthGoalForm modal
  const handleCloseForm = () => {
    setIsFormVisible(false);
  };

  // Function to handle goal progress and trigger gamification events
  const handleGoalProgress = useCallback((goalId: string, progress: number) => {
    // Trigger gamification event when progress reaches certain thresholds
    if (progress >= 25 && progress < 50) {
      triggerEvent({
        type: 'GOAL_PROGRESS',
        journeyId: 'health',
        userId,
        metadata: {
          goalId,
          progress,
          milestone: 'QUARTER'
        }
      });
    } else if (progress >= 50 && progress < 75) {
      triggerEvent({
        type: 'GOAL_PROGRESS',
        journeyId: 'health',
        userId,
        metadata: {
          goalId,
          progress,
          milestone: 'HALF'
        }
      });
    } else if (progress >= 75 && progress < 100) {
      triggerEvent({
        type: 'GOAL_PROGRESS',
        journeyId: 'health',
        userId,
        metadata: {
          goalId,
          progress,
          milestone: 'THREE_QUARTERS'
        }
      });
    } else if (progress >= 100) {
      triggerEvent({
        type: 'GOAL_COMPLETED',
        journeyId: 'health',
        userId,
        metadata: {
          goalId,
          completedAt: new Date().toISOString()
        }
      });
    }
  }, [triggerEvent, userId]);

  // Function to handle retry when there's an error
  const handleRetry = () => {
    refetch();
  };

  // Render loading indicator while health metric types are being fetched
  if (loading) {
    return <LoadingIndicator />;
  }

  // Render error state if there is an error fetching health metric types
  if (error) {
    return (
      <ErrorState 
        message="Failed to load health goals." 
        description="There was a problem retrieving your health goals. Please try again."
        onRetry={handleRetry}
        journey={journey}
      />
    );
  }

  // Render the main component
  return (
    <View style={styles.container}>
      {/* Render the JourneyHeader component with the screen title and a button to add a new goal */}
      <JourneyHeader
        title="Health Goals"
        rightActions={(
          <View style={styles.addButtonContainer}>
            <Button
              variant="secondary"
              size="sm"
              onPress={handleAddGoal}
              journey={journey}
              accessibilityLabel="Add new health goal"
            >
              Add Goal
            </Button>
          </View>
        )}
      />

      {/* Render a list of existing health goals, displaying their progress using the ProgressBar component */}
      {quests && quests.length > 0 ? (
        <FlatList
          data={quests}
          keyExtractor={(item) => item.id}
          style={styles.goalItem}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card journey={journey}>
              <TouchableOpacity 
                onPress={() => {
                  // Track goal interaction
                  handleGoalProgress(item.id, item.progress);
                  // Navigate to metric detail screen
                  navigation.navigate(MOBILE_HEALTH_ROUTES.METRIC_DETAIL);
                }}
                accessibilityLabel={`View details for goal: ${item.title}, progress: ${item.progress}%`}
              >
                <View>
                  {/* Display the goal title */}
                  <Text fontWeight="medium">{item.title}</Text>
                  {/* Display the progress of the goal using the ProgressBar component */}
                  <ProgressBar 
                    current={item.progress} 
                    total={100} 
                    journey={journey} 
                    accessibilityLabel={`Goal progress: ${item.progress}%`}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText} fontWeight="medium" color="textSecondary">
            You don't have any health goals yet. Create your first goal to start tracking your health journey.
          </Text>
          <Button
            variant="primary"
            onPress={handleAddGoal}
            journey={journey}
            accessibilityLabel="Create your first health goal"
          >
            Create First Goal
          </Button>
        </View>
      )}

      {/* Render the HealthGoalForm modal when the add goal button is pressed */}
      <HealthGoalForm isVisible={isFormVisible} onClose={handleCloseForm} />
    </View>
  );
};

export default HealthGoals;