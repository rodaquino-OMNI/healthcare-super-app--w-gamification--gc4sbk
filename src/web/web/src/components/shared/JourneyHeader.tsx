import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, Text } from '@design-system/primitives/components';
import { Button } from '@austa/design-system/components';
import { useJourney } from '@austa/journey-context/hooks';
import { JourneyId } from '@austa/journey-context/types';
import { ThemeProps } from '@austa/interfaces/themes';

export interface JourneyHeaderProps {
  /**
   * The title to display in the header
   */
  title: string;
  /**
   * Whether to show a back button
   * @default false
   */
  showBackButton?: boolean;
  /**
   * Callback for when the back button is pressed
   * If not provided, will use router.back()
   */
  onBackPress?: () => void;
  /**
   * Optional test ID for testing
   */
  testID?: string;
}

/**
 * A consistent header component for journey-specific screens
 * with the appropriate title, theming, and optional back button.
 */
export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  testID = 'journey-header',
}) => {
  const router = useRouter();
  const { currentJourney } = useJourney();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <Box
      as="header"
      width="100%"
      padding="md"
      backgroundColor={`journey.${currentJourney.id}.background`}
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor={`journey.${currentJourney.id}.border`}
      data-testid={testID}
      role="banner"
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing="md"
        width="100%"
        maxWidth="1200px"
        marginX="auto"
      >
        {showBackButton && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleBackPress}
            aria-label="Go back"
            data-testid={`${testID}-back-button`}
            journey={currentJourney.id as JourneyId}
            leftIcon="arrow-left"
          >
            Back
          </Button>
        )}
        <Text
          as="h1"
          fontSize={['lg', 'xl']}
          fontWeight="bold"
          color={`journey.${currentJourney.id}.text`}
          flex={1}
          textAlign={showBackButton ? 'left' : 'center'}
          data-testid={`${testID}-title`}
        >
          {title}
        </Text>
      </Stack>
    </Box>
  );
};

export default JourneyHeader;