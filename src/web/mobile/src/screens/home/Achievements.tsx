import React from 'react';
import { Box } from '@design-system/primitives/src/components/Box';
import { useJourneyContext } from '@austa/journey-context/src/hooks';

// Import the AchievementList component with the correct relative path
import AchievementList from '../../components/lists/AchievementList';

// Import types from the shared interfaces package
import { Achievement } from '@austa/interfaces/gamification/achievements';

/**
 * Renders the Achievements screen, displaying a list of achievements.
 * Uses journey-specific theming based on the current journey context.
 * 
 * This screen is part of the cross-journey gamification system that processes
 * events from all journeys to drive user engagement through achievements,
 * challenges, and rewards.
 * 
 * @returns {JSX.Element} A Box component containing the AchievementList component.
 */
const Achievements: React.FC = () => {
  // Get the current journey context for theming
  const { currentJourney } = useJourneyContext();

  return (
    <Box 
      flex={1}
      padding={10}
      // Apply journey-specific background color based on the current journey
      backgroundColor={currentJourney ? `${currentJourney.toLowerCase()}.background` : 'common.background'}
      // Preserve accessibility properties from the original component
      accessible={true}
      accessibilityLabel="Achievements Screen"
    >
      <AchievementList />
    </Box>
  );
};

export default Achievements;