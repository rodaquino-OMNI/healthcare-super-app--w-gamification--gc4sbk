import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  PayloadTransformer,
  PayloadTransformerRegistry,
  BasePayloadTransformer,
  FieldMapper,
  HealthEventTransformer,
  CareEventTransformer,
  PlanEventTransformer,
  transformToLatest,
  transformToVersion
} from '../../../src/utils/payload-transformer';
import { EventType } from '../../../src/dto/event-types.enum';
import { TransformDirection, TransformOptions } from '../../../src/versioning/types';
import { VersionDetectionError, VersionMigrationError } from '../../../src/versioning/errors';
import { VersionDetector } from '../../../src/versioning/version-detector';

// Mock the Logger to avoid console output during tests
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the VersionDetector
jest.mock('../../../src/versioning/version-detector', () => ({
  VersionDetector: {
    detectVersion: jest.fn(),
  },
}));

describe('Payload Transformation Utilities', () => {
  // Clear the transformer registry before each test
  beforeEach(() => {
    PayloadTransformerRegistry.clear();
    jest.clearAllMocks();
  });

  describe('BasePayloadTransformer', () => {
    class TestTransformer extends BasePayloadTransformer {
      transform(payload: any): any {
        return { ...payload, version: this.targetVersion };
      }
    }

    it('should correctly identify if it can transform a payload', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      
      // Should return true for matching event type and version
      expect(transformer.canTransform({
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      })).toBe(true);
      
      // Should return false for non-matching event type
      expect(transformer.canTransform({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        version: '1.0.0',
        data: {}
      })).toBe(false);
      
      // Should return false for non-matching version
      expect(transformer.canTransform({
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.1.0',
        data: { value: 120 }
      })).toBe(false);
    });

    it('should return source and target versions', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      expect(transformer.getSourceVersion()).toBe('1.0.0');
      expect(transformer.getTargetVersion()).toBe('1.1.0');
    });

    it('should detect version from payload or options', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      const payload = { type: EventType.HEALTH_METRIC_RECORDED, data: {} };
      
      // Test with version in options
      expect((transformer as any).getPayloadVersion(payload, { sourceVersion: '1.0.0' })).toBe('1.0.0');
      
      // Test with version in payload
      expect((transformer as any).getPayloadVersion({ ...payload, version: '1.1.0' })).toBe('1.1.0');
      
      // Test with version detection
      (VersionDetector.detectVersion as jest.Mock).mockReturnValueOnce('1.2.0');
      expect((transformer as any).getPayloadVersion(payload)).toBe('1.2.0');
      
      // Test with failed version detection
      (VersionDetector.detectVersion as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Version detection failed');
      });
      expect((transformer as any).getPayloadVersion(payload)).toBeUndefined();
    });
  });

  describe('PayloadTransformerRegistry', () => {
    class TestTransformer extends BasePayloadTransformer {
      transform(payload: any): any {
        return { ...payload, version: this.targetVersion };
      }
    }

    it('should register and find transformers', () => {
      const transformer1 = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      const transformer2 = new TestTransformer(EventType.CARE_APPOINTMENT_BOOKED, '1.0.0', '1.1.0');
      
      PayloadTransformerRegistry.register(transformer1);
      PayloadTransformerRegistry.register(transformer2);
      
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      const foundTransformer = PayloadTransformerRegistry.findTransformer(payload);
      expect(foundTransformer).toBe(transformer1);
      
      // Should not find transformer for different event type
      const differentPayload = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        version: '1.0.0',
        data: {}
      };
      
      const notFoundTransformer = PayloadTransformerRegistry.findTransformer(differentPayload);
      expect(notFoundTransformer).toBeUndefined();
    });

    it('should clear all registered transformers', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      PayloadTransformerRegistry.register(transformer);
      
      PayloadTransformerRegistry.clear();
      
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      const foundTransformer = PayloadTransformerRegistry.findTransformer(payload);
      expect(foundTransformer).toBeUndefined();
    });
  });

  describe('PayloadTransformer', () => {
    class TestTransformer extends BasePayloadTransformer {
      transform(payload: any): any {
        return { 
          ...payload, 
          version: this.targetVersion,
          data: { ...payload.data, transformed: true }
        };
      }
    }

    it('should transform a payload to the target version', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      PayloadTransformerRegistry.register(transformer);
      
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      const transformed = PayloadTransformer.transform(payload, '1.1.0');
      
      expect(transformed).toEqual({
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.1.0',
        data: { value: 120, transformed: true }
      });
    });

    it('should return the payload as is if source and target versions are the same', () => {
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      const transformed = PayloadTransformer.transform(payload, '1.0.0');
      expect(transformed).toBe(payload);
    });

    it('should throw VersionDetectionError if source version cannot be detected', () => {
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        data: { value: 120 }
      };
      
      (VersionDetector.detectVersion as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Version detection failed');
      });
      
      expect(() => PayloadTransformer.transform(payload, '1.1.0')).toThrow(VersionDetectionError);
    });

    it('should throw VersionMigrationError if no transformation path exists', () => {
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      // No transformers registered
      expect(() => PayloadTransformer.transform(payload, '1.1.0')).toThrow(VersionMigrationError);
    });

    it('should check if a payload can be transformed to a target version', () => {
      const transformer = new TestTransformer(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
      PayloadTransformerRegistry.register(transformer);
      
      const payload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        version: '1.0.0',
        data: { value: 120 }
      };
      
      expect(PayloadTransformer.canTransform(payload, '1.1.0')).toBe(true);
      expect(PayloadTransformer.canTransform(payload, '1.2.0')).toBe(false);
      
      // Same version should always be transformable
      expect(PayloadTransformer.canTransform(payload, '1.0.0')).toBe(true);
      
      // Should return false if version detection fails
      const payloadWithoutVersion = {
        type: EventType.HEALTH_METRIC_RECORDED,
        data: { value: 120 }
      };
      
      (VersionDetector.detectVersion as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Version detection failed');
      });
      
      expect(PayloadTransformer.canTransform(payloadWithoutVersion, '1.1.0')).toBe(false);
    });
  });

  describe('FieldMapper', () => {
    it('should map a field from source to target', () => {
      const source = { name: 'John', age: 30 };
      const target = {};
      
      FieldMapper.mapField(source, target, 'name');
      expect(target).toEqual({ name: 'John' });
    });

    it('should map a field with a different target field name', () => {
      const source = { name: 'John', age: 30 };
      const target = {};
      
      FieldMapper.mapField(source, target, 'name', 'fullName');
      expect(target).toEqual({ fullName: 'John' });
    });

    it('should apply a transformation function to the mapped value', () => {
      const source = { name: 'john', age: 30 };
      const target = {};
      
      FieldMapper.mapField(source, target, 'name', 'name', (value) => value.toUpperCase());
      expect(target).toEqual({ name: 'JOHN' });
    });

    it('should not map undefined fields', () => {
      const source = { name: 'John' };
      const target = {};
      
      FieldMapper.mapField(source, target, 'age' as keyof typeof source);
      expect(target).toEqual({});
    });

    it('should map multiple fields at once', () => {
      const source = { name: 'John', age: 30, email: 'john@example.com' };
      const target = {};
      
      FieldMapper.mapFields(source, target, {
        name: 'fullName',
        age: 'years',
        email: 'contactEmail'
      });
      
      expect(target).toEqual({
        fullName: 'John',
        years: 30,
        contactEmail: 'john@example.com'
      });
    });

    it('should apply transformations when mapping multiple fields', () => {
      const source = { name: 'john', age: 30, email: 'john@example.com' };
      const target = {};
      
      FieldMapper.mapFields(source, target, {
        name: 'fullName',
        age: 'years',
        email: 'contactEmail'
      }, {
        name: (value) => value.toUpperCase(),
        age: (value) => value + 1
      });
      
      expect(target).toEqual({
        fullName: 'JOHN',
        years: 31,
        contactEmail: 'john@example.com'
      });
    });

    it('should get a nested value from an object', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            contact: {
              email: 'john@example.com'
            }
          }
        }
      };
      
      expect(FieldMapper.getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(FieldMapper.getNestedValue(obj, 'user.profile.contact.email')).toBe('john@example.com');
      expect(FieldMapper.getNestedValue(obj, 'user.profile.age')).toBeUndefined();
      expect(FieldMapper.getNestedValue(obj, 'user.profile.age', 30)).toBe(30);
      expect(FieldMapper.getNestedValue(obj, 'user.settings.theme')).toBeUndefined();
    });

    it('should set a nested value in an object', () => {
      const obj = {
        user: {
          profile: {}
        }
      };
      
      FieldMapper.setNestedValue(obj, 'user.profile.name', 'John');
      expect(obj.user.profile).toEqual({ name: 'John' });
      
      FieldMapper.setNestedValue(obj, 'user.profile.contact.email', 'john@example.com');
      expect(obj.user.profile).toEqual({
        name: 'John',
        contact: {
          email: 'john@example.com'
        }
      });
      
      FieldMapper.setNestedValue(obj, 'user.settings.theme', 'dark');
      expect(obj.user).toEqual({
        profile: {
          name: 'John',
          contact: {
            email: 'john@example.com'
          }
        },
        settings: {
          theme: 'dark'
        }
      });
    });
  });

  describe('Journey-Specific Transformers', () => {
    describe('HealthEventTransformer', () => {
      class TestHealthTransformer extends HealthEventTransformer {
        transform(payload: any): any {
          const result = this.transformCommonFields(payload);
          result.data = { ...payload.data, journey: 'health' };
          return result;
        }
      }

      it('should transform health events with common fields', () => {
        const transformer = new TestHealthTransformer(
          EventType.HEALTH_METRIC_RECORDED,
          '1.0.0',
          '1.1.0'
        );
        
        const payload = {
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { metricType: 'HEART_RATE', value: 75 },
          metadata: { source: 'smartwatch' }
        };
        
        const transformed = transformer.transform(payload);
        
        expect(transformed).toEqual({
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { metricType: 'HEART_RATE', value: 75, journey: 'health' },
          metadata: { source: 'smartwatch' }
        });
      });

      it('should handle health events without metadata', () => {
        const transformer = new TestHealthTransformer(
          EventType.HEALTH_METRIC_RECORDED,
          '1.0.0',
          '1.1.0'
        );
        
        const payload = {
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { metricType: 'HEART_RATE', value: 75 }
        };
        
        const transformed = transformer.transform(payload);
        
        expect(transformed).toEqual({
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { metricType: 'HEART_RATE', value: 75, journey: 'health' }
        });
      });
    });

    describe('CareEventTransformer', () => {
      class TestCareTransformer extends CareEventTransformer {
        transform(payload: any): any {
          const result = this.transformCommonFields(payload);
          result.data = { ...payload.data, journey: 'care' };
          return result;
        }
      }

      it('should transform care events with common fields', () => {
        const transformer = new TestCareTransformer(
          EventType.CARE_APPOINTMENT_BOOKED,
          '1.0.0',
          '1.1.0'
        );
        
        const payload = {
          type: EventType.CARE_APPOINTMENT_BOOKED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { providerId: 'provider123', date: '2023-01-15' },
          metadata: { source: 'mobile-app' }
        };
        
        const transformed = transformer.transform(payload);
        
        expect(transformed).toEqual({
          type: EventType.CARE_APPOINTMENT_BOOKED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { providerId: 'provider123', date: '2023-01-15', journey: 'care' },
          metadata: { source: 'mobile-app' }
        });
      });
    });

    describe('PlanEventTransformer', () => {
      class TestPlanTransformer extends PlanEventTransformer {
        transform(payload: any): any {
          const result = this.transformCommonFields(payload);
          result.data = { ...payload.data, journey: 'plan' };
          return result;
        }
      }

      it('should transform plan events with common fields', () => {
        const transformer = new TestPlanTransformer(
          EventType.PLAN_CLAIM_SUBMITTED,
          '1.0.0',
          '1.1.0'
        );
        
        const payload = {
          type: EventType.PLAN_CLAIM_SUBMITTED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { claimId: 'claim123', amount: 150.0 },
          metadata: { source: 'web-app' }
        };
        
        const transformed = transformer.transform(payload);
        
        expect(transformed).toEqual({
          type: EventType.PLAN_CLAIM_SUBMITTED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { claimId: 'claim123', amount: 150.0, journey: 'plan' },
          metadata: { source: 'web-app' }
        });
      });
    });
  });

  describe('Example Transformers', () => {
    describe('HealthMetricEventV1toV1_1Transformer', () => {
      it('should transform health metric events from v1.0.0 to v1.1.0', () => {
        // Create a new instance of the transformer
        const transformer = new (class extends HealthEventTransformer {
          constructor() {
            super(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
          }

          transform(payload: any): any {
            // Start with common fields
            const result = this.transformCommonFields(payload);

            // Copy the data object
            result.data = { ...payload.data };

            // Transform specific fields for v1.1.0
            // In v1.1.0, we added a 'source' field and renamed 'value' to 'metricValue'
            FieldMapper.mapField(payload.data, result.data, 'value', 'metricValue' as any);
            
            // Add default source if not present
            if (!result.data.source) {
              result.data.source = 'manual';
            }

            return result;
          }
        })();

        PayloadTransformerRegistry.register(transformer);

        const payload = {
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { metricType: 'HEART_RATE', value: 75 }
        };

        const transformed = PayloadTransformer.transform(payload, '1.1.0');

        expect(transformed).toEqual({
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { 
            metricType: 'HEART_RATE', 
            value: 75, // Original field preserved
            metricValue: 75, // New field added
            source: 'manual' // Default source added
          }
        });
      });
    });

    describe('AppointmentEventV1toV1_1Transformer', () => {
      it('should transform appointment events from v1.0.0 to v1.1.0', () => {
        // Create a new instance of the transformer
        const transformer = new (class extends CareEventTransformer {
          constructor() {
            super(EventType.CARE_APPOINTMENT_BOOKED, '1.0.0', '1.1.0');
          }

          transform(payload: any): any {
            // Start with common fields
            const result = this.transformCommonFields(payload);

            // Copy the data object
            result.data = { ...payload.data };

            // Transform specific fields for v1.1.0
            // In v1.1.0, we added a 'status' field and restructured provider information
            if (result.data.provider) {
              // Restructure provider information
              const provider = result.data.provider;
              result.data.provider = {
                id: provider.id || provider.providerId,
                name: provider.name,
                specialization: provider.specialization,
                contactInfo: {
                  email: provider.email,
                  phone: provider.phone,
                },
              };
            }

            // Add status field if not present
            if (!result.data.status) {
              result.data.status = 'scheduled';
            }

            return result;
          }
        })();

        PayloadTransformerRegistry.register(transformer);

        const payload = {
          type: EventType.CARE_APPOINTMENT_BOOKED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { 
            appointmentId: 'appt123',
            provider: {
              providerId: 'provider123',
              name: 'Dr. Smith',
              specialization: 'Cardiology',
              email: 'dr.smith@example.com',
              phone: '+1234567890'
            }
          }
        };

        const transformed = PayloadTransformer.transform(payload, '1.1.0');

        expect(transformed).toEqual({
          type: EventType.CARE_APPOINTMENT_BOOKED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { 
            appointmentId: 'appt123',
            provider: {
              id: 'provider123',
              name: 'Dr. Smith',
              specialization: 'Cardiology',
              contactInfo: {
                email: 'dr.smith@example.com',
                phone: '+1234567890'
              }
            },
            status: 'scheduled' // Default status added
          }
        });
      });
    });

    describe('ClaimEventV1toV1_1Transformer', () => {
      it('should transform claim events from v1.0.0 to v1.1.0', () => {
        // Create a new instance of the transformer
        const transformer = new (class extends PlanEventTransformer {
          constructor() {
            super(EventType.PLAN_CLAIM_SUBMITTED, '1.0.0', '1.1.0');
          }

          transform(payload: any): any {
            // Start with common fields
            const result = this.transformCommonFields(payload);

            // Copy the data object
            result.data = { ...payload.data };

            // Transform specific fields for v1.1.0
            // In v1.1.0, we restructured the amount field to include currency
            if (typeof result.data.amount === 'number') {
              result.data.amount = {
                value: result.data.amount,
                currency: 'BRL', // Default currency for AUSTA
              };
            }

            // Add tracking information if not present
            if (!result.data.tracking) {
              result.data.tracking = {
                submittedAt: payload.timestamp,
                status: 'pending',
              };
            }

            return result;
          }
        })();

        PayloadTransformerRegistry.register(transformer);

        const payload = {
          type: EventType.PLAN_CLAIM_SUBMITTED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.0.0',
          data: { 
            claimId: 'claim123',
            claimType: 'MEDICAL',
            amount: 150.0,
            serviceDate: '2022-12-15'
          }
        };

        const transformed = PayloadTransformer.transform(payload, '1.1.0');

        expect(transformed).toEqual({
          type: EventType.PLAN_CLAIM_SUBMITTED,
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          version: '1.1.0',
          data: { 
            claimId: 'claim123',
            claimType: 'MEDICAL',
            amount: {
              value: 150.0,
              currency: 'BRL'
            },
            serviceDate: '2022-12-15',
            tracking: {
              submittedAt: '2023-01-01T12:00:00Z',
              status: 'pending'
            }
          }
        });
      });
    });
  });

  describe('Helper Functions', () => {
    describe('transformToLatest', () => {
      it('should transform a payload to the latest version', () => {
        // Mock implementation for this test
        const originalTransform = PayloadTransformer.transform;
        PayloadTransformer.transform = jest.fn().mockImplementation((payload, targetVersion) => {
          return { ...payload, version: targetVersion };
        });

        const payload = {
          type: EventType.HEALTH_METRIC_RECORDED,
          version: '1.0.0',
          data: { value: 120 }
        };

        const transformed = transformToLatest(payload);
        expect(transformed).toEqual({
          type: EventType.HEALTH_METRIC_RECORDED,
          version: '1.1.0', // Latest version in the implementation
          data: { value: 120 }
        });

        // Restore original implementation
        PayloadTransformer.transform = originalTransform;
      });

      it('should throw an error if payload has no type', () => {
        const payload = {
          version: '1.0.0',
          data: { value: 120 }
        };

        expect(() => transformToLatest(payload)).toThrow('Event payload must have a type property');
      });
    });

    describe('transformToVersion', () => {
      it('should transform a payload to a specific version', () => {
        // Mock implementation for this test
        const originalTransform = PayloadTransformer.transform;
        PayloadTransformer.transform = jest.fn().mockImplementation((payload, targetVersion) => {
          return { ...payload, version: targetVersion };
        });

        const payload = {
          type: EventType.HEALTH_METRIC_RECORDED,
          version: '1.0.0',
          data: { value: 120 }
        };

        const transformed = transformToVersion(payload, '1.2.0');
        expect(transformed).toEqual({
          type: EventType.HEALTH_METRIC_RECORDED,
          version: '1.2.0',
          data: { value: 120 }
        });

        // Restore original implementation
        PayloadTransformer.transform = originalTransform;
      });
    });
  });

  describe('Database to Event Transformation', () => {
    it('should transform database records to event objects', () => {
      // Create a test transformer for this specific case
      class DbToEventTransformer extends BasePayloadTransformer {
        constructor() {
          super(EventType.HEALTH_METRIC_RECORDED, 'db', '1.0.0');
        }

        transform(dbRecord: any): any {
          return {
            type: EventType.HEALTH_METRIC_RECORDED,
            userId: dbRecord.userId,
            timestamp: dbRecord.createdAt,
            version: '1.0.0',
            data: {
              metricType: dbRecord.metricType,
              value: dbRecord.value,
              unit: dbRecord.unit
            }
          };
        }

        // Override to handle database records
        canTransform(payload: any): boolean {
          return payload.hasOwnProperty('userId') && 
                 payload.hasOwnProperty('metricType') &&
                 payload.hasOwnProperty('value');
        }
      }

      const transformer = new DbToEventTransformer();
      PayloadTransformerRegistry.register(transformer);

      const dbRecord = {
        id: 123,
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z'
      };

      // Use a custom options object to indicate this is a DB record
      const transformed = PayloadTransformer.transform(dbRecord, '1.0.0', {
        direction: TransformDirection.UPGRADE,
        sourceVersion: 'db'
      });

      expect(transformed).toEqual({
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm'
        }
      });
    });

    it('should transform event objects to database records', () => {
      // Create a test transformer for this specific case
      class EventToDbTransformer extends BasePayloadTransformer {
        constructor() {
          super(EventType.HEALTH_METRIC_RECORDED, '1.0.0', 'db');
        }

        transform(event: any): any {
          return {
            userId: event.userId,
            metricType: event.data.metricType,
            value: event.data.value,
            unit: event.data.unit,
            createdAt: event.timestamp,
            updatedAt: new Date().toISOString()
          };
        }
      }

      const transformer = new EventToDbTransformer();
      PayloadTransformerRegistry.register(transformer);

      const event = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm'
        }
      };

      // Mock the current date for consistent testing
      const mockDate = new Date('2023-01-01T12:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const transformed = PayloadTransformer.transform(event, 'db');

      expect(transformed).toEqual({
        userId: 'user123',
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:30:00Z'
      });

      // Restore Date
      jest.restoreAllMocks();
    });
  });

  describe('Event Enrichment with Metadata', () => {
    it('should enrich events with metadata like timestamps and correlation IDs', () => {
      class MetadataEnricherTransformer extends BasePayloadTransformer {
        constructor() {
          super(EventType.HEALTH_METRIC_RECORDED, 'raw', '1.0.0');
        }

        transform(payload: any): any {
          // Generate a correlation ID if not present
          const correlationId = payload.correlationId || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          // Create a timestamp if not present
          const timestamp = payload.timestamp || new Date().toISOString();
          
          return {
            type: EventType.HEALTH_METRIC_RECORDED,
            userId: payload.userId,
            timestamp,
            version: '1.0.0',
            data: payload.data,
            metadata: {
              correlationId,
              source: payload.source || 'manual',
              deviceInfo: payload.deviceInfo,
              ipAddress: payload.ipAddress,
              userAgent: payload.userAgent,
              processedAt: new Date().toISOString()
            }
          };
        }

        // Override to handle raw data
        canTransform(payload: any): boolean {
          return payload.hasOwnProperty('userId') && 
                 payload.hasOwnProperty('data');
        }
      }

      const transformer = new MetadataEnricherTransformer();
      PayloadTransformerRegistry.register(transformer);

      // Mock dates for consistent testing
      const mockDate = new Date('2023-01-01T12:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      // Mock Math.random for consistent correlation ID
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

      const rawData = {
        userId: 'user123',
        data: {
          metricType: 'HEART_RATE',
          value: 75
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const transformed = PayloadTransformer.transform(rawData, '1.0.0', {
        direction: TransformDirection.UPGRADE,
        sourceVersion: 'raw'
      });

      expect(transformed).toEqual({
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:30:00Z',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          value: 75
        },
        metadata: {
          correlationId: `corr-${mockDate.getTime()}-4fzx4s`,
          source: 'manual',
          deviceInfo: undefined,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          processedAt: '2023-01-01T12:30:00Z'
        }
      });

      // Restore mocks
      jest.restoreAllMocks();
    });
  });

  describe('Field Naming Convention Validation', () => {
    it('should validate consistent field naming and casing conventions', () => {
      // Create a validator transformer that checks field naming conventions
      class NamingConventionValidator extends BasePayloadTransformer {
        constructor() {
          super(EventType.HEALTH_METRIC_RECORDED, '1.0.0', '1.0.0');
        }

        transform(payload: any): any {
          // Validate field naming conventions
          this.validateFieldNaming(payload.data);
          return payload;
        }

        private validateFieldNaming(data: any): void {
          // Check for camelCase naming convention
          const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
          
          for (const key in data) {
            if (!camelCaseRegex.test(key)) {
              throw new Error(`Field name '${key}' does not follow camelCase convention`);
            }
            
            // Recursively check nested objects
            if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
              this.validateFieldNaming(data[key]);
            }
          }
        }
      }

      const validator = new NamingConventionValidator();
      PayloadTransformerRegistry.register(validator);

      // Valid payload with camelCase field names
      const validPayload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          userSettings: {
            preferredUnit: 'bpm'
          }
        }
      };

      // Should not throw an error
      expect(() => PayloadTransformer.transform(validPayload, '1.0.0')).not.toThrow();

      // Invalid payload with snake_case field name
      const invalidPayload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        version: '1.0.0',
        data: {
          metric_type: 'HEART_RATE', // snake_case instead of camelCase
          metricValue: 75
        }
      };

      // Should throw an error about naming convention
      expect(() => PayloadTransformer.transform(invalidPayload, '1.0.0')).toThrow(
        "Field name 'metric_type' does not follow camelCase convention"
      );

      // Invalid payload with nested field name violation
      const invalidNestedPayload = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        version: '1.0.0',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          userSettings: {
            Preferred_Unit: 'bpm' // PascalCase and snake_case mixed
          }
        }
      };

      // Should throw an error about naming convention in nested object
      expect(() => PayloadTransformer.transform(invalidNestedPayload, '1.0.0')).toThrow(
        "Field name 'Preferred_Unit' does not follow camelCase convention"
      );
    });
  });
});