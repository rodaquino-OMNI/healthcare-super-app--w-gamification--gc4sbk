/**
 * @file validation-events.ts
 * @description Provides event fixtures specifically designed for testing validation logic across different event types.
 * 
 * This file contains both valid and invalid event examples that exercise boundary conditions, required fields,
 * data type constraints, and business rules. These fixtures are essential for unit testing validation decorators,
 * ensuring validators reject improper data while accepting valid events across all journeys.
 */

import { EventTypes } from '../../src/dto/event-types.enum';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { ValidationSeverity } from '../../src/interfaces/event-validation.interface';

// ===================================================================
// Helper Functions
// ===================================================================

/**
 * Creates a base event with common properties
 * @param type Event type
 * @param userId User ID
 * @param journey Journey type
 * @param data Event data
 * @returns Base event object
 */
function createBaseEvent<T>(type: string, userId: string, journey: string, data: T): BaseEventDto<T> {
  return {
    type,
    userId,
    journey,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates an invalid base event with missing or invalid properties
 * @param overrides Properties to override in the base event
 * @returns Invalid base event object
 */
function createInvalidBaseEvent(overrides: Partial<BaseEventDto<any>> = {}): Partial<BaseEventDto<any>> {
  // Start with a valid base event
  const baseEvent = createBaseEvent(
    EventTypes.HEALTH_METRIC_RECORDED,
    '123e4567-e89b-12d3-a456-426614174000',
    'health',
    { metricType: 'heartRate', value: 75 }
  );
  
  // Apply overrides
  return { ...baseEvent, ...overrides };
}

// ===================================================================
// Health Journey Event Fixtures
// ===================================================================

export namespace HealthEvents {
  // Valid Health Metric Events
  export const validHealthMetricEvents = {
    /**
     * Valid heart rate metric event
     */
    heartRate: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Valid blood pressure metric event
     */
    bloodPressure: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'bloodPressure',
        systolic: 120,
        diastolic: 80,
        unit: 'mmHg',
        timestamp: new Date().toISOString(),
        source: 'device',
        deviceId: 'device-123'
      }
    ),
    
    /**
     * Valid weight metric event
     */
    weight: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'weight',
        value: 70.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        source: 'device',
        deviceId: 'scale-123'
      }
    ),
    
    /**
     * Valid steps metric event
     */
    steps: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'steps',
        value: 8500,
        unit: 'steps',
        timestamp: new Date().toISOString(),
        source: 'device',
        deviceId: 'watch-123'
      }
    ),
    
    /**
     * Valid blood glucose metric event
     */
    bloodGlucose: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'bloodGlucose',
        value: 95,
        unit: 'mg/dL',
        timestamp: new Date().toISOString(),
        source: 'device',
        deviceId: 'glucose-meter-123'
      }
    ),
    
    /**
     * Valid sleep metric event
     */
    sleep: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'sleep',
        value: 7.5,
        unit: 'hours',
        timestamp: new Date().toISOString(),
        source: 'device',
        deviceId: 'watch-123',
        sleepQuality: 'good'
      }
    )
  };
  
  // Invalid Health Metric Events
  export const invalidHealthMetricEvents = {
    /**
     * Missing metric type
     */
    missingMetricType: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        // metricType is missing
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Invalid metric type
     */
    invalidMetricType: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'invalidType', // Invalid metric type
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Missing value
     */
    missingValue: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        // value is missing
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Invalid value type (string instead of number)
     */
    invalidValueType: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: '75', // String instead of number
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Physiologically implausible value
     */
    implausibleValue: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 300, // Implausible heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Missing unit
     */
    missingUnit: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        // unit is missing
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Invalid unit for metric type
     */
    invalidUnit: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        unit: 'kg', // Invalid unit for heart rate
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    /**
     * Invalid timestamp format
     */
    invalidTimestamp: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: '2023-04-01', // Invalid ISO format
        source: 'manual'
      }
    ),
    
    /**
     * Invalid source
     */
    invalidSource: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'invalid' // Invalid source
      }
    ),
    
    /**
     * Device ID required but missing
     */
    missingDeviceId: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'device' // Device source requires deviceId
        // deviceId is missing
      }
    )
  };
  
  // Valid Health Goal Events
  export const validHealthGoalEvents = {
    /**
     * Valid steps goal event
     */
    stepsGoal: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        frequency: 'daily'
      }
    ),
    
    /**
     * Valid weight goal event
     */
    weightGoal: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-124',
        type: 'weight',
        target: 70,
        current: 75,
        unit: 'kg',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        frequency: 'weekly'
      }
    ),
    
    /**
     * Valid exercise goal event
     */
    exerciseGoal: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-125',
        type: 'exercise',
        target: 150,
        unit: 'minutes',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        frequency: 'weekly'
      }
    ),
    
    /**
     * Valid sleep goal event
     */
    sleepGoal: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-126',
        type: 'sleep',
        target: 8,
        unit: 'hours',
        startDate: new Date().toISOString(),
        frequency: 'daily'
      }
    )
  };
  
  // Invalid Health Goal Events
  export const invalidHealthGoalEvents = {
    /**
     * Missing goal type
     */
    missingType: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        // type is missing
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * Invalid goal type
     */
    invalidType: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'invalidType', // Invalid goal type
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * Missing target value
     */
    missingTarget: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        // target is missing
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * Invalid target value (too low)
     */
    targetTooLow: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 100, // Too low for steps goal
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * Invalid target value (too high)
     */
    targetTooHigh: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 100000, // Too high for steps goal
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * Missing start date
     */
    missingStartDate: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 10000,
        unit: 'steps',
        // startDate is missing
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily'
      }
    ),
    
    /**
     * End date before start date
     */
    endDateBeforeStartDate: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in the past
        frequency: 'daily'
      }
    ),
    
    /**
     * Invalid frequency
     */
    invalidFrequency: createBaseEvent<any>(
      EventTypes.HEALTH_GOAL_CREATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        goalId: 'goal-123',
        type: 'steps',
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'invalid' // Invalid frequency
      }
    )
  };
  
  // Valid Device Connection Events
  export const validDeviceEvents = {
    /**
     * Valid smartwatch connection event
     */
    smartwatch: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'smartwatch',
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Valid blood pressure monitor connection event
     */
    bloodPressureMonitor: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-124',
        deviceType: 'bloodPressureMonitor',
        manufacturer: 'Omron',
        model: 'M7 Intelli IT',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['bloodPressure']
      }
    ),
    
    /**
     * Valid smart scale connection event
     */
    smartScale: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-125',
        deviceType: 'smartScale',
        manufacturer: 'Withings',
        model: 'Body+',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['weight', 'bodyFat']
      }
    )
  };
  
  // Invalid Device Connection Events
  export const invalidDeviceEvents = {
    /**
     * Missing device ID
     */
    missingDeviceId: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        // deviceId is missing
        deviceType: 'smartwatch',
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Missing device type
     */
    missingDeviceType: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        // deviceType is missing
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Invalid device type
     */
    invalidDeviceType: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'invalidType', // Invalid device type
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Missing manufacturer
     */
    missingManufacturer: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'smartwatch',
        // manufacturer is missing
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Missing model
     */
    missingModel: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'smartwatch',
        manufacturer: 'Apple',
        // model is missing
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Invalid connection status
     */
    invalidConnectionStatus: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'smartwatch',
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'invalid', // Invalid connection status
        lastSyncTimestamp: new Date().toISOString(),
        permissions: ['heartRate', 'steps', 'sleep']
      }
    ),
    
    /**
     * Invalid permissions format
     */
    invalidPermissionsFormat: createBaseEvent<any>(
      EventTypes.HEALTH_DEVICE_CONNECTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        deviceId: 'device-123',
        deviceType: 'smartwatch',
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionStatus: 'connected',
        lastSyncTimestamp: new Date().toISOString(),
        permissions: 'all' // Should be an array
      }
    )
  };
}

