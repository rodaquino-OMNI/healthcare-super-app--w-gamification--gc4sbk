import React from 'react';
import { Modal } from '@austa/design-system/components/Modal';
import { AchievementBadge } from '@austa/design-system/gamification/AchievementBadge';
import { useGamification } from '@austa/journey-context/hooks/useGamification';
import { formatJourneyValue } from 'src/web/shared/utils/format';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { GamificationPopupProps } from '@austa/interfaces/components/gamification.types';

/**
 * A component that displays a gamification popup with an achievement badge
 * when the user unlocks an achievement or receives a reward.
 *
 * @example
 * ```tsx
 * <GamificationPopup
 *   visible={showAchievement}
 *   onClose={() => setShowAchievement(false)}
 *   achievementId="daily-login-streak"
 * />
 * ```
 */
export const GamificationPopup: React.FC<GamificationPopupProps> = ({ 
  visible, 
  onClose, 
  achievementId 
}) => {
  const { gameProfile, isLoading } = useGamification();
  
  // Check if game profile is loaded and has achievements
  if (isLoading || !gameProfile || !gameProfile.achievements) {
    return null;
  }
  
  // Find the achievement with the matching achievementId
  const achievement = gameProfile.achievements.find(a => a.id === achievementId);
  
  // If achievement is not found, don't display anything
  if (!achievement) {
    return null;
  }
  
  // Determine XP reward - for demonstration, we're using a fixed value
  // In a real implementation, this would come from the game rules or backend
  const xpReward = achievement.xpReward || 100;
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Conquista Desbloqueada!"
      journey={achievement.journey}
      testID="achievement-popup"
    >
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        padding="lg"
        testID="achievement-content"
      >
        <AchievementBadge 
          achievement={achievement} 
          size="lg" 
          showProgress={false}
        />
        
        <Box marginTop="md">
          <Text fontSize="xl" fontWeight="bold" textAlign="center">
            {achievement.title}
          </Text>
        </Box>
        
        <Box marginTop="sm">
          <Text textAlign="center">
            {achievement.description}
          </Text>
        </Box>
        
        <Box 
          marginTop="md" 
          padding="sm" 
          backgroundColor="gray100" 
          borderRadius="md"
        >
          <Text fontWeight="bold" textAlign="center">
            +{formatJourneyValue(xpReward, achievement.journey)} XP
          </Text>
        </Box>
      </Box>
    </Modal>
  );
};