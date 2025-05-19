import React from 'react';
import { Box } from '@design-system/primitives';
import { CardProps } from '@austa/interfaces/components';

/**
 * A versatile card component that serves as a container for content with consistent 
 * styling and theming support. The Card component is built on top of the Box primitive
 * and supports journey-specific theming, interactive states, and various layout options.
 * 
 * @example
 * // Basic usage
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 * 
 * @example
 * // With journey-specific theming
 * <Card journey="health" elevation="md">
 *   <Text>Health Journey Card</Text>
 * </Card>
 * 
 * @example
 * // Interactive card with click handler
 * <Card onPress={() => console.log('Card clicked')} elevation="lg">
 *   <Text>Click me</Text>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  elevation = 'sm',
  journey,
  interactive = false,
  backgroundColor,
  borderColor,
  borderRadius = 'md',
  padding = 'md',
  margin,
  width,
  height,
  accessibilityLabel,
  testID,
  className,
  ...rest
}) => {
  // Determine if card should be interactive based on props
  const isInteractive = interactive || !!onPress;
  
  // Style object to override Box defaults when needed
  const style = {
    cursor: isInteractive ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    ...(rest.style || {})
  };
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      boxShadow={elevation}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      padding={padding}
      margin={margin}
      width={width}
      height={height}
      onClick={onPress}
      role={onPress ? 'button' : undefined}
      aria-label={accessibilityLabel}
      journey={journey}
      // Apply journey-specific left border if journey is provided
      borderLeft={journey ? `4px solid` : undefined}
      borderLeftColor={journey ? `journeys.${journey}.primary` : undefined}
      // Apply border color if specified
      borderColor={borderColor || 'neutral.gray200'}
      style={style}
      testID={testID}
      className={className}
      {...rest}
    >
      {children}
    </Box>
  );
};