// ===================================================================
// Care Journey Event Fixtures
// ===================================================================

export namespace CareEvents {
  // Valid Appointment Events
  export const validAppointmentEvents = {
    /**
     * Valid in-person appointment booking event
     */
    inPersonAppointment: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        duration: 30, // 30 minutes
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Valid video appointment booking event
     */
    videoAppointment: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-124',
        providerId: 'provider-124',
        specialization: 'Dermatologia',
        appointmentType: 'video',
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        duration: 15, // 15 minutes
        reason: 'Skin rash follow-up',
        status: 'scheduled'
      }
    ),
    
    /**
     * Valid phone appointment booking event
     */
    phoneAppointment: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-125',
        providerId: 'provider-125',
        specialization: 'Psiquiatria',
        appointmentType: 'phone',
        dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        duration: 45, // 45 minutes
        reason: 'Medication review',
        status: 'scheduled'
      }
    )
  };
  
  // Invalid Appointment Events
  export const invalidAppointmentEvents = {
    /**
     * Missing provider ID
     */
    missingProviderId: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        // providerId is missing
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Missing specialization
     */
    missingSpecialization: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        // specialization is missing
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Invalid appointment type
     */
    invalidAppointmentType: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'invalid', // Invalid appointment type
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Past appointment date
     */
    pastAppointmentDate: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in the past
        duration: 30,
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Invalid duration (too short)
     */
    durationTooShort: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 2, // Too short
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Invalid duration (too long)
     */
    durationTooLong: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 240, // Too long
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Missing reason
     */
    missingReason: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        // reason is missing
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    ),
    
    /**
     * Missing location for in-person appointment
     */
    missingLocation: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        // location is missing but required for in-person
        status: 'scheduled'
      }
    ),
    
    /**
     * Invalid status
     */
    invalidStatus: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'invalid' // Invalid status
      }
    )
  };
  
  // Valid Medication Events
  export const validMedicationEvents = {
    /**
     * Valid medication added event
     */
    medicationAdded: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Valid medication taken event
     */
    medicationTaken: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_TAKEN,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        timestamp: new Date().toISOString(),
        takenOnSchedule: true,
        dosageTaken: '20mg'
      }
    ),
    
    /**
     * Valid medication missed event
     */
    medicationMissed: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_MISSED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        reportedTimestamp: new Date().toISOString(),
        reason: 'Forgot to take'
      }
    )
  };
  
  // Invalid Medication Events
  export const invalidMedicationEvents = {
    /**
     * Missing medication name
     */
    missingName: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        // name is missing
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid dosage format
     */
    invalidDosage: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: '20mg', // Should be an object
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid dosage amount (negative)
     */
    negativeDosage: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: -20, // Negative amount
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid dosage unit
     */
    invalidDosageUnit: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'invalid' // Invalid unit
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid frequency format
     */
    invalidFrequency: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: 'once daily', // Should be an object
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid frequency period
     */
    invalidFrequencyPeriod: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'invalid' // Invalid period
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * Invalid schedule time format
     */
    invalidScheduleTime: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '8pm', // Invalid time format
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    ),
    
    /**
     * End date before start date
     */
    endDateBeforeStartDate: createBaseEvent<any>(
      EventTypes.CARE_MEDICATION_ADDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        medicationId: 'med-123',
        name: 'Atorvastatin',
        dosage: {
          amount: 20,
          unit: 'mg'
        },
        frequency: {
          times: 1,
          period: 'day'
        },
        schedule: [
          {
            time: '20:00',
            taken: false
          }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in the past
        instructions: 'Take with food',
        prescribedBy: 'provider-123',
        refillReminder: true
      }
    )
  };
  
  // Valid Telemedicine Events
  export const validTelemedicineEvents = {
    /**
     * Valid telemedicine session started event
     */
    sessionStarted: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        providerId: 'provider-123',
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'in-progress',
        sessionType: 'video',
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'good'
        }
      }
    ),
    
    /**
     * Valid telemedicine session completed event
     */
    sessionCompleted: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        appointmentId: 'appt-123',
        endTime: new Date().toISOString(),
        duration: 15, // 15 minutes
        connectionQuality: 'excellent'
      }
    )
  };
  
  // Invalid Telemedicine Events
  export const invalidTelemedicineEvents = {
    /**
     * Missing session ID
     */
    missingSessionId: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        // sessionId is missing
        providerId: 'provider-123',
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'in-progress',
        sessionType: 'video',
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'good'
        }
      }
    ),
    
    /**
     * Missing provider ID
     */
    missingProviderId: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        // providerId is missing
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'in-progress',
        sessionType: 'video',
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'good'
        }
      }
    ),
    
    /**
     * Invalid session type
     */
    invalidSessionType: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        providerId: 'provider-123',
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'in-progress',
        sessionType: 'invalid', // Invalid session type
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'good'
        }
      }
    ),
    
    /**
     * Invalid status
     */
    invalidStatus: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        providerId: 'provider-123',
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'invalid', // Invalid status
        sessionType: 'video',
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'good'
        }
      }
    ),
    
    /**
     * Invalid connection quality
     */
    invalidConnectionQuality: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_STARTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        providerId: 'provider-123',
        appointmentId: 'appt-123',
        startTime: new Date().toISOString(),
        status: 'in-progress',
        sessionType: 'video',
        technicalDetails: {
          platform: 'Web',
          browserInfo: 'Chrome 100.0.4896.127',
          deviceInfo: 'Windows 10',
          connectionQuality: 'invalid' // Invalid connection quality
        }
      }
    ),
    
    /**
     * Missing duration in completed event
     */
    missingDuration: createBaseEvent<any>(
      EventTypes.CARE_TELEMEDICINE_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        sessionId: 'session-123',
        appointmentId: 'appt-123',
        endTime: new Date().toISOString(),
        // duration is missing
        connectionQuality: 'excellent'
      }
    )
  };
}

