import { Span, SpanStatusCode } from '@opentelemetry/api';
import { AttributeValue } from '@opentelemetry/api/build/src/trace/attributes';
import { SpanAttributes } from '../../../src/utils/span-attributes';

// Create a mock span for testing
const createMockSpan = (isRecording = true): Span => ({
  isRecording: jest.fn().mockReturnValue(isRecording),
  setAttributes: jest.fn(),
  setStatus: jest.fn(),
  recordException: jest.fn(),
  end: jest.fn(),
  setAttribute: jest.fn(),
  addEvent: jest.fn(),
  setName: jest.fn(),
  updateName: jest.fn(),
  context: jest.fn(),
});

describe('SpanAttributes', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCommonAttributes', () => {
    it('should add common attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        userId: 'user-123',
        requestId: 'req-456',
        sessionId: 'session-789',
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test',
        journey: 'health',
        feature: 'metrics',
        operation: 'record',
      };

      // Act
      SpanAttributes.addCommonAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.CommonAttributeKeys.USER_ID]: attributes.userId,
        [SpanAttributes.CommonAttributeKeys.REQUEST_ID]: attributes.requestId,
        [SpanAttributes.CommonAttributeKeys.SESSION_ID]: attributes.sessionId,
        [SpanAttributes.CommonAttributeKeys.SERVICE_NAME]: attributes.serviceName,
        [SpanAttributes.CommonAttributeKeys.SERVICE_VERSION]: attributes.serviceVersion,
        [SpanAttributes.CommonAttributeKeys.ENVIRONMENT]: attributes.environment,
        [SpanAttributes.CommonAttributeKeys.JOURNEY]: attributes.journey,
        [SpanAttributes.CommonAttributeKeys.FEATURE]: attributes.feature,
        [SpanAttributes.CommonAttributeKeys.OPERATION]: attributes.operation,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        userId: 'user-123',
        // Only providing userId
      };

      // Act
      SpanAttributes.addCommonAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.CommonAttributeKeys.USER_ID]: attributes.userId,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        userId: 'user-123',
      };

      // Act
      SpanAttributes.addCommonAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });

    it('should handle empty attributes object', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {};

      // Act
      SpanAttributes.addCommonAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({});
    });
  });

  describe('addHealthJourneyAttributes', () => {
    it('should add health journey attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        metricType: 'blood_pressure',
        metricValue: '120/80',
        metricUnit: 'mmHg',
        goalId: 'goal-123',
        goalType: 'blood_pressure_control',
        deviceId: 'device-456',
        deviceType: 'blood_pressure_monitor',
        insightId: 'insight-789',
        insightType: 'health_trend',
      };

      // Act
      SpanAttributes.addHealthJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_TYPE]: attributes.metricType,
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_VALUE]: attributes.metricValue,
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_UNIT]: attributes.metricUnit,
        [SpanAttributes.HealthJourneyAttributeKeys.GOAL_ID]: attributes.goalId,
        [SpanAttributes.HealthJourneyAttributeKeys.GOAL_TYPE]: attributes.goalType,
        [SpanAttributes.HealthJourneyAttributeKeys.DEVICE_ID]: attributes.deviceId,
        [SpanAttributes.HealthJourneyAttributeKeys.DEVICE_TYPE]: attributes.deviceType,
        [SpanAttributes.HealthJourneyAttributeKeys.INSIGHT_ID]: attributes.insightId,
        [SpanAttributes.HealthJourneyAttributeKeys.INSIGHT_TYPE]: attributes.insightType,
      });
    });

    it('should handle numeric metric values', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        metricType: 'weight',
        metricValue: 75.5, // Numeric value
        metricUnit: 'kg',
      };

      // Act
      SpanAttributes.addHealthJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_TYPE]: attributes.metricType,
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_VALUE]: attributes.metricValue,
        [SpanAttributes.HealthJourneyAttributeKeys.METRIC_UNIT]: attributes.metricUnit,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        metricType: 'heart_rate',
        metricValue: 75,
        metricUnit: 'bpm',
      };

      // Act
      SpanAttributes.addHealthJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addCareJourneyAttributes', () => {
    it('should add care journey attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        appointmentId: 'appt-123',
        appointmentType: 'checkup',
        providerId: 'provider-456',
        providerType: 'physician',
        medicationId: 'med-789',
        telemedicineSessionId: 'tele-101',
        symptomCheckerId: 'symptom-202',
        treatmentId: 'treatment-303',
        treatmentType: 'physical_therapy',
      };

      // Act
      SpanAttributes.addCareJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.CareJourneyAttributeKeys.APPOINTMENT_ID]: attributes.appointmentId,
        [SpanAttributes.CareJourneyAttributeKeys.APPOINTMENT_TYPE]: attributes.appointmentType,
        [SpanAttributes.CareJourneyAttributeKeys.PROVIDER_ID]: attributes.providerId,
        [SpanAttributes.CareJourneyAttributeKeys.PROVIDER_TYPE]: attributes.providerType,
        [SpanAttributes.CareJourneyAttributeKeys.MEDICATION_ID]: attributes.medicationId,
        [SpanAttributes.CareJourneyAttributeKeys.TELEMEDICINE_SESSION_ID]: attributes.telemedicineSessionId,
        [SpanAttributes.CareJourneyAttributeKeys.SYMPTOM_CHECKER_ID]: attributes.symptomCheckerId,
        [SpanAttributes.CareJourneyAttributeKeys.TREATMENT_ID]: attributes.treatmentId,
        [SpanAttributes.CareJourneyAttributeKeys.TREATMENT_TYPE]: attributes.treatmentType,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        appointmentId: 'appt-123',
        providerId: 'provider-456',
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addCareJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.CareJourneyAttributeKeys.APPOINTMENT_ID]: attributes.appointmentId,
        [SpanAttributes.CareJourneyAttributeKeys.PROVIDER_ID]: attributes.providerId,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        appointmentId: 'appt-123',
      };

      // Act
      SpanAttributes.addCareJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addPlanJourneyAttributes', () => {
    it('should add plan journey attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        planId: 'plan-123',
        planType: 'premium',
        benefitId: 'benefit-456',
        benefitType: 'dental',
        claimId: 'claim-789',
        claimStatus: 'approved',
        coverageId: 'coverage-101',
        documentId: 'doc-202',
        documentType: 'insurance_card',
      };

      // Act
      SpanAttributes.addPlanJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.PlanJourneyAttributeKeys.PLAN_ID]: attributes.planId,
        [SpanAttributes.PlanJourneyAttributeKeys.PLAN_TYPE]: attributes.planType,
        [SpanAttributes.PlanJourneyAttributeKeys.BENEFIT_ID]: attributes.benefitId,
        [SpanAttributes.PlanJourneyAttributeKeys.BENEFIT_TYPE]: attributes.benefitType,
        [SpanAttributes.PlanJourneyAttributeKeys.CLAIM_ID]: attributes.claimId,
        [SpanAttributes.PlanJourneyAttributeKeys.CLAIM_STATUS]: attributes.claimStatus,
        [SpanAttributes.PlanJourneyAttributeKeys.COVERAGE_ID]: attributes.coverageId,
        [SpanAttributes.PlanJourneyAttributeKeys.DOCUMENT_ID]: attributes.documentId,
        [SpanAttributes.PlanJourneyAttributeKeys.DOCUMENT_TYPE]: attributes.documentType,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        planId: 'plan-123',
        claimId: 'claim-789',
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addPlanJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.PlanJourneyAttributeKeys.PLAN_ID]: attributes.planId,
        [SpanAttributes.PlanJourneyAttributeKeys.CLAIM_ID]: attributes.claimId,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        planId: 'plan-123',
      };

      // Act
      SpanAttributes.addPlanJourneyAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addErrorAttributes', () => {
    it('should add error attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const error = new Error('Test error');
      error.name = 'TestError';
      error.stack = 'Error stack trace';
      const options = {
        errorCode: 'ERR_123',
        errorCategory: 'validation',
        isRetryable: true,
        isHandled: false,
      };

      // Act
      SpanAttributes.addErrorAttributes(mockSpan, error, options);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.ErrorAttributeKeys.ERROR_TYPE]: error.name,
        [SpanAttributes.ErrorAttributeKeys.ERROR_MESSAGE]: error.message,
        [SpanAttributes.ErrorAttributeKeys.ERROR_STACK]: error.stack,
        [SpanAttributes.ErrorAttributeKeys.ERROR_CODE]: options.errorCode,
        [SpanAttributes.ErrorAttributeKeys.ERROR_CATEGORY]: options.errorCategory,
        [SpanAttributes.ErrorAttributeKeys.ERROR_RETRYABLE]: options.isRetryable,
        [SpanAttributes.ErrorAttributeKeys.ERROR_HANDLED]: options.isHandled,
      });
    });

    it('should handle error without name', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const error = new Error('Test error');
      error.name = ''; // Empty name

      // Act
      SpanAttributes.addErrorAttributes(mockSpan, error);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith(expect.objectContaining({
        [SpanAttributes.ErrorAttributeKeys.ERROR_TYPE]: 'Error', // Default to 'Error'
        [SpanAttributes.ErrorAttributeKeys.ERROR_MESSAGE]: error.message,
      }));
    });

    it('should handle error without stack', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const error = new Error('Test error');
      error.stack = undefined; // No stack

      // Act
      SpanAttributes.addErrorAttributes(mockSpan, error);

      // Assert
      const calledWith = (mockSpan.setAttributes as jest.Mock).mock.calls[0][0];
      expect(calledWith).not.toHaveProperty(SpanAttributes.ErrorAttributeKeys.ERROR_STACK);
    });

    it('should handle numeric error codes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const error = new Error('Test error');
      const options = {
        errorCode: 404, // Numeric error code
      };

      // Act
      SpanAttributes.addErrorAttributes(mockSpan, error, options);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith(expect.objectContaining({
        [SpanAttributes.ErrorAttributeKeys.ERROR_CODE]: '404', // Should be converted to string
      }));
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const error = new Error('Test error');

      // Act
      SpanAttributes.addErrorAttributes(mockSpan, error);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addPerformanceAttributes', () => {
    it('should add performance attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        durationMs: 123.45,
        dbDurationMs: 45.67,
        apiDurationMs: 78.9,
        cacheHit: true,
        itemsProcessed: 42,
        memoryUsageMb: 256.5,
        cpuUsagePercent: 35.8,
      };

      // Act
      SpanAttributes.addPerformanceAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.PerformanceAttributeKeys.OPERATION_DURATION_MS]: attributes.durationMs,
        [SpanAttributes.PerformanceAttributeKeys.DATABASE_QUERY_DURATION_MS]: attributes.dbDurationMs,
        [SpanAttributes.PerformanceAttributeKeys.EXTERNAL_API_DURATION_MS]: attributes.apiDurationMs,
        [SpanAttributes.PerformanceAttributeKeys.CACHE_HIT]: attributes.cacheHit,
        [SpanAttributes.PerformanceAttributeKeys.ITEMS_PROCESSED]: attributes.itemsProcessed,
        [SpanAttributes.PerformanceAttributeKeys.MEMORY_USAGE_MB]: attributes.memoryUsageMb,
        [SpanAttributes.PerformanceAttributeKeys.CPU_USAGE_PERCENT]: attributes.cpuUsagePercent,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        durationMs: 123.45,
        cacheHit: false,
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addPerformanceAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.PerformanceAttributeKeys.OPERATION_DURATION_MS]: attributes.durationMs,
        [SpanAttributes.PerformanceAttributeKeys.CACHE_HIT]: attributes.cacheHit,
      });
    });

    it('should handle zero values correctly', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        durationMs: 0,
        itemsProcessed: 0,
      };

      // Act
      SpanAttributes.addPerformanceAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        [SpanAttributes.PerformanceAttributeKeys.OPERATION_DURATION_MS]: 0,
        [SpanAttributes.PerformanceAttributeKeys.ITEMS_PROCESSED]: 0,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        durationMs: 123.45,
      };

      // Act
      SpanAttributes.addPerformanceAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addGamificationAttributes', () => {
    it('should add gamification attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        eventId: 'event-123',
        eventType: 'achievement_unlocked',
        achievementId: 'achievement-456',
        questId: 'quest-789',
        rewardId: 'reward-101',
        profileId: 'profile-202',
        pointsEarned: 50,
        levelUp: true,
      };

      // Act
      SpanAttributes.addGamificationAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'gamification.event.id': attributes.eventId,
        'gamification.event.type': attributes.eventType,
        'gamification.achievement.id': attributes.achievementId,
        'gamification.quest.id': attributes.questId,
        'gamification.reward.id': attributes.rewardId,
        'gamification.profile.id': attributes.profileId,
        'gamification.points.earned': attributes.pointsEarned,
        'gamification.level.up': attributes.levelUp,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        eventId: 'event-123',
        pointsEarned: 50,
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addGamificationAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'gamification.event.id': attributes.eventId,
        'gamification.points.earned': attributes.pointsEarned,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        eventId: 'event-123',
      };

      // Act
      SpanAttributes.addGamificationAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addHttpAttributes', () => {
    it('should add HTTP attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users',
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Mozilla/5.0',
        clientIp: '192.168.1.1',
        route: '/users',
      };

      // Act
      SpanAttributes.addHttpAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'http.method': attributes.method,
        'http.url': attributes.url,
        'http.status_code': attributes.statusCode,
        'http.request.size': attributes.requestSize,
        'http.response.size': attributes.responseSize,
        'http.user_agent': attributes.userAgent,
        'http.client_ip': attributes.clientIp,
        'http.route': attributes.route,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        method: 'POST',
        statusCode: 201,
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addHttpAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'http.method': attributes.method,
        'http.status_code': attributes.statusCode,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        method: 'GET',
        url: 'https://api.example.com/users',
      };

      // Act
      SpanAttributes.addHttpAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('addDatabaseAttributes', () => {
    it('should add database attributes to a span', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        system: 'postgresql',
        operation: 'SELECT',
        statement: 'SELECT * FROM users WHERE id = $1',
        table: 'users',
        connectionString: 'postgresql://localhost:5432/mydb',
        rowsAffected: 1,
        journeyContext: 'health',
      };

      // Act
      SpanAttributes.addDatabaseAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'db.system': attributes.system,
        'db.operation': attributes.operation,
        'db.statement': attributes.statement,
        'db.table': attributes.table,
        'db.connection_string': attributes.connectionString,
        'db.rows_affected': attributes.rowsAffected,
        'db.journey_context': attributes.journeyContext,
      });
    });

    it('should only add provided attributes', () => {
      // Arrange
      const mockSpan = createMockSpan();
      const attributes = {
        system: 'mysql',
        operation: 'INSERT',
        // Only providing a subset of attributes
      };

      // Act
      SpanAttributes.addDatabaseAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'db.system': attributes.system,
        'db.operation': attributes.operation,
      });
    });

    it('should not add attributes if span is not recording', () => {
      // Arrange
      const mockSpan = createMockSpan(false); // Not recording
      const attributes = {
        system: 'postgresql',
        operation: 'SELECT',
      };

      // Act
      SpanAttributes.addDatabaseAttributes(mockSpan, attributes);

      // Assert
      expect(mockSpan.isRecording).toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });
});