import { baseTheme } from './base.theme';
import { colors, shadows } from '@design-system/primitives/src/tokens';
import { HealthTheme } from '@austa/interfaces/themes';

/**
 * Health Journey Theme
 * 
 * This theme extends the base theme with specific styling for the "Minha Saúde" journey.
 * It uses a green color palette (#34C759) to visually distinguish the Health journey from other journeys,
 * creating a consistent visual identity throughout the user experience.
 *
 * @remarks
 * The Health theme implements component-specific styling overrides for buttons, cards, inputs,
 * progress indicators, and health-specific components like MetricCard, HealthChart, GoalCard, and DeviceCard.
 */
export const healthTheme: HealthTheme = {
  ...baseTheme,
  
  // Journey identification
  name: 'Health Theme',
  journeyKey: 'health',
  
  // Override colors with Health-specific values
  colors: {
    ...baseTheme.colors,
    primary: colors.journeys.health.primary,
    secondary: colors.journeys.health.secondary,
    accent: colors.journeys.health.accent,
    background: colors.journeys.health.background,
    text: colors.journeys.health.text,
    border: colors.journeys.health.secondary,
    focus: colors.journeys.health.primary,
  },
  
  // Override shadows with Health-specific values
  shadows: {
    ...baseTheme.shadows,
    focus: `0 0 0 2px ${colors.journeys.health.primary}`,
    card: shadows.sm,
    elevated: shadows.md,
  },
  
  // Component-specific styling for the Health journey
  components: {
    // Button variants
    button: {
      primary: {
        background: colors.journeys.health.primary,
        color: colors.neutral.white,
        hoverBackground: colors.journeys.health.secondary,
        activeBackground: colors.journeys.health.accent,
        disabledBackground: `${colors.journeys.health.primary}80`, // 50% opacity
        disabledColor: `${colors.neutral.white}CC`, // 80% opacity
        focusRing: `0 0 0 2px ${colors.journeys.health.secondary}`,
      },
      secondary: {
        background: 'transparent',
        color: colors.journeys.health.primary,
        border: `1px solid ${colors.journeys.health.primary}`,
        hoverBackground: colors.journeys.health.background,
        hoverBorder: `1px solid ${colors.journeys.health.secondary}`,
        activeBackground: colors.journeys.health.background,
        activeBorder: `1px solid ${colors.journeys.health.accent}`,
        disabledBackground: 'transparent',
        disabledColor: `${colors.journeys.health.primary}80`, // 50% opacity
        disabledBorder: `1px solid ${colors.journeys.health.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.health.secondary}`,
      },
      text: {
        background: 'transparent',
        color: colors.journeys.health.primary,
        hoverColor: colors.journeys.health.secondary,
        activeColor: colors.journeys.health.accent,
        disabledColor: `${colors.journeys.health.primary}80`, // 50% opacity
        focusRing: `0 0 0 2px ${colors.journeys.health.secondary}`,
      },
    },
    
    // Card styling
    card: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.health.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      activeShadow: shadows.sm,
    },
    
    // Input styling
    input: {
      border: `1px solid ${colors.neutral.gray400}`,
      focusBorder: `1px solid ${colors.journeys.health.primary}`,
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
      fill: colors.journeys.health.primary,
      borderRadius: '4px',
      height: '8px',
    },
    
    progressCircle: {
      background: colors.neutral.gray200,
      fill: colors.journeys.health.primary,
      width: '48px',
      strokeWidth: '4px',
    },
    
    // Health journey specific components
    metricCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderLeft: `4px solid ${colors.journeys.health.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      hoverShadow: shadows.md,
      iconColor: colors.journeys.health.primary,
      trendColors: {
        positive: colors.semantic.success,
        negative: colors.semantic.error,
        neutral: colors.neutral.gray600,
      },
      valueColor: colors.journeys.health.primary,
    },
    
    healthChart: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      lineColor: colors.journeys.health.primary,
      gridColor: colors.neutral.gray200,
      labelColor: colors.neutral.gray600,
      tooltipBackground: colors.journeys.health.primary,
      tooltipColor: colors.neutral.white,
      rangeColors: {
        normal: `${colors.semantic.success}30`, // 30% opacity
        warning: `${colors.semantic.warning}30`, // 30% opacity
        critical: `${colors.semantic.error}30`, // 30% opacity
      },
    },
    
    goalCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderTop: `4px solid ${colors.journeys.health.primary}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconColor: colors.journeys.health.primary,
      progressBackground: colors.neutral.gray200,
      progressFill: colors.journeys.health.primary,
      highlightBackground: `${colors.journeys.health.background}50`, // 50% opacity
      highlightText: colors.journeys.health.primary,
      statusColors: {
        completed: colors.semantic.success,
        inProgress: colors.journeys.health.primary,
        notStarted: colors.neutral.gray500,
        overdue: colors.semantic.error,
      },
    },
    
    deviceCard: {
      background: colors.neutral.white,
      border: `1px solid ${colors.neutral.gray300}`,
      borderRadius: '8px',
      shadow: shadows.sm,
      iconBackground: colors.journeys.health.background,
      iconColor: colors.journeys.health.primary,
      connectionStatus: {
        connected: colors.semantic.success,
        disconnected: colors.neutral.gray500,
        syncing: colors.journeys.health.primary,
        error: colors.semantic.error,
      },
      batteryStatus: {
        high: colors.semantic.success,
        medium: colors.semantic.warning,
        low: colors.semantic.error,
      },
    },
  },
};