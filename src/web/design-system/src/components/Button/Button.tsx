import React from 'react';
import styled from 'styled-components';
import { ActivityIndicator } from 'react-native';
import { Touchable } from '@design-system/primitives/src/components/Touchable';
import { Text } from '@design-system/primitives/src/components/Text';
import { Icon } from '@design-system/primitives/src/components/Icon';
import { colors } from '@design-system/primitives/src/tokens/colors';
import { typography } from '@design-system/primitives/src/tokens/typography';
import { spacing } from '@design-system/primitives/src/tokens/spacing';
import { shadows } from '@design-system/primitives/src/tokens/shadows';
import { ButtonProps } from '@austa/interfaces/components/core.types';
import { useJourney } from '@austa/journey-context/src/providers';

/**
 * Styled button component with journey-specific theming
 */
const StyledButton = styled(Touchable)<{
  variant?: string;
  size?: string;
  journey?: string;
  disabled?: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${props => {
    switch (props.size) {
      case 'sm': return `${spacing.xs} ${spacing.sm}`;
      case 'lg': return `${spacing.md} ${spacing.lg}`;
      default: return `${spacing.sm} ${spacing.md}`;
    }
  }};
  border-radius: ${props => props.theme.borderRadius?.md || '4px'};
  font-weight: ${typography.fontWeight.medium};
  font-size: ${typography.fontSize.md};
  box-shadow: ${shadows.md};
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  
  background-color: ${props => {
    const journeyColors = colors.journeys[props.journey];
    switch (props.variant) {
      case 'secondary':
        return colors.neutral.white;
      case 'tertiary':
        return 'transparent';
      default:
        return journeyColors.primary;
    }
  }};
  
  color: ${props => {
    const journeyColors = colors.journeys[props.journey];
    switch (props.variant) {
      case 'secondary':
        return journeyColors.primary;
      case 'tertiary':
        return journeyColors.primary;
      default:
        return colors.neutral.white;
    }
  }};
  
  border: ${props => props.variant === 'secondary' ? 
    `1px solid ${colors.journeys[props.journey].primary}` : 
    'none'};
  
  &:hover {
    ${props => !props.disabled && `box-shadow: ${shadows.lg}`}
  }
`;

/**
 * Spacer component for gap between icon and text
 */
const IconSpacing = styled.View`
  width: ${spacing.sm};
  height: 1px;
`;

/**
 * Button component for the AUSTA SuperApp design system.
 * Provides a consistent button experience across all journeys with
 * appropriate styling, states, and accessibility support.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onPress,
  accessibilityLabel,
  children,
  journey: journeyProp,
  testID = 'button',
  fullWidth = false,
  iconOnly = false,
}) => {
  // Use journey context if journey prop is not provided
  const { currentJourney } = useJourney();
  const journey = journeyProp || currentJourney || 'health';
  
  // Determine if there's content other than just an icon
  const hasContent = React.Children.count(children) > 0;
  
  // Determine icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return '16px';
      case 'lg': return '24px';
      default: return '20px';
    }
  };
  
  // Determine font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'md';
    }
  };
  
  // Calculate text color for loading indicator
  const getTextColor = () => {
    if (variant === 'primary') {
      return colors.neutral.white;
    }
    return colors.journeys[journey].primary;
  };
  
  // Determine appropriate ARIA role and state attributes
  const getAriaAttributes = () => {
    return {
      role: 'button',
      'aria-disabled': disabled || loading,
      'aria-busy': loading,
      'aria-label': accessibilityLabel || (typeof children === 'string' ? children.toString() : undefined),
    };
  };
  
  return (
    <StyledButton
      variant={variant}
      size={size}
      journey={journey}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children.toString() : undefined)}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      fullWidth={fullWidth}
      {...getAriaAttributes()}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'sm' ? 'small' : 'small'}
          color={getTextColor()}
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={getIconSize()}
              color="currentColor"
              aria-hidden={hasContent ? true : undefined}
              testID={`${testID}-icon`}
            />
          )}
          {icon && hasContent && !iconOnly && <IconSpacing />}
          {hasContent && !iconOnly && (
            <Text
              fontWeight="medium"
              fontSize={getFontSize()}
              color="inherit"
              testID={`${testID}-text`}
            >
              {children}
            </Text>
          )}
        </>
      )}
    </StyledButton>
  );
};