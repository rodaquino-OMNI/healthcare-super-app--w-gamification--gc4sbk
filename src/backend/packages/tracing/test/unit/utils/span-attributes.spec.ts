import { SpanStatusCode } from '@opentelemetry/api';
import { MockSpan } from '../../mocks/mock-span';
import {
  addCommonAttributes,
  addHttpAttributes,
  addDatabaseAttributes,
  addHealthJourneyAttributes,
  addCareJourneyAttributes,
  addPlanJourneyAttributes,
  addGamificationAttributes,
  addErrorAttributes,
  addPerformanceAttributes
} from '../../../src/utils/span-attributes';

/**
 * Creates a mock span context for testing purposes.
 */
const createMockSpanContext = () => ({
  traceId: '0af7651916cd43dd8448eb211c80319c',
  spanId: 'b7ad6b7169203331',
  traceFlags: 1,
  isRemote: false,
});

describe('Span Attribute Utilities', () => {
  describe('addCommonAttributes', () => {
    it('should add all provided common attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        userId: 'user-123',
        requestId: 'req-456',
        sessionId: 'session-789',
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test'
      };

      // Act
      addCommonAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['user.id']).toBe('user-123');
      expect(spanAttributes['request.id']).toBe('req-456');
      expect(spanAttributes['session.id']).toBe('session-789');
      expect(spanAttributes['service.name']).toBe('test-service');
      expect(spanAttributes['service.version']).toBe('1.0.0');
      expect(spanAttributes['deployment.environment']).toBe('test');
    });

    it('should only add provided attributes and ignore undefined ones', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        userId: 'user-123',
        // requestId is intentionally omitted
        sessionId: 'session-789'
        // other attributes are intentionally omitted
      };

      // Act
      addCommonAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['user.id']).toBe('user-123');
      expect(spanAttributes['session.id']).toBe('session-789');
      expect(spanAttributes['request.id']).toBeUndefined();
      expect(spanAttributes['service.name']).toBeUndefined();
      expect(spanAttributes['service.version']).toBeUndefined();
      expect(spanAttributes['deployment.environment']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        userId: 'user-123',
        requestId: 'req-456'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addCommonAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['user.id']).toBeUndefined();
      expect(spanAttributes['request.id']).toBeUndefined();
    });
  });

  describe('addHttpAttributes', () => {
    it('should add all provided HTTP attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users',
        statusCode: 200,
        route: '/users',
        userAgent: 'Mozilla/5.0',
        clientIp: '192.168.1.1'
      };

      // Act
      addHttpAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['http.method']).toBe('GET');
      expect(spanAttributes['http.url']).toBe('https://api.example.com/users');
      expect(spanAttributes['http.status_code']).toBe(200);
      expect(spanAttributes['http.route']).toBe('/users');
      expect(spanAttributes['http.user_agent']).toBe('Mozilla/5.0');
      expect(spanAttributes['http.client_ip']).toBe('192.168.1.1');
    });

    it('should set span status to ERROR for HTTP status codes >= 400', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users',
        statusCode: 404
      };

      // Act
      addHttpAttributes(span, attributes);

      // Assert
      const status = span.getStatus();
      expect(status).toBeDefined();
      expect(status?.code).toBe(SpanStatusCode.ERROR);
      expect(status?.message).toBe('HTTP error 404');
    });

    it('should not set span status to ERROR for HTTP status codes < 400', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users',
        statusCode: 200
      };

      // Act
      addHttpAttributes(span, attributes);

      // Assert
      const status = span.getStatus();
      expect(status).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addHttpAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['http.method']).toBeUndefined();
      expect(spanAttributes['http.url']).toBeUndefined();
    });
  });

  describe('addDatabaseAttributes', () => {
    it('should add all provided database attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        system: 'postgresql',
        operation: 'SELECT',
        statement: 'SELECT * FROM users WHERE id = $1',
        table: 'users',
        connectionString: 'postgresql://user:password@localhost:5432/db'
      };

      // Act
      addDatabaseAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['db.system']).toBe('postgresql');
      expect(spanAttributes['db.operation']).toBe('SELECT');
      expect(spanAttributes['db.statement']).toBe('SELECT * FROM users WHERE id = $1');
      expect(spanAttributes['db.sql.table']).toBe('users');
      expect(spanAttributes['db.connection_string']).toBe('postgresql://user:***@localhost:5432/db');
    });

    it('should sanitize connection string to remove sensitive information', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        system: 'postgresql',
        connectionString: 'postgresql://user:password@localhost:5432/db'
      };

      // Act
      addDatabaseAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['db.connection_string']).toBe('postgresql://user:***@localhost:5432/db');
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        system: 'postgresql',
        operation: 'SELECT'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addDatabaseAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['db.system']).toBeUndefined();
      expect(spanAttributes['db.operation']).toBeUndefined();
    });
  });

  describe('addHealthJourneyAttributes', () => {
    it('should add journey type and all provided health journey attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        metricType: 'blood_pressure',
        metricValue: 120,
        metricUnit: 'mmHg',
        goalId: 'goal-123',
        goalType: 'blood_pressure_control',
        deviceId: 'device-456',
        deviceType: 'blood_pressure_monitor'
      };

      // Act
      addHealthJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('health');
      expect(spanAttributes['health.metric.type']).toBe('blood_pressure');
      expect(spanAttributes['health.metric.value']).toBe(120);
      expect(spanAttributes['health.metric.unit']).toBe('mmHg');
      expect(spanAttributes['health.goal.id']).toBe('goal-123');
      expect(spanAttributes['health.goal.type']).toBe('blood_pressure_control');
      expect(spanAttributes['health.device.id']).toBe('device-456');
      expect(spanAttributes['health.device.type']).toBe('blood_pressure_monitor');
    });

    it('should add journey type even when no other attributes are provided', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {};

      // Act
      addHealthJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('health');
      expect(spanAttributes['health.metric.type']).toBeUndefined();
      expect(spanAttributes['health.metric.value']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        metricType: 'blood_pressure',
        metricValue: 120
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addHealthJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBeUndefined();
      expect(spanAttributes['health.metric.type']).toBeUndefined();
      expect(spanAttributes['health.metric.value']).toBeUndefined();
    });
  });

  describe('addCareJourneyAttributes', () => {
    it('should add journey type and all provided care journey attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        appointmentId: 'appt-123',
        appointmentType: 'consultation',
        providerId: 'provider-456',
        providerSpecialty: 'cardiology',
        medicationId: 'med-789',
        medicationType: 'prescription',
        telemedicineSessionId: 'tele-101'
      };

      // Act
      addCareJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('care');
      expect(spanAttributes['care.appointment.id']).toBe('appt-123');
      expect(spanAttributes['care.appointment.type']).toBe('consultation');
      expect(spanAttributes['care.provider.id']).toBe('provider-456');
      expect(spanAttributes['care.provider.specialty']).toBe('cardiology');
      expect(spanAttributes['care.medication.id']).toBe('med-789');
      expect(spanAttributes['care.medication.type']).toBe('prescription');
      expect(spanAttributes['care.telemedicine.session_id']).toBe('tele-101');
    });

    it('should add journey type even when no other attributes are provided', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {};

      // Act
      addCareJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('care');
      expect(spanAttributes['care.appointment.id']).toBeUndefined();
      expect(spanAttributes['care.provider.id']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        appointmentId: 'appt-123',
        providerId: 'provider-456'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addCareJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBeUndefined();
      expect(spanAttributes['care.appointment.id']).toBeUndefined();
      expect(spanAttributes['care.provider.id']).toBeUndefined();
    });
  });

  describe('addPlanJourneyAttributes', () => {
    it('should add journey type and all provided plan journey attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        planId: 'plan-123',
        planType: 'health_insurance',
        benefitId: 'benefit-456',
        benefitType: 'dental',
        claimId: 'claim-789',
        claimStatus: 'approved',
        documentId: 'doc-101'
      };

      // Act
      addPlanJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('plan');
      expect(spanAttributes['plan.id']).toBe('plan-123');
      expect(spanAttributes['plan.type']).toBe('health_insurance');
      expect(spanAttributes['plan.benefit.id']).toBe('benefit-456');
      expect(spanAttributes['plan.benefit.type']).toBe('dental');
      expect(spanAttributes['plan.claim.id']).toBe('claim-789');
      expect(spanAttributes['plan.claim.status']).toBe('approved');
      expect(spanAttributes['plan.document.id']).toBe('doc-101');
    });

    it('should add journey type even when no other attributes are provided', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {};

      // Act
      addPlanJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBe('plan');
      expect(spanAttributes['plan.id']).toBeUndefined();
      expect(spanAttributes['plan.benefit.id']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        planId: 'plan-123',
        claimId: 'claim-789'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addPlanJourneyAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['journey.type']).toBeUndefined();
      expect(spanAttributes['plan.id']).toBeUndefined();
      expect(spanAttributes['plan.claim.id']).toBeUndefined();
    });
  });

  describe('addGamificationAttributes', () => {
    it('should add all provided gamification attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        eventType: 'achievement_unlocked',
        achievementId: 'achievement-123',
        achievementType: 'milestone',
        rewardId: 'reward-456',
        rewardType: 'points',
        questId: 'quest-789',
        profileId: 'profile-101',
        pointsEarned: 100
      };

      // Act
      addGamificationAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['gamification.event.type']).toBe('achievement_unlocked');
      expect(spanAttributes['gamification.achievement.id']).toBe('achievement-123');
      expect(spanAttributes['gamification.achievement.type']).toBe('milestone');
      expect(spanAttributes['gamification.reward.id']).toBe('reward-456');
      expect(spanAttributes['gamification.reward.type']).toBe('points');
      expect(spanAttributes['gamification.quest.id']).toBe('quest-789');
      expect(spanAttributes['gamification.profile.id']).toBe('profile-101');
      expect(spanAttributes['gamification.points.earned']).toBe(100);
    });

    it('should only add provided attributes and ignore undefined ones', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        eventType: 'achievement_unlocked',
        achievementId: 'achievement-123'
        // other attributes are intentionally omitted
      };

      // Act
      addGamificationAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['gamification.event.type']).toBe('achievement_unlocked');
      expect(spanAttributes['gamification.achievement.id']).toBe('achievement-123');
      expect(spanAttributes['gamification.reward.id']).toBeUndefined();
      expect(spanAttributes['gamification.points.earned']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        eventType: 'achievement_unlocked',
        achievementId: 'achievement-123'
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addGamificationAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['gamification.event.type']).toBeUndefined();
      expect(spanAttributes['gamification.achievement.id']).toBeUndefined();
    });
  });

  describe('addErrorAttributes', () => {
    it('should add error information and set span status to ERROR', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const error = new Error('Test error message');
      error.name = 'TestError';

      // Act
      addErrorAttributes(span, error);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['error']).toBe(true);
      expect(spanAttributes['error.message']).toBe('Test error message');
      expect(spanAttributes['error.stack']).toBeDefined();
      expect(spanAttributes['error.type']).toBe('TestError');

      // Verify span status is set to ERROR
      const status = span.getStatus();
      expect(status).toBeDefined();
      expect(status?.code).toBe(SpanStatusCode.ERROR);
      expect(status?.message).toBe('Test error message');

      // Verify exception is recorded
      const exceptions = span.getExceptions();
      expect(exceptions.length).toBe(1);
      expect(exceptions[0]).toBe(error);
    });

    it('should add additional error attributes when provided', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const error = new Error('Test error message');
      const additionalAttributes = {
        code: 'ERR_INVALID_INPUT',
        type: 'validation_error',
        retryable: false,
        component: 'user_service'
      };

      // Act
      addErrorAttributes(span, error, additionalAttributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['error.code']).toBe('ERR_INVALID_INPUT');
      expect(spanAttributes['error.category']).toBe('validation_error');
      expect(spanAttributes['error.retryable']).toBe(false);
      expect(spanAttributes['error.component']).toBe('user_service');
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const error = new Error('Test error message');

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addErrorAttributes(span, error);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['error']).toBeUndefined();
      expect(spanAttributes['error.message']).toBeUndefined();

      // Verify exception is not recorded
      const exceptions = span.getExceptions();
      expect(exceptions.length).toBe(0);
    });
  });

  describe('addPerformanceAttributes', () => {
    it('should add all provided performance attributes to the span', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        operationDuration: 150,
        queueTime: 50,
        processingTime: 100,
        resourceUsage: 0.75,
        cacheHit: true,
        itemCount: 42
      };

      // Act
      addPerformanceAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['performance.duration_ms']).toBe(150);
      expect(spanAttributes['performance.queue_time_ms']).toBe(50);
      expect(spanAttributes['performance.processing_time_ms']).toBe(100);
      expect(spanAttributes['performance.resource_usage']).toBe(0.75);
      expect(spanAttributes['performance.cache_hit']).toBe(true);
      expect(spanAttributes['performance.item_count']).toBe(42);
    });

    it('should only add provided attributes and ignore undefined ones', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        operationDuration: 150,
        // queueTime is intentionally omitted
        processingTime: 100
        // other attributes are intentionally omitted
      };

      // Act
      addPerformanceAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['performance.duration_ms']).toBe(150);
      expect(spanAttributes['performance.processing_time_ms']).toBe(100);
      expect(spanAttributes['performance.queue_time_ms']).toBeUndefined();
      expect(spanAttributes['performance.resource_usage']).toBeUndefined();
      expect(spanAttributes['performance.cache_hit']).toBeUndefined();
      expect(spanAttributes['performance.item_count']).toBeUndefined();
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const span = new MockSpan('test-span', createMockSpanContext());
      const attributes = {
        operationDuration: 150,
        processingTime: 100
      };

      // Mock span not recording
      jest.spyOn(span, 'isRecording').mockReturnValue(false);

      // Act
      addPerformanceAttributes(span, attributes);

      // Assert
      const spanAttributes = span.getAttributes();
      expect(spanAttributes['performance.duration_ms']).toBeUndefined();
      expect(spanAttributes['performance.processing_time_ms']).toBeUndefined();
    });
  });
});