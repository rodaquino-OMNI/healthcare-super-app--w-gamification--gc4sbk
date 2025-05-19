import {
  registerTransform,
  getTransform,
  transformPayload,
  mapFields,
  getValueByPath,
  setValueByPath,
  HealthTransformers,
  CareTransformers,
  PlanTransformers,
  autoTransformEvent,
  TransformOptions,
  TransformResult
} from '../../../src/utils/payload-transformer';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { TransformationError } from '../../../src/versioning/errors';
import { versionDetector } from '../../../src/versioning/version-detector';
import { compatibilityChecker } from '../../../src/versioning/compatibility-checker';

// Mock dependencies
jest.mock('../../../src/versioning/version-detector', () => ({
  versionDetector: {
    detectVersion: jest.fn((payload) => payload.version || '1.0.0')
  }
}));

jest.mock('../../../src/versioning/compatibility-checker', () => ({
  compatibilityChecker: {
    isNewer: jest.fn((version1, version2) => {
      const [major1, minor1] = version1.split('.').map(Number);
      const [major2, minor2] = version2.split('.').map(Number);
      
      if (major1 > major2) return true;
      if (major1 < major2) return false;
      return minor1 > minor2;
    })
  }
}));

describe('Payload Transformer', () => {
  // Clear transformation registry before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Re-register the built-in transformers
    // This is necessary because we're manipulating the registry in tests
    HealthTransformers.transformHealthMetricV1toV1_1;
    HealthTransformers.transformHealthGoalV1toV1_1;
    CareTransformers.transformAppointmentV1toV1_1;
    CareTransformers.transformMedicationV1toV1_1;
    PlanTransformers.transformClaimV1toV1_1;
    PlanTransformers.transformBenefitV1toV1_1;
  });
  
  describe('Transform Registration and Retrieval', () => {
    it('should register and retrieve a transformation function', () => {
      // Define a simple transform function
      const mockTransform = jest.fn((payload) => ({ ...payload, transformed: true }));
      
      // Register the transform
      registerTransform('TEST_EVENT', '1.0.0', '1.1.0', mockTransform);
      
      // Retrieve the transform
      const retrievedTransform = getTransform('TEST_EVENT', '1.0.0', '1.1.0');
      
      // Verify it's the same function
      expect(retrievedTransform).toBe(mockTransform);
    });
    
    it('should return undefined for non-existent transformations', () => {
      const transform = getTransform('UNKNOWN_EVENT', '1.0.0', '1.1.0');
      expect(transform).toBeUndefined();
    });
    
    it('should handle multiple transformations for the same event type', () => {
      const transform1 = jest.fn((payload) => ({ ...payload, version: '1.1.0' }));
      const transform2 = jest.fn((payload) => ({ ...payload, version: '1.2.0' }));
      
      registerTransform('MULTI_EVENT', '1.0.0', '1.1.0', transform1);
      registerTransform('MULTI_EVENT', '1.1.0', '1.2.0', transform2);
      
      const retrieved1 = getTransform('MULTI_EVENT', '1.0.0', '1.1.0');
      const retrieved2 = getTransform('MULTI_EVENT', '1.1.0', '1.2.0');
      
      expect(retrieved1).toBe(transform1);
      expect(retrieved2).toBe(transform2);
    });
  });
  
  describe('Basic Payload Transformation', () => {
    it('should transform a payload from one version to another', () => {
      // Define a simple transform function
      const mockTransform = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.1.0',
        data: { ...payload.data, newField: 'added' }
      }));
      
      // Register the transform
      registerTransform('BASIC_EVENT', '1.0.0', '1.1.0', mockTransform);
      
      // Create a test payload
      const payload = {
        version: '1.0.0',
        data: { field1: 'value1' }
      };
      
      // Transform the payload
      const result = transformPayload('BASIC_EVENT', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0'
      });
      
      // Verify the transformation
      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('1.0.0');
      expect(result.targetVersion).toBe('1.1.0');
      expect(result.payload).toEqual({
        version: '1.1.0',
        data: { field1: 'value1', newField: 'added' }
      });
      expect(mockTransform).toHaveBeenCalledWith(payload, expect.any(Object));
    });
    
    it('should return the original payload when source and target versions are the same', () => {
      const payload = { version: '1.0.0', data: { field: 'value' } };
      
      const result = transformPayload('SAME_VERSION_EVENT', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.0.0'
      });
      
      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('1.0.0');
      expect(result.targetVersion).toBe('1.0.0');
      expect(result.payload).toBe(payload); // Should be the same object
    });
    
    it('should detect source version if not provided', () => {
      const mockTransform = jest.fn((payload) => ({ ...payload, version: '1.1.0' }));
      registerTransform('AUTO_DETECT_EVENT', '1.0.0', '1.1.0', mockTransform);
      
      const payload = { version: '1.0.0', data: { field: 'value' } };
      
      const result = transformPayload('AUTO_DETECT_EVENT', payload, {
        targetVersion: '1.1.0'
      });
      
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(payload);
      expect(result.sourceVersion).toBe('1.0.0');
      expect(result.success).toBe(true);
    });
    
    it('should throw an error if source version cannot be detected', () => {
      // Mock version detector to return undefined
      (versionDetector.detectVersion as jest.Mock).mockReturnValueOnce(undefined);
      
      const payload = { data: { field: 'value' } }; // No version field
      
      expect(() => {
        transformPayload('NO_VERSION_EVENT', payload);
      }).toThrow(TransformationError);
    });
    
    it('should throw an error if no transformation exists and no path can be found', () => {
      const payload = { version: '1.0.0', data: { field: 'value' } };
      
      expect(() => {
        transformPayload('NO_TRANSFORM_EVENT', payload, {
          sourceVersion: '1.0.0',
          targetVersion: '2.0.0'
        });
      }).toThrow(TransformationError);
    });
  });
  
  describe('Complex Transformation Paths', () => {
    it('should find and execute a transformation path through intermediate versions', () => {
      // Define transform functions for a path: 1.0.0 -> 1.1.0 -> 1.2.0
      const transform1 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.1.0',
        data: { ...payload.data, field1_1: 'added' }
      }));
      
      const transform2 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.2.0',
        data: { ...payload.data, field1_2: 'added' }
      }));
      
      // Register the transforms
      registerTransform('PATH_EVENT', '1.0.0', '1.1.0', transform1);
      registerTransform('PATH_EVENT', '1.1.0', '1.2.0', transform2);
      
      // Create a test payload
      const payload = {
        version: '1.0.0',
        data: { original: 'value' }
      };
      
      // Transform from 1.0.0 to 1.2.0 (should use the path)
      const result = transformPayload('PATH_EVENT', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.2.0'
      });
      
      // Verify both transforms were called in sequence
      expect(transform1).toHaveBeenCalled();
      expect(transform2).toHaveBeenCalled();
      
      // Verify the final result
      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('1.0.0');
      expect(result.targetVersion).toBe('1.2.0');
      expect(result.payload).toEqual({
        version: '1.2.0',
        data: { 
          original: 'value',
          field1_1: 'added',
          field1_2: 'added'
        }
      });
    });
    
    it('should handle complex transformation paths with branches', () => {
      // Define a more complex transformation graph:
      // 1.0.0 -> 1.1.0 -> 1.3.0
      //      \-> 1.2.0 -/
      
      const transform1_0to1_1 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.1.0',
        data: { ...payload.data, path: 'A' }
      }));
      
      const transform1_0to1_2 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.2.0',
        data: { ...payload.data, path: 'B' }
      }));
      
      const transform1_1to1_3 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.3.0',
        data: { ...payload.data, pathEnd: 'A->C' }
      }));
      
      const transform1_2to1_3 = jest.fn((payload) => ({ 
        ...payload, 
        version: '1.3.0',
        data: { ...payload.data, pathEnd: 'B->C' }
      }));
      
      // Register the transforms
      registerTransform('COMPLEX_PATH', '1.0.0', '1.1.0', transform1_0to1_1);
      registerTransform('COMPLEX_PATH', '1.0.0', '1.2.0', transform1_0to1_2);
      registerTransform('COMPLEX_PATH', '1.1.0', '1.3.0', transform1_1to1_3);
      registerTransform('COMPLEX_PATH', '1.2.0', '1.3.0', transform1_2to1_3);
      
      // Create a test payload
      const payload = {
        version: '1.0.0',
        data: { original: 'value' }
      };
      
      // Transform from 1.0.0 to 1.3.0 (should find a path)
      const result = transformPayload('COMPLEX_PATH', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.3.0'
      });
      
      // Verify the transformation was successful
      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('1.0.0');
      expect(result.targetVersion).toBe('1.3.0');
      
      // It should have taken one of the paths (either A or B)
      // We can't guarantee which one due to the nature of BFS
      if (result.payload.data.path === 'A') {
        expect(result.payload.data.pathEnd).toBe('A->C');
        expect(transform1_0to1_1).toHaveBeenCalled();
        expect(transform1_1to1_3).toHaveBeenCalled();
      } else {
        expect(result.payload.data.path).toBe('B');
        expect(result.payload.data.pathEnd).toBe('B->C');
        expect(transform1_0to1_2).toHaveBeenCalled();
        expect(transform1_2to1_3).toHaveBeenCalled();
      }
    });
  });
  
  describe('Field Mapping Utilities', () => {
    describe('mapFields', () => {
      it('should map fields from source to target based on mapping definition', () => {
        const source = {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'Anytown'
          }
        };
        
        const fieldMap = {
          first: 'firstName',
          last: 'lastName',
          fullName: (src: any) => `${src.firstName} ${src.lastName}`,
          location: 'address.city'
        };
        
        const result = mapFields(source, fieldMap);
        
        expect(result).toEqual({
          first: 'John',
          last: 'Doe',
          fullName: 'John Doe',
          location: 'Anytown'
        });
      });
      
      it('should handle missing fields gracefully', () => {
        const source = {
          firstName: 'John'
        };
        
        const fieldMap = {
          first: 'firstName',
          last: 'lastName', // Missing in source
          address: 'address.street' // Nested field missing
        };
        
        const result = mapFields(source, fieldMap);
        
        expect(result).toEqual({
          first: 'John'
          // last and address should not be in the result
        });
      });
    });
    
    describe('getValueByPath', () => {
      it('should get a value from an object using a path string', () => {
        const obj = {
          user: {
            profile: {
              name: 'John Doe',
              contact: {
                email: 'john@example.com'
              }
            }
          }
        };
        
        expect(getValueByPath(obj, 'user.profile.name')).toBe('John Doe');
        expect(getValueByPath(obj, 'user.profile.contact.email')).toBe('john@example.com');
      });
      
      it('should return the default value if path does not exist', () => {
        const obj = { user: { name: 'John' } };
        
        expect(getValueByPath(obj, 'user.age', 25)).toBe(25);
        expect(getValueByPath(obj, 'company.name', 'Unknown')).toBe('Unknown');
      });
      
      it('should return undefined if path does not exist and no default is provided', () => {
        const obj = { user: { name: 'John' } };
        
        expect(getValueByPath(obj, 'user.age')).toBeUndefined();
        expect(getValueByPath(obj, 'company.name')).toBeUndefined();
      });
    });
    
    describe('setValueByPath', () => {
      it('should set a value in an object using a path string', () => {
        const obj = {
          user: {
            profile: {
              name: 'John Doe'
            }
          }
        };
        
        setValueByPath(obj, 'user.profile.age', 30);
        expect(obj.user.profile.age).toBe(30);
        
        setValueByPath(obj, 'user.profile.contact.email', 'john@example.com');
        expect(obj.user.profile.contact.email).toBe('john@example.com');
      });
      
      it('should create intermediate objects if they do not exist', () => {
        const obj = { user: {} };
        
        setValueByPath(obj, 'user.profile.name', 'John Doe');
        
        expect(obj).toEqual({
          user: {
            profile: {
              name: 'John Doe'
            }
          }
        });
      });
      
      it('should overwrite existing values', () => {
        const obj = {
          user: {
            profile: {
              name: 'John Doe'
            }
          }
        };
        
        setValueByPath(obj, 'user.profile.name', 'Jane Doe');
        
        expect(obj.user.profile.name).toBe('Jane Doe');
      });
    });
  });
  
  describe('Journey-Specific Transformers', () => {
    describe('HealthTransformers', () => {
      it('should transform health metric events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            value: 120,
            unit: 'bpm',
            timestamp: '2023-01-01T12:00:00Z'
          }
        };
        
        const result = transformPayload(EventTypes.HEALTH_METRIC_RECORDED, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.source).toBe('manual'); // Added field
        expect(result.payload.data.values).toEqual([{
          value: 120,
          timestamp: '2023-01-01T12:00:00Z',
          unit: 'bpm'
        }]);
        expect(result.payload.metadata.deprecatedFields).toContain('data.value');
      });
      
      it('should transform health goal events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            type: 'steps',
            progress: 5000,
            updatedAt: '2023-01-01T12:00:00Z'
          }
        };
        
        const result = transformPayload(EventTypes.HEALTH_GOAL_PROGRESS, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.category).toBe('activity'); // Inferred category
        expect(result.payload.data.progressHistory).toEqual([{
          value: 5000,
          timestamp: '2023-01-01T12:00:00Z'
        }]);
      });
    });
    
    describe('CareTransformers', () => {
      it('should transform appointment events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            appointmentType: 'virtual',
            provider: {
              id: 'provider-123',
              name: 'Dr. Smith',
              address: '123 Medical Center'
            },
            specialtyRequired: 'Cardiology'
          }
        };
        
        const result = transformPayload(EventTypes.APPOINTMENT_BOOKED, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.location).toEqual({
          id: 'unknown',
          name: 'Unknown Location',
          address: '123 Medical Center',
          type: 'virtual'
        });
        expect(result.payload.data.provider.specialty).toBe('Cardiology');
        expect(result.payload.data.mode).toBe('telemedicine');
      });
      
      it('should transform medication events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            medicationId: 'med-123',
            medicationName: 'Aspirin',
            dosage: '100mg',
            status: 'taken',
            takenAt: '2023-01-01T12:00:00Z',
            scheduledAt: '2023-01-01T12:00:00Z'
          }
        };
        
        const result = transformPayload(EventTypes.MEDICATION_TAKEN, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.medication).toEqual({
          id: 'med-123',
          name: 'Aspirin',
          dosage: '100mg',
          frequency: undefined,
          instructions: undefined
        });
        expect(result.payload.data.adherence).toEqual({
          status: 'taken',
          timestamp: '2023-01-01T12:00:00Z',
          scheduled: '2023-01-01T12:00:00Z',
          delay: 0 // Same time, so no delay
        });
      });
    });
    
    describe('PlanTransformers', () => {
      it('should transform claim events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            type: 'medical',
            amount: 1000,
            coveredAmount: 800,
            currency: 'BRL',
            documentUrl: 'https://example.com/receipt.pdf',
            uploadedAt: '2023-01-01T10:00:00Z'
          }
        };
        
        const result = transformPayload(EventTypes.CLAIM_SUBMITTED, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.category).toBe('medical');
        expect(result.payload.data.financialDetails).toEqual({
          totalAmount: 1000,
          currency: 'BRL',
          coveredAmount: 800,
          patientResponsibility: 200 // Calculated
        });
        expect(result.payload.data.documents).toEqual([{
          type: 'receipt',
          url: 'https://example.com/receipt.pdf',
          uploadedAt: '2023-01-01T10:00:00Z'
        }]);
      });
      
      it('should transform benefit events from v1.0.0 to v1.1.0', () => {
        const payload = {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            type: 'wellness',
            used: 1,
            available: 5,
            total: 10
          }
        };
        
        const result = transformPayload(EventTypes.BENEFIT_USED, payload, {
          sourceVersion: '1.0.0',
          targetVersion: '1.1.0'
        });
        
        expect(result.success).toBe(true);
        expect(result.payload.version).toBe('1.1.0');
        expect(result.payload.data.category).toBe('wellness');
        expect(result.payload.data.usage).toEqual({
          used: 1,
          available: 5,
          total: 10,
          history: [{
            amount: 1,
            timestamp: '2023-01-01T12:00:00Z',
            description: 'Benefit used'
          }]
        });
      });
    });
  });
  
  describe('Auto Transform Event', () => {
    it('should automatically transform an event to the target version', () => {
      const event = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        payload: {
          version: '1.0.0',
          timestamp: '2023-01-01T12:00:00Z',
          data: {
            value: 120,
            unit: 'bpm'
          }
        }
      };
      
      const transformedEvent = autoTransformEvent(event, '1.1.0');
      
      expect(transformedEvent.type).toBe(EventTypes.HEALTH_METRIC_RECORDED);
      expect(transformedEvent.payload.version).toBe('1.1.0');
      expect(transformedEvent.payload.data.source).toBe('manual');
      expect(transformedEvent.payload.data.values).toBeDefined();
    });
    
    it('should return the original event if target version is not specified', () => {
      const event = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        payload: {
          version: '1.0.0',
          data: { value: 120 }
        }
      };
      
      const transformedEvent = autoTransformEvent(event);
      
      expect(transformedEvent).toBe(event); // Same object reference
    });
    
    it('should throw an error if event is invalid', () => {
      const invalidEvent = {
        // Missing type
        payload: { version: '1.0.0' }
      };
      
      expect(() => {
        autoTransformEvent(invalidEvent as any, '1.1.0');
      }).toThrow(TransformationError);
    });
    
    it('should throw an error if source version cannot be detected', () => {
      (versionDetector.detectVersion as jest.Mock).mockReturnValueOnce(undefined);
      
      const event = {
        type: EventTypes.HEALTH_METRIC_RECORDED,
        payload: { data: { value: 120 } } // No version
      };
      
      expect(() => {
        autoTransformEvent(event, '1.1.0');
      }).toThrow(TransformationError);
    });
  });
  
  describe('Normalization and Enrichment', () => {
    it('should normalize field names across different journey formats', () => {
      // Register a custom normalizer transform
      const normalizeFieldNames = jest.fn((payload) => {
        const normalized = { ...payload, version: '1.1.0' };
        
        // Convert camelCase to snake_case for consistency
        if (normalized.data) {
          const newData: Record<string, any> = {};
          
          Object.entries(normalized.data).forEach(([key, value]) => {
            // Convert camelCase to snake_case
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newData[snakeKey] = value;
          });
          
          normalized.data = newData;
        }
        
        return normalized;
      });
      
      registerTransform('NORMALIZE_EVENT', '1.0.0', '1.1.0', normalizeFieldNames);
      
      const payload = {
        version: '1.0.0',
        data: {
          userId: 123,
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com'
        }
      };
      
      const result = transformPayload('NORMALIZE_EVENT', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload.data).toEqual({
        user_id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com'
      });
    });
    
    it('should enrich events with metadata like timestamps and correlation IDs', () => {
      // Register a metadata enrichment transform
      const enrichWithMetadata = jest.fn((payload, options) => {
        const enriched = { ...payload, version: '1.1.0' };
        
        // Add metadata if not present
        if (!enriched.metadata) {
          enriched.metadata = {};
        }
        
        // Add correlation ID from options or generate a mock one
        enriched.metadata.correlationId = options?.context?.correlationId || 'mock-correlation-id';
        
        // Add timestamps if not present
        if (!enriched.metadata.timestamps) {
          enriched.metadata.timestamps = {
            created: new Date().toISOString(),
            processed: new Date().toISOString()
          };
        }
        
        // Add journey context
        enriched.metadata.journey = options?.journeyContext || 'unknown';
        
        return enriched;
      });
      
      registerTransform('ENRICH_EVENT', '1.0.0', '1.1.0', enrichWithMetadata);
      
      const payload = {
        version: '1.0.0',
        data: { value: 'test' }
      };
      
      const result = transformPayload('ENRICH_EVENT', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        context: { correlationId: 'test-correlation-id' },
        journeyContext: 'health'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload.metadata).toBeDefined();
      expect(result.payload.metadata.correlationId).toBe('test-correlation-id');
      expect(result.payload.metadata.timestamps).toBeDefined();
      expect(result.payload.metadata.timestamps.created).toBeDefined();
      expect(result.payload.metadata.timestamps.processed).toBeDefined();
      expect(result.payload.metadata.journey).toBe('health');
    });
  });
  
  describe('Database to Event Transformation', () => {
    it('should transform database records to event objects', () => {
      // Register a DB record to event transform
      const dbRecordToEvent = jest.fn((record) => {
        // Convert a database record to an event object
        return {
          version: '1.0.0',
          type: record.eventType,
          timestamp: record.createdAt,
          data: JSON.parse(record.payload),
          metadata: {
            id: record.id,
            userId: record.userId,
            source: 'database'
          }
        };
      });
      
      registerTransform('DB_TO_EVENT', 'db_record', '1.0.0', dbRecordToEvent);
      
      const dbRecord = {
        id: 'event-123',
        eventType: 'HEALTH_METRIC_RECORDED',
        userId: 'user-456',
        createdAt: '2023-01-01T12:00:00Z',
        payload: JSON.stringify({
          metricType: 'heart_rate',
          value: 75,
          unit: 'bpm'
        })
      };
      
      const result = transformPayload('DB_TO_EVENT', dbRecord, {
        sourceVersion: 'db_record',
        targetVersion: '1.0.0'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload).toEqual({
        version: '1.0.0',
        type: 'HEALTH_METRIC_RECORDED',
        timestamp: '2023-01-01T12:00:00Z',
        data: {
          metricType: 'heart_rate',
          value: 75,
          unit: 'bpm'
        },
        metadata: {
          id: 'event-123',
          userId: 'user-456',
          source: 'database'
        }
      });
    });
    
    it('should transform event objects to database records', () => {
      // Register an event to DB record transform
      const eventToDbRecord = jest.fn((event) => {
        // Convert an event object to a database record
        return {
          eventType: event.type,
          version: event.version,
          userId: event.metadata?.userId || 'anonymous',
          payload: JSON.stringify(event.data),
          createdAt: event.timestamp || new Date().toISOString(),
          processedAt: new Date().toISOString()
        };
      });
      
      registerTransform('EVENT_TO_DB', '1.0.0', 'db_record', eventToDbRecord);
      
      const event = {
        type: 'HEALTH_METRIC_RECORDED',
        version: '1.0.0',
        timestamp: '2023-01-01T12:00:00Z',
        data: {
          metricType: 'heart_rate',
          value: 75,
          unit: 'bpm'
        },
        metadata: {
          userId: 'user-456'
        }
      };
      
      const result = transformPayload('EVENT_TO_DB', event, {
        sourceVersion: '1.0.0',
        targetVersion: 'db_record'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload).toEqual({
        eventType: 'HEALTH_METRIC_RECORDED',
        version: '1.0.0',
        userId: 'user-456',
        payload: JSON.stringify({
          metricType: 'heart_rate',
          value: 75,
          unit: 'bpm'
        }),
        createdAt: '2023-01-01T12:00:00Z',
        processedAt: expect.any(String)
      });
    });
  });
  
  describe('Journey-Specific Payload Adaptations', () => {
    it('should adapt health journey payloads', () => {
      // Register a health-specific adapter
      const healthAdapter = jest.fn((payload, options) => {
        // Add health-specific fields and transformations
        const adapted = { ...payload, version: '1.1.0' };
        
        if (adapted.data) {
          // Add health profile context
          adapted.data.healthProfile = {
            userId: options?.context?.userId || 'unknown',
            deviceId: options?.context?.deviceId,
            metricType: adapted.data.metricType || 'unknown',
            recordingMethod: adapted.data.source || 'manual'
          };
          
          // Add reference ranges if available
          if (adapted.data.metricType === 'heart_rate') {
            adapted.data.referenceRanges = {
              normal: { min: 60, max: 100 },
              warning: { min: 40, max: 120 },
              critical: { min: 30, max: 150 }
            };
          }
        }
        
        return adapted;
      });
      
      registerTransform('HEALTH_ADAPTER', '1.0.0', '1.1.0', healthAdapter);
      
      const payload = {
        version: '1.0.0',
        data: {
          metricType: 'heart_rate',
          value: 110,
          unit: 'bpm',
          source: 'smartwatch'
        }
      };
      
      const result = transformPayload('HEALTH_ADAPTER', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        context: { userId: 'user-123', deviceId: 'device-456' },
        journeyContext: 'health'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload.data.healthProfile).toEqual({
        userId: 'user-123',
        deviceId: 'device-456',
        metricType: 'heart_rate',
        recordingMethod: 'smartwatch'
      });
      expect(result.payload.data.referenceRanges).toBeDefined();
      expect(result.payload.data.referenceRanges.normal).toEqual({ min: 60, max: 100 });
    });
    
    it('should adapt care journey payloads', () => {
      // Register a care-specific adapter
      const careAdapter = jest.fn((payload, options) => {
        // Add care-specific fields and transformations
        const adapted = { ...payload, version: '1.1.0' };
        
        if (adapted.data) {
          // Add care context
          adapted.data.careContext = {
            patientId: options?.context?.userId || 'unknown',
            providerId: adapted.data.providerId || options?.context?.providerId,
            facilityId: adapted.data.facilityId || options?.context?.facilityId,
            careType: adapted.data.appointmentType || 'consultation'
          };
          
          // Add telemedicine details if virtual
          if (adapted.data.appointmentType === 'virtual') {
            adapted.data.telemedicineDetails = {
              platform: 'austa-telemedicine',
              joinUrl: `https://telemedicine.austa.com.br/session/${adapted.data.id || 'unknown'}`,
              deviceRequirements: ['camera', 'microphone']
            };
          }
        }
        
        return adapted;
      });
      
      registerTransform('CARE_ADAPTER', '1.0.0', '1.1.0', careAdapter);
      
      const payload = {
        version: '1.0.0',
        data: {
          id: 'appt-123',
          appointmentType: 'virtual',
          providerId: 'provider-789',
          scheduledTime: '2023-01-15T14:30:00Z'
        }
      };
      
      const result = transformPayload('CARE_ADAPTER', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        context: { userId: 'user-123', facilityId: 'facility-456' },
        journeyContext: 'care'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload.data.careContext).toEqual({
        patientId: 'user-123',
        providerId: 'provider-789',
        facilityId: 'facility-456',
        careType: 'virtual'
      });
      expect(result.payload.data.telemedicineDetails).toBeDefined();
      expect(result.payload.data.telemedicineDetails.joinUrl).toBe('https://telemedicine.austa.com.br/session/appt-123');
    });
    
    it('should adapt plan journey payloads', () => {
      // Register a plan-specific adapter
      const planAdapter = jest.fn((payload, options) => {
        // Add plan-specific fields and transformations
        const adapted = { ...payload, version: '1.1.0' };
        
        if (adapted.data) {
          // Add insurance context
          adapted.data.insuranceContext = {
            memberId: options?.context?.userId || 'unknown',
            planId: options?.context?.planId || 'unknown',
            planType: options?.context?.planType || 'standard',
            coverageLevel: options?.context?.coverageLevel || 'basic'
          };
          
          // Add financial calculations for claims
          if (adapted.data.amount) {
            const amount = Number(adapted.data.amount);
            const coveragePercent = options?.context?.coveragePercent || 80;
            
            adapted.data.financialCalculations = {
              totalAmount: amount,
              coveragePercent: coveragePercent,
              coveredAmount: (amount * coveragePercent) / 100,
              memberResponsibility: amount - ((amount * coveragePercent) / 100),
              currency: adapted.data.currency || 'BRL'
            };
          }
        }
        
        return adapted;
      });
      
      registerTransform('PLAN_ADAPTER', '1.0.0', '1.1.0', planAdapter);
      
      const payload = {
        version: '1.0.0',
        data: {
          claimType: 'medical',
          serviceDate: '2023-01-10',
          amount: 1000,
          currency: 'BRL'
        }
      };
      
      const result = transformPayload('PLAN_ADAPTER', payload, {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        context: { 
          userId: 'user-123', 
          planId: 'plan-456', 
          planType: 'premium',
          coverageLevel: 'comprehensive',
          coveragePercent: 90
        },
        journeyContext: 'plan'
      });
      
      expect(result.success).toBe(true);
      expect(result.payload.data.insuranceContext).toEqual({
        memberId: 'user-123',
        planId: 'plan-456',
        planType: 'premium',
        coverageLevel: 'comprehensive'
      });
      expect(result.payload.data.financialCalculations).toBeDefined();
      expect(result.payload.data.financialCalculations.totalAmount).toBe(1000);
      expect(result.payload.data.financialCalculations.coveragePercent).toBe(90);
      expect(result.payload.data.financialCalculations.coveredAmount).toBe(900);
      expect(result.payload.data.financialCalculations.memberResponsibility).toBe(100);
    });
  });
});