import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { SchemaValidationError } from '@austa/errors/categories';
import { GamificationEvent, EventType, JourneyType } from '@austa/interfaces/gamification';
import { ZodSchema, z } from 'zod';

/**
 * Interface for validation options that can be passed to the ValidateEvent decorator
 */
export interface ValidateEventOptions {
  /**
   * The parameter index to validate (defaults to 0)
   */
  paramIndex?: number;
  
  /**
   * Whether to use Zod for validation instead of class-validator
   * If true, the schema parameter must be a Zod schema
   */
  useZod?: boolean;
  
  /**
   * Custom error message to use when validation fails
   */
  errorMessage?: string;
  
  /**
   * Whether to include the full validation errors in the error message
   */
  includeFullErrors?: boolean;
}

/**
 * Default validation options
 */
const defaultOptions: ValidateEventOptions = {
  paramIndex: 0,
  useZod: false,
  includeFullErrors: true,
};

/**
 * Formats validation errors from class-validator into a readable string
 */
function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map(error => {
      const constraints = error.constraints 
        ? Object.values(error.constraints).join(', ')
        : 'Invalid value';
      
      return `${error.property}: ${constraints}`;
    })
    .join('; ');
}

/**
 * Extracts journey information from the event for error context
 */
function getJourneyContext(event: GamificationEvent): Record<string, any> {
  return {
    eventType: event.type,
    journey: event.journey,
    version: event.version || 1,
  };
}

/**
 * Decorator that validates an event parameter against a schema before executing the method.
 * 
 * This decorator can use either class-validator (with class-transformer) or Zod for validation,
 * depending on the options provided. It throws a properly formatted SchemaValidationError
 * when validation fails, with detailed information about the validation failures.
 * 
 * @param schemaClass The class or Zod schema to validate against
 * @param options Validation options
 * 
 * @example
 * // Using class-validator with a DTO class
 * @ValidateEvent(ProcessEventDto)
 * async processEvent(event: ProcessEventDto) {
 *   // This will only execute if the event is valid
 *   // ...
 * }
 * 
 * @example
 * // Using Zod schema
 * @ValidateEvent(myZodSchema, { useZod: true })
 * async processEvent(event: any) {
 *   // This will only execute if the event is valid against the Zod schema
 *   // ...
 * }
 */
export function ValidateEvent(
  schemaClass: any | ZodSchema,
  options: ValidateEventOptions = {}
): MethodDecorator {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const paramIndex = mergedOptions.paramIndex!;
      const eventData = args[paramIndex];
      
      if (!eventData) {
        throw new SchemaValidationError(
          'Event data is missing',
          { methodName: propertyKey.toString() }
        );
      }
      
      let isValid = false;
      let validationErrors: string | ValidationError[] = '';
      
      try {
        if (mergedOptions.useZod) {
          // Zod validation
          const zodSchema = schemaClass as ZodSchema;
          const result = zodSchema.safeParse(eventData);
          
          if (!result.success) {
            isValid = false;
            validationErrors = result.error.format();
          } else {
            isValid = true;
            // Replace the argument with the parsed and validated data
            args[paramIndex] = result.data;
          }
        } else {
          // Class-validator validation
          const object = plainToInstance(schemaClass, eventData);
          const errors = await validate(object, { 
            whitelist: true, 
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
          });
          
          if (errors.length > 0) {
            isValid = false;
            validationErrors = errors;
          } else {
            isValid = true;
            // Replace the argument with the transformed and validated object
            args[paramIndex] = object;
          }
        }
      } catch (error) {
        throw new SchemaValidationError(
          `Error during event validation: ${error.message}`,
          { 
            methodName: propertyKey.toString(),
            error,
            ...getJourneyContext(eventData as GamificationEvent)
          }
        );
      }
      
      if (!isValid) {
        const errorMessage = mergedOptions.errorMessage || 'Event validation failed';
        let detailedMessage = errorMessage;
        
        if (mergedOptions.includeFullErrors) {
          if (Array.isArray(validationErrors)) {
            detailedMessage += `: ${formatValidationErrors(validationErrors)}`;
          } else {
            detailedMessage += `: ${JSON.stringify(validationErrors)}`;
          }
        }
        
        throw new SchemaValidationError(
          detailedMessage,
          { 
            methodName: propertyKey.toString(),
            validationErrors,
            ...getJourneyContext(eventData as GamificationEvent)
          }
        );
      }
      
      // If validation passes, proceed with the original method
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Creates a Zod schema for validating a specific event type
 * 
 * This is a helper function to create Zod schemas for use with the ValidateEvent decorator
 * when the useZod option is set to true.
 * 
 * @param eventType The type of event to validate
 * @param journeyType The journey the event belongs to
 * @param dataSchema The schema for the event data
 * @returns A Zod schema for validating the event
 * 
 * @example
 * const healthMetricSchema = createEventSchema(
 *   EventType.HEALTH_METRIC_RECORDED,
 *   JourneyType.HEALTH,
 *   z.object({
 *     metricType: z.string(),
 *     value: z.number(),
 *     unit: z.string()
 *   })
 * );
 * 
 * @ValidateEvent(healthMetricSchema, { useZod: true })
 * async processHealthMetric(event: any) {
 *   // This will only execute if the event matches the schema
 *   // ...
 * }
 */
export function createEventSchema(
  eventType: EventType,
  journeyType: JourneyType,
  dataSchema: ZodSchema
): ZodSchema {
  return z.object({
    type: z.literal(eventType),
    userId: z.string().uuid(),
    journey: z.literal(journeyType),
    data: dataSchema,
    version: z.number().int().min(1).max(2).optional().default(1),
  });
}