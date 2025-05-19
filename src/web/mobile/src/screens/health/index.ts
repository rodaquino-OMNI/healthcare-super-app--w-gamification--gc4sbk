/**
 * Health Journey Screen Components
 * 
 * This barrel file exports all health-related screen components for the Health Journey.
 * It provides a unified import point for all screens in this journey, following the
 * standardized module resolution pattern across the monorepo.
 */

import { FC } from 'react';

// Import all screen components with consistent naming convention
import { Dashboard as HealthDashboardComponent } from './Dashboard';
import { DeviceConnection as DeviceConnectionComponent } from './DeviceConnection';
import { HealthGoals as HealthGoalsComponent } from './HealthGoals';
import { MedicalHistoryScreen as MedicalHistoryComponent } from './MedicalHistory';
import { MetricDetailScreen as MetricDetailComponent } from './MetricDetail';
import { AddMetricScreen as AddMetricComponent } from './AddMetric';

// Type definitions for screen components
export type HealthDashboardScreen = FC;
export type DeviceConnectionScreen = FC;
export type HealthGoalsScreen = FC;
export type MedicalHistoryScreen = FC;
export type MetricDetailScreen = FC;
export type AddMetricScreen = FC;

// Export all screen components with standardized naming convention
export const HealthDashboardScreen: HealthDashboardScreen = HealthDashboardComponent;
export const DeviceConnectionScreen: DeviceConnectionScreen = DeviceConnectionComponent;
export const HealthGoalsScreen: HealthGoalsScreen = HealthGoalsComponent;
export const MedicalHistoryScreen: MedicalHistoryScreen = MedicalHistoryComponent;
export const MetricDetailScreen: MetricDetailScreen = MetricDetailComponent;
export const AddMetricScreen: AddMetricScreen = AddMetricComponent;

// For backward compatibility, export original names as aliases
export {
  HealthDashboardScreen as Dashboard,
  DeviceConnectionScreen as DeviceConnection,
  HealthGoalsScreen as HealthGoals
};