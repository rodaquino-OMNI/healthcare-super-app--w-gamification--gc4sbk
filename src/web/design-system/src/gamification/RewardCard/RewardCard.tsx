import React from 'react';
import { Box, Text, Icon, Touchable } from '@design-system/primitives';
import { Reward } from '@austa/interfaces/gamification/rewards';
import { useJourney } from '@austa/journey-context/src/hooks/useJourney';

/**
 * Props for the RewardCard component
 */
interface RewardCardProps {
  /** The reward object containing title, description, icon, xp, and journey */
  reward: Reward;
  /** Callback function when the card is pressed */
  onPress?: () => void;
  /** Test ID for testing purposes */
  testID?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * A component that displays reward information with journey-specific styling,
 * showing the reward title, description, icon, and XP value. Applies journey-specific
 * colors based on the reward's journey property.
 *
 * @example
 * ```tsx
 * <RewardCard
 *   reward={{
 *     id: 'reward-1',
 *     title: 'Weekly Goal Achieved',
 *     description: 'You completed your weekly step goal!',
 *     icon: 'trophy',
 *     xp: 100,
 *     journey: 'health',
 *     category: RewardCategory.VIRTUAL,
 *     status: RewardStatus.AVAILABLE,
 *     availableFrom: new Date(),
 *     availableUntil: null,
 *     redemptionLimit: null
 *   }}
 *   onPress={() => console.log('Reward card pressed')}
 * />
 * ```
 */
export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  onPress,
  testID,
  accessibilityLabel,
}) => {
  const { title, description, icon, xp, journey } = reward;
  const { getJourneyTheme } = useJourney();
  const journeyTheme = getJourneyTheme();

  // Create a descriptive accessibility label if none provided
  const defaultAccessibilityLabel = `${title} reward. ${description}. Worth ${xp} XP.`;

  return (
    <Touchable
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
    >
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        padding="md"
        marginBottom="md"
        backgroundColor="white"
        borderRadius="md"
        boxShadow="sm"
        transition="transform 0.2s ease-out"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md'
        }}
      >
        <Icon 
          name={icon} 
          color={journeyTheme.primary} 
          size={48}
          marginRight="md"
          aria-hidden="true" 
        />
        <Box flex={1} display="flex" flexDirection="column">
          <Text 
            fontWeight="medium" 
            marginBottom="xs"
          >
            {title}
          </Text>
          <Text 
            fontSize="sm" 
            color="gray.700" 
            marginBottom="xs"
          >
            {description}
          </Text>
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            backgroundColor={journeyTheme.primary}
            color="white"
            padding="xs"
            paddingLeft="sm"
            paddingRight="sm"
            borderRadius="sm"
            fontSize="sm"
            fontWeight="medium"
            alignSelf="flex-start"
          >
            +{xp} XP
          </Box>
        </Box>
      </Box>
    </Touchable>
  );
};

export default RewardCard;