// ===================================================================
// Plan Journey Event Fixtures
// ===================================================================

export namespace PlanEvents {
  // Valid Claim Events
  export const validClaimEvents = {
    /**
     * Valid claim submission event
     */
    claimSubmitted: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Valid claim status update event
     */
    claimStatusUpdated: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_STATUS_UPDATED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        previousStatus: 'submitted',
        newStatus: 'approved',
        updateTimestamp: new Date().toISOString(),
        reason: 'All documentation verified'
      }
    )
  };
  
  // Invalid Claim Events
  export const invalidClaimEvents = {
    /**
     * Missing service date
     */
    missingServiceDate: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        // serviceDate is missing
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Missing provider name
     */
    missingProviderName: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        // providerName is missing
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Missing service type
     */
    missingServiceType: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        // serviceType is missing
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Invalid amount format
     */
    invalidAmountFormat: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: 250.00, // Should be an object
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Negative amount
     */
    negativeAmount: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: -250.00, // Negative amount
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Invalid currency
     */
    invalidCurrency: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'XXX' // Invalid currency code
        },
        status: 'submitted',
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Invalid status
     */
    invalidStatus: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'invalid', // Invalid status
        documents: [
          {
            documentId: 'doc-123',
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    ),
    
    /**
     * Missing document ID in documents
     */
    missingDocumentId: createBaseEvent<any>(
      EventTypes.PLAN_CLAIM_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        claimId: 'claim-123',
        serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        providerName: 'Dr. João Silva',
        providerId: 'provider-123',
        serviceType: 'Consulta Médica',
        diagnosisCodes: ['J00'],
        procedureCodes: ['99213'],
        amount: {
          total: 250.00,
          covered: 200.00,
          patientResponsibility: 50.00,
          currency: 'BRL'
        },
        status: 'submitted',
        documents: [
          {
            // documentId is missing
            documentType: 'receipt',
            uploadDate: new Date().toISOString()
          }
        ],
        notes: 'Regular checkup'
      }
    )
  };
  
  // Valid Benefit Events
  export const validBenefitEvents = {
    /**
     * Valid benefit utilization event
     */
    benefitUtilized: createBaseEvent<any>(
      EventTypes.PLAN_BENEFIT_UTILIZED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitId: 'benefit-123',
        benefitType: 'consultation',
        category: 'medical',
        utilizationTimestamp: new Date().toISOString(),
        providerId: 'provider-123',
        savingsAmount: 150.00
      }
    ),
    
    /**
     * Valid benefits viewed event
     */
    benefitsViewed: createBaseEvent<any>(
      EventTypes.PLAN_BENEFITS_VIEWED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitCategories: ['medical', 'dental', 'vision'],
        planId: 'plan-123',
        viewTimestamp: new Date().toISOString(),
        viewDuration: 120 // 2 minutes
      }
    )
  };
  
  // Invalid Benefit Events
  export const invalidBenefitEvents = {
    /**
     * Missing benefit type
     */
    missingBenefitType: createBaseEvent<any>(
      EventTypes.PLAN_BENEFIT_UTILIZED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitId: 'benefit-123',
        // benefitType is missing
        category: 'medical',
        utilizationTimestamp: new Date().toISOString(),
        providerId: 'provider-123',
        savingsAmount: 150.00
      }
    ),
    
    /**
     * Invalid benefit category
     */
    invalidCategory: createBaseEvent<any>(
      EventTypes.PLAN_BENEFIT_UTILIZED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitId: 'benefit-123',
        benefitType: 'consultation',
        category: 'invalid', // Invalid category
        utilizationTimestamp: new Date().toISOString(),
        providerId: 'provider-123',
        savingsAmount: 150.00
      }
    ),
    
    /**
     * Missing utilization timestamp
     */
    missingTimestamp: createBaseEvent<any>(
      EventTypes.PLAN_BENEFIT_UTILIZED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitId: 'benefit-123',
        benefitType: 'consultation',
        category: 'medical',
        // utilizationTimestamp is missing
        providerId: 'provider-123',
        savingsAmount: 150.00
      }
    ),
    
    /**
     * Negative savings amount
     */
    negativeSavings: createBaseEvent<any>(
      EventTypes.PLAN_BENEFIT_UTILIZED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitId: 'benefit-123',
        benefitType: 'consultation',
        category: 'medical',
        utilizationTimestamp: new Date().toISOString(),
        providerId: 'provider-123',
        savingsAmount: -150.00 // Negative amount
      }
    ),
    
    /**
     * Empty benefit categories array
     */
    emptyCategories: createBaseEvent<any>(
      EventTypes.PLAN_BENEFITS_VIEWED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        benefitCategories: [], // Empty array
        planId: 'plan-123',
        viewTimestamp: new Date().toISOString(),
        viewDuration: 120
      }
    )
  };
  
  // Valid Plan Selection Events
  export const validPlanEvents = {
    /**
     * Valid plan comparison event
     */
    planComparison: createBaseEvent<any>(
      EventTypes.PLAN_COMPARISON_PERFORMED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        planIds: ['plan-123', 'plan-124', 'plan-125'],
        comparisonTimestamp: new Date().toISOString(),
        comparisonDuration: 300, // 5 minutes
        selectedPlanId: 'plan-124'
      }
    ),
    
    /**
     * Valid coverage viewed event
     */
    coverageViewed: createBaseEvent<any>(
      EventTypes.PLAN_COVERAGE_VIEWED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        coverageType: 'medical',
        planId: 'plan-123',
        viewTimestamp: new Date().toISOString(),
        viewDuration: 60 // 1 minute
      }
    )
  };
  
  // Invalid Plan Selection Events
  export const invalidPlanEvents = {
    /**
     * Empty plan IDs array
     */
    emptyPlanIds: createBaseEvent<any>(
      EventTypes.PLAN_COMPARISON_PERFORMED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        planIds: [], // Empty array
        comparisonTimestamp: new Date().toISOString(),
        comparisonDuration: 300,
        selectedPlanId: 'plan-124'
      }
    ),
    
    /**
     * Selected plan not in compared plans
     */
    invalidSelectedPlan: createBaseEvent<any>(
      EventTypes.PLAN_COMPARISON_PERFORMED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        planIds: ['plan-123', 'plan-124', 'plan-125'],
        comparisonTimestamp: new Date().toISOString(),
        comparisonDuration: 300,
        selectedPlanId: 'plan-999' // Not in the compared plans
      }
    ),
    
    /**
     * Missing coverage type
     */
    missingCoverageType: createBaseEvent<any>(
      EventTypes.PLAN_COVERAGE_VIEWED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        // coverageType is missing
        planId: 'plan-123',
        viewTimestamp: new Date().toISOString(),
        viewDuration: 60
      }
    ),
    
    /**
     * Invalid coverage type
     */
    invalidCoverageType: createBaseEvent<any>(
      EventTypes.PLAN_COVERAGE_VIEWED,
      '123e4567-e89b-12d3-a456-426614174000',
      'plan',
      {
        coverageType: 'invalid', // Invalid coverage type
        planId: 'plan-123',
        viewTimestamp: new Date().toISOString(),
        viewDuration: 60
      }
    )
  };
}

