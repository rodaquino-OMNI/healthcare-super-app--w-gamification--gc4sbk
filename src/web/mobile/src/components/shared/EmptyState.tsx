import React from 'react';
import { Stack, Icon, Text, Button } from '@austa/design-system';
import { useJourney } from '@austa/journey-context';
import { EmptyStateProps } from '@austa/interfaces';
import { colors } from '@design-system/primitives';

/**
 * EmptyState component displays a user-friendly message when there is no data to show.
 * It includes an icon, title, optional description, and optional action button.
 * The component supports journey-specific styling to maintain visual consistency.
 *
 * Uses components from @austa/design-system, journey context from @austa/journey-context,
 * and theme tokens from @design-system/primitives.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="heart"
 *   title="No health metrics found"
 *   description="Connect a device or add metrics manually to see data here."
 *   actionLabel="Add Metrics"
 *   onAction={() => navigation.navigate('AddMetrics')}
 *   journey="health"
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  journey,
  testID,
}) => {
  // Use the provided journey or get it from context
  const { journey: contextJourney } = useJourney();
  const currentJourney = journey || contextJourney;

  // Get journey-specific primary color for the icon and button using theme tokens
  const getJourneyColor = () => {
    if (currentJourney === 'health') return colors.journey.health.primary;
    if (currentJourney === 'care') return colors.journey.care.primary;
    if (currentJourney === 'plan') return colors.journey.plan.primary;
    return colors.brand.primary; // Default to brand primary if no journey specified
  };

  return (
    <Stack
      spacing="lg"
      align="center"
      testID={testID || 'empty-state'}
      padding="xl"
    >
      {/* Icon with journey-specific color */}
      <Icon
        name={icon}
        size={64}
        color={getJourneyColor()}
        aria-hidden={true}
      />

      {/* Main title/message */}
      <Text
        fontSize="xl"
        fontWeight="bold"
        textAlign="center"
        journey={currentJourney}
      >
        {title}
      </Text>

      {/* Optional description */}
      {description && (
        <Text
          fontSize="md"
          textAlign="center"
          color="neutral.gray600"
        >
          {description}
        </Text>
      )}

      {/* Optional action button */}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          journey={currentJourney}
          onPress={onAction}
          accessibilityLabel={actionLabel}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
};

export default EmptyState;