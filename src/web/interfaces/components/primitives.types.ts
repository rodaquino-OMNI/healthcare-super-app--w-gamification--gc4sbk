/**
 * @file primitives.types.ts
 * @description TypeScript interfaces for primitive UI components in the AUSTA SuperApp design system.
 * These interfaces establish the contract for component props across both web and mobile platforms,
 * ensuring consistent component usage and type safety.
 */

import { ReactNode, CSSProperties } from 'react';
import type { TextStyle, ViewStyle, ImageStyle, GestureResponderEvent, StyleProp } from 'react-native';

/**
 * Common properties shared across all primitive components
 */
export interface CommonProps {
  /** Unique identifier for the component */
  id?: string;
  /** Additional CSS class names (web only) */
  className?: string;
  /** Test ID for component testing */
  testID?: string;
  /** Whether the component is visible */
  visible?: boolean;
  /** 
   * Custom style object that can be a single style object, an array of styles,
   * or conditional styles (using undefined or null)
   */
  style?: StyleProp<ViewStyle | TextStyle | ImageStyle> | CSSProperties;
}

/**
 * Accessibility properties shared across all primitive components
 */
export interface AccessibilityProps {
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  /** Accessibility role for screen readers */
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'text' | 'header' | 'summary' | 'adjustable';
  /** Whether the component is currently selected for accessibility */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  /** Whether the component is important for accessibility */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  /** ARIA properties for web accessibility */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
}

/**
 * Box component props interface
 * 
 * Box is a fundamental layout component that provides comprehensive layout capabilities
 * including flex, grid, spacing, sizing, and positioning.
 * 
 * @example
 * // Basic usage
 * <Box padding={16} backgroundColor="white" borderRadius={8}>
 *   <Text>Content inside a box</Text>
 * </Box>
 * 
 * @example
 * // Flex layout
 * <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </Box>
 */
export interface BoxProps extends CommonProps, AccessibilityProps {
  /** Child elements to render inside the Box */
  children?: ReactNode;
  /** Background color of the Box */
  backgroundColor?: string;
  /** Border radius of the Box */
  borderRadius?: number | string;
  /** Border width of the Box */
  borderWidth?: number | string;
  /** Border color of the Box */
  borderColor?: string;
  /** Padding for all sides */
  padding?: number | string;
  /** Padding for top side */
  paddingTop?: number | string;
  /** Padding for right side */
  paddingRight?: number | string;
  /** Padding for bottom side */
  paddingBottom?: number | string;
  /** Padding for left side */
  paddingLeft?: number | string;
  /** Horizontal padding (left and right) */
  paddingHorizontal?: number | string;
  /** Vertical padding (top and bottom) */
  paddingVertical?: number | string;
  /** Margin for all sides */
  margin?: number | string;
  /** Margin for top side */
  marginTop?: number | string;
  /** Margin for right side */
  marginRight?: number | string;
  /** Margin for bottom side */
  marginBottom?: number | string;
  /** Margin for left side */
  marginLeft?: number | string;
  /** Horizontal margin (left and right) */
  marginHorizontal?: number | string;
  /** Vertical margin (top and bottom) */
  marginVertical?: number | string;
  /** Width of the Box */
  width?: number | string;
  /** Height of the Box */
  height?: number | string;
  /** Minimum width of the Box */
  minWidth?: number | string;
  /** Minimum height of the Box */
  minHeight?: number | string;
  /** Maximum width of the Box */
  maxWidth?: number | string;
  /** Maximum height of the Box */
  maxHeight?: number | string;
  /** Flex value for the Box */
  flex?: number;
  /** Flex direction for the Box */
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Flex wrap for the Box */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /** Justify content for the Box */
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  /** Align items for the Box */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  /** Align self for the Box */
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  /** Position of the Box */
  position?: 'absolute' | 'relative' | 'fixed' | 'static' | 'sticky';
  /** Top position value */
  top?: number | string;
  /** Right position value */
  right?: number | string;
  /** Bottom position value */
  bottom?: number | string;
  /** Left position value */
  left?: number | string;
  /** Z-index for the Box */
  zIndex?: number;
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  /** Opacity value (0-1) */
  opacity?: number;
  /** Shadow elevation (primarily for mobile) */
  elevation?: number;
  /** Whether the Box should be rendered as a div (web) or View (mobile) */
  asDiv?: boolean;
  /** Event handler for press/click */
  onPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Event handler for long press */
  onLongPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Whether the Box should have hover effects (web only) */
  withHoverEffects?: boolean;
  /** Whether the Box should have focus effects (web only) */
  withFocusEffects?: boolean;
  /** Whether the Box should have active effects (web only) */
  withActiveEffects?: boolean;
}

