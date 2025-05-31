/**
 * React Native Web TypeScript Declaration File
 * 
 * This ambient TypeScript declaration file provides type definitions and augmentations for
 * React Native Web components when used in the Next.js web application. It ensures proper
 * type compatibility between React Native components and web DOM elements, enabling seamless
 * cross-platform component usage.
 * 
 * The file includes type extensions for core React Native components, gesture handlers,
 * animations, and platform-specific APIs, allowing the design system to maintain consistent
 * typing across both web and mobile platforms.
 * 
 * This file is a critical part of the AUSTA SuperApp's platform independence strategy,
 * enabling the use of shared code and design systems across web (Next.js) and mobile
 * (React Native) platforms as specified in the technical requirements.
 * 
 * @version 1.0.0
 * @supports React Native 0.73.4
 */

// Declare the react-native-web module
declare module 'react-native-web' {
  export * from 'react-native';

  // Explicitly support React Native 0.73.4 as specified in the technical specification
  // This ensures compatibility with the version used in the AUSTA SuperApp
  export const version: '0.73.4';
}

// Augment the react-native module to include web-specific properties
// This enables the use of React Native components in a web context with proper DOM event handling
declare module 'react-native' {
  // Re-export the Platform module with web detection
  // This enables platform-specific feature detection for web
  export namespace Platform {
    const OS: 'ios' | 'android' | 'web';
    function select<T extends Object>(obj: T): T[keyof T];
    
    // Web-specific platform detection
    export namespace OS {
      const isWeb: boolean;
    }

    // Additional helper methods for platform detection
    export function isWeb(): boolean;
    export function isIOS(): boolean;
    export function isAndroid(): boolean;
  }

  // Extend the StyleSheet module with web-specific features
  export namespace StyleSheet {
    export interface AbsoluteFillStyle {
      position: 'absolute';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }

    // Web-specific style properties
    export interface Style {
      // CSS properties available in web but not in React Native
      position?: 'absolute' | 'relative' | 'fixed' | 'sticky';
      cursor?: string;
      userSelect?: 'none' | 'text' | 'all' | 'auto';
      visibility?: 'visible' | 'hidden';
      pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
      overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
      overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
      WebkitOverflowScrolling?: 'auto' | 'touch';
      marginBlock?: number | string;
      marginInline?: number | string;
      paddingBlock?: number | string;
      paddingInline?: number | string;
    }
  }

  // Extend View component with web-specific props
  export interface ViewProps {
    href?: string;
    hrefAttrs?: {
      target?: '_blank' | '_self' | '_parent' | '_top';
      rel?: string;
      download?: boolean;
    };
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseOver?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseOut?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseUp?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
    onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void;
    tabIndex?: number;
    role?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-details'?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
    'aria-expanded'?: boolean | 'true' | 'false';
    'aria-selected'?: boolean | 'true' | 'false';
    'aria-checked'?: boolean | 'true' | 'false' | 'mixed';
    'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
    'aria-disabled'?: boolean | 'true' | 'false';
    'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
    'aria-valuemin'?: number;
    'aria-valuemax'?: number;
    'aria-valuenow'?: number;
    'aria-valuetext'?: string;
    'aria-busy'?: boolean | 'true' | 'false';
    'aria-controls'?: string;
    'aria-live'?: 'off' | 'assertive' | 'polite';
    'aria-atomic'?: boolean | 'true' | 'false';
    'aria-relevant'?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
    'aria-roledescription'?: string;
    'aria-activedescendant'?: string;
    'aria-level'?: number;
    'aria-modal'?: boolean | 'true' | 'false';
    'aria-multiline'?: boolean | 'true' | 'false';
    'aria-multiselectable'?: boolean | 'true' | 'false';
    'aria-orientation'?: 'horizontal' | 'vertical';
    'aria-placeholder'?: string;
    'aria-readonly'?: boolean | 'true' | 'false';
    'aria-required'?: boolean | 'true' | 'false';
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    'aria-keyshortcuts'?: string;
    'aria-errormessage'?: string;
    'aria-colcount'?: number;
    'aria-colindex'?: number;
    'aria-colspan'?: number;
    'aria-rowcount'?: number;
    'aria-rowindex'?: number;
    'aria-rowspan'?: number;
    'aria-setsize'?: number;
    'aria-posinset'?: number;
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    'aria-owns'?: string;
    'aria-flowto'?: string;
    'aria-grabbed'?: boolean | 'true' | 'false';
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
  }

