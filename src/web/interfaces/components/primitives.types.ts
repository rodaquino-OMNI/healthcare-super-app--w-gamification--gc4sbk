/**
 * Primitive Component Interfaces for the AUSTA SuperApp
 * 
 * This file defines TypeScript interfaces for the five foundational primitive components
 * in the AUSTA SuperApp design system: Box, Text, Stack, Icon, and Touchable.
 * 
 * These interfaces establish the contract for component props across both web and mobile platforms,
 * ensuring consistent component usage and type safety throughout the application.
 * 
 * @module primitives.types
 */

import { ReactNode, CSSProperties, HTMLAttributes, RefObject } from 'react';
import type { StyleProp, ViewStyle, TextStyle, GestureResponderEvent, TextProps as RNTextProps, ViewProps as RNViewProps } from 'react-native';
import { StyleProps, SpacingProps, LayoutProps, FlexboxProps, GridProps, PositionProps, BorderProps, ColorProps, TypographyProps, ShadowProps } from '../themes/style-props.types';

// -----------------------------------------------------------------------------
// Common Types and Base Interfaces
// -----------------------------------------------------------------------------

/**
 * Platform-specific style type that handles both web and React Native styles
 */
export type PlatformStyle = CSSProperties | StyleProp<ViewStyle | TextStyle>;

/**
 * Base props interface that all primitive components extend
 */
export interface BasePrimitiveProps {
  /** Optional ID for the component */
  id?: string;
  
  /** Optional test ID for testing */
  testID?: string;
  
  /** Optional class name for web styling */
  className?: string;
  
  /** Optional accessibility label for screen readers */
  accessibilityLabel?: string;
  
  /** Optional accessibility hint providing additional context */
  accessibilityHint?: string;
  
  /** Optional accessibility role defining the component's purpose */
  accessibilityRole?: string;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Optional ref object for the component */
  ref?: RefObject<any>;
}

/**
 * Common props for components that can have children
 */
export interface WithChildrenProps {
  /** Child elements */
  children?: ReactNode;
}

/**
 * Common props for components that can have platform-specific styles
 */
export interface StyledPrimitiveProps {
  /** Web-specific style object */
  style?: CSSProperties;
  
  /** React Native specific style object */
  rnStyle?: StyleProp<ViewStyle | TextStyle>;
}

/**
 * Common props for components that can have platform-specific event handlers
 */
export interface InteractivePrimitiveProps {
  /** Press handler for React Native */
  onPress?: (event: GestureResponderEvent) => void;
  
  /** Long press handler for React Native */
  onLongPress?: (event: GestureResponderEvent) => void;
  
  /** Press in handler for React Native */
  onPressIn?: (event: GestureResponderEvent) => void;
  
  /** Press out handler for React Native */
  onPressOut?: (event: GestureResponderEvent) => void;
  
  /** Click handler for web */
  onClick?: (event: React.MouseEvent) => void;
  
  /** Mouse down handler for web */
  onMouseDown?: (event: React.MouseEvent) => void;
  
  /** Mouse up handler for web */
  onMouseUp?: (event: React.MouseEvent) => void;
  
  /** Mouse enter handler for web */
  onMouseEnter?: (event: React.MouseEvent) => void;
  
  /** Mouse leave handler for web */
  onMouseLeave?: (event: React.MouseEvent) => void;
  
  /** Focus handler */
  onFocus?: (event: any) => void;
  
  /** Blur handler */
  onBlur?: (event: any) => void;
}

// -----------------------------------------------------------------------------
// Box Component Interface
// -----------------------------------------------------------------------------

/**
 * Box Component Props Interface
 * 
 * Box is the most fundamental layout component in the design system.
 * It provides comprehensive layout capabilities including flex, grid, spacing,
 * sizing, and positioning. It serves as a container for other components and
 * can be styled with all available style props.
 */
