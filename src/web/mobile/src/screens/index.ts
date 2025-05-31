/**
 * @file screens/index.ts
 * @description Barrel file that exports all screen components from the auth, care, health, home, and plan folders.
 * Creates a unified entry point for importing screens across the application, simplifying imports in navigation configuration.
 */

// Import types from @austa/interfaces package
import type { 
  AuthScreenComponent,
  CareScreenComponent,
  HealthScreenComponent,
  HomeScreenComponent,
  PlanScreenComponent,
  ScreenComponent
} from '@austa/interfaces/components';

// Auth screens with journey-specific typing
export * from './auth';

// Care screens with journey-specific typing
export * from './care';

// Health screens with journey-specific typing
export * from './health';

// Home screens with journey-specific typing
export * from './home';

// Plan screens with journey-specific typing
export * from './plan';

// Re-export all screens with proper typing for use in navigation
export {
  // Auth screens
  LoginScreen as LoginScreen,
  RegisterScreen as RegisterScreen,
  ForgotPasswordScreen as ForgotPasswordScreen,
  MFAScreen as MFAScreen,
  
  // Care screens
  AppointmentBookingScreen as AppointmentBookingScreen,
  AppointmentDetailScreen as AppointmentDetailScreen,
  CareDashboardScreen as CareDashboardScreen,
  MedicationTrackingScreen as MedicationTrackingScreen,
  ProviderSearchScreen as ProviderSearchScreen,
  SymptomCheckerScreen as SymptomCheckerScreen,
  TelemedicineScreen as TelemedicineScreen,
  TreatmentPlanScreen as TreatmentPlanScreen,
  
  // Health screens
  HealthDashboardScreen as HealthDashboardScreen,
  DeviceConnectionScreen as DeviceConnectionScreen,
  HealthGoalsScreen as HealthGoalsScreen,
  MedicalHistoryScreen as MedicalHistoryScreen,
  MetricDetailScreen as MetricDetailScreen,
  AddMetricScreen as AddMetricScreen,
  
  // Home screens
  HomeScreen as HomeScreen,
  AchievementsScreen as AchievementsScreen,
  NotificationsScreen as NotificationsScreen,
  ProfileScreen as ProfileScreen,
  SettingsScreen as SettingsScreen,
  
  // Plan screens
  PlanDashboardScreen as PlanDashboardScreen,
  BenefitsScreen as BenefitsScreen,
  ClaimHistoryScreen as ClaimHistoryScreen,
  ClaimDetailScreen as ClaimDetailScreen,
  ClaimSubmissionScreen as ClaimSubmissionScreen,
  CostSimulatorScreen as CostSimulatorScreen,
  CoverageScreen as CoverageScreen,
  DigitalCardScreen as DigitalCardScreen,
};