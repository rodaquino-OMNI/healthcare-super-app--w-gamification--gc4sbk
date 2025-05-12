/**
 * @file transformer.spec.ts
 * @description Unit tests for the event transformer functionality that validates the system's ability
 * to convert events between different versions. Tests bidirectional transformations (upgrading and
 * downgrading), transformation pipelines for chaining multiple transformations, and field-level
 * transformations with validation.
 */

import {
  registerTransformation,
  registerEventSchema,
  transformEvent,
  upgradeToLatest,
  downgradeEvent,
  createFieldMapper,
  createFieldTransformer,
  createTransformationPipeline,
} from '../../../src/versioning/transformer';

import { IVersionedEvent } from '../../../src/interfaces/event-versioning.interface';
import { MigrationError, TransformationError } from '../../../src/versioning/errors';
import { MigrationFunction } from '../../../src/versioning/types';

// Mock event schemas for testing
const eventSchemaV1 = {
  type: 'object',
  properties: {
    eventId: { type: 'string' },
    type: { type: 'string' },
    version: { type: 'string' },
    payload: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        action: { type: 'string' },
        timestamp: { type: 'string' },
      },
      required: ['userId', 'action', 'timestamp'],
    },
  },
  required: ['eventId', 'type', 'version', 'payload'],
};

const eventSchemaV2 = {
  type: 'object',
  properties: {
    eventId: { type: 'string' },
    type: { type: 'string' },
    version: { type: 'string' },
    payload: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        action: { type: 'string' },
        timestamp: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['userId', 'action', 'timestamp', 'metadata'],
    },
  },
  required: ['eventId', 'type', 'version', 'payload'],
};

const eventSchemaV3 = {
  type: 'object',
  properties: {
    eventId: { type: 'string' },
    type: { type: 'string' },
    version: { type: 'string' },
    payload: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            profile: { type: 'object' },
          },
          required: ['id'],
        },
        action: { type: 'string' },
        timestamp: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['user', 'action', 'timestamp', 'metadata'],
    },
  },
  required: ['eventId', 'type', 'version', 'payload'],
};

// Sample events for testing
const sampleEventV1: IVersionedEvent = {
  eventId: 'event-123',
  type: 'user.action',
  version: '1.0.0',
  payload: {
    userId: 'user-456',
    action: 'login',
    timestamp: '2023-01-01T12:00:00Z',
  },
  metadata: {
    source: 'test',
  },
};

const sampleEventV2: IVersionedEvent = {
  eventId: 'event-123',
  type: 'user.action',
  version: '2.0.0',
  payload: {
    userId: 'user-456',
    action: 'login',
    timestamp: '2023-01-01T12:00:00Z',
    metadata: {
      device: 'mobile',
      os: 'iOS',
    },
  },
  metadata: {
    source: 'test',
  },
};

const sampleEventV3: IVersionedEvent = {
  eventId: 'event-123',
  type: 'user.action',
  version: '3.0.0',
  payload: {
    user: {
      id: 'user-456',
      profile: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    action: 'login',
    timestamp: '2023-01-01T12:00:00Z',
    metadata: {
      device: 'mobile',
      os: 'iOS',
      appVersion: '1.2.3',
    },
  },
  metadata: {
    source: 'test',
  },
};

// Mock transformation functions
const v1ToV2Transformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
  const newEvent = JSON.parse(JSON.stringify(event));
  newEvent.version = '2.0.0';
  
  // Add metadata field to payload
  if (!newEvent.payload.metadata) {
    newEvent.payload.metadata = {
      device: 'unknown',
      os: 'unknown',
    };
  }
  
  return newEvent;
};

const v2ToV3Transformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
  const newEvent = JSON.parse(JSON.stringify(event));
  newEvent.version = '3.0.0';
  
  // Restructure payload to use user object
  const userId = newEvent.payload.userId;
  delete newEvent.payload.userId;
  
  newEvent.payload.user = {
    id: userId,
    profile: {},
  };
  
  // Add app version to metadata
  if (newEvent.payload.metadata) {
    newEvent.payload.metadata.appVersion = '1.0.0';
  }
  
  return newEvent;
};

