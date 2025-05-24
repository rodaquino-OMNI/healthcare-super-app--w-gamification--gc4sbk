/**
 * Plan Journey Theme
 * 
 * This theme extends the base theme with specific styling for the "My Plan & Benefits" journey.
 * It uses a blue color palette to visually distinguish the Plan journey from other journeys,
 * creating a consistent visual identity throughout the user experience.
 */

import { baseTheme } from './base.theme';
import { colors } from '@design-system/primitives/src/tokens/colors';
import { shadows } from '@design-system/primitives/src/tokens/shadows';
import { PlanTheme } from '@austa/interfaces/themes/journey-themes.types';

/**
 * Plan Journey Theme
 * 
 * Implements the blue-based palette with plan-specific component styling for the
 * "Meu Plano & Benefícios" journey of the AUSTA SuperApp.
 */
export const planTheme: PlanTheme = {
  ...baseTheme,
  
  // Journey identification
  journey: 'plan',
  accentColor: colors.journeys.plan.primary,
  
  // Override colors with Plan-specific values
  colors: {
    ...baseTheme.colors,
    primary: colors.journeys.plan.primary,
    secondary: colors.journeys.plan.secondary,
    accent: colors.journeys.plan.accent,
    background: colors.journeys.plan.background,
    text: colors.journeys.plan.text,
    border: colors.journeys.plan.secondary,
    focus: colors.journeys.plan.primary,
  },
  
  // Plan-specific semantic colors
  planSemantic: {
    // Claim status colors
    claimSubmitted: colors.journeys.plan.primary,
    claimInReview: colors.semantic.warning,
    claimApproved: colors.semantic.success,
    claimDenied: colors.semantic.error,
    claimPartial: colors.journeys.plan.secondary,
    
    // Coverage status colors
    coverageActive: colors.semantic.success,
    coverageInactive: colors.semantic.error,
    coverageExpiring: colors.semantic.warning,
    
    // Benefit usage colors
    benefitUnused: colors.semantic.success,
    benefitPartiallyUsed: colors.journeys.plan.primary,
    benefitFullyUsed: colors.semantic.warning,
    benefitExceeded: colors.semantic.error,
    
    // Cost indicator colors
    costLow: colors.semantic.success,
    costMedium: colors.semantic.warning,
    costHigh: colors.semantic.error,
  },
  
  // Override shadows with Plan-specific values
  shadows: {
    ...baseTheme.shadows,
    focus: `0 0 0 2px ${colors.journeys.plan.primary}`,
  },
  
  // Plan-specific typography variations
  typography: {
    ...baseTheme.typography,
    planName: {
      fontFamily: baseTheme.typography.fontFamily.heading,
      fontSize: baseTheme.typography.fontSize.xl,
      fontWeight: baseTheme.typography.fontWeight.bold,
      lineHeight: baseTheme.typography.lineHeight.tight,
    },
    benefitTitle: {
      fontFamily: baseTheme.typography.fontFamily.base,
      fontSize: baseTheme.typography.fontSize.lg,
      fontWeight: baseTheme.typography.fontWeight.medium,
      lineHeight: baseTheme.typography.lineHeight.base,
    },
    claimAmount: {
      fontFamily: baseTheme.typography.fontFamily.mono,
      fontSize: baseTheme.typography.fontSize.xl,
      fontWeight: baseTheme.typography.fontWeight.bold,
      lineHeight: baseTheme.typography.lineHeight.tight,
    },
  },
  
  // Component-specific styling for the Plan journey
  components: {
    // Plan journey specific component variations
    benefitCard: {
      borderRadius: '8px',
      shadow: shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.plan.background}, ${colors.neutral.white})`,
    },
    claimCard: {
      borderRadius: '8px',
      shadow: shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.plan.background}, ${colors.neutral.white})`,
    },
    coverageCard: {
      borderRadius: '8px',
      shadow: shadows.md,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.plan.background}, ${colors.neutral.white})`,
    },
    insuranceCard: {
      borderRadius: '12px',
      shadow: shadows.lg,
      bgGradient: `linear-gradient(135deg, ${colors.journeys.plan.primary}, ${colors.journeys.plan.secondary})`,
      hologramColor: `rgba(255, 255, 255, 0.15)`,
    },
    costSimulator: {
      barColor: colors.journeys.plan.primary,
      labelColor: colors.journeys.plan.secondary,
      gridColor: colors.neutral.gray200,
    },
    
    // Override base component styling with Plan-specific values
    button: {
      primary: {
        background: colors.journeys.plan.primary,
        color: colors.neutral.white,
        hoverBackground: colors.journeys.plan.secondary,
        activeBackground: colors.journeys.plan.accent,
      },
      secondary: {
        background: 'transparent',
        color: colors.journeys.plan.primary,
        border: `1px solid ${colors.journeys.plan.primary}`,
        hoverBackground: colors.journeys.plan.background,
        activeBackground: colors.journeys.plan.background,
      },
    },
    
    card: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
    },
    
    input: {
      border: `1px solid ${colors.neutral.gray400}`,
      focusBorder: `1px solid ${colors.journeys.plan.primary}`,
      background: colors.neutral.white,
      placeholderColor: colors.neutral.gray500,
    },
    
    progressBar: {
      background: colors.neutral.gray200,
      fill: colors.journeys.plan.primary,
      borderRadius: '4px',
    },
    
    // Plan journey specific components
    claimCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      statusColors: {
        pending: colors.semantic.warning,
        approved: colors.semantic.success,
        denied: colors.semantic.error,
        processing: colors.journeys.plan.primary,
      },
    },
    
    insuranceCard: {
      background: colors.journeys.plan.primary,
      color: colors.neutral.white,
      borderRadius: '12px',
      shadow: shadows.md,
    },
    
    coverageInfoCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderTop: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconColor: colors.journeys.plan.primary,
    },
  },
};