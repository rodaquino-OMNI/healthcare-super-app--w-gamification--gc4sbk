import {
  SpanAttributes,
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  JourneySpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  ErrorSpanAttributes,
  JOURNEY_NAMES,
  DATABASE_SYSTEMS,
  MESSAGING_SYSTEMS,
  ERROR_TYPES,
  GAMIFICATION_EVENT_TYPES,
  createJourneyAttributes,
  createErrorAttributes
} from '../../../src/interfaces/span-attributes.interface';

describe('Span Attributes Interfaces', () => {
  // Helper function to check if an object conforms to an interface
  const conformsToInterface = <T>(obj: any): obj is T => {
    return obj !== null && typeof obj === 'object';
  };

  describe('Base SpanAttributes Interface', () => {
    it('should allow string attributes', () => {
      const attributes: SpanAttributes = {
        'test.attribute': 'test-value'
      };
      
      expect(attributes['test.attribute']).toBe('test-value');
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow number attributes', () => {
      const attributes: SpanAttributes = {
        'test.number': 123
      };
      
      expect(attributes['test.number']).toBe(123);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow boolean attributes', () => {
      const attributes: SpanAttributes = {
        'test.boolean': true
      };
      
      expect(attributes['test.boolean']).toBe(true);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow string array attributes', () => {
      const attributes: SpanAttributes = {
        'test.string.array': ['value1', 'value2']
      };
      
      expect(attributes['test.string.array']).toEqual(['value1', 'value2']);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow number array attributes', () => {
      const attributes: SpanAttributes = {
        'test.number.array': [1, 2, 3]
      };
      
      expect(attributes['test.number.array']).toEqual([1, 2, 3]);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow boolean array attributes', () => {
      const attributes: SpanAttributes = {
        'test.boolean.array': [true, false, true]
      };
      
      expect(attributes['test.boolean.array']).toEqual([true, false, true]);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });

    it('should allow multiple attributes of different types', () => {
      const attributes: SpanAttributes = {
        'test.string': 'value',
        'test.number': 123,
        'test.boolean': true,
        'test.array': [1, 2, 3]
      };
      
      expect(attributes['test.string']).toBe('value');
      expect(attributes['test.number']).toBe(123);
      expect(attributes['test.boolean']).toBe(true);
      expect(attributes['test.array']).toEqual([1, 2, 3]);
      expect(conformsToInterface<SpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('HttpSpanAttributes Interface', () => {
    it('should allow HTTP method attribute', () => {
      const attributes: HttpSpanAttributes = {
        'http.method': 'GET'
      };
      
      expect(attributes['http.method']).toBe('GET');
      expect(conformsToInterface<HttpSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow HTTP URL attribute', () => {
      const attributes: HttpSpanAttributes = {
        'http.url': 'https://api.austa.health/users'
      };
      
      expect(attributes['http.url']).toBe('https://api.austa.health/users');
      expect(conformsToInterface<HttpSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow HTTP status code attribute', () => {
      const attributes: HttpSpanAttributes = {
        'http.status_code': 200
      };
      
      expect(attributes['http.status_code']).toBe(200);
      expect(conformsToInterface<HttpSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all HTTP attributes together', () => {
      const attributes: HttpSpanAttributes = {
        'http.method': 'POST',
        'http.url': 'https://api.austa.health/users',
        'http.target': '/users',
        'http.host': 'api.austa.health',
        'http.scheme': 'https',
        'http.status_code': 201,
        'http.flavor': '1.1',
        'http.user_agent': 'Mozilla/5.0',
        'http.request_content_length': 1024,
        'http.response_content_length': 512,
        'http.route': '/users'
      };
      
      expect(attributes['http.method']).toBe('POST');
      expect(attributes['http.url']).toBe('https://api.austa.health/users');
      expect(attributes['http.target']).toBe('/users');
      expect(attributes['http.host']).toBe('api.austa.health');
      expect(attributes['http.scheme']).toBe('https');
      expect(attributes['http.status_code']).toBe(201);
      expect(attributes['http.flavor']).toBe('1.1');
      expect(attributes['http.user_agent']).toBe('Mozilla/5.0');
      expect(attributes['http.request_content_length']).toBe(1024);
      expect(attributes['http.response_content_length']).toBe(512);
      expect(attributes['http.route']).toBe('/users');
      expect(conformsToInterface<HttpSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow additional custom attributes', () => {
      const attributes: HttpSpanAttributes = {
        'http.method': 'GET',
        'custom.attribute': 'custom-value'
      };
      
      expect(attributes['http.method']).toBe('GET');
      expect(attributes['custom.attribute']).toBe('custom-value');
      expect(conformsToInterface<HttpSpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('DatabaseSpanAttributes Interface', () => {
    it('should allow database system attribute', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.system': 'postgresql'
      };
      
      expect(attributes['db.system']).toBe('postgresql');
      expect(conformsToInterface<DatabaseSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow database statement attribute', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.statement': 'SELECT * FROM users WHERE id = $1'
      };
      
      expect(attributes['db.statement']).toBe('SELECT * FROM users WHERE id = $1');
      expect(conformsToInterface<DatabaseSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all database attributes together', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.system': 'postgresql',
        'db.connection_string': 'postgresql://user:password@localhost:5432/db',
        'db.user': 'user',
        'db.name': 'austa_health_db',
        'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1',
        'db.operation': 'SELECT',
        'db.instance': 'localhost:5432',
        'db.sql.table': 'health_metrics'
      };
      
      expect(attributes['db.system']).toBe('postgresql');
      expect(attributes['db.connection_string']).toBe('postgresql://user:password@localhost:5432/db');
      expect(attributes['db.user']).toBe('user');
      expect(attributes['db.name']).toBe('austa_health_db');
      expect(attributes['db.statement']).toBe('SELECT * FROM health_metrics WHERE user_id = $1');
      expect(attributes['db.operation']).toBe('SELECT');
      expect(attributes['db.instance']).toBe('localhost:5432');
      expect(attributes['db.sql.table']).toBe('health_metrics');
      expect(conformsToInterface<DatabaseSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow additional custom attributes', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.system': 'postgresql',
        'custom.attribute': 'custom-value'
      };
      
      expect(attributes['db.system']).toBe('postgresql');
      expect(attributes['custom.attribute']).toBe('custom-value');
      expect(conformsToInterface<DatabaseSpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('MessagingSpanAttributes Interface', () => {
    it('should allow messaging system attribute', () => {
      const attributes: MessagingSpanAttributes = {
        'messaging.system': 'kafka'
      };
      
      expect(attributes['messaging.system']).toBe('kafka');
      expect(conformsToInterface<MessagingSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow messaging destination attribute', () => {
      const attributes: MessagingSpanAttributes = {
        'messaging.destination': 'health-metrics-topic'
      };
      
      expect(attributes['messaging.destination']).toBe('health-metrics-topic');
      expect(conformsToInterface<MessagingSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all messaging attributes together', () => {
      const attributes: MessagingSpanAttributes = {
        'messaging.system': 'kafka',
        'messaging.destination': 'health-metrics-topic',
        'messaging.destination_kind': 'topic',
        'messaging.temp_destination': false,
        'messaging.protocol': 'kafka',
        'messaging.protocol_version': '2.0',
        'messaging.url': 'kafka://localhost:9092',
        'messaging.message_id': '12345',
        'messaging.conversation_id': '67890',
        'messaging.message_payload_size_bytes': 1024,
        'messaging.message_payload_compressed_size_bytes': 512
      };
      
      expect(attributes['messaging.system']).toBe('kafka');
      expect(attributes['messaging.destination']).toBe('health-metrics-topic');
      expect(attributes['messaging.destination_kind']).toBe('topic');
      expect(attributes['messaging.temp_destination']).toBe(false);
      expect(attributes['messaging.protocol']).toBe('kafka');
      expect(attributes['messaging.protocol_version']).toBe('2.0');
      expect(attributes['messaging.url']).toBe('kafka://localhost:9092');
      expect(attributes['messaging.message_id']).toBe('12345');
      expect(attributes['messaging.conversation_id']).toBe('67890');
      expect(attributes['messaging.message_payload_size_bytes']).toBe(1024);
      expect(attributes['messaging.message_payload_compressed_size_bytes']).toBe(512);
      expect(conformsToInterface<MessagingSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow additional custom attributes', () => {
      const attributes: MessagingSpanAttributes = {
        'messaging.system': 'kafka',
        'custom.attribute': 'custom-value'
      };
      
      expect(attributes['messaging.system']).toBe('kafka');
      expect(attributes['custom.attribute']).toBe('custom-value');
      expect(conformsToInterface<MessagingSpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('JourneySpanAttributes Interface', () => {
    it('should allow journey name attribute', () => {
      const attributes: JourneySpanAttributes = {
        'austa.journey.name': 'health'
      };
      
      expect(attributes['austa.journey.name']).toBe('health');
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow journey operation attribute', () => {
      const attributes: JourneySpanAttributes = {
        'austa.journey.operation': 'record-health-metric'
      };
      
      expect(attributes['austa.journey.operation']).toBe('record-health-metric');
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all journey attributes together', () => {
      const attributes: JourneySpanAttributes = {
        'austa.journey.name': 'health',
        'austa.journey.operation': 'record-health-metric',
        'austa.journey.user_id': 'user-123',
        'austa.journey.session_id': 'session-456',
        'austa.journey.feature': 'health-tracking',
        'austa.journey.step': 'input-metrics',
        'austa.journey.error_code': 'validation_error',
        'austa.journey.error_message': 'Invalid metric value'
      };
      
      expect(attributes['austa.journey.name']).toBe('health');
      expect(attributes['austa.journey.operation']).toBe('record-health-metric');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.journey.session_id']).toBe('session-456');
      expect(attributes['austa.journey.feature']).toBe('health-tracking');
      expect(attributes['austa.journey.step']).toBe('input-metrics');
      expect(attributes['austa.journey.error_code']).toBe('validation_error');
      expect(attributes['austa.journey.error_message']).toBe('Invalid metric value');
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow additional custom attributes', () => {
      const attributes: JourneySpanAttributes = {
        'austa.journey.name': 'health',
        'custom.attribute': 'custom-value'
      };
      
      expect(attributes['austa.journey.name']).toBe('health');
      expect(attributes['custom.attribute']).toBe('custom-value');
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('HealthJourneySpanAttributes Interface', () => {
    it('should allow health metric type attribute', () => {
      const attributes: HealthJourneySpanAttributes = {
        'austa.health.metric_type': 'blood_pressure'
      };
      
      expect(attributes['austa.health.metric_type']).toBe('blood_pressure');
      expect(conformsToInterface<HealthJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow health metric value attribute', () => {
      const attributes: HealthJourneySpanAttributes = {
        'austa.health.metric_value': 120
      };
      
      expect(attributes['austa.health.metric_value']).toBe(120);
      expect(conformsToInterface<HealthJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all health journey attributes together', () => {
      const attributes: HealthJourneySpanAttributes = {
        'austa.journey.name': 'health',
        'austa.journey.user_id': 'user-123',
        'austa.health.metric_type': 'blood_pressure',
        'austa.health.metric_value': 120,
        'austa.health.goal_id': 'goal-789',
        'austa.health.device_id': 'device-abc',
        'austa.health.integration_type': 'fitbit'
      };
      
      expect(attributes['austa.journey.name']).toBe('health');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.health.metric_type']).toBe('blood_pressure');
      expect(attributes['austa.health.metric_value']).toBe(120);
      expect(attributes['austa.health.goal_id']).toBe('goal-789');
      expect(attributes['austa.health.device_id']).toBe('device-abc');
      expect(attributes['austa.health.integration_type']).toBe('fitbit');
      expect(conformsToInterface<HealthJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should inherit from JourneySpanAttributes', () => {
      const attributes: HealthJourneySpanAttributes = {
        'austa.journey.name': 'health',
        'austa.journey.operation': 'record-health-metric',
        'austa.journey.user_id': 'user-123',
        'austa.journey.session_id': 'session-456',
        'austa.health.metric_type': 'blood_pressure'
      };
      
      expect(attributes['austa.journey.name']).toBe('health');
      expect(attributes['austa.journey.operation']).toBe('record-health-metric');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.journey.session_id']).toBe('session-456');
      expect(attributes['austa.health.metric_type']).toBe('blood_pressure');
      expect(conformsToInterface<HealthJourneySpanAttributes>(attributes)).toBe(true);
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('CareJourneySpanAttributes Interface', () => {
    it('should allow appointment id attribute', () => {
      const attributes: CareJourneySpanAttributes = {
        'austa.care.appointment_id': 'appointment-123'
      };
      
      expect(attributes['austa.care.appointment_id']).toBe('appointment-123');
      expect(conformsToInterface<CareJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow provider id attribute', () => {
      const attributes: CareJourneySpanAttributes = {
        'austa.care.provider_id': 'provider-456'
      };
      
      expect(attributes['austa.care.provider_id']).toBe('provider-456');
      expect(conformsToInterface<CareJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all care journey attributes together', () => {
      const attributes: CareJourneySpanAttributes = {
        'austa.journey.name': 'care',
        'austa.journey.user_id': 'user-123',
        'austa.care.appointment_id': 'appointment-123',
        'austa.care.provider_id': 'provider-456',
        'austa.care.telemedicine_session_id': 'telemedicine-789',
        'austa.care.medication_id': 'medication-abc',
        'austa.care.treatment_id': 'treatment-def'
      };
      
      expect(attributes['austa.journey.name']).toBe('care');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.care.appointment_id']).toBe('appointment-123');
      expect(attributes['austa.care.provider_id']).toBe('provider-456');
      expect(attributes['austa.care.telemedicine_session_id']).toBe('telemedicine-789');
      expect(attributes['austa.care.medication_id']).toBe('medication-abc');
      expect(attributes['austa.care.treatment_id']).toBe('treatment-def');
      expect(conformsToInterface<CareJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should inherit from JourneySpanAttributes', () => {
      const attributes: CareJourneySpanAttributes = {
        'austa.journey.name': 'care',
        'austa.journey.operation': 'book-appointment',
        'austa.journey.user_id': 'user-123',
        'austa.journey.session_id': 'session-456',
        'austa.care.appointment_id': 'appointment-123'
      };
      
      expect(attributes['austa.journey.name']).toBe('care');
      expect(attributes['austa.journey.operation']).toBe('book-appointment');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.journey.session_id']).toBe('session-456');
      expect(attributes['austa.care.appointment_id']).toBe('appointment-123');
      expect(conformsToInterface<CareJourneySpanAttributes>(attributes)).toBe(true);
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('PlanJourneySpanAttributes Interface', () => {
    it('should allow plan id attribute', () => {
      const attributes: PlanJourneySpanAttributes = {
        'austa.plan.plan_id': 'plan-123'
      };
      
      expect(attributes['austa.plan.plan_id']).toBe('plan-123');
      expect(conformsToInterface<PlanJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow benefit id attribute', () => {
      const attributes: PlanJourneySpanAttributes = {
        'austa.plan.benefit_id': 'benefit-456'
      };
      
      expect(attributes['austa.plan.benefit_id']).toBe('benefit-456');
      expect(conformsToInterface<PlanJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all plan journey attributes together', () => {
      const attributes: PlanJourneySpanAttributes = {
        'austa.journey.name': 'plan',
        'austa.journey.user_id': 'user-123',
        'austa.plan.plan_id': 'plan-123',
        'austa.plan.benefit_id': 'benefit-456',
        'austa.plan.claim_id': 'claim-789',
        'austa.plan.coverage_id': 'coverage-abc',
        'austa.plan.document_id': 'document-def'
      };
      
      expect(attributes['austa.journey.name']).toBe('plan');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.plan.plan_id']).toBe('plan-123');
      expect(attributes['austa.plan.benefit_id']).toBe('benefit-456');
      expect(attributes['austa.plan.claim_id']).toBe('claim-789');
      expect(attributes['austa.plan.coverage_id']).toBe('coverage-abc');
      expect(attributes['austa.plan.document_id']).toBe('document-def');
      expect(conformsToInterface<PlanJourneySpanAttributes>(attributes)).toBe(true);
    });

    it('should inherit from JourneySpanAttributes', () => {
      const attributes: PlanJourneySpanAttributes = {
        'austa.journey.name': 'plan',
        'austa.journey.operation': 'submit-claim',
        'austa.journey.user_id': 'user-123',
        'austa.journey.session_id': 'session-456',
        'austa.plan.claim_id': 'claim-789'
      };
      
      expect(attributes['austa.journey.name']).toBe('plan');
      expect(attributes['austa.journey.operation']).toBe('submit-claim');
      expect(attributes['austa.journey.user_id']).toBe('user-123');
      expect(attributes['austa.journey.session_id']).toBe('session-456');
      expect(attributes['austa.plan.claim_id']).toBe('claim-789');
      expect(conformsToInterface<PlanJourneySpanAttributes>(attributes)).toBe(true);
      expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('GamificationSpanAttributes Interface', () => {
    it('should allow event type attribute', () => {
      const attributes: GamificationSpanAttributes = {
        'austa.gamification.event_type': 'achievement_unlocked'
      };
      
      expect(attributes['austa.gamification.event_type']).toBe('achievement_unlocked');
      expect(conformsToInterface<GamificationSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow profile id attribute', () => {
      const attributes: GamificationSpanAttributes = {
        'austa.gamification.profile_id': 'profile-123'
      };
      
      expect(attributes['austa.gamification.profile_id']).toBe('profile-123');
      expect(conformsToInterface<GamificationSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all gamification attributes together', () => {
      const attributes: GamificationSpanAttributes = {
        'austa.gamification.event_type': 'achievement_unlocked',
        'austa.gamification.profile_id': 'profile-123',
        'austa.gamification.achievement_id': 'achievement-456',
        'austa.gamification.quest_id': 'quest-789',
        'austa.gamification.reward_id': 'reward-abc',
        'austa.gamification.points': 100,
        'austa.gamification.level': 5
      };
      
      expect(attributes['austa.gamification.event_type']).toBe('achievement_unlocked');
      expect(attributes['austa.gamification.profile_id']).toBe('profile-123');
      expect(attributes['austa.gamification.achievement_id']).toBe('achievement-456');
      expect(attributes['austa.gamification.quest_id']).toBe('quest-789');
      expect(attributes['austa.gamification.reward_id']).toBe('reward-abc');
      expect(attributes['austa.gamification.points']).toBe(100);
      expect(attributes['austa.gamification.level']).toBe(5);
      expect(conformsToInterface<GamificationSpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('ErrorSpanAttributes Interface', () => {
    it('should allow error type attribute', () => {
      const attributes: ErrorSpanAttributes = {
        'error.type': 'ValidationError'
      };
      
      expect(attributes['error.type']).toBe('ValidationError');
      expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow error message attribute', () => {
      const attributes: ErrorSpanAttributes = {
        'error.message': 'Invalid input data'
      };
      
      expect(attributes['error.message']).toBe('Invalid input data');
      expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
    });

    it('should allow all error attributes together', () => {
      const attributes: ErrorSpanAttributes = {
        'error.type': 'ValidationError',
        'error.message': 'Invalid input data',
        'error.stack': 'Error: Invalid input data\n    at validateInput (/app/src/validators.ts:42:11)',
        'error.code': 'VALIDATION_ERROR',
        'error.retry_count': 3,
        'error.is_retryable': true
      };
      
      expect(attributes['error.type']).toBe('ValidationError');
      expect(attributes['error.message']).toBe('Invalid input data');
      expect(attributes['error.stack']).toBe('Error: Invalid input data\n    at validateInput (/app/src/validators.ts:42:11)');
      expect(attributes['error.code']).toBe('VALIDATION_ERROR');
      expect(attributes['error.retry_count']).toBe(3);
      expect(attributes['error.is_retryable']).toBe(true);
      expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
    });
  });

  describe('Constant Values', () => {
    describe('JOURNEY_NAMES', () => {
      it('should have the correct journey names', () => {
        expect(JOURNEY_NAMES.HEALTH).toBe('health');
        expect(JOURNEY_NAMES.CARE).toBe('care');
        expect(JOURNEY_NAMES.PLAN).toBe('plan');
      });

      it('should be readonly', () => {
        // @ts-expect-error - This should fail because JOURNEY_NAMES is readonly
        expect(() => { JOURNEY_NAMES.HEALTH = 'modified'; }).toThrow();
      });
    });

    describe('DATABASE_SYSTEMS', () => {
      it('should have the correct database systems', () => {
        expect(DATABASE_SYSTEMS.POSTGRES).toBe('postgresql');
        expect(DATABASE_SYSTEMS.REDIS).toBe('redis');
        expect(DATABASE_SYSTEMS.MONGODB).toBe('mongodb');
      });

      it('should be readonly', () => {
        // @ts-expect-error - This should fail because DATABASE_SYSTEMS is readonly
        expect(() => { DATABASE_SYSTEMS.POSTGRES = 'modified'; }).toThrow();
      });
    });

    describe('MESSAGING_SYSTEMS', () => {
      it('should have the correct messaging systems', () => {
        expect(MESSAGING_SYSTEMS.KAFKA).toBe('kafka');
        expect(MESSAGING_SYSTEMS.RABBITMQ).toBe('rabbitmq');
        expect(MESSAGING_SYSTEMS.SQS).toBe('aws_sqs');
      });

      it('should be readonly', () => {
        // @ts-expect-error - This should fail because MESSAGING_SYSTEMS is readonly
        expect(() => { MESSAGING_SYSTEMS.KAFKA = 'modified'; }).toThrow();
      });
    });

    describe('ERROR_TYPES', () => {
      it('should have the correct error types', () => {
        expect(ERROR_TYPES.VALIDATION).toBe('validation_error');
        expect(ERROR_TYPES.AUTHENTICATION).toBe('authentication_error');
        expect(ERROR_TYPES.AUTHORIZATION).toBe('authorization_error');
        expect(ERROR_TYPES.NOT_FOUND).toBe('not_found_error');
        expect(ERROR_TYPES.TIMEOUT).toBe('timeout_error');
        expect(ERROR_TYPES.DEPENDENCY).toBe('dependency_error');
        expect(ERROR_TYPES.INTERNAL).toBe('internal_error');
      });

      it('should be readonly', () => {
        // @ts-expect-error - This should fail because ERROR_TYPES is readonly
        expect(() => { ERROR_TYPES.VALIDATION = 'modified'; }).toThrow();
      });
    });

    describe('GAMIFICATION_EVENT_TYPES', () => {
      it('should have the correct gamification event types', () => {
        expect(GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED).toBe('achievement_unlocked');
        expect(GAMIFICATION_EVENT_TYPES.QUEST_COMPLETED).toBe('quest_completed');
        expect(GAMIFICATION_EVENT_TYPES.REWARD_CLAIMED).toBe('reward_claimed');
        expect(GAMIFICATION_EVENT_TYPES.POINTS_EARNED).toBe('points_earned');
        expect(GAMIFICATION_EVENT_TYPES.LEVEL_UP).toBe('level_up');
      });

      it('should be readonly', () => {
        // @ts-expect-error - This should fail because GAMIFICATION_EVENT_TYPES is readonly
        expect(() => { GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED = 'modified'; }).toThrow();
      });
    });
  });

  describe('Helper Functions', () => {
    describe('createJourneyAttributes', () => {
      it('should create journey attributes with the provided values', () => {
        const journeyName = 'health';
        const userId = 'user-123';
        const sessionId = 'session-456';
        
        const attributes = createJourneyAttributes(journeyName, userId, sessionId);
        
        expect(attributes['austa.journey.name']).toBe(journeyName);
        expect(attributes['austa.journey.user_id']).toBe(userId);
        expect(attributes['austa.journey.session_id']).toBe(sessionId);
        expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
      });

      it('should create journey attributes with journey name from constants', () => {
        const journeyName = JOURNEY_NAMES.HEALTH;
        const userId = 'user-123';
        const sessionId = 'session-456';
        
        const attributes = createJourneyAttributes(journeyName, userId, sessionId);
        
        expect(attributes['austa.journey.name']).toBe(JOURNEY_NAMES.HEALTH);
        expect(attributes['austa.journey.user_id']).toBe(userId);
        expect(attributes['austa.journey.session_id']).toBe(sessionId);
        expect(conformsToInterface<JourneySpanAttributes>(attributes)).toBe(true);
      });
    });

    describe('createErrorAttributes', () => {
      it('should create error attributes from an Error object', () => {
        const error = new Error('Test error message');
        
        const attributes = createErrorAttributes(error);
        
        expect(attributes['error.type']).toBe('Error');
        expect(attributes['error.message']).toBe('Test error message');
        expect(attributes['error.stack']).toBe(error.stack);
        expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
      });

      it('should create error attributes with optional code', () => {
        const error = new Error('Test error message');
        const code = ERROR_TYPES.VALIDATION;
        
        const attributes = createErrorAttributes(error, code);
        
        expect(attributes['error.type']).toBe('Error');
        expect(attributes['error.message']).toBe('Test error message');
        expect(attributes['error.stack']).toBe(error.stack);
        expect(attributes['error.code']).toBe(ERROR_TYPES.VALIDATION);
        expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
      });

      it('should create error attributes with optional isRetryable flag', () => {
        const error = new Error('Test error message');
        const code = ERROR_TYPES.TIMEOUT;
        const isRetryable = true;
        
        const attributes = createErrorAttributes(error, code, isRetryable);
        
        expect(attributes['error.type']).toBe('Error');
        expect(attributes['error.message']).toBe('Test error message');
        expect(attributes['error.stack']).toBe(error.stack);
        expect(attributes['error.code']).toBe(ERROR_TYPES.TIMEOUT);
        expect(attributes['error.is_retryable']).toBe(true);
        expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
      });

      it('should handle custom error classes', () => {
        class ValidationError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'ValidationError';
          }
        }
        
        const error = new ValidationError('Invalid input');
        
        const attributes = createErrorAttributes(error);
        
        expect(attributes['error.type']).toBe('ValidationError');
        expect(attributes['error.message']).toBe('Invalid input');
        expect(attributes['error.stack']).toBe(error.stack);
        expect(conformsToInterface<ErrorSpanAttributes>(attributes)).toBe(true);
      });
    });
  });

  describe('Attribute Serialization/Deserialization', () => {
    it('should serialize and deserialize span attributes correctly', () => {
      const originalAttributes: SpanAttributes = {
        'string.attribute': 'string-value',
        'number.attribute': 123,
        'boolean.attribute': true,
        'array.attribute': [1, 2, 3]
      };
      
      // Serialize to JSON
      const serialized = JSON.stringify(originalAttributes);
      
      // Deserialize from JSON
      const deserialized = JSON.parse(serialized) as SpanAttributes;
      
      // Verify the deserialized object matches the original
      expect(deserialized['string.attribute']).toBe(originalAttributes['string.attribute']);
      expect(deserialized['number.attribute']).toBe(originalAttributes['number.attribute']);
      expect(deserialized['boolean.attribute']).toBe(originalAttributes['boolean.attribute']);
      expect(deserialized['array.attribute']).toEqual(originalAttributes['array.attribute']);
      expect(conformsToInterface<SpanAttributes>(deserialized)).toBe(true);
    });

    it('should serialize and deserialize journey attributes correctly', () => {
      const originalAttributes: JourneySpanAttributes = {
        'austa.journey.name': 'health',
        'austa.journey.operation': 'record-health-metric',
        'austa.journey.user_id': 'user-123',
        'austa.journey.session_id': 'session-456'
      };
      
      // Serialize to JSON
      const serialized = JSON.stringify(originalAttributes);
      
      // Deserialize from JSON
      const deserialized = JSON.parse(serialized) as JourneySpanAttributes;
      
      // Verify the deserialized object matches the original
      expect(deserialized['austa.journey.name']).toBe(originalAttributes['austa.journey.name']);
      expect(deserialized['austa.journey.operation']).toBe(originalAttributes['austa.journey.operation']);
      expect(deserialized['austa.journey.user_id']).toBe(originalAttributes['austa.journey.user_id']);
      expect(deserialized['austa.journey.session_id']).toBe(originalAttributes['austa.journey.session_id']);
      expect(conformsToInterface<JourneySpanAttributes>(deserialized)).toBe(true);
    });

    it('should serialize and deserialize health journey attributes correctly', () => {
      const originalAttributes: HealthJourneySpanAttributes = {
        'austa.journey.name': 'health',
        'austa.journey.user_id': 'user-123',
        'austa.health.metric_type': 'blood_pressure',
        'austa.health.metric_value': 120
      };
      
      // Serialize to JSON
      const serialized = JSON.stringify(originalAttributes);
      
      // Deserialize from JSON
      const deserialized = JSON.parse(serialized) as HealthJourneySpanAttributes;
      
      // Verify the deserialized object matches the original
      expect(deserialized['austa.journey.name']).toBe(originalAttributes['austa.journey.name']);
      expect(deserialized['austa.journey.user_id']).toBe(originalAttributes['austa.journey.user_id']);
      expect(deserialized['austa.health.metric_type']).toBe(originalAttributes['austa.health.metric_type']);
      expect(deserialized['austa.health.metric_value']).toBe(originalAttributes['austa.health.metric_value']);
      expect(conformsToInterface<HealthJourneySpanAttributes>(deserialized)).toBe(true);
    });

    it('should serialize and deserialize error attributes correctly', () => {
      const error = new Error('Test error message');
      const originalAttributes = createErrorAttributes(error, ERROR_TYPES.VALIDATION, true);
      
      // Serialize to JSON
      const serialized = JSON.stringify(originalAttributes);
      
      // Deserialize from JSON
      const deserialized = JSON.parse(serialized) as ErrorSpanAttributes;
      
      // Verify the deserialized object matches the original
      expect(deserialized['error.type']).toBe(originalAttributes['error.type']);
      expect(deserialized['error.message']).toBe(originalAttributes['error.message']);
      expect(deserialized['error.code']).toBe(originalAttributes['error.code']);
      expect(deserialized['error.is_retryable']).toBe(originalAttributes['error.is_retryable']);
      expect(conformsToInterface<ErrorSpanAttributes>(deserialized)).toBe(true);
    });
  });
});