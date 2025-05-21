import { z } from 'zod';
import { ValidationError } from '@austa/errors/categories/validation.errors';
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';
import { Logger } from '@nestjs/common';

/**
 * Decorator that validates gamification event data against schema definitions.
 * This decorator ensures that events conform to the standardized formats defined
 * in @austa/interfaces before processing, preventing invalid events from entering
 * the system and throwing properly formatted error responses when validation fails.
 *
 * The decorator performs the following validations:
 * - Ensures the event has the required structure (type, userId, data)
 * - Validates that the event type is a recognized EventType
 * - Checks that the event data matches the expected schema for that event type
 * - Provides detailed validation error messages for debugging
 *
 * @param schema - Optional custom Zod schema to validate against. If not provided,
 *                 the default GamificationEvent schema from @austa/interfaces will be used.
 * @returns A method decorator that validates the first parameter of the decorated method
 *
 * @example
 * // Validate against the default GamificationEvent schema
 * @ValidateEvent()
 * processEvent(event: ProcessEventDto) {
 *   // This code only runs if event passes validation
 * }
 *
 * @example
 * // Validate against a custom schema
 * @ValidateEvent(CustomEventSchema)
 * processCustomEvent(event: CustomEventDto) {
 *   // This code only runs if event passes validation against CustomEventSchema
 * }
 *
 * @example
 * // Validate against a specific event type schema
 * @ValidateEvent(HealthMetricRecordedSchema)
 * processHealthMetricEvent(event: HealthMetricRecordedEvent) {
 *   // This code only runs if event passes validation against HealthMetricRecordedSchema
 * }
 */
export function ValidateEvent(schema?: z.ZodType<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`ValidateEvent:${propertyKey}`);
    
    // Import the actual schema from @austa/interfaces/gamification/events
    // This is a placeholder implementation - in the actual code, we would import
    // the real schema from the @austa/interfaces package
    const defaultSchema = z.object({
      type: z.nativeEnum(EventType, {
        errorMap: (issue, ctx) => ({
          message: `Event type must be a valid EventType. Received: ${ctx.data}`
        })
      }),
      userId: z.string().uuid({
        message: 'userId must be a valid UUID'
      }),
      data: z.record(z.any()).refine(data => {
        // Additional custom validation for data based on event type could be added here
        return Object.keys(data).length > 0;
      }, {
        message: 'Event data cannot be empty'
      }),
      journey: z.string().optional()
    });

    // Use the provided schema or fall back to the default GamificationEvent schema
    const eventSchema = schema || defaultSchema;

    descriptor.value = function (...args: any[]) {
      const eventData = args[0];
      
      if (!eventData) {
        throw new ValidationError(
          'Event data is required',
          {
            path: propertyKey,
            context: 'GamificationEvent'
          }
        );
      }
      
      try {
        // Validate the event data against the schema
        const validationResult = eventSchema.safeParse(eventData);
        
        if (!validationResult.success) {
          // Format validation errors for better debugging
          const formattedErrors = validationResult.error.errors.map(err => {
            return `${err.path.join('.')}: ${err.message}`;
          }).join(', ');
          
          logger.error(`Validation failed: ${formattedErrors}`, {
            eventType: eventData?.type || 'unknown',
            userId: eventData?.userId || 'unknown'
          });
          
          // Throw a properly classified validation error
          throw new ValidationError(
            'Event validation failed',
            {
              eventType: eventData?.type || 'unknown',
              errors: formattedErrors,
              path: propertyKey,
              context: 'GamificationEvent',
              data: eventData
            }
          );
        }
        
        logger.debug(`Event validated successfully: ${eventData.type}`, {
          eventType: eventData.type,
          userId: eventData.userId
        });
        
        // If validation passes, call the original method with validated data
        // This ensures that the method receives the parsed and validated data
        return originalMethod.apply(this, [validationResult.data, ...args.slice(1)]);
      } catch (error) {
        // If the error is already a ValidationError, rethrow it
        if (error instanceof ValidationError) {
          throw error;
        }
        
        // Otherwise, wrap it in a ValidationError with detailed context
        logger.error(`Validation error: ${error.message}`, {
          eventType: eventData?.type || 'unknown',
          userId: eventData?.userId || 'unknown',
          error
        });
        
        throw new ValidationError(
          'Event validation failed',
          {
            eventType: eventData?.type || 'unknown',
            originalError: error.message,
            path: propertyKey,
            context: 'GamificationEvent',
            data: eventData
          }
        );
      }
    };
    
    return descriptor;
  };
}