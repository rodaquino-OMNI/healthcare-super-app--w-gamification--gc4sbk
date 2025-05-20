import { Test } from '@nestjs/testing';
import { EventTransformer } from '../../../src/versioning/transformer';
import { VersionDetector } from '../../../src/versioning/version-detector';
import { VersionCompatibilityChecker } from '../../../src/versioning/compatibility-checker';
import { TransformationError } from '../../../src/versioning/errors';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { EventTypes } from '../../../src/dto/event-types.enum';

describe('EventTransformer', () => {
  let transformer: EventTransformer;
  let versionDetector: VersionDetector;
  let compatibilityChecker: VersionCompatibilityChecker;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventTransformer,
        {
          provide: VersionDetector,
          useValue: {
            detectVersion: jest.fn(),
          },
        },
        {
          provide: VersionCompatibilityChecker,
          useValue: {
            isCompatible: jest.fn(),
            requiresTransformation: jest.fn(),
          },
        },
      ],
    }).compile();

    transformer = moduleRef.get<EventTransformer>(EventTransformer);
    versionDetector = moduleRef.get<VersionDetector>(VersionDetector);
    compatibilityChecker = moduleRef.get<VersionCompatibilityChecker>(VersionCompatibilityChecker);
  });

  describe('registerTransformation', () => {
    it('should register a transformation for a specific event type and version pair', () => {
      // Arrange
      const mockTransformFn = jest.fn();
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;

      // Act
      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: mockTransformFn,
      });

      // Assert
      expect(transformer['transformations']).toHaveProperty(eventType);
      expect(transformer['transformations'][eventType]).toHaveProperty(`${sourceVersion}->${targetVersion}`);
      expect(transformer['transformations'][eventType][`${sourceVersion}->${targetVersion}`]).toBe(mockTransformFn);
    });

    it('should throw an error when registering a duplicate transformation', () => {
      // Arrange
      const mockTransformFn = jest.fn();
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;

      // Act & Assert
      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: mockTransformFn,
      });

      expect(() => {
        transformer.registerTransformation({
          eventType,
          sourceVersion,
          targetVersion,
          transform: mockTransformFn,
        });
      }).toThrow(/Transformation already registered/);
    });
  });

  describe('transform', () => {
    it('should transform an event from source to target version', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };
      
      const expectedTransformedEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: expect.any(String) },
        metadata: { version: targetVersion } as EventMetadataDto,
      };

      const mockTransformFn = jest.fn().mockImplementation((event) => ({
        ...event,
        payload: { ...event.payload, timestamp: expect.any(String) },
        metadata: { ...event.metadata, version: targetVersion },
      }));

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: mockTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedTransformedEvent);
      expect(mockTransformFn).toHaveBeenCalledWith(sourceEvent);
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });

    it('should return the original event if no transformation is required', async () => {
      // Arrange
      const sourceVersion = '2.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(false);

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toBe(sourceEvent);
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });

    it('should throw an error when no transformation is registered for the version pair', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      // Act & Assert
      await expect(transformer.transform(sourceEvent, targetVersion)).rejects.toThrow(
        TransformationError
      );
      expect(versionDetector.detectVersion).toHaveBeenCalledWith(sourceEvent);
      expect(compatibilityChecker.requiresTransformation).toHaveBeenCalledWith(
        sourceVersion,
        targetVersion
      );
    });
  });

  describe('bidirectional transformations', () => {
    it('should upgrade an event from older to newer version', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };
      
      const expectedTransformedEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: expect.any(String) },
        metadata: { version: targetVersion } as EventMetadataDto,
      };

      const upgradeTransformFn = jest.fn().mockImplementation((event) => ({
        ...event,
        payload: { ...event.payload, timestamp: expect.any(String) },
        metadata: { ...event.metadata, version: targetVersion },
      }));

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: upgradeTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedTransformedEvent);
      expect(upgradeTransformFn).toHaveBeenCalledWith(sourceEvent);
    });

    it('should downgrade an event from newer to older version', async () => {
      // Arrange
      const sourceVersion = '2.0.0';
      const targetVersion = '1.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };
      
      const expectedTransformedEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: targetVersion } as EventMetadataDto,
      };

      const downgradeTransformFn = jest.fn().mockImplementation((event) => {
        const { timestamp, ...rest } = event.payload;
        return {
          ...event,
          payload: rest,
          metadata: { ...event.metadata, version: targetVersion },
        };
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: downgradeTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedTransformedEvent);
      expect(downgradeTransformFn).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('transformation pipeline', () => {
    it('should chain multiple transformations to reach the target version', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };
      
      const v2Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z' },
        metadata: { version: v2 } as EventMetadataDto,
      };
      
      const v3Event = {
        type: eventType,
        payload: { value: 120, unit: 'bpm', timestamp: '2023-01-01T12:00:00Z', deviceId: 'device-123' },
        metadata: { version: v3 } as EventMetadataDto,
      };

      const v1ToV2TransformFn = jest.fn().mockReturnValue(v2Event);
      const v2ToV3TransformFn = jest.fn().mockReturnValue(v3Event);

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(v1);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        transform: v1ToV2TransformFn,
      });

      transformer.registerTransformation({
        eventType,
        sourceVersion: v2,
        targetVersion: v3,
        transform: v2ToV3TransformFn,
      });

      // Act
      const result = await transformer.transformPipeline(sourceEvent, v3);

      // Assert
      expect(result).toEqual(v3Event);
      expect(v1ToV2TransformFn).toHaveBeenCalledWith(sourceEvent);
      expect(v2ToV3TransformFn).toHaveBeenCalledWith(v2Event);
    });

    it('should throw an error when a transformation in the pipeline is missing', async () => {
      // Arrange
      const v1 = '1.0.0';
      const v2 = '2.0.0';
      const v3 = '3.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { value: 120, unit: 'bpm' },
        metadata: { version: v1 } as EventMetadataDto,
      };

      const v1ToV2TransformFn = jest.fn().mockReturnValue({
        ...sourceEvent,
        payload: { ...sourceEvent.payload, timestamp: '2023-01-01T12:00:00Z' },
        metadata: { ...sourceEvent.metadata, version: v2 },
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(v1);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion: v1,
        targetVersion: v2,
        transform: v1ToV2TransformFn,
      });

      // Act & Assert
      await expect(transformer.transformPipeline(sourceEvent, v3)).rejects.toThrow(
        TransformationError
      );
      expect(v1ToV2TransformFn).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('field-level transformations', () => {
    it('should transform specific fields while preserving others', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          userId: '123',
          deviceInfo: {
            manufacturer: 'Acme',
            model: 'HR-100'
          }
        },
        metadata: { 
          version: sourceVersion,
          correlationId: 'corr-123',
          timestamp: '2023-01-01T12:00:00Z'
        } as EventMetadataDto,
      };
      
      const expectedTransformedEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          userId: '123',
          deviceInfo: {
            manufacturer: 'Acme',
            model: 'HR-100',
            firmwareVersion: 'unknown' // Added field
          },
          recordedAt: '2023-01-01T12:00:00Z' // Added field
        },
        metadata: { 
          version: targetVersion,
          correlationId: 'corr-123',
          timestamp: '2023-01-01T12:00:00Z'
        } as EventMetadataDto,
      };

      const fieldTransformFn = jest.fn().mockImplementation((event) => ({
        ...event,
        payload: { 
          ...event.payload, 
          deviceInfo: {
            ...event.payload.deviceInfo,
            firmwareVersion: 'unknown'
          },
          recordedAt: event.metadata.timestamp
        },
        metadata: { ...event.metadata, version: targetVersion },
      }));

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: fieldTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedTransformedEvent);
      expect(fieldTransformFn).toHaveBeenCalledWith(sourceEvent);
    });

    it('should validate transformed fields according to schema requirements', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm'
        },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      // Mock a transformation function that performs validation
      const validatingTransformFn = jest.fn().mockImplementation((event) => {
        const transformedEvent = {
          ...event,
          payload: { 
            ...event.payload,
            timestamp: new Date().toISOString()
          },
          metadata: { ...event.metadata, version: targetVersion },
        };
        
        // Validate the transformed event
        if (typeof transformedEvent.payload.value !== 'number') {
          throw new TransformationError(
            `Invalid value type: expected number, got ${typeof transformedEvent.payload.value}`,
            eventType,
            sourceVersion,
            targetVersion
          );
        }
        
        if (!transformedEvent.payload.timestamp) {
          throw new TransformationError(
            'Missing required field: timestamp',
            eventType,
            sourceVersion,
            targetVersion
          );
        }
        
        return transformedEvent;
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: validatingTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result.payload).toHaveProperty('timestamp');
      expect(validatingTransformFn).toHaveBeenCalledWith(sourceEvent);
    });

    it('should throw an error when transformed event fails validation', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: '120', // String instead of number - will fail validation
          unit: 'bpm'
        },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };

      // Mock a transformation function that performs validation
      const validatingTransformFn = jest.fn().mockImplementation((event) => {
        const transformedEvent = {
          ...event,
          payload: { 
            ...event.payload,
            timestamp: new Date().toISOString()
          },
          metadata: { ...event.metadata, version: targetVersion },
        };
        
        // Validate the transformed event
        if (typeof transformedEvent.payload.value !== 'number') {
          throw new TransformationError(
            `Invalid value type: expected number, got ${typeof transformedEvent.payload.value}`,
            eventType,
            sourceVersion,
            targetVersion
          );
        }
        
        return transformedEvent;
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: validatingTransformFn,
      });

      // Act & Assert
      await expect(transformer.transform(sourceEvent, targetVersion)).rejects.toThrow(
        TransformationError
      );
      expect(validatingTransformFn).toHaveBeenCalledWith(sourceEvent);
    });
  });

  describe('automated schema-based transformations', () => {
    it('should automatically transform events based on schema differences', async () => {
      // Arrange
      const sourceVersion = '1.0.0';
      const targetVersion = '2.0.0';
      const eventType = EventTypes.HEALTH_METRIC_RECORDED;
      
      const sourceEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          oldField: 'to-be-renamed'
        },
        metadata: { version: sourceVersion } as EventMetadataDto,
      };
      
      const expectedTransformedEvent = {
        type: eventType,
        payload: { 
          value: 120, 
          unit: 'bpm',
          newField: 'to-be-renamed', // Renamed from oldField
          addedField: 'default-value' // Added with default value
        },
        metadata: { version: targetVersion } as EventMetadataDto,
      };

      // Mock a schema-based transformation function
      const schemaTransformFn = jest.fn().mockImplementation((event) => {
        const { oldField, ...restPayload } = event.payload;
        return {
          ...event,
          payload: { 
            ...restPayload,
            newField: oldField, // Rename field
            addedField: 'default-value' // Add field with default value
          },
          metadata: { ...event.metadata, version: targetVersion },
        };
      });

      jest.spyOn(versionDetector, 'detectVersion').mockReturnValue(sourceVersion);
      jest.spyOn(compatibilityChecker, 'requiresTransformation').mockReturnValue(true);

      transformer.registerTransformation({
        eventType,
        sourceVersion,
        targetVersion,
        transform: schemaTransformFn,
      });

      // Act
      const result = await transformer.transform(sourceEvent, targetVersion);

      // Assert
      expect(result).toEqual(expectedTransformedEvent);
      expect(schemaTransformFn).toHaveBeenCalledWith(sourceEvent);
    });
  });
});