// ===================================================================
// Cross-Journey Event Fixtures
// ===================================================================

export namespace CrossJourneyEvents {
  // Valid Cross-Journey Events
  export const validCrossJourneyEvents = {
    /**
     * Valid profile completed event
     */
    profileCompleted: createBaseEvent<any>(
      EventTypes.USER_PROFILE_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      null, // No specific journey
      {
        completionTimestamp: new Date().toISOString(),
        completedSections: ['personal', 'medical', 'insurance', 'preferences'],
        profileCompleteness: 100
      }
    ),
    
    /**
     * Valid journey onboarding completed event
     */
    onboardingCompleted: createBaseEvent<any>(
      EventTypes.JOURNEY_ONBOARDING_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health', // Specific journey
      {
        journeyType: 'health',
        completionTimestamp: new Date().toISOString(),
        completedSteps: ['intro', 'goals', 'devices', 'notifications']
      }
    ),
    
    /**
     * Valid feedback submitted event
     */
    feedbackSubmitted: createBaseEvent<any>(
      EventTypes.USER_FEEDBACK_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care', // Specific journey
      {
        feedbackId: 'feedback-123',
        featureType: 'appointment-booking',
        journeyType: 'care',
        rating: 4,
        comments: 'Easy to use but could be faster',
        submissionTimestamp: new Date().toISOString()
      }
    )
  };
  
