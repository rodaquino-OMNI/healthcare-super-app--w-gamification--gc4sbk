import {
  SpanAttributes,
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  UserSessionSpanAttributes,
  JourneySpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  ErrorSpanAttributes,
  ExternalServiceSpanAttributes,
  JOURNEY_TYPES,
  JOURNEY_STEP_STATUS,
  GAMIFICATION_EVENT_TYPES,
  ERROR_CATEGORIES,
  DB_SYSTEMS,
  MESSAGING_SYSTEMS,
  HTTP_METHODS,
  NETWORK_TYPES,
  DEVICE_TYPES,
  HEALTH_METRIC_TYPES,
  HEALTH_METRIC_UNITS,
  CARE_APPOINTMENT_TYPES,
  CARE_APPOINTMENT_STATUSES,
  PLAN_TYPES,
  CLAIM_STATUSES
} from '../../../src/interfaces/span-attributes.interface';

describe('Span Attributes Interface', () => {
  describe('Base SpanAttributes Interface', () => {
    it('should allow string attributes', () => {
      const attributes: SpanAttributes = {
        'custom.attribute': 'test-value'
      };
      expect(attributes['custom.attribute']).toBe('test-value');
    });

    it('should allow number attributes', () => {
      const attributes: SpanAttributes = {
        'custom.number': 42
      };
      expect(attributes['custom.number']).toBe(42);
    });

    it('should allow boolean attributes', () => {
      const attributes: SpanAttributes = {
        'custom.boolean': true
      };
      expect(attributes['custom.boolean']).toBe(true);
    });

    it('should allow array of strings attributes', () => {
      const attributes: SpanAttributes = {
        'custom.array': ['value1', 'value2']
      };
      expect(attributes['custom.array']).toEqual(['value1', 'value2']);
    });

    it('should allow array of numbers attributes', () => {
      const attributes: SpanAttributes = {
        'custom.numbers': [1, 2, 3]
      };
      expect(attributes['custom.numbers']).toEqual([1, 2, 3]);
    });

    it('should allow array of booleans attributes', () => {
      const attributes: SpanAttributes = {
        'custom.booleans': [true, false, true]
      };
      expect(attributes['custom.booleans']).toEqual([true, false, true]);
    });

    it('should allow mixed attributes', () => {
      const attributes: SpanAttributes = {
        'custom.string': 'test',
        'custom.number': 42,
        'custom.boolean': true,
        'custom.array': ['a', 'b']
      };
      
      expect(attributes['custom.string']).toBe('test');
      expect(attributes['custom.number']).toBe(42);
      expect(attributes['custom.boolean']).toBe(true);
      expect(attributes['custom.array']).toEqual(['a', 'b']);
    });
  });

  describe('HTTP Span Attributes', () => {
    it('should allow HTTP-specific attributes', () => {
      const attributes: HttpSpanAttributes = {
        'http.method': 'GET',
        'http.url': 'https://api.austa.health/users',
        'http.status_code': 200,
        'http.route': '/users',
        'custom.attribute': 'custom-value' // Base attributes should still work
      };
      
      expect(attributes['http.method']).toBe('GET');
      expect(attributes['http.url']).toBe('https://api.austa.health/users');
      expect(attributes['http.status_code']).toBe(200);
      expect(attributes['http.route']).toBe('/users');
      expect(attributes['custom.attribute']).toBe('custom-value');
    });

    it('should validate HTTP method values against constants', () => {
      // This is a type-level test to ensure HTTP_METHODS constants can be used with HttpSpanAttributes
      const attributes: HttpSpanAttributes = {
        'http.method': HTTP_METHODS.GET
      };
      expect(attributes['http.method']).toBe('GET');
      
      // Test other methods
      const methods: HttpSpanAttributes[] = Object.values(HTTP_METHODS).map(method => ({
        'http.method': method
      }));
      
      methods.forEach((attr, index) => {
        expect(attr['http.method']).toBe(Object.values(HTTP_METHODS)[index]);
      });
    });

    it('should support performance monitoring attributes', () => {
      const attributes: HttpSpanAttributes = {
        'http.method': 'POST',
        'http.url': 'https://api.austa.health/health/metrics',
        'http.status_code': 201,
        'http.request_content_length': 1024,
        'http.response_content_length': 512
      };
      
      expect(attributes['http.request_content_length']).toBe(1024);
      expect(attributes['http.response_content_length']).toBe(512);
    });
  });

  describe('Database Span Attributes', () => {
    it('should allow database-specific attributes', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.system': 'postgresql',
        'db.name': 'austa_health_db',
        'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1',
        'db.operation': 'SELECT',
        'db.sql.table': 'health_metrics'
      };
      
      expect(attributes['db.system']).toBe('postgresql');
      expect(attributes['db.name']).toBe('austa_health_db');
      expect(attributes['db.statement']).toBe('SELECT * FROM health_metrics WHERE user_id = $1');
      expect(attributes['db.operation']).toBe('SELECT');
      expect(attributes['db.sql.table']).toBe('health_metrics');
    });

    it('should validate database system values against constants', () => {
      // This is a type-level test to ensure DB_SYSTEMS constants can be used with DatabaseSpanAttributes
      const attributes: DatabaseSpanAttributes = {
        'db.system': DB_SYSTEMS.POSTGRESQL
      };
      expect(attributes['db.system']).toBe('postgresql');
      
      // Test other database systems
      const systems: DatabaseSpanAttributes[] = Object.values(DB_SYSTEMS).map(system => ({
        'db.system': system
      }));
      
      systems.forEach((attr, index) => {
        expect(attr['db.system']).toBe(Object.values(DB_SYSTEMS)[index]);
      });
    });

    it('should support performance monitoring for database operations', () => {
      const attributes: DatabaseSpanAttributes = {
        'db.system': DB_SYSTEMS.POSTGRESQL,
        'db.name': 'austa_health_db',
        'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
        'db.operation': 'SELECT',
        'db.sql.table': 'health_metrics'
      };
      
      // These assertions verify that the attributes needed for performance monitoring are supported
      expect(attributes['db.system']).toBeDefined();
      expect(attributes['db.statement']).toBeDefined();
      expect(attributes['db.operation']).toBeDefined();
      expect(attributes['db.sql.table']).toBeDefined();
    });
  });

  describe('Messaging Span Attributes', () => {
    it('should allow messaging-specific attributes', () => {
      const attributes: MessagingSpanAttributes = {
        'messaging.system': 'kafka',
        'messaging.destination': 'health-metrics',
        'messaging.destination_kind': 'topic',
        'messaging.message_id': '1234567890',
        'messaging.conversation_id': 'conv-123',
        'messaging.message_payload_size_bytes': 2048
      };
      
      expect(attributes['messaging.system']).toBe('kafka');
      expect(attributes['messaging.destination']).toBe('health-metrics');
      expect(attributes['messaging.destination_kind']).toBe('topic');
      expect(attributes['messaging.message_id']).toBe('1234567890');
      expect(attributes['messaging.conversation_id']).toBe('conv-123');
      expect(attributes['messaging.message_payload_size_bytes']).toBe(2048);
    });

    it('should validate messaging system values against constants', () => {
      // This is a type-level test to ensure MESSAGING_SYSTEMS constants can be used with MessagingSpanAttributes
      const attributes: MessagingSpanAttributes = {
        'messaging.system': MESSAGING_SYSTEMS.KAFKA
      };
      expect(attributes['messaging.system']).toBe('kafka');
      
      // Test other messaging systems
      const systems: MessagingSpanAttributes[] = Object.values(MESSAGING_SYSTEMS).map(system => ({
        'messaging.system': system
      }));
      
      systems.forEach((attr, index) => {
        expect(attr['messaging.system']).toBe(Object.values(MESSAGING_SYSTEMS)[index]);
      });
    });
  });

  describe('User Session Span Attributes', () => {
    it('should allow user session-specific attributes', () => {
      const attributes: UserSessionSpanAttributes = {
        'user.id': 'user-123',
        'user.session.id': 'session-456',
        'user.device.id': 'device-789',
        'user.device.type': 'mobile',
        'user.device.platform': 'ios',
        'user.device.platform_version': '15.0',
        'user.app.version': '1.2.3',
        'user.network.type': 'wifi'
      };
      
      expect(attributes['user.id']).toBe('user-123');
      expect(attributes['user.session.id']).toBe('session-456');
      expect(attributes['user.device.id']).toBe('device-789');
      expect(attributes['user.device.type']).toBe('mobile');
      expect(attributes['user.device.platform']).toBe('ios');
      expect(attributes['user.device.platform_version']).toBe('15.0');
      expect(attributes['user.app.version']).toBe('1.2.3');
      expect(attributes['user.network.type']).toBe('wifi');
    });

    it('should validate device type values against constants', () => {
      // This is a type-level test to ensure DEVICE_TYPES constants can be used with UserSessionSpanAttributes
      const attributes: UserSessionSpanAttributes = {
        'user.device.type': DEVICE_TYPES.MOBILE
      };
      expect(attributes['user.device.type']).toBe('mobile');
      
      // Test other device types
      const deviceTypes: UserSessionSpanAttributes[] = Object.values(DEVICE_TYPES).map(type => ({
        'user.device.type': type
      }));
      
      deviceTypes.forEach((attr, index) => {
        expect(attr['user.device.type']).toBe(Object.values(DEVICE_TYPES)[index]);
      });
    });

    it('should validate network type values against constants', () => {
      // This is a type-level test to ensure NETWORK_TYPES constants can be used with UserSessionSpanAttributes
      const attributes: UserSessionSpanAttributes = {
        'user.network.type': NETWORK_TYPES.WIFI
      };
      expect(attributes['user.network.type']).toBe('wifi');
      
      // Test other network types
      const networkTypes: UserSessionSpanAttributes[] = Object.values(NETWORK_TYPES).map(type => ({
        'user.network.type': type
      }));
      
      networkTypes.forEach((attr, index) => {
        expect(attr['user.network.type']).toBe(Object.values(NETWORK_TYPES)[index]);
      });
    });
  });

  describe('Journey Span Attributes', () => {
    it('should allow journey-specific attributes', () => {
      const attributes: JourneySpanAttributes = {
        'journey.type': 'health',
        'journey.id': 'journey-123',
        'journey.step': 'record-health-metric',
        'journey.step.status': 'completed',
        'journey.completion_percentage': 75
      };
      
      expect(attributes['journey.type']).toBe('health');
      expect(attributes['journey.id']).toBe('journey-123');
      expect(attributes['journey.step']).toBe('record-health-metric');
      expect(attributes['journey.step.status']).toBe('completed');
      expect(attributes['journey.completion_percentage']).toBe(75);
    });

    it('should validate journey type values against constants', () => {
      // This is a type-level test to ensure JOURNEY_TYPES constants can be used with JourneySpanAttributes
      const attributes: JourneySpanAttributes = {
        'journey.type': JOURNEY_TYPES.HEALTH
      };
      expect(attributes['journey.type']).toBe('health');
      
      // Test other journey types
      const journeyTypes: JourneySpanAttributes[] = Object.values(JOURNEY_TYPES).map(type => ({
        'journey.type': type
      }));
      
      journeyTypes.forEach((attr, index) => {
        expect(attr['journey.type']).toBe(Object.values(JOURNEY_TYPES)[index]);
      });
    });

    it('should validate journey step status values against constants', () => {
      // This is a type-level test to ensure JOURNEY_STEP_STATUS constants can be used with JourneySpanAttributes
      const attributes: JourneySpanAttributes = {
        'journey.step.status': JOURNEY_STEP_STATUS.COMPLETED
      };
      expect(attributes['journey.step.status']).toBe('completed');
      
      // Test other journey step statuses
      const stepStatuses: JourneySpanAttributes[] = Object.values(JOURNEY_STEP_STATUS).map(status => ({
        'journey.step.status': status
      }));
      
      stepStatuses.forEach((attr, index) => {
        expect(attr['journey.step.status']).toBe(Object.values(JOURNEY_STEP_STATUS)[index]);
      });
    });
  });

  describe('Health Journey Span Attributes', () => {
    it('should allow health journey-specific attributes', () => {
      const attributes: HealthJourneySpanAttributes = {
        'journey.type': JOURNEY_TYPES.HEALTH,
        'journey.id': 'health-journey-123',
        'journey.step': 'record-heart-rate',
        'journey.step.status': JOURNEY_STEP_STATUS.COMPLETED,
        'health.metric.type': HEALTH_METRIC_TYPES.HEART_RATE,
        'health.metric.value': 72,
        'health.metric.unit': HEALTH_METRIC_UNITS.BPM,
        'health.goal.id': 'goal-123',
        'health.goal.progress': 80,
        'health.device.id': 'device-456',
        'health.device.type': 'smartwatch'
      };
      
      expect(attributes['journey.type']).toBe('health');
      expect(attributes['health.metric.type']).toBe('heart_rate');
      expect(attributes['health.metric.value']).toBe(72);
      expect(attributes['health.metric.unit']).toBe('bpm');
      expect(attributes['health.goal.id']).toBe('goal-123');
      expect(attributes['health.goal.progress']).toBe(80);
      expect(attributes['health.device.id']).toBe('device-456');
      expect(attributes['health.device.type']).toBe('smartwatch');
    });

    it('should validate health metric type values against constants', () => {
      // This is a type-level test to ensure HEALTH_METRIC_TYPES constants can be used with HealthJourneySpanAttributes
      const attributes: HealthJourneySpanAttributes = {
        'health.metric.type': HEALTH_METRIC_TYPES.HEART_RATE
      };
      expect(attributes['health.metric.type']).toBe('heart_rate');
      
      // Test other health metric types
      const metricTypes: HealthJourneySpanAttributes[] = Object.values(HEALTH_METRIC_TYPES).map(type => ({
        'health.metric.type': type
      }));
      
      metricTypes.forEach((attr, index) => {
        expect(attr['health.metric.type']).toBe(Object.values(HEALTH_METRIC_TYPES)[index]);
      });
    });

    it('should validate health metric unit values against constants', () => {
      // This is a type-level test to ensure HEALTH_METRIC_UNITS constants can be used with HealthJourneySpanAttributes
      const attributes: HealthJourneySpanAttributes = {
        'health.metric.unit': HEALTH_METRIC_UNITS.BPM
      };
      expect(attributes['health.metric.unit']).toBe('bpm');
      
      // Test other health metric units
      const metricUnits: HealthJourneySpanAttributes[] = Object.values(HEALTH_METRIC_UNITS).map(unit => ({
        'health.metric.unit': unit
      }));
      
      metricUnits.forEach((attr, index) => {
        expect(attr['health.metric.unit']).toBe(Object.values(HEALTH_METRIC_UNITS)[index]);
      });
    });
  });

  describe('Care Journey Span Attributes', () => {
    it('should allow care journey-specific attributes', () => {
      const attributes: CareJourneySpanAttributes = {
        'journey.type': JOURNEY_TYPES.CARE,
        'journey.id': 'care-journey-123',
        'journey.step': 'book-appointment',
        'journey.step.status': JOURNEY_STEP_STATUS.COMPLETED,
        'care.appointment.id': 'appointment-123',
        'care.appointment.type': CARE_APPOINTMENT_TYPES.TELEMEDICINE,
        'care.appointment.status': CARE_APPOINTMENT_STATUSES.SCHEDULED,
        'care.provider.id': 'provider-456',
        'care.provider.specialty': 'cardiology',
        'care.telemedicine.session.id': 'session-789'
      };
      
      expect(attributes['journey.type']).toBe('care');
      expect(attributes['care.appointment.id']).toBe('appointment-123');
      expect(attributes['care.appointment.type']).toBe('telemedicine');
      expect(attributes['care.appointment.status']).toBe('scheduled');
      expect(attributes['care.provider.id']).toBe('provider-456');
      expect(attributes['care.provider.specialty']).toBe('cardiology');
      expect(attributes['care.telemedicine.session.id']).toBe('session-789');
    });

    it('should validate care appointment type values against constants', () => {
      // This is a type-level test to ensure CARE_APPOINTMENT_TYPES constants can be used with CareJourneySpanAttributes
      const attributes: CareJourneySpanAttributes = {
        'care.appointment.type': CARE_APPOINTMENT_TYPES.TELEMEDICINE
      };
      expect(attributes['care.appointment.type']).toBe('telemedicine');
      
      // Test other care appointment types
      const appointmentTypes: CareJourneySpanAttributes[] = Object.values(CARE_APPOINTMENT_TYPES).map(type => ({
        'care.appointment.type': type
      }));
      
      appointmentTypes.forEach((attr, index) => {
        expect(attr['care.appointment.type']).toBe(Object.values(CARE_APPOINTMENT_TYPES)[index]);
      });
    });

    it('should validate care appointment status values against constants', () => {
      // This is a type-level test to ensure CARE_APPOINTMENT_STATUSES constants can be used with CareJourneySpanAttributes
      const attributes: CareJourneySpanAttributes = {
        'care.appointment.status': CARE_APPOINTMENT_STATUSES.SCHEDULED
      };
      expect(attributes['care.appointment.status']).toBe('scheduled');
      
      // Test other care appointment statuses
      const appointmentStatuses: CareJourneySpanAttributes[] = Object.values(CARE_APPOINTMENT_STATUSES).map(status => ({
        'care.appointment.status': status
      }));
      
      appointmentStatuses.forEach((attr, index) => {
        expect(attr['care.appointment.status']).toBe(Object.values(CARE_APPOINTMENT_STATUSES)[index]);
      });
    });
  });

  describe('Plan Journey Span Attributes', () => {
    it('should allow plan journey-specific attributes', () => {
      const attributes: PlanJourneySpanAttributes = {
        'journey.type': JOURNEY_TYPES.PLAN,
        'journey.id': 'plan-journey-123',
        'journey.step': 'submit-claim',
        'journey.step.status': JOURNEY_STEP_STATUS.COMPLETED,
        'plan.id': 'plan-123',
        'plan.type': PLAN_TYPES.HEALTH,
        'plan.benefit.id': 'benefit-456',
        'plan.benefit.type': 'prescription',
        'plan.claim.id': 'claim-789',
        'plan.claim.status': CLAIM_STATUSES.SUBMITTED,
        'plan.claim.amount': 150.75,
        'plan.coverage.id': 'coverage-101',
        'plan.coverage.type': 'family'
      };
      
      expect(attributes['journey.type']).toBe('plan');
      expect(attributes['plan.id']).toBe('plan-123');
      expect(attributes['plan.type']).toBe('health');
      expect(attributes['plan.benefit.id']).toBe('benefit-456');
      expect(attributes['plan.benefit.type']).toBe('prescription');
      expect(attributes['plan.claim.id']).toBe('claim-789');
      expect(attributes['plan.claim.status']).toBe('submitted');
      expect(attributes['plan.claim.amount']).toBe(150.75);
      expect(attributes['plan.coverage.id']).toBe('coverage-101');
      expect(attributes['plan.coverage.type']).toBe('family');
    });

    it('should validate plan type values against constants', () => {
      // This is a type-level test to ensure PLAN_TYPES constants can be used with PlanJourneySpanAttributes
      const attributes: PlanJourneySpanAttributes = {
        'plan.type': PLAN_TYPES.HEALTH
      };
      expect(attributes['plan.type']).toBe('health');
      
      // Test other plan types
      const planTypes: PlanJourneySpanAttributes[] = Object.values(PLAN_TYPES).map(type => ({
        'plan.type': type
      }));
      
      planTypes.forEach((attr, index) => {
        expect(attr['plan.type']).toBe(Object.values(PLAN_TYPES)[index]);
      });
    });

    it('should validate claim status values against constants', () => {
      // This is a type-level test to ensure CLAIM_STATUSES constants can be used with PlanJourneySpanAttributes
      const attributes: PlanJourneySpanAttributes = {
        'plan.claim.status': CLAIM_STATUSES.SUBMITTED
      };
      expect(attributes['plan.claim.status']).toBe('submitted');
      
      // Test other claim statuses
      const claimStatuses: PlanJourneySpanAttributes[] = Object.values(CLAIM_STATUSES).map(status => ({
        'plan.claim.status': status
      }));
      
      claimStatuses.forEach((attr, index) => {
        expect(attr['plan.claim.status']).toBe(Object.values(CLAIM_STATUSES)[index]);
      });
    });
  });

  describe('Gamification Span Attributes', () => {
    it('should allow gamification-specific attributes', () => {
      const attributes: GamificationSpanAttributes = {
        'gamification.event.type': GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
        'gamification.event.id': 'event-123',
        'gamification.profile.id': 'profile-456',
        'gamification.achievement.id': 'achievement-789',
        'gamification.achievement.name': 'Health Enthusiast',
        'gamification.quest.id': 'quest-101',
        'gamification.quest.name': 'Complete Health Profile',
        'gamification.reward.id': 'reward-202',
        'gamification.reward.type': 'points',
        'gamification.points.earned': 100,
        'gamification.level.current': 5,
        'gamification.level.progress': 75
      };
      
      expect(attributes['gamification.event.type']).toBe('achievement_unlocked');
      expect(attributes['gamification.event.id']).toBe('event-123');
      expect(attributes['gamification.profile.id']).toBe('profile-456');
      expect(attributes['gamification.achievement.id']).toBe('achievement-789');
      expect(attributes['gamification.achievement.name']).toBe('Health Enthusiast');
      expect(attributes['gamification.quest.id']).toBe('quest-101');
      expect(attributes['gamification.quest.name']).toBe('Complete Health Profile');
      expect(attributes['gamification.reward.id']).toBe('reward-202');
      expect(attributes['gamification.reward.type']).toBe('points');
      expect(attributes['gamification.points.earned']).toBe(100);
      expect(attributes['gamification.level.current']).toBe(5);
      expect(attributes['gamification.level.progress']).toBe(75);
    });

    it('should validate gamification event type values against constants', () => {
      // This is a type-level test to ensure GAMIFICATION_EVENT_TYPES constants can be used with GamificationSpanAttributes
      const attributes: GamificationSpanAttributes = {
        'gamification.event.type': GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED
      };
      expect(attributes['gamification.event.type']).toBe('achievement_unlocked');
      
      // Test other gamification event types
      const eventTypes: GamificationSpanAttributes[] = Object.values(GAMIFICATION_EVENT_TYPES).map(type => ({
        'gamification.event.type': type
      }));
      
      eventTypes.forEach((attr, index) => {
        expect(attr['gamification.event.type']).toBe(Object.values(GAMIFICATION_EVENT_TYPES)[index]);
      });
    });
  });

  describe('Error Span Attributes', () => {
    it('should allow error-specific attributes', () => {
      const attributes: ErrorSpanAttributes = {
        'error.type': 'ValidationError',
        'error.message': 'Invalid health metric value',
        'error.stack': 'Error: Invalid health metric value\n    at validateMetric (/app/src/health/validators.ts:42:11)',
        'error.code': 'HEALTH-1001',
        'error.retry_count': 2,
        'error.category': ERROR_CATEGORIES.VALIDATION,
        'error.handled': true
      };
      
      expect(attributes['error.type']).toBe('ValidationError');
      expect(attributes['error.message']).toBe('Invalid health metric value');
      expect(attributes['error.stack']).toContain('Error: Invalid health metric value');
      expect(attributes['error.code']).toBe('HEALTH-1001');
      expect(attributes['error.retry_count']).toBe(2);
      expect(attributes['error.category']).toBe('validation_error');
      expect(attributes['error.handled']).toBe(true);
    });

    it('should validate error category values against constants', () => {
      // This is a type-level test to ensure ERROR_CATEGORIES constants can be used with ErrorSpanAttributes
      const attributes: ErrorSpanAttributes = {
        'error.category': ERROR_CATEGORIES.VALIDATION
      };
      expect(attributes['error.category']).toBe('validation_error');
      
      // Test other error categories
      const errorCategories: ErrorSpanAttributes[] = Object.values(ERROR_CATEGORIES).map(category => ({
        'error.category': category
      }));
      
      errorCategories.forEach((attr, index) => {
        expect(attr['error.category']).toBe(Object.values(ERROR_CATEGORIES)[index]);
      });
    });
  });

  describe('External Service Span Attributes', () => {
    it('should allow external service-specific attributes', () => {
      const attributes: ExternalServiceSpanAttributes = {
        'service.name': 'fhir-api',
        'service.version': '1.0.0',
        'service.instance.id': 'instance-123',
        'service.namespace': 'health-integrations',
        'service.endpoint': '/api/v1/patients',
        'service.operation': 'getPatientRecords'
      };
      
      expect(attributes['service.name']).toBe('fhir-api');
      expect(attributes['service.version']).toBe('1.0.0');
      expect(attributes['service.instance.id']).toBe('instance-123');
      expect(attributes['service.namespace']).toBe('health-integrations');
      expect(attributes['service.endpoint']).toBe('/api/v1/patients');
      expect(attributes['service.operation']).toBe('getPatientRecords');
    });
  });

  describe('Attribute Serialization/Deserialization', () => {
    it('should properly serialize span attributes to JSON', () => {
      const attributes: SpanAttributes = {
        'journey.type': JOURNEY_TYPES.HEALTH,
        'journey.id': 'journey-123',
        'health.metric.type': HEALTH_METRIC_TYPES.HEART_RATE,
        'health.metric.value': 72,
        'user.id': 'user-456',
        'error.handled': true
      };
      
      const serialized = JSON.stringify(attributes);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized['journey.type']).toBe('health');
      expect(deserialized['journey.id']).toBe('journey-123');
      expect(deserialized['health.metric.type']).toBe('heart_rate');
      expect(deserialized['health.metric.value']).toBe(72);
      expect(deserialized['user.id']).toBe('user-456');
      expect(deserialized['error.handled']).toBe(true);
    });

    it('should handle complex nested attributes during serialization', () => {
      const healthAttributes: HealthJourneySpanAttributes = {
        'journey.type': JOURNEY_TYPES.HEALTH,
        'health.metric.type': HEALTH_METRIC_TYPES.HEART_RATE,
        'health.metric.value': 72
      };
      
      const errorAttributes: ErrorSpanAttributes = {
        'error.type': 'ValidationError',
        'error.handled': true
      };
      
      // Combine attributes from different interfaces
      const combinedAttributes: SpanAttributes = {
        ...healthAttributes,
        ...errorAttributes,
        'custom.attribute': 'custom-value'
      };
      
      const serialized = JSON.stringify(combinedAttributes);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized['journey.type']).toBe('health');
      expect(deserialized['health.metric.type']).toBe('heart_rate');
      expect(deserialized['health.metric.value']).toBe(72);
      expect(deserialized['error.type']).toBe('ValidationError');
      expect(deserialized['error.handled']).toBe(true);
      expect(deserialized['custom.attribute']).toBe('custom-value');
    });

    it('should handle array attributes during serialization', () => {
      const attributes: SpanAttributes = {
        'tags': ['health', 'metric', 'heart-rate'],
        'values': [72, 75, 68],
        'flags': [true, false, true]
      };
      
      const serialized = JSON.stringify(attributes);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized['tags']).toEqual(['health', 'metric', 'heart-rate']);
      expect(deserialized['values']).toEqual([72, 75, 68]);
      expect(deserialized['flags']).toEqual([true, false, true]);
    });
  });

  describe('Constant Values', () => {
    it('should have the correct journey type values', () => {
      expect(JOURNEY_TYPES.HEALTH).toBe('health');
      expect(JOURNEY_TYPES.CARE).toBe('care');
      expect(JOURNEY_TYPES.PLAN).toBe('plan');
    });

    it('should have the correct journey step status values', () => {
      expect(JOURNEY_STEP_STATUS.STARTED).toBe('started');
      expect(JOURNEY_STEP_STATUS.IN_PROGRESS).toBe('in_progress');
      expect(JOURNEY_STEP_STATUS.COMPLETED).toBe('completed');
      expect(JOURNEY_STEP_STATUS.FAILED).toBe('failed');
      expect(JOURNEY_STEP_STATUS.ABANDONED).toBe('abandoned');
    });

    it('should have the correct gamification event type values', () => {
      expect(GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED).toBe('achievement_unlocked');
      expect(GAMIFICATION_EVENT_TYPES.QUEST_COMPLETED).toBe('quest_completed');
      expect(GAMIFICATION_EVENT_TYPES.QUEST_STARTED).toBe('quest_started');
      expect(GAMIFICATION_EVENT_TYPES.POINTS_EARNED).toBe('points_earned');
      expect(GAMIFICATION_EVENT_TYPES.LEVEL_UP).toBe('level_up');
      expect(GAMIFICATION_EVENT_TYPES.REWARD_CLAIMED).toBe('reward_claimed');
    });

    it('should have the correct error category values', () => {
      expect(ERROR_CATEGORIES.CLIENT).toBe('client_error');
      expect(ERROR_CATEGORIES.SERVER).toBe('server_error');
      expect(ERROR_CATEGORIES.NETWORK).toBe('network_error');
      expect(ERROR_CATEGORIES.DATABASE).toBe('database_error');
      expect(ERROR_CATEGORIES.VALIDATION).toBe('validation_error');
      expect(ERROR_CATEGORIES.AUTHORIZATION).toBe('authorization_error');
      expect(ERROR_CATEGORIES.EXTERNAL_SERVICE).toBe('external_service_error');
      expect(ERROR_CATEGORIES.TIMEOUT).toBe('timeout_error');
      expect(ERROR_CATEGORIES.UNKNOWN).toBe('unknown_error');
    });

    it('should have the correct database system values', () => {
      expect(DB_SYSTEMS.POSTGRESQL).toBe('postgresql');
      expect(DB_SYSTEMS.MYSQL).toBe('mysql');
      expect(DB_SYSTEMS.MONGODB).toBe('mongodb');
      expect(DB_SYSTEMS.REDIS).toBe('redis');
      expect(DB_SYSTEMS.ELASTICSEARCH).toBe('elasticsearch');
    });

    it('should have the correct messaging system values', () => {
      expect(MESSAGING_SYSTEMS.KAFKA).toBe('kafka');
      expect(MESSAGING_SYSTEMS.RABBITMQ).toBe('rabbitmq');
      expect(MESSAGING_SYSTEMS.SQS).toBe('aws_sqs');
      expect(MESSAGING_SYSTEMS.SNS).toBe('aws_sns');
    });

    it('should have the correct HTTP method values', () => {
      expect(HTTP_METHODS.GET).toBe('GET');
      expect(HTTP_METHODS.POST).toBe('POST');
      expect(HTTP_METHODS.PUT).toBe('PUT');
      expect(HTTP_METHODS.DELETE).toBe('DELETE');
      expect(HTTP_METHODS.PATCH).toBe('PATCH');
      expect(HTTP_METHODS.HEAD).toBe('HEAD');
      expect(HTTP_METHODS.OPTIONS).toBe('OPTIONS');
    });

    it('should have the correct network type values', () => {
      expect(NETWORK_TYPES.WIFI).toBe('wifi');
      expect(NETWORK_TYPES.CELLULAR).toBe('cellular');
      expect(NETWORK_TYPES.ETHERNET).toBe('ethernet');
      expect(NETWORK_TYPES.OFFLINE).toBe('offline');
      expect(NETWORK_TYPES.UNKNOWN).toBe('unknown');
    });

    it('should have the correct device type values', () => {
      expect(DEVICE_TYPES.MOBILE).toBe('mobile');
      expect(DEVICE_TYPES.TABLET).toBe('tablet');
      expect(DEVICE_TYPES.DESKTOP).toBe('desktop');
      expect(DEVICE_TYPES.WEARABLE).toBe('wearable');
      expect(DEVICE_TYPES.TV).toBe('tv');
      expect(DEVICE_TYPES.UNKNOWN).toBe('unknown');
    });

    it('should have the correct health metric type values', () => {
      expect(HEALTH_METRIC_TYPES.HEART_RATE).toBe('heart_rate');
      expect(HEALTH_METRIC_TYPES.BLOOD_PRESSURE).toBe('blood_pressure');
      expect(HEALTH_METRIC_TYPES.BLOOD_GLUCOSE).toBe('blood_glucose');
      expect(HEALTH_METRIC_TYPES.WEIGHT).toBe('weight');
      expect(HEALTH_METRIC_TYPES.STEPS).toBe('steps');
      expect(HEALTH_METRIC_TYPES.SLEEP).toBe('sleep');
      expect(HEALTH_METRIC_TYPES.CALORIES).toBe('calories');
      expect(HEALTH_METRIC_TYPES.OXYGEN_SATURATION).toBe('oxygen_saturation');
      expect(HEALTH_METRIC_TYPES.TEMPERATURE).toBe('temperature');
    });

    it('should have the correct health metric unit values', () => {
      expect(HEALTH_METRIC_UNITS.BPM).toBe('bpm');
      expect(HEALTH_METRIC_UNITS.MMHG).toBe('mmHg');
      expect(HEALTH_METRIC_UNITS.MG_DL).toBe('mg/dL');
      expect(HEALTH_METRIC_UNITS.KG).toBe('kg');
      expect(HEALTH_METRIC_UNITS.COUNT).toBe('count');
      expect(HEALTH_METRIC_UNITS.HOURS).toBe('hours');
      expect(HEALTH_METRIC_UNITS.KCAL).toBe('kcal');
      expect(HEALTH_METRIC_UNITS.PERCENT).toBe('percent');
      expect(HEALTH_METRIC_UNITS.CELSIUS).toBe('celsius');
    });

    it('should have the correct care appointment type values', () => {
      expect(CARE_APPOINTMENT_TYPES.IN_PERSON).toBe('in_person');
      expect(CARE_APPOINTMENT_TYPES.TELEMEDICINE).toBe('telemedicine');
      expect(CARE_APPOINTMENT_TYPES.HOME_VISIT).toBe('home_visit');
      expect(CARE_APPOINTMENT_TYPES.FOLLOW_UP).toBe('follow_up');
      expect(CARE_APPOINTMENT_TYPES.EMERGENCY).toBe('emergency');
    });

    it('should have the correct care appointment status values', () => {
      expect(CARE_APPOINTMENT_STATUSES.SCHEDULED).toBe('scheduled');
      expect(CARE_APPOINTMENT_STATUSES.CONFIRMED).toBe('confirmed');
      expect(CARE_APPOINTMENT_STATUSES.CHECKED_IN).toBe('checked_in');
      expect(CARE_APPOINTMENT_STATUSES.IN_PROGRESS).toBe('in_progress');
      expect(CARE_APPOINTMENT_STATUSES.COMPLETED).toBe('completed');
      expect(CARE_APPOINTMENT_STATUSES.CANCELLED).toBe('cancelled');
      expect(CARE_APPOINTMENT_STATUSES.NO_SHOW).toBe('no_show');
      expect(CARE_APPOINTMENT_STATUSES.RESCHEDULED).toBe('rescheduled');
    });

    it('should have the correct plan type values', () => {
      expect(PLAN_TYPES.HEALTH).toBe('health');
      expect(PLAN_TYPES.DENTAL).toBe('dental');
      expect(PLAN_TYPES.VISION).toBe('vision');
      expect(PLAN_TYPES.PHARMACY).toBe('pharmacy');
      expect(PLAN_TYPES.MENTAL_HEALTH).toBe('mental_health');
      expect(PLAN_TYPES.WELLNESS).toBe('wellness');
    });

    it('should have the correct claim status values', () => {
      expect(CLAIM_STATUSES.SUBMITTED).toBe('submitted');
      expect(CLAIM_STATUSES.UNDER_REVIEW).toBe('under_review');
      expect(CLAIM_STATUSES.ADDITIONAL_INFO_REQUIRED).toBe('additional_info_required');
      expect(CLAIM_STATUSES.APPROVED).toBe('approved');
      expect(CLAIM_STATUSES.PARTIALLY_APPROVED).toBe('partially_approved');
      expect(CLAIM_STATUSES.DENIED).toBe('denied');
      expect(CLAIM_STATUSES.APPEALED).toBe('appealed');
      expect(CLAIM_STATUSES.PAID).toBe('paid');
    });
  });
});