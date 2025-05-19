import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import from the new package structure
import { Box } from '@design-system/primitives';
import { AchievementBadge, EmptyState } from '@austa/design-system';
import { Achievement } from '@austa/interfaces/gamification';
import { useAchievements } from '@austa/journey-context';

// Define the style for the component
const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});

/**
 * Renders a list of achievements.
 * This component displays a scrollable list of achievements fetched from the `useAchievements` hook.
 * If no achievements are available, it renders an `EmptyState` component to inform the user.
 *
 * @returns A FlatList component displaying the achievements or an EmptyState component if there are no achievements.
 */
const AchievementList: React.FC = () => {
  // Fetch the achievements using the useAchievements hook
  const achievements = useAchievements();

  // Get the navigation object
  const navigation = useNavigation();

  // Render the list of achievements or the EmptyState component
  return (
    <Box>
      {achievements && achievements.length > 0 ? (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AchievementBadge
              achievement={item}
              onPress={() => {
                // Navigate to the achievement details screen when an achievement is pressed
                navigation.navigate('AchievementDetails', { achievementId: item.id });
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          accessibilityLabel="List of achievements"
        />
      ) : (
        <EmptyState
          icon="trophy"
          title="No achievements yet"
          description="Complete tasks and reach goals to unlock achievements."
          journey="gamification"
          testID="empty-state"
        />
      )}
    </Box>
  );
};

// Export the AchievementList component
export default AchievementList;