  // Invalid Cross-Journey Events
  export const invalidCrossJourneyEvents = {
    /**
     * Missing completed sections
     */
    missingCompletedSections: createBaseEvent<any>(
      EventTypes.USER_PROFILE_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      {
        completionTimestamp: new Date().toISOString(),
        // completedSections is missing
        profileCompleteness: 100
      }
    ),
    
    /**
     * Invalid profile completeness (over 100%)
     */
    invalidCompleteness: createBaseEvent<any>(
      EventTypes.USER_PROFILE_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      {
        completionTimestamp: new Date().toISOString(),
        completedSections: ['personal', 'medical', 'insurance', 'preferences'],
        profileCompleteness: 110 // Over 100%
      }
    ),
    
    /**
     * Journey mismatch (journey in payload doesn't match journey in event)
     */
    journeyMismatch: createBaseEvent<any>(
      EventTypes.JOURNEY_ONBOARDING_COMPLETED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        journeyType: 'care', // Mismatch with event journey
        completionTimestamp: new Date().toISOString(),
        completedSteps: ['intro', 'goals', 'devices', 'notifications']
      }
    ),
    
    /**
     * Invalid rating (out of range)
     */
    invalidRating: createBaseEvent<any>(
      EventTypes.USER_FEEDBACK_SUBMITTED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        feedbackId: 'feedback-123',
        featureType: 'appointment-booking',
        journeyType: 'care',
        rating: 6, // Out of range (should be 1-5)
        comments: 'Easy to use but could be faster',
        submissionTimestamp: new Date().toISOString()
      }
    )
  };
}

