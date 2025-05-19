/**
 * Typography tokens for the AUSTA SuperApp design system.
 * 
 * This file defines the comprehensive typographic system including font families,
 * weights, sizes, line heights, and letter spacing optimized for bilingual support
 * (Portuguese and English) and cross-platform compatibility (web and mobile).
 * 
 * @packageDocumentation
 */

import { Platform } from 'react-native';

/**
 * Interface for font family tokens
 * Provides platform-specific font family definitions
 */
export interface FontFamilyTokens {
  /** Base font for general content */
  base: string;
  /** Font for headings and titles */
  heading: string;
  /** Monospaced font for code, metrics, etc. */
  mono: string;
  /** System font fallbacks for native platforms */
  system: string;
}

/**
 * Interface for font weight tokens
 * Follows standard font weight numeric values
 */
export interface FontWeightTokens {
  /** Light weight (300) */
  light: number;
  /** Regular weight (400) for most text */
  regular: number;
  /** Medium weight (500) for semi-emphasis */
  medium: number;
  /** Semi-bold weight (600) for stronger emphasis */
  semiBold: number;
  /** Bold weight (700) for strong emphasis */
  bold: number;
}

/**
 * Interface for font size tokens
 * Provides both string values with units and raw numeric values
 */
export interface FontSizeTokens {
  /** Extra small (12px) - captions, footnotes */
  xs: string;
  /** Small (14px) - secondary text, labels */
  sm: string;
  /** Medium (16px) - body text (default) */
  md: string;
  /** Large (18px) - emphasized body text */
  lg: string;
  /** Extra large (20px) - subheadings, card titles */
  xl: string;
  /** 2x Extra large (24px) - section headers */
  '2xl': string;
  /** 3x Extra large (30px) - page titles */
  '3xl': string;
  /** 4x Extra large (36px) - hero text, major headings */
  '4xl': string;
}

/**
 * Interface for line height tokens
 * Defines spacing between lines of text
 */
export interface LineHeightTokens {
  /** Tight spacing (1.2) - good for headings and short text */
  tight: number;
  /** Base spacing (1.5) - optimal for body text and readability */
  base: number;
  /** Relaxed spacing (1.75) - good for larger text and better readability */
  relaxed: number;
  /** Extra relaxed spacing (2.0) - maximum spacing for specialized content */
  loose: number;
}

/**
 * Interface for letter spacing tokens
 * Controls spacing between characters
 */
export interface LetterSpacingTokens {
  /** Tighter letter spacing (-0.05em) - for large headings */
  tighter: string;
  /** Tight letter spacing (-0.025em) - for headings and display text */
  tight: string;
  /** Normal letter spacing (0) - for body text */
  normal: string;
  /** Wide letter spacing (0.025em) - for improved legibility in small text */
  wide: string;
  /** Wider letter spacing (0.05em) - for maximum legibility in very small text */
  wider: string;
}

/**
 * Interface for responsive typography scaling
 * Provides size adjustments for different viewport sizes
 */
export interface ResponsiveTypographyScaling {
  /** Base multiplier (1.0) - default size */
  base: number;
  /** Mobile multiplier (0.85) - slightly smaller for mobile devices */
  mobile: number;
  /** Tablet multiplier (0.9) - adjusted for tablet screens */
  tablet: number;
  /** Desktop multiplier (1.0) - standard size for desktop screens */
  desktop: number;
  /** Large screen multiplier (1.1) - slightly larger for big screens */
  large: number;
}

/**
 * Interface for language-specific typography adjustments
 * Optimizes typography for different languages
 */
export interface LanguageTypographyAdjustments {
  /** English typography adjustments */
  en: {
    /** Letter spacing adjustment for English */
    letterSpacing: {
      /** Adjustment for headings in English */
      heading: string;
      /** Adjustment for body text in English */
      body: string;
    };
    /** Line height adjustment for English */
    lineHeight: {
      /** Adjustment for headings in English */
      heading: number;
      /** Adjustment for body text in English */
      body: number;
    };
  };
  /** Portuguese typography adjustments */
  pt: {
    /** Letter spacing adjustment for Portuguese */
    letterSpacing: {
      /** Adjustment for headings in Portuguese */
      heading: string;
      /** Adjustment for body text in Portuguese */
      body: string;
    };
    /** Line height adjustment for Portuguese */
    lineHeight: {
      /** Adjustment for headings in Portuguese */
      heading: number;
      /** Adjustment for body text in Portuguese */
      body: number;
    };
  };
}

