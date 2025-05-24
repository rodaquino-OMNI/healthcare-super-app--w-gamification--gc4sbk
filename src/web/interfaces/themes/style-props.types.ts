/**
 * Style Props Type Definitions
 * 
 * This file defines TypeScript interfaces for all style props used in the AUSTA SuperApp
 * design system. These interfaces establish the contract between UI components and their
 * style functions, ensuring consistent prop naming and type checking across all styled
 * components.
 * 
 * The style props are organized into logical categories (spacing, layout, typography, etc.)
 * and support responsive values, pseudo-class styling, and theme-aware properties.
 */

import { ResponsiveToken } from './tokens.types';

/**
 * ResponsiveValue Type
 * 
 * A generic type that allows a property to be defined as either a single value
 * or as a responsive object with different values for different breakpoints.
 */
export type ResponsiveValue<T> = T | ResponsiveToken<T>;

/**
 * Spacing Props Interface
 * 
 * Defines props related to margin and padding with support for responsive values.
 * These props map to CSS margin and padding properties and follow the 8-point grid system.
 */
export interface SpacingProps {
  // Margin props
  m?: ResponsiveValue<string | number>;
  margin?: ResponsiveValue<string | number>;
  mt?: ResponsiveValue<string | number>;
  marginTop?: ResponsiveValue<string | number>;
  mr?: ResponsiveValue<string | number>;
  marginRight?: ResponsiveValue<string | number>;
  mb?: ResponsiveValue<string | number>;
  marginBottom?: ResponsiveValue<string | number>;
  ml?: ResponsiveValue<string | number>;
  marginLeft?: ResponsiveValue<string | number>;
  mx?: ResponsiveValue<string | number>;
  marginX?: ResponsiveValue<string | number>;
  my?: ResponsiveValue<string | number>;
  marginY?: ResponsiveValue<string | number>;
  
  // Padding props
  p?: ResponsiveValue<string | number>;
  padding?: ResponsiveValue<string | number>;
  pt?: ResponsiveValue<string | number>;
  paddingTop?: ResponsiveValue<string | number>;
  pr?: ResponsiveValue<string | number>;
  paddingRight?: ResponsiveValue<string | number>;
  pb?: ResponsiveValue<string | number>;
  paddingBottom?: ResponsiveValue<string | number>;
  pl?: ResponsiveValue<string | number>;
  paddingLeft?: ResponsiveValue<string | number>;
  px?: ResponsiveValue<string | number>;
  paddingX?: ResponsiveValue<string | number>;
  py?: ResponsiveValue<string | number>;
  paddingY?: ResponsiveValue<string | number>;
}

/**
 * Layout Props Interface
 * 
 * Defines props related to component layout, including width, height, display, overflow, etc.
 * These props map to CSS layout properties and support responsive values.
 */
export interface LayoutProps {
  // Width and height
  w?: ResponsiveValue<string | number>;
  width?: ResponsiveValue<string | number>;
  h?: ResponsiveValue<string | number>;
  height?: ResponsiveValue<string | number>;
  minW?: ResponsiveValue<string | number>;
  minWidth?: ResponsiveValue<string | number>;
  maxW?: ResponsiveValue<string | number>;
  maxWidth?: ResponsiveValue<string | number>;
  minH?: ResponsiveValue<string | number>;
  minHeight?: ResponsiveValue<string | number>;
  maxH?: ResponsiveValue<string | number>;
  maxHeight?: ResponsiveValue<string | number>;
  
  // Display and visibility
  display?: ResponsiveValue<string>;
  d?: ResponsiveValue<string>;
  visibility?: ResponsiveValue<string>;
  overflow?: ResponsiveValue<string>;
  overflowX?: ResponsiveValue<string>;
  overflowY?: ResponsiveValue<string>;
  
  // Box sizing
  boxSizing?: ResponsiveValue<string>;
  
  // Object fit (for images and videos)
  objectFit?: ResponsiveValue<string>;
  objectPosition?: ResponsiveValue<string>;
  
  // Aspect ratio
  aspectRatio?: ResponsiveValue<string | number>;
}

/**
 * Typography Props Interface
 * 
 * Defines props related to text styling, including font size, weight, family, etc.
 * These props map to CSS typography properties and support responsive values.
 */
