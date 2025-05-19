import { baseTheme } from './base.theme';
import { colors, shadows } from '@design-system/primitives/src/tokens';
import { CareTheme } from '@austa/interfaces/themes';

/**
 * Care Journey Theme
 * 
 * This theme extends the base theme with specific styling for the "Cuidar-me Agora" journey.
 * It uses an orange color palette (#FF8C42) to visually distinguish the Care journey from other journeys,
 * creating a consistent visual identity throughout the user experience.
 *
 * @remarks
 * The Care theme implements component-specific styling overrides for buttons, cards, inputs,
 * progress indicators, and care-specific components like AppointmentCard, ProviderCard, and MedicationCard.
 */
export const careTheme: CareTheme = {
  ...baseTheme,
  
  // Journey identification
  name: 'Care Theme',
  journeyKey: 'care',
  
  // Override colors with Care-specific values
  colors: {
    ...baseTheme.colors,
    primary: colors.journeys.care.primary,
    secondary: colors.journeys.care.secondary,
    accent: colors.journeys.care.accent,
    background: colors.journeys.care.background,
    text: colors.journeys.care.text,
    border: colors.journeys.care.secondary,
    focus: colors.journeys.care.primary,
  },
  
  // Override shadows with Care-specific values
  shadows: {
    ...baseTheme.shadows,
    focus: `0 0 0 2px ${colors.journeys.care.primary}`,
    card: shadows.sm,
    elevated: shadows.md,
  },
  
  // Component-specific styling for the Care journey
  components: {
    // Button variants
    button: {
      primary: {
        background: colors.journeys.care.primary,
        color: colors.neutral.white,
        hoverBackground: colors.journeys.care.secondary,
        activeBackground: colors.journeys.care.accent,
        disabledBackground: `${colors.journeys.care.primary}80`, // 50% opacity
        disabledColor: `${colors.neutral.white}CC`, // 80% opacity
        focusRing: `0 0 0 2px ${colors.journeys.care.secondary}`,
      },
      secondary: {
        background: 'transparent',
        color: colors.journeys.care.primary,
        border: `1px solid ${colors.journeys.care.primary}`,
        hoverBackground: colors.journeys.care.background,
        hoverBorder: `1px solid ${colors.journeys.care.secondary}`,
        activeBackground: colors.journeys.care.background,
        activeBorder: `1px solid ${colors.journeys.care.accent}`,
        disabledBackground: 'transparent',
        disabledColor: `${colors.journeys.care.primary}80`, // 50% opacity
        disabledBorder: `1px solid ${colors.journeys.care.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.care.secondary}`,
      },
      text: {
        background: 'transparent',
        color: colors.journeys.care.primary,
        hoverColor: colors.journeys.care.secondary,
        activeColor: colors.journeys.care.accent,
        disabledColor: `${colors.journeys.care.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.care.secondary}`,
      },
    },
    
    // Card styling
    card: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.care.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      activeShadow: shadows.sm,
    },
    
    // Input styling
    input: {
      border: `1px solid ${colors.neutral.gray400}`,
      focusBorder: `1px solid ${colors.journeys.care.primary}`,
      background: colors.neutral.white,
      placeholderColor: colors.neutral.gray500,
      errorBorder: `1px solid ${colors.semantic.error}`,
      errorBackground: `${colors.semantic.error}10`, // 10% opacity
      disabledBackground: colors.neutral.gray100,
      disabledBorder: `1px solid ${colors.neutral.gray300}`,
      disabledColor: colors.neutral.gray500,
    },
    
    // Progress indicators
    progressBar: {
      background: colors.neutral.gray200,
      fill: colors.journeys.care.primary,
      borderRadius: '4px',
      height: '8px',
    },
    
    progressCircle: {
      background: colors.neutral.gray200,
      fill: colors.journeys.care.primary,
      width: '48px',
      strokeWidth: '4px',
    },
    
    // Care journey specific components
    appointmentCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.care.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      statusColors: {
        scheduled: colors.journeys.care.primary,
        confirmed: colors.semantic.success,
        canceled: colors.semantic.error,
        completed: colors.neutral.gray600,
      },
      iconColor: colors.journeys.care.primary,
    },
    
    providerCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      specialtyColor: colors.journeys.care.secondary,
      ratingColor: colors.journeys.care.accent,
      availabilityColor: colors.semantic.success,
    },
    
    medicationCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconBackground: colors.journeys.care.background,
      iconColor: colors.journeys.care.primary,
      reminderBackground: `${colors.journeys.care.background}30`, // 30% opacity
      reminderBorder: `1px solid ${colors.journeys.care.primary}`,
      statusColors: {
        active: colors.semantic.success,
        paused: colors.semantic.warning,
        discontinued: colors.semantic.error,
      },
    },
    
    symptomCheckerCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconColor: colors.journeys.care.primary,
      severityColors: {
        low: colors.semantic.success,
        medium: colors.semantic.warning,
        high: colors.semantic.error,
      },
      actionButtonBackground: colors.journeys.care.primary,
      actionButtonColor: colors.neutral.white,
    },
    
    telemedicineCard: {
      background: colors.journeys.care.primary,
      color: colors.neutral.white,
      borderRadius: '12px',
      shadow: shadows.md,
      secondaryColor: colors.journeys.care.accent,
      highlightColor: colors.journeys.care.secondary,
      statusColors: {
        available: colors.semantic.success,
        busy: colors.semantic.warning,
        offline: colors.neutral.gray500,
      },
    },
    
    treatmentPlanCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderTop: `4px solid ${colors.journeys.care.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconColor: colors.journeys.care.primary,
      progressBackground: colors.neutral.gray200,
      progressFill: colors.journeys.care.primary,
      highlightBackground: `${colors.journeys.care.background}50`, // 50% opacity
      highlightText: colors.journeys.care.primary,
    },
  },
};