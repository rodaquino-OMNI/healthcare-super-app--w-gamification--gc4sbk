import React from 'react';
import { Reward } from '@austa/interfaces/gamification/rewards';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Stack } from '@design-system/primitives/components/Stack';
import { Icon } from '@design-system/primitives/components/Icon';
import { Touchable } from '@design-system/primitives/components/Touchable';
import { useJourneyContext } from '@austa/journey-context/hooks';

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
 *     journey: 'health'
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
  const { theme } = useJourneyContext();
  const journeyColor = theme.colors[journey];

  // Create a descriptive accessibility label if none provided
  const defaultAccessibilityLabel = `${title} reward. ${description}. Worth ${xp} XP.`;

  return (
    <Touchable
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
    >
      <Box
        display="flex"
        flexDirection="row"
        padding="medium"
        backgroundColor="white"
        borderRadius="medium"
        boxShadow="sm"
        borderLeft={`4px solid ${journeyColor.primary}`}
      >
        <Icon 
          name={icon} 
          color={journeyColor.primary} 
          size="large"
          aria-hidden="true" 
        />
        <Stack direction="vertical" spacing="small" flex={1} marginLeft="medium">
          <Text variant="subtitle" color="text.primary">
            {title}
          </Text>
          <Text variant="body" color="text.secondary">
            {description}
          </Text>
          <Box 
            alignSelf="flex-start" 
            backgroundColor={journeyColor.primary}
            borderRadius="small"
            paddingX="small"
            paddingY="xsmall"
            marginTop="xsmall"
          >
            <Text color="white" variant="caption" fontWeight="bold">
              +{xp} XP
            </Text>
          </Box>
        </Stack>
      </Box>
    </Touchable>
  );
};

export default RewardCard;