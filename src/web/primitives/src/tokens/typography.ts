/**
 * Typography Token System
 * 
 * Defines the comprehensive typographic system for the AUSTA SuperApp design system,
 * providing font families, weights, sizes, line heights, and letter spacing optimized
 * for bilingual support (Portuguese and English).
 * 
 * This implementation supports both web and mobile platforms through platform-specific
 * font family fallbacks and responsive scaling.
 */

/**
 * Typography token interface for font families
 * Provides type safety for font family definitions with platform-specific fallbacks
 */
export interface FontFamilyTokens {
  /** Base text for all general content */
  base: string;
  /** Headings and titles */
  heading: string;
  /** Monospaced text for code, metrics, etc. */
  mono: string;
  /** Platform-specific font family mapping */
  platforms: {
    web: {
      base: string;
      heading: string;
      mono: string;
    };
    native: {
      base: string;
      heading: string;
      mono: string;
    };
  };
}

/**
 * Typography token interface for font weights
 * Provides type safety for font weight definitions
 */
export interface FontWeightTokens {
  /** Regular weight for most text (400) */
  regular: number;
  /** Medium weight for semi-emphasis and subheadings (500) */
  medium: number;
  /** Bold weight for strong emphasis and headings (700) */
  bold: number;
}

/**
 * Typography token interface for font sizes
 * Provides type safety for font size definitions with numeric values for calculations
 */
export interface FontSizeTokens {
  /** Extra small: 12px (captions, footnotes) */
  xs: string;
  /** Small: 14px (secondary text, labels) */
  sm: string;
  /** Medium: 16px (body text - default) */
  md: string;
  /** Large: 18px (emphasized body text) */
  lg: string;
  /** Extra large: 20px (subheadings, card titles) */
  xl: string;
  /** 2x Extra large: 24px (section headers) */
  '2xl': string;
  /** 3x Extra large: 30px (page titles) */
  '3xl': string;
  /** 4x Extra large: 36px (hero text, major headings) */
  '4xl': string;
}

/**
 * Typography token interface for line heights
 * Provides type safety for line height definitions
 */
export interface LineHeightTokens {
  /** Tight spacing (1.2), good for headings and short text */
  tight: number;
  /** Base spacing (1.5), optimal for body text and readability */
  base: number;
  /** Relaxed spacing (1.75), good for larger text and better readability */
  relaxed: number;
}

/**
 * Typography token interface for letter spacing
 * Provides type safety for letter spacing definitions
 */
export interface LetterSpacingTokens {
  /** Tight letter spacing for headings and display text */
  tight: string;
  /** Normal letter spacing for body text */
  normal: string;
  /** Wide letter spacing for improved legibility in small text */
  wide: string;
}

/**
 * Typography token interface for responsive scaling
 * Provides type safety for responsive typography scaling factors
 */
export interface ResponsiveScalingTokens {
  /** Mobile scaling factor (1.0 - base size) */
  mobile: number;
  /** Tablet scaling factor (1.1 - slightly larger) */
  tablet: number;
  /** Desktop scaling factor (1.2 - larger for desktop viewing) */
  desktop: number;
  /** Large desktop scaling factor (1.3 - largest for big screens) */
  largeDesktop: number;
}

/**
 * Typography token interface for language-specific optimizations
 * Provides type safety for language-specific typography adjustments
 */
export interface LanguageOptimizationTokens {
  /** Portuguese language optimizations */
  portuguese: {
    /** Letter spacing adjustment for Portuguese (-0.01em tighter than English) */
    letterSpacingAdjustment: string;
    /** Line height adjustment for Portuguese (1.1x multiplier for accented characters) */
    lineHeightMultiplier: number;
  };
  /** English language optimizations */
  english: {
    /** Letter spacing adjustment for English (base value) */
    letterSpacingAdjustment: string;
    /** Line height adjustment for English (base value) */
    lineHeightMultiplier: number;
  };
}

/**
 * Typography token interface for accessibility properties
 * Provides type safety for accessibility-focused typography properties
 */
export interface AccessibilityTokens {
  /** Minimum font size for readability (12px) */
  minimumFontSize: string;
  /** Minimum contrast ratio for text (4.5:1 for WCAG AA compliance) */
  minimumContrastRatio: number;
  /** Preferred text colors for maximum readability */
  preferredTextColors: {
    /** Dark text on light backgrounds */
    onLight: string;
    /** Light text on dark backgrounds */
    onDark: string;
  };
}

/**
 * Typography token interface for compound typography styles
 * Provides type safety for predefined typography combinations
 */
