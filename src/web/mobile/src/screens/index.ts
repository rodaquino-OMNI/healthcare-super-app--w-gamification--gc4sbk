/**
 * @file Barrel file that exports all screen components from the auth, care, health, home, and plan folders.
 * This file creates a unified entry point for importing screens across the application,
 * simplifying imports in navigation configuration.
 */

// Import journey-specific screen types from @austa/interfaces
import type { 
  AuthScreenComponent,
  CareScreenComponent,
  HealthScreenComponent,
  HomeScreenComponent,
  PlanScreenComponent,
  ScreenComponent
} from '@austa/interfaces/components';

// Auth screens with proper typing
export * from './auth';

// Care screens with proper typing
export * from './care';

// Health screens with proper typing
export * from './health';

// Home screens with proper typing
export * from './home';

// Plan screens with proper typing
export * from './plan';

// Re-export all screens with journey-specific type annotations
export {
  // Auth screens
  LoginScreen as LoginScreen,
  RegisterScreen as RegisterScreen,
  ForgotPasswordScreen as ForgotPasswordScreen,
  MFAScreen as MFAScreen,
} from './auth';

// Care screens with journey-specific typing
export {
  Dashboard as CareDashboard,
  AppointmentDetail as AppointmentDetailScreen,
  ProviderSearch as ProviderSearchScreen,
  SymptomChecker as SymptomCheckerScreen,
  Telemedicine as TelemedicineScreen,
  TreatmentPlan as TreatmentPlanScreen,
} from './care';

// Health screens with journey-specific typing
export {
  Dashboard as HealthDashboard,
  DeviceConnection as DeviceConnectionScreen,
  HealthGoals as HealthGoalsScreen,
  MedicalHistory as MedicalHistoryScreen,
  MetricDetail as MetricDetailScreen,
  AddMetric as AddMetricScreen,
} from './health';

// Home screens with journey-specific typing
export {
  Home as HomeScreen,
  Achievements as AchievementsScreen,
  Notifications as NotificationsScreen,
  Profile as ProfileScreen,
  Settings as SettingsScreen,
} from './home';

// Plan screens with journey-specific typing
export {
  Dashboard as PlanDashboard,
  Benefits as BenefitsScreen,
  ClaimDetail as ClaimDetailScreen,
  ClaimHistory as ClaimHistoryScreen,
  ClaimSubmission as ClaimSubmissionScreen,
  CostSimulator as CostSimulatorScreen,
  Coverage as CoverageScreen,
  DigitalCard as DigitalCardScreen,
} from './plan';

// Export a unified screen registry for navigation configuration
export const Screens = {
  // Auth screens
  Auth: {
    Login: 'LoginScreen' as const,
    Register: 'RegisterScreen' as const,
    ForgotPassword: 'ForgotPasswordScreen' as const,
    MFA: 'MFAScreen' as const,
  },
  // Care screens
  Care: {
    Dashboard: 'CareDashboard' as const,
    AppointmentDetail: 'AppointmentDetailScreen' as const,
    ProviderSearch: 'ProviderSearchScreen' as const,
    SymptomChecker: 'SymptomCheckerScreen' as const,
    Telemedicine: 'TelemedicineScreen' as const,
    TreatmentPlan: 'TreatmentPlanScreen' as const,
  },
  // Health screens
  Health: {
    Dashboard: 'HealthDashboard' as const,
    DeviceConnection: 'DeviceConnectionScreen' as const,
    HealthGoals: 'HealthGoalsScreen' as const,
    MedicalHistory: 'MedicalHistoryScreen' as const,
    MetricDetail: 'MetricDetailScreen' as const,
    AddMetric: 'AddMetricScreen' as const,
  },
  // Home screens
  Home: {
    Home: 'HomeScreen' as const,
    Achievements: 'AchievementsScreen' as const,
    Notifications: 'NotificationsScreen' as const,
    Profile: 'ProfileScreen' as const,
    Settings: 'SettingsScreen' as const,
  },
  // Plan screens
  Plan: {
    Dashboard: 'PlanDashboard' as const,
    Benefits: 'BenefitsScreen' as const,
    ClaimDetail: 'ClaimDetailScreen' as const,
    ClaimHistory: 'ClaimHistoryScreen' as const,
    ClaimSubmission: 'ClaimSubmissionScreen' as const,
    CostSimulator: 'CostSimulatorScreen' as const,
    Coverage: 'CoverageScreen' as const,
    DigitalCard: 'DigitalCardScreen' as const,
  },
};

// Type guard functions for journey-specific screen components
export const isAuthScreen = (component: ScreenComponent): component is AuthScreenComponent => {
  return Object.values(Screens.Auth).includes(component.name as any);
};

export const isCareScreen = (component: ScreenComponent): component is CareScreenComponent => {
  return Object.values(Screens.Care).includes(component.name as any);
};

export const isHealthScreen = (component: ScreenComponent): component is HealthScreenComponent => {
  return Object.values(Screens.Health).includes(component.name as any);
};

export const isHomeScreen = (component: ScreenComponent): component is HomeScreenComponent => {
  return Object.values(Screens.Home).includes(component.name as any);
};

export const isPlanScreen = (component: ScreenComponent): component is PlanScreenComponent => {
  return Object.values(Screens.Plan).includes(component.name as any);
};