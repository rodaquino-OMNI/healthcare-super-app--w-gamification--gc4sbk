import React from 'react';
import { Box, Text, Stack } from '@design-system/primitives';
import { useJourney } from '@austa/journey-context';
import { HealthGoal } from '@austa/interfaces/health';

export interface GoalCardProps {
  /** The health goal data */
  goal: HealthGoal;
  /** Optional callback when goal is achieved */
  onAchieved?: (goalId: string) => void;
  /** Additional class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * GoalCard - A component for displaying health goal information with progress
 * 
 * @param {GoalCardProps} props - Component props
 * @returns {React.ReactElement} The GoalCard component
 */
const GoalCard: React.FC<GoalCardProps> = ({ 
  goal,
  onAchieved,
  className,
  testId = 'goal-card'
}) => {
  const { journey } = useJourney();
  const { title, description, progress = 0, completed = false, id } = goal;
  
  // Ensure progress is within valid range
  const normalizedProgress = completed ? 100 : Math.min(Math.max(progress, 0), 100);
  
  // Handle achievement callback when goal is completed
  React.useEffect(() => {
    if (completed && onAchieved && id) {
      onAchieved(id);
    }
  }, [completed, onAchieved, id]);

  return (
    <Box 
      display="flex"
      flexDirection="column"
      padding="16px"
      borderRadius="8px"
      backgroundColor="neutral.white"
      boxShadow="sm"
      transition="transform 0.3s ease, box-shadow 0.3s ease"
      borderLeft="4px solid"
      borderLeftColor={completed ? 'semantic.success' : `journeys.${journey}.primary`}
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md'
      }}
      className={className}
      aria-label={`Goal: ${title}${completed ? ', completed' : `, ${normalizedProgress}% complete`}`}
      data-testid={testId}
      role="region"
      aria-roledescription="health goal card"
    >
      <Stack direction="row" alignItems="center" marginBottom="12px">
        {completed && (
          <Box 
            display="inline-flex"
            alignItems="center"
            padding="4px 8px"
            backgroundColor="semantic.success"
            color="neutral.white"
            borderRadius="16px"
            marginRight="8px"
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
          aria-live="polite"
          aria-atomic="true"
        >
          {completed ? '100%' : `${normalizedProgress}%`}
        </Text>
      </Stack>
      
      <Text 
        as="h3" 
        fontSize="lg" 
        fontWeight="bold" 
        color="neutral.gray900" 
        marginBottom="8px"
      >
        {title}
      </Text>
      
      {description && (
        <Text 
          fontSize="md" 
          color="neutral.gray700" 
          marginBottom="16px"
        >
          {description}
        </Text>
      )}
      
      <Box 
        width="100%"
        height="8px"
        backgroundColor="neutral.gray200"
        borderRadius="4px"
        overflow="hidden"
        marginTop="auto"
      >
        <Box 
          height="100%"
          borderRadius="4px"
          backgroundColor={completed ? 'semantic.success' : `journeys.${journey}.primary`}
          width={`${normalizedProgress}%`}
          transition="width 0.3s ease"
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${normalizedProgress}% progress toward goal`}
        />
      </Box>
    </Box>
  );
};

export default GoalCard;