export interface TypographyProps {
  fontFamily?: ResponsiveValue<string>;
  fontSize?: ResponsiveValue<string | number>;
  fontWeight?: ResponsiveValue<string | number>;
  lineHeight?: ResponsiveValue<string | number>;
  letterSpacing?: ResponsiveValue<string | number>;
  textAlign?: ResponsiveValue<string>;
  fontStyle?: ResponsiveValue<string>;
  textTransform?: ResponsiveValue<string>;
  textDecoration?: ResponsiveValue<string>;
  textOverflow?: ResponsiveValue<string>;
  whiteSpace?: ResponsiveValue<string>;
  wordBreak?: ResponsiveValue<string>;
  wordWrap?: ResponsiveValue<string>;
  textShadow?: ResponsiveValue<string>;
  
  // Truncation
  truncate?: boolean;
  noOfLines?: number;
  
  // Responsive typography
  textStyle?: ResponsiveValue<string>;
}

/**
 * Color Props Interface
 * 
 * Defines props related to colors, including text color, background color, etc.
 * These props map to CSS color properties and support theme-aware values.
 */
export interface ColorProps {
  color?: ResponsiveValue<string>;
  bg?: ResponsiveValue<string>;
  backgroundColor?: ResponsiveValue<string>;
  bgColor?: ResponsiveValue<string>;
  opacity?: ResponsiveValue<string | number>;
  bgGradient?: ResponsiveValue<string>;
  backgroundGradient?: ResponsiveValue<string>;
  bgImage?: ResponsiveValue<string>;
  backgroundImage?: ResponsiveValue<string>;
  bgSize?: ResponsiveValue<string>;
  backgroundSize?: ResponsiveValue<string>;
  bgPosition?: ResponsiveValue<string>;
  backgroundPosition?: ResponsiveValue<string>;
  bgRepeat?: ResponsiveValue<string>;
  backgroundRepeat?: ResponsiveValue<string>;
  bgAttachment?: ResponsiveValue<string>;
  backgroundAttachment?: ResponsiveValue<string>;
  bgClip?: ResponsiveValue<string>;
  backgroundClip?: ResponsiveValue<string>;
  
  // Theme-aware colors
  colorScheme?: ResponsiveValue<string>;
  fill?: ResponsiveValue<string>;
  stroke?: ResponsiveValue<string>;
}

/**
 * Border Props Interface
 * 
 * Defines props related to borders, including border width, style, color, radius, etc.
 * These props map to CSS border properties and support responsive values.
 */
export interface BorderProps {
  border?: ResponsiveValue<string>;
  borderWidth?: ResponsiveValue<string | number>;
  borderStyle?: ResponsiveValue<string>;
  borderColor?: ResponsiveValue<string>;
  
  // Individual borders
  borderTop?: ResponsiveValue<string>;
  borderRight?: ResponsiveValue<string>;
  borderBottom?: ResponsiveValue<string>;
  borderLeft?: ResponsiveValue<string>;
  
  // Border width shortcuts
  borderTopWidth?: ResponsiveValue<string | number>;
  borderRightWidth?: ResponsiveValue<string | number>;
  borderBottomWidth?: ResponsiveValue<string | number>;
  borderLeftWidth?: ResponsiveValue<string | number>;
  
  // Border style shortcuts
  borderTopStyle?: ResponsiveValue<string>;
  borderRightStyle?: ResponsiveValue<string>;
  borderBottomStyle?: ResponsiveValue<string>;
  borderLeftStyle?: ResponsiveValue<string>;
  
  // Border color shortcuts
  borderTopColor?: ResponsiveValue<string>;
  borderRightColor?: ResponsiveValue<string>;
  borderBottomColor?: ResponsiveValue<string>;
  borderLeftColor?: ResponsiveValue<string>;
  
  // Border radius
  borderRadius?: ResponsiveValue<string | number>;
  borderTopLeftRadius?: ResponsiveValue<string | number>;
  borderTopRightRadius?: ResponsiveValue<string | number>;
  borderBottomRightRadius?: ResponsiveValue<string | number>;
  borderBottomLeftRadius?: ResponsiveValue<string | number>;
  