  // Extend Text component with web-specific props
  export interface TextProps {
    href?: string;
    hrefAttrs?: {
      target?: '_blank' | '_self' | '_parent' | '_top';
      rel?: string;
      download?: boolean;
    };
    onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseMove?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseOver?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseOut?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    onMouseUp?: (event: React.MouseEvent<HTMLSpanElement>) => void;
    tabIndex?: number;
    dir?: 'auto' | 'ltr' | 'rtl';
    lang?: string;
  }

  // Extend Image component with web-specific props
  export interface ImageProps {
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    decoding?: 'async' | 'auto' | 'sync';
    loading?: 'eager' | 'lazy';
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
    onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  }

  // Extend TextInput component with web-specific props
  export interface TextInputProps {
    autoComplete?: string;
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    spellCheck?: boolean;
  }

  // Extend ScrollView component with web-specific props
  export interface ScrollViewProps {
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
    onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void;
    scrollbarWidth?: 'auto' | 'thin' | 'none';
    scrollBehavior?: 'auto' | 'smooth';
  }

  // Extend TouchableOpacity component with web-specific props
  export interface TouchableOpacityProps {
    href?: string;
    hrefAttrs?: {
      target?: '_blank' | '_self' | '_parent' | '_top';
      rel?: string;
      download?: boolean;
    };
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseOver?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseOut?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseUp?: (event: React.MouseEvent<HTMLDivElement>) => void;
    tabIndex?: number;
    role?: string;
  }
}

// Declare the react-native-gesture-handler module for web
// This enables proper typing for gesture handlers when used with react-native-web
declare module 'react-native-gesture-handler' {
  import { ViewProps } from 'react-native';
  import * as React from 'react';

  // Base gesture handler props
  export interface BaseGestureHandlerProps<T extends React.Component> extends ViewProps {
    enabled?: boolean;
    waitFor?: React.Ref<T> | React.Ref<T>[];
    simultaneousHandlers?: React.Ref<T> | React.Ref<T>[];
    shouldCancelWhenOutside?: boolean;
    hitSlop?: number | { top?: number; left?: number; bottom?: number; right?: number };
  }

  // Pan gesture handler
  export interface PanGestureHandlerProps extends BaseGestureHandlerProps<PanGestureHandler> {
    minDist?: number;
    minPointers?: number;
    maxPointers?: number;
    activateAfterLongPress?: number;
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Tap gesture handler
  export interface TapGestureHandlerProps extends BaseGestureHandlerProps<TapGestureHandler> {
    maxDurationMs?: number;
    maxDelayMs?: number;
    numberOfTaps?: number;
    minPointers?: number;
    maxDist?: number;
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Long press gesture handler
  export interface LongPressGestureHandlerProps extends BaseGestureHandlerProps<LongPressGestureHandler> {
    minDurationMs?: number;
    maxDist?: number;
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Pinch gesture handler
  export interface PinchGestureHandlerProps extends BaseGestureHandlerProps<PinchGestureHandler> {
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Rotation gesture handler
  export interface RotationGestureHandlerProps extends BaseGestureHandlerProps<RotationGestureHandler> {
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Fling gesture handler
  export interface FlingGestureHandlerProps extends BaseGestureHandlerProps<FlingGestureHandler> {
    direction?: number;
    numberOfPointers?: number;
    onGestureEvent?: (event: any) => void;
    onHandlerStateChange?: (event: any) => void;
  }

