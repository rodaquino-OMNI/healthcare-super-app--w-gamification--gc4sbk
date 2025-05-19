import React from 'react';
import { useRouter } from 'next/router';

// Updated imports using standardized paths
import { Achievement } from '@austa/interfaces/gamification/achievements';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { useGamification } from '@austa/journey-context/hooks';
import { useJourney } from '@austa/journey-context/hooks';
import { AchievementBadge } from '@austa/design-system/gamification/AchievementBadge';
import { Stack } from '@design-system/primitives/components/Stack';
import { Text } from '@design-system/primitives/components/Text';
import { Box } from '@design-system/primitives/components/Box';
import { Card } from '@austa/design-system/components/Card';

/**
 * Achievements: Renders a gallery of achievements, grouped by journey.
 *
 * @returns A React component displaying the achievements.
 */
const Achievements: React.FC = () => {
  // Get the current journey context for journey-specific theming
  const { currentJourney } = useJourney();
  
  // Retrieve the user ID from the authentication context
  const userId = 'user-123'; // Replace with actual user ID from auth context

  // Use the standardized useGamification hook to fetch the user's game profile
  const { gameProfile, isLoading, error } = useGamification();

  // If the game profile is loading, renders a loading indicator
  if (isLoading) {
    return (
      <Box padding="md">
        <Text>Loading achievements...</Text>
      </Box>
    );
  }

  // If there is an error fetching the game profile, renders an error message
  if (error) {
    return (
      <Box padding="md">
        <Text color="error">Error loading achievements.</Text>
      </Box>
    );
  }

  // Group the achievements by journey using proper type safety
  const achievementsByJourney = gameProfile?.achievements.reduce<Record<string, Achievement[]>>((acc, achievement) => {
    if (!acc[achievement.journey]) {
      acc[achievement.journey] = [];
    }
    acc[achievement.journey].push(achievement);
    return acc;
  }, {});

  // Render the achievements grouped by journey
  return (
    <Box padding="md">
      <Stack direction="column" gap="md">
        {/* For each journey, render a Card component with the journey title and achievements */}
        {Object.entries(achievementsByJourney || {}).map(([journey, achievements]) => (
          <Card key={journey} journey={journey}>
            <Box padding="md">
              <Text fontWeight="bold" fontSize="xl" marginBottom="md">
                {journey.toUpperCase()} Achievements
              </Text>
              <Stack direction="row" gap="md" flexWrap="wrap">
                {achievements.map((achievement) => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                    size="md"
                    showProgress={!achievement.unlocked}
                  />
                ))}
              </Stack>
            </Box>
          </Card>
        ))}

        {/* If there are no achievements, render a message */}
        {(!achievementsByJourney || Object.keys(achievementsByJourney).length === 0) && (
          <Box padding="md">
            <Text>No achievements earned yet.</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

// Export the Achievements component as the default export
export default Achievements;