/**
 * Text component props interface
 * 
 * Text is a component for displaying text with support for all text styles,
 * colors, and truncation.
 * 
 * @example
 * // Basic usage
 * <Text color="black" fontSize={16}>Hello World</Text>
 * 
 * @example
 * // With styling variants
 * <Text variant="h1" color="primary">Heading</Text>
 * 
 * @example
 * // With truncation
 * <Text numberOfLines={2} ellipsis>This is a long text that will be truncated after two lines...</Text>
 */
export interface TextProps extends CommonProps, AccessibilityProps {
  /** Text content to display */
  children?: ReactNode;
  /** Text color */
  color?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  /** Text alignment */
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /** Line height */
  lineHeight?: number | string;
  /** Letter spacing */
  letterSpacing?: number | string;
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through';
  /** Text transform */
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  /** Whether text should be italic */
  italic?: boolean;
  /** Number of lines before truncating with ellipsis */
  numberOfLines?: number;
  /** Whether text should be selectable */
  selectable?: boolean;
  /** Variant of text based on design system typography */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline';
  /** Whether to apply ellipsis when text overflows */
  ellipsis?: boolean;
  /** Event handler for press/click */
  onPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Padding for all sides */
  padding?: number | string;
  /** Margin for all sides */
  margin?: number | string;
}

/**
 * Stack component props interface
 * 
 * Stack is a layout component that implements flex container with responsive
 * spacing and gap support. It simplifies the creation of common flex layouts
 * with proper spacing between items.
 * 
 * @example
 * // Vertical stack (default)
 * <Stack spacing={16}>
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 *   <Text>Item 3</Text>
 * </Stack>
 * 
 * @example
 * // Horizontal stack with centered items
 * <Stack direction="horizontal" spacing={8} centered>
 *   <Icon name="star" />
 *   <Text>Starred</Text>
 * </Stack>
 */
export interface StackProps extends Omit<BoxProps, 'asDiv'> {
  /** Direction of the stack */
  direction?: 'horizontal' | 'vertical';
  /** Spacing between stack items */
  spacing?: number | string;
  /** Whether items should be centered */
  centered?: boolean;
  /** Whether the stack should fill its container */
  fill?: boolean;
  /** Whether items should wrap to the next line */
  wrap?: boolean;
  /** Divider element to render between stack items */
  divider?: ReactNode;
  /** Whether to reverse the order of items */
  reverse?: boolean;
  /** Gap between items (modern alternative to spacing) */
  gap?: number | string;
  /** Row gap for when items wrap */
  rowGap?: number | string;
  /** Column gap for when items wrap */
  columnGap?: number | string;
}

/**
 * Icon component props interface
 * 
 * Icon manages SVG icon rendering with dynamic fills and accessibility.
 * It provides a consistent way to display icons across the application
 * with support for different sizes, colors, and transformations.
 * 
 * @example
 * // Basic usage
 * <Icon name="heart" size={24} color="red" />
 * 
 * @example
 * // With background and rotation
 * <Icon 
 *   name="arrow-right" 
 *   size={16} 
 *   rotation={90} 
 *   withBackground 
 *   backgroundColor="lightblue" 
 *   borderRadius={4}
 * />
 * 
 * @example
 * // With badge
 * <Icon name="notification" withBadge badgeContent={5} badgeColor="red" />
 */