// ===================================================================
// Base Event Validation Fixtures
// ===================================================================

/**
 * Valid base events for testing basic validation
 */
export const validBaseEvents = {
  /**
   * Minimal valid event with all required fields
   */
  minimal: createBaseEvent<any>(
    EventTypes.HEALTH_METRIC_RECORDED,
    '123e4567-e89b-12d3-a456-426614174000',
    'health',
    { metricType: 'heartRate', value: 75 }
  ),
  
  /**
   * Complete valid event with all fields
   */
  complete: createBaseEvent<any>(
    EventTypes.HEALTH_METRIC_RECORDED,
    '123e4567-e89b-12d3-a456-426614174000',
    'health',
    {
      metricType: 'heartRate',
      value: 75,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'manual'
    }
  )
};

/**
 * Invalid base events for testing basic validation failures
 */
export const invalidBaseEvents = {
  /**
   * Missing event type
   */
  missingType: createInvalidBaseEvent({ type: undefined }),
  
  /**
   * Empty event type
   */
  emptyType: createInvalidBaseEvent({ type: '' }),
  
  /**
   * Missing user ID
   */
  missingUserId: createInvalidBaseEvent({ userId: undefined }),
  
  /**
   * Invalid user ID format (not a UUID)
   */
  invalidUserId: createInvalidBaseEvent({ userId: 'not-a-uuid' }),
  
  /**
   * Missing data
   */
  missingData: createInvalidBaseEvent({ data: undefined }),
  
  /**
   * Invalid data (not an object)
   */
  invalidData: createInvalidBaseEvent({ data: 'not-an-object' }),
  
  /**
   * Invalid journey
   */
  invalidJourney: createInvalidBaseEvent({ journey: 'invalid-journey' }),
  
  /**
   * Missing timestamp
   */
  missingTimestamp: createInvalidBaseEvent({ timestamp: undefined }),
  
  /**
   * Invalid timestamp format
   */
  invalidTimestamp: createInvalidBaseEvent({ timestamp: '2023-04-01' }) // Not ISO format
};