  // Border radius shortcuts
  rounded?: ResponsiveValue<string | number>;
  roundedTop?: ResponsiveValue<string | number>;
  roundedRight?: ResponsiveValue<string | number>;
  roundedBottom?: ResponsiveValue<string | number>;
  roundedLeft?: ResponsiveValue<string | number>;
  roundedTopLeft?: ResponsiveValue<string | number>;
  roundedTopRight?: ResponsiveValue<string | number>;
  roundedBottomRight?: ResponsiveValue<string | number>;
  roundedBottomLeft?: ResponsiveValue<string | number>;
}

/**
 * Shadow Props Interface
 * 
 * Defines props related to shadows, including box shadow and text shadow.
 * These props map to CSS shadow properties and support responsive values.
 */
export interface ShadowProps {
  boxShadow?: ResponsiveValue<string>;
  textShadow?: ResponsiveValue<string>;
  shadow?: ResponsiveValue<string>;
}

/**
 * Position Props Interface
 * 
 * Defines props related to positioning, including position, top, right, bottom, left, z-index.
 * These props map to CSS positioning properties and support responsive values.
 */
export interface PositionProps {
  position?: ResponsiveValue<string>;
  pos?: ResponsiveValue<string>;
  top?: ResponsiveValue<string | number>;
  right?: ResponsiveValue<string | number>;
  bottom?: ResponsiveValue<string | number>;
  left?: ResponsiveValue<string | number>;
  zIndex?: ResponsiveValue<string | number>;
  inset?: ResponsiveValue<string | number>;
  insetX?: ResponsiveValue<string | number>;
  insetY?: ResponsiveValue<string | number>;
}

/**
 * Flexbox Props Interface
 * 
 * Defines props related to flexbox layout, including flex direction, wrap, align, justify, etc.
 * These props map to CSS flexbox properties and support responsive values.
 */
export interface FlexboxProps {
  flex?: ResponsiveValue<string | number>;
  flexGrow?: ResponsiveValue<string | number>;
  flexShrink?: ResponsiveValue<string | number>;
  flexBasis?: ResponsiveValue<string | number>;
  flexDirection?: ResponsiveValue<string>;
  flexDir?: ResponsiveValue<string>;
  flexWrap?: ResponsiveValue<string>;
  
  // Alignment
  alignItems?: ResponsiveValue<string>;
  alignContent?: ResponsiveValue<string>;
  justifyItems?: ResponsiveValue<string>;
  justifyContent?: ResponsiveValue<string>;
  justifySelf?: ResponsiveValue<string>;
  alignSelf?: ResponsiveValue<string>;
  
  // Order
  order?: ResponsiveValue<string | number>;
  
  // Shorthand props
  direction?: ResponsiveValue<string>;
  wrap?: ResponsiveValue<string | boolean>;
  justify?: ResponsiveValue<string>;
  align?: ResponsiveValue<string>;
}

/**
 * Grid Props Interface
 * 
 * Defines props related to CSS Grid layout, including grid template, gap, areas, etc.
 * These props map to CSS Grid properties and support responsive values.
 */
export interface GridProps {
  gridGap?: ResponsiveValue<string | number>;
  gridColumnGap?: ResponsiveValue<string | number>;
  gridRowGap?: ResponsiveValue<string | number>;
  gridColumn?: ResponsiveValue<string>;
  gridRow?: ResponsiveValue<string>;
  gridAutoFlow?: ResponsiveValue<string>;
  gridAutoColumns?: ResponsiveValue<string>;
  gridAutoRows?: ResponsiveValue<string>;
  gridTemplateColumns?: ResponsiveValue<string>;
  gridTemplateRows?: ResponsiveValue<string>;
  gridTemplateAreas?: ResponsiveValue<string>;
  gridArea?: ResponsiveValue<string>;
  
  // Shorthand props
  gap?: ResponsiveValue<string | number>;
  rowGap?: ResponsiveValue<string | number>;
  columnGap?: ResponsiveValue<string | number>;
  templateColumns?: ResponsiveValue<string>;
  templateRows?: ResponsiveValue<string>;
  templateAreas?: ResponsiveValue<string>;
  area?: ResponsiveValue<string>;
  autoFlow?: ResponsiveValue<string>;
  autoColumns?: ResponsiveValue<string>;
  autoRows?: ResponsiveValue<string>;
}

