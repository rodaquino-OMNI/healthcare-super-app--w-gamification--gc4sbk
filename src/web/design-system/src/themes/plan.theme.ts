import { baseTheme } from './base.theme';
import { colors, shadows } from '@design-system/primitives/src/tokens';
import { PlanTheme } from '@austa/interfaces/themes';

/**
 * Plan Journey Theme
 * 
 * This theme extends the base theme with specific styling for the "My Plan & Benefits" journey.
 * It uses a blue color palette (#3772FF) to visually distinguish the Plan journey from other journeys,
 * creating a consistent visual identity throughout the user experience.
 *
 * @remarks
 * The Plan theme implements component-specific styling overrides for buttons, cards, inputs,
 * progress indicators, and plan-specific components like ClaimCard, InsuranceCard, and CoverageInfoCard.
 */
export const planTheme: PlanTheme = {
  ...baseTheme,
  
  // Journey identification
  name: 'Plan Theme',
  journeyKey: 'plan',
  
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
  
  // Override shadows with Plan-specific values
  shadows: {
    ...baseTheme.shadows,
    focus: `0 0 0 2px ${colors.journeys.plan.primary}`,
    card: shadows.sm,
    elevated: shadows.md,
  },
  
  // Component-specific styling for the Plan journey
  components: {
    // Button variants
    button: {
      primary: {
        background: colors.journeys.plan.primary,
        color: colors.neutral.white,
        hoverBackground: colors.journeys.plan.secondary,
        activeBackground: colors.journeys.plan.accent,
        disabledBackground: `${colors.journeys.plan.primary}80`, // 50% opacity
        disabledColor: `${colors.neutral.white}CC`, // 80% opacity
        focusRing: `0 0 0 2px ${colors.journeys.plan.secondary}`,
      },
      secondary: {
        background: 'transparent',
        color: colors.journeys.plan.primary,
        border: `1px solid ${colors.journeys.plan.primary}`,
        hoverBackground: colors.journeys.plan.background,
        hoverBorder: `1px solid ${colors.journeys.plan.secondary}`,
        activeBackground: colors.journeys.plan.background,
        activeBorder: `1px solid ${colors.journeys.plan.accent}`,
        disabledBackground: 'transparent',
        disabledColor: `${colors.journeys.plan.primary}80`, // 50% opacity
        disabledBorder: `1px solid ${colors.journeys.plan.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.plan.secondary}`,
      },
      text: {
        background: 'transparent',
        color: colors.journeys.plan.primary,
        hoverColor: colors.journeys.plan.secondary,
        activeColor: colors.journeys.plan.accent,
        disabledColor: `${colors.journeys.plan.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.plan.secondary}`,
      },
    },
    
    // Card styling
    card: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      activeShadow: shadows.sm,
    },
    
    // Input styling
    input: {
      border: `1px solid ${colors.neutral.gray400}`,
      focusBorder: `1px solid ${colors.journeys.plan.primary}`,
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
      fill: colors.journeys.plan.primary,
      borderRadius: '4px',
      height: '8px',
    },
    
    progressCircle: {
      background: colors.neutral.gray200,
      fill: colors.journeys.plan.primary,
      width: '48px',
      strokeWidth: '4px',
    },
    
    // Plan journey specific components
    claimCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      statusColors: {
        pending: colors.semantic.warning,
        approved: colors.semantic.success,
        denied: colors.semantic.error,
        processing: colors.journeys.plan.primary,
      },
      iconColor: colors.journeys.plan.primary,
    },
    
    insuranceCard: {
      background: colors.journeys.plan.primary,
      color: colors.neutral.white,
      borderRadius: '12px',
      shadow: shadows.md,
      secondaryColor: colors.journeys.plan.accent,
      highlightColor: colors.journeys.plan.secondary,
    },
    
    coverageInfoCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderTop: `4px solid ${colors.journeys.plan.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconColor: colors.journeys.plan.primary,
      highlightBackground: `${colors.journeys.plan.background}50`, // 50% opacity
      highlightText: colors.journeys.plan.primary,
    },
    
    benefitCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconBackground: colors.journeys.plan.background,
      iconColor: colors.journeys.plan.primary,
      activeBackground: `${colors.journeys.plan.background}30`, // 30% opacity
      activeBorder: `1px solid ${colors.journeys.plan.primary}`,
    },
  },
};