// ===================================================================
// Validation Categories
// ===================================================================

/**
 * Events organized by validation failure category for testing specific validation rules
 */
export const validationCategories = {
  /**
   * Required field validation failures
   */
  requiredFields: {
    missingType: invalidBaseEvents.missingType,
    missingUserId: invalidBaseEvents.missingUserId,
    missingData: invalidBaseEvents.missingData,
    missingTimestamp: invalidBaseEvents.missingTimestamp,
    missingMetricType: HealthEvents.invalidHealthMetricEvents.missingMetricType,
    missingValue: HealthEvents.invalidHealthMetricEvents.missingValue,
    missingProviderId: CareEvents.invalidAppointmentEvents.missingProviderId,
    missingServiceDate: PlanEvents.invalidClaimEvents.missingServiceDate
  },
  
  /**
   * Data type validation failures
   */
  dataTypes: {
    invalidUserId: invalidBaseEvents.invalidUserId,
    invalidData: invalidBaseEvents.invalidData,
    invalidTimestamp: invalidBaseEvents.invalidTimestamp,
    invalidValueType: HealthEvents.invalidHealthMetricEvents.invalidValueType,
    invalidDosage: CareEvents.invalidMedicationEvents.invalidDosage,
    invalidAmountFormat: PlanEvents.invalidClaimEvents.invalidAmountFormat
  },
  
  /**
   * Enum/constant validation failures
   */
  enumValidation: {
    invalidJourney: invalidBaseEvents.invalidJourney,
    invalidMetricType: HealthEvents.invalidHealthMetricEvents.invalidMetricType,
    invalidSource: HealthEvents.invalidHealthMetricEvents.invalidSource,
    invalidAppointmentType: CareEvents.invalidAppointmentEvents.invalidAppointmentType,
    invalidStatus: CareEvents.invalidAppointmentEvents.invalidStatus,
    invalidSessionType: CareEvents.invalidTelemedicineEvents.invalidSessionType,
    invalidCategory: PlanEvents.invalidBenefitEvents.invalidCategory,
    invalidCoverageType: PlanEvents.invalidPlanEvents.invalidCoverageType
  },
  
  /**
   * Range validation failures
   */
  rangeValidation: {
    implausibleValue: HealthEvents.invalidHealthMetricEvents.implausibleValue,
    targetTooLow: HealthEvents.invalidHealthGoalEvents.targetTooLow,
    targetTooHigh: HealthEvents.invalidHealthGoalEvents.targetTooHigh,
    durationTooShort: CareEvents.invalidAppointmentEvents.durationTooShort,
    durationTooLong: CareEvents.invalidAppointmentEvents.durationTooLong,
    negativeDosage: CareEvents.invalidMedicationEvents.negativeDosage,
    negativeAmount: PlanEvents.invalidClaimEvents.negativeAmount,
    negativeSavings: PlanEvents.invalidBenefitEvents.negativeSavings,
    invalidRating: CrossJourneyEvents.invalidCrossJourneyEvents.invalidRating
  },
  
  /**
   * Format validation failures
   */
  formatValidation: {
    invalidTimestamp: invalidBaseEvents.invalidTimestamp,
    invalidUnit: HealthEvents.invalidHealthMetricEvents.invalidUnit,
    invalidDosageUnit: CareEvents.invalidMedicationEvents.invalidDosageUnit,
    invalidScheduleTime: CareEvents.invalidMedicationEvents.invalidScheduleTime,
    invalidCurrency: PlanEvents.invalidClaimEvents.invalidCurrency,
    invalidPermissionsFormat: HealthEvents.invalidDeviceEvents.invalidPermissionsFormat
  },
  
  /**
   * Logical validation failures
   */
  logicalValidation: {
    endDateBeforeStartDate: HealthEvents.invalidHealthGoalEvents.endDateBeforeStartDate,
    pastAppointmentDate: CareEvents.invalidAppointmentEvents.pastAppointmentDate,
    endDateBeforeStartDate: CareEvents.invalidMedicationEvents.endDateBeforeStartDate,
    journeyMismatch: CrossJourneyEvents.invalidCrossJourneyEvents.journeyMismatch,
    invalidSelectedPlan: PlanEvents.invalidPlanEvents.invalidSelectedPlan,
    missingLocation: CareEvents.invalidAppointmentEvents.missingLocation
  },
  
  /**
   * Dependency validation failures (when one field depends on another)
   */
  dependencyValidation: {
    missingDeviceId: HealthEvents.invalidHealthMetricEvents.missingDeviceId,
    missingLocation: CareEvents.invalidAppointmentEvents.missingLocation,
    missingDuration: CareEvents.invalidTelemedicineEvents.missingDuration,
    emptyCategories: PlanEvents.invalidBenefitEvents.emptyCategories,
    emptyPlanIds: PlanEvents.invalidPlanEvents.emptyPlanIds
  }
};

