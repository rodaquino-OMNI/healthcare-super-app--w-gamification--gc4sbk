/**
 * Journey-Specific Theme Type Definitions
 * 
 * This file defines specialized theme interfaces for each user journey in the AUSTA SuperApp.
 * These interfaces extend the base Theme with journey-specific color palettes, typographic
 * treatments, and component variations that reflect each journey's unique visual identity.
 * 
 * The three journeys are:
 * - Health Journey ("Minha Saúde"): Focused on health metrics and wellness tracking
 * - Care Journey ("Cuidar-me Agora"): Focused on medical appointments and treatments
 * - Plan Journey ("Meu Plano & Benefícios"): Focused on insurance plans and benefits
 */

import { Theme } from './theme.types';
import { ColorScale } from './tokens.types';

/**
 * Health Journey Theme Interface
 * Extends the base Theme with health journey-specific properties
 */
export interface HealthTheme extends Theme {
  /**
   * Health journey-specific color palette
   * Primarily green-based colors for health metrics, goals, and wellness tracking
   */
  healthColors: {
    /** Primary health color scale - green-based */
    primary: ColorScale;
    /** Secondary health color scale - complementary to primary */
    secondary: ColorScale;
    /** Accent health color scale - for highlights and important elements */
    accent: ColorScale;
    /** Semantic colors specific to health metrics */
    metrics: {
      /** Color for heart rate metrics */
      heartRate: string;
      /** Color for step count metrics */
      steps: string;
      /** Color for sleep metrics */
      sleep: string;
      /** Color for weight metrics */
      weight: string;
      /** Color for blood pressure metrics */
      bloodPressure: string;
      /** Color for glucose metrics */
      glucose: string;
      /** Color for oxygen saturation metrics */
      oxygen: string;
      /** Color for temperature metrics */
      temperature: string;
    };
    /** Semantic colors for health goals */
    goals: {
      /** Color for goal not started */
      notStarted: string;
      /** Color for goal in progress */
      inProgress: string;
      /** Color for goal completed */
      completed: string;
      /** Color for goal overachieved */
      overachieved: string;
    };
  };

  /**
   * Health journey-specific component variations
   */
  healthComponents: {
    /** Health metric card styling */
    metricCard: {
      /** Background color for metric cards */
      backgroundColor: string;
      /** Border color for metric cards */
      borderColor: string;
      /** Text color for metric values */
      valueColor: string;
      /** Text color for metric labels */
      labelColor: string;
    };
    /** Health goal card styling */
    goalCard: {
      /** Background color for goal cards */
      backgroundColor: string;
      /** Border color for goal cards */
      borderColor: string;
      /** Text color for goal titles */
      titleColor: string;
      /** Text color for goal descriptions */
      descriptionColor: string;
    };
    /** Health chart styling */
    chart: {
      /** Background color for charts */
      backgroundColor: string;
      /** Grid line color for charts */
      gridColor: string;
      /** Axis label color for charts */
      axisColor: string;
      /** Data line color for charts */
      lineColor: string;
      /** Data point color for charts */
      pointColor: string;
    };
  };
}

/**
 * Care Journey Theme Interface
 * Extends the base Theme with care journey-specific properties
 */
export interface CareTheme extends Theme {
  /**
   * Care journey-specific color palette
   * Primarily orange-based colors for appointments, medications, and treatments
   */
  careColors: {
    /** Primary care color scale - orange-based */
    primary: ColorScale;
    /** Secondary care color scale - complementary to primary */
    secondary: ColorScale;
    /** Accent care color scale - for highlights and important elements */
    accent: ColorScale;
    /** Semantic colors for appointment status */
    appointment: {
      /** Color for scheduled appointments */
      scheduled: string;
      /** Color for confirmed appointments */
      confirmed: string;
      /** Color for in-progress appointments */
      inProgress: string;
      /** Color for completed appointments */
      completed: string;
      /** Color for canceled appointments */
      canceled: string;
    };
    /** Semantic colors for medication status */
    medication: {
      /** Color for active medications */
      active: string;
      /** Color for taken medications */
      taken: string;
      /** Color for missed medications */
      missed: string;
      /** Color for expired medications */
      expired: string;
    };
    /** Semantic colors for provider specialties */
    specialty: {
      /** Color for general practitioners */
      generalPractitioner: string;
      /** Color for cardiologists */
      cardiology: string;
      /** Color for dermatologists */
      dermatology: string;
      /** Color for orthopedists */
      orthopedics: string;
      /** Color for neurologists */
      neurology: string;
      /** Color for pediatricians */
      pediatrics: string;
      /** Color for gynecologists */
      gynecology: string;
      /** Color for urologists */
      urology: string;
      /** Color for other specialties */
      other: string;
    };
  };