export interface BoxProps extends 
  BasePrimitiveProps, 
  WithChildrenProps, 
  StyledPrimitiveProps,
  SpacingProps,
  LayoutProps,
  FlexboxProps,
  GridProps,
  PositionProps,
  BorderProps,
  ColorProps,
  ShadowProps {
  
  /** HTML element to render for web (default: 'div') */
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  
  /** Whether the box should be rendered as a fragment (no DOM element) */
  fragment?: boolean;
  
  /** Whether the box should be rendered with position: relative */
  relative?: boolean;
  
  /** Whether the box should be rendered with position: absolute */
  absolute?: boolean;
  
  /** Whether the box should be rendered with position: fixed */
  fixed?: boolean;
  
  /** Whether the box should be rendered with position: sticky */
  sticky?: boolean;
  
  /** Whether the box should be rendered with display: flex */
  flex?: boolean | number | string;
  
  /** Whether the box should be rendered with display: grid */
  grid?: boolean;
  
  /** Whether the box should be rendered with display: inline */
  inline?: boolean;
  
  /** Whether the box should be rendered with display: block */
  block?: boolean;
  
  /** Whether the box should be rendered with display: inline-block */
  inlineBlock?: boolean;
  
  /** Whether the box should be rendered with display: none */
  hidden?: boolean;
  
  /** Whether the box should be rendered with visibility: hidden */
  invisible?: boolean;
  
  /** Whether the box should be rendered with overflow: hidden */
  hideOverflow?: boolean;
  
  /** Whether the box should be rendered with overflow: visible */
  showOverflow?: boolean;
  
  /** Whether the box should be rendered with overflow: scroll */
  scroll?: boolean;
  
  /** Whether the box should be rendered with overflow-x: scroll */
  scrollX?: boolean;
  
  /** Whether the box should be rendered with overflow-y: scroll */
  scrollY?: boolean;
  
  /** Whether the box should be rendered with border-radius to make it circular */
  circle?: boolean;
  
  /** Whether the box should be rendered with border-radius to make it rounded */
  rounded?: boolean | string | number;
  
  /** Whether the box should take full width of its container */
  fullWidth?: boolean;
  
  /** Whether the box should take full height of its container */
  fullHeight?: boolean;
  
  /** Whether the box should center its children with flexbox */
  center?: boolean;
  
  /** Additional HTML attributes for web */
  htmlProps?: HTMLAttributes<HTMLElement>;
  
  /** Additional React Native View props */
  rnProps?: RNViewProps;
  
  /** Whether the box should have a shadow */
  elevation?: 0 | 1 | 2 | 3 | 4;
  
  /** Whether the box should have a border */
  bordered?: boolean;
  
  /** Whether the box should have padding */
  padded?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the box should have margin */
  margin?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the box should have a background color */
  bg?: string;
  
  /** Whether the box should have a hover effect */
  hoverable?: boolean;
  
  /** Whether the box should have a focus effect */
  focusable?: boolean;
  
  /** Whether the box should have an active effect */
  activable?: boolean;
  
  /** Whether the box should have a disabled effect */
  disableable?: boolean;
}

// -----------------------------------------------------------------------------
// Text Component Interface
// -----------------------------------------------------------------------------

/**
 * Text Component Props Interface
 * 
 * Text is the primary component for displaying text content.
 * It handles typography with support for all text styles, colors, and truncation.
 * It provides consistent text rendering across platforms with proper styling options.
 */
export interface TextProps extends 
  BasePrimitiveProps, 
  WithChildrenProps, 
  StyledPrimitiveProps,
  TypographyProps,
  ColorProps,
  SpacingProps {
  
  /** HTML element to render for web (default: 'span') */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'div' | React.ComponentType<any>;
  
  /** Text content as a string (alternative to children) */
  content?: string;
  
  /** Whether the text should be bold */
  bold?: boolean;
  
  /** Whether the text should be italic */
  italic?: boolean;
  
  /** Whether the text should be underlined */
  underline?: boolean;
  
  /** Whether the text should have a line-through */
  strikethrough?: boolean;
  
  /** Whether the text should be uppercase */
  uppercase?: boolean;
  
  /** Whether the text should be lowercase */
  lowercase?: boolean;
  
  /** Whether the text should be capitalized */
  capitalize?: boolean;
  
  /** Whether the text should be truncated with ellipsis */
  truncate?: boolean;
  
  /** Number of lines to show before truncating with ellipsis */
  numberOfLines?: number;
  
  /** Whether the text should be selectable */
  selectable?: boolean;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';
  
  /** Text variant based on the typography scale */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline';
  
  /** Text size based on the typography scale */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  
  /** Text weight based on the typography scale */
  weight?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  
  /** Whether the text should be rendered with a specific color */
  color?: string;
  
  /** Whether the text should be rendered with a specific background color */
  backgroundColor?: string;
  
  /** Additional HTML attributes for web */
  htmlProps?: HTMLAttributes<HTMLElement>;
  
  /** Additional React Native Text props */
  rnProps?: RNTextProps;
  
  /** Whether the text should have a hover effect */
  hoverable?: boolean;
  
  /** Whether the text should have a focus effect */
  focusable?: boolean;
  
  /** Whether the text should have an active effect */
  activable?: boolean;
  
  /** Whether the text should have a disabled effect */
  disableable?: boolean;
  
  /** Whether the text should be rendered as a link */
  link?: boolean;
  
  /** URL for the link (when link is true) */
  href?: string;
  
  /** Target for the link (when link is true) */
  target?: '_blank' | '_self' | '_parent' | '_top';
  
  /** Whether the text should be rendered with an ellipsis when truncated */
  ellipsis?: boolean;
  
  /** Whether the text should preserve whitespace */
  preserveWhitespace?: boolean;
  
  /** Whether the text should wrap */
  wrap?: boolean;
  
  /** Whether the text should not wrap */
  nowrap?: boolean;
  
  /** Whether the text should break words */
  breakWord?: boolean;
  
  /** Whether the text should break all characters */
  breakAll?: boolean;
  
  /** Whether the text should keep all characters */
  keepAll?: boolean;
}