  // Gesture handler components
  export class PanGestureHandler extends React.Component<PanGestureHandlerProps> {}
  export class TapGestureHandler extends React.Component<TapGestureHandlerProps> {}
  export class LongPressGestureHandler extends React.Component<LongPressGestureHandlerProps> {}
  export class PinchGestureHandler extends React.Component<PinchGestureHandlerProps> {}
  export class RotationGestureHandler extends React.Component<RotationGestureHandlerProps> {}
  export class FlingGestureHandler extends React.Component<FlingGestureHandlerProps> {}

  // Gesture handler state
  export enum State {
    UNDETERMINED = 0,
    FAILED,
    BEGAN,
    CANCELLED,
    ACTIVE,
    END,
  }

  // Gesture handler root view
  export interface GestureHandlerRootViewProps extends ViewProps {}
  export class GestureHandlerRootView extends React.Component<GestureHandlerRootViewProps> {}

  // Gesture detector
  export interface GestureDetectorProps {
    gesture: any;
    children?: React.ReactNode;
  }
  export class GestureDetector extends React.Component<GestureDetectorProps> {}

  // Gesture API
  export namespace Gesture {
    export function Pan(): any;
    export function Tap(): any;
    export function LongPress(): any;
    export function Pinch(): any;
    export function Rotation(): any;
    export function Fling(): any;
    export function Exclusive(): any;
    export function Race(): any;
    export function Simultaneous(): any;
  }

  // Gesture handler HOC
  export function gestureHandlerRootHOC<P extends object>(Component: React.ComponentType<P>, options?: any): React.ComponentType<P>;
}

// Declare the react-native-reanimated module for web
// This enables proper typing for animations when used with react-native-web
declare module 'react-native-reanimated' {
  import { ViewStyle, TextStyle, ImageStyle, View, Text, Image, ScrollView, Animated as RNAnimated } from 'react-native';
  import * as React from 'react';

  // Animated components
  export namespace Animated {
    export class View extends React.Component<React.ComponentProps<typeof View>> {}
    export class Text extends React.Component<React.ComponentProps<typeof Text>> {}
    export class Image extends React.Component<React.ComponentProps<typeof Image>> {}
    export class ScrollView extends React.Component<React.ComponentProps<typeof ScrollView>> {}
    export class FlatList extends React.Component<React.ComponentProps<typeof RNAnimated.FlatList>> {}
    export class SectionList extends React.Component<React.ComponentProps<typeof RNAnimated.SectionList>> {}
  }

  // Animation functions
  export function useSharedValue<T>(initialValue: T): { value: T };
  export function useAnimatedStyle<T extends ViewStyle | TextStyle | ImageStyle>(styleCallback: () => T, dependencies?: any[]): T;
  export function useDerivedValue<T>(derivationCallback: () => T, dependencies?: any[]): { value: T };
  export function useAnimatedGestureHandler(handlers: any, dependencies?: any[]): any;
  export function useAnimatedScrollHandler(handlers: any, dependencies?: any[]): any;
  export function useAnimatedProps<T>(callback: () => T, dependencies?: any[]): T;
  export function useAnimatedRef<T extends React.Component>(): React.RefObject<T>;
  export function useAnimatedReaction<T>(prepare: () => T, react: (prepared: T, previous: T | null) => void, dependencies?: any[]): void;

  // Animation helpers
  export function withTiming(toValue: number, config?: any, callback?: (finished: boolean) => void): number;
  export function withSpring(toValue: number, config?: any, callback?: (finished: boolean) => void): number;
  export function withDecay(config: any, callback?: (finished: boolean) => void): number;
  export function withDelay(delayMS: number, animation: number): number;
  export function withSequence(...animations: number[]): number;
  export function withRepeat(animation: number, numberOfReps?: number, reverse?: boolean, callback?: (finished: boolean) => void): number;
  export function cancelAnimation(value: { value: any }): void;
  export function interpolate(value: number, inputRange: number[], outputRange: number[], config?: any): number;
  export function runOnJS<A extends any[], R>(fn: (...args: A) => R): (...args: A) => R;
  export function runOnUI<A extends any[], R>(fn: (...args: A) => R): (...args: A) => void;
}