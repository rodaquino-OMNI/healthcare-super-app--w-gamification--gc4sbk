import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { BaseEventDto } from '../../../src/dto/base-event.dto';

describe('BaseEventDto', () => {
  // Valid event data for testing
  const validEventData = {
    type: 'TEST_EVENT',
    userId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
    journey: 'health',
    timestamp: new Date().toISOString(),
    data: { testKey: 'testValue' }
  };

  describe('Field validation', () => {
    it('should validate a correctly formed event', async () => {
      // Arrange
      const eventDto = plainToClass(BaseEventDto, validEventData);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require type field', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, type: undefined };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate type is a string', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, type: 123 };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should require userId field', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, userId: undefined };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate userId is a valid UUID', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, userId: 'not-a-uuid' };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should require journey field', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, journey: undefined };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('journey');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate journey is a string', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, journey: 123 };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('journey');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate journey is one of the allowed values', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, journey: 'invalid-journey' };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('journey');
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    it('should require timestamp field', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, timestamp: undefined };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('timestamp');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate timestamp is a valid ISO string', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, timestamp: 'not-a-date' };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('timestamp');
      expect(errors[0].constraints).toHaveProperty('isIso8601');
    });

    it('should require data field', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, data: undefined };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate data is an object', async () => {
      // Arrange
      const invalidEvent = { ...validEventData, data: 'not-an-object' };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should validate all fields together and return multiple errors', async () => {
      // Arrange
      const invalidEvent = {
        type: 123,
        userId: 'not-a-uuid',
        journey: 'invalid-journey',
        timestamp: 'not-a-date',
        data: 'not-an-object'
      };
      const eventDto = plainToClass(BaseEventDto, invalidEvent);
      
      // Act
      const errors = await validate(eventDto);
      
      // Assert
      expect(errors.length).toBe(5); // One error for each field
      
      // Check that we have errors for all fields
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('type');
      expect(errorProperties).toContain('userId');
      expect(errorProperties).toContain('journey');
      expect(errorProperties).toContain('timestamp');
      expect(errorProperties).toContain('data');
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should properly deserialize a plain object to a BaseEventDto', () => {
      // Arrange & Act
      const eventDto = plainToClass(BaseEventDto, validEventData);
      
      // Assert
      expect(eventDto).toBeInstanceOf(BaseEventDto);
      expect(eventDto.type).toBe(validEventData.type);
      expect(eventDto.userId).toBe(validEventData.userId);
      expect(eventDto.journey).toBe(validEventData.journey);
      expect(eventDto.timestamp).toBe(validEventData.timestamp);
      expect(eventDto.data).toEqual(validEventData.data);
    });

    it('should maintain data integrity during serialization/deserialization', () => {
      // Arrange
      const eventDto = plainToClass(BaseEventDto, validEventData);
      
      // Act
      const serialized = JSON.stringify(eventDto);
      const deserialized = plainToClass(BaseEventDto, JSON.parse(serialized));
      
      // Assert
      expect(deserialized).toBeInstanceOf(BaseEventDto);
      expect(deserialized.type).toBe(validEventData.type);
      expect(deserialized.userId).toBe(validEventData.userId);
      expect(deserialized.journey).toBe(validEventData.journey);
      expect(deserialized.timestamp).toBe(validEventData.timestamp);
      expect(deserialized.data).toEqual(validEventData.data);
    });

    it('should handle complex nested data objects', () => {
      // Arrange
      const complexData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          device: {
            id: '987654',
            name: 'Smartwatch',
            manufacturer: 'HealthTech',
            lastSync: new Date().toISOString()
          },
          readings: [
            { time: '08:00', value: 72 },
            { time: '12:00', value: 78 },
            { time: '18:00', value: 75 }
          ]
        }
      };
      
      // Act
      const eventDto = plainToClass(BaseEventDto, complexData);
      const serialized = JSON.stringify(eventDto);
      const deserialized = plainToClass(BaseEventDto, JSON.parse(serialized));
      
      // Assert
      expect(deserialized.data).toEqual(complexData.data);
      expect(deserialized.data.metricType).toBe('HEART_RATE');
      expect(deserialized.data.device.manufacturer).toBe('HealthTech');
      expect(deserialized.data.readings.length).toBe(3);
      expect(deserialized.data.readings[1].value).toBe(78);
    });
  });

  describe('Type safety', () => {
    it('should enforce type safety for event properties', () => {
      // Arrange
      const eventDto = new BaseEventDto();
      
      // Act & Assert - TypeScript compilation would fail if types are incorrect
      eventDto.type = 'TEST_EVENT';
      eventDto.userId = '123e4567-e89b-12d3-a456-426614174000';
      eventDto.journey = 'health';
      eventDto.timestamp = new Date().toISOString();
      eventDto.data = { testKey: 'testValue' };
      
      // Additional assertions
      expect(typeof eventDto.type).toBe('string');
      expect(typeof eventDto.userId).toBe('string');
      expect(typeof eventDto.journey).toBe('string');
      expect(typeof eventDto.timestamp).toBe('string');
      expect(typeof eventDto.data).toBe('object');
    });
  });
});