export interface IconProps extends CommonProps, AccessibilityProps {
  /** Name of the icon from the icon library */
  name: string;
  /** Size of the icon */
  size?: number | string;
  /** Color of the icon */
  color?: string;
  /** Whether the icon should be flipped horizontally */
  flipHorizontal?: boolean;
  /** Whether the icon should be flipped vertically */
  flipVertical?: boolean;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Event handler for press/click */
  onPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Whether the icon should have a background */
  withBackground?: boolean;
  /** Background color when withBackground is true */
  backgroundColor?: string;
  /** Border radius when withBackground is true */
  borderRadius?: number | string;
  /** Padding when withBackground is true */
  padding?: number | string;
  /** Whether the icon should be rendered as an SVG (web) or from an icon font (mobile) */
  asSvg?: boolean;
  /** Whether the icon should have a badge */
  withBadge?: boolean;
  /** Badge content when withBadge is true */
  badgeContent?: string | number;
  /** Badge color when withBadge is true */
  badgeColor?: string;
}

/**
 * Touchable component props interface
 * 
 * Touchable creates cross-platform pressable elements with consistent
 * interaction states. It provides a unified way to handle touch/click
 * interactions across web and mobile platforms with appropriate feedback.
 * 
 * @example
 * // Basic usage
 * <Touchable onPress={() => console.log('Pressed')}>
 *   <Text>Press me</Text>
 * </Touchable>
 * 
 * @example
 * // With feedback effects
 * <Touchable 
 *   onPress={handlePress} 
 *   withFeedback 
 *   activeOpacity={0.7}
 *   underlayColor="lightgray"
 * >
 *   <Text>Press with feedback</Text>
 * </Touchable>
 * 
 * @example
 * // Disabled state
 * <Touchable onPress={handlePress} disabled>
 *   <Text>Cannot press</Text>
 * </Touchable>
 */
export interface TouchableProps extends CommonProps, AccessibilityProps {
  /** Child elements to render inside the Touchable */
  children?: ReactNode;
  /** Event handler for press/click */
  onPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Event handler for long press */
  onLongPress?: (event: GestureResponderEvent | React.MouseEvent) => void;
  /** Whether the touchable is disabled */
  disabled?: boolean;
  /** Delay in ms after which onLongPress is called */
  delayLongPress?: number;
  /** Opacity when pressed (0-1) */
  activeOpacity?: number;
  /** Background color when pressed */
  underlayColor?: string;
  /** Whether to highlight when pressed */
  withHighlight?: boolean;
  /** Whether to show ripple effect on Android */
  withRipple?: boolean;
  /** Color of the ripple effect on Android */
  rippleColor?: string;
  /** Border radius of the touchable */
  borderRadius?: number | string;
  /** Whether the touchable should have a feedback effect */
  withFeedback?: boolean;
  /** Whether the touchable should be rendered as a button (web) or TouchableOpacity/TouchableHighlight (mobile) */
  asButton?: boolean;
  /** Whether the touchable should be rendered with native feedback on Android */
  withNativeFeedback?: boolean;
  /** Whether the touchable should have hover effects (web only) */
  withHoverEffects?: boolean;
  /** Whether the touchable should have focus effects (web only) */
  withFocusEffects?: boolean;
  /** Whether the touchable should have active effects (web only) */
  withActiveEffects?: boolean;
  /** Hit slop to increase the touchable area beyond its bounds */
  hitSlop?: { top?: number; left?: number; bottom?: number; right?: number };
  /** Padding for all sides */
  padding?: number | string;
  /** Margin for all sides */
  margin?: number | string;
}