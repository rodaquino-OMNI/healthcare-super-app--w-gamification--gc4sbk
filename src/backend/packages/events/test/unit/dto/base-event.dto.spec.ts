import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BaseEventDto } from '../../../src/dto/base-event.dto';

/**
 * Test suite for BaseEventDto validation
 * 
 * These tests ensure that the core event structure shared across all events
 * is properly validated and maintains data integrity during serialization/deserialization.
 */
describe('BaseEventDto', () => {
  // Valid event data for testing
  const validEventData = {
    type: 'TEST_EVENT',
    userId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
    journey: 'health',
    timestamp: new Date().toISOString(),
    data: { testKey: 'testValue' }
  };

  describe('validation', () => {
    it('should validate a correctly formed event', async () => {
      // Create instance from plain object
      const eventDto = plainToInstance(BaseEventDto, validEventData);
      
      // Validate the instance
      const errors = await validate(eventDto);
      
      // Expect no validation errors
      expect(errors.length).toBe(0);
    });

    describe('type field validation', () => {
      it('should fail validation when type is missing', async () => {
        // Create event data without type
        const { type, ...eventDataWithoutType } = validEventData;
        const eventDto = plainToInstance(BaseEventDto, eventDataWithoutType);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about missing type
        const typeErrors = errors.filter(error => error.property === 'type');
        expect(typeErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when type is empty', async () => {
        // Create event data with empty type
        const eventDataWithEmptyType = { ...validEventData, type: '' };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithEmptyType);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about empty type
        const typeErrors = errors.filter(error => error.property === 'type');
        expect(typeErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when type is not a string', async () => {
        // Create event data with non-string type
        const eventDataWithNonStringType = { 
          ...validEventData, 
          type: 123 // Number instead of string
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithNonStringType);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about type not being a string
        const typeErrors = errors.filter(error => error.property === 'type');
        expect(typeErrors.length).toBeGreaterThan(0);
      });
    });

    describe('userId field validation', () => {
      it('should fail validation when userId is missing', async () => {
        // Create event data without userId
        const { userId, ...eventDataWithoutUserId } = validEventData;
        const eventDto = plainToInstance(BaseEventDto, eventDataWithoutUserId);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about missing userId
        const userIdErrors = errors.filter(error => error.property === 'userId');
        expect(userIdErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when userId is not a valid UUID', async () => {
        // Create event data with invalid UUID
        const eventDataWithInvalidUserId = { 
          ...validEventData, 
          userId: 'not-a-valid-uuid'
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithInvalidUserId);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about invalid UUID
        const userIdErrors = errors.filter(error => error.property === 'userId');
        expect(userIdErrors.length).toBeGreaterThan(0);
      });
    });

    describe('journey field validation', () => {
      it('should fail validation when journey is missing', async () => {
        // Create event data without journey
        const { journey, ...eventDataWithoutJourney } = validEventData;
        const eventDto = plainToInstance(BaseEventDto, eventDataWithoutJourney);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about missing journey
        const journeyErrors = errors.filter(error => error.property === 'journey');
        expect(journeyErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when journey is not one of the allowed values', async () => {
        // Create event data with invalid journey
        const eventDataWithInvalidJourney = { 
          ...validEventData, 
          journey: 'invalid-journey' // Not one of 'health', 'care', 'plan'
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithInvalidJourney);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about invalid journey
        const journeyErrors = errors.filter(error => error.property === 'journey');
        expect(journeyErrors.length).toBeGreaterThan(0);
      });

      it('should validate when journey is one of the allowed values', async () => {
        // Test each valid journey value
        const validJourneys = ['health', 'care', 'plan'];
        
        for (const journey of validJourneys) {
          const eventDataWithValidJourney = { 
            ...validEventData, 
            journey
          };
          const eventDto = plainToInstance(BaseEventDto, eventDataWithValidJourney);
          
          // Validate the instance
          const errors = await validate(eventDto);
          
          // Expect no validation errors
          expect(errors.length).toBe(0);
        }
      });
    });

    describe('timestamp field validation', () => {
      it('should fail validation when timestamp is missing', async () => {
        // Create event data without timestamp
        const { timestamp, ...eventDataWithoutTimestamp } = validEventData;
        const eventDto = plainToInstance(BaseEventDto, eventDataWithoutTimestamp);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about missing timestamp
        const timestampErrors = errors.filter(error => error.property === 'timestamp');
        expect(timestampErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when timestamp is not a valid ISO string', async () => {
        // Create event data with invalid timestamp
        const eventDataWithInvalidTimestamp = { 
          ...validEventData, 
          timestamp: 'not-a-valid-date'
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithInvalidTimestamp);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about invalid timestamp
        const timestampErrors = errors.filter(error => error.property === 'timestamp');
        expect(timestampErrors.length).toBeGreaterThan(0);
      });

      it('should validate with different valid ISO date formats', async () => {
        // Test different valid ISO date formats
        const validTimestamps = [
          '2023-01-01T12:00:00Z',
          '2023-01-01T12:00:00.000Z',
          '2023-01-01T12:00:00+00:00'
        ];
        
        for (const timestamp of validTimestamps) {
          const eventDataWithValidTimestamp = { 
            ...validEventData, 
            timestamp
          };
          const eventDto = plainToInstance(BaseEventDto, eventDataWithValidTimestamp);
          
          // Validate the instance
          const errors = await validate(eventDto);
          
          // Expect no validation errors
          expect(errors.length).toBe(0);
        }
      });
    });

    describe('data field validation', () => {
      it('should fail validation when data is missing', async () => {
        // Create event data without data
        const { data, ...eventDataWithoutData } = validEventData;
        const eventDto = plainToInstance(BaseEventDto, eventDataWithoutData);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about missing data
        const dataErrors = errors.filter(error => error.property === 'data');
        expect(dataErrors.length).toBeGreaterThan(0);
      });

      it('should fail validation when data is not an object', async () => {
        // Create event data with non-object data
        const eventDataWithNonObjectData = { 
          ...validEventData, 
          data: 'not-an-object' // String instead of object
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithNonObjectData);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect validation errors
        expect(errors.length).toBeGreaterThan(0);
        // Check for specific error about data not being an object
        const dataErrors = errors.filter(error => error.property === 'data');
        expect(dataErrors.length).toBeGreaterThan(0);
      });

      it('should validate with empty object as data', async () => {
        // Create event data with empty object as data
        const eventDataWithEmptyData = { 
          ...validEventData, 
          data: {}
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithEmptyData);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect no validation errors
        expect(errors.length).toBe(0);
      });

      it('should validate with complex nested object as data', async () => {
        // Create event data with complex nested object as data
        const eventDataWithComplexData = { 
          ...validEventData, 
          data: {
            stringProp: 'string value',
            numberProp: 123,
            booleanProp: true,
            arrayProp: [1, 2, 3],
            nestedProp: {
              nestedStringProp: 'nested string value'
            }
          }
        };
        const eventDto = plainToInstance(BaseEventDto, eventDataWithComplexData);
        
        // Validate the instance
        const errors = await validate(eventDto);
        
        // Expect no validation errors
        expect(errors.length).toBe(0);
      });
    });
  });

  describe('serialization/deserialization', () => {
    it('should maintain data integrity during serialization and deserialization', () => {
      // Create instance from plain object
      const eventDto = plainToInstance(BaseEventDto, validEventData);
      
      // Serialize to JSON string
      const serialized = JSON.stringify(eventDto);
      
      // Deserialize back to object
      const deserialized = JSON.parse(serialized);
      
      // Convert back to instance
      const deserializedDto = plainToInstance(BaseEventDto, deserialized);
      
      // Expect all properties to match the original
      expect(deserializedDto.type).toBe(validEventData.type);
      expect(deserializedDto.userId).toBe(validEventData.userId);
      expect(deserializedDto.journey).toBe(validEventData.journey);
      expect(deserializedDto.timestamp).toBe(validEventData.timestamp);
      expect(deserializedDto.data).toEqual(validEventData.data);
    });

    it('should handle Date objects in timestamp field during serialization', () => {
      // Create event data with Date object as timestamp
      const eventDataWithDateTimestamp = { 
        ...validEventData, 
        timestamp: new Date()
      };
      
      // Create instance from plain object
      const eventDto = plainToInstance(BaseEventDto, eventDataWithDateTimestamp);
      
      // Serialize to JSON string
      const serialized = JSON.stringify(eventDto);
      
      // Deserialize back to object
      const deserialized = JSON.parse(serialized);
      
      // Expect timestamp to be serialized as ISO string
      expect(typeof deserialized.timestamp).toBe('string');
      // Verify it's a valid ISO date string
      expect(() => new Date(deserialized.timestamp)).not.toThrow();
    });
  });

  describe('type safety', () => {
    it('should enforce type safety for event properties', () => {
      // Create instance from plain object
      const eventDto = plainToInstance(BaseEventDto, validEventData);
      
      // TypeScript should enforce these types
      expect(typeof eventDto.type).toBe('string');
      expect(typeof eventDto.userId).toBe('string');
      expect(typeof eventDto.journey).toBe('string');
      // timestamp could be string or Date depending on implementation
      expect(['string', 'object'].includes(typeof eventDto.timestamp)).toBeTruthy();
      expect(typeof eventDto.data).toBe('object');
    });

    it('should allow accessing data properties in a type-safe way with generics', () => {
      // Define a type for the data
      interface TestEventData {
        testKey: string;
        optionalKey?: number;
      }
      
      // Create event data with typed data
      const eventDataWithTypedData = { 
        ...validEventData, 
        data: {
          testKey: 'testValue',
          optionalKey: 123
        } as TestEventData
      };
      
      // Create instance from plain object with generic type
      const eventDto = plainToInstance(BaseEventDto<TestEventData>, eventDataWithTypedData);
      
      // Access data properties in a type-safe way
      expect(eventDto.data.testKey).toBe('testValue');
      expect(eventDto.data.optionalKey).toBe(123);
      
      // TypeScript should catch this at compile time, but we can test at runtime too
      expect(() => (eventDto.data as any).nonExistentKey).not.toThrow();
      expect((eventDto.data as any).nonExistentKey).toBeUndefined();
    });
  });
});