  /**
   * Care journey-specific component variations
   */
  careComponents: {
    /** Appointment card styling */
    appointmentCard: {
      /** Background color for appointment cards */
      backgroundColor: string;
      /** Border color for appointment cards */
      borderColor: string;
      /** Text color for appointment titles */
      titleColor: string;
      /** Text color for appointment details */
      detailsColor: string;
    };
    /** Provider card styling */
    providerCard: {
      /** Background color for provider cards */
      backgroundColor: string;
      /** Border color for provider cards */
      borderColor: string;
      /** Text color for provider names */
      nameColor: string;
      /** Text color for provider specialties */
      specialtyColor: string;
    };
    /** Medication card styling */
    medicationCard: {
      /** Background color for medication cards */
      backgroundColor: string;
      /** Border color for medication cards */
      borderColor: string;
      /** Text color for medication names */
      nameColor: string;
      /** Text color for medication dosages */
      dosageColor: string;
    };
  };
}

/**
 * Plan Journey Theme Interface
 * Extends the base Theme with plan journey-specific properties
 */
export interface PlanTheme extends Theme {
  /**
   * Plan journey-specific color palette
   * Primarily blue-based colors for insurance plans, benefits, and claims
   */
  planColors: {
    /** Primary plan color scale - blue-based */
    primary: ColorScale;
    /** Secondary plan color scale - complementary to primary */
    secondary: ColorScale;
    /** Accent plan color scale - for highlights and important elements */
    accent: ColorScale;
    /** Semantic colors for plan types */
    planType: {
      /** Color for basic plans */
      basic: string;
      /** Color for standard plans */
      standard: string;
      /** Color for premium plans */
      premium: string;
      /** Color for family plans */
      family: string;
      /** Color for corporate plans */
      corporate: string;
    };
    /** Semantic colors for claim status */
    claim: {
      /** Color for submitted claims */
      submitted: string;
      /** Color for in-review claims */
      inReview: string;
      /** Color for approved claims */
      approved: string;
      /** Color for partially approved claims */
      partiallyApproved: string;
      /** Color for denied claims */
      denied: string;
      /** Color for appealed claims */
      appealed: string;
    };
    /** Semantic colors for coverage types */
    coverage: {
      /** Color for medical coverage */
      medical: string;
      /** Color for dental coverage */
      dental: string;
      /** Color for vision coverage */
      vision: string;
      /** Color for pharmacy coverage */
      pharmacy: string;
      /** Color for mental health coverage */
      mentalHealth: string;
      /** Color for alternative therapy coverage */
      alternativeTherapy: string;
    };
  };

  /**
   * Plan journey-specific component variations
   */
  planComponents: {
    /** Plan card styling */
    planCard: {
      /** Background color for plan cards */
      backgroundColor: string;
      /** Border color for plan cards */
      borderColor: string;
      /** Text color for plan names */
      nameColor: string;
      /** Text color for plan details */
      detailsColor: string;
    };
    /** Claim card styling */
    claimCard: {
      /** Background color for claim cards */
      backgroundColor: string;
      /** Border color for claim cards */
      borderColor: string;
      /** Text color for claim titles */
      titleColor: string;
      /** Text color for claim amounts */
      amountColor: string;
    };
    /** Benefit card styling */
    benefitCard: {
      /** Background color for benefit cards */
      backgroundColor: string;
      /** Border color for benefit cards */
      borderColor: string;
      /** Text color for benefit names */
      nameColor: string;
      /** Text color for benefit descriptions */
      descriptionColor: string;
    };
  };
}

/**
 * Union type of all journey-specific themes
 * Used for components that can accept any journey theme
 */
export type JourneyTheme = HealthTheme | CareTheme | PlanTheme;

/**
 * Props for the JourneyThemeProvider component
 */
export interface JourneyThemeProviderProps {
  /** The journey theme to provide */
  theme: JourneyTheme;
  /** The journey type */
  journey: 'health' | 'care' | 'plan';
  /** Children to render within the theme provider */
  children: React.ReactNode;
}