const v3ToV2Transformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
  const newEvent = JSON.parse(JSON.stringify(event));
  newEvent.version = '2.0.0';
  
  // Flatten user object back to userId
  if (newEvent.payload.user && newEvent.payload.user.id) {
    newEvent.payload.userId = newEvent.payload.user.id;
    delete newEvent.payload.user;
  }
  
  // Remove app version from metadata
  if (newEvent.payload.metadata && newEvent.payload.metadata.appVersion) {
    delete newEvent.payload.metadata.appVersion;
  }
  
  return newEvent;
};

const v2ToV1Transformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
  const newEvent = JSON.parse(JSON.stringify(event));
  newEvent.version = '1.0.0';
  
  // Remove metadata field from payload
  if (newEvent.payload.metadata) {
    delete newEvent.payload.metadata;
  }
  
  return newEvent;
};

describe('Event Transformer', () => {
  beforeEach(() => {
    // Register schemas and transformations for testing
    registerEventSchema('user.action', '1.0.0', eventSchemaV1);
    registerEventSchema('user.action', '2.0.0', eventSchemaV2);
    registerEventSchema('user.action', '3.0.0', eventSchemaV3, true); // Mark as latest
    
    registerTransformation('user.action', '1.0.0', '2.0.0', v1ToV2Transformer);
    registerTransformation('user.action', '2.0.0', '3.0.0', v2ToV3Transformer);
    registerTransformation('user.action', '3.0.0', '2.0.0', v3ToV2Transformer);
    registerTransformation('user.action', '2.0.0', '1.0.0', v2ToV1Transformer);
  });
  
  describe('Bidirectional Transformations', () => {
    it('should upgrade an event from v1 to v2', () => {
      const result = transformEvent(sampleEventV1, '2.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('2.0.0');
      expect(result.transformed?.payload.metadata).toBeDefined();
      expect(result.transformed?.payload.userId).toBe(sampleEventV1.payload.userId);
    });
    
    it('should downgrade an event from v2 to v1', () => {
      const result = downgradeEvent(sampleEventV2, '1.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('1.0.0');
      expect(result.transformed?.payload.metadata).toBeUndefined();
      expect(result.transformed?.payload.userId).toBe(sampleEventV2.payload.userId);
    });
    
    it('should upgrade an event to the latest version', () => {
      const result = upgradeToLatest(sampleEventV1);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('3.0.0');
      expect(result.transformed?.payload.user).toBeDefined();
      expect(result.transformed?.payload.user.id).toBe(sampleEventV1.payload.userId);
    });
    
    it('should return the original event if already at target version', () => {
      const result = transformEvent(sampleEventV2, '2.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed).toEqual(sampleEventV2);
    });
    
    it('should preserve metadata during transformation when configured', () => {
      const result = transformEvent(sampleEventV1, '2.0.0', { preserveMetadata: true });
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.metadata).toEqual(sampleEventV1.metadata);
    });
  });
  
  describe('Transformation Pipelines', () => {
    it('should transform an event through multiple versions (v1 -> v3)', () => {
      const result = transformEvent(sampleEventV1, '3.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('3.0.0');
      expect(result.transformed?.payload.user).toBeDefined();
      expect(result.transformed?.payload.user.id).toBe(sampleEventV1.payload.userId);
      expect(result.transformed?.payload.metadata).toBeDefined();
    });
    
    it('should transform an event through multiple versions (v3 -> v1)', () => {
      const result = transformEvent(sampleEventV3, '1.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('1.0.0');
      expect(result.transformed?.payload.userId).toBe(sampleEventV3.payload.user.id);
      expect(result.transformed?.payload.metadata).toBeUndefined();
    });
    
    it('should create and apply a transformation pipeline', () => {
      // Create a pipeline that combines multiple transformations
      const addTimezoneInfo: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
        const newEvent = JSON.parse(JSON.stringify(event));
        if (newEvent.payload.metadata) {
          newEvent.payload.metadata.timezone = 'UTC';
        }
        return newEvent;
      };
      
      const addTrackingInfo: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
        const newEvent = JSON.parse(JSON.stringify(event));
        if (newEvent.payload.metadata) {
          newEvent.payload.metadata.trackingId = 'track-789';
        }
        return newEvent;
      };
      
      const pipeline = createTransformationPipeline([
        v1ToV2Transformer,
        addTimezoneInfo,
        addTrackingInfo,
      ]);
      
      // Apply the pipeline
      const transformed = pipeline(sampleEventV1);
      
      expect(transformed.version).toBe('2.0.0');
      expect(transformed.payload.metadata).toBeDefined();
      expect(transformed.payload.metadata.timezone).toBe('UTC');
      expect(transformed.payload.metadata.trackingId).toBe('track-789');
    });
    
    it('should handle validation warnings during pipeline transformation', () => {
      // Create a transformer that produces invalid data
      const invalidTransformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
        const newEvent = JSON.parse(JSON.stringify(event));
        newEvent.version = '2.0.0';
        // Missing required metadata field
        return newEvent;
      };
      
      // Register the invalid transformer
      registerTransformation('user.action', '1.0.0', '2.0.0', invalidTransformer);
      
      // Transform with validation enabled but don't throw on error
      const result = transformEvent(sampleEventV1, '2.0.0', { validate: true, throwOnError: false });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error instanceof MigrationError).toBe(true);
    });
  });
  
  describe('Field-Level Transformations', () => {
    it('should map fields using field mapper', () => {
      // Create a field mapper for v2 to v3 transformation
      const fieldMapper = createFieldMapper({
        'payload.userId': 'payload.user.id',
        'payload.action': 'payload.action',
        'payload.timestamp': 'payload.timestamp',
        'payload.metadata': 'payload.metadata',
      });
      
      // Apply the field mapper
      const transformed = fieldMapper(sampleEventV2);
      
      expect(transformed.payload.user).toBeDefined();
      expect(transformed.payload.user.id).toBe(sampleEventV2.payload.userId);
      expect(transformed.payload.userId).toBeUndefined();
      expect(transformed.payload.action).toBe(sampleEventV2.payload.action);
    });
    
    it('should transform field values using field transformer', () => {
      // Create a field transformer
      const fieldTransformer = createFieldTransformer({
        'payload.timestamp': (value) => new Date(value).toISOString(),
        'payload.action': (value) => value.toUpperCase(),
      });
      
      // Apply the field transformer
      const transformed = fieldTransformer(sampleEventV1);
      
      expect(transformed.payload.action).toBe('LOGIN');
      expect(transformed.payload.timestamp).toBe(sampleEventV1.payload.timestamp);
    });
    
    it('should throw an error when a required field is missing', () => {
      // Create an event with missing required field
      const invalidEvent = JSON.parse(JSON.stringify(sampleEventV1));
      delete invalidEvent.payload.userId;
      
      // Create a field mapper that requires the missing field
      const fieldMapper = createFieldMapper({
        'payload.userId': 'payload.user.id',
      });
      
      // Expect the transformation to throw an error
      expect(() => fieldMapper(invalidEvent)).toThrow(TransformationError);
    });
    
    it('should handle nested field transformations', () => {
      // Create a field transformer for nested fields
      const nestedTransformer = createFieldTransformer({
        'payload.metadata.device': (value) => value.toUpperCase(),
      });
      
      // Apply the nested transformer
      const transformed = nestedTransformer(sampleEventV2);
      
      expect(transformed.payload.metadata.device).toBe('MOBILE');
    });
  });
  
  describe('Automated Transformations', () => {
    it('should automatically transform an event when no direct transformation is registered', () => {
      // Create a new event type without registered transformations
      const newEventType = 'system.notification';
      const notificationEventV1: IVersionedEvent = {
        eventId: 'notification-123',
        type: newEventType,
        version: '1.0.0',
        payload: {
          message: 'Test notification',
          level: 'info',
        },
      };
      
      // Register schemas but not transformations
      const schemaV1 = {
        type: 'object',
        properties: {
          message: { type: 'string' },
          level: { type: 'string' },
        },
        required: ['message', 'level'],
      };
      
      const schemaV2 = {
        type: 'object',
        properties: {
          message: { type: 'string' },
          level: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['message', 'level', 'timestamp'],
      };
      
      registerEventSchema(newEventType, '1.0.0', schemaV1);
      registerEventSchema(newEventType, '2.0.0', schemaV2, true);
      
      // Attempt to transform without a registered transformer
      // This should use automatic transformation based on schemas
      const result = transformEvent(notificationEventV1, '2.0.0', { throwOnError: false });
      
      // The automatic transformation should preserve existing fields and update the version
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('2.0.0');
      expect(result.transformed?.payload.message).toBe(notificationEventV1.payload.message);
      expect(result.transformed?.payload.level).toBe(notificationEventV1.payload.level);
    });
    
    it('should handle transformation errors gracefully when configured', () => {
      // Create a transformer that throws an error
      const errorTransformer: MigrationFunction = () => {
        throw new Error('Simulated transformation error');
      };
      
      // Register the error-throwing transformer
      registerTransformation('user.action', '1.0.0', '2.0.0', errorTransformer);
      
      // Transform with error handling enabled
      const result = transformEvent(sampleEventV1, '2.0.0', { throwOnError: false });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.transformed).toBeUndefined();
    });
    
    it('should throw an error when no transformation path is found and throwOnError is true', () => {
      // Create a new event type without registered transformations or schemas
      const unknownEventType = 'unknown.event';
      const unknownEvent: IVersionedEvent = {
        eventId: 'unknown-123',
        type: unknownEventType,
        version: '1.0.0',
        payload: {},
      };
      
      // Attempt to transform with throwOnError enabled
      expect(() => transformEvent(unknownEvent, '2.0.0')).toThrow(MigrationError);
    });
  });
  
  describe('Cross-Service Compatibility', () => {
    it('should handle events from different services with different versions', () => {
      // Create an event from a different service
      const healthEvent: IVersionedEvent = {
        eventId: 'health-123',
        type: 'health.metric.recorded',
        version: '1.0.0',
        payload: {
          userId: 'user-456',
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: '2023-01-01T12:00:00Z',
        },
      };
      
      // Register schema and transformation for health events
      const healthSchemaV1 = {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['userId', 'metricType', 'value', 'timestamp'],
      };
      
      const healthSchemaV2 = {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          timestamp: { type: 'string' },
          deviceId: { type: 'string' },
        },
        required: ['userId', 'metricType', 'value', 'timestamp'],
      };
      
      registerEventSchema('health.metric.recorded', '1.0.0', healthSchemaV1);
      registerEventSchema('health.metric.recorded', '2.0.0', healthSchemaV2, true);
      
      // Create a transformer for health events
      const healthTransformer: MigrationFunction = (event: IVersionedEvent): IVersionedEvent => {
        const newEvent = JSON.parse(JSON.stringify(event));
        newEvent.version = '2.0.0';
        newEvent.payload.deviceId = 'unknown';
        return newEvent;
      };
      
      registerTransformation('health.metric.recorded', '1.0.0', '2.0.0', healthTransformer);
      
      // Transform the health event
      const result = transformEvent(healthEvent, '2.0.0');
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('2.0.0');
      expect(result.transformed?.payload.deviceId).toBe('unknown');
    });
    
    it('should support mixed version environments during rolling deployments', () => {
      // Scenario: Service A is at v2, Service B is at v3
      // Service A sends a v2 event to Service B, which expects v3
      
      // Service B should be able to upgrade the event
      const serviceAEvent = sampleEventV2; // v2 event
      const result = transformEvent(serviceAEvent, '3.0.0'); // Service B expects v3
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBeDefined();
      expect(result.transformed?.version).toBe('3.0.0');
      expect(result.transformed?.payload.user).toBeDefined();
      
      // Service B sends a v3 event back to Service A, which expects v2
      const serviceBEvent = result.transformed as IVersionedEvent; // v3 event
      const downgradeResult = transformEvent(serviceBEvent, '2.0.0'); // Service A expects v2
      
      expect(downgradeResult.success).toBe(true);
      expect(downgradeResult.transformed).toBeDefined();
      expect(downgradeResult.transformed?.version).toBe('2.0.0');
      expect(downgradeResult.transformed?.payload.userId).toBeDefined();
    });
  });
});