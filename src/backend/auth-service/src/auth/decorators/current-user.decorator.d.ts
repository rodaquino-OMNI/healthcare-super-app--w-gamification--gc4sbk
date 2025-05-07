import { PipeTransform, Type } from '@nestjs/common';
import { AuthenticatedUser } from '@austa/interfaces/auth';

/**
 * Parameter decorator that extracts the authenticated user from the request object.
 * Can optionally extract a specific property from the user object when provided with a property name.
 * 
 * @param dataOrPipes - Optional property name to extract from the user object or pipes to transform the result
 * @returns The authenticated user object or a specific property from it
 */
export declare const CurrentUser: {
  /**
   * Extract the authenticated user from the request
   */
  (): ParameterDecorator;
  
  /**
   * Extract a specific property from the authenticated user
   * @param property - The property name to extract from the user object
   */
  (property: keyof AuthenticatedUser): ParameterDecorator;
  
  /**
   * Extract the authenticated user and transform it with pipes
   * @param pipes - Transformation pipes to apply to the user object
   */
  (...pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
  
  /**
   * Extract a specific property from the authenticated user and transform it with pipes
   * @param property - The property name to extract from the user object
   * @param pipes - Transformation pipes to apply to the extracted property
   */
  (property: keyof AuthenticatedUser, ...pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
};