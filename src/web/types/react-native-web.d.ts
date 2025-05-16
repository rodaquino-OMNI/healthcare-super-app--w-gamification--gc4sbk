/**
 * React Native Web Type Definitions
 * 
 * This file provides type definitions for React Native components when used in a web context.
 * It ensures proper type compatibility between React Native components and web DOM elements,
 * enabling seamless cross-platform component usage.
 * 
 * This ambient declaration file extends existing React Native types with web-specific properties
 * and event handlers, allowing the design system to maintain consistent typing across both web
 * and mobile platforms. Without this file, TypeScript would raise errors when React Native
 * components are used in web contexts.
 * 
 * Supports React Native 0.73.4 components in web context as specified in the technical specification.
 */

// Declare the react-native-web module that extends react-native types
// This enables TypeScript to recognize React Native components when used in a web context
declare module 'react-native' {
  // Re-export React Native types with web extensions
  import * as React from 'react';
  import { ViewStyle as RNViewStyle, TextStyle as RNTextStyle, ImageStyle as RNImageStyle } from 'react-native';

  // Web-specific CSS properties that can be used in React Native styles
  interface WebStyleProperties {
    // Position properties
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    zIndex?: number;
    
    // Display properties
    display?: 'none' | 'flex' | 'block' | 'inline' | 'inline-block' | 'inline-flex' | 'grid' | 'inline-grid';
    visibility?: 'visible' | 'hidden' | 'collapse';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    
    // CSS Grid properties
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    gridGap?: number | string;
    gridColumnGap?: number | string;
    gridRowGap?: number | string;
    gridColumn?: string;
    gridRow?: string;
    
    // Logical properties (for RTL support)
    marginInline?: number | string;
    marginInlineStart?: number | string;
    marginInlineEnd?: number | string;
    marginBlock?: number | string;
    marginBlockStart?: number | string;
    marginBlockEnd?: number | string;
    paddingInline?: number | string;
    paddingInlineStart?: number | string;
    paddingInlineEnd?: number | string;
    paddingBlock?: number | string;
    paddingBlockStart?: number | string;
    paddingBlockEnd?: number | string;
    
    // Animation and transition
    animation?: string;
    animationDelay?: string;
    animationDirection?: string;
    animationDuration?: string;
    animationFillMode?: string;
    animationIterationCount?: number | 'infinite';
    animationName?: string;
    animationPlayState?: 'paused' | 'running';
    animationTimingFunction?: string;
    transition?: string;
    transitionDelay?: string;
    transitionDuration?: string;
    transitionProperty?: string;
    transitionTimingFunction?: string;
    
    // Other web-specific properties
    cursor?: string;
    pointerEvents?: 'auto' | 'none' | 'box-only' | 'box-none';
    userSelect?: 'none' | 'auto' | 'text' | 'contain' | 'all';
    willChange?: string;
  }

  // Extend View style with web properties
  interface ViewStyle extends RNViewStyle, WebStyleProperties {
    // Additional web-specific View properties
    backdropFilter?: string;
    boxSizing?: 'content-box' | 'border-box';
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    objectPosition?: string;
    WebkitOverflowScrolling?: 'auto' | 'touch';
  }

  // Extend Text style with web properties
  interface TextStyle extends RNTextStyle, WebStyleProperties {
    // Additional web-specific Text properties
    textRendering?: 'auto' | 'optimizeSpeed' | 'optimizeLegibility' | 'geometricPrecision';
    textOverflow?: 'clip' | 'ellipsis';
    whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
    wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word';
    wordWrap?: 'normal' | 'break-word';
  }

  // Extend Image style with web properties
  interface ImageStyle extends RNImageStyle, WebStyleProperties {
    // Additional web-specific Image properties
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    objectPosition?: string;
    imageRendering?: 'auto' | 'crisp-edges' | 'pixelated';
  }

  // Web-specific DOM event handlers
  interface DOMAttributes {
    // Mouse events
    onClick?: (event: React.MouseEvent<Element>) => void;
    onContextMenu?: (event: React.MouseEvent<Element>) => void;
    onDoubleClick?: (event: React.MouseEvent<Element>) => void;
    onDrag?: (event: React.DragEvent<Element>) => void;
    onDragEnd?: (event: React.DragEvent<Element>) => void;
    onDragEnter?: (event: React.DragEvent<Element>) => void;
    onDragExit?: (event: React.DragEvent<Element>) => void;
    onDragLeave?: (event: React.DragEvent<Element>) => void;
    onDragOver?: (event: React.DragEvent<Element>) => void;
    onDragStart?: (event: React.DragEvent<Element>) => void;
    onDrop?: (event: React.DragEvent<Element>) => void;
    onMouseDown?: (event: React.MouseEvent<Element>) => void;
    onMouseEnter?: (event: React.MouseEvent<Element>) => void;
    onMouseLeave?: (event: React.MouseEvent<Element>) => void;
    onMouseMove?: (event: React.MouseEvent<Element>) => void;
    onMouseOut?: (event: React.MouseEvent<Element>) => void;
    onMouseOver?: (event: React.MouseEvent<Element>) => void;
    onMouseUp?: (event: React.MouseEvent<Element>) => void;
    
    // Form events
    onChange?: (event: React.FormEvent<Element>) => void;
    onInput?: (event: React.FormEvent<Element>) => void;
    onInvalid?: (event: React.FormEvent<Element>) => void;
    onReset?: (event: React.FormEvent<Element>) => void;
    onSubmit?: (event: React.FormEvent<Element>) => void;
    
    // Focus events
    onBlur?: (event: React.FocusEvent<Element>) => void;
    onFocus?: (event: React.FocusEvent<Element>) => void;
    
