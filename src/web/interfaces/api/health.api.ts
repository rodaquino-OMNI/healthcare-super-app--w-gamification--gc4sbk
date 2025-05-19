/**
 * Health Journey API Interfaces
 * 
 * This file defines the API interfaces for the Health journey in the AUSTA SuperApp.
 * It includes request/response types for health metrics, medical events, health goals,
 * and device connections, along with validation schemas for data integrity.
 * 
 * These interfaces ensure type safety for all Health journey API operations and
 * are used by both frontend and backend to maintain consistent data contracts.
 */

import { z } from 'zod';
import {
  HealthMetric,
  HealthMetricType,
  MedicalEvent,
  HealthGoal,
  DeviceConnection,
  healthMetricSchema,
  medicalEventSchema,
  healthGoalSchema,
  deviceConnectionSchema
} from '../../shared/types/health.types';

// ===== Health Metrics API =====

/**
 * Request interface for creating a new health metric
 */
export interface CreateHealthMetricRequest {
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

/**
 * Request interface for updating an existing health metric
 */
export interface UpdateHealthMetricRequest {
  id: string;
  value?: number;
  unit?: string;
  timestamp?: string;
  source?: string;
}

/**
 * Parameters for filtering health metrics in list/search operations
 */
export interface HealthMetricQueryParams {
  userId?: string;
  type?: HealthMetricType;
  startDate?: string;
  endDate?: string;
  source?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'value';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Response interface for health metric operations
 */
export interface HealthMetricResponse {
  data: HealthMetric;
  success: boolean;
  message?: string;
}

/**
 * Response interface for listing multiple health metrics
 */
export interface HealthMetricsListResponse {
  data: HealthMetric[];
  total: number;
  limit: number;
  offset: number;
  success: boolean;
}

/**
 * Response interface for aggregated health metrics
 */
export interface HealthMetricAggregationResponse {
  data: {
    type: HealthMetricType;
    average?: number;
    min?: number;
    max?: number;
    count: number;
    period: string;
  }[];
  success: boolean;
}

// ===== Medical Events API =====

/**
 * Request interface for creating a new medical event
 */
export interface CreateMedicalEventRequest {
  type: string;
  description: string;
  date: string;
  provider: string;
  documents?: string[];
}

/**
 * Request interface for updating an existing medical event
 */
export interface UpdateMedicalEventRequest {
  id: string;
  type?: string;
  description?: string;
  date?: string;
  provider?: string;
  documents?: string[];
}

/**
 * Parameters for filtering medical events in list/search operations
 */
export interface MedicalEventQueryParams {
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  provider?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'type';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Response interface for medical event operations
 */
export interface MedicalEventResponse {
  data: MedicalEvent;
  success: boolean;
  message?: string;
}

/**
 * Response interface for listing multiple medical events
 */
export interface MedicalEventsListResponse {
  data: MedicalEvent[];
  total: number;
  limit: number;
  offset: number;
  success: boolean;
}

// ===== Health Goals API =====

/**
 * Request interface for creating a new health goal
 */
export interface CreateHealthGoalRequest {
  type: string;
  target: number;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Request interface for updating an existing health goal
 */
export interface UpdateHealthGoalRequest {
  id: string;
  type?: string;
  target?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Parameters for filtering health goals in list/search operations
 */
export interface HealthGoalQueryParams {
  userId?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'endDate' | 'startDate' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Response interface for health goal operations
 */
export interface HealthGoalResponse {
  data: HealthGoal;
  success: boolean;
  message?: string;
}

/**
 * Response interface for listing multiple health goals
 */
export interface HealthGoalsListResponse {
  data: HealthGoal[];
  total: number;
  limit: number;
  offset: number;
  success: boolean;
}

/**
 * Response interface for health goal progress
 */
export interface HealthGoalProgressResponse {
  data: {
    goalId: string;
    type: string;
    target: number;
    currentValue: number;
    progressPercentage: number;
    remainingDays: number;
    status: string;
  };
  success: boolean;
}

// ===== Device Connections API =====

/**
 * Request interface for creating a new device connection
 */
export interface CreateDeviceConnectionRequest {
  deviceType: string;
  deviceId: string;
  status: string;
}

/**
 * Request interface for updating an existing device connection
 */
export interface UpdateDeviceConnectionRequest {
  id: string;
  deviceType?: string;
  deviceId?: string;
  lastSync?: string;
  status?: string;
}

/**
 * Parameters for filtering device connections in list/search operations
 */
export interface DeviceConnectionQueryParams {
  userId?: string;
  deviceType?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'lastSync' | 'deviceType';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Response interface for device connection operations
 */
export interface DeviceConnectionResponse {
  data: DeviceConnection;
  success: boolean;
  message?: string;
}

/**
 * Response interface for listing multiple device connections
 */
export interface DeviceConnectionsListResponse {
  data: DeviceConnection[];
  total: number;
  limit: number;
  offset: number;
  success: boolean;
}

/**
 * Request interface for syncing data from a connected device
 */
export interface DeviceSyncRequest {
  deviceConnectionId: string;
  metrics: Array<{
    type: HealthMetricType;
    value: number;
    unit: string;
    timestamp: string;
  }>;
}

/**
 * Response interface for device sync operations
 */
export interface DeviceSyncResponse {
  success: boolean;
  syncedMetrics: number;
  failedMetrics: number;
  lastSync: string;
  message?: string;
}

// ===== FHIR Integration API =====

/**
 * Request interface for importing FHIR resources
 */
export interface ImportFHIRResourcesRequest {
  resourceType: 'Observation' | 'Condition' | 'MedicationStatement' | 'Procedure';
  resources: any[];
}

/**
 * Response interface for FHIR import operations
 */
export interface FHIRImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  message?: string;
}

// ===== Health Insights API =====

/**
 * Parameters for requesting health insights
 */
export interface HealthInsightQueryParams {
  userId?: string;
  metricTypes?: HealthMetricType[];
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

/**
 * Response interface for health insights
 */
export interface HealthInsightResponse {
  data: {
    insightType: string;
    metricType: HealthMetricType;
    description: string;
    severity: 'info' | 'warning' | 'alert';
    timestamp: string;
    relatedMetrics: {
      id: string;
      value: number;
      timestamp: string;
    }[];
  }[];
  success: boolean;
}

// ===== Validation Schemas =====

/**
 * Zod schema for validating CreateHealthMetricRequest
 */
export const createHealthMetricSchema = z.object({
  type: z.nativeEnum(HealthMetricType),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  source: z.string(),
});

/**
 * Zod schema for validating UpdateHealthMetricRequest
 */
export const updateHealthMetricSchema = z.object({
  id: z.string().uuid(),
  value: z.number().optional(),
  unit: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  source: z.string().optional(),
});

/**
 * Zod schema for validating CreateMedicalEventRequest
 */
export const createMedicalEventSchema = z.object({
  type: z.string(),
  description: z.string(),
  date: z.string().datetime(),
  provider: z.string(),
  documents: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating UpdateMedicalEventRequest
 */
export const updateMedicalEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  provider: z.string().optional(),
  documents: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating CreateHealthGoalRequest
 */
export const createHealthGoalSchema = z.object({
  type: z.string(),
  target: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.string(),
});

/**
 * Zod schema for validating UpdateHealthGoalRequest
 */
export const updateHealthGoalSchema = z.object({
  id: z.string().uuid(),
  type: z.string().optional(),
  target: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(),
});

/**
 * Zod schema for validating CreateDeviceConnectionRequest
 */
export const createDeviceConnectionSchema = z.object({
  deviceType: z.string(),
  deviceId: z.string(),
  status: z.string(),
});

/**
 * Zod schema for validating UpdateDeviceConnectionRequest
 */
export const updateDeviceConnectionSchema = z.object({
  id: z.string().uuid(),
  deviceType: z.string().optional(),
  deviceId: z.string().optional(),
  lastSync: z.string().datetime().optional(),
  status: z.string().optional(),
});

/**
 * Zod schema for validating DeviceSyncRequest
 */
export const deviceSyncSchema = z.object({
  deviceConnectionId: z.string().uuid(),
  metrics: z.array(
    z.object({
      type: z.nativeEnum(HealthMetricType),
      value: z.number(),
      unit: z.string(),
      timestamp: z.string().datetime(),
    })
  ),
});

/**
 * Zod schema for validating ImportFHIRResourcesRequest
 */
export const importFHIRResourcesSchema = z.object({
  resourceType: z.enum(['Observation', 'Condition', 'MedicationStatement', 'Procedure']),
  resources: z.array(z.any()),
});