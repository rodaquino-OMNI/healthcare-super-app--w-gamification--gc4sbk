import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { BaseEventDto } from '../../../src/dto/base-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';
import {
  createBaseEventData,
  createBaseEventDto,
  createInvalidEvent,
  createEventWithInvalidValues,
  validateDto,
  extractErrorMessages,
  hasConstraintViolation
} from './test-utils';

describe('BaseEventDto', () => {
  describe('Validation', () => {
    it('should validate a valid event', async () => {
      // Arrange
      const validEvent = createBaseEventDto();

      // Act
      const validationResult = await validateDto(validEvent);

      // Assert
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should validate all required fields are present', async () => {
      // Arrange
      const validEventData = createBaseEventData();
      const requiredFields = ['type', 'userId', 'journey', 'timestamp', 'data'];

      // Test each required field
      for (const field of requiredFields) {
        // Act - Remove one required field at a time
        const invalidEventData = createInvalidEvent(validEventData, [field]);
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty(field)).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, field, 'isNotEmpty')).toBe(true);
      }
    });

    describe('Type field validation', () => {
      it('should validate that type is a string', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'type': 123 // Invalid: number instead of string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('type')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'type', 'isString')).toBe(true);
      });

      it('should validate that type is not empty', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'type': '' // Invalid: empty string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('type')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'type', 'isNotEmpty')).toBe(true);
      });

      it('should accept valid event types from the EventType enum', async () => {
        // Arrange
        const validEventTypes = [
          EventType.HEALTH_METRIC_RECORDED,
          EventType.CARE_APPOINTMENT_BOOKED,
          EventType.PLAN_CLAIM_SUBMITTED,
          EventType.ACHIEVEMENT_EARNED
        ];

        for (const type of validEventTypes) {
          const validEventData = createEventWithInvalidValues(createBaseEventData(), {
            'type': type
          });
          const validEvent = plainToInstance(BaseEventDto, validEventData);

          // Act
          const validationResult = await validateDto(validEvent);

          // Assert
          expect(validationResult.isValid).toBe(true);
        }
      });
    });

    describe('UserId field validation', () => {
      it('should validate that userId is a UUID v4', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'userId': 'not-a-uuid' // Invalid: not a UUID
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('userId')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'userId', 'isUuid')).toBe(true);
      });

      it('should validate that userId is not empty', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'userId': '' // Invalid: empty string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('userId')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'userId', 'isNotEmpty')).toBe(true);
      });

      it('should accept a valid UUID v4', async () => {
        // Arrange
        const validUuid = uuidv4();
        const validEventData = createEventWithInvalidValues(createBaseEventData(), {
          'userId': validUuid
        });
        const validEvent = plainToInstance(BaseEventDto, validEventData);

        // Act
        const validationResult = await validateDto(validEvent);

        // Assert
        expect(validationResult.isValid).toBe(true);
      });
    });

    describe('Journey field validation', () => {
      it('should validate that journey is a string', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'journey': 123 // Invalid: number instead of string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('journey')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'journey', 'isString')).toBe(true);
      });

      it('should validate that journey is not empty', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'journey': '' // Invalid: empty string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('journey')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'journey', 'isNotEmpty')).toBe(true);
      });

      it('should accept valid journey values', async () => {
        // Arrange
        const validJourneys = ['health', 'care', 'plan'];

        for (const journey of validJourneys) {
          const validEventData = createEventWithInvalidValues(createBaseEventData(), {
            'journey': journey
          });
          const validEvent = plainToInstance(BaseEventDto, validEventData);

          // Act
          const validationResult = await validateDto(validEvent);

          // Assert
          expect(validationResult.isValid).toBe(true);
        }
      });
    });

    describe('Timestamp field validation', () => {
      it('should validate that timestamp is an ISO-8601 date string', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'timestamp': 'not-a-date' // Invalid: not an ISO-8601 date
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('timestamp')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'timestamp', 'isIso8601')).toBe(true);
      });

      it('should validate that timestamp is not empty', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'timestamp': '' // Invalid: empty string
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('timestamp')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'timestamp', 'isNotEmpty')).toBe(true);
      });

      it('should accept valid ISO-8601 date strings', async () => {
        // Arrange
        const validDates = [
          new Date().toISOString(),
          '2023-04-15T14:32:17.123Z',
          '2023-04-15T14:32:17Z',
          '2023-04-15T14:32:17.123+02:00'
        ];

        for (const timestamp of validDates) {
          const validEventData = createEventWithInvalidValues(createBaseEventData(), {
            'timestamp': timestamp
          });
          const validEvent = plainToInstance(BaseEventDto, validEventData);

          // Act
          const validationResult = await validateDto(validEvent);

          // Assert
          expect(validationResult.isValid).toBe(true);
        }
      });
    });

    describe('Data field validation', () => {
      it('should validate that data is an object', async () => {
        // Arrange
        const invalidValues = [
          'string-value',
          123,
          true,
          null,
          undefined
        ];

        for (const invalidValue of invalidValues) {
          const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
            'data': invalidValue
          });
          const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

          // Act
          const validationResult = await validateDto(invalidEvent);

          // Assert
          expect(validationResult.isValid).toBe(false);
          expect(validationResult.hasErrorForProperty('data')).toBe(true);
          if (invalidValue !== undefined && invalidValue !== null) {
            expect(hasConstraintViolation(validationResult.errors, 'data', 'isObject')).toBe(true);
          } else {
            expect(hasConstraintViolation(validationResult.errors, 'data', 'isNotEmpty')).toBe(true);
          }
        }
      });

      it('should validate that data is not empty', async () => {
        // Arrange
        const invalidEventData = createEventWithInvalidValues(createBaseEventData(), {
          'data': {} // Invalid: empty object
        });
        const invalidEvent = plainToInstance(BaseEventDto, invalidEventData);

        // Act
        const validationResult = await validateDto(invalidEvent);

        // Assert
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.hasErrorForProperty('data')).toBe(true);
        expect(hasConstraintViolation(validationResult.errors, 'data', 'isNotEmpty')).toBe(true);
      });

      it('should accept valid data objects', async () => {
        // Arrange
        const validDataObjects = [
          { metricType: 'HEART_RATE', value: 75, unit: 'bpm' },
          { appointmentId: uuidv4(), providerId: uuidv4(), status: 'scheduled' },
          { claimId: uuidv4(), amount: 150.00, currency: 'BRL' }
        ];

        for (const data of validDataObjects) {
          const validEventData = createEventWithInvalidValues(createBaseEventData(), {
            'data': data
          });
          const validEvent = plainToInstance(BaseEventDto, validEventData);

          // Act
          const validationResult = await validateDto(validEvent);

          // Assert
          expect(validationResult.isValid).toBe(true);
        }
      });
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should correctly transform a plain object to a BaseEventDto instance', () => {
      // Arrange
      const plainObject = createBaseEventData();

      // Act
      const dtoInstance = plainToInstance(BaseEventDto, plainObject);

      // Assert
      expect(dtoInstance).toBeInstanceOf(BaseEventDto);
      expect(dtoInstance.type).toBe(plainObject.type);
      expect(dtoInstance.userId).toBe(plainObject.userId);
      expect(dtoInstance.journey).toBe(plainObject.journey);
      expect(dtoInstance.timestamp).toBe(plainObject.timestamp);
      expect(dtoInstance.data).toEqual(plainObject.data);
    });

    it('should maintain data integrity during transformation', () => {
      // Arrange
      const complexData = {
        nestedObject: {
          property1: 'value1',
          property2: 123,
          property3: true
        },
        arrayProperty: [1, 2, 3, 4, 5],
        dateProperty: new Date().toISOString()
      };

      const plainObject = createBaseEventData({
        data: complexData
      });

      // Act
      const dtoInstance = plainToInstance(BaseEventDto, plainObject);

      // Assert
      expect(dtoInstance.data).toEqual(complexData);
      expect(dtoInstance.data.nestedObject.property1).toBe('value1');
      expect(dtoInstance.data.nestedObject.property2).toBe(123);
      expect(dtoInstance.data.nestedObject.property3).toBe(true);
      expect(dtoInstance.data.arrayProperty).toEqual([1, 2, 3, 4, 5]);
      expect(dtoInstance.data.dateProperty).toBe(complexData.dateProperty);
    });
  });

  describe('Constructor', () => {
    it('should create an instance with default values when no parameters are provided', () => {
      // Act
      const instance = new BaseEventDto();

      // Assert
      expect(instance).toBeInstanceOf(BaseEventDto);
      expect(instance.timestamp).toBeDefined();
      // Verify the timestamp is a valid ISO-8601 date string
      expect(() => new Date(instance.timestamp)).not.toThrow();
    });

    it('should set properties from partial object when provided', () => {
      // Arrange
      const partial: Partial<BaseEventDto> = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: uuidv4(),
        journey: 'health',
        data: { metricType: 'HEART_RATE', value: 75, unit: 'bpm' }
      };

      // Act
      const instance = new BaseEventDto(partial);

      // Assert
      expect(instance.type).toBe(partial.type);
      expect(instance.userId).toBe(partial.userId);
      expect(instance.journey).toBe(partial.journey);
      expect(instance.data).toEqual(partial.data);
      expect(instance.timestamp).toBeDefined();
    });

    it('should use provided timestamp when available', () => {
      // Arrange
      const timestamp = '2023-04-15T14:32:17.123Z';
      const partial: Partial<BaseEventDto> = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: uuidv4(),
        journey: 'health',
        timestamp,
        data: { metricType: 'HEART_RATE', value: 75, unit: 'bpm' }
      };

      // Act
      const instance = new BaseEventDto(partial);

      // Assert
      expect(instance.timestamp).toBe(timestamp);
    });
  });

  describe('Type Safety', () => {
    it('should support generic type parameter for data property', () => {
      // Define a type for health metric data
      interface HealthMetricData {
        metricType: string;
        value: number;
        unit: string;
        recordedAt?: string;
        source?: string;
      }

      // Create an event with typed data
      const metricData: HealthMetricData = {
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        source: 'manual'
      };

      // Create the event with typed data
      const event = new BaseEventDto<HealthMetricData>({
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: uuidv4(),
        journey: 'health',
        data: metricData
      });

      // Assert type safety
      expect(event.data.metricType).toBe('HEART_RATE');
      expect(event.data.value).toBe(75);
      expect(event.data.unit).toBe('bpm');
      expect(event.data.recordedAt).toBeDefined();
      expect(event.data.source).toBe('manual');
    });

    it('should handle complex nested types', () => {
      // Define complex nested types
      interface Location {
        latitude: number;
        longitude: number;
        accuracy?: number;
      }

      interface DeviceInfo {
        id: string;
        name: string;
        type: string;
        location?: Location;
      }

      interface DeviceEventData {
        device: DeviceInfo;
        connectionTime: string;
        batteryLevel: number;
      }

      // Create data with complex nested structure
      const deviceData: DeviceEventData = {
        device: {
          id: uuidv4(),
          name: 'Smartwatch XYZ',
          type: 'wearable',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          }
        },
        connectionTime: new Date().toISOString(),
        batteryLevel: 85
      };

      // Create the event with complex typed data
      const event = new BaseEventDto<DeviceEventData>({
        type: EventType.HEALTH_DEVICE_CONNECTED,
        userId: uuidv4(),
        journey: 'health',
        data: deviceData
      });

      // Assert complex nested types
      expect(event.data.device.id).toBeDefined();
      expect(event.data.device.name).toBe('Smartwatch XYZ');
      expect(event.data.device.type).toBe('wearable');
      expect(event.data.device.location?.latitude).toBe(40.7128);
      expect(event.data.device.location?.longitude).toBe(-74.0060);
      expect(event.data.device.location?.accuracy).toBe(10);
      expect(event.data.connectionTime).toBeDefined();
      expect(event.data.batteryLevel).toBe(85);
    });
  });
});