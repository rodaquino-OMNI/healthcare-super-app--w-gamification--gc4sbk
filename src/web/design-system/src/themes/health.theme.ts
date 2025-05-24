/**
 * Health Journey Theme
 * 
 * This file defines the theme for the Health journey ("Minha Saúde") in the AUSTA SuperApp.
 * It extends the base theme with a green-focused color palette and journey-specific
 * component style overrides for Health journey UI components.
 */

import { baseTheme } from './base.theme';
import { colors } from '@design-system/primitives/src/tokens';
import { HealthTheme } from '@austa/interfaces/themes';

/**
 * Health Theme
 * Extends the base theme with Health journey-specific styling
 */
export const healthTheme: HealthTheme = {
  ...baseTheme,
  journey: 'health',
  accentColor: colors.journeys.health.primary, // Primary green color
  
  // Health-specific semantic colors
  healthSemantic: {
    // Health metrics colors
    metricHigh: colors.semantic.warning,
    metricNormal: colors.semantic.success,
    metricLow: colors.semantic.info,
    metricCritical: colors.semantic.error,
    
    // Goal status colors
    goalComplete: colors.semantic.success,
    goalInProgress: colors.journeys.health.primary,
    goalBehind: colors.semantic.warning,
    
    // Device connection status
    deviceConnected: colors.semantic.success,
    deviceDisconnected: colors.neutral.gray400,
    deviceSyncing: colors.journeys.health.secondary,
    
    // Health insight colors
    insightPositive: colors.semantic.success,
    insightNeutral: colors.journeys.health.secondary,
    insightNegative: colors.semantic.error,
    insightActionable: colors.journeys.health.accent
  },
  
  // Health-specific component variations
  components: {
    // Card variations
    metricCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.health.primary_10}, ${colors.journeys.health.background})`
    },
    goalCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.health.primary_10}, ${colors.journeys.health.background})`
    },
    deviceCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.health.primary_10}, ${colors.journeys.health.background})`
    },
    
    // Chart variations
    healthChart: {
      lineColor: colors.journeys.health.primary,
      gridColor: colors.neutral.gray200,
      labelColor: colors.neutral.gray700,
      tooltipBg: colors.neutral.white
    },
    
    // Override base component styles with health-specific styling
    Button: {
      ...baseTheme.components.Button,
      variants: {
        ...baseTheme.components.Button.variants,
        primary: {
          backgroundColor: colors.journeys.health.primary,
          color: colors.accessibility.getJourneyContrastText('health', 'primary'),
          hoverBackgroundColor: colors.journeys.health.primary_dark,
          activeBackgroundColor: colors.journeys.health.primary_light,
          disabledBackgroundColor: colors.journeys.health.primary_30,
          disabledColor: colors.neutral.gray500
        },
        secondary: {
          backgroundColor: colors.journeys.health.secondary,
          color: colors.accessibility.getJourneyContrastText('health', 'secondary'),
          hoverBackgroundColor: colors.journeys.health.secondary_token._dark,
          activeBackgroundColor: colors.journeys.health.secondary_token._light,
          disabledBackgroundColor: colors.journeys.health.secondary_token._30,
          disabledColor: colors.neutral.gray500
        },
        outline: {
          ...baseTheme.components.Button.variants.outline,
          color: colors.journeys.health.primary,
          borderColor: colors.journeys.health.primary,
          hoverBorderColor: colors.journeys.health.primary_dark,
          activeBorderColor: colors.journeys.health.primary_light
        },
        text: {
          ...baseTheme.components.Button.variants.text,
          color: colors.journeys.health.primary
        }
      }
    },
    
    Card: {
      ...baseTheme.components.Card,
      boxShadow: baseTheme.shadows.md,
      borderRadius: baseTheme.borderRadius.lg,
      header: {
        ...baseTheme.components.Card.header,
        backgroundColor: colors.journeys.health.background
      }
    },
    
    Input: {
      ...baseTheme.components.Input,
      focusBorderColor: colors.journeys.health.primary
    },
    
    ProgressBar: {
      ...baseTheme.components.ProgressBar,
      filledColor: colors.journeys.health.primary
    },
    
    ProgressCircle: {
      ...baseTheme.components.ProgressCircle,
      filledColor: colors.journeys.health.primary
    }
  },
  
  // Health-specific typography variations
  typography: {
    ...baseTheme.typography,
    metricValue: {
      fontFamily: baseTheme.typography.fontFamily.heading,
      fontSize: baseTheme.typography.fontSize['2xl'],
      fontWeight: baseTheme.typography.fontWeight.bold,
      lineHeight: baseTheme.typography.lineHeight.tight
    },
    goalHeading: {
      fontFamily: baseTheme.typography.fontFamily.heading,
      fontSize: baseTheme.typography.fontSize.lg,
      fontWeight: baseTheme.typography.fontWeight.medium,
      lineHeight: baseTheme.typography.lineHeight.base
    },
    insightText: {
      fontFamily: baseTheme.typography.fontFamily.base,
      fontSize: baseTheme.typography.fontSize.md,
      fontWeight: baseTheme.typography.fontWeight.regular,
      lineHeight: baseTheme.typography.lineHeight.relaxed
    }
  }
};