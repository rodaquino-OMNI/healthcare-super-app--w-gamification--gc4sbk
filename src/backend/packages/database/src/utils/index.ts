/**
 * @file Database Utilities Barrel Export
 * @description Centralizes all database utility exports in a single entry point for clean, organized imports.
 * This file provides a comprehensive interface for accessing database utilities across the application,
 * supporting all three journey services (Health, Care, Plan) and both PostgreSQL and TimescaleDB.
 */

// Core Database Utilities
export * from './entity-mappers.utils';
export * from './validation.utils';
export * from './batch.utils';
export * from './query-builder.utils';
export * from './filter.utils';
export * from './sort.utils';
export * from './pagination.utils';

// Journey-Specific Utility Types

/**
 * Health Journey Database Utilities
 * @description Type aliases and specialized utilities for the Health journey ("Minha Saúde")
 * with TimescaleDB optimizations for time-series health metrics data.
 */
export type HealthMetricMapper = import('./entity-mappers.utils').EntityMapper<'HealthMetric'>;
export type HealthGoalMapper = import('./entity-mappers.utils').EntityMapper<'HealthGoal'>;
export type DeviceConnectionMapper = import('./entity-mappers.utils').EntityMapper<'DeviceConnection'>;
export type MedicalEventMapper = import('./entity-mappers.utils').EntityMapper<'MedicalEvent'>;

/**
 * Care Journey Database Utilities
 * @description Type aliases and specialized utilities for the Care journey ("Cuidar-me Agora")
 * focused on appointment booking, medication management, and telemedicine.
 */
export type AppointmentMapper = import('./entity-mappers.utils').EntityMapper<'Appointment'>;
export type ProviderMapper = import('./entity-mappers.utils').EntityMapper<'Provider'>;
export type MedicationMapper = import('./entity-mappers.utils').EntityMapper<'Medication'>;
export type TreatmentMapper = import('./entity-mappers.utils').EntityMapper<'Treatment'>;
export type TelemedicineSessionMapper = import('./entity-mappers.utils').EntityMapper<'TelemedicineSession'>;

/**
 * Plan Journey Database Utilities
 * @description Type aliases and specialized utilities for the Plan journey ("Meu Plano & Benefícios")
 * focused on insurance plans, benefits, coverage, and claims.
 */
export type PlanMapper = import('./entity-mappers.utils').EntityMapper<'Plan'>;
export type BenefitMapper = import('./entity-mappers.utils').EntityMapper<'Benefit'>;
export type CoverageMapper = import('./entity-mappers.utils').EntityMapper<'Coverage'>;
export type ClaimMapper = import('./entity-mappers.utils').EntityMapper<'Claim'>;
export type DocumentMapper = import('./entity-mappers.utils').EntityMapper<'Document'>;

// Database-Specific Utility Functions

/**
 * PostgreSQL-specific utility functions
 * @description Specialized utilities optimized for PostgreSQL operations
 */
export const PostgresUtils = {
  /**
   * Creates a batch operation utility optimized for PostgreSQL
   * @returns Batch utility configured for PostgreSQL
   */
  createBatchUtils: () => import('./batch.utils').createPostgresBatchUtils(),
  
  /**
   * Creates a query builder optimized for PostgreSQL
   * @returns Query builder configured for PostgreSQL
   */
  createQueryBuilder: () => import('./query-builder.utils').createPostgresQueryBuilder(),
};

/**
 * TimescaleDB-specific utility functions
 * @description Specialized utilities optimized for TimescaleDB time-series operations
 * primarily used in the Health journey for metrics data
 */
export const TimescaleUtils = {
  /**
   * Creates a batch operation utility optimized for TimescaleDB
   * @returns Batch utility configured for TimescaleDB
   */
  createBatchUtils: () => import('./batch.utils').createTimescaleBatchUtils(),
  
  /**
   * Creates a query builder optimized for TimescaleDB time-series data
   * @returns Query builder configured for TimescaleDB
   */
  createQueryBuilder: () => import('./query-builder.utils').createTimescaleQueryBuilder(),
  
  /**
   * Creates specialized time-series utilities for health metrics
   * @returns Time-series utilities for health metrics
   */
  createTimeSeriesUtils: () => import('./query-builder.utils').createTimeSeriesUtils(),
};

// Journey-Specific Utility Functions

/**
 * Health journey utility functions
 * @description Specialized utilities for the Health journey ("Minha Saúde")
 */
export const HealthUtils = {
  /**
   * Creates filter utilities optimized for health metrics
   * @returns Filter utilities for health metrics
   */
  createMetricFilters: () => import('./filter.utils').createHealthMetricFilters(),
  
  /**
   * Creates pagination utilities optimized for time-series health data
   * @returns Pagination utilities for health metrics
   */
  createMetricPagination: () => import('./pagination.utils').createHealthMetricPagination(),
  
  /**
   * Creates validation utilities for health journey data
   * @returns Validation utilities for health journey
   */
  createValidation: () => import('./validation.utils').createHealthValidation(),
};

/**
 * Care journey utility functions
 * @description Specialized utilities for the Care journey ("Cuidar-me Agora")
 */
export const CareUtils = {
  /**
   * Creates filter utilities optimized for care appointments
   * @returns Filter utilities for appointments
   */
  createAppointmentFilters: () => import('./filter.utils').createAppointmentFilters(),
  
  /**
   * Creates pagination utilities optimized for care journey data
   * @returns Pagination utilities for care journey
   */
  createAppointmentPagination: () => import('./pagination.utils').createAppointmentPagination(),
  
  /**
   * Creates validation utilities for care journey data
   * @returns Validation utilities for care journey
   */
  createValidation: () => import('./validation.utils').createCareValidation(),
};

/**
 * Plan journey utility functions
 * @description Specialized utilities for the Plan journey ("Meu Plano & Benefícios")
 */
export const PlanUtils = {
  /**
   * Creates filter utilities optimized for plan benefits and claims
   * @returns Filter utilities for plan journey
   */
  createClaimFilters: () => import('./filter.utils').createClaimFilters(),
  
  /**
   * Creates pagination utilities optimized for plan journey data
   * @returns Pagination utilities for plan journey
   */
  createClaimPagination: () => import('./pagination.utils').createClaimPagination(),
  
  /**
   * Creates validation utilities for plan journey data
   * @returns Validation utilities for plan journey
   */
  createValidation: () => import('./validation.utils').createPlanValidation(),
};