/**
 * Interface for compound typography styles
 * Provides predefined text styles for common patterns
 */
export interface CompoundTypographyStyles {
  /** Heading styles for different levels */
  heading: {
    /** h1 heading style */
    h1: {
      /** Font size for h1 */
      fontSize: string;
      /** Font weight for h1 */
      fontWeight: number;
      /** Line height for h1 */
      lineHeight: number;
      /** Letter spacing for h1 */
      letterSpacing: string;
    };
    /** h2 heading style */
    h2: {
      /** Font size for h2 */
      fontSize: string;
      /** Font weight for h2 */
      fontWeight: number;
      /** Line height for h2 */
      lineHeight: number;
      /** Letter spacing for h2 */
      letterSpacing: string;
    };
    /** h3 heading style */
    h3: {
      /** Font size for h3 */
      fontSize: string;
      /** Font weight for h3 */
      fontWeight: number;
      /** Line height for h3 */
      lineHeight: number;
      /** Letter spacing for h3 */
      letterSpacing: string;
    };
    /** h4 heading style */
    h4: {
      /** Font size for h4 */
      fontSize: string;
      /** Font weight for h4 */
      fontWeight: number;
      /** Line height for h4 */
      lineHeight: number;
      /** Letter spacing for h4 */
      letterSpacing: string;
    };
    /** h5 heading style */
    h5: {
      /** Font size for h5 */
      fontSize: string;
      /** Font weight for h5 */
      fontWeight: number;
      /** Line height for h5 */
      lineHeight: number;
      /** Letter spacing for h5 */
      letterSpacing: string;
    };
    /** h6 heading style */
    h6: {
      /** Font size for h6 */
      fontSize: string;
      /** Font weight for h6 */
      fontWeight: number;
      /** Line height for h6 */
      lineHeight: number;
      /** Letter spacing for h6 */
      letterSpacing: string;
    };
  };
  /** Body text styles for different sizes */
  body: {
    /** Large body text style */
    large: {
      /** Font size for large body text */
      fontSize: string;
      /** Font weight for large body text */
      fontWeight: number;
      /** Line height for large body text */
      lineHeight: number;
      /** Letter spacing for large body text */
      letterSpacing: string;
    };
    /** Medium body text style (default) */
    medium: {
      /** Font size for medium body text */
      fontSize: string;
      /** Font weight for medium body text */
      fontWeight: number;
      /** Line height for medium body text */
      lineHeight: number;
      /** Letter spacing for medium body text */
      letterSpacing: string;
    };
    /** Small body text style */
    small: {
      /** Font size for small body text */
      fontSize: string;
      /** Font weight for small body text */
      fontWeight: number;
      /** Line height for small body text */
      lineHeight: number;
      /** Letter spacing for small body text */
      letterSpacing: string;
    };
  };
  /** Caption text styles */
  caption: {
    /** Primary caption style */
    primary: {
      /** Font size for primary caption */
      fontSize: string;
      /** Font weight for primary caption */
      fontWeight: number;
      /** Line height for primary caption */
      lineHeight: number;
      /** Letter spacing for primary caption */
      letterSpacing: string;
    };
    /** Secondary caption style */
    secondary: {
      /** Font size for secondary caption */
      fontSize: string;
      /** Font weight for secondary caption */
      fontWeight: number;
      /** Line height for secondary caption */
      lineHeight: number;
      /** Letter spacing for secondary caption */
      letterSpacing: string;
    };
  };
  /** Button text styles */
  button: {
    /** Primary button text style */
    primary: {
      /** Font size for primary button */
      fontSize: string;
      /** Font weight for primary button */
      fontWeight: number;
      /** Line height for primary button */
      lineHeight: number;
      /** Letter spacing for primary button */
      letterSpacing: string;
      /** Text transform for primary button */
      textTransform: string;
    };
    /** Secondary button text style */
    secondary: {
      /** Font size for secondary button */
      fontSize: string;
      /** Font weight for secondary button */
      fontWeight: number;
      /** Line height for secondary button */
      lineHeight: number;
      /** Letter spacing for secondary button */
      letterSpacing: string;
      /** Text transform for secondary button */
      textTransform: string;
    };
  };
}

/**
 * Interface for accessibility-focused typography properties
 * Ensures text meets accessibility standards
 */
