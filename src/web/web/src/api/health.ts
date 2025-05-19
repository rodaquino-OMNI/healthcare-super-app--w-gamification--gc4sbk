/**
 * Provides API functions for interacting with the health-related endpoints
 * of the AUSTA SuperApp's backend, specifically for the web application.
 * 
 * This module encapsulates the logic for fetching and manipulating health data,
 * such as metrics, goals, and medical history to support the Health Journey.
 */

import axios from 'axios'; // axios 1.6.7
import { API_BASE_URL, API_TIMEOUT } from '@austa/interfaces/api/request.types';
import { formatDate } from 'src/web/web/src/utils/format';
import { validateCPF } from 'src/web/web/src/utils/validation';
import { 
  GET_HEALTH_METRICS, 
  GET_HEALTH_GOALS, 
  GET_MEDICAL_HISTORY, 
  GET_CONNECTED_DEVICES 
} from 'src/web/shared/graphql/queries/health.queries';
import { CREATE_HEALTH_METRIC } from 'src/web/shared/graphql/mutations/health.mutations';
import { useAuth } from 'src/web/web/src/context/AuthContext';

// Import interfaces from @austa/interfaces
import { 
  HealthMetric, 
  HealthMetricType 
} from '@austa/interfaces/health/metric';
import { HealthGoal } from '@austa/interfaces/health/goal';
import { MedicalEvent } from '@austa/interfaces/health/event';
import { DeviceConnection } from '@austa/interfaces/health/device';
import {
  GetHealthMetricsRequest,
  GetHealthMetricsResponse,
  GetHealthGoalsRequest,
  GetHealthGoalsResponse,
  GetMedicalHistoryRequest,
  GetMedicalHistoryResponse,
  GetConnectedDevicesRequest,
  GetConnectedDevicesResponse,
  CreateHealthMetricRequest,
  CreateHealthMetricResponse
} from '@austa/interfaces/api/health.api';
import { ApiErrorResponse, HealthJourneyErrorCode } from '@austa/interfaces/api/error.types';

/**
 * Fetches health metrics for a specific user, date range, and metric types.
 * 
 * @param userId - The ID of the user whose metrics to fetch
 * @param types - Array of metric types to fetch (e.g., HEART_RATE, BLOOD_PRESSURE)
 * @param startDate - The start date for the range of metrics to fetch
 * @param endDate - The end date for the range of metrics to fetch
 * @returns A promise that resolves to an array of HealthMetric objects
 */
export const getHealthMetrics = async (
  userId: string, 
  types: HealthMetricType[], 
  startDate: string, 
  endDate: string
): Promise<HealthMetric[]> => {
  try {
    const request: GetHealthMetricsRequest = {
      userId,
      types,
      startDate,
      endDate
    };

    const response = await axios.post<{ data: { getHealthMetrics: GetHealthMetricsResponse }, errors?: any[] }>
      (`${API_BASE_URL}/graphql`,
      {
        query: GET_HEALTH_METRICS,
        variables: request
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      const error: ApiErrorResponse = {
        code: HealthJourneyErrorCode.HEALTH_METRICS_FETCH_FAILED,
        message: response.data.errors[0].message,
        details: response.data.errors
      };
      throw error;
    }

    return response.data.data.getHealthMetrics.metrics;
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    throw error;
  }
};

/**
 * Fetches health goals for a specific user.
 * 
 * @param userId - The ID of the user whose goals to fetch
 * @returns A promise that resolves to an array of HealthGoal objects
 */
export const getHealthGoals = async (userId: string): Promise<HealthGoal[]> => {
  try {
    const request: GetHealthGoalsRequest = {
      userId
    };

    const response = await axios.post<{ data: { getHealthGoals: GetHealthGoalsResponse }, errors?: any[] }>
      (`${API_BASE_URL}/graphql`,
      {
        query: GET_HEALTH_GOALS,
        variables: request
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      const error: ApiErrorResponse = {
        code: HealthJourneyErrorCode.HEALTH_GOALS_FETCH_FAILED,
        message: response.data.errors[0].message,
        details: response.data.errors
      };
      throw error;
    }

    return response.data.data.getHealthGoals.goals;
  } catch (error) {
    console.error('Error fetching health goals:', error);
    throw error;
  }
};

/**
 * Fetches medical history events for a specific user.
 * 
 * @param userId - The ID of the user whose medical history to fetch
 * @returns A promise that resolves to an array of MedicalEvent objects
 */
export const getMedicalHistory = async (userId: string): Promise<MedicalEvent[]> => {
  try {
    const request: GetMedicalHistoryRequest = {
      userId
    };

    const response = await axios.post<{ data: { getMedicalHistory: GetMedicalHistoryResponse }, errors?: any[] }>
      (`${API_BASE_URL}/graphql`,
      {
        query: GET_MEDICAL_HISTORY,
        variables: request
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      const error: ApiErrorResponse = {
        code: HealthJourneyErrorCode.MEDICAL_HISTORY_FETCH_FAILED,
        message: response.data.errors[0].message,
        details: response.data.errors
      };
      throw error;
    }

    return response.data.data.getMedicalHistory.events;
  } catch (error) {
    console.error('Error fetching medical history:', error);
    throw error;
  }
};

/**
 * Fetches connected devices for a specific user.
 * 
 * @param userId - The ID of the user whose connected devices to fetch
 * @returns A promise that resolves to an array of DeviceConnection objects
 */
export const getConnectedDevices = async (userId: string): Promise<DeviceConnection[]> => {
  try {
    const request: GetConnectedDevicesRequest = {
      userId
    };

    const response = await axios.post<{ data: { getConnectedDevices: GetConnectedDevicesResponse }, errors?: any[] }>
      (`${API_BASE_URL}/graphql`,
      {
        query: GET_CONNECTED_DEVICES,
        variables: request
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      const error: ApiErrorResponse = {
        code: HealthJourneyErrorCode.DEVICE_CONNECTIONS_FETCH_FAILED,
        message: response.data.errors[0].message,
        details: response.data.errors
      };
      throw error;
    }

    return response.data.data.getConnectedDevices.devices;
  } catch (error) {
    console.error('Error fetching connected devices:', error);
    throw error;
  }
};

/**
 * Creates a new health metric for a specific user.
 * 
 * @param recordId - The ID of the health record to add the metric to
 * @param createMetricDto - The data for the new health metric
 * @returns A promise that resolves to the created HealthMetric object
 */
export const createHealthMetric = async (
  recordId: string, 
  createMetricDto: CreateHealthMetricRequest['createMetricDto']
): Promise<HealthMetric> => {
  try {
    const request: CreateHealthMetricRequest = {
      recordId,
      createMetricDto
    };

    const response = await axios.post<{ data: { createHealthMetric: CreateHealthMetricResponse }, errors?: any[] }>
      (`${API_BASE_URL}/graphql`,
      {
        query: CREATE_HEALTH_METRIC,
        variables: request
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      const error: ApiErrorResponse = {
        code: HealthJourneyErrorCode.HEALTH_METRIC_CREATE_FAILED,
        message: response.data.errors[0].message,
        details: response.data.errors
      };
      throw error;
    }

    return response.data.data.createHealthMetric.metric;
  } catch (error) {
    console.error('Error creating health metric:', error);
    throw error;
  }
};