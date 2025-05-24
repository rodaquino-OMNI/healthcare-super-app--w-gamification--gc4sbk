import React from 'react';
import styled from 'styled-components';
import { ActivityIndicator } from 'react-native';
import { Box, Text, Stack, Icon, Touchable } from '@design-system/primitives/src/components';
import { useJourneyContext } from '@austa/journey-context/src/hooks';
import { ButtonProps } from '@austa/interfaces/components';

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
      case 'sm': return `${props.theme.spacing.xs} ${props.theme.spacing.sm}`;
      case 'lg': return `${props.theme.spacing.md} ${props.theme.spacing.lg}`;
      default: return `${props.theme.spacing.sm} ${props.theme.spacing.md}`;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.md};
  box-shadow: ${props => props.theme.shadows.md};
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  
  background-color: ${props => {
    const journeyColors = props.theme.colors.journeys[props.journey];
    switch (props.variant) {
      case 'secondary':
        return props.theme.colors.neutral.white;
      case 'tertiary':
        return 'transparent';
      default:
        return journeyColors.primary;
    }
  }};
  
  color: ${props => {
    const journeyColors = props.theme.colors.journeys[props.journey];
    switch (props.variant) {
      case 'secondary':
        return journeyColors.primary;
      case 'tertiary':
        return journeyColors.primary;
      default:
        return props.theme.colors.neutral.white;
    }
  }};
  
  border: ${props => props.variant === 'secondary' ? 
    `1px solid ${props.theme.colors.journeys[props.journey].primary}` : 
    'none'};
  
  &:hover {
    ${props => !props.disabled && `box-shadow: ${props.theme.shadows.lg}`}
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.journeys[props.journey].primary};
    outline-offset: 2px;
  }
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
}) => {
  // Use journey context with fallback to prop
  const { currentJourney } = useJourneyContext();
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
  
  // Calculate text color for loading indicator and content
  const getTextColor = (theme) => {
    if (variant === 'primary') {
      return theme.colors.neutral.white;
    }
    return theme.colors.journeys[journey].primary;
  };
  
  // Generate accessibility props
  const getAccessibilityProps = () => {
    const baseProps = {
      accessibilityRole: "button",
      accessibilityState: { disabled: disabled || loading },
      accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children.toString() : undefined),
    };
    
    if (loading) {
      return {
        ...baseProps,
        accessibilityState: { ...baseProps.accessibilityState, busy: true },
        accessibilityLiveRegion: "polite" as "polite",
      };
    }
    
    return baseProps;
  };
  
  return (
    <StyledButton
      variant={variant}
      size={size}
      journey={journey}
      disabled={disabled || loading}
      onPress={onPress}
      testID="button"
      {...getAccessibilityProps()}
    >
      {loading ? (
        <Stack direction="row" align="center" justify="center">
          <ActivityIndicator
            size={size === 'sm' ? 'small' : 'small'}
            color={theme => getTextColor(theme)}
            accessibilityLabel="Loading"
          />
        </Stack>
      ) : (
        <Stack direction="row" align="center" justify="center" spacing="sm">
          {icon && (
            <Icon
              name={icon}
              size={getIconSize()}
              color="currentColor"
              accessibilityRole="presentation"
            />
          )}
          {hasContent && (
            <Text
              fontWeight="medium"
              fontSize={getFontSize()}
              color="inherit"
            >
              {children}
            </Text>
          )}
        </Stack>
      )}
    </StyledButton>
  );
};