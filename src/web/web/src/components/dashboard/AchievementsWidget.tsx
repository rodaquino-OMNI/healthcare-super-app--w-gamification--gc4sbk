import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, Text } from '@design-system/primitives/components';
import { Card } from '@austa/design-system/components';
import { Button } from '@austa/design-system/components';
import { AchievementBadge } from '@austa/design-system/gamification';
import { ALL_JOURNEYS } from 'src/web/shared/constants/journeys';
import { Achievement } from '@austa/interfaces/gamification';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { useGameProfile } from 'src/web/web/src/hooks/useGamification';
import { useJourneyContext } from '@austa/journey-context';

/**
 * Displays a list of recent achievements with a link to the full achievement gallery.
 * Uses the design system primitives and journey-specific theming.
 */
export const AchievementsWidget: React.FC = () => {
  // Get the user ID from the auth context
  const { session } = useAuth();
  const userId = session?.userId;

  // Fetch the user's game profile data
  const { data: gameProfileData, isLoading } = useGameProfile(userId || '');

  // Get the 5 most recent achievements
  const achievements = gameProfileData?.gameProfile?.achievements?.slice(0, 5) || [];

  // Get the router for navigation and journey context for theming
  const router = useRouter();
  const { currentJourney, journeyData } = useJourneyContext();

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <Card>
        <Box padding="md">
          <Text color="neutral.600">Loading achievements...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card title="Recent Achievements">
      <Stack direction="column" spacing="md">
        {achievements.length > 0 ? (
          achievements.map((achievement: Achievement) => (
            <AchievementBadge 
              key={achievement.id} 
              achievement={achievement} 
              size="sm" 
            />
          ))
        ) : (
          <Box padding="sm">
            <Text color="neutral.600">No achievements yet. Complete activities to earn achievements!</Text>
          </Box>
        )}
        <Box marginTop="sm">
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => router.push('/achievements')}
          >
            View All Achievements
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default AchievementsWidget;