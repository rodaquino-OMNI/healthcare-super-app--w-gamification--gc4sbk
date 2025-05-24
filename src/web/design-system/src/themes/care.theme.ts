/**
 * Care Journey Theme
 * 
 * This file defines the theme for the Care journey ("Cuidar-me Agora") in the AUSTA SuperApp.
 * It extends the base theme with Care-specific styling, including an orange-based color palette,
 * custom shadows, and detailed component style overrides.
 */

import { colors } from '@design-system/primitives/src/tokens';
import { CareTheme } from '@austa/interfaces/themes';
import { baseTheme } from './base.theme';

/**
 * Care Journey Theme
 * Extends the base theme with Care-specific styling (orange-based palette)
 */
export const careTheme: CareTheme = {
  ...baseTheme,
  journey: {
    key: 'care',
    palette: colors.journeys.care,
  },
  // Override component styles with Care-specific styling
  components: {
    ...baseTheme.components,
    // Button component overrides
    Button: {
      ...baseTheme.components.Button,
      variants: {
        ...baseTheme.components.Button.variants,
        primary: {
          ...baseTheme.components.Button.variants.primary,
          backgroundColor: colors.journeys.care.primary,
          color: colors.accessibility.getJourneyContrastText('care', 'primary'),
          hoverBackgroundColor: colors.journeys.care.primary_dark,
          activeBackgroundColor: colors.journeys.care.primary_light,
          disabledBackgroundColor: colors.journeys.care.primary_30,
          disabledColor: colors.neutral.gray600,
        },
        secondary: {
          ...baseTheme.components.Button.variants.secondary,
          backgroundColor: colors.journeys.care.secondary,
          color: colors.accessibility.getJourneyContrastText('care', 'secondary'),
          hoverBackgroundColor: colors.journeys.care.primary_70,
          activeBackgroundColor: colors.journeys.care.primary_90,
          disabledBackgroundColor: colors.journeys.care.primary_20,
          disabledColor: colors.neutral.gray600,
        },
        outline: {
          ...baseTheme.components.Button.variants.outline,
          backgroundColor: 'transparent',
          color: colors.journeys.care.primary,
          borderColor: colors.journeys.care.primary,
          hoverBackgroundColor: colors.journeys.care.primary_10,
          hoverBorderColor: colors.journeys.care.primary_dark,
          activeBackgroundColor: colors.journeys.care.primary_20,
          activeBorderColor: colors.journeys.care.primary,
          disabledBackgroundColor: 'transparent',
          disabledBorderColor: colors.journeys.care.primary_30,
          disabledColor: colors.journeys.care.primary_30,
        },
        text: {
          ...baseTheme.components.Button.variants.text,
          backgroundColor: 'transparent',
          color: colors.journeys.care.primary,
          hoverBackgroundColor: colors.journeys.care.primary_10,
          activeBackgroundColor: colors.journeys.care.primary_20,
          disabledBackgroundColor: 'transparent',
          disabledColor: colors.journeys.care.primary_30,
        },
      },
    },
    
    // Card component overrides
    Card: {
      ...baseTheme.components.Card,
      backgroundColor: colors.neutral.white,
      borderRadius: baseTheme.borderRadius.lg,
      boxShadow: baseTheme.shadows.md,
      header: {
        ...baseTheme.components.Card.header,
        backgroundColor: colors.journeys.care.primary_10,
      },
      footer: {
        ...baseTheme.components.Card.footer,
        backgroundColor: colors.journeys.care.primary_10,
      },
    },
    
    // Input component overrides
    Input: {
      ...baseTheme.components.Input,
      focusBorderColor: colors.journeys.care.primary,
      errorBorderColor: colors.semantic.error,
    },
    
    // ProgressBar component overrides
    ProgressBar: {
      ...baseTheme.components.ProgressBar,
      filledColor: colors.journeys.care.primary,
    },
    
    // ProgressCircle component overrides
    ProgressCircle: {
      ...baseTheme.components.ProgressCircle,
      filledColor: colors.journeys.care.primary,
    },
    
    // Care-specific component overrides
    appointmentCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.care.primary_10}, ${colors.journeys.care.primary_20})`,
      statusColors: {
        scheduled: colors.contextual.care.info,
        confirmed: colors.contextual.care.success,
        cancelled: colors.contextual.care.error,
        completed: colors.neutral.gray500,
      },
    },
    
    providerCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.neutral.white}, ${colors.journeys.care.primary_10})`,
      availabilityColors: {
        available: colors.contextual.care.success,
        busy: colors.contextual.care.warning,
        unavailable: colors.contextual.care.error,
      },
    },
    
    medicationCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.neutral.white}, ${colors.journeys.care.primary_10})`,
      statusColors: {
        active: colors.contextual.care.success,
        expired: colors.contextual.care.error,
        refillNeeded: colors.contextual.care.warning,
      },
    },
    
    videoConsultation: {
      controlsBg: colors.neutral.gray900,
      iconColor: colors.neutral.white,
      borderColor: colors.journeys.care.primary,
      buttonColor: colors.journeys.care.primary,
    },
    
    symptomSelector: {
      activeBg: colors.journeys.care.primary_20,
      hoverBg: colors.journeys.care.primary_10,
      borderColor: colors.journeys.care.primary_30,
      severityColors: {
        mild: colors.contextual.care.info,
        moderate: colors.contextual.care.warning,
        severe: colors.contextual.care.error,
      },
    },
  },
  
  // Care-specific semantic colors
  careSemantic: {
    appointmentScheduled: colors.contextual.care.info,
    appointmentConfirmed: colors.contextual.care.success,
    appointmentCancelled: colors.contextual.care.error,
    appointmentCompleted: colors.neutral.gray500,
    
    providerAvailable: colors.contextual.care.success,
    providerBusy: colors.contextual.care.warning,
    providerUnavailable: colors.contextual.care.error,
    
    medicationActive: colors.contextual.care.success,
    medicationExpired: colors.contextual.care.error,
    medicationRefillNeeded: colors.contextual.care.warning,
    
    symptomMild: colors.journeys.care.primary_50,
    symptomModerate: colors.contextual.care.warning,
    symptomSevere: colors.contextual.care.error,
    
    teleMedicineAvailable: colors.contextual.care.success,
    teleMedicineInProgress: colors.journeys.care.primary,
    teleMedicineEnded: colors.neutral.gray500,
  },
  
  // Care-specific typography variations
  typography: {
    ...baseTheme.typography,
    providerName: {
      fontFamily: baseTheme.typography.fontFamily.heading,
      fontSize: baseTheme.typography.fontSize.lg,
      fontWeight: baseTheme.typography.fontWeight.bold,
      lineHeight: baseTheme.typography.lineHeight.base,
    },
    appointmentTime: {
      fontFamily: baseTheme.typography.fontFamily.mono,
      fontSize: baseTheme.typography.fontSize.md,
      fontWeight: baseTheme.typography.fontWeight.medium,
      lineHeight: baseTheme.typography.lineHeight.tight,
    },
    medicationName: {
      fontFamily: baseTheme.typography.fontFamily.base,
      fontSize: baseTheme.typography.fontSize.md,
      fontWeight: baseTheme.typography.fontWeight.bold,
      lineHeight: baseTheme.typography.lineHeight.base,
    },
  },
  
  // Set accent color for the Care journey
  accentColor: colors.journeys.care.accent,
};