// -----------------------------------------------------------------------------
// Stack Component Interface
// -----------------------------------------------------------------------------

/**
 * Stack Component Props Interface
 * 
 * Stack is a layout component that implements a flex container with responsive spacing and gap support.
 * It simplifies the creation of common flex layouts with proper spacing between items.
 */
export interface StackProps extends 
  BasePrimitiveProps, 
  WithChildrenProps, 
  StyledPrimitiveProps,
  SpacingProps,
  LayoutProps,
  FlexboxProps,
  BorderProps,
  ColorProps,
  ShadowProps {
  
  /** Direction of the stack */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  
  /** Spacing between items */
  spacing?: number | string | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether items should wrap */
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  
  /** Alignment of items along the cross axis */
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  
  /** Alignment of items along the main axis */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  
  /** Whether the stack should take full width of its container */
  fullWidth?: boolean;
  
  /** Whether the stack should take full height of its container */
  fullHeight?: boolean;
  
  /** Whether the stack should center its children */
  center?: boolean;
  
  /** Whether the stack should have a divider between items */
  divider?: boolean | ReactNode;
  
  /** Whether the stack should reverse the order of its children */
  reverse?: boolean;
  
  /** Whether the stack should have a gap between items */
  gap?: number | string | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the stack should have a row gap between items */
  rowGap?: number | string | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the stack should have a column gap between items */
  columnGap?: number | string | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** HTML element to render for web (default: 'div') */
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  
  /** Additional HTML attributes for web */
  htmlProps?: HTMLAttributes<HTMLElement>;
  
  /** Additional React Native View props */
  rnProps?: RNViewProps;
  
  /** Whether the stack should have a shadow */
  elevation?: 0 | 1 | 2 | 3 | 4;
  
  /** Whether the stack should have a border */
  bordered?: boolean;
  
  /** Whether the stack should have padding */
  padded?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the stack should have a background color */
  bg?: string;
  
  /** Whether the stack should be rendered with border-radius to make it rounded */
  rounded?: boolean | string | number;
}

// -----------------------------------------------------------------------------
// Icon Component Interface
// -----------------------------------------------------------------------------

/**
 * Icon Component Props Interface
 * 
 * Icon is a component for rendering SVG icons with dynamic fills and accessibility support.
 * It provides consistent icon rendering across platforms with proper sizing and coloring options.
 */
export interface IconProps extends 
  BasePrimitiveProps, 
  StyledPrimitiveProps,
  ColorProps,
  SpacingProps,
  LayoutProps {
  
  /** Name of the icon */
  name: string;
  
  /** Size of the icon */
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Color of the icon */
  color?: string;
  
  /** Whether the icon should be rendered with a specific fill color */
  fill?: string;
  
  /** Whether the icon should be rendered with a specific stroke color */
  stroke?: string;
  
  /** Stroke width of the icon */
  strokeWidth?: number;
  
  /** Whether the icon should be flipped horizontally */
  flipHorizontal?: boolean;
  
  /** Whether the icon should be flipped vertically */
  flipVertical?: boolean;
  
  /** Rotation angle of the icon in degrees */
  rotate?: number;
  
  /** Whether the icon should be rendered as a button */
  button?: boolean;
  
  /** Whether the icon should have a hover effect */
  hoverable?: boolean;
  
  /** Whether the icon should have a focus effect */
  focusable?: boolean;
  
  /** Whether the icon should have an active effect */
  activable?: boolean;
  
  /** Whether the icon should have a disabled effect */
  disableable?: boolean;
  
  /** Press handler for React Native */
  onPress?: (event: GestureResponderEvent) => void;
  
  /** Click handler for web */
  onClick?: (event: React.MouseEvent) => void;
  
  /** Additional HTML attributes for web */
  htmlProps?: HTMLAttributes<HTMLElement>;
  
  /** Additional React Native View props */
  rnProps?: RNViewProps;
  
  /** Whether the icon should be rendered with a background */
  withBackground?: boolean;
  
  /** Background color of the icon */
  backgroundColor?: string;
  
  /** Whether the icon should be rendered with a border */
  withBorder?: boolean;
  
  /** Border color of the icon */
  borderColor?: string;
  
  /** Whether the icon should be rendered with a shadow */
  withShadow?: boolean;
  
  /** Whether the icon should be rendered with a badge */
  withBadge?: boolean;
  
  /** Badge content */
  badgeContent?: string | number;
  
  /** Badge color */
  badgeColor?: string;
  
  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /** Whether the icon should be rendered with a tooltip */
  withTooltip?: boolean;
  
  /** Tooltip content */
  tooltipContent?: string;
  
  /** Tooltip position */
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
}

