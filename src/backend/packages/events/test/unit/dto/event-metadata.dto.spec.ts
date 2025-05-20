/**
 * @file event-metadata.dto.spec.ts
 * @description Unit tests for the EventMetadataDto class that validate the metadata structure
 * used across all journey events. Tests verify origin validation, version format, correlation ID
 * structure, and additional context property validation. These tests ensure consistent metadata
 * handling across services and provide the foundation for event correlation and debugging.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import {
  EventMetadataDto,
  EventOriginDto,
  EventVersionDto,
  createEventMetadata,
  createCorrelatedEventMetadata,
  extractCorrelationContext
} from '../../../src/dto/event-metadata.dto';

import { createTestEventMetadata } from './test-utils';

describe('EventVersionDto', () => {
  describe('validation', () => {
    it('should validate a valid version', async () => {
      const version = new EventVersionDto();
      version.major = '1';
      version.minor = '0';
      version.patch = '0';

      const errors = await validate(version);
      expect(errors.length).toBe(0);
    });

    it('should reject non-numeric major version', async () => {
      const version = new EventVersionDto();
      version.major = 'a';
      version.minor = '0';
      version.patch = '0';

      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should reject non-numeric minor version', async () => {
      const version = new EventVersionDto();
      version.major = '1';
      version.minor = 'a';
      version.patch = '0';

      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should reject non-numeric patch version', async () => {
      const version = new EventVersionDto();
      version.major = '1';
      version.minor = '0';
      version.patch = 'a';

      const errors = await validate(version);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should use default values if not provided', () => {
      const version = new EventVersionDto();
      expect(version.major).toBe('1');
      expect(version.minor).toBe('0');
      expect(version.patch).toBe('0');
    });
  });

  describe('toString', () => {
    it('should return the version as a string in semver format', () => {
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '3';
      version.patch = '4';

      expect(version.toString()).toBe('2.3.4');
    });
  });

  describe('fromString', () => {
    it('should create a version from a valid version string', () => {
      const version = EventVersionDto.fromString('2.3.4');

      expect(version).toBeInstanceOf(EventVersionDto);
      expect(version.major).toBe('2');
      expect(version.minor).toBe('3');
      expect(version.patch).toBe('4');
    });

    it('should handle partial version strings', () => {
      const version1 = EventVersionDto.fromString('2');
      expect(version1.major).toBe('2');
      expect(version1.minor).toBe('0');
      expect(version1.patch).toBe('0');

      const version2 = EventVersionDto.fromString('2.3');
      expect(version2.major).toBe('2');
      expect(version2.minor).toBe('3');
      expect(version2.patch).toBe('0');
    });

    it('should handle invalid version strings by using defaults', () => {
      const version = EventVersionDto.fromString('invalid');
      expect(version.major).toBe('1');
      expect(version.minor).toBe('0');
      expect(version.patch).toBe('0');
    });
  });
});

describe('EventOriginDto', () => {
  describe('validation', () => {
    it('should validate a valid origin with required fields', async () => {
      const origin = new EventOriginDto();
      origin.service = 'test-service';

      const errors = await validate(origin);
      expect(errors.length).toBe(0);
    });

    it('should reject an origin without a service name', async () => {
      const origin = new EventOriginDto();
      // service is not set

      const errors = await validate(origin);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate an origin with all optional fields', async () => {
      const origin = new EventOriginDto();
      origin.service = 'test-service';
      origin.instance = 'test-instance-1';
      origin.component = 'test-component';
      origin.context = 'user-initiated';

      const errors = await validate(origin);
      expect(errors.length).toBe(0);
    });

    it('should reject an origin with non-string fields', async () => {
      const origin = plainToInstance(EventOriginDto, {
        service: 'test-service',
        instance: 123, // Should be a string
        component: 'test-component'
      });

      const errors = await validate(origin);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});

describe('EventMetadataDto', () => {
  describe('validation', () => {
    it('should validate a minimal metadata object', async () => {
      const metadata = new EventMetadataDto();
      
      const errors = await validate(metadata);
      expect(errors.length).toBe(0);
    });

    it('should validate a complete metadata object', async () => {
      const metadata = new EventMetadataDto();
      metadata.eventId = uuidv4();
      metadata.correlationId = uuidv4();
      metadata.parentEventId = uuidv4();
      metadata.sessionId = 'session-123';
      metadata.requestId = 'request-456';
      metadata.timestamp = new Date();
      metadata.version = new EventVersionDto();
      metadata.origin = new EventOriginDto();
      metadata.origin.service = 'test-service';
      metadata.context = { additionalInfo: 'test' };

      const errors = await validate(metadata);
      expect(errors.length).toBe(0);
    });

    it('should reject an invalid UUID for eventId', async () => {
      const metadata = new EventMetadataDto();
      metadata.eventId = 'not-a-uuid';

      const errors = await validate(metadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should validate nested objects', async () => {
      const metadata = new EventMetadataDto();
      metadata.version = new EventVersionDto();
      metadata.version.major = 'not-a-number'; // Invalid
      
      metadata.origin = new EventOriginDto();
      // Missing required service field

      const errors = await validate(metadata, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the version validation error
      const versionErrors = errors.find(e => e.property === 'version');
      expect(versionErrors).toBeDefined();
      expect(versionErrors.children.length).toBeGreaterThan(0);
      
      // Find the origin validation error
      const originErrors = errors.find(e => e.property === 'origin');
      expect(originErrors).toBeDefined();
      expect(originErrors.children.length).toBeGreaterThan(0);
    });
  });

  describe('constructor', () => {
    it('should create a metadata object with default values', () => {
      const metadata = new EventMetadataDto();
      
      expect(metadata.timestamp).toBeInstanceOf(Date);
      expect(metadata.version).toBeInstanceOf(EventVersionDto);
      expect(metadata.version.major).toBe('1');
      expect(metadata.version.minor).toBe('0');
      expect(metadata.version.patch).toBe('0');
    });

    it('should create a metadata object with provided values', () => {
      const now = new Date();
      const version = new EventVersionDto();
      version.major = '2';
      version.minor = '0';
      version.patch = '0';
      
      const metadata = new EventMetadataDto({
        eventId: 'e52889e4-2d69-4e9c-9c3e-5d7b8d173a0e',
        correlationId: 'c52889e4-2d69-4e9c-9c3e-5d7b8d173a0e',
        timestamp: now,
        version: version
      });
      
      expect(metadata.eventId).toBe('e52889e4-2d69-4e9c-9c3e-5d7b8d173a0e');
      expect(metadata.correlationId).toBe('c52889e4-2d69-4e9c-9c3e-5d7b8d173a0e');
      expect(metadata.timestamp).toBe(now);
      expect(metadata.version).toBe(version);
      expect(metadata.version.major).toBe('2');
    });

    it('should set default timestamp if not provided', () => {
      const beforeCreation = new Date();
      const metadata = new EventMetadataDto({});
      const afterCreation = new Date();
      
      expect(metadata.timestamp).toBeInstanceOf(Date);
      expect(metadata.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(metadata.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should set default version if not provided', () => {
      const metadata = new EventMetadataDto({});
      
      expect(metadata.version).toBeInstanceOf(EventVersionDto);
      expect(metadata.version.major).toBe('1');
      expect(metadata.version.minor).toBe('0');
      expect(metadata.version.patch).toBe('0');
    });
  });

  describe('with', () => {
    it('should create a copy with specified changes', () => {
      const original = new EventMetadataDto();
      original.eventId = uuidv4();
      original.correlationId = 'original-correlation-id';
      original.sessionId = 'original-session-id';
      
      const modified = original.with({
        correlationId: 'new-correlation-id',
        requestId: 'new-request-id'
      });
      
      // Original should be unchanged
      expect(original.correlationId).toBe('original-correlation-id');
      expect(original.requestId).toBeUndefined();
      
      // Modified should have new values
      expect(modified.eventId).toBe(original.eventId); // Unchanged
      expect(modified.correlationId).toBe('new-correlation-id'); // Changed
      expect(modified.sessionId).toBe('original-session-id'); // Unchanged
      expect(modified.requestId).toBe('new-request-id'); // Added
    });
  });

  describe('createChildMetadata', () => {
    it('should create child metadata with inherited correlation context', () => {
      const parent = new EventMetadataDto();
      parent.eventId = 'parent-event-id';
      parent.correlationId = 'correlation-id';
      parent.sessionId = 'session-id';
      parent.requestId = 'request-id';
      parent.origin = new EventOriginDto();
      parent.origin.service = 'test-service';
      
      const child = parent.createChildMetadata();
      
      expect(child.correlationId).toBe('correlation-id');
      expect(child.parentEventId).toBe('parent-event-id');
      expect(child.sessionId).toBe('session-id');
      expect(child.requestId).toBe('request-id');
      expect(child.origin).toBe(parent.origin);
      expect(child.eventId).not.toBe(parent.eventId);
    });

    it('should use provided parentEventId if specified', () => {
      const parent = new EventMetadataDto();
      parent.eventId = 'parent-event-id';
      parent.correlationId = 'correlation-id';
      
      const child = parent.createChildMetadata('custom-parent-id');
      
      expect(child.parentEventId).toBe('custom-parent-id');
    });
  });
});

describe('Helper Functions', () => {
  describe('createEventMetadata', () => {
    it('should create metadata with the specified service origin', () => {
      const metadata = createEventMetadata('test-service');
      
      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.origin).toBeDefined();
      expect(metadata.origin.service).toBe('test-service');
    });

    it('should merge additional origin properties', () => {
      const metadata = createEventMetadata('test-service', {
        origin: {
          component: 'test-component',
          instance: 'test-instance'
        }
      });
      
      expect(metadata.origin.service).toBe('test-service');
      expect(metadata.origin.component).toBe('test-component');
      expect(metadata.origin.instance).toBe('test-instance');
    });

    it('should include additional metadata options', () => {
      const correlationId = uuidv4();
      const metadata = createEventMetadata('test-service', {
        correlationId,
        sessionId: 'test-session',
        context: { additionalInfo: 'test' }
      });
      
      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.sessionId).toBe('test-session');
      expect(metadata.context).toEqual({ additionalInfo: 'test' });
    });
  });

  describe('createCorrelatedEventMetadata', () => {
    it('should create metadata with correlation ID and service', () => {
      const correlationId = uuidv4();
      const metadata = createCorrelatedEventMetadata(correlationId, 'test-service');
      
      expect(metadata).toBeInstanceOf(EventMetadataDto);
      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.origin).toBeDefined();
      expect(metadata.origin.service).toBe('test-service');
    });

    it('should include additional metadata options', () => {
      const correlationId = uuidv4();
      const metadata = createCorrelatedEventMetadata(correlationId, 'test-service', {
        sessionId: 'test-session',
        requestId: 'test-request',
        context: { additionalInfo: 'test' }
      });
      
      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.origin.service).toBe('test-service');
      expect(metadata.sessionId).toBe('test-session');
      expect(metadata.requestId).toBe('test-request');
      expect(metadata.context).toEqual({ additionalInfo: 'test' });
    });
  });

  describe('extractCorrelationContext', () => {
    it('should extract correlation context from metadata', () => {
      const metadata = new EventMetadataDto();
      metadata.correlationId = 'correlation-id';
      metadata.sessionId = 'session-id';
      metadata.requestId = 'request-id';
      
      const context = extractCorrelationContext(metadata);
      
      expect(context).toEqual({
        correlationId: 'correlation-id',
        sessionId: 'session-id',
        requestId: 'request-id'
      });
    });

    it('should handle missing correlation properties', () => {
      const metadata = new EventMetadataDto();
      metadata.correlationId = 'correlation-id';
      // sessionId and requestId are not set
      
      const context = extractCorrelationContext(metadata);
      
      expect(context).toEqual({
        correlationId: 'correlation-id',
        sessionId: undefined,
        requestId: undefined
      });
    });
  });
});

describe('Integration with Distributed Tracing', () => {
  it('should support correlation ID propagation across services', () => {
    // Simulate a request coming into the first service
    const requestId = 'req-' + uuidv4().substring(0, 8);
    const correlationId = uuidv4();
    
    // First service creates event metadata
    const serviceAMetadata = createCorrelatedEventMetadata(correlationId, 'service-a', {
      requestId
    });
    
    // Event is processed and a new event is created in service B
    const context = extractCorrelationContext(serviceAMetadata);
    const serviceBMetadata = createEventMetadata('service-b', {
      ...context,
      parentEventId: serviceAMetadata.eventId
    });
    
    // Event is processed and a new event is created in service C
    const serviceCMetadata = serviceBMetadata.createChildMetadata();
    
    // Verify correlation context is maintained
    expect(serviceBMetadata.correlationId).toBe(correlationId);
    expect(serviceBMetadata.requestId).toBe(requestId);
    expect(serviceBMetadata.parentEventId).toBe(serviceAMetadata.eventId);
    
    expect(serviceCMetadata.correlationId).toBe(correlationId);
    expect(serviceCMetadata.requestId).toBe(requestId);
    expect(serviceCMetadata.parentEventId).toBe(serviceBMetadata.eventId);
  });

  it('should support event chains with parent-child relationships', () => {
    // Create a root event
    const rootMetadata = createEventMetadata('root-service');
    rootMetadata.eventId = 'root-event-id';
    rootMetadata.correlationId = 'correlation-id';
    
    // Create a chain of child events
    const child1Metadata = rootMetadata.createChildMetadata();
    child1Metadata.eventId = 'child1-event-id';
    
    const child2Metadata = child1Metadata.createChildMetadata();
    child2Metadata.eventId = 'child2-event-id';
    
    const child3Metadata = child2Metadata.createChildMetadata();
    child3Metadata.eventId = 'child3-event-id';
    
    // Verify parent-child relationships
    expect(child1Metadata.parentEventId).toBe('root-event-id');
    expect(child2Metadata.parentEventId).toBe('child1-event-id');
    expect(child3Metadata.parentEventId).toBe('child2-event-id');
    
    // Verify correlation ID is maintained
    expect(child1Metadata.correlationId).toBe('correlation-id');
    expect(child2Metadata.correlationId).toBe('correlation-id');
    expect(child3Metadata.correlationId).toBe('correlation-id');
  });

  it('should support complex event processing scenarios', () => {
    // Simulate a user request that triggers multiple events across services
    const requestId = 'req-' + uuidv4().substring(0, 8);
    const sessionId = 'session-' + uuidv4().substring(0, 8);
    const correlationId = uuidv4();
    
    // API Gateway receives request and creates initial metadata
    const gatewayMetadata = createCorrelatedEventMetadata(correlationId, 'api-gateway', {
      requestId,
      sessionId
    });
    gatewayMetadata.eventId = 'gateway-event-id';
    
    // Health service processes request and generates events
    const healthMetadata = gatewayMetadata.createChildMetadata();
    healthMetadata.eventId = 'health-event-id';
    healthMetadata.origin = new EventOriginDto();
    healthMetadata.origin.service = 'health-service';
    healthMetadata.origin.component = 'metric-processor';
    
    // Gamification service processes health event
    const gamificationMetadata = healthMetadata.createChildMetadata();
    gamificationMetadata.eventId = 'gamification-event-id';
    gamificationMetadata.origin = new EventOriginDto();
    gamificationMetadata.origin.service = 'gamification-service';
    
    // Notification service sends achievement notification
    const notificationMetadata = gamificationMetadata.createChildMetadata();
    notificationMetadata.eventId = 'notification-event-id';
    notificationMetadata.origin = new EventOriginDto();
    notificationMetadata.origin.service = 'notification-service';
    
    // Verify the event chain
    expect(healthMetadata.parentEventId).toBe('gateway-event-id');
    expect(gamificationMetadata.parentEventId).toBe('health-event-id');
    expect(notificationMetadata.parentEventId).toBe('gamification-event-id');
    
    // All events should have the same correlation context
    [gatewayMetadata, healthMetadata, gamificationMetadata, notificationMetadata].forEach(metadata => {
      expect(metadata.correlationId).toBe(correlationId);
      expect(metadata.requestId).toBe(requestId);
      expect(metadata.sessionId).toBe(sessionId);
    });
  });
});