export interface AccessibilityTypographyProperties {
  /** Minimum font size to ensure readability */
  minimumFontSize: number;
  /** Minimum contrast ratio for text */
  minimumContrastRatio: number;
  /** Recommended line height for readable text */
  recommendedLineHeight: number;
  /** Maximum characters per line for readability */
  maxCharactersPerLine: number;
}

/**
 * Main typography token interface
 * Combines all typography-related interfaces
 */
export interface TypographyTokens {
  /** Font family definitions */
  fontFamily: FontFamilyTokens;
  /** Font weight definitions */
  fontWeight: FontWeightTokens;
  /** Font size definitions with units */
  fontSize: FontSizeTokens;
  /** Line height definitions */
  lineHeight: LineHeightTokens;
  /** Letter spacing definitions */
  letterSpacing: LetterSpacingTokens;
  /** Raw numeric font size values for calculations */
  fontSizeValues: Record<keyof FontSizeTokens, number>;
  /** Responsive typography scaling factors */
  responsiveScaling: ResponsiveTypographyScaling;
  /** Language-specific typography adjustments */
  languageAdjustments: LanguageTypographyAdjustments;
  /** Compound typography styles for common patterns */
  compound: CompoundTypographyStyles;
  /** Accessibility-focused typography properties */
  accessibility: AccessibilityTypographyProperties;
}

/**
 * Raw numeric font size values in pixels, providing a scale from extra small to extra-extra-extra large.
 * These values can be used for programmatic calculations when raw numbers are needed.
 */
export const fontSizeValues = {
  xs: 12,  // Extra small text (captions, footnotes)
  sm: 14,  // Small text (secondary text, labels)
  md: 16,  // Medium text (body text - default)
  lg: 18,  // Large text (emphasized body text)
  xl: 20,  // Extra large text (subheadings, card titles)
  '2xl': 24, // 2x Extra large (section headers)
  '3xl': 30, // 3x Extra large (page titles)
  '4xl': 36, // 4x Extra large (hero text, major headings)
};

/**
 * Platform-specific font family definitions
 * Provides appropriate font stacks for web and native platforms
 */
const getFontFamilies = (): FontFamilyTokens => {
  // Check if we're in a React Native environment
  const isNative = typeof Platform !== 'undefined';
  
  if (isNative) {
    // React Native platform-specific fonts
    return {
      base: Platform.select({
        ios: 'Roboto, System',
        android: 'Roboto, sans-serif',
        default: 'Roboto, sans-serif',
      }) as string,
      heading: Platform.select({
        ios: 'Roboto, System',
        android: 'Roboto, sans-serif',
        default: 'Roboto, sans-serif',
      }) as string,
      mono: Platform.select({
        ios: 'Roboto Mono, Courier',
        android: 'Roboto Mono, monospace',
        default: 'Roboto Mono, monospace',
      }) as string,
      system: Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'system-ui',
      }) as string,
    };
  }
  
  // Web font stacks with appropriate fallbacks
  return {
    base: 'Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    heading: 'Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };
};

/**
 * Typography values defining font families, weights, sizes, line heights, and letter spacing 
 * for consistent text styling across all journeys of the AUSTA SuperApp.
 * 
 * These values support both Brazilian Portuguese and English content while maintaining
 * optimal readability and accessibility compliance.
 */