export interface CompoundTypographyTokens {
  /** Heading styles for different levels */
  heading: {
    /** h1 style - largest heading */
    h1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** h2 style - second level heading */
    h2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** h3 style - third level heading */
    h3: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** h4 style - fourth level heading */
    h4: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
  };
  /** Body text styles for different purposes */
  body: {
    /** Default body text */
    default: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** Emphasized body text */
    emphasis: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** Small body text */
    small: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
  };
  /** Caption and label styles */
  caption: {
    /** Default caption style */
    default: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    /** Emphasized caption style */
    emphasis: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
  };
}

/**
 * Complete typography token interface
 * Combines all typography token interfaces into a single comprehensive interface
 */
export interface TypographyTokens {
  fontFamily: FontFamilyTokens;
  fontWeight: FontWeightTokens;
  fontSize: FontSizeTokens;
  lineHeight: LineHeightTokens;
  letterSpacing: LetterSpacingTokens;
  responsiveScaling: ResponsiveScalingTokens;
  languageOptimization: LanguageOptimizationTokens;
  accessibility: AccessibilityTokens;
  compound: CompoundTypographyTokens;
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
 * Typography tokens defining font families, weights, sizes, line heights, and letter spacing 
 * for consistent text styling across all journeys of the AUSTA SuperApp.
 * 
 * These values support both Brazilian Portuguese and English content while maintaining
 * optimal readability and accessibility compliance.
 */
export const typography: TypographyTokens = {
  /**
   * Font families used throughout the application with platform-specific fallbacks
   */
  fontFamily: {
    base: 'Inter, sans-serif',     // Base text for all general content
    heading: 'Inter, sans-serif',  // Headings and titles
    mono: 'Roboto Mono, monospace', // Monospaced text for code, metrics, etc.
    platforms: {
      web: {
        base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      native: {
        base: 'Inter',
        heading: 'Inter',
        mono: 'Roboto Mono',
      },
    },
  },
  
  /**
   * Font weights for different text styles
   * Following the Inter font weight system
   */
  fontWeight: {
    regular: 400, // Regular weight for most text
    medium: 500,  // Medium weight for semi-emphasis and subheadings
    bold: 700,    // Bold weight for strong emphasis and headings
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
  },
  
  /**
   * Letter spacing for different text styles
   * Improves readability based on text size and purpose
   */
  letterSpacing: {
    tight: '-0.025em', // Tight letter spacing for headings and display text
    normal: '0',       // Normal letter spacing for body text
    wide: '0.025em',   // Wide letter spacing for improved legibility in small text
  },

  /**
   * Responsive scaling factors for different viewport sizes
   * Enables responsive typography that adapts to screen size
   */
  responsiveScaling: {
    mobile: 1.0,      // Base size for mobile devices
    tablet: 1.1,      // Slightly larger for tablet devices
    desktop: 1.2,     // Larger for desktop screens
    largeDesktop: 1.3, // Largest for large desktop screens
  },

  /**
   * Language-specific optimizations for typography
   * Adjusts letter spacing and line height for different languages
   */
  languageOptimization: {
    portuguese: {
      letterSpacingAdjustment: '-0.01em', // Slightly tighter for Portuguese
      lineHeightMultiplier: 1.1,         // Slightly taller for accented characters
    },
    english: {
      letterSpacingAdjustment: '0',      // Base letter spacing for English
      lineHeightMultiplier: 1.0,         // Base line height for English
    },
  },

  /**
   * Accessibility-focused typography properties
   * Ensures readability and compliance with accessibility standards
   */
  accessibility: {
    minimumFontSize: '12px',           // Minimum font size for readability
    minimumContrastRatio: 4.5,          // WCAG AA compliance for normal text
    preferredTextColors: {
      onLight: 'rgba(0, 0, 0, 0.87)',   // Dark text on light backgrounds
      onDark: 'rgba(255, 255, 255, 0.87)', // Light text on dark backgrounds
    },
  },

  /**
   * Compound typography styles for common text patterns
   * Provides consistent typography combinations for different purposes
   */
  compound: {
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
        lineHeight: 1.3,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: `${fontSizeValues['2xl']}px`,
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontSize: `${fontSizeValues.xl}px`,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
    },
    body: {
      default: {
        fontSize: `${fontSizeValues.md}px`,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0',
      },
      emphasis: {
        fontSize: `${fontSizeValues.md}px`,
        fontWeight: 500,
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
    caption: {
      default: {
        fontSize: `${fontSizeValues.xs}px`,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.025em',
      },
      emphasis: {
        fontSize: `${fontSizeValues.xs}px`,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.025em',
      },
    },
  },
};

/**
 * Default export of the typography tokens
 */
export default typography;