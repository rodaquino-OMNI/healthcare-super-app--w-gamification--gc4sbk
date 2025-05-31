/**
 * AUSTA SuperApp Mobile Entry Point
 * 
 * This file serves as the centralized entry point for the mobile application,
 * re-exporting key components, hooks, utilities, and types from various modules.
 * It simplifies imports throughout the application and ensures consistent module resolution.
 */

// Import from @austa/design-system package
import {
  // Core components
  Button,
  Card,
  Input,
  Select,
  Checkbox,
  RadioButton,
  DatePicker,
  Modal,
  Accordion,
  ProgressBar,
  ProgressCircle,
  Toast,
  Tabs,
  Avatar,
  Badge,
  
  // Journey-specific components
  // Health
  DeviceCard,
  GoalCard,
  HealthChart,
  MetricCard,
  
  // Care
  AppointmentCard,
  MedicationCard,
  ProviderCard,
  SymptomSelector,
  VideoConsultation,
  
  // Plan
  BenefitCard,
  ClaimCard,
  CoverageInfoCard,
  InsuranceCard,
  
  // Data visualization
  BarChart,
  LineChart,
  RadialChart,
  
  // Gamification
  AchievementBadge,
  Leaderboard,
  LevelIndicator,
  QuestCard,
  RewardCard,
  XPCounter,
  AchievementNotification,
  
  // Theme utilities
  ThemeProvider,
  useTheme,
  getJourneyTheme
} from '@austa/design-system';

// Import from @design-system/primitives package
import {
  // UI primitives
  Box,
  Text,
  Stack,
  Icon,
  Touchable,
  
  // Design tokens
  colors,
  typography,
  spacing,
  shadows,
  animation,
  breakpoints
} from '@design-system/primitives';

// Import from @austa/interfaces package
import type {
  // Theme interfaces
  JourneyTheme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeShadows,
  
  // Component props
  ComponentProps,
  ButtonProps,
  CardProps,
  InputProps,
  SelectProps,
  ModalProps,
  
  // Design token types
  DesignTokens,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  
  // Style types
  StyleProps,
  FlexProps,
  GridProps,
  PositionProps,
  
  // Journey interfaces
  JourneyId,
  HealthMetric,
  CareAppointment,
  PlanCoverage,
  
  // Gamification interfaces
  Achievement,
  GameProfile,
  Quest,
  Reward
} from '@austa/interfaces';

// Import from @austa/journey-context package
import {
  // Core journey context
  JourneyProvider,
  useJourneyContext,
  
  // Journey-specific contexts
  HealthContextProvider,
  useHealthContext,
  CareContextProvider,
  useCareContext,
  PlanContextProvider,
  usePlanContext,
  
  // Cross-journey state
  useCrossJourneyState,
  
  // Journey storage adapters
  createJourneyStorage,
  createMobileStorage,
  createWebStorage
} from '@austa/journey-context';

// Re-export from new packages
export {
  // Design System Components
  Button,
  Card,
  Input,
  Select,
  Checkbox,
  RadioButton,
  DatePicker,
  Modal,
  Accordion,
  ProgressBar,
  ProgressCircle,
  Toast,
  Tabs,
  Avatar,
  Badge,
  
  // Journey-specific components
  DeviceCard,
  GoalCard,
  HealthChart,
  MetricCard,
  AppointmentCard,
  MedicationCard,
  ProviderCard,
  SymptomSelector,
  VideoConsultation,
  BenefitCard,
  ClaimCard,
  CoverageInfoCard,
  InsuranceCard,
  
  // Data visualization
  BarChart,
  LineChart,
  RadialChart,
  
  // Gamification
  AchievementBadge,
  Leaderboard,
  LevelIndicator,
  QuestCard,
  RewardCard,
  XPCounter,
  AchievementNotification,
  
  // Theme utilities
  ThemeProvider,
  useTheme,
  getJourneyTheme,
  
  // Primitives
  Box,
  Text,
  Stack,
  Icon,
  Touchable,
  
  // Design tokens
  colors,
  typography,
  spacing,
  shadows,
  animation,
  breakpoints,
  
  // Interfaces
  type JourneyTheme,
  type ThemeColors,
  type ThemeTypography,
  type ThemeSpacing,
  type ThemeShadows,
  type ComponentProps,
  type ButtonProps,
  type CardProps,
  type InputProps,
  type SelectProps,
  type ModalProps,
  type DesignTokens,
  type ColorTokens,
  type TypographyTokens,
  type SpacingTokens,
  type StyleProps,
  type FlexProps,
  type GridProps,
  type PositionProps,
  type JourneyId,
  type HealthMetric,
  type CareAppointment,
  type PlanCoverage,
  type Achievement,
  type GameProfile,
  type Quest,
  type Reward,
  
  // Journey Context
  JourneyProvider,
  useJourneyContext,
  HealthContextProvider,
  useHealthContext,
  CareContextProvider,
  useCareContext,
  PlanContextProvider,
  usePlanContext,
  useCrossJourneyState,
  createJourneyStorage,
  createMobileStorage,
  createWebStorage
};

// API exports - centralized networking layer
export * from './api';

// Component exports - shared UI components
export * from './components';

// Constants exports - environment & routing metadata
export * from './constants';

// Context exports - React Context modules with providers and hooks
export * from './context';

// Hooks exports - custom React hooks for data fetching and business logic
export * from './hooks';

// Navigation exports - React Navigation configuration
export * from './navigation';

// Screen exports - domain feature surfaces
export * from './screens';

// Type exports - type definitions and ambient declarations
export * from './types';

// Utility exports - cross-cutting utilities
export * from './utils';