/**
 * Pseudo Props Interface
 * 
 * Defines props for pseudo-class styling, including hover, focus, active, etc.
 * These props allow for defining styles that apply in different interaction states.
 */
export interface PseudoProps {
  _hover?: Omit<StyleProps, '_hover'>;
  _focus?: Omit<StyleProps, '_focus'>;
  _active?: Omit<StyleProps, '_active'>;
  _disabled?: Omit<StyleProps, '_disabled'>;
  _invalid?: Omit<StyleProps, '_invalid'>;
  _pressed?: Omit<StyleProps, '_pressed'>;
  _selected?: Omit<StyleProps, '_selected'>;
  _focusVisible?: Omit<StyleProps, '_focusVisible'>;
  _focusWithin?: Omit<StyleProps, '_focusWithin'>;
  _placeholder?: Omit<StyleProps, '_placeholder'>;
  _firstChild?: Omit<StyleProps, '_firstChild'>;
  _lastChild?: Omit<StyleProps, '_lastChild'>;
  _notFirstChild?: Omit<StyleProps, '_notFirstChild'>;
  _notLastChild?: Omit<StyleProps, '_notLastChild'>;
  _even?: Omit<StyleProps, '_even'>;
  _odd?: Omit<StyleProps, '_odd'>;
  _first?: Omit<StyleProps, '_first'>;
  _last?: Omit<StyleProps, '_last'>;
  _expanded?: Omit<StyleProps, '_expanded'>;
  _checked?: Omit<StyleProps, '_checked'>;
  _groupHover?: Omit<StyleProps, '_groupHover'>;
  _groupFocus?: Omit<StyleProps, '_groupFocus'>;
  _groupActive?: Omit<StyleProps, '_groupActive'>;
  _groupDisabled?: Omit<StyleProps, '_groupDisabled'>;
  _groupInvalid?: Omit<StyleProps, '_groupInvalid'>;
  _groupChecked?: Omit<StyleProps, '_groupChecked'>;
  _groupExpanded?: Omit<StyleProps, '_groupExpanded'>;
  _indeterminate?: Omit<StyleProps, '_indeterminate'>;
  _readOnly?: Omit<StyleProps, '_readOnly'>;
  _empty?: Omit<StyleProps, '_empty'>;
  _fullScreen?: Omit<StyleProps, '_fullScreen'>;
  _loading?: Omit<StyleProps, '_loading'>;
  _autofill?: Omit<StyleProps, '_autofill'>;
  _highlighted?: Omit<StyleProps, '_highlighted'>;
}

/**
 * Variant Props Interface
 * 
 * Defines props for component variants, including size, variant, colorScheme, etc.
 * These props allow for predefined style variations of components.
 */
export interface VariantProps {
  size?: ResponsiveValue<string>;
  variant?: ResponsiveValue<string>;
  colorScheme?: ResponsiveValue<string>;
  orientation?: ResponsiveValue<string>;
  styleConfig?: Record<string, any>;
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Style Props Interface
 * 
 * A comprehensive interface that includes all style props categories.
 * This interface is used as the base for component prop types that accept styling.
 */
export interface StyleProps extends 
  SpacingProps,
  LayoutProps,
  TypographyProps,
  ColorProps,
  BorderProps,
  ShadowProps,
  PositionProps,
  FlexboxProps,
  GridProps,
  PseudoProps,
  VariantProps {
  /**
   * Custom CSS properties
   * Allows passing any additional CSS properties not covered by the specific prop interfaces
   */
  sx?: Record<string, any>;
  
  /**
   * CSS property
   * Allows passing raw CSS as a string (use sparingly, prefer typed props)
   */
  css?: string | Record<string, any>;
  
  /**
   * Theme-aware style function
   * Allows passing a function that receives the theme and returns styles
   */
  __css?: Record<string, any>;
  
  /**
   * Base styles
   * Styles that are applied before variant styles
   */
  baseStyle?: Record<string, any>;
  
  /**
   * Transform function
   * Function to transform the final style object
   */
  transform?: (styles: Record<string, any>) => Record<string, any>;
  
  /**
   * Apply styles conditionally
   * Object of style props that are applied based on a condition
   */
  apply?: Record<string, boolean | undefined>;
}