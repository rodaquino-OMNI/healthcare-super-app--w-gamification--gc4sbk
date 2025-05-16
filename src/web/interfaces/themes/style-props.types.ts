/**
 * Style Props Type Definitions
 * 
 * This file defines all style prop interfaces used for component styling in the AUSTA SuperApp.
 * These interfaces enable the theme-aware prop system that forms the foundation of the design system.
 * 
 * The interfaces are organized into categories:
 * - SpacingProps: margin, padding
 * - LayoutProps: width, height, position
 * - TypographyProps: fontSize, lineHeight, etc.
 * - ColorProps: color, backgroundColor, etc.
 * - BorderProps: borderWidth, borderRadius, etc.
 * - FlexProps: flex, flexDirection, etc.
 * - GridProps: gridTemplateColumns, gridGap, etc.
 * - PositionProps: position, top, right, etc.
 * - ShadowProps: boxShadow, textShadow
 * - TransitionProps: transition, animation
 * - PseudoProps: hover, focus, active states
 * - VariantProps: variant-based styling
 * 
 * Each prop can accept:
 * - Direct values (string, number)
 * - Theme values (references to theme tokens)
 * - Responsive values (different values at different breakpoints)
 */

import { Theme } from '../themes/theme.types';

/**
 * Responsive prop type that allows different values at different breakpoints
 */
export type ResponsiveProp<T> = 
  | T 
  | {
      base?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
    };

/**
 * Theme-aware prop type that can reference values from the theme
 */
export type ThemeAwareProp<T, K extends keyof Theme = never> = 
  | T 
  | keyof Theme[K];

/**
 * Spacing Props (margin, padding)
 */
export interface SpacingProps {
  m?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  mt?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  mr?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  mb?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  ml?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  mx?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  my?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  margin?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginTop?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginRight?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginBottom?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginLeft?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginX?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  marginY?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  p?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  pt?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  pr?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  pb?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  pl?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  px?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  py?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  padding?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingTop?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingRight?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingBottom?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingLeft?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingX?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  paddingY?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
}

/**
 * Layout Props (width, height, display)
 */
export interface LayoutProps {
  width?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  height?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  minWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  maxWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  minHeight?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  maxHeight?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  size?: ResponsiveProp<ThemeAwareProp<string | number, 'sizes'>>;
  display?: ResponsiveProp<'none' | 'flex' | 'block' | 'inline' | 'inline-block' | 'grid' | 'inline-flex'>;
  overflow?: ResponsiveProp<'visible' | 'hidden' | 'scroll' | 'auto'>;
  overflowX?: ResponsiveProp<'visible' | 'hidden' | 'scroll' | 'auto'>;
  overflowY?: ResponsiveProp<'visible' | 'hidden' | 'scroll' | 'auto'>;
  verticalAlign?: ResponsiveProp<'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom'>;
}

/**
 * Typography Props (fontSize, fontWeight, etc.)
 */
export interface TypographyProps {
  fontFamily?: ResponsiveProp<ThemeAwareProp<string, 'fonts'>>;
  fontSize?: ResponsiveProp<ThemeAwareProp<string | number, 'fontSizes'>>;
  fontWeight?: ResponsiveProp<ThemeAwareProp<string | number, 'fontWeights'>>;
  lineHeight?: ResponsiveProp<ThemeAwareProp<string | number, 'lineHeights'>>;
  letterSpacing?: ResponsiveProp<ThemeAwareProp<string | number, 'letterSpacings'>>;
  textAlign?: ResponsiveProp<'left' | 'right' | 'center' | 'justify'>;
  fontStyle?: ResponsiveProp<'normal' | 'italic'>;
  textTransform?: ResponsiveProp<'uppercase' | 'lowercase' | 'capitalize' | 'none'>;
  textDecoration?: ResponsiveProp<'none' | 'underline' | 'line-through'>;
  textOverflow?: ResponsiveProp<'clip' | 'ellipsis'>;
  whiteSpace?: ResponsiveProp<'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'>;
  wordBreak?: ResponsiveProp<'normal' | 'break-all' | 'keep-all' | 'break-word'>;
  wordWrap?: ResponsiveProp<'normal' | 'break-word'>;
}