// -----------------------------------------------------------------------------
// Touchable Component Interface
// -----------------------------------------------------------------------------

/**
 * Touchable Component Props Interface
 * 
 * Touchable is a component for creating cross-platform pressable elements with consistent interaction states.
 * It provides a unified API for handling touch and click events across platforms.
 */
export interface TouchableProps extends 
  BasePrimitiveProps, 
  WithChildrenProps, 
  StyledPrimitiveProps,
  InteractivePrimitiveProps,
  SpacingProps,
  LayoutProps,
  BorderProps,
  ColorProps {
  
  /** HTML element to render for web (default: 'button') */
  as?: 'button' | 'a' | 'div' | 'span' | React.ComponentType<any>;
  
  /** Whether the touchable is disabled */
  disabled?: boolean;
  
  /** Whether the touchable should have a loading state */
  loading?: boolean;
  
  /** Custom loading indicator */
  loadingIndicator?: ReactNode;
  
  /** Whether the touchable should have a hover effect */
  withHoverEffect?: boolean;
  
  /** Whether the touchable should have a focus effect */
  withFocusEffect?: boolean;
  
  /** Whether the touchable should have an active effect */
  withActiveEffect?: boolean;
  
  /** Whether the touchable should have a ripple effect (Android) */
  withRipple?: boolean;
  
  /** Color of the ripple effect */
  rippleColor?: string;
  
  /** Whether the touchable should have a highlight effect (iOS) */
  withHighlight?: boolean;
  
  /** Color of the highlight effect */
  highlightColor?: string;
  
  /** Delay in milliseconds for long press */
  delayLongPress?: number;
  
  /** Delay in milliseconds for press in */
  delayPressIn?: number;
  
  /** Delay in milliseconds for press out */
  delayPressOut?: number;
  
  /** Whether the touchable should be rendered with a border-radius to make it rounded */
  rounded?: boolean | string | number;
  
  /** Whether the touchable should take full width of its container */
  fullWidth?: boolean;
  
  /** Whether the touchable should center its children */
  center?: boolean;
  
  /** Whether the touchable should have a shadow */
  elevation?: 0 | 1 | 2 | 3 | 4;
  
  /** Whether the touchable should have a border */
  bordered?: boolean;
  
  /** Whether the touchable should have padding */
  padded?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the touchable should have a background color */
  bg?: string;
  
  /** URL for the link (when as is 'a') */
  href?: string;
  
  /** Target for the link (when as is 'a') */
  target?: '_blank' | '_self' | '_parent' | '_top';
  
  /** Additional HTML attributes for web */
  htmlProps?: HTMLAttributes<HTMLElement>;
  
  /** Additional React Native View props */
  rnProps?: RNViewProps;
  
  /** Whether the touchable should have a feedback effect when pressed */
  withFeedback?: boolean;
  
  /** Type of feedback effect */
  feedbackType?: 'opacity' | 'highlight' | 'ripple' | 'scale' | 'color';
  
  /** Whether the touchable should be rendered with a tooltip */
  withTooltip?: boolean;
  
  /** Tooltip content */
  tooltipContent?: string;
  
  /** Tooltip position */
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  /** Whether the touchable should be rendered with a badge */
  withBadge?: boolean;
  
  /** Badge content */
  badgeContent?: string | number;
  
  /** Badge color */
  badgeColor?: string;
  
  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}