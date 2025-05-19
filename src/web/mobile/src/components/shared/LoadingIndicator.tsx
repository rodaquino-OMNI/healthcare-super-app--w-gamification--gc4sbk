import React from 'react';
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { animation } from '@design-system/primitives/tokens';
import { colors } from '@design-system/primitives/tokens';
import { JOURNEY_COLORS } from '@austa/journey-context/constants';
import { LoadingIndicatorProps } from '@austa/interfaces/components';
import styled, { keyframes } from 'styled-components';

// Create a rotation animation
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled component for the spinner
const Spinner = styled.div<{ color: string; size: string }>`
  width: ${props => props.size};
  height: ${props => props.size};
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: ${props => props.color};
  animation: ${rotate} ${animation.duration.normal} ${animation.easing.easeInOut} infinite;
`;

/**
 * LoadingIndicator is a component that displays a loading animation
 * with journey-specific styling and customizable size.
 *
 * @example
 * // Basic usage
 * <LoadingIndicator />
 *
 * @example
 * // With journey-specific styling
 * <LoadingIndicator journey="health" />
 *
 * @example
 * // With custom size and label
 * <LoadingIndicator size="lg" label="Loading..." />
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  journey,
  size = 'md',
  label,
  testID,
}) => {
  // Convert predefined sizes to pixel values
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '56px',
  };

  // Get the actual size value (either from the map or use the provided value)
  const actualSize = sizeMap[size as keyof typeof sizeMap] || size;

  // Map journey to journey-specific color
  const journeyMapping = {
    health: 'HEALTH',
    care: 'CARE',
    plan: 'PLAN',
  };

  // Get the spinner color based on journey
  const spinnerColor = journey 
    ? JOURNEY_COLORS[journeyMapping[journey] as keyof typeof JOURNEY_COLORS].primary 
    : colors.brand.primary;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="sm"
      data-testid={testID}
      aria-live="polite"
      aria-busy="true"
      role="status"
      aria-label={label || 'Loading'}
    >
      <Spinner 
        color={spinnerColor}
        size={actualSize}
        aria-hidden="true"
        data-testid={testID ? `${testID}-spinner` : 'loading-spinner'}
      />

      {label && (
        <Text
          fontSize="sm"
          color={journey ? `journeys.${journey}.primary` : 'brand.primary'}
          marginTop="xs"
          aria-hidden="true"
        >
          {label}
        </Text>
      )}
    </Box>
  );
};

export default LoadingIndicator;