    // Keyboard events
    onKeyDown?: (event: React.KeyboardEvent<Element>) => void;
    onKeyPress?: (event: React.KeyboardEvent<Element>) => void;
    onKeyUp?: (event: React.KeyboardEvent<Element>) => void;
    
    // Clipboard events
    onCopy?: (event: React.ClipboardEvent<Element>) => void;
    onCut?: (event: React.ClipboardEvent<Element>) => void;
    onPaste?: (event: React.ClipboardEvent<Element>) => void;
    
    // Composition events
    onCompositionEnd?: (event: React.CompositionEvent<Element>) => void;
    onCompositionStart?: (event: React.CompositionEvent<Element>) => void;
    onCompositionUpdate?: (event: React.CompositionEvent<Element>) => void;
    
    // Scroll events
    onScroll?: (event: React.UIEvent<Element>) => void;
    
    // Wheel events
    onWheel?: (event: React.WheelEvent<Element>) => void;
  }

  // Extend View props with web-specific attributes
  interface ViewProps extends DOMAttributes {
    href?: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
    rel?: string;
    as?: string;
    type?: string;
    download?: any;
    tabIndex?: number;
    className?: string;
    id?: string;
    role?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    'aria-expanded'?: boolean | 'true' | 'false';
    'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    'aria-selected'?: boolean | 'true' | 'false';
    'aria-checked'?: boolean | 'true' | 'false' | 'mixed';
    'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
    'aria-disabled'?: boolean | 'true' | 'false';
    'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
    'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
    'aria-readonly'?: boolean | 'true' | 'false';
    'aria-required'?: boolean | 'true' | 'false';
    'aria-valuemax'?: number;
    'aria-valuemin'?: number;
    'aria-valuenow'?: number;
    'aria-valuetext'?: string;
    'aria-atomic'?: boolean | 'true' | 'false';
    'aria-busy'?: boolean | 'true' | 'false';
    'aria-live'?: 'off' | 'assertive' | 'polite';
    'aria-relevant'?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
    'data-testid'?: string;
  }

  // Extend Text props with web-specific attributes
  interface TextProps extends ViewProps {
    dir?: 'auto' | 'ltr' | 'rtl';
    lang?: string;
    nonce?: string;
  }

  // Extend Image props with web-specific attributes
  interface ImageProps extends ViewProps {
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    decoding?: 'async' | 'auto' | 'sync';
    loading?: 'eager' | 'lazy';
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    sizes?: string;
    srcSet?: string;
  }

  // Extend TextInput props with web-specific attributes
  interface TextInputProps extends ViewProps {
    autoComplete?: string;
    autoCorrect?: 'on' | 'off';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    spellCheck?: boolean;
    step?: number | string;
  }

  // Platform module with web detection
  interface PlatformStatic {
    OS: 'ios' | 'android' | 'web';
    Version: number | string;
    isTesting: boolean;
    isTV: boolean;
    select<T>(specifics: { ios?: T; android?: T; native?: T; default?: T; web?: T }): T;
  }

  // Extend Animated module with web-specific properties
  namespace Animated {
    interface AnimatedViewProps extends ViewProps {}
    interface AnimatedTextProps extends TextProps {}
    interface AnimatedImageProps extends ImageProps {}
    
    class View extends React.Component<AnimatedViewProps> {}
    class Text extends React.Component<AnimatedTextProps> {}
    class Image extends React.Component<AnimatedImageProps> {}
  }

  // Extend Gesture handlers for web
  namespace Gesture {
    interface GestureHandlerProps extends ViewProps {}
  }
}

// Declare the react-native-web module
// This allows importing directly from 'react-native-web' with proper type checking
declare module 'react-native-web' {
  export * from 'react-native';
}

// Declare additional modules that might be used with react-native-web
// These declarations support direct imports from specific paths within react-native-web
declare module 'react-native-web/dist/exports/AppRegistry' {
  import { AppRegistry } from 'react-native';
  export default AppRegistry;
}

declare module 'react-native-web/dist/exports/StyleSheet' {
  import { StyleSheet } from 'react-native';
  export default StyleSheet;
}

declare module 'react-native-web/dist/exports/View' {
  import { View } from 'react-native';
  export default View;
}

declare module 'react-native-web/dist/exports/Text' {
  import { Text } from 'react-native';
  export default Text;
}

declare module 'react-native-web/dist/exports/Image' {
  import { Image } from 'react-native';
  export default Image;
}

declare module 'react-native-web/dist/exports/Animated' {
  import { Animated } from 'react-native';
  export default Animated;
}

declare module 'react-native-web/dist/exports/Platform' {
  import { Platform } from 'react-native';
  export default Platform;
}

// Support for additional components from @design-system/primitives that need to be compatible across platforms
declare module '@design-system/primitives' {
  import * as React from 'react';
  import { ViewProps, TextProps, ViewStyle, TextStyle } from 'react-native';

  // Box component - fundamental layout primitive
  export interface BoxProps extends ViewProps {
    children?: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
  }
  export const Box: React.ComponentType<BoxProps>;

  // Text component - fundamental text primitive
  export interface TextProps extends TextProps {
    children?: React.ReactNode;
    style?: TextStyle | TextStyle[];
  }
  export const Text: React.ComponentType<TextProps>;

  // Stack component - layout utility for stacking elements
  export interface StackProps extends BoxProps {
    spacing?: number | string;
    direction?: 'row' | 'column';
    align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  }
  export const Stack: React.ComponentType<StackProps>;

  // Icon component - for rendering icons
  export interface IconProps extends BoxProps {
    name: string;
    size?: number;
    color?: string;
  }
  export const Icon: React.ComponentType<IconProps>;

  // Touchable component - for handling touch/click interactions
  export interface TouchableProps extends BoxProps {
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
  }
  export const Touchable: React.ComponentType<TouchableProps>;
}