/**
 * Color Props (color, backgroundColor, etc.)
 */
export interface ColorProps {
  color?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  backgroundColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  bg?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  opacity?: ResponsiveProp<number>;
  colorScheme?: ResponsiveProp<'health' | 'care' | 'plan'>;
}

/**
 * Border Props (borderWidth, borderRadius, etc.)
 */
export interface BorderProps {
  border?: ResponsiveProp<string>;
  borderWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'borderWidths'>>;
  borderStyle?: ResponsiveProp<'solid' | 'dashed' | 'dotted' | 'none'>;
  borderColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  borderRadius?: ResponsiveProp<ThemeAwareProp<string | number, 'radii'>>;
  borderTop?: ResponsiveProp<string>;
  borderRight?: ResponsiveProp<string>;
  borderBottom?: ResponsiveProp<string>;
  borderLeft?: ResponsiveProp<string>;
  borderTopWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'borderWidths'>>;
  borderRightWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'borderWidths'>>;
  borderBottomWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'borderWidths'>>;
  borderLeftWidth?: ResponsiveProp<ThemeAwareProp<string | number, 'borderWidths'>>;
  borderTopColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  borderRightColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  borderBottomColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  borderLeftColor?: ResponsiveProp<ThemeAwareProp<string, 'colors'>>;
  borderTopStyle?: ResponsiveProp<'solid' | 'dashed' | 'dotted' | 'none'>;
  borderRightStyle?: ResponsiveProp<'solid' | 'dashed' | 'dotted' | 'none'>;
  borderBottomStyle?: ResponsiveProp<'solid' | 'dashed' | 'dotted' | 'none'>;
  borderLeftStyle?: ResponsiveProp<'solid' | 'dashed' | 'dotted' | 'none'>;
  borderTopLeftRadius?: ResponsiveProp<ThemeAwareProp<string | number, 'radii'>>;
  borderTopRightRadius?: ResponsiveProp<ThemeAwareProp<string | number, 'radii'>>;
  borderBottomRightRadius?: ResponsiveProp<ThemeAwareProp<string | number, 'radii'>>;
  borderBottomLeftRadius?: ResponsiveProp<ThemeAwareProp<string | number, 'radii'>>;
}

/**
 * Flex Props (flex, flexDirection, etc.)
 */
export interface FlexProps {
  flex?: ResponsiveProp<number | string>;
  flexGrow?: ResponsiveProp<number>;
  flexShrink?: ResponsiveProp<number>;
  flexBasis?: ResponsiveProp<string | number>;
  flexDirection?: ResponsiveProp<'row' | 'column' | 'row-reverse' | 'column-reverse'>;
  flexWrap?: ResponsiveProp<'nowrap' | 'wrap' | 'wrap-reverse'>;
  justifyContent?: ResponsiveProp<
    'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  >;
  alignItems?: ResponsiveProp<'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'>;
  alignContent?: ResponsiveProp<
    'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
  >;
  alignSelf?: ResponsiveProp<'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'>;
  order?: ResponsiveProp<number>;
  gap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  rowGap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  columnGap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
}

/**
 * Grid Props (gridTemplateColumns, gridGap, etc.)
 */
export interface GridProps {
  gridGap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  gridRowGap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  gridColumnGap?: ResponsiveProp<ThemeAwareProp<string | number, 'spacing'>>;
  gridRow?: ResponsiveProp<string>;
  gridColumn?: ResponsiveProp<string>;
  gridAutoFlow?: ResponsiveProp<'row' | 'column' | 'row dense' | 'column dense'>;
  gridAutoRows?: ResponsiveProp<string>;
  gridAutoColumns?: ResponsiveProp<string>;
  gridTemplateRows?: ResponsiveProp<string>;
  gridTemplateColumns?: ResponsiveProp<string>;
  gridTemplateAreas?: ResponsiveProp<string>;
  gridArea?: ResponsiveProp<string>;
}

