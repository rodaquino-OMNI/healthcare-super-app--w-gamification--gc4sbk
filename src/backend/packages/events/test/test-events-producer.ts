/**
 * Test Events Producer
 * 
 * Utility for generating test events for all supported event types across journey services.
 * This file provides factory methods for creating standardized, valid test events with
 * customizable payloads for each journey (Health, Care, Plan).
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType } from '../src/dto/event-types.enum';
import { BaseEventDto } from '../src/dto/base-event.dto';
import { HealthMetricEventDto } from '../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../src/dto/medication-event.dto';
import { ClaimEventDto } from '../src/dto/claim-event.dto';
import { BenefitEventDto } from '../src/dto/benefit-event.dto';
import { PlanEventDto } from '../src/dto/plan-event.dto';
import { CareEventDto } from '../src/dto/care-event.dto';
import { HealthEventDto } from '../src/dto/health-event.dto';

/**
 * Interface for common event options that apply to all event types
 */
export interface TestEventOptions {
  userId?: string;
  timestamp?: string;
  eventId?: string;
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Base class for test event generation
 */
export class TestEventsProducer {
  /**
   * Creates a base event with common properties
   * 
   * @param type - The event type
   * @param options - Common event options
   * @returns A base event object with common properties
   */
  static createBaseEvent(type: EventType, options: TestEventOptions = {}): BaseEventDto {
    return {
      eventId: options.eventId || uuidv4(),
      userId: options.userId || '12345678-1234-1234-1234-123456789012',
      timestamp: options.timestamp || new Date().toISOString(),
      type,
      version: options.version || '1.0.0',
      metadata: options.metadata || {
        source: 'test-events-producer',
        correlationId: uuidv4(),
      },
      data: {}
    };
  }

