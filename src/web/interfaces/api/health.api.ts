/**
 * Health Journey API Interfaces
 * 
 * This file defines the API interfaces for the Health journey in the AUSTA SuperApp.
 * It includes request and response types for all Health journey endpoints, along with
 * validation schemas for ensuring data integrity.
 * 
 * These interfaces are used by both frontend and backend to ensure type safety and
 * consistent data structures across the application.
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

// Time period options for health data queries
export enum TimePeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

// Aggregation methods for health metrics
export enum AggregationMethod {
  AVG = 'AVG',
  MIN = 'MIN',
  MAX = 'MAX',
  SUM = 'SUM',
  COUNT = 'COUNT',
}

/**
 * Base query parameters for health data filtering
 */
export interface HealthDataQueryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  timePeriod?: TimePeriod;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for health metrics with additional filtering options
 */
export interface HealthMetricsQueryParams extends HealthDataQueryParams {
  types?: HealthMetricType[];
  sources?: string[];
  aggregation?: AggregationMethod;
  includeLatest?: boolean;
}

/**
 * Query parameters for medical events
 */
export interface MedicalEventsQueryParams extends HealthDataQueryParams {
  types?: string[];
  providers?: string[];
  includeDocuments?: boolean;
}

/**
 * Query parameters for health goals
 */
export interface HealthGoalsQueryParams extends HealthDataQueryParams {
  types?: string[];
  status?: string[];
  includeCompleted?: boolean;
}

/**
 * Query parameters for device connections
 */
export interface DeviceConnectionsQueryParams extends HealthDataQueryParams {
  deviceTypes?: string[];
  status?: string[];
  lastSyncBefore?: string;
  lastSyncAfter?: string;
}

// ==================== Health Metrics API ====================

/**
 * Request to create a new health metric
 */
export interface CreateHealthMetricRequest {
  userId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

/**
 * Request to create multiple health metrics in a batch
 */
export interface CreateHealthMetricsBatchRequest {
  metrics: CreateHealthMetricRequest[];
}

/**
 * Response for a single health metric
 */
export interface HealthMetricResponse {
  metric: HealthMetric;
}

/**
 * Response for multiple health metrics
 */
export interface HealthMetricsResponse {
  metrics: HealthMetric[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response for aggregated health metrics
 */
export interface AggregatedHealthMetricsResponse {
  results: {
    type: HealthMetricType;
    value: number;
    unit: string;
    timestamp: string;
    aggregationMethod: AggregationMethod;
  }[];
  timePeriod: TimePeriod;
  startDate: string;
  endDate: string;
}

// ==================== Medical Events API ====================

/**
 * Request to create a new medical event
 */
export interface CreateMedicalEventRequest {
  userId: string;
  type: string;
  description: string;
  date: string;
  provider: string;
  documents?: string[];
}

/**
 * Response for a single medical event
 */
export interface MedicalEventResponse {
  event: MedicalEvent;
}

/**
 * Response for multiple medical events
 */
export interface MedicalEventsResponse {
  events: MedicalEvent[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Health Goals API ====================

/**
 * Request to create a new health goal
 */
export interface CreateHealthGoalRequest {
  userId: string;
  type: string;
  target: number;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Request to update a health goal's status
 */
export interface UpdateHealthGoalStatusRequest {
  status: string;
}

/**
 * Response for a single health goal
 */
export interface HealthGoalResponse {
  goal: HealthGoal;
}

/**
 * Response for multiple health goals
 */
export interface HealthGoalsResponse {
  goals: HealthGoal[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response for health goal progress
 */
export interface HealthGoalProgressResponse {
  goal: HealthGoal;
  currentValue: number;
  progressPercentage: number;
  remainingDays: number;
  projectedCompletion: string;
}

// ==================== Device Connections API ====================

/**
 * Request to create a new device connection
 */
export interface CreateDeviceConnectionRequest {
  userId: string;
  deviceType: string;
  deviceId: string;
  status: string;
}

/**
 * Request to update a device connection's sync status
 */
export interface UpdateDeviceSyncRequest {
  lastSync: string;
  status: string;
}

/**
 * Response for a single device connection
 */
export interface DeviceConnectionResponse {
  connection: DeviceConnection;
}

/**
 * Response for multiple device connections
 */
export interface DeviceConnectionsResponse {
  connections: DeviceConnection[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Validation Schemas ====================

/**
 * Zod schema for validating health data query parameters
 */
export const healthDataQueryParamsSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timePeriod: z.nativeEnum(TimePeriod).optional(),
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional(),
});

/**
 * Zod schema for validating health metrics query parameters
 */
export const healthMetricsQueryParamsSchema = healthDataQueryParamsSchema.extend({
  types: z.array(z.nativeEnum(HealthMetricType)).optional(),
  sources: z.array(z.string()).optional(),
  aggregation: z.nativeEnum(AggregationMethod).optional(),
  includeLatest: z.boolean().optional(),
});

/**
 * Zod schema for validating medical events query parameters
 */
export const medicalEventsQueryParamsSchema = healthDataQueryParamsSchema.extend({
  types: z.array(z.string()).optional(),
  providers: z.array(z.string()).optional(),
  includeDocuments: z.boolean().optional(),
});

/**
 * Zod schema for validating health goals query parameters
 */
export const healthGoalsQueryParamsSchema = healthDataQueryParamsSchema.extend({
  types: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  includeCompleted: z.boolean().optional(),
});

/**
 * Zod schema for validating device connections query parameters
 */
export const deviceConnectionsQueryParamsSchema = healthDataQueryParamsSchema.extend({
  deviceTypes: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  lastSyncBefore: z.string().datetime().optional(),
  lastSyncAfter: z.string().datetime().optional(),
});

/**
 * Zod schema for validating create health metric request
 */
export const createHealthMetricRequestSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(HealthMetricType),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  source: z.string(),
});

/**
 * Zod schema for validating create health metrics batch request
 */
export const createHealthMetricsBatchRequestSchema = z.object({
  metrics: z.array(createHealthMetricRequestSchema),
});

/**
 * Zod schema for validating create medical event request
 */
export const createMedicalEventRequestSchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  description: z.string(),
  date: z.string().datetime(),
  provider: z.string(),
  documents: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating create health goal request
 */
export const createHealthGoalRequestSchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  target: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.string(),
});

/**
 * Zod schema for validating update health goal status request
 */
export const updateHealthGoalStatusRequestSchema = z.object({
  status: z.string(),
});

/**
 * Zod schema for validating create device connection request
 */
export const createDeviceConnectionRequestSchema = z.object({
  userId: z.string().uuid(),
  deviceType: z.string(),
  deviceId: z.string(),
  status: z.string(),
});

/**
 * Zod schema for validating update device sync request
 */
export const updateDeviceSyncRequestSchema = z.object({
  lastSync: z.string().datetime(),
  status: z.string(),
});