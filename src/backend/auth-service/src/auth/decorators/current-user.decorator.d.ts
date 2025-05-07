import { PipeTransform, Type } from '@nestjs/common';
import { IUser } from '@austa/interfaces/auth';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * 
 * @param dataOrPipes - Optional property key to extract from the user object or pipes to transform the user
 * @returns A parameter decorator that provides the authenticated user or a specific property
 * 
 * @example
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: IUser) {
 *   return user;
 * }
 *
 * @example
 * // Get a specific property from the user object
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 */
export declare const CurrentUser: {
  /**
   * Extract the entire user object from the request
   */
  (): ParameterDecorator;
  
  /**
   * Extract a specific property from the user object
   * @param property - The property key to extract from the user object
   */
  (property: string): ParameterDecorator;
  
  /**
   * Extract the user object and transform it using the provided pipes
   * @param pipes - Transformation pipes to apply to the user object
   */
  (...pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
  
  /**
   * Extract a specific property from the user object and transform it using the provided pipes
   * @param property - The property key to extract from the user object
   * @param pipes - Transformation pipes to apply to the extracted property
   */
  (property: string, ...pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
};