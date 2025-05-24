/**
 * @file GoalCard.tsx
 * @description A component for displaying health goals with progress tracking
 * and completion status. Integrates with the gamification system.
 */

import React from 'react';
import { Box, Text, Stack } from '@design-system/primitives';
import { useJourney } from '@austa/journey-context';
import { HealthGoal } from '@austa/interfaces/health';

/**
 * Props for the GoalCard component
 */
export interface GoalCardProps {
  /** The title of the goal */
  title: string;
  /** Optional description of the goal */
  description?: string;
  /** Progress towards completing the goal (0-100) */
  progress?: number;
  /** Whether the goal has been completed */
  completed?: boolean;
  /** Optional callback when goal is achieved */
  onAchieved?: () => void;
  /** Optional health goal data */
  goalData?: Partial<HealthGoal>;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * GoalCard - A component for displaying goal information
 * 
 * Displays health goals with title, description, progress bar, and completion status.
 * Integrates with the gamification system to show goal progress as part of the Health journey.
 * 
 * @example
 * <GoalCard
 *   title="Walk 10,000 steps daily"
 *   description="Stay active by walking at least 10,000 steps every day"
 *   progress={75}
 *   completed={false}
 *   onAchieved={() => console.log('Goal achieved!')}
 * />
 */
const GoalCard: React.FC<GoalCardProps> = ({ 
  title, 
  description, 
  progress = 0, 
  completed = false,
  onAchieved,
  goalData,
  testID = 'goal-card'
}) => {
  // Get journey context for theming
  const { journeyData } = useJourney();
  
  // Ensure progress is within valid range
  const normalizedProgress = completed ? 100 : Math.min(Math.max(progress, 0), 100);
  
  // Determine the primary color based on journey and completion status
  const primaryColor = completed 
    ? 'semantic.success' 
    : `journeys.${journeyData.id}.primary`;
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      padding="md"
      borderRadius="md"
      backgroundColor="neutral.white"
      boxShadow="sm"
      borderLeft="4px solid"
      borderLeftColor={primaryColor}
      transition="transform 0.3s ease, box-shadow 0.3s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md'
      }}
      aria-label={`Goal: ${title}${completed ? ', completed' : `, ${normalizedProgress}% complete`}`}
      data-testid={testID}
      role="region"
      aria-roledescription="health goal card"
    >
      <Stack direction="row" spacing="sm" alignItems="center" marginBottom="sm">
        {completed && (
          <Box
            display="inline-flex"
            alignItems="center"
            padding="xs"
            paddingLeft="sm"
            paddingRight="sm"
            backgroundColor="semantic.success"
            color="neutral.white"
            borderRadius="full"
            aria-label="Goal completed"
          >
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              color="inherit"
            >
              ✓ Completed
            </Text>
          </Box>
        )}
        <Text 
          fontSize="sm" 
          color="neutral.gray600" 
          marginLeft="auto"
          aria-label={`Progress: ${normalizedProgress}%`}
        >
          {completed ? '100%' : `${normalizedProgress}%`}
        </Text>
      </Stack>
      
      <Text 
        as="h3" 
        fontSize="lg" 
        fontWeight="bold" 
        color="neutral.gray900" 
        marginBottom="xs"
      >
        {title}
      </Text>
      
      {description && (
        <Text 
          fontSize="md" 
          color="neutral.gray700" 
          marginBottom="md"
        >
          {description}
        </Text>
      )}
      
      <Box
        width="100%"
        height="8px"
        backgroundColor="neutral.gray200"
        borderRadius="sm"
        overflow="hidden"
        marginTop="auto"
      >
        <Box 
          height="100%"
          borderRadius="sm"
          backgroundColor={primaryColor}
          width={`${normalizedProgress}%`}
          transition="width 0.3s ease"
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${normalizedProgress}% complete`}
        />
      </Box>
    </Box>
  );
};

export default GoalCard;