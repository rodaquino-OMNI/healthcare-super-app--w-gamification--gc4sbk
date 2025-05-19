import React from 'react';
import { Modal } from '@austa/design-system/components/Modal';
import { AchievementBadge } from '@austa/design-system/gamification/AchievementBadge';
import { useGamification } from '@austa/journey-context/providers';
import { formatJourneyValue } from '@app/shared/utils/format';
import { JOURNEY_COLORS } from '@app/shared/constants';
import { Box, Text } from '@design-system/primitives/components';
import { Achievement, JourneyType } from '@austa/interfaces/gamification';

/**
 * Props for the GamificationPopup component
 */
interface GamificationPopupProps {
  /**
   * A boolean indicating whether the popup is visible.
   */
  visible: boolean;
  /**
   * A function to call when the popup is closed.
   */
  onClose: () => void;
  /**
   * The ID of the achievement to display.
   */
  achievementId: string;
}

/**
 * A component that displays a gamification popup with an achievement badge.
 * 
 * @param visible - A boolean indicating whether the popup is visible.
 * @param onClose - A function to call when the popup is closed.
 * @param achievementId - The ID of the achievement to display.
 * @returns The rendered GamificationPopup component.
 */
export const GamificationPopup: React.FC<GamificationPopupProps> = ({
  visible,
  onClose,
  achievementId
}) => {
  // Access the gamification context to get user's achievements
  const { gameProfile, isLoading } = useGamification();

  // If the game profile is loading or doesn't exist, or if we don't have an achievement ID, return null
  if (isLoading || !gameProfile || !achievementId) {
    return null;
  }

  // Find the achievement with the matching ID
  const achievement = gameProfile.achievements.find(a => a.id === achievementId);

  // If no matching achievement is found, don't render anything
  if (!achievement) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Conquista Desbloqueada!"
      journey={achievement.journey as JourneyType}
    >
      <Box 
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        padding="16px"
        textAlign="center"
      >
        <Box 
          margin="16px 0"
          transform="scale(1.5)"
        >
          <AchievementBadge achievement={achievement} size="lg" />
        </Box>
        
        <Text 
          fontSize="24px"
          fontWeight="bold"
          marginBottom="8px"
        >
          {achievement.title}
        </Text>
        
        <Text 
          fontSize="16px"
          marginBottom="16px"
          color="#616161"
        >
          {achievement.description}
        </Text>
        
        <Text 
          fontSize="18px"
          fontWeight="bold"
          color={getJourneyColor(achievement.journey)}
          marginBottom="16px"
        >
          +{formatJourneyValue(achievement.unlocked ? achievement.total : achievement.progress, 
              achievement.journey, 'number')} XP
        </Text>
      </Box>
    </Modal>
  );
};

/**
 * Helper function to get the color for a specific journey
 * 
 * @param journey - The journey identifier
 * @returns The color associated with the journey
 */
const getJourneyColor = (journey: string): string => {
  const journeyKey = journey.toUpperCase() as keyof typeof JOURNEY_COLORS;
  return JOURNEY_COLORS[journeyKey] || '#0ACF83';
};