import React, { forwardRef } from 'react';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';
import { StyledTouchableOpacity } from './Touchable.styles';
import { colors } from '../../../tokens';
import { JourneyType } from '@austa/interfaces/themes/tokens.types';

/**
 * Props interface for the Touchable component
 */
export interface TouchableProps {
  /**
   * Function called when the component is pressed
   */
  onPress?: (event: GestureResponderEvent) => void;
  
  /**
   * Function called when the component is long pressed
   */
  onLongPress?: (event: GestureResponderEvent) => void;
  
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * The opacity value when the component is pressed (0 to 1)
   * @default 0.2
   */
  activeOpacity?: number;
  
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
  
  /**
   * Accessibility hint provides additional context for screen readers
   */
  accessibilityHint?: string;
  
  /**
   * Accessibility role defines the type of interactive element
   */
  accessibilityRole?: string;
  
  /**
   * Whether the component is accessible to screen readers
   * @default true
   */
  accessible?: boolean;
  
  /**
   * TestID for testing purposes
   */
  testID?: string;
  
  /**
   * Journey identifier for journey-specific styling (health, care, plan)
   */
  journey?: JourneyType;
  
  /**
   * Child elements to render inside the touchable
   */
  children?: React.ReactNode;
  
  /**
   * Additional styles to apply to the component
   */
  style?: object;
  
  /**
   * Whether the touchable should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * ARIA attributes for web accessibility
   */
  'aria-label'?: string;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-pressed'?: boolean;
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
}

/**
 * Generates appropriate accessibility props based on component props
 * @param props The component props
 * @returns Accessibility props object with role, label, and state
 */
const getAccessibilityProps = (props: TouchableProps) => {
  const {
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'button',
    accessible = true,
    disabled,
    'aria-label': ariaLabel,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    'aria-haspopup': ariaHasPopup,
  } = props;

  // Use aria-label if provided, otherwise fall back to accessibilityLabel
  const finalAccessibilityLabel = ariaLabel || accessibilityLabel;

  return {
    accessible,
    accessibilityRole,
    accessibilityLabel: finalAccessibilityLabel,
    accessibilityHint,
    accessibilityState: {
      disabled: ariaDisabled !== undefined ? ariaDisabled : !!disabled,
      expanded: ariaExpanded,
      selected: ariaPressed,
    },
    accessibilityValue: {
      // Add any accessibility values if needed
    },
    // Additional web-specific ARIA attributes
    'aria-controls': ariaControls,
    'aria-haspopup': ariaHasPopup,
  };
};

/**
 * A cross-platform touchable component that provides consistent interaction behavior
 * with support for journey-specific styling and accessibility.
 * 
 * This primitive component serves as a foundation for all touchable elements in the AUSTA
 * SuperApp, ensuring consistent behavior across platforms with appropriate feedback
 * mechanisms and accessibility support.
 * 
 * @example Basic usage
 * ```tsx
 * import { Touchable } from '@design-system/primitives';
 * 
 * <Touchable onPress={() => console.log('Pressed')}>
 *   <Text>Press me</Text>
 * </Touchable>
 * ```
 * 
 * @example With journey-specific styling
 * ```tsx
 * <Touchable 
 *   journey="health"
 *   onPress={() => console.log('Health journey button pressed')}
 *   accessibilityLabel="Health action button"
 * >
 *   <Text>Health Action</Text>
 * </Touchable>
 * ```
 * 
 * @example With accessibility
 * ```tsx
 * <Touchable
 *   onPress={() => setExpanded(!expanded)}
 *   accessibilityLabel="Expand section"
 *   accessibilityHint="Shows additional information"
 *   aria-expanded={expanded}
 *   aria-controls="expandable-content-id"
 * >
 *   <Text>Toggle</Text>
 * </Touchable>
 * ```
 */
export const Touchable = forwardRef<TouchableOpacity, TouchableProps>((props, ref) => {
  const {
    onPress,
    onLongPress,
    disabled = false,
    activeOpacity = 0.2,
    testID,
    journey,
    children,
    style,
    fullWidth = false,
    ...rest
  } = props;

  // Get accessibility props
  const accessibilityProps = getAccessibilityProps(props);

  // Determine journey-specific styles if journey is specified
  const journeyStyle = journey 
    ? { 
        borderColor: colors.journeys[journey].primary,
        // Focus outline color based on journey
        outlineColor: colors.journeys[journey].accent,
      } 
    : {};

  return (
    <StyledTouchableOpacity
      ref={ref}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      testID={testID}
      fullWidth={fullWidth}
      journey={journey}
      style={[journeyStyle, style]}
      {...accessibilityProps}
      {...rest}
    >
      {children}
    </StyledTouchableOpacity>
  );
});

// Display name for debugging
Touchable.displayName = 'Touchable';