/**
 * Position Props (position, top, right, etc.)
 */
export interface PositionProps {
  position?: ResponsiveProp<'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'>;
  zIndex?: ResponsiveProp<ThemeAwareProp<string | number, 'zIndices'>>;
  top?: ResponsiveProp<ThemeAwareProp<string | number, 'space'>>;
  right?: ResponsiveProp<ThemeAwareProp<string | number, 'space'>>;
  bottom?: ResponsiveProp<ThemeAwareProp<string | number, 'space'>>;
  left?: ResponsiveProp<ThemeAwareProp<string | number, 'space'>>;
}

/**
 * Shadow Props (boxShadow, textShadow)
 */
export interface ShadowProps {
  boxShadow?: ResponsiveProp<ThemeAwareProp<string, 'shadows'>>;
  textShadow?: ResponsiveProp<string>;
}

/**
 * Transition Props (transition, animation)
 */
export interface TransitionProps {
  transition?: ResponsiveProp<string>;
  transitionProperty?: ResponsiveProp<string>;
  transitionDuration?: ResponsiveProp<ThemeAwareProp<string | number, 'durations'>>;
  transitionTimingFunction?: ResponsiveProp<ThemeAwareProp<string, 'easings'>>;
  transitionDelay?: ResponsiveProp<string>;
  animation?: ResponsiveProp<string>;
  transform?: ResponsiveProp<string>;
  transformOrigin?: ResponsiveProp<string>;
}

/**
 * Pseudo Props (hover, focus, active states)
 */
export interface PseudoProps {
  _hover?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled'>;
  _focus?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled'>;
  _active?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled'>;
  _disabled?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled'>;
  _pressed?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed'>;
  _invalid?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid'>;
  _loading?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading'>;
  _selected?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading' | '_selected'>;
  _before?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading' | '_selected' | '_before' | '_after'>;
  _after?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading' | '_selected' | '_before' | '_after'>;
  _first?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading' | '_selected' | '_before' | '_after' | '_first' | '_last'>;
  _last?: Omit<StyleProps, '_hover' | '_focus' | '_active' | '_disabled' | '_pressed' | '_invalid' | '_loading' | '_selected' | '_before' | '_after' | '_first' | '_last'>;
}

/**
 * Variant Props (variant-based styling)
 */
export interface VariantProps {
  variant?: string;
  size?: string;
  colorScheme?: 'health' | 'care' | 'plan';
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isFullWidth?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
  isHovered?: boolean;
  isFocused?: boolean;
  isPressed?: boolean;
  isSelected?: boolean;
}

/**
 * Journey-specific Props (journey-based styling)
 */
export interface JourneyProps {
  journey?: 'health' | 'care' | 'plan';
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Accessibility Props
 */
export interface AccessibilityProps {
  aria?: Record<string, string>;
  role?: string;
  tabIndex?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: Record<string, boolean | string>;
  testID?: string;
}

/**
 * Combined Style Props
 */
export interface StyleProps extends 
  SpacingProps,
  LayoutProps,
  TypographyProps,
  ColorProps,
  BorderProps,
  FlexProps,
  GridProps,
  PositionProps,
  ShadowProps,
  TransitionProps,
  PseudoProps,
  VariantProps,
  JourneyProps,
  AccessibilityProps {}

/**
 * Base component props that include style props
 */
export interface BaseComponentProps extends StyleProps {
  as?: string | React.ComponentType<any>;
  children?: React.ReactNode;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Utility type to extract responsive values
 */
export type ResponsiveValue<T> = T | Array<T | null> | { [key: string]: T };

/**
 * Utility type for theme-aware values
 */
export type ThemeValue<T extends keyof Theme> = keyof Theme[T];

/**
 * Utility type for creating style prop getters
 */
export type StylePropGetter<P extends keyof StyleProps> = (props: { theme: Theme } & Pick<StyleProps, P>) => any;