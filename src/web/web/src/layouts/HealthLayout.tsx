import React, { useEffect } from 'react';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { useJourney } from '@austa/journey-context/hooks';
import { JOURNEY_IDS } from '@austa/interfaces/common';
import { healthTheme } from '@austa/design-system/themes';
import { BaseComponentProps } from '@austa/interfaces/components';

/**
 * Props for the HealthLayout component
 */
export interface HealthLayoutProps extends BaseComponentProps {
  /** Child components to render within the layout */
  children: React.ReactNode;
}

/**
 * HealthLayout component that provides a consistent layout for the Health Journey.
 * It applies the Health Journey theme and structure to all pages within this journey.
 * 
 * @param {HealthLayoutProps} props - Component props with children
 * @returns {React.ReactElement} The Health Journey layout with the provided children
 */
const HealthLayout: React.FC<HealthLayoutProps> = ({ children, testID, className }) => {
  const { journey, setJourney } = useJourney();

  // Ensure we're in the Health journey context
  useEffect(() => {
    if (journey?.id !== JOURNEY_IDS.HEALTH) {
      setJourney(JOURNEY_IDS.HEALTH);
    }
  }, [journey, setJourney]);

  return (
    <Box 
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      backgroundColor={healthTheme.colors.background}
      color={healthTheme.colors.text}
      testID={testID}
      className={className}
    >
      <Box
        as="header"
        backgroundColor={healthTheme.colors.primary}
        color={healthTheme.colors.neutral.white}
        padding="md"
        boxShadow={healthTheme.shadows.sm}
      >
        <Text 
          as="h1"
          fontSize="xl"
          fontWeight="bold"
          color={healthTheme.colors.neutral.white}
        >
          Minha Saúde
        </Text>
      </Box>
      
      <Box
        as="main"
        flex={1}
        padding="md"
        maxWidth="1200px"
        margin="0 auto"
        width="100%"
      >
        {children}
      </Box>
      
      <Box
        as="footer"
        backgroundColor={healthTheme.colors.neutral.white}
        borderTop={`1px solid ${healthTheme.colors.secondary}`}
        padding="sm"
        textAlign="center"
        color={healthTheme.colors.neutral.gray600}
      >
        <Text fontSize="sm">
          &copy; {new Date().getFullYear()} AUSTA SuperApp - Minha Saúde
        </Text>
      </Box>
    </Box>
  );
};

export default HealthLayout;