// ===================================================================
// Boundary Test Cases
// ===================================================================

/**
 * Boundary test cases for testing edge conditions
 */
export const boundaryTestCases = {
  /**
   * Minimum valid values
   */
  minimumValues: {
    heartRate: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 30, // Minimum valid heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    appointmentDuration: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 5, // Minimum valid duration
        reason: 'Quick check',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    )
  },
  
  /**
   * Maximum valid values
   */
  maximumValues: {
    heartRate: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 220, // Maximum valid heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    appointmentDuration: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 180, // Maximum valid duration
        reason: 'Comprehensive evaluation',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    )
  },
  
  /**
   * Just below minimum values (invalid)
   */
  belowMinimumValues: {
    heartRate: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 29, // Just below minimum valid heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    appointmentDuration: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 4, // Just below minimum valid duration
        reason: 'Quick check',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    )
  },
  
  /**
   * Just above maximum values (invalid)
   */
  aboveMaximumValues: {
    heartRate: createBaseEvent<any>(
      EventTypes.HEALTH_METRIC_RECORDED,
      '123e4567-e89b-12d3-a456-426614174000',
      'health',
      {
        metricType: 'heartRate',
        value: 221, // Just above maximum valid heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual'
      }
    ),
    
    appointmentDuration: createBaseEvent<any>(
      EventTypes.CARE_APPOINTMENT_BOOKED,
      '123e4567-e89b-12d3-a456-426614174000',
      'care',
      {
        appointmentId: 'appt-123',
        providerId: 'provider-123',
        specialization: 'Cardiologia',
        appointmentType: 'in-person',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 181, // Just above maximum valid duration
        reason: 'Comprehensive evaluation',
        location: {
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brazil'
        },
        status: 'scheduled'
      }
    )
  }
};