  /**
   * Health Journey Event Factories
   */
  static health = {
    /**
     * Creates a health metric recording event
     * 
     * @param metricType - Type of health metric (HEART_RATE, BLOOD_PRESSURE, etc.)
     * @param value - Metric value
     * @param options - Common event options
     * @returns A valid health metric event
     */
    createMetricRecordedEvent: (
      metricType: string = 'HEART_RATE',
      value: number | string = 75,
      options: TestEventOptions = {}
    ): HealthMetricEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.HEALTH_METRIC_RECORDED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          metricType,
          value: typeof value === 'number' ? value : parseFloat(value),
          unit: metricType === 'HEART_RATE' ? 'bpm' : 
                metricType === 'BLOOD_PRESSURE' ? 'mmHg' :
                metricType === 'BLOOD_GLUCOSE' ? 'mg/dL' :
                metricType === 'WEIGHT' ? 'kg' :
                metricType === 'STEPS' ? 'steps' :
                metricType === 'SLEEP' ? 'hours' : 'unknown',
          recordedAt: new Date().toISOString(),
          source: 'manual',
          deviceId: null,
        }
      };
    },

    /**
     * Creates a health goal achieved event
     * 
     * @param goalType - Type of health goal (STEPS, WEIGHT, etc.)
     * @param options - Common event options
     * @returns A valid health goal achieved event
     */
    createGoalAchievedEvent: (
      goalType: string = 'STEPS',
      options: TestEventOptions = {}
    ): HealthGoalEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.HEALTH_GOAL_ACHIEVED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          goalId: uuidv4(),
          goalType,
          targetValue: goalType === 'STEPS' ? 10000 :
                      goalType === 'WEIGHT' ? 70 :
                      goalType === 'SLEEP' ? 8 : 100,
          achievedValue: goalType === 'STEPS' ? 10050 :
                        goalType === 'WEIGHT' ? 70 :
                        goalType === 'SLEEP' ? 8.2 : 100,
          achievedAt: new Date().toISOString(),
          streakCount: 3,
        }
      };
    },

    /**
     * Creates a device connected event
     * 
     * @param deviceType - Type of device (Smartwatch, Blood Pressure Monitor, etc.)
     * @param options - Common event options
     * @returns A valid device connected event
     */
    createDeviceConnectedEvent: (
      deviceType: string = 'Smartwatch',
      options: TestEventOptions = {}
    ): HealthEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.HEALTH_DEVICE_CONNECTED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          deviceId: uuidv4(),
          deviceType,
          manufacturer: 'Test Manufacturer',
          model: 'Test Model',
          connectedAt: new Date().toISOString(),
          capabilities: deviceType === 'Smartwatch' ? ['HEART_RATE', 'STEPS', 'SLEEP'] :
                        deviceType === 'Blood Pressure Monitor' ? ['BLOOD_PRESSURE'] :
                        deviceType === 'Glucose Monitor' ? ['BLOOD_GLUCOSE'] :
                        deviceType === 'Smart Scale' ? ['WEIGHT'] : [],
        }
      };
    },

    /**
     * Creates a health insight generated event
     * 
     * @param insightType - Type of health insight
     * @param options - Common event options
     * @returns A valid health insight event
     */
    createInsightGeneratedEvent: (
      insightType: string = 'ACTIVITY_TREND',
      options: TestEventOptions = {}
    ): HealthEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.HEALTH_INSIGHT_GENERATED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          insightId: uuidv4(),
          insightType,
          title: `Your ${insightType.toLowerCase().replace('_', ' ')} analysis`,
          description: `This is a test insight about your ${insightType.toLowerCase().replace('_', ' ')}.`,
          generatedAt: new Date().toISOString(),
          relatedMetrics: insightType === 'ACTIVITY_TREND' ? ['STEPS'] :
                          insightType === 'SLEEP_QUALITY' ? ['SLEEP'] :
                          insightType === 'HEART_HEALTH' ? ['HEART_RATE', 'BLOOD_PRESSURE'] : [],
          severity: 'INFORMATIONAL',
        }
      };
    },
  };

  /**
   * Care Journey Event Factories
   */
  static care = {
    /**
     * Creates an appointment booked event
     * 
     * @param specialtyName - Medical specialty for the appointment
     * @param options - Common event options
     * @returns A valid appointment booked event
     */
    createAppointmentBookedEvent: (
      specialtyName: string = 'Cardiologia',
      options: TestEventOptions = {}
    ): AppointmentEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.CARE_APPOINTMENT_BOOKED,
        options
      );
      
      // Set appointment date to 7 days in the future
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 7);
      
      return {
        ...baseEvent,
        data: {
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          providerName: `Dr. Test ${specialtyName}`,
          specialtyName,
          appointmentDate: appointmentDate.toISOString(),
          appointmentType: 'IN_PERSON',
          location: 'Test Clinic',
          status: 'CONFIRMED',
          bookedAt: new Date().toISOString(),
        }
      };
    },

    /**
     * Creates an appointment completed event
     * 
     * @param appointmentId - ID of the appointment (optional, will generate if not provided)
     * @param options - Common event options
     * @returns A valid appointment completed event
     */
    createAppointmentCompletedEvent: (
      appointmentId: string = uuidv4(),
      options: TestEventOptions = {}
    ): AppointmentEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.CARE_APPOINTMENT_COMPLETED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          appointmentId,
          completedAt: new Date().toISOString(),
          duration: 30, // minutes
          followUpRecommended: Math.random() > 0.5,
          notes: 'Test appointment completion notes',
        }
      };
    },

    /**
     * Creates a medication taken event
     * 
     * @param medicationName - Name of the medication
     * @param options - Common event options
     * @returns A valid medication taken event
     */
    createMedicationTakenEvent: (
      medicationName: string = 'Test Medication',
      options: TestEventOptions = {}
    ): MedicationEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.CARE_MEDICATION_TAKEN,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          medicationId: uuidv4(),
          medicationName,
          dosage: '10mg',
          takenAt: new Date().toISOString(),
          scheduledFor: new Date().toISOString(),
          adherence: 'ON_TIME',
        }
      };
    },

    /**
     * Creates a telemedicine session event
     * 
     * @param sessionStatus - Status of the telemedicine session
     * @param options - Common event options
     * @returns A valid telemedicine session event
     */
    createTelemedicineSessionEvent: (
      sessionStatus: 'STARTED' | 'COMPLETED' | 'CANCELLED' = 'COMPLETED',
      options: TestEventOptions = {}
    ): CareEventDto => {
      const eventType = sessionStatus === 'STARTED' ? EventType.CARE_TELEMEDICINE_STARTED :
                        sessionStatus === 'COMPLETED' ? EventType.CARE_TELEMEDICINE_COMPLETED :
                        EventType.CARE_TELEMEDICINE_CANCELLED;
      
      const baseEvent = TestEventsProducer.createBaseEvent(
        eventType,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          sessionId: uuidv4(),
          providerId: uuidv4(),
          providerName: 'Dr. Test Telemedicine',
          specialtyName: 'Clínico Geral',
          startedAt: sessionStatus !== 'CANCELLED' ? new Date().toISOString() : null,
          endedAt: sessionStatus === 'COMPLETED' ? new Date().toISOString() : null,
          duration: sessionStatus === 'COMPLETED' ? 15 : null, // minutes
          status: sessionStatus,
          reason: sessionStatus === 'CANCELLED' ? 'Test cancellation reason' : null,
        }
      };
    },
  };

  /**
   * Plan Journey Event Factories
   */
  static plan = {
    /**
     * Creates a claim submitted event
     * 
     * @param claimType - Type of claim
     * @param amount - Claim amount
     * @param options - Common event options
     * @returns A valid claim submitted event
     */
    createClaimSubmittedEvent: (
      claimType: string = 'Consulta Médica',
      amount: number = 150.0,
      options: TestEventOptions = {}
    ): ClaimEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.PLAN_CLAIM_SUBMITTED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          claimId: uuidv4(),
          claimType,
          amount,
          currency: 'BRL',
          serviceDate: new Date().toISOString(),
          providerName: 'Test Provider',
          submittedAt: new Date().toISOString(),
          status: 'SUBMITTED',
          documentCount: 2,
        }
      };
    },

    /**
     * Creates a claim status updated event
     * 
     * @param claimId - ID of the claim (optional, will generate if not provided)
     * @param newStatus - New status of the claim
     * @param options - Common event options
     * @returns A valid claim status updated event
     */
    createClaimStatusUpdatedEvent: (
      claimId: string = uuidv4(),
      newStatus: 'APPROVED' | 'REJECTED' | 'PENDING_INFORMATION' = 'APPROVED',
      options: TestEventOptions = {}
    ): ClaimEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.PLAN_CLAIM_STATUS_UPDATED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          claimId,
          previousStatus: 'SUBMITTED',
          newStatus,
          updatedAt: new Date().toISOString(),
          approvedAmount: newStatus === 'APPROVED' ? 150.0 : null,
          rejectionReason: newStatus === 'REJECTED' ? 'Test rejection reason' : null,
          requiredInformation: newStatus === 'PENDING_INFORMATION' ? ['Additional receipt', 'Medical report'] : null,
        }
      };
    },

    /**
     * Creates a benefit used event
     * 
     * @param benefitType - Type of benefit
     * @param options - Common event options
     * @returns A valid benefit used event
     */
    createBenefitUsedEvent: (
      benefitType: string = 'Gym Membership',
      options: TestEventOptions = {}
    ): BenefitEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.PLAN_BENEFIT_USED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          benefitId: uuidv4(),
          benefitType,
          usedAt: new Date().toISOString(),
          location: 'Test Location',
          value: benefitType === 'Gym Membership' ? 100.0 :
                 benefitType === 'Nutrition Consultation' ? 80.0 :
                 benefitType === 'Mental Health Support' ? 120.0 : 50.0,
          remainingUses: 5,
        }
      };
    },

    /**
     * Creates a plan selected event
     * 
     * @param planType - Type of insurance plan
     * @param options - Common event options
     * @returns A valid plan selected event
     */
    createPlanSelectedEvent: (
      planType: string = 'Standard',
      options: TestEventOptions = {}
    ): PlanEventDto => {
      const baseEvent = TestEventsProducer.createBaseEvent(
        EventType.PLAN_SELECTED,
        options
      );
      
      return {
        ...baseEvent,
        data: {
          planId: uuidv4(),
          planType,
          planName: `AUSTA ${planType}`,
          coverageStartDate: new Date().toISOString(),
          monthlyPremium: planType === 'Básico' ? 200.0 :
                          planType === 'Standard' ? 350.0 :
                          planType === 'Premium' ? 500.0 : 300.0,
          currency: 'BRL',
          selectedAt: new Date().toISOString(),
          previousPlanId: null,
        }
      };
    },
  };

  /**
   * Creates a random event of any type for testing
   * 
   * @param options - Common event options
   * @returns A random valid event of any type
   */
  static createRandomEvent(options: TestEventOptions = {}): any {
    const journeys = ['health', 'care', 'plan'];
    const journey = journeys[Math.floor(Math.random() * journeys.length)];
    
    switch (journey) {
      case 'health':
        const healthEvents = [
          this.health.createMetricRecordedEvent,
          this.health.createGoalAchievedEvent,
          this.health.createDeviceConnectedEvent,
          this.health.createInsightGeneratedEvent,
        ];
        return healthEvents[Math.floor(Math.random() * healthEvents.length)](undefined, options);
      
      case 'care':
        const careEvents = [
          this.care.createAppointmentBookedEvent,
          this.care.createAppointmentCompletedEvent,
          this.care.createMedicationTakenEvent,
          this.care.createTelemedicineSessionEvent,
        ];
        return careEvents[Math.floor(Math.random() * careEvents.length)](undefined, options);
      
      case 'plan':
        const planEvents = [
          this.plan.createClaimSubmittedEvent,
          this.plan.createClaimStatusUpdatedEvent,
          this.plan.createBenefitUsedEvent,
          this.plan.createPlanSelectedEvent,
        ];
        return planEvents[Math.floor(Math.random() * planEvents.length)](undefined, options);
      
      default:
        return this.health.createMetricRecordedEvent(undefined, undefined, options);
    }
  }

  /**
   * Creates a batch of random events for testing
   * 
   * @param count - Number of events to create
   * @param options - Common event options to apply to all events
   * @returns An array of random valid events
   */
  static createRandomEventBatch(count: number = 10, options: TestEventOptions = {}): any[] {
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push(this.createRandomEvent(options));
    }
    return events;
  }

  /**
   * Creates a batch of events of the same type for testing
   * 
   * @param eventFactory - Factory function to create events
   * @param count - Number of events to create
   * @param options - Common event options to apply to all events
   * @returns An array of events of the same type
   */
  static createEventBatch<T>(eventFactory: (options: TestEventOptions) => T, count: number = 10, options: TestEventOptions = {}): T[] {
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push(eventFactory({ ...options, eventId: uuidv4() }));
    }
    return events;
  }
}