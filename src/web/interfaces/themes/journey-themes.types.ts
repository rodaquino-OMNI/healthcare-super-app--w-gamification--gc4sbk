/**
 * Journey-Specific Theme Type Definitions
 * 
 * This file defines TypeScript interfaces for journey-specific themes in the AUSTA SuperApp.
 * Each journey (Health, Care, Plan) has its own theme interface that extends the base JourneyTheme
 * with specialized color palettes, typographic treatments, and component variations that reflect
 * the journey's unique visual identity.
 */

import { JourneyTheme } from './theme.types';

/**
 * Health Journey Semantic Colors
 * Defines semantic color names specific to the Health journey context
 */
export interface HealthSemanticColors {
  // Health metrics colors
  metricHigh: string;
  metricNormal: string;
  metricLow: string;
  metricCritical: string;
  
  // Goal status colors
  goalComplete: string;
  goalInProgress: string;
  goalBehind: string;
  
  // Device connection status
  deviceConnected: string;
  deviceDisconnected: string;
  deviceSyncing: string;
  
  // Health insight colors
  insightPositive: string;
  insightNeutral: string;
  insightNegative: string;
  insightActionable: string;
}

/**
 * Care Journey Semantic Colors
 * Defines semantic color names specific to the Care journey context
 */
export interface CareSemanticColors {
  // Appointment status colors
  appointmentScheduled: string;
  appointmentConfirmed: string;
  appointmentCancelled: string;
  appointmentCompleted: string;
  
  // Provider availability colors
  providerAvailable: string;
  providerBusy: string;
  providerUnavailable: string;
  
  // Medication status colors
  medicationActive: string;
  medicationExpired: string;
  medicationRefillNeeded: string;
  
  // Symptom severity colors
  symptomMild: string;
  symptomModerate: string;
  symptomSevere: string;
  
  // Telemedicine status colors
  teleMedicineAvailable: string;
  teleMedicineInProgress: string;
  teleMedicineEnded: string;
}

/**
 * Plan Journey Semantic Colors
 * Defines semantic color names specific to the Plan journey context
 */
export interface PlanSemanticColors {
  // Claim status colors
  claimSubmitted: string;
  claimInReview: string;
  claimApproved: string;
  claimDenied: string;
  claimPartial: string;
  
  // Coverage status colors
  coverageActive: string;
  coverageInactive: string;
  coverageExpiring: string;
  
  // Benefit usage colors
  benefitUnused: string;
  benefitPartiallyUsed: string;
  benefitFullyUsed: string;
  benefitExceeded: string;
  
  // Cost indicator colors
  costLow: string;
  costMedium: string;
  costHigh: string;
}

/**
 * Health Journey Component Variations
 * Defines component style variations specific to the Health journey
 */
export interface HealthComponentVariations {
  // Card variations
  metricCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  goalCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  deviceCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  
  // Chart variations
  healthChart: {
    lineColor: string;
    gridColor: string;
    labelColor: string;
    tooltipBg: string;
  };
}

/**
 * Care Journey Component Variations
 * Defines component style variations specific to the Care journey
 */
export interface CareComponentVariations {
  // Card variations
  appointmentCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  providerCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  medicationCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  
  // Telemedicine variations
  videoConsultation: {
    controlsBg: string;
    iconColor: string;
    borderColor: string;
  };
  
  // Symptom checker variations
  symptomSelector: {
    activeBg: string;
    hoverBg: string;
    borderColor: string;
  };
}

/**
 * Plan Journey Component Variations
 * Defines component style variations specific to the Plan journey
 */
export interface PlanComponentVariations {
  // Card variations
  benefitCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  claimCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  coverageCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
  };
  
  // Insurance card variations
  insuranceCard: {
    borderRadius: string;
    shadow: string;
    bgGradient: string;
    hologramColor: string;
  };
  
  // Cost simulator variations
  costSimulator: {
    barColor: string;
    labelColor: string;
    gridColor: string;
  };
}

/**
 * Health Theme Interface
 * Defines the theme for the Health journey ("Minha Saúde")
 */
export interface HealthTheme extends JourneyTheme {
  journey: 'health';
  accentColor: string; // Primary green color
  healthSemantic: HealthSemanticColors;
  components: HealthComponentVariations;
  
  // Health-specific typography variations
  typography: JourneyTheme['typography'] & {
    metricValue: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    goalHeading: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    insightText: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
  };
}

/**
 * Care Theme Interface
 * Defines the theme for the Care journey ("Cuidar-me Agora")
 */
export interface CareTheme extends JourneyTheme {
  journey: 'care';
  accentColor: string; // Primary orange color
  careSemantic: CareSemanticColors;
  components: CareComponentVariations;
  
  // Care-specific typography variations
  typography: JourneyTheme['typography'] & {
    providerName: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    appointmentTime: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    medicationName: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
  };
}

/**
 * Plan Theme Interface
 * Defines the theme for the Plan journey ("Meu Plano & Benefícios")
 */
export interface PlanTheme extends JourneyTheme {
  journey: 'plan';
  accentColor: string; // Primary blue color
  planSemantic: PlanSemanticColors;
  components: PlanComponentVariations;
  
  // Plan-specific typography variations
  typography: JourneyTheme['typography'] & {
    planName: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    benefitTitle: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    claimAmount: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
  };
}

/**
 * Journey Theme Type
 * Union type of all journey-specific themes
 */
export type JourneySpecificTheme = HealthTheme | CareTheme | PlanTheme;