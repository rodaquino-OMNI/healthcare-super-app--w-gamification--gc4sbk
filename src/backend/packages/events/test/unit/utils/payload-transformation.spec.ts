import { Test } from '@nestjs/testing';
import {
  normalizeEventPayload,
  enrichEventWithMetadata,
  validateFieldNaming,
  transformDatabaseRecordToEvent,
  transformEventToDatabaseRecord,
  adaptPayloadForJourney,
} from '../../../src/utils/payload-transformation';
import {
  baseEvents,
  healthEvents,
  careEvents,
  planEvents,
  validationEvents,
} from '../../fixtures';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { mockEventStore } from '../../mocks/mock-event-store';
import { mockJourneyServices } from '../../mocks/mock-journey-services';

describe('Payload Transformation Utilities', () => {
  describe('normalizeEventPayload', () => {
    it('should convert all field names to camelCase', () => {
      const rawPayload = {
        'User_Id': '123',
        'EVENT_TYPE': 'HEALTH_METRIC_RECORDED',
        'Timestamp': '2023-01-01T12:00:00Z',
        'metric_value': 120,
        'METRIC_TYPE': 'HEART_RATE',
      };

      const normalized = normalizeEventPayload(rawPayload);

      expect(normalized).toEqual({
        userId: '123',
        eventType: 'HEALTH_METRIC_RECORDED',
        timestamp: '2023-01-01T12:00:00Z',
        metricValue: 120,
        metricType: 'HEART_RATE',
      });
    });

    it('should handle nested objects and arrays', () => {
      const rawPayload = {
        'user_id': '123',
        'METRICS': [
          { 'METRIC_TYPE': 'HEART_RATE', 'metric_value': 120 },
          { 'METRIC_TYPE': 'BLOOD_PRESSURE', 'metric_value': '120/80' },
        ],
        'device_info': {
          'DEVICE_ID': 'abc123',
          'device_type': 'SMARTWATCH',
        },
      };

      const normalized = normalizeEventPayload(rawPayload);

      expect(normalized).toEqual({
        userId: '123',
        metrics: [
          { metricType: 'HEART_RATE', metricValue: 120 },
          { metricType: 'BLOOD_PRESSURE', metricValue: '120/80' },
        ],
        deviceInfo: {
          deviceId: 'abc123',
          deviceType: 'SMARTWATCH',
        },
      });
    });

    it('should preserve null and undefined values', () => {
      const rawPayload = {
        'user_id': '123',
        'metric_value': null,
        'device_id': undefined,
      };

      const normalized = normalizeEventPayload(rawPayload);

      expect(normalized).toEqual({
        userId: '123',
        metricValue: null,
        deviceId: undefined,
      });
    });

    it('should handle empty objects and arrays', () => {
      const rawPayload = {
        'user_id': '123',
        'metrics': [],
        'device_info': {},
      };

      const normalized = normalizeEventPayload(rawPayload);

      expect(normalized).toEqual({
        userId: '123',
        metrics: [],
        deviceInfo: {},
      });
    });
  });

  describe('enrichEventWithMetadata', () => {
    it('should add timestamp if not present', () => {
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.timestamp).toBeDefined();
      expect(new Date(enriched.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve existing timestamp if present', () => {
      const existingTimestamp = '2023-01-01T12:00:00Z';
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        timestamp: existingTimestamp,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.timestamp).toEqual(existingTimestamp);
    });

    it('should add eventId if not present', () => {
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.eventId).toBeDefined();
      expect(typeof enriched.eventId).toBe('string');
      expect(enriched.eventId.length).toBeGreaterThan(0);
    });

    it('should preserve existing eventId if present', () => {
      const existingEventId = '550e8400-e29b-41d4-a716-446655440000';
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        eventId: existingEventId,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.eventId).toEqual(existingEventId);
    });

    it('should add correlationId if not present', () => {
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.correlationId).toBeDefined();
      expect(typeof enriched.correlationId).toBe('string');
      expect(enriched.correlationId.length).toBeGreaterThan(0);
    });

    it('should preserve existing correlationId if present', () => {
      const existingCorrelationId = '550e8400-e29b-41d4-a716-446655440000';
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        correlationId: existingCorrelationId,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.correlationId).toEqual(existingCorrelationId);
    });

    it('should add source if not present', () => {
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event, 'health-service');

      expect(enriched.source).toEqual('health-service');
    });

    it('should preserve existing source if present', () => {
      const existingSource = 'mobile-app';
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        source: existingSource,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event, 'health-service');

      expect(enriched.source).toEqual(existingSource);
    });

    it('should add version if not present', () => {
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.version).toEqual('1.0.0');
    });

    it('should preserve existing version if present', () => {
      const existingVersion = '2.1.0';
      const event = {
        userId: '123',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        version: existingVersion,
        data: { metricType: 'HEART_RATE', metricValue: 120 },
      };

      const enriched = enrichEventWithMetadata(event);

      expect(enriched.version).toEqual(existingVersion);
    });
  });

  describe('validateFieldNaming', () => {
    it('should return true for correctly named fields in camelCase', () => {
      const payload = {
        userId: '123',
        eventType: 'HEALTH_METRIC_RECORDED',
        timestamp: '2023-01-01T12:00:00Z',
        metricValue: 120,
        metricType: 'HEART_RATE',
      };

      const result = validateFieldNaming(payload);

      expect(result.valid).toBe(true);
      expect(result.invalidFields).toEqual([]);
    });

    it('should return false for incorrectly named fields', () => {
      const payload = {
        'userId': '123',
        'EVENT_TYPE': 'HEALTH_METRIC_RECORDED',
        'Timestamp': '2023-01-01T12:00:00Z',
        'metric_value': 120,
      };

      const result = validateFieldNaming(payload);

      expect(result.valid).toBe(false);
      expect(result.invalidFields).toContain('EVENT_TYPE');
      expect(result.invalidFields).toContain('Timestamp');
      expect(result.invalidFields).toContain('metric_value');
    });

    it('should validate nested objects and arrays', () => {
      const payload = {
        userId: '123',
        metrics: [
          { metricType: 'HEART_RATE', metricValue: 120 },
          { metricType: 'BLOOD_PRESSURE', 'Metric_Value': '120/80' },
        ],
        deviceInfo: {
          deviceId: 'abc123',
          'DEVICE_TYPE': 'SMARTWATCH',
        },
      };

      const result = validateFieldNaming(payload);

      expect(result.valid).toBe(false);
      expect(result.invalidFields).toContain('metrics[1].Metric_Value');
      expect(result.invalidFields).toContain('deviceInfo.DEVICE_TYPE');
    });

    it('should ignore null and undefined values', () => {
      const payload = {
        userId: '123',
        metricValue: null,
        deviceId: undefined,
      };

      const result = validateFieldNaming(payload);

      expect(result.valid).toBe(true);
      expect(result.invalidFields).toEqual([]);
    });
  });

  describe('transformDatabaseRecordToEvent', () => {
    it('should transform a health metric database record to an event', () => {
      const dbRecord = {
        id: 1,
        user_id: '123',
        metric_type: 'HEART_RATE',
        metric_value: 120,
        recorded_at: new Date('2023-01-01T12:00:00Z'),
        created_at: new Date('2023-01-01T12:00:01Z'),
        updated_at: new Date('2023-01-01T12:00:01Z'),
      };

      const event = transformDatabaseRecordToEvent(dbRecord, 'health', 'METRIC_RECORDED');

      expect(event).toEqual({
        eventId: expect.any(String),
        type: EventTypes.HEALTH.METRIC_RECORDED,
        userId: '123',
        timestamp: '2023-01-01T12:00:00.000Z',
        source: 'health-service',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 120,
          recordedAt: '2023-01-01T12:00:00.000Z',
        },
      });
    });

    it('should transform a care appointment database record to an event', () => {
      const dbRecord = {
        id: 1,
        user_id: '123',
        provider_id: '456',
        appointment_type: 'CONSULTATION',
        status: 'CONFIRMED',
        scheduled_at: new Date('2023-01-15T14:30:00Z'),
        created_at: new Date('2023-01-01T12:00:01Z'),
        updated_at: new Date('2023-01-01T12:00:01Z'),
      };

      const event = transformDatabaseRecordToEvent(dbRecord, 'care', 'APPOINTMENT_CONFIRMED');

      expect(event).toEqual({
        eventId: expect.any(String),
        type: EventTypes.CARE.APPOINTMENT_CONFIRMED,
        userId: '123',
        timestamp: '2023-01-01T12:00:01.000Z',
        source: 'care-service',
        version: '1.0.0',
        data: {
          providerId: '456',
          appointmentType: 'CONSULTATION',
          status: 'CONFIRMED',
          scheduledAt: '2023-01-15T14:30:00.000Z',
        },
      });
    });

    it('should transform a plan claim database record to an event', () => {
      const dbRecord = {
        id: 1,
        user_id: '123',
        claim_type: 'MEDICAL_CONSULTATION',
        amount: 150.00,
        status: 'SUBMITTED',
        submitted_at: new Date('2023-01-10T09:15:00Z'),
        created_at: new Date('2023-01-10T09:15:01Z'),
        updated_at: new Date('2023-01-10T09:15:01Z'),
      };

      const event = transformDatabaseRecordToEvent(dbRecord, 'plan', 'CLAIM_SUBMITTED');

      expect(event).toEqual({
        eventId: expect.any(String),
        type: EventTypes.PLAN.CLAIM_SUBMITTED,
        userId: '123',
        timestamp: '2023-01-10T09:15:00.000Z',
        source: 'plan-service',
        version: '1.0.0',
        data: {
          claimType: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          status: 'SUBMITTED',
          submittedAt: '2023-01-10T09:15:00.000Z',
        },
      });
    });

    it('should handle records with missing fields', () => {
      const dbRecord = {
        id: 1,
        user_id: '123',
        metric_type: 'HEART_RATE',
        // metric_value is missing
        created_at: new Date('2023-01-01T12:00:01Z'),
        updated_at: new Date('2023-01-01T12:00:01Z'),
      };

      const event = transformDatabaseRecordToEvent(dbRecord, 'health', 'METRIC_RECORDED');

      expect(event).toEqual({
        eventId: expect.any(String),
        type: EventTypes.HEALTH.METRIC_RECORDED,
        userId: '123',
        timestamp: '2023-01-01T12:00:01.000Z',
        source: 'health-service',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
        },
      });
    });
  });

  describe('transformEventToDatabaseRecord', () => {
    it('should transform a health metric event to a database record', () => {
      const event = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        userId: '123',
        timestamp: '2023-01-01T12:00:00Z',
        source: 'mobile-app',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 120,
          recordedAt: '2023-01-01T12:00:00Z',
        },
      };

      const dbRecord = transformEventToDatabaseRecord(event, 'health_metrics');

      expect(dbRecord).toEqual({
        user_id: '123',
        metric_type: 'HEART_RATE',
        metric_value: 120,
        recorded_at: new Date('2023-01-01T12:00:00Z'),
        source: 'mobile-app',
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: EventTypes.HEALTH.METRIC_RECORDED,
        created_at: expect.any(Date),
      });
    });

    it('should transform a care appointment event to a database record', () => {
      const event = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        type: EventTypes.CARE.APPOINTMENT_CONFIRMED,
        userId: '123',
        timestamp: '2023-01-01T12:00:00Z',
        source: 'care-service',
        version: '1.0.0',
        data: {
          providerId: '456',
          appointmentType: 'CONSULTATION',
          status: 'CONFIRMED',
          scheduledAt: '2023-01-15T14:30:00Z',
        },
      };

      const dbRecord = transformEventToDatabaseRecord(event, 'care_appointments');

      expect(dbRecord).toEqual({
        user_id: '123',
        provider_id: '456',
        appointment_type: 'CONSULTATION',
        status: 'CONFIRMED',
        scheduled_at: new Date('2023-01-15T14:30:00Z'),
        source: 'care-service',
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: EventTypes.CARE.APPOINTMENT_CONFIRMED,
        created_at: expect.any(Date),
      });
    });

    it('should transform a plan claim event to a database record', () => {
      const event = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        type: EventTypes.PLAN.CLAIM_SUBMITTED,
        userId: '123',
        timestamp: '2023-01-10T09:15:00Z',
        source: 'plan-service',
        version: '1.0.0',
        data: {
          claimType: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          status: 'SUBMITTED',
          submittedAt: '2023-01-10T09:15:00Z',
        },
      };

      const dbRecord = transformEventToDatabaseRecord(event, 'plan_claims');

      expect(dbRecord).toEqual({
        user_id: '123',
        claim_type: 'MEDICAL_CONSULTATION',
        amount: 150.00,
        status: 'SUBMITTED',
        submitted_at: new Date('2023-01-10T09:15:00Z'),
        source: 'plan-service',
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: EventTypes.PLAN.CLAIM_SUBMITTED,
        created_at: expect.any(Date),
      });
    });

    it('should handle events with missing data fields', () => {
      const event = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        type: EventTypes.HEALTH.METRIC_RECORDED,
        userId: '123',
        timestamp: '2023-01-01T12:00:00Z',
        source: 'mobile-app',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          // metricValue is missing
        },
      };

      const dbRecord = transformEventToDatabaseRecord(event, 'health_metrics');

      expect(dbRecord).toEqual({
        user_id: '123',
        metric_type: 'HEART_RATE',
        source: 'mobile-app',
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: EventTypes.HEALTH.METRIC_RECORDED,
        created_at: expect.any(Date),
      });
    });
  });

  describe('adaptPayloadForJourney', () => {
    it('should adapt a generic event payload for the health journey', () => {
      const genericPayload = {
        userId: '123',
        metricType: 'HEART_RATE',
        metricValue: 120,
        recordedAt: '2023-01-01T12:00:00Z',
      };

      const adapted = adaptPayloadForJourney(genericPayload, 'health');

      expect(adapted).toEqual({
        userId: '123',
        healthMetric: {
          type: 'HEART_RATE',
          value: 120,
          recordedAt: '2023-01-01T12:00:00Z',
          unit: 'bpm', // Added by health journey adapter
        },
      });
    });

    it('should adapt a generic event payload for the care journey', () => {
      const genericPayload = {
        userId: '123',
        providerId: '456',
        appointmentType: 'CONSULTATION',
        scheduledAt: '2023-01-15T14:30:00Z',
      };

      const adapted = adaptPayloadForJourney(genericPayload, 'care');

      expect(adapted).toEqual({
        userId: '123',
        appointment: {
          providerId: '456',
          type: 'CONSULTATION',
          scheduledAt: '2023-01-15T14:30:00Z',
          duration: 30, // Default duration added by care journey adapter
        },
      });
    });

    it('should adapt a generic event payload for the plan journey', () => {
      const genericPayload = {
        userId: '123',
        claimType: 'MEDICAL_CONSULTATION',
        amount: 150.00,
        submittedAt: '2023-01-10T09:15:00Z',
      };

      const adapted = adaptPayloadForJourney(genericPayload, 'plan');

      expect(adapted).toEqual({
        userId: '123',
        claim: {
          type: 'MEDICAL_CONSULTATION',
          amount: 150.00,
          submittedAt: '2023-01-10T09:15:00Z',
          currency: 'BRL', // Default currency added by plan journey adapter
        },
      });
    });

    it('should return the original payload for unknown journey', () => {
      const genericPayload = {
        userId: '123',
        data: 'some data',
      };

      const adapted = adaptPayloadForJourney(genericPayload, 'unknown');

      expect(adapted).toEqual(genericPayload);
    });

    it('should handle empty payloads', () => {
      const emptyPayload = {};

      const adapted = adaptPayloadForJourney(emptyPayload, 'health');

      expect(adapted).toEqual({
        healthMetric: {
          unit: 'bpm', // Still adds default values
        },
      });
    });
  });
});