import React from 'react';

// Import navigators using standardized path aliases
import { AuthNavigator } from '@app/navigation/AuthNavigator';
import { CareNavigator } from '@app/navigation/CareNavigator';
import { HealthNavigator } from '@app/navigation/HealthNavigator';
import { MainNavigator } from '@app/navigation/MainNavigator';
import { PlanNavigator } from '@app/navigation/PlanNavigator';
import { RootNavigator } from '@app/navigation/RootNavigator';

// Import types from @austa/interfaces
import type { NavigatorComponent } from '@austa/interfaces/components';

/**
 * Navigation components for the AUSTA SuperApp mobile application.
 * These components define the navigation structure for all user journeys.
 */
export {
  /**
   * Navigation component for the authentication flow.
   * Handles login, registration, and password reset screens.
   */
  AuthNavigator,
  
  /**
   * Navigation component for the "Care Now" journey.
   * Manages appointment booking, provider search, symptom checking, and telemedicine.
   */
  CareNavigator,
  
  /**
   * Navigation component for the "My Health" journey.
   * Handles health metrics, goals, device connections, and medical history.
   */
  HealthNavigator,
  
  /**
   * Navigation component for the main app flow (after authentication).
   * Provides the bottom tab navigation between journeys.
   */
  MainNavigator,
  
  /**
   * Navigation component for the "My Plan & Benefits" journey.
   * Manages insurance plans, claims, coverage details, and benefits.
   */
  PlanNavigator,
  
  /**
   * Root navigation component that determines whether to show the auth flow or the main app.
   * Acts as the entry point for the entire navigation structure.
   */
  RootNavigator,
};