export const typography: TypographyTokens = {
  /**
   * Font families used throughout the application
   * Optimized for both web and native platforms
   */
  fontFamily: getFontFamilies(),
  
  /**
   * Font weights for different text styles
   * Following the standard font weight system
   */
  fontWeight: {
    light: 300,    // Light weight for subtle emphasis
    regular: 400,  // Regular weight for most text
    medium: 500,   // Medium weight for semi-emphasis and subheadings
    semiBold: 600, // Semi-bold weight for stronger emphasis
    bold: 700,     // Bold weight for strong emphasis and headings
  },
  
  /**
   * Font sizes with pixel units
   * Follows a typographic scale for consistent visual hierarchy
   */
  fontSize: {
    xs: `${fontSizeValues.xs}px`,     // Extra small: 12px
    sm: `${fontSizeValues.sm}px`,     // Small: 14px
    md: `${fontSizeValues.md}px`,     // Medium: 16px (base)
    lg: `${fontSizeValues.lg}px`,     // Large: 18px
    xl: `${fontSizeValues.xl}px`,     // Extra large: 20px
    '2xl': `${fontSizeValues['2xl']}px`, // 2x Extra large: 24px
    '3xl': `${fontSizeValues['3xl']}px`, // 3x Extra large: 30px
    '4xl': `${fontSizeValues['4xl']}px`, // 4x Extra large: 36px
  },
  
  /**
   * Line heights for different text densities
   * Ensures proper readability and accessibility
   */
  lineHeight: {
    tight: 1.2,    // Tight spacing, good for headings and short text
    base: 1.5,     // Base spacing, optimal for body text and readability
    relaxed: 1.75, // Relaxed spacing, good for larger text and better readability
    loose: 2.0,    // Extra relaxed spacing, maximum spacing for specialized content
  },
  
  /**
   * Letter spacing for different text styles
   * Improves readability based on text size and purpose
   */
  letterSpacing: {
    tighter: '-0.05em',  // Tighter letter spacing for large headings
    tight: '-0.025em',   // Tight letter spacing for headings and display text
    normal: '0',         // Normal letter spacing for body text
    wide: '0.025em',     // Wide letter spacing for improved legibility in small text
    wider: '0.05em',     // Wider letter spacing for maximum legibility in very small text
  },
  
  /**
   * Raw numeric font size values for calculations
   * Matches the fontSizeValues export
   */
  fontSizeValues,
  
  /**
   * Responsive typography scaling factors
   * Adjusts typography based on viewport size
   */
  responsiveScaling: {
    base: 1.0,    // Base multiplier (default size)
    mobile: 0.85, // Mobile multiplier (slightly smaller)
    tablet: 0.9,  // Tablet multiplier
    desktop: 1.0, // Desktop multiplier (standard size)
    large: 1.1,   // Large screen multiplier (slightly larger)
  },
  
  /**
   * Language-specific typography adjustments
   * Optimizes typography for different languages
   */
  languageAdjustments: {
    // English typography adjustments
    en: {
      letterSpacing: {
        heading: '-0.025em', // Slightly tighter for English headings
        body: '0',          // Normal for English body text
      },
      lineHeight: {
        heading: 1.2,  // Tighter line height for English headings
        body: 1.5,     // Standard line height for English body text
      },
    },
    // Portuguese typography adjustments
    pt: {
      letterSpacing: {
        heading: '-0.01em', // Less tight for Portuguese headings (longer words)
        body: '0.01em',     // Slightly wider for Portuguese body text
      },
      lineHeight: {
        heading: 1.3,  // Slightly more relaxed for Portuguese headings
        body: 1.6,     // More relaxed for Portuguese body text (accents)
      },
    },
  },
  
  /**
   * Compound typography styles for common patterns
   * Provides predefined text styles for consistent usage
   */
  compound: {
    // Heading styles (h1-h6)
    heading: {
      h1: {
        fontSize: `${fontSizeValues['4xl']}px`,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: `${fontSizeValues['3xl']}px`,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: `${fontSizeValues['2xl']}px`,
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontSize: `${fontSizeValues.xl}px`,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
      },
      h5: {
        fontSize: `${fontSizeValues.lg}px`,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontSize: `${fontSizeValues.md}px`,
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '-0.005em',
      },
    },
    // Body text styles
    body: {
      large: {
        fontSize: `${fontSizeValues.lg}px`,
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '0',
      },
      medium: {
        fontSize: `${fontSizeValues.md}px`,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0',
      },
      small: {
        fontSize: `${fontSizeValues.sm}px`,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
      },
    },
    // Caption styles
    caption: {
      primary: {
        fontSize: `${fontSizeValues.sm}px`,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: '0.01em',
      },
      secondary: {
        fontSize: `${fontSizeValues.xs}px`,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: '0.02em',
      },
    },
    // Button text styles
    button: {
      primary: {
        fontSize: `${fontSizeValues.md}px`,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      },
      secondary: {
        fontSize: `${fontSizeValues.sm}px`,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      },
    },
  },
  
  /**
   * Accessibility-focused typography properties
   * Ensures text meets accessibility standards
   */
  accessibility: {
    minimumFontSize: 12,       // Minimum font size to ensure readability
    minimumContrastRatio: 4.5,  // Minimum contrast ratio for text (WCAG AA)
    recommendedLineHeight: 1.5, // Recommended line height for readable text
    maxCharactersPerLine: 80,   // Maximum characters per line for readability
  },
};